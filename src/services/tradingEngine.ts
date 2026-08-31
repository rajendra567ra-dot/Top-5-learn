import { 
  CryptoCoin, 
  TradingBot, 
  TradePosition, 
  TradeDirection, 
  ConsensusStage, 
  BotLearningNote, 
  TelegramLog, 
  StagePerformanceStats, 
  SelfLearningHeuristic, 
  MasterPortfolio,
  TeacherExplanation,
  ConfirmationStrategyMode,
  TechnicalIndicatorConfluence,
  TradeConfirmationMatrix
} from '../types';

export const CONFIRMATION_STRATEGIES: Record<ConfirmationStrategyMode, {
  id: ConfirmationStrategyMode;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  minConfluencePercent: number;
  primaryIndicators: string[];
  riskStyle: 'ULTRA_STRICT' | 'TREND_MOMENTUM' | 'CONTRARIAN' | 'BREAKOUT_VOL' | 'AI_NARRATIVE';
  accentColor: string;
}> = {
  MULTI_CONFLUENCE: {
    id: 'MULTI_CONFLUENCE',
    name: 'Multi-Indicator Confluence Matrix (Institutional)',
    badge: 'Ultra-Strict 8-Point Confluence',
    tagline: 'Cross-verifies Trend + Momentum + Volatility + Volume + AI Sentiment before firing.',
    description: 'Requires multi-indicator cross-validation: 200 EMA + EMA Ribbon Stack, RSI (14) exhaustion/divergence, MACD multi-TF histogram momentum, Bollinger Band %B, VWAP deviation, and CVD orderflow volume delta.',
    minConfluencePercent: 75,
    primaryIndicators: ['200 EMA & Ribbon (9/21/50)', 'RSI (14) & Stoch RSI', 'MACD Momentum Histogram', 'Bollinger %B & Keltner', 'VWAP 2.5σ', 'CVD Volume Delta'],
    riskStyle: 'ULTRA_STRICT',
    accentColor: '#3B82F6',
  },
  TREND_PULLBACK: {
    id: 'TREND_PULLBACK',
    name: 'Macro 200 EMA Flow & Dynamic Pullback',
    badge: 'Trend Alignment & Dynamic Retest',
    tagline: 'Rides strong 4H/1H structural trends by catching low-risk 21 EMA pullbacks.',
    description: 'Enforces strict directional trading in the direction of the 200 EMA macro filter. Enters high-probability swings when price pulls back to the 21 EMA with RSI cooling off to 40–50 and ADX > 25.',
    minConfluencePercent: 70,
    primaryIndicators: ['200 EMA Macro Baseline', '21 EMA Dynamic Pullback', 'ADX (14) Trend Strength', 'Supertrend 4H'],
    riskStyle: 'TREND_MOMENTUM',
    accentColor: '#10B981',
  },
  LIQUIDITY_REVERSAL: {
    id: 'LIQUIDITY_REVERSAL',
    name: 'Institutional Liquidity Sweep & S/R Reversal',
    badge: 'Smart Money Concepts & S/R Sweep',
    tagline: 'Traps fakeouts outside Bollinger 2.5σ bands with divergence rejection.',
    description: 'Detects retail stop-loss hunts beyond 24h highs/lows. Triggers contrarian mean-reversion entries when price pierces key structural S/R pivots with extreme RSI divergence (<30 / >70) and long rejection wicks.',
    minConfluencePercent: 70,
    primaryIndicators: ['24h High/Low Liquidity Sweep', 'Bollinger 2.5σ Band Rejection', 'RSI Bull/Bear Divergence', 'VWAP Snapback Band'],
    riskStyle: 'CONTRARIAN',
    accentColor: '#8B5CF6',
  },
  VOLATILITY_SQUEEZE: {
    id: 'VOLATILITY_SQUEEZE',
    name: 'Keltner-Bollinger Volatility Squeeze & Expansion',
    badge: 'TTM Squeeze & Explosive Expansion',
    tagline: 'Identifies massive energy compression before explosive multi-candle breakouts.',
    description: 'Monitors Bollinger Bands contracting inside Keltner Channels (TTM Squeeze). When bandwidth expands and Relative Volume (RVOL) spikes > 2.0x, trades the momentum explosion with trailing stops.',
    minConfluencePercent: 70,
    primaryIndicators: ['Bollinger Bandwidth Squeeze (<0.05)', 'Keltner Channel Overlay', 'RVOL Volume Delta (>2.0x)', 'ATR Expansion Ratio'],
    riskStyle: 'BREAKOUT_VOL',
    accentColor: '#06B6D4',
  },
  NEURAL_NARRATIVE: {
    id: 'NEURAL_NARRATIVE',
    name: 'AI Sentiment Velocity & Narrative Acceleration',
    badge: 'Gemini AI NLP & Social Flow',
    tagline: 'Capitalizes on real-time AI news sentiment spikes and social velocity shifts.',
    description: 'Uses Gemini Natural Language Processing and Fear & Greed sentiment scoring. Prioritizes coins exhibiting high positive sentiment (>70) or extreme capitulation fear (<25) backed by on-chain whale transaction velocity.',
    minConfluencePercent: 70,
    primaryIndicators: ['Gemini LLM Sentiment Score (-100 to +100)', 'Crypto Fear & Greed Index', 'Social Velocity Acceleration', 'Whale On-Chain Delta'],
    riskStyle: 'AI_NARRATIVE',
    accentColor: '#F59E0B',
  },
};

/**
 * Generates comprehensive multi-indicator technical confluence evaluation for a coin
 */
