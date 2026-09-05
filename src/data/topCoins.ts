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
  { rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 79688.72, change24h: -1.86, volume24h: 1320013575, marketCap: 1570000000000, category: 'Layer 1', network: 'Bitcoin Native (PoW)', contractAddress: 'Native Mainnet Block 0 (WBTC: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599)', cmcSlug: 'bitcoin' },
  { rank: 2, symbol: 'ETH', name: 'Ethereum', price: 2458.21, change24h: -2.88, volume24h: 828487534, marketCap: 298000000000, category: 'Layer 1', network: 'Ethereum Native (PoS)', contractAddress: 'Native Execution Engine (WETH: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)', cmcSlug: 'ethereum' },
  { rank: 3, symbol: 'BNB', name: 'BNB', price: 749.33, change24h: 4.15, volume24h: 140585656, marketCap: 108000000000, category: 'Layer 1', network: 'BNB Smart Chain (BSC)', contractAddress: 'Native BSC Protocol (WBNB: 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c)', cmcSlug: 'bnb' },
  { rank: 4, symbol: 'SOL', name: 'Solana', price: 102.71, change24h: -1.72, volume24h: 193847207, marketCap: 48000000000, category: 'Layer 1', network: 'Solana High-Speed L1', contractAddress: 'Native SPL Genesis (WSOL: So11111111111111111111111111111111111111112)', cmcSlug: 'solana' },
  { rank: 5, symbol: 'XRP', name: 'XRP', price: 1.408, change24h: -3.47, volume24h: 191784229, marketCap: 81000000000, category: 'Layer 1', network: 'XRP Ledger (XRPL)', contractAddress: 'Native XRPL Consensus (BEP20: 0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe)', cmcSlug: 'xrp' },
  { rank: 6, symbol: 'ADA', name: 'Cardano', price: 0.2137, change24h: -4.47, volume24h: 41514754, marketCap: 7600000000, category: 'Layer 1', network: 'Cardano Ouroboros', contractAddress: 'Native UTxO L1 (BEP20: 0x3ee2200efb3400fabb9aacf31297cbdd1d435d47)', cmcSlug: 'cardano' },
  { rank: 7, symbol: 'AVAX', name: 'Avalanche', price: 7.502, change24h: -0.32, volume24h: 17609494, marketCap: 3050000000, category: 'Layer 1', network: 'Avalanche C-Chain', contractAddress: 'Native Snowman Protocol (WAVAX: 0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7)', cmcSlug: 'avalanche' },
  { rank: 8, symbol: 'SUI', name: 'Sui', price: 0.7874, change24h: 1.12, volume24h: 53778565, marketCap: 2200000000, category: 'Layer 1', network: 'Sui Move L1', contractAddress: '0x2::sui::SUI (Verified Move Core)', cmcSlug: 'sui' },
  { rank: 9, symbol: 'LINK', name: 'Chainlink', price: 11.81, change24h: -2.38, volume24h: 29017069, marketCap: 7200000000, category: 'Infrastructure', network: 'Ethereum ERC-20', contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca', cmcSlug: 'chainlink' },
  { rank: 10, symbol: 'NEAR', name: 'NEAR Protocol', price: 2.222, change24h: 12.22, volume24h: 83338890, marketCap: 2700000000, category: 'Layer 1', network: 'NEAR Sharded L1', contractAddress: 'wrap.near (Nightshade Sharding Core)', cmcSlug: 'near-protocol' },
  { rank: 11, symbol: 'TAO', name: 'Bittensor', price: 236.4, change24h: 2.87, volume24h: 24503327, marketCap: 1720000000, category: 'AI / DePIN', network: 'Bittensor Subnet (Substrate)', contractAddress: 'Native Yuma Consensus (ERC20: 0x77e06c9e712ef9f9677b0e14cedef10e707cf39b)', cmcSlug: 'bittensor' },
  { rank: 12, symbol: 'UNI', name: 'Uniswap', price: 6.232, change24h: -2.35, volume24h: 52665412, marketCap: 3750000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', cmcSlug: 'uniswap' },
  { rank: 13, symbol: 'DOT', name: 'Polkadot', price: 0.902, change24h: 2.27, volume24h: 8459205, marketCap: 1300000000, category: 'Layer 1', network: 'Polkadot Relay Chain', contractAddress: 'Native Nominated PoS (ERC20: 0x7083609fce4d1d8dc0c979aab8c869ea2c873402)', cmcSlug: 'polkadot-new' },
  { rank: 14, symbol: 'RENDER', name: 'Render', price: 1.484, change24h: 0.68, volume24h: 3832128, marketCap: 770000000, category: 'AI / DePIN', network: 'Solana SPL', contractAddress: 'rndrizKT3Dn1iYsmd4dH63A71PPJyYT3nNv78pGQy4P', cmcSlug: 'render' },
  { rank: 15, symbol: 'APT', name: 'Aptos', price: 0.601, change24h: 1.01, volume24h: 5471603, marketCap: 310000000, category: 'Layer 1', network: 'Aptos Move L1', contractAddress: '0x1::aptos_coin::AptosCoin', cmcSlug: 'aptos' },
  { rank: 16, symbol: 'AAVE', name: 'Aave', price: 129.79, change24h: -4.5, volume24h: 16225086, marketCap: 1950000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', cmcSlug: 'aave' },
  { rank: 17, symbol: 'FET', name: 'Artificial Superintelligence', price: 0.1651, change24h: 4.36, volume24h: 11794433, marketCap: 420000000, category: 'AI / DePIN', network: 'Ethereum ERC-20', contractAddress: '0xaea4615079f2f49d282465355398245b0849e947', cmcSlug: 'artificial-superintelligence-alliance' },
  { rank: 18, symbol: 'INJ', name: 'Injective', price: 4.93, change24h: 1.75, volume24h: 5640549, marketCap: 480000000, category: 'DeFi', network: 'Injective Cosmos L1', contractAddress: 'inj19vy45h6y0l5v6344u76u6s4y329u67z53j3y5s (ERC20: 0xe28b3b32b6c342be5fe8d438997a5a870c946e34)', cmcSlug: 'injective' },
  { rank: 19, symbol: 'ICP', name: 'Internet Computer', price: 2.662, change24h: 3.62, volume24h: 10452325, marketCap: 1260000000, category: 'Layer 1', network: 'Internet Computer (ICP)', contractAddress: 'Native Canister Genesis', cmcSlug: 'internet-computer' },
  { rank: 20, symbol: 'ARB', name: 'Arbitrum', price: 0.1323, change24h: -3.85, volume24h: 26665419, marketCap: 540000000, category: 'Layer 2', network: 'Arbitrum One (L2)', contractAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548', cmcSlug: 'arbitrum' },
  { rank: 21, symbol: 'OP', name: 'Optimism', price: 0.1002, change24h: 0, volume24h: 4957764, marketCap: 140000000, category: 'Layer 2', network: 'OP Mainnet (L2)', contractAddress: '0x4200000000000000000000000000000000000042', cmcSlug: 'optimism-ethereum' },
  { rank: 22, symbol: 'SEI', name: 'Sei', price: 0.04773, change24h: -1.97, volume24h: 3385773, marketCap: 170000000, category: 'Layer 1', network: 'Sei EVM + Cosmos L1', contractAddress: 'Native Sei Twin-Turbo L1', cmcSlug: 'sei' },
  { rank: 23, symbol: 'TIA', name: 'Celestia', price: 0.3645, change24h: 0.5, volume24h: 2056951, marketCap: 82000000, category: 'Infrastructure', network: 'Celestia Modular DA', contractAddress: 'Native Celestia Data Availability', cmcSlug: 'celestia' },
  { rank: 24, symbol: 'STX', name: 'Stacks', price: 0.2607, change24h: -4.5, volume24h: 2104278, marketCap: 390000000, category: 'Layer 2', network: 'Stacks Bitcoin L2', contractAddress: 'Native Proof-of-Transfer L2', cmcSlug: 'stacks' },
  { rank: 25, symbol: 'RUNE', name: 'THORChain', price: 0.48, change24h: -1.44, volume24h: 962571, marketCap: 160000000, category: 'DeFi', network: 'THORChain Cosmos', contractAddress: 'Native Cross-Chain Liquidity', cmcSlug: 'thorchain' },
  { rank: 26, symbol: 'POL', name: 'Polygon', price: 0.09453, change24h: -1.16, volume24h: 4812707, marketCap: 750000000, category: 'Layer 2', network: 'Polygon / Ethereum', contractAddress: '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3e6', cmcSlug: 'polygon-ecosystem-token' },
  { rank: 27, symbol: 'FIL', name: 'Filecoin', price: 0.7655, change24h: -1.08, volume24h: 6212954, marketCap: 450000000, category: 'AI / DePIN', network: 'Filecoin Mainnet / FVM', contractAddress: 'Native Storage & FVM L1', cmcSlug: 'filecoin' },
  { rank: 28, symbol: 'CRV', name: 'Curve DAO Token', price: 0.3603, change24h: -4.15, volume24h: 4253224, marketCap: 440000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52', cmcSlug: 'curve-dao-token' },
  { rank: 29, symbol: 'IMX', name: 'Immutable', price: 0.1253, change24h: -0.87, volume24h: 385916, marketCap: 210000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff', cmcSlug: 'immutable-x' },
  { rank: 30, symbol: 'GRT', name: 'The Graph', price: 0.01748, change24h: 1.51, volume24h: 822732, marketCap: 168000000, category: 'AI / DePIN', network: 'Ethereum ERC-20', contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7', cmcSlug: 'the-graph' },
  { rank: 31, symbol: 'LDO', name: 'Lido DAO', price: 0.3838, change24h: -1.69, volume24h: 3708323, marketCap: 340000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x5a98fcbea516cf06857215779fd812ca9bef1b32', cmcSlug: 'lido-dao' },
  { rank: 32, symbol: 'MKR', name: 'Maker', price: 1813.7, change24h: 0.76, volume24h: 440709, marketCap: 1690000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', cmcSlug: 'maker' },
  { rank: 33, symbol: 'JUP', name: 'Jupiter', price: 0.2188, change24h: -2.8, volume24h: 3512807, marketCap: 295000000, category: 'DeFi', network: 'Solana SPL', contractAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', cmcSlug: 'jupiter-ag' },
  { rank: 34, symbol: 'WLD', name: 'Worldcoin', price: 0.3965, change24h: 0.71, volume24h: 16153410, marketCap: 285000000, category: 'AI / DePIN', network: 'Optimism ERC-20', contractAddress: '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1', cmcSlug: 'worldcoin-org' },
  { rank: 35, symbol: 'PYTH', name: 'Pyth Network', price: 0.05368, change24h: -3.24, volume24h: 2049420, marketCap: 195000000, category: 'Infrastructure', network: 'Solana SPL', contractAddress: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', cmcSlug: 'pyth-network' },
  { rank: 36, symbol: 'PENDLE', name: 'Pendle', price: 1.928, change24h: -2.53, volume24h: 4296042, marketCap: 310000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x808507121b80c02388fad14726482e061b8da827', cmcSlug: 'pendle' },
  { rank: 37, symbol: 'ENA', name: 'Ethena', price: 0.1641, change24h: -3.81, volume24h: 39768300, marketCap: 470000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x57e114B691Db790C35207b2e685D4A43181e6061', cmcSlug: 'ethena' },
  { rank: 38, symbol: 'STRK', name: 'Starknet', price: 0.02868, change24h: 5.71, volume24h: 4701819, marketCap: 60000000, category: 'Layer 2', network: 'Starknet ZK-Rollup', contractAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', cmcSlug: 'starknet-token' },
  { rank: 39, symbol: 'ATOM', name: 'Cosmos', price: 1.56, change24h: 2.43, volume24h: 1494485, marketCap: 610000000, category: 'Layer 1', network: 'Cosmos Hub (IBC)', contractAddress: 'Native Tendermint Hub', cmcSlug: 'cosmos' },
  { rank: 40, symbol: 'SAND', name: 'The Sandbox', price: 0.03946, change24h: -0.1, volume24h: 1072473, marketCap: 90000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0x3845badade8e6dff049820680d1f14bd3903a5d0', cmcSlug: 'the-sandbox' },
  { rank: 41, symbol: 'MANA', name: 'Decentraland', price: 0.0749, change24h: -1.06, volume24h: 359711, marketCap: 145000000, category: 'Gaming', network: 'Ethereum ERC-20', contractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', cmcSlug: 'decentraland' },
  { rank: 42, symbol: 'AXS', name: 'Axie Infinity', price: 0.945, change24h: 0.64, volume24h: 1247513, marketCap: 142000000, category: 'Gaming', network: 'Ronin / Ethereum', contractAddress: '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b', cmcSlug: 'axie-infinity' },
  { rank: 43, symbol: 'SNX', name: 'Synthetix', price: 0.2134, change24h: 0.23, volume24h: 367940, marketCap: 70000000, category: 'DeFi', network: 'Optimism / Ethereum', contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', cmcSlug: 'synthetix' },
  { rank: 44, symbol: '1INCH', name: '1inch Network', price: 0.0908, change24h: -2.78, volume24h: 428168, marketCap: 115000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302', cmcSlug: '1inch' },
  { rank: 45, symbol: 'SUSHI', name: 'SushiSwap', price: 0.2009, change24h: 1.06, volume24h: 560578, marketCap: 55000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', cmcSlug: 'sushiswap' },
  { rank: 46, symbol: 'COMP', name: 'Compound', price: 20.07, change24h: -0.15, volume24h: 541821, marketCap: 175000000, category: 'DeFi', network: 'Ethereum ERC-20', contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888', cmcSlug: 'compound' },
  { rank: 47, symbol: 'DYDX', name: 'dYdX', price: 0.117, change24h: 2.17, volume24h: 751954, marketCap: 78000000, category: 'DeFi', network: 'dYdX Chain (Cosmos)', contractAddress: 'Native dYdX Chain Token', cmcSlug: 'dydx-chain' },
  { rank: 48, symbol: 'AERO', name: 'Aerodrome Finance', price: 0.5194, change24h: 0.78, volume24h: 2570896, marketCap: 360000000, category: 'DeFi', network: 'Base Network (L2)', contractAddress: '0x940181a94a35a4569e4529a3cdfb74e38fd98631', cmcSlug: 'aerodrome-finance' },
  { rank: 49, symbol: 'ZRO', name: 'LayerZero', price: 1.064, change24h: -4.66, volume24h: 6820628, marketCap: 118000000, category: 'Infrastructure', network: 'Omnichain ERC-20', contractAddress: '0x6985884c4392d348587b19cb9eaaf157f13271cd', cmcSlug: 'layerzero' },
  { rank: 50, symbol: 'IO', name: 'io.net', price: 0.1293, change24h: -2.27, volume24h: 972397, marketCap: 16000000, category: 'AI / DePIN', network: 'Solana SPL', contractAddress: 'BZLbGTNCSFfoth2GYDtwr7e4imWzpR5jqcUuGEwr646K', cmcSlug: 'io-net' },
];

export const BLACKLISTED_COIN_SYMBOLS = new Set([
  'KAS', 'KASPA', 'BONK', 'PEPE', 'SHIB', 'FLOKI', 'TURBO', 'NEIRO', 'NOT', 'BLAST',
  '1000SATS', 'BTT', 'LUNC', 'BABYDOGE', 'LADYS', 'MEME', 'SLERF', 'BOME', 'MYRO'
]);

export function isHighDecimalOrBlacklistedCoin(symbol: string, price?: number): boolean {
  const clean = symbol.replace('/USDT', '').replace('USDT', '').trim().toUpperCase();
  if (clean === 'KAS' || clean === 'KASPA' || clean.includes('KAS')) return true;
  if (BLACKLISTED_COIN_SYMBOLS.has(clean)) return true;
  if (price !== undefined && price < 0.005) return true;
  return false;
}

export function getBlockExplorerUrl(network: string = '', contractAddress: string = ''): string {
  if (!contractAddress || contractAddress.startsWith('Native')) {
    return '#';
  }
  const cleanAddr = contractAddress.replace(/\s*\(.*\)/, '').trim();
  if (network.includes('Solana') || cleanAddr.length > 42) {
    return `https://solscan.io/token/${cleanAddr}`;
  }
  if (network.includes('Arbitrum')) {
    return `https://arbiscan.io/token/${cleanAddr}`;
  }
  if (network.includes('Optimism') || network.includes('OP Mainnet')) {
    return `https://optimistic.etherscan.io/token/${cleanAddr}`;
  }
  if (network.includes('Base')) {
    return `https://basescan.org/token/${cleanAddr}`;
  }
  if (network.includes('Polygon')) {
    return `https://polygonscan.com/token/${cleanAddr}`;
  }
  if (network.includes('BSC') || network.includes('BNB Smart Chain')) {
    return `https://bscscan.com/token/${cleanAddr}`;
  }
  if (network.includes('Starknet')) {
    return `https://voyager.online/contract/${cleanAddr}`;
  }
  if (cleanAddr.startsWith('0x')) {
    return `https://etherscan.io/token/${cleanAddr}`;
  }
  return '#';
}

export function generateTop500Universe(): CryptoCoin[] {
  const coins: CryptoCoin[] = [];

  VERIFIED_COINS_DATA.forEach((base, idx) => {
    if (isHighDecimalOrBlacklistedCoin(base.symbol, base.price)) return;
    const rsi = Math.floor(40 + Math.random() * 26);
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
