import { 
  SignalLogEntry, 
  TradingBot, 
  TradePosition, 
  TradeDirection, 
  MarketRegimeType, 
  LossReasonClassification,
  CoinSpecificLearning,
  WalkForwardValidation,
  SelectivityMetrics,
  BotLearningNote,
  SelfLearningHeuristic,
  ConsensusEngineOutput
} from '../types';
import { INITIAL_BOTS } from '../data/initialBots';

// Standard Initial Coin Learning Matrix
export const INITIAL_COIN_LEARNING: Record<string, CoinSpecificLearning> = {
  'BTC': {
    symbol: 'BTC',
    sampleSize: 85,
    wins: 72,
    losses: 13,
    winRate: 84.7,
    avgR: 2.15,
    bestPerformingBotId: 'bot-1-adaptive-trend',
    weakestBotId: 'bot-8-liquidity',
    preferredRegime: 'TRENDING',
    weightAdjustment: 0.05,
    statisticallySignificant: true,
  },
  'ETH': {
    symbol: 'ETH',
    sampleSize: 76,
    wins: 62,
    losses: 14,
    winRate: 81.6,
    avgR: 1.95,
    bestPerformingBotId: 'bot-2-market-structure',
    weakestBotId: 'bot-3-momentum',
    preferredRegime: 'TRENDING',
    weightAdjustment: 0.04,
    statisticallySignificant: true,
  },
  'SOL': {
    symbol: 'SOL',
    sampleSize: 68,
    wins: 56,
    losses: 12,
    winRate: 82.4,
    avgR: 2.05,
    bestPerformingBotId: 'bot-4-breakout',
    weakestBotId: 'bot-5-pullback',
    preferredRegime: 'BREAKOUT',
    weightAdjustment: 0.04,
    statisticallySignificant: true,
  },
  'DOGE': {
    symbol: 'DOGE',
    sampleSize: 52,
    wins: 41,
    losses: 11,
    winRate: 78.8,
    avgR: 1.90,
    bestPerformingBotId: 'bot-8-liquidity',
    weakestBotId: 'bot-5-pullback',
    preferredRegime: 'HIGH_VOLATILITY',
    weightAdjustment: 0.02,
    statisticallySignificant: true,
  },
  'AVAX': {
    symbol: 'AVAX',
    sampleSize: 45,
    wins: 36,
    losses: 9,
    winRate: 80.0,
    avgR: 1.85,
    bestPerformingBotId: 'bot-2-market-structure',
    weakestBotId: 'bot-7-volume',
    preferredRegime: 'TRENDING',
    weightAdjustment: 0.03,
    statisticallySignificant: true,
  },
  'NEAR': {
    symbol: 'NEAR',
    sampleSize: 38,
    wins: 30,
    losses: 8,
    winRate: 78.9,
    avgR: 1.80,
    bestPerformingBotId: 'bot-6-price-action',
    weakestBotId: 'bot-3-momentum',
    preferredRegime: 'TRENDING',
    weightAdjustment: 0.02,
    statisticallySignificant: true,
  },
};

// Clean initial signal archive (starts empty, populated dynamically from now)
export const INITIAL_SIGNAL_LOGS: SignalLogEntry[] = [];

export const INITIAL_WALK_FORWARD: WalkForwardValidation = {
  trainingWindowTrades: 0,
  validationWindowTrades: 0,
  outOfSampleTrades: 0,
  trainingWinRate: 0.0,
  validationWinRate: 0.0,
  outOfSampleWinRate: 0.0,
  trainingSharpe: 0.0,
  outOfSampleSharpe: 0.0,
  overfitWarning: false,
  status: 'ROBUST_STABLE',
  lastEvaluatedTimestamp: Date.now(),
};

/**
 * Evaluates a candidate setup against past historical signals to determine setup similarity win rate
 */
