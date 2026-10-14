export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1").replace(/\/$/, "");
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export type Appointment = {
  id: number;
  status: "booked" | "arrived" | "no_show" | "cancelled";
  source: "helpline" | "app" | "desk";
  reason_text: string | null;
  arrived_at: string | null;
  patient: { id: number; name: string | null; phone: string; language: string | null; village: string | null };
  slot: { id: number; start: string; end: string };
  doctor: { id: number; name: string; department: string };
  facility: { id: number; name: string; address: string | null; phone: string | null };
};

export type Call = {
  id: number;
  patient_phone: string | null;
  facility_id: number | null;
  language: "ta" | "hi" | "en" | null;
  transcript: unknown;
  summary: string | null;
  outcome: "booked" | "info_given" | "emergency" | "handed_off" | null;
  emergency: boolean;
  handoff: boolean;
  started_at: string;
  duration_s: number | null;
};

export type Session = { token: string; role: string; facility_id: number | null };

// network: server unreachable. auth: token missing or expired. http: server answered with an error.
export class ApiError extends Error {
  constructor(public kind: "network" | "auth" | "http", message: string, public status = 0) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError("network", "Cannot reach the Sahay server.");
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch {}
    if (res.status === 401 && token) throw new ApiError("auth", "Your session has ended.", 401);
    throw new ApiError("http", detail || `Server error (${res.status}).`, res.status);
  }
  return res.json();
}

export const login = (email: string, password: string) =>
  request<Session>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const listAppointments = (token: string, date: string) =>
  request<Appointment[]>(`/appointments?date=${date}`, {}, token);

export const markArrived = (token: string, id: number) =>
  request<Appointment>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ action: "arrived" }) }, token);

export const listCalls = (token: string, facilityId: number) =>
  request<Call[]>(`/calls?facility_id=${facilityId}`, {}, token);

export const listHandoffs = (token: string) => request<Call[]>("/handoffs", {}, token);

// Calendar day in the hospital's time zone; the API filters appointments by IST day.
const ist = (d: Date, opts: Intl.DateTimeFormatOptions, locale = "en-CA") =>
  new Intl.DateTimeFormat(locale, { timeZone: "Asia/Kolkata", ...opts }).format(d);

export const todayIST = () => ist(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });
export const dayOf = (iso: string) => ist(new Date(iso), { year: "numeric", month: "2-digit", day: "2-digit" });
export const timeOf = (iso: string) => ist(new Date(iso), { hour: "numeric", minute: "2-digit", hour12: true }, "en-IN").toUpperCase();
export const dayLabel = (iso: string) =>
  ist(new Date(`${iso}T12:00:00+05:30`), { weekday: "long", day: "numeric", month: "long" }, "en-IN");
export const dateTimeOf = (iso: string) =>
  ist(new Date(iso), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }, "en-IN");

export const maskPhone = (phone: string) => `•••••• ${phone.slice(-4)}`;