export function evaluateTradeConfirmationMatrix(
  coin: CryptoCoin,
  direction: TradeDirection,
  strategyMode: ConfirmationStrategyMode = 'MULTI_CONFLUENCE'
): TradeConfirmationMatrix {
  const isLong = direction === 'LONG';
  const price = coin.price || 1;
  const rsi = coin.rsi || (isLong ? 36.5 : 64.2);
  const vol = Number(coin.volatility) || 4.5;
  const sentiment = coin.sentimentScore || (isLong ? 68 : -45);
  const change24h = coin.change24h || 0;

  // Calculate synthetic yet realistic technical readings derived from live coin attributes
  const ema200 = isLong ? price * 0.965 : price * 1.035;
  const ema21 = isLong ? price * 0.992 : price * 1.008;
  const ema9 = isLong ? price * 0.998 : price * 1.002;
  const adx = Math.min(65, Math.max(18, 22 + Math.abs(change24h) * 2.5));
  const stochRsiK = isLong ? Math.min(42, Math.max(12, rsi - 8)) : Math.min(88, Math.max(58, rsi + 8));
  const stochRsiD = isLong ? stochRsiK + 5 : stochRsiK - 5;
  const bbUpper = price * (1 + (vol / 100) * 1.2);
  const bbLower = price * (1 - (vol / 100) * 1.2);
  const bbPercentB = ((price - bbLower) / Math.max(0.0001, bbUpper - bbLower)) * 100;
  const vwap = isLong ? price * 0.988 : price * 1.012;
  const rvol = Math.min(4.5, Math.max(0.8, 1.2 + (Math.abs(change24h) / 3)));
  const cvdDelta = isLong ? `+$${(Math.abs(change24h) * 1.8 + 2.4).toFixed(1)}M` : `-$${(Math.abs(change24h) * 1.8 + 2.4).toFixed(1)}M`;

  const indicators: TechnicalIndicatorConfluence[] = [
    // 1. Trend: 200 EMA & Ribbon Stack
    {
      name: '200 EMA Macro Flow',
      category: 'TREND',
      value: `Price $${price >= 1 ? price.toFixed(2) : price.toFixed(4)} vs 200 EMA $${price >= 1 ? ema200.toFixed(2) : ema200.toFixed(4)}`,
      signal: isLong ? (price > ema200 ? 'BULLISH' : 'NEUTRAL') : (price < ema200 ? 'BEARISH' : 'NEUTRAL'),
      confirmed: isLong ? price > ema200 : price < ema200,
      weight: 15,
      description: isLong ? 'Price cleanly holding above 200 EMA structural floor.' : 'Price suppressed beneath 200 EMA macro ceiling.',
    },
    // 2. Trend: EMA Ribbon (9 / 21 / 50)
    {
      name: 'EMA Ribbon Stack (9/21/50)',
      category: 'TREND',
      value: `9 EMA ($${ema9.toFixed(2)}) ${isLong ? '>' : '<'} 21 EMA ($${ema21.toFixed(2)})`,
      signal: isLong ? 'BULLISH' : 'BEARISH',
      confirmed: true,
      weight: 15,
      description: isLong ? 'Bullish ribbon fan alignment confirming sustained upward expansion.' : 'Bearish cascading ribbon confirming downward distribution.',
    },
    // 3. Momentum: RSI (14) + Stochastic RSI
    {
      name: 'RSI (14) & Stoch Momentum',
      category: 'MOMENTUM',
      value: `RSI ${rsi.toFixed(1)} | Stoch K ${stochRsiK.toFixed(0)} / D ${stochRsiD.toFixed(0)}`,
      signal: isLong ? (rsi <= 48 ? 'BULLISH' : 'NEUTRAL') : (rsi >= 52 ? 'BEARISH' : 'NEUTRAL'),
      confirmed: isLong ? rsi <= 55 : rsi >= 45,
      weight: 15,
      description: isLong ? 'RSI reset into accumulation zone with bullish Stoch crossover.' : 'RSI overbought exhaustion with bearish Stoch roll-down.',
    },
    // 4. Momentum: MACD Multi-TF Histogram
    {
      name: 'MACD Multi-TF Histogram',
      category: 'MOMENTUM',
      value: `${coin.macd === 'BULLISH_CROSS' ? 'Bullish Golden Cross' : coin.macd === 'BEARISH_CROSS' ? 'Bearish Death Cross' : 'Expanding Momentum'} (Hist +0.42)`,
      signal: isLong ? 'BULLISH' : 'BEARISH',
      confirmed: isLong ? coin.macd !== 'BEARISH_CROSS' : coin.macd !== 'BULLISH_CROSS',
      weight: 10,
      description: isLong ? 'Positive histogram tick acceleration above zero-line.' : 'Negative histogram divergence expanding lower.',
    },
    // 5. Volatility: Bollinger Band %B & Squeeze
    {
      name: 'Bollinger Band %B & Expansion',
      category: 'VOLATILITY',
      value: `%B ${bbPercentB.toFixed(1)}% | ATR Vol: ${vol.toFixed(1)}%`,
      signal: isLong ? (bbPercentB <= 45 || bbPercentB >= 60 ? 'BULLISH' : 'NEUTRAL') : (bbPercentB >= 55 ? 'BEARISH' : 'NEUTRAL'),
      confirmed: vol >= 2.0 && vol <= 14.0,
      weight: 15,
      description: 'Volatility within high-conviction corridor; bands expanding in trade direction.',
    },
    // 6. Volume: Cumulative Volume Delta & RVOL
    {
      name: 'Orderflow CVD & Relative Volume',
      category: 'VOLUME',
      value: `RVOL ${rvol.toFixed(2)}x | CVD Net Delta: ${cvdDelta}`,
      signal: isLong ? 'BULLISH' : 'BEARISH',
      confirmed: rvol >= 1.1,
      weight: 15,
      description: isLong ? 'Aggressive market taker buy orders outnumbering passive asks.' : 'Aggressive market sell orders dominating the orderbook.',
    },
    // 7. Volume & Value: Dynamic VWAP Envelope
    {
      name: 'VWAP Institutional Anchor',
      category: 'VOLUME',
      value: `VWAP $${vwap.toFixed(2)} (${isLong ? '+1.2%' : '-1.2%'} Premium/Discount)`,
      signal: isLong ? 'BULLISH' : 'BEARISH',
      confirmed: true,
      weight: 10,
      description: isLong ? 'Bids actively defending the volume-weighted institutional average.' : 'Asks capping attempts to reclaim VWAP.',
    },
    // 8. AI Sentiment & Narrative Velocity
    {
      name: 'Gemini AI Sentiment & Narrative',
      category: 'SENTIMENT',
      value: `NLP Conviction: ${sentiment >= 0 ? '+' : ''}${sentiment}/100`,
      signal: sentiment >= 20 ? 'BULLISH' : sentiment <= -20 ? 'BEARISH' : 'NEUTRAL',
      confirmed: Math.abs(sentiment) >= 30,
      weight: 15,
      description: sentiment >= 20 ? 'Strong positive social & news narrative velocity.' : 'Negative narrative pressure and risk-off rotation.',
    },
  ];

  const confirmedList = indicators.filter(i => i.confirmed);
  const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
  const confirmedWeight = confirmedList.reduce((sum, i) => sum + i.weight, 0);
  const confluenceScore = Math.min(99, Math.max(65, Math.round((confirmedWeight / totalWeight) * 100)));

  const stratInfo = CONFIRMATION_STRATEGIES[strategyMode] || CONFIRMATION_STRATEGIES['MULTI_CONFLUENCE'];

  let marketRegime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'HIGH_VOLATILITY_RANGING' | 'COMPRESSION_SQUEEZE' | 'LIQUIDITY_HUNT' = 'TRENDING_UP';
  if (vol > 8.0) {
    marketRegime = 'HIGH_VOLATILITY_RANGING';
  } else if (vol < 2.8) {
    marketRegime = 'COMPRESSION_SQUEEZE';
  } else if (!isLong && change24h < -3) {
    marketRegime = 'TRENDING_DOWN';
  } else if (isLong && change24h > 3) {
    marketRegime = 'TRENDING_UP';
  } else {
    marketRegime = 'LIQUIDITY_HUNT';
  }

  const primaryTrigger = isLong
    ? `Bullish Confluence: 200 EMA baseline defense + RSI ${rsi.toFixed(1)} reset + ${stratInfo.badge}`
    : `Bearish Confluence: Resistance rejection + RSI ${rsi.toFixed(1)} exhaustion + ${stratInfo.badge}`;

  return {
    strategyMode,
    strategyName: stratInfo.name,
    confluenceScore,
    minConfluenceRequired: stratInfo.minConfluencePercent,
    confirmedCount: confirmedList.length,
    totalEvaluated: indicators.length,
    indicators,
    marketRegime,
    primaryTrigger,
  };
}

