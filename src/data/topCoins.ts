import { CryptoCoin, MarketTrend, Recommendation } from '../types';

// Top coin base definitions covering all major crypto categories with live current market prices
const BASE_TOP_COINS = [
  { rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 78106.97, change24h: -1.34, volume24h: 34500000000, marketCap: 1560000000000, category: 'Layer 1' as const },
  { rank: 2, symbol: 'ETH', name: 'Ethereum', price: 2452.91, change24h: -0.82, volume24h: 18400000000, marketCap: 296000000000, category: 'Layer 1' as const },
  { rank: 3, symbol: 'BNB', name: 'BNB', price: 697.16, change24h: -0.20, volume24h: 1400000000, marketCap: 92830000000, category: 'Layer 1' as const },
  { rank: 4, symbol: 'SOL', name: 'Solana', price: 95.91, change24h: -2.22, volume24h: 7200000000, marketCap: 55950000000, category: 'Layer 1' as const },
  { rank: 5, symbol: 'XRP', name: 'XRP', price: 1.376, change24h: -6.50, volume24h: 4200000000, marketCap: 86330000000, category: 'Layer 1' as const },
  { rank: 6, symbol: 'TRX', name: 'TRON', price: 0.3347, change24h: 1.15, volume24h: 890000000, marketCap: 29100000000, category: 'Layer 1' as const },
  { rank: 7, symbol: 'DOGE', name: 'Dogecoin', price: 0.185, change24h: -2.40, volume24h: 3100000000, marketCap: 27000000000, category: 'Meme' as const },
  { rank: 8, symbol: 'ADA', name: 'Cardano', price: 0.624, change24h: -3.10, volume24h: 890000000, marketCap: 22100000000, category: 'Layer 1' as const },
  { rank: 9, symbol: 'AVAX', name: 'Avalanche', price: 22.40, change24h: -2.80, volume24h: 670000000, marketCap: 9200000000, category: 'Layer 1' as const },
  { rank: 10, symbol: 'SUI', name: 'Sui Network', price: 2.45, change24h: 3.20, volume24h: 1900000000, marketCap: 7100000000, category: 'Layer 1' as const },
  { rank: 11, symbol: 'LINK', name: 'Chainlink', price: 14.60, change24h: -1.40, volume24h: 520000000, marketCap: 8800000000, category: 'Infrastructure' as const },
  { rank: 12, symbol: 'NEAR', name: 'NEAR Protocol', price: 3.85, change24h: -1.90, volume24h: 480000000, marketCap: 4700000000, category: 'AI / DePIN' as const },
  { rank: 13, symbol: 'PEPE', name: 'Pepe', price: 0.0000084, change24h: -4.20, volume24h: 1800000000, marketCap: 3540000000, category: 'Meme' as const },
  { rank: 14, symbol: 'SHIB', name: 'Shiba Inu', price: 0.0000142, change24h: -2.10, volume24h: 740000000, marketCap: 8360000000, category: 'Meme' as const },
  { rank: 15, symbol: 'RENDER', name: 'Render Token', price: 4.65, change24h: 1.80, volume24h: 390000000, marketCap: 2410000000, category: 'AI / DePIN' as const },
  { rank: 16, symbol: 'TAO', name: 'Bittensor', price: 385.00, change24h: -0.90, volume24h: 280000000, marketCap: 2840000000, category: 'AI / DePIN' as const },
  { rank: 17, symbol: 'FET', name: 'Artificial Superintelligence', price: 0.985, change24h: 2.40, volume24h: 410000000, marketCap: 2570000000, category: 'AI / DePIN' as const },
  { rank: 18, symbol: 'INJ', name: 'Injective', price: 17.20, change24h: -2.30, volume24h: 180000000, marketCap: 1720000000, category: 'DeFi' as const },
  { rank: 19, symbol: 'TIA', name: 'Celestia', price: 3.90, change24h: -3.80, volume24h: 210000000, marketCap: 880000000, category: 'Infrastructure' as const },
  { rank: 20, symbol: 'ARB', name: 'Arbitrum', price: 0.495, change24h: -1.45, volume24h: 320000000, marketCap: 2050000000, category: 'Layer 2' as const },
  { rank: 21, symbol: 'OP', name: 'Optimism', price: 1.22, change24h: -2.10, volume24h: 240000000, marketCap: 1530000000, category: 'Layer 2' as const },
  { rank: 22, symbol: 'APT', name: 'Aptos', price: 6.45, change24h: 1.80, volume24h: 290000000, marketCap: 3450000000, category: 'Layer 1' as const },
  { rank: 23, symbol: 'DOT', name: 'Polkadot', price: 5.15, change24h: -1.90, volume24h: 310000000, marketCap: 7450000000, category: 'Layer 1' as const },
  { rank: 24, symbol: 'ONDO', name: 'Ondo Finance', price: 0.845, change24h: 2.20, volume24h: 195000000, marketCap: 1180000000, category: 'DeFi' as const },
  { rank: 25, symbol: 'KAS', name: 'Kaspa', price: 0.098, change24h: 1.10, volume24h: 110000000, marketCap: 2450000000, category: 'Layer 1' as const },
  { rank: 26, symbol: 'BEAM', name: 'Beam', price: 0.0482, change24h: 3.90, volume24h: 145000000, marketCap: 2440000000, category: 'Gaming' as const },
  { rank: 27, symbol: 'BONK', name: 'Bonk', price: 0.0000165, change24h: -3.40, volume24h: 620000000, marketCap: 1240000000, category: 'Meme' as const },
  { rank: 28, symbol: 'FLOKI', name: 'Floki', price: 0.000115, change24h: -2.80, volume24h: 380000000, marketCap: 1110000000, category: 'Meme' as const },
  { rank: 29, symbol: 'SEI', name: 'Sei Network', price: 0.315, change24h: 1.10, volume24h: 190000000, marketCap: 1350000000, category: 'Layer 1' as const },
  { rank: 30, symbol: 'JUP', name: 'Jupiter', price: 0.74, change24h: 1.75, volume24h: 210000000, marketCap: 1000000000, category: 'DeFi' as const },
  { rank: 31, symbol: 'WIF', name: 'dogwifhat', price: 1.18, change24h: 2.80, volume24h: 540000000, marketCap: 1180000000, category: 'Meme' as const },
  { rank: 32, symbol: 'STX', name: 'Stacks', price: 1.25, change24h: 1.60, volume24h: 120000000, marketCap: 1860000000, category: 'Layer 2' as const },
  { rank: 33, symbol: 'PYTH', name: 'Pyth Network', price: 0.245, change24h: 1.10, volume24h: 95000000, marketCap: 880000000, category: 'Infrastructure' as const },
  { rank: 34, symbol: 'ICP', name: 'Internet Computer', price: 7.10, change24h: -1.30, volume24h: 130000000, marketCap: 3340000000, category: 'Infrastructure' as const },
  { rank: 35, symbol: 'UNI', name: 'Uniswap', price: 7.65, change24h: 1.80, volume24h: 280000000, marketCap: 4590000000, category: 'DeFi' as const },
  { rank: 36, symbol: 'LTC', name: 'Litecoin', price: 84.50, change24h: 0.80, volume24h: 420000000, marketCap: 6340000000, category: 'Layer 1' as const },
  { rank: 37, symbol: 'BCH', name: 'Bitcoin Cash', price: 295.00, change24h: 1.40, volume24h: 290000000, marketCap: 5830000000, category: 'Layer 1' as const },
  { rank: 38, symbol: 'FIL', name: 'Filecoin', price: 3.45, change24h: -1.20, volume24h: 160000000, marketCap: 2070000000, category: 'AI / DePIN' as const },
  { rank: 39, symbol: 'AAVE', name: 'Aave', price: 185.00, change24h: 2.60, volume24h: 260000000, marketCap: 2770000000, category: 'DeFi' as const },
  { rank: 40, symbol: 'CRV', name: 'Curve DAO', price: 0.44, change24h: 1.40, volume24h: 98000000, marketCap: 538000000, category: 'DeFi' as const },
  { rank: 41, symbol: 'PENDLE', name: 'Pendle', price: 3.25, change24h: 4.10, volume24h: 140000000, marketCap: 526000000, category: 'DeFi' as const },
  { rank: 42, symbol: 'ENA', name: 'Ethena', price: 0.39, change24h: 2.20, volume24h: 220000000, marketCap: 1114000000, category: 'DeFi' as const },
  { rank: 43, symbol: 'OM', name: 'MANTRA', price: 3.15, change24h: 3.90, volume24h: 180000000, marketCap: 2830000000, category: 'Layer 1' as const },
  { rank: 44, symbol: 'STRK', name: 'Starknet', price: 0.31, change24h: -2.10, volume24h: 85000000, marketCap: 652000000, category: 'Layer 2' as const },
  { rank: 45, symbol: 'DYDX', name: 'dYdX', price: 0.98, change24h: 1.30, volume24h: 72000000, marketCap: 639000000, category: 'DeFi' as const },
  { rank: 46, symbol: 'RUNE', name: 'THORChain', price: 3.10, change24h: 2.50, volume24h: 190000000, marketCap: 1060000000, category: 'DeFi' as const },
  { rank: 47, symbol: 'FTM', name: 'Sonic (Fantom)', price: 0.58, change24h: 4.20, volume24h: 240000000, marketCap: 1620000000, category: 'Layer 1' as const },
  { rank: 48, symbol: 'GALA', name: 'Gala', price: 0.0198, change24h: 2.10, volume24h: 160000000, marketCap: 840000000, category: 'Gaming' as const },
  { rank: 49, symbol: 'BLUR', name: 'Blur', price: 0.175, change24h: -1.50, volume24h: 45000000, marketCap: 302000000, category: 'DeFi' as const },
  { rank: 50, symbol: 'SAND', name: 'The Sandbox', price: 0.285, change24h: 1.90, volume24h: 110000000, marketCap: 654000000, category: 'Gaming' as const },
];

