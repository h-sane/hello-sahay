// Shapes the API's appointments, calls and doctors into what the tabs render.

export const ROLE_LABEL = {
  hospital_admin: "Hospital Admin",
  receptionist: "Receptionist",
  nurse: "Nurse",
  doctor: "Doctor",
};

// The hospital runs on Indian time whatever the clock of the computer showing the screen.
const TZ = "Asia/Kolkata";

export const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

export const clock = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TZ });

export const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });

const STATUS = {
  booked: "Booked",
  arrived: "Arrived",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

export function toRow(a, token) {
  return {
    id: a.id,
    token,
    patientName: a.patient.name || "Unnamed patient",
    phone: a.patient.phone,
    doctor: a.doctor.name,
    department: a.doctor.department,
    timeSlot: clock(a.slot.start),
    date: dayLabel(a.slot.start),
    status: STATUS[a.status] || "Booked",
    source: a.source,
    reason: a.reason_text,
  };
}

const OUTCOME = {
  booked: "Slot Booked",
  emergency: "108 Emergency Redirected",
  handed_off: "Needs Callback",
  info_given: "Information Given",
};
const LANG = { ta: "Tamil", hi: "Hindi", en: "English" };

export function toCallRow(c) {
  let outcome = OUTCOME[c.outcome] || "Information Given";
  if (c.emergency) outcome = OUTCOME.emergency;
  else if (c.handoff) outcome = c.callback_done ? "Callback Completed" : OUTCOME.handed_off;
  return {
    id: c.id,
    callerPhone: c.patient_phone || "Unknown caller",
    time: new Date(c.started_at).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }),
    language: LANG[c.language] || "English",
    summary: c.summary || "No summary recorded for this call.",
    outcome,
  };
}

export function toDoctor(d) {
  const total = d.booked_slots + d.open_slots;
  return {
    id: d.id,
    name: d.name,
    specialty: d.department,
    onDuty: d.on_duty,
    hasLogin: d.has_login,
    bookedSlots: d.booked_slots,
    openSlots: d.open_slots,
    totalSlots: total,
    timings: d.first_start ? `${clock(d.first_start)} – ${clock(d.last_end)}` : "No slots this day",
  };
}
