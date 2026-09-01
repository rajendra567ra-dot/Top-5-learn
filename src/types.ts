export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
export type BotStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Recommendation = 'STRONG_LONG' | 'LONG' | 'NEUTRAL' | 'SHORT' | 'STRONG_SHORT';
export type ConsensusStage = 1 | 2 | 3 | 4 | 5;

// The 6 Standard Market Regimes
export type MarketRegimeType = 
  | 'TRENDING'
  | 'RANGING'
  | 'HIGH_VOLATILITY'
  | 'LOW_VOLATILITY'
  | 'BREAKOUT'
  | 'REVERSAL';

// Standard 11 Loss Classification Taxonomy
export type LossReasonClassification =
  | 'FALSE_BREAKOUT'
  | 'TREND_REVERSAL'
  | 'POOR_ENTRY'
  | 'LOW_VOLUME'
  | 'LIQUIDITY_SWEEP_FAILURE'
  | 'BAD_MARKET_REGIME'
  | 'OVEREXTENDED_ENTRY'
  | 'SUPPORT_RESISTANCE_FAILURE'
  | 'STOP_TOO_TIGHT'
  | 'CONFLICTING_TIMEFRAME'
  | 'UNEXPECTED_VOLATILITY';

// Multi-Timeframe Analysis Pipeline
export interface MultiTimeframeAnalysis {
  tf4h: {
    regime: MarketRegimeType;
    primaryDirection: TradeDirection | 'NEUTRAL';
    ema200: number;
    ema50: number;
    closePrice: number;
    adx: number;
    structure: 'BULLISH' | 'BEARISH' | 'RANGING';
    alignmentScore: number; // 0 - 100
  };
  tf1h: {
    trendConfirmation: TradeDirection | 'NEUTRAL';
    ema50: number;
    ema200: number;
    rsi: number;
    structure: 'BULLISH' | 'BEARISH' | 'CHOP';
    confirmed: boolean;
  };
  tf30m: {
    setupFormation: string; // e.g. "Bullish BOS + Retest", "30M Pullback to 21 EMA"
    bosType: 'BULLISH_BOS' | 'BEARISH_BOS' | 'NONE';
    hasRetest: boolean;
    setupFormed: boolean;
  };
  tf15m: {
    tradeConfirmation: boolean;
    structureShift: 'CHOCH_BULL' | 'CHOCH_BEAR' | 'CONTINUATION' | 'NONE';
    rejectionCandle: boolean;
    confirmationScore: number; // 0 - 100
  };
  tf5m: {
    preciseEntry: boolean;
    triggerCandle: string; // e.g. "5M Bullish Engulfing", "5M BOS + FVG tap"
    slippageEstPercent: number;
    optimalEntryPrice: number;
    validStopLocation: number;
    entryValid: boolean;
  };
  hierarchyHonored: boolean; // True if HTF trend is strictly obeyed
  htfConflictReason?: string;
}

// Bot Specific Decision Output
export interface BotEvaluationDecision {
  botId: string;
  botName: string;
  botNumber: string;
  vote: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0 - 100
  weight: number; // 0.05 to 0.20 (max 20% cap)
  effectiveContribution: number; // confidence * weight
  primaryReason: string;
  keyMetrics: Record<string, string | number>;
  patternIdentified?: string;
  historicalPatternWinRate?: number;
  sampleSize?: number;
  isCoreBot: boolean; // Bot 1, Bot 2, Bot 6, Bot 9 are Core
  passedCoreCriteria: boolean;
}

// Gatekeeper Bot 10 Detailed Assessment
export interface GatekeeperAssessment {
  passed: boolean;
  score: number; // 0 - 100
  rrRatio: number; // Must be >= 2.0
  stopLossValid: boolean;
  atrVolatilityOk: boolean;
  liquidityOk: boolean;
  spreadOk: boolean;
  nearbySRClearance: boolean;
  noHTFConflict: boolean;
  notOverextended: boolean;
  regimeFavorable: boolean;
  correlationRiskLow: boolean;
  recentDrawdownChecked: boolean;
  rejectionReasons: string[];
}

