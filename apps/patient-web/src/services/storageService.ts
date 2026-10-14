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
  userName: 'முத்துவேல் (Muthuvel)',
  villageTown: 'மதுராந்தகம் (Maduranthakam)',
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

  // Appointments
  getAppointments(): Appointment[] {
    try {
      const data = localStorage.getItem(APPOINTMENTS_KEY);
      if (!data) {
        // Seed default demo appointment for immediate demonstration
        const seedAppointments: Appointment[] = [
          {
            id: 'apt-seed-1',
            hospitalId: 'hosp-1',
            hospitalName: 'செங்கல்பட்டு அரசு மருத்துவக்கல்லூரி மருத்துவமனை (Chengalpattu Govt Medical College)',
            department: 'பொது மருத்துவம் (General Medicine)',
            doctorName: 'Dr. R. செந்தில் குமார் (Dr. R. Senthil Kumar)',
            date: '2026-10-20',
            timeSlot: '09:30 AM',
            patientName: 'முத்துவேல் (Muthuvel)',
            patientAge: 58,
            patientPhone: '98401XXXXX',
            isCaregiverAssisted: true,
            caregiverName: 'கார்த்திக் (மகன் / Son)',
            status: 'confirmed_demo',
            referenceCode: 'HS-CHG-8924',
            createdAt: '2026-10-14T08:00:00.000Z',
            isDemo: true,
          },
        ];
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(seedAppointments));
        return seedAppointments;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAppointment(appointment: Appointment): void {
    try {
      const list = storageService.getAppointments();
      const updated = [appointment, ...list.filter((a) => a.id !== appointment.id)];
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save appointment:', e);
    }
  },

  cancelAppointment(id: string): void {
    try {
      const list = storageService.getAppointments();
      const updated = list.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to cancel appointment:', e);
    }
  },

  // Medicine Reminders
  getReminders(): Reminder[] {
    try {
      const data = localStorage.getItem(REMINDERS_KEY);
      if (!data) {
        // Seed initial realistic rural prescription reminders
        const seedReminders: Reminder[] = [
          {
            id: 'rem-1',
            medicineName: 'மெட்ஃபோர்மின் 500 மிகி (Metformin 500mg - Jan Aushadhi)',
            dosage: '1 மாத்திரை (1 Tablet)',
            instructions: 'காலை உணவுக்குப் பின் (After breakfast)',
            times: ['08:30'],
            frequency: 'daily',
            durationDays: 30,
            startDate: '2026-10-10',
            status: 'active',
            lastTakenTimestamp: '2026-10-14T03:00:00.000Z',
            familyMemberName: 'முத்துவேல் (தந்தை / Father)',
            adherenceHistory: [
              { date: '2026-10-13', time: '08:35', status: 'taken' },
              { date: '2026-10-12', time: '08:40', status: 'taken' },
              { date: '2026-10-11', time: '08:30', status: 'taken' },
            ],
          },
          {
            id: 'rem-2',
            medicineName: 'டெல்மிசார்டன் 40 மிகி (Telmisartan 40mg - BP)',
            dosage: '1 மாத்திரை (1 Tablet)',
            instructions: 'இரவு உணவுக்குப் பின் (After dinner)',
            times: ['20:30'],
            frequency: 'daily',
            durationDays: 60,
            startDate: '2026-10-10',
            status: 'active',
            lastTakenTimestamp: null,
            familyMemberName: 'முத்துவேல் (தந்தை / Father)',
            adherenceHistory: [
              { date: '2026-10-13', time: '20:45', status: 'taken' },
              { date: '2026-10-12', time: '20:30', status: 'taken' },
            ],
          },
        ];
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(seedReminders));
        return seedReminders;
      }
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
      if (!data) {
        const seedFamily: FamilyProfile[] = [
          {
            id: 'fam-1',
            fullName: 'முத்துவேல் (Muthuvel)',
            relationship: 'Father',
            age: 58,
            gender: 'male',
            bloodGroup: 'B+',
            healthConditions: 'நீரிழிவு (Type 2 Diabetes), ரத்த அழுத்தம் (BP)',
          },
          {
            id: 'fam-2',
            fullName: 'லட்சுமி அம்மாள் (Lakshmi Ammal)',
            relationship: 'Mother',
            age: 54,
            gender: 'female',
            bloodGroup: 'O+',
            healthConditions: 'மூட்டு வலி (Joint pain / Arthritis)',
          },
        ];
        localStorage.setItem(FAMILY_KEY, JSON.stringify(seedFamily));
        return seedFamily;
      }
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
      return data ? JSON.parse(data) : ['hosp-1', 'hosp-2'];
    } catch {
      return ['hosp-1'];
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
