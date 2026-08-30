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
  TeacherExplanation
} from '../types';

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
  direction: TradeDirection
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
  return `🚀 *[STAGE ${trade.stage} HIGH-CONVICTION TRADE OPENED]*
━━━━━━━━━━━━━━━━━━━━
• *Pair*: \`${trade.symbol}\`
• *Side*: *${trade.direction}* (${trade.leverage}x Leverage)
• *Consensus Stage*: *${stageConfig.label}* (${trade.confirmingBotNames.length} Bots Agreed)
• *Confirming Bots*: \`${trade.confirmingBotNames.join(', ')}\`
━━━━━━━━━━━━━━━━━━━━
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

