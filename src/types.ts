export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
export type BotStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Recommendation = 'STRONG_LONG' | 'LONG' | 'NEUTRAL' | 'SHORT' | 'STRONG_SHORT';
export type ConsensusStage = 1 | 2 | 3 | 4 | 5;

export type ConfirmationStrategyMode = 
  | 'MULTI_CONFLUENCE'       // Multi-Indicator Confluence Matrix (Trend + Momentum + Volatility + Volume + AI Sentiment)
  | 'TREND_PULLBACK'         // Macro 200 EMA + 21 EMA Dynamic Pullback
  | 'LIQUIDITY_REVERSAL'     // Institutional Liquidity Sweep & Bollinger 2.5σ Reversal
  | 'VOLATILITY_SQUEEZE'     // Keltner / Bollinger Band Compression & Explosive Expansion
  | 'NEURAL_NARRATIVE';      // AI Sentiment Velocity & Narrative Acceleration

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
  confluenceScore: number; // 0 - 100%
  minConfluenceRequired: number;
  confirmedCount: number;
  totalEvaluated: number;
  indicators: TechnicalIndicatorConfluence[];
  marketRegime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'HIGH_VOLATILITY_RANGING' | 'COMPRESSION_SQUEEZE' | 'LIQUIDITY_HUNT';
  primaryTrigger: string;
}

export interface BotLearningNote {
  id: string;
  timestamp: number;
  tradeId: string;
  symbol: string;
  direction: TradeDirection;
  stage: number;
  lossAmount: number;
  mistakeIdentified: string;
  learnedLesson: string;
  parameterAdjustment: string;
  confidenceScore: number;
  evolutionGeneration?: number;
}

export interface TradingBot {
  id: string;
  number: string; // "01", "02", etc.
  name: string;
  code: string;
  strategyTitle: string;
  strategyBadge: string;
  strategyDescription: string;
  specialization: string;
  timeframe: string;
  indicators: string[];
  status: BotStatus;
  minLeverage: number;
  maxLeverage: number;
  totalSignalsGenerated: number;
  totalConfirmationsGiven: number;
  winTradesAssisted: number;
  lossTradesAssisted: number;
  totalPnLAssisted: number;
  activeSignalsCount: number;
  mistakesCount: number;
  learningNotes: BotLearningNote[];
  adaptiveConfidenceModifier: number; // dynamically evolves as learning system improves
  strategyWeight: number; // evolved by self-learning engine (0.5 to 2.0)
  accentColor: string;
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
  direction: TradeDirection; // LONG or SHORT
  stage: ConsensusStage; // 1, 2, 3, 4, 5
  initiatorBotId: string;
  initiatorBotName: string;
  confirmingBotIds: string[]; // List of bot IDs that agreed & confirmed this trade
  confirmingBotNames: string[];
  leverage: number; // Dynamic leverage based on stage & conviction (e.g. 5x - 25x)
  margin: number; // Initial total margin from master $1000 portfolio
  remainingMargin: number; // Active margin remaining (after partial TPs)
  positionSize: number; // margin * leverage
  entryPrice: number;
  currentPrice: number;
  initialStopLossPrice: number; // Original hard SL price
  stopLossPrice: number; // Current active SL (Breakeven at TP1, TP1 price at TP2, TP2 at TP3, trailing structure)
  liquidationPrice: number; // Exact calculated liquidation threshold (strictly far beyond SL)
  slMode: 'INITIAL' | 'BREAKEVEN' | 'LOCKED_TP1' | 'LOCKED_TP2' | 'TRAILING_STRUCTURE';

  // Multi-tier TP Targets
  tp1Price: number;
  tp1Hit: boolean;
  tp1HitTime?: number;
  tp1BookedPnL?: number; // 35% booked

  tp2Price: number;
  tp2Hit: boolean;
  tp2HitTime?: number;
  tp2BookedPnL?: number; // 25% booked

  tp3Price: number;
  tp3Hit: boolean;
  tp3HitTime?: number;
  tp3BookedPnL?: number; // 20% booked

  runnerPercent: number; // 20%
  runnerActive: boolean;
  runnerBookedPnL?: number;
  trailingStopPrice?: number;
  structuralSupportPrice?: number;
  structuralResistancePrice?: number;
  totalBookedPnL: number; // Sum of partial booked profits

  takeProfitPrice: number; // Full target/TP3 price for legacy compatibility
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
  aiReasoning: string;
  teacherExplanation?: TeacherExplanation;
  sentimentScore: number;
  confirmationMatrix?: TradeConfirmationMatrix;
  mistakeAnalysis?: string;
  exitReason?: string;
  stageAtClose?: ConsensusStage;
  contractAddress?: string;
  network?: string;
  cmcUrl?: string;
  isVerified?: boolean;
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
  sentimentScore: number; // -100 to 100
  volatility: number; // percentage
  matchingBots: string[]; // Bot IDs that have high signal on this coin
  consensusDirection?: TradeDirection;
  confirmingBotsCount?: number; // 1 to 5
  recommendation: Recommendation;
  category: 'Layer 1' | 'DeFi' | 'AI / DePIN' | 'Meme' | 'Layer 2' | 'Infrastructure' | 'Gaming';
  confirmationMatrix?: TradeConfirmationMatrix;
  contractAddress?: string;
  network?: string;
  cmcUrl?: string;
  isVerified?: boolean;
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
  category: 'CONSENSUS_FILTER' | 'VOLATILITY_CLAMP' | 'LEVERAGE_DYNAMIC' | 'SENTIMENT_WEIGHT' | 'STOP_LOSS_SPACING';
  currentValue: string;
  previousValue: string;
  adaptationType: 'TIGHTENED' | 'EXPANDED' | 'OPTIMIZED' | 'HARDENED';
  rationale: string;
  effectivenessScore: number; // 0 - 100%
  timestamp: number;
}

export interface MasterPortfolio {
  initialBase: number; // $1,000.00
  currentBalance: number;
  totalRealizedPnL: number;
  netROI: number;
  activeMarginInUse?: number;
  availableBalance?: number;
  totalTradesExecuted: number;
  totalWins: number;
  totalLosses: number;
  fleetWinRate: number;
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
