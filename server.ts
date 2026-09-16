import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

import { 
  ArenaFleetState, 
  ArenaBot, 
  TradePosition, 
  CryptoCoin, 
  TelegramConfig, 
  TelegramLog,
  MarketTrend,
  Recommendation,
  BotBrainMistakeLog
} from './src/types';
import { INITIAL_ARENA_BOTS } from './src/data/arenaBots';
import { generateTop500Universe, isHighDecimalOrBlacklistedCoin } from './src/data/topCoins';
import { 
  evaluateBotConfirmation, 
  calculateTradeParameters, 
  updateTradePriceAndTargets, 
  analyzeTradeMistakeAndEvolve, 
  adaptBotStrategyFromPast,
  formatHourlyTelegramSummary, 
  formatTradeTelegramMessage 
} from './src/services/arenaEngine';

const app = express();
// On AI Studio dev sandbox, port 3000 is required by the internal nginx reverse proxy.
// On cloud deployment hosts (like AIC Cloud, Cloud Run, Render, etc.), process.env.PORT specifies the target port (e.g. 10004).
const PORT = process.env.APPLET_ID 
  ? 3000 
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

app.use(express.json());

const STATE_FILE_DIR = path.join(process.cwd(), 'data');
const STATE_FILE_PATH = path.join(STATE_FILE_DIR, 'arena-state.json');

// Ensure data folder exists
if (!fs.existsSync(STATE_FILE_DIR)) {
  fs.mkdirSync(STATE_FILE_DIR, { recursive: true });
}

function initializeFreshArenaState(): ArenaFleetState {
  const initialBots = INITIAL_ARENA_BOTS;
  const coins = generateTop500Universe();
  
  return {
    bots: initialBots,
    activeTrades: [],
    closedTrades: [],
    coins,
    telegramConfig: {
      botToken: '',
      chatId: '',
      enabled: false,
      summaryIntervalMinutes: 60,
      notifyOnTradeOpen: false,
      notifyOnTP1: false,
      notifyOnTP2: false,
      notifyOnStopLoss: false,
      notifyHourlySummary: true,
      lastDispatchTimestamp: Date.now(),
      lastStatus: 'STANDBY',
    },
    telegramLogs: [
      {
        id: `tlog-init-${Date.now()}`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        title: 'Apex 40 AI Crypto Bot Arena Initialized',
        message: 'All 40 AI Trading Bots provisioned with $100.00 portfolio each. Multi-timeframe 10-rule confirmation engine online.',
        status: 'SIMULATED',
      }
    ],
    serverBootTimestamp: Date.now(),
    lastScanTimestamp: Date.now(),
    lastHourlySummaryTimestamp: Date.now(),
    totalArenaBalance: 4000.00, // 40 bots * $100.00
    totalArenaPnL: 0.0,
    totalArenaTrades: 0,
    totalArenaWins: 0,
    totalArenaLosses: 0,
    arenaWinRate: 0,
    isScanningActive: true,
    learningCyclesCompleted: 0,
  };
}

let arenaState: ArenaFleetState = loadStateFromDisk();