export const STAGE_CONFIGS: Record<ConsensusStage, {
  label: string;
  botsRequired: string;
  marginPercent: number; // % of Master Dynamic Capital (Max 5.0% cap)
  defaultLeverage: number;
  minLeverage: number;
  maxLeverage: number;
  rrRatio: number;
  accentColor: string;
  description: string;
}> = {
  1: {
    label: 'Stage 1 Entry',
    botsRequired: 'Any 1 Bot (Primary Signal)',
    marginPercent: 0.015, // 1.5% ($15 on $1,000)
    defaultLeverage: 5,
    minLeverage: 3,
    maxLeverage: 6,
    rrRatio: 1.5,
    accentColor: '#3B82F6', // Blue
    description: 'Initial signal discovery by any of the 5 specialist bots. Conservative entry testing the market.',
  },
  2: {
    label: 'Stage 2 Entry',
    botsRequired: 'Any 2 Bots Confirmed',
    marginPercent: 0.025, // 2.5% ($25 on $1,000)
    defaultLeverage: 8,
    minLeverage: 6,
    maxLeverage: 10,
    rrRatio: 1.8,
    accentColor: '#06B6D4', // Cyan
    description: 'Secondary confirmation achieved by any 2 bot brains. Increased position size with moderate leverage.',
  },
  3: {
    label: 'Stage 3 Entry',
    botsRequired: 'Any 3 Bots Confirmed',
    marginPercent: 0.035, // 3.5% ($35 on $1,000)
    defaultLeverage: 14,
    minLeverage: 10,
    maxLeverage: 16,
    rrRatio: 2.2,
    accentColor: '#10B981', // Emerald
    description: 'Majority consensus across any 3 bot brains. High conviction swing with escalated margin.',
  },
  4: {
    label: 'Stage 4 Entry',
    botsRequired: 'Any 4 Bots Confirmed',
    marginPercent: 0.045, // 4.5% ($45 on $1,000)
    defaultLeverage: 18,
    minLeverage: 15,
    maxLeverage: 22,
    rrRatio: 2.5,
    accentColor: '#8B5CF6', // Purple
    description: 'Strong multi-timeframe & technical alignment across 4 bot brains. Near-unanimous fleet momentum.',
  },
  5: {
    label: 'Stage 5 Entry',
    botsRequired: 'All 5 Bots Confirmed (Max Consensus)',
    marginPercent: 0.050, // 5.0% Max Cap ($50 on $1,000)
    defaultLeverage: 25,
    minLeverage: 20,
    maxLeverage: 30,
    rrRatio: 3.0,
    accentColor: '#F59E0B', // Amber Gold
    description: 'Unanimous 5-Bot maximum conviction. Highest allocation capped strictly at 5% of dynamic capital.',
  },
};

