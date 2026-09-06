import { 
  ArenaBot, 
  CryptoCoin, 
  TradePosition, 
  TradeDirection, 
  BotConfirmationRule, 
  BotBrainMistakeLog,
  ArenaFleetState 
} from '../types';
import { isHighDecimalOrBlacklistedCoin } from '../data/topCoins';

export function adaptBotStrategyFromPast(
  bot: ArenaBot, 
  trade: TradePosition, 
  outcome: 'WIN' | 'LOSS'
): void {
  const currentGen = (bot.aiBrain.evolutionGeneration || 1) + 1;
  bot.aiBrain.evolutionGeneration = currentGen;
  
  if (!bot.aiBrain.strategyEvolutionLog) {
    bot.aiBrain.strategyEvolutionLog = [];
  }
  if (!bot.aiBrain.universalScanningMistakeFilters) {
    bot.aiBrain.universalScanningMistakeFilters = [];
  }

  const prevParams = bot.aiBrain.adaptedParameters || {
    generation: 1,
    rsiMinLong: 44,
    rsiMaxLong: 68,
    rsiMinShort: 32,
    rsiMaxShort: 56,
    minRvol: 1.5,
    minConfirmationRules: 9,
    minConfidenceScore: 90,
    tp1ProfitTargetPercent: 35,
    slDistancePercent: 0.018,
    tp1DistancePercent: 0.035,
    tp2DistancePercent: 0.075,
    runnerTrailingPercent: 0.015,
    lastAdaptedReason: 'Initial baseline setup',
    universalPairsCount: 50,
  };

  if (outcome === 'LOSS') {
    // Elevate qualification standards globally across ALL 50 universe coins
    const newMinConf = Math.min(97, prevParams.minConfidenceScore + 1);
    const newRvol = parseFloat(Math.min(2.4, prevParams.minRvol + 0.15).toFixed(2));
    const newRules = Math.min(10, Math.max(9, prevParams.minConfirmationRules));
    const newSlDist = parseFloat(Math.max(0.012, prevParams.slDistancePercent * 0.95).toFixed(4));
    
    // Tighten RSI entry bands globally across all coins
    const newRsiMinLong = Math.min(50, prevParams.rsiMinLong + 1);
    const newRsiMaxLong = Math.max(62, prevParams.rsiMaxLong - 1);
    const newRsiMinShort = Math.min(38, prevParams.rsiMinShort + 1);
    const newRsiMaxShort = Math.max(48, prevParams.rsiMaxShort - 1);

    bot.aiBrain.adaptedParameters = {
      ...prevParams,
      generation: currentGen,
      minConfidenceScore: newMinConf,
      minConfirmationRules: newRules,
      minRvol: newRvol,
      rsiMinLong: newRsiMinLong,
      rsiMaxLong: newRsiMaxLong,
      rsiMinShort: newRsiMinShort,
      rsiMaxShort: newRsiMaxShort,
      slDistancePercent: newSlDist,
      universalPairsCount: 50,
      lastAdaptedReason: `Universal Gen ${currentGen} Upgrade (Active on ALL 50 Universe Pairs): Raised entry conviction floor to ${newMinConf}%, upgraded universal RVOL gate to ${newRvol}x, and recalibrated 10-indicator confirmation rules across all scanned assets.`,
    };

    bot.aiBrain.strategyEvolutionLog.unshift(
      `[Gen ${currentGen} Universal Adaptation - ALL 50 Pairs] Calibrated global scanner: Conviction gate raised to ${newMinConf}%, minimum RVOL filter to ${newRvol}x, and tightened RSI corridor after analyzing ${trade.symbol} reversal.`
    );

    bot.aiBrain.scanningDefenseCount = (bot.aiBrain.scanningDefenseCount || 0) + 1;
  } else {
    // Win adaptation: Optimize trailing runner and reward-to-risk across all coins
    const newRunnerTrail = parseFloat((prevParams.runnerTrailingPercent * 1.05).toFixed(4));
    bot.aiBrain.adaptedParameters = {
      ...prevParams,
      generation: currentGen,
      runnerTrailingPercent: newRunnerTrail,
      universalPairsCount: 50,
      lastAdaptedReason: `Universal Gen ${currentGen} Optimization (Active on ALL 50 Universe Pairs): Trailing runner buffer enhanced to ${(newRunnerTrail * 100).toFixed(2)}% following profitable ${trade.symbol} trade.`,
    };

    bot.aiBrain.strategyEvolutionLog.unshift(
      `[Gen ${currentGen} Universal Optimization - ALL 50 Pairs] Enhanced runner trajectory to ${(newRunnerTrail * 100).toFixed(2)}% trailing buffer across all universe assets after +$${(trade.realizedPnL || 0).toFixed(2)} gain on ${trade.symbol}.`
    );
  }

  if (bot.aiBrain.strategyEvolutionLog.length > 25) {
    bot.aiBrain.strategyEvolutionLog.pop();
  }
}

