import React from 'react';
import { 
  X, 
  Activity, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowLeftRight, 
  CheckCircle2, 
  UserPlus 
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  isConnected: boolean;
}

export const AuditFeedDrawer: React.FC<AuditFeedDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  isConnected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-['Outfit']">
                Histórico em Tempo Real
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                <span>{isConnected ? 'Conectado • Sincronização viva' : 'Reconectando...'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs Stream */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhuma alteração registrada ainda.
            </div>
          ) : (
            logs.map(log => {
              const date = new Date(log.timestamp);
              const timeFormatted = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dateFormatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1 hover:bg-white hover:border-slate-200 transition"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{log.authorName}</span>
                    <span className="text-slate-400">{dateFormatted} às {timeFormatted}</span>
                  </div>
                  <p className="text-slate-600 leading-snug">{log.summary}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
          Todas as alterações são replicadas instantaneamente para todos os membros da equipe.
        </div>

      </div>
    </div>
  );
};
