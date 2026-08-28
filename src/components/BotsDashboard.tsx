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
  Sliders, 
  CheckCircle2,
  XCircle,
  ExternalLink,
  Target,
  Shield
} from 'lucide-react';
import { TradingBot, TradePosition } from '../types';

interface BotsDashboardProps {
  bots: TradingBot[];
  activeTrades: TradePosition[];
  onManualTradeClick: (bot: TradingBot) => void;
  onCloseTrade: (tradeId: string) => void;
  onToggleBotStatus: (botId: string) => void;
  onViewBrainLessons: (bot: TradingBot) => void;
}

export const BotsDashboard: React.FC<BotsDashboardProps> = ({
  bots,
  activeTrades,
  onManualTradeClick,
  onCloseTrade,
  onToggleBotStatus,
  onViewBrainLessons,
}) => {
  return (
    <div id="specialist-bots-grid" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            5 SPECIALIST BOTS FLEET DASHBOARD
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous execution engines with distinct strategies, machine learning brains, and dynamic 5% compounding.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 hidden sm:block">
          All 5 Bots Initialized @ $100.00 Base
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {bots.map((bot) => {
          const botTrades = activeTrades.filter(t => t.botId === bot.id);
          const totalClosed = bot.winTrades + bot.lossTrades;
          const winRate = totalClosed > 0 ? (bot.winTrades / totalClosed) * 100 : 0;
          const netPnL = bot.balance - bot.initialBalance;
          const netPnLPct = (netPnL / bot.initialBalance) * 100;

          return (
            <div
              key={bot.id}
              id={`bot-card-${bot.id}`}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Bot Identity & Strategy Details */}
                <div className="flex items-start gap-3.5">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border"
                    style={{
                      backgroundColor: `${bot.accentColor}10`,
                      borderColor: `${bot.accentColor}30`,
                      color: bot.accentColor,
                    }}
                  >
                    {bot.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
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
                        TF: {bot.timeframe} • Leverage: {bot.minLeverage}x-{bot.maxLeverage}x
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
                    <span className={`w-2 h-2 rounded-full ${bot.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    24/7 {bot.status}
                  </div>

                  <button
                    id={`toggle-bot-${bot.id}`}
                    onClick={() => onToggleBotStatus(bot.id)}
                    title={bot.status === 'ACTIVE' ? 'Pause Bot' : 'Activate Bot'}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                  >
                    {bot.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    id={`auto-trade-btn-${bot.id}`}
                    onClick={() => onManualTradeClick(bot)}
                    title="Trigger immediate autonomous market scan and trade execution for this bot"
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>Auto-Trade Now</span>
                  </button>
                </div>

              </div>

              {/* Bot Financial & Performance Grid */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Account Balance Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Bot Account Balance</span>
                    <span className="font-mono">Base: ${bot.initialBalance.toFixed(2)}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      ${bot.balance.toFixed(2)}
                    </span>
                    <span className={`text-xs font-bold font-mono ${
                      netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)} ({netPnL >= 0 ? '+' : ''}{netPnLPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Next Margin: ${(bot.balance * 0.05).toFixed(2)} (5% dynamic)
                  </div>
                </div>

                {/* Total Trades & W/L */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Total Closed Trades</span>
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
                    Audit Confirmed Live
                  </div>
                </div>

                {/* Win Rate */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="uppercase font-bold">Win Rate %</span>
                    <span className="font-mono text-blue-600 font-bold">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${winRate}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono flex justify-between">
                    <span>Target: &gt;65%</span>
                    <span>Min Win: &gt;$2.00</span>
                  </div>
                </div>

                {/* AI Brain Learning Hub */}
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase font-bold text-purple-700 flex items-center gap-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                      AI Brain Memory
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-mono font-semibold">
                      {bot.learningNotes.length} Lessons
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-purple-900 line-clamp-2">
                    {bot.learningNotes.length > 0 
                      ? bot.learningNotes[bot.learningNotes.length - 1].learnedLesson 
                      : 'Brain AI actively monitoring market flow & adapting.'}
                  </div>
                  <button
                    id={`view-brain-btn-${bot.id}`}
                    onClick={() => onViewBrainLessons(bot)}
                    className="mt-2 text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>View Mistake Learning Journal</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

              </div>

              {/* Active Running Positions Section for this Bot */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Positions ({botTrades.length} Running)
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Target: &gt;$2.00 Net Win | Max 3% SL
                  </span>
                </div>

                {botTrades.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No active positions. The 24/7 autonomous engine is scanning the top 500 coin market for {bot.name} strategy triggers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {botTrades.map((trade) => {
                      const isLong = trade.direction === 'LONG';
                      const pnlIsPos = trade.unrealizedPnL >= 0;

                      return (
                        <div
                          key={trade.id}
                          id={`active-trade-row-${trade.id}`}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-md text-xs font-bold font-mono flex items-center gap-1 ${
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
                                Margin: ${trade.margin.toFixed(2)} | TP: ${trade.takeProfitPrice} (+${trade.targetProfitUsd.toFixed(2)})
                              </div>
                            </div>

                            <button
                              id={`close-trade-btn-${trade.id}`}
                              onClick={() => onCloseTrade(trade.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
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
