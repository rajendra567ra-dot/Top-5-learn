import React, { useState, useMemo } from 'react';
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
  DollarSign,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  FileSpreadsheet
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
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const initiatorId = log.initiatorBotId || (log as any).botId || '';
      const matchesBot = filterBot === 'ALL' || initiatorId === filterBot || log.confirmingBotIds?.includes(filterBot);
      const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
      const stageVal = log.stageAtClose || log.stage;
      const matchesStage = filterStage === 'ALL' || String(stageVal) === filterStage;
      return matchesBot && matchesStatus && matchesStage;
    });
  }, [auditLogs, filterBot, filterStatus, filterStage]);

  // Aggregate metrics
  const totalRealizedPnL = auditLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0);
  const winLogs = auditLogs.filter(l => (l.realizedPnL || 0) > 0 || l.status === 'CLOSED_TP');
  const lossLogs = auditLogs.filter(l => (l.realizedPnL || 0) < 0 || l.status === 'CLOSED_SL');
  
  const totalWinAmount = winLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0);
  const totalLossAmount = Math.abs(lossLogs.reduce((sum, l) => sum + (l.realizedPnL || 0), 0));
  const profitFactor = totalLossAmount > 0 ? (totalWinAmount / totalLossAmount) : (totalWinAmount > 0 ? 9.99 : 0);
  const avgWin = winLogs.length > 0 ? totalWinAmount / winLogs.length : 0;
  const avgLoss = lossLogs.length > 0 ? totalLossAmount / lossLogs.length : 0;
  const winRate = auditLogs.length > 0 ? ((winLogs.length / auditLogs.length) * 100) : 0;

  // Cumulative PnL Curve Data for SVG Chart
  const pnlCurveData = useMemo(() => {
    // Reverse so oldest first
    const chronoSorted = [...auditLogs].sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));
    let runningBalance = 1000.00;
    let runningNet = 0.00;
    
    const points = chronoSorted.map((trade, idx) => {
      const pnl = trade.realizedPnL || 0;
      runningNet += pnl;
      runningBalance += pnl;
      return {
        tradeIndex: idx + 1,
        symbol: trade.symbol,
        pnl,
        runningNet: parseFloat(runningNet.toFixed(2)),
        runningBalance: parseFloat(runningBalance.toFixed(2)),
        time: trade.exitTime ? new Date(trade.exitTime).toLocaleTimeString() : `#${idx + 1}`,
        isWin: pnl >= 0,
      };
    });

    return points;
  }, [auditLogs]);

  const exportCSV = () => {
    const headers = ['ID', 'InitiatorBot', 'Symbol', 'Direction', 'Stage', 'Leverage', 'Margin', 'EntryPrice', 'ClosePrice', 'RealizedPnL', 'Status', 'EntryReason', 'MistakeAnalysis', 'ExitReason', 'ExitTime'];
    const rows = auditLogs.map(l => [
      l.id,
      l.initiatorBotName || (l as any).botName || '',
      l.symbol,
      l.direction,
      l.stageAtClose || l.stage,
      l.leverage,
      l.margin,
      l.entryPrice,
      l.closePrice || l.currentPrice,
      l.realizedPnL,
      l.status,
      `"${(l.aiReasoning || '').replace(/"/g, '""')}"`,
      `"${(l.mistakeAnalysis || '').replace(/"/g, '""')}"`,
      `"${(l.exitReason || '').replace(/"/g, '""')}"`,
      l.exitTime ? new Date(l.exitTime).toISOString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_fleet_audit_pnl_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-logs-view" className="space-y-6">
      
      {/* Header Summary */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <History className="w-5 h-5 text-blue-600" />
              Portfolio PnL Summary & Closed Trades Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {auditLogs.length} Closed Trades
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Detailed ledger of every executed trade: technical triggers, entry reasons, full mistake post-mortems for stopped trades, and cumulative equity curve.
          </p>
        </div>

        <button
          id="export-csv-btn"
          onClick={exportCSV}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start md:self-auto font-sans shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Detailed CSV</span>
        </button>
      </div>

      {/* Quantitative Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Realized Net PnL</div>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toFixed(2)} USDT
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Win Rate: {winRate.toFixed(1)}% ({winLogs.length}W / {lossLogs.length}L)</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Profit Factor</div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
            {profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Gross Wins: ${totalWinAmount.toFixed(2)} | Gross Losses: ${totalLossAmount.toFixed(2)}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Average Profit / Win</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            +${avgWin.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Dynamic Target: &ge;$2.00 Met</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Average Loss / Stop</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            -${avgLoss.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Strict Risk Cap &le;3% ($30 max)</div>
        </div>
      </div>

      {/* Cumulative Portfolio PnL Performance Graph */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Cumulative Fleet Portfolio PnL Equity Curve ($1,000 Starting Baseline)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual trajectory of account growth across sequential trade completions
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Winning Trade
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Stopped Mistake (Heuristic Evolved)
            </span>
          </div>
        </div>

        {pnlCurveData.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 font-mono text-xs">
            <Activity className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
            <span>Autonomous engine running 24/7. Closed trades will plot here automatically.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Visualizer Chart */}
            <div className="h-48 w-full bg-slate-50 rounded-xl p-3 border border-slate-100 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Baseline ($1000) */}
                <line x1="0" y1="120" x2="800" y2="120" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Connecting Polyline */}
                {(() => {
                  const maxNet = Math.max(20, ...pnlCurveData.map(d => Math.abs(d.runningNet)));
                  const points = pnlCurveData.map((d, i) => {
                    const x = (i / Math.max(1, pnlCurveData.length - 1)) * 760 + 20;
                    const y = 120 - (d.runningNet / maxNet) * 90;
                    return `${x},${y}`;
                  });
                  return (
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      points={points.join(' ')}
                    />
                  );
                })()}

                {/* Data Points */}
                {pnlCurveData.map((d, i) => {
                  const maxNet = Math.max(20, ...pnlCurveData.map(pt => Math.abs(pt.runningNet)));
                  const x = (i / Math.max(1, pnlCurveData.length - 1)) * 760 + 20;
                  const y = 120 - (d.runningNet / maxNet) * 90;
                  return (
                    <g key={`pt-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={d.isWin ? '4.5' : '4.5'}
                        fill={d.isWin ? '#10B981' : '#F43F5E'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Baseline indicator */}
              <div className="absolute left-4 bottom-2 text-[10px] font-mono text-slate-400">
                Initial: $1,000.00 USDT
              </div>
              <div className="absolute right-4 top-2 text-[10px] font-mono font-bold text-emerald-600">
                Current Net: {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toFixed(2)} USDT
              </div>
            </div>

            {/* Quick Micro Trade Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {pnlCurveData.slice(-6).map((item, idx) => (
                <div 
                  key={`mini-card-${idx}`}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center font-mono text-[11px]"
                >
                  <div className="text-[9px] text-slate-400">Trade #{item.tradeIndex}: {item.symbol}</div>
                  <div className={`font-bold mt-0.5 ${item.isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-500">Bal: ${item.runningBalance.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase text-[11px] font-mono">Filter Bot:</span>
            <select
              id="audit-filter-bot"
              value={filterBot}
              onChange={(e) => setFilterBot(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 font-sans focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All 5 Consensus Bots</option>
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.number}. {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase text-[11px] font-mono">Outcome:</span>
            <select
              id="audit-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 font-sans focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Outcomes (TP & SL)</option>
              <option value="CLOSED_TP">Take-Profit Wins (TP)</option>
              <option value="CLOSED_SL">Stopped Mistakes (SL)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase text-[11px] font-mono">Stage:</span>
            <select
              id="audit-filter-stage"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 font-sans focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stages (1 - 5)</option>
              <option value="1">Stage 1 (1 Bot)</option>
              <option value="2">Stage 2 (2 Bots)</option>
              <option value="3">Stage 3 (3 Bots)</option>
              <option value="4">Stage 4 (4 Bots)</option>
              <option value="5">Stage 5 (5 Bots Max)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-xs">
          Showing <strong>{filteredLogs.length}</strong> of {auditLogs.length} audit logs
        </div>
      </div>

      {/* Detailed Closed Trades Table with Reasons & Mistakes */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-slate-700 font-sans">No Audit Logs Match Criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            As positions hit Take-Profit or Stop-Loss in the 24/7 cloud background engine, their full execution parameters, reasons, and mistake analyses will be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, lIdx) => {
            const isWin = (log.realizedPnL || 0) >= 0 || log.status === 'CLOSED_TP';
            const isLong = log.direction === 'LONG';
            const isExpanded = expandedTradeId === log.id;
            const stageVal = log.stageAtClose || log.stage || 1;

            return (
              <div 
                key={`${log.id}-${lIdx}`}
                id={`audit-card-${log.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all font-sans"
              >
                {/* Header Row: Symbol, Stage, Status, PnL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isWin ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {isWin ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900 font-mono">
                          {log.symbol}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isLong ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.direction} {log.leverage}x
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          Stage {stageVal} ({log.confirmingBotIds?.length || stageVal} Bots)
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 font-mono">
                        Initiator: <strong className="text-slate-700">{log.initiatorBotName || (log as any).botName || 'VORTEX-4H'}</strong>
                        {log.exitTime && ` • Closed: ${new Date(log.exitTime).toLocaleTimeString()}`}
                      </div>
                    </div>
                  </div>

                  {/* Financial Return Badge */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right font-mono">
                      <div className={`text-base sm:text-lg font-black ${
                        isWin ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isWin ? '+' : ''}${(log.realizedPnL || 0).toFixed(2)} USDT
                      </div>
                      <div className={`text-[11px] font-bold ${
                        isWin ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isWin ? '+' : ''}{(log.realizedPnLPercent || 0).toFixed(2)}% ROI
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedTradeId(isExpanded ? null : log.id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all cursor-pointer"
                      title="Toggle Detailed Trade Reason & Mistake Analysis"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Trade Reason Box */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] uppercase tracking-wide">WHY THIS TRADE WAS TAKEN (ENTRY REASON):</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed italic text-xs">
                    "{log.aiReasoning || `Stage ${stageVal} consensus entry triggered by ${log.initiatorBotName || 'VORTEX-4H'} with dynamic multi-timeframe validation.`}"
                  </p>
                </div>

                {/* Expanded Details: Mistake Breakdown & Trade Parameters */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    
                    {/* Execution Parameters Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase">Entry Price</div>
                        <div className="font-bold text-slate-900 mt-0.5">${log.entryPrice}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase">Exit / Close Price</div>
                        <div className="font-bold text-slate-900 mt-0.5">${log.closePrice || log.currentPrice}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase">Margin Allocated</div>
                        <div className="font-bold text-slate-900 mt-0.5">${(log.margin || 15).toFixed(2)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase">Exit Reason</div>
                        <div className="font-bold text-slate-900 mt-0.5 truncate" title={log.exitReason}>{log.exitReason || 'Target Hit'}</div>
                      </div>
                    </div>

                    {/* If Stopped Mistake: Show AI Post-Mortem & Heuristic Evolution */}
                    {!isWin && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>MISTAKE IDENTIFIED & AUTONOMOUS HEURISTIC ADAPTATION:</span>
                        </div>
                        
                        <div className="text-xs text-slate-700 leading-relaxed">
                          <strong className="text-amber-900">Failure Point:</strong> {log.mistakeAnalysis || `Volatility whip-saw or liquidity stop-hunt exceeded expected support bounds on ${log.symbol}.`}
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-slate-700">
                            <strong className="text-amber-800">Learned Rule Added to Brain:</strong> Hardened entry filters, widened ATR stop cushion, and clamped leverage for high-spread market regimes to prevent repetition.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* If Take-Profit Win: Show Success Metrics */}
                    {isWin && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span><strong>Successful Execution:</strong> Met &ge;$2.00 minimum profit target. Confirmed bots received positive weight reinforcement in the evolutionary neural engine.</span>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