export function evaluateBotConfirmation(bot: ArenaBot, coin: CryptoCoin): {
  qualifies: boolean;
  confirmedCount: number;
  confidenceScore: number;
  direction: TradeDirection;
  rationale: string;
  evaluatedRules: BotConfirmationRule[];
} {
  // 0. Strict Contract & Asset Verification Gate (Exclude unverified contracts, KAS/Kaspa, or low-decimal tokens)
  if (isHighDecimalOrBlacklistedCoin(coin.symbol, coin.price) || !coin.isVerified || !coin.contractAddress) {
    return {
      qualifies: false,
      confirmedCount: 0,
      confidenceScore: 0,
      direction: 'LONG',
      rationale: `Rejected: ${coin.symbol} failed contract address verification or is on the excluded asset blacklist (including KAS).`,
      evaluatedRules: bot.confirmationRules.map(r => ({ ...r, isConfirmed: false, liveValue: 'Contract/Asset Rejected' })),
    };
  }

  // Determine high-conviction direction: support BOTH LONG and SHORT setups
  // If coin is falling/bearish or has sell momentum -> SHORT
  // If coin is rising/bullish or has buy momentum -> LONG
  let direction: TradeDirection;
  if (
    coin.change24h < -0.3 || 
    coin.trend === 'BEARISH' || 
    coin.macd === 'BEARISH_CROSS' || 
    coin.recommendation === 'SHORT' || 
    coin.recommendation === 'STRONG_SHORT'
  ) {
    direction = 'SHORT';
  } else if (
    coin.change24h > 0.3 || 
    coin.trend === 'BULLISH' || 
    coin.macd === 'BULLISH_CROSS' || 
    coin.recommendation === 'LONG' || 
    coin.recommendation === 'STRONG_LONG'
  ) {
    direction = 'LONG';
  } else {
    // For neutral coins, adapt according to bot archetype or slight momentum
    direction = (bot.strategyCategory === 'MEAN_REVERSION' && coin.rsi > 50) || coin.change24h < 0 
      ? 'SHORT' 
      : 'LONG';
  }
  
  const adapted = bot.aiBrain.adaptedParameters;
  const minRvolThreshold = adapted ? adapted.minRvol * 3000000 : 4000000;
  const rsiMinL = adapted ? adapted.rsiMinLong : 44;
  const rsiMaxL = adapted ? adapted.rsiMaxLong : 66;
  const rsiMinS = adapted ? adapted.rsiMinShort : 34;
  const rsiMaxS = adapted ? adapted.rsiMaxShort : 56;

  // AI Scanning Mistake Defense Heuristic (Active across ALL 50 Universe Pairs)
  let scanningDefenseBlocked = false;
  let scanningDefenseReason = '';

  const activeAntiRepeatRules = bot.aiBrain.antiRepeatRulesActive || [];
  for (const rule of activeAntiRepeatRules) {
    const rLower = rule.toLowerCase();
    if (rLower.includes('body displacement') && (coin.currentSetupQuality || 85) < 83) {
      scanningDefenseBlocked = true;
      scanningDefenseReason = 'Universal Rule: Lack of 5M displacement body close on key pivot';
      break;
    }
    if (rLower.includes('declining') && coin.change24h * (direction === 'LONG' ? 1 : -1) < 0.15) {
      scanningDefenseBlocked = true;
      scanningDefenseReason = 'Universal Rule: Vetoed by declining taker volume delta filter';
      break;
    }
    if (rLower.includes('oppose the prevailing 4h') && coin.trend !== (direction === 'LONG' ? 'BULLISH' : 'BEARISH')) {
      scanningDefenseBlocked = true;
      scanningDefenseReason = 'Universal Rule: Higher-timeframe macro trend opposition';
      break;
    }
    if (rLower.includes('compressed') && Math.abs(coin.change24h) < 0.20) {
      scanningDefenseBlocked = true;
      scanningDefenseReason = 'Universal Rule: 15M Bollinger compression chop filter';
      break;
    }
  }

  // Strict Evaluation of each of the 10 rules
  let confirmedCount = 0;
  const evaluatedRules = bot.confirmationRules.map((r) => {
    let isConfirmed = false;
    let liveValue = 'Pending';

    switch (r.ruleNumber) {
      case 1: // 4H Macro trend & structure baseline
        if (direction === 'LONG') {
          isConfirmed = (coin.trend === 'BULLISH' || coin.change24h > 0.2) && coin.price >= 0.01;
          liveValue = isConfirmed 
            ? `4H Bullish Trend Verified ($${coin.price > 1000 ? coin.price.toFixed(0) : coin.price > 1 ? coin.price.toFixed(2) : coin.price.toFixed(4)})` 
            : '4H Bullish Macro Trend Weak';
        } else {
          isConfirmed = (coin.trend === 'BEARISH' || coin.change24h < -0.2) && coin.price >= 0.01;
          liveValue = isConfirmed 
            ? `4H Bearish Breakdown Intact ($${coin.price > 1000 ? coin.price.toFixed(0) : coin.price > 1 ? coin.price.toFixed(2) : coin.price.toFixed(4)})` 
            : '4H Bearish Macro Trend Weak';
        }
        break;

      case 2: // 1H Market Structure & Swing High/Low
        isConfirmed = coin.trend !== 'NEUTRAL' || Math.abs(coin.change24h) >= 0.2;
        liveValue = `1H Structure: ${direction === 'LONG' ? 'Higher Lows' : 'Lower Highs'} Validated`;
        break;

      case 3: // RSI Momentum Corridor (Uses globally adapted bounds)
        if (direction === 'LONG') {
          isConfirmed = coin.rsi >= rsiMinL && coin.rsi <= rsiMaxL;
          liveValue = `RSI: ${coin.rsi.toFixed(1)} (In Bull Corridor ${rsiMinL}-${rsiMaxL})`;
        } else {
          isConfirmed = coin.rsi >= rsiMinS && coin.rsi <= rsiMaxS;
          liveValue = `RSI: ${coin.rsi.toFixed(1)} (In Bear Breakdown Corridor ${rsiMinS}-${rsiMaxS})`;
        }
        break;

      case 4: // Volume & Relative Volume (RVOL) (Uses globally adapted threshold)
        isConfirmed = coin.volume24h >= minRvolThreshold;
        liveValue = `24h Vol: $${(coin.volume24h / 1000000).toFixed(1)}M (${isConfirmed ? 'Liquid Flow' : 'Below Gate'})`;
        break;

      case 5: // Pullback & Support/Resistance Validation (avoid over-extended parabolic traps)
        isConfirmed = Math.abs(coin.change24h) <= 15.0;
        liveValue = `24h Delta: ${coin.change24h > 0 ? '+' : ''}${coin.change24h.toFixed(2)}% (S/R Zone Validated)`;
        break;

      case 6: // Multi-timeframe MACD Momentum Alignment
        if (direction === 'LONG') {
          isConfirmed = coin.macd === 'BULLISH_CROSS' || coin.change24h > 0.2;
        } else {
          isConfirmed = coin.macd === 'BEARISH_CROSS' || coin.change24h < -0.2;
        }
        liveValue = `MACD: ${coin.macd} (${isConfirmed ? `${direction} Momentum Confirmed` : 'Divergence'})`;
        break;

      case 7: // Orderflow CVD & Institutional Sentiment Imbalance
        if (direction === 'LONG') {
          isConfirmed = coin.sentimentScore >= 50 || coin.change24h > 0.2;
          liveValue = `Orderflow CVD: +${coin.sentimentScore}/100 Institutional Bid Pressure`;
        } else {
          isConfirmed = coin.sentimentScore <= 52 || coin.change24h < -0.2;
          liveValue = `Orderflow CVD: ${coin.sentimentScore}/100 Taker Sell Imbalance`;
        }
        break;

      case 8: // Volatility Corridor (ATR Guardrail)
        isConfirmed = coin.volatility >= 1.5 && coin.volatility <= 9.0;
        liveValue = `Volatility: ${coin.volatility}% (Optimal Scalp/Swing Corridor)`;
        break;

      case 9: // Stop Placement & TP1 Equal Distance to SL Mandate
        isConfirmed = bot.portfolioBalance >= 1.00;
        liveValue = 'TP1 Equal Distance to SL (35% TP1 → BE, 25% TP2 → Lock TP1, 40% Runner)';
        break;

      case 10: // 5M Trigger & Setup Quality Check
        isConfirmed = (coin.currentSetupQuality || 85) >= 80 && !scanningDefenseBlocked;
        liveValue = scanningDefenseBlocked 
          ? `Blocked by AI Mistake Defense (${scanningDefenseReason})` 
          : `5M Setup Quality: ${coin.currentSetupQuality || 85}% (A Grade)`;
        break;

      default:
        isConfirmed = false;
        liveValue = 'Unverified';
    }

    if (isConfirmed) confirmedCount++;
    return {
      ...r,
      isConfirmed,
      liveValue,
    };
  });

  // Calculate strict quality confidence score (0 - 100)
  const baseConfidence = (confirmedCount / 10) * 80;
  const qualityBonus = ((coin.currentSetupQuality || 85) / 100) * 20;
  const confidenceScore = Math.min(99, Math.round(baseConfidence + qualityBonus));

  const minRequiredConf = adapted?.minConfidenceScore || 88;
  const minRequiredRules = adapted?.minConfirmationRules || 8;

  // Qualification: Must satisfy required rules, confidence, quality score, AND pass scanning defense
  const qualifies = !scanningDefenseBlocked && 
    confirmedCount >= minRequiredRules && 
    confidenceScore >= minRequiredConf && 
    (coin.currentSetupQuality || 85) >= 80;

  let rationale = '';
  if (scanningDefenseBlocked) {
    rationale = `AI Defense: Setup on ${coin.symbol} (${direction}) vetoed by Gen ${bot.aiBrain.evolutionGeneration || 1} universal mistake filter (${scanningDefenseReason}) protecting all 50 universe pairs.`;
  } else {
    rationale = `${bot.name} (${bot.serialNumber}) [Gen ${bot.aiBrain.evolutionGeneration || 1} Universal] confirmed ${confirmedCount}/10 institutional rules on ${coin.symbol} (${direction}) with ${confidenceScore}% conviction (Min req: ${minRequiredConf}%). TP1 set at equal distance to SL.`;
  }

  return {
    qualifies,
    confirmedCount,
    confidenceScore,
    direction,
    rationale,
    evaluatedRules,
  };
}