// Full Consensus Engine Output for a Candidate Setup
export interface ConsensusEngineOutput {
  symbol: string;
  direction: TradeDirection | 'NEUTRAL';
  rawConsensusCount: number; // e.g. 8/10
  agreeingBots: string[];
  disagreeingBots: string[];
  neutralBots: string[];
  coreAgreeCount: number; // e.g. 3/4 or 4/4 (needs >= 3)
  coreAgreementPassed: boolean;
  
  // Score Breakdown (0 - 100)
  rawConsensusScore: number;
  historicalBotAdjustment: number;
  marketRegimeAdjustment: number;
  coinPerformanceAdjustment: number;
  timeframeAlignmentAdjustment: number;
  setupSimilarityAdjustment: number;
  recentDrawdownAdjustment: number;
  volatilityLiquidityAdjustment: number;
  finalQualityScore: number; // 0 - 100 (needs >= 80)
  
  // Risk & Gatekeeper
  gatekeeper: GatekeeperAssessment;
  calculatedRR: number;
  
  // Final Decision
  action: 'EXECUTE_TRADE' | 'REJECT_NO_TRADE';
  primaryExecutionReason?: string;
  primaryRejectionReason?: string;
  rejectionTags: string[];
  multiTimeframe: MultiTimeframeAnalysis;
  botEvaluations: BotEvaluationDecision[];
}

// Signal Log for Every Opportunity Evaluated (Executed + Rejected)
export interface SignalLogEntry {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  marketRegime: MarketRegimeType;
  direction: TradeDirection | 'NEUTRAL';
  botVotes: Record<string, 'LONG' | 'SHORT' | 'NEUTRAL'>;
  botConfidences: Record<string, number>;
  consensusCount: number; // e.g. 8
  rawQualityScore: number;
  finalQualityScore: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  calculatedRR: number;
  volume24h: number;
  volatility: number;
  status: 'EXECUTED' | 'REJECTED' | 'EXPIRED';
  tradeId?: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  gatekeeperVerdict: 'PASS' | 'REJECT';
  executionReason?: string;
  
  // Outcome tracking (if executed or simulated)
  outcomeResult?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'MISSED_WIN' | 'AVOIDED_LOSS';
  maxFavorableExcursionR?: number; // MFE in R
  maxAdverseExcursionR?: number;   // MAE in R
  finalRealizedPnL?: number;
  finalRealizedR?: number;
  mistakeAttributions?: {
    wrongBotIds: string[];
    correctBotIds: string[];
    lossClassification?: LossReasonClassification;
  };
}

// Bot Pattern Statistical Tracking
export interface BotPatternStat {
  patternName: string;
  timeframe: string;
  sampleSize: number;
  wins: number;
  losses: number;
  winRate: number; // percentage
  averageR: number;
  reliabilityConfidence: 'HIGH' | 'MODERATE' | 'LOW_SAMPLE_UNTRUSTED';
}

// Bot Regime Statistical Performance
export interface BotRegimePerformance {
  regime: MarketRegimeType;
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  averageR: number;
  recommendedWeightMultiplier: number; // e.g. 0.6x during Range for Breakout bot
}

// Learning Note for Bot Post-Mortems
export interface BotLearningNote {
  id: string;
  timestamp: number;
  tradeId: string;
  symbol: string;
  direction: TradeDirection;
  stage: number;
  lossAmount: number;
  lossClassification: LossReasonClassification;
  mistakeIdentified: string;
  learnedLesson: string;
  parameterAdjustment: string;
  confidenceScore: number;
  evolutionGeneration?: number;
  sampleSizeAtAdjustment: number;
}

// 10 Independent Trading Bots Specification
export interface TradingBot {
  id: string;
  number: string; // "01" through "10"
  name: string;
  code: string;
  role: string;
  isCoreBot: boolean; // Bot 1, 2, 6, 9 are CORE bots
  strategyTitle: string;
  strategyBadge: string;
  strategyDescription: string;
  specialization: string;
  timeframe: string;
  indicators: string[];
  status: BotStatus;
  
  // Weights (Strictly 5% to 20% max cap)
  strategyWeight: number; // 0.05 to 0.20
  minWeightCap: number; // 0.05 (5%)
  maxWeightCap: number; // 0.20 (20% MAX CAP)
  adaptiveConfidenceModifier: number; // 0.70 to 1.40
  
