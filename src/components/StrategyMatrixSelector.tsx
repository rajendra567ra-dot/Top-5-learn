import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Zap, 
  BrainCircuit, 
  CheckCircle2, 
  Activity, 
  ArrowRight,
  Sparkles,
  Server,
  Info,
  Check
} from 'lucide-react';
import { ConfirmationStrategyMode } from '../types';
import { CONFIRMATION_STRATEGIES } from '../services/tradingEngine';

interface StrategyMatrixSelectorProps {
  activeStrategy: ConfirmationStrategyMode;
  onSelectStrategy: (mode: ConfirmationStrategyMode) => void;
  isUpdatingStrategy?: boolean;
}

export const StrategyMatrixSelector: React.FC<StrategyMatrixSelectorProps> = ({
  activeStrategy,
  onSelectStrategy,
  isUpdatingStrategy = false,
}) => {
  const [hoveredStrat, setHoveredStrat] = useState<ConfirmationStrategyMode | null>(null);
  const strategies = Object.values(CONFIRMATION_STRATEGIES);

  return (
    <div id="strategy-matrix-selector-card" className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs font-sans space-y-4">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Advanced Multi-Indicator Confirmation & Strategy Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              Strict Confluence Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Select the algorithmic confirmation ruleset used by the 24/7 background fleet. Every candidate is evaluated across 10 institutional indicators (including 5m/15m Orderflow Imbalance & CHoCH, 1m/5m VWAP Micro-Slope, 200 EMA, RSI, MACD, CVD) and requires at least 9/10 confirmations alongside 6+/10 bot consensus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Active Strategy:</span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-slate-900 text-white shadow-xs">
            {CONFIRMATION_STRATEGIES[activeStrategy]?.badge || 'Multi-Confluence'}
          </span>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {strategies.map((strat) => {
          const isSelected = activeStrategy === strat.id;

          return (
            <div
              key={strat.id}
              id={`strat-card-${strat.id}`}
              onClick={() => !isUpdatingStrategy && onSelectStrategy(strat.id)}
              onMouseEnter={() => setHoveredStrat(strat.id)}
              onMouseLeave={() => setHoveredStrat(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-blue-500/50 shadow-md'
                  : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {strat.badge}
                  </span>
                  
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold tracking-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {strat.name}
                </h3>
                <p className={`text-[11px] leading-relaxed mb-3 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {strat.tagline}
                </p>

                {/* Primary Indicators Required */}
                <div className="space-y-1 pt-2 border-t border-slate-200/40">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                    Required Indicator Confluences ({strat.minConfluencePercent}% Min):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {strat.primaryIndicators.map((ind, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isSelected 
                            ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[11px] font-mono">
                <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                  Risk: <strong>{strat.riskStyle}</strong>
                </span>

                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {isSelected ? 'Enabled' : 'Activate Mode'}
                  {!isSelected && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Institutional Confirmation Safeguard Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Institutional Execution Principle:</strong> The fleet will only enter a staged trade when a candidate satisfies the selected strategy's multi-indicator confirmation matrix. If market conditions are choppy or noisy, bots automatically stand down to preserve the $1,000 master capital.
        </div>
      </div>
    </div>
  );
};
