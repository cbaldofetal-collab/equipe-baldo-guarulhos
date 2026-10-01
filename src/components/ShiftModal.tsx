import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  FileText, 
  Trash2, 
  ArrowLeftRight, 
  ShieldCheck, 
  AlertCircle,
  Check,
  Activity,
  ClipboardList,
  Plus,
  Minus,
  Repeat
} from 'lucide-react';
import { Shift, Doctor, ShiftType, ShiftSector, ShiftModality, Hospital, HOSPITAL_LABELS } from '../types';
import { formatDateToPt, calculateHours } from '../utils/date';

// Which hospital this deployment belongs to — used as the default when creating a new shift
const APP_HOSPITAL: Hospital = 'gru';
const HOSPITAL_OPTIONS: Hospital[] = ['analia', 'sc', 'gru'];

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToEdit: Shift | null;
  defaultDate?: string;
  doctors: Doctor[];
  currentDoctor: Doctor;
  shifts?: Shift[];
  onSaveShift: (shiftData: Partial<Shift>) => void;
  onDeleteShift: (shiftId: string) => void;
  onRequestDeleteConfirmation: (shiftId: string) => void;
  onClaimShift: (shift: Shift) => void;
  onRequestTrade: (shiftId: string, note: string, toDoctorId?: string) => void;
}

const SECTOR_OPTIONS: ShiftSector[] = [
  'Medicina Fetal - Plantão e Sala de Parto',
  'Sobreaviso Intercorrências e Cirurgia Fetal',
  'USG Morfológica e Rastreio 1º/2º Tri',
  'Dopplerfluxometria e Vitalidade Fetal',
  'Ecocardiografia e Neurosonografia Fetal',
  'Procedimentos Invasivos (Amnio/Cordocentese)',
];

const AGENDA_LOCATION_OPTIONS = [
  'Sala 1',
  'Sala 2',
  'Sala 3',
  'Sala 4',
  'Sala 5',
  'Sala 6',
];

const PS_LOCATION_OPTIONS = [
  'Sala PS 1',
  'Sala PS 2',
  'Sala PS 3',
];

