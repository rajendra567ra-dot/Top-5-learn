import React, { useState } from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  Sliders, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Bot, 
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { TradingBot, BotLearningNote } from '../types';

interface MistakeLearningViewProps {
  bots: TradingBot[];
  onTriggerGeminiPostMortem: (botId: string, customMistakeText?: string) => Promise<void>;
}

export const MistakeLearningView: React.FC<MistakeLearningViewProps> = ({
  bots,
  onTriggerGeminiPostMortem,
}) => {
  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scenarioPrompt, setScenarioPrompt] = useState('');

  // Flatten all learning notes
  const allNotes: { note: BotLearningNote; bot: TradingBot }[] = [];
  bots.forEach((bot) => {
    bot.learningNotes.forEach((note) => {
      allNotes.push({ note, bot });
    });
  });

  // Sort notes by latest timestamp
  allNotes.sort((a, b) => b.note.timestamp - a.note.timestamp);

  const filteredNotes = selectedBotFilter === 'ALL'
    ? allNotes
    : allNotes.filter(n => n.bot.id === selectedBotFilter);

  const handleRunCustomPostMortem = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const targetBotId = selectedBotFilter === 'ALL' ? 'bot-1' : selectedBotFilter;
      await onTriggerGeminiPostMortem(targetBotId, scenarioPrompt || undefined);
      setScenarioPrompt('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="mistake-learning-view" className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  AI BRAIN & MISTAKE LEARNING ENGINE
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Adaptive Neural Memory
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Each bot continuously audits past bad trades, identifies failure points (false breakouts, liquidity traps, slippage), and adjusts internal heuristic filters to improve future executions like a human quant trader.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono shrink-0">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Mistakes Learned</div>
            <div className="text-xl font-bold text-purple-700 mt-0.5">{allNotes.length} Adaptations</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Rules Auto-Applied to 24/7 Engine</div>
          </div>
        </div>
      </div>

      {/* Interactive Gemini 3.7 Post-Mortem Simulator */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Prompt Gemini 3.7 Brain AI Post-Mortem & Memory Update</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="scenario-input"
            type="text"
            value={scenarioPrompt}
            onChange={(e) => setScenarioPrompt(e.target.value)}
            placeholder="e.g., Shorted $WIF at resistance but sudden whale inflow caused short squeeze; extract lesson & adjust rules..."
            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 font-sans"
          />
          <button
            id="run-postmortem-btn"
            onClick={handleRunCustomPostMortem}
            disabled={isAnalyzing}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            <BrainCircuit className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Failure...' : 'Analyze Mistake & Update Brain'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-500 font-bold uppercase mr-1">Filter Bot:</span>
        <button
          onClick={() => setSelectedBotFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
            selectedBotFilter === 'ALL'
              ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Bots ({allNotes.length})
        </button>
        {bots.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBotFilter(b.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border whitespace-nowrap ${
              selectedBotFilter === b.id
                ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {b.name} ({b.learningNotes.length})
          </button>
        ))}
      </div>

      {/* Memory Journal Timeline Cards */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Mistakes Recorded For This Filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              All trades executed cleanly with positive ROI. If any trade hits the 3% stop-loss, the Brain AI will automatically record the post-mortem analysis here.
            </p>
          </div>
        ) : (
          filteredNotes.map(({ note, bot }) => {
            const isLong = note.direction === 'LONG';

            return (
              <div
                key={note.id}
                id={`learning-card-${note.id}`}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
              >
                {/* Header: Bot Name + Trade Info + Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-bold border"
                      style={{
                        backgroundColor: `${bot.accentColor}10`,
                        borderColor: `${bot.accentColor}30`,
                        color: bot.accentColor,
                      }}
                    >
                      {bot.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1 font-mono">
                      <span>{note.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.2 rounded font-bold ${
                        isLong ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {note.direction}
                      </span>
                    </span>
                    <span className="text-xs font-mono text-rose-600 font-bold">
                      Loss: -${note.lossAmount.toFixed(2)} (Hard Capped 3%)
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Analyzed: {new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {/* 3 Key Breakdown Blocks: Mistake -> Lesson -> Parameter Adjusted */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  
                  {/* Mistake */}
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="text-[11px] uppercase font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      1. Root Mistake Identified
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {note.mistakeIdentified}
                    </p>
                  </div>

                  {/* Lesson */}
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                    <div className="text-[11px] uppercase font-bold text-amber-700 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      2. Learned Tactical Rule
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {note.learnedLesson}
                    </p>
                  </div>

                  {/* Parameter Adjustment */}
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                    <div className="text-[11px] uppercase font-bold text-purple-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                      3. Engine Parameter Adjusted
                    </div>
                    <p className="text-purple-900 text-xs font-mono leading-relaxed font-semibold">
                      {note.parameterAdjustment}
                    </p>
                  </div>

                </div>

                {/* Confidence Impact Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Adaptive Heuristic Weight Updated &amp; In Effect
                  </span>
                  <span>Confidence Level: {note.confidenceScore}%</span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
