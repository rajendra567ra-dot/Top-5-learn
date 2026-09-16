import React, { useState } from 'react';
import { 
  Send, 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Clock, 
  Award, 
  FileText,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { ArenaFleetState, TelegramConfig } from '../types';

interface TelegramHubViewProps {
  state: ArenaFleetState;
  onUpdateConfig: (config: Partial<TelegramConfig>) => void;
  onSendTest: () => void;
  onTriggerHourly: () => void;
}

export const TelegramHubView: React.FC<TelegramHubViewProps> = ({
  state,
  onUpdateConfig,
  onSendTest,
  onTriggerHourly,
}) => {
  const { telegramConfig, telegramLogs } = state;
  const [botToken, setBotToken] = useState(telegramConfig.botToken || '');
  const [chatId, setChatId] = useState(telegramConfig.chatId || '');
  const [enabled, setEnabled] = useState(telegramConfig.enabled || false);

  const [notifyOnTradeOpen, setNotifyOnTradeOpen] = useState(telegramConfig.notifyOnTradeOpen ?? false);
  const [notifyOnTP1, setNotifyOnTP1] = useState(telegramConfig.notifyOnTP1 ?? false);
  const [notifyOnTP2, setNotifyOnTP2] = useState(telegramConfig.notifyOnTP2 ?? false);
  const [notifyOnStopLoss, setNotifyOnStopLoss] = useState(telegramConfig.notifyOnStopLoss ?? false);
  const [notifyHourlySummary, setNotifyHourlySummary] = useState(telegramConfig.notifyHourlySummary ?? true);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync inputs if remote config changes and user hasn't typed different credentials
  React.useEffect(() => {
    if (telegramConfig.botToken && !botToken) {
      setBotToken(telegramConfig.botToken);
    }
    if (telegramConfig.chatId && !chatId) {
      setChatId(telegramConfig.chatId);
    }
    if (telegramConfig.enabled !== undefined) {
      setEnabled(telegramConfig.enabled);
    }
  }, [telegramConfig.botToken, telegramConfig.chatId, telegramConfig.enabled]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      botToken,
      chatId,
      enabled,
      notifyOnTradeOpen,
      notifyOnTP1,
      notifyOnTP2,
      notifyOnStopLoss,
      notifyHourlySummary,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Top 10 Performing Bots for preview
  const top10Bots = [...state.bots]
    .sort((a, b) => b.portfolioBalance - a.portfolioBalance)
    .slice(0, 10);

  return (
    <div id="telegram-hub-view" className="space-y-6 text-slate-900">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Telegram 1-Hour Top 10 Intelligence Dispatcher
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Automatically formats and broadcasts Top 10 bot rankings, 24/7 server uptime, and active positions every 60 minutes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tg-send-test-btn"
              onClick={onSendTest}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Ping</span>
            </button>

            <button
              id="tg-trigger-hourly-btn"
              onClick={onTriggerHourly}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Dispatch Hourly Report Now</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Telegram Configuration Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Telegram Bot API Credentials
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enabled && botToken && chatId ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {enabled && botToken && chatId ? 'Dispatches Active' : 'Enter Credentials Below'}
            </span>
          </div>

          {/* Current Live Delivery Status Banner */}
          {telegramConfig.lastStatus && (
            <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
              telegramConfig.lastStatus.includes('Delivered') || telegramConfig.lastStatus.includes('SENT')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : telegramConfig.lastStatus.includes('Failed') || telegramConfig.lastStatus.includes('Error')
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="font-bold">Last Status:</span>
              <span className="truncate">{telegramConfig.lastStatus}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Telegram Bot Token:
              </label>
              <input
                id="tg-bot-token-input"
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                From @BotFather on Telegram (Optional: logs show in audit stream if empty).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Telegram Chat / Group / Channel ID:
              </label>
              <input
                id="tg-chat-id-input"
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="@my_channel_name or -100123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Notification Event Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 block text-xs">
                  Hourly Intelligence Dispatch:
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Hourly Only Mode Active
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/50 p-2 rounded-xl border border-emerald-200">
                <input
                  type="checkbox"
                  checked={notifyHourlySummary}
                  onChange={(e) => setNotifyHourlySummary(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-900 font-bold text-xs">Hourly Top 10 Leaderboard &amp; 24/7 Cloud Uptime Report</span>
              </label>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Trade-by-Trade Data Stream Suppressed</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Per your mandate, individual trade events (Open, TP1, TP2, SL) are suppressed from broadcasting to Telegram. Only the consolidated 1-hour intelligence report is delivered every 60 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-bold">Enable Telegram Live Broadcasting</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs"
              >
                {saveSuccess ? '✓ Saved Successfully' : 'Save Telegram Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Telegram Hourly Report Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                Next 60-Minute Broadcast Preview
              </h3>
              <span className="text-[10px] font-mono text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                Hourly Auto-Trigger Active
              </span>
            </div>

            {/* Telegram Message Mockup Container */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[11px] text-slate-800 space-y-1.5 shadow-2xs overflow-y-auto max-h-72">
              <div className="font-bold text-slate-900">📊 ═════════════════════════ 📊</div>
              <div className="font-bold text-slate-900">⚡️ APEX 40 BOT ARENA — 1-HOUR RECAP ⚡️</div>
              <div className="text-slate-500">🕒 {new Date().toUTCString()}</div>
              <div className="font-bold text-slate-900">═══════════════════════════════</div>
              <div>💰 Total Arena Capital: <strong>${state.totalArenaBalance.toFixed(2)}</strong> ({state.totalArenaPnL >= 0 ? '+' : ''}${state.totalArenaPnL.toFixed(2)})</div>
              <div>🏆 Arena Win Rate: <strong>{state.arenaWinRate}%</strong> ({state.totalArenaWins}W / {state.totalArenaLosses}L)</div>
              <div>⚡️ Active Running Trades: <strong>{state.activeTrades.length} / 200 Max</strong></div>
              <div>🛡 Strict Rules: <strong>50% TP1 (SL to BE) → 50% TP2 (Full Close, No Runner)</strong></div>
              <div className="pt-1 font-bold text-slate-900">🏅 TOP 10 RANKED BOT FLEET:</div>
              {top10Bots.map((b, idx) => (
                <div key={b.id} className="text-slate-700">
                  {idx + 1}. <strong>{b.serialNumber} ({b.name})</strong> — ${b.portfolioBalance.toFixed(2)} | {b.winRate}% WR | Gen {b.aiBrain.evolutionGeneration || 1}
                </div>
              ))}
              <div className="pt-1 text-slate-500">🤖 40 Bots Active • 300+ Verified Market Universe Scanner Engine</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            This message is formatted and pushed to your configured Telegram channel every hour automatically.
          </p>
        </div>

      </div>

      {/* Broadcast Log Stream */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          Recent Telegram Dispatch Logs ({telegramLogs.length})
        </h3>

        {telegramLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
            No dispatches sent yet. Use the "Dispatch Hourly Report Now" button or "Send Test Ping" above.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {telegramLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-mono line-clamp-1">{log.message}</div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
