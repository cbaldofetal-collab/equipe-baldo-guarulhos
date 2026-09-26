import React from 'react';
import { Radio, X } from 'lucide-react';

interface LiveToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 text-xs">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <div className="flex-1">
          <p className="font-semibold text-emerald-400 text-[10px] uppercase tracking-wider">
            Atualização em Tempo Real
          </p>
          <p className="text-slate-200 line-clamp-2">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