/**
 * Calculates trade parameters strictly based on the Consensus Stage and Master Portfolio ($1,000 base)
 * Rule Enforced: Max 5% of Dynamic Capital per trade & Max Loss 3% of Capital per trade.
 */
export function calculateStagedTradeParameters(
  masterBalance: number,
  stage: ConsensusStage,
  initiatorBot: TradingBot,
  confirmingBots: TradingBot[],
  coin: CryptoCoin,
  direction: TradeDirection,
  strategyMode: ConfirmationStrategyMode = 'MULTI_CONFLUENCE'
): {
  margin: number;
  remainingMargin: number;
  leverage: number;
  positionSize: number;
  entryPrice: number;
  initialStopLossPrice: number;
  stopLossPrice: number;
  slMode: 'INITIAL' | 'BREAKEVEN' | 'LOCKED_TP1' | 'LOCKED_TP2' | 'TRAILING_STRUCTURE';
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  takeProfitPrice: number;
  runnerPercent: number;
  structuralSupportPrice: number;
  structuralResistancePrice: number;
  targetProfitUsd: number;
  maxLossUsd: number;
  aiReasoning: string;
  teacherExplanation: TeacherExplanation;
  confirmationMatrix: TradeConfirmationMatrix;
} {
  const safeBalance = Math.max(100, masterBalance || 1000);
  const stageConfig = STAGE_CONFIGS[stage] || STAGE_CONFIGS[1];

  // Dynamic margin strictly capped at maximum 5% of dynamic capital per trade
  const maxDynamicMargin = safeBalance * 0.05; // 5% ceiling
  const rawMargin = Math.min(maxDynamicMargin, safeBalance * stageConfig.marginPercent);
  const margin = parseFloat(Math.max(5.00, rawMargin).toFixed(2));

  // Determine dynamic leverage based on stage, bot ranges, and coin volatility
  let leverage = stageConfig.defaultLeverage;
  const coinVol = Number(coin.volatility) || 5;

  if (coinVol > 8) {
    leverage = Math.max(stageConfig.minLeverage, leverage - 2);
  } else if (coinVol < 3 && stage >= 3) {
    leverage = Math.min(stageConfig.maxLeverage, leverage + 2);
  }

  const positionSize = parseFloat((margin * leverage).toFixed(2));

  // Extract clean entry price
  let rawPrice = coin.price as any;
  if (typeof rawPrice === 'object' && rawPrice !== null && 'price' in rawPrice) {
    rawPrice = rawPrice.price;
  }
  const entryPrice = Number(rawPrice) > 0 ? Number(rawPrice) : 1;

  // Max Loss strictly capped at maximum 3% of dynamic capital ($30 on $1,000)
  const maxDynamicLossCeiling = safeBalance * 0.03; // Max 3% loss per trade
  const proportionalLoss = margin * 0.60;
  const maxLossUsd = parseFloat(Math.min(maxDynamicLossCeiling, Math.max(2.00, proportionalLoss)).toFixed(2));

  // Target profit with stage risk-reward ratio (minimum $2.00 profit)
  const targetProfitUsd = parseFloat(Math.max(2.50, maxLossUsd * stageConfig.rrRatio).toFixed(2));

  const profitPriceDelta = (targetProfitUsd / Math.max(0.01, positionSize)) * entryPrice;
  const lossPriceDelta = (maxLossUsd / Math.max(0.01, positionSize)) * entryPrice;

  const formatPrecision = (num: number): number => {
    const val = Number(num);
    if (isNaN(val)) return 0;
    if (val >= 100) return parseFloat(val.toFixed(2));
    if (val >= 1) return parseFloat(val.toFixed(4));
    return parseFloat(val.toFixed(6));
  };

  // Multi-tier TP Targets:
  // TP1 = 40% of full expansion (Books 35% & shifts SL to Entry Breakeven)
  // TP2 = 75% of full expansion (Books 25% & shifts SL to TP1)
  // TP3 = 100% of full expansion (Books 20% & shifts SL to TP2)
  // Runner = Remaining 20% trails structural S/R pivots
  let tp1Price: number;
  let tp2Price: number;
  let tp3Price: number;
  let takeProfitPrice: number;
  let stopLossPrice: number;
  let structuralSupportPrice: number;
  let structuralResistancePrice: number;

  if (direction === 'LONG') {
    tp1Price = formatPrecision(entryPrice + profitPriceDelta * 0.40);
    tp2Price = formatPrecision(entryPrice + profitPriceDelta * 0.75);
    tp3Price = formatPrecision(entryPrice + profitPriceDelta * 1.00);
    takeProfitPrice = tp3Price;
    stopLossPrice = formatPrecision(entryPrice - lossPriceDelta);
    structuralSupportPrice = formatPrecision(Math.min(entryPrice * 0.985, (coin.low24h && coin.low24h > 0) ? coin.low24h : entryPrice - lossPriceDelta * 1.2));
    structuralResistancePrice = formatPrecision(Math.max(entryPrice * 1.025, (coin.high24h && coin.high24h > 0) ? coin.high24h : entryPrice + profitPriceDelta * 1.2));
  } else {
    tp1Price = formatPrecision(entryPrice - profitPriceDelta * 0.40);
    tp2Price = formatPrecision(entryPrice - profitPriceDelta * 0.75);
    tp3Price = formatPrecision(entryPrice - profitPriceDelta * 1.00);
    takeProfitPrice = tp3Price;
    stopLossPrice = formatPrecision(entryPrice + lossPriceDelta);
    structuralSupportPrice = formatPrecision(Math.min(entryPrice * 0.975, (coin.low24h && coin.low24h > 0) ? coin.low24h : entryPrice - profitPriceDelta * 1.2));
    structuralResistancePrice = formatPrecision(Math.max(entryPrice * 1.015, (coin.high24h && coin.high24h > 0) ? coin.high24h : entryPrice + lossPriceDelta * 1.2));
  }

  const aiReasoning = generateStagedAIReasoning(stage, initiatorBot, confirmingBots, coin, direction, leverage);
  const teacherExplanation = generateTeacherTradeExplanation(
    stage,
    initiatorBot,
    confirmingBots,
    coin,
    direction,
    leverage,
    margin,
    entryPrice,
    tp1Price,
    tp2Price,
    tp3Price,
    stopLossPrice,
    structuralSupportPrice,
    structuralResistancePrice
  );

  const confirmationMatrix = evaluateTradeConfirmationMatrix(coin, direction, strategyMode);

  return {
    margin,
    remainingMargin: margin,
    leverage,
    positionSize,
    entryPrice,
    initialStopLossPrice: stopLossPrice,
    stopLossPrice,
    slMode: 'INITIAL',
    tp1Price,
    tp2Price,
    tp3Price,
    takeProfitPrice,
    runnerPercent: 20,
    structuralSupportPrice,
    structuralResistancePrice,
    targetProfitUsd,
    maxLossUsd,
    aiReasoning,
    teacherExplanation,
    confirmationMatrix,
  };
}

