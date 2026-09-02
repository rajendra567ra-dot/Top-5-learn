export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
export type BotStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Recommendation = 'STRONG_LONG' | 'LONG' | 'NEUTRAL' | 'SHORT' | 'STRONG_SHORT';

export type StrategyCategoryType = 
  | 'TREND'
  | 'BREAKOUT'
  | 'PULLBACK'
  | 'SMC_ORDER_BLOCK'
  | 'LIQUIDITY_SWEEP'
  | 'MEAN_REVERSION'
  | 'VOLATILITY_SQUEEZE'
  | 'ORDERFLOW_CVD'
  | 'NEURAL_SENTIMENT'
  | 'PRICE_ACTION'
  | 'MOMENTUM';

export type RankingMode = 
  | 'ALPHABETICAL'
  | 'WIN_RATE'
  | 'PORTFOLIO_VALUE'
  | 'TOTAL_TRADES'
  | 'TOTAL_PNL';

export type ActiveViewMode = 
  | 'ARENA_HOME'
  | 'LIVE_TRADES'
  | 'CMC_500'
  | 'MISTAKE_LEARNING'
  | 'TELEGRAM_HUB';

export interface BotConfirmationRule {
  id: string;
  ruleNumber: number; // 1 to 10
  ruleName: string;
  timeframe: '4H' | '1H' | '30M' | '15M' | '5M' | 'ORDERFLOW' | 'RISK_GATE';
  category: string;
  description: string;
  isConfirmed: boolean;
  liveValue: string;
}

export interface BotBrainMistakeLog {
  id: string;
  timestamp: number;
  tradeId: string;
  symbol: string;
  direction: TradeDirection;
  lossAmountUsd: number;
  lossPercent: number;
  rootCause: string;
  preventativeLesson: string;
  adaptationApplied: string;
  antiRepeatRuleAdded: string;
  confidenceScoreAtEntry: number;
  evolutionGeneration: number;
}

export interface AdaptedStrategyParameters {
  generation: number;
  rsiMinLong: number;
  rsiMaxLong: number;
  rsiMinShort: number;
  rsiMaxShort: number;
  minRvol: number;
  minConfirmationRules: number;
  minConfidenceScore: number;
  tp1ProfitTargetUsd: number; // Min $2.00
  slDistancePercent: number;
  tp1DistancePercent: number;
  tp2DistancePercent: number;
  runnerTrailingPercent: number;
  lastAdaptedReason: string;
}

export interface BotBrainIntelligence {
  learningLevel: string;
  adaptationScore: number; // 0 - 100
  mistakesLearnedCount: number;
  antiRepeatRulesActive: string[];
  mistakeMemory: BotBrainMistakeLog[];
  lastAdaptationTimestamp: number;
  strategyEvolutionNotes: string[];
  evolutionGeneration?: number;
  adaptedParameters?: AdaptedStrategyParameters;
  strategyEvolutionLog?: string[];
}

export interface BotEquityPoint {
  timestamp: number;
  balance: number;
}

export interface ArenaBot {
  id: string;
  serialNumber: string; // e.g. "BOT-01"
  name: string;
  portfolioBalance: number; // Starts at $100.00 dynamic
  initialBalance: number; // $100.00
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number; // 0 - 100%
  totalTrades: number;
  wins: number;
  losses: number;
  activeTradesCount: number;
  equityHistory: BotEquityPoint[];
  status: BotStatus;
  strategyTitle: string;
  strategyCategory: StrategyCategoryType;
  strategyDescription: string;
  timeframe: string;
  accentColor: string;
  avatarIcon: string;
  confirmationRules: BotConfirmationRule[]; // 10 strict rules
  aiBrain: BotBrainIntelligence;
}

export interface TradePosition {
  id: string;
  botId: string;
  botSerialNumber: string;
  botName: string;
  symbol: string; // e.g. "BTC/USDT"
  name: string;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  entryTime: number;
  leverage: number; // 3x to 15x dynamic safe
  margin: number; // Max 5% of dynamic balance ($5.00 on $100)
  positionSize: number; // margin * leverage
  maxLossUsd: number; // Max 3% of dynamic balance ($3.00 on $100)
  initialStopLossPrice: number;
  stopLossPrice: number;
  liquidationPrice: number;
  slMode: 'INITIAL' | 'BREAKEVEN_TP1' | 'LOCKED_TP2' | 'TRAILING_RUNNER';

  // Multi-tier TP Targets
  tp1Price: number; // Closer than SL for fast de-risking
  tp1Hit: boolean;
  tp1HitTime?: number;
  tp1BookedAmount?: number; // 35% of profit booked

  tp2Price: number;
  tp2Hit: boolean;
  tp2HitTime?: number;
  tp2BookedAmount?: number; // 25% of profit booked

  runnerPercent: number; // 40%
  runnerActive: boolean;
  trailingStopPrice?: number;
  totalBookedPnL: number;

  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: TradeStatus;

  // Confidence & Strict Confirmation
  confidenceScore: number; // 0 - 100 (90+ = exceptional conviction)
  confirmedRulesCount: number; // Must be >= 9 out of 10!
  confirmedRuleNames: string[];
  aiBrainRationale: string;

  // Outcome & Learning Tracking
  exitTime?: number;
  closePrice?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  exitReason?: string;
  mistakeAnalysis?: string;

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
  sentimentScore: number;
  volatility: number;
  category: string;
  network?: string;
  contractAddress?: string;
  cmcUrl?: string;
  isVerified?: boolean;
  activeScanningBotsCount?: number;
  scanningBotNames?: string[];
  currentSetupQuality?: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  summaryIntervalMinutes: number; // 60 mins by default
  notifyOnTradeOpen: boolean;
  notifyOnTP1: boolean;
  notifyOnTP2: boolean;
  notifyOnStopLoss: boolean;
  notifyHourlySummary: boolean;
  lastDispatchTimestamp?: number;
  lastStatus?: string;
}

export interface TelegramLog {
  id: string;
  timestamp: number;
  type: 'TRADE_OPEN' | 'TP1_HIT' | 'TP2_HIT' | 'STOP_LOSS' | 'HOURLY_REPORT' | 'SYSTEM';
  title: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  botSerialNumber?: string;
}

export interface ArenaFleetState {
  bots: ArenaBot[];
  activeTrades: TradePosition[];
  closedTrades: TradePosition[];
  coins: CryptoCoin[];
  telegramConfig: TelegramConfig;
  telegramLogs: TelegramLog[];
  serverBootTimestamp: number;
  lastScanTimestamp: number;
  lastHourlySummaryTimestamp: number;
  totalArenaBalance: number; // Starts at $4,000.00 ($100 * 40)
  totalArenaPnL: number;
  totalArenaTrades: number;
  totalArenaWins: number;
  totalArenaLosses: number;
  arenaWinRate: number;
  isScanningActive: boolean;
  learningCyclesCompleted: number;
}
