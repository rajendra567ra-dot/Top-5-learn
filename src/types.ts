export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
export type BotStatus = 'ACTIVE' | 'PAUSED' | 'LEARNING';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Recommendation = 'STRONG_LONG' | 'LONG' | 'NEUTRAL' | 'SHORT' | 'STRONG_SHORT';

export interface BotLearningNote {
  id: string;
  timestamp: number;
  tradeId: string;
  symbol: string;
  direction: TradeDirection;
  lossAmount: number;
  mistakeIdentified: string;
  learnedLesson: string;
  parameterAdjustment: string;
  confidenceScore: number;
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
  balance: number; // dynamically compounded, initial $100
  initialBalance: number; // $100.00
  status: BotStatus;
  minLeverage: number;
  maxLeverage: number;
  winTrades: number;
  lossTrades: number;
  totalPnL: number;
  activeTradesCount: number;
  mistakesCount: number;
  learningNotes: BotLearningNote[];
  adaptiveConfidenceModifier: number; // modified as it learns (+0.05 on win, -0.05 on loss with caution)
  lastTradeTime?: number;
  accentColor: string;
}

export interface TradePosition {
  id: string;
  botId: string;
  botName: string;
  symbol: string;
  name: string;
  direction: TradeDirection;
  leverage: number;
  margin: number; // Dynamic 5% max of bot capital
  positionSize: number; // margin * leverage
  entryPrice: number;
  currentPrice: number;
  takeProfitPrice: number; // dynamically calculated for > $2.00 min profit
  stopLossPrice: number; // dynamically calculated for max 3% loss of capital
  targetProfitUsd: number; // >= $2.00
  maxLossUsd: number; // <= 3% of capital
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: TradeStatus;
  entryTime: number;
  exitTime?: number;
  closePrice?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  aiReasoning: string;
  sentimentScore: number;
  mistakeAnalysis?: string;
  exitReason?: string;
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
  recommendation: Recommendation;
  category: 'Layer 1' | 'DeFi' | 'AI / DePIN' | 'Meme' | 'Layer 2' | 'Infrastructure' | 'Gaming';
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnTradeOpen: boolean;
  notifyOnTakeProfit: boolean;
  notifyOnStopLoss: boolean;
  notifyHourlySummary: boolean;
  summaryIntervalMinutes: number; // 15, 30 or 60
  lastDispatchedAt?: number;
}

export interface TelegramLog {
  id: string;
  timestamp: number;
  type: 'TRADE_OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'HOURLY_SUMMARY' | 'SYSTEM' | 'TEST' | 'ERROR';
  target: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  error?: string;
}

export interface FleetSummary {
  totalBalance: number;
  initialBase: number; // $500 ($100 * 5)
  totalNetPnL: number;
  netROI: number;
  totalClosedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  activePositionsCount: number;
  uptimeSeconds: number;
  isAutonomous247Running: boolean;
  nextSummarySeconds: number;
}