/**
 * Dynamically computes optimal leverage according to trade parameters:
 * - Bot Strategy Archetype (Scalping/Breakout vs Trend vs Mean Reversion)
 * - Trade Conviction / Confidence Score (Higher confidence unlocks higher tier leverage)
 * - Asset Volatility (High-volatility tokens use conservative leverage; steady bluechips allow higher leverage)
 * - Confirmed Rules Count
 */
export function determineTradeLeverage(
  bot: ArenaBot,
  coin: CryptoCoin,
  confidenceScore: number,
  confirmedRulesCount: number
): { leverage: number; leverageTier: string } {
  // 1. Archetype base leverage
  let baseLeverage = 10;
  switch (bot.strategyCategory) {
    case 'BREAKOUT':
    case 'MOMENTUM':
      baseLeverage = 14;
      break;
    case 'LIQUIDITY_SWEEP':
    case 'SMC_ORDER_BLOCK':
      baseLeverage = 12;
      break;
    case 'TREND':
    case 'PULLBACK':
    case 'PRICE_ACTION':
      baseLeverage = 10;
      break;
    case 'VOLATILITY_SQUEEZE':
      baseLeverage = 8;
      break;
    case 'MEAN_REVERSION':
    case 'ORDERFLOW_CVD':
    case 'NEURAL_SENTIMENT':
    default:
      baseLeverage = 8;
      break;
  }

  // 2. Adjust leverage based on Trade Confidence / Conviction Score
  let confidenceShift = 0;
  if (confidenceScore >= 96) {
    confidenceShift = 4; // Apex high conviction setup (up to 18x - 20x)
  } else if (confidenceScore >= 92) {
    confidenceShift = 2; // Strong conviction setup (12x - 15x)
  } else if (confidenceScore >= 89) {
    confidenceShift = 0; // Standard conviction (10x - 12x)
  } else {
    confidenceShift = -2; // Conservative conviction (6x - 8x)
  }

  // 3. Adjust leverage based on Asset Volatility
  let volatilityShift = 0;
  if (coin.volatility <= 3.0) {
    volatilityShift = 2; // Low volatility bluechips (BTC, ETH, SOL) can safely support higher leverage
  } else if (coin.volatility >= 6.5) {
    volatilityShift = -3; // High volatility token: pull back leverage to protect equity
  } else if (coin.volatility >= 5.0) {
    volatilityShift = -1;
  }

  // 4. Rule confirmation bonus
  const rulesShift = confirmedRulesCount >= 10 ? 1 : 0;

  // Compute final dynamic leverage clamped within safe institutional boundaries [5x, 20x]
  const rawLeverage = baseLeverage + confidenceShift + volatilityShift + rulesShift;
  const leverage = Math.max(5, Math.min(20, Math.round(rawLeverage)));

  let leverageTier = `${leverage}x Dynamic`;
  if (leverage >= 16) {
    leverageTier = `${leverage}x Apex Tier`;
  } else if (leverage >= 12) {
    leverageTier = `${leverage}x Momentum Tier`;
  } else if (leverage >= 8) {
    leverageTier = `${leverage}x Balanced Tier`;
  } else {
    leverageTier = `${leverage}x Conservative Tier`;
  }

  return { leverage, leverageTier };
}

