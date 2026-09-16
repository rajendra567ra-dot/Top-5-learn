import React from 'react';
import { RotateCcw, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        id="reset-confirm-modal-box"
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
            <RotateCcw className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">Reset Arena Starting Balances & Counters?</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
            This action resets bot balances back to <strong>$100.00 starting portfolios</strong> and clears active/closed trade counters.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Brain & Lessons Learned are 100% Preserved:</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            ✓ Auto-adapted strategies, calibrated conviction levels, and multi-coin mistake lessons remain fully intact.
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">What will be reset:</div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
            <span>• Bot portfolio balances → Exactly $100.00 each</span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
            <span>• Win rates and trade counters → 0W / 0L</span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
            <span>• Active open trades → Cleared</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            Cancel
          </button>

          <button
            id="confirm-reset-arena-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Reset to $100</span>
          </button>
        </div>
      </div>
    </div>
  );
};
