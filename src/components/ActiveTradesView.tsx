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
  ShieldCheck
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
                Live Trades Dashboard (Stage-Wise Consensus)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                {activeTrades.length} Active Positions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Each live position reflects the number of confirming bots. Example: <em>Stage 4 SHORT BTC</em> (4 Bots confirmed), <em>Stage 3 LONG SOL</em> (3 Bots confirmed). Leverage and capital dynamically scale with consensus level.
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
                <span>Stage {stg} ({stg} Bot{stg > 1 ? 's' : ''})</span>
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
            The autonomous consensus scanner continuously tracks market setups and promotes positions as new bots confirm the directional trend.
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

                        <span className="text-xs text-slate-400 font-mono">
                          Initiated by: <strong className="text-slate-700">{trade.initiatorBotName}</strong>
                        </span>
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
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]" title={trade.contractAddress}>
                            {trade.network}
                          </span>
                        )}
                        {trade.cmcUrl && (
                          <a 
                            href={trade.cmcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5 text-[10px]"
                            title="Verify coin contract & real-time price on CoinMarketCap"
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

                  {/* Confirming Bots Badges Row */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                      <Users className="w-3 h-3 text-slate-500" />
                      Active Consensus Brains ({trade.confirmingBotNames.length}/5):
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {trade.confirmingBotNames.map((name, i) => (
                        <span key={`${trade.id}-bot-${i}`} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-800 border border-slate-200 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          {name}
                        </span>
                      ))}

                      {!isMaxStage && onPromoteTradeStage && (
                        <button
                          onClick={() => onPromoteTradeStage(trade.id)}
                          title="Simulate additional specialist bot confirmation and scale trade into next stage"
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-all cursor-pointer font-sans"
                        >
                          <Zap className="w-2.5 h-2.5 text-blue-600" />
                          + Confirm Next Stage
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Stage Margin ($1K Base)</div>
                      <div className="text-slate-900 font-bold mt-0.5">${trade.margin.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">Size: ${trade.positionSize.toFixed(2)} ({trade.leverage}x)</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Entry / Mark</div>
                      <div className="text-slate-900 font-bold mt-0.5">${trade.entryPrice}</div>
                      <div className="text-blue-600 font-bold">${trade.currentPrice}</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 uppercase">Unrealized PnL</div>
                      <div className={`font-bold mt-0.5 ${pnlIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pnlIsPos ? '+' : ''}${trade.unrealizedPnL.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold ${pnlIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {pnlIsPos ? '+' : ''}{trade.unrealizedPnLPercent.toFixed(2)}% ROI
                      </div>
                    </div>
                  </div>

                  {/* Risk Bar: Stop-Loss -> Mark -> Take-Profit */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-rose-600 flex items-center gap-1 font-bold">
                        <ShieldAlert className="w-3 h-3" />
                        SL: ${trade.stopLossPrice} (-${trade.maxLossUsd.toFixed(2)})
                      </span>
                      <span className="text-emerald-600 flex items-center gap-1 font-bold">
                        <Target className="w-3 h-3" />
                        TP: ${trade.takeProfitPrice} (+${trade.targetProfitUsd.toFixed(2)})
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          pnlIsPos ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Consensus Stage {trade.stage} Guard</span>
                      <span className="text-emerald-700 font-medium">Auto Staged Target Scaling Active</span>
                    </div>
                  </div>

                  {/* AI Consensus Reasoning & Why Trade Was Taken */}
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
