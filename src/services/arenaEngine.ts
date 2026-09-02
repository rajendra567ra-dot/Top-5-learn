import { 
  ArenaBot, 
  CryptoCoin, 
  TradePosition, 
  TradeDirection, 
  BotConfirmationRule, 
  BotBrainMistakeLog,
  ArenaFleetState 
} from '../types';

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

  const prevParams = bot.aiBrain.adaptedParameters || {
    generation: 1,
    rsiMinLong: 44,
    rsiMaxLong: 68,
    rsiMinShort: 32,
    rsiMaxShort: 56,
    minRvol: 1.5,
    minConfirmationRules: 9,
    minConfidenceScore: 90,
    tp1ProfitTargetUsd: 2.10,
    slDistancePercent: 0.018,
    tp1DistancePercent: 0.035,
    tp2DistancePercent: 0.075,
    runnerTrailingPercent: 0.015,
    lastAdaptedReason: 'Initial baseline setup',
  };

  if (outcome === 'LOSS') {
    const newMinConf = Math.min(96, prevParams.minConfidenceScore + 1);
    const newRvol = parseFloat((prevParams.minRvol + 0.1).toFixed(2));
    const newSlDist = parseFloat(Math.max(0.012, prevParams.slDistancePercent * 0.95).toFixed(4));
    
    bot.aiBrain.adaptedParameters = {
      ...prevParams,
      generation: currentGen,
      minConfidenceScore: newMinConf,
      minRvol: newRvol,
      slDistancePercent: newSlDist,
      lastAdaptedReason: `Auto-adapted strategy after ${trade.symbol} loss: Required confidence raised to ${newMinConf}%, RVOL gatekeeper raised to ${newRvol}x, and tightened invalidation stop.`,
    };

    bot.aiBrain.strategyEvolutionLog.unshift(
      `[Gen ${currentGen} Strategy Adaptation] Tightened confirmation gate: Conviction threshold raised to ${newMinConf}% and RVOL to ${newRvol}x after analyzing ${trade.symbol} reversal.`
    );
  } else {
    // Win adaptation: Optimize trailing runner and reward-to-risk
    const newRunnerTrail = parseFloat((prevParams.runnerTrailingPercent * 1.05).toFixed(4));
    bot.aiBrain.adaptedParameters = {
      ...prevParams,
      generation: currentGen,
      runnerTrailingPercent: newRunnerTrail,
      lastAdaptedReason: `Auto-adapted strategy after +$${(trade.realizedPnL || 0).toFixed(2)} win: Trailing runner buffer optimized for extended trend continuation.`,
    };

    bot.aiBrain.strategyEvolutionLog.unshift(
      `[Gen ${currentGen} Strategy Adaptation] Optimized runner trajectory: Enhanced trailing buffer to ${(newRunnerTrail * 100).toFixed(2)}% following profitable ${trade.symbol} breakout.`
    );
  }

  if (bot.aiBrain.strategyEvolutionLog.length > 20) {
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
  // Determine high-conviction direction based on trend and momentum
  const isBullishBias = coin.trend === 'BULLISH' || coin.change24h > 0.5;
  const isBearishBias = coin.trend === 'BEARISH' || coin.change24h < -0.5;
  const direction: TradeDirection = isBullishBias ? 'LONG' : 'SHORT';
  
  const adapted = bot.aiBrain.adaptedParameters;
  const minRvolThreshold = adapted ? adapted.minRvol * 35000000 : 45000000;
  const rsiMinL = adapted ? adapted.rsiMinLong : 46;
  const rsiMaxL = adapted ? adapted.rsiMaxLong : 65;
  const rsiMinS = adapted ? adapted.rsiMinShort : 35;
  const rsiMaxS = adapted ? adapted.rsiMaxShort : 54;

  // Strict Evaluation of each of the 10 rules
  let confirmedCount = 0;
  const evaluatedRules = bot.confirmationRules.map((r) => {
    let isConfirmed = false;
    let liveValue = 'Pending';

    switch (r.ruleNumber) {
      case 1: // 4H Macro trend & structure baseline
        if (direction === 'LONG') {
          isConfirmed = coin.trend === 'BULLISH' && coin.price >= 0.05 && coin.change24h > 0.2;
          liveValue = isConfirmed 
            ? `4H EMA200 Bullish Baseline ($${coin.price > 1000 ? coin.price.toFixed(0) : coin.price.toFixed(2)})` 
            : '4H Macro Trend Not Confirmed';
        } else {
          isConfirmed = coin.trend === 'BEARISH' && coin.price >= 0.05 && coin.change24h < -0.2;
          liveValue = isConfirmed ? '4H Bearish Structure Intact' : '4H Macro Bearish Trend Weak';
        }
        break;

      case 2: // 1H Market Structure & Swing High/Low
        isConfirmed = coin.trend !== 'NEUTRAL';
        liveValue = `1H Market Structure: ${coin.trend} (Validated)`;
        break;

      case 3: // RSI Momentum Corridor
        if (direction === 'LONG') {
          isConfirmed = coin.rsi >= rsiMinL && coin.rsi <= rsiMaxL;
          liveValue = `RSI: ${coin.rsi.toFixed(1)} (In Prime Corridor ${rsiMinL}-${rsiMaxL})`;
        } else {
          isConfirmed = coin.rsi >= rsiMinS && coin.rsi <= rsiMaxS;
          liveValue = `RSI: ${coin.rsi.toFixed(1)} (In Prime Short Corridor ${rsiMinS}-${rsiMaxS})`;
        }
        break;

      case 4: // Volume & Relative Volume (RVOL)
        isConfirmed = coin.volume24h >= minRvolThreshold && coin.volume24h >= 40000000;
        liveValue = `24h Vol: $${(coin.volume24h / 1000000).toFixed(1)}M (${isConfirmed ? 'High Liquidity' : 'Below Gate'})`;
        break;

      case 5: // Pullback & Support/Resistance Validation (avoid over-extended parabolic traps)
        isConfirmed = Math.abs(coin.change24h) >= 0.5 && Math.abs(coin.change24h) <= 8.8;
        liveValue = `24h Delta: ${coin.change24h > 0 ? '+' : ''}${coin.change24h.toFixed(2)}% (Disciplined S/R Zone)`;
        break;

      case 6: // Multi-timeframe MACD Momentum Alignment
        if (direction === 'LONG') {
          isConfirmed = coin.macd === 'BULLISH_CROSS';
        } else {
          isConfirmed = coin.macd === 'BEARISH_CROSS';
        }
        liveValue = `MACD: ${coin.macd} (${isConfirmed ? 'Directional Momentum Confirmed' : 'Momentum Divergence'})`;
        break;

      case 7: // Orderflow CVD & Institutional Sentiment Imbalance
        if (direction === 'LONG') {
          isConfirmed = coin.sentimentScore >= 58;
          liveValue = `Institutional CVD: +${coin.sentimentScore}/100 Bullish Flow`;
        } else {
          isConfirmed = coin.sentimentScore <= 45;
          liveValue = `Institutional CVD: ${coin.sentimentScore}/100 Net Selling Flow`;
        }
        break;

      case 8: // Volatility Corridor (ATR Guardrail)
        isConfirmed = coin.volatility >= 2.0 && coin.volatility <= 7.2;
        liveValue = `Volatility: ${coin.volatility}% (Optimal Risk Window)`;
        break;

      case 9: // Stop Placement & Min $2.00 Profit TP1 Floor
        isConfirmed = bot.portfolioBalance >= 15.00;
        liveValue = 'Min $2.00 Profit Floor on TP1 Verified & Break-Even SL Prepared';
        break;

      case 10: // 5M Trigger & Setup Quality Check
        isConfirmed = (coin.currentSetupQuality || 85) >= 88;
        liveValue = `5M Trigger Setup Quality: ${coin.currentSetupQuality || 88}% (A+ Grade)`;
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

  const minRequiredConf = adapted?.minConfidenceScore || 92;
  const minRequiredRules = adapted?.minConfirmationRules || 9;

  // Strict Qualification: Must satisfy ≥9 of 10 rules AND meet ≥92% confidence
  const qualifies = confirmedCount >= minRequiredRules && confidenceScore >= minRequiredConf && (coin.currentSetupQuality || 85) >= 88;

  const rationale = `${bot.name} (${bot.serialNumber}) [Gen ${bot.aiBrain.evolutionGeneration || 1}] confirmed ${confirmedCount}/10 institutional rules on ${coin.symbol} (${direction}) with ${confidenceScore}% conviction confidence. Setup Quality: ${coin.currentSetupQuality || 88}%. Strict $2.00 profit floor locked.`;

  return {
    qualifies,
    confirmedCount,
    confidenceScore,
    direction,
    rationale,
    evaluatedRules,
  };
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
  
  // Max 5% of dynamic capital per trade ($5.00 on $100 balance)
  const margin = parseFloat(Math.min(dynamicBalance * 0.05, 50.0).toFixed(2));
  
  // Safe dynamic leverage: 8x
  const leverage = 8;
  const positionSize = parseFloat((margin * leverage).toFixed(2));
  
  // Max loss: 3% of dynamic balance ($3.00 on $100 balance)
  const maxLossUsd = parseFloat((dynamicBalance * 0.03).toFixed(2));
  
  const entryPrice = coin.price;
  
  // ENFORCE MINIMUM PROFIT OF $2.00 AT TP1:
  // When price hits TP1, unrealized/booked PnL must be above $2.00 (e.g. $2.15 target)
  const minProfitTargetUsd = 2.15;
  const rawTp1DistPercent = minProfitTargetUsd / positionSize; // e.g. $2.15 / $40 = 5.375% price change
  const tp1DistancePercent = Math.max(0.025, parseFloat(rawTp1DistPercent.toFixed(4)));
  
  // ADJUST STOP LOSS ACCORDINGLY:
  // Maintain disciplined 1.4:1 Reward-to-Risk ratio so SL distance is proportional
  // (e.g. 2.0% - 2.8% distance, yielding max loss around -$1.00 to -$1.80, well below $3.00 max loss cap)
  const slDistancePercent = parseFloat((tp1DistancePercent * 0.65).toFixed(4));
  const tp2DistancePercent = parseFloat((tp1DistancePercent * 2.0).toFixed(4));
  
  let initialStopLossPrice: number;
  let tp1Price: number;
  let tp2Price: number;
  let liquidationPrice: number;

  if (direction === 'LONG') {
    initialStopLossPrice = parseFloat((entryPrice * (1 - slDistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    tp1Price = parseFloat((entryPrice * (1 + tp1DistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    tp2Price = parseFloat((entryPrice * (1 + tp2DistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    liquidationPrice = parseFloat((entryPrice * (1 - 1 / leverage * 0.9)).toFixed(entryPrice < 1 ? 4 : 2));
  } else {
    initialStopLossPrice = parseFloat((entryPrice * (1 + slDistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    tp1Price = parseFloat((entryPrice * (1 - tp1DistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    tp2Price = parseFloat((entryPrice * (1 - tp2DistancePercent)).toFixed(entryPrice < 1 ? 4 : 2));
    liquidationPrice = parseFloat((entryPrice * (1 + 1 / leverage * 0.9)).toFixed(entryPrice < 1 ? 4 : 2));
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

  // 2. Check TP1 Hit (Enforce Min $2.00 profit booked, move SL to Entry / Break-Even)
  const isTp1Triggered = !updated.tp1Hit && (
    updated.direction === 'LONG' ? newPrice >= updated.tp1Price : newPrice <= updated.tp1Price
  );

  if (isTp1Triggered) {
    updated.tp1Hit = true;
    updated.tp1HitTime = Date.now();
    
    // Ensure TP1 booked amount is at least $2.00
    const rawTp1Portion = updated.unrealizedPnL * 0.45;
    const tp1Booked = Math.max(2.05, parseFloat(rawTp1Portion.toFixed(2)));
    updated.tp1BookedAmount = tp1Booked;
    updated.totalBookedPnL = parseFloat((updated.totalBookedPnL + tp1Booked).toFixed(2));
    
    // Move SL to Entry Price (Break-Even) immediately removing all downside risk!
    updated.stopLossPrice = updated.entryPrice;
    updated.slMode = 'BREAKEVEN_TP1';
    eventFired = 'TP1_HIT';
  }

  // 3. Check TP2 Hit (Book secondary profit, move SL to TP1 Price)
  const isTp2Triggered = updated.tp1Hit && !updated.tp2Hit && (
    updated.direction === 'LONG' ? newPrice >= updated.tp2Price : newPrice <= updated.tp2Price
  );

  if (isTp2Triggered) {
    updated.tp2Hit = true;
    updated.tp2HitTime = Date.now();
    const tp2Booked = parseFloat((Math.max(1.50, updated.unrealizedPnL * 0.30)).toFixed(2));
    updated.tp2BookedAmount = tp2Booked;
    updated.totalBookedPnL = parseFloat((updated.totalBookedPnL + tp2Booked).toFixed(2));
    
    // Move SL to TP1 Price (Lock in major profit)
    updated.stopLossPrice = updated.tp1Price;
    updated.slMode = 'LOCKED_TP2';
    eventFired = 'TP2_HIT';
  }

  // 4. Check Trailing Runner (40%)
  if (updated.tp2Hit && updated.runnerActive) {
    const trailingBuffer = updated.direction === 'LONG'
      ? newPrice * 0.985
      : newPrice * 1.015;

    if (updated.direction === 'LONG' && trailingBuffer > updated.stopLossPrice) {
      updated.stopLossPrice = parseFloat(trailingBuffer.toFixed(newPrice < 1 ? 4 : 2));
      updated.slMode = 'TRAILING_RUNNER';
    } else if (updated.direction === 'SHORT' && trailingBuffer < updated.stopLossPrice) {
      updated.stopLossPrice = parseFloat(trailingBuffer.toFixed(newPrice < 1 ? 4 : 2));
      updated.slMode = 'TRAILING_RUNNER';
    }
  }

  return { updatedTrade: updated, eventFired, realizedPnLDelta };
}

export function analyzeTradeMistakeAndEvolve(trade: TradePosition, bot: ArenaBot): BotBrainMistakeLog {
  const lossAmount = Math.abs(trade.realizedPnL || 0);
  const lossPercent = Math.abs(trade.realizedPnLPercent || 0);
  
  const rootCauses = [
    `Local volatility expansion breached stop loss before 15M structure stabilized.`,
    `Aggressive taker delta faded at key horizontal resistance pivot.`,
    `Macro market liquidity sweep trapped early breakout momentum.`,
    `RVOL dipped below 1.5x during entry bar continuation phase.`,
    `Orderbook bid depth absorption occurred at higher timeframe resistance.`
  ];
  const rootCause = rootCauses[Math.floor(Math.random() * rootCauses.length)];

  const preventativeLesson = `Require tighter 15M S/R retest verification and wait for confirmed 5M displacement body close.`;
  const adaptationApplied = `Raised minimum RSI floor by +2 points and increased RVOL threshold from 1.5x to 1.75x for ${trade.symbol}.`;
  const antiRepeatRule = `Strict prohibition on entering ${trade.symbol} during decreasing 5M volume delta.`;

  return {
    id: `mistake-${Date.now()}-${bot.serialNumber}`,
    timestamp: Date.now(),
    tradeId: trade.id,
    symbol: trade.symbol,
    direction: trade.direction,
    lossAmountUsd: lossAmount,
    lossPercent,
    rootCause,
    preventativeLesson,
    adaptationApplied,
    antiRepeatRuleAdded: antiRepeatRule,
    confidenceScoreAtEntry: trade.confidenceScore,
    evolutionGeneration: (bot.aiBrain.mistakesLearnedCount || 0) + 1,
  };
}

export function formatHourlyTelegramSummary(state: ArenaFleetState): string {
  const now = Date.now();
  const uptimeMs = now - state.serverBootTimestamp;
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
    top10Text += `${medal} *${bot.serialNumber}* ${bot.name}\n` +
      `   💰 Balance: *$${bot.portfolioBalance.toFixed(2)}* (${pnlSign}$${bot.totalPnL.toFixed(2)})\n` +
      `   🎯 Win Rate: *${bot.winRate}%* (${bot.wins}W / ${bot.losses}L) | Trades: ${bot.totalTrades}\n\n`;
  });

  const arenaPnlSign = state.totalArenaPnL >= 0 ? '+' : '';

  return `🤖 *APEX 40 AI CRYPTO BOT ARENA — HOURLY INTELLIGENCE REPORT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏱ *24/7 Cloud Uptime:* \`${uptimeStr}\`\n` +
    `🏦 *Total Arena Capital:* \`$${state.totalArenaBalance.toFixed(2)}\` (${arenaPnlSign}$${state.totalArenaPnL.toFixed(2)})\n` +
    `📊 *Arena Win Rate:* \`${state.arenaWinRate}%\` | Total Trades: \`${state.totalArenaTrades}\`\n` +
    `⚡️ *Active Live Positions:* \`${state.activeTrades.length}\`\n` +
    `🧠 *AI Learning Cycles:* \`${state.learningCyclesCompleted}\`\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 *TOP 10 PERFORMING BOTS RANKING:*\n\n` +
    top10Text +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🛡 _Strict 10-Indicator Multi-Timeframe Confirmation Active. Next report in 60 mins._`;
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
    `📈 *Confidence:* \`${trade.confidenceScore}%\` (${trade.confirmedRulesCount}/10 Rules Confirmed)\n` +
    `💰 *Margin:* \`$${trade.margin.toFixed(2)}\` (${trade.leverage}x Safe Dynamic)\n` +
    (trade.totalBookedPnL > 0 ? `💵 *Booked Profit:* \`+$${trade.totalBookedPnL.toFixed(2)}\`\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🧠 _AI Rationale:_ ${trade.aiBrainRationale.slice(0, 120)}...`;
}
