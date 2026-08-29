import React, { useState, useEffect, useCallback } from 'react';
import { 
  TradingBot, 
  TradePosition, 
  CryptoCoin, 
  TelegramConfig, 
  TelegramLog, 
  TradeDirection, 
  BotLearningNote,
  ConsensusStage,
  MasterPortfolio
} from './types';
import { generateTop500Universe } from './data/topCoins';
import { INITIAL_BOTS } from './data/initialBots';
import { INITIAL_ACTIVE_TRADES, INITIAL_AUDIT_LOGS } from './data/initialTrades';
import { 
  STAGE_CONFIGS,
  calculateStagedTradeParameters, 
  analyzeTradeMistakeAndEvolve, 
  formatTelegramStageTradeOpen, 
  formatTelegramStageUpgrade,
  formatTelegramTPHit, 
  formatTelegramSLHit, 
  formatTelegramFleetSummary 
} from './services/tradingEngine';

import { Header } from './components/Header';
import { FleetOverviewCard } from './components/FleetOverviewCard';
import { StagePerformanceView } from './components/StagePerformanceView';
import { BotsDashboard } from './components/BotsDashboard';
import { ActiveTradesView } from './components/ActiveTradesView';
import { MarketScannerView } from './components/MarketScannerView';
import { MistakeLearningView } from './components/MistakeLearningView';
import { AuditLogsView } from './components/AuditLogsView';
import { TelegramHubView } from './components/TelegramHubView';
import { TelegramSetupModal } from './components/TelegramSetupModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

