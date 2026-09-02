import { CryptoCoin, MarketTrend, Recommendation } from '../types';

export interface VerifiedCoinData {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  category: 'Layer 1' | 'DeFi' | 'AI / DePIN' | 'Layer 2' | 'Infrastructure' | 'Gaming';
  network: string;
  contractAddress: string;
  cmcSlug: string;
}

export const VERIFIED_COINS_DATA: VerifiedCoinData[] = [
  { rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 78106.97, change24h: 1.84, volume24h: 34500000000, marketCap: 1540000000000, category: 'Layer 1', network: 'Bitcoin Native (PoW)', contractAddress: 'Native Mainnet Block 0', cmcSlug: 'bitcoin' },
  { rank: 2, symbol: 'ETH', name: 'Ethereum', price: 2452.91, change24h: 2.12, volume24h: 18400000000, marketCap: 295000000000, category: 'Layer 1', network: 'Ethereum Native (PoS)', contractAddress: 'Native Execution Engine', cmcSlug: 'ethereum' },
  { rank: 3, symbol: 'BNB', name: 'BNB', price: 697.16, change24h: 0.85, volume24h: 1400000000, marketCap: 101000000000, category: 'Layer 1', network: 'BNB Smart Chain (BSC)', contractAddress: 'Native BSC Protocol', cmcSlug: 'bnb' },
  { rank: 4, symbol: 'SOL', name: 'Solana', price: 95.91, change24h: 3.42, volume24h: 7200000000, marketCap: 45000000000, category: 'Layer 1', network: 'Solana High-Speed L1', contractAddress: 'Native SPL Genesis', cmcSlug: 'solana' },
  { rank: 5, symbol: 'XRP', name: 'XRP', price: 1.376, change24h: -1.50, volume24h: 4200000000, marketCap: 78000000000, category: 'Layer 1', network: 'XRP Ledger (XRPL)', contractAddress: 'Native XRPL Consensus', cmcSlug: 'xrp' },
  { rank: 6, symbol: 'ADA', name: 'Cardano', price: 0.624, change24h: 1.10, volume24h: 890000000, marketCap: 22400000000, category: 'Layer 1', network: 'Cardano Ouroboros', contractAddress: 'Native UTxO L1', cmcSlug: 'cardano' },
  { rank: 7, symbol: 'AVAX', name: 'Avalanche', price: 22.40, change24h: 2.80, volume24h: 670000000, marketCap: 9100000000, category: 'Layer 1', network: 'Avalanche C-Chain', contractAddress: 'Native Snowman Protocol', cmcSlug: 'avalanche' },
  { rank: 8, symbol: 'SUI', name: 'Sui', price: 2.45, change24h: 4.60, volume24h: 1900000000, marketCap: 6900000000, category: 'Layer 1', network: 'Sui Move L1', contractAddress: 'Native Sui Protocol', cmcSlug: 'sui' },
  { rank: 9, symbol: 'LINK', name: 'Chainlink', price: 14.60, change24h: 1.40, volume24h: 520000000, marketCap: 8900000000, category: 'Infrastructure', network: 'Ethereum ERC-20', contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', cmcSlug: 'chainlink' },
  { rank: 10, symbol: 'NEAR', name: 'NEAR Protocol', price: 3.85, change24h: 2.90, volume24h: 480000000, marketCap: 4700000000, category: 'Layer 1', network: 'NEAR Sharded L1', contractAddress: 'Native Nightshade Sharding', cmcSlug: 'near-protocol' },
  { rank: 11, symbol: 'TAO', name: 'Bittensor', price: 385.00, change24h: 5.20, volume24h: 280000000, marketCap: 2800000000, category: 'AI / DePIN', network: 'Bittensor Subnet (Substrate)', contractAddress: 'Native Yuma Consensus', cmcSlug: 'bittensor' },
  { rank: 12, symbol: 'UNI', name: 'Uniswap', price: 6.84, change24h: 1.95, volume24h: 145000000, marketCap: 4100000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', cmcSlug: 'uniswap' },
  { rank: 13, symbol: 'DOT', name: 'Polkadot', price: 4.12, change24h: 0.80, volume24h: 180000000, marketCap: 5900000000, category: 'Layer 1', network: 'Polkadot Relay Chain', contractAddress: 'Native Nominated PoS', cmcSlug: 'polkadot-new' },
  { rank: 14, symbol: 'RENDER', name: 'Render', price: 4.65, change24h: 3.80, volume24h: 390000000, marketCap: 2400000000, category: 'AI / DePIN', network: 'Solana SPL', contractAddress: 'rndrizKT3Dn1iYsmd4dH63A71PPJyYT3nNv78pGQy4P', cmcSlug: 'render' },
  { rank: 15, symbol: 'APT', name: 'Aptos', price: 5.62, change24h: 1.10, volume24h: 190000000, marketCap: 2900000000, category: 'Layer 1', network: 'Aptos Move L1', contractAddress: '0x1::aptos_coin::AptosCoin', cmcSlug: 'aptos' },
  { rank: 16, symbol: 'AAVE', name: 'Aave', price: 172.50, change24h: 2.45, volume24h: 230000000, marketCap: 2600000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', cmcSlug: 'aave' },
  { rank: 17, symbol: 'FET', name: 'Artificial Superintelligence', price: 0.985, change24h: 4.40, volume24h: 410000000, marketCap: 2500000000, category: 'AI / DePIN', network: 'Ethereum ERC-20', contractAddress: '0xaea4615079f2f49d282465355398245b0849e947', cmcSlug: 'artificial-superintelligence-alliance' },
  { rank: 18, symbol: 'INJ', name: 'Injective', price: 17.80, change24h: 1.80, volume24h: 120000000, marketCap: 1750000000, category: 'DeFi', network: 'Injective Cosmos L1', contractAddress: 'Native INJ Core Chain', cmcSlug: 'injective' },
  { rank: 19, symbol: 'ICP', name: 'Internet Computer', price: 6.95, change24h: 0.90, volume24h: 92000000, marketCap: 3300000000, category: 'Layer 1', network: 'Internet Computer (ICP)', contractAddress: 'Native Canister Genesis', cmcSlug: 'internet-computer' },
  { rank: 20, symbol: 'ARB', name: 'Arbitrum', price: 0.385, change24h: 1.20, volume24h: 160000000, marketCap: 1580000000, category: 'Layer 2', network: 'Arbitrum One (L2)', contractAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548', cmcSlug: 'arbitrum' },
  { rank: 21, symbol: 'OP', name: 'Optimism', price: 1.08, change24h: 2.10, volume24h: 110000000, marketCap: 1350000000, category: 'Layer 2', network: 'OP Mainnet (L2)', contractAddress: '0x4200000000000000000000000000000000000042', cmcSlug: 'optimism-ethereum' },
  { rank: 22, symbol: 'SEI', name: 'Sei', price: 0.445, change24h: 3.40, volume24h: 180000000, marketCap: 1560000000, category: 'Layer 1', network: 'Sei EVM + Cosmos L1', contractAddress: 'Native Sei Twin-Turbo', cmcSlug: 'sei' },
  { rank: 23, symbol: 'TIA', name: 'Celestia', price: 3.25, change24h: 1.50, volume24h: 140000000, marketCap: 730000000, category: 'Infrastructure', network: 'Celestia Modular DA', contractAddress: 'Native Celestia Data Availability', cmcSlug: 'celestia' },
  { rank: 24, symbol: 'STX', name: 'Stacks', price: 1.22, change24h: 2.50, volume24h: 65000000, marketCap: 1840000000, category: 'Layer 2', network: 'Stacks Bitcoin L2', contractAddress: 'Native Proof-of-Transfer', cmcSlug: 'stacks' },
  { rank: 25, symbol: 'RUNE', name: 'THORChain', price: 1.84, change24h: 1.60, volume24h: 85000000, marketCap: 620000000, category: 'DeFi', network: 'THORChain Cosmos', contractAddress: 'Native Cross-Chain Liquidity', cmcSlug: 'thorchain' },
  { rank: 26, symbol: 'KAS', name: 'Kaspa', price: 0.1245, change24h: 0.95, volume24h: 48000000, marketCap: 3100000000, category: 'Layer 1', network: 'Kaspa BlockDAG (GHOSTDAG)', contractAddress: 'Native Proof-of-Work GHOSTDAG L1', cmcSlug: 'kaspa' },
  { rank: 27, symbol: 'FIL', name: 'Filecoin', price: 0.6836, change24h: 1.80, volume24h: 53330000, marketCap: 568730000, category: 'AI / DePIN', network: 'Filecoin Mainnet / FVM', contractAddress: 'Native Storage & FVM L1', cmcSlug: 'filecoin' },
  { rank: 28, symbol: 'CRV', name: 'Curve DAO Token', price: 0.3420, change24h: 2.15, volume24h: 48000000, marketCap: 415000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52', cmcSlug: 'curve-dao-token' },
  { rank: 29, symbol: 'IMX', name: 'Immutable', price: 1.15, change24h: 1.90, volume24h: 55000000, marketCap: 1900000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff', cmcSlug: 'immutable-x' },
  { rank: 30, symbol: 'GRT', name: 'The Graph', price: 0.145, change24h: 2.60, volume24h: 45000000, marketCap: 1380000000, category: 'AI / DePIN', network: 'Ethereum ERC-20', contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7', cmcSlug: 'the-graph' },
  { rank: 31, symbol: 'LDO', name: 'Lido DAO', price: 1.12, change24h: 1.40, volume24h: 68000000, marketCap: 998000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x5a98fcbea516cf06857215779fd812ca9bef1b32', cmcSlug: 'lido-dao' },
  { rank: 32, symbol: 'MKR', name: 'Maker', price: 1420.00, change24h: 1.10, volume24h: 42000000, marketCap: 1320000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', cmcSlug: 'maker' },
  { rank: 33, symbol: 'JUP', name: 'Jupiter', price: 0.64, change24h: 3.80, volume24h: 88000000, marketCap: 864000000, category: 'DeFi', network: 'Solana SPL', contractAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', cmcSlug: 'jupiter-ag' },
  { rank: 34, symbol: 'WLD', name: 'Worldcoin', price: 1.45, change24h: 4.90, volume24h: 210000000, marketCap: 1040000000, category: 'AI / DePIN', network: 'Optimism ERC-20', contractAddress: '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1', cmcSlug: 'worldcoin-org' },
  { rank: 35, symbol: 'PYTH', name: 'Pyth Network', price: 0.285, change24h: 1.40, volume24h: 62000000, marketCap: 1030000000, category: 'Infrastructure', network: 'Solana SPL', contractAddress: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', cmcSlug: 'pyth-network' },
  { rank: 36, symbol: 'PENDLE', name: 'Pendle', price: 3.15, change24h: 3.20, volume24h: 75000000, marketCap: 510000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x808507121b80c02388fad14726482e061b8da827', cmcSlug: 'pendle' },
  { rank: 37, symbol: 'ENA', name: 'Ethena', price: 0.42, change24h: 2.10, volume24h: 110000000, marketCap: 1200000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x57e114B691Db790C35207b2e685D4A43181e6061', cmcSlug: 'ethena' },
  { rank: 38, symbol: 'STRK', name: 'Starknet', price: 0.365, change24h: 1.80, volume24h: 58000000, marketCap: 760000000, category: 'Layer 2', network: 'Starknet ZK-Rollup', contractAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', cmcSlug: 'starknet-token' },
  { rank: 39, symbol: 'ATOM', name: 'Cosmos', price: 4.85, change24h: 1.20, volume24h: 78000000, marketCap: 1900000000, category: 'Layer 1', network: 'Cosmos Hub (IBC)', contractAddress: 'Native Tendermint Hub', cmcSlug: 'cosmos' },
  { rank: 40, symbol: 'SAND', name: 'The Sandbox', price: 0.285, change24h: 1.90, volume24h: 62000000, marketCap: 650000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0x3845badade8e6dff049820680d1f14bd3903a5d0', cmcSlug: 'the-sandbox' },
  { rank: 41, symbol: 'MANA', name: 'Decentraland', price: 0.278, change24h: 1.40, volume24h: 42000000, marketCap: 540000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', cmcSlug: 'decentraland' },
  { rank: 42, symbol: 'AXS', name: 'Axie Infinity', price: 4.15, change24h: 2.10, volume24h: 51000000, marketCap: 620000000, category: 'Gaming', network: 'Ronin / Ethereum', contractAddress: '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b', cmcSlug: 'axie-infinity' },
  { rank: 43, symbol: 'SNX', name: 'Synthetix', price: 1.38, change24h: 1.80, volume24h: 32000000, marketCap: 450000000, category: 'DeFi', network: 'Optimism / Ethereum', contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', cmcSlug: 'synthetix' },
  { rank: 44, symbol: '1INCH', name: '1inch Network', price: 0.265, change24h: 1.10, volume24h: 24000000, marketCap: 330000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302', cmcSlug: '1inch' },
  { rank: 45, symbol: 'SUSHI', name: 'SushiSwap', price: 0.68, change24h: 2.40, volume24h: 29000000, marketCap: 185000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', cmcSlug: 'sushiswap' },
  { rank: 46, symbol: 'COMP', name: 'Compound', price: 42.50, change24h: 1.90, volume24h: 38000000, marketCap: 360000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888', cmcSlug: 'compound' },
  { rank: 47, symbol: 'DYDX', name: 'dYdX', price: 0.98, change24h: 3.80, volume24h: 46000000, marketCap: 640000000, category: 'DeFi', network: 'dYdX Chain (Cosmos)', contractAddress: 'Native dYdX Chain Token', cmcSlug: 'dydx-chain' },
  { rank: 48, symbol: 'AERO', name: 'Aerodrome Finance', price: 0.85, change24h: 4.40, volume24h: 58000000, marketCap: 590000000, category: 'DeFi', network: 'Base Network (L2)', contractAddress: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', cmcSlug: 'aerodrome-finance' },
  { rank: 49, symbol: 'ZRO', name: 'LayerZero', price: 3.45, change24h: 1.80, volume24h: 72000000, marketCap: 380000000, category: 'Infrastructure', network: 'Omnichain ERC-20', contractAddress: '0x6985884c4392d348587b19cb9eaaf157f13271cd', cmcSlug: 'layerzero' },
  { rank: 50, symbol: 'IO', name: 'io.net', price: 1.85, change24h: 4.10, volume24h: 84000000, marketCap: 230000000, category: 'AI / DePIN', network: 'Solana SPL', contractAddress: 'BZLbGTNCSFfoth2GYDtwr7e4imWzpR5jqcUuGEwr646K', cmcSlug: 'io-net' },
];

export const BLACKLISTED_COIN_SYMBOLS = new Set([
  'BONK', 'PEPE', 'SHIB', 'FLOKI', 'TURBO', 'NEIRO', 'NOT', 'BLAST',
  '1000SATS', 'BTT', 'LUNC', 'BABYDOGE', 'LADYS', 'MEME', 'SLERF', 'BOME', 'MYRO'
]);

export function isHighDecimalOrBlacklistedCoin(symbol: string, price?: number): boolean {
  const clean = symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
  if (BLACKLISTED_COIN_SYMBOLS.has(clean)) return true;
  if (price !== undefined && price < 0.005) return true;
  return false;
}

export function generateTop500Universe(): CryptoCoin[] {
  const coins: CryptoCoin[] = [];

  VERIFIED_COINS_DATA.forEach((base, idx) => {
    if (isHighDecimalOrBlacklistedCoin(base.symbol, base.price)) return;
    const rsi = Math.floor(40 + Math.random() * 26); // Healthy 40-66
    const sentiment = Math.floor(55 + Math.random() * 35);
    const trend: MarketTrend = base.change24h > 1.5 ? 'BULLISH' : base.change24h < -1.5 ? 'BEARISH' : 'NEUTRAL';
    const rec: Recommendation = 
      base.change24h > 3.0 ? 'STRONG_LONG' :
      base.change24h > 0 ? 'LONG' :
      base.change24h < -3.0 ? 'STRONG_SHORT' : 'NEUTRAL';

    const scanningBots = [
      `BOT-${String((idx % 40) + 1).padStart(2, '0')}`,
      `BOT-${String(((idx + 5) % 40) + 1).padStart(2, '0')}`,
      `BOT-${String(((idx + 12) % 40) + 1).padStart(2, '0')}`,
    ];

    coins.push({
      id: `coin-${base.rank}`,
      rank: base.rank,
      symbol: base.symbol,
      name: base.name,
      price: base.price,
      change24h: base.change24h,
      volume24h: base.volume24h,
      marketCap: base.marketCap,
      high24h: base.price * (1 + (Math.abs(base.change24h) + 1.2) / 100),
      low24h: base.price * (1 - (Math.abs(base.change24h) + 1.1) / 100),
      rsi,
      macd: base.change24h >= 0 ? 'BULLISH_CROSS' : 'BEARISH_CROSS',
      trend,
      sentimentScore: sentiment,
      volatility: parseFloat((2.2 + Math.random() * 4.5).toFixed(2)),
      category: base.category,
      contractAddress: base.contractAddress,
      network: base.network,
      cmcUrl: `https://coinmarketcap.com/currencies/${base.cmcSlug}/`,
      isVerified: true,
      activeScanningBotsCount: scanningBots.length,
      scanningBotNames: scanningBots,
      currentSetupQuality: Math.floor(82 + Math.random() * 16),
    });
  });

  return coins.sort((a, b) => a.rank - b.rank);
}
