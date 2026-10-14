import React, { useEffect, useState } from 'react';
import { AlertOctagon, CalendarCheck, HeartHandshake, MessageSquareHeart, Mic, Phone, Pill, Users } from 'lucide-react';
import { Hospital, Language, UserCoordinates, UserSettings } from '../types';
import { ParentStatus, patientApi } from '../services/patientApi';
import { useAppData } from '../components/AppData';
import { BigButton, Card, Title, pick } from '../components/ui';
import type { NavTab } from '../components/BottomNav';

interface HomeViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  userCoordinates: UserCoordinates;
  nearestHospital: Hospital | null;
  onNavigate: (tab: NavTab) => void;
  onOpenEmergency: () => void;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
  onOpenLocationSelector: () => void;
  onOpenVoiceCall: () => void;
}

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export const HomeView: React.FC<HomeViewProps> = ({
  currentLang, userSettings, nearestHospital, onNavigate, onOpenEmergency, onSelectHospitalForBooking, onOpenVoiceCall,
}) => {
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);
  const { contacts, care, appointments, reminders, family } = useAppData();
  const [parents, setParents] = useState<ParentStatus[]>([]);

  useEffect(() => {
    if ((care?.paying_for.length ?? 0) > 0) patientApi.parents().then(setParents).catch(() => {});
    else setParents([]);
  }, [care?.paying_for.length]);

  const next = appointments
    .filter((a) => a.status === 'booked' && a.date >= todayIso())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const doses = reminders.filter((r) => r.active).reduce((n, r) => n + r.times.length, 0);
  const taken = reminders.filter((r) => r.active).reduce((n, r) => n + r.taken_today.length, 0);
  const nameOf = (phone: string, given: string | null) =>
    given || family.find((f) => f.phone === phone)?.name || L({ en: 'Your family member', hi: 'आपके परिवार का सदस्य', ta: 'உங்கள் குடும்ப உறுப்பினர்' });
  const first = userSettings.userName?.split(' ')[0];

  return (
    <div className="space-y-5">
      <Title>
        {first
          ? L({ en: `Hello, ${first}`, hi: `नमस्ते, ${first}`, ta: `வணக்கம், ${first}` })
          : L({ en: 'Hello', hi: 'नमस्ते', ta: 'வணக்கம்' })}
      </Title>

      <Card tone="teal">
        <h2 className="text-2xl font-extrabold text-teal-950">{L({ en: 'Talk to Sahay', hi: 'सहाय से बात करें', ta: 'சஹாயுடன் பேசுங்கள்' })}</h2>
        <p className="mt-1 mb-4 text-lg text-teal-950">
          {L({ en: 'Free health helpline. Book a visit or ask for help.', hi: 'निःशुल्क स्वास्थ्य हेल्पलाइन। मुलाक़ात बुक करें या मदद माँगें।', ta: 'இலவச சுகாதார உதவி எண். வருகையைப் பதிவு செய்யுங்கள் அல்லது உதவி கேளுங்கள்.' })}
        </p>
        <div className="space-y-3">
          <BigButton onClick={onOpenVoiceCall} icon={<Mic className="w-8 h-8" />}>{L({ en: 'Start call', hi: 'कॉल शुरू करें', ta: 'அழைப்பைத் தொடங்கு' })}</BigButton>
          {contacts?.helpline && (
            <BigButton variant="secondary" href={`tel:${contacts.helpline}`} icon={<Phone className="w-7 h-7" />}>
              {L({ en: 'Call by phone', hi: 'फ़ोन से कॉल करें', ta: 'தொலைபேசியில் அழை' })}
            </BigButton>
          )}
        </div>
      </Card>

      <BigButton variant="danger" onClick={onOpenEmergency} icon={<AlertOctagon className="w-8 h-8" />}>
        {L({ en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்' })}
      </BigButton>

      {(next || (doses > 0) || care?.monitored_by || parents.length > 0) && (
        <section aria-label={L({ en: 'Today', hi: 'आज', ta: 'இன்று' })} className="space-y-3">
          {next && (
            <button onClick={() => onNavigate('my-health')} className="w-full text-left">
              <Card>
                <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><CalendarCheck className="w-6 h-6" aria-hidden />{L({ en: 'Your next visit', hi: 'आपकी अगली मुलाक़ात', ta: 'உங்கள் அடுத்த வருகை' })}</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {new Date(`${next.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {next.timeSlot}
                </p>
                <p className="text-xl text-slate-800">{next.hospitalName}</p>
              </Card>
            </button>
          )}
          {doses > 0 && (
            <button onClick={() => onNavigate('my-health')} className="w-full text-left">
              <Card>
                <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><Pill className="w-6 h-6" aria-hidden />{L({ en: 'Medicines today', hi: 'आज की दवाएँ', ta: 'இன்றைய மருந்துகள்' })}</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {L({ en: `${taken} of ${doses} taken`, hi: `${doses} में से ${taken} ली`, ta: `${doses} இல் ${taken} சாப்பிட்டீர்கள்` })}
                </p>
              </Card>
            </button>
          )}
          {care?.monitored_by && (
            <Card tone="teal">
              <p className="flex items-center gap-2 text-xl font-bold text-teal-950">
                <HeartHandshake className="w-7 h-7 shrink-0" aria-hidden />
                {L({
                  en: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} is looking after your health`,
                  hi: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} आपके स्वास्थ्य का ध्यान रख रहे हैं`,
                  ta: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} உங்கள் ஆரோக்கியத்தைக் கவனிக்கிறார்`,
                })}
              </p>
            </Card>
          )}
          {parents.map((p) => (
            <button key={p.plan_id} onClick={() => onNavigate('my-health')} className="w-full text-left">
              <Card tone="teal">
                <p className="flex items-center gap-2 text-lg font-bold text-teal-950"><Users className="w-6 h-6" aria-hidden />{nameOf(p.phone, p.name)}</p>
                <p className="text-xl font-extrabold text-teal-950">
                  {p.doses_today > 0
                    ? L({ en: `${p.taken_today} of ${p.doses_today} medicines taken today`, hi: `आज ${p.doses_today} में से ${p.taken_today} दवाएँ ली`, ta: `இன்று ${p.doses_today} இல் ${p.taken_today} மருந்துகள்` })
                    : L({ en: 'No medicine reminders set', hi: 'कोई दवा रिमाइंडर नहीं', ta: 'மருந்து நினைவூட்டல் இல்லை' })}
                </p>
              </Card>
            </button>
          ))}
        </section>
      )}

      {nearestHospital && (
        <Card>
          <p className="text-lg font-bold text-slate-700">{L({ en: 'Nearest hospital', hi: 'नज़दीकी अस्पताल', ta: 'அருகிலுள்ள மருத்துவமனை' })}</p>
          <p className="text-2xl font-extrabold text-slate-900">{nearestHospital.name}</p>
          {Number.isFinite(nearestHospital.distanceKm) && nearestHospital.distanceKm > 0 && (
            <p className="text-xl text-slate-700">{nearestHospital.distanceKm.toFixed(1)} km</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BigButton small onClick={() => onSelectHospitalForBooking(nearestHospital)}>{L({ en: 'Book a visit', hi: 'समय लें', ta: 'நேரம் பதிவு' })}</BigButton>
            {contacts?.hospital_call ? (
              <BigButton small variant="secondary" href={`tel:${contacts.hospital_call}`} icon={<Phone className="w-5 h-5" />}>{L({ en: 'Call', hi: 'कॉल', ta: 'அழை' })}</BigButton>
            ) : (
              <BigButton small variant="secondary" onClick={() => onNavigate('hospitals')}>{L({ en: 'More', hi: 'और', ta: 'மேலும்' })}</BigButton>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <BigButton variant="soft" onClick={() => onNavigate('ask-sahay')} icon={<MessageSquareHeart className="w-7 h-7" />}>{L({ en: 'Ask a health question', hi: 'स्वास्थ्य का सवाल पूछें', ta: 'சுகாதாரக் கேள்வி கேள்' })}</BigButton>
        <BigButton variant="soft" onClick={() => onNavigate('medicines')} icon={<Pill className="w-7 h-7" />}>{L({ en: 'Check a medicine price', hi: 'दवा की कीमत देखें', ta: 'மருந்தின் விலையைப் பார்' })}</BigButton>
        <BigButton variant="soft" onClick={() => onNavigate('my-health')} icon={<Users className="w-7 h-7" />}>{L({ en: 'My family and Care plan', hi: 'मेरा परिवार और केयर प्लान', ta: 'என் குடும்பம் மற்றும் கேர் திட்டம்' })}</BigButton>
      </div>
    </div>
  );
};
