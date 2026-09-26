import React, { useState, useMemo } from 'react';
import { 
  X, 
  Repeat, 
  CalendarRange, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Clock, 
  ArrowRight, 
  Calendar,
  Sparkles,
  Users,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Shift, Doctor } from '../types';
import { MONTH_NAMES_PT, calculateHours } from '../utils/date';

interface ReplicateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSuccess: (message: string, targetDate?: Date) => void;
}

export const ReplicateScheduleModal: React.FC<ReplicateScheduleModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  shifts,
  doctors,
  currentDoctor,
  onSuccess,
}) => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // Source selection
  const [sourceYear, setSourceYear] = useState<number>(currentYear);
  const [sourceMonth, setSourceMonth] = useState<number>(currentMonth);

  // Mode selection
  const [mode, setMode] = useState<'weekday_pattern' | 'day_of_month'>('weekday_pattern');
  const [includeDoctors, setIncludeDoctors] = useState<boolean>(true);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);

  // Target months selection
  // Generate list of next 6 months
  const availableTargetMonths = useMemo(() => {
    const list: Array<{ year: number; month: number; label: string }> = [];
    let y = sourceYear;
    let m = sourceMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }

    for (let i = 0; i < 6; i++) {
      list.push({
        year: y,
        month: m,
        label: `${MONTH_NAMES_PT[m - 1]} de ${y}`,
      });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return list;
  }, [sourceYear, sourceMonth]);

  // Selected targets (default: first 1 or 2 upcoming months)
  const [selectedTargets, setSelectedTargets] = useState<Array<{ year: number; month: number }>>([
    availableTargetMonths[0] || { year: currentYear, month: currentMonth + 1 > 12 ? 1 : currentMonth + 1 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ totalCreated: number; firstTarget?: { year: number; month: number } } | null>(null);

  // Source month statistics
  const sourcePrefix = `${sourceYear}-${String(sourceMonth).padStart(2, '0')}-`;
  const sourceShifts = useMemo(() => {
    return shifts.filter(s => s.date.startsWith(sourcePrefix));
  }, [shifts, sourcePrefix]);

  const sourceStats = useMemo(() => {
    let psCount = 0;
    let agendaCount = 0;
    let totalHours = 0;
    const doctorsPresent = new Set<string>();

    for (const s of sourceShifts) {
      const isPS = (s.modality === 'ps') || (s.shiftType === 'sobreaviso');
      if (isPS) psCount++;
      else agendaCount++;

      const h = typeof s.durationHours === 'number' && s.durationHours > 0
        ? s.durationHours
        : calculateHours(s.startTime, s.endTime, s.shiftType);
      totalHours += h;

      if (s.doctorId) doctorsPresent.add(s.doctorId);
    }

    return {
      total: sourceShifts.length,
      psCount,
      agendaCount,
      totalHours,
      doctorsCount: doctorsPresent.size,
    };
  }, [sourceShifts]);

  if (!isOpen) return null;

  const toggleTargetMonth = (year: number, month: number) => {
    setSelectedTargets(prev => {
      const exists = prev.some(t => t.year === year && t.month === month);
      if (exists) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(t => !(t.year === year && t.month === month));
      } else {
        return [...prev, { year, month }].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
      }
    });
  };

  const selectPreset = (count: number) => {
    setSelectedTargets(availableTargetMonths.slice(0, count).map(m => ({ year: m.year, month: m.month })));
  };

  const handleReplicate = async () => {
    if (sourceShifts.length === 0) {
      setErrorMessage(`O mês de origem selecionado (${MONTH_NAMES_PT[sourceMonth - 1]}/${sourceYear}) não possui plantões preenchidos.`);
      return;
    }
    if (selectedTargets.length === 0) {
      setErrorMessage('Selecione pelo menos um mês de destino.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/shifts/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceYear,
          sourceMonth,
          targetMonths: selectedTargets,
          mode,
          includeDoctors,
          overwriteExisting,
          authorName: currentDoctor.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao reproduzir escala.');
      }

      setResultSummary({
        totalCreated: data.totalCreated,
        firstTarget: selectedTargets[0],
      });

      onSuccess(
        `✅ Escala reproduzida com sucesso! ${data.totalCreated} plantões criados com horários e modalidades (PS/Agenda) idênticos.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao reproduzir escala.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToTargetMonth = () => {
    if (resultSummary?.firstTarget) {
      const targetDate = new Date(resultSummary.firstTarget.year, resultSummary.firstTarget.month - 1, 1);
      onSuccess('', targetDate);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 shadow-inner">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Reproduzir Escala para os Próximos Meses
              </h2>
              <p className="text-xs text-teal-200">
                Replica horários, modalidades (PS ou Agenda), cargas horárias e médicos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">

          {/* Success screen */}
          {resultSummary ? (
            <div className="py-6 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Escala Reproduzida com Sucesso!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Foram criados <strong className="text-teal-700 font-black">{resultSummary.totalCreated} plantões</strong> com 
                  os mesmos horários de início e término, mesma carga horária e mesma modalidade (PS e Agenda).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Configurações Preservadas:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>Modalidades (PS / Agenda)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>Cargas Horárias (4h, 6h, 12h, 24h)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>Setores & Procedimentos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>Médicos e plantões confirmados</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Permanecer neste mês
                </button>
                <button
                  onClick={handleGoToTargetMonth}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
                >
                  <span>Visualizar Mês Replicado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Source Month Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">1</span>
                    <span>Mês de Origem (Modelo da Escala)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sourceMonth}
                      onChange={e => setSourceMonth(Number(e.target.value))}
                      className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 outline-none"
                    >
                      {MONTH_NAMES_PT.map((name, i) => (
                        <option key={i} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sourceYear}
                      onChange={e => setSourceYear(Number(e.target.value))}
                      className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 outline-none"
                    >
                      <option value={currentYear}>{currentYear}</option>
                      <option value={currentYear + 1}>{currentYear + 1}</option>
                    </select>
                  </div>
                </div>

                {/* Source Stats Summary */}
                {sourceShifts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-medium">Plantões no Mês</div>
                      <div className="text-base font-extrabold text-slate-900">{sourceStats.total}</div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-rose-100 bg-rose-50/30">
                      <div className="text-[10px] text-rose-700 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Pronto-Socorro (PS)
                      </div>
                      <div className="text-base font-extrabold text-rose-900">{sourceStats.psCount}</div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-teal-100 bg-teal-50/30">
                      <div className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        Agenda / Eletivo
                      </div>
                      <div className="text-base font-extrabold text-teal-900">{sourceStats.agendaCount}</div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-medium">Carga Total</div>
                      <div className="text-base font-extrabold text-slate-900">{sourceStats.totalHours}h</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Este mês de origem ainda não possui plantões preenchidos. Preencha a escala primeiro ou selecione outro mês modelo.</span>
                  </div>
                )}
              </div>

              {/* Step 2: Target Months */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">2</span>
                    <span>Meses de Destino (Onde Reproduzir)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      onClick={() => selectPreset(1)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                    >
                      +1 Mês
                    </button>
                    <button
                      onClick={() => selectPreset(2)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                    >
                      +2 Meses
                    </button>
                    <button
                      onClick={() => selectPreset(3)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                    >
                      Trimestre (+3)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableTargetMonths.map(tm => {
                    const isSelected = selectedTargets.some(t => t.year === tm.year && t.month === tm.month);
                    return (
                      <button
                        key={`${tm.year}-${tm.month}`}
                        onClick={() => toggleTargetMonth(tm.year, tm.month)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarRange className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span>{tm.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Replication Rule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">3</span>
                  <span>Forma de Alinhamento da Escala</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('weekday_pattern')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                      mode === 'weekday_pattern'
                        ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        Por Dia da Semana (Recomendado)
                      </span>
                      {mode === 'weekday_pattern' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Mantém a mesma rotina semanal: as segundas-feiras, terças, etc. de cada mês de destino recebem os mesmos plantões (PS/Agenda, horários e médicos).
                    </p>
                  </button>

                  <button
                    onClick={() => setMode('day_of_month')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                      mode === 'day_of_month'
                        ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        Dia a Dia (1º ao 30/31)
                      </span>
                      {mode === 'day_of_month' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Copia diretamente o dia 1º de Setembro para o dia 1º do próximo mês, o dia 2 para o dia 2, e assim por diante.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 4: Options Checkboxes */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Opções de Preservação:
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-0.5 rounded text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Preservar Horários e Carga Horária Exata</div>
                      <div className="text-slate-500 text-[11px]">
                        Início, término e quantidade exata de horas (4h, 6h, 12h, 24h) são transferidos fielmente.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-0.5 rounded text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Preservar Modalidade (PS ou Agenda)</div>
                      <div className="text-slate-500 text-[11px]">
                        Plantões de Pronto-Socorro continuam como PS e plantões eletivos continuam como Agenda.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDoctors}
                      onChange={e => setIncludeDoctors(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Manter Médicos Escalados</div>
                      <div className="text-slate-500 text-[11px]">
                        Se desmarcado, os plantões são criados como "Vago" para que os médicos da equipe assumam.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={e => setOverwriteExisting(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Substituir plantões existentes nos meses de destino</div>
                      <div className="text-slate-500 text-[11px]">
                        Limpa escalas anteriores dos meses selecionados para evitar duplicidades indesejadas.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Footer CTA */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Total de destino: <strong className="text-slate-900">{selectedTargets.length} mês(es)</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleReplicate}
                    disabled={isSubmitting || sourceShifts.length === 0}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                      isSubmitting || sourceShifts.length === 0
                        ? 'bg-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                    }`}
                  >
                    <Repeat className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{isSubmitting ? 'Reproduzindo Escala...' : 'Reproduzir Escala Agora'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
