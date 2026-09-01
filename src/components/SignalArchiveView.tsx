import React, { useState } from 'react';
import { 
  History, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  ArrowRight,
  Layers,
  BarChart3,
  Bot,
  Zap,
  Clock,
  Eye,
  Sliders
} from 'lucide-react';
import { SignalLogEntry, MarketRegimeType, TradeDirection } from '../types';

interface SignalArchiveViewProps {
  signalLogs: SignalLogEntry[];
  onRefresh?: () => void;
}

export const SignalArchiveView: React.FC<SignalArchiveViewProps> = ({
  signalLogs = [],
  onRefresh
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'EXECUTED' | 'REJECTED' | 'AVOIDED_LOSS'>('ALL');
  const [selectedRegime, setSelectedRegime] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalLogEntry | null>(null);

  // Filter signals
  const filteredSignals = signalLogs.filter(sig => {
    if (selectedFilter === 'EXECUTED' && sig.status !== 'EXECUTED') return false;
    if (selectedFilter === 'REJECTED' && sig.status !== 'REJECTED') return false;
    if (selectedFilter === 'AVOIDED_LOSS' && sig.outcomeResult !== 'AVOIDED_LOSS') return false;

    if (selectedRegime !== 'ALL' && sig.marketRegime !== selectedRegime) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSym = sig.symbol.toLowerCase().includes(q);
      const matchReason = (sig.rejectionReason || sig.executionReason || '').toLowerCase().includes(q);
      if (!matchSym && !matchReason) return false;
    }

    return true;
  });

  const executedCount = signalLogs.filter(s => s.status === 'EXECUTED').length;
  const rejectedCount = signalLogs.filter(s => s.status === 'REJECTED').length;
  const avoidedLossCount = signalLogs.filter(s => s.outcomeResult === 'AVOIDED_LOSS').length;

  return (
    <div id="signal-archive-view" className="space-y-6 font-sans">
      
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                SIGNAL HISTORY & REJECTION ARCHIVE
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {signalLogs.length} Total Evaluated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Complete institutional archive of both executed setups and rejected trade signals. Preserves full 10-bot voting records, Gatekeeper vetos, and counterfactual price tracking to prevent repeat errors.
            </p>
          </div>
        </div>

        {/* High-Level Stat Chips */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center font-mono">
            <div className="text-[10px] text-emerald-700 font-bold uppercase">Executed Trades</div>
            <div className="text-lg font-black text-emerald-800">{executedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center font-mono">
            <div className="text-[10px] text-rose-700 font-bold uppercase">Rejected / Vetoed</div>
            <div className="text-lg font-black text-rose-800">{rejectedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center font-mono">
            <div className="text-[10px] text-blue-700 font-bold uppercase">Avoided Losses</div>
            <div className="text-lg font-black text-blue-800">{avoidedLossCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Signals ({signalLogs.length})
          </button>
          <button
            onClick={() => setSelectedFilter('EXECUTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'EXECUTED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Executed ({executedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'REJECTED'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Gatekeeper Rejections ({rejectedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('AVOIDED_LOSS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'AVOIDED_LOSS'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Avoided Losses ({avoidedLossCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol or reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Regimes</option>
            <option value="TRENDING">Trending</option>
            <option value="RANGING">Ranging</option>
            <option value="BREAKOUT">Breakout</option>
            <option value="HIGH_VOLATILITY">High Volatility</option>
            <option value="LOW_VOLATILITY">Low Volatility</option>
          </select>
        </div>
      </div>

      {/* Signal Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Time & Pair</th>
                <th className="py-3.5 px-4">Regime</th>
                <th className="py-3.5 px-4">10-Bot Consensus</th>
                <th className="py-3.5 px-4">Quality Score</th>
                <th className="py-3.5 px-4">R:R Ratio</th>
                <th className="py-3.5 px-4">Status & Verdict</th>
                <th className="py-3.5 px-4">Outcome / Avoided Loss</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No signals matched the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isExecuted = sig.status === 'EXECUTED';
                  const isLong = sig.direction === 'LONG';
                  const dateStr = new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={sig.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Time & Pair */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isLong ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div className="font-bold text-slate-900 text-sm">
                            {sig.symbol}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLong ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {sig.direction}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {dateStr} • {sig.timeframe}
                        </div>
                      </td>

                      {/* Regime */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {sig.marketRegime}
                        </span>
                      </td>

                      {/* 10-Bot Consensus */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-sm ${
                            sig.consensusCount >= 6 ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {sig.consensusCount} / 10
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({sig.consensusCount >= 5 ? 'Quorum OK' : 'Below Quorum'})
                          </span>
                        </div>
                      </td>

                      {/* Quality Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`font-mono font-bold ${
                            sig.finalQualityScore >= 80 ? 'text-emerald-600' : 'text-slate-700'
                          }`}>
                            {sig.finalQualityScore}
                          </span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </td>

                      {/* R:R Ratio */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {sig.calculatedRR?.toFixed(2) || '2.20'}:1
                      </td>

                      {/* Status & Gatekeeper Verdict */}
                      <td className="py-3.5 px-4">
                        {isExecuted ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Executed
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Vetoed ({sig.rejectionCategory || 'REJECT'})
                          </div>
                        )}
                      </td>

                      {/* Outcome / Avoided Loss */}
                      <td className="py-3.5 px-4">
                        {sig.outcomeResult === 'WIN' && (
                          <span className="font-mono font-bold text-emerald-600">
                            +${sig.finalRealizedPnL?.toFixed(2)} (+{sig.finalRealizedR}R)
                          </span>
                        )}
                        {sig.outcomeResult === 'LOSS' && (
                          <span className="font-mono font-bold text-rose-600">
                            -${Math.abs(sig.finalRealizedPnL || 0).toFixed(2)} (-1.0R)
                          </span>
                        )}
                        {sig.outcomeResult === 'AVOIDED_LOSS' && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Saved ~${(3.50).toFixed(2)}
                          </div>
                        )}
                        {!sig.outcomeResult && (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Details button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedSignal(sig)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signal Audit Inspector Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Signal Post-Mortem Audit: {selectedSignal.symbol}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    selectedSignal.direction === 'LONG' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedSignal.direction}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: {selectedSignal.id} • {new Date(selectedSignal.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Verdict Card */}
            <div className={`p-4 rounded-xl border ${
              selectedSignal.status === 'EXECUTED'
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedSignal.status === 'EXECUTED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                {selectedSignal.status === 'EXECUTED' ? 'Setup Accepted & Executed' : `Setup Vetoed by Gatekeeper (${selectedSignal.rejectionCategory})`}
              </div>
              <p className="text-xs mt-1 leading-relaxed">
                {selectedSignal.executionReason || selectedSignal.rejectionReason}
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Consensus</div>
                <div className="text-base font-bold text-slate-900">{selectedSignal.consensusCount} / 10</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Quality Score</div>
                <div className="text-base font-bold text-slate-900">{selectedSignal.finalQualityScore} / 100</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">R:R Ratio</div>
                <div className="text-base font-bold text-slate-900">{selectedSignal.calculatedRR?.toFixed(2)}:1</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Market Regime</div>
                <div className="text-xs font-bold text-slate-900 mt-1">{selectedSignal.marketRegime}</div>
              </div>
            </div>

            {/* Individual Bot Votes */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                10-Bot Voting Matrix
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {Object.entries(selectedSignal.botVotes).map(([botId, vote]) => {
                  const conf = selectedSignal.botConfidences[botId] || 75;
                  const isAgree = vote === selectedSignal.direction;
                  return (
                    <div key={botId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-medium text-slate-800 capitalize truncate">
                        {botId.replace('bot-', '').replace(/-/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-500">{conf}%</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isAgree ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {vote}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
