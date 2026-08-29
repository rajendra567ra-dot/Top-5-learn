import { CryptoCoin, MarketTrend, Recommendation, TradeDirection } from '../types';

export const TOP_50_BASE = [
  { rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 63850.00, change24h: 1.84, volume24h: 28400000000, marketCap: 1258000000000, category: 'Layer 1' as const },
  { rank: 2, symbol: 'ETH', name: 'Ethereum', price: 2680.50, change24h: 2.91, volume24h: 14200000000, marketCap: 322000000000, category: 'Layer 1' as const },
  { rank: 3, symbol: 'BNB', name: 'BNB', price: 585.20, change24h: -0.42, volume24h: 980000000, marketCap: 85400000000, category: 'Layer 1' as const },
  { rank: 4, symbol: 'SOL', name: 'Solana', price: 146.80, change24h: 6.45, volume24h: 4200000000, marketCap: 68900000000, category: 'Layer 1' as const },
  { rank: 5, symbol: 'XRP', name: 'XRP', price: 0.584, change24h: -1.15, volume24h: 1120000000, marketCap: 32900000000, category: 'Layer 1' as const },
  { rank: 6, symbol: 'DOGE', name: 'Dogecoin', price: 0.108, change24h: 4.82, volume24h: 890000000, marketCap: 15800000000, category: 'Meme' as const },
  { rank: 7, symbol: 'TON', name: 'Toncoin', price: 5.62, change24h: -0.85, volume24h: 310000000, marketCap: 14200000000, category: 'Layer 1' as const },
  { rank: 8, symbol: 'ADA', name: 'Cardano', price: 0.352, change24h: 1.25, volume24h: 240000000, marketCap: 12600000000, category: 'Layer 1' as const },
  { rank: 9, symbol: 'AVAX', name: 'Avalanche', price: 28.40, change24h: 5.12, volume24h: 480000000, marketCap: 11500000000, category: 'Layer 1' as const },
  { rank: 10, symbol: 'SHIB', name: 'Shiba Inu', price: 0.0000148, change24h: 3.10, volume24h: 290000000, marketCap: 8700000000, category: 'Meme' as const },
  { rank: 11, symbol: 'SUI', name: 'Sui', price: 1.95, change24h: 14.80, volume24h: 1150000000, marketCap: 5200000000, category: 'Layer 1' as const },
  { rank: 12, symbol: 'LINK', name: 'Chainlink', price: 11.45, change24h: 2.10, volume24h: 210000000, marketCap: 6900000000, category: 'Infrastructure' as const },
  { rank: 13, symbol: 'NEAR', name: 'NEAR Protocol', price: 4.88, change24h: 7.20, volume24h: 460000000, marketCap: 5900000000, category: 'Layer 1' as const },
  { rank: 14, symbol: 'APT', name: 'Aptos', price: 8.42, change24h: 9.35, volume24h: 390000000, marketCap: 4100000000, category: 'Layer 1' as const },
  { rank: 15, symbol: 'UNI', name: 'Uniswap', price: 7.82, change24h: 1.40, volume24h: 180000000, marketCap: 4700000000, category: 'DeFi' as const },
  { rank: 16, symbol: 'PEPE', name: 'Pepe', price: 0.0000098, change24h: -3.40, volume24h: 840000000, marketCap: 4120000000, category: 'Meme' as const },
  { rank: 17, symbol: 'FET', name: 'Artificial Superintelligence', price: 1.48, change24h: 11.50, volume24h: 420000000, marketCap: 3750000000, category: 'AI / DePIN' as const },
  { rank: 18, symbol: 'RENDER', name: 'Render Token', price: 5.75, change24h: 8.90, volume24h: 310000000, marketCap: 3010000000, category: 'AI / DePIN' as const },
  { rank: 19, symbol: 'TAO', name: 'Bittensor', price: 542.00, change24h: 12.30, volume24h: 290000000, marketCap: 3980000000, category: 'AI / DePIN' as const },
  { rank: 20, symbol: 'ICP', name: 'Internet Computer', price: 8.65, change24h: -0.90, volume24h: 98000000, marketCap: 4050000000, category: 'Layer 1' as const },
  { rank: 21, symbol: 'DOT', name: 'Polkadot', price: 4.25, change24h: 0.85, volume24h: 140000000, marketCap: 6100000000, category: 'Layer 1' as const },
  { rank: 22, symbol: 'MATIC', name: 'Polygon', price: 0.395, change24h: 1.15, volume24h: 110000000, marketCap: 3900000000, category: 'Layer 2' as const },
  { rank: 23, symbol: 'AAVE', name: 'Aave', price: 154.20, change24h: 4.60, volume24h: 210000000, marketCap: 2300000000, category: 'DeFi' as const },
  { rank: 24, symbol: 'INJ', name: 'Injective', price: 21.30, change24h: 6.80, volume24h: 175000000, marketCap: 2100000000, category: 'DeFi' as const },
  { rank: 25, symbol: 'FTM', name: 'Fantom', price: 0.684, change24h: 8.45, volume24h: 240000000, marketCap: 1920000000, category: 'Layer 1' as const },
  { rank: 26, symbol: 'WIF', name: 'dogwifhat', price: 2.38, change24h: 9.80, volume24h: 680000000, marketCap: 2380000000, category: 'Meme' as const },
  { rank: 27, symbol: 'ARB', name: 'Arbitrum', price: 0.542, change24h: -1.80, volume24h: 165000000, marketCap: 1910000000, category: 'Layer 2' as const },
  { rank: 28, symbol: 'OP', name: 'Optimism', price: 1.58, change24h: -0.45, volume24h: 145000000, marketCap: 1890000000, category: 'Layer 2' as const },
  { rank: 29, symbol: 'SEI', name: 'Sei Network', price: 0.445, change24h: 12.40, volume24h: 310000000, marketCap: 1560000000, category: 'Layer 1' as const },
  { rank: 30, symbol: 'BONK', name: 'Bonk', price: 0.0000215, change24h: 5.60, volume24h: 210000000, marketCap: 1490000000, category: 'Meme' as const },
  { rank: 31, symbol: 'FLOKI', name: 'Floki', price: 0.000142, change24h: 3.25, volume24h: 180000000, marketCap: 1370000000, category: 'Meme' as const },
  { rank: 32, symbol: 'TIA', name: 'Celestia', price: 5.85, change24h: -4.20, volume24h: 195000000, marketCap: 1280000000, category: 'Infrastructure' as const },
  { rank: 33, symbol: 'STX', name: 'Stacks', price: 1.74, change24h: 3.80, volume24h: 88000000, marketCap: 2580000000, category: 'Layer 2' as const },
  { rank: 34, symbol: 'RUNE', name: 'THORChain', price: 4.92, change24h: 4.10, volume24h: 165000000, marketCap: 1650000000, category: 'DeFi' as const },
  { rank: 35, symbol: 'KAS', name: 'Kaspa', price: 0.165, change24h: -2.15, volume24h: 65000000, marketCap: 4080000000, category: 'Layer 1' as const },
  { rank: 36, symbol: 'POPCAT', name: 'Popcat', price: 1.28, change24h: 15.40, volume24h: 240000000, marketCap: 1250000000, category: 'Meme' as const },
  { rank: 37, symbol: 'IMX', name: 'Immutable', price: 1.42, change24h: 2.60, volume24h: 75000000, marketCap: 2260000000, category: 'Gaming' as const },
  { rank: 38, symbol: 'GRT', name: 'The Graph', price: 0.168, change24h: 3.40, volume24h: 85000000, marketCap: 1600000000, category: 'AI / DePIN' as const },
  { rank: 39, symbol: 'HBAR', name: 'Hedera', price: 0.054, change24h: 0.95, volume24h: 42000000, marketCap: 1940000000, category: 'Layer 1' as const },
  { rank: 40, symbol: 'FIL', name: 'Filecoin', price: 3.65, change24h: 1.80, volume24h: 110000000, marketCap: 2150000000, category: 'AI / DePIN' as const },
  { rank: 41, symbol: 'LDO', name: 'Lido DAO', price: 1.18, change24h: 2.30, volume24h: 92000000, marketCap: 1050000000, category: 'DeFi' as const },
  { rank: 42, symbol: 'MKR', name: 'Maker', price: 1580.00, change24h: -1.40, volume24h: 65000000, marketCap: 1470000000, category: 'DeFi' as const },
  { rank: 43, symbol: 'JUP', name: 'Jupiter', price: 0.88, change24h: 7.90, volume24h: 160000000, marketCap: 1190000000, category: 'DeFi' as const },
  { rank: 44, symbol: 'WLD', name: 'Worldcoin', price: 1.92, change24h: 10.40, volume24h: 340000000, marketCap: 1020000000, category: 'AI / DePIN' as const },
  { rank: 45, symbol: 'PYTH', name: 'Pyth Network', price: 0.325, change24h: 4.80, volume24h: 88000000, marketCap: 1180000000, category: 'Infrastructure' as const },
  { rank: 46, symbol: 'BEAM', name: 'Beam', price: 0.0165, change24h: 3.10, volume24h: 38000000, marketCap: 850000000, category: 'Gaming' as const },
  { rank: 47, symbol: 'AR', name: 'Arweave', price: 18.90, change24h: 6.20, volume24h: 78000000, marketCap: 1240000000, category: 'AI / DePIN' as const },
  { rank: 48, symbol: 'PENDLE', name: 'Pendle', price: 4.45, change24h: 8.10, volume24h: 115000000, marketCap: 710000000, category: 'DeFi' as const },
  { rank: 49, symbol: 'ENA', name: 'Ethena', price: 0.285, change24h: -3.10, volume24h: 105000000, marketCap: 780000000, category: 'DeFi' as const },
  { rank: 50, symbol: 'STRK', name: 'Starknet', price: 0.448, change24h: -2.80, volume24h: 92000000, marketCap: 810000000, category: 'Layer 2' as const },
];

