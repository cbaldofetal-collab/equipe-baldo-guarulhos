import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowLeftRight, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { Shift, Doctor } from '../types';
import { 
  WEEKDAY_NAMES_PT, 
  formatFriendlyDate, 
  MONTH_NAMES_PT,
  calculateHours
} from '../utils/date';

interface WeekViewProps {
  currentDate: Date;
  onNavigateWeek: (deltaDays: number) => void;
  onGoToToday: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectShift: (shift: Shift) => void;
  onAddShiftForDate: (dateStr: string) => void;
  onClaimShift: (shift: Shift) => void;
  onSwitchToMonthView?: () => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  onNavigateWeek,
  onGoToToday,
  shifts,
  doctors,
  currentDoctor,
  onSelectShift,
  onAddShiftForDate,
  onClaimShift,
  onSwitchToMonthView,
}) => {
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('all');
  // Get start of week (Sunday)
  const currentDayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

  const weekDays: { date: Date; dateStr: string; dayName: string; isToday: boolean }[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({
      date: d,
      dateStr,
      dayName: WEEKDAY_NAMES_PT[d.getDay()],
      isToday: dateStr === todayStr,
    });
  }

  const docMap = new Map<string, Doctor>(doctors.map(d => [d.id, d]));

  const firstDay = weekDays[0].date;
  const lastDay = weekDays[6].date;
  const weekRangeTitle = `${firstDay.getDate()} de ${MONTH_NAMES_PT[firstDay.getMonth()]} a ${lastDay.getDate()} de ${MONTH_NAMES_PT[lastDay.getMonth()]} de ${lastDay.getFullYear()}`;

  // Time periods definition
  const periods = [
    { key: 'manha', label: 'Manhã', time: '07:00 - 13:00', icon: '🌅' },
    { key: 'tarde', label: 'Tarde', time: '13:00 - 19:00', icon: '🌇' },
    { key: 'noite', label: 'Noite / 12h Noturno', time: '19:00 - 07:00', icon: '🌙' },
    { key: 'sobreaviso', label: 'Sobreaviso Fetal 24h', time: '24h Disponível', icon: '🚨' },
  ];

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => onNavigateWeek(-7)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToToday}
              className="px-3 py-1 text-xs font-semibold hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
            >
              Esta Semana
            </button>
            <button
              onClick={() => onNavigateWeek(7)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              title="Próxima semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-['Outfit']">
            {weekRangeTitle}
          </h2>
        </div>

        {/* View Switch & Info */}
        <div className="flex items-center gap-3">
          {onSwitchToMonthView && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={onSwitchToMonthView}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                Mês
              </button>
              <span className="px-3 py-1 bg-white text-teal-800 rounded-lg shadow-xs">
                Semana
              </span>
            </div>
          )}
          <div className="text-xs text-slate-500 hidden md:block">
            Visualização por turnos e cobertura da equipe
          </div>
        </div>
      </div>

      {/* Interactive Doctor & Modality Filter Bar for Week View */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Modality toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 font-semibold mr-1">Modalidade:</span>
          {(['all', 'ps', 'agenda'] as const).map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModalityFilter(mod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedModalityFilter === mod
                  ? mod === 'ps'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : mod === 'agenda'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mod === 'all' ? 'Todas' : mod === 'ps' ? '🏥 PS' : '📋 Agenda'}
            </button>
          ))}
        </div>

        {/* Doctor filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-semibold mr-1">Médico:</span>
          <button
            onClick={() => setSelectedDoctorFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedDoctorFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {doctors.map(doc => {
            const isSelected = selectedDoctorFilter === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctorFilter(isSelected ? 'all' : doc.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-slate-800 shadow-xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                style={{
                  backgroundColor: isSelected ? `${doc.color}25` : undefined,
                  color: isSelected ? doc.color : undefined,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: doc.color }}
                />
                <span className="font-semibold">{doc.name.replace('Dr. ', '').replace('Dra. ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7 Columns Grid for the Week */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayShifts = shifts
            .filter(s => s.date === day.dateStr)
            .filter(s => selectedDoctorFilter === 'all' || s.doctorId === selectedDoctorFilter)
            .filter(s => {
              if (selectedModalityFilter === 'all') return true;
              const shiftMod = s.modality || (s.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
              return shiftMod === selectedModalityFilter;
            });

          return (
            <div
              key={day.dateStr}
              className={`bg-white rounded-2xl border transition shadow-xs flex flex-col ${
                day.isToday
                  ? 'border-teal-400 ring-2 ring-teal-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Day column header */}
              <div className={`p-3 border-b border-slate-100 rounded-t-2xl flex items-center justify-between ${
                day.isToday ? 'bg-teal-50/50' : 'bg-slate-50/70'
              }`}>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {day.dayName.slice(0, 3)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-extrabold ${day.isToday ? 'text-teal-800' : 'text-slate-800'}`}>
                      {day.date.getDate()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {MONTH_NAMES_PT[day.date.getMonth()].slice(0, 3)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAddShiftForDate(day.dateStr)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                  title="Adicionar plantão neste dia"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Day body: Shift cards for this day */}
              <div className="p-2 space-y-2 flex-1">
                {dayShifts.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs">
                    <span>Sem plantão</span>
                    <button
                      onClick={() => onAddShiftForDate(day.dateStr)}
                      className="mt-2 text-teal-600 font-semibold hover:underline text-[11px]"
                    >
                      + Agendar
                    </button>
                  </div>
                ) : (
                  dayShifts.map(shift => {
                    const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
                    const isCurrentUser = shift.doctorId === currentDoctor.id;
                    const isOpen = shift.doctorId === null;
                    const isTrade = shift.status === 'trade_requested';
                    const isSobreaviso = shift.shiftType === 'sobreaviso';
                    const shiftModality = shift.modality || (isSobreaviso ? 'ps' : 'agenda');
                    const hours = typeof shift.durationHours === 'number' && shift.durationHours > 0
                      ? shift.durationHours
                      : calculateHours(shift.startTime, shift.endTime, shift.shiftType);

                    return (
                      <div
                        key={shift.id}
                        onClick={() => onSelectShift(shift)}
                        className={`p-2.5 rounded-xl border text-xs transition cursor-pointer relative shadow-2xs ${
                          isOpen
                            ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                            : isTrade
                            ? 'bg-amber-50/70 border-amber-300'
                            : isSobreaviso
                            ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                            : isCurrentUser
                            ? 'bg-teal-50/80 border-teal-300 hover:border-teal-400 ring-1 ring-teal-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Time, Modality & Shift Type Badge */}
                        <div className="flex items-center justify-between mb-1.5 gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-tight shrink-0 ${
                              shiftModality === 'ps'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                            }`}>
                              {shiftModality === 'ps' ? 'PS' : 'Agenda'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${
                              isSobreaviso
                                ? 'bg-rose-100 text-rose-800'
                                : isOpen
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isSobreaviso ? 'Sobreaviso' : `${shift.startTime}-${shift.endTime}`}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            {hours}h
                          </span>

                          {isTrade && (
                            <span className="flex items-center gap-0.5 text-[9px] text-amber-700 font-semibold shrink-0">
                              <ArrowLeftRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Doctor Name or Claim CTA */}
                        {isOpen ? (
                          <div className="space-y-1.5">
                            <div className="font-bold text-amber-800 text-xs">
                              Plantão Vago
                            </div>
                            <p className="text-[10px] text-amber-700 line-clamp-1">
                              {shift.sector}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimShift(shift);
                              }}
                              className="w-full py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition text-center shadow-xs cursor-pointer"
                            >
                              Assumir este Plantão
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: doc?.color || '#0d9488' }}
                              />
                              <span className={`font-bold truncate ${
                                isCurrentUser ? 'text-teal-900' : 'text-slate-900'
                              }`}>
                                {doc?.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {shift.sector}
                            </div>
                          </div>
                        )}

                        {/* Location */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100/80 flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{shift.location}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
