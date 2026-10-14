import { Appointment, FamilyProfile, Language, Reminder, UserSettings } from '../types';

const SETTINGS_KEY = 'hello_sahay_settings';
const APPOINTMENTS_KEY = 'hello_sahay_appointments';
const REMINDERS_KEY = 'hello_sahay_reminders';
const FAMILY_KEY = 'hello_sahay_family';
const SAVED_HOSPITALS_KEY = 'hello_sahay_saved_hospitals';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'ta', // Default to Tamil, first-time modal prompts user
  hasConsented: false,
  locationPermission: false,
  microphonePermission: false,
  notificationsPermission: false,
};

export const storageService = {
  // Settings & Preferences
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    try {
      const current = storageService.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to save settings:', e);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  },

  setLanguage(lang: Language): void {
    storageService.saveSettings({ language: lang });
  },

  // Appointments: a cache of what the server returned, so views can read synchronously.
  getAppointments(): Appointment[] {
    try {
      return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  setAppointments(list: Appointment[]): void {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to cache appointments:', e);
    }
  },

  // Medicine Reminders
  getReminders(): Reminder[] {
    try {
      const data = localStorage.getItem(REMINDERS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveReminder(reminder: Reminder): void {
    try {
      const list = storageService.getReminders();
      const updated = [reminder, ...list.filter((r) => r.id !== reminder.id)];
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save reminder:', e);
    }
  },

  updateReminderStatus(id: string, status: 'active' | 'paused'): void {
    try {
      const list = storageService.getReminders();
      const updated = list.map((r) => (r.id === id ? { ...r, status } : r));
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update status:', e);
    }
  },

  recordDoseAdherence(id: string, action: 'taken' | 'snoozed' | 'skipped'): void {
    try {
      const list = storageService.getReminders();
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updated = list.map((r) => {
        if (r.id === id) {
          const history = [{ date: today, time: nowTime, status: action }, ...r.adherenceHistory];
          return {
            ...r,
            lastTakenTimestamp: action === 'taken' ? new Date().toISOString() : r.lastTakenTimestamp,
            adherenceHistory: history.slice(0, 30),
          };
        }
        return r;
      });
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to record adherence:', e);
    }
  },

  deleteReminder(id: string): void {
    try {
      const list = storageService.getReminders();
      const updated = list.filter((r) => r.id !== id);
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete reminder:', e);
    }
  },

  // Family Profiles
  getFamilyProfiles(): FamilyProfile[] {
    try {
      const data = localStorage.getItem(FAMILY_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveFamilyProfile(profile: FamilyProfile): void {
    try {
      const list = storageService.getFamilyProfiles();
      const updated = [...list.filter((f) => f.id !== profile.id), profile];
      localStorage.setItem(FAMILY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save family profile:', e);
    }
  },

  deleteFamilyProfile(id: string): void {
    try {
      const list = storageService.getFamilyProfiles();
      const updated = list.filter((f) => f.id !== id);
      localStorage.setItem(FAMILY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete family profile:', e);
    }
  },

  // Bookmarked Saved Hospitals
  getSavedHospitals(): string[] {
    try {
      const data = localStorage.getItem(SAVED_HOSPITALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleSaveHospital(id: string): string[] {
    try {
      const current = storageService.getSavedHospitals();
      const updated = current.includes(id) ? current.filter((h) => h !== id) : [...current, id];
      localStorage.setItem(SAVED_HOSPITALS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(APPOINTMENTS_KEY);
      localStorage.removeItem(REMINDERS_KEY);
      localStorage.removeItem(FAMILY_KEY);
      localStorage.removeItem(SAVED_HOSPITALS_KEY);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  },
};
