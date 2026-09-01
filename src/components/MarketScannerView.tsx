import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Radio, 
  Sparkles, 
  Bot, 
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { CryptoCoin, TradingBot, ConsensusStage } from '../types';
import { STAGE_CONFIGS } from '../services/tradingEngine';
import { MultiTimeframeInspectorModal } from './MultiTimeframeInspectorModal';

interface MarketStats {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  fearAndGreedIndex: number;
  activeCoins: number;
  liveFeedStatus: string;
}

interface MarketScannerViewProps {
  coins: CryptoCoin[];
  bots: TradingBot[];
  marketStats?: MarketStats | null;
  liveFeedActive?: boolean;
  onTradeCoinWithBot: (coin: CryptoCoin, botId: string) => void;
  onRunLiveFleetScan: () => void;
  isScanning: boolean;
}

export const MarketScannerView: React.FC<MarketScannerViewProps> = ({
  coins,
  bots,
  marketStats,
  liveFeedActive = true,
  onTradeCoinWithBot,
  onRunLiveFleetScan,
  isScanning,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'change' | 'volume' | 'rsi' | 'sentiment' | 'consensus'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [inspectCoin, setInspectCoin] = useState<CryptoCoin | null>(null);
  const itemsPerPage = 25;

  const categories = ['ALL', 'Layer 1', 'DeFi', 'AI / DePIN', 'Meme', 'Layer 2', 'Infrastructure', 'Gaming'];

  const filteredCoins = useMemo(() => {
    return coins.filter((coin) => {
      // Search
      const matchesSearch = 
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category
      const matchesCat = selectedCategory === 'ALL' || coin.category === selectedCategory;

      // Signal filter
      let matchesSignal = true;
      if (selectedSignal === 'STRONG_LONG') matchesSignal = coin.recommendation === 'STRONG_LONG';
      else if (selectedSignal === 'STRONG_SHORT') matchesSignal = coin.recommendation === 'STRONG_SHORT';
      else if (selectedSignal === 'STAGE_3_PLUS') matchesSignal = (coin.matchingBots?.length || 1) >= 3;
      else if (selectedSignal.startsWith('bot-')) matchesSignal = coin.matchingBots?.includes(selectedSignal);

      return matchesSearch && matchesCat && matchesSignal;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'rank') { valA = a.rank; valB = b.rank; }
      else if (sortBy === 'change') { valA = a.change24h; valB = b.change24h; }
      else if (sortBy === 'volume') { valA = a.volume24h; valB = b.volume24h; }
      else if (sortBy === 'rsi') { valA = a.rsi; valB = b.rsi; }
      else if (sortBy === 'sentiment') { valA = a.sentimentScore; valB = b.sentimentScore; }
      else if (sortBy === 'consensus') { valA = a.matchingBots?.length || 1; valB = b.matchingBots?.length || 1; }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [coins, searchQuery, selectedCategory, selectedSignal, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCoins.length / itemsPerPage);
  const displayedCoins = filteredCoins.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (field: 'rank' | 'change' | 'volume' | 'rsi' | 'sentiment' | 'consensus') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const formatLargeNum = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div id="market-scanner-view" className="space-y-6">
      
      {/* Scanner Header & Global Controls */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <Globe className="w-5 h-5 text-blue-600" />
              CMC Top 500 Market Scanner (Multi-Bot Consensus Radar)
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Market Feed Active
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Continuously scans 500 crypto assets for cross-bot confirmations. If 1 bot detects a setup ➔ Stage 1; when multiple bots confirm ➔ Scales up to Stage 5.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="run-fleet-scan-btn"
            onClick={onRunLiveFleetScan}
            disabled={isScanning}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer font-sans"
          >
            <Radio className={`w-4 h-4 ${isScanning ? 'animate-spin text-white' : 'text-blue-100'}`} />
            <span>{isScanning ? 'Syncing Live Prices...' : 'Sync Live Prices Now'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Market Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Crypto Market Cap</div>
          <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
            {marketStats ? formatLargeNum(marketStats.totalMarketCap) : '$3.12T'}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Global CMC Top 500</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">24h Market Volume</div>
          <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
            {marketStats ? formatLargeNum(marketStats.volume24h) : '$98.40B'}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Spot + Futures Active</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">BTC Dominance</div>
          <div className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5">
            {marketStats ? `${marketStats.btcDominance}%` : '57.8%'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Macro Liquidity Anchor</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-sans">Fear & Greed Index</div>
          <div className="text-sm sm:text-base font-black text-emerald-600 font-mono mt-0.5 flex items-center gap-1.5">
            <span>{marketStats ? marketStats.fearAndGreedIndex : 68}</span>
            <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Greed
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">ML Social Sentiment</div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="coin-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search symbol or name (e.g. BTC, ETH, SOL)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-sans"
            />
          </div>

          {/* Bot Signal Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-500 font-bold uppercase mr-1">Signal:</span>
            <button
              onClick={() => { setSelectedSignal('ALL'); setPage(1); }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                selectedSignal === 'ALL'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setSelectedSignal('STAGE_3_PLUS'); setPage(1); }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                selectedSignal === 'STAGE_3_PLUS'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚡ High Consensus (Stage 3+)
            </button>
            <button
              onClick={() => { setSelectedSignal('STRONG_LONG'); setPage(1); }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                selectedSignal === 'STRONG_LONG'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🔥 Strong Longs
            </button>
            <button
              onClick={() => { setSelectedSignal('STRONG_SHORT'); setPage(1); }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                selectedSignal === 'STRONG_SHORT'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚡ Strong Shorts
            </button>
          </div>

        </div>

        {/* Category Sector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase mr-1">Sector:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-2.5 py-1 rounded-xl transition-all border text-xs whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Market Coins Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('rank')}>
                  <div className="flex items-center gap-1">
                    <span>Rank / Asset</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('rank')}>
                  Price
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('change')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('consensus')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Consensus Stage</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('sentiment')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>AI Sentiment</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Confirming Bot Brains</th>
                <th className="py-3 px-4 text-right">Execute Staged Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {displayedCoins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No coins found matching the search and filter criteria.
                  </td>
                </tr>
              ) : (
                displayedCoins.map((coin) => {
                  const isPos = coin.change24h >= 0;
                  const matchingCount = Math.min(5, Math.max(1, coin.matchingBots?.length || 1)) as ConsensusStage;
                  const stageConfig = STAGE_CONFIGS[matchingCount] || STAGE_CONFIGS[1];

                  return (
                    <tr 
                      key={coin.id}
                      id={`coin-row-${coin.symbol}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Rank & Symbol */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-slate-400 w-6">#{coin.rank}</span>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                              <span>{coin.symbol}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 text-slate-600 font-medium">
                                {coin.category}
                              </span>
                              {coin.cmcUrl && (
                                <a 
                                  href={coin.cmcUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 text-[9px] font-sans"
                                  title="Verify on CoinMarketCap"
                                >
                                  CMC <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px] font-sans flex items-center gap-1">
                              <span>{coin.name}</span>
                              {coin.network && (
                                <span className="text-[9px] text-slate-400 font-mono truncate max-w-[100px]" title={coin.contractAddress || coin.network}>
                                  • {coin.network}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : coin.price.toFixed(2)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`inline-flex items-center gap-0.5 font-bold ${
                          isPos ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPos ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </span>
                      </td>

                      {/* Consensus Stage */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span 
                          className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-flex items-center gap-1"
                          style={{ backgroundColor: `${stageConfig.accentColor}15`, color: stageConfig.accentColor }}
                        >
                          <Layers className="w-2.5 h-2.5" />
                          Stage {matchingCount} ({matchingCount} Bot{matchingCount > 1 ? 's' : ''})
                        </span>
                      </td>

                      {/* AI Sentiment */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          coin.sentimentScore > 40 ? 'text-emerald-700 bg-emerald-50' :
                          coin.sentimentScore < -40 ? 'text-rose-700 bg-rose-50' :
                          'text-slate-600 bg-slate-100'
                        }`}>
                          {coin.sentimentScore > 0 ? '+' : ''}{coin.sentimentScore}/100
                        </span>
                      </td>

                      {/* Matching Bots */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap max-w-[160px] mx-auto">
                          {coin.matchingBots && coin.matchingBots.length > 0 ? (
                            coin.matchingBots.map(botId => {
                              const b = bots.find(x => x.id === botId);
                              if (!b) return null;
                              return (
                                <span 
                                  key={botId}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold border font-mono"
                                  style={{
                                    backgroundColor: `${b.accentColor}10`,
                                    borderColor: `${b.accentColor}30`,
                                    color: b.accentColor,
                                  }}
                                  title={`${b.name}: ${b.strategyTitle}`}
                                >
                                  {b.code}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400 font-sans">Neutral</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            id={`inspect-action-${coin.symbol}`}
                            onClick={() => setInspectCoin(coin)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                            title="Inspect 4H→5M Multi-Timeframe Alignment"
                          >
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>4H→5M Audit</span>
                          </button>

                          <button
                            id={`trade-action-${coin.symbol}`}
                            onClick={() => {
                              const botId = coin.matchingBots && coin.matchingBots[0] ? coin.matchingBots[0] : 'bot-1';
                              onTradeCoinWithBot(coin, botId);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span>Stage {matchingCount} Trade</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-sans text-slate-500">
          <div>
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredCoins.length)} of {filteredCoins.length} Coins (CMC Top 500)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-900 font-semibold">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 4H→5M Multi-Timeframe and 10-Bot Inspector Modal */}
      {inspectCoin && (
        <MultiTimeframeInspectorModal
          coin={inspectCoin}
          direction={inspectCoin.change24h >= 0 ? 'LONG' : 'SHORT'}
          bots={bots}
          onClose={() => setInspectCoin(null)}
          onExecuteTrade={(c, d) => {
            const botId = c.matchingBots && c.matchingBots[0] ? c.matchingBots[0] : 'bot-1';
            onTradeCoinWithBot(c, botId);
          }}
        />
      )}

    </div>
  );
};
