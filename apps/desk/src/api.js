// Thin client for the Hello Sahay API (docs/ARCHITECTURE.md section 5).
const BASE = import.meta.env.VITE_API_URL || "/api/v1";
const TOKEN_KEY = "sahay.desk.session";

export const session = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(TOKEN_KEY));
    } catch {
      return null;
    }
  },
  set(value) {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(value));
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const s = session.get();
  if (auth && s) headers.Authorization = `Bearer ${s.token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "Cannot reach the Sahay server. Check that the API is running.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  facilities: () => request("/facilities?limit=100", { auth: false }),
  appointments: (date) => request(`/appointments?date=${date}`),
  slots: (facilityId, date) =>
    request(`/facilities/${facilityId}/slots?date=${date}`, { auth: false }),
  calls: () => request("/calls?limit=100"),
  book: (body) => request("/appointments", { method: "POST", body }),
  act: (id, action) =>
    request(`/appointments/${id}`, { method: "PATCH", body: { action } }),
};

export function liveSocketUrl(facilityId, token) {
  const origin = BASE.startsWith("http")
    ? BASE.replace(/^http/, "ws")
    : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${BASE}`;
  return `${origin}/live/desk/${facilityId}?token=${encodeURIComponent(token)}`;
}
