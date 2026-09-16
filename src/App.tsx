import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArenaFleetState, 
  ArenaBot, 
  ActiveViewMode, 
  TelegramConfig 
} from './types';
import { INITIAL_ARENA_BOTS } from './data/arenaBots';
import { generateTop500Universe } from './data/topCoins';
import { Header } from './components/Header';
import { ArenaBotsView } from './components/ArenaBotsView';
import { LiveTradesView } from './components/LiveTradesView';
import { CMCScannerView } from './components/CMCScannerView';
import { AIBrainHubView } from './components/AIBrainHubView';
import { TelegramHubView } from './components/TelegramHubView';
import { BotDetailModal } from './components/BotDetailModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

export const App: React.FC = () => {
  const [state, setState] = useState<ArenaFleetState>(() => ({
    bots: INITIAL_ARENA_BOTS,
    activeTrades: [],
    closedTrades: [],
    coins: generateTop500Universe(),
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
    telegramLogs: [],
    serverBootTimestamp: Date.now(),
    lastScanTimestamp: Date.now(),
    lastHourlySummaryTimestamp: Date.now(),
    totalArenaBalance: 4000.00,
    totalArenaPnL: 0.0,
    totalArenaTrades: 0,
    totalArenaWins: 0,
    totalArenaLosses: 0,
    arenaWinRate: 0,
    isScanningActive: true,
    learningCyclesCompleted: 0,
  }));

  const [activeView, setActiveView] = useState<ActiveViewMode>('ARENA_HOME');
  const [selectedBot, setSelectedBot] = useState<ArenaBot | null>(null);
  const selectedBotIdRef = React.useRef<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectBot = (bot: ArenaBot | null) => {
    selectedBotIdRef.current = bot ? bot.id : null;
    setSelectedBot(bot);
  };

  const handleReturnHome = () => {
    selectedBotIdRef.current = null;
    setSelectedBot(null);
    setActiveView('ARENA_HOME');
  };

  // Poll backend state every 2 seconds
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/state');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setState(json.data);
          // Keep selected bot in sync ONLY if modal is currently active
          const activeId = selectedBotIdRef.current;
          if (activeId) {
            const updated = json.data.bots.find((b: ArenaBot) => b.id === activeId);
            if (updated && selectedBotIdRef.current === activeId) {
              setSelectedBot(updated);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync state from backend:', err);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Toggle Autonomous Scanner
  const handleToggleScan = async () => {
    try {
      const res = await fetch('/api/arena/scan/toggle', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setState(prev => ({ ...prev, isScanningActive: json.isScanningActive }));
        showToast(json.isScanningActive ? 'Autonomous Scanner Resumed' : 'Autonomous Scanner Paused');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Arena to fresh $100 accounts
  const handleConfirmReset = async () => {
    try {
      const res = await fetch('/api/arena/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setState(json.data);
        showToast('Arena reset completed! Starting balances set to $100. AI Brain lessons learned remain 100% preserved.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Bot Status (Active / Paused)
  const handleToggleBotStatus = async (botId: string) => {
    try {
      const res = await fetch('/api/arena/bot/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });
      if (res.ok) {
        const json = await res.json();
        setState(json.data);
        showToast(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Bot
  const handleDeleteBot = async (botId: string) => {
    try {
      const res = await fetch('/api/arena/bot/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });
      if (res.ok) {
        const json = await res.json();
        setState(json.data);
        showToast(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Combination Bot
  const handleCreateCombinationBot = async (data: {
    name: string;
    parentAId: string;
    parentBId: string;
    customSerialNumber?: string;
  }) => {
    try {
      const res = await fetch('/api/arena/bot/create-combination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setState(json.data);
        showToast(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close Live Trade manually
  const handleCloseTrade = async (tradeId: string) => {
    try {
      const res = await fetch('/api/arena/trade/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });
      if (res.ok) {
        const json = await res.json();
        setState(json.data);
        showToast('Trade position closed manually.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Telegram Config
  const handleUpdateTelegramConfig = async (config: Partial<TelegramConfig>) => {
    try {
      const res = await fetch('/api/arena/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const json = await res.json();
        setState(prev => ({ ...prev, telegramConfig: json.config }));
        showToast('Telegram configuration updated successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Hourly Telegram Report Now
  const handleTriggerHourly = async () => {
    try {
      const res = await fetch('/api/arena/telegram/hourly-trigger', { method: 'POST' });
      if (res.ok) {
        showToast('Hourly Top 10 Bots Summary dispatched to Telegram.');
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Test Telegram Ping
  const handleSendTest = async () => {
    try {
      const res = await fetch('/api/arena/telegram/test', { method: 'POST' });
      if (res.ok) {
        showToast('Test ping sent to Telegram relay.');
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-600 selection:text-white">
      
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Nav Tabs */}
      <Header
        state={state}
        activeView={activeView}
        onSelectView={setActiveView}
        onToggleScan={handleToggleScan}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenTelegramModal={() => setActiveView('TELEGRAM_HUB')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {activeView === 'ARENA_HOME' && (
          <ArenaBotsView
            bots={state.bots}
            onSelectBot={handleSelectBot}
            onToggleBotStatus={handleToggleBotStatus}
            onDeleteBot={handleDeleteBot}
            onCreateCombinationBot={handleCreateCombinationBot}
          />
        )}

        {activeView === 'LIVE_TRADES' && (
          <LiveTradesView
            activeTrades={state.activeTrades}
            closedTrades={state.closedTrades}
            onCloseTrade={handleCloseTrade}
          />
        )}

        {activeView === 'CMC_500' && (
          <CMCScannerView
            coins={state.coins}
            isScanningActive={state.isScanningActive}
          />
        )}

        {activeView === 'MISTAKE_LEARNING' && (
          <AIBrainHubView
            bots={state.bots}
            learningCyclesCompleted={state.learningCyclesCompleted}
            onReturnHome={handleReturnHome}
            onSelectBot={handleSelectBot}
          />
        )}

        {activeView === 'TELEGRAM_HUB' && (
          <TelegramHubView
            state={state}
            onUpdateConfig={handleUpdateTelegramConfig}
            onSendTest={handleSendTest}
            onTriggerHourly={handleTriggerHourly}
          />
        )}
      </main>

      {/* Modals */}
      <BotDetailModal
        bot={selectedBot}
        activeTrades={state.activeTrades}
        closedTrades={state.closedTrades}
        onClose={() => handleSelectBot(null)}
        onReturnHome={handleReturnHome}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
};

export default App;
