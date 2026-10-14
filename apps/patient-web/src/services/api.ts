// Thin client for the Hello Sahay API (docs/ARCHITECTURE.md section 5).
// Dev: vite proxies /api to the FastAPI server. Prod: set VITE_API_URL.
const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ApiFacility {
  id: number;
  name: string;
  type: 'PHC' | 'CHC' | 'GH' | 'private';
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: string | null;
  departments: string[];
  pmjay: boolean;
  cmchis: boolean;
  is_partner: boolean;
  is_government: boolean;
  distance_km: number | null;
}

export interface ApiSlot {
  slot_id: number;
  start: string;
  end: string;
  doctor_id: number;
  doctor_name: string;
  department: string;
}

export interface ApiNearbyHospital {
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  kind: 'government' | 'phc' | 'private' | 'hospital';
  speciality: string | null;
  address: string | null;
  emergency: boolean;
  pmjay: boolean;
  cmchis: boolean;
  phone: string | null;
  book_facility_id: number | null;
}

export interface ApiAppointment {
  id: number;
  status: 'booked' | 'arrived' | 'no_show' | 'cancelled';
  source: 'helpline' | 'app' | 'desk';
  reason_text: string | null;
  patient: { id: number; name: string | null; phone: string; language: string | null; village: string | null };
  slot: { id: number; start: string; end: string };
  doctor: { id: number; name: string; department: string };
  facility: { id: number; name: string; address: string | null; phone: string | null };
}

export interface ApiChatReply {
  answer: string;
  citations: { issuer: string | null; title: string | null; url: string | null; published: string | null }[];
  safety_flag: 'ok' | 'emergency' | 'symptom';
  grounded: boolean;
}

export interface ApiAdvisory {
  doc_id: string;
  title: string | null;
  issuer: string | null;
  url: string | null;
  published: string | null;
  lang: string;
  summary: string;
}

const TOKEN_KEY = 'sahay.patient.token';

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init?.method,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...authHeaders() },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the Sahay server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, typeof data?.detail === 'string' ? data.detail : res.statusText);
  }
  return data as T;
}

export const api = {
  facilities: (coords?: { latitude: number; longitude: number }) =>
    request<ApiFacility[]>(
      `/facilities?limit=100${coords ? `&lat=${coords.latitude}&lng=${coords.longitude}` : ''}`
    ),
  nearbyHospitals: (coords: { latitude: number; longitude: number }) =>
    request<ApiNearbyHospital[]>(`/places/nearby-hospitals?lat=${coords.latitude}&lng=${coords.longitude}`),
  slots: (facilityId: number, date: string) =>
    request<ApiSlot[]>(`/facilities/${facilityId}/slots?date=${date}`),
  book: (body: {
    patient: { name: string; phone: string; language?: string };
    slot_id: number;
    reason_text?: string;
  }) => request<ApiAppointment>('/appointments', { method: 'POST', body: { ...body, source: 'app' } }),
  cancel: (id: number) =>
    request<ApiAppointment>(`/appointments/${id}`, { method: 'PATCH', body: { action: 'cancel' } }),
  patientAppointments: (phone: string) =>
    request<ApiAppointment[]>(`/patients/${encodeURIComponent(phone)}/appointments`),
  chat: (message: string, lang: string) =>
    request<ApiChatReply>('/chat', { method: 'POST', body: { message, lang } }),
  advisories: (lang: string) => request<ApiAdvisory[]>(`/advisories?lang=${lang}`),
  requestOtp: (phone: string) => request<{ sent: boolean }>('/auth/otp/request', { method: 'POST', body: { phone } }),
  verifyOtp: (phone: string, code: string) =>
    request<{ token: string; patient: { phone: string; name: string | null } }>('/auth/otp/verify', {
      method: 'POST',
      body: { phone, code },
    }).then((r) => {
      try {
        localStorage.setItem(TOKEN_KEY, r.token);
      } catch {
        /* storage blocked: location sharing is simply skipped */
      }
      return r;
    }),
  // The helpline reads this when the same number calls, so it can confirm the live location instead of asking.
  pushLocation: (phone: string, coords: { latitude: number; longitude: number }) =>
    request<{ ok: boolean }>(`/patients/${encodeURIComponent(phone)}/location`, {
      method: 'PUT',
      body: { lat: coords.latitude, lng: coords.longitude },
    }),
};
