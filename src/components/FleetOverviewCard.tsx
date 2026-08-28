import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Zap, 
  Clock, 
  Layers, 
  RotateCcw,
  Cpu,
  CheckCircle2,
  Download
} from 'lucide-react';
import { TradingBot, TradePosition } from '../types';

interface FleetOverviewCardProps {
  bots: TradingBot[];
  activeTrades: TradePosition[];
  auditLogs: TradePosition[];
  uptimeSeconds: number;
  is247Running: boolean;
  setIs247Running: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenResetModal: () => void;
  onOpenExportModal?: () => void;
}

export const FleetOverviewCard: React.FC<FleetOverviewCardProps> = ({
  bots,
  activeTrades,
  auditLogs,
  uptimeSeconds,
  is247Running,
  setIs247Running,
  onOpenResetModal,
  onOpenExportModal,
}) => {
  const initialBase = 500.00; // $100 * 5 bots
  const currentTotalBalance = bots.reduce((sum, b) => sum + b.balance, 0);
  const totalNetPnL = currentTotalBalance - initialBase;
  const netROI = (totalNetPnL / initialBase) * 100;

  const totalWins = bots.reduce((sum, b) => sum + b.winTrades, 0);
  const totalLosses = bots.reduce((sum, b) => sum + b.lossTrades, 0);
  const totalClosed = totalWins + totalLosses;
  const winRate = totalClosed > 0 ? (totalWins / totalClosed) * 100 : 0;

  const formatUptime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="fleet-overview-container" className="space-y-4">
      {/* 24/7 Engine Heartbeat Status Panel */}
      <div id="continuous-engine-card" className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-700 font-sans">
                  24/7 Continuous Autonomous Engine:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border ${
                  is247Running 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${is247Running ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {is247Running ? 'RUNNING UNINTERRUPTED' : 'EXECUTION PAUSED'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Worker Node: Online
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Local Sync: 100% Persisted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Background execution worker ensures market scanning, risk management, and Telegram dispatches operate uninterrupted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {onOpenExportModal && (
              <button
                id="panel-export-btn"
                onClick={onOpenExportModal}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                title="Download full project code & configs to host on VisiHost 24/7"
              >
                <Download className="w-3.5 h-3.5 text-blue-100" />
                <span>Export for VisiHost</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">FLEET 24/7 UPTIME</div>
              <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center justify-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {formatUptime(uptimeSeconds)}
              </div>
            </div>

            <button
              id="keepalive-toggle-btn"
              onClick={() => setIs247Running(prev => !prev)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-sans transition-all flex items-center gap-2 border shadow-xs ${
                is247Running
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>24/7 Keep-Alive: {is247Running ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Combined Portfolio Card */}
      <div id="total-portfolio-combined-card" className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Main Balance Display */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 font-mono">
                TOTAL PORTFOLIO COMBINED
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                5 BOTS FLEET ($100.00 EACH)
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-mono">
                ${currentTotalBalance.toFixed(2)}
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono flex items-center gap-1 ${
                totalNetPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {totalNetPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {totalNetPnL >= 0 ? '+' : ''}{netROI.toFixed(2)}% Net ROI
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>(Initial Base: <strong className="text-slate-800">$500.00 USDT</strong>)</span>
              <span>•</span>
              <span className="text-blue-700 font-medium">Dynamic 5% Compounding Margin</span>
              <span>•</span>
              <span className="text-amber-700 font-medium">Hard Capped Max 3% Stop-Loss</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Minimum $2.00+ Net Win Rule</span>
            </div>
          </div>

          {/* Quick Metrics Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 shrink-0">
            
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Closed Trades</div>
              <div className="text-lg font-black text-slate-900 font-mono mt-1">
                {totalClosed} <span className="text-xs font-normal text-slate-400">Trades</span>
              </div>
              <div className="text-xs font-bold font-mono mt-0.5 flex items-center gap-1">
                <span className="text-emerald-600">{totalWins}W</span>
                <span className="text-slate-400">/</span>
                <span className="text-rose-600">{totalLosses}L</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Fleet Win Rate</div>
              <div className="text-lg font-black text-slate-900 font-mono mt-1">
                {winRate.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${winRate}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Positions</div>
              <div className="text-lg font-black text-emerald-600 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeTrades.length} Running
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Across 5 Bots
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
