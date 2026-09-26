import React from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Sparkles,
  Send
} from 'lucide-react';
import { Doctor, Shift } from '../types';
import { ReminderSettings, ShiftReminderStatus } from '../utils/notifications';
import { formatFriendlyDate } from '../utils/date';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: NotificationPermission;
  settings: ReminderSettings;
  upcomingReminders: ShiftReminderStatus[];
  currentDoctor: Doctor;
  onRequestPermission: () => void;
  onUpdateSettings: (newSettings: Partial<ReminderSettings>) => void;
  onTestPush: (type: '24h' | '2h') => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  permission,
  settings,
  upcomingReminders,
  currentDoctor,
  onRequestPermission,
  onUpdateSettings,
  onTestPush,
}) => {
  if (!isOpen) return null;

  const isGranted = permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-['Outfit']">
                Sistema de Lembretes & Notificações Push
              </h3>
              <p className="text-xs text-slate-500">
                Alertas automáticos 24h e 2h antes de cada plantão para {currentDoctor.name}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Permission Status Banner */}
          <div className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isGranted 
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/70 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isGranted ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {isGranted ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {isGranted ? 'Notificações Push do Navegador Ativadas' : 'Permissão para Notificações Necessária'}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {isGranted 
                    ? 'Seu navegador está configurado para emitir avisos na tela mesmo com o aplicativo em segundo plano.'
                    : 'Permita o envio de notificações para receber os avisos de 24 horas e 2 horas no seu dispositivo.'}
                </p>
              </div>
            </div>

            {!isGranted && (
              <button
                onClick={onRequestPermission}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                Permitir Notificações
              </button>
            )}
          </div>

          {/* Settings Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <span>Configurações de Antecedência</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 24h Toggle */}
              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Lembrete de 24h</span>
                  <span className="block text-[11px] text-slate-500">1 dia antes do turno</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.remind24hBefore}
                  onChange={e => onUpdateSettings({ remind24hBefore: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              {/* 2h Toggle */}
              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Lembrete de 2h</span>
                  <span className="block text-[11px] text-slate-500">Alerta iminente</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.remind2hBefore}
                  onChange={e => onUpdateSettings({ remind2hBefore: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              {/* Sound Toggle */}
              <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Sinal Sonoro</span>
                    <span className="block text-[11px] text-slate-500">Bip suave uFetal</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={e => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Testar Notificações Imediatamente</span>
                </h4>
                <p className="text-[11px] text-teal-700">
                  Dispare um teste real para validar o aviso no seu computador ou celular agora mesmo:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onTestPush('24h')}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Testar Push de 24 Horas</span>
              </button>

              <button
                onClick={() => onTestPush('2h')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Testar Push de 2 Horas (Alerta)</span>
              </button>
            </div>
          </div>

          {/* Upcoming Shifts Schedule with Reminders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Próximos Plantões de {currentDoctor.name}</span>
                <span className="px-2 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {upcomingReminders.length}
                </span>
              </h4>
            </div>

            {upcomingReminders.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-slate-200/60">
                Você não possui plantões futuros agendados no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map(item => {
                  const shift = item.shift;
                  // Calculation for 24h and 2h trigger moments
                  const t24 = new Date(item.shiftStartTime.getTime() - 24 * 3600 * 1000);
                  const t2 = new Date(item.shiftStartTime.getTime() - 2 * 3600 * 1000);

                  const t24Formatted = `${t24.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${t24.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                  const t2Formatted = `${t2.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <div
                      key={shift.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {formatFriendlyDate(shift.date)}
                          </span>
                          <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {shift.shiftType === 'sobreaviso'
                              ? 'Sobreaviso 24h'
                              : `${shift.startTime} - ${shift.endTime}`}
                          </span>
                          <span className="text-xs font-medium text-slate-600">
                            {shift.sector}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Reminder milestones */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-800">Lembrete 24h: </span>
                            {item.isSent24h ? (
                              <span className="text-emerald-600 font-bold">Enviado ✔</span>
                            ) : (
                              <span className="text-slate-500">{t24Formatted}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-800">Lembrete 2h: </span>
                            {item.isSent2h ? (
                              <span className="text-emerald-600 font-bold">Enviado ✔</span>
                            ) : (
                              <span className="text-slate-500">No dia às {t2Formatted}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
