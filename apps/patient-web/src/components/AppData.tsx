import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';
import { storageService } from '../services/storageService';
import {
  CareMe, Contacts, FamilyMemberRow, NotificationRow, ReminderRow, patientApi,
} from '../services/patientApi';

interface AppDataValue {
  care: CareMe | null;
  contacts: Contacts | null;
  reminders: ReminderRow[];
  family: FamilyMemberRow[];
  notifications: NotificationRow[];
  appointments: Appointment[];
  refresh: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  refreshFamily: () => Promise<void>;
}

const Ctx = createContext<AppDataValue | null>(null);
const POLL_MS = 20_000;

export function useAppData(): AppDataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData needs AppDataProvider');
  return v;
}

/** One place that keeps the signed-in patient's server data fresh, so every tab shows the same facts. */
export const AppDataProvider: React.FC<{ signedIn: boolean; phone?: string; children: React.ReactNode }> = ({
  signedIn, phone, children,
}) => {
  const [care, setCare] = useState<CareMe | null>(null);
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [family, setFamily] = useState<FamilyMemberRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => storageService.getAppointments());
  const alive = useRef(true);

  const refreshReminders = useCallback(async () => {
    if (!signedIn) return;
    try { const r = await patientApi.reminders(); if (alive.current) setReminders(r); } catch { /* keep the last list */ }
  }, [signedIn]);

  const refreshFamily = useCallback(async () => {
    if (!signedIn) return;
    try { const r = await patientApi.family(); if (alive.current) setFamily(r); } catch { /* keep the last list */ }
  }, [signedIn]);

  const refreshAppointments = useCallback(async () => {
    if (!signedIn || !phone) return;
    try { const r = await appointmentService.refresh(phone); if (alive.current) setAppointments(r); } catch { /* keep cache */ }
  }, [signedIn, phone]);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      const [c, n] = await Promise.all([patientApi.careMe(), patientApi.notifications()]);
      if (alive.current) { setCare(c); setNotifications(n); }
    } catch { /* offline: keep what we have */ }
  }, [signedIn]);

  useEffect(() => {
    alive.current = true;
    patientApi.contacts().then((c) => alive.current && setContacts(c)).catch(() => {});
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    refresh(); refreshReminders(); refreshFamily(); refreshAppointments();
    const timer = setInterval(refresh, POLL_MS);
    const onFocus = () => { refresh(); refreshReminders(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('sahay:appointments', refreshAppointments);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('sahay:appointments', refreshAppointments);
    };
  }, [signedIn, refresh, refreshReminders, refreshFamily, refreshAppointments]);

  const value = useMemo(() => ({
    care, contacts, reminders, family, notifications, appointments,
    refresh, refreshAppointments, refreshReminders, refreshFamily,
  }), [care, contacts, reminders, family, notifications, appointments, refresh, refreshAppointments, refreshReminders, refreshFamily]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
