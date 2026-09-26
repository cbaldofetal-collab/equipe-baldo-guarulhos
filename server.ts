import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[uFetal] SUPABASE_URL e SUPABASE_KEY não configuradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Doctor {
  id: string;
  name: string;
  crm: string;
  phone: string;
  email: string;
  specialty: string;
  color: string;
  initials: string;
  is_coordinator?: boolean;
  authorized_to_manage?: boolean;
}

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  modality: 'ps' | 'agenda';
  duration_hours: number;
  sector: string;
  location: string;
  doctor_id: string | null;
  status: 'confirmed' | 'open' | 'trade_requested';
  notes?: string;
  created_at: string;
  updated_at: string;
  trade_request_id?: string | null;
}

interface TradeRequest {
  id: string;
  shift_id: string;
  from_doctor_id: string;
  to_doctor_id: string | null;
  note?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  author_name: string;
  action: string;
  summary: string;
}

function calculateShiftHours(startTime: string, endTime: string, shiftType: string): number {
  if (shiftType === 'sobreaviso' || shiftType === 'plantao_24h') return 24;
  if (shiftType === 'plantao_12d' || shiftType === 'plantao_12n') return 12;
  if (shiftType === 'manha' || shiftType === 'tarde') return 6;
  const [startH, startM] = (startTime || '07:00').split(':').map(Number);
  const [endH, endM] = (endTime || '19:00').split(':').map(Number);
  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (totalMinutes <= 0) totalMinutes += 24 * 60;
  return Math.round((totalMinutes / 60) * 10) / 10;
}

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-baldo',
    name: 'Dr. Carlos Baldo',
    crm: 'CRM 142.857-SP',
    phone: '(11) 98765-4321',
    email: 'cbaldo.fetal@gmail.com',
    specialty: 'Medicina Fetal & Cirurgia Fetal',
    color: '#0d9488',
    initials: 'CB',
    is_coordinator: true,
  },
  {
    id: 'doc-mariana',
    name: 'Dra. Mariana Silveira',
    crm: 'CRM 158.320-SP',
    phone: '(11) 97654-3210',
    email: 'mariana.silveira@ufetal.med.br',
    specialty: 'Procedimentos Invasivos & Rastreio Fetal',
    color: '#0284c7',
    initials: 'MS',
  },
  {
    id: 'doc-felipe',
    name: 'Dr. Felipe Rocha',
    crm: 'CRM 139.410-SP',
    phone: '(11) 96543-2109',
    email: 'felipe.rocha@ufetal.med.br',
    specialty: 'Dopplerfluxometria & Vitalidade Fetal',
    color: '#6366f1',
    initials: 'FR',
  },
  {
    id: 'doc-beatriz',
    name: 'Dra. Beatriz Santos',
    crm: 'CRM 167.890-SP',
    phone: '(11) 95432-1098',
    email: 'beatriz.santos@ufetal.med.br',
    specialty: 'Ecocardiografia Fetal',
    color: '#e11d48',
    initials: 'BS',
  },
  {
    id: 'doc-lucas',
    name: 'Dr. Lucas Azevedo',
    crm: 'CRM 175.204-SP',
    phone: '(11) 94321-0987',
    email: 'lucas.azevedo@ufetal.med.br',
    specialty: 'Neurosonografia Fetal & USG 3D/4D',
    color: '#d97706',
    initials: 'LA',
  },
  {
    id: 'doc-camila',
    name: 'Dra. Camila Nogueira',
    crm: 'CRM 182.400-SP',
    email: 'camila.nogueira@ufetal.med.br',
    phone: '(11) 93210-9876',
    specialty: 'Gestação de Alto Risco & USG Morfológica',
    color: '#8b5cf6',
    initials: 'CN',
  },
];

// SSE connected clients
type SSEClient = {
  id: number;
  res: Response;
};
let sseClients: SSEClient[] = [];
let nextClientId = 1;

function broadcastEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, ...payload, timestamp: new Date().toISOString() });
  // Use Array.from() to avoid issues with concurrent mutations (clients disconnecting)
  Array.from(sseClients).forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (e) {
      // client dropped
    }
  });
}

async function addAuditLog(authorName: string, action: string, summary: string) {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    author_name: authorName,
    action,
    summary,
  };

  const { error } = await supabase
    .from('audit_logs')
    .insert([entry]);

  if (error) console.error('[uFetal] Error saving audit log:', error);
  return entry;
}

async function canManageSchedule(doctorId: string): Promise<boolean> {
  const { data: doctor } = await supabase
    .from('doctors')
    .select('is_coordinator, authorized_to_manage')
    .eq('id', doctorId)
    .single();

  if (!doctor) return false;
  return doctor.is_coordinator === true || doctor.authorized_to_manage === true;
}

async function initializeDatabase() {
  try {
    // Check if doctors table has data
    const { data: doctors } = await supabase.from('doctors').select('*').limit(1);

    if (!doctors || doctors.length === 0) {
      console.log('[uFetal] Inicializando médicos...');
      for (const doctor of INITIAL_DOCTORS) {
        await supabase.from('doctors').insert([doctor]);
      }
      console.log('[uFetal] Médicos inicializados com sucesso!');
    }
  } catch (err) {
    console.error('[uFetal] Erro ao inicializar banco de dados:', err);
  }
}

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// SSE Heartbeat every 20 seconds
setInterval(() => {
  sseClients.forEach(client => {
    try {
      client.res.write(': heartbeat\n\n');
    } catch (e) {}
  });
}, 20000);

