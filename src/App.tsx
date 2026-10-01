import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Doctor,
  Shift,
  TradeRequest,
  AuditLogEntry,
  UFetalState
} from './types';
import { API_URL } from './utils/api';
import { Header } from './components/Header';
import { CalendarMonthView } from './components/CalendarMonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { ListView } from './components/ListView';
import { TradesPage } from './pages/TradesPage';
import { CalendarPublic } from './pages/CalendarPublic';
import { ShiftModal } from './components/ShiftModal';
import { ReplicateShiftModal } from './components/ReplicateShiftModal';
import { TradeRequestsModal } from './components/TradeRequestsModal';
import { TeamDirectoryModal } from './components/TeamDirectoryModal';
import { ExportModal } from './components/ExportModal';
import { RemindersModal } from './components/RemindersModal';
import { ResetScheduleModal } from './components/ResetScheduleModal';
import { AuthorizationModal } from './components/AuthorizationModal';
import { AuditFeedDrawer } from './components/AuditFeedDrawer';
import { LiveToast } from './components/LiveToast';
import { useShiftReminders } from './hooks/useShiftReminders';
import { BellRing, CheckCircle2, Trash2, UserMinus } from 'lucide-react';

const DEFAULT_CURRENT_DATE = new Date(2026, 8, 10); // Sept 10, 2026

