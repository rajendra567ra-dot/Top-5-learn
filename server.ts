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
  TelegramLog 
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
const PORT = 3000;

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
      notifyOnTradeOpen: true,
      notifyOnTP1: true,
      notifyOnTP2: true,
      notifyOnStopLoss: true,
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

  if (enabled && botToken && chatId) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
      const data = await response.json();
      if (data.ok) {
        logEntry.status = 'SENT';
        arenaState.telegramConfig.lastStatus = `Delivered at ${new Date().toLocaleTimeString()}`;
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

// Autonomous Arena Engine Tick (Runs every 2.5 seconds)
setInterval(() => {
  if (!arenaState.isScanningActive) return;

  const now = Date.now();
  arenaState.lastScanTimestamp = now;

  // 1. Simulate live micro-fluctuations in coin prices
  arenaState.coins = arenaState.coins.map(coin => {
    const deltaPercent = (Math.random() - 0.49) * 0.4; // +/- 0.2%
    const newPrice = parseFloat((coin.price * (1 + deltaPercent / 100)).toFixed(coin.price < 1 ? 4 : 2));
    const newChange = parseFloat((coin.change24h + (Math.random() - 0.5) * 0.05).toFixed(2));
    return {
      ...coin,
      price: Math.max(0.01, newPrice),
      change24h: newChange,
    };
  });

  // 2. Update Active Trades with new prices & trigger TP1 / TP2 / Trailing SL / Mistake Learning
  const remainingActiveTrades: TradePosition[] = [];

  for (const trade of arenaState.activeTrades) {
    const coin = arenaState.coins.find(c => `${c.symbol}/USDT` === trade.symbol || c.symbol === trade.symbol);
    const currentPrice = coin ? coin.price : trade.currentPrice;

    const { updatedTrade, eventFired, realizedPnLDelta } = updateTradePriceAndTargets(trade, currentPrice);

    // Find the bot
    const botIndex = arenaState.bots.findIndex(b => b.id === trade.botId);
    if (botIndex !== -1) {
      const bot = arenaState.bots[botIndex];

      if (eventFired === 'TP1_HIT') {
        // Dispatch Telegram TP1 alert
        if (arenaState.telegramConfig.notifyOnTP1) {
          const msg = formatTradeTelegramMessage('TP1', updatedTrade);
          sendTelegramNotification('TP1_HIT', `🎯 TP1 HIT: ${updatedTrade.symbol} (35% Secured)`, msg, updatedTrade.botSerialNumber);
        }
      } else if (eventFired === 'TP2_HIT') {
        // Dispatch Telegram TP2 alert
        if (arenaState.telegramConfig.notifyOnTP2) {
          const msg = formatTradeTelegramMessage('TP2', updatedTrade);
          sendTelegramNotification('TP2_HIT', `💎 TP2 HIT: ${updatedTrade.symbol} (25% Secured)`, msg, updatedTrade.botSerialNumber);
        }
      }

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

        // Telegram Notification for Trade Close
        if (arenaState.telegramConfig.notifyOnStopLoss || isWin) {
          const msg = formatTradeTelegramMessage(isWin ? 'TP2' : 'SL', updatedTrade);
          sendTelegramNotification(
            isWin ? 'TP2_HIT' : 'STOP_LOSS',
            `${isWin ? '🏆 WIN' : '🛡 SL'}: ${updatedTrade.symbol} Closed (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`,
            msg,
            updatedTrade.botSerialNumber
          );
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

  // 3. Autonomous Bot Opportunity Scanner (Strict Institutional 10-Rule Confirmation & Quality Focus)
  // Evaluates market setups with strict confirmation and quality scoring
  const scanBatches = 2; // Evaluate high quality candidates
  for (let b = 0; b < scanBatches; b++) {
    const randomBotIndex = Math.floor(Math.random() * arenaState.bots.length);
    const bot = arenaState.bots[randomBotIndex];

    // Restrict bot to max 2 concurrent active trades to enforce laser focus on high-conviction setups
    if (bot.activeTradesCount >= 2) continue;

    // Pick top tier candidate coins from universe
    const candidateCoin = arenaState.coins[Math.floor(Math.random() * arenaState.coins.length)];

    if (candidateCoin && !isHighDecimalOrBlacklistedCoin(candidateCoin.symbol, candidateCoin.price)) {
      // Check if bot already has an active trade on this symbol
      const alreadyInTrade = arenaState.activeTrades.some(
        t => t.botId === bot.id && t.symbol === `${candidateCoin.symbol}/USDT`
      );

      if (!alreadyInTrade) {
        const evalResult = evaluateBotConfirmation(bot, candidateCoin);

        if (evalResult.qualifies) {
          // Create Trade Position with multi-tier TP and dynamic capital
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

          // Dispatch Telegram Open Alert
          if (arenaState.telegramConfig.notifyOnTradeOpen) {
            const msg = formatTradeTelegramMessage('OPEN', newTrade);
            sendTelegramNotification(
              'TRADE_OPEN',
              `🚀 ${bot.serialNumber} OPENED ${newTrade.symbol} (${newTrade.confidenceScore}% Confidence - Quality Validated)`,
              msg,
              bot.serialNumber
            );
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
  if (now - arenaState.lastHourlySummaryTimestamp >= summaryIntervalMs) {
    arenaState.lastHourlySummaryTimestamp = now;
    if (arenaState.telegramConfig.notifyHourlySummary) {
      const summaryMsg = formatHourlyTelegramSummary(arenaState);
      sendTelegramNotification(
        'HOURLY_REPORT',
        '📊 1-HOUR ARENA PERFORMANCE & TOP 10 RANKING REPORT',
        summaryMsg
      );
    }
  }

  saveStateToDisk();
}, 2500);

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
  const msg = formatHourlyTelegramSummary(arenaState);
  await sendTelegramNotification('HOURLY_REPORT', '📊 INSTANT 1-HOUR ARENA SUMMARY DISPATCH', msg);
  res.json({ status: 'ok', message: 'Hourly summary dispatched', lastStatus: arenaState.telegramConfig.lastStatus });
});

app.post('/api/arena/telegram/test', async (req, res) => {
  const testMsg = `🧪 *APEX 40 AI CRYPTO BOT ARENA — WEBHOOK TEST*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ *Connection Status:* LIVE & VERIFIED\n` +
    `🤖 *Active Arena Bots:* 40 Autonomous AI Units\n` +
    `⏱ *24/7 Cloud Host:* Connected\n` +
    `📡 *Telegram Relay:* Operational`;
  
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
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`Apex 40 AI Crypto Bot Arena Server running on port ${PORT}`);
  });
}

startServer();
