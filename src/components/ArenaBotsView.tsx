import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Award, 
  Search, 
  SlidersHorizontal, 
  Brain, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Zap,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ArenaBot, RankingMode, StrategyCategoryType } from '../types';

interface ArenaBotsViewProps {
  bots: ArenaBot[];
  onSelectBot: (bot: ArenaBot) => void;
}

export const ArenaBotsView: React.FC<ArenaBotsViewProps> = ({ bots, onSelectBot }) => {
  const [rankingMode, setRankingMode] = useState<RankingMode>('ALPHABETICAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories: { label: string; value: string }[] = [
    { label: 'All 40 Bots', value: 'ALL' },
    { label: 'Trend Following', value: 'TREND' },
    { label: 'Breakout & Volume', value: 'BREAKOUT' },
    { label: 'Pullback & Retest', value: 'PULLBACK' },
    { label: 'SMC & Order Block', value: 'SMC_ORDER_BLOCK' },
    { label: 'Liquidity Sweep', value: 'LIQUIDITY_SWEEP' },
    { label: 'Mean Reversion', value: 'MEAN_REVERSION' },
    { label: 'Volatility Squeeze', value: 'VOLATILITY_SQUEEZE' },
    { label: 'Orderflow & CVD', value: 'ORDERFLOW_CVD' },
    { label: 'Neural & Sentiment', value: 'NEURAL_SENTIMENT' },
    { label: 'Price Action', value: 'PRICE_ACTION' },
    { label: 'Momentum', value: 'MOMENTUM' },
  ];

  const sortedAndFilteredBots = useMemo(() => {
    let list = [...bots];

    // Filter by category
    if (categoryFilter !== 'ALL') {
      list = list.filter(b => b.strategyCategory === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(b => 
        b.name.toLowerCase().includes(q) || 
        b.serialNumber.toLowerCase().includes(q) || 
        b.strategyTitle.toLowerCase().includes(q) ||
        b.strategyCategory.toLowerCase().includes(q)
      );
    }

    // Sort by selected mode
    switch (rankingMode) {
      case 'ALPHABETICAL':
        return list.sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
      case 'WIN_RATE':
        return list.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
      case 'PORTFOLIO_VALUE':
        return list.sort((a, b) => b.portfolioBalance - a.portfolioBalance);
      case 'TOTAL_PNL':
        return list.sort((a, b) => b.totalPnL - a.totalPnL);
      case 'TOTAL_TRADES':
        return list.sort((a, b) => b.totalTrades - a.totalTrades);
      default:
        return list;
    }
  }, [bots, rankingMode, searchQuery, categoryFilter]);

  return (
    <div id="arena-bots-view" className="space-y-6 text-slate-900">
      
      {/* Control Bar: Ranking Modes, Category Filters & Search */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        
        {/* Top Controls: Ranking Toggle Buttons & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Ranking Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              Rank Arena:
            </span>

            <button
              id="rank-alphabetical-btn"
              onClick={() => setRankingMode('ALPHABETICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                rankingMode === 'ALPHABETICAL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🔤 Alphabetical (BOT-01 to 40)</span>
            </button>

            <button
              id="rank-winrate-btn"
              onClick={() => setRankingMode('WIN_RATE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                rankingMode === 'WIN_RATE'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Win Rate %</span>
            </button>

            <button
              id="rank-portfolio-btn"
              onClick={() => setRankingMode('PORTFOLIO_VALUE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                rankingMode === 'PORTFOLIO_VALUE'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Portfolio Value</span>
            </button>

            <button
              id="rank-pnl-btn"
              onClick={() => setRankingMode('TOTAL_PNL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                rankingMode === 'TOTAL_PNL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Total PnL ($)</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-bots-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bot name, strategy..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category Filters Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 40 Trading Bots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedAndFilteredBots.map((bot) => {
          const isProfitable = bot.totalPnL >= 0;
          const pnlColor = isProfitable ? 'text-emerald-600' : 'text-rose-600';
          const pnlBadgeBg = isProfitable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={bot.id}
              id={`bot-card-${bot.serialNumber.toLowerCase()}`}
              onClick={() => onSelectBot(bot)}
              className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              {/* Accent colored top strip */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: bot.accentColor || '#10B981' }}
              />

              {/* Bot Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-2xs"
                      style={{ 
                        backgroundColor: `${bot.accentColor || '#10B981'}15`, 
                        color: bot.accentColor || '#10B981',
                        border: `1.5px solid ${bot.accentColor || '#10B981'}40`
                      }}
                    >
                      {bot.serialNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                        {bot.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-700 px-1.5 py-0.2 rounded bg-cyan-50 border border-cyan-200">
                          {bot.timeframe}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {bot.strategyCategory.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Generation Badge */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                    Gen {bot.aiBrain.evolutionGeneration || 1}
                  </span>
                </div>

                {/* Strategy Subtitle */}
                <p className="text-xs text-slate-600 line-clamp-2 mb-3 min-h-[32px] font-medium leading-relaxed">
                  {bot.strategyTitle}
                </p>
              </div>

              {/* Core Financial & Performance Stats */}
              <div className="space-y-2.5 pt-2.5 border-t border-slate-100 text-xs">
                
                {/* Dynamic Balance & PnL */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Dynamic Balance:</span>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-900 text-sm">
                      ${bot.portfolioBalance.toFixed(2)}
                    </span>
                    <span className={`text-[11px] ml-1 font-semibold ${pnlColor}`}>
                      ({isProfitable ? '+' : ''}${bot.totalPnL.toFixed(2)})
                    </span>
                  </div>
                </div>

                {/* Win Rate & Total Closed */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Win Rate & Trades:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-800">{bot.winRate}%</span>
                    <span className="text-[10px] text-slate-500">
                      ({bot.wins}W / {bot.losses}L)
                    </span>
                  </div>
                </div>

                {/* Active Trades & AI Brain Level */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {bot.activeTradesCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        {bot.activeTradesCount} Active Trade{bot.activeTradesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Scanning CMC 500...</span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-purple-600" />
                    {bot.aiBrain.mistakesLearnedCount} Learned
                  </span>
                </div>

                {/* Card CTA Inspect Footer */}
                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                  <span>Inspect Graph & 10 Rules</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedAndFilteredBots.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Bot className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No trading bots match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search query or category filter</p>
        </div>
      )}
    </div>
  );
};
