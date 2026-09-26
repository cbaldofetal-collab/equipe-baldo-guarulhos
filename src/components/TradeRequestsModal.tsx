import React from 'react';
import { 
  X, 
  ArrowLeftRight, 
  AlertCircle, 
  Check, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Ban 
} from 'lucide-react';
import { TradeRequest, Shift, Doctor } from '../types';
import { formatDateToPt, formatFriendlyDate } from '../utils/date';

interface TradeRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeRequest[];
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onAcceptTrade: (tradeId: string) => void;
  onCancelTrade: (tradeId: string) => void;
  onClaimShift: (shift: Shift) => void;
}

export const TradeRequestsModal: React.FC<TradeRequestsModalProps> = ({
  isOpen,
  onClose,
  trades,
  shifts,
  doctors,
  currentDoctor,
  onAcceptTrade,
  onCancelTrade,
  onClaimShift,
}) => {
  if (!isOpen) return null;

  const docMap = new Map<string, Doctor>(doctors.map(d => [d.id, d]));
  const shiftMap = new Map<string, Shift>(shifts.map(s => [s.id, s]));

  // Active trades pending
  const pendingTrades = trades.filter(t => t.status === 'pending');

  // Open shifts (vagos)
  const openShifts = shifts.filter(s => s.doctorId === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                Mural de Trocas & Plantões Vagos
              </h3>
              <p className="text-xs text-slate-500">
                Oportunidades de cobertura e solicitações da equipe uFetal
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Trade Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Solicitações de Troca Pendentes</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                  {pendingTrades.length}
                </span>
              </h4>
            </div>

            {pendingTrades.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-200/60">
                Nenhuma solicitação de troca em aberto no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTrades.map(trade => {
                  const shift = shiftMap.get(trade.shiftId);
                  const fromDoc = docMap.get(trade.fromDoctorId);
                  const targetDoc = trade.toDoctorId ? docMap.get(trade.toDoctorId) : null;
                  const isMine = trade.fromDoctorId === currentDoctor.id;

                  if (!shift) return null;

                  return (
                    <div
                      key={trade.id}
                      className="bg-white border border-amber-300 rounded-2xl p-4 shadow-xs hover:border-amber-400 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              {formatFriendlyDate(shift.date)}
                            </span>
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {shift.shiftType === 'sobreaviso'
                                ? 'Sobreaviso'
                                : `${shift.startTime} - ${shift.endTime}`}
                            </span>
                            <span className="text-xs text-teal-800 font-semibold">
                              {shift.sector}
                            </span>
                          </div>

                          <div className="mt-2 text-xs">
                            <span className="text-slate-500">Solicitado por: </span>
                            <strong className="text-slate-800">{fromDoc?.name}</strong>
                            {isMine && <span className="text-teal-600 ml-1 font-bold">(Você)</span>}
                            {targetDoc && (
                              <span className="text-slate-500">
                                {' '}direcionado para <strong>{targetDoc.name}</strong>
                              </span>
                            )}
                          </div>

                          {trade.note && (
                            <p className="mt-1.5 text-xs text-slate-600 italic bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                              "{trade.note}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isMine ? (
                            <button
                              onClick={() => onCancelTrade(trade.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                            >
                              Cancelar Pedido
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onAcceptTrade(trade.id);
                                onClose();
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Aceitar e Assumir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Open Shifts (Vagos) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Plantões Vagos (Sem Médico Definido)</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-900 text-[10px] font-extrabold">
                  {openShifts.length}
                </span>
              </h4>
            </div>

            {openShifts.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-200/60">
                Todos os plantões estão cobertos! Nenhuma vaga aberta.
              </div>
            ) : (
              <div className="space-y-3">
                {openShifts.map(shift => (
                  <div
                    key={shift.id}
                    className="bg-amber-50/50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                          {formatFriendlyDate(shift.date)}
                        </span>
                        <span className="text-xs font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {shift.shiftType === 'sobreaviso'
                            ? 'Sobreaviso 24h'
                            : `${shift.startTime} - ${shift.endTime}`}
                        </span>
                        <span className="text-xs text-teal-800 font-semibold">
                          {shift.sector}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {shift.location}
                        </span>
                        {shift.notes && (
                          <span className="italic text-slate-500">— {shift.notes}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClaimShift(shift);
                        onClose();
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                    >
                      Assumir Vaga ({currentDoctor?.name?.split(' ')[0] || 'Médico'})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
