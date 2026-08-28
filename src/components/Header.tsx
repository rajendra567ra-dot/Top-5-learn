import React from 'react';
import { 
  Bot, 
  Activity, 
  Globe, 
  BrainCircuit, 
  History, 
  Send, 
  Settings, 
  RotateCcw, 
  Zap, 
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { TradingBot, TradePosition, TelegramConfig } from '../types';

interface HeaderProps {
  bots: TradingBot[];
  activeTrades: TradePosition[];
  auditLogs: TradePosition[];
  telegramConfig: TelegramConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTelegramModal: () => void;
  onOpenResetModal: () => void;
  onOpenExportModal: () => void;
  onSendTelegramSummary: () => void;
  is247Running: boolean;
  setIs247Running: (val: boolean | ((prev: boolean) => boolean)) => void;
  nextSummarySeconds: number;
  isSendingTelegram: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  bots,
  activeTrades,
  auditLogs,
  telegramConfig,
  activeTab,
  setActiveTab,
  onOpenTelegramModal,
  onOpenResetModal,
  onOpenExportModal,
  onSendTelegramSummary,
  is247Running,
  setIs247Running,
  nextSummarySeconds,
  isSendingTelegram,
}) => {
  const totalMistakes = bots.reduce((sum, b) => sum + b.mistakesCount, 0);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <header id="main-header" className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner / Title Area */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div id="fleet-logo-badge" className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  NEXUS FIVE <span className="text-blue-600 font-medium">• AI CLUSTER</span>
                </h1>
                <div 
                  id="live-status-indicator" 
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide flex items-center gap-1.5 border ${
                    is247Running 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${is247Running ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  24/7 {is247Running ? 'ACTIVE' : 'PAUSED'}
                </div>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                Autonomous Trading Node | 5 Specialist Bots ($100 Each) | 24/7 Monitoring
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="export-project-btn"
              onClick={onOpenExportModal}
              title="Download full project code, data, and VisiHost 24/7 PM2 deployment package"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-blue-100" />
              <span>Download for VisiHost (ZIP)</span>
            </button>

            <button
              id="reset-portfolio-btn"
              onClick={onOpenResetModal}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ($100 Base)</span>
            </button>

            <button
              id="send-telegram-summary-btn"
              onClick={onSendTelegramSummary}
              disabled={isSendingTelegram}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTelegram ? 'animate-spin' : ''}`} />
              <span>{isSendingTelegram ? 'Dispatching...' : 'Telegram Dispatch'}</span>
            </button>

            <button
              id="telegram-setup-btn"
              onClick={onOpenTelegramModal}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Uplink Config</span>
              {telegramConfig.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="tab-bots-btn"
            onClick={() => setActiveTab('bots')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'bots'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${activeTab === 'bots' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>5 Specialist Bots</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'bots' ? 'bg-slate-800 text-blue-300' : 'bg-slate-100 text-slate-600'
            }`}>5</span>
          </button>

          <button
            id="tab-trades-btn"
            onClick={() => setActiveTab('trades')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'trades'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${activeTab === 'trades' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Live Trades</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'trades' ? 'bg-slate-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {activeTrades.length}
            </span>
          </button>

          <button
            id="tab-scanner-btn"
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'scanner'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${activeTab === 'scanner' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Top 500 Market Scanner</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'scanner' ? 'bg-slate-800 text-cyan-300' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>500</span>
          </button>

          <button
            id="tab-brain-btn"
            onClick={() => setActiveTab('brain')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'brain'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${activeTab === 'brain' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>AI Brain & Mistake Learning</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'brain' ? 'bg-slate-800 text-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              {totalMistakes} Lessons
            </span>
          </button>

          <button
            id="tab-audit-btn"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <History className={`w-3.5 h-3.5 ${activeTab === 'audit' ? 'text-slate-300' : 'text-slate-400'}`} />
            <span>Trade Audit Logs</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'audit' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {auditLogs.length}
            </span>
          </button>

          <button
            id="tab-telegram-btn"
            onClick={() => setActiveTab('telegram')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-tight whitespace-nowrap transition-all flex items-center gap-2 border ${
              activeTab === 'telegram'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${activeTab === 'telegram' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>Telegram Hub</span>
          </button>
        </div>

        {/* Telegram Dispatch Countdown Bar */}
        <div id="telegram-status-bar" className="mt-3 py-1.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-slate-700 text-xs">
              Next Auto Telegram Dispatch: <strong className="text-slate-900 font-bold">{formatCountdown(nextSummarySeconds)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="hidden sm:inline">Cadence: {telegramConfig.summaryIntervalMinutes}m</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Dynamic 5% Compounding • Max 3% SL • $2+ Min TP
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