export default function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);

  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list' | 'trades' | 'calendar-public'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(DEFAULT_CURRENT_DATE);
  const [isConnected, setIsConnected] = useState(false);

  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [defaultDateForNewShift, setDefaultDateForNewShift] = useState<string | undefined>();
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [shiftToReplicate, setShiftToReplicate] = useState<Shift | null>(null);
  const [isTradesModalOpen, setIsTradesModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAuthorizationModalOpen, setIsAuthorizationModalOpen] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [deleteConfirmShiftId, setDeleteConfirmShiftId] = useState<string | null>(null);
  const [deleteConfirmDoctor, setDeleteConfirmDoctor] = useState<{ id: string; name: string; shiftCount: number } | null>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setLiveToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setLiveToast(null);
    }, 4500);
  }, []);

  // Proactive Push Reminders Hook (24h & 2h before shifts)
  // Temporarily disabled due to infinite loop issue
  // const {
  //   permission: pushPermission,
  //   settings: reminderSettings,
  //   upcomingReminders,
  //   requestPermission: requestPushPermission,
  //   updateSettings: updateReminderSettings,
  //   testPush: triggerTestPush,
  // } = useShiftReminders(shifts, currentDoctor, (title, body) => {
  //   showToast(`🔔 ${title}: ${body}`);
  // });

  // Dummy values for testing
  const pushPermission = 'default';
  const reminderSettings = {};
  const upcomingReminders: any[] = [];
  const requestPushPermission = () => Promise.resolve();
  const updateReminderSettings = () => Promise.resolve();
  const triggerTestPush = () => Promise.resolve();

  // Fetch initial state via REST
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/state`);
      if (res.ok) {
        const data: UFetalState = await res.json();
        setDoctors(data.doctors || []);
        setShifts(data.shifts || []);
        setTrades(data.trades || []);
        setAuditLogs(data.auditLogs || []);

        // Default to coordinator if not selected
        setCurrentDoctor(prev => {
          if (prev) {
            const updated = data.doctors?.find(d => d.id === prev.id);
            return updated || prev;
          }
          const coordinator = data.doctors?.find(d => d.is_coordinator) || data.doctors?.[0] || null;
          return coordinator;
        });
      }
    } catch (err) {
      console.error('Failed to load initial uFetal state:', err);
    }
  }, []);

  // SSE Real-time connection setup
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;

    function connectSSE() {
      // Use a simple token for SSE authentication (in production, use JWT)
      const token = localStorage.getItem('ufetal_token') || 'demo-token-' + Math.random().toString(36).substring(2, 10);
      if (!localStorage.getItem('ufetal_token')) {
        localStorage.setItem('ufetal_token', token);
      }
      eventSource = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // EventSource will automatically retry connecting
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'init' && payload.state) {
            const s: UFetalState = payload.state;
            setDoctors(s.doctors || []);
            setShifts(s.shifts || []);
            setTrades(s.trades || []);
            setAuditLogs(s.auditLogs || []);
            setCurrentDoctor(curr => curr || s.doctors?.find(d => d.is_coordinator) || s.doctors?.[0] || null);
          } else if (payload.type === 'shift_created' && payload.shift) {
            setShifts(prev => {
              const exists = prev.some(s => s.id === payload.shift.id);
              return exists ? prev : [...prev, payload.shift];
            });
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'shift_updated' && payload.shift) {
            setShifts(prev => prev.map(s => s.id === payload.shift.id ? payload.shift : s));
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'shift_deleted' && payload.shiftId) {
            setShifts(prev => prev.filter(s => s.id !== payload.shiftId));
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'shift_claimed' && payload.shift) {
            setShifts(prev => prev.map(s => s.id === payload.shift.id ? payload.shift : s));
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'trade_updated') {
            if (payload.shift) {
              setShifts(prev => prev.map(s => s.id === payload.shift.id ? payload.shift : s));
            }
            if (payload.trade) {
              setTrades(prev => {
                const idx = prev.findIndex(t => t.id === payload.trade.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = payload.trade;
                  return copy;
                }
                return [...prev, payload.trade];
              });
            }
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'doctor_added' && payload.doctor) {
            setDoctors(prev => {
              const exists = prev.some(d => d.id === payload.doctor.id);
              return exists ? prev : [...prev, payload.doctor];
            });
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'doctor_removed' && payload.doctorId) {
            setDoctors(prev => prev.filter(d => d.id !== payload.doctorId));
            setShifts(prev => prev.map(s => s.doctorId === payload.doctorId ? { ...s, doctorId: null, status: 'open' } : s));
          } else if (payload.type === 'doctor_authorized') {
            const { doctorId, authorized } = payload;
            setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, authorized_to_manage: authorized } : d));
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'schedule_replicated' || payload.type === 'state_updated') {
            if (payload.state) {
              setShifts(payload.state.shifts || []);
              setTrades(payload.state.trades || []);
            }
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          } else if (payload.type === 'schedule_cleared') {
            setShifts([]);
            setTrades([]);
            if (payload.auditLog) {
              setAuditLogs(prev => [payload.auditLog, ...prev]);
              showToast(payload.auditLog.summary);
            }
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [fetchState, showToast]);

  // Handlers for Shift Operations
  const handleSaveShift = async (shiftData: Partial<Shift>) => {
    try {
      const payload = {
        ...shiftData,
        authorName: currentDoctor?.name || 'Médico da Equipe',
        currentDoctorId: currentDoctor?.id,
      };

      if (shiftData.id) {
        // Edit existing
        const res = await fetch(`/api/shifts/${shiftData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
          showToast('✅ Plantão atualizado com sucesso!');
        } else {
          const errorData = await res.json();
          showToast(`❌ Erro: ${errorData.error || 'Não foi possível atualizar o plantão'}`);
        }
      } else {
        // Create new
        const res = await fetch(`/api/shifts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setShifts(prev => prev.some(s => s.id === created.id) ? prev : [...prev, created]);
          showToast('✅ Plantão criado com sucesso!');
          // Open replicate modal after creating a new shift
          setShiftToReplicate(created);
          setIsReplicateModalOpen(true);
          setIsShiftModalOpen(false);
        } else {
          const errorData = await res.json();
          showToast(`❌ Erro: ${errorData.error || 'Não foi possível criar o plantão'}`);
        }
      }
    } catch (err) {
      console.error('Error saving shift:', err);
      showToast('❌ Erro ao salvar plantão');
    }
  };

  const handleRequestDeleteConfirmation = (shiftId: string) => {
    setDeleteConfirmShiftId(shiftId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmShiftId) return;
    setDeleteConfirmShiftId(null);
    setIsShiftModalOpen(false);

    try {
      const authorName = encodeURIComponent(currentDoctor?.name || 'Médico da Equipe');
      const currentDoctorId = encodeURIComponent(currentDoctor?.id || '');
      const res = await fetch(`/api/shifts/${deleteConfirmShiftId}?authorName=${authorName}&currentDoctorId=${currentDoctorId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShifts(prev => prev.filter(s => s.id !== deleteConfirmShiftId));
        showToast('✅ Plantão removido com sucesso!');
      } else {
        const errorData = await res.json();
        showToast(`❌ Erro: ${errorData.error || 'Não foi possível remover o plantão'}`);
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      showToast('❌ Erro ao remover plantão');
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmShiftId(null);
  };

  const handleAuthorizationChange = async (doctorId: string, authorized: boolean) => {
    if (!currentDoctor?.is_coordinator) return;

    try {
      const res = await fetch(`/api/doctors/${doctorId}/authorize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: currentDoctor.id,
          authorized,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDoctors(prev =>
          prev.map(d =>
            d.id === doctorId
              ? { ...d, authorized_to_manage: authorized }
              : d
          )
        );
        const action = authorized ? 'autorizado' : 'removido de autorizado';
        showToast(`✅ Médico ${action} para gerenciar a escala!`);
      } else {
        const errorData = await res.json();
        showToast(`❌ Erro: ${errorData.error || 'Não foi possível autorizar'}`);
      }
    } catch (err) {
      console.error('Error authorizing doctor:', err);
      showToast('❌ Erro ao autorizar médico');
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    try {
      const authorName = encodeURIComponent(currentDoctor?.name || 'Médico da Equipe');
      const res = await fetch(`/api/shifts/${shiftId}?authorName=${authorName}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShifts(prev => prev.filter(s => s.id !== shiftId));
        showToast('✅ Plantão removido com sucesso!');
      } else {
        const errorData = await res.json();
        showToast(`❌ Erro: ${errorData.error || 'Não foi possível remover o plantão'}`);
      }
    } catch (err) {
      console.error('Error deleting shift:', err);
      showToast('❌ Erro ao remover plantão');
    }
  };

  const handleClaimShift = async (shift: Shift) => {
    if (!currentDoctor) return;
    try {
      const res = await fetch(`/api/shifts/${shift.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: currentDoctor.id }),
      });
      if (res.ok) {
        const updated = await res.json();
        setShifts(prev => prev.map(s => s.id === updated.id ? updated : s));
        showToast(`Você assumiu o plantão de ${updated.date}!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Erro: ${errorData.error || 'Falha ao assumir plantão'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message || 'Falha ao assumir plantão'}`);
    }
  };

  const handleRequestTrade = async (shiftId: string, note: string, toDoctorId?: string) => {
    if (!currentDoctor) return;
    try {
      const res = await fetch(`/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          fromDoctorId: currentDoctor.id,
          toDoctorId: toDoctorId || null,
          note,
        }),
      });
      if (res.ok) {
        const { trade, shift } = await res.json();
        setTrades(prev => [...prev, trade]);
        setShifts(prev => prev.map(s => s.id === shift.id ? shift : s));
        showToast('Solicitação de troca enviada para a equipe!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Erro: ${errorData.error || 'Falha ao solicitar troca'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message || 'Falha ao solicitar troca'}`);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    if (!currentDoctor) return;
    try {
      const res = await fetch(`/api/trades/${tradeId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingDoctorId: currentDoctor.id }),
      });
      if (res.ok) {
        const { trade, shift } = await res.json();
        setTrades(prev => prev.map(t => t.id === trade.id ? trade : t));
        setShifts(prev => prev.map(s => s.id === shift.id ? shift : s));
        showToast(`Troca confirmada! Você assumiu o plantão de ${shift.date}.`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Erro: ${errorData.error || 'Falha ao aceitar troca'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message || 'Falha ao aceitar troca'}`);
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        const { trade } = await res.json();
        setTrades(prev => prev.map(t => t.id === tradeId ? trade : t));
        showToast('Solicitação de troca cancelada.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Erro: ${errorData.error || 'Falha ao cancelar troca'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message || 'Falha ao cancelar troca'}`);
    }
  };

  const handleReplicateShift = async (shiftId: string, months: number) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}/replicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months }),
      });
      if (res.ok) {
        const { createdCount, shifts: createdShifts } = await res.json();
        setShifts(prev => [...prev, ...createdShifts]);
        showToast(`✅ Escala replicada! ${createdCount} plantão(ões) criado(s)`);
        setIsReplicateModalOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`❌ Erro: ${errorData.error || 'Falha ao replicar escala'}`);
      }
    } catch (err: any) {
      showToast(`❌ Erro: ${err.message || 'Falha ao replicar escala'}`);
    }
  };

  const handleAddDoctor = async (docData: { name: string; crm: string; phone: string; email: string; specialty: string }) => {
    try {
      const res = await fetch(`/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData),
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDoctors(prev => prev.some(d => d.id === newDoc.id) ? prev : [...prev, newDoc]);
        showToast(`${newDoc.name} adicionado à equipe uFetal!`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`Erro: ${errorData.error || 'Falha ao adicionar médico'}`);
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message || 'Falha ao adicionar médico'}`);
    }
  };

  const handleRequestRemoveDoctor = (doc: Doctor, shiftCount: number) => {
    setDeleteConfirmDoctor({ id: doc.id, name: doc.name, shiftCount });
  };

  const handleCancelRemoveDoctor = () => {
    setDeleteConfirmDoctor(null);
  };

  const handleConfirmRemoveDoctor = async () => {
    if (!deleteConfirmDoctor) return;
    const doctorId = deleteConfirmDoctor.id;
    setDeleteConfirmDoctor(null);
    await handleRemoveDoctor(doctorId);
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: currentDoctor?.id }),
      });
      if (res.ok) {
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
        setShifts(prev => prev.map(s => s.doctorId === doctorId ? { ...s, doctorId: null, status: 'open' } : s));
        showToast('✅ Médico removido da equipe.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(`❌ Erro: ${errorData.error || 'Falha ao remover médico'}`);
      }
    } catch (err: any) {
      showToast(`❌ Erro: ${err.message || 'Falha ao remover médico'}`);
    }
  };

  // Navigation handlers
  const handleNavigateMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleNavigateWeek = (deltaDays: number) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + deltaDays);
      return next;
    });
  };

  const handleNavigateDay = (deltaDays: number) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + deltaDays);
      return next;
    });
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal for specific date
  const handleOpenAddShiftForDate = (dateStr: string) => {
    setShiftToEdit(null);
    setDefaultDateForNewShift(dateStr);
    setIsShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: Shift) => {
    setShiftToEdit(shift);
    setDefaultDateForNewShift(shift.date);
    setIsShiftModalOpen(true);
  };

  // Pending trades count and open shifts count
  const pendingTradesCount = trades.filter(t => t.status === 'pending').length;
  const openShiftsCount = shifts.filter(s => s.doctorId === null).length;

  // Auto-select first doctor if none selected
  useEffect(() => {
    if (!currentDoctor && doctors.length > 0) {
      setCurrentDoctor(doctors[0]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* App Header */}
      {currentDoctor && (
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          doctors={doctors}
          currentDoctor={currentDoctor}
          onSelectDoctor={setCurrentDoctor}
          onOpenAddShift={() => {
            setShiftToEdit(null);
            setDefaultDateForNewShift(undefined);
            setIsShiftModalOpen(true);
          }}
          onOpenTradesModal={() => setIsTradesModalOpen(true)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
          onOpenResetModal={() => setIsResetModalOpen(true)}
          onOpenAuthorizationModal={() => setIsAuthorizationModalOpen(true)}
          pendingTradesCount={pendingTradesCount}
          openShiftsCount={openShiftsCount}
          upcomingRemindersCount={upcomingReminders.length}
          hasPushPermission={pushPermission === 'granted'}
          isConnected={isConnected}
        />
      )}

      {/* Push Notification Activation Banner (if not yet granted) */}
      {pushPermission !== 'granted' && !dismissBanner && (
        <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Lembretes de Plantão:</strong> Receba notificações push no seu navegador <strong>24 horas</strong> e <strong>2 horas</strong> antes de cada plantão escalado.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={requestPushPermission}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition cursor-pointer shadow-xs"
              >
                Ativar Notificações Push
              </button>
              <button
                onClick={() => setDismissBanner(true)}
                className="px-2 py-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentDoctor && (
          <>
            {currentView === 'month' && (
              <CalendarMonthView
                currentDate={currentDate}
                onNavigateMonth={handleNavigateMonth}
                onGoToToday={handleGoToToday}
                shifts={shifts}
                doctors={doctors}
                currentDoctor={currentDoctor}
                onSelectShift={handleOpenEditShift}
                onAddShiftForDate={handleOpenAddShiftForDate}
                onClaimShift={handleClaimShift}
                onSwitchToWeekView={() => setCurrentView('week')}
                onOpenResetModal={() => setIsResetModalOpen(true)}
              />
            )}

            {currentView === 'week' && (
              <WeekView
                currentDate={currentDate}
                onNavigateWeek={handleNavigateWeek}
                onGoToToday={handleGoToToday}
                shifts={shifts}
                doctors={doctors}
                currentDoctor={currentDoctor}
                onSelectShift={handleOpenEditShift}
                onAddShiftForDate={handleOpenAddShiftForDate}
                onClaimShift={handleClaimShift}
                onSwitchToMonthView={() => setCurrentView('month')}
              />
            )}

            {currentView === 'day' && (
              <DayView
                currentDate={currentDate}
                onNavigateDay={handleNavigateDay}
                onGoToToday={handleGoToToday}
                shifts={shifts}
                doctors={doctors}
                currentDoctor={currentDoctor}
                onSelectShift={handleOpenEditShift}
                onAddShiftForDate={handleOpenAddShiftForDate}
                onClaimShift={handleClaimShift}
              />
            )}

            {currentView === 'list' && (
              <ListView
                shifts={shifts}
                doctors={doctors}
                currentDoctor={currentDoctor}
                currentDate={currentDate}
                onSelectShift={handleOpenEditShift}
                onClaimShift={handleClaimShift}
                onDeleteShift={handleDeleteShift}
                onOpenAddShift={() => {
                  setShiftToEdit(null);
                  setDefaultDateForNewShift(undefined);
                  setIsShiftModalOpen(true);
                }}
              />
            )}

            {currentView === 'trades' && (
              <TradesPage
                shifts={shifts}
                doctors={doctors}
                currentDoctor={currentDoctor}
              />
            )}

            {currentView === 'calendar-public' && (
              <CalendarPublic
                shifts={shifts}
                doctors={doctors}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      {currentDoctor && (
        <>
          <ShiftModal
            isOpen={isShiftModalOpen}
            onClose={() => setIsShiftModalOpen(false)}
            shiftToEdit={shiftToEdit}
            defaultDate={defaultDateForNewShift}
            doctors={doctors}
            currentDoctor={currentDoctor}
            shifts={shifts}
            onSaveShift={handleSaveShift}
            onDeleteShift={handleDeleteShift}
            onRequestDeleteConfirmation={handleRequestDeleteConfirmation}
            onClaimShift={handleClaimShift}
            onRequestTrade={handleRequestTrade}
          />

          <ReplicateShiftModal
            isOpen={isReplicateModalOpen}
            onClose={() => {
              setIsReplicateModalOpen(false);
              setShiftToReplicate(null);
            }}
            shift={shiftToReplicate}
            onReplicate={handleReplicateShift}
          />

          {/* Delete Confirmation Modal */}
          {deleteConfirmShiftId && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-slate-900">Remover plantão?</h3>
                    <p className="text-sm text-slate-600 mt-1">Esta ação é irreversível. O plantão será permanentemente removido da escala.</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remove Doctor Confirmation Modal */}
          {deleteConfirmDoctor && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <UserMinus className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-slate-900">
                      Remover {deleteConfirmDoctor.name} da equipe?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Esta ação não pode ser desfeita.
                      {deleteConfirmDoctor.shiftCount > 0 && (
                        <> {deleteConfirmDoctor.shiftCount} plantão(ões) deste mês ficarão vagos e precisarão ser reatribuídos.</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={handleCancelRemoveDoctor}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmRemoveDoctor}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          )}

          <TradeRequestsModal
            isOpen={isTradesModalOpen}
            onClose={() => setIsTradesModalOpen(false)}
            trades={trades}
            shifts={shifts}
            doctors={doctors}
            currentDoctor={currentDoctor}
            onAcceptTrade={handleAcceptTrade}
            onCancelTrade={handleCancelTrade}
            onClaimShift={handleClaimShift}
          />

          <TeamDirectoryModal
            isOpen={isTeamModalOpen}
            onClose={() => setIsTeamModalOpen(false)}
            doctors={doctors}
            currentDoctor={currentDoctor}
            shifts={shifts}
            currentDate={currentDate}
            onSelectDoctor={setCurrentDoctor}
            onAddDoctor={handleAddDoctor}
            onRequestRemoveDoctor={handleRequestRemoveDoctor}
          />

          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            shifts={shifts}
            doctors={doctors}
            currentDate={currentDate}
          />

          <RemindersModal
            isOpen={isRemindersModalOpen}
            onClose={() => setIsRemindersModalOpen(false)}
            settings={reminderSettings}
            permission={pushPermission}
            upcomingReminders={upcomingReminders}
            currentDoctor={currentDoctor}
            onRequestPermission={requestPushPermission}
            onUpdateSettings={updateReminderSettings}
            onTestPush={triggerTestPush}
          />

          <ResetScheduleModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            currentDoctor={currentDoctor}
            totalShifts={shifts.length}
            onSuccess={(msg) => {
              showToast(msg);
              fetchState();
            }}
          />

          <AuthorizationModal
            isOpen={isAuthorizationModalOpen}
            onClose={() => setIsAuthorizationModalOpen(false)}
            doctors={doctors}
            currentDoctor={currentDoctor}
            onAuthorizationChange={handleAuthorizationChange}
          />

          <AuditFeedDrawer
            isOpen={isAuditDrawerOpen}
            onClose={() => setIsAuditDrawerOpen(false)}
            logs={auditLogs}
            isConnected={isConnected}
          />

          <LiveToast
            message={liveToast}
            onDismiss={() => setLiveToast(null)}
          />
        </>
      )}

      {/* Subtle Medical Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-600">
            uFetal • Medicina Fetal e Diagnóstico Pré-Natal
          </span>
          <span>
            Escala colaborativa atualizada em tempo real para toda a equipe médica
          </span>
        </div>
      </footer>

    </div>
  );
}
