import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  BarChart3, 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Bot,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import { CryptoCoin, TradingBot, TradeDirection, MultiTimeframeAnalysis, ConsensusEngineOutput } from '../types';
import { evaluateConsensusEngine } from '../services/tradingEngine';

interface MultiTimeframeInspectorModalProps {
  coin: CryptoCoin;
  direction?: TradeDirection;
  bots: TradingBot[];
  onClose: () => void;
  onExecuteTrade?: (coin: CryptoCoin, direction: TradeDirection) => void;
}

export const MultiTimeframeInspectorModal: React.FC<MultiTimeframeInspectorModalProps> = ({
  coin,
  direction = 'LONG',
  bots,
  onClose,
  onExecuteTrade,
}) => {
  const dir: TradeDirection = (direction === 'SHORT' || (!direction && coin.change24h < 0)) ? 'SHORT' : 'LONG';
  const consensusOutput: ConsensusEngineOutput = evaluateConsensusEngine(coin, dir, bots, 'MULTI_CONFLUENCE');
  const mtf = consensusOutput.multiTimeframe;
  const gatekeeper = consensusOutput.gatekeeper;
  const isLong = dir === 'LONG';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-8 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black font-mono">
              {coin.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {coin.name} ({coin.symbol}/USDT)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isLong ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {dir} SETUP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                4H → 1H → 30M → 15M → 5M Institutional Multi-Timeframe Alignment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Top Summary Banner: Consensus & Gatekeeper Verdict */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          consensusOutput.action === 'EXECUTE_TRADE'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}>
          <div>
            <div className="flex items-center gap-2 font-bold text-sm">
              {consensusOutput.action === 'EXECUTE_TRADE' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              )}
              {consensusOutput.action === 'EXECUTE_TRADE'
                ? `APPROVED FOR LIVE TRADE (${consensusOutput.rawConsensusCount}/10 BOTS, ${consensusOutput.coreAgreeCount}/4 CORE)`
                : `TRADE VETOED / REJECTED (${consensusOutput.rejectionTags.join(', ')})`}
            </div>
            <p className="text-xs mt-1">
              {consensusOutput.primaryExecutionReason || consensusOutput.primaryRejectionReason}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-center font-mono">
              <div className="text-[9px] uppercase font-bold text-slate-500">Quality Score</div>
              <div className={`text-base font-black ${
                consensusOutput.finalQualityScore >= 80 ? 'text-emerald-600' : 'text-slate-700'
              }`}>
                {consensusOutput.finalQualityScore} / 100
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-center font-mono">
              <div className="text-[9px] uppercase font-bold text-slate-500">R:R Ratio</div>
              <div className="text-base font-black text-slate-900">
                {consensusOutput.calculatedRR}:1
              </div>
            </div>
          </div>
        </div>

        {/* 5-Tier Timeframe Breakdown Grid (4H → 1H → 30M → 15M → 5M) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Timeframe Hierarchy (Smaller TF Never Overrides Higher TF)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            
            {/* 4H Regime */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 font-mono">4H TIMEFRAME</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                  REGIME
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">
                {mtf.tf4h.regime}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                <div>ADX: {mtf.tf4h.adx}</div>
                <div>EMA200: ${mtf.tf4h.ema200}</div>
                <div>Struct: {mtf.tf4h.structure}</div>
              </div>
            </div>

            {/* 1H Trend */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 font-mono">1H TIMEFRAME</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                  TREND
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">
                {mtf.tf1h.trendConfirmation}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                <div>RSI: {mtf.tf1h.rsi}</div>
                <div>50 EMA: ${mtf.tf1h.ema50}</div>
                <div>Stack: {mtf.tf1h.confirmed ? 'ALIGNED' : 'CONFLICT'}</div>
              </div>
            </div>

            {/* 30M Setup */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 font-mono">30M TIMEFRAME</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                  SETUP
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate" title={mtf.tf30m.setupFormation}>
                {mtf.tf30m.bosType}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                <div>BOS: {mtf.tf30m.bosType !== 'NONE' ? 'YES' : 'NO'}</div>
                <div>Retest: {mtf.tf30m.hasRetest ? 'VALIDATED' : 'WAITING'}</div>
              </div>
            </div>

            {/* 15M Confirmation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 font-mono">15M TIMEFRAME</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                  CONFIRM
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">
                {mtf.tf15m.structureShift}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                <div>Score: {mtf.tf15m.confirmationScore}%</div>
                <div>Rejection: {mtf.tf15m.rejectionCandle ? 'CONFIRMED' : 'NO'}</div>
              </div>
            </div>

            {/* 5M Entry */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 font-mono">5M TIMEFRAME</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  ENTRY
                </span>
              </div>
              <div className="font-bold text-xs text-emerald-700">
                ${mtf.tf5m.optimalEntryPrice}
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                <div>SL: ${mtf.tf5m.validStopLocation}</div>
                <div>Spread: {(mtf.tf5m.slippageEstPercent * 100).toFixed(2)}%</div>
              </div>
            </div>

          </div>
        </div>

        {/* 10-Bot Voting Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-600" />
              10 Specialist Bot Engine Consensus Votes
            </h3>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Core Quorum: {consensusOutput.coreAgreeCount}/4 Core Bots • Total: {consensusOutput.rawConsensusCount}/10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
            {consensusOutput.botEvaluations.map((bEval) => {
              const isAgreed = bEval.vote === dir;
              return (
                <div key={bEval.botId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{bEval.botNumber}. {bEval.botName}</span>
                      {bEval.isCoreBot && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                          CORE
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isAgreed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {bEval.vote} ({bEval.confidence}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {bEval.primaryReason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gatekeeper Checklist (Bot 10) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Bot 10: Supreme Risk &amp; Quality Gatekeeper Verification
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              gatekeeper.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {gatekeeper.passed ? 'PASS' : 'VETOED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              {gatekeeper.rrRatio >= 2.0 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span>R:R &ge; 2.0:1 ({gatekeeper.rrRatio}:1)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              {gatekeeper.noHTFConflict ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span>No 4H Macro Conflict</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              {gatekeeper.atrVolatilityOk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span>Volatility &amp; ATR Safe</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              {gatekeeper.spreadOk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span>Spread &lt; 0.25%</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close Inspector
          </button>

          {onExecuteTrade && (
            <button
              onClick={() => {
                onExecuteTrade(coin, dir);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Execute Staged Trade Now
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
