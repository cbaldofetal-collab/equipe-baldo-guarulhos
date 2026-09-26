var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var SUPABASE_URL = process.env.SUPABASE_URL || "";
var SUPABASE_KEY = process.env.SUPABASE_KEY || "";
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[uFetal] SUPABASE_URL e SUPABASE_KEY n\xE3o configuradas!");
  process.exit(1);
}
var supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_KEY);
function calculateShiftHours(startTime, endTime, shiftType) {
  if (shiftType === "sobreaviso" || shiftType === "plantao_24h") return 24;
  if (shiftType === "plantao_12d" || shiftType === "plantao_12n") return 12;
  if (shiftType === "manha" || shiftType === "tarde") return 6;
  const [startH, startM] = (startTime || "07:00").split(":").map(Number);
  const [endH, endM] = (endTime || "19:00").split(":").map(Number);
  let totalMinutes = endH * 60 + endM - (startH * 60 + startM);
  if (totalMinutes <= 0) totalMinutes += 24 * 60;
  return Math.round(totalMinutes / 60 * 10) / 10;
}
var INITIAL_DOCTORS = [
  {
    id: "doc-baldo",
    name: "Dr. Carlos Baldo",
    crm: "CRM 142.857-SP",
    phone: "(11) 98765-4321",
    email: "cbaldo.fetal@gmail.com",
    specialty: "Medicina Fetal & Cirurgia Fetal",
    color: "#0d9488",
    initials: "CB",
    is_coordinator: true
  },
  {
    id: "doc-mariana",
    name: "Dra. Mariana Silveira",
    crm: "CRM 158.320-SP",
    phone: "(11) 97654-3210",
    email: "mariana.silveira@ufetal.med.br",
    specialty: "Procedimentos Invasivos & Rastreio Fetal",
    color: "#0284c7",
    initials: "MS"
  },
  {
    id: "doc-felipe",
    name: "Dr. Felipe Rocha",
    crm: "CRM 139.410-SP",
    phone: "(11) 96543-2109",
    email: "felipe.rocha@ufetal.med.br",
    specialty: "Dopplerfluxometria & Vitalidade Fetal",
    color: "#6366f1",
    initials: "FR"
  },
  {
    id: "doc-beatriz",
    name: "Dra. Beatriz Santos",
    crm: "CRM 167.890-SP",
    phone: "(11) 95432-1098",
    email: "beatriz.santos@ufetal.med.br",
    specialty: "Ecocardiografia Fetal",
    color: "#e11d48",
    initials: "BS"
  },
  {
    id: "doc-lucas",
    name: "Dr. Lucas Azevedo",
    crm: "CRM 175.204-SP",
    phone: "(11) 94321-0987",
    email: "lucas.azevedo@ufetal.med.br",
    specialty: "Neurosonografia Fetal & USG 3D/4D",
    color: "#d97706",
    initials: "LA"
  },
  {
    id: "doc-camila",
    name: "Dra. Camila Nogueira",
    crm: "CRM 182.400-SP",
    email: "camila.nogueira@ufetal.med.br",
    phone: "(11) 93210-9876",
    specialty: "Gesta\xE7\xE3o de Alto Risco & USG Morfol\xF3gica",
    color: "#8b5cf6",
    initials: "CN"
  }
];
var sseClients = [];
var nextClientId = 1;
function broadcastEvent(eventType, payload) {
  const data = JSON.stringify({ type: eventType, ...payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  Array.from(sseClients).forEach((client) => {
    try {
      client.res.write(`data: ${data}

`);
    } catch (e) {
    }
  });
}
async function addAuditLog(authorName, action, summary) {
  const entry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    author_name: authorName,
    action,
    summary
  };
  const { error } = await supabase.from("audit_logs").insert([entry]);
  if (error) console.error("[uFetal] Error saving audit log:", error);
  return entry;
}
async function canManageSchedule(doctorId) {
  const { data: doctor } = await supabase.from("doctors").select("is_coordinator, authorized_to_manage").eq("id", doctorId).single();
  if (!doctor) return false;
  return doctor.is_coordinator === true || doctor.authorized_to_manage === true;
}
async function initializeDatabase() {
  try {
    const { data: doctors } = await supabase.from("doctors").select("*").limit(1);
    if (!doctors || doctors.length === 0) {
      console.log("[uFetal] Inicializando m\xE9dicos...");
      for (const doctor of INITIAL_DOCTORS) {
        await supabase.from("doctors").insert([doctor]);
      }
      console.log("[uFetal] M\xE9dicos inicializados com sucesso!");
    }
  } catch (err) {
    console.error("[uFetal] Erro ao inicializar banco de dados:", err);
  }
}
var app = (0, import_express.default)();
var PORT = parseInt(process.env.PORT || "3000", 10);
app.use(import_express.default.json());
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(": heartbeat\n\n");
    } catch (e) {
    }
  });
}, 2e4);
app.get("/api/events", async (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token de autentica\xE7\xE3o obrigat\xF3rio" });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });
  try {
    const { data: doctors } = await supabase.from("doctors").select("*").limit(1e3);
    const { data: shifts } = await supabase.from("shifts").select("*").limit(1e3);
    const { data: trades } = await supabase.from("trades").select("*").limit(1e3);
    const { data: auditLogs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    const state = {
      doctors: doctors || [],
      shifts: shifts || [],
      trades: trades || [],
      auditLogs: auditLogs || []
    };
    res.write(`data: ${JSON.stringify({ type: "init", state })}

`);
  } catch (err) {
    console.error("[uFetal] Error sending initial state:", err);
  }
  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});
app.get("/api/state", async (req, res) => {
  try {
    const { data: doctors } = await supabase.from("doctors").select("*").limit(1e3);
    const { data: shifts } = await supabase.from("shifts").select("*").limit(1e3);
    const { data: trades } = await supabase.from("trades").select("*").limit(1e3);
    const { data: auditLogs } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    res.json({
      doctors: doctors || [],
      shifts: shifts || [],
      trades: trades || [],
      auditLogs: auditLogs || []
    });
  } catch (err) {
    console.error("[uFetal] Error fetching state:", err);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});
app.put("/api/doctors/:id/authorize", async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { coordinatorId, authorized } = req.body;
    const { data: coordinator } = await supabase.from("doctors").select("is_coordinator, name").eq("id", coordinatorId).single();
    if (!coordinator || !coordinator.is_coordinator) {
      return res.status(403).json({ error: "Apenas o coordenador pode autorizar m\xE9dicos" });
    }
    const { error } = await supabase.from("doctors").update({ authorized_to_manage: authorized === true }).eq("id", doctorId);
    if (error) {
      console.error("[uFetal] Supabase update error:", error);
      return res.status(500).json({ error: "Erro ao atualizar autoriza\xE7\xE3o", details: error.message });
    }
    await addAuditLog(
      coordinator.name || "Coordenador",
      "doctor_authorized",
      `${authorized ? "Autorizado" : "Removido de autorizado"} para gerenciar escala.`
    );
    broadcastEvent("doctor_authorized", { doctorId, authorized });
    res.json({ success: true, doctorId, authorized });
  } catch (err) {
    console.error("[uFetal] Error authorizing doctor:", err);
    res.status(500).json({ error: "Erro ao autorizar m\xE9dico" });
  }
});
app.post("/api/shifts", async (req, res) => {
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
      currentDoctorId
    } = req.body;
    if (currentDoctorId && !await canManageSchedule(currentDoctorId)) {
      return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para gerenciar a escala. Solicite autoriza\xE7\xE3o ao coordenador." });
    }
    if (!date || !start_time || !end_time || !shift_type) {
      console.error("[DEBUG] Missing fields:", { date, start_time, end_time, shift_type });
      res.status(400).json({ error: `Campos obrigat\xF3rios faltando. Recebido: date=${date}, start_time=${start_time}, end_time=${end_time}, shift_type=${shift_type}` });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Data inv\xE1lida. Use formato YYYY-MM-DD." });
    }
    if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ error: "Hor\xE1rio inv\xE1lido. Use formato HH:mm." });
    }
    const validShiftTypes = ["manha", "tarde", "noite", "12h_noturno", "plantao_24h", "sobreaviso", "personalizado", "PS", "Agenda", "Sobreaviso", "Outra"];
    if (!validShiftTypes.includes(shift_type)) {
      return res.status(400).json({ error: `Tipo de plant\xE3o inv\xE1lido. Recebido: ${shift_type}` });
    }
    console.log(`[DEBUG] start_time: "${start_time}", end_time: "${end_time}"`);
    if (!start_time || !end_time) {
      return res.status(400).json({ error: "Hor\xE1rios de in\xEDcio e fim s\xE3o obrigat\xF3rios." });
    }
    const [startHour, startMin] = start_time.split(":").map(Number);
    const [endHour, endMin] = end_time.split(":").map(Number);
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return res.status(400).json({ error: "Formato de hor\xE1rio inv\xE1lido. Use HH:mm" });
    }
    let startTotalMin = startHour * 60 + startMin;
    let endTotalMin = endHour * 60 + endMin;
    if (endTotalMin < startTotalMin) {
      endTotalMin += 24 * 60;
    }
    console.log(`[DEBUG] startTotalMin: ${startTotalMin}, endTotalMin: ${endTotalMin}`);
    if (startTotalMin >= endTotalMin) {
      return res.status(400).json({ error: "Hor\xE1rio de fim deve ser ap\xF3s o hor\xE1rio de in\xEDcio." });
    }
    const calculatedHours = typeof duration_hours === "number" && duration_hours > 0 ? duration_hours : calculateShiftHours(start_time, end_time, shift_type);
    const shiftModality = modality === "agenda" ? "agenda" : "ps";
    const newShift = {
      id: `shift-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      date,
      start_time,
      end_time,
      shift_type,
      modality: shiftModality,
      duration_hours: calculatedHours,
      sector: sector || "Medicina Fetal - Plant\xE3o e Sala de Parto",
      location: location || "Maternidade Central - Unidade Fetal",
      doctor_id: doctor_id || null,
      status: doctor_id ? "confirmed" : "open",
      notes: notes || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { error: insertError } = await supabase.from("shifts").insert([newShift]);
    if (insertError) {
      return res.status(500).json({ error: "Erro ao criar plant\xE3o" });
    }
    const { data: doctor } = await supabase.from("doctors").select("name").eq("id", doctor_id).single();
    const docName = doctor?.name || "Vago";
    const modalityLabel = shiftModality === "ps" ? "PS" : "Agenda";
    await addAuditLog(
      authorName || "M\xE9dico da Equipe",
      "create",
      `Novo plant\xE3o [${modalityLabel} \u2022 ${calculatedHours}h] em ${date} (${start_time}-${end_time}) para ${docName}.`
    );
    broadcastEvent("shift_created", { shift: newShift });
    res.status(201).json(newShift);
  } catch (err) {
    console.error("[uFetal] Error creating shift:", err);
    res.status(500).json({ error: "Erro ao criar plant\xE3o" });
  }
});
app.put("/api/shifts/:id", async (req, res) => {
  try {
    const shiftId = req.params.id;
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
    if (!shift) {
      return res.status(404).json({ error: "Plant\xE3o n\xE3o encontrado" });
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
      currentDoctorId
    } = req.body;
    if (currentDoctorId && !await canManageSchedule(currentDoctorId)) {
      return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para gerenciar a escala. Solicite autoriza\xE7\xE3o ao coordenador." });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Data inv\xE1lida. Use formato YYYY-MM-DD." });
    }
    if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
      return res.status(400).json({ error: "Hor\xE1rio de in\xEDcio inv\xE1lido. Use formato HH:mm." });
    }
    if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ error: "Hor\xE1rio de fim inv\xE1lido. Use formato HH:mm." });
    }
    if (shift_type) {
      const validShiftTypes = ["manha", "tarde", "noite", "12h_noturno", "plantao_24h", "sobreaviso", "personalizado", "PS", "Agenda", "Sobreaviso", "Outra"];
      if (!validShiftTypes.includes(shift_type)) {
        return res.status(400).json({ error: `Tipo de plant\xE3o inv\xE1lido. Recebido: ${shift_type}` });
      }
    }
    const newStartTime = start_time ?? shift.start_time;
    const newEndTime = end_time ?? shift.end_time;
    const newShiftType = shift_type ?? shift.shift_type;
    const [startHour, startMin] = newStartTime.split(":").map(Number);
    const [endHour, endMin] = newEndTime.split(":").map(Number);
    let startTotalMin = startHour * 60 + startMin;
    let endTotalMin = endHour * 60 + endMin;
    if (endTotalMin < startTotalMin) {
      endTotalMin += 24 * 60;
    }
    if (startTotalMin >= endTotalMin) {
      return res.status(400).json({ error: "Hor\xE1rio de fim deve ser ap\xF3s o hor\xE1rio de in\xEDcio." });
    }
    const newDuration = typeof duration_hours === "number" && duration_hours > 0 ? duration_hours : start_time || end_time || shift_type ? calculateShiftHours(newStartTime, newEndTime, newShiftType) : shift.duration_hours;
    const updated = {
      ...shift,
      date: date ?? shift.date,
      start_time: newStartTime,
      end_time: newEndTime,
      shift_type: newShiftType,
      modality: modality ? modality === "agenda" ? "agenda" : "ps" : shift.modality,
      duration_hours: newDuration,
      sector: sector ?? shift.sector,
      location: location ?? shift.location,
      doctor_id: doctor_id !== void 0 ? doctor_id : shift.doctor_id,
      status: status ?? (doctor_id ? "confirmed" : "open"),
      notes: notes !== void 0 ? notes : shift.notes,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { error: updateError } = await supabase.from("shifts").update(updated).eq("id", shiftId);
    if (updateError) {
      return res.status(500).json({ error: "Erro ao atualizar plant\xE3o" });
    }
    const { data: doctor } = await supabase.from("doctors").select("name").eq("id", updated.doctor_id).single();
    const modalityLabel = updated.modality === "ps" ? "PS" : "Agenda";
    await addAuditLog(
      authorName || "M\xE9dico da Equipe",
      "update",
      `Plant\xE3o [${modalityLabel} \u2022 ${updated.duration_hours}h] de ${updated.date} atualizado.`
    );
    broadcastEvent("shift_updated", { shift: updated });
    res.json(updated);
  } catch (err) {
    console.error("[uFetal] Error updating shift:", err);
    res.status(500).json({ error: "Erro ao atualizar plant\xE3o" });
  }
});
app.delete("/api/shifts/:id", async (req, res) => {
  try {
    const shiftId = req.params.id;
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
    if (!shift) {
      return res.status(404).json({ error: "Plant\xE3o n\xE3o encontrado" });
    }
    const currentDoctorId = req.query.currentDoctorId;
    if (currentDoctorId && !await canManageSchedule(currentDoctorId)) {
      return res.status(403).json({ error: "Voc\xEA n\xE3o tem permiss\xE3o para gerenciar a escala. Solicite autoriza\xE7\xE3o ao coordenador." });
    }
    let authorName = "M\xE9dico da Equipe";
    if (req.query.authorName && typeof req.query.authorName === "string") {
      try {
        authorName = decodeURIComponent(req.query.authorName).substring(0, 255).trim();
      } catch (e) {
      }
    }
    const { error: deleteError } = await supabase.from("shifts").delete().eq("id", shiftId);
    if (deleteError) {
      return res.status(500).json({ error: "Erro ao deletar plant\xE3o" });
    }
    await supabase.from("trades").delete().eq("shift_id", shiftId);
    await addAuditLog(authorName, "delete", `Plant\xE3o de ${shift.date} removido.`);
    broadcastEvent("shift_deleted", { shiftId });
    res.json({ success: true, deletedId: shiftId });
  } catch (err) {
    console.error("[uFetal] Error deleting shift:", err);
    res.status(500).json({ error: "Erro ao deletar plant\xE3o" });
  }
});
app.post("/api/shifts/:id/claim", async (req, res) => {
  try {
    const shiftId = req.params.id;
    const { doctorId } = req.body;
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
    const { data: doctor } = await supabase.from("doctors").select("*").eq("id", doctorId).single();
    if (!shift) {
      return res.status(404).json({ error: "Plant\xE3o n\xE3o encontrado" });
    }
    if (!doctor) {
      return res.status(400).json({ error: "M\xE9dico n\xE3o encontrado" });
    }
    if (shift.doctor_id !== null) {
      return res.status(409).json({ error: "Este plant\xE3o j\xE1 foi assumido por outro m\xE9dico" });
    }
    const updated = {
      ...shift,
      doctor_id: doctor.id,
      status: "confirmed",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { error: updateError, data: updateData } = await supabase.from("shifts").update(updated).eq("id", shiftId).is("doctor_id", null);
    if (updateError || !updateData) {
      return res.status(409).json({ error: "Este plant\xE3o j\xE1 foi assumido por outro m\xE9dico" });
    }
    await addAuditLog(doctor.name, "claim", `${doctor.name} assumiu o plant\xE3o de ${shift.date}.`);
    broadcastEvent("shift_claimed", { shift: updated, doctor });
    res.json(updated);
  } catch (err) {
    console.error("[uFetal] Error claiming shift:", err);
    res.status(500).json({ error: "Erro ao assumir plant\xE3o" });
  }
});
app.post("/api/shifts/:id/replicate", async (req, res) => {
  try {
    const shiftId = req.params.id;
    const { months } = req.body;
    if (!months || months < 1 || months > 12) {
      return res.status(400).json({ error: "Meses deve ser entre 1 e 12" });
    }
    const { data: originalShift } = await supabase.from("shifts").select("*").eq("id", shiftId).single();
    if (!originalShift) {
      return res.status(404).json({ error: "Plant\xE3o n\xE3o encontrado" });
    }
    const [year, month, day] = originalShift.date.split("-").map(Number);
    const originalDate = new Date(year, month - 1, day);
    const originalDayOfWeek = originalDate.getDay();
    const createdShifts = [];
    for (let i = 1; i <= months; i++) {
      const targetDate = new Date(year, month - 1 + i, 1);
      let newDate = new Date(year, month - 1 + i, 1);
      while (newDate.getDay() !== originalDayOfWeek) {
        newDate.setDate(newDate.getDate() + 1);
      }
      if (newDate.getMonth() !== (month - 1 + i) % 12) {
        newDate.setDate(newDate.getDate() - 7);
      }
      const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`;
      const newShift = {
        ...originalShift,
        id: `shift-${Date.now()}-${i}`,
        date: dateStr,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error: insertError } = await supabase.from("shifts").insert([newShift]);
      if (!insertError) {
        createdShifts.push(newShift);
      }
    }
    const doctorName = originalShift.doctor_id ? (await supabase.from("doctors").select("name").eq("id", originalShift.doctor_id).single()).data?.name : "Escala Vaga";
    await addAuditLog(
      doctorName || "Sistema",
      "replicate_shift",
      `Escala de ${doctorName} replicada para ${months} m\xEAs(es)`
    );
    broadcastEvent("shifts_replicated", { originalShift, createdShifts, months });
    res.json({ success: true, createdCount: createdShifts.length, shifts: createdShifts });
  } catch (err) {
    console.error("[uFetal] Error replicating shift:", err);
    res.status(500).json({ error: "Erro ao replicar escala" });
  }
});
app.get("/api/trades", async (req, res) => {
  try {
    const { data: trades } = await supabase.from("trades").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (!trades) {
      return res.json({ trades: [] });
    }
    const enrichedTrades = await Promise.all(
      (trades || []).map(async (trade) => {
        const { data: shift } = await supabase.from("shifts").select("*").eq("id", trade.shift_id).single();
        const { data: fromDoc } = await supabase.from("doctors").select("*").eq("id", trade.from_doctor_id).single();
        return {
          id: trade.id,
          shift_id: trade.shift_id,
          from_doctor_id: trade.from_doctor_id,
          from_doctor_name: fromDoc?.name || "Desconhecido",
          to_doctor_id: trade.to_doctor_id,
          to_doctor_name: trade.to_doctor_id ? (await supabase.from("doctors").select("name").eq("id", trade.to_doctor_id).single()).data?.name : void 0,
          reason: trade.note,
          status: trade.status,
          created_at: trade.created_at,
          shift_date: shift?.date,
          shift_time: shift ? `${shift.start_time} - ${shift.end_time}` : "N/A"
        };
      })
    );
    res.json({ trades: enrichedTrades });
  } catch (err) {
    console.error("[uFetal] Error fetching trades:", err);
    res.status(500).json({ error: "Erro ao buscar trocas" });
  }
});
app.post("/api/trades", async (req, res) => {
  try {
    const { shift_id, from_doctor_id, to_doctor_id, note } = req.body;
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", shift_id).single();
    const { data: fromDoc } = await supabase.from("doctors").select("*").eq("id", from_doctor_id).single();
    if (!shift || !fromDoc) {
      return res.status(400).json({ error: "Dados de troca inv\xE1lidos" });
    }
    const trade = {
      id: `trade-${Date.now()}`,
      shift_id,
      from_doctor_id,
      to_doctor_id: to_doctor_id || null,
      note: note || "",
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const { error: insertError } = await supabase.from("trades").insert([trade]);
    if (insertError) {
      return res.status(500).json({ error: "Erro ao criar troca" });
    }
    const { error: updateError } = await supabase.from("shifts").update({
      status: "trade_requested",
      trade_request_id: trade.id
    }).eq("id", shift_id);
    const targetDesc = to_doctor_id ? "para o colega" : "para toda a equipe";
    await addAuditLog(fromDoc.name, "trade_request", `Troca solicitada ${targetDesc}.`);
    broadcastEvent("trade_updated", { trade, shift });
    res.status(201).json({ trade, shift });
  } catch (err) {
    console.error("[uFetal] Error creating trade:", err);
    res.status(500).json({ error: "Erro ao criar troca" });
  }
});
app.post("/api/trades/:id/accept", async (req, res) => {
  try {
    const tradeId = req.params.id;
    const { acceptingDoctorId } = req.body;
    const { data: trade } = await supabase.from("trades").select("*").eq("id", tradeId).single();
    const { data: acceptingDoc } = await supabase.from("doctors").select("*").eq("id", acceptingDoctorId).single();
    if (!trade || !acceptingDoc) {
      return res.status(400).json({ error: "Troca ou m\xE9dico n\xE3o encontrado" });
    }
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", trade.shift_id).single();
    if (!shift) {
      return res.status(404).json({ error: "Plant\xE3o n\xE3o encontrado" });
    }
    if (trade.status !== "pending") {
      return res.status(409).json({ error: "Esta troca j\xE1 foi processada" });
    }
    const { error: tradeError, data: tradeData } = await supabase.from("trades").update({ status: "accepted" }).eq("id", tradeId).eq("status", "pending");
    if (tradeError || !tradeData) {
      return res.status(409).json({ error: "Esta troca j\xE1 foi processada" });
    }
    const { error: shiftError, data: shiftData } = await supabase.from("shifts").update({
      doctor_id: acceptingDoc.id,
      status: "confirmed",
      trade_request_id: null
    }).eq("id", trade.shift_id).is("trade_request_id", trade.id);
    if (shiftError || !shiftData) {
      return res.status(409).json({ error: "Este plant\xE3o j\xE1 foi atribu\xEDdo" });
    }
    await addAuditLog(acceptingDoc.name, "trade_accept", `Troca aceita por ${acceptingDoc.name}.`);
    broadcastEvent("trade_updated", { trade, shift });
    res.json({ trade, shift });
  } catch (err) {
    console.error("[uFetal] Error accepting trade:", err);
    res.status(500).json({ error: "Erro ao aceitar troca" });
  }
});
app.post("/api/trades/:id/reject", async (req, res) => {
  try {
    const tradeId = req.params.id;
    const { data: trade } = await supabase.from("trades").select("*").eq("id", tradeId).single();
    if (!trade) {
      return res.status(404).json({ error: "Troca n\xE3o encontrada" });
    }
    const { error: updateError } = await supabase.from("trades").update({ status: "declined" }).eq("id", tradeId);
    if (updateError) {
      return res.status(500).json({ error: "Erro ao rejeitar troca" });
    }
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", trade.shift_id).single();
    if (shift && shift.status === "trade_requested") {
      await supabase.from("shifts").update({ status: "open", trade_request_id: null }).eq("id", trade.shift_id);
    }
    const { data: fromDoc } = await supabase.from("doctors").select("name").eq("id", trade.from_doctor_id).single();
    await addAuditLog(fromDoc?.name || "M\xE9dico", "trade_reject", "Solicita\xE7\xE3o de troca rejeitada.");
    broadcastEvent("trade_updated", { trade, shift });
    res.json({ success: true, trade });
  } catch (err) {
    console.error("[uFetal] Error rejecting trade:", err);
    res.status(500).json({ error: "Erro ao rejeitar troca" });
  }
});
app.post("/api/trades/:id/cancel", async (req, res) => {
  try {
    const tradeId = req.params.id;
    const { data: trade } = await supabase.from("trades").select("*").eq("id", tradeId).single();
    if (!trade) {
      return res.status(404).json({ error: "Troca n\xE3o encontrada" });
    }
    const { error: updateError } = await supabase.from("trades").update({ status: "cancelled" }).eq("id", tradeId);
    if (updateError) {
      return res.status(500).json({ error: "Erro ao cancelar troca" });
    }
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", trade.shift_id).single();
    if (shift) {
      await supabase.from("shifts").update({ status: "confirmed", trade_request_id: null }).eq("id", trade.shift_id);
    }
    const { data: fromDoc } = await supabase.from("doctors").select("name").eq("id", trade.from_doctor_id).single();
    await addAuditLog(fromDoc?.name || "M\xE9dico", "trade_cancel", "Solicita\xE7\xE3o de troca cancelada.");
    broadcastEvent("trade_updated", { trade, shift });
    res.json({ success: true, trade });
  } catch (err) {
    console.error("[uFetal] Error canceling trade:", err);
    res.status(500).json({ error: "Erro ao cancelar troca" });
  }
});
app.post("/api/doctors", async (req, res) => {
  try {
    const { name, crm, phone, email, specialty, color } = req.body;
    if (!name || !crm) {
      return res.status(400).json({ error: "Nome e CRM s\xE3o obrigat\xF3rios" });
    }
    const initials = name.split(" ").filter((p) => !["dr.", "dra.", "dr", "dra", "de", "da", "do"].includes(p.toLowerCase())).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "MD";
    const colors = ["#0d9488", "#0284c7", "#6366f1", "#e11d48", "#d97706", "#8b5cf6", "#10b981", "#f97316"];
    const { data: doctors } = await supabase.from("doctors").select("id");
    const chosenColor = color || colors[(doctors?.length || 0) % colors.length];
    const newDoctor = {
      id: `doc-${Date.now()}`,
      name,
      crm,
      phone: phone || "",
      email: email || "",
      specialty: specialty || "Medicina Fetal",
      color: chosenColor,
      initials
    };
    const { error: insertError } = await supabase.from("doctors").insert([newDoctor]);
    if (insertError) {
      return res.status(500).json({ error: "Erro ao criar m\xE9dico" });
    }
    await addAuditLog("Coordena\xE7\xE3o uFetal Analia", "doctor_added", `${newDoctor.name} ingressou na equipe.`);
    broadcastEvent("doctor_added", { doctor: newDoctor });
    res.status(201).json(newDoctor);
  } catch (err) {
    console.error("[uFetal] Error creating doctor:", err);
    res.status(500).json({ error: "Erro ao criar m\xE9dico" });
  }
});
app.post("/api/schedule/clear", async (req, res) => {
  try {
    const { authorName } = req.body;
    await supabase.from("shifts").delete().neq("id", "");
    await supabase.from("trades").delete().neq("id", "");
    await addAuditLog(authorName || "Coordena\xE7\xE3o", "clear_schedule", "Escala zerada.");
    broadcastEvent("schedule_cleared", {});
    res.json({ success: true, message: "Escala limpa com sucesso." });
  } catch (err) {
    console.error("[uFetal] Error clearing schedule:", err);
    res.status(500).json({ error: "Erro ao limpar escala" });
  }
});
app.get("/api/debug/env", (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "NOT SET",
    SUPABASE_KEY: process.env.SUPABASE_KEY ? "SET (length: " + process.env.SUPABASE_KEY.length + ")" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? "SET" : "NOT SET"
  });
});
app.post("/api/debug/seed", async (req, res) => {
  try {
    const { data: existingDoctors } = await supabase.from("doctors").select("id").limit(1);
    if (!existingDoctors || existingDoctors.length === 0) {
      const results = [];
      for (const doctor of INITIAL_DOCTORS) {
        const { data, error } = await supabase.from("doctors").insert([doctor]).select();
        results.push({ doctor: doctor.name, success: !error, error: error?.message });
      }
      res.json({ success: true, message: "Doctors seeded", results });
    } else {
      res.json({ success: true, message: "Doctors already exist", count: existingDoctors.length });
    }
  } catch (err) {
    console.error("[uFetal] Error seeding database:", err);
    res.status(500).json({ error: err.message || "Failed to seed", stack: err.stack });
  }
});
var distPath = import_path.default.join(process.cwd(), "dist");
app.use(import_express.default.static(distPath, { maxAge: "1h" }));
app.get("*", (req, res) => {
  res.sendFile(import_path.default.join(distPath, "index.html"), (err) => {
    if (err) {
      console.error("[uFetal] Error serving index.html:", err);
      res.status(500).send("Erro ao carregar aplica\xE7\xE3o");
    }
  });
});
if (!process.env.VERCEL) {
  initializeDatabase().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[uFetal] Server running on http://0.0.0.0:${PORT}`);
    });
  });
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
