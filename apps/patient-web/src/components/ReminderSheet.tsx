import React, { useState } from 'react';
import { Language } from '../types';
import { ReminderRow, patientApi } from '../services/patientApi';
import { useAppData } from './AppData';
import { BigButton, Field, Notice, Sheet, inputCls, pick } from './ui';

const PRESETS: { time: string; en: string; hi: string; ta: string }[] = [
  { time: '08:00', en: 'Morning · 8:00 AM', hi: 'सुबह · 8:00', ta: 'காலை · 8:00' },
  { time: '14:00', en: 'Afternoon · 2:00 PM', hi: 'दोपहर · 2:00', ta: 'மதியம் · 2:00' },
  { time: '20:00', en: 'Night · 8:00 PM', hi: 'रात · 8:00', ta: 'இரவு · 8:00' },
];

interface Props {
  lang: Language;
  /** Existing reminder to edit; omit to add a new one. */
  editing?: ReminderRow;
  medicineName?: string;
  onClose: () => void;
}

/** Add or change a medicine reminder: a name and one to three times a day, nothing else. */
export const ReminderSheet: React.FC<Props> = ({ lang, editing, medicineName = '', onClose }) => {
  const { refreshReminders } = useAppData();
  const [name, setName] = useState(editing?.medicine_name ?? medicineName);
  const [times, setTimes] = useState<string[]>(editing?.times ?? ['08:00']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);

  const toggle = (t: string) => setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t].sort()));

  const save = async () => {
    if (!name.trim() || times.length === 0) {
      setError(L({ en: 'Write the medicine name and choose at least one time.', hi: 'दवा का नाम लिखें और कम से कम एक समय चुनें।', ta: 'மருந்தின் பெயரை எழுதி, குறைந்தது ஒரு நேரத்தைத் தேர்ந்தெடுக்கவும்.' }));
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (editing) await patientApi.editReminder(editing.id, { medicine_name: name.trim(), times, active: editing.active });
      else await patientApi.addReminder({ medicine_name: name.trim(), times });
      await refreshReminders();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={editing ? L({ en: 'Change reminder', hi: 'रिमाइंडर बदलें', ta: 'நினைவூட்டலை மாற்று' }) : L({ en: 'Remind me', hi: 'मुझे याद दिलाएँ', ta: 'எனக்கு நினைவூட்டு' })}
      closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Field label={L({ en: 'Medicine name', hi: 'दवा का नाम', ta: 'மருந்தின் பெயர்' })}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        </Field>
        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">{L({ en: 'When do you take it?', hi: 'कब लेते हैं?', ta: 'எப்போது சாப்பிடுவீர்கள்?' })}</p>
          <div className="space-y-3">
            {PRESETS.map((p) => (
              <button
                key={p.time}
                type="button"
                onClick={() => toggle(p.time)}
                aria-pressed={times.includes(p.time)}
                className={`w-full min-h-16 rounded-2xl border-2 px-4 text-left text-xl font-bold ${
                  times.includes(p.time) ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'
                }`}
              >
                {times.includes(p.time) ? '✓ ' : ''}{L(p)}
              </button>
            ))}
          </div>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <BigButton onClick={save} busy={busy}>{L({ en: 'Save reminder', hi: 'रिमाइंडर सहेजें', ta: 'நினைவூட்டலைச் சேமி' })}</BigButton>
      </div>
    </Sheet>
  );
};