  // Performance Trackers
  totalSignalsGenerated: number;
  totalConfirmationsGiven: number;
  winTradesAssisted: number;
  lossTradesAssisted: number;
  falseSignalsCount: number;
  averageR: number;
  winRate: number;
  totalPnLAssisted: number;
  activeSignalsCount: number;
  mistakesCount: number;
  
  // Detailed Pattern & Regime Intelligence
  patternStats: BotPatternStat[];
  regimePerformance: Record<MarketRegimeType, BotRegimePerformance>;
  learningNotes: BotLearningNote[];
  accentColor: string;
  
  // Unique bot diagnostic insights
  uniqueInsights?: string[];
}

export interface StageUpgradeRecord {
  stage: ConsensusStage;
  timestamp: number;
  addedBotId: string;
  addedBotName: string;
  rationale: string;
  newLeverage: number;
  newMargin: number;
}

export interface TeacherExplanation {
  setupHeadline: string;
  macroContext: string;
  technicalConfluence: string[];
  riskPlan: string;
  consensusWhy: string;
}

export interface TradePosition {
  id: string;
  symbol: string;
  name: string;
  direction: TradeDirection;
  stage: ConsensusStage;
  initiatorBotId: string;
  initiatorBotName: string;
  confirmingBotIds: string[];
  confirmingBotNames: string[];
  dissentingBotIds?: string[];
  leverage: number;
  margin: number;
  remainingMargin: number;
  positionSize: number;
  entryPrice: number;
  currentPrice: number;
  initialStopLossPrice: number;
  stopLossPrice: number;
  liquidationPrice: number;
  slMode: 'INITIAL' | 'BREAKEVEN' | 'LOCKED_TP1' | 'LOCKED_TP2' | 'TRAILING_STRUCTURE';

  // Multi-tier TP Targets
  tp1Price: number;
  tp1Hit: boolean;
  tp1HitTime?: number;
  tp1BookedPnL?: number;

  tp2Price: number;
  tp2Hit: boolean;
  tp2HitTime?: number;
  tp2BookedPnL?: number;

  tp3Price: number;
  tp3Hit: boolean;
  tp3HitTime?: number;
  tp3BookedPnL?: number;

  runnerPercent: number;
  runnerActive: boolean;
  runnerBookedPnL?: number;
  trailingStopPrice?: number;
  structuralSupportPrice?: number;
  structuralResistancePrice?: number;
  totalBookedPnL: number;

  takeProfitPrice: number;
  targetProfitUsd: number;
  maxLossUsd: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: TradeStatus;
  entryTime: number;
  stageHistory?: StageUpgradeRecord[];
  exitTime?: number;
  closePrice?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  realizedR?: number;
  maxFavorableExcursionR?: number;
  maxAdverseExcursionR?: number;
  
  // Learning & Post Mortem
  aiReasoning: string;
  teacherExplanation?: TeacherExplanation;
  sentimentScore: number;
  confirmationMatrix?: TradeConfirmationMatrix;
  consensusEngineOutput?: ConsensusEngineOutput;
  mistakeAnalysis?: string;
  lossClassification?: LossReasonClassification;
  wrongBotIds?: string[];
  correctBotIds?: string[];
  exitReason?: string;
  stageAtClose?: ConsensusStage;
  
  contractAddress?: string;
  network?: string;
  cmcUrl?: string;
  isVerified?: boolean;
}

export type ConfirmationStrategyMode = 
  | 'MULTI_CONFLUENCE'
  | 'TREND_PULLBACK'
  | 'LIQUIDITY_REVERSAL'
  | 'VOLATILITY_SQUEEZE'
  | 'NEURAL_NARRATIVE';

export interface TechnicalIndicatorConfluence {
  name: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME' | 'SENTIMENT' | 'LTF_EXECUTION';
  value: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confirmed: boolean;
  weight: number;
  description: string;
}

export interface TradeConfirmationMatrix {
  strategyMode: ConfirmationStrategyMode;
  strategyName: string;
  confluenceScore: number;
  minConfluenceRequired: number;
  confirmedCount: number;
  totalEvaluated: number;
  indicators: TechnicalIndicatorConfluence[];
  marketRegime: MarketRegimeType;
  primaryTrigger: string;
}

