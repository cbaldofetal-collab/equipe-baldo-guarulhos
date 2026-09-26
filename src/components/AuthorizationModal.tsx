import React, { useState } from 'react';
import { X, Lock, Unlock, Check } from 'lucide-react';
import { Doctor } from '../types';

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  currentDoctor: Doctor;
  onAuthorizationChange: (doctorId: string, authorized: boolean) => Promise<void>;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  isOpen,
  onClose,
  doctors,
  currentDoctor,
  onAuthorizationChange,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen || !currentDoctor?.is_coordinator) return null;

  const handleToggle = async (doctorId: string, currentStatus: boolean) => {
    setLoading(doctorId);
    try {
      await onAuthorizationChange(doctorId, !currentStatus);
    } finally {
      setLoading(null);
    }
  };

  // Filter out the coordinator from the list
  const otherDoctors = doctors.filter(d => d.id !== currentDoctor.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                Gerenciar Acessos
              </h3>
              <p className="text-xs text-slate-500">
                Autorize médicos para gerenciar a escala
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {otherDoctors.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-200/60">
              Nenhum outro médico cadastrado.
            </div>
          ) : (
            otherDoctors.map(doctor => (
              <div
                key={doctor.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-slate-300 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">
                    {doctor.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doctor.specialty}
                  </p>
                  {doctor.authorized_to_manage && (
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs text-emerald-700 font-medium">Autorizado para gerenciar</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(doctor.id, doctor.authorized_to_manage || false)}
                  disabled={loading === doctor.id}
                  className={`p-2.5 rounded-xl transition ${
                    doctor.authorized_to_manage
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={doctor.authorized_to_manage ? 'Remover autorização' : 'Autorizar'}
                >
                  {loading === doctor.id ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : doctor.authorized_to_manage ? (
                    <Unlock className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
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
