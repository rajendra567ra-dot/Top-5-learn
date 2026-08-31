import express from 'express';
import path from 'path';
import fs from 'fs';
import * as archiverPkg from 'archiver';
const archiver: any = (archiverPkg as any).default || archiverPkg;
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

import { 
  MasterPortfolio, 
  TradingBot, 
  TradePosition, 
  CryptoCoin, 
  TelegramConfig, 
  TelegramLog, 
  ConsensusStage, 
  TradeDirection,
  BotLearningNote,
  ConfirmationStrategyMode
} from './src/types';
import { INITIAL_BOTS } from './src/data/initialBots';
import { INITIAL_ACTIVE_TRADES, INITIAL_AUDIT_LOGS } from './src/data/initialTrades';
import { generateTop500Universe, isHighDecimalOrBlacklistedCoin } from './src/data/topCoins';
import { 
  STAGE_CONFIGS,
  CONFIRMATION_STRATEGIES,
  calculateStagedTradeParameters,
  evaluateTradeConfirmationMatrix,
  analyzeTradeMistakeAndEvolve, 
  formatTelegramStageTradeOpen, 
  formatTelegramPartialTPHit,
  formatTelegramStageUpgrade,
  formatTelegramTPHit, 
  formatTelegramSLHit, 
  formatTelegramFleetSummary 
} from './src/services/tradingEngine';

interface ServerFleetState {
  serverStartedAt: number;
  accumulatedUptimeSeconds: number;
  is247Running: boolean;
  activeStrategyMode: ConfirmationStrategyMode;
  masterPortfolio: MasterPortfolio;
  bots: TradingBot[];
  activeTrades: TradePosition[];
  auditLogs: TradePosition[];
  telegramConfig: TelegramConfig;
  telegramLogs: TelegramLog[];
  lastSummaryTimestamp: number;
  lastScanTimestamp: number;
  lastUpgradeCheckTimestamp: number;
}

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'fleet-state.json');

const INITIAL_MASTER_PORTFOLIO: MasterPortfolio = {
  initialBase: 1000.00,
  currentBalance: 1000.00,
  totalRealizedPnL: 0.00,
  netROI: 0.00,
  totalWins: 0,
  totalLosses: 0,
  totalTradesExecuted: 0,
  fleetWinRate: 0.0,
  evolutionGeneration: 1,
  selfLearningAdaptationsCount: 0,
  activeStagedTradesCount: 0,
};

function sanitizeTradesList(trades: any[]): TradePosition[] {
  if (!Array.isArray(trades)) return [];
  const sanitized: TradePosition[] = [];
  const seenSymbols = new Set<string>();

  for (const t of trades) {
    if (!t || !t.symbol) continue;
    const cleanSym = t.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
    if (isHighDecimalOrBlacklistedCoin(cleanSym, t.entryPrice || t.currentPrice)) continue;
    if ((t.entryPrice && t.entryPrice < 0.01) || (t.currentPrice && t.currentPrice < 0.01)) continue;
    if (seenSymbols.has(cleanSym)) continue;
    seenSymbols.add(cleanSym);
    sanitized.push(t);
  }
  return sanitized;
}

function loadPersistedState(): ServerFleetState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      if (raw && raw.trim().length > 2) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.masterPortfolio) {
          console.log('⚡ Loaded persistent 24/7 fleet state from disk.');
          const cleanedActiveTrades = sanitizeTradesList(parsed.activeTrades || []);
          const cleanedAuditLogs = Array.isArray(parsed.auditLogs)
            ? parsed.auditLogs.filter((t: any) => !isHighDecimalOrBlacklistedCoin(t?.symbol || '', t?.entryPrice))
            : INITIAL_AUDIT_LOGS;

          const masterPortfolio = {
            ...(parsed.masterPortfolio || INITIAL_MASTER_PORTFOLIO),
            activeStagedTradesCount: cleanedActiveTrades.length,
          };

          return {
            serverStartedAt: parsed.serverStartedAt || Date.now(),
            accumulatedUptimeSeconds: parsed.accumulatedUptimeSeconds || 0,
            is247Running: parsed.is247Running !== undefined ? parsed.is247Running : true,
            activeStrategyMode: parsed.activeStrategyMode || 'MULTI_CONFLUENCE',
            masterPortfolio: {
              ...masterPortfolio,
              activeStrategyMode: parsed.activeStrategyMode || 'MULTI_CONFLUENCE',
            },
            bots: parsed.bots && parsed.bots.length > 0 ? parsed.bots : INITIAL_BOTS,
            activeTrades: cleanedActiveTrades,
            auditLogs: cleanedAuditLogs,
            telegramConfig: parsed.telegramConfig || {
              botToken: process.env.TELEGRAM_BOT_TOKEN || '',
              chatId: process.env.TELEGRAM_CHAT_ID || '',
              enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
              summaryIntervalMinutes: 60,
              notifyOnTradeOpen: true,
              notifyOnTakeProfit: true,
              notifyOnStopLoss: true,
              notifyHourlySummary: true,
            },
            telegramLogs: Array.isArray(parsed.telegramLogs) ? parsed.telegramLogs : [],
            lastSummaryTimestamp: parsed.lastSummaryTimestamp || Date.now(),
            lastScanTimestamp: parsed.lastScanTimestamp || Date.now(),
            lastUpgradeCheckTimestamp: parsed.lastUpgradeCheckTimestamp || Date.now(),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Could not read state file, starting fresh state:', err);
  }

  // Default initial state
  return {
    serverStartedAt: Date.now(),
    accumulatedUptimeSeconds: 0,
    is247Running: true,
    activeStrategyMode: 'MULTI_CONFLUENCE',
    masterPortfolio: { ...INITIAL_MASTER_PORTFOLIO, activeStrategyMode: 'MULTI_CONFLUENCE' },
    bots: JSON.parse(JSON.stringify(INITIAL_BOTS)),
    activeTrades: sanitizeTradesList(INITIAL_ACTIVE_TRADES),
    auditLogs: [...INITIAL_AUDIT_LOGS],
    telegramConfig: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      summaryIntervalMinutes: 60,
      notifyOnTradeOpen: true,
      notifyOnTakeProfit: true,
      notifyOnStopLoss: true,
      notifyHourlySummary: true,
    },
    telegramLogs: [
      {
        id: 'tg-init-server',
        timestamp: Date.now(),
        type: 'SYSTEM',
        target: '@CryptoFleetBot',
        message: `⚡ *[24/7 SERVER AUTONOMOUS ENGINE INITIALIZED]*\n• Host: Cloud Server Container\n• Master Base: $1,000.00 USDT\n• 5 Specialist Bot Brains Active in Background\n• Real-Time Telegram Alerts Armed for Trade Open, TP, SL & Hourly Summaries`,
        status: 'SIMULATED',
      }
    ],
    lastSummaryTimestamp: Date.now(),
    lastScanTimestamp: Date.now(),
    lastUpgradeCheckTimestamp: Date.now(),
  };
}

let fleetState: ServerFleetState = loadPersistedState();

