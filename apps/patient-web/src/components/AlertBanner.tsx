import React, { useEffect, useState } from 'react';
import { BellRing, Pill } from 'lucide-react';
import { Language } from '../types';
import { patientApi } from '../services/patientApi';
import { useAppData } from './AppData';
import { BigButton, pick } from './ui';

const DUE_WINDOW_MIN = 90;
const SNOOZE_MIN = 10;

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const label = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2));
  return `${h % 12 || 12}:${hhmm.slice(3)} ${h < 12 ? 'AM' : 'PM'}`;
};

/** The in-app "push": a medicine that is due now, or news from the family (Care plan, medicine taken). */
export const AlertBanner: React.FC<{ lang: Language }> = ({ lang }) => {
  const { reminders, notifications, care, refresh, refreshReminders } = useAppData();
  const [tick, setTick] = useState(0);
  const [snoozed, setSnoozed] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 20_000);
    return () => clearInterval(timer);
  }, []);

  const now = nowMinutes();
  void tick;
  const due = reminders
    .filter((r) => r.active)
    .flatMap((r) => r.times.map((t) => ({ r, t })))
    .filter(({ r, t }) => !r.taken_today.includes(t) && now >= minutes(t) && now < minutes(t) + DUE_WINDOW_MIN)
    .filter(({ r, t }) => (snoozed[`${r.id}-${t}`] ?? 0) <= Date.now())[0];

  const unread = (care?.unread ?? 0) > 0 ? notifications.find((n) => !n.read) : undefined;

  if (due) {
    const took = async () => {
      setBusy(true);
      try { await patientApi.markTaken(due.r.id, due.t); await refreshReminders(); } finally { setBusy(false); }
    };
    return (
      <div className="sticky top-16 z-30 border-b-4 border-amber-500 bg-amber-50 px-4 py-4" role="alert">
        <div className="mx-auto max-w-xl">
          <p className="flex items-center gap-3 text-xl font-extrabold text-amber-950">
            <Pill className="w-8 h-8 shrink-0" aria-hidden />
            {pick(lang, { en: 'Time for your medicine', hi: 'दवा लेने का समय', ta: 'மருந்து சாப்பிடும் நேரம்' })}
          </p>
          <p className="mt-1 text-xl text-amber-950">{due.r.medicine_name} · {label(due.t)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <BigButton onClick={took} busy={busy} small>{pick(lang, { en: 'I took it', hi: 'ले ली', ta: 'சாப்பிட்டேன்' })}</BigButton>
            <BigButton
              variant="secondary" small
              onClick={() => setSnoozed({ ...snoozed, [`${due.r.id}-${due.t}`]: Date.now() + SNOOZE_MIN * 60_000 })}
            >
              {pick(lang, { en: 'Later', hi: 'बाद में', ta: 'பிறகு' })}
            </BigButton>
          </div>
        </div>
      </div>
    );
  }

  if (unread) {
    const ok = async () => { await patientApi.markNotificationsRead().catch(() => {}); await refresh(); };
    return (
      <div className="sticky top-16 z-30 border-b-4 border-teal-700 bg-teal-50 px-4 py-4" role="status">
        <div className="mx-auto max-w-xl">
          <p className="flex items-center gap-3 text-xl font-extrabold text-teal-950">
            <BellRing className="w-8 h-8 shrink-0" aria-hidden />
            {unread.title}
          </p>
          {unread.body && <p className="mt-1 text-lg text-teal-950">{unread.body}</p>}
          <div className="mt-3">
            <BigButton onClick={ok} small>{pick(lang, { en: 'OK', hi: 'ठीक है', ta: 'சரி' })}</BigButton>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