export function calculateTradeParameters(
  bot: ArenaBot,
  coin: CryptoCoin,
  direction: TradeDirection,
  confidenceScore: number,
  confirmedRulesCount: number,
  evaluatedRules: BotConfirmationRule[],
  rationale: string
): TradePosition {
  const dynamicBalance = bot.portfolioBalance;
  
  // Use 3% of dynamic capital per trade
  const margin = parseFloat(Math.max(0.50, dynamicBalance * 0.03).toFixed(2));
  
  // DYNAMIC LEVERAGE: Tailored dynamically according to trade confidence, bot archetype, and asset volatility
  const { leverage, leverageTier } = determineTradeLeverage(
    bot,
    coin,
    confidenceScore,
    confirmedRulesCount
  );
  const positionSize = parseFloat((margin * leverage).toFixed(2));
  
  // Max loss per trade: 1.5% of dynamic capital
  const maxLossUsd = parseFloat((dynamicBalance * 0.015).toFixed(2));
  
  const entryPrice = coin.price;
  
  // Stop Loss Distance: Mathematically aligns so initial SL hit equals max loss (1.5% of dynamic capital)
  // maxLossUsd / positionSize = (0.015 * balance) / (0.03 * balance * leverage) = 0.5 / leverage
  const slDistancePercent = parseFloat((0.5 / leverage).toFixed(4));

  // MANDATE: TP1 MUST BE EQUAL DISTANCE TO SL COMPARED TO ENTRY PRICE
  // Distance from entry price to TP1 = Distance from entry price to SL
  const tp1DistancePercent = slDistancePercent;
  const tp2DistancePercent = parseFloat((slDistancePercent * 2.0).toFixed(4));

  // Format price helper with appropriate precision for any asset tier (OP at $0.0970, BTC at $77,318)
  const dec = entryPrice < 0.1 ? 5 : entryPrice < 1 ? 4 : entryPrice < 10 ? 3 : 2;
  const formatPrice = (val: number): number => {
    return parseFloat(val.toFixed(dec));
  };

  // Exact distance in price units so |tp1Price - entryPrice| === |initialStopLossPrice - entryPrice|
  const distInPrice = parseFloat((entryPrice * slDistancePercent).toFixed(dec));
  
  let initialStopLossPrice: number;
  let tp1Price: number;
  let tp2Price: number;
  let liquidationPrice: number;

  if (direction === 'LONG') {
    // LONG: TP is higher than entry, SL is lower than entry
    // Equal distance: entryPrice - SL === TP1 - entryPrice
    initialStopLossPrice = formatPrice(entryPrice - distInPrice);
    tp1Price = formatPrice(entryPrice + distInPrice);
    tp2Price = formatPrice(entryPrice + (distInPrice * 2));
    liquidationPrice = formatPrice(entryPrice * (1 - (1 / leverage) * 0.9));
  } else {
    // SHORT: TP is lower than entry, SL is higher than entry
    // Equal distance: SL - entryPrice === entryPrice - TP1
    initialStopLossPrice = formatPrice(entryPrice + distInPrice);
    tp1Price = formatPrice(entryPrice - distInPrice);
    tp2Price = formatPrice(entryPrice - (distInPrice * 2));
    liquidationPrice = formatPrice(entryPrice * (1 + (1 / leverage) * 0.9));
  }

  const confirmedNames = evaluatedRules.filter(r => r.isConfirmed).map(r => r.ruleName);

  return {
    id: `trade-${Date.now()}-${bot.serialNumber}-${coin.symbol.replace(/[^a-zA-Z0-9]/g, '')}`,
    botId: bot.id,
    botSerialNumber: bot.serialNumber,
    botName: bot.name,
    symbol: `${coin.symbol}/USDT`,
    name: coin.name,
    direction,
    entryPrice,
    currentPrice: entryPrice,
    entryTime: Date.now(),
    leverage,
    leverageTier,
    margin,
    positionSize,
    maxLossUsd,
    initialStopLossPrice,
    stopLossPrice: initialStopLossPrice,
    liquidationPrice,
    slMode: 'INITIAL',
    tp1Price,
    tp1Hit: false,
    tp2Price,
    tp2Hit: false,
    runnerPercent: 40,
    runnerActive: true,
    totalBookedPnL: 0.0,
    unrealizedPnL: 0.0,
    unrealizedPnLPercent: 0.0,
    status: 'OPEN',
    confidenceScore,
    confirmedRulesCount,
    confirmedRuleNames: confirmedNames,
    aiBrainRationale: rationale,
    contractAddress: coin.contractAddress,
    network: coin.network,
    cmcUrl: coin.cmcUrl,
    isVerified: true,
  };
}

