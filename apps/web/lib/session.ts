import type { Session } from "./api";

const KEY = "sahay.desk.session";
let memory: Session | null = null;

export function getSession(): Session | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as Session;
  } catch {}
  return memory;
}

export function setSession(s: Session | null) {
  memory = s;
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {}
}
