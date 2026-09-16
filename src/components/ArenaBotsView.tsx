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
  ChevronRight,
  Pause,
  Play,
  Trash2,
  Plus,
  X,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ArenaBot, RankingMode, StrategyCategoryType } from '../types';

interface ArenaBotsViewProps {
  bots: ArenaBot[];
  onSelectBot: (bot: ArenaBot) => void;
  onToggleBotStatus?: (botId: string) => void;
  onDeleteBot?: (botId: string) => void;
  onCreateCombinationBot?: (data: { name: string; parentAId: string; parentBId: string; customSerialNumber?: string }) => void;
}

export const ArenaBotsView: React.FC<ArenaBotsViewProps> = ({ 
  bots, 
  onSelectBot,
  onToggleBotStatus,
  onDeleteBot,
  onCreateCombinationBot 
}) => {
  const [rankingMode, setRankingMode] = useState<RankingMode>('ALPHABETICAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Combination modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboSerial, setComboSerial] = useState('BOT-51');
  const [parentAId, setParentAId] = useState('');
  const [parentBId, setParentBId] = useState('');

  // In-app Delete Confirmation Modal State (replaces blocked window.confirm)
  const [botToDelete, setBotToDelete] = useState<ArenaBot | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: `All ${bots.length} Bots`, value: 'ALL' },
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

                  {/* Top Right Actions & Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Active / Pause Toggle Button */}
                    {onToggleBotStatus && (
                      <button
                        type="button"
                        id={`toggle-bot-btn-${bot.id}`}
                        title={bot.status === 'PAUSED' ? 'Resume Bot Execution' : 'Pause Bot Execution'}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onToggleBotStatus(bot.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 min-h-[32px] cursor-pointer shadow-2xs ${
                          bot.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                        }`}
                      >
                        {bot.status === 'PAUSED' ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                            <span className="text-[11px]">Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current text-slate-600" />
                            <span className="text-[11px]">Pause</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Delete Bot Button */}
                    {onDeleteBot && (
                      <button
                        type="button"
                        id={`delete-bot-btn-${bot.id}`}
                        title={`Delete ${bot.serialNumber} (${bot.name})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setBotToDelete(bot);
                        }}
                        className="p-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status & Hybrid Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {bot.status === 'PAUSED' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Pause className="w-2.5 h-2.5 fill-current" />
                      PAUSED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  )}

                  {bot.isCombinationBot && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-purple-600" />
                      Dual-Consensus Hybrid
                    </span>
                  )}

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
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

      {/* Bottom CTA: Create New Bot (Combination of Two Current Bots) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Create New Bot (Combination of Two Bots)</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Dual-Consensus Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Create a hybrid bot from two existing bots (e.g. <strong>Bot No 51 Lunar Eclipse</strong> combining <em>3.Apex Breakout + 7.Gravity Pullback</em>). Starts with $100 balance and only executes when <strong>BOTH</strong> parent strategies confirm the exact same trade setup and direction.
          </p>
        </div>

        <button
          id="create-new-combination-bot-btn"
          onClick={() => {
            const existingNums = bots.map(b => parseInt(b.serialNumber.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
            const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 41;
            setComboSerial(`BOT-${String(nextNum).padStart(2, '0')}`);
            if (bots.length >= 2) {
              setParentAId(bots[0].id);
              setParentBId(bots[1].id);
              setComboName(`Lunar Eclipse (${bots[0].serialNumber}.${bots[0].name} + ${bots[1].serialNumber}.${bots[1].name})`);
            }
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bot</span>
        </button>
      </div>

      {/* Modal: Create Combination Bot */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Combination Bot</h3>
                  <p className="text-xs text-slate-500">Combines two strategies into a dual-consensus trading bot</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs">
              {/* Bot Number and Name */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="font-bold text-slate-700">Bot Number:</label>
                  <input
                    type="text"
                    value={comboSerial}
                    onChange={(e) => setComboSerial(e.target.value)}
                    placeholder="BOT-51"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Bot Name:</label>
                  <input
                    type="text"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    placeholder="e.g. Lunar Eclipse"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Select Parent Bot A */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Parent Strategy A:</label>
                <select
                  value={parentAId}
                  onChange={(e) => {
                    const newA = e.target.value;
                    setParentAId(newA);
                    const botA = bots.find(b => b.id === newA);
                    const botB = bots.find(b => b.id === parentBId);
                    if (botA && botB) {
                      setComboName(`Lunar Eclipse (${botA.serialNumber}.${botA.name} + ${botB.serialNumber}.${botB.name})`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Choose first parent bot...</option>
                  {bots.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === parentBId}>
                      {b.serialNumber} • {b.name} ({b.strategyCategory})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Parent Bot B */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Parent Strategy B:</label>
                <select
                  value={parentBId}
                  onChange={(e) => {
                    const newB = e.target.value;
                    setParentBId(newB);
                    const botA = bots.find(b => b.id === parentAId);
                    const botB = bots.find(b => b.id === newB);
                    if (botA && botB) {
                      setComboName(`Lunar Eclipse (${botA.serialNumber}.${botA.name} + ${botB.serialNumber}.${botB.name})`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Choose second parent bot...</option>
                  {bots.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === parentAId}>
                      {b.serialNumber} • {b.name} ({b.strategyCategory})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dual-Consensus Rule Explainer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dual-Consensus Execution Rules:
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>• Starting Balance: <strong>$100.00</strong> dynamic portfolio.</p>
                  <p>• Dual-Confirmation: The bot will <strong>ONLY</strong> trade if Strategy A and Strategy B BOTH confirm the exact same direction (LONG/SHORT).</p>
                  <p>• Takes the best trade across 300+ verified coins with dynamic leverage, TP1 booked at 50% (SL to Entry), and full close at TP2.</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!parentAId || !parentBId || parentAId === parentBId}
                onClick={() => {
                  if (parentAId && parentBId && parentAId !== parentBId) {
                    onCreateCombinationBot?.({
                      name: comboName.trim(),
                      parentAId,
                      parentBId,
                      customSerialNumber: comboSerial.trim(),
                    });
                    setIsCreateModalOpen(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !parentAId || !parentBId || parentAId === parentBId
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy Combination Bot ($100 Balance)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Bot Confirmation (In-App, No window.confirm) */}
      {botToDelete && (
        <div 
          id="delete-bot-modal-backdrop"
          onClick={() => setBotToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div 
            id="delete-bot-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete {botToDelete.serialNumber}?
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {botToDelete.name} • {botToDelete.strategyCategory.replace('_', ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBotToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">⚠️ Are you sure you want to delete this trading bot?</p>
              <p className="text-[11px] text-rose-700">
                • Current Portfolio Balance: <strong>${botToDelete.portfolioBalance.toFixed(2)}</strong> ({botToDelete.totalPnL >= 0 ? '+' : ''}${botToDelete.totalPnL.toFixed(2)})
              </p>
              <p className="text-[11px] text-rose-700">
                • Any active trades for {botToDelete.serialNumber} will be immediately closed and cancelled.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="cancel-delete-bot-btn"
                onClick={() => setBotToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-bot-btn"
                onClick={() => {
                  if (botToDelete && onDeleteBot) {
                    onDeleteBot(botToDelete.id);
                    setBotToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete Bot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
