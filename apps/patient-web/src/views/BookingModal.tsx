import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { Appointment, Hospital, Language } from '../types';
import { api, ApiSlot } from '../services/api';
import { appointmentService, toAppointment } from '../services/appointmentService';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';
import { useAppData } from '../components/AppData';
import { BigButton, Field, Notice, Sheet, Spinner, departmentLabel, inputCls, pick } from '../components/ui';

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
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(currentLang, o);
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
    if (!patientName.trim()) return setErrorMsg(L({ en: 'Write the patient name.', hi: 'मरीज़ का नाम लिखें।', ta: 'நோயாளியின் பெயரை எழுதுங்கள்.', kn: 'ರೋಗಿಯ ಹೆಸರನ್ನು ಬರೆಯಿರಿ.', ml: 'രോഗിയുടെ പേര് എഴുതുക.', te: 'రోగి పేరు రాయండి.' }));
    if (!patientPhone.trim()) return setErrorMsg(L({ en: 'Write a mobile number.', hi: 'मोबाइल नंबर लिखें।', ta: 'கைபேசி எண்ணை எழுதுங்கள்.', kn: 'ಮೊಬೈಲ್ ನಂಬರ್ ಬರೆಯಿರಿ.', ml: 'മൊബൈൽ നമ്പർ എഴുതുക.', te: 'మొబైల్ నంబర్ రాయండి.' }));
    if (selectedSlot === null) return setErrorMsg(L({ en: 'Choose a time.', hi: 'समय चुनें।', ta: 'நேரத்தைத் தேர்ந்தெடுங்கள்.', kn: 'ಸಮಯವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.', ml: 'സമയം തിരഞ്ഞെടുക്കുക.', te: 'సమయాన్ని ఎంచుకోండి.' }));
    setBusy(true);
    try {
      const res = await api.book({
        patient: {
          name: patientName.trim(),
          phone: patientPhone.trim(),
          language: ['ta', 'hi', 'en', 'kn', 'ml', 'te'].includes(currentLang) ? currentLang : undefined,
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
        setErrorMsg(L({ en: 'That time was just taken. Please choose another.', hi: 'वह समय अभी भर गया। दूसरा चुनें।', ta: 'அந்த நேரம் இப்போது நிரம்பிவிட்டது. வேறு நேரத்தைத் தேர்ந்தெடுங்கள்.', kn: 'ಆ ಸಮಯ ಈಗಷ್ಟೇ ತುಂಬಿದೆ. ಬೇರೆ ಸಮಯ ಆಯ್ಕೆ ಮಾಡಿ.', ml: 'ആ സമയം ഇപ്പോൾ നിറഞ്ഞു. മറ്റൊരു സമയം തിരഞ്ഞെടുക്കുക.', te: 'ఆ సమయం ఇప్పుడే బుక్ అయింది. దయచేసి మరొకటి ఎంచుకోండి.' }));
        setSelectedSlot(null);
        setStep(3);
        loadSlots();
      } else if (e?.status === 422) {
        setErrorMsg(L({ en: 'Write a valid 10 digit mobile number.', hi: '10 अंकों का सही मोबाइल नंबर लिखें।', ta: 'சரியான 10 இலக்க கைபேசி எண்ணை எழுதுங்கள்.', kn: 'ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ಬರೆಯಿರಿ.', ml: 'ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ എഴുതുക.', te: 'సరైన 10 అంకెల మొబైల్ నంబర్‌ను రాయండి.' }));
      } else {
        setErrorMsg(e?.message || 'Could not book. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<number, string> = {
    1: L({ en: 'Which clinic?', hi: 'कौन सा विभाग?', ta: 'எந்தப் பிரிவு?', kn: 'ಯಾವ ವಿಭಾಗ?', ml: 'ഏത് വിഭാഗം?', te: 'ఏ విభాగం?' }),
    2: L({ en: 'Which doctor?', hi: 'कौन सा डॉक्टर?', ta: 'எந்த மருத்துவர்?', kn: 'ಯಾವ ವೈದ್ಯರು?', ml: 'ഏത് ഡോക്ടർ?', te: 'ఏ డాక్టర్?' }),
    3: L({ en: 'Which day and time?', hi: 'कौन सा दिन और समय?', ta: 'எந்த நாள் மற்றும் நேரம்?', kn: 'ಯಾವ ದಿನ ಮತ್ತು ಸಮಯ?', ml: 'ഏത് ദിവസവും സമയവും?', te: 'ఏ రోజు మరియు సమయం?' }),
    4: L({ en: 'Who is the visit for?', hi: 'मुलाक़ात किसके लिए है?', ta: 'யாருக்கான வருகை?', kn: 'ಯಾರಿಗಾಗಿ ಭೇಟಿ?', ml: 'ആർക്കുവേണ്ടിയാണ് സന്ദർശനം?', te: 'సందర్శన ఎవరి కోసం?' }),
    5: L({ en: 'Your visit is booked', hi: 'आपकी मुलाक़ात बुक हो गई', ta: 'உங்கள் வருகை பதிவாகிவிட்டது', kn: 'ನಿಮ್ಮ ಭೇಟಿ ಬುಕ್ ಆಗಿದೆ', ml: 'നിങ്ങളുടെ സന്ദർശനം ബുക്ക് ചെയ്തു', te: 'మీ సందర్శన బుక్ చేయబడింది' }),
  };
  const heading = step === 5 ? titles[5] : `${L({ en: 'Step', hi: 'चरण', ta: 'படி', kn: 'ಹಂತ', ml: 'ഘട്ടം', te: 'దశ' })} ${step}/4 · ${titles[step]}`;
  const canContinue = step === 3 ? selectedSlot !== null : true;
  const hospitalName = hospital.nativeNames[currentLang] || hospital.name;
  const closeLabel = L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' });

  if (!bookable || !isOnline) {
    return (
      <Sheet title={hospitalName} closeLabel={closeLabel} onClose={onClose}>
        <div className="space-y-4">
          <Notice tone="warn">
            {!isOnline
              ? L({ en: 'You are offline. Connect to the internet to book.', hi: 'आप ऑफ़लाइन हैं। बुक करने के लिए इंटरनेट जोड़ें।', ta: 'நீங்கள் இணையம் இல்லாமல் உள்ளீர்கள். பதிவு செய்ய இணையத்தை இணைக்கவும்.', kn: 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಇದ್ದೀರಿ. ಬುಕ್ ಮಾಡಲು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕಿಸಿ.', ml: 'നിങ്ങൾ ഓഫ്‌ലൈനിലാണ്. ബുക്ക് ചെയ്യാൻ ഇന്റർനെറ്റ് ബന്ധിപ്പിക്കുക.', te: 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. బుక్ చేయడానికి ఇంటర్నెట్‌కు కనెక్ట్ అవ్వండి.' })
              : L({ en: 'Booking is not available here yet. Please call or visit.', hi: 'यहाँ अभी बुकिंग उपलब्ध नहीं है। कृपया कॉल करें या जाएँ।', ta: 'இங்கே இன்னும் பதிவு இல்லை. அழைக்கவும் அல்லது நேரில் செல்லவும்.', kn: 'ಇಲ್ಲಿ ಇನ್ನೂ ಬುಕಿಂಗ್ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಕರೆ ಮಾಡಿ ಅಥವಾ ನೇರವಾಗಿ ಹೋಗಿ.', ml: 'ഇവിടെ ഇതുവരെ ബുക്കിംഗ് ഇല്ല. ദയവായി വിളിക്കുക അല്ലെങ്കിൽ നേരിട്ട് പോകുക.', te: 'ఇక్కడ బుకింగ్ ఇంకా అందుబాటులో లేదు. దయచేసి కాల్ చేయండి లేదా సందర్శించండి.' })}
          </Notice>
          {hospital.contactPhone && (
            <BigButton href={`tel:${hospital.contactPhone}`} icon={<Phone className="w-7 h-7" />}>{L({ en: 'Call', hi: 'कॉल', ta: 'அழை', kn: 'ಕರೆ', ml: 'വിളിക്കുക', te: 'కాల్ చేయండి' })}</BigButton>
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
          <BigButton variant="secondary" small onClick={loadSlots}>{L({ en: 'Try again', hi: 'फिर कोशिश करें', ta: 'மீண்டும் முயற்சி', kn: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', ml: 'വീണ്ടും ശ്രമിക്കുക', te: 'మళ్లీ ప్రయత్నించండి' })}</BigButton>
        </div>
      )}
      {!loadError && slotsByDay === null && step < 5 && <Spinner label={L({ en: 'Loading free times…', hi: 'खाली समय देख रहे हैं…', ta: 'காலி நேரங்களைப் பார்க்கிறோம்…', kn: 'ಖಾಲಿ ಸಮಯಗಳನ್ನು ನೋಡುತ್ತಿದ್ದೇವೆ…', ml: 'ഒഴിവുള്ള സമയങ്ങൾ നോക്കുന്നു…', te: 'ఖాళీ సమయాలను లోడ్ చేస్తున్నాము…' })} />}

      {slotsByDay !== null && step === 1 && (
        <div className="space-y-3">
          {departments.map((d) => (
            <Choice key={d} on={selectedDept === d} onClick={() => { setSelectedDept(d); setSelectedDoctor(ANY_DOCTOR); setSelectedSlot(null); }}>{departmentLabel(currentLang, d)}</Choice>
          ))}
        </div>
      )}

      {slotsByDay !== null && step === 2 && (
        <div className="space-y-3">
          <Choice on={selectedDoctor === ANY_DOCTOR} onClick={() => { setSelectedDoctor(ANY_DOCTOR); setSelectedSlot(null); }}>
            {L({ en: 'Any doctor', hi: 'कोई भी डॉक्टर', ta: 'எந்த மருத்துவரும்', kn: 'ಯಾವ ವೈದ್ಯರಾದರೂ ಸರಿ', ml: 'ഏത് ഡോക്ടറും മതി', te: 'ఎవరైనా డాక్టర్' })}
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
                  <span className="block text-base font-semibold">{n === 0 ? L({ en: 'Full', hi: 'भरा', ta: 'நிரம்பியது', kn: 'ತುಂಬಿದೆ', ml: 'നിറഞ്ഞു', te: 'పూర్తయింది' }) : L({ en: `${n} free`, hi: `${n} खाली`, ta: `${n} காலி`, kn: `${n} ಖಾಲಿ`, ml: `${n} ഒഴിവ്`, te: `${n} ఖాళీగా ఉన్నాయి` })}</span>
                </button>
              );
            })}
          </div>
          {shownSlots.length === 0 ? (
            <Notice tone="info">{L({ en: 'No free times on this day. Try another day or doctor.', hi: 'इस दिन कोई खाली समय नहीं। दूसरा दिन या डॉक्टर चुनें।', ta: 'இந்த நாளில் காலி நேரம் இல்லை. வேறு நாள் அல்லது மருத்துவரைத் தேர்ந்தெடுங்கள்.', kn: 'ಈ ದಿನ ಖಾಲಿ ಸಮಯ ಇಲ್ಲ. ಬೇರೆ ದಿನ ಅಥವಾ ವೈದ್ಯರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.', ml: 'ഈ ദിവസം ഒഴിവുള്ള സമയമില്ല. മറ്റൊരു ദിവസമോ ഡോക്ടറെയോ തിരഞ്ഞെടുക്കുക.', te: 'ఈ రోజు ఖాళీ సమయాలు లేవు. మరొక రోజు లేదా డాక్టర్‌ను ఎంచుకోండి.' })}</Notice>
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
              {L({ en: 'Myself', hi: 'मेरे लिए', ta: 'எனக்கு', kn: 'ನನಗಾಗಿ', ml: 'എനിക്ക്', te: 'నా కోసం' })}
            </Choice>
            {family.map((f) => (
              <Choice key={f.id} on={patientName === f.name} onClick={() => setPatientName(f.name)}>{f.name}</Choice>
            ))}
          </div>
          <Field label={L({ en: 'Patient name', hi: 'मरीज़ का नाम', ta: 'நோயாளியின் பெயர்', kn: 'ರೋಗಿಯ ಹೆಸರು', ml: 'രോഗിയുടെ പേര്', te: 'రోగి పేరు' })}>
            <input className={inputCls} value={patientName} onChange={(e) => setPatientName(e.target.value)} maxLength={200} />
          </Field>
          <Field
            label={L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்', kn: 'ಮೊಬೈಲ್ ನಂಬರ್', ml: 'മൊബൈൽ നമ്പർ', te: 'మొబైల్ నంబర్' })}
            hint={L({ en: 'Used only for this booking.', hi: 'केवल इस बुकिंग के लिए।', ta: 'இந்தப் பதிவிற்கு மட்டும்.', kn: 'ಈ ಬುಕಿಂಗ್‌ಗೆ ಮಾತ್ರ.', ml: 'ഈ ബുക്കിംഗിന് മാത്രം.', te: 'ఈ బుకింగ్ కోసం మాత్రమే ఉపయోగించబడుతుంది.' })}
          >
            <input className={inputCls} value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} inputMode="numeric" maxLength={15} />
          </Field>
        </div>
      )}

      {step === 5 && created && (
        <div className="space-y-4">
          <Notice tone="success">
            {L({ en: 'Show this at the hospital counter.', hi: 'अस्पताल के काउंटर पर यह दिखाएँ।', ta: 'மருத்துவமனை கவுண்டரில் இதைக் காட்டுங்கள்.', kn: 'ಆಸ್ಪತ್ರೆಯ ಕೌಂಟರ್‌ನಲ್ಲಿ ಇದನ್ನು ತೋರಿಸಿ.', ml: 'ആശുപത്രി കൗണ്ടറിൽ ഇത് കാണിക്കുക.', te: 'ఆసుపత్రి కౌంటర్ వద్ద దీన్ని చూపించండి.' })}
          </Notice>
          <div className="rounded-3xl border-2 border-slate-300 p-5">
            <p className="text-2xl font-extrabold text-slate-900">{created.hospitalName}</p>
            <p className="mt-1 text-xl text-slate-800">{departmentLabel(currentLang, created.department)}{created.doctorName ? ` · ${created.doctorName}` : ''}</p>
            <p className="mt-3 text-2xl font-extrabold text-teal-900">{dayLabel(created.date)} · {created.timeSlot}</p>
            <p className="mt-3 text-lg text-slate-700">{L({ en: 'Booking number', hi: 'बुकिंग नंबर', ta: 'பதிவு எண்', kn: 'ಬುಕಿಂಗ್ ನಂಬರ್', ml: 'ബുക്കിംഗ് നമ്പർ', te: 'బుకింగ్ సంఖ్య' })}: <strong>{created.referenceCode}</strong></p>
          </div>
          <BigButton onClick={onClose} icon={<CheckCircle2 className="w-7 h-7" />}>{L({ en: 'Done', hi: 'ठीक है', ta: 'சரி', kn: 'ಸರಿ', ml: 'ശരി', te: 'పూర్తయింది' })}</BigButton>
        </div>
      )}

      {errorMsg && <div className="mt-4"><Notice tone="error">{errorMsg}</Notice></div>}

      {step < 5 && (
        <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-3 bg-white pb-1 pt-3">
          {step > 1 ? (
            <BigButton variant="secondary" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}>{L({ en: 'Back', hi: 'वापस', ta: 'பின்னே', kn: 'ಹಿಂದೆ', ml: 'തിരികെ', te: 'వెనుకకు' })}</BigButton>
          ) : <span />}
          {step < 4 ? (
            <BigButton disabled={!canContinue || slotsByDay === null} onClick={() => setStep((step + 1) as 2 | 3 | 4)}>{L({ en: 'Next', hi: 'आगे', ta: 'அடுத்து', kn: 'ಮುಂದೆ', ml: 'അടുത്തത്', te: 'తరువాత' })}</BigButton>
          ) : (
            <BigButton busy={busy} onClick={confirm}>{L({ en: 'Book', hi: 'बुक करें', ta: 'பதிவு செய்', kn: 'ಬುಕ್ ಮಾಡಿ', ml: 'ബുക്ക് ചെയ്യുക', te: 'బుక్ చేయండి' })}</BigButton>
          )}
        </div>
      )}
    </Sheet>
  );
};
