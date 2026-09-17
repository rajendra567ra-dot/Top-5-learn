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

// LocalStorage persistence helpers for client-side resilience across cloud deployments & restarts
const STORAGE_DELETED_KEY = 'apex_arena_deleted_bots';
const STORAGE_PAUSED_KEY = 'apex_arena_paused_bots';
const STORAGE_CUSTOM_KEY = 'apex_arena_custom_bots';

function getStoredDeletedBots(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveStoredDeletedBots(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function getStoredPausedBots(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PAUSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveStoredPausedBots(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PAUSED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function getStoredCustomBots(): ArenaBot[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCustomBots(bots: ArenaBot[]) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(bots));
  } catch {}
}

export const App: React.FC = () => {
  const [state, setState] = useState<ArenaFleetState>(() => {
    const initialBots = [...INITIAL_ARENA_BOTS];
    const deleted = getStoredDeletedBots();
    const paused = getStoredPausedBots();
    const custom = getStoredCustomBots();

    let combined = initialBots.filter(b => !deleted.has(b.id) && !deleted.has(b.serialNumber));
    custom.forEach(cb => {
      if (!combined.some(b => b.id === cb.id || b.serialNumber === cb.serialNumber) && !deleted.has(cb.id) && !deleted.has(cb.serialNumber)) {
        combined.push(cb);
      }
    });

    combined = combined.map(b => {
      if (paused.has(b.id) || paused.has(b.serialNumber)) {
        return { ...b, status: 'PAUSED' as const };
      }
      return b;
    });

    return {
      bots: combined,
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
      totalArenaBalance: combined.reduce((sum, b) => sum + b.portfolioBalance, 0),
      totalArenaPnL: 0.0,
      totalArenaTrades: 0,
      totalArenaWins: 0,
      totalArenaLosses: 0,
      arenaWinRate: 0,
      isScanningActive: true,
      learningCyclesCompleted: 0,
    };
  });

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
          // Bulletproof 300+ Universe Guarantee
          if (!json.data.coins || json.data.coins.length < 300) {
            const fullUniverse = generateTop500Universe();
            const serverMap = new Map<string, any>((json.data.coins || []).map((c: any) => [c.symbol, c]));
            json.data.coins = fullUniverse.map((coin) => {
              const live = serverMap.get(coin.symbol);
              return live && typeof live === 'object' ? { ...coin, ...(live as Record<string, unknown>) } : coin;
            });
            fetch('/api/arena/universe/refresh', { method: 'POST' }).catch(() => {});
          }

          // Reconcile with client storage (persisting user custom bots, deleted bots, and paused states across cloud deployments)
          const deleted = getStoredDeletedBots();
          const paused = getStoredPausedBots();
          const custom = getStoredCustomBots();

          let serverBots: ArenaBot[] = (json.data.bots || []).filter(
            (b: ArenaBot) => !deleted.has(b.id) && !deleted.has(b.serialNumber)
          );

          // Merge client custom bots if container restarted without them
          let needServerSync = false;
          custom.forEach((cb: ArenaBot) => {
            if (!deleted.has(cb.id) && !deleted.has(cb.serialNumber)) {
              const exists = serverBots.some(b => b.id === cb.id || b.serialNumber === cb.serialNumber);
              if (!exists) {
                serverBots.push(cb);
                needServerSync = true;
              }
            }
          });

          // Apply client-side paused flags
          serverBots = serverBots.map(b => {
            if (paused.has(b.id) || paused.has(b.serialNumber)) {
              return { ...b, status: 'PAUSED' as const };
            }
            return b;
          });

          json.data.bots = serverBots;

          // Asynchronously sync client modifications if backend restarted
          if (needServerSync || paused.size > 0 || deleted.size > 0) {
            fetch('/api/arena/bot/sync-client', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customBots: custom,
                pausedBotIds: Array.from(paused),
                deletedBotIds: Array.from(deleted),
              }),
            }).catch(() => {});
          }

          setState(json.data);

          // Keep selected bot in sync ONLY if modal is currently active
          const activeId = selectedBotIdRef.current;
          if (activeId) {
            const updated = serverBots.find((b: ArenaBot) => b.id === activeId || b.serialNumber === activeId);
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
      // Clear client local storage overrides on manual reset
      localStorage.removeItem(STORAGE_DELETED_KEY);
      localStorage.removeItem(STORAGE_PAUSED_KEY);
      localStorage.removeItem(STORAGE_CUSTOM_KEY);

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

  // Toggle Bot Status (Active / Paused) - Instant Optimistic UI + Server Sync + LocalStorage
  const handleToggleBotStatus = async (botId: string) => {
    const targetBot = state.bots.find(b => b.id === botId || b.serialNumber === botId);
    if (!targetBot) return;

    const newStatus = targetBot.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';

    // 1. Optimistic immediate UI update
    setState(prev => {
      const updatedBots = prev.bots.map(b => {
        if (b.id === targetBot.id || b.serialNumber === targetBot.serialNumber) {
          return { ...b, status: newStatus };
        }
        return b;
      });
      return { ...prev, bots: updatedBots };
    });

    if (selectedBot && (selectedBot.id === targetBot.id || selectedBot.serialNumber === targetBot.serialNumber)) {
      setSelectedBot(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // 2. Persist to localStorage
    const paused = getStoredPausedBots();
    if (newStatus === 'PAUSED') {
      paused.add(targetBot.id);
      paused.add(targetBot.serialNumber);
    } else {
      paused.delete(targetBot.id);
      paused.delete(targetBot.serialNumber);
    }
    saveStoredPausedBots(paused);

    showToast(`Bot ${targetBot.name} (${targetBot.serialNumber}) is now ${newStatus}.`);

    // 3. Dispatch to server
    try {
      const res = await fetch('/api/arena/bot/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: targetBot.id }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setState(json.data);
        }
      }
    } catch (err) {
      console.warn('Backend sync deferred (optimistic state active):', err);
    }
  };

  // Delete Bot - Instant Optimistic UI + Server Sync + LocalStorage
  const handleDeleteBot = async (botId: string) => {
    const targetBot = state.bots.find(b => b.id === botId || b.serialNumber === botId);
    if (!targetBot) return;

    // 1. Optimistic immediate UI update
    setState(prev => {
      const updatedBots = prev.bots.filter(b => b.id !== targetBot.id && b.serialNumber !== targetBot.serialNumber);
      const updatedActiveTrades = prev.activeTrades.filter(
        t => t.botId !== targetBot.id && t.botSerialNumber !== targetBot.serialNumber
      );
      const totalInit = updatedBots.reduce((sum, b) => sum + (b.initialBalance || 100.00), 0);
      const totalBal = updatedBots.reduce((sum, b) => sum + b.portfolioBalance, 0);

      return {
        ...prev,
        bots: updatedBots,
        activeTrades: updatedActiveTrades,
        totalArenaBalance: parseFloat(totalBal.toFixed(2)),
        totalArenaPnL: parseFloat((totalBal - totalInit).toFixed(2)),
      };
    });

    if (selectedBotIdRef.current === targetBot.id || selectedBotIdRef.current === targetBot.serialNumber) {
      selectedBotIdRef.current = null;
      setSelectedBot(null);
    }

    // 2. Persist to localStorage
    const deleted = getStoredDeletedBots();
    deleted.add(targetBot.id);
    deleted.add(targetBot.serialNumber);
    saveStoredDeletedBots(deleted);

    const paused = getStoredPausedBots();
    paused.delete(targetBot.id);
    paused.delete(targetBot.serialNumber);
    saveStoredPausedBots(paused);

    const custom = getStoredCustomBots().filter(
      cb => cb.id !== targetBot.id && cb.serialNumber !== targetBot.serialNumber
    );
    saveStoredCustomBots(custom);

    showToast(`Bot ${targetBot.name} (${targetBot.serialNumber}) deleted successfully.`);

    // 3. Dispatch to server
    try {
      const res = await fetch('/api/arena/bot/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: targetBot.id }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setState(json.data);
        }
      }
    } catch (err) {
      console.warn('Backend delete sync deferred (optimistic removal active):', err);
    }
  };

  // Create Combination Bot - Instant Optimistic UI + Server Sync + LocalStorage
  const handleCreateCombinationBot = async (data: {
    name: string;
    parentAId: string;
    parentBId: string;
    customSerialNumber?: string;
  }) => {
    const parentA = state.bots.find(b => b.id === data.parentAId || b.serialNumber === data.parentAId);
    const parentB = state.bots.find(b => b.id === data.parentBId || b.serialNumber === data.parentBId);
    if (!parentA || !parentB) return;

    // Determine serial number
    let serial = data.customSerialNumber && data.customSerialNumber.trim().length > 0
      ? data.customSerialNumber.trim().toUpperCase()
      : '';
    if (!serial) {
      const nums = state.bots
        .map(b => parseInt(b.serialNumber.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
      const maxNum = nums.length > 0 ? Math.max(...nums) : 40;
      serial = `BOT-${String(maxNum + 1).padStart(2, '0')}`;
    }

    const botName = data.name && data.name.trim().length > 0
      ? data.name.trim()
      : `Dual-Consensus (${parentA.serialNumber}.${parentA.name} + ${parentB.serialNumber}.${parentB.name})`;

    // 1. Build new combination bot object
    const newBot: ArenaBot = {
      id: `bot-combo-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
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
          ...new Set([...(parentA.aiBrain?.antiRepeatRulesActive || []), ...(parentB.aiBrain?.antiRepeatRulesActive || [])])
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

    // 2. Optimistic immediate UI update
    setState(prev => ({
      ...prev,
      bots: [...prev.bots, newBot],
      totalArenaBalance: parseFloat((prev.totalArenaBalance + 100.00).toFixed(2)),
    }));

    // 3. Save to localStorage
    const custom = getStoredCustomBots();
    custom.push(newBot);
    saveStoredCustomBots(custom);

    showToast(`Dual-Consensus Bot ${newBot.serialNumber} created with $100 starting balance.`);

    // 4. Dispatch to server
    try {
      const res = await fetch('/api/arena/bot/create-combination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: botName,
          parentAId: parentA.id,
          parentBId: parentB.id,
          customSerialNumber: serial,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setState(json.data);
        }
      }
    } catch (err) {
      console.warn('Backend create sync deferred (optimistic bot active):', err);
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
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        showToast(json.message || 'Hourly 1-Hour Report successfully delivered to Telegram!');
      } else {
        showToast(json.message || 'Telegram delivery failed. Please check your credentials.');
      }
      fetchState();
    } catch (err: any) {
      console.error(err);
      showToast('Network error triggering hourly report.');
    }
  };

  // Send Test Telegram Ping
  const handleSendTest = async () => {
    try {
      const res = await fetch('/api/arena/telegram/test', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        showToast(json.message || 'Test ping delivered to Telegram!');
      } else {
        showToast(json.message || 'Telegram test failed. Please check Bot Token & Chat ID.');
      }
      fetchState();
    } catch (err: any) {
      console.error(err);
      showToast('Network error sending test ping.');
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
        onToggleBotStatus={handleToggleBotStatus}
        onDeleteBot={handleDeleteBot}
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