const getLocationOptions = (modality: ShiftModality) =>
  modality === 'ps' ? PS_LOCATION_OPTIONS : AGENDA_LOCATION_OPTIONS;

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  shiftToEdit,
  defaultDate,
  doctors,
  currentDoctor,
  shifts,
  onSaveShift,
  onDeleteShift,
  onRequestDeleteConfirmation,
  onClaimShift,
  onRequestTrade,
}) => {
  const [date, setDate] = useState<string>('');
  const [modality, setModality] = useState<ShiftModality>('ps');
  const [durationHours, setDurationHours] = useState<number>(6);
  const [shiftType, setShiftType] = useState<ShiftType>('manha');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('13:00');
  const [sector, setSector] = useState<ShiftSector>('Medicina Fetal - Plantão e Sala de Parto');
  const [location, setLocation] = useState(PS_LOCATION_OPTIONS[0]);
  const [hospital, setHospital] = useState<Hospital>(APP_HOSPITAL);
  const [additionalLocations, setAdditionalLocations] = useState<string[]>([]);
  const [doctorId, setDoctorId] = useState<string | ''>('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const formBodyRef = useRef<HTMLFormElement>(null);

  const scrollFormToTop = () => {
    formBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Recurrence: 0 = does not repeat. Otherwise, repeat every N weeks.
  const [repeatIntervalWeeks, setRepeatIntervalWeeks] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(4);

  // Trade request inline mode
  const [isTradeMode, setIsTradeMode] = useState(false);
  const [tradeNote, setTradeNote] = useState('');
  const [tradeTargetDocId, setTradeTargetDocId] = useState('');

  // Room pool depends on modality: PS and Agenda never share the same rooms
  const locationOptions = getLocationOptions(modality);

  const handleModalityChange = (newModality: ShiftModality) => {
    setModality(newModality);
    const newOptions = getLocationOptions(newModality);
    if (!newOptions.includes(location)) {
      setLocation(newOptions[0]);
    }
    setAdditionalLocations([]);
  };

  useEffect(() => {
    if (shiftToEdit) {
      setDate(shiftToEdit.date);
      setModality(shiftToEdit.modality || 'ps');
      setDurationHours(
        typeof shiftToEdit.durationHours === 'number' && shiftToEdit.durationHours > 0
          ? shiftToEdit.durationHours
          : calculateHours(shiftToEdit.startTime, shiftToEdit.endTime, shiftToEdit.shiftType)
      );
      setShiftType(shiftToEdit.shiftType);
      setStartTime(shiftToEdit.startTime);
      setEndTime(shiftToEdit.endTime);
      setSector(shiftToEdit.sector);
      setLocation(shiftToEdit.location);
      setHospital(shiftToEdit.hospital || APP_HOSPITAL);
      setDoctorId(shiftToEdit.doctorId || '');
      setNotes(shiftToEdit.notes || '');
      setAdditionalLocations([]);
      setRepeatIntervalWeeks(0);
      setRepeatCount(4);
      setIsTradeMode(false);
      setTradeNote('');
    } else {
      const today = new Date();
      const initialDate = defaultDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(initialDate);
      setModality('ps');
      setDurationHours(6);
      setShiftType('manha');
      setStartTime('07:00');
      setEndTime('13:00');
      setSector('Medicina Fetal - Plantão e Sala de Parto');
      setLocation(PS_LOCATION_OPTIONS[0]);
      setHospital(APP_HOSPITAL);
      setDoctorId(currentDoctor.id);
      setNotes('');
      setAdditionalLocations([]);
      setRepeatIntervalWeeks(0);
      setRepeatCount(4);
      setIsTradeMode(false);
      setTradeNote('');
    }
  }, [shiftToEdit, defaultDate, currentDoctor.id, isOpen]);

  if (!isOpen) return null;

  // Adds N weeks to a "YYYY-MM-DD" date string, returning the same format
  const addWeeksToDateStr = (dateStr: string, weeks: number): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + weeks * 7);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  // Helper to adjust end time based on start time and number of hours
  const updateEndTimeFromHours = (newHours: number, currentStartTime: string) => {
    if (newHours <= 0 || newHours > 48 || !currentStartTime) return;
    const [startH, startM] = currentStartTime.split(':').map(Number);
    const totalMinutes = Math.round((startH * 60 + startM) + newHours * 60);
    const normalizedMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const endH = Math.floor(normalizedMinutes / 60);
    const endM = normalizedMinutes % 60;
    const computedEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    setEndTime(computedEnd);
  };

  // Change preset times when shift type changes
  const handleShiftTypeChange = (newType: ShiftType) => {
    setShiftType(newType);
    switch (newType) {
      case 'manha':
        setStartTime('07:00');
        setEndTime('13:00');
        setDurationHours(6);
        break;
      case 'tarde':
        setStartTime('13:00');
        setEndTime('19:00');
        setDurationHours(6);
        break;
      case 'noite':
        setStartTime('19:00');
        setEndTime('07:00');
        setDurationHours(12);
        break;
      case 'plantao_12d':
        setStartTime('07:00');
        setEndTime('19:00');
        setDurationHours(12);
        break;
      case 'plantao_12n':
        setStartTime('19:00');
        setEndTime('07:00');
        setDurationHours(12);
        break;
      case 'plantao_24h':
        setStartTime('07:00');
        setEndTime('07:00');
        setDurationHours(24);
        break;
      case 'sobreaviso':
        setStartTime('00:00');
        setEndTime('23:59');
        setDurationHours(24);
        setSector('Sobreaviso Intercorrências e Cirurgia Fetal');
        setModality('ps');
        if (!PS_LOCATION_OPTIONS.includes(location)) {
          setLocation(PS_LOCATION_OPTIONS[0]);
        }
        break;
      case 'custom':
        // calculate from times
        const computed = calculateHours(startTime, endTime, 'custom');
        setDurationHours(computed);
        break;
    }
  };

  const handleHoursPillClick = (hours: number) => {
    setDurationHours(hours);
    if (shiftType !== 'sobreaviso') {
      updateEndTimeFromHours(hours, startTime);
    }
  };

  const handleManualHoursChange = (val: number) => {
    const safeVal = Math.max(1, Math.min(48, val));
    setDurationHours(safeVal);
    if (shiftType !== 'sobreaviso') {
      updateEndTimeFromHours(safeVal, startTime);
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (shiftType !== 'sobreaviso') {
      updateEndTimeFromHours(durationHours, newStart);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const computed = calculateHours(startTime, newEnd, 'custom');
    setDurationHours(computed);
  };

  const getNextAvailableLocation = (): string | null => {
    const usedLocations = [location, ...additionalLocations];
    for (const sala of locationOptions) {
      if (!usedLocations.includes(sala)) return sala;
    }
    return null;
  };

  const validateNoDoctorConflict = (): boolean => {
    setValidationError('');

    if (!doctorId) {
      return true; // Only validate if doctor selected
    }

    // Get all salas that will be created with this doctor in this request
    const allSalasInThisRequest = [location, ...additionalLocations];

    // If creating multiple salas, check for conflicts within the SAME request
    // (if trying to assign same doctor to multiple salas at same time)
    if (allSalasInThisRequest.length > 1) {
      const doctorName = doctors.find(d => d.id === doctorId)?.name || 'Médico';
      const errorMsg = `Dr(a). ${doctorName} não pode ser atribuído(a) a múltiplas salas no mesmo horário.\n\nSelecione outros médicos para as salas adicionais ou deixe-as como vagas.`;
      setValidationError(errorMsg);
      console.error('Multiple rooms for same doctor detected:', { doctorId, locations: allSalasInThisRequest, startTime, shiftType, date });
      return false;
    }

    if (!shifts || shifts.length === 0) {
      return true; // No shifts yet, no conflicts possible
    }

    // Check if this doctor already has a shift at same startTime + shiftType
    const conflict = shifts.find(s =>
      s.doctorId === doctorId &&
      s.startTime === startTime &&
      s.shiftType === shiftType &&
      s.date === date && // Also check same date!
      s.id !== shiftToEdit?.id // Ignore the shift being edited
    );

    if (conflict) {
      const doctorName = doctors.find(d => d.id === doctorId)?.name || 'Médico';
      const errorMsg = `Dr(a). ${doctorName} já tem um plantão de ${shiftType} neste horário.\n\nSelecione outro médico ou deixe esta sala como vago.`;
      setValidationError(errorMsg);
      console.error('Doctor conflict detected:', { doctorId, startTime, shiftType, date, conflict });
      return false;
    }

    return true;
  };

  const addAdditionalLocation = () => {
    const nextLoc = getNextAvailableLocation();
    if (nextLoc) {
      setAdditionalLocations([...additionalLocations, nextLoc]);
    }
  };

  const removeAdditionalLocation = (index: number) => {
    setAdditionalLocations(additionalLocations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setValidationError('Selecione a data do plantão antes de continuar.');
      scrollFormToTop();
      return;
    }

    // Validação: Doctor não pode ter dois plantões no mesmo horário
    if (!validateNoDoctorConflict()) {
      scrollFormToTop();
      return;
    }

    // Validação de horário
    if (!startTime || !endTime) {
      alert('Por favor, preencha os horários de início e fim');
      return;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    let endTotalMin = endHour * 60 + endMin;

    // Overnight shift (e.g. 19:00 to 01:00): end time wraps past midnight
    if (endTotalMin <= startTotalMin) {
      endTotalMin += 24 * 60;
    }

    if (startTotalMin >= endTotalMin) {
      alert('O horário de fim deve ser após o horário de início');
      return;
    }

    // Create primary shift
    const baseShift = {
      id: shiftToEdit ? shiftToEdit.id : undefined,
      date,
      start_time: startTime,
      end_time: endTime,
      shift_type: shiftType,
      modality,
      duration_hours: Number(durationHours) || 6,
      sector,
      hospital,
      doctor_id: doctorId || null,
      notes,
    };

    // Save primary shift
    onSaveShift({
      ...baseShift,
      location,
    });

    // Save additional shifts if any (sequential, one per additional location)
    if (additionalLocations.length > 0 && !shiftToEdit) {
      additionalLocations.forEach(loc => {
        setTimeout(() => {
          onSaveShift({
            ...baseShift,
            location: loc,
          });
        }, 100); // Small delay to ensure sequential creation
      });
    }

    // Save recurring occurrences, every N weeks, same room/doctor/hours
    if (!shiftToEdit && repeatIntervalWeeks > 0 && repeatCount > 0) {
      for (let i = 1; i <= repeatCount; i++) {
        const occurrenceDate = addWeeksToDateStr(date, repeatIntervalWeeks * i);
        setTimeout(() => {
          onSaveShift({
            ...baseShift,
            date: occurrenceDate,
            location,
          });
        }, 150 + i * 150);
      }
    }

    onClose();
  };

  const handleSendTradeRequest = () => {
    if (!shiftToEdit) return;
    onRequestTrade(shiftToEdit.id, tradeNote, tradeTargetDocId || undefined);
    setIsTradeMode(false);
    onClose();
  };

  const isAssignedToCurrent = shiftToEdit?.doctorId === currentDoctor.id;
  const isOpenShift = shiftToEdit && shiftToEdit.doctorId === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                {shiftToEdit ? 'Editar Plantão Fetal' : 'Adicionar Plantão na Escala'}
              </h3>
              <p className="text-xs text-slate-500">
                Sincronizado automaticamente com toda a equipe uFetal
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

        {/* Scrollable Form Body */}
        <form ref={formBodyRef} onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Validation Error Alert */}
          {validationError && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Erro de Validação</span>
              </div>
              <p className="text-xs text-rose-800 whitespace-pre-wrap">{validationError}</p>
            </div>
          )}

          {/* Quick Trade Mode Notice */}
          {isTradeMode && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                <span>Solicitar Troca deste Plantão</span>
              </div>
              <p className="text-xs text-amber-800">
                O plantão ficará visível no mural de trocas da equipe uFetal para que um colega possa assumir.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direcionar troca para colega específico (opcional):
                </label>
                <select
                  value={tradeTargetDocId}
                  onChange={e => setTradeTargetDocId(e.target.value)}
                  className="w-full text-xs bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="">Aberto para qualquer membro da equipe</option>
                  {doctors
                    .filter(d => d.id !== currentDoctor.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.crm})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo ou proposta de troca:
                </label>
                <textarea
                  value={tradeNote}
                  onChange={e => setTradeNote(e.target.value)}
                  placeholder="Ex: Congresso de Medicina Fetal ou viagem. Troco por plantão na próxima semana..."
                  rows={2}
                  className="w-full text-xs bg-white border border-amber-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTradeMode(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancelar Troca
                </button>
                <button
                  type="button"
                  onClick={handleSendTradeRequest}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Confirmar e Enviar Solicitação
                </button>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Data do Plantão
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Option: PS ou Agenda */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Modalidade: PS ou Agenda
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleModalityChange('ps')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  modality === 'ps'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  modality === 'ps' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900">PS</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      Pronto-Socorro / Urgência
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Emergência fetal, sala de parto, intercorrências e plantão presencial
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModalityChange('agenda')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  modality === 'agenda'
                    ? 'bg-teal-50 border-teal-500 text-teal-950 ring-2 ring-teal-500/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  modality === 'agenda' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900">Agenda</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      Ambulatório / Exames
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Exames agendados, USG morfológica, Doppler e ecocardiografia fetal
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Hospital / Unidade */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Hospital / Unidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {HOSPITAL_OPTIONS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHospital(h)}
                  className={`px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    hospital === h
                      ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {HOSPITAL_LABELS[h]}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Hours in the Period */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Número de Horas no Período
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Defina quantas horas você vai cumprir neste plantão
                  </span>
                </div>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleManualHoursChange(durationHours - 1)}
                  disabled={durationHours <= 1}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Diminuir 1 hora"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-baseline gap-1 px-1">
                  <input
                    type="number"
                    min={1}
                    max={48}
                    step={0.5}
                    value={durationHours}
                    onChange={e => handleManualHoursChange(parseFloat(e.target.value) || 1)}
                    className="w-12 text-center font-bold text-sm text-teal-900 bg-transparent outline-none"
                  />
                  <span className="text-xs font-semibold text-slate-500">h</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleManualHoursChange(durationHours + 1)}
                  disabled={durationHours >= 48}
                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                  title="Aumentar 1 hora"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick hour pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Atalhos:</span>
              {[4, 6, 8, 10, 12, 24].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHoursPillClick(h)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    durationHours === h
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {h} horas
                </button>
              ))}
            </div>
          </div>

          {/* Shift Type Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Turno / Horário
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'manha', label: 'Manhã', time: '07h - 13h' },
                { id: 'tarde', label: 'Tarde', time: '13h - 19h' },
                { id: 'noite', label: 'Noite', time: '19h - 07h' },
                { id: 'plantao_12d', label: '12h Diurno', time: '07h - 19h' },
                { id: 'plantao_12n', label: '12h Noturno', time: '19h - 07h' },
                { id: 'plantao_24h', label: 'Plantão 24h', time: '07h - 07h' },
                { id: 'sobreaviso', label: '🚨 Sobreaviso', time: '24h Urgência' },
                { id: 'custom', label: 'Personalizado', time: 'Livre' },
              ].map(preset => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleShiftTypeChange(preset.id as ShiftType)}
                  className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                    shiftType === preset.id
                      ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs leading-none">{preset.label}</div>
                  <div className={`text-[10px] mt-1 ${shiftType === preset.id ? 'text-teal-100' : 'text-slate-400'}`}>
                    {preset.time}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time range inputs if custom or manual adjustment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Horário de Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Horário de Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => handleEndTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Recurrence: repeat this shift every N weeks (new shifts only) */}
          {!shiftToEdit && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-teal-700" />
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Repetição
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Para médicos com plantão fixo (ex: 1x por mês = a cada 4 semanas)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { weeks: 0, label: 'Não repete' },
                  { weeks: 1, label: 'A cada semana' },
                  { weeks: 2, label: 'A cada 2 sem.' },
                  { weeks: 3, label: 'A cada 3 sem.' },
                  { weeks: 4, label: 'A cada 4 sem.' },
                ].map(opt => (
                  <button
                    key={opt.weeks}
                    type="button"
                    onClick={() => setRepeatIntervalWeeks(opt.weeks)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      repeatIntervalWeeks === opt.weeks
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {repeatIntervalWeeks > 0 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Repetir por quantas ocorrências (além desta)?
                  </span>
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                      disabled={repeatCount <= 1}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-teal-900">{repeatCount}</span>
                    <button
                      type="button"
                      onClick={() => setRepeatCount(Math.min(24, repeatCount + 1))}
                      disabled={repeatCount >= 24}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {repeatIntervalWeeks > 0 && (
                <p className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5">
                  Serão criados mais <strong>{repeatCount}</strong> plantão(ões), a cada <strong>{repeatIntervalWeeks}</strong> semana(s),
                  o último em <strong>{formatDateToPt(addWeeksToDateStr(date, repeatIntervalWeeks * repeatCount))}</strong>.
                </p>
              )}
            </div>
          )}

          {/* Sector / Specialty in Fetal Medicine */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Setor / Foco de Atuação
            </label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value as ShiftSector)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {SECTOR_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Hospital / Unit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sala {modality === 'ps' ? '(Pronto-Socorro)' : '(Agenda)'}
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold border outline-none focus:ring-2 ${
                modality === 'ps'
                  ? 'bg-rose-50 border-rose-300 text-rose-900 focus:ring-rose-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-teal-500'
              }`}
            >
              {/* Keep showing the current value even if it belongs to the other modality's pool (legacy shifts) */}
              {!locationOptions.includes(location) && (
                <option value={location}>{location}</option>
              )}
              {locationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Médico Plantonista
              </label>
              <button
                type="button"
                onClick={() => setDoctorId('')}
                className="text-xs text-amber-700 hover:underline font-semibold"
              >
                Deixar como Vago (Aberto)
              </button>
            </div>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border outline-none ${
                doctorId === ''
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="">⚠️ Plantão Vago (Disponível para qualquer membro da equipe assumir)</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty} ({d.crm})
                </option>
              ))}
            </select>
          </div>

          {/* Observations & Patient handover notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações / Instruções da Equipe
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Foco em cobertura de procedimentos invasivos, transferências da UTI neonatal, etc."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Action Row for Existing Shifts: Claim or Trade */}
          {shiftToEdit && !isTradeMode && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              {isOpenShift && (
                <button
                  type="button"
                  onClick={() => {
                    onClaimShift(shiftToEdit);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Assumir este Plantão ({currentDoctor.name})
                </button>
              )}

              {isAssignedToCurrent && (
                <button
                  type="button"
                  onClick={() => setIsTradeMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                  Solicitar Troca
                </button>
              )}

              <button
                type="button"
                onClick={() => onRequestDeleteConfirmation(shiftToEdit.id)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition ml-auto"
                title="Excluir plantão"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Additional Locations for Batch Creation */}
          {!shiftToEdit && additionalLocations.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2">Salas Adicionais ({additionalLocations.length})</div>
              <div className="flex flex-wrap gap-2">
                {additionalLocations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-lg text-xs"
                  >
                    <span className="text-teal-700 font-medium">{loc}</span>
                    <button
                      type="button"
                      onClick={() => removeAdditionalLocation(idx)}
                      className="text-teal-600 hover:text-teal-700 transition"
                      title="Remover sala"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              {shiftToEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este plantão?')) {
                      onDeleteShift(shiftToEdit.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold transition cursor-pointer"
                  title="Deletar este plantão"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deletar
                </button>
              )}
              {!shiftToEdit && getNextAvailableLocation() && (
                <button
                  type="button"
                  onClick={addAdditionalLocation}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  title="Adicionar outra sala no mesmo horário"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Outra Sala
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
            >
              {shiftToEdit ? 'Salvar Alterações' : 'Adicionar à Escala'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
