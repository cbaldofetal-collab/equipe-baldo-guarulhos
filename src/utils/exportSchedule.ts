import { Shift, Doctor } from '../types';
import { formatDateToPt, MONTH_NAMES_PT, formatFriendlyDate } from './date';

export function generateWhatsAppScheduleText(
  shifts: Shift[],
  doctors: Doctor[],
  year: number,
  month: number
): string {
  const monthName = MONTH_NAMES_PT[month];
  const docMap = new Map(doctors.map(d => [d.id, d]));

  // Filter shifts for this month
  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthShifts = shifts
    .filter(s => s.date.startsWith(targetPrefix))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));

  let text = `🩺 *ESCALA UFETAL - MEDICINA FETAL*\n`;
  text += `📅 *${monthName.toUpperCase()} / ${year}*\n`;
  text += `⚡ Atualizado em tempo real pelo uFetal\n`;
  text += `──────────────────────\n\n`;

  // Group by date
  const byDate: { [date: string]: Shift[] } = {};
  monthShifts.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const dates = Object.keys(byDate).sort();

  if (dates.length === 0) {
    text += `Nenhum plantão cadastrado para este mês.\n`;
    return text;
  }

  dates.forEach(d => {
    const dayShifts = byDate[d];
    text += `📌 *${formatFriendlyDate(d)}*\n`;
    dayShifts.forEach(s => {
      const doc = s.doctorId ? docMap.get(s.doctorId) : null;
      const docName = doc ? doc.name : '⚠️ VAGO (Aberto)';
      const typeLabel =
        s.shiftType === 'sobreaviso'
          ? '🚨 Sobreaviso Fetal'
          : s.shiftType === 'plantao_24h'
          ? '🌙 Plantão 24h'
          : s.shiftType === 'plantao_12d'
          ? '☀️ Plantão 12h Diurno'
          : s.shiftType === 'plantao_12n'
          ? '🌙 Plantão 12h Noturno'
          : s.shiftType === 'manha'
          ? '🌅 Manhã (07-13h)'
          : s.shiftType === 'tarde'
          ? '🌇 Tarde (13-19h)'
          : `⏰ ${s.startTime}-${s.endTime}`;

      text += `  • ${typeLabel}: *${docName}* (${s.sector})\n`;
    });
    text += `\n`;
  });

  text += `──────────────────────\n`;
  text += `📱 _Escala viva uFetal - Para assumir plantões ou solicitar trocas, acesse o app._\n`;

  return text;
}

export function downloadICalendar(shifts: Shift[], doctors: Doctor[], doctorFilterId?: string) {
  const docMap = new Map(doctors.map(d => [d.id, d]));
  let filtered = shifts;
  if (doctorFilterId) {
    filtered = shifts.filter(s => s.doctorId === doctorFilterId);
  }

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//uFetal//Escala Medicina Fetal//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Escala uFetal',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  filtered.forEach(shift => {
    // Skip shifts with missing required fields
    if (!shift.date || !shift.startTime || !shift.endTime) return;

    const doc = shift.doctorId ? docMap.get(shift.doctorId) : null;
    const docName = doc ? doc.name : 'Plantão Vago';

    const [year, month, day] = shift.date.split('-');
    const [startH, startM] = shift.startTime.split(':');
    const [endH, endM] = shift.endTime.split(':');

    // Simple ICS date format: YYYYMMDDTHHmm00
    const dtStart = `${year}${month}${day}T${startH}${startM}00`;
    let dtEnd = `${year}${month}${day}T${endH}${endM}00`;
    if (shift.shiftType === 'sobreaviso' || shift.shiftType === 'plantao_24h' || (endH < startH)) {
      // wraps or all day
      const nextDay = String(Number(day) + 1).padStart(2, '0');
      dtEnd = `${year}${month}${nextDay}T${endH}${endM}00`;
    }

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${shift.id}@ufetal.med.br`);
    ics.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    ics.push(`DTSTART:${dtStart}`);
    ics.push(`DTEND:${dtEnd}`);
    ics.push(`SUMMARY:Plantão Fetal: ${docName} - ${shift.sector}`);
    ics.push(`DESCRIPTION:Local: ${shift.location}\\nSetor: ${shift.sector}\\nObservações: ${shift.notes || 'Sem observações'}`);
    ics.push(`LOCATION:${shift.location}`);
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');

  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `escala-ufetal-${new Date().toISOString().slice(0, 10)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