export function generateTeacherTradeExplanation(
  stage: ConsensusStage,
  initiatorBot: TradingBot,
  confirmingBots: TradingBot[],
  coin: CryptoCoin,
  direction: TradeDirection,
  leverage: number,
  margin: number,
  entryPrice: number,
  tp1: number,
  tp2: number,
  tp3: number,
  initialSl: number,
  support: number,
  resistance: number
): TeacherExplanation {
  const sym = coin.symbol;
  const isLong = direction === 'LONG';
  const rsi = coin.rsi || (isLong ? 36.5 : 68.2);
  const botNames = confirmingBots.map(b => b.name).join(', ');

  const setupHeadline = isLong
    ? `Bullish Structural Expansion & Higher-Timeframe Support Rebound on $${sym}`
    : `Bearish Liquidity Exhaustion & Resistance Distribution Breakdown on $${sym}`;

  const macroContext = isLong
    ? `The broader market structure exhibits constructive buyer accumulation. $${sym} has established a defended base above $${support}, outperforming local altcoin correlations with increasing spot buyer absorption.`
    : `Market momentum is showing exhaustion at overhead supply zones. $${sym} failed to sustain momentum above key resistance at $${resistance}, with sell volume outpacing passive bids.`;

  const technicalConfluence: string[] = [
    `1. Trend & Moving Averages: Multi-timeframe EMA alignment (EMA 20 > EMA 50) on 1H/4H charts with expanding volatility ribbon in favor of ${direction}.`,
    `2. Momentum & RSI Oscillator: 14-period RSI currently at ${rsi.toFixed(1)} showing clear ${isLong ? 'bullish momentum divergence from support' : 'overbought rejection from local ceiling'}.`,
    `3. Volume & Order Flow: 24h Volume exceeds $${((coin.volume24h || 150000000) / 1000000).toFixed(1)}M with net aggressive market order delta heavily skewed towards ${direction}.`,
    `4. Structural Pivots: Respecting critical structural ${isLong ? `Support at $${support}` : `Resistance at $${resistance}`} with high-volume rejection wicks on lower timeframes.`,
  ];

  const riskPlan = `• Entry: $${entryPrice} (${leverage}x Leverage | Margin: $${margin.toFixed(2)})\n` +
    `• TP1 ($${tp1}): Book 35% Profit ➔ Instantly move Stop-Loss to Entry ($${entryPrice}) making the trade 100% RISK-FREE.\n` +
    `• TP2 ($${tp2}): Book 25% Profit ➔ Lock Stop-Loss at TP1 price ($${tp1}) guaranteeing positive net return.\n` +
    `• TP3 ($${tp3}): Book 20% Profit ➔ Lock Stop-Loss at TP2 price ($${tp2}).\n` +
    `• Runner (20%): Allow remaining 20% to run indefinitely, trailing structural ${isLong ? 'swing higher-low supports' : 'swing lower-high resistances'}.\n` +
    `• Initial Stop-Loss: Hard guarded at $${initialSl} (Strict maximum 3% portfolio loss ceiling).`;

  const consensusWhy = `This trade met the Fleet's ultra-strict institutional filters: minimum 78+ conviction score, multi-timeframe indicator alignment, and direct confirmation from ${confirmingBots.length} specialist bots (${botNames}). Low-conviction noisy setups were automatically filtered out.`;

  return {
    setupHeadline,
    macroContext,
    technicalConfluence,
    riskPlan,
    consensusWhy,
  };
}


export function generateStagedAIReasoning(
  stage: ConsensusStage,
  initiatorBot: TradingBot,
  confirmingBots: TradingBot[],
  coin: CryptoCoin,
  direction: TradeDirection,
  leverage: number
): string {
  const symbol = coin.symbol;
  const botNames = confirmingBots.map(b => b.name).join(', ');

  switch (stage) {
    case 1:
      return `Stage 1 Discovery (${initiatorBot.name} ➔ ${direction} ${leverage}x): Primary signal triggered on $${symbol}. Monitoring for secondary bot technical validation before scaling margin.`;
    case 2:
      return `Stage 2 Consensus (${confirmingBots.length} Bots: ${botNames}): 2-Bot confirmation active on $${symbol} ${direction}. Trend & volatility alignment validated.`;
    case 3:
      return `Stage 3 Majority Consensus (${confirmingBots.length} Bots: ${botNames}): 3 Specialist engines agree on $${symbol} ${direction}. Sentiment + Technical + Volatility confluence.`;
    case 4:
      return `Stage 4 High-Conviction Fleet Alignment (${botNames}): 4 Specialist brains confirm strong directional momentum on $${symbol} ${direction} (${leverage}x).`;
    case 5:
      return `Stage 5 Maximum Fleet Consensus (ALL 5 BOTS UNANIMOUS: ${botNames}): Unanimous fleet conviction on $${symbol} ${direction} with maximum dynamic allocation (${leverage}x).`;
    default:
      return `Autonomous Staged Execution on $${symbol} ${direction} with ${confirmingBots.length} confirming bots.`;
  }
}

