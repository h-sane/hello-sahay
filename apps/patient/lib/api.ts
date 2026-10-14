import Constants from 'expo-constants';

// Expo Go on a phone cannot use localhost: set EXPO_PUBLIC_API_BASE_URL to the PC's LAN IP.
// Default: the dev server's own host (the PC) on the API port.
const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${host}:8001/api/v1`;

export class ApiError extends Error {
  // network: no reply; rejected: 4xx (bad input or wrong code); server: 5xx, 404 or unreadable reply
  constructor(public kind: 'network' | 'rejected' | 'server', public status = 0) {
    super(kind);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError('network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404 || res.status >= 500) throw new ApiError('server', res.status);
  if (!res.ok) throw new ApiError('rejected', res.status);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('server', res.status);
  }
}

export type Patient = { id: number; name?: string | null; phone: string; language?: string | null };

// The API takes E.164 numbers; the app collects the 10-digit Indian number.
const e164 = (phone10: string) => `+91${phone10}`;

export const requestOtp = (phone10: string) => post<unknown>('/auth/otp/request', { phone: e164(phone10) });

export const verifyOtp = (phone10: string, code: string) =>
  post<{ token: string; patient: Patient }>('/auth/otp/verify', { phone: e164(phone10), code });