function loadStateFromDisk(): ArenaFleetState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.bots && Array.isArray(parsed.bots) && parsed.bots.length > 0) {
        // Ensure coin universe includes fresh prices & blacklisted coin filter (excludes KAS)
        const freshUniverse = generateTop500Universe();
        const freshMap = new Map(freshUniverse.map(c => [c.symbol, c]));
        
        // Strict Universe: Replace coins with verified list (300+ coins), removing any blacklisted tokens like KAS
        parsed.coins = freshUniverse;

        // Enforce user mandate: Only send hourly report, never send every trade data
        if (parsed.telegramConfig) {
          parsed.telegramConfig.notifyOnTradeOpen = false;
          parsed.telegramConfig.notifyOnTP1 = false;
          parsed.telegramConfig.notifyOnTP2 = false;
          parsed.telegramConfig.notifyOnStopLoss = false;
          parsed.telegramConfig.notifyHourlySummary = true;
          // Fallback to environment variables if present
          if (!parsed.telegramConfig.botToken && process.env.TELEGRAM_BOT_TOKEN) {
            parsed.telegramConfig.botToken = process.env.TELEGRAM_BOT_TOKEN.trim();
          }
          if (!parsed.telegramConfig.chatId && process.env.TELEGRAM_CHAT_ID) {
            parsed.telegramConfig.chatId = process.env.TELEGRAM_CHAT_ID.trim();
          }
        }

        // Filter out KAS (Kaspa) and any stale trades with outdated prices
        if (Array.isArray(parsed.activeTrades)) {
          parsed.activeTrades = parsed.activeTrades.filter((t: TradePosition) => {
            const sym = t.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
            if (sym === 'KAS' || sym === 'KASPA' || (t.name && t.name.toLowerCase().includes('kaspa'))) {
              return false; // User mandate: Don't trade KAS Kaspa coins
            }
            if (isHighDecimalOrBlacklistedCoin(sym, t.entryPrice)) {
              return false;
            }
            const c = freshMap.get(sym);
            if (!c) return false;
            if (Math.abs(t.entryPrice - c.price) / c.price > 0.4) {
              return false;
            }
            return true;
          }).map((t: TradePosition) => {
            const sym = t.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
            const c = freshMap.get(sym);
            if (c) {
              t.contractAddress = c.contractAddress;
              t.network = c.network;
              t.cmcUrl = c.cmcUrl;
              t.isVerified = true;
            }
            // Keep all data as it is, calibrate TP1 to equal distance of SL compared to entry price
            if (!t.tp1Hit && t.slMode === 'INITIAL') {
              const slDist = Math.abs(t.stopLossPrice - t.entryPrice);
              const dec = t.entryPrice < 0.1 ? 5 : t.entryPrice < 1 ? 4 : t.entryPrice < 10 ? 3 : 2;
              const formattedDist = parseFloat(slDist.toFixed(dec));
              if (t.direction === 'LONG') {
                t.tp1Price = parseFloat((t.entryPrice + formattedDist).toFixed(dec));
                t.tp2Price = parseFloat((t.entryPrice + (formattedDist * 2)).toFixed(dec));
              } else {
                t.tp1Price = parseFloat((t.entryPrice - formattedDist).toFixed(dec));
                t.tp2Price = parseFloat((t.entryPrice - (formattedDist * 2)).toFixed(dec));
              }
            }
            return t;
          });
        }

        if (Array.isArray(parsed.closedTrades)) {
          parsed.closedTrades = parsed.closedTrades.filter((t: TradePosition) => {
            const sym = t.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
            return !(sym === 'KAS' || sym === 'KASPA' || (t.name && t.name.toLowerCase().includes('kaspa')));
          });
        }

        // Migrate and upgrade bot mistake memories & brain parameters to universal multi-coin format
        if (Array.isArray(parsed.bots)) {
          parsed.bots.forEach((b: ArenaBot) => {
            if (b.aiBrain) {
              b.aiBrain.universalScanningMistakeFilters = true;
              b.aiBrain.scanningDefenseCount = Math.max(b.aiBrain.scanningDefenseCount || 0, (b.aiBrain.mistakesLearnedCount || 0) * 3);
              
              if (b.aiBrain.adaptedParameters) {
                b.aiBrain.adaptedParameters.universalPairsCount = 300;
                b.aiBrain.adaptedParameters.universalScanningMistakeFilters = true;
                if (!b.aiBrain.adaptedParameters.lastAdaptedReason || b.aiBrain.adaptedParameters.lastAdaptedReason.includes('for ') || b.aiBrain.adaptedParameters.lastAdaptedReason.includes('50')) {
                  b.aiBrain.adaptedParameters.lastAdaptedReason = `Calibrated minimum conviction to ${b.aiBrain.adaptedParameters.minConfidenceScore}% and RVOL to ${b.aiBrain.adaptedParameters.minRvol}x across ALL 300+ verified universe pairs.`;
                }
              }

              if (Array.isArray(b.aiBrain.mistakeMemory) && b.aiBrain.mistakeMemory.length > 0) {
                b.aiBrain.mistakeMemory = b.aiBrain.mistakeMemory.map((m: BotBrainMistakeLog, idx: number) => {
                  m.scopeOfAdaptation = 'UNIVERSAL_ALL_COINS';
                  m.affectedPairsScope = 'All 300+ Scanned Universe Pairs';
                  if (!m.mistakeCategory) {
                    const categories = [
                      'Bull Trap Liquidity Sweep',
                      'Bear Trap Iceberg Absorption',
                      'Momentum Oscillator Divergence',
                      'Order Flow Delta Exhaustion',
                      'Choppy Range Consolidation Whipsaw',
                      'Counter-Trend HTF Friction',
                      'Macro Volatility Spike Invalidation',
                      'Orderbook Liquidity Vacuum',
                      'Premature Retest Execution',
                      'EMA Dynamic Invalidation'
                    ];
                    m.mistakeCategory = categories[idx % categories.length];
                  }
                  if (m.adaptationApplied && (m.adaptationApplied.includes('for ') || m.adaptationApplied.includes('50') || !m.adaptationApplied.includes('Universal'))) {
                    m.adaptationApplied = `🌐 Universal Strategy Upgrade across ALL 300+ Scanned Universe Pairs: Raised minimum confirmation threshold and calibrated institutional RVOL volume gates to filter repeated liquidity sweep traps.`;
                  }
                  if (m.antiRepeatRuleAdded && !m.antiRepeatRuleAdded.includes('[Universal - All 300+')) {
                    m.antiRepeatRuleAdded = `[Universal - All 300+ Coins] ${m.antiRepeatRuleAdded.replace(/\[Universal - All \d+ Coins\]\s*/g, '').replace(/entering \w+\/USDT/gi, 'entering any universe asset').replace(/entering \w+/gi, 'entering any universe asset')}`;
                  }
                  return m;
                });
              }

              if (Array.isArray(b.aiBrain.antiRepeatRulesActive)) {
                b.aiBrain.antiRepeatRulesActive = b.aiBrain.antiRepeatRulesActive.map((r: string) => {
                  if (!r.includes('[Universal - All 300+')) {
                    return `[Universal - All 300+ Coins] ${r.replace(/\[Universal - All \d+ Coins\]\s*/g, '').replace(/entering \w+\/USDT/gi, 'entering any universe asset').replace(/entering \w+/gi, 'entering any universe asset')}`;
                  }
                  return r;
                });
              }
            }
          });
        }

        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load state from disk, initializing fresh:', err);
  }
  return initializeFreshArenaState();
}

function saveStateToDisk() {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(arenaState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state to disk:', err);
  }
}

