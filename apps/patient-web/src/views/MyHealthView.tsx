import React, { useState } from 'react';
import { ArrowLeft, BellPlus, CalendarCheck, CalendarPlus, HeartHandshake, Pencil, Pill, Settings, Trash2, UserPlus, Users } from 'lucide-react';
import { Appointment, Language, UserSettings } from '../types';
import { appointmentService } from '../services/appointmentService';
import { FamilyMemberRow, ReminderRow, patientApi } from '../services/patientApi';
import { useAppData } from '../components/AppData';
import { ReminderSheet } from '../components/ReminderSheet';
import { DetailsSheet, FamilySheet, PaySheet, relationLabel } from '../components/MyHealthSheets';
import { BigButton, Card, Notice, SectionTitle, Sheet, Title, pick } from '../components/ui';
import type { NavTab } from '../components/BottomNav';

interface MyHealthViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenLocationSelector: () => void;
}

type Section = null | 'visits' | 'medicines' | 'family' | 'care' | 'more';

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const clock = (hhmm: string) => `${Number(hhmm.slice(0, 2)) % 12 || 12}:${hhmm.slice(3)} ${Number(hhmm.slice(0, 2)) < 12 ? 'AM' : 'PM'}`;

export const MyHealthView: React.FC<MyHealthViewProps> = ({ currentLang, userSettings, onUpdateSettings, onNavigate, onOpenLocationSelector }) => {
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);
  const { care, appointments, reminders, family, refresh, refreshAppointments, refreshReminders, refreshFamily } = useAppData();
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reminderSheet, setReminderSheet] = useState<{ editing?: ReminderRow } | null>(null);
  const [familySheet, setFamilySheet] = useState<{ member?: FamilyMemberRow } | null>(null);
  const [paySheet, setPaySheet] = useState<{ phone?: string; name?: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [section, setSection] = useState<Section>(null);
  const [parents, setParents] = useState<Awaited<ReturnType<typeof patientApi.parents>>>([]);

  React.useEffect(() => { window.scrollTo(0, 0); }, [section]);

  React.useEffect(() => {
    refreshAppointments();
    if ((care?.paying_for.length ?? 0) > 0) patientApi.parents().then(setParents).catch(() => {});
    else setParents([]);
  }, [care?.paying_for.length, refreshAppointments]);

  const upcoming = appointments.filter((a) => a.status === 'booked' && a.date >= todayIso()).sort((a, b) => a.date.localeCompare(b.date));
  const earlier = appointments.filter((a) => !upcoming.includes(a));
  const [showEarlier, setShowEarlier] = useState(false);

  const dateLabel = (iso: string) =>
    new Date(`${iso}T00:00:00+05:30`).toLocaleDateString(currentLang === 'ta' ? 'ta-IN' : currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  const statusWord = (s: Appointment['status']) =>
    ({
      booked: L({ en: 'Booked', hi: 'बुक है', ta: 'பதிவாகியுள்ளது' }),
      arrived: L({ en: 'Visited', hi: 'आ चुके', ta: 'வந்தீர்கள்' }),
      completed: L({ en: 'Visited', hi: 'आ चुके', ta: 'வந்தீர்கள்' }),
      cancelled: L({ en: 'Cancelled', hi: 'रद्द', ta: 'ரத்து செய்யப்பட்டது' }),
      no_show: L({ en: 'Missed', hi: 'छूट गया', ta: 'தவறியது' }),
    })[s];

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    setError('');
    try {
      await appointmentService.cancel(cancelling.id);
      await refreshAppointments();
      setCancelling(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel');
    } finally {
      setBusy(false);
    }
  };

  const removeReminder = async (id: number) => { await patientApi.deleteReminder(id).catch(() => {}); await refreshReminders(); };
  const removeFamily = async (id: number) => { await patientApi.deleteFamily(id).catch(() => {}); await refreshFamily(); };
  const stopPlan = async (id: number) => { await patientApi.stopCarePlan(id).catch(() => {}); await refresh(); };
  const markTaken = async (id: number, t: string) => { await patientApi.markTaken(id, t).catch(() => {}); await refreshReminders(); };

  const nameFor = (phone: string, given: string | null) =>
    given || family.find((f) => f.phone === phone)?.name || L({ en: 'Your family member', hi: 'आपके परिवार का सदस्य', ta: 'உங்கள் குடும்ப உறுப்பினர்' });

  const apptCard = (a: Appointment, canCancel: boolean) => (
    <Card key={a.id}>
      <p className="text-xl font-extrabold text-slate-900">{dateLabel(a.date)}</p>
      <p className="text-2xl font-extrabold text-teal-900">{a.timeSlot}</p>
      <p className="mt-1 text-xl text-slate-900">{a.hospitalName}</p>
      {a.department && <p className="text-lg text-slate-700">{a.department}{a.doctorName ? ` · ${a.doctorName}` : ''}</p>}
      <p className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-lg font-bold text-slate-800">{statusWord(a.status)}</p>
      {canCancel && (
        <div className="mt-3">
          <BigButton variant="secondary" small onClick={() => setCancelling(a)}>{L({ en: 'Cancel this visit', hi: 'यह मुलाक़ात रद्द करें', ta: 'இந்த வருகையை ரத்து செய்' })}</BigButton>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      {section === null && (
        <>
      <Title sub={userSettings.userPhone}>
        {userSettings.userName
          ? L({ en: `Hello, ${userSettings.userName}`, hi: `नमस्ते, ${userSettings.userName}`, ta: `வணக்கம், ${userSettings.userName}` })
          : L({ en: 'My Health', hi: 'मेरा स्वास्थ्य', ta: 'என் ஆரோக்கியம்' })}
      </Title>

      {care?.monitored_by && (
        <Card tone="teal" className="mb-4">
          <p className="flex items-center gap-3 text-xl font-extrabold text-teal-950">
            <HeartHandshake className="w-8 h-8 shrink-0" aria-hidden />
            {L({
              en: `${nameFor(care.monitored_by.payer_phone, care.monitored_by.payer_name)} is looking after your health`,
              hi: `${nameFor(care.monitored_by.payer_phone, care.monitored_by.payer_name)} आपके स्वास्थ्य का ध्यान रख रहे हैं`,
              ta: `${nameFor(care.monitored_by.payer_phone, care.monitored_by.payer_name)} உங்கள் ஆரோக்கியத்தைக் கவனித்துக் கொள்கிறார்`,
            })}
          </p>
          <p className="mt-2 text-lg text-teal-950">
            {L({
              en: 'They can see your medicine reminders and your appointments. You have the Care plan.',
              hi: 'वे आपके दवा रिमाइंडर और अपॉइंटमेंट देख सकते हैं। आपके पास केयर प्लान है।',
              ta: 'அவர் உங்கள் மருந்து நினைவூட்டல்கள் மற்றும் முன்பதிவுகளைப் பார்க்கலாம். உங்களிடம் கேர் திட்டம் உள்ளது.',
            })}
          </p>
        </Card>
      )}
        </>
      )}

      {section === null && (
        <div className="space-y-3">
          {[
            { key: 'visits', Icon: CalendarCheck, label: L({ en: 'My visits', hi: 'मेरी मुलाक़ातें', ta: 'என் வருகைகள்' }), note: upcoming.length ? L({ en: `${upcoming.length} booked`, hi: `${upcoming.length} बुक`, ta: `${upcoming.length} பதிவு` }) : '' },
            { key: 'medicines', Icon: Pill, label: L({ en: 'My medicines', hi: 'मेरी दवाएँ', ta: 'என் மருந்துகள்' }), note: reminders.length ? L({ en: `${reminders.length} reminders`, hi: `${reminders.length} रिमाइंडर`, ta: `${reminders.length} நினைவூட்டல்` }) : '' },
            { key: 'family', Icon: Users, label: L({ en: 'My family', hi: 'मेरा परिवार', ta: 'என் குடும்பம்' }), note: family.length ? String(family.length) : '' },
            { key: 'care', Icon: HeartHandshake, label: L({ en: 'Care plan', hi: 'केयर प्लान', ta: 'கேர் திட்டம்' }), note: care?.is_pro ? L({ en: 'Active', hi: 'चालू', ta: 'செயலில்' }) : '' },
            { key: 'more', Icon: Settings, label: L({ en: 'My details and more', hi: 'मेरी जानकारी और अन्य', ta: 'என் விவரங்கள் மற்றும் பல' }), note: '' },
          ].map(({ key, Icon, label, note }) => (
            <button
              key={key}
              onClick={() => setSection(key as Section)}
              className="flex min-h-20 w-full items-center gap-4 rounded-3xl border-2 border-slate-300 bg-white px-5 py-3 text-left active:bg-teal-50"
            >
              <Icon className="h-9 w-9 shrink-0 text-teal-800" aria-hidden />
              <span className="flex-1 text-2xl font-extrabold text-slate-900">{label}</span>
              {note && <span className="rounded-full bg-teal-100 px-3 py-1 text-lg font-bold text-teal-950">{note}</span>}
            </button>
          ))}
        </div>
      )}

      {section !== null && (
        <div className="mb-2">
          <BigButton variant="secondary" small onClick={() => setSection(null)} icon={<ArrowLeft className="w-6 h-6" />}>
            {L({ en: 'Back', hi: 'वापस', ta: 'பின்னே' })}
          </BigButton>
        </div>
      )}

      {section === 'visits' && (
        <>
      <SectionTitle>{L({ en: 'My visits', hi: 'मेरी मुलाक़ातें', ta: 'என் வருகைகள்' })}</SectionTitle>
      <div className="space-y-4">
        {upcoming.length === 0 && (
          <Card>
            <p className="text-xl text-slate-900">{L({ en: 'You have no visit booked.', hi: 'कोई मुलाक़ात बुक नहीं है।', ta: 'முன்பதிவு எதுவும் இல்லை.' })}</p>
            <div className="mt-3">
              <BigButton onClick={() => onNavigate('hospitals')} icon={<CalendarPlus className="w-7 h-7" />}>{L({ en: 'Find a hospital', hi: 'अस्पताल खोजें', ta: 'மருத்துவமனையைத் தேடு' })}</BigButton>
            </div>
          </Card>
        )}
        {upcoming.map((a) => apptCard(a, true))}
        {earlier.length > 0 && (
          <>
            <BigButton variant="quiet" onClick={() => setShowEarlier(!showEarlier)}>
              {showEarlier ? L({ en: 'Hide earlier visits', hi: 'पुरानी मुलाक़ातें छिपाएँ', ta: 'பழைய வருகைகளை மறை' }) : L({ en: `Show earlier visits (${earlier.length})`, hi: `पुरानी मुलाक़ातें देखें (${earlier.length})`, ta: `பழைய வருகைகளைக் காட்டு (${earlier.length})` })}
            </BigButton>
            {showEarlier && earlier.map((a) => apptCard(a, false))}
          </>
        )}
      </div>
        </>
      )}

      {section === 'medicines' && (
        <>
      <SectionTitle>{L({ en: 'My medicines', hi: 'मेरी दवाएँ', ta: 'என் மருந்துகள்' })}</SectionTitle>
      <div className="space-y-4">
        {reminders.length === 0 && (
          <Card><p className="text-xl text-slate-900">{L({ en: 'No medicine reminders yet.', hi: 'अभी कोई दवा रिमाइंडर नहीं है।', ta: 'மருந்து நினைவூட்டல்கள் இல்லை.' })}</p></Card>
        )}
        {reminders.map((r) => (
          <Card key={r.id}>
            <p className="flex items-center gap-2 text-2xl font-extrabold text-slate-900"><Pill className="w-7 h-7 shrink-0" aria-hidden />{r.medicine_name}</p>
            <ul className="mt-3 space-y-2">
              {r.times.map((t) => {
                const taken = r.taken_today.includes(t);
                return (
                  <li key={t} className="flex items-center justify-between gap-3">
                    <span className="text-xl font-bold text-slate-900">{clock(t)}</span>
                    {taken ? (
                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-lg font-bold text-emerald-900">✓ {L({ en: 'Taken', hi: 'ले ली', ta: 'சாப்பிட்டேன்' })}</span>
                    ) : (
                      <button onClick={() => markTaken(r.id, t)} className="min-h-14 rounded-2xl border-2 border-teal-800 px-5 text-lg font-bold text-teal-900 active:bg-teal-50">
                        {L({ en: 'I took it', hi: 'ले ली', ta: 'சாப்பிட்டேன்' })}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <BigButton variant="secondary" small icon={<Pencil className="w-5 h-5" />} onClick={() => setReminderSheet({ editing: r })}>{L({ en: 'Change', hi: 'बदलें', ta: 'மாற்று' })}</BigButton>
              <BigButton variant="secondary" small icon={<Trash2 className="w-5 h-5" />} onClick={() => removeReminder(r.id)}>{L({ en: 'Remove', hi: 'हटाएँ', ta: 'நீக்கு' })}</BigButton>
            </div>
          </Card>
        ))}
        <BigButton onClick={() => setReminderSheet({})} icon={<BellPlus className="w-7 h-7" />}>{L({ en: 'Add a medicine reminder', hi: 'दवा रिमाइंडर जोड़ें', ta: 'மருந்து நினைவூட்டலைச் சேர்' })}</BigButton>
      </div>
        </>
      )}

      {section === 'family' && (
        <>
      <SectionTitle>{L({ en: 'My family', hi: 'मेरा परिवार', ta: 'என் குடும்பம்' })}</SectionTitle>
      <div className="space-y-4">
        {family.map((m) => (
          <Card key={m.id}>
            <p className="text-2xl font-extrabold text-slate-900">{m.name}</p>
            <p className="text-lg text-slate-700">{[relationLabel(currentLang, m.relation), m.phone].filter(Boolean).join(' · ')}</p>
            <div className="mt-3 space-y-3">
              {m.phone && (
                <BigButton small icon={<HeartHandshake className="w-6 h-6" />} onClick={() => setPaySheet({ phone: m.phone ?? undefined, name: m.name })}>
                  {L({ en: 'Care plan for them', hi: 'उनके लिए केयर प्लान', ta: 'அவர்களுக்கு கேர் திட்டம்' })}
                </BigButton>
              )}
              <div className="grid grid-cols-2 gap-3">
                <BigButton variant="secondary" small icon={<Pencil className="w-5 h-5" />} onClick={() => setFamilySheet({ member: m })}>{L({ en: 'Change', hi: 'बदलें', ta: 'மாற்று' })}</BigButton>
                <BigButton variant="secondary" small icon={<Trash2 className="w-5 h-5" />} onClick={() => removeFamily(m.id)}>{L({ en: 'Remove', hi: 'हटाएँ', ta: 'நீக்கு' })}</BigButton>
              </div>
            </div>
          </Card>
        ))}
        <BigButton variant="secondary" onClick={() => setFamilySheet({})} icon={<UserPlus className="w-7 h-7" />}>{L({ en: 'Add family member', hi: 'परिवार का सदस्य जोड़ें', ta: 'குடும்ப உறுப்பினரைச் சேர்' })}</BigButton>
      </div>
        </>
      )}

      {section === 'care' && (
        <>
      <SectionTitle>{L({ en: 'Care plan', hi: 'केयर प्लान', ta: 'கேர் திட்டம்' })}</SectionTitle>
      <div className="space-y-4">
        <Card tone="teal">
          <p className="text-xl text-teal-950">
            {L({
              en: 'Living far from your parents? Pay the Care plan for them and see their medicine reminders and visits.',
              hi: 'माता-पिता से दूर रहते हैं? उनके लिए केयर प्लान लें और उनके दवा रिमाइंडर और मुलाक़ातें देखें।',
              ta: 'பெற்றோரைப் பிரிந்து வாழ்கிறீர்களா? அவர்களுக்கு கேர் திட்டம் வாங்கி அவர்களின் மருந்து நினைவூட்டல்கள், வருகைகளைப் பாருங்கள்.',
            })}
          </p>
          <div className="mt-4">
            <BigButton onClick={() => setPaySheet({})} icon={<HeartHandshake className="w-7 h-7" />}>
              {L({ en: `Pay ₹${care?.plan_price_rs ?? 149} for a parent`, hi: `माता-पिता के लिए ₹${care?.plan_price_rs ?? 149}`, ta: `பெற்றோருக்கு ₹${care?.plan_price_rs ?? 149}` })}
            </BigButton>
          </div>
        </Card>
        {care?.paying_for.map((p) => {
          const status = parents.find((x) => x.plan_id === p.id);
          return (
            <Card key={p.id}>
              <p className="text-2xl font-extrabold text-slate-900">{nameFor(p.parent_phone, status?.name ?? p.parent_name)}</p>
              <p className="text-lg font-semibold text-emerald-800">{L({ en: 'On the Care plan', hi: 'केयर प्लान पर', ta: 'கேர் திட்டத்தில்' })}</p>
              {status && !status.signed_in && (
                <p className="mt-2 text-lg text-slate-800">{L({ en: 'They have not opened Sahay yet.', hi: 'उन्होंने अभी सहाय नहीं खोला है।', ta: 'அவர்கள் இன்னும் சஹாயைத் திறக்கவில்லை.' })}</p>
              )}
              {status && status.doses_today > 0 && (
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {L({ en: `Took ${status.taken_today} of ${status.doses_today} medicines today`, hi: `आज ${status.doses_today} में से ${status.taken_today} दवाएँ लीं`, ta: `இன்று ${status.doses_today} மருந்தில் ${status.taken_today} சாப்பிட்டார்` })}
                </p>
              )}
              {status?.next_appointment && (
                <p className="mt-1 text-lg text-slate-800">
                  {L({ en: 'Next visit', hi: 'अगली मुलाक़ात', ta: 'அடுத்த வருகை' })}:{' '}
                  {new Date(status.next_appointment.start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                </p>
              )}
              <div className="mt-3"><BigButton variant="secondary" small onClick={() => stopPlan(p.id)}>{L({ en: 'Stop Care plan', hi: 'केयर प्लान बंद करें', ta: 'கேர் திட்டத்தை நிறுத்து' })}</BigButton></div>
            </Card>
          );
        })}
      </div>
        </>
      )}

      {section === 'more' && (
        <>
      <SectionTitle>{L({ en: 'More', hi: 'और', ta: 'மேலும்' })}</SectionTitle>
      <div className="space-y-3">
        <BigButton variant="secondary" onClick={() => setShowDetails(true)} icon={<Pencil className="w-7 h-7" />}>{L({ en: 'My details', hi: 'मेरी जानकारी', ta: 'என் விவரங்கள்' })}</BigButton>
        <BigButton variant="secondary" onClick={onOpenLocationSelector}>{L({ en: 'Change my area', hi: 'मेरा क्षेत्र बदलें', ta: 'என் பகுதியை மாற்று' })}</BigButton>
        <BigButton variant="secondary" onClick={() => onNavigate('ask-sahay')}>{L({ en: 'Ask about health schemes', hi: 'स्वास्थ्य योजनाओं के बारे में पूछें', ta: 'சுகாதாரத் திட்டங்கள் பற்றி கேள்' })}</BigButton>
      </div>
        </>
      )}

      {cancelling && (
        <Sheet title={L({ en: 'Cancel this visit?', hi: 'यह मुलाक़ात रद्द करें?', ta: 'இந்த வருகையை ரத்து செய்யவா?' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })} onClose={() => setCancelling(null)}>
          <div className="space-y-4">
            <p className="text-xl text-slate-900">{cancelling.hospitalName} · {dateLabel(cancelling.date)} · {cancelling.timeSlot}</p>
            {error && <Notice tone="error">{error}</Notice>}
            <BigButton variant="danger" busy={busy} onClick={confirmCancel}>{L({ en: 'Yes, cancel it', hi: 'हाँ, रद्द करें', ta: 'ஆம், ரத்து செய்' })}</BigButton>
            <BigButton variant="secondary" onClick={() => setCancelling(null)}>{L({ en: 'No, keep it', hi: 'नहीं, रखें', ta: 'வேண்டாம், வைத்திரு' })}</BigButton>
          </div>
        </Sheet>
      )}
      {reminderSheet && <ReminderSheet lang={currentLang} editing={reminderSheet.editing} onClose={() => setReminderSheet(null)} />}
      {familySheet && <FamilySheet lang={currentLang} member={familySheet.member} onClose={() => setFamilySheet(null)} />}
      {paySheet && <PaySheet lang={currentLang} price={care?.plan_price_rs ?? 149} phone={paySheet.phone} name={paySheet.name} onClose={() => setPaySheet(null)} />}
      {showDetails && <DetailsSheet lang={currentLang} settings={userSettings} onUpdateSettings={onUpdateSettings} onClose={() => setShowDetails(false)} />}
    </div>
  );
};
