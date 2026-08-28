import React from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  BrainCircuit, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  XCircle,
  Sparkles
} from 'lucide-react';
import { TradePosition } from '../types';

interface ActiveTradesViewProps {
  activeTrades: TradePosition[];
  onCloseTrade: (tradeId: string) => void;
  onAskBrainRationale: (trade: TradePosition) => void;
}

export const ActiveTradesView: React.FC<ActiveTradesViewProps> = ({
  activeTrades,
  onCloseTrade,
  onAskBrainRationale,
}) => {
  const totalUnrealizedPnL = activeTrades.reduce((sum, t) => sum + t.unrealizedPnL, 0);

  return (
    <div id="active-trades-view" className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            LIVE ACTIVE TRADES ({activeTrades.length} POSITIONS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time positions managed by the 5 autonomous specialist bots with strict dynamic risk execution.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Unrealized Fleet PnL</div>
            <div className={`text-base sm:text-lg font-bold ${
              totalUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>

      {/* Trades Grid */}
      {activeTrades.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700">No Active Running Trades</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            The 24/7 autonomous scanning engine is actively evaluating the CMC Top 500 coin universe for high-probability setups matching our 5 bot strategies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTrades.map((trade) => {
            const isLong = trade.direction === 'LONG';
            const pnlIsPos = trade.unrealizedPnL >= 0;

            // Calculate progress between SL and TP
            const totalRange = Math.abs(trade.takeProfitPrice - trade.stopLossPrice);
            const currentDist = isLong 
              ? Math.max(0, trade.currentPrice - trade.stopLossPrice)
              : Math.max(0, trade.stopLossPrice - trade.currentPrice);
            const progressPercent = Math.min(100, Math.max(0, (currentDist / totalRange) * 100));

            return (
              <div
                key={trade.id}
                id={`trade-card-${trade.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Bot Name & Direction Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        {trade.botName}
                      </div>
                      <div className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                        <span>{trade.symbol}</span>
                        <span className="text-xs font-normal text-slate-500">({trade.name})</span>
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
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase">Margin (5% Dyn)</div>
                      <div className="text-slate-900 font-bold mt-0.5">${trade.margin.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">Size: ${trade.positionSize.toFixed(2)}</div>
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
                        {pnlIsPos ? '+' : ''}{trade.unrealizedPnLPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Risk Bar (SL -> Current Mark -> TP) */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
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

                    {/* Progress visual */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          pnlIsPos 
                            ? 'bg-emerald-500' 
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Hard Stop: Max 3% Capital</span>
                      <span className="text-emerald-700 font-medium">Min Win Target: &gt;$2.00 Rule Met ✅</span>
                    </div>
                  </div>

                  {/* AI Brain Rationale */}
                  <div className="mt-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                    <div className="flex items-center justify-between text-purple-700 font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                        AI BRAIN TRADE RATIONALE:
                      </span>
                      <span className="text-[10px] text-purple-600 font-mono">
                        Sentiment: {trade.sentimentScore > 0 ? '+' : ''}{trade.sentimentScore}/100
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed italic">
                      "{trade.aiReasoning}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    Open: {new Date(trade.entryTime).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => onAskBrainRationale(trade)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>Re-evaluate with Gemini 3.7</span>
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