const PREFIXES = [
  'AERO', 'BLAST', 'ZETA', 'MANTA', 'ALT', 'DYM', 'SAGA', 'TNSR', 'MERL', 'OMNI',
  'REZ', 'NOT', 'IO', 'ZK', 'LISTA', 'ZRO', 'BLUR', 'MEME', 'ORDI', 'SATS',
  'RATS', 'BOME', 'MYRO', 'SLERF', 'MEW', 'BRETT', 'TURBO', 'NEIRO', 'SUNDOG', 'CAT',
  'BABYDOGE', 'DRIFT', 'KMNO', 'CLOUD', 'ATH', 'SPEC', 'GNO', 'SAFE', 'COW', 'CHZ',
  'AXS', 'SAND', 'MANA', 'GALA', 'RON', 'PRIME', 'SUPER', 'ILV', 'YGG', 'PIXEL',
  'PORTAL', 'BIGTIME', 'XAI', 'MAVIA', 'ACE', 'GMT', 'FLOW', 'MINA', 'OSMO', 'KAVA',
  'CELO', 'ROSE', 'IOTA', 'EGLD', 'ZIL', 'QTUM', 'ONT', 'NEO', 'WAVES', 'DCR',
  'CRV', 'SNX', 'COMP', 'SUSHI', '1INCH', 'BAL', 'YFI', 'LRC', 'ZRX', 'ANKR',
  'AUDIO', 'OCEAN', 'JASMY', 'GLM', 'AKT', 'CUDOS', 'NOS', 'SPEC', 'GPU', 'AIOZ',
];

