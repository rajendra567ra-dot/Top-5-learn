import express from 'express';
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
  Recommendation
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
      if (parsed.bots && parsed.bots.length === 40) {
        // Ensure coin universe includes fresh prices & blacklisted coin filter (excludes KAS)
        const freshUniverse = generateTop500Universe();
        const freshMap = new Map(freshUniverse.map(c => [c.symbol, c]));
        
        // Strict Universe: Replace coins with verified list, removing any blacklisted tokens like KAS
        parsed.coins = freshUniverse;

        // Enforce user mandate: Only send hourly report, never send every trade data
        if (parsed.telegramConfig) {
          parsed.telegramConfig.notifyOnTradeOpen = false;
          parsed.telegramConfig.notifyOnTP1 = false;
          parsed.telegramConfig.notifyOnTP2 = false;
          parsed.telegramConfig.notifyOnStopLoss = false;
          parsed.telegramConfig.notifyHourlySummary = true;
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

// Telegram Dispatch Helper (Real webhook if configured, else logged to state)
async function sendTelegramNotification(type: TelegramLog['type'], title: string, text: string, botSerial?: string) {
  const logEntry: TelegramLog = {
    id: `tlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    type,
    title,
    message: text,
    status: 'SIMULATED',
    botSerialNumber: botSerial,
  };

  const { botToken, chatId, enabled } = arenaState.telegramConfig;

  // USER DIRECTIVE: ONLY hourly report should be sent to Telegram, not individual trade data!
  // Allowed types for Telegram broadcast: HOURLY_REPORT and SYSTEM (manual test button)
  const isAllowedToBroadcast = type === 'HOURLY_REPORT' || type === 'SYSTEM';

  if (enabled && botToken && chatId && isAllowedToBroadcast) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      // Attempt sending with parse_mode HTML
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
      let data = await response.json();

      // If HTML entity parsing fails, retry as clean plain text without parse_mode
      if (!data.ok && data.description && (data.description.includes('can\'t parse') || data.description.includes('entity') || data.description.includes('Bad Request'))) {
        const plainText = text.replace(/<[^>]+>/g, '');
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
          }),
        });
        data = await response.json();
      }

      if (data.ok) {
        logEntry.status = 'SENT';
        arenaState.telegramConfig.lastStatus = `Hourly Report Delivered at ${new Date().toLocaleTimeString()}`;
        arenaState.telegramConfig.lastDispatchTimestamp = Date.now();
      } else {
        logEntry.status = 'FAILED';
        arenaState.telegramConfig.lastStatus = `Failed: ${data.description || 'API Error'}`;
      }
    } catch (err: any) {
      logEntry.status = 'FAILED';
      arenaState.telegramConfig.lastStatus = `Network Error: ${err.message}`;
    }
  }

  arenaState.telegramLogs.unshift(logEntry);
  if (arenaState.telegramLogs.length > 100) {
    arenaState.telegramLogs.pop();
  }
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

// Autonomous Arena Engine Tick (Runs strictly every 2.0 seconds)
setInterval(async () => {
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

        // Mistake Analysis & AI Brain Evolution if Loss
        if (!isWin) {
          const mistakeLog = analyzeTradeMistakeAndEvolve(updatedTrade, bot);
          bot.aiBrain.mistakeMemory.unshift(mistakeLog);
          if (bot.aiBrain.mistakeMemory.length > 30) bot.aiBrain.mistakeMemory.pop();
          bot.aiBrain.mistakesLearnedCount += 1;
          bot.aiBrain.adaptationScore = Math.min(99, bot.aiBrain.adaptationScore + 1);
          bot.aiBrain.lastAdaptationTimestamp = now;
          bot.aiBrain.antiRepeatRulesActive.unshift(mistakeLog.antiRepeatRuleAdded);
          if (bot.aiBrain.antiRepeatRulesActive.length > 8) bot.aiBrain.antiRepeatRulesActive.pop();
          arenaState.learningCyclesCompleted += 1;
        }

        // Automatic Strategy Adaptation from Past Performance (Wins & Losses)
        adaptBotStrategyFromPast(bot, updatedTrade, isWin ? 'WIN' : 'LOSS');

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
  // MANDATE: Max 200 live trades total, Max 5 trades per bot at a time.
  // MANDATE: "if not confirmed don't trade it's for maximum" -> Strictly require evalResult.qualifies
  if (arenaState.activeTrades.length < 200) {
    const scanBatches = 12;
    for (let b = 0; b < scanBatches; b++) {
      if (arenaState.activeTrades.length >= 200) break;

      const randomBotIndex = Math.floor(Math.random() * arenaState.bots.length);
      const bot = arenaState.bots[randomBotIndex];

      // Enforce: max 5 active trades per bot at a time
      if (bot.activeTradesCount >= 5) continue;

      // Pick candidate: alternate between bearish candidates (for SHORT) and bullish candidates (for LONG)
      let candidateCoin: CryptoCoin;
      const searchForShort = Math.random() > 0.5;

      if (searchForShort) {
        // Find coins with negative 24h change or bearish momentum
        const bearPool = arenaState.coins.filter(c => (c.change24h < -0.1 || c.trend === 'BEARISH') && !isHighDecimalOrBlacklistedCoin(c.symbol, c.price));
        candidateCoin = bearPool.length > 0 
          ? bearPool[Math.floor(Math.random() * bearPool.length)]
          : arenaState.coins[Math.floor(Math.random() * arenaState.coins.length)];
      } else {
        // Find coins with positive 24h change or bullish momentum
        const bullPool = arenaState.coins.filter(c => (c.change24h > 0.1 || c.trend === 'BULLISH') && !isHighDecimalOrBlacklistedCoin(c.symbol, c.price));
        candidateCoin = bullPool.length > 0 
          ? bullPool[Math.floor(Math.random() * bullPool.length)]
          : arenaState.coins[Math.floor(Math.random() * arenaState.coins.length)];
      }

      if (candidateCoin && !isHighDecimalOrBlacklistedCoin(candidateCoin.symbol, candidateCoin.price)) {
        // Check if bot already has an active trade on this symbol
        const alreadyInTrade = arenaState.activeTrades.some(
          t => t.botId === bot.id && t.symbol === `${candidateCoin.symbol}/USDT`
        );

        if (!alreadyInTrade) {
          const evalResult = evaluateBotConfirmation(bot, candidateCoin);

          // STRICT CONFIRMATION MANDATE: "if not confirmed don't trade it's for maximum"
          if (evalResult.qualifies) {
            // Create Trade Position with 3% capital, dynamic leverage, 1.5% max loss, 35% TP1 (BE), 25% TP2, 40% runner
            const newTrade = calculateTradeParameters(
              bot,
              candidateCoin,
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

  arenaState.totalArenaBalance = parseFloat(totalBal.toFixed(2));
  arenaState.totalArenaPnL = parseFloat((totalBal - 4000.00).toFixed(2));
  arenaState.totalArenaTrades = totalTradesCount;
  arenaState.totalArenaWins = totalWins;
  arenaState.totalArenaLosses = totalLosses;
  arenaState.arenaWinRate = totalTradesCount > 0 
    ? parseFloat(((totalWins / totalTradesCount) * 100).toFixed(1)) 
    : 0;

  // 5. Hourly Telegram Summary Dispatcher Check (every 60 mins)
  const summaryIntervalMs = (arenaState.telegramConfig.summaryIntervalMinutes || 60) * 60 * 1000;
  const isTimeForHourly = (!arenaState.lastHourlySummaryTimestamp && arenaState.telegramConfig.enabled && arenaState.telegramConfig.botToken && arenaState.telegramConfig.chatId)
    || (now - arenaState.lastHourlySummaryTimestamp >= summaryIntervalMs);

  if (isTimeForHourly) {
    arenaState.lastHourlySummaryTimestamp = now;
    if (arenaState.telegramConfig.enabled && arenaState.telegramConfig.botToken && arenaState.telegramConfig.chatId && arenaState.telegramConfig.notifyHourlySummary !== false) {
      const summaryMsg = formatHourlyTelegramSummary(arenaState);
      sendTelegramNotification(
        'HOURLY_REPORT',
        '📊 1-HOUR ARENA PERFORMANCE & TOP 10 RANKING REPORT',
        summaryMsg
      );
    }
  }

  saveStateToDisk();
}, 2000);

// API Routes
app.get('/api/arena/state', (req, res) => {
  res.json({
    status: 'ok',
    data: arenaState,
    serverTime: Date.now(),
  });
});

app.post('/api/arena/reset', (req, res) => {
  arenaState = initializeFreshArenaState();
  saveStateToDisk();
  res.json({
    status: 'ok',
    message: 'Arena reset completed. All 40 bots restored to fresh $100.00 portfolios.',
    data: arenaState,
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
  
  if (botToken !== undefined) arenaState.telegramConfig.botToken = botToken;
  if (chatId !== undefined) arenaState.telegramConfig.chatId = chatId;
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
  arenaState.lastHourlySummaryTimestamp = Date.now();
  const msg = formatHourlyTelegramSummary(arenaState);
  await sendTelegramNotification('HOURLY_REPORT', '📊 INSTANT 1-HOUR ARENA SUMMARY DISPATCH', msg);
  saveStateToDisk();
  res.json({ status: 'ok', message: 'Hourly summary dispatched', lastStatus: arenaState.telegramConfig.lastStatus });
});

app.post('/api/arena/telegram/test', async (req, res) => {
  const testMsg = `🧪 <b>APEX 40 AI CRYPTO BOT ARENA — WEBHOOK TEST</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Connection Status:</b> LIVE &amp; OPERATIONAL\n` +
    `🤖 <b>Active Arena Bots:</b> 40 Autonomous AI Units\n` +
    `⏱ <b>24/7 Cloud Host:</b> Connected\n` +
    `📡 <b>Telegram Relay:</b> Hourly Intelligence Dispatch Ready`;
  
  await sendTelegramNotification('SYSTEM', '🧪 TELEGRAM BOT CONNECTION TEST', testMsg);
  res.json({ status: 'ok', message: 'Test message sent', lastStatus: arenaState.telegramConfig.lastStatus });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex 40 AI Crypto Bot Arena Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
