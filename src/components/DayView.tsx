import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeftRight,
  Stethoscope,
  Building2,
  FileText
} from 'lucide-react';
import { Shift, Doctor, HOSPITAL_LABELS } from '../types';
import { formatFriendlyDate, calculateHours } from '../utils/date';

interface DayViewProps {
  currentDate: Date;
  onNavigateDay: (delta: number) => void;
  onGoToToday: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectShift: (shift: Shift) => void;
  onAddShiftForDate: (dateStr: string) => void;
  onClaimShift: (shift: Shift) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  onNavigateDay,
  onGoToToday,
  shifts,
  doctors,
  currentDoctor,
  onSelectShift,
  onAddShiftForDate,
  onClaimShift,
}) => {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
  const docMap = new Map<string, Doctor>(doctors.map(d => [d.id, d]));
  const dayShifts = shifts.filter(s => s.date === dateStr);

  const sobreavisoShift = dayShifts.find(s => s.shiftType === 'sobreaviso' && s.doctorId);
  const sobreavisoDoc = sobreavisoShift?.doctorId ? docMap.get(sobreavisoShift.doctorId) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Date Navigation */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateDay(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
            title="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onGoToToday}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition cursor-pointer"
          >
            Hoje
          </button>
          <button
            onClick={() => onNavigateDay(1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
            title="Próximo dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Outfit']">
            {formatFriendlyDate(dateStr)}
          </h2>
          <p className="text-xs text-slate-500">Escala de Plantão e Procedimentos do Dia</p>
        </div>

        <button
          onClick={() => onAddShiftForDate(dateStr)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar Plantão</span>
        </button>
      </div>

      {/* Emergency On-Call Banner (Sobreaviso de Medicina Fetal) */}
      {sobreavisoDoc && (
        <div className="bg-linear-to-r from-rose-900 to-rose-800 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-7 h-7 text-rose-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white">
                  Plantão de Sobreaviso 24h
                </span>
                <span className="text-xs text-rose-200">Urgências e Cirurgias Fetais</span>
              </div>
              <h3 className="text-lg font-bold mt-1">{sobreavisoDoc.name}</h3>
              <p className="text-xs text-rose-200">
                {sobreavisoDoc.specialty} • {sobreavisoDoc.crm}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sobreavisoDoc.phone && (
              <>
                <a
                  href={`tel:${sobreavisoDoc.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-rose-900 font-bold text-xs hover:bg-rose-50 transition shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Ligar Plantonista
                </a>
                <a
                  href={`https://wa.me/55${sobreavisoDoc.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Shifts Timeline List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
          Turnos Agendados ({dayShifts.length})
        </h3>

        {dayShifts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">Nenhum plantão agendado para este dia</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nenhum médico da equipe colocou plantão nesta data ainda. Você pode adicionar a escala agora.
            </p>
            <button
              onClick={() => onAddShiftForDate(dateStr)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Plantão para {formatFriendlyDate(dateStr)}
            </button>
          </div>
        ) : (
          dayShifts.map(shift => {
            const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
            const isCurrentUser = shift.doctorId === currentDoctor.id;
            const isOpen = shift.doctorId === null;
            const isTrade = shift.status === 'trade_requested';
            const hours = typeof shift.durationHours === 'number' && shift.durationHours > 0
              ? shift.durationHours
              : calculateHours(shift.startTime, shift.endTime, shift.shiftType);
            const shiftModality = shift.modality || (shift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');

            return (
              <div
                key={shift.id}
                onClick={() => onSelectShift(shift)}
                className={`bg-white rounded-2xl p-5 border transition shadow-xs hover:shadow-md cursor-pointer ${
                  isOpen
                    ? 'border-amber-300 bg-amber-50/40'
                    : isTrade
                    ? 'border-amber-400 bg-amber-50/20'
                    : isCurrentUser
                    ? 'border-teal-300 ring-2 ring-teal-500/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Time & Doctor */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 shrink-0 font-bold border border-slate-200">
                      <span className="text-xs text-slate-400 font-medium">Início</span>
                      <span className="text-sm text-slate-900">{shift.startTime}</span>
                      <span className="text-[10px] text-teal-800 font-black bg-teal-50 px-1.5 rounded mt-0.5">{hours}h</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Modality badge */}
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                          shiftModality === 'ps'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}>
                          {shiftModality === 'ps' ? '🏥 Pronto-Socorro (PS)' : '📋 Agenda / Exames'}
                        </span>

                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">
                          {HOSPITAL_LABELS[shift.hospital || 'analia']}
                        </span>

                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {shift.shiftType === 'sobreaviso'
                            ? 'Sobreaviso 24h'
                            : `${shift.startTime} às ${shift.endTime}`}
                        </span>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {shift.sector}
                        </span>

                        {isOpen && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 animate-pulse">
                            ⚠️ Plantão Vago
                          </span>
                        )}

                        {isTrade && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 flex items-center gap-1 border border-amber-300">
                            <ArrowLeftRight className="w-3 h-3 text-amber-700" />
                            Troca Solicitada
                          </span>
                        )}
                      </div>

                      {/* Doctor Info */}
                      <div className="mt-2">
                        {isOpen ? (
                          <div className="text-slate-600 text-sm font-bold flex items-center gap-2">
                            <span>Vaga aberta para a equipe</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimShift(shift);
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                            >
                              Assumir Plantão
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: doc?.color || '#0d9488' }}
                            >
                              {doc?.initials}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                {doc?.name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-teal-600 font-semibold">(Você)</span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {doc?.specialty} • {doc?.crm}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Location & Notes */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div className={`flex items-center gap-1 ${
                          shiftModality === 'ps' ? 'px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold' : ''
                        }`}>
                          <Building2 className={`w-3.5 h-3.5 ${shiftModality === 'ps' ? 'text-white' : 'text-slate-400'}`} />
                          <span>{shift.location}</span>
                        </div>
                        {shift.notes && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span className="italic">{shift.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Contact buttons if assigned */}
                  {doc && !isCurrentUser && (
                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                      {doc.phone && (
                        <>
                          <a
                            href={`https://wa.me/55${doc.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            title="Conversar via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${doc.phone.replace(/\D/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Ligar"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
