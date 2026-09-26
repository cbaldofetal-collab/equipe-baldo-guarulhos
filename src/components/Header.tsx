import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  ListFilter, 
  Plus, 
  ArrowLeftRight, 
  Users, 
  Activity, 
  Baby, 
  ChevronDown, 
  Check, 
  ShieldCheck,
  Radio,
  Share2,
  Bell,
  BellRing,
  Repeat,
  Trash2
} from 'lucide-react';
import { Doctor, Shift, TradeRequest } from '../types';

interface HeaderProps {
  currentView: 'month' | 'week' | 'day' | 'list' | 'trades' | 'calendar-public';
  onViewChange: (view: 'month' | 'week' | 'day' | 'list' | 'trades' | 'calendar-public') => void;
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSelectDoctor: (doctor: Doctor) => void;
  onOpenAddShift: () => void;
  onOpenTradesModal: () => void;
  onOpenTeamModal: () => void;
  onOpenAuditDrawer: () => void;
  onOpenExportModal: () => void;
  onOpenRemindersModal: () => void;
  onOpenResetModal?: () => void;
  onOpenAuthorizationModal?: () => void;
  pendingTradesCount: number;
  openShiftsCount: number;
  upcomingRemindersCount: number;
  hasPushPermission: boolean;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  doctors,
  currentDoctor,
  onSelectDoctor,
  onOpenAddShift,
  onOpenTradesModal,
  onOpenTeamModal,
  onOpenAuditDrawer,
  onOpenExportModal,
  onOpenRemindersModal,
  onOpenResetModal,
  onOpenAuthorizationModal,
  pendingTradesCount,
  openShiftsCount,
  upcomingRemindersCount,
  hasPushPermission,
  isConnected,
}) => {
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  const attentionTotal = pendingTradesCount + openShiftsCount;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Bar: Brand, Realtime Badge, Doctor Identity, Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 ring-2 ring-teal-600/30">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Outfit']">
                  u<span className="text-teal-600">Fetal</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  Medicina Fetal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Escala de Plantão e Procedimentos em Tempo Real
              </p>
            </div>
          </div>

          {/* Center / Right status & controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time sync badge */}
            <button
              onClick={onOpenAuditDrawer}
              title="Clique para ver o histórico de atualizações ao vivo"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
              <span className="hidden sm:inline text-slate-600 font-medium">
                {isConnected ? 'Tempo Real' : 'Reconectando...'}
              </span>
            </button>

            {/* Shift trades & open shifts alert badge */}
            <button
              onClick={onOpenTradesModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                attentionTotal > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Trocas & Vagos</span>
              {attentionTotal > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  {attentionTotal}
                </span>
              )}
            </button>

            {/* Team Directory button */}
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Equipe</span>
            </button>

            {/* Export modal button */}
            <button
              onClick={onOpenExportModal}
              title="Exportar escala para WhatsApp ou Calendário"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            {/* Authorization modal button - Only for coordinator */}
            {currentDoctor?.is_coordinator && onOpenAuthorizationModal && (
              <button
                onClick={onOpenAuthorizationModal}
                title="Autorizar médicos para gerenciar a escala"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Acessos</span>
              </button>
            )}

            {/* Shift Reminders & Push Notification button */}
            <button
              onClick={onOpenRemindersModal}
              title="Configurar Lembretes Push (24h e 2h antes)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                upcomingRemindersCount > 0
                  ? 'bg-amber-500/10 text-amber-900 border border-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BellRing className={`w-3.5 h-3.5 ${hasPushPermission ? 'text-amber-600' : 'text-slate-500'}`} />
              <span className="hidden md:inline">Lembretes</span>
              {upcomingRemindersCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  {upcomingRemindersCount}
                </span>
              )}
            </button>

            {/* Doctor Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: currentDoctor.color }}
                >
                  {currentDoctor.initials}
                </div>
                <div className="hidden lg:block text-xs leading-tight">
                  <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                    {currentDoctor.name}
                  </div>
                  <div className="text-[10px] text-slate-500">{currentDoctor.crm}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {docDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDocDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Você está operando como:
                    </p>
                    <p className="text-xs font-bold text-slate-800">{currentDoctor.name}</p>
                    <p className="text-[11px] text-teal-600">{currentDoctor.specialty}</p>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[11px] font-medium text-slate-400">
                      Trocar para outro médico da equipe:
                    </p>
                    {doctors.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => onSelectDoctor(doc)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          doc.id === currentDoctor.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: doc.color }}
                          >
                            {doc.initials}
                          </span>
                          <div>
                            <div>{doc.name}</div>
                            <div className="text-[10px] text-slate-400">{doc.crm}</div>
                          </div>
                        </div>
                        {doc.id === currentDoctor.id && (
                          <Check className="w-4 h-4 text-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 px-2 space-y-0.5">
                    <button
                      onClick={() => {
                        setDocDropdownOpen(false);
                        onOpenTeamModal();
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-teal-700 hover:bg-teal-50 rounded font-medium transition cursor-pointer"
                    >
                      + Cadastrar novo médico
                    </button>
                    {onOpenResetModal && (
                      <button
                        onClick={() => {
                          setDocDropdownOpen(false);
                          onOpenResetModal();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Gerenciar / Limpar Escala</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onOpenAddShift}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm shadow-teal-600/20 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Plantão</span>
              <span className="sm:hidden">Novo</span>
            </button>

          </div>
        </div>

        {/* View Selection Tabs (Calendário Mensal, Calendário Semanal, Agenda Diária, Lista) */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-2">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => onViewChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'month'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Calendário Mensal</span>
            </button>

            <button
              onClick={() => onViewChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'week'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              <span>Calendário Semanal</span>
            </button>

            <button
              onClick={() => onViewChange('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'day'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Agenda Diária</span>
            </button>

            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'list'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lista / Filtros</span>
            </button>

            <button
              onClick={() => onViewChange('trades')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'trades'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Trocas</span>
            </button>

            <button
              onClick={() => onViewChange('calendar-public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentView === 'calendar-public'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
          </div>

          {/* Quick Legend / Info */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              Confirmado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Sobreaviso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600"></span>
              Troca Solicitada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-dashed border-slate-500"></span>
              Vago
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
