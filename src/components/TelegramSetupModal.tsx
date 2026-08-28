import React, { useState } from 'react';
import { X, Send, Key, MessageSquare, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { TelegramConfig } from '../types';

interface TelegramSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TelegramConfig;
  onSaveConfig: (token: string, chatId: string) => void;
  onTestConnection: (token: string, chatId: string) => Promise<boolean>;
}

export const TelegramSetupModal: React.FC<TelegramSetupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
}) => {
  if (!isOpen) return null;

  const [token, setToken] = useState(config.botToken || '');
  const [chatId, setChatId] = useState(config.chatId || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!token || !chatId) {
      setTestResult({ success: false, message: 'Please enter both Bot Token and Chat ID.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection(token, chatId);
      if (ok) {
        setTestResult({ success: true, message: '✅ Connection successful! Test message dispatched to your Telegram.' });
      } else {
        setTestResult({ success: false, message: '❌ Verification failed. Check your Bot Token and Chat ID.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Error: ${err?.message || 'Failed to connect'}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(token, chatId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fadeIn">
      <div 
        id="telegram-setup-modal"
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Configure Telegram Bot Alerts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setup guide */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1.5 font-sans">
          <div className="text-blue-900 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            How to get your Telegram credentials:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
            <li>Open Telegram and message <strong className="text-slate-900">@BotFather</strong> to create a new bot and get your <strong className="text-blue-700 font-mono">Bot Token</strong>.</li>
            <li>Start a chat with your newly created bot (click <strong className="text-slate-900">/start</strong>).</li>
            <li>Message <strong className="text-slate-900">@userinfobot</strong> or <strong className="text-slate-900">@RawDataBot</strong> to find your numeric <strong className="text-blue-700 font-mono">Chat ID</strong>.</li>
          </ol>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-600 font-semibold text-[11px] mb-1.5 uppercase tracking-wide">
              Telegram Bot Token
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="telegram-token-input"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold text-[11px] mb-1.5 uppercase tracking-wide">
              Target Telegram Chat ID / Channel ID
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="telegram-chatid-input"
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 987654321 or -100123456789"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-3 rounded-xl text-xs border ${
            testResult.success 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium' 
              : 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            id="modal-test-telegram-btn"
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            {isTesting ? 'Verifying...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="modal-save-telegram-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
            >
              Save & Enable Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
