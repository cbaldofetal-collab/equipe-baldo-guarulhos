import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Users,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Doctor, Shift } from '../types';

interface ResetScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoctor: Doctor;
  totalShifts: number;
  onSuccess: (message: string) => void;
}

export const ResetScheduleModal: React.FC<ResetScheduleModalProps> = ({
  isOpen,
  onClose,
  currentDoctor,
  totalShifts,
  onSuccess,
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearSchedule = async () => {
    setIsClearing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/schedule/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: currentDoctor.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao limpar escala');

      onSuccess('✅ Escala zerada com sucesso! Todos os plantões foram removidos e o sistema está 100% pronto para testes da equipe.');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao zerar escala.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gerenciamento da Escala</h3>
              <p className="text-xs text-slate-400">Limpar para testes da equipe ou restaurar dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-slate-800 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option 1: Clear All to Blank */}
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Deixar Escala em Branco (Modo Teste)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Remove todos os plantões e solicitações de troca da base de dados, deixando a grade 100% limpa para a equipe começar a preencher do zero.
                </p>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Os cadastros dos médicos e contatos são <strong>preservados</strong>.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClearSchedule}
              disabled={isClearing || totalShifts === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                totalShifts === 0
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-rose-600/20'
              }`}
            >
              <Trash2 className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
              <span>
                {totalShifts === 0
                  ? 'A escala já está completamente em branco'
                  : isClearing
                  ? 'Limpando plantões...'
                  : `Deixar em Branco (Remover ${totalShifts} plantões)`}
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
