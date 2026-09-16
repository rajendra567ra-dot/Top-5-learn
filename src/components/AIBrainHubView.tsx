import React, { useState } from 'react';
import { 
  Brain, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Search, 
  Award, 
  TrendingUp, 
  RefreshCw,
  Home,
  Sparkles,
  Bot,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { ArenaBot, BotBrainMistakeLog } from '../types';

interface AIBrainHubViewProps {
  bots: ArenaBot[];
  learningCyclesCompleted: number;
  onReturnHome?: () => void;
  onSelectBot?: (bot: ArenaBot) => void;
}

export const AIBrainHubView: React.FC<AIBrainHubViewProps> = ({ 
  bots, 
  learningCyclesCompleted,
  onReturnHome,
  onSelectBot
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string>('ALL');

  const allMistakeLogs: { bot: ArenaBot; log: BotBrainMistakeLog }[] = [];
  bots.forEach((bot) => {
    bot.aiBrain.mistakeMemory.forEach((log) => {
      allMistakeLogs.push({ bot, log });
    });
  });

  const filteredLogs = selectedBotId === 'ALL'
    ? allMistakeLogs
    : allMistakeLogs.filter(item => item.bot.id === selectedBotId);

  const selectedBot = bots.find(b => b.id === selectedBotId);

  return (
    <div id="ai-brain-hub-view" className="space-y-6 text-slate-900">
      
      {/* Top Banner: Neural Brain Architecture */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {bots.length} Autonomous AI Brains & Universal Multi-Coin Strategy Adaptation
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Universe-Wide Adaptation Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Every bot continuously diagnoses past trades. When a bad trade occurs, lessons and adapted parameters are synthesized across <strong>ALL 300+ coins</strong> to protect future entries everywhere—not just on the coin that had the bad trade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReturnHome && (
              <button
                id="brain-hub-return-home-btn"
                onClick={onReturnHome}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span>Return to Arena Home</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold shadow-2xs">
              ⚡️ {learningCyclesCompleted} Evolutions Completed
            </div>
          </div>
        </div>

        {/* 3 Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              1. Root Cause Diagnosis
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Analyzes orderflow decay, false breakout traps, and adverse wick volatility to pinpoint failure mechanisms from closed trades.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-600" />
              2. Anti-Repeat Heuristics
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Synthesizes permanent gatekeeper barriers preventing the bot from entering matching adverse market conditions again.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              3. Automatic Strategy Evolution
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Dynamically tightens RSI inner corridors, calibrates dynamic leverage, enforces 3% dynamic capital allocation, and optimizes structural trailing stops.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Bot Strategy Evolution Highlight */}
      {selectedBot && selectedBot.aiBrain.adaptedParameters && (
        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold text-purple-900">
                {selectedBot.serialNumber} — {selectedBot.name} [Generation {selectedBot.aiBrain.evolutionGeneration || 1} Auto-Adapted Strategy Parameters]
              </h3>
            </div>
            {onSelectBot && (
              <button
                onClick={() => onSelectBot(selectedBot)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 underline"
              >
                Inspect Full Bot Details →
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white border border-purple-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">RSI Long Corridor</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {selectedBot.aiBrain.adaptedParameters.rsiMinLong} - {selectedBot.aiBrain.adaptedParameters.rsiMaxLong}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-purple-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Min RVOL Gate</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {selectedBot.aiBrain.adaptedParameters.minRvol}x Volume
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-purple-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Min Confidence Req</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {selectedBot.aiBrain.adaptedParameters.minConfidenceScore}% Conviction
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white border border-purple-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">TP1 Target Allocation</div>
              <div className="font-mono font-bold text-emerald-700 mt-0.5">
                {selectedBot.aiBrain.adaptedParameters.tp1ProfitTargetPercent || 50}% Booked (SL → Entry)
              </div>
            </div>
          </div>

          <p className="text-[11px] text-purple-900 font-medium">
            <strong>Latest Adaptation Rationale:</strong> {selectedBot.aiBrain.adaptedParameters.lastAdaptedReason}
          </p>
        </div>
      )}

      {/* Bot Filter & Log Viewer */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
        
        {/* Filter by Bot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Mistake Memory & Strategy Adaptation Audit Feed
          </h3>

          <div className="flex items-center gap-2">
            {onReturnHome && (
              <button
                onClick={onReturnHome}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors border border-slate-200"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span>Arena Home</span>
              </button>
            )}

            <select
              id="ai-brain-bot-filter"
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              <option value="ALL">All {bots.length} Bots Combined Feed</option>
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.serialNumber} — {b.name} ({b.aiBrain.mistakesLearnedCount} Lessons, Gen {b.aiBrain.evolutionGeneration || 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Feed */}
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Flawless Setup Discipline</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              Zero loss mistakes recorded under the current filter. All 40 bots maintain strict 9/10 confirmation parameters with tight dynamic risk controls.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(({ bot, log }) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      {bot.serialNumber} ({bot.name})
                    </span>
                    <span className="font-bold text-slate-900">{log.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-mono font-bold border border-rose-200">
                      -{log.lossPercent.toFixed(1)}% (-${log.lossAmountUsd.toFixed(2)})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs text-slate-700">
                  <strong className="text-rose-700">Root Cause:</strong> {log.rootCause}
                </div>

                <div className="text-xs text-slate-700">
                  <strong className="text-amber-800">Preventative Lesson:</strong> {log.preventativeLesson}
                </div>

                <div className="text-xs text-slate-700">
                  <strong className="text-emerald-700">Adaptation Applied:</strong> {log.adaptationApplied}
                </div>

                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span><strong>Anti-Repeat Barrier Active:</strong> {log.antiRepeatRuleAdded}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
