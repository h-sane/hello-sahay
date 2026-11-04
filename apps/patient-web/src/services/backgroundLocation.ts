import { Capacitor, registerPlugin } from '@capacitor/core';
import { BASE, TOKEN_KEY } from './api';

interface Status {
  foreground: boolean;
  background: boolean;
  enabled: boolean;
}

// Implemented in android/.../SahayLocationPlugin.java: a WorkManager job that reports the position every 30 minutes
// even when the app is closed. There is no iOS version yet, so the helpline falls back to the app-open push there.
const plugin = registerPlugin<{
  status(): Promise<Status>;
  requestAccess(): Promise<Status>;
  start(o: { apiBase: string; phone: string; token: string }): Promise<Status>;
  stop(): Promise<Status>;
}>('SahayLocation');

const CHOICE_KEY = 'sahay.locshare';
type Choice = 'on' | 'off';

function choice(): Choice | null {
  try {
    return localStorage.getItem(CHOICE_KEY) as Choice | null;
  } catch {
    return null;
  }
}

function remember(c: Choice) {
  try {
    localStorage.setItem(CHOICE_KEY, c);
  } catch {
    /* storage blocked: the patient is simply asked again next time */
  }
}

function start(phone: string): Promise<Status> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || BASE.startsWith('/')) return plugin.status(); // signed out, or a dev build with no absolute server address
  return plugin.start({ apiBase: BASE, phone, token });
}

export const backgroundLocation = {
  supported: Capacitor.getPlatform() === 'android',
  neverAsked: () => choice() === null,
  status: () => plugin.status(),

  // Asks for location, then "allow all the time", then schedules the 30-minute reports.
  async enable(phone: string): Promise<Status> {
    const granted = await plugin.requestAccess();
    if (!granted.foreground) return granted;
    remember('on');
    return start(phone);
  },

  async disable(): Promise<void> {
    remember('off');
    await plugin.stop();
  },

  declined: () => remember('off'),

  // On every launch: hand the worker the current sign-in so it keeps reporting.
  async resume(phone: string): Promise<void> {
    if (choice() === 'on') await start(phone).catch(() => {});
  },
};
