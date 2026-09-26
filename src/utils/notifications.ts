import { Shift, Doctor } from '../types';

export interface ReminderSettings {
  browserPushEnabled: boolean;
  remind24hBefore: boolean;
  remind2hBefore: boolean;
  soundEnabled: boolean;
}

const STORAGE_SETTINGS_KEY = 'ufetal_reminder_settings';
const STORAGE_NOTIFIED_KEY = 'ufetal_notified_shifts';

export function getReminderSettings(): ReminderSettings {
  try {
    const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return {
    browserPushEnabled: true,
    remind24hBefore: true,
    remind2hBefore: true,
    soundEnabled: true,
  };
}

export function saveReminderSettings(settings: ReminderSettings) {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export function getNotifiedHistory(): Record<string, { notified24h?: boolean; notified2h?: boolean }> {
  try {
    const saved = localStorage.getItem(STORAGE_NOTIFIED_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return {};
}

export function saveNotifiedHistory(history: Record<string, { notified24h?: boolean; notified2h?: boolean }>) {
  try {
    localStorage.setItem(STORAGE_NOTIFIED_KEY, JSON.stringify(history));
  } catch (e) {}
}

// Play pleasant medical chime using Web Audio API
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Note 1: E5 (659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Note 2: B5 (987Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

// Dispatch browser push notification
export function triggerPushNotification(title: string, body: string, soundEnabled = true) {
  if (soundEnabled) {
    playChimeSound();
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `ufetal-${Date.now()}`,
        });
        return true;
      } catch (e) {
        console.warn('Notification construction error:', e);
      }
    }
  }
  return false;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }
  return 'denied';
}

export interface ShiftReminderStatus {
  shift: Shift;
  shiftStartTime: Date;
  msUntilStart: number;
  hoursUntilStart: number;
  due24h: boolean;
  due2h: boolean;
  isSent24h: boolean;
  isSent2h: boolean;
  statusLabel: string;
}

// Evaluate reminders for doctor shifts
export function evaluateDoctorShifts(
  shifts: Shift[],
  doctorId: string,
  now: Date = new Date()
): ShiftReminderStatus[] {
  const history = getNotifiedHistory();
  const doctorShifts = shifts.filter(s => s.doctorId === doctorId && s.status !== 'open');

  const list: ShiftReminderStatus[] = [];

  for (const shift of doctorShifts) {
    // Skip shifts with missing date or time
    if (!shift.date || !shift.startTime) continue;

    // Determine shift start timestamp in UTC
    const [year, month, day] = shift.date.split('-').map(Number);
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const startTime = new Date(Date.UTC(year, month - 1, day, startH, startM, 0));

    const msUntilStart = startTime.getTime() - now.getTime();
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    const shiftHistory = history[shift.id] || {};
    const isSent24h = !!shiftHistory.notified24h;
    const isSent2h = !!shiftHistory.notified2h;

    // Due logic:
    // 24h reminder is due if hoursUntilStart <= 24 and > 2, and not yet sent
    const due24h = hoursUntilStart <= 24 && hoursUntilStart > 0 && !isSent24h;
    // 2h reminder is due if hoursUntilStart <= 2 and > -1, and not yet sent
    const due2h = hoursUntilStart <= 2 && hoursUntilStart > -1 && !isSent2h;

    let statusLabel = '';
    if (hoursUntilStart < 0) {
      statusLabel = 'Em andamento / Concluído';
    } else if (hoursUntilStart <= 2) {
      statusLabel = isSent2h ? 'Lembrete de 2h enviado' : 'Lembrete de 2h iminente';
    } else if (hoursUntilStart <= 24) {
      statusLabel = isSent24h ? 'Lembrete de 24h enviado' : 'Lembrete de 24h iminente';
    } else {
      const d = Math.floor(hoursUntilStart / 24);
      const h = Math.floor(hoursUntilStart % 24);
      statusLabel = `Inicia em ${d}d ${h}h`;
    }

    list.push({
      shift,
      shiftStartTime: startTime,
      msUntilStart,
      hoursUntilStart,
      due24h,
      due2h,
      isSent24h,
      isSent2h,
      statusLabel,
    });
  }

  // Sort upcoming first
  return list.sort((a, b) => a.shiftStartTime.getTime() - b.shiftStartTime.getTime());
}
