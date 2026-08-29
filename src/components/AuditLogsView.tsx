import React, { useState } from 'react';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { TradePosition, TradingBot } from '../types';

interface AuditLogsViewProps {
  auditLogs: TradePosition[];
  bots: TradingBot[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs,
  bots,
}) => {
  const [filterBot, setFilterBot] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesBot = filterBot === 'ALL' || log.botId === filterBot;
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    return matchesBot && matchesStatus;
  });

  const totalRealizedPnL = auditLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0);
  const winLogs = auditLogs.filter(l => (l.realizedPnL || 0) > 0);
  const lossLogs = auditLogs.filter(l => (l.realizedPnL || 0) < 0);
  
  const totalWinAmount = winLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0);
  const totalLossAmount = Math.abs(lossLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0));
  const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : totalWinAmount;
  const avgWin = winLogs.length > 0 ? totalWinAmount / winLogs.length : 0;
  const avgLoss = lossLogs.length > 0 ? totalLossAmount / lossLogs.length : 0;

  const exportCSV = () => {
    const headers = ['ID', 'Bot', 'Symbol', 'Direction', 'Leverage', 'Margin', 'EntryPrice', 'ClosePrice', 'RealizedPnL', 'Status', 'EntryTime', 'ExitTime', 'ExitReason'];
    const rows = auditLogs.map(l => [
      l.id,
      l.botName,
      l.symbol,
      l.direction,
      l.leverage,
      l.margin,
      l.entryPrice,
      l.closePrice || l.currentPrice,
      l.realizedPnL,
      l.status,
      new Date(l.entryTime).toISOString(),
      l.exitTime ? new Date(l.exitTime).toISOString() : '',
      `"${l.exitReason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trading_fleet_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-logs-view" className="space-y-6">
      {/* Header Summary */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            COMPREHENSIVE TRADE AUDIT LOGS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full immutable ledger of closed trades, take-profit executions, hard stop-loss executions, and ROI performance.
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={exportCSV}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Quantitative Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Realized Net PnL</div>
          <div className={`text-xl font-bold mt-1 ${totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toFixed(2)} USDT
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{auditLogs.length} Total Trades Closed</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Profit Factor</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Wins: ${totalWinAmount.toFixed(2)} / Loss: ${totalLossAmount.toFixed(2)}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Average Win</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            +${avgWin.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: &gt;$2.00 Met</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Average Loss</div>
          <div className="text-xl font-bold text-rose-600 mt-1">
            -${avgLoss.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hard Capped &lt;= 3% ($3.00)</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase text-[11px]">Bot:</span>
          <select
            id="audit-filter-bot"
            value={filterBot}
            onChange={(e) => setFilterBot(e.target.value)}
            className="bg-slate-50 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-sans"
          >
            <option value="ALL">All Bots</option>
            {bots.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase text-[11px]">Outcome:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-xl border text-xs transition-all ${
                filterStatus === 'ALL' ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('CLOSED_TP')}
              className={`px-2.5 py-1 rounded-xl border text-xs transition-all ${
                filterStatus === 'CLOSED_TP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🎯 Take-Profit
            </button>
            <button
              onClick={() => setFilterStatus('CLOSED_SL')}
              className={`px-2.5 py-1 rounded-xl border text-xs transition-all ${
                filterStatus === 'CLOSED_SL' ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🛑 Stop-Loss
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No closed trades matching this filter.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isTP = log.status === 'CLOSED_TP';
            const isLong = log.direction === 'LONG';
            const pnl = log.realizedPnL || 0;
            const pnlPct = log.realizedPnLPercent || ((pnl / log.margin) * 100);

            return (
              <div
                key={`${log.id}-${idx}`}
                id={`audit-row-${log.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                      isTP ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isTP ? '🎯 TAKE-PROFIT' : '🛑 STOP-LOSS'}
                    </span>
                    <span className="text-slate-900 font-bold text-sm">{log.botName}</span>
                    <span className="text-slate-500 font-mono text-xs">{log.symbol}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold font-mono ${
                      isLong ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {log.direction} {log.leverage}x
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`text-base font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Entry Price</span>
                    <span className="font-bold text-slate-900">${log.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Exit Price</span>
                    <span className="font-bold text-blue-600">${log.closePrice || log.currentPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Margin / Size</span>
                    <span>${log.margin.toFixed(2)} / ${log.positionSize.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Execution Time</span>
                    <span className="text-slate-500 text-[11px]">
                      {log.exitTime ? new Date(log.exitTime).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {log.exitReason && (
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Reason:</span>
                    <span>{log.exitReason}</span>
                  </div>
                )}

                {log.mistakeAnalysis && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    <div className="font-bold uppercase text-[10px] text-rose-800 mb-0.5">Brain AI Post-Mortem:</div>
                    <div>{log.mistakeAnalysis}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
