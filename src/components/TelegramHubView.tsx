import React, { useState } from 'react';
import { 
  Send, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  Zap,
  Trash2
} from 'lucide-react';
import { TelegramConfig, TelegramLog } from '../types';

interface TelegramHubViewProps {
  telegramConfig: TelegramConfig;
  telegramLogs: TelegramLog[];
  onOpenSetupModal: () => void;
  onSendTestMessage: () => Promise<void>;
  onSendFleetSummaryNow: () => Promise<void>;
  onClearLogs: () => void;
  onUpdateConfig: (config: Partial<TelegramConfig>) => void;
  isSending: boolean;
}

export const TelegramHubView: React.FC<TelegramHubViewProps> = ({
  telegramConfig,
  telegramLogs,
  onOpenSetupModal,
  onSendTestMessage,
  onSendFleetSummaryNow,
  onClearLogs,
  onUpdateConfig,
  isSending,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isConfigured = Boolean(telegramConfig.botToken && telegramConfig.chatId);

  return (
    <div id="telegram-hub-view" className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  TELEGRAM REAL-TIME DISPATCH HUB
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isConfigured 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isConfigured ? 'LIVE WEBHOOK CONNECTED' : 'SIMULATION MODE (NO TOKEN)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Sends automated real-time trade signals (Entries, TP hit &gt;$2, SL hit + AI brain learning post-mortems) and hourly performance digests directly to your private Telegram channel/chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="test-telegram-btn"
              onClick={onSendTestMessage}
              disabled={isSending}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <button
              id="send-now-telegram-btn"
              onClick={onSendFleetSummaryNow}
              disabled={isSending}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Hourly Report Now</span>
            </button>

            <button
              id="config-telegram-btn"
              onClick={onOpenSetupModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Configure Bot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* Toggle 1: Trade Opened */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Trade Opened Alert</span>
            <input
              type="checkbox"
              checked={telegramConfig.notifyOnTradeOpen}
              onChange={(e) => onUpdateConfig({ notifyOnTradeOpen: e.target.checked })}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Fires instantly when any of the 5 bots opens a Long/Short with 5% dynamic margin.
          </p>
        </div>

        {/* Toggle 2: Take Profit Hit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-700">Take-Profit Alerts (&gt;$2)</span>
            <input
              type="checkbox"
              checked={telegramConfig.notifyOnTakeProfit}
              onChange={(e) => onUpdateConfig({ notifyOnTakeProfit: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Dispatches realized profit amount, ROI %, and new compounded bot balance.
          </p>
        </div>

        {/* Toggle 3: Stop Loss Hit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-rose-700">Stop-Loss + AI Post-Mortem</span>
            <input
              type="checkbox"
              checked={telegramConfig.notifyOnStopLoss}
              onChange={(e) => onUpdateConfig({ notifyOnStopLoss: e.target.checked })}
              className="w-4 h-4 accent-rose-600 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Fires max 3% loss cap alert + full Brain AI root mistake & parameter adjustment.
          </p>
        </div>

        {/* Toggle 4: Hourly Summary */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-700">Periodic Digest</span>
            <select
              value={telegramConfig.summaryIntervalMinutes}
              onChange={(e) => onUpdateConfig({ summaryIntervalMinutes: Number(e.target.value) })}
              className="bg-slate-50 text-slate-900 text-xs px-2 py-0.5 rounded border border-slate-200"
            >
              <option value="15">Every 15 Min</option>
              <option value="30">Every 30 Min</option>
              <option value="60">Every 60 Min</option>
            </select>
          </div>
          <p className="text-[11px] text-slate-500">
            Automated fleet status report with 5-bot breakdown, combined ROI, and win rates.
          </p>
        </div>

      </div>

      {/* Terminal of Dispatched Messages */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              TELEGRAM DISPATCH CONSOLE LOGS ({telegramLogs.length} MESSAGES)
            </h3>
          </div>

          <button
            onClick={onClearLogs}
            className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto font-sans">
          {telegramLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No Telegram messages sent yet. Trigger a test dispatch or wait for an automated trade execution.
            </div>
          ) : (
            telegramLogs.map((log) => {
              const isCopied = copiedId === log.id;

              return (
                <div
                  key={log.id}
                  id={`telegram-log-${log.id}`}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 relative group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.type === 'TRADE_OPEN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        log.type === 'TAKE_PROFIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.type === 'STOP_LOSS' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {log.type}
                      </span>
                      <span>Target: {log.target}</span>
                      <span className={`text-[10px] font-bold ${log.status === 'SENT' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        [{log.status}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <button
                        onClick={() => handleCopy(log.id, log.message)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy message markdown"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <pre className="text-slate-800 whitespace-pre-wrap font-mono text-xs leading-relaxed overflow-x-auto p-3 bg-white rounded-lg border border-slate-200">
                    {log.message}
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
