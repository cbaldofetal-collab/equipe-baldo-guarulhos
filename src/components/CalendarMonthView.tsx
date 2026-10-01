import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  ArrowLeftRight, 
  Clock, 
  Building2, 
  CheckCircle2,
  Filter,
  User,
  Activity,
  Repeat,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Shift, Doctor, Hospital, HOSPITAL_LABELS, HOSPITAL_SHORT_LABELS } from '../types';
import { 
  MONTH_NAMES_PT, 
  WEEKDAY_NAMES_PT, 
  SHORT_WEEKDAY_NAMES_PT, 
  generateMonthCalendarGrid,
  formatFriendlyDate,
  calculateHours
} from '../utils/date';

interface CalendarMonthViewProps {
  currentDate: Date;
  onNavigateMonth: (delta: number) => void;
  onGoToToday: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectShift: (shift: Shift) => void;
  onAddShiftForDate: (dateStr: string) => void;
  onClaimShift: (shift: Shift) => void;
  onSwitchToWeekView?: () => void;
  onOpenResetModal?: () => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  onNavigateMonth,
  onGoToToday,
  shifts,
  doctors,
  currentDoctor,
  onSelectShift,
  onAddShiftForDate,
  onClaimShift,
  onSwitchToWeekView,
  onOpenResetModal,
}) => {
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('all');
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const grid = generateMonthCalendarGrid(year, month, todayStr);
  const docMap = new Map<string, Doctor>(doctors.map(d => [d.id, d]));

  // Filter shifts
  const filteredShifts = shifts.filter(shift => {
    if (selectedDoctorFilter === 'vago') {
      if (shift.doctorId !== null) return false;
    } else if (selectedDoctorFilter !== 'all') {
      if (shift.doctorId !== selectedDoctorFilter) return false;
    }

    if (selectedTypeFilter === 'sobreaviso') {
      if (shift.shiftType !== 'sobreaviso') return false;
    } else if (selectedTypeFilter === 'presencial') {
      if (shift.shiftType === 'sobreaviso') return false;
    }

    if (selectedModalityFilter !== 'all') {
      const shiftModality = shift.modality || (shift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
      if (shiftModality !== selectedModalityFilter) return false;
    }

    if (selectedHospitalFilter !== 'all') {
      const shiftHospital = shift.hospital || 'analia';
      if (shiftHospital !== selectedHospitalFilter) return false;
    }

    return true;
  });

  // Group shifts by date string
  const shiftsByDate = new Map<string, Shift[]>();
  filteredShifts.forEach(shift => {
    const list = shiftsByDate.get(shift.date) || [];
    list.push(shift);
    shiftsByDate.set(shift.date, list);
  });

  // Statistics for this month
  const targetMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentMonthShifts = shifts.filter(s => s.date.startsWith(targetMonthPrefix));
  const totalShifts = currentMonthShifts.length;
  const openShifts = currentMonthShifts.filter(s => s.doctorId === null).length;
  const sobreavisoShifts = currentMonthShifts.filter(s => s.shiftType === 'sobreaviso').length;
  const coverageRate = totalShifts > 0 ? Math.round(((totalShifts - openShifts) / totalShifts) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Month Navigation & Controls Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Month Title & Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => onNavigateMonth(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToToday}
              className="px-3 py-1 text-xs font-semibold hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={() => onNavigateMonth(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 capitalize tracking-tight font-['Outfit']">
            {MONTH_NAMES_PT[month]} <span className="text-slate-400 font-normal">{year}</span>
          </h2>

          {onOpenResetModal && (
            <button
              onClick={onOpenResetModal}
              title="Zerar escala para testes ou carregar exemplos"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Gerenciar Escala</span>
            </button>
          )}
        </div>

        {/* View Switch & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Format Switch (Month / Week) */}
          {onSwitchToWeekView && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <span className="px-3 py-1 bg-white text-teal-800 rounded-lg shadow-xs">
                Mês
              </span>
              <button
                onClick={onSwitchToWeekView}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
              >
                Semana
              </button>
            </div>
          )}

          {/* Doctor filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium hidden sm:inline">Filtrar:</span>
            <select
              value={selectedDoctorFilter}
              onChange={e => setSelectedDoctorFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Toda a Equipe</option>
              <option value="vago">⚠️ Vagos / Abertos</option>
              <option value={currentDoctor.id}>⭐ Meus Plantões ({currentDoctor.name})</option>
              {doctors
                .filter(d => d.id !== currentDoctor.id)
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Presencial & Sobreaviso</option>
              <option value="presencial">Somente Presencial</option>
              <option value="sobreaviso">Somente Sobreaviso</option>
            </select>
          </div>

          {/* Modality filter (PS vs Agenda) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedModalityFilter}
              onChange={e => setSelectedModalityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">PS & Agenda</option>
              <option value="ps">🏥 Somente PS</option>
              <option value="agenda">📋 Somente Agenda</option>
            </select>
          </div>

          {/* Hospital filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedHospitalFilter}
              onChange={e => setSelectedHospitalFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Todos os Hospitais</option>
              {(['analia', 'sc', 'gru'] as Hospital[]).map(h => (
                <option key={h} value={h}>{HOSPITAL_LABELS[h]}</option>
              ))}
            </select>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden xl:flex items-center gap-3 pl-3 border-l border-slate-200 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900">{totalShifts}</span> plantões
            </div>
            {totalShifts === 0 ? (
              <div className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-semibold border border-teal-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>Escala em branco (Modo Teste)</span>
              </div>
            ) : openShifts > 0 ? (
              <div className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                {openShifts} vagas abertas
              </div>
            ) : (
              <div className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                100% Coberto
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Interactive Doctor Palette Bar */}
      <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <span>Médicos Escalados:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
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
            const docShiftCount = currentMonthShifts.filter(s => s.doctorId === doc.id).length;
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
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
                  {docShiftCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State Banner for blank testing */}
      {currentMonthShifts.length === 0 && (
        <div className="bg-gradient-to-r from-teal-50/90 via-sky-50/80 to-teal-50/90 border border-teal-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-800 shadow-2xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Escala limpa em branco pronta para testes da equipe
              </div>
              <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Clique em qualquer dia do calendário abaixo ou no botão <strong>"+ Adicionar Plantão"</strong> para cadastrar turnos de PS e Agenda com carga horária e médico escalado.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAddShiftForDate(`${year}-${String(month + 1).padStart(2, '0')}-01`)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Plantão</span>
            </button>
            {onOpenResetModal && (
              <button
                onClick={onOpenResetModal}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Opções
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          {SHORT_WEEKDAY_NAMES_PT.map((day, idx) => (
            <div key={day} className={idx === 0 || idx === 6 ? 'text-teal-700' : ''}>
              <span className="hidden sm:inline">{WEEKDAY_NAMES_PT[idx]}</span>
              <span className="sm:hidden">{day}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {grid.map((cell, idx) => {
            const dayShifts = shiftsByDate.get(cell.dateStr) || [];
            
            // Sort: presencial first, then sobreaviso
            dayShifts.sort((a, b) => {
              if (a.shiftType === 'sobreaviso' && b.shiftType !== 'sobreaviso') return 1;
              if (a.shiftType !== 'sobreaviso' && b.shiftType === 'sobreaviso') return -1;
              return (a.startTime || '').localeCompare(b.startTime || '');
            });

            return (
              <div
                key={cell.dateStr}
                className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 transition flex flex-col group relative ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/50 text-slate-400'
                    : cell.isWeekend
                    ? 'bg-teal-50/20'
                    : 'bg-white'
                } hover:bg-slate-50/80`}
              >
                {/* Date header with quick "+" button */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-lg w-6 h-6 transition ${
                      cell.isToday
                        ? 'bg-teal-700 text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Add button visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddShiftForDate(cell.dateStr);
                    }}
                    title={`Adicionar plantão para ${cell.dayNumber}/${month + 1}`}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Shift badges list inside day cell */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[105px] pr-0.5 custom-scrollbar">
                  {(() => {
                    // Group shifts by startTime + shiftType + modality to show rooms together
                    // (modality is included so a PS shift never gets merged into an Agenda card, or vice versa)
                    const groupedShifts = dayShifts.reduce((acc, shift) => {
                      const shiftModalityKey = shift.modality || (shift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
                      const key = `${shift.startTime}-${shift.shiftType}-${shiftModalityKey}`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(shift);
                      return acc;
                    }, {} as Record<string, typeof dayShifts>);

                    return Object.values(groupedShifts).map(groupedShifts => {
                      // If only one shift in group, render normally
                      if (groupedShifts.length === 1) {
                        const shift = groupedShifts[0];
                        const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
                        const isCurrentUser = shift.doctorId === currentDoctor.id;
                        const isOpen = shift.doctorId === null;
                        const isTrade = shift.status === 'trade_requested';
                        const isSobreaviso = shift.shiftType === 'sobreaviso';
                        const shiftModality = shift.modality || (isSobreaviso ? 'ps' : 'agenda');
                        const hours = typeof shift.durationHours === 'number' && shift.durationHours > 0
                          ? shift.durationHours
                          : calculateHours(shift.startTime, shift.endTime, shift.shiftType);

                        let timeLabel = `${shift.startTime}-${shift.endTime}`;
                        if (isSobreaviso) timeLabel = 'Sobreaviso';
                        else if (shift.shiftType === 'plantao_12d') timeLabel = '12h Diurno';
                        else if (shift.shiftType === 'plantao_12n') timeLabel = '12h Noturno';
                        else if (shift.shiftType === 'plantao_24h') timeLabel = '24h';
                        else if (shift.shiftType === 'manha') timeLabel = 'Manhã';
                        else if (shift.shiftType === 'tarde') timeLabel = 'Tarde';

                        return (
                          <div
                            key={shift.id}
                            onClick={() => onSelectShift(shift)}
                            className={`text-[11px] p-1.5 rounded-lg border transition cursor-pointer text-left relative group/item shadow-xs ${
                              isOpen
                                ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-100 text-amber-900 border-dashed animate-pulse'
                                : isTrade
                                ? 'bg-amber-50 border-amber-400 text-amber-900 hover:border-amber-500'
                                : isSobreaviso
                                ? 'bg-rose-50 border-rose-200 text-rose-900 hover:border-rose-300'
                                : isCurrentUser
                                ? 'bg-teal-50/90 border-teal-300 text-teal-950 font-medium hover:border-teal-400 ring-1 ring-teal-400/30'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            {/* Header: Type / Time & Status icon */}
                            <div className="flex items-center justify-between gap-1 leading-none mb-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className={`px-1 py-0.2 rounded text-[8.5px] font-black uppercase tracking-tight shrink-0 ${
                                  shiftModality === 'ps'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                                }`}>
                                  {shiftModality === 'ps' ? 'PS' : 'Agenda'}
                                </span>
                                <span className="px-1 py-0.2 rounded text-[8.5px] font-black uppercase tracking-tight shrink-0 bg-slate-200 text-slate-700 border border-slate-300">
                                  {HOSPITAL_SHORT_LABELS[shift.hospital || 'analia']}
                                </span>
                                <span className={`font-semibold text-[10px] truncate ${
                                  isSobreaviso ? 'text-rose-700 font-bold' : isOpen ? 'text-amber-800' : 'text-slate-600'
                                }`}>
                                  {timeLabel}
                                </span>
                              </div>

                              <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                {hours}h
                              </span>

                              {isOpen && (
                                <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold uppercase">
                                  Vago
                                </span>
                              )}

                              {isTrade && (
                                <ArrowLeftRight className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              )}
                            </div>

                            {/* Doctor Name / Claim Button */}
                            {isOpen ? (
                              <div className="flex items-center justify-between gap-1 pt-0.5">
                                <span className="text-amber-800 font-bold truncate">Assumir Vaga</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClaimShift(shift);
                                  }}
                                  className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9px] font-bold shrink-0 transition"
                                >
                                  Eu pego
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: doc?.color || '#0d9488' }}
                                />
                                <span className={`truncate font-medium ${isCurrentUser ? 'text-teal-900 font-bold' : 'text-slate-800'}`}>
                                  {doc?.name ? doc.name.replace('Dr. ', '').replace('Dra. ', '') : (shift.doctorId ? 'Médico' : 'Plantão Vago')}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Multiple shifts in group - render grouped card
                      const firstShift = groupedShifts[0];
                      const shiftModality = firstShift.modality || (firstShift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
                      const hours = typeof firstShift.durationHours === 'number' && firstShift.durationHours > 0
                        ? firstShift.durationHours
                        : calculateHours(firstShift.startTime, firstShift.endTime, firstShift.shiftType);

                      let timeLabel = `${firstShift.startTime}-${firstShift.endTime}`;
                      if (firstShift.shiftType === 'plantao_12d') timeLabel = '12h Diurno';
                      else if (firstShift.shiftType === 'plantao_12n') timeLabel = '12h Noturno';
                      else if (firstShift.shiftType === 'plantao_24h') timeLabel = '24h';
                      else if (firstShift.shiftType === 'manha') timeLabel = 'Manhã';
                      else if (firstShift.shiftType === 'tarde') timeLabel = 'Tarde';

                      return (
                        <div
                          key={`group-${firstShift.startTime}-${firstShift.shiftType}-${shiftModality}`}
                          className="text-[11px] p-1.5 rounded-lg border bg-white border-slate-200 hover:border-slate-300 text-slate-800 transition cursor-default text-left shadow-xs"
                        >
                          {/* Header: Type / Time */}
                          <div className="flex items-center justify-between gap-1 leading-none mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className={`px-1 py-0.2 rounded text-[8.5px] font-black uppercase tracking-tight shrink-0 ${
                                shiftModality === 'ps'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-teal-100 text-teal-800 border border-teal-200'
                              }`}>
                                {shiftModality === 'ps' ? 'PS' : 'Agenda'}
                              </span>
                              <span className="font-semibold text-[10px] text-slate-600">
                                {timeLabel}
                              </span>
                            </div>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-bold shrink-0">
                              {groupedShifts.length}
                            </span>
                          </div>

                          {/* List of rooms/doctors */}
                          <div className="space-y-0.5">
                            {groupedShifts.map(shift => {
                              const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
                              const docName = doc?.name ? doc.name.replace('Dr. ', '').replace('Dra. ', '') : (shift.doctorId ? 'Médico' : 'Vago');
                              return (
                                <div
                                  key={shift.id}
                                  onClick={() => onSelectShift(shift)}
                                  className={`flex items-center gap-1.5 text-[9px] px-1 py-0.5 rounded cursor-pointer transition ${
                                    shiftModality === 'ps'
                                      ? 'bg-rose-50 hover:bg-rose-100'
                                      : 'bg-slate-50 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className={`font-bold shrink-0 px-1 rounded ${
                                    shiftModality === 'ps'
                                      ? 'bg-rose-600 text-white'
                                      : 'text-slate-500'
                                  }`}>{shift.location}</span>
                                  <span className="font-bold shrink-0 px-1 rounded bg-slate-200 text-slate-600">
                                    {HOSPITAL_SHORT_LABELS[shift.hospital || 'analia']}
                                  </span>
                                  <span className="text-slate-700 truncate">{docName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Empty day prompt on click */}
                {dayShifts.length === 0 && cell.isCurrentMonth && (
                  <div
                    onClick={() => onAddShiftForDate(cell.dateStr)}
                    className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] text-slate-400 hover:text-teal-600"
                  >
                    + Plantão
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>
            Escala de <strong className="text-slate-900">{MONTH_NAMES_PT[month]}</strong>: 
            {' '}<strong className="text-teal-700">{totalShifts - openShifts}</strong> confirmados,
            {' '}<strong className="text-amber-700">{openShifts}</strong> vagos,
            {' '}<strong className="text-rose-700">{sobreavisoShifts}</strong> sobreavisos.
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Cobertura da equipe:</span>
          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                coverageRate >= 95 ? 'bg-teal-600' : 'bg-amber-500'
              }`}
              style={{ width: `${coverageRate}%` }}
            />
          </div>
          <span className="font-bold text-slate-800">{coverageRate}%</span>
        </div>
      </div>
    </div>
  );
};
