import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Appointment, Hospital, Language } from '../types';
import { api, ApiSlot } from '../services/api';
import { appointmentService, toAppointment } from '../services/appointmentService';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';
import { useAppData } from '../components/AppData';
import { BigButton, Field, Notice, Sheet, Spinner, inputCls, pick } from '../components/ui';

interface BookingModalProps {
  hospital: Hospital;
  currentLang: Language;
  isOnline: boolean;
  onClose: () => void;
  onBookingComplete: (appointment: Appointment) => void;
}

const DAYS_AHEAD = 7;
const ANY_DOCTOR = 0;

// Slots are on Indian time whatever the phone's own clock says.
const TZ = 'Asia/Kolkata';
const isoDay = (offset: number) => new Date(Date.now() + offset * 86_400_000).toLocaleDateString('en-CA', { timeZone: TZ });
const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });

const Choice: React.FC<{ on: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, disabled, onClick, children }) => (
  <button
    type="button" onClick={onClick} disabled={disabled} aria-pressed={on}
    className={`min-h-16 w-full rounded-2xl border-2 px-4 py-2 text-left text-xl font-bold disabled:opacity-40 ${
      on ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'
    }`}
  >
    {on ? '✓ ' : ''}{children}
  </button>
);

export const BookingModal: React.FC<BookingModalProps> = ({ hospital, currentLang, isOnline, onClose, onBookingComplete }) => {
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);
  const settings = storageService.getSettings();
  const { family } = useAppData();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const departments = hospital.departments.length ? hospital.departments : hospitalService.bookingDepartments();
  const [selectedDept, setSelectedDept] = useState<string>(departments[0] || 'General Medicine');
  const [selectedDoctor, setSelectedDoctor] = useState<number>(ANY_DOCTOR);
  const [selectedDate, setSelectedDate] = useState<string>(isoDay(0));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [patientName, setPatientName] = useState<string>(settings.userName || '');
  const [patientPhone, setPatientPhone] = useState<string>(settings.userPhone || '');

  const [slotsByDay, setSlotsByDay] = useState<Record<string, ApiSlot[]> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [created, setCreated] = useState<Appointment | null>(null);

  const bookable = hospital.isPartner !== false;
  // A real hospital from the nearby list books into the one demo hospital's Desk (demo wiring).
  const bookFacilityId = hospital.bookFacilityId ?? Number(hospital.id);

  const loadSlots = async () => {
    setLoadError('');
    setSlotsByDay(null);
    try {
      const days = Array.from({ length: DAYS_AHEAD }, (_, i) => isoDay(i));
      const lists = await Promise.all(days.map((d) => api.slots(bookFacilityId, d)));
      const map = Object.fromEntries(days.map((d, i) => [d, lists[i]]));
      setSlotsByDay(map);
      const firstOpen = days.find((d) => map[d].length > 0);
      if (firstOpen) setSelectedDate(firstOpen);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load open slots.');
    }
  };

  useEffect(() => {
    if (bookable && isOnline) loadSlots();
  }, [hospital.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sameDept = (s: ApiSlot) => s.department.toLowerCase() === selectedDept.toLowerCase();
  const deptSlots = useMemo(
    () => (slotsByDay?.[selectedDate] || []).filter(sameDept),
    [slotsByDay, selectedDate, selectedDept] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const doctors = useMemo(() => {
    const seen = new Map<number, string>();
    Object.values(slotsByDay || {}).flat().filter(sameDept).forEach((s) => seen.set(s.doctor_id, s.doctor_name));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [slotsByDay, selectedDept]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownSlots = deptSlots.filter((s) => selectedDoctor === ANY_DOCTOR || s.doctor_id === selectedDoctor);
  const countForDay = (day: string) =>
    (slotsByDay?.[day] || []).filter((s) => sameDept(s) && (selectedDoctor === ANY_DOCTOR || s.doctor_id === selectedDoctor)).length;

  const confirm = async () => {
    setErrorMsg('');
    if (!patientName.trim()) return setErrorMsg(L({ en: 'Write the patient name.', hi: 'मरीज़ का नाम लिखें।', ta: 'நோயாளியின் பெயரை எழுதுங்கள்.' }));
    if (!patientPhone.trim()) return setErrorMsg(L({ en: 'Write a mobile number.', hi: 'मोबाइल नंबर लिखें।', ta: 'கைபேசி எண்ணை எழுதுங்கள்.' }));
    if (selectedSlot === null) return setErrorMsg(L({ en: 'Choose a time.', hi: 'समय चुनें।', ta: 'நேரத்தைத் தேர்ந்தெடுங்கள்.' }));
    setBusy(true);
    try {
      const res = await api.book({
        patient: {
          name: patientName.trim(),
          phone: patientPhone.trim(),
          language: ['ta', 'hi', 'en'].includes(currentLang) ? currentLang : undefined,
        },
        slot_id: selectedSlot,
        hospital_name: hospital.isDemo ? undefined : hospital.name,
      });
      const appointment = toAppointment(res);
      appointmentService.remember(appointment);
      setCreated(appointment);
      setStep(5);
      speechService.playAudioChime(800, 0.2);
      onBookingComplete(appointment);
    } catch (e: any) {
      if (e?.status === 409) {
        setErrorMsg(L({ en: 'That time was just taken. Please choose another.', hi: 'वह समय अभी भर गया। दूसरा चुनें।', ta: 'அந்த நேரம் இப்போது நிரம்பிவிட்டது. வேறு நேரத்தைத் தேர்ந்தெடுங்கள்.' }));
        setSelectedSlot(null);
        setStep(3);
        loadSlots();
      } else if (e?.status === 422) {
        setErrorMsg(L({ en: 'Write a valid 10 digit mobile number.', hi: '10 अंकों का सही मोबाइल नंबर लिखें।', ta: 'சரியான 10 இலக்க கைபேசி எண்ணை எழுதுங்கள்.' }));
      } else {
        setErrorMsg(e?.message || 'Could not book. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<number, string> = {
    1: L({ en: 'Which clinic?', hi: 'कौन सा विभाग?', ta: 'எந்தப் பிரிவு?' }),
    2: L({ en: 'Which doctor?', hi: 'कौन सा डॉक्टर?', ta: 'எந்த மருத்துவர்?' }),
    3: L({ en: 'Which day and time?', hi: 'कौन सा दिन और समय?', ta: 'எந்த நாள் மற்றும் நேரம்?' }),
    4: L({ en: 'Who is the visit for?', hi: 'मुलाक़ात किसके लिए है?', ta: 'யாருக்கான வருகை?' }),
    5: L({ en: 'Your visit is booked', hi: 'आपकी मुलाक़ात बुक हो गई', ta: 'உங்கள் வருகை பதிவாகிவிட்டது' }),
  };
  const heading = step === 5 ? titles[5] : `${L({ en: 'Step', hi: 'चरण', ta: 'படி' })} ${step}/4 · ${titles[step]}`;
  const canContinue = step === 3 ? selectedSlot !== null : true;
  const hospitalName = hospital.nativeNames[currentLang] || hospital.name;
  const closeLabel = L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' });

  if (!bookable || !isOnline) {
    return (
      <Sheet title={hospitalName} closeLabel={closeLabel} onClose={onClose}>
        <div className="space-y-4">
          <Notice tone="warn">
            {!isOnline
              ? L({ en: 'You are offline. Connect to the internet to book.', hi: 'आप ऑफ़लाइन हैं। बुक करने के लिए इंटरनेट जोड़ें।', ta: 'நீங்கள் இணையம் இல்லாமல் உள்ளீர்கள். பதிவு செய்ய இணையத்தை இணைக்கவும்.' })
              : L({ en: 'Booking is not available here yet. Please call or visit.', hi: 'यहाँ अभी बुकिंग उपलब्ध नहीं है। कृपया कॉल करें या जाएँ।', ta: 'இங்கே இன்னும் பதிவு இல்லை. அழைக்கவும் அல்லது நேரில் செல்லவும்.' })}
          </Notice>
          {hospital.contactPhone && (
            <BigButton href={`tel:${hospital.contactPhone}`} icon={<Phone className="w-7 h-7" />}>{L({ en: 'Call', hi: 'कॉल', ta: 'அழை' })}</BigButton>
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={step === 5 ? titles[5] : hospitalName} closeLabel={closeLabel} onClose={onClose}>
      {step < 5 && <p className="mb-4 text-xl font-bold text-teal-900">{heading}</p>}

      {loadError && (
        <div className="mb-4 space-y-3">
          <Notice tone="error">{loadError}</Notice>
          <BigButton variant="secondary" small onClick={loadSlots}>{L({ en: 'Try again', hi: 'फिर कोशिश करें', ta: 'மீண்டும் முயற்சி' })}</BigButton>
        </div>
      )}
      {!loadError && slotsByDay === null && step < 5 && <Spinner label={L({ en: 'Loading free times…', hi: 'खाली समय देख रहे हैं…', ta: 'காலி நேரங்களைப் பார்க்கிறோம்…' })} />}

      {slotsByDay !== null && step === 1 && (
        <div className="space-y-3">
          {departments.map((d) => (
            <Choice key={d} on={selectedDept === d} onClick={() => { setSelectedDept(d); setSelectedDoctor(ANY_DOCTOR); setSelectedSlot(null); }}>{d}</Choice>
          ))}
        </div>
      )}

      {slotsByDay !== null && step === 2 && (
        <div className="space-y-3">
          <Choice on={selectedDoctor === ANY_DOCTOR} onClick={() => { setSelectedDoctor(ANY_DOCTOR); setSelectedSlot(null); }}>
            {L({ en: 'Any doctor', hi: 'कोई भी डॉक्टर', ta: 'எந்த மருத்துவரும்' })}
          </Choice>
          {doctors.map((d) => (
            <Choice key={d.id} on={selectedDoctor === d.id} onClick={() => { setSelectedDoctor(d.id); setSelectedSlot(null); }}>{d.name}</Choice>
          ))}
        </div>
      )}

      {slotsByDay !== null && step === 3 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: DAYS_AHEAD }, (_, i) => isoDay(i)).map((day) => {
              const n = countForDay(day);
              return (
                <button
                  key={day} disabled={n === 0}
                  onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                  aria-pressed={selectedDate === day}
                  className={`min-h-16 rounded-2xl border-2 px-2 text-lg font-bold disabled:opacity-40 ${
                    selectedDate === day ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'
                  }`}
                >
                  <span className="block">{dayLabel(day)}</span>
                  <span className="block text-base font-semibold">{n === 0 ? L({ en: 'Full', hi: 'भरा', ta: 'நிரம்பியது' }) : L({ en: `${n} free`, hi: `${n} खाली`, ta: `${n} காலி` })}</span>
                </button>
              );
            })}
          </div>
          {shownSlots.length === 0 ? (
            <Notice tone="info">{L({ en: 'No free times on this day. Try another day or doctor.', hi: 'इस दिन कोई खाली समय नहीं। दूसरा दिन या डॉक्टर चुनें।', ta: 'இந்த நாளில் காலி நேரம் இல்லை. வேறு நாள் அல்லது மருத்துவரைத் தேர்ந்தெடுங்கள்.' })}</Notice>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shownSlots.map((s) => (
                <button
                  key={s.slot_id} onClick={() => setSelectedSlot(s.slot_id)} aria-pressed={selectedSlot === s.slot_id}
                  className={`min-h-16 rounded-2xl border-2 text-xl font-bold ${
                    selectedSlot === s.slot_id ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'
                  }`}
                >
                  {timeLabel(s.start)}
                </button>
              ))}
            </div>
          )}
          {selectedSlot !== null && (
            <p className="text-lg font-semibold text-teal-900">{deptSlots.find((s) => s.slot_id === selectedSlot)?.doctor_name}</p>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Choice on={patientName === (settings.userName || '')} onClick={() => setPatientName(settings.userName || '')}>
              {L({ en: 'Myself', hi: 'मेरे लिए', ta: 'எனக்கு' })}
            </Choice>
            {family.map((f) => (
              <Choice key={f.id} on={patientName === f.name} onClick={() => setPatientName(f.name)}>{f.name}</Choice>
            ))}
          </div>
          <Field label={L({ en: 'Patient name', hi: 'मरीज़ का नाम', ta: 'நோயாளியின் பெயர்' })}>
            <input className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} maxLength={200} />
          </Field>
          <Field
            label={L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்' })}
            hint={L({ en: 'Used only for this booking.', hi: 'केवल इस बुकिंग के लिए।', ta: 'இந்தப் பதிவிற்கு மட்டும்.' })}
          >
            <input className={inputCls} value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} inputMode="numeric" maxLength={15} />
          </Field>
        </div>
      )}

      {step === 5 && created && (
        <div className="space-y-4">
          <Notice tone="success">
            {L({ en: 'Show this at the hospital counter.', hi: 'अस्पताल के काउंटर पर यह दिखाएँ।', ta: 'மருத்துவமனை கவுண்டரில் இதைக் காட்டுங்கள்.' })}
          </Notice>
          <div className="rounded-3xl border-2 border-slate-300 p-5">
            <p className="text-2xl font-extrabold text-slate-900">{created.hospitalName}</p>
            <p className="mt-1 text-xl text-slate-800">{created.department}{created.doctorName ? ` · ${created.doctorName}` : ''}</p>
            <p className="mt-3 text-2xl font-extrabold text-teal-900">{dayLabel(created.date)} · {created.timeSlot}</p>
            <p className="mt-3 text-lg text-slate-700">{L({ en: 'Booking number', hi: 'बुकिंग नंबर', ta: 'பதிவு எண்' })}: <strong>{created.referenceCode}</strong></p>
          </div>
          <BigButton onClick={onClose} icon={<CheckCircle2 className="w-7 h-7" />}>{L({ en: 'Done', hi: 'ठीक है', ta: 'சரி' })}</BigButton>
        </div>
      )}

      {errorMsg && <div className="mt-4"><Notice tone="error">{errorMsg}</Notice></div>}

      {step < 5 && (
        <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 bg-white pb-1 pt-3">
          {step > 1 ? (
            <BigButton variant="secondary" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}>{L({ en: 'Back', hi: 'वापस', ta: 'பின்னே' })}</BigButton>
          ) : <span />}
          {step < 4 ? (
            <BigButton disabled={!canContinue || slotsByDay === null} onClick={() => setStep((step + 1) as 2 | 3 | 4)}>{L({ en: 'Next', hi: 'आगे', ta: 'அடுத்து' })}</BigButton>
          ) : (
            <BigButton busy={busy} onClick={confirm}>{L({ en: 'Book', hi: 'बुक करें', ta: 'பதிவு செய்' })}</BigButton>
          )}
        </div>
      )}
    </Sheet>
  );
};
