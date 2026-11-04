// Shapes the API's appointments and doctors into what the tabs render.

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
  in_consult: "With doctor",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

export const LANG = { ta: "Tamil", hi: "Hindi", en: "English", ml: "Malayalam", kn: "Kannada", te: "Telugu" };

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "17:40" from the timetable preview -> "5:40 PM"
export const hhmm = (text) => {
  const [h, m] = text.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function scheduleSummary(s) {
  const base = `${s.slot_minutes}-minute slots`;
  return s.mode === "partial"
    ? `${base}, ${s.run} then a ${s.break_minutes}-minute walk-in break`
    : `${base}, appointments only`;
}

export function toRow(a, token) {
  return {
    id: a.id,
    token,
    language: LANG[a.patient.language] || null,
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

export function toDoctor(d) {
  const total = d.booked_slots + d.open_slots;
  return {
    id: d.id,
    name: d.name,
    specialty: d.department,
    onDuty: d.on_duty,
    hasLogin: d.has_login,
    languages: (d.languages || []).map((l) => LANG[l] || l),
    schedule: d.schedule,
    scheduleCustom: d.schedule_custom,
    bookedSlots: d.booked_slots,
    openSlots: d.open_slots,
    totalSlots: total,
    timings: d.first_start ? `${clock(d.first_start)} – ${clock(d.last_end)}` : "No slots this day",
  };
}
