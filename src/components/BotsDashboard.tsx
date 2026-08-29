import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Zap, 
  Play, 
  Pause, 
  BrainCircuit, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';
import { TradingBot, TradePosition, MasterPortfolio } from '../types';
import { STAGE_CONFIGS } from '../services/tradingEngine';

interface BotsDashboardProps {
  bots: TradingBot[];
  activeTrades: TradePosition[];
  masterPortfolio?: MasterPortfolio;
  onManualTradeClick: (bot: TradingBot) => void;
  onCloseTrade: (tradeId: string) => void;
  onToggleBotStatus: (botId: string) => void;
  onViewBrainLessons: (bot: TradingBot) => void;
}

export const BotsDashboard: React.FC<BotsDashboardProps> = ({
  bots,
  activeTrades,
  masterPortfolio,
  onManualTradeClick,
  onCloseTrade,
  onToggleBotStatus,
  onViewBrainLessons,
}) => {
  return (
    <div id="specialist-bots-grid" className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <Bot className="w-5 h-5 text-blue-600" />
              5 Specialist Consensus Brains ($1,000 Master Fleet)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Unlimited Concurrent Trading
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Each bot operates as an autonomous signal generator and validation engine. When a setup occurs, bots cross-confirm the signal to determine entry stage (1 to 5). Bots trade freely without arbitrary position limits.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Master Portfolio Base</div>
            <div className="text-base font-black text-slate-900">
              ${(masterPortfolio?.currentBalance || 1000).toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>

      {/* Bots Grid */}
      <div className="grid grid-cols-1 gap-5">
        {bots.map((bot) => {
          // Find all active trades where this bot is either initiator or confirming
          const participatingTrades = activeTrades.filter(
            t => t.initiatorBotId === bot.id || t.confirmingBotIds.includes(bot.id)
          );

          const totalClosed = bot.winTrades + bot.lossTrades;
          const winRate = totalClosed > 0 ? (bot.winTrades / totalClosed) * 100 : 0;
          const assistedPnL = bot.assistedPnL || bot.totalPnL || 0;

          return (
            <div
              key={bot.id}
              id={`bot-card-${bot.id}`}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all relative overflow-hidden"
            >
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Bot Identity & Strategy Details */}
                <div className="flex items-start gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-base shrink-0 border"
                    style={{
                      backgroundColor: `${bot.accentColor}12`,
                      borderColor: `${bot.accentColor}30`,
                      color: bot.accentColor,
                    }}
                  >
                    {bot.number}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                        {bot.number}. {bot.name}
                      </h3>
                      <span className="text-xs font-semibold text-slate-500">
                        ({bot.strategyTitle})
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {bot.strategyBadge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        TF: {bot.timeframe} • Consensus Weight: {((bot.strategyWeight || 0.2) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 max-w-3xl leading-relaxed">
                      {bot.strategyDescription}
                    </p>
                  </div>
                </div>

                {/* Status Badge & Control Buttons */}
                <div className="flex items-center gap-2 self-start shrink-0">
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                    bot.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${bot.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    24/7 {bot.status}
                  </div>

                  <button
                    id={`toggle-bot-${bot.id}`}
                    onClick={() => onToggleBotStatus(bot.id)}
                    title={bot.status === 'ACTIVE' ? 'Pause Signal Scanning' : 'Activate Signal Scanning'}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                  >
                    {bot.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    id={`auto-trade-btn-${bot.id}`}
                    onClick={() => onManualTradeClick(bot)}
                    title="Scan top 500 coins and trigger immediate staged trade execution from this specialist bot"
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Trigger Signal Scan</span>
                  </button>
                </div>

              </div>

              {/* Bot Performance Metrics Grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
                
                {/* Signals & Confirmations */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Consensus Activity</span>
                    <span className="font-mono text-blue-600 font-bold">Weight {((bot.strategyWeight || 0.2) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {bot.signalsGenerated || 0} <span className="text-xs font-normal text-slate-500">Signals</span>
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {bot.confirmationsContributed || 0} Confirms
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Participating in {participatingTrades.length} Active Trades
                  </div>
                </div>

                {/* Assisted Closed Trades & W/L */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Assisted Closed Trades</span>
                    <span className="font-semibold text-slate-700">W / L Record</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {totalClosed} <span className="text-xs font-normal text-slate-500">Trades</span>
                    </span>
                    <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                      <span className="text-emerald-600">{bot.winTrades}W</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-rose-600">{bot.lossTrades}L</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Fleet Master PnL Contributed
                  </div>
                </div>

                {/* Win Rate & PnL */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Assisted Win Rate</span>
                    <span className={`font-mono font-bold ${assistedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {assistedPnL >= 0 ? '+' : ''}${assistedPnL.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono flex justify-between">
                    <span>Rate: <strong className="text-slate-800">{winRate.toFixed(1)}%</strong></span>
                    <span>No Trade Limit Active</span>
                  </div>
                </div>

                {/* AI Brain Learning Hub */}
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase font-bold text-purple-700 flex items-center gap-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                      Autonomous Brain
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-mono font-semibold">
                      {bot.learningNotes.length} Lessons
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-purple-900 line-clamp-2">
                    {bot.learningNotes.length > 0 
                      ? bot.learningNotes[0].learnedLesson 
                      : 'Brain actively diagnosing error post-mortems and tuning parameters.'}
                  </div>
                  <button
                    id={`view-brain-btn-${bot.id}`}
                    onClick={() => onViewBrainLessons(bot)}
                    className="mt-2 text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Mistake Learning Journal</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

              </div>

              {/* Active Participating Positions for this Bot */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Currently Participating Trades ({participatingTrades.length} Active)
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dynamic Staged Sizing • Multi-Bot Consensus
                  </span>
                </div>

                {participatingTrades.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No active positions for {bot.name} right now. Click "Trigger Signal Scan" to initiate a staged trade.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participatingTrades.map((trade, tIdx) => {
                      const isLong = trade.direction === 'LONG';
                      const pnlIsPos = trade.unrealizedPnL >= 0;
                      const config = STAGE_CONFIGS[trade.stage] || STAGE_CONFIGS[1];

                      return (
                        <div
                          key={`${bot.id}-${trade.id}-${tIdx}`}
                          id={`active-trade-row-${bot.id}-${trade.id}`}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                              style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                            >
                              Stage {trade.stage}
                            </span>

                            <div className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-1 ${
                              isLong 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {trade.symbol} {trade.direction} ({trade.leverage}x)
                            </div>

                            <div className="text-xs font-mono text-slate-600">
                              Entry: <strong className="text-slate-900">${trade.entryPrice}</strong> • Mark: <strong className="text-blue-600">${trade.currentPrice}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right font-mono">
                              <div className={`text-xs font-bold ${pnlIsPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pnlIsPos ? '+' : ''}${trade.unrealizedPnL.toFixed(2)} ({pnlIsPos ? '+' : ''}{trade.unrealizedPnLPercent.toFixed(2)}%)
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Margin: ${trade.margin.toFixed(2)} | TP: ${trade.takeProfitPrice}
                              </div>
                            </div>

                            <button
                              id={`close-trade-btn-${trade.id}`}
                              onClick={() => onCloseTrade(trade.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