const SECTOR_CATEGORIES: Array<'Layer 1' | 'DeFi' | 'AI / DePIN' | 'Meme' | 'Layer 2' | 'Infrastructure' | 'Gaming'> = [
  'Layer 1', 'DeFi', 'AI / DePIN', 'Meme', 'Layer 2', 'Infrastructure', 'Gaming'
];

const PREFIXES = [
  'ALPHA', 'BETA', 'NEO', 'QUANT', 'CYBER', 'HYPER', 'NANO', 'PULSE', 'VOID', 'LUMEN',
  'STELLA', 'METIS', 'AURA', 'SYNTH', 'GENESIS', 'ORION', 'AERO', 'ECHO', 'CHRONO', 'AXIS',
  'TITAN', 'KRONOS', 'VERTEX', 'CORE', 'FLUX', 'DRIFT', 'NEXUS', 'PRISM', 'EMBER', 'SOLAR',
  'VALOR', 'OMNI', 'ZENITH', 'NEXA', 'ATLAS', 'HELIX', 'COBALT', 'MATRIX', 'TURBO', 'MIRAGE'
];

const SUFFIXES = [
  'COIN', 'CHAIN', 'NETWORK', 'PROTOCOL', 'SWAP', 'FINANCE', 'AI', 'LABS', 'DAO', 'PAY',
  'DEPIN', 'VAULT', 'LEND', 'DEX', 'PORTAL', 'NODE', 'YIELD', 'ORACLE', 'BOT', 'ZONE'
];

// Helper to generate dynamic 500 crypto universe
export function generateTop500Universe(): CryptoCoin[] {
  const coins: CryptoCoin[] = [];

  // Add 50 core curated coins
  BASE_TOP_COINS.forEach((base) => {
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
    const priceScale = (501 - r) / 500;
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
      recommendation: rec,
      category,
    });
  }

  return coins;
}
