import React, { useState } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { Shift } from '../types';

const getDayName = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[d.getDay()];
};

interface ReplicateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onReplicate: (shiftId: string, months: number) => Promise<void>;
}

export const ReplicateShiftModal: React.FC<ReplicateShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  onReplicate,
}) => {
  const [months, setMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReplicate = async () => {
    if (!shift || months < 1) return;

    setIsSubmitting(true);
    try {
      await onReplicate(shift.id, months);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMonths(1);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Replicar Escala</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-4 text-center space-y-2">
            <Check className="w-8 h-8 text-green-600 mx-auto" />
            <p className="font-semibold text-green-900">Escala replicada com sucesso!</p>
            <p className="text-sm text-green-800">{months} mês(es) adicionado(s)</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm text-blue-900 font-medium">Plantão original:</p>
              <div className="bg-white rounded-xl p-3 space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Data:</span> {shift.date}
                </p>
                <p>
                  <span className="font-semibold">Horário:</span> {shift.start_time} - {shift.end_time}
                </p>
                <p>
                  <span className="font-semibold">Tipo:</span> {shift.shift_type}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Replicar para quantos meses?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={months}
                  onChange={e => setMonths(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <span className="text-sm text-slate-600">meses</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 3, 6, 12].map(m => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                      months === m
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="text-xs text-amber-800">
                <strong>💡 Dica:</strong> Será criado um plantão no mesmo dia da semana ({getDayName(new Date(shift.date))})
                e horário ({shift.start_time}-{shift.end_time}) dos próximos {months} meses.
              </p>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReplicate}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {isSubmitting ? 'Replicando...' : 'Replicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
