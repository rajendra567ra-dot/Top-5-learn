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
          <h3 className="text-base font-bold text-slate-900">Reset Arena to Fresh $100 Accounts?</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
            This action will reset all <strong>40 AI bots</strong> back to a fresh <strong>$100.00 starting portfolio</strong> ($4,000 total arena capital), clear all active and closed trade histories, and initialize baseline learning memories.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">What will be reset:</div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
            <span>• All 40 bot balances → Exactly $100.00 each</span>
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