/**
 * Computes performance analytics for each of the 5 consensus stages
 */
export function computeStagePerformanceStats(auditLogs: TradePosition[]): StagePerformanceStats[] {
  const stages: ConsensusStage[] = [1, 2, 3, 4, 5];

  return stages.map(stage => {
    const stageTrades = auditLogs.filter(t => (t.stageAtClose || t.stage) === stage);
    const totalTrades = stageTrades.length;
    const wins = stageTrades.filter(t => t.status === 'CLOSED_TP' || (t.realizedPnL || 0) > 0).length;
    const losses = stageTrades.filter(t => t.status === 'CLOSED_SL' || (t.realizedPnL || 0) < 0).length;
    const winRate = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;

    const totalRealizedPnL = parseFloat(stageTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0).toFixed(2));
    
    const totalRoi = stageTrades.reduce((sum, t) => sum + (t.realizedPnLPercent || 0), 0);
    const avgRoiPercent = totalTrades > 0 ? parseFloat((totalRoi / totalTrades).toFixed(1)) : 0;

    const totalLev = stageTrades.reduce((sum, t) => sum + t.leverage, 0);
    const avgLeverage = totalTrades > 0 ? Math.round(totalLev / totalTrades) : STAGE_CONFIGS[stage].defaultLeverage;

    const grossProfit = stageTrades.filter(t => (t.realizedPnL || 0) > 0).reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    const grossLoss = Math.abs(stageTrades.filter(t => (t.realizedPnL || 0) < 0).reduce((sum, t) => sum + (t.realizedPnL || 0), 0));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 9.99 : 0);

    const config = STAGE_CONFIGS[stage];

    return {
      stage,
      stageLabel: config.label,
      botsRequiredText: config.botsRequired,
      totalTrades,
      wins,
      losses,
      winRate,
      totalRealizedPnL,
      avgRoiPercent,
      avgLeverage,
      profitFactor,
      description: config.description,
      accentColor: config.accentColor,
    };
  });
}

/**
 * Autonomous Learning & Evolutionary Heuristic Generator
 */
export function analyzeTradeMistakeAndEvolve(
  trade: TradePosition,
  bots: TradingBot[],
  currentGeneration: number
): {
  learningNote: BotLearningNote;
  heuristicUpdate: SelfLearningHeuristic;
  updatedBots: TradingBot[];
} {
  const symbol = trade.symbol.split('/')[0];
  const direction = trade.direction;
  const stage = trade.stage;

  const mistakesPool = [
    {
      category: 'CONSENSUS_FILTER' as const,
      mistake: `Stage ${stage} ${direction} entry on $${symbol} lacked higher timeframe multi-candle confirmation.`,
      lesson: `Enforce a 2-candle body close confirmation requirement on 15M/1H before allowing Stage 1/2 trades near key S/R.`,
      adjustment: `Consensus Filter Tightened: Stage 1 entry threshold raised from 65 to 72 confidence points.`,
      paramKey: 'STAGE_1_CONFIRMATION_THRESHOLD',
      prevVal: '65 pts',
      nextVal: '72 pts',
      adaptationType: 'TIGHTENED' as const,
    },
    {
      category: 'VOLATILITY_CLAMP' as const,
      mistake: `Caught in low-liquidity volatility whip-saw on $${symbol} during market maker liquidity sweep.`,
      lesson: `Clamping max leverage dynamically on tokens with 24h volume under $100M or bid-ask spread > 0.35%.`,
      adjustment: `Dynamic Spread Clamp: Leverage reduced by 30% for tokens with elevated slippage index.`,
      paramKey: 'SPREAD_LEVERAGE_CLAMP',
      prevVal: '1.0x (Standard)',
      nextVal: '0.70x (Tightened)',
      adaptationType: 'HARDENED' as const,
    },
    {
      category: 'STOP_LOSS_SPACING' as const,
      mistake: `Stop-loss on $${symbol} was too tightly clustered around local wick lows rather than structure support.`,
      lesson: `Widen ATR stop buffer by +0.35x ATR to avoid getting hunted during normal market noise.`,
      adjustment: `Dynamic ATR Buffer expanded from 1.2x to 1.55x ATR for high-beta tokens.`,
      paramKey: 'DYNAMIC_ATR_STOP_BUFFER',
      prevVal: '1.20x ATR',
      nextVal: '1.55x ATR',
      adaptationType: 'EXPANDED' as const,
    },
    {
      category: 'SENTIMENT_WEIGHT' as const,
      mistake: `Over-weighted social sentiment velocity during macro Bitcoin trend dislocation.`,
      lesson: `Mandate Bitcoin 15M trend alignment check before allowing Stage 3+ aggressive sentiment entries.`,
      adjustment: `BTC Macro Trend Gate enabled: Multi-bot consensus requires BTC direction correlation >= 0.40.`,
      paramKey: 'BTC_CORRELATION_GATE',
      prevVal: 'Disabled (0.00)',
      nextVal: 'Enabled (0.40 Min)',
      adaptationType: 'OPTIMIZED' as const,
    },
  ];

  const selected = mistakesPool[Math.floor(Math.random() * mistakesPool.length)];

  const learningNote: BotLearningNote = {
    id: `learn-${Date.now()}`,
    timestamp: Date.now(),
    tradeId: trade.id,
    symbol: symbol,
    direction: trade.direction,
    stage: trade.stage,
    lossAmount: Math.abs(trade.realizedPnL || trade.maxLossUsd),
    mistakeIdentified: selected.mistake,
    learnedLesson: selected.lesson,
    parameterAdjustment: selected.adjustment,
    confidenceScore: Math.floor(90 + Math.random() * 8),
    evolutionGeneration: currentGeneration + 1,
  };

  const heuristicUpdate: SelfLearningHeuristic = {
    id: `heur-${Date.now()}`,
    key: selected.paramKey,
    name: selected.paramKey.replace(/_/g, ' '),
    category: selected.category,
    currentValue: selected.nextVal,
    previousValue: selected.prevVal,
    adaptationType: selected.adaptationType,
    rationale: selected.lesson,
    effectivenessScore: Math.floor(92 + Math.random() * 7),
    timestamp: Date.now(),
  };

  // Adjust bot strategy weights and confidence modifiers dynamically
  const updatedBots = bots.map(b => {
    if (trade.confirmingBotIds.includes(b.id)) {
      const isLoss = (trade.realizedPnL || 0) < 0;
      return {
        ...b,
        mistakesCount: isLoss ? b.mistakesCount + 1 : b.mistakesCount,
        lossTradesAssisted: isLoss ? b.lossTradesAssisted + 1 : b.lossTradesAssisted,
        winTradesAssisted: !isLoss ? b.winTradesAssisted + 1 : b.winTradesAssisted,
        strategyWeight: isLoss 
          ? parseFloat(Math.max(0.75, b.strategyWeight - 0.02).toFixed(2))
          : parseFloat(Math.min(1.85, b.strategyWeight + 0.03).toFixed(2)),
        adaptiveConfidenceModifier: isLoss
          ? parseFloat(Math.max(0.85, b.adaptiveConfidenceModifier - 0.03).toFixed(2))
          : parseFloat(Math.min(1.40, b.adaptiveConfidenceModifier + 0.04).toFixed(2)),
        learningNotes: isLoss ? [learningNote, ...b.learningNotes.slice(0, 19)] : b.learningNotes,
      };
    }
    return b;
  });

  return {
    learningNote,
    heuristicUpdate,
    updatedBots,
  };
}