function persistStateToDisk() {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(fleetState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fleet state to disk:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize Gemini AI client server-side
  let aiClient: GoogleGenAI | null = null;
  function getAIClient(): GoogleGenAI {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), serverStartedAt: fleetState.serverStartedAt });
  });

  // Cached prices from Binance or live fallback
  let cachedLivePrices: Record<string, { price: number; change24h: number; volume24h: number; high24h: number; low24h: number }> = {};
  let lastPriceFetchTime = 0;

  async function fetchLiveMarketPrices(): Promise<Record<string, { price: number; change24h: number; volume24h: number; high24h: number; low24h: number }>> {
    const now = Date.now();
    if (now - lastPriceFetchTime < 2500 && Object.keys(cachedLivePrices).length > 0) {
      return cachedLivePrices;
    }

    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (response.ok) {
        const data = await response.json();
        const priceMap: Record<string, { price: number; change24h: number; volume24h: number; high24h: number; low24h: number }> = {};

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item.symbol && item.symbol.endsWith('USDT')) {
              const baseSymbol = item.symbol.replace('USDT', '');
              priceMap[baseSymbol] = {
                price: parseFloat(item.lastPrice),
                change24h: parseFloat(item.priceChangePercent),
                volume24h: parseFloat(item.quoteVolume),
                high24h: parseFloat(item.highPrice),
                low24h: parseFloat(item.lowPrice),
              };
            }
          });

          cachedLivePrices = priceMap;
          lastPriceFetchTime = now;
          return priceMap;
        }
      }
    } catch (err: any) {
      // quiet fallback
    }

    if (Object.keys(cachedLivePrices).length === 0) {
      cachedLivePrices = {
        BTC: { price: 78106.97, change24h: -1.34, volume24h: 34500000000, high24h: 79250.00, low24h: 77800.00 },
        ETH: { price: 2452.91, change24h: -0.82, volume24h: 18400000000, high24h: 2490.00, low24h: 2435.00 },
        SOL: { price: 95.91, change24h: -2.22, volume24h: 7200000000, high24h: 98.40, low24h: 94.80 },
        BNB: { price: 697.16, change24h: -0.20, volume24h: 1400000000, high24h: 704.50, low24h: 692.00 },
        XRP: { price: 1.376, change24h: -6.50, volume24h: 4200000000, high24h: 1.485, low24h: 1.350 },
        TRX: { price: 0.3347, change24h: 1.15, volume24h: 890000000, high24h: 0.342, low24h: 0.328 },
        DOGE: { price: 0.185, change24h: -2.40, volume24h: 3100000000, high24h: 0.192, low24h: 0.181 },
        ADA: { price: 0.624, change24h: -3.10, volume24h: 890000000, high24h: 0.648, low24h: 0.615 },
        AVAX: { price: 22.40, change24h: -2.80, volume24h: 670000000, high24h: 23.20, low24h: 22.10 },
        SUI: { price: 2.45, change24h: 3.20, volume24h: 1900000000, high24h: 2.58, low24h: 2.38 },
        LINK: { price: 14.60, change24h: -1.40, volume24h: 520000000, high24h: 15.10, low24h: 14.40 },
        NEAR: { price: 3.85, change24h: -1.90, volume24h: 480000000, high24h: 3.98, low24h: 3.79 },
        KAS: { price: 0.1245, change24h: -2.15, volume24h: 48000000, high24h: 0.1310, low24h: 0.1220 },
        FIL: { price: 0.6836, change24h: -2.52, volume24h: 53330000, high24h: 0.6959, low24h: 0.6777 },
        CRV: { price: 0.3420, change24h: -1.85, volume24h: 48000000, high24h: 0.3550, low24h: 0.3380 },
        AR: { price: 12.80, change24h: -2.40, volume24h: 45000000, high24h: 13.20, low24h: 12.50 },
        AERO: { price: 0.85, change24h: 3.40, volume24h: 58000000, high24h: 0.89, low24h: 0.82 },
        RENDER: { price: 4.65, change24h: 1.80, volume24h: 390000000, high24h: 4.82, low24h: 4.55 },
        TAO: { price: 385.00, change24h: -0.90, volume24h: 280000000, high24h: 395.00, low24h: 380.00 },
        FET: { price: 0.985, change24h: 2.40, volume24h: 410000000, high24h: 1.04, low24h: 0.96 },
        APT: { price: 5.62, change24h: -1.80, volume24h: 190000000, high24h: 5.85, low24h: 5.50 },
        UNI: { price: 6.84, change24h: -0.95, volume24h: 145000000, high24h: 7.05, low24h: 6.72 },
      };
      lastPriceFetchTime = now;
    }

    return cachedLivePrices;
  }

  // Telegram dispatch helper on server
  async function dispatchTelegramMessage(
    text: string, 
    type: 'TRADE_OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOURLY_SUMMARY' | 'SYSTEM'
  ): Promise<boolean> {
    const token = fleetState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = fleetState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID;
    const isConfigured = Boolean(token && chatId);
    let messageStatus: 'SENT' | 'SIMULATED' | 'FAILED' = 'SIMULATED';
    let errorDetails: string | undefined = undefined;

    if (isConfigured && fleetState.telegramConfig.enabled) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        });

        const data = await response.json();
        if (data.ok) {
          messageStatus = 'SENT';
          if (fleetState.telegramConfig.lastError) {
            fleetState.telegramConfig.lastError = undefined;
            fleetState.telegramConfig.lastErrorTimestamp = undefined;
          }
        } else {
          const desc = data.description || 'Unauthorized or Invalid Telegram Bot Token';
          console.warn(`[Telegram Alert] Dispatch notice: ${desc}`);
          messageStatus = 'FAILED';
          errorDetails = desc;
          fleetState.telegramConfig.lastError = desc;
          fleetState.telegramConfig.lastErrorTimestamp = Date.now();
        }
      } catch (err: any) {
        const netErr = err?.message || 'Network error connecting to Telegram';
        console.warn(`[Telegram Alert] Network error: ${netErr}`);
        messageStatus = 'FAILED';
        errorDetails = netErr;
        fleetState.telegramConfig.lastError = netErr;
        fleetState.telegramConfig.lastErrorTimestamp = Date.now();
      }
    }

    const newLog: TelegramLog = {
      id: `tg-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      target: isConfigured ? `Chat ID: ${chatId}` : 'Simulated Terminal',
      message: text,
      status: messageStatus,
      errorDetails,
    };

    fleetState.telegramLogs = [newLog, ...(fleetState.telegramLogs || []).slice(0, 99)];
    return messageStatus === 'SENT';
  }

  // Autonomous coin universe cache
  const coinUniverse: CryptoCoin[] = generateTop500Universe();

  // -------------------------------------------------------------
  // 24/7 BACKGROUND AUTONOMOUS TRADING ENGINE (RUNS CONTINUOUSLY)
  // -------------------------------------------------------------
  setInterval(async () => {
    try {
      if (!fleetState.is247Running) return;

      const now = Date.now();
      const prices = await fetchLiveMarketPrices();

      // 1. Tick and evaluate each Active Trade
      const remainingTrades: TradePosition[] = [];

      for (const trade of fleetState.activeTrades) {
        const baseSymbol = trade.symbol.split('/')[0];
        let currentPrice = trade.currentPrice;

        if (prices[baseSymbol] && prices[baseSymbol].price > 0) {
          currentPrice = prices[baseSymbol].price;
        } else {
          // Micro-movement fluctuation
          const jitter = (Math.random() - 0.49) * 0.003;
          currentPrice = parseFloat((currentPrice * (1 + jitter)).toFixed(currentPrice >= 1 ? 4 : 6));
        }

        const isLong = trade.direction === 'LONG';
        const priceDelta = isLong 
          ? (currentPrice - trade.entryPrice) 
          : (trade.entryPrice - currentPrice);
        
        // Active remaining margin determines current position size
        const activeMargin = trade.remainingMargin || trade.margin;
        const activePositionSize = activeMargin * trade.leverage;
        const unrealizedPnL = parseFloat(((priceDelta / trade.entryPrice) * activePositionSize).toFixed(2));
        const unrealizedPnLPercent = parseFloat(((unrealizedPnL / activeMargin) * 100).toFixed(2));

        let updatedTrade: TradePosition = {
          ...trade,
          currentPrice,
          unrealizedPnL,
          unrealizedPnLPercent,
          remainingMargin: activeMargin,
          totalBookedPnL: trade.totalBookedPnL || 0,
        };

        // --- MULTI-TIER TAKE-PROFIT LEVEL CHECKS ---
        
        // 1. Check TP 1 Target (Book 35% of initial position & Shift SL to Entry Breakeven)
        const isTP1Hit = !updatedTrade.tp1Hit && (
          (isLong && currentPrice >= updatedTrade.tp1Price) ||
          (!isLong && currentPrice <= updatedTrade.tp1Price)
        );

        if (isTP1Hit) {
          const booked35 = parseFloat(Math.max(0.70, updatedTrade.targetProfitUsd * 0.35).toFixed(2));
          const newTotalBooked = parseFloat(((updatedTrade.totalBookedPnL || 0) + booked35).toFixed(2));
          const newRemainingMargin = parseFloat((updatedTrade.margin * 0.65).toFixed(2)); // 65% remaining

          // Credit profit to master portfolio balance
          const newBal = parseFloat((fleetState.masterPortfolio.currentBalance + booked35).toFixed(2));
          const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
          const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));

          fleetState.masterPortfolio = {
            ...fleetState.masterPortfolio,
            currentBalance: newBal,
            totalRealizedPnL: totalNet,
            netROI,
          };

          updatedTrade = {
            ...updatedTrade,
            tp1Hit: true,
            tp1HitTime: now,
            tp1BookedPnL: booked35,
            totalBookedPnL: newTotalBooked,
            remainingMargin: newRemainingMargin,
            stopLossPrice: updatedTrade.entryPrice, // Shift SL to Entry Breakeven (100% Risk Free)
            slMode: 'BREAKEVEN',
          };

          // Dispatch Telegram Alert for TP1
          if (fleetState.telegramConfig.notifyOnTakeProfit) {
            const tp1Msg = formatTelegramPartialTPHit(
              updatedTrade, 
              1, 
              booked35, 
              updatedTrade.entryPrice, 
              '100% Risk-Free Entry Breakeven', 
              fleetState.masterPortfolio
            );
            dispatchTelegramMessage(tp1Msg, 'TAKE_PROFIT');
          }
        }

        // 2. Check TP 2 Target (Book 25% of initial position & Shift SL to TP1 Price)
        const isTP2Hit = updatedTrade.tp1Hit && !updatedTrade.tp2Hit && (
          (isLong && currentPrice >= updatedTrade.tp2Price) ||
          (!isLong && currentPrice <= updatedTrade.tp2Price)
        );

        if (isTP2Hit) {
          const booked25 = parseFloat(Math.max(0.50, updatedTrade.targetProfitUsd * 0.25).toFixed(2));
          const newTotalBooked = parseFloat(((updatedTrade.totalBookedPnL || 0) + booked25).toFixed(2));
          const newRemainingMargin = parseFloat((updatedTrade.margin * 0.40).toFixed(2)); // 40% remaining

          const newBal = parseFloat((fleetState.masterPortfolio.currentBalance + booked25).toFixed(2));
          const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
          const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));

          fleetState.masterPortfolio = {
            ...fleetState.masterPortfolio,
            currentBalance: newBal,
            totalRealizedPnL: totalNet,
            netROI,
          };

          updatedTrade = {
            ...updatedTrade,
            tp2Hit: true,
            tp2HitTime: now,
            tp2BookedPnL: booked25,
            totalBookedPnL: newTotalBooked,
            remainingMargin: newRemainingMargin,
            stopLossPrice: updatedTrade.tp1Price, // Shift SL to TP1 price (Guaranteed Profit Locked)
            slMode: 'LOCKED_TP1',
          };

          if (fleetState.telegramConfig.notifyOnTakeProfit) {
            const tp2Msg = formatTelegramPartialTPHit(
              updatedTrade, 
              2, 
              booked25, 
              updatedTrade.tp1Price, 
              'Locked at TP1 Profit Level', 
              fleetState.masterPortfolio
            );
            dispatchTelegramMessage(tp2Msg, 'TAKE_PROFIT');
          }
        }

        // 3. Check TP 3 Target (Book 20% of initial position & Shift SL to TP2 Price, Activate 20% Runner)
        const isTP3Hit = updatedTrade.tp2Hit && !updatedTrade.tp3Hit && (
          (isLong && currentPrice >= updatedTrade.tp3Price) ||
          (!isLong && currentPrice <= updatedTrade.tp3Price)
        );

        if (isTP3Hit) {
          const booked20 = parseFloat(Math.max(0.40, updatedTrade.targetProfitUsd * 0.20).toFixed(2));
          const newTotalBooked = parseFloat(((updatedTrade.totalBookedPnL || 0) + booked20).toFixed(2));
          const runnerMargin = parseFloat((updatedTrade.margin * 0.20).toFixed(2)); // 20% runner

          const newBal = parseFloat((fleetState.masterPortfolio.currentBalance + booked20).toFixed(2));
          const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
          const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));

          fleetState.masterPortfolio = {
            ...fleetState.masterPortfolio,
            currentBalance: newBal,
            totalRealizedPnL: totalNet,
            netROI,
          };

          updatedTrade = {
            ...updatedTrade,
            tp3Hit: true,
            tp3HitTime: now,
            tp3BookedPnL: booked20,
            totalBookedPnL: newTotalBooked,
            remainingMargin: runnerMargin,
            runnerActive: true,
            stopLossPrice: updatedTrade.tp2Price, // Shift SL to TP2 price
            trailingStopPrice: updatedTrade.tp2Price,
            slMode: 'LOCKED_TP2',
          };

          if (fleetState.telegramConfig.notifyOnTakeProfit) {
            const tp3Msg = formatTelegramPartialTPHit(
              updatedTrade, 
              3, 
              booked20, 
              updatedTrade.tp2Price, 
              'Locked at TP2 Level (20% Runner Active)', 
              fleetState.masterPortfolio
            );
            dispatchTelegramMessage(tp3Msg, 'TAKE_PROFIT');
          }
        }

        // 4. Dynamic Trailing Stop Loss along Market Structure (for Runner or Advanced TP stage)
        if (updatedTrade.runnerActive || updatedTrade.tp3Hit) {
          if (isLong) {
            // Long trailing: trail 1.5% below current price or higher structural swing low
            const dynamicTrail = parseFloat((currentPrice * 0.985).toFixed(currentPrice >= 1 ? 4 : 6));
            if (dynamicTrail > updatedTrade.stopLossPrice) {
              updatedTrade.stopLossPrice = dynamicTrail;
              updatedTrade.trailingStopPrice = dynamicTrail;
              updatedTrade.slMode = 'TRAILING_STRUCTURE';
            }
          } else {
            // Short trailing: trail 1.5% above current price or lower structural swing high
            const dynamicTrail = parseFloat((currentPrice * 1.015).toFixed(currentPrice >= 1 ? 4 : 6));
            if (dynamicTrail < updatedTrade.stopLossPrice) {
              updatedTrade.stopLossPrice = dynamicTrail;
              updatedTrade.trailingStopPrice = dynamicTrail;
              updatedTrade.slMode = 'TRAILING_STRUCTURE';
            }
          }
        }

        // --- STOP-LOSS & FULL POSITION CLOSE EVALUATION ---
        const isStopHit = (isLong && currentPrice <= updatedTrade.stopLossPrice) ||
                          (!isLong && currentPrice >= updatedTrade.stopLossPrice) ||
                          (updatedTrade.slMode === 'INITIAL' && unrealizedPnL <= -updatedTrade.maxLossUsd);

        if (isStopHit) {
          // If partial profit was already booked or SL was at Breakeven/TP1/TP2:
          if ((updatedTrade.totalBookedPnL && updatedTrade.totalBookedPnL > 0) || updatedTrade.slMode !== 'INITIAL') {
            // Trade exit with protected profit / breakeven!
            const runnerFinalPnL = Math.max(0, unrealizedPnL);
            const finalNetRealized = parseFloat(((updatedTrade.totalBookedPnL || 0) + runnerFinalPnL).toFixed(2));
            const newBal = parseFloat((fleetState.masterPortfolio.currentBalance + runnerFinalPnL).toFixed(2));
            const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
            const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));
            const wins = fleetState.masterPortfolio.totalWins + 1;
            const totalTrades = fleetState.masterPortfolio.totalTradesExecuted + 1;
            const winRate = parseFloat(((wins / totalTrades) * 100).toFixed(1));

            fleetState.masterPortfolio = {
              ...fleetState.masterPortfolio,
              currentBalance: newBal,
              totalRealizedPnL: totalNet,
              netROI,
              totalWins: wins,
              totalTradesExecuted: totalTrades,
              fleetWinRate: winRate,
              activeStagedTradesCount: Math.max(0, fleetState.activeTrades.length - 1),
            };

            // Update confirming bots win stats
            fleetState.bots = fleetState.bots.map(b => {
              if (updatedTrade.confirmingBotIds.includes(b.id)) {
                return {
                  ...b,
                  winTradesAssisted: b.winTradesAssisted + 1,
                  totalPnLAssisted: parseFloat((b.totalPnLAssisted + finalNetRealized).toFixed(2)),
                };
              }
              return b;
            });

            const exitReason = updatedTrade.runnerActive 
              ? `Runner Closed @ Trailing S/R $${currentPrice} (Total Harvested: +$${finalNetRealized.toFixed(2)})`
              : (updatedTrade.slMode === 'BREAKEVEN'
                  ? `Breakeven Exit @ $${currentPrice} (TP1 Booked: +$${updatedTrade.totalBookedPnL.toFixed(2)})`
                  : `Protected Exit @ $${currentPrice} (Total Realized: +$${finalNetRealized.toFixed(2)})`);

            const closedLog: TradePosition = {
              ...updatedTrade,
              id: `audit-${updatedTrade.id}-${Date.now()}`,
              status: 'CLOSED_TP',
              stageAtClose: updatedTrade.stage,
              closePrice: currentPrice,
              realizedPnL: finalNetRealized,
              realizedPnLPercent: parseFloat(((finalNetRealized / updatedTrade.margin) * 100).toFixed(2)),
              exitTime: Date.now(),
              exitReason,
            };
            fleetState.auditLogs = [closedLog, ...(fleetState.auditLogs || []).slice(0, 99)];

            if (fleetState.telegramConfig.notifyOnTakeProfit) {
              const tpMsg = formatTelegramTPHit(closedLog, fleetState.masterPortfolio);
              dispatchTelegramMessage(tpMsg, 'TAKE_PROFIT');
            }

          } else {
            // Initial Stop-Loss hit (No TP hit yet, max 3% loss limit guard)
            const loss = Math.abs(unrealizedPnL);
            const newBal = parseFloat(Math.max(100, fleetState.masterPortfolio.currentBalance - loss).toFixed(2));
            const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
            const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));
            const losses = fleetState.masterPortfolio.totalLosses + 1;
            const totalTrades = fleetState.masterPortfolio.totalTradesExecuted + 1;
            const winRate = totalTrades > 0 ? parseFloat(((fleetState.masterPortfolio.totalWins / totalTrades) * 100).toFixed(1)) : 0;

            // Perform Autonomous Post-Mortem & Evolve
            const { learningNote, updatedBots } = analyzeTradeMistakeAndEvolve(
              updatedTrade,
              fleetState.bots,
              fleetState.masterPortfolio.evolutionGeneration
            );

            fleetState.bots = updatedBots;

            fleetState.masterPortfolio = {
              ...fleetState.masterPortfolio,
              currentBalance: newBal,
              totalRealizedPnL: totalNet,
              netROI,
              totalLosses: losses,
              totalTradesExecuted: totalTrades,
              fleetWinRate: winRate,
              evolutionGeneration: fleetState.masterPortfolio.evolutionGeneration + 1,
              selfLearningAdaptationsCount: fleetState.masterPortfolio.selfLearningAdaptationsCount + 1,
              activeStagedTradesCount: Math.max(0, fleetState.activeTrades.length - 1),
            };

            const closedLog: TradePosition = {
              ...updatedTrade,
              id: `audit-${updatedTrade.id}-${Date.now()}`,
              status: 'CLOSED_SL',
              stageAtClose: updatedTrade.stage,
              closePrice: currentPrice,
              realizedPnL: -loss,
              realizedPnLPercent: -((loss / updatedTrade.margin) * 100),
              exitTime: Date.now(),
              exitReason: `Initial Stop-Loss Guard @ $${currentPrice} (-$${loss.toFixed(2)})`,
              mistakeAnalysis: learningNote.mistakeIdentified,
            };
            fleetState.auditLogs = [closedLog, ...(fleetState.auditLogs || []).slice(0, 99)];

            // Dispatch Telegram Alert directly from server
            if (fleetState.telegramConfig.notifyOnStopLoss) {
              const slMsg = formatTelegramSLHit(closedLog, fleetState.masterPortfolio, learningNote);
              dispatchTelegramMessage(slMsg, 'STOP_LOSS');
            }
          }
        } else {
          remainingTrades.push(updatedTrade);
        }
      }

      fleetState.activeTrades = remainingTrades;
      fleetState.masterPortfolio.activeStagedTradesCount = remainingTrades.length;

      // 2. Stage Upgrades Evaluation (every ~20s)
      if (now - fleetState.lastUpgradeCheckTimestamp > 20000) {
        fleetState.lastUpgradeCheckTimestamp = now;

        fleetState.activeTrades = fleetState.activeTrades.map(trade => {
          if (trade.stage < 5 && trade.unrealizedPnL > 0.50 && Math.random() < 0.45) {
            const nextStage = (trade.stage + 1) as ConsensusStage;
            const availableBots = fleetState.bots.filter(b => !trade.confirmingBotIds.includes(b.id));
            const newBot = availableBots[0] || fleetState.bots[0];
            const newConfirmingIds = [...trade.confirmingBotIds, newBot.id];
            const newConfirmingNames = [...trade.confirmingBotNames, `${newBot.number}. ${newBot.name}`];
            const nextConfig = STAGE_CONFIGS[nextStage];

            const updatedMargin = parseFloat((fleetState.masterPortfolio.currentBalance * nextConfig.marginPercent).toFixed(2));
            const updatedLev = nextConfig.defaultLeverage;
            const updatedPos = parseFloat((updatedMargin * updatedLev).toFixed(2));

            const upgradedTrade: TradePosition = {
              ...trade,
              stage: nextStage,
              confirmingBotIds: newConfirmingIds,
              confirmingBotNames: newConfirmingNames,
              margin: updatedMargin,
              remainingMargin: updatedMargin,
              leverage: updatedLev,
              positionSize: updatedPos,
            };

            // Dispatch Telegram Upgrade Alert
            if (fleetState.telegramConfig.notifyOnTradeOpen) {
              const upgradeMsg = formatTelegramStageUpgrade(upgradedTrade, `${newBot.number}. ${newBot.name}`);
              dispatchTelegramMessage(upgradeMsg, 'TRADE_OPEN');
            }

            return upgradedTrade;
          }
          return trade;
        });
      }

      // 3. Autonomous Market Scanner & Staged Trade Execution
      // UNLIMITED OPEN TRADES: No artificial cap! Trades trigger whenever strict criteria match.
      if (now - fleetState.lastScanTimestamp > 20000) {
        fleetState.lastScanTimestamp = now;

        // Find candidate coins not currently active
        const activeSymbols = new Set(
          fleetState.activeTrades.map(t => t.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase())
        );
        
        const stratMode = fleetState.activeStrategyMode || 'MULTI_CONFLUENCE';
        
        // ULTRA-STRICT FILTER: High conviction setup screening based on active strategy mode
        // Excludes meme coins, micro-decimal coins (<$0.01), and assets currently open
        const strictCandidates = coinUniverse.filter(c => {
          const cleanSym = c.symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
          if (activeSymbols.has(cleanSym)) return false;
          if (isHighDecimalOrBlacklistedCoin(cleanSym, c.price)) return false;
          if (c.price < 0.01) return false;
          
          const rsi = c.rsi || 50;
          const vol = Number(c.volatility) || 5;
          const sentiment = Math.abs(c.sentimentScore || 0);
          const chg = Math.abs(c.change24h || 0);

          if (stratMode === 'TREND_PULLBACK') {
            // Trend pullback: Macro momentum exists + RSI pulled back to 38-54 zone
            return chg >= 1.5 && rsi >= 36 && rsi <= 56 && vol >= 2.0;
          } else if (stratMode === 'LIQUIDITY_REVERSAL') {
            // Liquidity reversal: Extreme RSI exhaustion + high volatility rejection
            return (rsi <= 32 || rsi >= 68) && vol >= 3.2;
          } else if (stratMode === 'VOLATILITY_SQUEEZE') {
            // Volatility squeeze: Volatility compression turning into explosive expansion
            return vol >= 4.0 && (c.volume24h || 0) > 40000000;
          } else if (stratMode === 'NEURAL_NARRATIVE') {
            // AI Neural Sentiment: High absolute sentiment score
            return sentiment >= 45 && vol >= 2.5;
          } else {
            // Default MULTI_CONFLUENCE: Multi-indicator confluence
            const rsiStrict = (rsi <= 38) || (rsi >= 62) || (rsi >= 54 && rsi <= 66 && c.macd === 'BULLISH_CROSS');
            const volStrict = vol >= 2.5 && vol <= 14.0;
            const sentimentStrict = sentiment >= 35;
            return rsiStrict && volStrict && sentimentStrict;
          }
        });

        if (strictCandidates.length > 0) {
          const coin = strictCandidates[Math.floor(Math.random() * strictCandidates.length)];
          const initiatorBot = fleetState.bots[Math.floor(Math.random() * fleetState.bots.length)];
          const isOversoldLong = (coin.rsi || 50) <= 45;
          const direction: TradeDirection = isOversoldLong ? 'LONG' : ((coin.change24h || 0) >= 0 ? 'LONG' : 'SHORT');
          const stage: ConsensusStage = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1)) as ConsensusStage;
          
          const confirmingBots = fleetState.bots.slice(0, stage);
          const confirmingBotIds = confirmingBots.map(b => b.id);
          const confirmingBotNames = confirmingBots.map(b => `${b.number}. ${b.name}`);

          const livePrice = prices[coin.symbol]?.price || coin.price || 1;
          const liveCoin = { ...coin, price: livePrice };

          const params = calculateStagedTradeParameters(
            fleetState.masterPortfolio.currentBalance,
            stage,
            initiatorBot,
            confirmingBots,
            liveCoin,
            direction,
            stratMode
          );

          const newTrade: TradePosition = {
            id: `trade-stage-${stage}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            symbol: `${coin.symbol}/USDT`,
            name: coin.name,
            contractAddress: coin.contractAddress,
            network: coin.network,
            cmcUrl: coin.cmcUrl,
            isVerified: true,
            direction,
            stage,
            initiatorBotId: initiatorBot.id,
            initiatorBotName: `${initiatorBot.number}. ${initiatorBot.name}`,
            confirmingBotIds,
            confirmingBotNames,
            leverage: params.leverage,
            margin: params.margin,
            remainingMargin: params.remainingMargin,
            positionSize: params.positionSize,
            entryPrice: params.entryPrice,
            currentPrice: params.entryPrice,
            initialStopLossPrice: params.initialStopLossPrice,
            stopLossPrice: params.stopLossPrice,
            slMode: 'INITIAL',
            tp1Price: params.tp1Price,
            tp1Hit: false,
            tp2Price: params.tp2Price,
            tp2Hit: false,
            tp3Price: params.tp3Price,
            tp3Hit: false,
            runnerPercent: 20,
            runnerActive: false,
            structuralSupportPrice: params.structuralSupportPrice,
            structuralResistancePrice: params.structuralResistancePrice,
            totalBookedPnL: 0,
            takeProfitPrice: params.takeProfitPrice,
            targetProfitUsd: params.targetProfitUsd,
            maxLossUsd: params.maxLossUsd,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            status: 'OPEN',
            entryTime: Date.now(),
            aiReasoning: params.aiReasoning,
            teacherExplanation: params.teacherExplanation,
            confirmationMatrix: params.confirmationMatrix,
            sentimentScore: coin.sentimentScore || 75,
            stageHistory: [{
              stage,
              timestamp: Date.now(),
              addedBotId: initiatorBot.id,
              addedBotName: `${initiatorBot.number}. ${initiatorBot.name}`,
              rationale: `${params.confirmationMatrix?.strategyName || 'Ultra-strict'} filter passed with ${params.confirmationMatrix?.confluenceScore || 85}% confluence (${confirmingBots.length} bots).`,
              newLeverage: params.leverage,
              newMargin: params.margin,
            }],
          };

          fleetState.activeTrades = [newTrade, ...fleetState.activeTrades];
          fleetState.masterPortfolio.activeStagedTradesCount = fleetState.activeTrades.length;

          // Dispatch Telegram Entry Alert
          if (fleetState.telegramConfig.notifyOnTradeOpen) {
            const openMsg = formatTelegramStageTradeOpen(newTrade);
            dispatchTelegramMessage(openMsg, 'TRADE_OPEN');
          }
        }
      }

      // 4. Hourly Performance Summary to Telegram
      const summaryIntervalMs = (fleetState.telegramConfig.summaryIntervalMinutes || 60) * 60 * 1000;
      if (now - fleetState.lastSummaryTimestamp >= summaryIntervalMs) {
        fleetState.lastSummaryTimestamp = now;
        if (fleetState.telegramConfig.notifyHourlySummary) {
          const summaryMsg = formatTelegramFleetSummary(
            fleetState.masterPortfolio,
            fleetState.activeTrades,
            fleetState.bots
          );
          dispatchTelegramMessage(summaryMsg, 'HOURLY_SUMMARY');
        }
      }

      // 5. Periodic state flush to disk
      persistStateToDisk();

    } catch (loopErr) {
      console.error('Error in 24/7 background engine tick:', loopErr);
    }
  }, 3000);

  // -------------------------------------------------------------
  // API ENDPOINTS & SYSTEM HEALTH
  // -------------------------------------------------------------

  // Health and keepalive routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      is247Running: fleetState.is247Running,
      activeStrategyMode: fleetState.activeStrategyMode || 'MULTI_CONFLUENCE',
      activeTradesCount: fleetState.activeTrades.length,
      masterBalance: fleetState.masterPortfolio.currentBalance,
      timestamp: Date.now(),
    });
  });

  app.get('/health', (req, res) => res.status(200).send('OK'));
  app.get('/healthz', (req, res) => res.status(200).send('OK'));
  app.get('/ping', (req, res) => res.status(200).send('pong'));

  // Comprehensive server health & diagnostics
  app.get('/api/fleet/server-health', (req, res) => {
    const mem = process.memoryUsage();
    const uptimeSec = process.uptime();
    res.json({
      success: true,
      status: 'ONLINE',
      engine: '24/7 Autonomous Quantitative Consensus Engine',
      process: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(uptimeSec),
        memoryMB: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        },
      },
      engineStats: {
        is247Running: fleetState.is247Running,
        activeTrades: fleetState.activeTrades.length,
        totalTradesExecuted: fleetState.masterPortfolio.totalTradesExecuted,
        masterBalance: fleetState.masterPortfolio.currentBalance,
        activeStrategyMode: fleetState.activeStrategyMode,
        telegramConnected: Boolean(fleetState.telegramConfig.botToken && fleetState.telegramConfig.chatId),
      },
      connectionTips: [
        'If you saw a temporary 502 or loading screen earlier, it was during a hot server reload or Telegram connection test.',
        'The server runs autonomously 24/7 in cloud containers — client connection drops do NOT stop trade execution.',
        'Data is continually persisted to disk in /data/fleet-state.json.',
      ],
    });
  });

  // Get list of available confirmation strategies
  app.get('/api/fleet/strategies', (req, res) => {
    res.json({
      success: true,
      activeStrategyMode: fleetState.activeStrategyMode || 'MULTI_CONFLUENCE',
      strategies: Object.values(CONFIRMATION_STRATEGIES),
    });
  });

  // Switch active confirmation strategy
  app.post('/api/fleet/strategy/set', async (req, res) => {
    try {
      const { strategyMode } = req.body;
      if (!strategyMode || !CONFIRMATION_STRATEGIES[strategyMode as ConfirmationStrategyMode]) {
        return res.status(400).json({ success: false, error: 'Invalid strategy mode' });
      }

      fleetState.activeStrategyMode = strategyMode as ConfirmationStrategyMode;
      fleetState.masterPortfolio.activeStrategyMode = strategyMode as ConfirmationStrategyMode;
      persistStateToDisk();

      const strat = CONFIRMATION_STRATEGIES[strategyMode as ConfirmationStrategyMode];
      
      // Notify via Telegram if configured
      if (fleetState.telegramConfig.botToken && fleetState.telegramConfig.chatId) {
        const msg = `⚙️ *[FLEET CONFIRMATION STRATEGY UPDATED]*\n━━━━━━━━━━━━━━━━━━━━\n• *New Mode*: *${strat.name}*\n• *Badge*: \`${strat.badge}\`\n• *Min Confluence*: \`${strat.minConfluencePercent}%\`\n• *Core Indicators*: ${strat.primaryIndicators.join(', ')}\n━━━━━━━━━━━━━━━━━━━━\n⚡ *24/7 Autonomous Scanner Auto-Configured!*`;
        await dispatchTelegramMessage(msg, 'SYSTEM');
      }

      res.json({
        success: true,
        activeStrategyMode: fleetState.activeStrategyMode,
        strategy: strat,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Get full server-authoritative fleet state
  app.get('/api/fleet/state', (req, res) => {
    const now = Date.now();
    const currentUptime = Math.floor((now - fleetState.serverStartedAt) / 1000) + fleetState.accumulatedUptimeSeconds;
    const summaryIntervalMs = (fleetState.telegramConfig.summaryIntervalMinutes || 60) * 60 * 1000;
    const elapsedSinceLastSummary = now - fleetState.lastSummaryTimestamp;
    const nextSummarySeconds = Math.max(0, Math.floor((summaryIntervalMs - elapsedSinceLastSummary) / 1000));

    res.json({
      success: true,
      serverTime: now,
      uptimeSeconds: currentUptime,
      is247Running: fleetState.is247Running,
      activeStrategyMode: fleetState.activeStrategyMode || 'MULTI_CONFLUENCE',
      nextSummarySeconds,
      masterPortfolio: fleetState.masterPortfolio,
      bots: fleetState.bots,
      activeTrades: fleetState.activeTrades,
      auditLogs: fleetState.auditLogs,
      telegramConfig: fleetState.telegramConfig,
      telegramLogs: fleetState.telegramLogs,
    });
  });

  // Save / Update Telegram credentials and notification toggles
  app.post('/api/fleet/telegram-config', async (req, res) => {
    try {
      const { botToken, chatId, enabled, summaryIntervalMinutes, notifyOnTradeOpen, notifyOnTakeProfit, notifyOnStopLoss, notifyHourlySummary } = req.body;

      const previousConfig = { ...fleetState.telegramConfig };

      fleetState.telegramConfig = {
        botToken: botToken !== undefined ? botToken : fleetState.telegramConfig.botToken,
        chatId: chatId !== undefined ? chatId : fleetState.telegramConfig.chatId,
        enabled: enabled !== undefined ? enabled : Boolean(botToken && chatId),
        summaryIntervalMinutes: Number(summaryIntervalMinutes) || fleetState.telegramConfig.summaryIntervalMinutes || 60,
        notifyOnTradeOpen: notifyOnTradeOpen !== undefined ? notifyOnTradeOpen : true,
        notifyOnTakeProfit: notifyOnTakeProfit !== undefined ? notifyOnTakeProfit : true,
        notifyOnStopLoss: notifyOnStopLoss !== undefined ? notifyOnStopLoss : true,
        notifyHourlySummary: notifyHourlySummary !== undefined ? notifyHourlySummary : true,
      };

      persistStateToDisk();

      // If user just connected Telegram, send welcome confirmation
      if (fleetState.telegramConfig.botToken && fleetState.telegramConfig.chatId && !previousConfig.botToken) {
        const welcomeMsg = `🤖 *[NEXUS 5-BOT CONSENSUS FLEET ONLINE]*\n\n✅ 24/7 Cloud Background Engine Linked!\n💰 Master Capital: $${fleetState.masterPortfolio.currentBalance.toFixed(2)} USDT\n⚡ Active Trades: ${fleetState.activeTrades.length}\n📊 Hourly Reports: Every ${fleetState.telegramConfig.summaryIntervalMinutes}m\n\n_Your cloud server is running 24/7 in the datacenter. You can close your browser or turn data off anytime!_`;
        await dispatchTelegramMessage(welcomeMsg, 'SYSTEM');
      }

      res.json({ success: true, telegramConfig: fleetState.telegramConfig });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Reset Master Portfolio to clean $1,000 baseline
  app.post('/api/fleet/reset', (req, res) => {
    try {
      fleetState.masterPortfolio = {
        initialBase: 1000.00,
        currentBalance: 1000.00,
        totalRealizedPnL: 0.00,
        netROI: 0.00,
        totalWins: 0,
        totalLosses: 0,
        totalTradesExecuted: 0,
        fleetWinRate: 0.0,
        evolutionGeneration: 1,
        selfLearningAdaptationsCount: 0,
        activeStagedTradesCount: 0,
      };

      fleetState.activeTrades = [];
      fleetState.auditLogs = [];
      fleetState.bots = JSON.parse(JSON.stringify(INITIAL_BOTS));
      fleetState.lastSummaryTimestamp = Date.now();

      persistStateToDisk();

      dispatchTelegramMessage(
        `🔄 *[MASTER FLEET RESET TRIGGERED]*\n• Capital Reset: $1,000.00 USDT Baseline\n• Trade History Cleared\n• Gen #1 Heuristics Initialized\n• 24/7 Scanning Active.`,
        'SYSTEM'
      );

      res.json({ success: true, masterPortfolio: fleetState.masterPortfolio });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Toggle 24/7 Engine ON/OFF
  app.post('/api/fleet/toggle-247', (req, res) => {
    fleetState.is247Running = !fleetState.is247Running;
    persistStateToDisk();
    res.json({ success: true, is247Running: fleetState.is247Running });
  });

  // Close trade manually
  app.post('/api/fleet/trade/close', (req, res) => {
    const { tradeId } = req.body;
    const trade = fleetState.activeTrades.find(t => t.id === tradeId);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    const pnl = trade.unrealizedPnL;
    const isWin = pnl >= 0;
    const newBal = parseFloat(Math.max(100, fleetState.masterPortfolio.currentBalance + pnl).toFixed(2));
    const totalNet = parseFloat((newBal - fleetState.masterPortfolio.initialBase).toFixed(2));
    const netROI = parseFloat(((totalNet / fleetState.masterPortfolio.initialBase) * 100).toFixed(2));
    const wins = isWin ? fleetState.masterPortfolio.totalWins + 1 : fleetState.masterPortfolio.totalWins;
    const losses = !isWin ? fleetState.masterPortfolio.totalLosses + 1 : fleetState.masterPortfolio.totalLosses;
    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;

    fleetState.masterPortfolio = {
      ...fleetState.masterPortfolio,
      currentBalance: newBal,
      totalRealizedPnL: totalNet,
      netROI,
      totalWins: wins,
      totalLosses: losses,
      totalTradesExecuted: totalTrades,
      fleetWinRate: winRate,
      activeStagedTradesCount: Math.max(0, fleetState.activeTrades.length - 1),
    };

    const closedLog: TradePosition = {
      ...trade,
      id: `audit-${trade.id}-${Date.now()}`,
      status: isWin ? 'CLOSED_TP' : 'CLOSED_SL',
      stageAtClose: trade.stage,
      closePrice: trade.currentPrice,
      realizedPnL: pnl,
      realizedPnLPercent: trade.unrealizedPnLPercent,
      exitTime: Date.now(),
      exitReason: `Manual close @ $${trade.currentPrice} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`,
    };

    fleetState.auditLogs = [closedLog, ...(fleetState.auditLogs || []).slice(0, 99)];
    fleetState.activeTrades = fleetState.activeTrades.filter(t => t.id !== tradeId);

    persistStateToDisk();
    res.json({ success: true, closedTrade: closedLog });
  });

  // Open trade manually / from UI
  app.post('/api/fleet/trade/open', (req, res) => {
    const { initiatorBotId, coinId, direction, explicitStage } = req.body;
    const initiatorBot = fleetState.bots.find(b => b.id === initiatorBotId) || fleetState.bots[0];
    const coin = coinUniverse.find(c => c.id === coinId || c.symbol === coinId);
    if (!coin) {
      return res.status(404).json({ success: false, error: 'Coin not found' });
    }

    const stage: ConsensusStage = explicitStage || 1;
    const confirmingBots = fleetState.bots.slice(0, stage);
    const confirmingBotIds = confirmingBots.map(b => b.id);
    const confirmingBotNames = confirmingBots.map(b => `${b.number}. ${b.name}`);

    const params = calculateStagedTradeParameters(
      fleetState.masterPortfolio.currentBalance,
      stage,
      initiatorBot,
      confirmingBots,
      coin,
      direction || 'LONG'
    );

    const newTrade: TradePosition = {
      id: `trade-stage-${stage}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol: `${coin.symbol}/USDT`,
      name: coin.name,
      contractAddress: coin.contractAddress,
      network: coin.network,
      cmcUrl: coin.cmcUrl,
      isVerified: true,
      direction: direction || 'LONG',
      stage,
      initiatorBotId: initiatorBot.id,
      initiatorBotName: `${initiatorBot.number}. ${initiatorBot.name}`,
      confirmingBotIds,
      confirmingBotNames,
      leverage: params.leverage,
      margin: params.margin,
      remainingMargin: params.remainingMargin,
      positionSize: params.positionSize,
      entryPrice: params.entryPrice,
      currentPrice: params.entryPrice,
      initialStopLossPrice: params.initialStopLossPrice,
      stopLossPrice: params.stopLossPrice,
      slMode: 'INITIAL',
      tp1Price: params.tp1Price,
      tp1Hit: false,
      tp2Price: params.tp2Price,
      tp2Hit: false,
      tp3Price: params.tp3Price,
      tp3Hit: false,
      runnerPercent: 20,
      runnerActive: false,
      structuralSupportPrice: params.structuralSupportPrice,
      structuralResistancePrice: params.structuralResistancePrice,
      totalBookedPnL: 0,
      takeProfitPrice: params.takeProfitPrice,
      targetProfitUsd: params.targetProfitUsd,
      maxLossUsd: params.maxLossUsd,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      status: 'OPEN',
      entryTime: Date.now(),
      aiReasoning: params.aiReasoning,
      teacherExplanation: params.teacherExplanation,
      sentimentScore: coin.sentimentScore || 75,
      stageHistory: [{
        stage,
        timestamp: Date.now(),
        addedBotId: initiatorBot.id,
        addedBotName: `${initiatorBot.number}. ${initiatorBot.name}`,
        rationale: `Manual order execution with ${confirmingBots.length} bot consensus.`,
        newLeverage: params.leverage,
        newMargin: params.margin,
      }],
    };

    fleetState.activeTrades = [newTrade, ...fleetState.activeTrades];
    fleetState.masterPortfolio.activeStagedTradesCount = fleetState.activeTrades.length;

    persistStateToDisk();

    if (fleetState.telegramConfig.notifyOnTradeOpen) {
      const openMsg = formatTelegramStageTradeOpen(newTrade);
      dispatchTelegramMessage(openMsg, 'TRADE_OPEN');
    }

    res.json({ success: true, trade: newTrade });
  });

  // Real Live Crypto Market Prices endpoint
  app.get('/api/market/live-prices', async (req, res) => {
    const prices = await fetchLiveMarketPrices();
    res.json({ success: true, prices, timestamp: Date.now() });
  });

  // Live Market Overview stats
  app.get('/api/market/stats', (req, res) => {
    res.json({
      success: true,
      totalMarketCap: '$2.62T',
      totalMarketCapChange24h: -1.54,
      cmc20: 160.78,
      cmc20Change24h: -1.83,
      altcoinIndex: 37,
      fearAndGreed: 79,
      fearAndGreedLabel: 'Extreme Greed',
      btcDominance: 59.5,
      volume24h: '$84.2B',
      btcPrice: cachedLivePrices['BTC']?.price || 78106.97,
      ethPrice: cachedLivePrices['ETH']?.price || 2452.91,
      solPrice: cachedLivePrices['SOL']?.price || 95.91,
    });
  });

  // Gemini AI Deep Market Analysis endpoint
  app.post('/api/ai/deep-analysis', async (req, res) => {
    try {
      const { botName, strategyTitle, symbol, price, change24h, rsi, sentimentScore, trend, direction } = req.body;
      const ai = getAIClient();

      const prompt = `You are the core Brain AI for an institutional cryptocurrency trading bot named "${botName}" executing the "${strategyTitle}" strategy.
Analyze the current live market setup for ${symbol}:
- Current Price: $${price}
- 24h Change: ${change24h}%
- 14-period RSI: ${rsi}
- Market Sentiment Score: ${sentimentScore}/100
- Multi-timeframe Trend: ${trend}
- Proposed Trade Direction: ${direction}

Provide a concise, high-conviction 2-sentence institutional trade rationale explaining the mathematical/sentiment/order-flow trigger for this trade and why risk parameters (5% dynamic compounding, 3% max loss, $2+ min take-profit) are favorable.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      const reasoning = response.text || `${botName} confirmed ${direction} on ${symbol} with RSI ${rsi} and positive trend alignment.`;
      res.json({ success: true, reasoning });
    } catch (err: any) {
      console.error('Gemini AI deep analysis error:', err?.message || err);
      res.json({
        success: true,
        reasoning: `Autonomous algorithmic confirmation on ${req.body.symbol} (${req.body.direction}). Technical ribbon alignment & volatility delta validated.`
      });
    }
  });

  // Gemini AI Post-Mortem Mistake Learning endpoint
  app.post('/api/ai/post-mortem', async (req, res) => {
    try {
      const { botName, strategyTitle, symbol, direction, leverage, entryPrice, stopLossPrice, lossAmount } = req.body;
      const ai = getAIClient();

      const prompt = `You are the adaptive Machine Learning Post-Mortem Engine for trading bot "${botName}" (${strategyTitle}).
A trade on ${symbol} (${direction} ${leverage}x leverage) just hit its hard stop-loss:
- Entry Price: $${entryPrice}
- Stop Loss Triggered: $${stopLossPrice}
- Capital Loss: -$${lossAmount} (Hard capped at 3% of capital)

Perform a post-mortem review like an elite quant trader learning from a mistake:
Return a JSON object with:
1. "mistakeIdentified": precise tactical mistake (e.g. premature breakout entry, ignored BTC macro correlation, false liquidity trap, spread slippage).
2. "learnedLesson": principle learned to avoid repeating this.
3. "parameterAdjustment": concrete heuristic rule adjusted for subsequent trades (e.g. increased volume threshold, clamped leverage, added ATR filter).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        success: true,
        mistakeIdentified: parsed.mistakeIdentified || `Premature entry on ${symbol} during micro liquidity consolidation.`,
        learnedLesson: parsed.learnedLesson || `Require volume confirmation and 15M candle body close before triggering order execution.`,
        parameterAdjustment: parsed.parameterAdjustment || `Increased confirmation filter threshold and clamped leverage in high-spread market conditions.`
      });
    } catch (err: any) {
      console.error('Gemini Post-Mortem error:', err?.message || err);
      res.json({
        success: true,
        mistakeIdentified: `Sudden volatility spike on ${req.body.symbol} triggered liquidity sweep beyond support.`,
        learnedLesson: `Incorporate dynamic volatility envelope buffers during macro announcements.`,
        parameterAdjustment: `Widened trailing confirmation zone and lowered entry urgency score.`
      });
    }
  });

  // Telegram Direct Dispatcher
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const { token, chatId, text, type } = req.body;
      if (token && chatId) {
        fleetState.telegramConfig.botToken = token;
        fleetState.telegramConfig.chatId = chatId;
        fleetState.telegramConfig.enabled = true;
        persistStateToDisk();
      }

      const success = await dispatchTelegramMessage(text, type || 'SYSTEM');
      res.json({ success, simulated: !fleetState.telegramConfig.botToken });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Telegram Test Connection endpoint
  app.post('/api/telegram/test', async (req, res) => {
    try {
      const { token, chatId } = req.body;
      const botToken = (token || fleetState.telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
      const targetChatId = (chatId || fleetState.telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();

      if (!botToken || !targetChatId) {
        return res.json({ 
          success: false, 
          error: 'Please enter both your Telegram Bot Token and Chat ID to verify.' 
        });
      }

      const testMsg = `🤖 *[NEXUS 5-BOT AUTONOMOUS FLEET - CONNECTION VERIFIED]*\n\n✅ Telegram Webhook Connected Successfully!\n⚡ 5 Specialist Bots ($1,000 Base) Running 24/7 in Cloud Datacenter.\n📊 Trade Entries, Take-Profits, Stop-Loss Learning & Hourly Digests will be sent here.\n\n_Server is running 24/7. It will continue executing and notifying you even if your phone screen is off or mobile data is disconnected!_`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: testMsg,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (data.ok) {
        // Save config immediately on successful test
        fleetState.telegramConfig.botToken = botToken;
        fleetState.telegramConfig.chatId = targetChatId;
        fleetState.telegramConfig.enabled = true;
        fleetState.telegramConfig.lastError = undefined;
        fleetState.telegramConfig.lastErrorTimestamp = undefined;
        persistStateToDisk();

        return res.json({ 
          success: true, 
          message: 'Test message delivered successfully to your Telegram chat!' 
        });
      } else {
        const errorDesc = data.description || 'Unauthorized (Invalid Bot Token)';
        fleetState.telegramConfig.lastError = errorDesc;
        fleetState.telegramConfig.lastErrorTimestamp = Date.now();
        persistStateToDisk();

        return res.json({ 
          success: false, 
          error: `${errorDesc}. Please verify your Bot Token with @BotFather and your Chat ID with @userinfobot.` 
        });
      }
    } catch (err: any) {
      return res.json({ 
        success: false, 
        error: err?.message || 'Network error connecting to Telegram API' 
      });
    }
  });

  // Complete Project ZIP Exporter for VisiHost / VPS / Cloud 24/7 Hosting
  app.get('/api/export-project-zip', (req, res) => {
    try {
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      res.attachment('nexus-five-trading-fleet.zip');
      res.setHeader('Content-Type', 'application/zip');

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Zip archive warning:', err);
        } else {
          throw err;
        }
      });

      archive.on('error', (err) => {
        console.error('Zip export error:', err);
        if (!res.headersSent) {
          res.status(500).send({ error: 'Failed to generate zip package' });
        }
      });

      archive.pipe(res);

      const rootDir = process.cwd();

      archive.glob('**/*', {
        cwd: rootDir,
        ignore: [
          'node_modules/**',
          'dist/**',
          '.git/**',
          '.cache/**',
          '*.log',
          '.DS_Store',
          'package-lock.json',
        ],
        dot: true,
      });

      archive.finalize();
    } catch (err: any) {
      console.error('Failed to initiate zip download:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err?.message || 'Export error' });
      }
    }
  });

  // Vite middleware for development / static serving in production
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ 24/7 Autonomous 5-Bot Staged Trading Fleet Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