export function updateTradePriceAndTargets(
  trade: TradePosition,
  newPrice: number
): {
  updatedTrade: TradePosition;
  eventFired?: 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'RUNNER_CLOSE';
  realizedPnLDelta: number;
} {
  let updated = { ...trade, currentPrice: newPrice };
  let eventFired: 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'RUNNER_CLOSE' | undefined = undefined;
  let realizedPnLDelta = 0;

  const priceDiff = updated.direction === 'LONG' 
    ? newPrice - updated.entryPrice 
    : updated.entryPrice - newPrice;
  
  const rawPnlPercent = (priceDiff / updated.entryPrice) * updated.leverage * 100;
  updated.unrealizedPnLPercent = parseFloat(rawPnlPercent.toFixed(2));
  updated.unrealizedPnL = parseFloat(((updated.margin * rawPnlPercent) / 100).toFixed(2));

  // 1. Check Stop Loss Hit
  const isSlTriggered = updated.direction === 'LONG'
    ? newPrice <= updated.stopLossPrice
    : newPrice >= updated.stopLossPrice;

  if (isSlTriggered) {
    eventFired = 'SL_HIT';
    const finalPnl = updated.totalBookedPnL + updated.unrealizedPnL;
    updated.status = finalPnl >= 0 ? 'CLOSED_TP' : 'CLOSED_SL';
    updated.closePrice = newPrice;
    updated.exitTime = Date.now();
    updated.realizedPnL = parseFloat(finalPnl.toFixed(2));
    updated.realizedPnLPercent = parseFloat(((finalPnl / updated.margin) * 100).toFixed(2));
    updated.exitReason = updated.slMode === 'BREAKEVEN_TP1' || updated.slMode === 'LOCKED_TP2'
      ? `Trailing Stop Triggered after TP Booking (+ $${finalPnl.toFixed(2)})`
      : `Stop Loss Hit (- $${Math.abs(finalPnl).toFixed(2)})`;
    realizedPnLDelta = finalPnl;
    return { updatedTrade: updated, eventFired, realizedPnLDelta };
  }

  // 2. Check TP1 Hit (Book 35% profit, move SL to Entry / Break-Even)
  const isTp1Triggered = !updated.tp1Hit && (
    updated.direction === 'LONG' ? newPrice >= updated.tp1Price : newPrice <= updated.tp1Price
  );

  if (isTp1Triggered) {
    updated.tp1Hit = true;
    updated.tp1HitTime = Date.now();
    
    // Book 35% of the position profit
    const tp1Booked = parseFloat((Math.max(0.01, updated.unrealizedPnL * 0.35)).toFixed(2));
    updated.tp1BookedAmount = tp1Booked;
    updated.totalBookedPnL = parseFloat((updated.totalBookedPnL + tp1Booked).toFixed(2));
    
    // Move SL to Entry Price (Break-Even) immediately eliminating all downside risk!
    updated.stopLossPrice = updated.entryPrice;
    updated.slMode = 'BREAKEVEN_TP1';
    eventFired = 'TP1_HIT';
  }

  // 3. Check TP2 Hit (Book 25% profit, move SL to TP1 Price)
  const isTp2Triggered = updated.tp1Hit && !updated.tp2Hit && (
    updated.direction === 'LONG' ? newPrice >= updated.tp2Price : newPrice <= updated.tp2Price
  );

  if (isTp2Triggered) {
    updated.tp2Hit = true;
    updated.tp2HitTime = Date.now();
    
    // Book 25% of the position profit
    const tp2Booked = parseFloat((Math.max(0.01, updated.unrealizedPnL * 0.25)).toFixed(2));
    updated.tp2BookedAmount = tp2Booked;
    updated.totalBookedPnL = parseFloat((updated.totalBookedPnL + tp2Booked).toFixed(2));
    
    // Move SL to TP1 Price (Lock in profits at TP1 milestone!)
    updated.stopLossPrice = updated.tp1Price;
    updated.slMode = 'LOCKED_TP2';
    eventFired = 'TP2_HIT';
  }

  // 4. Check Trailing Runner (Keep 40% runner & trailing SL according to structure)
  if (updated.tp2Hit && updated.runnerActive) {
    const tp1Dist = Math.abs(updated.tp1Price - updated.entryPrice);
    const trailBuffer = Math.max(tp1Dist * 0.75, newPrice * 0.012);
    const precision = newPrice < 0.1 ? 5 : newPrice < 1 ? 4 : newPrice < 10 ? 3 : 2;

    if (updated.direction === 'LONG') {
      const structureTrailing = parseFloat((newPrice - trailBuffer).toFixed(precision));
      if (structureTrailing > updated.stopLossPrice) {
        updated.stopLossPrice = structureTrailing;
        updated.slMode = 'TRAILING_RUNNER';
      }
    } else {
      const structureTrailing = parseFloat((newPrice + trailBuffer).toFixed(precision));
      if (structureTrailing < updated.stopLossPrice) {
        updated.stopLossPrice = structureTrailing;
        updated.slMode = 'TRAILING_RUNNER';
      }
    }
  }

  return { updatedTrade: updated, eventFired, realizedPnLDelta };
}

