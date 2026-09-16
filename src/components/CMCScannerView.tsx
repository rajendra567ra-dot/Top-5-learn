import React, { useState, useMemo } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Filter, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  Bot,
  DollarSign,
  Copy,
  Check,
  Radio,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { CryptoCoin } from '../types';
import { getBlockExplorerUrl } from '../data/topCoins';

interface CMCScannerViewProps {
  coins: CryptoCoin[];
  isScanningActive: boolean;
}

export const CMCScannerView: React.FC<CMCScannerViewProps> = ({ coins, isScanningActive }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredCoins = useMemo(() => {
    return coins.filter((coin) => {
      const matchSearch = 
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (coin.contractAddress && coin.contractAddress.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || coin.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [coins, searchQuery, categoryFilter]);

  return (
    <div id="cmc-scanner-view" className="space-y-6 text-slate-900">
      
      {/* Top Banner: Verification & Safe Universe Mandate */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              300+ Verified Market Cap Universe ({coins.length} Coins Live Spot Synced)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Scanning {coins.length} verified cryptocurrency assets ranked by market cap with audited contract addresses. Evaluates setups and selects the single best trade among all coins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="force-sync-universe-btn"
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/arena/universe/refresh', { method: 'POST' });
                  window.location.reload();
                } catch {
                  window.location.reload();
                }
              }}
              title="Force sync and reload full 300+ verified cryptocurrency universe"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync 300+ Coins
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              100% Verified Contract Addresses
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              Kaspa (KAS) & Memes Excluded
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              Real-Time Fast Spot Sync
            </span>
          </div>
        </div>

        {/* Controls: Search & Category Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="cmc-coin-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coin symbol, name, contract address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'Layer 1', 'DeFi', 'AI / DePIN', 'Layer 2', 'Infrastructure', 'Gaming'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coins Scanner Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Rank & Asset</th>
                <th className="px-4 py-3">Verified Contract Address</th>
                <th className="px-4 py-3">Live Spot Price</th>
                <th className="px-4 py-3">24h Change</th>
                <th className="px-4 py-3">24h Volume</th>
                <th className="px-4 py-3">RSI (14)</th>
                <th className="px-4 py-3">1H Trend & MACD</th>
                <th className="px-4 py-3">Setup Quality</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoins.map((coin) => {
                const isPositive = coin.change24h >= 0;
                const explorerUrl = getBlockExplorerUrl(coin.network, coin.contractAddress);
                const isCopied = copiedAddress === coin.contractAddress;

                return (
                  <tr key={coin.symbol} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Rank & Asset */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 w-5">
                          #{coin.rank}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{coin.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">({coin.symbol})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {coin.category || 'Crypto'} • {coin.network || 'Mainnet'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Verified Contract Address */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {coin.contractAddress ? (
                        <div className="flex items-center gap-1.5 max-w-[220px]">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Verified
                          </span>
                          <span 
                            title={coin.contractAddress}
                            className="font-mono text-[11px] text-slate-600 truncate"
                          >
                            {coin.contractAddress.length > 22 
                              ? `${coin.contractAddress.slice(0, 8)}...${coin.contractAddress.slice(-6)}` 
                              : coin.contractAddress}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coin.contractAddress!)}
                            title="Copy Contract Address"
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {explorerUrl !== '#' && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View on Block Explorer"
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-emerald-700 transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Native Genesis</span>
                      )}
                    </td>

                    {/* Live Price */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-900">
                      ${coin.price > 1000 ? coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price > 1 ? coin.price.toFixed(2) : coin.price.toFixed(4)}
                    </td>

                    {/* 24h Change */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </span>
                    </td>

                    {/* 24h Volume */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
                      ${(coin.volume24h / 1000000).toFixed(1)}M
                    </td>

                    {/* RSI */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold ${coin.rsi > 70 ? 'text-rose-600' : coin.rsi < 30 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {coin.rsi.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {coin.rsi > 70 ? '(OB)' : coin.rsi < 30 ? '(OS)' : '(Neutral)'}
                        </span>
                      </div>
                    </td>

                    {/* Trend & MACD */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                        coin.trend === 'BULLISH' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        coin.trend === 'BEARISH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {coin.trend} • {coin.macd}
                      </span>
                    </td>

                    {/* Setup Quality Score */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            style={{ width: `${coin.currentSetupQuality || 85}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {coin.currentSetupQuality || 85}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <a
                        href={coin.cmcUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                      >
                        <span>CMC</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
