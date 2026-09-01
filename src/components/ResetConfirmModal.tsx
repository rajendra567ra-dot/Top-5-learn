import React from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fadeIn">
      <div 
        id="reset-confirm-modal"
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl space-y-4 font-sans"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-rose-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base text-slate-900 font-bold">Reset Master Fleet Portfolio?</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This will reset the unified Master Portfolio back to its initial <strong className="text-emerald-700 font-semibold">$1,000.00 base balance</strong>, clear active running positions, reset stage statistics to baseline, and restart the 24/7 autonomous consensus engine.
        </p>

        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          ⚠️ Action cannot be undone. All 10 specialist engines will resume autonomous scanning from $1,000.00 base capital.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-reset-portfolio-btn"
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to $1,000 Base</span>
          </button>
        </div>
      </div>
    </div>
  );
};