const SUFFIXES = [
  'Protocol', 'Network', 'Chain', 'Swap', 'DAO', 'Finance', 'AI', 'Token', 'Coin', 'Labs',
  'Hub', 'DEX', 'Vault', 'Bridge', 'Layer', 'Matrix', 'Pulse', 'Core', 'Vortex', 'Apex'
];

const SECTOR_CATEGORIES: ('Layer 1' | 'DeFi' | 'AI / DePIN' | 'Meme' | 'Layer 2' | 'Infrastructure' | 'Gaming')[] = [
  'Layer 1', 'DeFi', 'AI / DePIN', 'Meme', 'Layer 2', 'Infrastructure', 'Gaming'
];

export function generateTop500Universe(): CryptoCoin[] {
  const coins: CryptoCoin[] = [];

  // Add top 50
  TOP_50_BASE.forEach((base) => {
    const rsi = Math.floor(25 + Math.random() * 55);
    const sentiment = Math.floor(-40 + Math.random() * 110);
    const trend: MarketTrend = base.change24h > 3 ? 'BULLISH' : base.change24h < -3 ? 'BEARISH' : 'NEUTRAL';
    const rec: Recommendation = 
      base.change24h > 5 && rsi < 70 ? 'STRONG_LONG' :
      base.change24h > 1 ? 'LONG' :
      base.change24h < -5 && rsi > 30 ? 'STRONG_SHORT' :
      base.change24h < -1 ? 'SHORT' : 'NEUTRAL';

    const matchingBots: string[] = [];
    if (trend === 'BULLISH' && rsi < 65) matchingBots.push('bot-1'); // Vortex trend
    if (Math.abs(base.change24h) > 6) matchingBots.push('bot-2'); // Titan volatility
    if (Math.abs(sentiment) > 50) matchingBots.push('bot-3'); // Neural sentiment
    if (rsi < 30 || rsi > 70) matchingBots.push('bot-4'); // Mean reversion
    if (base.volume24h > 200000000) matchingBots.push('bot-5'); // Apex scalper

    const direction: TradeDirection = (sentiment > 10 || base.change24h > 0) ? 'LONG' : 'SHORT';

    coins.push({
      id: `coin-${base.rank}`,
      rank: base.rank,
      symbol: base.symbol,
      name: base.name,
      price: base.price,
      change24h: base.change24h,
      volume24h: base.volume24h,
      marketCap: base.marketCap,
      high24h: base.price * (1 + (Math.abs(base.change24h) + 1.5) / 100),
      low24h: base.price * (1 - (Math.abs(base.change24h) + 1.2) / 100),
      rsi,
      macd: base.change24h >= 0 ? 'BULLISH_CROSS' : 'BEARISH_CROSS',
      trend,
      sentimentScore: sentiment,
      volatility: parseFloat((2.5 + Math.random() * 8.5).toFixed(2)),
      matchingBots,
      consensusDirection: direction,
      confirmingBotsCount: matchingBots.length || 1,
      recommendation: rec,
      category: base.category,
    });
  });

  // Generate ranks 51 to 500
  for (let r = 51; r <= 500; r++) {
    const pIdx = (r * 7) % PREFIXES.length;
    const sIdx = (r * 11) % SUFFIXES.length;
    const p = PREFIXES[pIdx];
    const s = SUFFIXES[sIdx];
    const symbol = `${p.substring(0, 3)}${r % 100}`.toUpperCase();
    const name = `${p} ${s}`;
    
    // Realistic micro/mid cap pricing
    const price = r < 100 
      ? parseFloat((0.5 + Math.random() * 15).toFixed(4))
      : r < 250 
        ? parseFloat((0.02 + Math.random() * 2.5).toFixed(4))
        : parseFloat((0.00001 + Math.random() * 0.05).toFixed(6));

    const change24h = parseFloat((-12 + Math.random() * 28).toFixed(2));
    const volume24h = Math.floor((1000000000 / r) * (0.5 + Math.random() * 1.5));
    const marketCap = Math.floor(volume24h * (12 + Math.random() * 8));
    const category = SECTOR_CATEGORIES[r % SECTOR_CATEGORIES.length];
    const rsi = Math.floor(20 + Math.random() * 65);
    const sentiment = Math.floor(-70 + Math.random() * 150);
    const trend: MarketTrend = change24h > 4 ? 'BULLISH' : change24h < -4 ? 'BEARISH' : 'NEUTRAL';
    
    const rec: Recommendation = 
      change24h > 7 && rsi < 65 ? 'STRONG_LONG' :
      change24h > 2 ? 'LONG' :
      change24h < -7 && rsi > 35 ? 'STRONG_SHORT' :
      change24h < -2 ? 'SHORT' : 'NEUTRAL';

    const matchingBots: string[] = [];
    if (change24h > 4 && rsi > 45 && rsi < 65) matchingBots.push('bot-1');
    if (Math.abs(change24h) > 8) matchingBots.push('bot-2');
    if (Math.abs(sentiment) > 55) matchingBots.push('bot-3');
    if (rsi < 28 || rsi > 72) matchingBots.push('bot-4');
    if (volume24h > 15000000) matchingBots.push('bot-5');

    const direction: TradeDirection = (sentiment > 10 || change24h > 0) ? 'LONG' : 'SHORT';

    coins.push({
      id: `coin-${r}`,
      rank: r,
      symbol,
      name,
      price,
      change24h,
      volume24h,
      marketCap,
      high24h: price * (1 + (Math.abs(change24h) + 2) / 100),
      low24h: price * (1 - (Math.abs(change24h) + 1.8) / 100),
      rsi,
      macd: change24h >= 0 ? 'BULLISH_CROSS' : 'BEARISH_CROSS',
      trend,
      sentimentScore: sentiment,
      volatility: parseFloat((3.0 + Math.random() * 12.0).toFixed(2)),
      matchingBots,
      consensusDirection: direction,
      confirmingBotsCount: matchingBots.length || 1,
      recommendation: rec,
      category,
    });
  }

  return coins;
}
