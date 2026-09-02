import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bot, 
  ShieldCheck, 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Target,
  LineChart,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ArenaBot, TradePosition } from '../types';

interface BotDetailModalProps {
  bot: ArenaBot | null;
  activeTrades: TradePosition[];
  closedTrades: TradePosition[];
  onClose: () => void;
  onReturnHome?: () => void;
}

export const BotDetailModal: React.FC<BotDetailModalProps> = ({ 
  bot, 
  activeTrades,
  closedTrades,
  onClose,
  onReturnHome
}) => {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'RULES' | 'BRAIN_MEMORY' | 'STRATEGY'>('GRAPH');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'RUNNING' | 'WINS' | 'LOSSES'>('ALL');
  const [hoveredTrade, setHoveredTrade] = useState<TradePosition | null>(null);

  const handleHomeClick = React.useCallback(() => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      onClose();
    }
  }, [onReturnHome, onClose]);

  // Close on Escape key press (hook declared unconditionally at top level)
  React.useEffect(() => {
    if (!bot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleHomeClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bot, handleHomeClick]);

  if (!bot) return null;

  const isProfitable = bot.totalPnL >= 0;

  // Filter bot's running & closed trades
  const botRunningTrades = activeTrades.filter(t => t.botId === bot.id || t.botSerialNumber === bot.serialNumber);
  const botClosedTrades = closedTrades.filter(t => t.botId === bot.id || t.botSerialNumber === bot.serialNumber);
  const allBotTrades = [...botRunningTrades, ...botClosedTrades];

  const filteredTrades = allBotTrades.filter(t => {
    if (tradeFilter === 'RUNNING') return t.status === 'OPEN';
    if (tradeFilter === 'WINS') return t.status !== 'OPEN' && (t.realizedPnL || 0) >= 0;
    if (tradeFilter === 'LOSSES') return t.status !== 'OPEN' && (t.realizedPnL || 0) < 0;
    return true;
  });

  // Calculate points for the SVG Equity & Trade Graph
  const equityPoints = bot.equityHistory && bot.equityHistory.length > 0 
    ? bot.equityHistory 
    : [{ timestamp: Date.now() - 3600000, balance: 100.00 }, { timestamp: Date.now(), balance: bot.portfolioBalance }];

  const minBalance = Math.min(...equityPoints.map(p => p.balance), 95.00);
  const maxBalance = Math.max(...equityPoints.map(p => p.balance), bot.portfolioBalance + 5.00);
  const rangeY = Math.max(maxBalance - minBalance, 5.00);

  const graphWidth = 680;
  const graphHeight = 220;
  const paddingX = 45;
  const paddingY = 25;

  const minTime = equityPoints[0].timestamp;
  const maxTime = Math.max(equityPoints[equityPoints.length - 1].timestamp, Date.now());
  const rangeTime = Math.max(maxTime - minTime, 1000);

  const getX = (t: number) => {
    return paddingX + ((t - minTime) / rangeTime) * (graphWidth - 2 * paddingX);
  };

  const getY = (bal: number) => {
    return graphHeight - paddingY - ((bal - minBalance) / rangeY) * (graphHeight - 2 * paddingY);
  };

  const linePath = equityPoints.reduce((acc, point, index) => {
    const x = getX(point.timestamp);
    const y = getY(point.balance);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaPath = linePath ? `${linePath} L ${getX(equityPoints[equityPoints.length - 1].timestamp)} ${graphHeight - paddingY} L ${getX(equityPoints[0].timestamp)} ${graphHeight - paddingY} Z` : '';

  return (
    <div 
      id="bot-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleHomeClick();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="bot-detail-modal-container"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-900"
      >
        {/* Top Breadcrumb & Navigation Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button
              id="breadcrumb-return-home-btn"
              onClick={handleHomeClick}
              className="hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors text-slate-700 hover:underline"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Apex Arena Home</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-mono font-bold text-slate-900">{bot.serialNumber}</span>
            <span className="text-slate-400">({bot.name})</span>
          </div>
          <button
            id="top-return-home-btn"
            onClick={handleHomeClick}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-colors"
          >
            <span>← Return to Home Page</span>
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shadow-sm"
              style={{ backgroundColor: `${bot.accentColor || '#10B981'}18`, color: bot.accentColor || '#10B981', border: `1.5px solid ${bot.accentColor || '#10B981'}55` }}
            >
              {bot.serialNumber}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{bot.name}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {bot.strategyCategory.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  {bot.timeframe}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Gen {bot.aiBrain.evolutionGeneration || 1} Auto-Adapted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{bot.strategyTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="header-return-home-btn"
              onClick={handleHomeClick}
              title="Return to Arena Home"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Arena Home</span>
            </button>

            <button
              id="close-bot-modal-btn"
              onClick={handleHomeClick}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Portfolio Balance</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
              ${bot.portfolioBalance.toFixed(2)}
              <span className={`text-xs ml-1 font-semibold ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({isProfitable ? '+' : ''}${bot.totalPnL.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Win Rate & Trades</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
              {bot.winRate}%
              <span className="text-xs ml-1 text-slate-500 font-normal">
                ({bot.wins}W / {bot.losses}L)
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Min Profit & Risk Floor</div>
            <div className="text-xs font-bold text-slate-800 mt-1">
              🎯 Min $2.00 TP1 | Max 3% SL
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">AI Adaptation Level</div>
            <div className="text-base font-bold text-purple-700 font-mono mt-0.5 flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" />
              {bot.aiBrain.adaptationScore}/100
              <span className="text-[10px] text-purple-600 font-normal">({bot.aiBrain.mistakesLearnedCount} Lessons)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
          <button
            id="tab-bot-graph"
            onClick={() => setActiveTab('GRAPH')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'GRAPH'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Portfolio & Trades Graph</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'GRAPH' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
              {allBotTrades.length} Trades
            </span>
          </button>

          <button
            id="tab-bot-rules"
            onClick={() => setActiveTab('RULES')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'RULES'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>10 Strict Rules</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-700 font-medium">
              10/10 Verified
            </span>
          </button>

          <button
            id="tab-bot-brain"
            onClick={() => setActiveTab('BRAIN_MEMORY')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'BRAIN_MEMORY'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>AI Brain & Mistake Memory</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${activeTab === 'BRAIN_MEMORY' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-purple-700'}`}>
              {bot.aiBrain.mistakesLearnedCount} Lessons
            </span>
          </button>

          <button
            id="tab-bot-strategy"
            onClick={() => setActiveTab('STRATEGY')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'STRATEGY'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Auto-Adapted Strategy</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[58vh] space-y-4">
          
          {/* TAB 0: Portfolio Equity & Every Running / Closed Trade Graph */}
          {activeTab === 'GRAPH' && (
            <div className="space-y-4">
              
              {/* SVG Equity & Live Trade Execution Graph */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <LineChart className="w-4 h-4 text-emerald-600" />
                      Dynamic Portfolio Equity Curve & Trade Execution Points
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Displays balance trajectory from initial $100.00 with live plotted running trades & historical closed positions.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                      Running Trades ({botRunningTrades.length})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Wins ({bot.wins})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      Losses ({bot.losses})
                    </span>
                  </div>
                </div>

                {/* SVG Visualizer Canvas */}
                <div className="w-full overflow-x-auto">
                  <svg 
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`} 
                    className="w-full h-48 sm:h-56 select-none"
                  >
                    <defs>
                      <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1={paddingX} y1={paddingY} x2={graphWidth - paddingX} y2={paddingY} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={graphHeight / 2} x2={graphWidth - paddingX} y2={graphHeight / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - paddingX} y2={graphHeight - paddingY} stroke="#CBD5E1" strokeWidth="1.5" />

                    {/* Axis labels */}
                    <text x={paddingX - 6} y={paddingY + 4} textAnchor="end" fontSize="10" fill="#64748B" fontWeight="600">
                      ${maxBalance.toFixed(1)}
                    </text>
                    <text x={paddingX - 6} y={graphHeight / 2 + 4} textAnchor="end" fontSize="10" fill="#64748B" fontWeight="600">
                      ${((minBalance + maxBalance) / 2).toFixed(1)}
                    </text>
                    <text x={paddingX - 6} y={graphHeight - paddingY + 4} textAnchor="end" fontSize="10" fill="#64748B" fontWeight="600">
                      ${minBalance.toFixed(1)}
                    </text>

                    {/* Baseline $100 Reference line */}
                    {minBalance <= 100 && maxBalance >= 100 && (
                      <line 
                        x1={paddingX} 
                        y1={getY(100)} 
                        x2={graphWidth - paddingX} 
                        y2={getY(100)} 
                        stroke="#94A3B8" 
                        strokeWidth="1" 
                        strokeDasharray="4 2" 
                      />
                    )}

                    {/* Area fill */}
                    {areaPath && (
                      <path d={areaPath} fill="url(#equityGrad)" />
                    )}

                    {/* Main Equity Line */}
                    {linePath && (
                      <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* Plotted Closed Trades (Wins & Losses) */}
                    {botClosedTrades.map((trade, idx) => {
                      const tradeTime = trade.exitTime || trade.entryTime;
                      const cx = getX(tradeTime);
                      const cy = getY(trade.realizedPnL && trade.realizedPnL >= 0 ? bot.portfolioBalance - 1.5 + (idx % 3) : bot.portfolioBalance - 4.5);
                      const isWin = (trade.realizedPnL || 0) >= 0;

                      return (
                        <g 
                          key={trade.id}
                          className="cursor-pointer transition-transform hover:scale-125"
                          onMouseEnter={() => setHoveredTrade(trade)}
                          onMouseLeave={() => setHoveredTrade(null)}
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r="5.5"
                            fill={isWin ? "#10B981" : "#EF4444"}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="shadow-sm"
                          />
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill={isWin ? "#047857" : "#B91C1C"}
                          >
                            {isWin ? `+$${(trade.realizedPnL || 0).toFixed(1)}` : `-$${Math.abs(trade.realizedPnL || 0).toFixed(1)}`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Plotted Running Active Trades (Pulsating) */}
                    {botRunningTrades.map((trade, idx) => {
                      const cx = graphWidth - paddingX - 15 - idx * 25;
                      const cy = getY(bot.portfolioBalance + (trade.unrealizedPnL || 0));

                      return (
                        <g 
                          key={trade.id}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredTrade(trade)}
                          onMouseLeave={() => setHoveredTrade(null)}
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r="8"
                            fill="#F59E0B"
                            opacity="0.25"
                            className="animate-ping"
                          />
                          <polygon
                            points={`${cx},${cy - 6} ${cx + 6},${cy} ${cx},${cy + 6} ${cx - 6},${cy}`}
                            fill="#F59E0B"
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />
                          <text
                            x={cx}
                            y={cy - 10}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#B45309"
                          >
                            LIVE {trade.symbol.split('/')[0]}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Hover Tooltip Overlay */}
                {hoveredTrade && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-300">{hoveredTrade.symbol}</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${hoveredTrade.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {hoveredTrade.direction}
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        {hoveredTrade.leverage}x
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {hoveredTrade.confidenceScore}% Conf
                      </span>
                      <span className="text-slate-300">
                        Entry: ${hoveredTrade.entryPrice} | {hoveredTrade.status === 'OPEN' ? `Current: $${hoveredTrade.currentPrice}` : `Exit: $${hoveredTrade.closePrice}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hoveredTrade.status === 'OPEN' ? (
                        <span className="font-bold text-amber-400 font-mono">
                          Unrealized: {hoveredTrade.unrealizedPnL >= 0 ? '+' : ''}${hoveredTrade.unrealizedPnL.toFixed(2)} ({hoveredTrade.unrealizedPnLPercent}%)
                        </span>
                      ) : (
                        <span className={`font-bold font-mono ${(hoveredTrade.realizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Realized: {(hoveredTrade.realizedPnL || 0) >= 0 ? '+' : ''}${(hoveredTrade.realizedPnL || 0).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {hoveredTrade.exitReason || 'Running position'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trade Log Header & Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Trade History & Active Positions ({filteredTrades.length})
                  </h4>

                  <div className="flex items-center gap-1.5">
                    {(['ALL', 'RUNNING', 'WINS', 'LOSSES'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTradeFilter(mode)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          tradeFilter === mode
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {mode === 'ALL' ? 'All' : mode === 'RUNNING' ? `Running (${botRunningTrades.length})` : mode === 'WINS' ? `Wins (${bot.wins})` : `Losses (${bot.losses})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trade List Table */}
                {filteredTrades.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No trades match the selected filter.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2.5">Asset / Dir</th>
                            <th className="px-3 py-2.5">Entry / Targets</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5 text-right">PnL (Min $2.00 TP1)</th>
                            <th className="px-3 py-2.5">AI Confirmation / Exit Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTrades.map((t) => {
                            const isRunning = t.status === 'OPEN';
                            const isWin = !isRunning && (t.realizedPnL || 0) >= 0;
                            const pnlValue = isRunning ? t.unrealizedPnL : (t.realizedPnL || 0);

                            return (
                              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="font-bold text-slate-900">{t.symbol}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${t.direction === 'LONG' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      {t.direction}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                      {t.leverage}x
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                      {t.confidenceScore}% Conf
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                                  <div className="text-slate-800">Entry: <strong>${t.entryPrice}</strong></div>
                                  <div className="text-emerald-700 text-[10px] font-semibold">
                                    TP1: ${t.tp1Price} {t.tp1Hit && '✓'} | TP2: ${t.tp2Price} {t.tp2Hit && '✓'}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  {isRunning ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      RUNNING LIVE
                                    </span>
                                  ) : isWin ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      CLOSED WIN
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      STOP LOSS HIT
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-2.5 whitespace-nowrap text-right font-mono font-bold">
                                  <div className={pnlValue >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                    {pnlValue >= 0 ? '+' : ''}${pnlValue.toFixed(2)}
                                  </div>
                                  {t.tp1Hit && (
                                    <div className="text-[10px] text-emerald-600 font-normal">
                                      TP1 Booked: +${t.tp1BookedAmount?.toFixed(2) || '2.05'}
                                    </div>
                                  )}
                                </td>

                                <td className="px-3 py-2.5 text-[11px] text-slate-600 max-w-xs truncate">
                                  {t.exitReason || t.aiBrainRationale}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: 10 Strict Confirmation Rules */}
          {activeTab === 'RULES' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-center justify-between">
                <span>🛡 <strong>Rule Gatekeeper Mandate:</strong> At least <strong>9 of 10 confirmation rules</strong> must be satisfied with confidence score ≥ 90% before this bot executes any trade.</span>
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-600 text-white font-mono font-bold text-xs">
                  9/10 Required
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bot.confirmationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {rule.ruleNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{rule.ruleName}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 shrink-0">
                          {rule.timeframe}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{rule.description}</p>
                      <div className="mt-2 text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Status: {rule.liveValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AI Brain & Mistake Memory */}
          {activeTab === 'BRAIN_MEMORY' && (
            <div className="space-y-4">
              
              {/* Brain Summary Banner */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-700" />
                    <h3 className="text-sm font-bold text-purple-900">Self-Learning Neural Heuristics Engine</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleHomeClick}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Return to Arena Home</span>
                    </button>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-600 text-white">
                      {bot.aiBrain.learningLevel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-purple-800">
                  This bot automatically reviews past trade outcomes. When a trade incurs a loss, the AI Brain diagnoses the root cause, extracts preventative lessons, and establishes permanent anti-repeat rules to automatically adapt future entries.
                </p>
              </div>

              {/* Active Anti-Repeat Rules */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Active Anti-Repeat Rules ({bot.aiBrain.antiRepeatRulesActive.length})
                </h4>
                <div className="space-y-2">
                  {bot.aiBrain.antiRepeatRulesActive.map((ruleText, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ruleText}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mistake Memory Logs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Mistake Memory & Adaptation Logs ({bot.aiBrain.mistakeMemory.length})
                </h4>

                {bot.aiBrain.mistakeMemory.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Zero loss mistakes recorded yet. All trades executed under strict 9/10 confirmation parameters.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bot.aiBrain.mistakeMemory.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{log.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-mono font-bold">
                              -{log.lossPercent.toFixed(1)}% (-${log.lossAmountUsd.toFixed(2)})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700">
                          <strong className="text-rose-700">Root Cause:</strong> {log.rootCause}
                        </div>
                        <div className="text-xs text-slate-700">
                          <strong className="text-amber-800">Preventative Lesson:</strong> {log.preventativeLesson}
                        </div>
                        <div className="text-xs text-slate-700">
                          <strong className="text-emerald-700">Adaptation Applied:</strong> {log.adaptationApplied}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Auto-Adapted Strategy Architecture */}
          {activeTab === 'STRATEGY' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Strategy Execution Methodology
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Gen {bot.aiBrain.evolutionGeneration || 1} Active
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {bot.strategyDescription}
                </p>
              </div>

              {/* Dynamic TP & Risk Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    🎯 TP1 Target (Min $2.00 PnL)
                  </div>
                  <div className="text-emerald-900 text-[11px] leading-relaxed">
                    Secures at least <strong>$2.00 profit</strong> when hit. Automatically shifts Stop Loss to Entry Break-Even eliminating remaining risk.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200">
                  <div className="font-bold text-cyan-800 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-cyan-600" />
                    💎 TP2 Target (Secondary Profit)
                  </div>
                  <div className="text-cyan-900 text-[11px] leading-relaxed">
                    Captures secondary impulse. Secures additional profit & shifts Stop Loss to TP1 price to lock major upside gains.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                  <div className="font-bold text-purple-800 mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                    🏃 40% Trailing Runner
                  </div>
                  <div className="text-purple-900 text-[11px] leading-relaxed">
                    Trails along dynamic EMA/structure to capture high-multiple continuation runs.
                  </div>
                </div>
              </div>

              {/* Auto-Adapted Evolution Log */}
              {bot.aiBrain.strategyEvolutionLog && bot.aiBrain.strategyEvolutionLog.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Adapted Strategy Evolution Log
                  </h4>
                  <div className="space-y-1.5">
                    {bot.aiBrain.strategyEvolutionLog.map((logItem, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>{logItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Bot Status: <strong className="text-emerald-700">ACTIVE & SCANNING</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="bot-brain-return-home-footer-btn"
              onClick={handleHomeClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span>Return to Arena Home</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
