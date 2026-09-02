import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  XOctagon, 
  DollarSign,
  Search,
  Sparkles,
  Zap
} from 'lucide-react';
import { TradePosition } from '../types';

interface LiveTradesViewProps {
  activeTrades: TradePosition[];
  closedTrades: TradePosition[];
  onCloseTrade: (tradeId: string) => void;
}

export const LiveTradesView: React.FC<LiveTradesViewProps> = ({
  activeTrades,
  closedTrades,
  onCloseTrade,
}) => {
  const [tab, setTab] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');

  const filteredActive = activeTrades.filter(t => {
    const matchSearch = 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.botSerialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDirection = directionFilter === 'ALL' || t.direction === directionFilter;
    return matchSearch && matchDirection;
  });

  const filteredClosed = closedTrades.filter(t => {
    const matchSearch = 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.botSerialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDirection = directionFilter === 'ALL' || t.direction === directionFilter;
    return matchSearch && matchDirection;
  });

  const longActiveCount = activeTrades.filter(t => t.direction === 'LONG').length;
  const shortActiveCount = activeTrades.filter(t => t.direction === 'SHORT').length;

  return (
    <div id="live-trades-view" className="space-y-6 text-slate-900">
      
      {/* Header & Sub-tab Switcher */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Live Trades & Multi-Tier TP Engine
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              No Position Limits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Strict Execution Floor: <strong>Min $2.00 Profit on TP1</strong> → SL moves to Entry Break-Even → TP2 & 40% Trailing Runner
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direction Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDirectionFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                directionFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tab === 'ACTIVE' ? activeTrades.length : closedTrades.length})
            </button>
            <button
              onClick={() => setDirectionFilter('LONG')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                directionFilter === 'LONG'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-800'
              }`}
            >
              <span>Longs</span>
              <span className="text-[10px] opacity-85">({tab === 'ACTIVE' ? longActiveCount : closedTrades.filter(t => t.direction === 'LONG').length})</span>
            </button>
            <button
              onClick={() => setDirectionFilter('SHORT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                directionFilter === 'SHORT'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:text-rose-800'
              }`}
            >
              <span>Shorts</span>
              <span className="text-[10px] opacity-85">({tab === 'ACTIVE' ? shortActiveCount : closedTrades.filter(t => t.direction === 'SHORT').length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trade / bot..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <button
            id="tab-active-trades-btn"
            onClick={() => setTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              tab === 'ACTIVE'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Live Positions</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${tab === 'ACTIVE' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'}`}>
              {activeTrades.length}
            </span>
          </button>

          <button
            id="tab-closed-trades-btn"
            onClick={() => setTab('CLOSED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              tab === 'CLOSED'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Closed History</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${tab === 'CLOSED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'}`}>
              {closedTrades.length}
            </span>
          </button>
        </div>
      </div>

      {/* ACTIVE TRADES LIST */}
      {tab === 'ACTIVE' && (
        <div className="space-y-4">
          {filteredActive.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Active Trades Matching Filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                The 40 AI bots are scanning the live CMC 500 universe. New trades open whenever an asset confirms <strong>≥9 of 10 confirmation rules</strong> with 90%+ confidence.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredActive.map((trade) => {
                const isLong = trade.direction === 'LONG';
                const isProfitable = trade.unrealizedPnL >= 0;

                return (
                  <div
                    key={trade.id}
                    id={`active-trade-card-${trade.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Bot Serial, Symbol, Dynamic Leverage & Confidence Score */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {trade.botSerialNumber}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900">{trade.symbol}</h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isLong ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {trade.direction}
                              </span>
                              <span 
                                title={trade.leverageTier || `${trade.leverage}x Dynamic Leverage`}
                                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-indigo-600" />
                                {trade.leverage}x Leverage
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>Score: <strong className="font-mono">{trade.confidenceScore}%</strong></span>
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <span>{trade.botName}</span>
                              {trade.leverageTier && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-semibold text-[10px]">{trade.leverageTier}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* PnL Display */}
                        <div className="text-right">
                          <div className={`text-base font-bold font-mono ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isProfitable ? '+' : ''}${trade.unrealizedPnL.toFixed(2)}
                            <span className="text-xs ml-1 font-semibold">
                              ({isProfitable ? '+' : ''}{trade.unrealizedPnLPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Margin: ${trade.margin.toFixed(2)} | Pos: ${trade.positionSize.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Price Grid */}
                      {(() => {
                        const tp1DistPercent = (Math.abs(trade.tp1Price - trade.entryPrice) / trade.entryPrice * 100).toFixed(1);
                        const slDistPercent = (Math.abs(trade.stopLossPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(1);

                        return (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1.5 px-0.5">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Target className="w-3 h-3 text-emerald-600" />
                                TP1 is Closer than SL ({tp1DistPercent}% TP1 vs {slDistPercent}% SL)
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono text-[10px]">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                Confidence Score: {trade.confidenceScore}%
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3 shadow-2xs">
                              <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500">Entry Price</div>
                                <div className="font-mono font-bold text-slate-800 mt-0.5">
                                  ${trade.entryPrice}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500">Current Price</div>
                                <div className="font-mono font-bold text-slate-900 mt-0.5">
                                  ${trade.currentPrice}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase font-bold text-slate-500">Stop Loss ({slDistPercent}%)</div>
                                <div className={`font-mono font-bold mt-0.5 ${trade.slMode === 'BREAKEVEN_TP1' || trade.slMode === 'LOCKED_TP2' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  ${trade.stopLossPrice}
                                  {trade.slMode === 'BREAKEVEN_TP1' && <span className="text-[9px] block text-emerald-600 font-normal">Break-Even (BE)</span>}
                                  {trade.slMode === 'LOCKED_TP2' && <span className="text-[9px] block text-emerald-600 font-normal">Locked TP1</span>}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Multi-Tier Target Milestone Strip */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-bold uppercase text-[10px]">Multi-Tier TP Milestones:</span>
                          <span className="text-emerald-700 font-mono font-bold text-[10px]">
                            Floor: Min $2.00 Booked at TP1
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                          {/* TP1 */}
                          <div className={`p-2 rounded-xl border text-center transition-all ${
                            trade.tp1Hit 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <div className="text-[10px] font-sans font-bold flex items-center justify-center gap-1">
                              {trade.tp1Hit ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Target className="w-3 h-3 text-slate-400" />}
                              TP1 (Min $2.00)
                            </div>
                            <div className="mt-0.5">${trade.tp1Price}</div>
                            {trade.tp1Hit && (
                              <div className="text-[9px] text-emerald-700 font-bold mt-0.5">
                                +${trade.tp1BookedAmount?.toFixed(2) || '2.05'} Booked
                              </div>
                            )}
                          </div>

                          {/* TP2 */}
                          <div className={`p-2 rounded-xl border text-center transition-all ${
                            trade.tp2Hit 
                              ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <div className="text-[10px] font-sans font-bold flex items-center justify-center gap-1">
                              {trade.tp2Hit ? <CheckCircle2 className="w-3 h-3 text-cyan-600" /> : <Target className="w-3 h-3 text-slate-400" />}
                              TP2
                            </div>
                            <div className="mt-0.5">${trade.tp2Price}</div>
                            {trade.tp2Hit && (
                              <div className="text-[9px] text-cyan-700 font-bold mt-0.5">
                                +${trade.tp2BookedAmount?.toFixed(2) || '1.50'} Booked
                              </div>
                            )}
                          </div>

                          {/* Runner */}
                          <div className={`p-2 rounded-xl border text-center transition-all ${
                            trade.tp2Hit 
                              ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold animate-pulse shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <div className="text-[10px] font-sans font-bold">40% Trailing Runner</div>
                            <div className="mt-0.5">{trade.tp2Hit ? 'Active & Trailing' : 'Locked until TP2'}</div>
                          </div>
                        </div>
                      </div>

                      {/* AI Confirmation Rationale */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 mb-3">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-slate-800 font-bold mb-1">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>10-Rule Confirmation ({trade.confirmedRulesCount}/10 Confirmed)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Confidence: <strong>{trade.confidenceScore}%</strong>
                            </span>
                            <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold flex items-center gap-0.5 font-mono">
                              <Zap className="w-3 h-3 text-indigo-600" />
                              {trade.leverage}x Dynamic
                            </span>
                          </div>
                        </div>
                        <p className="line-clamp-2">{trade.aiBrainRationale}</p>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Duration: {Math.floor((Date.now() - trade.entryTime) / 60000)}m ago</span>
                      </div>

                      <button
                        onClick={() => onCloseTrade(trade.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors"
                      >
                        Market Close Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CLOSED TRADES LIST */}
      {tab === 'CLOSED' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {filteredClosed.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No closed trade records found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Bot / Serial</th>
                    <th className="px-4 py-3">Asset & Dir</th>
                    <th className="px-4 py-3">Leverage</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Entry → Exit Price</th>
                    <th className="px-4 py-3">Status / Outcome</th>
                    <th className="px-4 py-3 text-right">Realized PnL ($)</th>
                    <th className="px-4 py-3">Exit Reason & Lessons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClosed.map((trade) => {
                    const isWin = (trade.realizedPnL || 0) >= 0;
                    return (
                      <tr key={trade.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mr-1.5">
                            {trade.botSerialNumber}
                          </span>
                          <span className="text-slate-600 font-medium">{trade.botName}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                          {trade.symbol}
                          <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded ${trade.direction === 'LONG' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {trade.direction}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            <Zap className="w-3 h-3 text-indigo-600" />
                            {trade.leverage}x
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            {trade.confidenceScore}%
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                          ${trade.entryPrice} → ${trade.closePrice || trade.currentPrice}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PROFIT TARGET HIT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XOctagon className="w-3 h-3 text-rose-600" />
                              STOP LOSS DEFENSE
                            </span>
                          )}
                        </td>

                        <td className={`px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-sm ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}${(trade.realizedPnL || 0).toFixed(2)}
                          <div className="text-[10px] font-normal">
                            ({isWin ? '+' : ''}{trade.realizedPnLPercent?.toFixed(1) || '0.0'}%)
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-600 max-w-sm truncate">
                          {trade.exitReason || trade.aiBrainRationale}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