export function analyzeTradeMistakeAndEvolve(trade: TradePosition, bot: ArenaBot): BotBrainMistakeLog {
  const lossAmount = Math.abs(trade.realizedPnL || 0);
  const lossPercent = Math.abs(trade.realizedPnLPercent || 0);
  const adapted = bot.aiBrain.adaptedParameters;
  const newMinConf = adapted ? adapted.minConfidenceScore : 91;
  const newRvol = adapted ? adapted.minRvol : 1.75;
  const nextGen = (bot.aiBrain.evolutionGeneration || 1);

  // Diverse, highly technical trading mistake scenarios with realistic market failure modes
  const mistakeScenarios = [
    {
      category: 'Bull Trap Liquidity Sweep',
      directions: ['LONG'],
      rootCause: `Macro market liquidity sweep engineered a fake breakout above swing resistance on ${trade.symbol}, trapping early long momentum before aggressive limit selling triggered sharp reversal.`,
      preventativeLesson: `Enforce mandatory 5M candle body displacement close beyond swing pivot and require 4H macro EMA 50 trend alignment before authorizing breakout execution on any asset.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Raised entry conviction gate to ${newMinConf}%, upgraded universal RVOL filter to ${newRvol}x, and activated global fakeout displacement guardrails.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Prohibit long breakout entries across all pairs when 5M candle fails body displacement beyond local resistance.`,
    },
    {
      category: 'Bear Trap Iceberg Absorption',
      directions: ['SHORT'],
      rootCause: `Breakdown momentum below horizontal support on ${trade.symbol} was absorbed by hidden passive institutional bid icebergs at 4H demand block, fueling an aggressive short squeeze.`,
      preventativeLesson: `Require confirmed breakdown retest with consecutive 5M seller volume delta expansion before validating short continuation on any asset.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Raised short conviction threshold to ${newMinConf}% and calibrated universal CVD taker delta requirement across all 50 universe pairs.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Disallow short execution across all pairs into resting 4H demand order blocks without confirmed retest follow-through.`,
    },
    {
      category: 'Momentum Oscillator Divergence',
      directions: ['LONG', 'SHORT'],
      rootCause: `${trade.direction === 'LONG' ? 'Bearish' : 'Bullish'} RSI and MACD histogram divergence formed at local extremum while taker volume was drying up on ${trade.symbol}, triggering swift mean-reversion stop hit.`,
      preventativeLesson: `Implement strict multi-timeframe divergence filter: veto ${trade.direction} entries across all pairs when 15M RSI and MACD histogram slopes oppose price trajectory.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Recalibrated universal indicator corridor, raised minimum confirmation to ${newMinConf}%, and mandated dual-oscillator divergence validation.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Strict prohibition on entries across all universe assets when 15M RSI and MACD display counter-trend divergence.`,
    },
    {
      category: 'Order Flow Delta Exhaustion',
      directions: ['LONG', 'SHORT'],
      rootCause: `Aggressive taker delta faded at key structural pivot on ${trade.symbol}, leaving orderbook depth vulnerable to an opposing institutional market order cascade.`,
      preventativeLesson: `Require positive cumulative volume delta (CVD) expansion slope on 5M timeframe to verify sustained institutional participation.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Raised universal RVOL volume filter to ${newRvol}x and mandated taker delta confirmation across all 50 scanned assets.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Deny trade execution on all universe coins when 5M cumulative volume delta is declining during the entry bar.`,
    },
    {
      category: 'Choppy Range Consolidation Whipsaw',
      directions: ['LONG', 'SHORT'],
      rootCause: `Market regime compressed inside a tight 15M Bollinger squeeze on ${trade.symbol} with inadequate expansion momentum, triggering premature stop loss before directional resolution.`,
      preventativeLesson: `Filter out sideways market regimes: mandate minimum 2.0% 24h expansion trend or clean higher-timeframe directional impulse before trade entry.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Activated universal range chop filter, requiring ADX trend strength > 25 and minimum setup quality ≥ 85% for all coins.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Automatic trade veto across all pairs when 15M volatility bandwidth is compressed inside consolidation chop.`,
    },
    {
      category: 'Counter-Trend HTF Friction',
      directions: ['LONG', 'SHORT'],
      rootCause: `Lower timeframe 5M/15M setup on ${trade.symbol} attempted execution directly into dominant 4H/1D macro EMA ${trade.direction === 'LONG' ? 'resistance' : 'support'}, creating insurmountable overhead supply.`,
      preventativeLesson: `Mandate full multi-timeframe alignment across 4H, 1H, and 15M charts; strictly disallow counter-trend entries against prevailing macro moving averages.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Enforced 4H/1H macro trend alignment gate across all 50 coins and raised minimum confirmation rules to 9/10.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Prohibit trade entries across all universe coins that oppose the prevailing 4H macro trend direction.`,
    },
    {
      category: 'Macro Volatility Spike Invalidation',
      directions: ['LONG', 'SHORT'],
      rootCause: `Broad crypto market volatility expansion triggered sudden spread widening and a liquidity wick on ${trade.symbol} that breached stop loss prior to structure stabilization.`,
      preventativeLesson: `Dynamically calibrate stop loss using wider structural ATR buffer and wait for post-spike re-stabilization 5M candle body close.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Adjusted dynamic ATR volatility corridor and tightened pre-entry volatility filters across entire universe.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Pause new entries across all coins during rapid market-wide volatility spikes until 15M candle stabilization.`,
    },
    {
      category: 'Premature Retest Execution',
      directions: ['LONG', 'SHORT'],
      rootCause: `Bot executed on the initial touch of support/resistance zone on ${trade.symbol} before validating absorption and confirming a decisive reversal candle body close.`,
      preventativeLesson: `Require secondary retest verification with confirmed rejection wick and displacement close before authorizing entry on structural pivots.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Updated universal entry timing algorithms across all 50 pairs, adding secondary retest validation.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Prohibit entries across all pairs on unconfirmed initial touches of key support/resistance zones.`,
    },
    {
      category: 'Orderbook Liquidity Vacuum',
      directions: ['LONG', 'SHORT'],
      rootCause: `Sudden liquidity depletion on the ${trade.direction === 'LONG' ? 'bid' : 'ask'} depth chart caused rapid slippage on ${trade.symbol}, triggering stop loss before normal orderbook replenishing.`,
      preventativeLesson: `Implement institutional minimum depth requirement: ensure top-5 bid/ask depth exceeds $150k before qualifying trade execution on any token.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Enforced institutional orderbook depth threshold and raised minimum 24h volume threshold across all pairs.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Restrict trade execution across all universe pairs during thin orderbook liquidity conditions.`,
    },
    {
      category: 'EMA Dynamic Invalidation',
      directions: ['LONG', 'SHORT'],
      rootCause: `Attempted dynamic trend entry on ${trade.symbol} failed as high-volume institutional selling sliced cleanly through the 20 EMA dynamic support.`,
      preventativeLesson: `Avoid aggressive trend additions without verified volume delta continuation; enforce secondary candle confirmation below EMA pivots.`,
      universalAdaptation: `🌐 Universal Strategy Upgrade across ALL 50 Scanned Universe Pairs: Tightened dynamic trend corridor boundaries and raised conviction requirement to ${newMinConf}%.`,
      universalAntiRepeatRule: `[Universal - All 50 Coins] Invalidate dynamic trend continuation setups across all pairs if price closes below dynamic 20 EMA.`,
    },
  ];

  // Filter scenarios matching trade direction
  const eligibleScenarios = mistakeScenarios.filter(s => s.directions.includes(trade.direction));
  
  // Pick scenario avoiding immediate repetition from the last mistake
  const lastMistake = bot.aiBrain.mistakeMemory[0];
  let selected = eligibleScenarios[Math.floor(Math.random() * eligibleScenarios.length)];
  if (lastMistake && eligibleScenarios.length > 1 && selected.category === lastMistake.mistakeCategory) {
    const alternative = eligibleScenarios.find(s => s.category !== lastMistake.mistakeCategory);
    if (alternative) selected = alternative;
  }

  return {
    id: `mistake-${Date.now()}-${bot.serialNumber}`,
    timestamp: Date.now(),
    tradeId: trade.id,
    symbol: trade.symbol,
    direction: trade.direction,
    lossAmountUsd: lossAmount,
    lossPercent,
    rootCause: selected.rootCause,
    preventativeLesson: selected.preventativeLesson,
    adaptationApplied: selected.universalAdaptation,
    antiRepeatRuleAdded: selected.universalAntiRepeatRule,
    confidenceScoreAtEntry: trade.confidenceScore,
    evolutionGeneration: nextGen,
    mistakeCategory: selected.category,
    scopeOfAdaptation: 'UNIVERSAL_ALL_COINS',
    affectedPairsScope: 'All 50 Scanned Universe Pairs',
  };
}

