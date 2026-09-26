import { useState, useEffect, useCallback } from 'react';
import { Shift, Doctor } from '../types';
import { 
  ReminderSettings, 
  getReminderSettings, 
  saveReminderSettings, 
  getNotifiedHistory, 
  saveNotifiedHistory, 
  triggerPushNotification, 
  requestPushPermission, 
  evaluateDoctorShifts, 
  ShiftReminderStatus,
  playChimeSound
} from '../utils/notifications';
import { formatFriendlyDate } from '../utils/date';

export function useShiftReminders(
  shifts: Shift[],
  currentDoctor: Doctor | null,
  onShowInAppNotification: (title: string, message: string) => void
) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [settings, setSettings] = useState<ReminderSettings>(getReminderSettings());
  const [upcomingReminders, setUpcomingReminders] = useState<ShiftReminderStatus[]>([]);

  // Update reminders list whenever shifts or doctor changes
  useEffect(() => {
    if (!currentDoctor) return;
    const list = evaluateDoctorShifts(shifts, currentDoctor.id);
    setUpcomingReminders(list);
  }, [shifts, currentDoctor]);

  // Request browser permission
  const handleRequestPermission = useCallback(async () => {
    const res = await requestPushPermission();
    setPermission(res);
    return res;
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<ReminderSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveReminderSettings(updated);
      return updated;
    });
  }, []);

  // Send simulated/test push notification
  const handleTestPush = useCallback(async (type: '24h' | '2h' = '24h') => {
    if (permission !== 'granted') {
      const granted = await handleRequestPermission();
      if (granted !== 'granted') {
        alert('Por favor, permita as notificações no navegador para receber os alertas de plantão.');
        return;
      }
    }

    const docName = currentDoctor ? currentDoctor.name : 'Doutor(a)';
    if (type === '24h') {
      const title = '🩺 uFetal: Lembrete de Plantão em 24h!';
      const body = `${docName}, seu plantão de Medicina Fetal começará amanhã às 07:00 no Hospital Maternidade Central.`;
      triggerPushNotification(title, body, settings.soundEnabled);
      onShowInAppNotification(title, body);
    } else {
      const title = '🚨 uFetal: Atenção! Plantão em 2 Horas';
      const body = `${docName}, faltam apenas 2 horas para o início do seu plantão. Sala de Parto & Vitalidade Fetal.`;
      triggerPushNotification(title, body, settings.soundEnabled);
      onShowInAppNotification(title, body);
    }
  }, [permission, handleRequestPermission, currentDoctor, settings.soundEnabled, onShowInAppNotification]);

  // Background monitor: checks every 30 seconds
  useEffect(() => {
    if (!currentDoctor) return;

    function checkShifts() {
      if (!currentDoctor) return;
      const currentHistory = getNotifiedHistory();
      let historyChanged = false;

      const now = new Date();
      const list = evaluateDoctorShifts(shifts, currentDoctor.id, now);
      setUpcomingReminders(list);

      for (const item of list) {
        const shiftId = item.shift.id;
        const shiftRecord = currentHistory[shiftId] || {};

        // 1. Check 24-hour reminder
        if (settings.remind24hBefore && item.hoursUntilStart <= 24 && item.hoursUntilStart > 2 && !shiftRecord.notified24h) {
          shiftRecord.notified24h = true;
          historyChanged = true;

          const title = '🩺 Lembrete: Plantão uFetal em 24 Horas!';
          const body = `${currentDoctor.name}, você está escalado(a) para ${formatFriendlyDate(item.shift.date)} das ${item.shift.startTime} às ${item.shift.endTime} (${item.shift.sector}).`;
          
          triggerPushNotification(title, body, settings.soundEnabled);
          onShowInAppNotification(title, body);
        }

        // 2. Check 2-hour reminder
        if (settings.remind2hBefore && item.hoursUntilStart <= 2 && item.hoursUntilStart > 0 && !shiftRecord.notified2h) {
          shiftRecord.notified2h = true;
          historyChanged = true;

          const title = '🚨 Atenção: Seu Plantão Fetal começa em 2 Horas!';
          const body = `Início às ${item.shift.startTime} no ${item.shift.location}. Setor: ${item.shift.sector}.`;

          triggerPushNotification(title, body, settings.soundEnabled);
          onShowInAppNotification(title, body);
        }

        currentHistory[shiftId] = shiftRecord;
      }

      if (historyChanged) {
        saveNotifiedHistory(currentHistory);
      }
    }

    // Run immediately and every 60 seconds (1 minute for efficiency, still responsive)
    checkShifts();
    const interval = setInterval(checkShifts, 60000);

    return () => clearInterval(interval);
  }, [shifts, currentDoctor, settings, onShowInAppNotification]);

  return {
    permission,
    settings,
    upcomingReminders,
    requestPermission: handleRequestPermission,
    updateSettings: handleUpdateSettings,
    testPush: handleTestPush,
  };
}