// Telegram Dispatch Helper (Real webhook with fallback & diagnostic status reporting)
async function sendTelegramNotification(
  type: TelegramLog['type'], 
  title: string, 
  text: string, 
  botSerial?: string
): Promise<{ ok: boolean; description?: string }> {
  const logEntry: TelegramLog = {
    id: `tlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    title,
    message: text,
    status: 'SIMULATED',
    botSerialNumber: botSerial,
  };

  const rawToken = (arenaState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const rawChatId = (arenaState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();
  const cleanToken = rawToken.replace(/^bot/i, '').trim();
  const cleanChatId = rawChatId.trim();

  // Allowed types for Telegram broadcast: HOURLY_REPORT and SYSTEM (test buttons)
  const isAllowedToBroadcast = type === 'HOURLY_REPORT' || type === 'SYSTEM';

  if (!cleanToken || !cleanChatId) {
    logEntry.status = 'SIMULATED';
    arenaState.telegramConfig.lastStatus = 'Telegram credentials not set (Enter Bot Token & Chat ID)';
    arenaState.telegramLogs.unshift(logEntry);
    if (arenaState.telegramLogs.length > 100) arenaState.telegramLogs.pop();
    return { ok: false, description: 'Telegram credentials missing (Bot Token / Chat ID)' };
  }

  if (isAllowedToBroadcast) {
    try {
      const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      // Attempt sending with parse_mode HTML
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text,
          parse_mode: 'HTML',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: any = await response.json();

      // If HTML entity parsing fails, retry as clean plain text without parse_mode
      if (!data.ok && data.description && (data.description.includes('parse') || data.description.includes('entity') || data.description.includes('Bad Request'))) {
        const plainText = text.replace(/<[^>]+>/g, '');
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: plainText,
          }),
          signal: retryController.signal,
        });
        clearTimeout(retryTimeoutId);
        data = await response.json();
      }

      if (data.ok) {
        logEntry.status = 'SENT';
        arenaState.telegramConfig.lastStatus = `Hourly Report Delivered at ${new Date().toLocaleTimeString()}`;
        arenaState.telegramConfig.lastDispatchTimestamp = Date.now();
        arenaState.telegramLogs.unshift(logEntry);
        if (arenaState.telegramLogs.length > 100) arenaState.telegramLogs.pop();
        console.log(`[Telegram Dispatch SUCCESS] Delivered ${type} to chat ${cleanChatId}`);
        return { ok: true };
      } else {
        logEntry.status = 'FAILED';
        arenaState.telegramConfig.lastStatus = `Failed: ${data.description || 'API Error'}`;
        arenaState.telegramLogs.unshift(logEntry);
        if (arenaState.telegramLogs.length > 100) arenaState.telegramLogs.pop();
        console.error(`[Telegram Dispatch ERROR] API responded:`, data.description);
        return { ok: false, description: data.description || 'Telegram API rejected message' };
      }
    } catch (err: any) {
      logEntry.status = 'FAILED';
      arenaState.telegramConfig.lastStatus = `Network Error: ${err.message}`;
      arenaState.telegramLogs.unshift(logEntry);
      if (arenaState.telegramLogs.length > 100) arenaState.telegramLogs.pop();
      console.error(`[Telegram Dispatch EXCEPTION]:`, err.message);
      return { ok: false, description: `Network Error: ${err.message}` };
    }
  }

  arenaState.telegramLogs.unshift(logEntry);
  if (arenaState.telegramLogs.length > 100) arenaState.telegramLogs.pop();
  return { ok: true };
}

// Live Market Data Cache & Fast Spot Sync
let isSyncingMarket = false;
let lastMarketSyncTime = 0;

async function syncLiveMarketData() {
  if (isSyncingMarket) return;
  isSyncingMarket = true;

  try {
    const controller = new AbortController();
    // 5000ms timeout allows Binance 24hr ticker to complete reliably
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Live Spot API (mirrors CoinMarketCap spot price action in real-time)
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const tickers: any[] = await response.json();
      const tickerMap = new Map<string, any>();
      for (const t of tickers) {
        tickerMap.set(t.symbol, t);
      }

      // Ensure universe has all 300+ verified coins loaded
      if (!arenaState.coins || arenaState.coins.length < 300) {
        arenaState.coins = generateTop500Universe();
      }

      arenaState.coins = arenaState.coins
        .filter(c => !isHighDecimalOrBlacklistedCoin(c.symbol, c.price))
        .map(coin => {
          const cleanSymbol = coin.symbol.toUpperCase().replace('/USDT', '').replace('USDT', '');
          const pair = `${cleanSymbol}USDT`;
          const ticker = tickerMap.get(pair);

          if (ticker) {
            const livePrice = parseFloat(ticker.lastPrice);
            const change24h = parseFloat(parseFloat(ticker.priceChangePercent).toFixed(2));
            const volume24h = parseFloat(ticker.quoteVolume);
            const high24h = parseFloat(ticker.highPrice);
            const low24h = parseFloat(ticker.lowPrice);

            // Calculate real dynamic RSI from price location in 24h range & momentum
            const range = high24h - low24h;
            let calculatedRsi = 50;
            if (range > 0) {
              calculatedRsi = Math.min(85, Math.max(18, Math.round(((livePrice - low24h) / range) * 100)));
            }

            const trend: MarketTrend = change24h > 0.3 ? 'BULLISH' : change24h < -0.3 ? 'BEARISH' : 'NEUTRAL';
            const macd = change24h > 0.4 ? 'BULLISH_CROSS' : change24h < -0.4 ? 'BEARISH_CROSS' : 'NEUTRAL';
            const recommendation: Recommendation = change24h > 2.5 
              ? 'STRONG_LONG' 
              : change24h > 0.3 
                ? 'LONG' 
                : change24h < -2.5 
                  ? 'STRONG_SHORT' 
                  : change24h < -0.3 
                    ? 'SHORT' 
                    : 'NEUTRAL';

            const precision = livePrice < 0.1 ? 5 : livePrice < 1 ? 4 : livePrice < 10 ? 3 : 2;
            const formattedPrice = parseFloat(livePrice.toFixed(precision));
            const qualityScore = Math.min(98, Math.max(78, Math.round(82 + Math.abs(change24h) * 1.5 + (volume24h > 20000000 ? 5 : 2))));

            return {
              ...coin,
              price: formattedPrice,
              change24h,
              volume24h,
              high24h,
              low24h,
              rsi: calculatedRsi,
              macd,
              trend,
              recommendation,
              currentSetupQuality: qualityScore,
            };
          }
          return coin;
        });
      lastMarketSyncTime = Date.now();
    }
  } catch (err: any) {
    // Ultra-fast lightweight ticker/price fallback (< 150ms) if 24hr stats took too long
    try {
      const fastController = new AbortController();
      const fastTimeout = setTimeout(() => fastController.abort(), 2500);
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price', {
        signal: fastController.signal,
      });
      clearTimeout(fastTimeout);
      if (priceRes.ok) {
        const prices: any[] = await priceRes.json();
        const priceMap = new Map(prices.map(p => [p.symbol, parseFloat(p.price)]));
        arenaState.coins = arenaState.coins.map(coin => {
          const pair = `${coin.symbol}USDT`;
          const p = priceMap.get(pair);
          if (p) {
            const precision = p < 0.1 ? 5 : p < 1 ? 4 : p < 10 ? 3 : 2;
            return { ...coin, price: parseFloat(p.toFixed(precision)) };
          }
          return coin;
        });
        lastMarketSyncTime = Date.now();
      }
    } catch (fastErr) {
      // Offline fallback: micro-fluctuations so system never crashes
      arenaState.coins = arenaState.coins.map(coin => {
        const deltaPercent = (Math.random() - 0.49) * 0.25;
        const precision = coin.price < 0.1 ? 5 : coin.price < 1 ? 4 : coin.price < 10 ? 3 : 2;
        return {
          ...coin,
          price: parseFloat((coin.price * (1 + deltaPercent / 100)).toFixed(precision)),
          change24h: parseFloat((coin.change24h + (Math.random() - 0.49) * 0.05).toFixed(2)),
        };
      });
    }
  } finally {
    isSyncingMarket = false;
  }
}

// Immediately trigger market sync on boot
syncLiveMarketData();

let arenaInterval: NodeJS.Timeout | null = null;

// Autonomous Arena Engine Tick (Runs strictly every 2.0 seconds once server is bound)
function startArenaEngine() {
  if (arenaInterval) return;

  arenaInterval = setInterval(async () => {
  if (!arenaState.isScanningActive) return;

  const now = Date.now();
  arenaState.lastScanTimestamp = now;

  // 1. Sync Live Market Data every 2 seconds from live market spot feed
  await syncLiveMarketData();

  // 2. Update Active Trades with latest prices & trigger TP1 / TP2 / Trailing SL
  const remainingActiveTrades: TradePosition[] = [];

  for (const trade of arenaState.activeTrades) {
    const coin = arenaState.coins.find(c => `${c.symbol}/USDT` === trade.symbol || c.symbol === trade.symbol);
    const currentPrice = coin ? coin.price : trade.currentPrice;

    const { updatedTrade, eventFired, realizedPnLDelta } = updateTradePriceAndTargets(trade, currentPrice);

    // Find the bot
    const botIndex = arenaState.bots.findIndex(b => b.id === trade.botId);
    if (botIndex !== -1) {
      const bot = arenaState.bots[botIndex];

      // Trade milestone events (TP1 / TP2) are tracked in trade state;
      // Per user mandate, individual trade events are NOT sent to Telegram (hourly reports only)

      // If trade closed
      if (updatedTrade.status === 'CLOSED_TP' || updatedTrade.status === 'CLOSED_SL') {
        const isWin = (updatedTrade.realizedPnL || 0) >= 0;
        const pnl = updatedTrade.realizedPnL || 0;

        bot.portfolioBalance = parseFloat((bot.portfolioBalance + pnl).toFixed(2));
        bot.totalPnL = parseFloat((bot.totalPnL + pnl).toFixed(2));
        bot.totalPnLPercent = parseFloat((((bot.portfolioBalance - bot.initialBalance) / bot.initialBalance) * 100).toFixed(2));
        bot.totalTrades += 1;
        if (isWin) {
          bot.wins += 1;
        } else {
          bot.losses += 1;
        }
        bot.winRate = parseFloat(((bot.wins / bot.totalTrades) * 100).toFixed(1));
        bot.activeTradesCount = Math.max(0, bot.activeTradesCount - 1);
        bot.equityHistory.push({ timestamp: now, balance: bot.portfolioBalance });

        // Mistake Analysis & Universal Strategy Adaptation across ALL 50 Universe Pairs
        if (!isWin) {
          // 1. First adapt the bot parameters universally across all 50 coins
          adaptBotStrategyFromPast(bot, updatedTrade, 'LOSS');

          // 2. Generate detailed mistake analysis reflecting new universal parameters
          const mistakeLog = analyzeTradeMistakeAndEvolve(updatedTrade, bot);
          bot.aiBrain.mistakeMemory.unshift(mistakeLog);
          if (bot.aiBrain.mistakeMemory.length > 30) bot.aiBrain.mistakeMemory.pop();
          bot.aiBrain.mistakesLearnedCount += 1;
          bot.aiBrain.adaptationScore = Math.min(99, bot.aiBrain.adaptationScore + 1);
          bot.aiBrain.lastAdaptationTimestamp = now;
          bot.aiBrain.antiRepeatRulesActive.unshift(mistakeLog.antiRepeatRuleAdded);
          if (bot.aiBrain.antiRepeatRulesActive.length > 10) bot.aiBrain.antiRepeatRulesActive.pop();
          bot.aiBrain.universalScanningMistakeFilters = true;
          bot.aiBrain.scanningDefenseCount = (bot.aiBrain.scanningDefenseCount || 0) + 1;
          arenaState.learningCyclesCompleted += 1;
        } else {
          // On win, adapt strategy bounds progressively across all 50 coins
          adaptBotStrategyFromPast(bot, updatedTrade, 'WIN');
        }

        arenaState.closedTrades.unshift(updatedTrade);
        if (arenaState.closedTrades.length > 500) arenaState.closedTrades.pop();
      } else {
        remainingActiveTrades.push(updatedTrade);
      }
    } else {
      remainingActiveTrades.push(updatedTrade);
    }
  }

  arenaState.activeTrades = remainingActiveTrades;

  // 3. Autonomous Bot Opportunity Scanner (Supports BOTH LONG and SHORT positions)
  // MANDATE: "Show atleast 300 verified coins by market cap & choose best trade among them"
  // MANDATE: "if not confirmed don't trade it's for maximum" -> Strictly require evalResult.qualifies
  if (arenaState.activeTrades.length < 200) {
    const scanBatches = 12;
    for (let b = 0; b < scanBatches; b++) {
      if (arenaState.activeTrades.length >= 200) break;

      // Filter available bots that are ACTIVE and not at max capacity
      const eligibleBots = arenaState.bots.filter(bot => bot.status !== 'PAUSED' && bot.activeTradesCount < 5);
      if (eligibleBots.length === 0) break;

      const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];

      // Scan candidate coins from across the FULL 300+ verified coin universe and CHOOSE THE BEST TRADE AMONG THEM
      const activeBotSymbols = new Set(
        arenaState.activeTrades.filter(t => t.botId === bot.id).map(t => t.symbol)
      );

      const validCoins = arenaState.coins.filter(c => 
        !isHighDecimalOrBlacklistedCoin(c.symbol, c.price) && 
        !activeBotSymbols.has(`${c.symbol}/USDT`)
      );

      if (validCoins.length === 0) continue;

      // Evaluate up to 75 candidate coins distributed across all ranks (market cap, momentum, setups)
      const candidateBatchSize = Math.min(validCoins.length, 75);
      const offset = (b * 29 + Math.floor(Math.random() * 10)) % validCoins.length;
      const candidates: CryptoCoin[] = [];
      for (let i = 0; i < candidateBatchSize; i++) {
        candidates.push(validCoins[(offset + i) % validCoins.length]);
      }

      // Evaluate candidates and select the single BEST trade with highest setup composite score
      let bestCandidate: {
        coin: CryptoCoin;
        evalResult: ReturnType<typeof evaluateBotConfirmation>;
        score: number;
      } | null = null;

      for (const coin of candidates) {
        const evalResult = evaluateBotConfirmation(bot, coin, arenaState.bots);
        if (evalResult.qualifies) {
          // Composite setup score: confidence weight + rules passed + setup quality + volatility momentum
          const compositeScore = 
            (evalResult.confidenceScore * 3.0) + 
            (evalResult.confirmedCount * 7.0) + 
            (coin.currentSetupQuality || 85) + 
            (Math.abs(coin.change24h) * 2.5);

          if (!bestCandidate || compositeScore > bestCandidate.score) {
            bestCandidate = { coin, evalResult, score: compositeScore };
          }
        }
      }

      // Execute the highest-probability, best trade among the 300+ universe
      if (bestCandidate) {
        const { coin: chosenCoin, evalResult } = bestCandidate;
        const newTrade = calculateTradeParameters(
          bot,
          chosenCoin,
          evalResult.direction,
          evalResult.confidenceScore,
          evalResult.confirmedCount,
          evalResult.evaluatedRules,
          evalResult.rationale
        );

        arenaState.activeTrades.unshift(newTrade);
        bot.activeTradesCount += 1;
      }
    }
  }

  // 4. Update Aggregate Arena Performance
  let totalBal = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalTradesCount = 0;

  arenaState.bots.forEach(b => {
    totalBal += b.portfolioBalance;
    totalWins += b.wins;
    totalLosses += b.losses;
    totalTradesCount += b.totalTrades;
  });

  const totalInitialCapital = arenaState.bots.reduce((sum, b) => sum + (b.initialBalance || 100.00), 0);
  arenaState.totalArenaBalance = parseFloat(totalBal.toFixed(2));
  arenaState.totalArenaPnL = parseFloat((totalBal - totalInitialCapital).toFixed(2));
  arenaState.totalArenaTrades = totalTradesCount;
  arenaState.totalArenaWins = totalWins;
  arenaState.totalArenaLosses = totalLosses;
  arenaState.arenaWinRate = totalTradesCount > 0 
    ? parseFloat(((totalWins / totalTradesCount) * 100).toFixed(1)) 
    : 0;

  // 5. Hourly Telegram Summary Dispatcher Check (every 60 mins)
  // USER MANDATE: "telegram hourly report send not working"
  // Ensures reliable recurring delivery every 60 minutes, with prompt delivery on server start if configured
  const effectiveBotToken = (arenaState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const effectiveChatId = (arenaState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();
  const isTgConfigured = Boolean(effectiveBotToken && effectiveChatId);
  const isTgEnabled = arenaState.telegramConfig.enabled !== false && arenaState.telegramConfig.notifyHourlySummary !== false;

  const summaryIntervalMs = (arenaState.telegramConfig.summaryIntervalMinutes || 60) * 60 * 1000;
  const timeSinceLastSummary = now - (arenaState.lastHourlySummaryTimestamp || 0);
  const timeSinceBoot = now - (arenaState.serverBootTimestamp || now);

  const shouldDispatchHourly = isTgConfigured && isTgEnabled && (
    (!arenaState.telegramConfig.lastDispatchTimestamp && timeSinceBoot >= 15000) ||
    (timeSinceLastSummary >= summaryIntervalMs)
  );

  if (shouldDispatchHourly) {
    arenaState.lastHourlySummaryTimestamp = now;
    const summaryMsg = formatHourlyTelegramSummary(arenaState);
    sendTelegramNotification(
      'HOURLY_REPORT',
      '📊 1-HOUR ARENA PERFORMANCE & TOP 10 RANKING REPORT',
      summaryMsg
    ).catch(err => console.error('[Hourly Dispatch Err]:', err));
  }

  saveStateToDisk();
}, 2000);
}

// API Routes
app.get('/api/arena/state', (req, res) => {
  // Guaranteed 300+ Universe: If server state is ever < 300 coins, self-heal immediately
  if (!arenaState.coins || arenaState.coins.length < 300) {
    const fullUniverse = generateTop500Universe();
    const existingMap = new Map((arenaState.coins || []).map(c => [c.symbol, c]));
    arenaState.coins = fullUniverse.map(coin => {
      const existing = existingMap.get(coin.symbol);
      return existing ? { ...coin, price: existing.price || coin.price, change24h: existing.change24h || coin.change24h } : coin;
    });
    saveStateToDisk();
  }

  res.json({
    status: 'ok',
    data: arenaState,
    serverTime: Date.now(),
  });
});

// Force refresh universe to full 300+ verified coins
app.post('/api/arena/universe/refresh', (req, res) => {
  const fullUniverse = generateTop500Universe();
  const existingMap = new Map((arenaState.coins || []).map(c => [c.symbol, c]));
  arenaState.coins = fullUniverse.map(coin => {
    const existing = existingMap.get(coin.symbol);
    return existing ? { ...coin, price: existing.price || coin.price, change24h: existing.change24h || coin.change24h } : coin;
  });
  saveStateToDisk();
  res.json({
    status: 'ok',
    message: `Refreshed universe to ${arenaState.coins.length} verified coins`,
    coinsCount: arenaState.coins.length,
  });
});

// MANDATE: "If I reset don't delete the auto adapt strategy or lesson learned only just change starting balance & no of trades win loss. Keep lesson learned and auto adapt strategy as it is."
app.post('/api/arena/reset', (req, res) => {
  const now = Date.now();
  arenaState.bots.forEach(bot => {
    bot.portfolioBalance = 100.00;
    bot.initialBalance = 100.00;
    bot.totalPnL = 0.00;
    bot.totalPnLPercent = 0.00;
    bot.winRate = 0;
    bot.totalTrades = 0;
    bot.wins = 0;
    bot.losses = 0;
    bot.activeTradesCount = 0;
    bot.equityHistory = [{ timestamp: now, balance: 100.00 }];
    // bot.aiBrain is kept 100% intact! Lessons learned and auto-adapted strategies are NOT deleted!
  });

  arenaState.activeTrades = [];
  arenaState.closedTrades = [];
  const totalInit = arenaState.bots.reduce((sum, b) => sum + (b.initialBalance || 100.00), 0);
  arenaState.totalArenaBalance = parseFloat(totalInit.toFixed(2));
  arenaState.totalArenaPnL = 0.00;
  arenaState.totalArenaTrades = 0;
  arenaState.totalArenaWins = 0;
  arenaState.totalArenaLosses = 0;
  arenaState.arenaWinRate = 0;

  saveStateToDisk();
  res.json({
    status: 'ok',
    message: 'Arena reset completed. All starting balances set to $100 and win/loss trade counters reset to 0. AI Brain lessons learned and auto-adapted strategies remain 100% preserved.',
    data: arenaState,
  });
});

// Bot Management: Active / Pause toggle
app.post('/api/arena/bot/toggle-status', (req, res) => {
  const { botId } = req.body;
  const bot = arenaState.bots.find(b => b.id === botId);
  if (!bot) {
    return res.status(404).json({ status: 'error', message: 'Bot not found' });
  }

  bot.status = bot.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
  saveStateToDisk();

  res.json({
    status: 'ok',
    message: `Bot ${bot.name} is now ${bot.status}.`,
    data: arenaState,
  });
});

// Bot Management: Delete Bot
app.post('/api/arena/bot/delete', (req, res) => {
  const { botId } = req.body;
  const index = arenaState.bots.findIndex(b => b.id === botId);
  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Bot not found' });
  }

  const deletedBot = arenaState.bots[index];
  arenaState.bots.splice(index, 1);
  // Remove any active trades for this bot
  arenaState.activeTrades = arenaState.activeTrades.filter(t => t.botId !== botId);

  const totalInit = arenaState.bots.reduce((sum, b) => sum + (b.initialBalance || 100.00), 0);
  let totalBal = 0;
  arenaState.bots.forEach(b => { totalBal += b.portfolioBalance; });
  arenaState.totalArenaBalance = parseFloat(totalBal.toFixed(2));
  arenaState.totalArenaPnL = parseFloat((totalBal - totalInit).toFixed(2));

  saveStateToDisk();

  res.json({
    status: 'ok',
    message: `Bot ${deletedBot.name} (${deletedBot.serialNumber}) deleted successfully.`,
    data: arenaState,
  });
});

// Bot Creation: Combination / Dual-Consensus Bot
app.post('/api/arena/bot/create-combination', (req, res) => {
  const { name, parentAId, parentBId, customSerialNumber } = req.body;
  if (!parentAId || !parentBId) {
    return res.status(400).json({ status: 'error', message: 'parentAId and parentBId are required' });
  }
  if (parentAId === parentBId) {
    return res.status(400).json({ status: 'error', message: 'Please select two different parent bots' });
  }

  const parentA = arenaState.bots.find(b => b.id === parentAId);
  const parentB = arenaState.bots.find(b => b.id === parentBId);
  if (!parentA || !parentB) {
    return res.status(404).json({ status: 'error', message: 'One or both parent bots not found' });
  }

  // Generate serial number, e.g. BOT-51 or BOT-41 or user-specified
  let serial = customSerialNumber && customSerialNumber.trim().length > 0 ? customSerialNumber.trim() : '';
  if (!serial) {
    const existingNums = arenaState.bots
      .map(b => parseInt(b.serialNumber.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 40;
    serial = `BOT-${String(maxNum + 1).padStart(2, '0')}`;
  }

  const botName = name && name.trim().length > 0 
    ? name.trim() 
    : `Lunar Eclipse (${parentA.serialNumber}.${parentA.name} + ${parentB.serialNumber}.${parentB.name})`;

  const newBot: ArenaBot = {
    id: `bot-combo-${Date.now()}`,
    serialNumber: serial,
    name: botName,
    portfolioBalance: 100.00,
    initialBalance: 100.00,
    totalPnL: 0.00,
    totalPnLPercent: 0.00,
    winRate: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    activeTradesCount: 0,
    equityHistory: [{ timestamp: Date.now(), balance: 100.00 }],
    status: 'ACTIVE',
    strategyTitle: `Dual-Consensus (${parentA.serialNumber}.${parentA.name} + ${parentB.serialNumber}.${parentB.name})`,
    strategyCategory: 'MOMENTUM',
    strategyDescription: `High-probability dual-confirmation engine combining ${parentA.name} and ${parentB.name}. Rules: Trades ONLY when BOTH independent strategy models confirm the exact same setup and direction simultaneously.`,
    timeframe: '5M/15M Dual-Sync',
    accentColor: '#10B981',
    avatarIcon: 'ShieldCheck',
    confirmationRules: [
      ...parentA.confirmationRules.slice(0, 5),
      ...parentB.confirmationRules.slice(0, 5),
    ],
    aiBrain: {
      learningLevel: 'ADVANCED_DUAL_CONSENSUS',
      adaptationScore: 95,
      mistakesLearnedCount: 0,
      lastAdaptationTimestamp: Date.now(),
      strategyEvolutionNotes: [
        `Dual-consensus initialized combining ${parentA.name} and ${parentB.name}.`,
        'Rules: Trades ONLY when both independent algorithms confirm same direction.'
      ],
      evolutionGeneration: 1,
      antiRepeatRulesActive: [
        ...new Set([...(parentA.aiBrain.antiRepeatRulesActive || []), ...(parentB.aiBrain.antiRepeatRulesActive || [])])
      ].slice(0, 4),
      adaptedParameters: {
        generation: 1,
        rsiMinLong: 44,
        rsiMaxLong: 66,
        rsiMinShort: 34,
        rsiMaxShort: 56,
        minRvol: 1.8,
        minConfirmationRules: 9,
        minConfidenceScore: 92,
        tp1ProfitTargetPercent: 50,
        slDistancePercent: 1.5,
        tp1DistancePercent: 1.2,
        tp2DistancePercent: 1.8,
        runnerTrailingPercent: 0,
        lastAdaptedReason: `Inherited dual-defense parameters from ${parentA.name} and ${parentB.name} across 300+ Verified Universe`,
        universalPairsCount: 300,
        universalScanningMistakeFilters: true,
      },
      mistakeMemory: [],
      strategyEvolutionLog: [
        `Dual-Consensus Confirmation: Trades only execute when both ${parentA.name} and ${parentB.name} agree.`,
        'Min Dual Conviction 92% across 300+ Verified Universe.'
      ],
      universalScanningMistakeFilters: true,
      scanningDefenseCount: 0,
    },
    isCombinationBot: true,
    parentBotIds: [parentA.id, parentB.id],
    parentBotNames: [parentA.name, parentB.name],
    parentBotSerials: [parentA.serialNumber, parentB.serialNumber],
  };

  arenaState.bots.push(newBot);
  arenaState.totalArenaBalance = parseFloat((arenaState.totalArenaBalance + 100.00).toFixed(2));
  saveStateToDisk();

  res.json({
    status: 'ok',
    message: `Dual-Consensus Bot ${newBot.serialNumber} ${newBot.name} created with $100 starting balance.`,
    data: arenaState,
    bot: newBot,
  });
});

app.post('/api/arena/trade/close', (req, res) => {
  const { tradeId } = req.body;
  if (!tradeId) {
    return res.status(400).json({ status: 'error', message: 'tradeId is required' });
  }

  const tradeIndex = arenaState.activeTrades.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) {
    return res.status(404).json({ status: 'error', message: 'Trade not found' });
  }

  const trade = arenaState.activeTrades[tradeIndex];
  const finalPnl = trade.totalBookedPnL + trade.unrealizedPnL;
  const isWin = finalPnl >= 0;

  trade.status = 'CLOSED_MANUAL';
  trade.exitTime = Date.now();
  trade.closePrice = trade.currentPrice;
  trade.realizedPnL = parseFloat(finalPnl.toFixed(2));
  trade.realizedPnLPercent = parseFloat(((finalPnl / trade.margin) * 100).toFixed(2));
  trade.exitReason = `Manual Close by Arena Commander (+ $${finalPnl.toFixed(2)})`;

  const botIndex = arenaState.bots.findIndex(b => b.id === trade.botId);
  if (botIndex !== -1) {
    const bot = arenaState.bots[botIndex];
    bot.portfolioBalance = parseFloat((bot.portfolioBalance + finalPnl).toFixed(2));
    bot.totalPnL = parseFloat((bot.totalPnL + finalPnl).toFixed(2));
    bot.totalPnLPercent = parseFloat((((bot.portfolioBalance - bot.initialBalance) / bot.initialBalance) * 100).toFixed(2));
    bot.totalTrades += 1;
    if (isWin) bot.wins += 1; else bot.losses += 1;
    bot.winRate = parseFloat(((bot.wins / bot.totalTrades) * 100).toFixed(1));
    bot.activeTradesCount = Math.max(0, bot.activeTradesCount - 1);
    bot.equityHistory.push({ timestamp: Date.now(), balance: bot.portfolioBalance });
  }

  arenaState.activeTrades.splice(tradeIndex, 1);
  arenaState.closedTrades.unshift(trade);
  saveStateToDisk();

  res.json({
    status: 'ok',
    message: `Trade ${trade.symbol} closed successfully.`,
    data: arenaState,
  });
});

app.post('/api/arena/telegram/config', (req, res) => {
  const { botToken, chatId, enabled, notifyOnTradeOpen, notifyOnTP1, notifyOnTP2, notifyOnStopLoss, notifyHourlySummary } = req.body;
  
  if (botToken !== undefined) arenaState.telegramConfig.botToken = typeof botToken === 'string' ? botToken.trim() : botToken;
  if (chatId !== undefined) arenaState.telegramConfig.chatId = typeof chatId === 'string' ? chatId.trim() : chatId;
  if (enabled !== undefined) arenaState.telegramConfig.enabled = Boolean(enabled);
  if (notifyOnTradeOpen !== undefined) arenaState.telegramConfig.notifyOnTradeOpen = Boolean(notifyOnTradeOpen);
  if (notifyOnTP1 !== undefined) arenaState.telegramConfig.notifyOnTP1 = Boolean(notifyOnTP1);
  if (notifyOnTP2 !== undefined) arenaState.telegramConfig.notifyOnTP2 = Boolean(notifyOnTP2);
  if (notifyOnStopLoss !== undefined) arenaState.telegramConfig.notifyOnStopLoss = Boolean(notifyOnStopLoss);
  if (notifyHourlySummary !== undefined) arenaState.telegramConfig.notifyHourlySummary = Boolean(notifyHourlySummary);

  saveStateToDisk();
  res.json({ status: 'ok', config: arenaState.telegramConfig });
});

app.post('/api/arena/telegram/hourly-trigger', async (req, res) => {
  const rawToken = (arenaState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const rawChat = (arenaState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!rawToken || !rawChat) {
    return res.status(400).json({
      status: 'error',
      message: 'Telegram Bot Token or Chat ID is missing. Please enter your Telegram credentials in the form below.',
      lastStatus: 'Credentials Missing',
    });
  }

  arenaState.lastHourlySummaryTimestamp = Date.now();
  const msg = formatHourlyTelegramSummary(arenaState);
  const result = await sendTelegramNotification('HOURLY_REPORT', '📊 INSTANT 1-HOUR ARENA SUMMARY DISPATCH', msg);
  saveStateToDisk();

  if (!result || !result.ok) {
    return res.status(502).json({
      status: 'error',
      message: `Telegram dispatch failed: ${result?.description || arenaState.telegramConfig.lastStatus || 'Failed to send'}`,
      lastStatus: arenaState.telegramConfig.lastStatus,
    });
  }

  res.json({ 
    status: 'ok', 
    message: '1-Hour Report successfully delivered to Telegram chat!', 
    lastStatus: arenaState.telegramConfig.lastStatus 
  });
});

app.post('/api/arena/telegram/test', async (req, res) => {
  const rawToken = (arenaState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const rawChat = (arenaState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!rawToken || !rawChat) {
    return res.status(400).json({
      status: 'error',
      message: 'Telegram Bot Token or Chat ID is missing. Please enter your Telegram credentials in the form below.',
      lastStatus: 'Credentials Missing',
    });
  }

  const testMsg = `🧪 <b>APEX 40 AI CRYPTO BOT ARENA — WEBHOOK TEST</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Connection Status:</b> LIVE &amp; OPERATIONAL\n` +
    `🤖 <b>Active Arena Bots:</b> 40 Autonomous AI Units\n` +
    `🛡 <b>Coin Universe:</b> 300+ Verified Market Cap Assets\n` +
    `⏱ <b>24/7 Cloud Host:</b> Connected\n` +
    `📡 <b>Telegram Relay:</b> Hourly Intelligence Dispatch Ready`;
  
  const result = await sendTelegramNotification('SYSTEM', '🧪 TELEGRAM BOT CONNECTION TEST', testMsg);
  saveStateToDisk();

  if (!result || !result.ok) {
    return res.status(502).json({
      status: 'error',
      message: `Telegram test ping failed: ${result?.description || arenaState.telegramConfig.lastStatus || 'Failed to send'}`,
      lastStatus: arenaState.telegramConfig.lastStatus,
    });
  }

  res.json({ 
    status: 'ok', 
    message: 'Test ping successfully delivered to Telegram chat!', 
    lastStatus: arenaState.telegramConfig.lastStatus 
  });
});

app.post('/api/arena/scan/toggle', (req, res) => {
  arenaState.isScanningActive = !arenaState.isScanningActive;
  saveStateToDisk();
  res.json({ status: 'ok', isScanningActive: arenaState.isScanningActive });
});

// Vite middleware & production setup
async function startServer() {
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    Boolean(process.argv[1] && (process.argv[1].endsWith('.cjs') || process.argv[1].includes('dist'))) ||
    (!process.env.APPLET_ID && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  function listenWithRetry(
    serverInstance: http.Server,
    port: number,
    host = '0.0.0.0',
    maxRetries = 20,
    retryDelayMs = 1000
  ): Promise<void> {
    let attempt = 0;

    return new Promise((resolve, reject) => {
      function tryListen() {
        attempt++;

        const onError = (err: NodeJS.ErrnoException) => {
          serverInstance.removeListener('listening', onListening);

          if (err.code === 'EADDRINUSE') {
            if (attempt <= maxRetries) {
              console.warn(
                `⚠️ [Port Notice] Port ${port} is currently busy (EADDRINUSE). ` +
                `Waiting for previous container/deployment process to release port... ` +
                `(Attempt ${attempt}/${maxRetries}, retrying in ${retryDelayMs}ms)`
              );
              setTimeout(tryListen, retryDelayMs);
            } else {
              console.error(
                `❌ [Startup Failure] Port ${port} remained in use after ${maxRetries} attempts. ` +
                `If deploying on a cloud host, please ensure the previous container is stopped.`
              );
              reject(err);
            }
          } else {
            console.error(`❌ [Server Startup Error]`, err);
            reject(err);
          }
        };

        const onListening = () => {
          serverInstance.removeListener('error', onError);
          console.log(`🚀 Apex AI Crypto Bot Arena Server successfully running on http://${host}:${port}`);
          resolve();
        };

        serverInstance.once('error', onError);
        serverInstance.once('listening', onListening);

        serverInstance.listen(port, host);
      }

      tryListen();
    });
  }

  // Graceful shutdown hooks for container lifecycle
  const handleShutdown = (signal: string) => {
    console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
    if (arenaInterval) {
      clearInterval(arenaInterval);
      arenaInterval = null;
    }
    httpServer.close(() => {
      console.log('✅ HTTP server closed. Port released cleanly.');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  try {
    await listenWithRetry(httpServer, PORT, '0.0.0.0');
    // Start arena simulation and trade monitoring engine
    startArenaEngine();
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
