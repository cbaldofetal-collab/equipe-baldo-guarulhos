import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle, Clock, Plus, X } from 'lucide-react';
import { Doctor, Shift } from '../types';

interface TradeRequest {
  id: string;
  shift_id: string;
  from_doctor_id: string;
  from_doctor_name: string;
  to_doctor_id?: string;
  to_doctor_name?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  shift_date: string;
  shift_time: string;
}

interface NewTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  doctors: Doctor[];
  currentDoctor: Doctor;
  onSubmit: (shiftId: string, note: string, toDoctorId?: string) => void;
}

const NewTradeModal: React.FC<NewTradeModalProps> = ({ isOpen, onClose, shifts, doctors, currentDoctor, onSubmit }) => {
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myShifts = shifts.filter(s => s.doctor_id === currentDoctor.id);

  const handleSubmit = async () => {
    if (!selectedShiftId) {
      alert('Selecione um plantão');
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(selectedShiftId, 'Solicitação de troca', targetDoctorId || undefined);
      setSelectedShiftId('');
      setTargetDoctorId('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Solicitar Troca de Plantão</h3>
              <p className="text-xs text-slate-500">Escolha qual plantão você deseja trocar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Selecione o plantão:</label>
            <select
              value={selectedShiftId}
              onChange={e => setSelectedShiftId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">-- Escolha um plantão --</option>
              {myShifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.date} • {shift.start_time}-{shift.end_time} ({shift.shift_type})
                </option>
              ))}
            </select>
            {myShifts.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Você não tem plantões escalados para trocar</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Direcionar para (opcional):</label>
            <select
              value={targetDoctorId}
              onChange={e => setTargetDoctorId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Aberto para toda a equipe</option>
              {doctors
                .filter(d => d.id !== currentDoctor.id)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
            <p className="text-xs text-teal-800">
              <strong>💡 Dica:</strong> Sua solicitação ficará visível no mural de trocas para que um colega possa assumir o plantão.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedShiftId}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Troca'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface TradesPageProps {
  shifts?: Shift[];
  doctors?: Doctor[];
  currentDoctor?: Doctor;
}

export const TradesPage: React.FC<TradesPageProps> = ({
  shifts = [],
  doctors = [],
  currentDoctor
}) => {
  const [activeTab, setActiveTab] = useState<'requested' | 'received'>('requested');
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const res = await fetch('/api/trades');
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades || []);
      }
    } catch (err) {
      console.error('Error loading trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/accept`, { method: 'POST', body: JSON.stringify({ acceptingDoctorId: currentDoctor?.id }) });
      if (res.ok) {
        await loadTrades();
      }
    } catch (err) {
      console.error('Error accepting trade:', err);
    }
  };

  const handleRejectTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/reject`, { method: 'POST' });
      if (res.ok) {
        await loadTrades();
      }
    } catch (err) {
      console.error('Error rejecting trade:', err);
    }
  };

  const handleSubmitNewTrade = async (shiftId: string, note: string, toDoctorId?: string) => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: shiftId,
          from_doctor_id: currentDoctor?.id,
          to_doctor_id: toDoctorId,
          note,
        }),
      });
      if (res.ok) {
        await loadTrades();
      }
    } catch (err) {
      console.error('Error creating trade:', err);
    }
  };

  const requestedTrades = trades.filter(t => t.status === 'pending' && t.from_doctor_id === currentDoctor?.id);
  const receivedTrades = trades.filter(t => t.status === 'pending' && t.to_doctor_id === currentDoctor?.id);

  const displayTrades = activeTab === 'requested' ? requestedTrades : receivedTrades;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Gerenciar Trocas</h1>
            </div>
            <button
              onClick={() => setIsNewTradeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Solicitar
            </button>
          </div>
          <p className="text-slate-600">Solicite ou aceite trocas de plantões com facilidade</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('requested')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'requested'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Trocas Requisitadas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'received'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Pedidos Recebidos
            </div>
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <ArrowLeftRight className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-slate-600 mt-4">Carregando trocas...</p>
          </div>
        ) : displayTrades.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <ArrowLeftRight className="w-16 h-16 text-slate-300 mx-auto mb-4 opacity-50" />
            <p className="text-slate-500 text-lg font-medium">Não há trocas em andamento</p>
            <p className="text-slate-400 text-sm mt-2">
              {activeTab === 'requested'
                ? 'Clique em "Solicitar" para criar uma nova troca'
                : 'Ninguém solicitou trocar com você ainda'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTrades.map(trade => (
              <div key={trade.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{trade.from_doctor_name}</p>
                      <p className="text-sm text-slate-600">{trade.shift_time} • {trade.shift_date}</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 mb-4">{trade.reason}</p>
                {activeTab === 'received' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptTrade(trade.id)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleRejectTrade(trade.id)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Trade Modal */}
      {currentDoctor && (
        <NewTradeModal
          isOpen={isNewTradeModalOpen}
          onClose={() => setIsNewTradeModalOpen(false)}
          shifts={shifts}
          doctors={doctors}
          currentDoctor={currentDoctor}
          onSubmit={handleSubmitNewTrade}
        />
      )}
    </div>
  );
};