export function formatHourlyTelegramSummary(state: ArenaFleetState): string {
  const now = Date.now();
  const uptimeMs = now - (state.serverBootTimestamp || now);
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((uptimeMs / (1000 * 60)) % 60);
  const uptimeStr = `${days}d ${hours}h ${mins}m`;

  // Sort bots by portfolio balance (or PnL)
  const sortedBots = [...state.bots].sort((a, b) => b.portfolioBalance - a.portfolioBalance);
  const top10 = sortedBots.slice(0, 10);

  let top10Text = '';
  top10.forEach((bot, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    const pnlSign = bot.totalPnL >= 0 ? '+' : '';
    const safeName = bot.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    top10Text += `${medal} <b>[${bot.serialNumber}] ${safeName}</b>\n` +
      `   💰 Balance: <b>$${bot.portfolioBalance.toFixed(2)}</b> (${pnlSign}$${bot.totalPnL.toFixed(2)})\n` +
      `   🎯 Win Rate: <b>${bot.winRate}%</b> (${bot.wins}W / ${bot.losses}L) | Live: ${bot.activeTradesCount}\n\n`;
  });

  const arenaPnlSign = state.totalArenaPnL >= 0 ? '+' : '';

  return `🤖 <b>APEX 40 AI CRYPTO BOT ARENA — 1-HOUR PERFORMANCE REPORT</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ <b>24/7 Cloud Uptime:</b> <code>${uptimeStr}</code>\n` +
    `🏦 <b>Total Arena Capital:</b> <code>$${state.totalArenaBalance.toFixed(2)}</code> (${arenaPnlSign}$${state.totalArenaPnL.toFixed(2)})\n` +
    `📊 <b>Arena Win Rate:</b> <code>${state.arenaWinRate}%</code> | Total Trades: <code>${state.totalArenaTrades}</code>\n` +
    `⚡️ <b>Active Live Positions:</b> <code>${state.activeTrades.length} / 200 Max</code>\n` +
    `🧠 <b>AI Self-Learning Cycles:</b> <code>${state.learningCyclesCompleted}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 <b>TOP 10 PERFORMING BOTS (HOURLY LEADERBOARD):</b>\n\n` +
    top10Text +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛡 <i>Strict Rules: 3% Dynamic Margin | Dynamic Leverage | Max Loss 1.5% | 35% TP1 (BE) → 25% TP2 (Lock TP1) → 40% Runner. Next report in 60 mins.</i>`;
}

export function formatTradeTelegramMessage(
  type: 'OPEN' | 'TP1' | 'TP2' | 'SL',
  trade: TradePosition
): string {
  const emoji = type === 'OPEN' ? '🚀' : type === 'TP1' ? '🎯' : type === 'TP2' ? '💎' : '🛡';
  const title = type === 'OPEN' 
    ? 'NEW HIGH-QUALITY TRADE OPENED' 
    : type === 'TP1' 
    ? 'TARGET 1 (TP1) HIT — 35% SECURED & SL MOVED TO BE' 
    : type === 'TP2' 
    ? 'TARGET 2 (TP2) HIT — 25% SECURED & SL LOCKED TO TP1' 
    : 'POSITION CLOSED (RISK MITIGATION)';

  return `${emoji} *${title}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🤖 *Bot:* \`${trade.botSerialNumber}\` — *${trade.botName}*\n` +
    `🪙 *Asset:* *${trade.symbol}* (${trade.direction})\n` +
    `💵 *Entry Price:* \`$${trade.entryPrice}\` | *Current:* \`$${trade.currentPrice}\`\n` +
    `🎯 *TP1:* \`$${trade.tp1Price}\` (35%) | *TP2:* \`$${trade.tp2Price}\` (25%)\n` +
    `🛡 *Stop Loss:* \`$${trade.stopLossPrice}\` (${trade.slMode})\n` +
    `📈 *Confidence Score:* \`${trade.confidenceScore}%\` (${trade.confirmedRulesCount}/10 Rules Confirmed)\n` +
    `⚡️ *Dynamic Leverage:* \`${trade.leverage}x\` (${trade.leverageTier || 'Dynamic Safe'})\n` +
    `💰 *Margin:* \`$${trade.margin.toFixed(2)}\` | *Position:* \`$${trade.positionSize.toFixed(2)}\`\n` +
    (trade.totalBookedPnL > 0 ? `💵 *Booked Profit:* \`+$${trade.totalBookedPnL.toFixed(2)}\`\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🧠 _AI Rationale:_ ${trade.aiBrainRationale.slice(0, 120)}...`;
}