// SSE Stream for Real-time synchronisation
app.get('/api/events', async (req: Request, res: Response) => {
  // Require authentication token
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação obrigatório' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });

  // Send initial full state with pagination limits
  try {
    const { data: doctors } = await supabase.from('doctors').select('*').limit(1000);
    const { data: shifts } = await supabase.from('shifts').select('*').limit(1000);
    const { data: trades } = await supabase.from('trades').select('*').limit(1000);
    const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);

    const state = {
      doctors: doctors || [],
      shifts: shifts || [],
      trades: trades || [],
      auditLogs: auditLogs || [],
    };

    res.write(`data: ${JSON.stringify({ type: 'init', state })}\n\n`);
  } catch (err) {
    console.error('[uFetal] Error sending initial state:', err);
  }

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// GET complete state
app.get('/api/state', async (req: Request, res: Response) => {
  try {
    // Add pagination limits to prevent loading excessive data
    const { data: doctors } = await supabase.from('doctors').select('*').limit(1000);
    const { data: shifts } = await supabase.from('shifts').select('*').limit(1000);
    const { data: trades } = await supabase.from('trades').select('*').limit(1000);
    const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);

    res.json({
      doctors: doctors || [],
      shifts: shifts || [],
      trades: trades || [],
      auditLogs: auditLogs || [],
    });
  } catch (err) {
    console.error('[uFetal] Error fetching state:', err);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// PUT authorize/unauthorize doctor to manage schedule
app.put('/api/doctors/:id/authorize', async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.id;
    const { coordinatorId, authorized } = req.body;

    // Check if requester is coordinator
    const { data: coordinator } = await supabase
      .from('doctors')
      .select('is_coordinator, name')
      .eq('id', coordinatorId)
      .single();

    if (!coordinator || !coordinator.is_coordinator) {
      return res.status(403).json({ error: 'Apenas o coordenador pode autorizar médicos' });
    }

    // Update doctor's authorization status
    const { error } = await supabase
      .from('doctors')
      .update({ authorized_to_manage: authorized === true })
      .eq('id', doctorId);

    if (error) {
      console.error('[uFetal] Supabase update error:', error);
      return res.status(500).json({ error: 'Erro ao atualizar autorização', details: error.message });
    }

    await addAuditLog(
      coordinator.name || 'Coordenador',
      'doctor_authorized',
      `${authorized ? 'Autorizado' : 'Removido de autorizado'} para gerenciar escala.`
    );

    broadcastEvent('doctor_authorized', { doctorId, authorized });
    res.json({ success: true, doctorId, authorized });
  } catch (err) {
    console.error('[uFetal] Error authorizing doctor:', err);
    res.status(500).json({ error: 'Erro ao autorizar médico' });
  }
});

// POST create shift
app.post('/api/shifts', async (req: Request, res: Response) => {
  try {
    const {
      date,
      start_time,
      end_time,
      shift_type,
      modality,
      duration_hours,
      sector,
      location,
      doctor_id,
      notes,
      authorName,
      currentDoctorId,
    } = req.body;

    // Check permissions: only coordinator or authorized doctors can create shifts
    if (currentDoctorId && !(await canManageSchedule(currentDoctorId))) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar a escala. Solicite autorização ao coordenador.' });
    }

    if (!date || !start_time || !end_time || !shift_type) {
      console.error('[DEBUG] Missing fields:', { date, start_time, end_time, shift_type });
      res.status(400).json({ error: `Campos obrigatórios faltando. Recebido: date=${date}, start_time=${start_time}, end_time=${end_time}, shift_type=${shift_type}` });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Data inválida. Use formato YYYY-MM-DD.' });
    }

    // Validate time format (HH:mm)
    if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ error: 'Horário inválido. Use formato HH:mm.' });
    }

    // Validate shift_type is valid enum
    const validShiftTypes = ['manha', 'tarde', 'noite', '12h_noturno', 'plantao_24h', 'sobreaviso', 'personalizado', 'PS', 'Agenda', 'Sobreaviso', 'Outra'];
    if (!validShiftTypes.includes(shift_type)) {
      return res.status(400).json({ error: `Tipo de plantão inválido. Recebido: ${shift_type}` });
    }

    // Validate startTime < endTime
    console.log(`[DEBUG] start_time: "${start_time}", end_time: "${end_time}"`);

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'Horários de início e fim são obrigatórios.' });
    }

    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return res.status(400).json({ error: 'Formato de horário inválido. Use HH:mm' });
    }

    let startTotalMin = startHour * 60 + startMin;
    let endTotalMin = endHour * 60 + endMin;

    // If end time is less than start time, it's an overnight shift (e.g., 19:00 to 01:00)
    if (endTotalMin < startTotalMin) {
      endTotalMin += 24 * 60; // Add 24 hours for overnight shifts
    }

    console.log(`[DEBUG] startTotalMin: ${startTotalMin}, endTotalMin: ${endTotalMin}`);

    if (startTotalMin >= endTotalMin) {
      return res.status(400).json({ error: 'Horário de fim deve ser após o horário de início.' });
    }

    const calculatedHours = typeof duration_hours === 'number' && duration_hours > 0
      ? duration_hours
      : calculateShiftHours(start_time, end_time, shift_type);

    const shiftModality = modality === 'agenda' ? 'agenda' : 'ps';

    const newShift: Shift = {
      id: `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date,
      start_time,
      end_time,
      shift_type,
      modality: shiftModality,
      duration_hours: calculatedHours,
      sector: sector || 'Medicina Fetal - Plantão e Sala de Parto',
      location: location || 'Maternidade Central - Unidade Fetal',
      doctor_id: doctor_id || null,
      status: doctor_id ? 'confirmed' : 'open',
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('shifts').insert([newShift]);
    if (insertError) {
      return res.status(500).json({ error: 'Erro ao criar plantão' });
    }

    const { data: doctor } = await supabase.from('doctors').select('name').eq('id', doctor_id).single();
    const docName = doctor?.name || 'Vago';
    const modalityLabel = shiftModality === 'ps' ? 'PS' : 'Agenda';
    await addAuditLog(
      authorName || 'Médico da Equipe',
      'create',
      `Novo plantão [${modalityLabel} • ${calculatedHours}h] em ${date} (${start_time}-${end_time}) para ${docName}.`
    );

    broadcastEvent('shift_created', { shift: newShift });
    res.status(201).json(newShift);
  } catch (err) {
    console.error('[uFetal] Error creating shift:', err);
    res.status(500).json({ error: 'Erro ao criar plantão' });
  }
});

// PUT update shift
app.put('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.id;
    const { data: shift } = await supabase.from('shifts').select('*').eq('id', shiftId).single();

    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    const {
      date,
      start_time,
      end_time,
      shift_type,
      modality,
      duration_hours,
      sector,
      location,
      doctor_id,
      status,
      notes,
      authorName,
      currentDoctorId,
    } = req.body;

    // Check permissions: only coordinator or authorized doctors can update shifts
    if (currentDoctorId && !(await canManageSchedule(currentDoctorId))) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar a escala. Solicite autorização ao coordenador.' });
    }

    // Validate optional fields if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Data inválida. Use formato YYYY-MM-DD.' });
    }
    if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
      return res.status(400).json({ error: 'Horário de início inválido. Use formato HH:mm.' });
    }
    if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ error: 'Horário de fim inválido. Use formato HH:mm.' });
    }
    if (shift_type) {
      const validShiftTypes = ['manha', 'tarde', 'noite', '12h_noturno', 'plantao_24h', 'sobreaviso', 'personalizado', 'PS', 'Agenda', 'Sobreaviso', 'Outra'];
      if (!validShiftTypes.includes(shift_type)) {
        return res.status(400).json({ error: `Tipo de plantão inválido. Recebido: ${shift_type}` });
      }
    }

    const newStartTime = start_time ?? shift.start_time;
    const newEndTime = end_time ?? shift.end_time;
    const newShiftType = shift_type ?? shift.shift_type;

    // Validate startTime < endTime (support overnight shifts)
    const [startHour, startMin] = newStartTime.split(':').map(Number);
    const [endHour, endMin] = newEndTime.split(':').map(Number);
    let startTotalMin = startHour * 60 + startMin;
    let endTotalMin = endHour * 60 + endMin;

    // If end time is less than start time, it's an overnight shift (e.g., 19:00 to 01:00)
    if (endTotalMin < startTotalMin) {
      endTotalMin += 24 * 60; // Add 24 hours for overnight shifts
    }

    if (startTotalMin >= endTotalMin) {
      return res.status(400).json({ error: 'Horário de fim deve ser após o horário de início.' });
    }

    const newDuration = typeof duration_hours === 'number' && duration_hours > 0
      ? duration_hours
      : (start_time || end_time || shift_type)
      ? calculateShiftHours(newStartTime, newEndTime, newShiftType)
      : shift.duration_hours;

    const updated = {
      ...shift,
      date: date ?? shift.date,
      start_time: newStartTime,
      end_time: newEndTime,
      shift_type: newShiftType,
      modality: modality ? (modality === 'agenda' ? 'agenda' : 'ps') : shift.modality,
      duration_hours: newDuration,
      sector: sector ?? shift.sector,
      location: location ?? shift.location,
      doctor_id: doctor_id !== undefined ? doctor_id : shift.doctor_id,
      status: status ?? (doctor_id ? 'confirmed' : 'open'),
      notes: notes !== undefined ? notes : shift.notes,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase.from('shifts').update(updated).eq('id', shiftId);
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar plantão' });
    }

    const { data: doctor } = await supabase.from('doctors').select('name').eq('id', updated.doctor_id).single();
    const modalityLabel = updated.modality === 'ps' ? 'PS' : 'Agenda';
    await addAuditLog(
      authorName || 'Médico da Equipe',
      'update',
      `Plantão [${modalityLabel} • ${updated.duration_hours}h] de ${updated.date} atualizado.`
    );

    broadcastEvent('shift_updated', { shift: updated });
    res.json(updated);
  } catch (err) {
    console.error('[uFetal] Error updating shift:', err);
    res.status(500).json({ error: 'Erro ao atualizar plantão' });
  }
});

// DELETE shift
app.delete('/api/shifts/:id', async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.id;
    const { data: shift } = await supabase.from('shifts').select('*').eq('id', shiftId).single();

    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    // Check permissions: only coordinator or authorized doctors can delete shifts
    const currentDoctorId = req.query.currentDoctorId as string;
    if (currentDoctorId && !(await canManageSchedule(currentDoctorId))) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar a escala. Solicite autorização ao coordenador.' });
    }

    // Sanitize authorName: decode URI component and limit size
    let authorName = 'Médico da Equipe';
    if (req.query.authorName && typeof req.query.authorName === 'string') {
      try {
        authorName = decodeURIComponent(req.query.authorName).substring(0, 255).trim();
      } catch (e) {
        // Invalid URI encoding, use default
      }
    }

    const { error: deleteError } = await supabase.from('shifts').delete().eq('id', shiftId);
    if (deleteError) {
      return res.status(500).json({ error: 'Erro ao deletar plantão' });
    }

    await supabase.from('trades').delete().eq('shift_id', shiftId);

    await addAuditLog(authorName, 'delete', `Plantão de ${shift.date} removido.`);
    broadcastEvent('shift_deleted', { shiftId });
    res.json({ success: true, deletedId: shiftId });
  } catch (err) {
    console.error('[uFetal] Error deleting shift:', err);
    res.status(500).json({ error: 'Erro ao deletar plantão' });
  }
});

// POST claim open shift
app.post('/api/shifts/:id/claim', async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.id;
    const { doctorId } = req.body;

    const { data: shift } = await supabase.from('shifts').select('*').eq('id', shiftId).single();
    const { data: doctor } = await supabase.from('doctors').select('*').eq('id', doctorId).single();

    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }
    if (!doctor) {
      return res.status(400).json({ error: 'Médico não encontrado' });
    }

    // Verify shift is still available (not claimed by another doctor)
    if (shift.doctor_id !== null) {
      return res.status(409).json({ error: 'Este plantão já foi assumido por outro médico' });
    }

    const updated = {
      ...shift,
      doctor_id: doctor.id,
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    };

    // Pessimistic lock: only update if doctor_id is still null
    const { error: updateError, data: updateData } = await supabase
      .from('shifts')
      .update(updated)
      .eq('id', shiftId)
      .is('doctor_id', null);

    if (updateError || !updateData) {
      return res.status(409).json({ error: 'Este plantão já foi assumido por outro médico' });
    }

    await addAuditLog(doctor.name, 'claim', `${doctor.name} assumiu o plantão de ${shift.date}.`);
    broadcastEvent('shift_claimed', { shift: updated, doctor });
    res.json(updated);
  } catch (err) {
    console.error('[uFetal] Error claiming shift:', err);
    res.status(500).json({ error: 'Erro ao assumir plantão' });
  }
});

// POST replicate shift to multiple months
app.post('/api/shifts/:id/replicate', async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.id;
    const { months } = req.body;

    if (!months || months < 1 || months > 12) {
      return res.status(400).json({ error: 'Meses deve ser entre 1 e 12' });
    }

    const { data: originalShift } = await supabase.from('shifts').select('*').eq('id', shiftId).single();
    if (!originalShift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    const [year, month, day] = originalShift.date.split('-').map(Number);
    const originalDate = new Date(year, month - 1, day);
    const originalDayOfWeek = originalDate.getDay();
    const createdShifts: Shift[] = [];

    for (let i = 1; i <= months; i++) {
      const targetDate = new Date(year, month - 1 + i, 1);
      let newDate = new Date(year, month - 1 + i, 1);

      // Find the same day of week in the target month
      while (newDate.getDay() !== originalDayOfWeek) {
        newDate.setDate(newDate.getDate() + 1);
      }

      // If we're in the next month, adjust to stay in target month
      if (newDate.getMonth() !== (month - 1 + i) % 12) {
        newDate.setDate(newDate.getDate() - 7);
      }

      const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;

      const newShift: Shift = {
        ...originalShift,
        id: `shift-${Date.now()}-${i}`,
        date: dateStr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('shifts').insert([newShift]);
      if (!insertError) {
        createdShifts.push(newShift);
      }
    }

    const doctorName = originalShift.doctor_id
      ? (await supabase.from('doctors').select('name').eq('id', originalShift.doctor_id).single()).data?.name
      : 'Escala Vaga';

    await addAuditLog(
      doctorName || 'Sistema',
      'replicate_shift',
      `Escala de ${doctorName} replicada para ${months} mês(es)`
    );

    broadcastEvent('shifts_replicated', { originalShift, createdShifts, months });
    res.json({ success: true, createdCount: createdShifts.length, shifts: createdShifts });
  } catch (err) {
    console.error('[uFetal] Error replicating shift:', err);
    res.status(500).json({ error: 'Erro ao replicar escala' });
  }
});

// POST request trade
// GET list all pending trades
app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!trades) {
      return res.json({ trades: [] });
    }

    const enrichedTrades = await Promise.all(
      (trades || []).map(async (trade) => {
        const { data: shift } = await supabase.from('shifts').select('*').eq('id', trade.shift_id).single();
        const { data: fromDoc } = await supabase.from('doctors').select('*').eq('id', trade.from_doctor_id).single();

        return {
          id: trade.id,
          shift_id: trade.shift_id,
          from_doctor_id: trade.from_doctor_id,
          from_doctor_name: fromDoc?.name || 'Desconhecido',
          to_doctor_id: trade.to_doctor_id,
          to_doctor_name: trade.to_doctor_id ? (await supabase.from('doctors').select('name').eq('id', trade.to_doctor_id).single()).data?.name : undefined,
          reason: trade.note,
          status: trade.status,
          created_at: trade.created_at,
          shift_date: shift?.date,
          shift_time: shift ? `${shift.start_time} - ${shift.end_time}` : 'N/A',
        };
      })
    );

    res.json({ trades: enrichedTrades });
  } catch (err) {
    console.error('[uFetal] Error fetching trades:', err);
    res.status(500).json({ error: 'Erro ao buscar trocas' });
  }
});

// POST create new trade request
app.post('/api/trades', async (req: Request, res: Response) => {
  try {
    const { shift_id, from_doctor_id, to_doctor_id, note } = req.body;

    const { data: shift } = await supabase.from('shifts').select('*').eq('id', shift_id).single();
    const { data: fromDoc } = await supabase.from('doctors').select('*').eq('id', from_doctor_id).single();

    if (!shift || !fromDoc) {
      return res.status(400).json({ error: 'Dados de troca inválidos' });
    }

    const trade: TradeRequest = {
      id: `trade-${Date.now()}`,
      shift_id,
      from_doctor_id,
      to_doctor_id: to_doctor_id || null,
      note: note || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('trades').insert([trade]);
    if (insertError) {
      return res.status(500).json({ error: 'Erro ao criar troca' });
    }

    const { error: updateError } = await supabase.from('shifts').update({
      status: 'trade_requested',
      trade_request_id: trade.id,
    }).eq('id', shift_id);

    const targetDesc = to_doctor_id ? 'para o colega' : 'para toda a equipe';
    await addAuditLog(fromDoc.name, 'trade_request', `Troca solicitada ${targetDesc}.`);
    broadcastEvent('trade_updated', { trade, shift });
    res.status(201).json({ trade, shift });
  } catch (err) {
    console.error('[uFetal] Error creating trade:', err);
    res.status(500).json({ error: 'Erro ao criar troca' });
  }
});

// POST accept trade
app.post('/api/trades/:id/accept', async (req: Request, res: Response) => {
  try {
    const tradeId = req.params.id;
    const { acceptingDoctorId } = req.body;

    const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).single();
    const { data: acceptingDoc } = await supabase.from('doctors').select('*').eq('id', acceptingDoctorId).single();

    if (!trade || !acceptingDoc) {
      return res.status(400).json({ error: 'Troca ou médico não encontrado' });
    }

    const { data: shift } = await supabase.from('shifts').select('*').eq('id', trade.shift_id).single();
    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    // Verify trade is still pending (not accepted by another doctor)
    if (trade.status !== 'pending') {
      return res.status(409).json({ error: 'Esta troca já foi processada' });
    }

    // Pessimistic lock: only update trade if still pending
    const { error: tradeError, data: tradeData } = await supabase
      .from('trades')
      .update({ status: 'accepted' })
      .eq('id', tradeId)
      .eq('status', 'pending');

    if (tradeError || !tradeData) {
      return res.status(409).json({ error: 'Esta troca já foi processada' });
    }

    // Pessimistic lock: only update shift if not yet claimed
    const { error: shiftError, data: shiftData } = await supabase
      .from('shifts')
      .update({
        doctor_id: acceptingDoc.id,
        status: 'confirmed',
        trade_request_id: null,
      })
      .eq('id', trade.shift_id)
      .is('trade_request_id', trade.id);

    if (shiftError || !shiftData) {
      return res.status(409).json({ error: 'Este plantão já foi atribuído' });
    }

    await addAuditLog(acceptingDoc.name, 'trade_accept', `Troca aceita por ${acceptingDoc.name}.`);
    broadcastEvent('trade_updated', { trade, shift });
    res.json({ trade, shift });
  } catch (err) {
    console.error('[uFetal] Error accepting trade:', err);
    res.status(500).json({ error: 'Erro ao aceitar troca' });
  }
});

// POST reject trade
app.post('/api/trades/:id/reject', async (req: Request, res: Response) => {
  try {
    const tradeId = req.params.id;
    const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).single();

    if (!trade) {
      return res.status(404).json({ error: 'Troca não encontrada' });
    }

    const { error: updateError } = await supabase.from('trades').update({ status: 'declined' }).eq('id', tradeId);
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao rejeitar troca' });
    }

    const { data: shift } = await supabase.from('shifts').select('*').eq('id', trade.shift_id).single();
    if (shift && shift.status === 'trade_requested') {
      await supabase.from('shifts').update({ status: 'open', trade_request_id: null }).eq('id', trade.shift_id);
    }

    const { data: fromDoc } = await supabase.from('doctors').select('name').eq('id', trade.from_doctor_id).single();
    await addAuditLog(fromDoc?.name || 'Médico', 'trade_reject', 'Solicitação de troca rejeitada.');
    broadcastEvent('trade_updated', { trade, shift });
    res.json({ success: true, trade });
  } catch (err) {
    console.error('[uFetal] Error rejecting trade:', err);
    res.status(500).json({ error: 'Erro ao rejeitar troca' });
  }
});

// POST cancel trade
app.post('/api/trades/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tradeId = req.params.id;
    const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).single();

    if (!trade) {
      return res.status(404).json({ error: 'Troca não encontrada' });
    }

    const { error: updateError } = await supabase.from('trades').update({ status: 'cancelled' }).eq('id', tradeId);
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao cancelar troca' });
    }

    const { data: shift } = await supabase.from('shifts').select('*').eq('id', trade.shift_id).single();
    if (shift) {
      await supabase.from('shifts').update({ status: 'confirmed', trade_request_id: null }).eq('id', trade.shift_id);
    }

    const { data: fromDoc } = await supabase.from('doctors').select('name').eq('id', trade.from_doctor_id).single();
    await addAuditLog(fromDoc?.name || 'Médico', 'trade_cancel', 'Solicitação de troca cancelada.');
    broadcastEvent('trade_updated', { trade, shift });
    res.json({ success: true, trade });
  } catch (err) {
    console.error('[uFetal] Error canceling trade:', err);
    res.status(500).json({ error: 'Erro ao cancelar troca' });
  }
});

// POST add new doctor
app.post('/api/doctors', async (req: Request, res: Response) => {
  try {
    const { name, crm, phone, email, specialty, color } = req.body;
    if (!name || !crm) {
      return res.status(400).json({ error: 'Nome e CRM são obrigatórios' });
    }

    const initials = name
      .split(' ')
      .filter((p: string) => !['dr.', 'dra.', 'dr', 'dra', 'de', 'da', 'do'].includes(p.toLowerCase()))
      .slice(0, 2)
      .map((p: string) => p[0].toUpperCase())
      .join('') || 'MD';

    const colors = ['#0d9488', '#0284c7', '#6366f1', '#e11d48', '#d97706', '#8b5cf6', '#10b981', '#f97316'];
    const { data: doctors } = await supabase.from('doctors').select('id');
    const chosenColor = color || colors[(doctors?.length || 0) % colors.length];

    const newDoctor: Doctor = {
      id: `doc-${Date.now()}`,
      name,
      crm,
      phone: phone || '',
      email: email || '',
      specialty: specialty || 'Medicina Fetal',
      color: chosenColor,
      initials,
    };

    const { error: insertError } = await supabase.from('doctors').insert([newDoctor]);
    if (insertError) {
      return res.status(500).json({ error: 'Erro ao criar médico' });
    }

    await addAuditLog('Coordenação uFetal Analia', 'doctor_added', `${newDoctor.name} ingressou na equipe.`);
    broadcastEvent('doctor_added', { doctor: newDoctor });
    res.status(201).json(newDoctor);
  } catch (err) {
    console.error('[uFetal] Error creating doctor:', err);
    res.status(500).json({ error: 'Erro ao criar médico' });
  }
});

// Clear schedule
app.post('/api/schedule/clear', async (req: Request, res: Response) => {
  try {
    const { authorName } = req.body;
    await supabase.from('shifts').delete().neq('id', '');
    await supabase.from('trades').delete().neq('id', '');

    await addAuditLog(authorName || 'Coordenação', 'clear_schedule', 'Escala zerada.');
    broadcastEvent('schedule_cleared', {});
    res.json({ success: true, message: 'Escala limpa com sucesso.' });
  } catch (err) {
    console.error('[uFetal] Error clearing schedule:', err);
    res.status(500).json({ error: 'Erro ao limpar escala' });
  }
});

// Debug env endpoint
app.get('/api/debug/env', (req: Request, res: Response) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET (length: ' + process.env.SUPABASE_KEY.length + ')' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? 'SET' : 'NOT SET',
  });
});

// Debug seed endpoint
app.post('/api/debug/seed', async (req: Request, res: Response) => {
  try {
    // Manually seed doctors
    const { data: existingDoctors } = await supabase.from('doctors').select('id').limit(1);

    if (!existingDoctors || existingDoctors.length === 0) {
      const results = [];
      for (const doctor of INITIAL_DOCTORS) {
        const { data, error } = await supabase.from('doctors').insert([doctor]).select();
        results.push({ doctor: doctor.name, success: !error, error: error?.message });
      }
      res.json({ success: true, message: 'Doctors seeded', results });
    } else {
      res.json({ success: true, message: 'Doctors already exist', count: existingDoctors.length });
    }
  } catch (err: any) {
    console.error('[uFetal] Error seeding database:', err);
    res.status(500).json({ error: err.message || 'Failed to seed', stack: err.stack });
  }
});

// Serve static files from dist folder
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath, { maxAge: '1h' }));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      console.error('[uFetal] Error serving index.html:', err);
      res.status(500).send('Erro ao carregar aplicação');
    }
  });
});

// When running standalone, start listening
if (!process.env.VERCEL) {
  initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[uFetal] Server running on http://0.0.0.0:${PORT}`);
    });
  });
}

export default app;
