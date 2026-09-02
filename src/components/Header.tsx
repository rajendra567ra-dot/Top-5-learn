import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  TrendingUp, 
  Activity, 
  Search, 
  Brain, 
  Send, 
  RotateCcw, 
  Play, 
  Pause, 
  Clock, 
  ShieldCheck, 
  DollarSign 
} from 'lucide-react';
import { ActiveViewMode, ArenaFleetState } from '../types';

interface HeaderProps {
  state: ArenaFleetState;
  activeView: ActiveViewMode;
  onSelectView: (view: ActiveViewMode) => void;
  onToggleScan: () => void;
  onOpenResetModal: () => void;
  onOpenTelegramModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeView,
  onSelectView,
  onToggleScan,
  onOpenResetModal,
  onOpenTelegramModal,
}) => {
  const [uptimeStr, setUptimeStr] = useState<string>('00:00:00');

  useEffect(() => {
    const updateUptime = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - state.serverBootTimestamp) / 1000));
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;

      if (days > 0) {
        setUptimeStr(`${days}d ${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
      } else {
        setUptimeStr(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  }, [state.serverBootTimestamp]);

  const pnlIsPositive = state.totalArenaPnL >= 0;

  return (
    <header id="arena-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      {/* Top Banner & Quick Metrics Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Apex 40 AI Crypto Bot Arena
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  40 BOTS LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                <span>Multi-Timeframe 10-Indicator Confirmation</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-700 font-mono">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  24/7 Cloud Uptime: <strong className="text-cyan-700 font-bold">{uptimeStr}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Global Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Total Balance Metric */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Arena Capital</div>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  ${state.totalArenaBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={`text-xs ml-1.5 font-semibold ${pnlIsPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({pnlIsPositive ? '+' : ''}${state.totalArenaPnL.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Win Rate Metric */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Arena Win Rate</div>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {state.arenaWinRate}%
                  <span className="text-xs ml-1 text-slate-500 font-normal">
                    ({state.totalArenaWins}W / {state.totalArenaLosses}L)
                  </span>
                </div>
              </div>
            </div>

            {/* Active Trades Pill */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Live Trades</div>
                <div className="text-sm font-bold text-amber-700 font-mono">
                  {state.activeTrades.length} Positions
                </div>
              </div>
            </div>

            {/* Scanning Toggle Button */}
            <button
              id="header-toggle-scan-btn"
              onClick={onToggleScan}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
                state.isScanningActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              {state.isScanningActive ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
                  <span>Scanner Active</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Scanner Paused</span>
                </>
              )}
            </button>

            {/* Reset Arena Button */}
            <button
              id="header-reset-arena-btn"
              onClick={onOpenResetModal}
              title="Reset all 40 bots to fresh $100 accounts"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset $100 Accs</span>
            </button>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-200 mt-3 scrollbar-none">
          
          <button
            id="nav-tab-arena"
            onClick={() => onSelectView('ARENA_HOME')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeView === 'ARENA_HOME'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>40 Bots Arena</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${activeView === 'ARENA_HOME' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              40
            </span>
          </button>

          <button
            id="nav-tab-live-trades"
            onClick={() => onSelectView('LIVE_TRADES')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeView === 'LIVE_TRADES'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Trades & Multi-Tier TP</span>
            {state.activeTrades.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${activeView === 'LIVE_TRADES' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                {state.activeTrades.length}
              </span>
            )}
          </button>

          <button
            id="nav-tab-cmc500"
            onClick={() => onSelectView('CMC_500')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeView === 'CMC_500'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>CMC 500 Market Scanner</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${activeView === 'CMC_500' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {state.coins.length} Coins
            </span>
          </button>

          <button
            id="nav-tab-learning"
            onClick={() => onSelectView('MISTAKE_LEARNING')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeView === 'MISTAKE_LEARNING'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Brains & Mistake Memory</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${activeView === 'MISTAKE_LEARNING' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {state.learningCyclesCompleted} Evolutions
            </span>
          </button>

          <button
            id="nav-tab-telegram"
            onClick={() => onSelectView('TELEGRAM_HUB')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeView === 'TELEGRAM_HUB'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram 1-Hour Alerts</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
