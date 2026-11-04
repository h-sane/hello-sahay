import {
  AvailabilityData,
  EarningsData,
  HelperNotification,
  HelperProfile,
  ServiceBooking,
  SkillsCatalog,
} from '../types';

const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'sahay_sathi_token';
const PROFILE_KEY = 'sahay_sathi_profile';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
/** App signs the helper out when the server says the saved login is no longer valid. */
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

function store(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // private window or blocked storage: the login just does not survive a reload
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = read(TOKEN_KEY);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your internet connection and try again.');
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      msg = typeof err.detail === 'string' ? err.detail : err.detail?.[0]?.msg || err.message || msg;
    } catch {
      // keep the generic message
    }
    if (res.status === 401 && token && !path.startsWith('/sathi/auth/')) onUnauthorized?.();
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const put = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });

type Session = { token: string; is_registered: boolean; helper: HelperProfile };

function keepSession<T extends { token: string; helper: HelperProfile }>(res: T): T {
  store(TOKEN_KEY, res.token);
  store(PROFILE_KEY, JSON.stringify(res.helper));
  return res;
}

export const sathiApi = {
  requestOtp: (phone: string) =>
    post<{ sent: boolean; demo_code?: string; is_registered: boolean }>('/sathi/auth/otp/request', { phone }),

  async verifyOtp(phone: string, code: string): Promise<Session> {
    return keepSession(await post<Session>('/sathi/auth/otp/verify', { phone, code }));
  },

  async loginPassword(identifier: string, password: string): Promise<Session> {
    return keepSession(await post<Session>('/sathi/auth/login', { identifier, password }));
  },

  async register(data: Record<string, unknown>): Promise<{ success: boolean; token: string; helper: HelperProfile }> {
    return keepSession(await post<{ success: boolean; token: string; helper: HelperProfile }>('/sathi/register', data));
  },

  getToken: (): string | null => read(TOKEN_KEY),

  getSavedProfile(): HelperProfile | null {
    try {
      const saved = read(PROFILE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    store(TOKEN_KEY, null);
    store(PROFILE_KEY, null);
  },

  async getProfile(): Promise<HelperProfile> {
    const p = await request<HelperProfile>('/sathi/profile');
    store(PROFILE_KEY, JSON.stringify(p));
    return p;
  },

  async updateProfile(data: Partial<HelperProfile>): Promise<HelperProfile> {
    const p = await put<HelperProfile>('/sathi/profile', data);
    store(PROFILE_KEY, JSON.stringify(p));
    return p;
  },

  getSkillsCatalog: () => request<SkillsCatalog>('/sathi/skills/catalog'),

  extractSkills: (description: string) =>
    post<{ recognized_skills: string[]; suggestions: string[] }>('/sathi/skills/extract', { description }),

  getBookings: (status: string = 'all') => request<ServiceBooking[]>(`/sathi/bookings?status=${status}`),

  getBookingDetails: (id: number) => request<ServiceBooking>(`/sathi/bookings/${id}`),

  executeBookingAction: (id: number, action: 'accept' | 'reject' | 'start' | 'complete', notes?: string) =>
    post<ServiceBooking>(`/sathi/bookings/${id}/action`, { action, notes }),

  getEarnings: () => request<EarningsData>('/sathi/earnings'),

  getAvailability: () => request<AvailabilityData>('/sathi/availability'),

  updateAvailability: (data: Partial<AvailabilityData>) => put<AvailabilityData>('/sathi/availability', data),

  getNotifications: () => request<{ unread_count: number; notifications: HelperNotification[] }>('/sathi/notifications'),

  markNotificationRead: (id: number) => request<void>(`/sathi/notifications/${id}/read`, { method: 'PATCH' }),
};