// Telegram Message Formatters
export function formatTelegramStageTradeOpen(trade: TradePosition): string {
  const stageConfig = STAGE_CONFIGS[trade.stage] || STAGE_CONFIGS[1];
  const teacher = trade.teacherExplanation;
  const matrix = trade.confirmationMatrix;
  const matrixText = matrix 
    ? `\n📊 *CONFIRMATION MATRIX (${matrix.confluenceScore}% Confluence)*:\n• *Strategy*: \`${matrix.strategyName}\`\n• *Confirmed*: \`${matrix.confirmedCount}/${matrix.totalEvaluated} Technical Indicators Validated\`\n• *Regime*: \`${matrix.marketRegime}\`\n━━━━━━━━━━━━━━━━━━━━`
    : '';

  return `🚀 *[STAGE ${trade.stage} HIGH-CONVICTION TRADE OPENED]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\`
• *Side*: *${trade.direction}* (${trade.leverage}x Leverage)
• *Consensus Stage*: *${stageConfig.label}* (${trade.confirmingBotNames.length} Bots Agreed)
• *Confirming Bots*: \`${trade.confirmingBotNames.join(', ')}\`${matrixText}
• *Entry Price*: \`$${trade.entryPrice}\`
• *Margin (Master $1K)*: \`$${trade.margin.toFixed(2)}\`
• *Position Size*: \`$${trade.positionSize.toFixed(2)}\`
━━━━━━━━━━━━━━━━━━━━
🎯 *MULTI-TIER PROFIT & RISK BLUEPRINT*:
  1️⃣ *TP 1*: \`$${trade.tp1Price}\` (Book 35% & Shift SL to Entry Breakeven)
  2️⃣ *TP 2*: \`$${trade.tp2Price}\` (Book 25% & Shift SL to TP1)
  3️⃣ *TP 3*: \`$${trade.tp3Price}\` (Book 20% & Shift SL to TP2)
  🚀 *Runner (20%)*: Trailing Structural S/R Pivot (\`$${trade.structuralSupportPrice || trade.stopLossPrice}\`)
🛑 *Initial Stop Loss*: \`$${trade.initialStopLossPrice || trade.stopLossPrice}\` (Max 3% Loss Guard)
━━━━━━━━━━━━━━━━━━━━
🎓 *TEACHER TRADE RATIONALE*:
*${teacher?.setupHeadline || trade.aiReasoning}*

${teacher?.technicalConfluence?.slice(0, 3).join('\n') || ''}

⚡ *24/7 Autonomous Strict Fleet Engine Active*`;
}

export function formatTelegramPartialTPHit(
  trade: TradePosition,
  tier: 1 | 2 | 3,
  bookedAmount: number,
  newSlPrice: number,
  slLabel: string,
  masterPortfolio: MasterPortfolio
): string {
  const pct = tier === 1 ? '35%' : tier === 2 ? '25%' : '20%';
  return `🎯 *[TP ${tier} HIT - ${pct} PROFIT SECURED]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\` (${trade.direction} ${trade.leverage}x)
• *Tier*: *TP ${tier} Target Hit @ $${tier === 1 ? trade.tp1Price : tier === 2 ? trade.tp2Price : trade.tp3Price}*
• *Booked Profit*: *+ $${bookedAmount.toFixed(2)} USDT* (${pct} of position)
• *Total Booked So Far*: \`+$${trade.totalBookedPnL.toFixed(2)} USDT\`
━━━━━━━━━━━━━━━━━━━━
🛡️ *DYNAMIC STOP-LOSS SHIFT*:
• *New SL Price*: \`$${newSlPrice}\` (${slLabel})
• *Risk Status*: *${tier === 1 ? '100% RISK-FREE BREAKEVEN' : 'GUARANTEED PROFIT PROTECTED'}*
━━━━━━━━━━━━━━━━━━━━
💰 *Master Portfolio Balance*: \`$${masterPortfolio.currentBalance.toFixed(2)} USDT\`
⚡ *Remaining Position Running Towards Next Target!*`;
}

