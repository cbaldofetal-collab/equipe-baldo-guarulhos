import React, { useState } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Doctor, Shift } from '../types';

interface TradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  currentDoctor: Doctor;
  doctors: Doctor[];
  onSubmit: (shiftId: string, note: string, targetDoctorId?: string) => void;
}

export const TradeRequestModal: React.FC<TradeRequestModalProps> = ({
  isOpen,
  onClose,
  shift,
  currentDoctor,
  doctors,
  onSubmit,
}) => {
  const [note, setNote] = useState('');
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !shift) return null;

  const handleSubmit = async () => {
    if (!note.trim()) {
      alert('Por favor, descreva o motivo da troca');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(shift.id, note, targetDoctorId || undefined);
      setNote('');
      setTargetDoctorId('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherDoctors = doctors.filter(d => d.id !== currentDoctor.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Solicitar Troca</h2>
              <p className="text-xs text-slate-600">Plantão de {shift.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Info Box */}
          <div className="flex gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-teal-900">
              <p className="font-semibold">Solicitação será publicada no mural</p>
              <p className="text-xs mt-1">Outros médicos poderão aceitar a troca</p>
            </div>
          </div>

          {/* Shift Details */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm text-slate-600 mb-2">Plantão para trocar:</div>
            <div className="font-semibold text-slate-900">
              {shift.start_time} - {shift.end_time} ({shift.duration_hours}h)
            </div>
            <div className="text-sm text-slate-600 mt-1">{shift.sector}</div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Motivo da Troca *
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Compromisso familiar, doença, etc..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              rows={4}
            />
          </div>

          {/* Target Doctor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Trocar com quem? (Opcional)
            </label>
            <select
              value={targetDoctorId}
              onChange={(e) => setTargetDoctorId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Qualquer médico pode aceitar</option>
              {otherDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !note.trim()}
            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {isSubmitting ? 'Enviando...' : 'Solicitar Troca'}
          </button>
        </div>
      </div>
    </div>
  );
};