export interface CryptoCoin {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  rsi: number;
  macd: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
  trend: MarketTrend;
  sentimentScore: number;
  volatility: number;
  matchingBots: string[];
  consensusDirection?: TradeDirection;
  confirmingBotsCount?: number;
  recommendation: Recommendation;
  category: 'Layer 1' | 'DeFi' | 'AI / DePIN' | 'Meme' | 'Layer 2' | 'Infrastructure' | 'Gaming';
  confirmationMatrix?: TradeConfirmationMatrix;
  multiTimeframe?: MultiTimeframeAnalysis;
  contractAddress?: string;
  network?: string;
  cmcUrl?: string;
  isVerified?: boolean;
}

export interface CoinSpecificLearning {
  symbol: string;
  sampleSize: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
  bestPerformingBotId: string;
  weakestBotId: string;
  preferredRegime: MarketRegimeType;
  weightAdjustment: number; // e.g. +0.05 or -0.05
  statisticallySignificant: boolean; // true if sample >= 20
}

export interface StagePerformanceStats {
  stage: ConsensusStage;
  stageLabel: string;
  botsRequiredText: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalRealizedPnL: number;
  avgRoiPercent: number;
  avgLeverage: number;
  profitFactor: number;
  description: string;
  accentColor: string;
}

export interface SelfLearningHeuristic {
  id: string;
  key: string;
  name: string;
  category: 'CONSENSUS_FILTER' | 'VOLATILITY_CLAMP' | 'LEVERAGE_DYNAMIC' | 'SENTIMENT_WEIGHT' | 'STOP_LOSS_SPACING' | 'TIME_FRAME_HIERARCHY' | 'PATTERN_RELIABILITY';
  currentValue: string;
  previousValue: string;
  adaptationType: 'TIGHTENED' | 'EXPANDED' | 'OPTIMIZED' | 'HARDENED';
  rationale: string;
  effectivenessScore: number;
  sampleSizeAtCreation: number;
  timestamp: number;
}

// Anti-Overfitting & Walk-Forward Validation Model
export interface WalkForwardValidation {
  trainingWindowTrades: number; // e.g. 150 trades
  validationWindowTrades: number; // e.g. 50 trades
  outOfSampleTrades: number; // e.g. 50 trades
  trainingWinRate: number;
  validationWinRate: number;
  outOfSampleWinRate: number;
  trainingSharpe: number;
  outOfSampleSharpe: number;
  overfitWarning: boolean; // true if out-of-sample degrades > 15%
  status: 'ROBUST_STABLE' | 'MODERATE_DRIFT' | 'OVERFITTING_DETECTED';
  lastEvaluatedTimestamp: number;
}

// "When Not to Trade" Analytics Model
export interface SelectivityMetrics {
  totalScannedCandidates: number;
  rejectedSetupsCount: number;
  rejectionRatePercent: number; // e.g. 84.5% rejected
  acceptedSetupsCount: number;
  avoidedEstimatedLossUsd: number;
  expectedRPerTrade: number; // e.g. +1.42 R
  avgRWin: number;
  avgRLoss: number;
  falseSignalsFiltered: number;
  gatekeeperOverrideCount: number;
}

export interface MasterPortfolio {
  initialBase: number;
  currentBalance: number;
  totalRealizedPnL: number;
  netROI: number;
  activeMarginInUse?: number;
  availableBalance?: number;
  totalTradesExecuted: number;
  totalWins: number;
  totalLosses: number;
  fleetWinRate: number;
  averageFleetR: number;
  evolutionGeneration: number;
  selfLearningAdaptationsCount: number;
  activeStagedTradesCount?: number;
  activeStrategyMode?: ConfirmationStrategyMode;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  summaryIntervalMinutes: number;
  notifyOnTradeOpen: boolean;
  notifyOnTakeProfit: boolean;
  notifyOnStopLoss: boolean;
  notifyHourlySummary: boolean;
  lastError?: string;
  lastErrorTimestamp?: number;
}

export interface TelegramLog {
  id: string;
  timestamp: number;
  type: 'TRADE_OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOURLY_SUMMARY' | 'SYSTEM';
  target: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  errorDetails?: string;
}
