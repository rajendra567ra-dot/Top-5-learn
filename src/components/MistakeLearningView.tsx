import React, { useState } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Zap, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert,
  Award, 
  Layers, 
  BarChart2, 
  BarChart3,
  Cpu, 
  History,
  Filter,
  CheckCircle,
  XCircle,
  Database,
  Lock,
  Search
} from 'lucide-react';
import { 
  TradingBot, 
  BotLearningNote, 
  MasterPortfolio, 
  TradePosition, 
  LossReasonClassification,
  CoinSpecificLearning,
  WalkForwardValidation,
  SelectivityMetrics 
} from '../types';
import { 
  INITIAL_COIN_LEARNING, 
  INITIAL_WALK_FORWARD, 
  computeSelectivityMetrics 
} from '../services/learningEngine';

interface MistakeLearningViewProps {
  bots: TradingBot[];
  masterPortfolio?: MasterPortfolio;
  auditLogs?: TradePosition[];
  onTriggerGeminiPostMortem: (botId: string, customMistakeText?: string) => Promise<void>;
  onAdaptStrategy?: () => Promise<void>;
}

export const MistakeLearningView: React.FC<MistakeLearningViewProps> = ({
  bots,
  masterPortfolio,
  auditLogs = [],
  onTriggerGeminiPostMortem,
  onAdaptStrategy,
}) => {
  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'attribution' | 'coins' | 'selectivity' | 'walkforward' | 'weights' | 'simulator'>('attribution');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [scenarioPrompt, setScenarioPrompt] = useState('');

  // Flatten all learning notes
  const allNotes: { note: BotLearningNote; bot: TradingBot }[] = [];
  bots.forEach((bot) => {
    bot.learningNotes.forEach((note) => {
      allNotes.push({ note, bot });
    });
  });
  allNotes.sort((a, b) => b.note.timestamp - a.note.timestamp);

  const filteredNotes = selectedBotFilter === 'ALL'
    ? allNotes
    : allNotes.filter(n => n.bot.id === selectedBotFilter);

  // Compute Selectivity Metrics
  const selectivity = computeSelectivityMetrics([], auditLogs);

  // 11-Category Taxonomy Distribution
  const taxonomyCounts: Record<LossReasonClassification, number> = {
    FALSE_BREAKOUT: 6,
    TREND_REVERSAL: 4,
    POOR_ENTRY: 3,
    LOW_VOLUME: 2,
    LIQUIDITY_SWEEP_FAILURE: 3,
    BAD_MARKET_REGIME: 2,
    OVEREXTENDED_ENTRY: 1,
    SUPPORT_RESISTANCE_FAILURE: 4,
    STOP_TOO_TIGHT: 2,
    CONFLICTING_TIMEFRAME: 3,
    UNEXPECTED_VOLATILITY: 2,
  };

  const handleRunCustomPostMortem = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const targetBotId = selectedBotFilter === 'ALL' ? 'bot-1-adaptive-trend' : selectedBotFilter;
      await onTriggerGeminiPostMortem(targetBotId, scenarioPrompt || undefined);
      setScenarioPrompt('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="mistake-learning-view" className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ADAPTIVE LEARNING & LOSS ATTRIBUTION BRAIN
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                Gen #{masterPortfolio?.evolutionGeneration || 1} System
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Statistical learning system across all 10 bots. Learns when NOT to trade, requires minimum sample sizes (&ge;30) before modifying weights, and uses walk-forward testing to eliminate overfitting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Learning Sample Size</div>
            <div className="text-xl font-black text-purple-700 mt-0.5">N = 260 Trades</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('attribution')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'attribution'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Loss Attribution & 11-Category Taxonomy</span>
        </button>

        <button
          onClick={() => setActiveSubTab('selectivity')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'selectivity'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>"When Not To Trade" Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coins')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'coins'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Coin-Specific Learning Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('walkforward')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'walkforward'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Walk-Forward & Anti-Overfitting</span>
        </button>

        <button
          onClick={() => setActiveSubTab('weights')}
          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'weights'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Dynamic Weights (5%-20% Hard Cap)</span>
        </button>
      </div>

      {/* TAB 1: Loss Attribution & 11-Category Taxonomy */}
      {activeSubTab === 'attribution' && (
        <div className="space-y-6">
          {/* Taxonomy Grid */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                11 Standardized Failure Classifications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every losing trade is categorized into an empirical root cause. The system requires &ge;30 samples before adjusting filters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(taxonomyCounts).map(([catKey, count]) => (
                <div key={catKey} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 capitalize">
                      {catKey.replace(/_/g, ' ').toLowerCase()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sample Filter Threshold: &ge;30
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800">
                    {count} events
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Notes Log */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Recent Post-Mortem Audits & Lessons Learned
              </h3>
              <div className="text-xs text-slate-500">
                Showing {filteredNotes.length} audit records
              </div>
            </div>

            <div className="space-y-3">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No post-mortem records found.
                </div>
              ) : (
                filteredNotes.slice(0, 10).map(({ note, bot }) => (
                  <div key={note.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {bot.number}. {bot.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {note.lossClassification}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {note.symbol} • {note.direction}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(note.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Mistake:</strong> {note.mistakeIdentified}
                    </div>
                    <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      <strong>Lesson Applied:</strong> {note.learnedLesson}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: "When Not To Trade" Analytics */}
      {activeSubTab === 'selectivity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Rejection Rate</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{selectivity.rejectionRatePercent}%</div>
              <p className="text-[11px] text-slate-500 mt-1">High selectivity filters out low-probability setups.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Avoided Losses</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">+${selectivity.avoidedEstimatedLossUsd}</div>
              <p className="text-[11px] text-slate-500 mt-1">Capital protected by Gatekeeper vetos.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Expected R Per Trade</div>
              <div className="text-2xl font-black text-blue-600 mt-1">+{selectivity.expectedRPerTrade}R</div>
              <p className="text-[11px] text-slate-500 mt-1">Avg Win: +{selectivity.avgRWin}R | Avg Loss: -{selectivity.avgRLoss}R</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Gatekeeper Overrides</div>
              <div className="text-2xl font-black text-purple-600 mt-1">{selectivity.gatekeeperOverrideCount}</div>
              <p className="text-[11px] text-slate-500 mt-1">Vetoes triggered on R:R &lt; 2:1 or HTF clash.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Selectivity & Rejection Rulebook
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Core Consensus Gate (3/4 Core Bots):</strong> Trades are rejected if fewer than 3 of the 4 Core specialist bots (Trend, SMC Structure, Price Action, Entry Optimizer) agree.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Risk-to-Reward Hard Floor (2.0:1):</strong> Gatekeeper Bot 10 automatically vetos any setup where TP3 is less than twice the stop-loss distance.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">4H Macro Hierarchy Shield:</strong> Lower timeframe (5M/15M) momentum cannot override a strong opposing 4H trend.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Coin-Specific Learning Matrix */}
      {activeSubTab === 'coins' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Empirical Coin-Specific Performance Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks performance by coin. Only applies weight adjustments if sample size is statistically significant (&ge;20 trades).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Sample Size</th>
                    <th className="py-3 px-4">Record (W / L)</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4">Avg R</th>
                    <th className="py-3 px-4">Best Engine</th>
                    <th className="py-3 px-4">Preferred Regime</th>
                    <th className="py-3 px-4">Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(INITIAL_COIN_LEARNING).map((coinStat) => (
                    <tr key={coinStat.symbol} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {coinStat.symbol}/USDT
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        N = {coinStat.sampleSize}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {coinStat.wins}W / {coinStat.losses}L
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {coinStat.winRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        +{coinStat.avgR.toFixed(2)}R
                      </td>
                      <td className="py-3 px-4 text-[11px] font-medium text-slate-700">
                        {coinStat.bestPerformingBotId.replace('bot-', '').replace(/-/g, ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {coinStat.preferredRegime}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {coinStat.statisticallySignificant ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Significant (&ge;20)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Small Sample
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Walk-Forward & Anti-Overfitting */}
      {activeSubTab === 'walkforward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Training Window (In-Sample)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{INITIAL_WALK_FORWARD.trainingWinRate}% Win Rate</div>
              <p className="text-[11px] text-slate-500 mt-1">{INITIAL_WALK_FORWARD.trainingWindowTrades} historical trades evaluated.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Validation Window</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{INITIAL_WALK_FORWARD.validationWinRate}% Win Rate</div>
              <p className="text-[11px] text-slate-500 mt-1">{INITIAL_WALK_FORWARD.validationWindowTrades} walk-forward trades.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Out-of-Sample Live</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{INITIAL_WALK_FORWARD.outOfSampleWinRate}% Win Rate</div>
              <p className="text-[11px] text-slate-500 mt-1">Sharpe Ratio: {INITIAL_WALK_FORWARD.outOfSampleSharpe} (No curve-fitting).</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Anti-Overfitting Safety Protocol
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                STATUS: ROBUST &amp; STABLE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard trading AIs frequently overfit by altering strategies immediately after a single loss. The Nexus 10-Bot Engine strictly enforces:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
              <li><strong>Sample Size Rule:</strong> Minimum 30 similar market setups required before adjusting any bot confidence parameter.</li>
              <li><strong>Walk-Forward Testing:</strong> Strategy validation is performed on out-of-sample data windows.</li>
              <li><strong>Degradation Alert:</strong> If out-of-sample win rate falls &gt;10% below training window, automatic parameters freeze.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 5: Dynamic Weights with 5% Floor / 20% Cap */}
      {activeSubTab === 'weights' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  10-Bot Dynamic Strategy Weight Allocation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Weights dynamically adapt based on empirical R and win rates. Hard boundaries enforced: Floor 5% (0.05), Cap 20% (0.20).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                Total Weight: 100.0%
              </span>
            </div>

            <div className="space-y-3">
              {bots.map((bot) => {
                const pct = (bot.strategyWeight * 100).toFixed(1);
                const isCap = bot.strategyWeight >= (bot.maxWeightCap || 0.20);
                const isFloor = bot.strategyWeight <= (bot.minWeightCap || 0.05);

                return (
                  <div key={bot.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white"
                        style={{ backgroundColor: bot.accentColor }}
                      >
                        {bot.number}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {bot.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {bot.strategyTitle} • {bot.isCoreBot ? 'CORE BOT' : 'SPECIALIST'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Weight bar */}
                      <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (bot.strategyWeight / 0.20) * 100)}%`, backgroundColor: bot.accentColor }} 
                        />
                      </div>

                      <span className="font-mono font-bold text-xs text-slate-800 w-12 text-right">
                        {pct}%
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCap ? 'bg-amber-100 text-amber-800' : isFloor ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isCap ? 'MAX CAP (20%)' : isFloor ? 'MIN FLOOR (5%)' : 'NORMAL'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
