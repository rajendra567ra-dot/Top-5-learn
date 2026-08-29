import React, { useState } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Bot, 
  Award, 
  Target, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { TradePosition, StagePerformanceStats, MasterPortfolio, ConsensusStage } from '../types';
import { computeStagePerformanceStats, STAGE_CONFIGS } from '../services/tradingEngine';

interface StagePerformanceViewProps {
  auditLogs: TradePosition[];
  masterPortfolio: MasterPortfolio;
  onSelectStageFilter?: (stage: ConsensusStage | 'ALL') => void;
}

export const StagePerformanceView: React.FC<StagePerformanceViewProps> = ({
  auditLogs,
  masterPortfolio,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<ConsensusStage | 'ALL'>('ALL');
  const stageStats: StagePerformanceStats[] = computeStagePerformanceStats(auditLogs);

  const filteredLogs = selectedStageFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter(t => (t.stageAtClose || t.stage) === selectedStageFilter);

  return (
    <div id="stage-performance-dashboard" className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
                  Consensus Stage Performance Dashboard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Multi-Bot Consensus Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Trades are executed stage-wise based on fleet confirmation. When 1 bot finds a signal, it enters Stage 1. 
                As additional specialist bots validate the thesis, the trade escalates through Stages 2, 3, 4, and 5 with increasing capital allocation and dynamic leverage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Master Fleet Capital</div>
              <div className="text-lg font-black text-slate-900">
                ${masterPortfolio.currentBalance.toFixed(2)} <span className="text-xs font-normal text-slate-500">USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Stage-Wise Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stageStats.map(stat => {
          const config = STAGE_CONFIGS[stat.stage];
          const isSelected = selectedStageFilter === stat.stage;

          return (
            <div
              key={stat.stage}
              id={`stage-card-${stat.stage}`}
              onClick={() => setSelectedStageFilter(stat.stage === selectedStageFilter ? 'ALL' : stat.stage)}
              className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-center justify-between">
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase font-mono"
                    style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                  >
                    Stage {stat.stage}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {stat.botsRequiredText}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2 font-sans">
                  {stat.stageLabel}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {stat.description}
                </p>

                {/* Primary Win Rate Metric */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">Win Rate</span>
                    <span className={`text-xl font-black font-mono ${stat.winRate >= 70 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {stat.winRate.toFixed(1)}%
                    </span>
                  </div>

                  {/* Visual Win Rate Progress */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, stat.winRate))}%`,
                        backgroundColor: config.accentColor 
                      }}
                    />
                  </div>
                </div>

                {/* Sub-Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Trades</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {stat.totalTrades} <span className="text-[10px] text-emerald-600 font-semibold">({stat.wins}W/{stat.losses}L)</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Realized PnL</div>
                    <div className={`font-mono font-bold mt-0.5 ${stat.totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.totalRealizedPnL >= 0 ? '+' : ''}${stat.totalRealizedPnL.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Avg ROI</div>
                    <div className={`font-mono font-bold mt-0.5 ${stat.avgRoiPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stat.avgRoiPercent >= 0 ? '+' : ''}{stat.avgRoiPercent.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Avg Leverage</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {stat.avgLeverage}x
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Allocation Badge */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Margin Allocation:</span>
                <span className="font-mono font-bold text-slate-700">
                  {(config.marginPercent * 100).toFixed(1)}% (${(masterPortfolio.initialBase * config.marginPercent).toFixed(0)})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Progression & Consensus Mechanics Explanation */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 font-sans">
            How Multi-Bot Consensus & Staged Execution Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Stage 1 (Any 1 Bot)
            </div>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Initial signal discovered by ANY of the 5 bots. Enters with 1.5% margin ($15 on $1K) & 5x leverage. Max 3% loss strictly guarded.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100 text-xs">
            <div className="font-bold text-cyan-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Stage 2 (Any 2 Bots)
            </div>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Any 2 bot brains reach setup confluence. Escalates margin to 2.5% ($25 on $1K) & 8x leverage.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Stage 3 (Any 3 Bots)
            </div>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Majority consensus across any 3 bot brains. Scales margin to 3.5% ($35 on $1K) & 14x leverage with expanded R:R.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
              Stage 4 (Any 4 Bots)
            </div>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Near-unanimous 4-bot validation. High conviction momentum. Scales margin to 4.5% ($45 on $1K) & 18x leverage.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
              Stage 5 (All 5 Bots)
            </div>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              Unanimous 5-Bot maximum consensus. Highest allocation strictly capped at 5.0% dynamic capital ($50 on $1K) & 25x leverage.
            </p>
          </div>
        </div>
      </div>

      {/* Filtered Completed Trades Table by Stage */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900 font-sans">
              Completed Trades History (Stage Filter: {selectedStageFilter === 'ALL' ? 'All Stages' : `Stage ${selectedStageFilter}`})
            </h3>
          </div>

          {/* Quick Stage Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedStageFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                selectedStageFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ALL ({auditLogs.length})
            </button>
            {([1, 2, 3, 4, 5] as ConsensusStage[]).map(stg => (
              <button
                key={stg}
                onClick={() => setSelectedStageFilter(stg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                  selectedStageFilter === stg
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Stage {stg} ({auditLogs.filter(t => (t.stageAtClose || t.stage) === stg).length})
              </button>
            ))}
          </div>
        </div>

        {/* Table / Cards */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No completed trades recorded for Stage {selectedStageFilter} yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase font-bold text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Stage / Pair</th>
                  <th className="py-2.5 px-3">Side & Lev</th>
                  <th className="py-2.5 px-3">Confirming Bots</th>
                  <th className="py-2.5 px-3 text-right">Entry / Exit</th>
                  <th className="py-2.5 px-3 text-right">Realized PnL</th>
                  <th className="py-2.5 px-3">Exit Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map((trade, tradeIdx) => {
                  const stage = trade.stageAtClose || trade.stage;
                  const config = STAGE_CONFIGS[stage];
                  const isWin = (trade.realizedPnL || 0) >= 0;

                  return (
                    <tr key={`${trade.id}-${tradeIdx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                          >
                            Stage {stage}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{trade.symbol}</div>
                            <div className="text-[10px] text-slate-400 font-sans font-normal">{trade.name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.direction === 'LONG' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {trade.direction} {trade.leverage}x
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Margin: ${trade.margin.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex items-center gap-1 flex-wrap">
                          {trade.confirmingBotNames.map((name, i) => (
                            <span key={`${trade.id}-bot-${i}`} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                              {name.split('.')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="text-slate-800 font-bold">${trade.entryPrice}</div>
                        <div className="text-[10px] text-slate-500 font-normal">➔ ${trade.closePrice || trade.currentPrice}</div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className={`font-bold ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}${trade.realizedPnL?.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}{trade.realizedPnLPercent?.toFixed(2)}% ROI
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="text-[11px] font-sans font-medium text-slate-800 line-clamp-1">
                          {trade.exitReason}
                        </div>
                        {trade.mistakeAnalysis && (
                          <div className="text-[10px] font-sans text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 line-clamp-1 border border-amber-200">
                            🧠 {trade.mistakeAnalysis}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