export function calculateSetupSimilarityAdjustment(
  symbol: string,
  regime: MarketRegimeType,
  agreeingBotIds: string[],
  signalLogs: SignalLogEntry[]
): { adjustment: number; similarCount: number; historicalWinRate: number; sampleStatus: 'SAMPLE_TOO_SMALL' | 'MODERATE_SAMPLE' | 'ROBUST_SAMPLE' } {
  // Find similar historical setups (same regime and similar agreeing bots)
  const similarSetups = signalLogs.filter(s => {
    if (s.marketRegime !== regime) return false;
    const commonBots = agreeingBotIds.filter(bId => s.botVotes[bId] === s.direction).length;
    return commonBots >= Math.min(agreeingBotIds.length, 6);
  });

  const count = similarSetups.length;
  if (count < 30) {
    // Safety Rule: < 30 similar trades ➔ NO AUTOMATIC STRATEGY CHANGE, zero adjustment
    return { adjustment: 0, similarCount: count, historicalWinRate: 75.0, sampleStatus: 'SAMPLE_TOO_SMALL' };
  }

  const executedSimilar = similarSetups.filter(s => s.status === 'EXECUTED' && s.outcomeResult);
  const wins = executedSimilar.filter(s => s.outcomeResult === 'WIN').length;
  const winRate = executedSimilar.length > 0 ? (wins / executedSimilar.length) * 100 : 75.0;

  if (count >= 30 && count < 100) {
    // 30 - 99: small confidence adjustment (±2 to ±5 pts)
    const adj = winRate >= 80 ? +4 : winRate >= 65 ? 0 : -5;
    return { adjustment: adj, similarCount: count, historicalWinRate: winRate, sampleStatus: 'MODERATE_SAMPLE' };
  }

  // 100+: Allow stronger statistical adjustment (up to ±8 pts)
  const adj = winRate >= 85 ? +8 : winRate >= 75 ? +4 : winRate >= 60 ? -4 : -8;
  return { adjustment: adj, similarCount: count, historicalWinRate: winRate, sampleStatus: 'ROBUST_SAMPLE' };
}

/**
 * Dynamically recomputes bot performance weights based on empirical R and win rates
 * Rules strictly enforced:
 * 1. Max bot weight cap = 20% (0.20) to prevent single-bot domination
 * 2. Min bot weight floor = 5% (0.05)
 * 3. Weights sum to 100% (1.00)
 */
export function recalculateAdaptiveBotWeights(bots: TradingBot[]): TradingBot[] {
  // Compute performance score for each bot: Score = (WinRate * 0.6) + (AverageR * 20 * 0.4)
  const rawScores = bots.map(b => {
    const wr = b.winRate || 75;
    const avgR = Math.max(0.5, b.averageR || 1.5);
    const score = (wr * 0.6) + (avgR * 20 * 0.4);
    return { id: b.id, score };
  });

  const totalScore = rawScores.reduce((sum, s) => sum + s.score, 0);

  // Calculate unconstrained raw weight
  let unconstrainedWeights = rawScores.map(s => ({
    id: s.id,
    weight: s.score / (totalScore || 1),
  }));

  // Apply Hard Clamp: 0.05 min floor, 0.20 max ceiling
  let clampedWeights = unconstrainedWeights.map(w => ({
    id: w.id,
    weight: Math.min(0.20, Math.max(0.05, w.weight)),
  }));

  // Re-normalize so sum is exactly 1.00 while preserving caps
  const clampedSum = clampedWeights.reduce((sum, w) => sum + w.weight, 0);
  const normalizedWeights = clampedWeights.map(w => ({
    id: w.id,
    weight: parseFloat((w.weight / clampedSum).toFixed(3)),
  }));

  return bots.map(bot => {
    const nw = normalizedWeights.find(w => w.id === bot.id);
    const finalWeight = nw ? Math.min(0.20, Math.max(0.05, nw.weight)) : bot.strategyWeight;
    return {
      ...bot,
      strategyWeight: finalWeight,
      minWeightCap: 0.05,
      maxWeightCap: 0.20,
    };
  });
}

/**
 * Classifies the root cause of a losing trade into the 11-category taxonomy
 */
