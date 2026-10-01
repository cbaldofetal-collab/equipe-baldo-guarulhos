export type ShiftType = 
  | 'manha'        // 07:00 - 13:00 (6h)
  | 'tarde'        // 13:00 - 19:00 (6h)
  | 'noite'        // 19:00 - 07:00 (12h Noturno)
  | 'plantao_12d'  // 07:00 - 19:00 (12h Diurno)
  | 'plantao_12n'  // 19:00 - 07:00 (12h Noturno)
  | 'plantao_24h'  // 07:00 - 07:00 (24h)
  | 'sobreaviso'   // 24h Sobreaviso / Urgências Fetais
  | 'custom';      // Horário livre

export type ShiftModality = 'ps' | 'agenda'; // PS (Pronto-Socorro / Urgência) ou Agenda (Ambulatório / Exames Eletivos)

export type Hospital = 'analia' | 'sc' | 'gru'; // Anália Franco, São Caetano, Guarulhos

export const HOSPITAL_LABELS: Record<Hospital, string> = {
  analia: 'Anália Franco',
  sc: 'São Caetano',
  gru: 'Guarulhos',
};

export const HOSPITAL_SHORT_LABELS: Record<Hospital, string> = {
  analia: 'AF',
  sc: 'SC',
  gru: 'GRU',
};

export type ShiftSector =
  | 'Medicina Fetal - Plantão e Sala de Parto'
  | 'Sobreaviso Intercorrências e Cirurgia Fetal'
  | 'USG Morfológica e Rastreio 1º/2º Tri'
  | 'Dopplerfluxometria e Vitalidade Fetal'
  | 'Ecocardiografia e Neurosonografia Fetal'
  | 'Procedimentos Invasivos (Amnio/Cordocentese)';

export type ShiftStatus = 'confirmed' | 'open' | 'trade_requested';

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  phone: string;
  email: string;
  specialty: string;
  color: string;
  initials: string;
  isCoordinator?: boolean;
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shiftType: ShiftType;
  modality: ShiftModality; // 'ps' ou 'agenda'
  durationHours: number; // Quantidade de horas no período (ex: 6, 8, 12, 24)
  sector: ShiftSector;
  location: string;
  hospital: Hospital;
  doctorId: string | null; // null means 'Vago' / Open for claim
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tradeRequestId?: string | null;
}

export interface TradeRequest {
  id: string;
  shiftId: string;
  fromDoctorId: string;
  toDoctorId: string | null; // null means available for any team member
  note?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  authorName: string;
  action: 'create' | 'update' | 'delete' | 'claim' | 'trade_request' | 'trade_accept' | 'trade_cancel';
  summary: string;
}

export interface UFetalState {
  doctors: Doctor[];
  shifts: Shift[];
  trades: TradeRequest[];
  auditLogs: AuditLogEntry[];
}

export interface ServerEventPayload {
  type: 'init' | 'shift_created' | 'shift_updated' | 'shift_deleted' | 'shift_claimed' | 'trade_updated' | 'doctor_added';
  shift?: Shift;
  shiftId?: string;
  trade?: TradeRequest;
  doctor?: Doctor;
  auditLog?: AuditLogEntry;
  state?: UFetalState;
}
