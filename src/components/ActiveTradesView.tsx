import React, { useState } from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  BrainCircuit, 
  Clock, 
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Users,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { TradePosition, ConsensusStage, TradingBot } from '../types';
import { STAGE_CONFIGS } from '../services/tradingEngine';

interface ActiveTradesViewProps {
  activeTrades: TradePosition[];
  bots: TradingBot[];
  onCloseTrade: (tradeId: string) => void;
  onAskBrainRationale: (trade: TradePosition) => void;
  onPromoteTradeStage?: (tradeId: string) => void;
}

export const ActiveTradesView: React.FC<ActiveTradesViewProps> = ({
  activeTrades,
  bots,
  onCloseTrade,
  onAskBrainRationale,
  onPromoteTradeStage,
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<ConsensusStage | 'ALL'>('ALL');
  const [expandedTimelineTradeId, setExpandedTimelineTradeId] = useState<string | null>(null);
  const [expandedTeacherTradeId, setExpandedTeacherTradeId] = useState<string | null>(null);
  const [expandedMatrixTradeId, setExpandedMatrixTradeId] = useState<string | null>(null);

  const filteredTrades = selectedStageFilter === 'ALL'
    ? activeTrades
    : activeTrades.filter(t => t.stage === selectedStageFilter);

  const totalUnrealizedPnL = activeTrades.reduce((sum, t) => sum + t.unrealizedPnL, 0);

  // Group counts by stage
  const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  activeTrades.forEach(t => {
    stageCounts[t.stage] = (stageCounts[t.stage] || 0) + 1;
  });

  return (
    <div id="active-trades-view" className="space-y-6">
      
      {/* Header Summary & Filter Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
                <Activity className="w-5 h-5 text-emerald-600" />
                Live Trades Dashboard (Stage Consensus & Multi-TP Blueprint)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                {activeTrades.length} Active Positions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Execution architecture: <strong>TP1 (35% + Breakeven SL)</strong>, <strong>TP2 (25% + TP1 Lock)</strong>, <strong>TP3 (20% + TP2 Lock)</strong>, and <strong>20% Runner (Trailing S/R)</strong>. No position limits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right font-mono">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Unrealized Fleet PnL</div>
              <div className={`text-base sm:text-lg font-black ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)} USDT
              </div>
            </div>
          </div>
        </div>

        {/* Stage Filter Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setSelectedStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
              selectedStageFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Stages</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200">
              {activeTrades.length}
            </span>
          </button>

          {([5, 4, 3, 2, 1] as ConsensusStage[]).map(stg => {
            const config = STAGE_CONFIGS[stg];
            const count = stageCounts[stg] || 0;
            const isSelected = selectedStageFilter === stg;

            return (
              <button
                key={stg}
                onClick={() => setSelectedStageFilter(stg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: config.accentColor }} 
                />
                <span>Stage {stg} ({config.botsRequired})</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trades Grid */}
      {filteredTrades.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">No Active Trades in Stage {selectedStageFilter}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            The ultra-strict autonomous consensus scanner continuously screens the market and executes high-conviction entries with multi-tier TP blueprints.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTrades.map((trade, tIdx) => {
            const isLong = trade.direction === 'LONG';
            const pnlIsPos = trade.unrealizedPnL >= 0;
            const config = STAGE_CONFIGS[trade.stage] || STAGE_CONFIGS[1];
            const isMaxStage = trade.stage >= 5;

            // Calculate progress between SL and TP
            const totalRange = Math.abs(trade.takeProfitPrice - trade.stopLossPrice);
            const currentDist = isLong 
              ? Math.max(0, trade.currentPrice - trade.stopLossPrice)
              : Math.max(0, trade.stopLossPrice - trade.currentPrice);
            const progressPercent = Math.min(100, Math.max(0, (currentDist / Math.max(0.0001, totalRange)) * 100));

            const isTimelineExpanded = expandedTimelineTradeId === trade.id;
            const isTeacherExpanded = expandedTeacherTradeId === trade.id;

            return (
              <div
                key={`${trade.id}-${tIdx}`}
                id={`trade-card-${trade.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Stage Badge, Pair, Direction */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide font-mono flex items-center gap-1.5"
                          style={{ backgroundColor: `${config.accentColor}18`, color: config.accentColor }}
                        >
                          <Layers className="w-3 h-3" />
                          STAGE {trade.stage} ENTRY ({trade.confirmingBotIds.length} BOTS CONFIRMED)
                        </span>

                        {trade.slMode && trade.slMode !== 'INITIAL' && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-1 ${
                            trade.slMode === 'BREAKEVEN' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : trade.slMode === 'TRAILING_STRUCTURE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {trade.slMode === 'BREAKEVEN' ? '100% Risk-Free Breakeven' : trade.slMode.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1 font-mono">
                        <span>{trade.symbol}</span>
                        <span className="text-xs font-normal text-slate-500 font-sans">({trade.name})</span>
                      </div>

                      {/* Verified Contract / Network info */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-mono text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                        {trade.network && (
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {trade.network}
                          </span>
                        )}
                        {trade.cmcUrl && (
                          <a 
                            href={trade.cmcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 text-[10px]"
                            title="Verify coin contract on CoinMarketCap"
                          >
                            CMC <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono flex items-center gap-1 border ${
                        isLong 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {trade.direction} {trade.leverage}x
                      </span>

                      <button
                        id={`close-btn-${trade.id}`}
                        onClick={() => onCloseTrade(trade.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Grid: Entry/Mark, Live PnL & ROI %, Dedicated Stop-Loss Guard */}
                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                    {/* 1. Margin & Active Position */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Margin / Size</div>
                      <div className="text-slate-900 font-bold mt-0.5">${(trade.remainingMargin || trade.margin).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">Size: ${((trade.remainingMargin || trade.margin) * trade.leverage).toFixed(2)}</div>
                    </div>

                    {/* 2. Entry & Current Mark */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Entry / Mark</div>
                      <div className="text-slate-900 font-bold mt-0.5">${trade.entryPrice}</div>
                      <div className="text-blue-600 font-bold mt-0.5">${trade.currentPrice}</div>
                    </div>

                    {/* 3. Stop-Loss (SL) Dedicated Guard Card */}
                    <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200">
                      <div className="flex items-center justify-between text-[10px] text-rose-700 uppercase font-bold">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-600" /> Stop-Loss (SL)
                        </span>
                      </div>
                      <div className="text-rose-700 font-black mt-0.5">${trade.stopLossPrice}</div>
                      <div className="text-[10px] text-rose-600 font-medium">
                        {trade.slMode === 'BREAKEVEN' ? '🛡️ 100% Risk-Free' : trade.slMode === 'TRAILING_STRUCTURE' ? '⚡ Trailing' : `Max -$${trade.maxLossUsd?.toFixed(2) || '2.50'}`}
                      </div>
                      {trade.liquidationPrice && (
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 border-t border-rose-200/60 pt-0.5 flex items-center justify-between">
                          <span>Liq: ${trade.liquidationPrice}</span>
                          <span className="text-emerald-700 font-bold">SL &lt; Liq 🛡️</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Live PnL & PnL Percentage (%) */}
                    <div className={`p-2.5 rounded-xl border ${
                      pnlIsPos ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/80 border-rose-200'
                    }`}>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Live PnL & ROI %</div>
                      <div className={`text-sm font-black mt-0.5 ${pnlIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pnlIsPos ? '+' : ''}${trade.unrealizedPnL.toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-bold ${pnlIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pnlIsPos ? '+' : ''}{(trade.unrealizedPnLPercent !== undefined ? trade.unrealizedPnLPercent : ((trade.unrealizedPnL / (trade.remainingMargin || trade.margin || 1)) * 100)).toFixed(2)}% ROI
                      </div>
                    </div>
                  </div>

                  {/* MULTI-STAGE TAKE PROFIT BLUEPRINT */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-900 text-white font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                      <span className="flex items-center gap-1 text-amber-400 uppercase">
                        <Target className="w-3.5 h-3.5 text-amber-400" />
                        Multi-Tier Profit Blueprint
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Current SL: ${trade.stopLossPrice}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      {/* TP 1 */}
                      <div className={`p-2 rounded-lg border ${
                        trade.tp1Hit 
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                          : 'bg-slate-800/90 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold">TP 1 (35%)</span>
                          {trade.tp1Hit && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="font-bold text-white mt-0.5">${trade.tp1Price || trade.takeProfitPrice}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">SL ➔ Breakeven</div>
                      </div>

                      {/* TP 2 */}
                      <div className={`p-2 rounded-lg border ${
                        trade.tp2Hit 
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                          : 'bg-slate-800/90 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold">TP 2 (25%)</span>
                          {trade.tp2Hit && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="font-bold text-white mt-0.5">${trade.tp2Price || (trade.takeProfitPrice * 1.01).toFixed(4)}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">SL ➔ TP1 Level</div>
                      </div>

                      {/* TP 3 */}
                      <div className={`p-2 rounded-lg border ${
                        trade.tp3Hit 
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
                          : 'bg-slate-800/90 border-slate-700 text-slate-300'
                      }`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold">TP 3 (20%)</span>
                          {trade.tp3Hit && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="font-bold text-white mt-0.5">${trade.tp3Price || (trade.takeProfitPrice * 1.02).toFixed(4)}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">SL ➔ TP2 Level</div>
                      </div>

                      {/* Runner */}
                      <div className={`p-2 rounded-lg border ${
                        trade.runnerActive 
                          ? 'bg-purple-950/80 border-purple-500/50 text-purple-300' 
                          : 'bg-slate-800/90 border-slate-700 text-slate-400'
                      }`}>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-purple-300">Runner (20%)</span>
                          {trade.runnerActive && <Zap className="w-3 h-3 text-purple-400 animate-pulse" />}
                        </div>
                        <div className="font-bold text-white mt-0.5">Trailing S/R</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Swing Pivots</div>
                      </div>
                    </div>
                  </div>

                  {/* ADVANCED CONFIRMATION MATRIX & MULTI-INDICATOR VALIDATION */}
                  {trade.confirmationMatrix && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white text-xs border border-slate-800">
                      <div className="flex items-center justify-between font-bold mb-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 uppercase tracking-wide">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          Indicator Confluence: {trade.confirmationMatrix.confluenceScore}% Score
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {trade.confirmationMatrix.confirmedCount}/{trade.confirmationMatrix.totalEvaluated} Validated
                          </span>
                          <button
                            onClick={() => setExpandedMatrixTradeId(expandedMatrixTradeId === trade.id ? null : trade.id)}
                            className="text-slate-400 hover:text-white font-mono text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{expandedMatrixTradeId === trade.id ? 'Hide Matrix' : 'View Indicators'}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedMatrixTradeId === trade.id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span>Strategy: <strong className="text-white">{trade.confirmationMatrix.strategyName}</strong></span>
                        <span className="text-amber-300">Regime: {trade.confirmationMatrix.marketRegime}</span>
                      </div>

                      {expandedMatrixTradeId === trade.id && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1.5 font-mono text-[11px]">
                          {trade.confirmationMatrix.indicators.map((ind, ii) => (
                            <div 
                              key={ii} 
                              className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                                ind.confirmed 
                                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
                                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {ind.confirmed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0 inline-block" />
                                )}
                                <span className="font-bold text-slate-200">{ind.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{ind.category}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] sm:text-right">
                                <span className="text-slate-300">{ind.value}</span>
                                <span className={`font-bold px-1.5 py-0.2 rounded ${
                                  ind.signal === 'BULLISH' ? 'bg-emerald-900 text-emerald-200' : ind.signal === 'BEARISH' ? 'bg-rose-900 text-rose-200' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {ind.signal}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="text-[10px] text-slate-400 italic pt-1">
                            Primary Trigger: {trade.confirmationMatrix.primaryTrigger}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEACHER-STYLE EXPLANATION DRAWER */}
                  {trade.teacherExplanation ? (
                    <div className="mt-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                      <div className="flex items-center justify-between text-blue-900 font-bold mb-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                          <GraduationCap className="w-4 h-4 text-blue-700" />
                          Teacher Explanation: {trade.teacherExplanation.setupHeadline}
                        </span>
                        <button
                          onClick={() => setExpandedTeacherTradeId(isTeacherExpanded ? null : trade.id)}
                          className="text-blue-700 hover:text-blue-900 font-mono text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{isTeacherExpanded ? 'Less' : 'More Details'}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isTeacherExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <p className="text-slate-800 text-xs leading-relaxed font-sans bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        {trade.teacherExplanation.whyWeTookThisTrade}
                      </p>

                      {isTeacherExpanded && (
                        <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
                          <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100">
                            <div className="text-[10px] uppercase font-bold text-blue-800 mb-1">Technical Confluences:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                              {trade.teacherExplanation.technicalConfluence.map((conf, ci) => (
                                <li key={ci}>{conf}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white/90 p-2.5 rounded-lg border border-blue-100 font-mono text-[10px] text-slate-700">
                            <div className="uppercase font-bold text-blue-800 mb-1">Execution Rule:</div>
                            <div>{trade.teacherExplanation.riskManagementPlan}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                      <div className="flex items-center justify-between text-purple-700 font-bold mb-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                          <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                          WHY FLEET TOOK THIS TRADE (STAGE {trade.stage} THESIS):
                        </span>
                        <span className="text-[10px] text-purple-600 font-mono">
                          Sentiment: {trade.sentimentScore > 0 ? '+' : ''}{trade.sentimentScore}/100
                        </span>
                      </div>
                      <p className="text-slate-800 text-xs leading-relaxed font-sans bg-white/70 p-2.5 rounded-lg border border-purple-100">
                        "{trade.aiReasoning}"
                      </p>
                    </div>
                  )}

                  {/* Stage Escalation Timeline Toggle */}
                  {trade.stageHistory && trade.stageHistory.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedTimelineTradeId(isTimelineExpanded ? null : trade.id)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                      >
                        <Layers className="w-3 h-3" />
                        <span>{isTimelineExpanded ? 'Hide Stage Progression History' : `View ${trade.stageHistory.length} Stage Confirmation Steps`}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${isTimelineExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isTimelineExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                          {trade.stageHistory.map((step, idx) => (
                            <div key={`${trade.id}-step-${step.stage}-${idx}`} className="flex items-start gap-2.5 pb-2 border-b border-slate-200 last:border-0 last:pb-0 font-sans">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {step.stage}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="font-bold text-slate-800">Stage {step.stage} ➔ Confirmed by {step.addedBotName}</span>
                                  <span className="text-slate-400">{new Date(step.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">{step.rationale}</p>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Allocation: ${step.newMargin.toFixed(2)} Margin • {step.newLeverage}x Leverage
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Bottom Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    Open: {new Date(trade.entryTime).toLocaleTimeString()}
                  </span>

                  <button
                    onClick={() => onAskBrainRationale(trade)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer font-sans"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    Deep Fleet Audit
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