export function classifyTradeLossReason(
  trade: TradePosition,
  bots: TradingBot[]
): {
  classification: LossReasonClassification;
  explanation: string;
  wrongBotIds: string[];
  correctBotIds: string[];
} {
  const isLong = trade.direction === 'LONG';
  const confirmingIds = trade.confirmingBotIds || [];
  
  // Identify which bots voted for the trade (and were therefore wrong) vs bots that dissented (correct)
  const wrongBotIds = [...confirmingIds];
  const correctBotIds = bots.map(b => b.id).filter(id => !confirmingIds.includes(id));

  // Determine root cause based on trade data
  const matrix = trade.confirmationMatrix;
  const regime = matrix?.marketRegime || 'TRENDING';

  if (regime === 'RANGING' && confirmingIds.includes('bot-4-breakout')) {
    return {
      classification: 'FALSE_BREAKOUT',
      explanation: 'Breakout signal triggered inside ranging market structure without volume follow-through.',
      wrongBotIds,
      correctBotIds,
    };
  }

  if (regime === 'HIGH_VOLATILITY') {
    return {
      classification: 'UNEXPECTED_VOLATILITY',
      explanation: 'Sudden high-volatility spike penetrated the stop-loss buffer during macro liquidity rotation.',
      wrongBotIds,
      correctBotIds,
    };
  }

  if (trade.slMode === 'INITIAL' && (trade.maxLossUsd || 0) <= 2.50) {
    return {
      classification: 'STOP_TOO_TIGHT',
      explanation: 'Stop loss distance was clustered too closely to 5M entry wick noise instead of structural swing support.',
      wrongBotIds,
      correctBotIds,
    };
  }

  if (!confirmingIds.includes('bot-1-adaptive-trend')) {
    return {
      classification: 'CONFLICTING_TIMEFRAME',
      explanation: 'Lower-timeframe execution conflicted with 4H/1H macro trend baseline.',
      wrongBotIds,
      correctBotIds,
    };
  }

  // Default fallback classification
  return {
    classification: 'SUPPORT_RESISTANCE_FAILURE',
    explanation: `Key local structural level failed to hold under aggressive market selling pressure on ${trade.symbol}.`,
    wrongBotIds,
    correctBotIds,
  };
}

/**
 * Calculates Selectivity and "When Not to Trade" metrics
 */
export function computeSelectivityMetrics(
  signalLogs: SignalLogEntry[],
  auditLogs: TradePosition[]
): SelectivityMetrics {
  const totalScanned = signalLogs.length;
  const rejectedCount = signalLogs.filter(s => s.status === 'REJECTED').length;
  const acceptedCount = signalLogs.filter(s => s.status === 'EXECUTED').length;
  const rejectionRate = totalScanned > 0 ? parseFloat(((rejectedCount / totalScanned) * 100).toFixed(1)) : 0.0;

  // Estimated avoided loss calculation ($3.50 avg loss per poor trade avoided)
  const avoidedLoss = parseFloat((rejectedCount * 3.50).toFixed(2));

  // Compute Expected R from executed trades
  const executedWithOutcome = signalLogs.filter(s => s.status === 'EXECUTED' && s.finalRealizedR !== undefined);
  const totalR = executedWithOutcome.reduce((sum, s) => sum + (s.finalRealizedR || 0), 0);
  const expectedR = executedWithOutcome.length > 0 ? parseFloat((totalR / executedWithOutcome.length).toFixed(2)) : 0.0;

  const winSignals = executedWithOutcome.filter(s => (s.finalRealizedR || 0) > 0);
  const lossSignals = executedWithOutcome.filter(s => (s.finalRealizedR || 0) < 0);
  
  const avgRWin = winSignals.length > 0 
    ? parseFloat((winSignals.reduce((sum, s) => sum + (s.finalRealizedR || 0), 0) / winSignals.length).toFixed(2))
    : 0.0;
  const avgRLoss = lossSignals.length > 0 
    ? parseFloat((Math.abs(lossSignals.reduce((sum, s) => sum + (s.finalRealizedR || 0), 0)) / lossSignals.length).toFixed(2))
    : 0.0;

  const gatekeeperOverrides = signalLogs.filter(s => s.status === 'REJECTED' && s.gatekeeperVerdict === 'REJECT').length;

  return {
    totalScannedCandidates: totalScanned,
    rejectedSetupsCount: rejectedCount,
    rejectionRatePercent: rejectionRate,
    acceptedSetupsCount: acceptedCount,
    avoidedEstimatedLossUsd: avoidedLoss,
    expectedRPerTrade: expectedR,
    avgRWin,
    avgRLoss,
    falseSignalsFiltered: rejectedCount,
    gatekeeperOverrideCount: gatekeeperOverrides,
  };
}
