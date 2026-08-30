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
  totalMarketCap: number | string;
  volume24h: number | string;
  btcDominance: number;
  fearAndGreedIndex?: number;
  fearAndGreed?: number;
  fearAndGreedLabel?: string;
  activeCoins?: number;
  liveFeedStatus?: string;
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

export const App: React.FC = () => {
  // 1. Server-Authoritative State
  const [bots, setBots] = useState<TradingBot[]>(INITIAL_BOTS);
  const [masterPortfolio, setMasterPortfolio] = useState<MasterPortfolio>(INITIAL_MASTER_PORTFOLIO);
  const [activeTrades, setActiveTrades] = useState<TradePosition[]>(INITIAL_ACTIVE_TRADES);
  const [auditLogs, setAuditLogs] = useState<TradePosition[]>(INITIAL_AUDIT_LOGS);
  const [coins, setCoins] = useState<CryptoCoin[]>(() => generateTop500Universe());
  
  const [marketStats, setMarketStats] = useState<MarketStats | null>({
    totalMarketCap: '$2.62T',
    volume24h: '$84.2B',
    btcDominance: 59.5,
    fearAndGreed: 79,
    fearAndGreedLabel: 'Extreme Greed',
    liveFeedStatus: 'connected',
  });
  const [liveFeedActive, setLiveFeedActive] = useState<boolean>(true);

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
    summaryIntervalMinutes: 60,
    notifyOnTradeOpen: true,
    notifyOnTakeProfit: true,
    notifyOnStopLoss: true,
    notifyHourlySummary: true,
  });

  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>([
    {
      id: 'tg-init-start',
      timestamp: Date.now(),
      type: 'SYSTEM',
      target: '@CryptoFleetBot',
      message: `⚡ *[24/7 AUTONOMOUS STAGED FLEET ONLINE]*\n• Host: Cloud Datacenter Container\n• Master Capital: $1,000.00 USDT\n• 5 Specialist Bot Brains Running 24/7 in Background\n• Real-time Telegram Dispatch Active`,
      status: 'DISPATCHED',
    }
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<string>('stages');
  const [is247Running, setIs247RunningState] = useState<boolean>(true);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [nextSummarySeconds, setNextSummarySeconds] = useState<number>(3600);
  const [isSendingTelegram, setIsSendingTelegram] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Modals
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // -------------------------------------------------------------
  // 1. Real 24/7 Server State Synchronization
  // -------------------------------------------------------------
  const syncServerFleetState = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet/state');
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.success) {
        if (data.masterPortfolio) setMasterPortfolio(data.masterPortfolio);
        if (Array.isArray(data.bots) && data.bots.length > 0) setBots(data.bots);
        if (Array.isArray(data.activeTrades)) setActiveTrades(deduplicateById(data.activeTrades));
        if (Array.isArray(data.auditLogs)) setAuditLogs(deduplicateById(data.auditLogs));
        if (data.telegramConfig) setTelegramConfig(data.telegramConfig);
        if (Array.isArray(data.telegramLogs)) setTelegramLogs(data.telegramLogs);
        if (typeof data.uptimeSeconds === 'number') setUptimeSeconds(data.uptimeSeconds);
        if (typeof data.nextSummarySeconds === 'number') setNextSummarySeconds(data.nextSummarySeconds);
        if (typeof data.is247Running === 'boolean') setIs247RunningState(data.is247Running);
      }
    } catch (err) {
      console.warn('Sync server state warning:', err);
    }
  }, []);

  // Poll server state every 2.5 seconds
  useEffect(() => {
    syncServerFleetState();
    const interval = setInterval(syncServerFleetState, 2500);
    return () => clearInterval(interval);
  }, [syncServerFleetState]);

  // Client-side visual ticker for smooth 1-second increments
  useEffect(() => {
    if (!is247Running) return;
    const secondTimer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      setNextSummarySeconds(prev => (prev > 1 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(secondTimer);
  }, [is247Running]);

  // Fetch Market Stats & Live Feed
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, pricesRes] = await Promise.all([
          fetch('/api/market/stats'),
          fetch('/api/market/live-prices')
        ]);
        const statsData = await statsRes.json();
        const pricesData = await pricesRes.json();

        if (statsData && statsData.totalMarketCap) {
          setMarketStats(statsData);
          setLiveFeedActive(true);
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
      } catch (err) {
        console.warn('Market stats feed error:', err);
      }
    };

    fetchStats();
    const statsInterval = setInterval(fetchStats, 10000);
    return () => clearInterval(statsInterval);
  }, []);

  // -------------------------------------------------------------
  // 2. Action Handlers (Forwarded directly to 24/7 Cloud Server)
  // -------------------------------------------------------------

  const setIs247Running = async (value: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof value === 'function' ? value(is247Running) : value;
    setIs247RunningState(nextVal);
    try {
      await fetch('/api/fleet/toggle-247', { method: 'POST' });
      syncServerFleetState();
    } catch (e) {
      console.error('Error toggling 24/7 engine:', e);
    }
  };

  const handleCloseTrade = useCallback(async (tradeId: string) => {
    try {
      const res = await fetch('/api/fleet/trade/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });
      if (res.ok) {
        syncServerFleetState();
      }
    } catch (e) {
      console.error('Error closing trade:', e);
    }
  }, [syncServerFleetState]);

  const handleExecuteStagedTrade = useCallback(async (
    initiatorBotId: string, 
    coinId: string, 
    direction: TradeDirection,
    explicitStage?: ConsensusStage
  ) => {
    try {
      const res = await fetch('/api/fleet/trade/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiatorBotId,
          coinId,
          direction,
          explicitStage,
        }),
      });
      if (res.ok) {
        syncServerFleetState();
      }
    } catch (e) {
      console.error('Error opening trade:', e);
    }
  }, [syncServerFleetState]);

  const handleOpenManualTradeForBot = (bot: TradingBot) => {
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

  const handleResetPortfolio = async () => {
    try {
      await fetch('/api/fleet/reset', { method: 'POST' });
      await syncServerFleetState();
      setIsResetModalOpen(false);
    } catch (e) {
      console.error('Error resetting portfolio:', e);
    }
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
      if (data.success) {
        await syncServerFleetState();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSaveTelegramConfig = async (token: string, chatId: string) => {
    try {
      const res = await fetch('/api/fleet/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: token,
          chatId: chatId,
          enabled: Boolean(token && chatId),
        }),
      });
      if (res.ok) {
        await syncServerFleetState();
      }
    } catch (e) {
      console.error('Error saving telegram config to server:', e);
    }
  };

  const handleSendFleetSummaryNow = async () => {
    setIsSendingTelegram(true);
    try {
      const summaryText = formatTelegramFleetSummary(masterPortfolio, activeTrades, bots);
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summaryText,
          type: 'HOURLY_SUMMARY',
        }),
      });
      await syncServerFleetState();
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
            marketStats={marketStats as any}
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
            masterPortfolio={masterPortfolio}
            auditLogs={auditLogs}
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
            onUpdateConfig={async (conf) => {
              const updated = { ...telegramConfig, ...conf };
              setTelegramConfig(updated);
              try {
                await fetch('/api/fleet/telegram-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updated),
                });
                await syncServerFleetState();
              } catch (e) {
                console.error(e);
              }
            }}
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