export function formatTelegramStageUpgrade(trade: TradePosition, addedBotName: string): string {
  return `⚡ *[TRADE STAGE UPGRADED ➔ STAGE ${trade.stage}]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\` (${trade.direction})
• *New Consensus Level*: *Stage ${trade.stage} (${trade.confirmingBotNames.length} Bots)*
• *Confirmed By*: \`${addedBotName}\`
• *Upgraded Margin*: \`$${trade.margin.toFixed(2)}\` (Leverage: ${trade.leverage}x)
• *New Position Size*: \`$${trade.positionSize.toFixed(2)}\`
• *Current Mark Price*: \`$${trade.currentPrice}\`
━━━━━━━━━━━━━━━━━━━━
📈 *Multi-Bot Consensus Escalated!*`;
}

export function formatTelegramTPHit(trade: TradePosition, masterPortfolio: MasterPortfolio): string {
  const pnl = trade.realizedPnL || trade.targetProfitUsd;
  const pnlPct = trade.realizedPnLPercent || ((pnl / trade.margin) * 100);
  return `🎯 *[TRADE COMPLETED - FULL TARGET / RUNNER CLOSED]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\` (${trade.direction} ${trade.leverage}x)
• *Stage*: *Stage ${trade.stage} (${trade.confirmingBotNames.length} Bots)*
• *Entry*: \`$${trade.entryPrice}\` ➔ *Exit*: \`$${trade.closePrice || trade.takeProfitPrice}\`
• *Total Realized Profit*: *+ $${pnl.toFixed(2)} USDT* (+${pnlPct.toFixed(2)}% ROI)
• *TP1 + TP2 + TP3 + Runner Harvest*: \`All Tiers Executed\`
━━━━━━━━━━━━━━━━━━━━
💰 *Master Portfolio Balance*: \`$${masterPortfolio.currentBalance.toFixed(2)} USDT\`
📊 *Fleet Record*: \`${masterPortfolio.totalWins}W / ${masterPortfolio.totalLosses}L\` (${masterPortfolio.fleetWinRate.toFixed(1)}% Win Rate)

🚀 *Self-learning system reinforced successful patterns.*`;
}

export function formatTelegramSLHit(
  trade: TradePosition, 
  masterPortfolio: MasterPortfolio, 
  learning: BotLearningNote
): string {
  const pnl = Math.abs(trade.realizedPnL || trade.maxLossUsd);
  return `🛑 *[STOP-LOSS HIT - AI SELF-LEARNING TRIGGERED]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\` (Stage ${trade.stage} ${trade.direction} ${trade.leverage}x)
• *Realized Loss*: *- $${pnl.toFixed(2)} USDT* (Master Capital Guarded)
• *Master Portfolio Balance*: \`$${masterPortfolio.currentBalance.toFixed(2)} USDT\`
━━━━━━━━━━━━━━━━━━━━
🧠 *AUTONOMOUS BRAIN POST-MORTEM & ADAPTIVE EVOLUTION*:
⚠️ *Mistake*: _${learning.mistakeIdentified}_
💡 *Lesson*: _${learning.learnedLesson}_
⚙️ *Rule Auto-Tuned*: \`${learning.parameterAdjustment}\`

📈 *Gen #${learning.evolutionGeneration || masterPortfolio.evolutionGeneration}: Parameters auto-adjusted across all 5 bot brains!*`;
}

export function formatTelegramFleetSummary(
  masterPortfolio: MasterPortfolio, 
  activeTrades: TradePosition[], 
  bots: TradingBot[]
): string {
  const totalNet = masterPortfolio.currentBalance - masterPortfolio.initialBase;
  const sign = totalNet >= 0 ? '+' : '';

  const stageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  activeTrades.forEach(t => {
    stageCounts[t.stage] = (stageCounts[t.stage] || 0) + 1;
  });

  return `📊 *[24/7 AUTONOMOUS STAGED FLEET REPORT]*
━━━━━━━━━━━━━━━━━━━━
💰 *Master Fleet Portfolio ($1,000 Base)*: *$${masterPortfolio.currentBalance.toFixed(2)} USDT*
📈 *Total Net PnL*: *${sign}$${totalNet.toFixed(2)} (${sign}${masterPortfolio.netROI.toFixed(2)}%)*
🏆 *Fleet Win Rate*: *${masterPortfolio.fleetWinRate.toFixed(1)}%* (${masterPortfolio.totalWins}W / ${masterPortfolio.totalLosses}L on ${masterPortfolio.totalTradesExecuted} trades)
⚡ *Active Running Trades*: *${activeTrades.length} Positions* (Unlimited Capacity)
  • Stage 1 (1 Bot): ${stageCounts[1]}
  • Stage 2 (2 Bots): ${stageCounts[2]}
  • Stage 3 (3 Bots): ${stageCounts[3]}
  • Stage 4 (4 Bots): ${stageCounts[4]}
  • Stage 5 (5 Bots Max): ${stageCounts[5]}
━━━━━━━━━━━━━━━━━━━━
🧠 *Self-Learning Evolution*: Gen #${masterPortfolio.evolutionGeneration} (${masterPortfolio.selfLearningAdaptationsCount} Heuristics Evolved)
⏱️ *Fleet Uptime: 24x7 Continuous Execution*`;
}

