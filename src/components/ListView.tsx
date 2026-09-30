import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowLeftRight, 
  Check, 
  Clock, 
  Building2, 
  FileText, 
  Trash2, 
  Edit3, 
  Share2, 
  Download, 
  Printer,
  Copy,
  Calendar
} from 'lucide-react';
import { Shift, Doctor } from '../types';
import { formatDateToPt, calculateHours, MONTH_NAMES_PT } from '../utils/date';
import { generateWhatsAppScheduleText, downloadICalendar } from '../utils/exportSchedule';

interface ListViewProps {
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  currentDate: Date;
  onSelectShift: (shift: Shift) => void;
  onClaimShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onOpenAddShift: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  shifts,
  doctors,
  currentDoctor,
  currentDate,
  onSelectShift,
  onClaimShift,
  onDeleteShift,
  onOpenAddShift,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const docMap = new Map<string, Doctor>(doctors.map(d => [d.id, d]));

  // Filter shifts
  const filtered = shifts.filter(shift => {
    // Doctor
    if (doctorFilter === 'vago') {
      if (shift.doctorId !== null) return false;
    } else if (doctorFilter === 'mine') {
      if (shift.doctorId !== currentDoctor.id) return false;
    } else if (doctorFilter !== 'all') {
      if (shift.doctorId !== doctorFilter) return false;
    }

    // Modality
    if (modalityFilter !== 'all') {
      const shiftMod = shift.modality || (shift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
      if (shiftMod !== modalityFilter) return false;
    }

    // Status
    if (statusFilter === 'trade_requested' && shift.status !== 'trade_requested') return false;
    if (statusFilter === 'confirmed' && shift.status !== 'confirmed') return false;
    if (statusFilter === 'open' && shift.doctorId !== null) return false;

    // Sector
    if (sectorFilter !== 'all' && shift.sector !== sectorFilter) return false;

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
      const matchDoc = doc?.name.toLowerCase().includes(q) || false;
      const matchSector = shift.sector.toLowerCase().includes(q);
      const matchLocation = shift.location.toLowerCase().includes(q);
      const matchNotes = shift.notes?.toLowerCase().includes(q) || false;
      const matchDate = shift.date.includes(q);
      const matchModality = (shift.modality === 'ps' ? 'ps pronto socorro' : 'agenda eletivo').includes(q);
      if (!matchDoc && !matchSector && !matchLocation && !matchNotes && !matchDate && !matchModality) return false;
    }

    return true;
  }).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));

  // WhatsApp copy action
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppScheduleText(
      filtered,
      doctors,
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handleDownloadICS = () => {
    downloadICalendar(filtered, doctors, doctorFilter !== 'all' && doctorFilter !== 'vago' ? doctorFilter : undefined);
  };

  const sectors = Array.from(new Set(shifts.map(s => s.sector)));

  // Calculate total hours accurately
  const totalHours = filtered.reduce((sum, s) => {
    const h = typeof s.durationHours === 'number' && s.durationHours > 0
      ? s.durationHours
      : calculateHours(s.startTime, s.endTime, s.shiftType);
    return sum + h;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por médico, setor, hospital ou data..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Export and Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyWhatsApp}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? 'Copiado para o WhatsApp!' : 'Copiar Escala (WhatsApp)'}</span>
            </button>

            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Baixar arquivo de calendário .ics"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar iCal</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Imprimir Escala"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>

        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtros:</span>
          </div>

          {/* Doctor filter */}
          <select
            value={doctorFilter}
            onChange={e => setDoctorFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">Todos os Médicos</option>
            <option value="mine">⭐ Meus Plantões</option>
            <option value="vago">⚠️ Somente Vagos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Modality filter */}
          <select
            value={modalityFilter}
            onChange={e => setModalityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">Todas as Modalidades</option>
            <option value="ps">🏥 Pronto-Socorro (PS)</option>
            <option value="agenda">📋 Agenda / Eletivo</option>
          </select>

          {/* Sector filter */}
          <select
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all">Todos os Setores / Procedimentos</option>
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="confirmed">Confirmados</option>
            <option value="trade_requested">Com Troca Solicitada</option>
            <option value="open">Vagos (Abertos)</option>
          </select>

          {(doctorFilter !== 'all' || sectorFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setDoctorFilter('all');
                setSectorFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-teal-700 font-semibold hover:underline px-2"
            >
              Limpar Filtros
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500">
            <span className="font-bold text-slate-800">{filtered.length}</span> plantões ({totalHours}h no total)
          </div>
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Modalidade & Horas</th>
                <th className="py-3 px-4">Médico Plantonista</th>
                <th className="py-3 px-4">Setor / Procedimento</th>
                <th className="py-3 px-4">Hospital / Unidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum plantão encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(shift => {
                  const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
                  const isCurrentUser = shift.doctorId === currentDoctor.id;
                  const isOpen = shift.doctorId === null;
                  const isTrade = shift.status === 'trade_requested';
                  const shiftModality = shift.modality || (shift.shiftType === 'sobreaviso' ? 'ps' : 'agenda');
                  const hours = typeof shift.durationHours === 'number' && shift.durationHours > 0
                    ? shift.durationHours
                    : calculateHours(shift.startTime, shift.endTime, shift.shiftType);

                  return (
                    <tr
                      key={shift.id}
                      onClick={() => onSelectShift(shift)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isOpen ? 'bg-amber-50/30' : isCurrentUser ? 'bg-teal-50/20' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatDateToPt(shift.date)}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {shift.shiftType === 'sobreaviso'
                              ? 'Sobreaviso 24h'
                              : `${shift.startTime} - ${shift.endTime}`}
                          </span>
                        </div>
                      </td>

                      {/* Modality & Hours */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                            shiftModality === 'ps'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {shiftModality === 'ps' ? '🏥 PS' : '📋 Agenda'}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {hours}h
                          </span>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isOpen ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                              Plantão Vago
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimShift(shift);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition"
                            >
                              Assumir
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: doc?.color || '#0d9488' }}
                            >
                              {doc?.initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {doc?.name}
                                {isCurrentUser && (
                                  <span className="ml-1 text-[10px] text-teal-600 font-semibold">(Você)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{doc?.crm}</div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{shift.sector}</span>
                        {shift.notes && (
                          <div className="text-[10px] text-slate-400 italic line-clamp-1">
                            {shift.notes}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className={`flex items-center gap-1 w-fit ${
                          shiftModality === 'ps' ? 'px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold' : ''
                        }`}>
                          <Building2 className={`w-3.5 h-3.5 ${shiftModality === 'ps' ? 'text-white' : 'text-slate-400'}`} />
                          <span>{shift.location}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isOpen ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Vago
                          </span>
                        ) : isTrade ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-400 flex items-center gap-1 w-fit">
                            <ArrowLeftRight className="w-2.5 h-2.5" /> Troca Solicitada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Confirmado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectShift(shift)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Editar / Ver Detalhes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover o plantão de ${formatDateToPt(shift.date)}?`)) {
                                onDeleteShift(shift.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir Plantão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