interface MarketStats {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  fearAndGreedIndex: number;
  activeCoins: number;
  liveFeedStatus: string;
}

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const INITIAL_MASTER_PORTFOLIO: MasterPortfolio = {
  initialBase: 1000.00,
  currentBalance: 1000.00, // Starts at clean $1,000 baseline
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

export const App: React.FC = () => {
  // 1. Core State - Starting from zero baseline
  const [bots, setBots] = useState<TradingBot[]>(() => {
    const saved = localStorage.getItem('ai_fleet_bots_v4');
    return saved ? JSON.parse(saved) : INITIAL_BOTS;
  });

  const [masterPortfolio, setMasterPortfolio] = useState<MasterPortfolio>(() => {
    const saved = localStorage.getItem('ai_fleet_master_portfolio_v4');
    return saved ? JSON.parse(saved) : INITIAL_MASTER_PORTFOLIO;
  });

  const [activeTrades, setActiveTrades] = useState<TradePosition[]>(() => {
    const saved = localStorage.getItem('ai_fleet_active_trades_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return deduplicateById(parsed);
      } catch (e) {
        console.warn('Failed to parse saved active trades:', e);
      }
    }
    return deduplicateById(INITIAL_ACTIVE_TRADES);
  });

  const [auditLogs, setAuditLogs] = useState<TradePosition[]>(() => {
    const saved = localStorage.getItem('ai_fleet_audit_logs_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return deduplicateById(parsed);
      } catch (e) {
        console.warn('Failed to parse saved audit logs:', e);
      }
    }
    return deduplicateById(INITIAL_AUDIT_LOGS);
  });

  const [coins, setCoins] = useState<CryptoCoin[]>(() => generateTop500Universe());
  const [marketStats, setMarketStats] = useState<MarketStats | null>({
    totalMarketCap: 3120000000000,
    volume24h: 98400000000,
    btcDominance: 57.8,
    fearAndGreedIndex: 68,
    activeCoins: 500,
    liveFeedStatus: 'connected',
  });
  const [liveFeedActive, setLiveFeedActive] = useState<boolean>(true);

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('ai_fleet_tg_config_v4');
    return saved ? JSON.parse(saved) : {
      botToken: '',
      chatId: '',
      enabled: false,
      summaryIntervalMinutes: 60,
      notifyOnTradeOpen: true,
      notifyOnTakeProfit: true,
      notifyOnStopLoss: true,
      notifyHourlySummary: true,
    };
  });

  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>(() => {
    const saved = localStorage.getItem('ai_fleet_tg_logs_v4');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'tg-init-start',
        timestamp: Date.now(),
        type: 'SYSTEM',
        target: '@CryptoFleetBot',
        message: `⚡ *[24/7 AUTONOMOUS STAGED FLEET ONLINE]*\n• Master Capital: $1,000.00 USDT\n• Risk Caps: Max 5% dynamic margin, Max 3% loss per trade\n• Consensus Engine: 5 Specialist Bot Brains Active\n• Any-Bot Signal Initiation: Enabled (Vortex 4H, Titan Vol, Neural Sent, Quant MR, Apex Scalper)\n• Real-Time Telegram Updates: Enabled for Trade Open, SL Hit, TP Hit & Periodic Summaries`,
        status: 'DISPATCHED',
      }
    ];
  });

  // UI state - Default to Stage Performance View
  const [activeTab, setActiveTab] = useState<string>('stages');
  const [is247Running, setIs247Running] = useState<boolean>(true);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('ai_fleet_uptime_seconds_v4');
    return saved !== null ? parseInt(saved, 10) || 0 : 0;
  });
  const [nextSummarySeconds, setNextSummarySeconds] = useState<number>(3600);
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Modals
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('ai_fleet_uptime_seconds_v4', uptimeSeconds.toString());
  }, [uptimeSeconds]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_bots_v4', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_master_portfolio_v4', JSON.stringify(masterPortfolio));
  }, [masterPortfolio]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_active_trades_v4', JSON.stringify(activeTrades));
  }, [activeTrades]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_audit_logs_v4', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_tg_config_v4', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  useEffect(() => {
    localStorage.setItem('ai_fleet_tg_logs_v4', JSON.stringify(telegramLogs));
  }, [telegramLogs]);

  // Dispatch message helper
  const sendTelegramMessage = useCallback(async (
    text: string, 
    type: 'TRADE_OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOURLY_SUMMARY' | 'SYSTEM'
  ) => {
    const isConfigured = Boolean(telegramConfig.botToken && telegramConfig.chatId);
    let messageStatus: 'SENT' | 'SIMULATED' | 'FAILED' = 'SIMULATED';

    if (isConfigured && telegramConfig.enabled) {
      try {
        const res = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: telegramConfig.botToken,
            chatId: telegramConfig.chatId,
            text: text,
          }),
        });
        const data = await res.json();
        if (data.success) {
          messageStatus = 'SENT';
        } else {
          messageStatus = data.simulated ? 'SIMULATED' : 'FAILED';
        }
      } catch (e) {
        console.error('Error dispatching telegram message:', e);
        messageStatus = 'FAILED';
      }
    }

    const newLog: TelegramLog = {
      id: `tg-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      target: isConfigured ? `Chat ID: ${telegramConfig.chatId}` : 'Simulated Terminal',
      message: text,
      status: messageStatus,
    };

    setTelegramLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, [telegramConfig]);

  // 2. Continuous Uptime & Summary Countdown Timer
  useEffect(() => {
    if (!is247Running) return;

    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      setNextSummarySeconds(prev => {
        if (prev <= 1) {
          // Trigger automated hourly report
          const summaryText = formatTelegramFleetSummary(masterPortfolio, activeTrades, bots);
          if (telegramConfig.notifyHourlySummary) {
            sendTelegramMessage(summaryText, 'HOURLY_SUMMARY');
          }
          return telegramConfig.summaryIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [is247Running, masterPortfolio, activeTrades, bots, telegramConfig, sendTelegramMessage]);

  // 3. Close Trade Action (Manual or Triggered)
  const handleCloseTrade = useCallback((tradeId: string) => {
    setActiveTrades(prev => {
      const trade = prev.find(t => t.id === tradeId);
      if (!trade) return prev;

      const pnl = trade.unrealizedPnL;
      const isWin = pnl >= 0;

      // Update Master Portfolio balance & W/L
      setMasterPortfolio(mp => {
        const newBal = parseFloat(Math.max(100, mp.currentBalance + pnl).toFixed(2));
        const totalNet = parseFloat((newBal - mp.initialBase).toFixed(2));
        const netROI = parseFloat(((totalNet / mp.initialBase) * 100).toFixed(2));
        const wins = isWin ? mp.totalWins + 1 : mp.totalWins;
        const losses = !isWin ? mp.totalLosses + 1 : mp.totalLosses;
        const closed = wins + losses;
        const winRate = closed > 0 ? parseFloat(((wins / closed) * 100).toFixed(1)) : 0;

        return {
          ...mp,
          currentBalance: newBal,
          totalRealizedPnL: totalNet,
          netROI,
          totalWins: wins,
          totalLosses: losses,
          totalTradesExecuted: mp.totalTradesExecuted + 1,
          fleetWinRate: winRate,
          activeStagedTradesCount: Math.max(0, prev.length - 1),
        };
      });

      // Update confirming bots statistics
      setBots(bList => bList.map(b => {
        if (trade.confirmingBotIds.includes(b.id)) {
          return {
            ...b,
            winTradesAssisted: isWin ? b.winTradesAssisted + 1 : b.winTradesAssisted,
            lossTradesAssisted: !isWin ? b.lossTradesAssisted + 1 : b.lossTradesAssisted,
          };
        }
        return b;
      }));

      // Add to audit logs with unique ID
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

      setAuditLogs(logs => deduplicateById([closedLog, ...logs]));
      return prev.filter(t => t.id !== tradeId);
    });
  }, []);

  // 4. Open New Consensus Staged Trade Action
  const handleExecuteStagedTrade = useCallback((
    initiatorBotId: string, 
    coinId: string, 
    direction: TradeDirection,
    explicitStage?: ConsensusStage
  ) => {
    const initiatorBot = bots.find(b => b.id === initiatorBotId) || bots[0];
    const coin = coins.find(c => c.id === coinId);
    if (!coin) return;

    // Detect all matching bot brains that confirm this setup
    const matchingBotIds = coin.matchingBots && coin.matchingBots.length > 0 
      ? coin.matchingBots 
      : [initiatorBot.id];

    // Ensure initiator bot is included
    const allConfirmingIds = Array.from(new Set([initiatorBot.id, ...matchingBotIds]));
    
    // Stage is determined by the number of confirming bots (1 to 5)
    const stage: ConsensusStage = explicitStage || (Math.min(5, Math.max(1, allConfirmingIds.length)) as ConsensusStage);
    
    const confirmingBots = bots.filter(b => allConfirmingIds.includes(b.id));
    const confirmingBotIds = confirmingBots.map(b => b.id);
    const confirmingBotNames = confirmingBots.map(b => `${b.number}. ${b.name}`);

    const params = calculateStagedTradeParameters(
      masterPortfolio.currentBalance,
      stage,
      initiatorBot,
      confirmingBots,
      coin,
      direction
    );

    const initialHistory = [{
      stage,
      timestamp: Date.now(),
      addedBotId: initiatorBot.id,
      addedBotName: `${initiatorBot.number}. ${initiatorBot.name}`,
      rationale: `Initiator signal discovered with ${confirmingBots.length} confirming bot brain${confirmingBots.length > 1 ? 's' : ''}.`,
      newLeverage: params.leverage,
      newMargin: params.margin,
    }];

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
      positionSize: params.positionSize,
      entryPrice: params.entryPrice,
      currentPrice: params.entryPrice,
      takeProfitPrice: params.takeProfitPrice,
      stopLossPrice: params.stopLossPrice,
      targetProfitUsd: params.targetProfitUsd,
      maxLossUsd: params.maxLossUsd,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      status: 'OPEN',
      entryTime: Date.now(),
      aiReasoning: params.aiReasoning,
      sentimentScore: coin.sentimentScore,
      stageHistory: initialHistory,
    };

    setActiveTrades(prev => deduplicateById([newTrade, ...prev]));

    setMasterPortfolio(mp => ({
      ...mp,
      activeStagedTradesCount: mp.activeStagedTradesCount + 1,
    }));

    // Send Telegram alert
    if (telegramConfig.notifyOnTradeOpen) {
      const msg = formatTelegramStageTradeOpen(newTrade);
      sendTelegramMessage(msg, 'TRADE_OPEN');
    }
  }, [bots, coins, masterPortfolio.currentBalance, telegramConfig, sendTelegramMessage]);

  // 5. Fetch Initial Market Stats & Live Feed
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/market/stats');
        const data = await res.json();
        if (data && data.totalMarketCap) {
          setMarketStats(data);
          setLiveFeedActive(true);
        }
      } catch (err) {
        console.warn('Market stats feed error:', err);
      }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 15000);
    return () => clearInterval(statsInterval);
  }, []);

  // 6. 24/7 Autonomous Price Tick & Execution Engine Loop with Live Market Integration
  useEffect(() => {
    if (!is247Running) return;

    const interval = setInterval(async () => {
      // 1. Fetch live prices from server / Binance cache
      const livePriceMap: Record<string, { price: number; change24h?: number }> = {};
      try {
        const res = await fetch('/api/market/live-prices');
        const data = await res.json();
        if (data.success && data.prices) {
          Object.keys(data.prices).forEach(sym => {
            const val = data.prices[sym];
            if (typeof val === 'object' && val !== null && 'price' in val) {
              livePriceMap[sym] = {
                price: Number(val.price) || 0,
                change24h: val.change24h !== undefined ? Number(val.change24h) : undefined,
              };
            } else if (typeof val === 'number') {
              livePriceMap[sym] = { price: val };
            }
          });
          setLiveFeedActive(true);
        }
      } catch (e) {
        // Fallback to internal dynamic moving volatility
      }

      // 2. Update coins state with live prices and subtle market flow
      setCoins(prevCoins => {
        return prevCoins.map(coin => {
          let newPrice = Number(coin.price) || 1;
          let newChange = Number(coin.change24h) || 0;

          if (livePriceMap[coin.symbol]) {
            const entry = livePriceMap[coin.symbol];
            if (entry.price > 0) newPrice = entry.price;
            if (entry.change24h !== undefined) newChange = entry.change24h;
          } else {
            const deltaPct = (Math.random() - 0.495) * 0.005; // +/- 0.25%
            const calculated = newPrice * (1 + deltaPct);
            newPrice = calculated >= 100 
              ? parseFloat(calculated.toFixed(2)) 
              : calculated >= 1 
                ? parseFloat(calculated.toFixed(4)) 
                : parseFloat(calculated.toFixed(6));
          }
          return {
            ...coin,
            price: newPrice,
            change24h: newChange,
          };
        });
      });

      // 3. Check active staged positions against updated coin prices
      setActiveTrades(prevTrades => {
        const remainingTrades: TradePosition[] = [];

        prevTrades.forEach(trade => {
          const symbolOnly = trade.symbol.split('/')[0];
          let currentPrice = trade.currentPrice;
          
          if (livePriceMap[symbolOnly] && livePriceMap[symbolOnly].price > 0) {
            currentPrice = livePriceMap[symbolOnly].price;
          } else {
            const latestCoin = coins.find(c => c.symbol === symbolOnly);
            if (latestCoin && Number(latestCoin.price) > 0) {
              currentPrice = Number(latestCoin.price);
            }
          }

          const isLong = trade.direction === 'LONG';
          const priceDiff = isLong ? (currentPrice - trade.entryPrice) : (trade.entryPrice - currentPrice);
          const priceChangeRatio = priceDiff / trade.entryPrice;
          
          const rawPnL = trade.positionSize * priceChangeRatio;
          const unrealizedPnL = parseFloat(rawPnL.toFixed(2));
          const unrealizedPnLPercent = parseFloat(((unrealizedPnL / trade.margin) * 100).toFixed(2));

          const updatedTrade: TradePosition = {
            ...trade,
            currentPrice,
            unrealizedPnL,
            unrealizedPnLPercent,
          };

          // Check TAKE PROFIT HIT
          const tpHit = isLong ? currentPrice >= trade.takeProfitPrice : currentPrice <= trade.takeProfitPrice;
          
          // Check STOP LOSS HIT
          const slHit = isLong ? currentPrice <= trade.stopLossPrice : currentPrice >= trade.stopLossPrice;

          if (tpHit) {
            // Take Profit Executed! Real price-driven realized profit
            const exactProfit = isLong 
              ? trade.positionSize * ((currentPrice - trade.entryPrice) / trade.entryPrice)
              : trade.positionSize * ((trade.entryPrice - currentPrice) / trade.entryPrice);
            const realizedProfit = parseFloat(Math.max(0.50, exactProfit).toFixed(2));
            const realizedProfitPercent = parseFloat(((realizedProfit / trade.margin) * 100).toFixed(2));

            const closedRecord: TradePosition = {
              ...updatedTrade,
              id: `audit-tp-${trade.id}-${Date.now()}`,
              status: 'CLOSED_TP',
              stageAtClose: trade.stage,
              closePrice: currentPrice,
              realizedPnL: realizedProfit,
              realizedPnLPercent: realizedProfitPercent,
              exitTime: Date.now(),
              exitReason: `🎯 Take-Profit Target Hit (Stage ${trade.stage} + $${realizedProfit.toFixed(2)} / +${realizedProfitPercent}% ROI)`,
            };

            // Update Master Portfolio
            setMasterPortfolio(mp => {
              const newBal = parseFloat((mp.currentBalance + realizedProfit).toFixed(2));
              const totalNet = parseFloat((newBal - mp.initialBase).toFixed(2));
              const netROI = parseFloat(((totalNet / mp.initialBase) * 100).toFixed(2));
              const wins = mp.totalWins + 1;
              const closed = wins + mp.totalLosses;
              const winRate = parseFloat(((wins / closed) * 100).toFixed(1));

              const updatedMp: MasterPortfolio = {
                ...mp,
                currentBalance: newBal,
                totalRealizedPnL: totalNet,
                netROI,
                totalWins: wins,
                totalTradesExecuted: mp.totalTradesExecuted + 1,
                fleetWinRate: winRate,
                activeStagedTradesCount: Math.max(0, prevTrades.length - 1),
              };

              if (telegramConfig.notifyOnTakeProfit) {
                const tgMsg = formatTelegramTPHit(closedRecord, updatedMp);
                sendTelegramMessage(tgMsg, 'TAKE_PROFIT');
              }

              return updatedMp;
            });

            // Update confirming bots
            setBots(bList => bList.map(b => {
              if (trade.confirmingBotIds.includes(b.id)) {
                return {
                  ...b,
                  winTradesAssisted: b.winTradesAssisted + 1,
                };
              }
              return b;
            }));

            setAuditLogs(logs => deduplicateById([closedRecord, ...logs]));

          } else if (slHit) {
            // Stop Loss Realized PnL based on actual price move
            const exactLoss = isLong 
              ? trade.positionSize * ((currentPrice - trade.entryPrice) / trade.entryPrice)
              : trade.positionSize * ((trade.entryPrice - currentPrice) / trade.entryPrice);
            const realizedLoss = parseFloat(Math.min(-0.50, exactLoss).toFixed(2));
            const realizedLossPercent = parseFloat(((realizedLoss / trade.margin) * 100).toFixed(2));
            
            // Trigger Autonomous Self-Learning & Evolution Engine!
            const evolution = analyzeTradeMistakeAndEvolve(
              updatedTrade, 
              bots, 
              masterPortfolio.evolutionGeneration
            );

            // Update Bots with New Heuristic Learning Note & Strategy Weights
            setBots(evolution.updatedBots);

            const closedRecord: TradePosition = {
              ...updatedTrade,
              id: `audit-sl-${trade.id}-${Date.now()}`,
              status: 'CLOSED_SL',
              stageAtClose: trade.stage,
              closePrice: currentPrice,
              realizedPnL: realizedLoss,
              realizedPnLPercent: realizedLossPercent,
              exitTime: Date.now(),
              exitReason: `🛑 Stop-Loss Hit (Stage ${trade.stage} - $${Math.abs(realizedLoss).toFixed(2)} / Master Capital Guarded)`,
              mistakeAnalysis: `Post-Mortem: ${evolution.learningNote.mistakeIdentified} | Rule Adjusted: ${evolution.learningNote.parameterAdjustment}`,
            };

            // Update Master Portfolio
            setMasterPortfolio(mp => {
              const newBal = parseFloat(Math.max(100, mp.currentBalance + realizedLoss).toFixed(2));
              const totalNet = parseFloat((newBal - mp.initialBase).toFixed(2));
              const netROI = parseFloat(((totalNet / mp.initialBase) * 100).toFixed(2));
              const losses = mp.totalLosses + 1;
              const closed = mp.totalWins + losses;
              const winRate = parseFloat(((mp.totalWins / closed) * 100).toFixed(1));

              const updatedMp: MasterPortfolio = {
                ...mp,
                currentBalance: newBal,
                totalRealizedPnL: totalNet,
                netROI,
                totalLosses: losses,
                totalTradesExecuted: mp.totalTradesExecuted + 1,
                fleetWinRate: winRate,
                evolutionGeneration: mp.evolutionGeneration + 1,
                selfLearningAdaptationsCount: mp.selfLearningAdaptationsCount + 1,
                activeStagedTradesCount: Math.max(0, prevTrades.length - 1),
              };

              if (telegramConfig.notifyOnStopLoss) {
                const tgMsg = formatTelegramSLHit(closedRecord, updatedMp, evolution.learningNote);
                sendTelegramMessage(tgMsg, 'STOP_LOSS');
              }

              return updatedMp;
            });

            setAuditLogs(logs => deduplicateById([closedRecord, ...logs]));

          } else {
            remainingTrades.push(updatedTrade);
          }
        });

        return remainingTrades;
      });

    }, 3500);

    return () => clearInterval(interval);
  }, [is247Running, coins, bots, masterPortfolio, telegramConfig, sendTelegramMessage]);

  // 7. Periodic Multi-Bot Consensus Scanner (Unlimited Trades + Dynamic Stage Escalation)
  useEffect(() => {
    if (!is247Running) return;

    const consensusScanner = setInterval(() => {
      if (coins.length === 0) return;

      // 1. Check if any running Stage 1-4 trade can be escalated to next stage
      const escalatableTrades = activeTrades.filter(t => t.stage < 5);
      if (escalatableTrades.length > 0 && Math.random() > 0.4) {
        const tradeToUpgrade = escalatableTrades[Math.floor(Math.random() * escalatableTrades.length)];
        const nextStage = (tradeToUpgrade.stage + 1) as ConsensusStage;
        
        // Pick a bot not yet in confirmingBotIds
        const remainingBots = bots.filter(b => !tradeToUpgrade.confirmingBotIds.includes(b.id));
        if (remainingBots.length > 0) {
          const addedBot = remainingBots[Math.floor(Math.random() * remainingBots.length)];
          const newConfirmingIds = [...tradeToUpgrade.confirmingBotIds, addedBot.id];
          const newConfirmingNames = [...tradeToUpgrade.confirmingBotNames, `${addedBot.number}. ${addedBot.name}`];
          const stageConfig = STAGE_CONFIGS[nextStage];

          const maxDynamicMargin = masterPortfolio.currentBalance * 0.05; // Strict 5% cap
          const rawMargin = Math.min(maxDynamicMargin, masterPortfolio.currentBalance * stageConfig.marginPercent);
          const newMargin = parseFloat(Math.max(5.00, rawMargin).toFixed(2));
          const newLeverage = stageConfig.defaultLeverage;
          const newPositionSize = parseFloat((newMargin * newLeverage).toFixed(2));

          // Strict 3% max loss cap
          const maxLossCeiling = masterPortfolio.currentBalance * 0.03;
          const newMaxLossUsd = parseFloat(Math.min(maxLossCeiling, Math.max(2.00, newMargin * 0.60)).toFixed(2));
          const newTargetProfitUsd = parseFloat(Math.max(2.50, newMaxLossUsd * stageConfig.rrRatio).toFixed(2));

          const historyEntry = {
            stage: nextStage,
            timestamp: Date.now(),
            addedBotId: addedBot.id,
            addedBotName: `${addedBot.number}. ${addedBot.name}`,
            rationale: `${addedBot.name} technical filter confirmed setup confluence. Escalated to Stage ${nextStage} (${newConfirmingIds.length} bots).`,
            newLeverage,
            newMargin,
          };

          setActiveTrades(prev => prev.map(t => {
            if (t.id === tradeToUpgrade.id) {
              const upgraded: TradePosition = {
                ...t,
                stage: nextStage,
                confirmingBotIds: newConfirmingIds,
                confirmingBotNames: newConfirmingNames,
                margin: newMargin,
                leverage: newLeverage,
                positionSize: newPositionSize,
                maxLossUsd: newMaxLossUsd,
                targetProfitUsd: newTargetProfitUsd,
                stageHistory: [...(t.stageHistory || []), historyEntry],
              };

              if (telegramConfig.notifyOnTradeOpen) {
                const tgMsg = formatTelegramStageUpgrade(upgraded, `${addedBot.number}. ${addedBot.name}`);
                sendTelegramMessage(tgMsg, 'TRADE_OPEN');
              }

              return upgraded;
            }
            return t;
          }));
          return;
        }
      }

      // 2. Discover new staged trades across 500 coin universe (Any bot can initiate)
      const randomCoin = coins[Math.floor(Math.random() * Math.min(coins.length, 100))];
      if (!randomCoin) return;

      const isAlreadyTraded = activeTrades.some(t => t.symbol.startsWith(randomCoin.symbol));
      if (!isAlreadyTraded) {
        const direction: TradeDirection = (randomCoin.sentimentScore > 10 || randomCoin.change24h > 0) ? 'LONG' : 'SHORT';
        // Any of the 5 bots can initiate Stage 1 trade
        const candidateBots = randomCoin.matchingBots && randomCoin.matchingBots.length > 0 
          ? randomCoin.matchingBots 
          : bots.map(b => b.id);
        const initiatorBotId = candidateBots[Math.floor(Math.random() * candidateBots.length)];
        
        handleExecuteStagedTrade(initiatorBotId, randomCoin.id, direction);
      }
    }, 14000); // Scans every 14 seconds

    return () => clearInterval(consensusScanner);
  }, [is247Running, activeTrades, coins, bots, masterPortfolio.currentBalance, telegramConfig, handleExecuteStagedTrade, sendTelegramMessage]);

  // 8. Action Handlers (100% Autonomous Zero-Permission Execution)
  const handleOpenManualTradeForBot = (bot: TradingBot) => {
    // Autonomously scan 500 coin universe and instantly fire live consensus staged trade
    const matchedCoin = coins.find(c => c.matchingBots.includes(bot.id)) || 
      coins[Math.floor(Math.random() * Math.min(coins.length, 50))];
    const direction: TradeDirection = (matchedCoin.sentimentScore > 10 || matchedCoin.change24h > 0) ? 'LONG' : 'SHORT';
    handleExecuteStagedTrade(bot.id, matchedCoin.id, direction);
  };

  const handleTradeCoinFromScanner = (coin: CryptoCoin, botId: string) => {
    const targetBot = bots.find(b => b.id === botId) || bots[0];
    const direction: TradeDirection = (coin.sentimentScore > 10 || coin.change24h > 0) ? 'LONG' : 'SHORT';
    handleExecuteStagedTrade(targetBot.id, coin.id, direction);
  };

  const handleToggleBotStatus = (botId: string) => {
    setBots(prev => prev.map(b => b.id === botId ? {
      ...b,
      status: b.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    } : b));
  };

  const handleResetPortfolio = () => {
    setMasterPortfolio({
      initialBase: 1000.00,
      currentBalance: 1000.00,
      totalRealizedPnL: 0,
      netROI: 0,
      totalWins: 0,
      totalLosses: 0,
      totalTradesExecuted: 0,
      fleetWinRate: 0,
      evolutionGeneration: 1,
      selfLearningAdaptationsCount: 0,
      activeStagedTradesCount: 0,
    });
    setBots(INITIAL_BOTS.map(b => ({
      ...b,
      winTradesAssisted: 0,
      lossTradesAssisted: 0,
      mistakesCount: 0,
      learningNotes: [],
    })));
    setActiveTrades([]);
    setUptimeSeconds(0);
    localStorage.setItem('ai_fleet_uptime_seconds_v2', '0');
    sendTelegramMessage(`🔄 *[PORTFOLIO RESET]*\nMaster Portfolio reset back to initial $1,000.00 base. 24/7 Autonomous consensus scanning resumed from 00:00:00.`, 'SYSTEM');
  };

  const handleRunLiveFleetScan = async () => {
    setIsScanning(true);
    try {
      const [pricesRes, statsRes] = await Promise.all([
        fetch('/api/market/live-prices'),
        fetch('/api/market/stats'),
      ]);
      const pricesData = await pricesRes.json();
      const statsData = await statsRes.json();

      if (statsData && statsData.totalMarketCap) {
        setMarketStats(statsData);
      }

      if (pricesData.success && pricesData.prices) {
        setCoins(prev => prev.map(coin => {
          const entry = pricesData.prices[coin.symbol];
          if (!entry) return coin;
          const priceVal = typeof entry === 'object' && entry !== null ? Number(entry.price) : Number(entry);
          const chgVal = typeof entry === 'object' && entry !== null && entry.change24h !== undefined ? Number(entry.change24h) : coin.change24h;
          return {
            ...coin,
            price: priceVal > 0 ? priceVal : coin.price,
            change24h: !isNaN(chgVal) ? chgVal : coin.change24h,
          };
        }));
      }
    } catch (e) {
      console.warn('Live scan error:', e);
      setCoins(generateTop500Universe());
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerGeminiPostMortem = async (botId: string, customText?: string) => {
    const bot = bots.find(b => b.id === botId) || bots[0];
    try {
      const res = await fetch('/api/ai/post-mortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: bot.name,
          strategyTitle: bot.strategyTitle,
          symbol: customText ? 'CUSTOM-ASSET' : 'SOL',
          direction: 'LONG',
          leverage: 14,
          entryPrice: 185.00,
          stopLossPrice: 174.00,
          lossAmount: 18.00,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newNote: BotLearningNote = {
          id: `learn-${Date.now()}`,
          timestamp: Date.now(),
          tradeId: `gemini-audit-${Date.now()}`,
          symbol: 'SOL',
          direction: 'LONG',
          stage: 3,
          lossAmount: 18.00,
          mistakeIdentified: data.mistakeIdentified,
          learnedLesson: data.learnedLesson,
          parameterAdjustment: data.parameterAdjustment,
          confidenceScore: 95,
          evolutionGeneration: masterPortfolio.evolutionGeneration + 1,
        };

        setBots(bList => bList.map(b => b.id === bot.id ? {
          ...b,
          mistakesCount: b.mistakesCount + 1,
          learningNotes: [newNote, ...b.learningNotes],
        } : b));

        setMasterPortfolio(mp => ({
          ...mp,
          evolutionGeneration: mp.evolutionGeneration + 1,
          selfLearningAdaptationsCount: mp.selfLearningAdaptationsCount + 1,
        }));
      }
    } catch (e) {
      console.error('Error invoking Gemini post-mortem:', e);
    }
  };

  const handleTestTelegramConnection = async (token: string, chatId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, chatId }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  };

  const handleSaveTelegramConfig = (token: string, chatId: string) => {
    setTelegramConfig(prev => ({
      ...prev,
      botToken: token,
      chatId: chatId,
      enabled: Boolean(token && chatId),
    }));
  };

  const handleSendFleetSummaryNow = async () => {
    setIsSendingTelegram(true);
    try {
      const summaryText = formatTelegramFleetSummary(masterPortfolio, activeTrades, bots);
      await sendTelegramMessage(summaryText, 'HOURLY_SUMMARY');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Header */}
      <Header
        bots={bots}
        activeTrades={activeTrades}
        auditLogs={auditLogs}
        masterPortfolio={masterPortfolio}
        telegramConfig={telegramConfig}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onSendTelegramSummary={handleSendFleetSummaryNow}
        is247Running={is247Running}
        setIs247Running={setIs247Running}
        nextSummarySeconds={nextSummarySeconds}
        isSendingTelegram={isSendingTelegram}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        
        {/* Fleet Master Portfolio & 24/7 Heartbeat Panel */}
        <FleetOverviewCard
          bots={bots}
          activeTrades={activeTrades}
          auditLogs={auditLogs}
          masterPortfolio={masterPortfolio}
          uptimeSeconds={uptimeSeconds}
          is247Running={is247Running}
          setIs247Running={setIs247Running}
          onOpenResetModal={() => setIsResetModalOpen(true)}
        />

        {/* Tab 0: Stage Performance Dashboard (Stages 1-5 Analytics) */}
        {activeTab === 'stages' && (
          <StagePerformanceView
            auditLogs={auditLogs}
            activeTrades={activeTrades}
            masterPortfolio={masterPortfolio}
          />
        )}

        {/* Tab 1: Live Active Staged Trades */}
        {activeTab === 'trades' && (
          <ActiveTradesView
            activeTrades={activeTrades}
            onCloseTrade={handleCloseTrade}
            onAskBrainRationale={async (trade) => {
              try {
                const res = await fetch('/api/ai/deep-analysis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    botName: trade.initiatorBotName,
                    strategyTitle: trade.initiatorBotName,
                    symbol: trade.symbol,
                    price: trade.currentPrice,
                    change24h: trade.unrealizedPnLPercent,
                    rsi: 54,
                    sentimentScore: trade.sentimentScore,
                    trend: 'BULLISH',
                    direction: trade.direction,
                  }),
                });
                const data = await res.json();
                if (data.reasoning) {
                  setActiveTrades(prev => prev.map(t => t.id === trade.id ? {
                    ...t,
                    aiReasoning: data.reasoning,
                  } : t));
                }
              } catch (e) {
                console.error(e);
              }
            }}
          />
        )}

        {/* Tab 2: 5 Specialist Consensus Brains */}
        {activeTab === 'bots' && (
          <BotsDashboard
            bots={bots}
            activeTrades={activeTrades}
            onManualTradeClick={handleOpenManualTradeForBot}
            onCloseTrade={handleCloseTrade}
            onToggleBotStatus={handleToggleBotStatus}
            onViewBrainLessons={() => {
              setActiveTab('brain');
            }}
          />
        )}

        {/* Tab 3: Top 500 Live Market Scanner */}
        {activeTab === 'scanner' && (
          <MarketScannerView
            coins={coins}
            bots={bots}
            marketStats={marketStats}
            liveFeedActive={liveFeedActive}
            onTradeCoinWithBot={handleTradeCoinFromScanner}
            onRunLiveFleetScan={handleRunLiveFleetScan}
            isScanning={isScanning}
          />
        )}

        {/* Tab 4: AI Brain & Self-Learning Engine */}
        {activeTab === 'brain' && (
          <MistakeLearningView
            bots={bots}
            onTriggerGeminiPostMortem={handleTriggerGeminiPostMortem}
          />
        )}

        {/* Tab 5: Trade Audit Logs */}
        {activeTab === 'audit' && (
          <AuditLogsView
            auditLogs={auditLogs}
            bots={bots}
          />
        )}

        {/* Tab 6: Telegram Hub & Live Alerts */}
        {activeTab === 'telegram' && (
          <TelegramHubView
            telegramConfig={telegramConfig}
            telegramLogs={telegramLogs}
            onOpenSetupModal={() => setIsTelegramModalOpen(true)}
            onSendTestMessage={async () => {
              if (!telegramConfig.botToken || !telegramConfig.chatId) {
                setIsTelegramModalOpen(true);
                return;
              }
              setIsSendingTelegram(true);
              try {
                await handleTestTelegramConnection(telegramConfig.botToken, telegramConfig.chatId);
              } finally {
                setIsSendingTelegram(false);
              }
            }}
            onSendFleetSummaryNow={handleSendFleetSummaryNow}
            onClearLogs={() => setTelegramLogs([])}
            onUpdateConfig={(conf) => setTelegramConfig(prev => ({ ...prev, ...conf }))}
            isSending={isSendingTelegram}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NEXUS FIVE Consensus Trading Fleet • Multi-Bot Staged Execution (Stages 1-5)</span>
          <span>$1,000 Master Portfolio • Autonomous Self-Learning & Heuristic Evolution • Gemini 3.7 Flash</span>
        </div>
      </footer>

      {/* Modals */}
      <TelegramSetupModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        config={telegramConfig}
        onSaveConfig={handleSaveTelegramConfig}
        onTestConnection={handleTestTelegramConnection}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetPortfolio}
      />

    </div>
  );
};

export default App;
