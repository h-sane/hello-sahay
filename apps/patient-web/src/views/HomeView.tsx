import React, { useEffect, useState } from 'react';
import { AlertOctagon, CalendarCheck, CreditCard, HandHelping, HeartHandshake, MapPin, MessageSquareHeart, Mic, Phone, Pill, Stethoscope, Users } from 'lucide-react';
import { Hospital, Language, UserCoordinates, UserSettings } from '../types';
import { ParentStatus, patientApi } from '../services/patientApi';
import { useAppData } from '../components/AppData';
import { BigButton, Card, SectionTitle, Title, pick } from '../components/ui';
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
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
}

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export const HomeView: React.FC<HomeViewProps> = ({
  currentLang, userSettings, nearestHospital, onNavigate, onOpenEmergency, onSelectHospitalForBooking, onOpenLocationSelector, onOpenVoiceCall, onUpdateSettings,
}) => {
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(currentLang, o);
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
    given || family.find((f) => f.phone === phone)?.name || L({ en: 'Your family member', hi: 'आपके परिवार का सदस्य', ta: 'உங்கள் குடும்ப உறுப்பினர்', kn: 'ನಿಮ್ಮ ಕುಟುಂಬದ ಸದಸ್ಯ', ml: 'നിങ്ങളുടെ കുടുംബാംഗം', te: 'మీ కుటుంబ సభ్యుడు' });
  const first = userSettings.userName?.split(' ')[0];

  return (
    <div className="space-y-5">
      <Title>
        {first
          ? L({ en: `Hello, ${first}`, hi: `नमस्ते, ${first}`, ta: `வணக்கம், ${first}`, kn: `ನಮಸ್ಕಾರ, ${first}`, ml: `നമസ്കാരം, ${first}`, te: `నమస్కారం, ${first}` })
          : L({ en: 'Hello', hi: 'नमस्ते', ta: 'வணக்கம்', kn: 'ನಮಸ್ಕಾರ', ml: 'നമസ്കാരം', te: 'నమస్కారం' })}
      </Title>

      <Card tone="teal">
        <h2 className="text-2xl font-extrabold text-teal-950">{L({ en: 'Talk to Sahay', hi: 'सहाय से बात करें', ta: 'சஹாயுடன் பேசுங்கள்', kn: 'ಸಹಾಯ್ ಜೊತೆ ಮಾತನಾಡಿ', ml: 'സഹായ്‌യോട് സംസാരിക്കൂ', te: 'సహాయ్‌తో మాట్లాడండి' })}</h2>
        <p className="mt-1 mb-4 text-lg text-teal-950">
          {L({ en: 'Free health helpline. Book a visit or ask for help.', hi: 'निःशुल्क स्वास्थ्य हेल्पलाइन। मुलाक़ात बुक करें या मदद माँगें।', ta: 'இலவச சுகாதார உதவி எண். வருகையைப் பதிவு செய்யுங்கள் அல்லது உதவி கேளுங்கள்.', kn: 'ಉಚಿತ ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿ. ಭೇಟಿ ಕಾಯ್ದಿರಿಸಿ ಅಥವಾ ಸಹಾಯ ಕೇಳಿ.', ml: 'സൗജന്യ ആരോഗ്യ ഹെൽപ്‌ലൈൻ. സന്ദർശനം ബുക്ക് ചെയ്യൂ അല്ലെങ്കിൽ സഹായം ചോദിക്കൂ.', te: 'ఉచిత ఆరోగ్య హెల్ప్‌లైన్. సందర్శనను బుక్ చేయండి లేదా సహాయం కోరండి.' })}
        </p>
        <div className="space-y-3">
          <BigButton onClick={onOpenVoiceCall} icon={<Mic className="w-8 h-8" />}>{L({ en: 'Start call', hi: 'कॉल शुरू करें', ta: 'அழைப்பைத் தொடங்கு', kn: 'ಕರೆ ಆರಂಭಿಸಿ', ml: 'കോൾ തുടങ്ങൂ', te: 'కాల్ ప్రారంభించండి' })}</BigButton>
          {contacts?.helpline && (
            <BigButton variant="secondary" href={`tel:${contacts.helpline}`} icon={<Phone className="w-7 h-7" />}>
              {L({ en: 'Call by phone', hi: 'फ़ोन से कॉल करें', ta: 'தொலைபேசியில் அழை', kn: 'ಫೋನ್ ಮೂಲಕ ಕರೆ ಮಾಡಿ', ml: 'ഫോണിൽ വിളിക്കൂ', te: 'ఫోన్ ద్వారా కాల్ చేయండి' })}
            </BigButton>
          )}
        </div>
      </Card>

      <BigButton variant="danger" onClick={onOpenEmergency} icon={<AlertOctagon className="w-8 h-8" />}>
        {L({ en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்', kn: 'ತುರ್ತು', ml: 'അടിയന്തരം', te: 'అత్యవసరం' })}
      </BigButton>

      {(next || (doses > 0) || care?.monitored_by || parents.length > 0) && (
        <section aria-label={L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'ഇന്ന്', te: 'ఈ రోజు' })} className="space-y-3">
          {next && (
            <button onClick={() => onNavigate('my-health')} className="w-full text-left">
              <Card>
                <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><CalendarCheck className="w-6 h-6" aria-hidden />{L({ en: 'Your next visit', hi: 'आपकी अगली मुलाक़ात', ta: 'உங்கள் அடுத்த வருகை', kn: 'ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿ', ml: 'നിങ്ങളുടെ അടുത്ത സന്ദർശനം', te: 'మీ తదుపరి సందర్శన' })}</p>
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
                <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><Pill className="w-6 h-6" aria-hidden />{L({ en: 'Medicines today', hi: 'आज की दवाएँ', ta: 'இன்றைய மருந்துகள்', kn: 'ಇಂದಿನ ಔಷಧಗಳು', ml: 'ഇന്നത്തെ മരുന്നുകൾ', te: 'ఈ రోజు మందులు' })}</p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {L({ en: `${taken} of ${doses} taken`, hi: `${doses} में से ${taken} ली`, ta: `${doses} இல் ${taken} சாப்பிட்டீர்கள்`, kn: `${doses} ರಲ್ಲಿ ${taken} ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ`, ml: `${doses}ൽ ${taken} കഴിച്ചു`, te: `${doses} లో ${taken} తీసుకున్నారు` })}
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
                  kn: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} ನಿಮ್ಮ ಆರೋಗ್ಯದ ಕಾಳಜಿ ವಹಿಸುತ್ತಿದ್ದಾರೆ`,
                  ml: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} നിങ്ങളുടെ ആരോഗ്യം ശ്രദ്ധിക്കുന്നു`,
                  te: `${nameOf(care.monitored_by.payer_phone, care.monitored_by.payer_name)} మీ ఆరోగ్యాన్ని చూసుకుంటున్నారు`,
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
                    ? L({ en: `${p.taken_today} of ${p.doses_today} medicines taken today`, hi: `आज ${p.doses_today} में से ${p.taken_today} दवाएँ ली`, ta: `இன்று ${p.doses_today} இல் ${p.taken_today} மருந்துகள்`, kn: `ಇಂದು ${p.doses_today} ರಲ್ಲಿ ${p.taken_today} ಔಷಧಗಳನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದಾರೆ`, ml: `ഇന്ന് ${p.doses_today}ൽ ${p.taken_today} മരുന്നുകൾ കഴിച്ചു`, te: `ఈ రోజు ${p.doses_today} లో ${p.taken_today} మందులు తీసుకున్నారు` })
                    : L({ en: 'No medicine reminders set', hi: 'कोई दवा रिमाइंडर नहीं', ta: 'மருந்து நினைவூட்டல் இல்லை', kn: 'ಔಷಧ ಜ್ಞಾಪನೆಗಳಿಲ್ಲ', ml: 'മരുന്ന് ഓർമ്മപ്പെടുത്തലുകൾ ഇല്ല', te: 'ಮందుల రిమైండర్‌లు లేవు' })}
                </p>
              </Card>
            </button>
          ))}
        </section>
      )}

      {nearestHospital && (
        <Card>
          <p className="text-lg font-bold text-slate-700">{L({ en: 'Nearest hospital', hi: 'नज़दीकी अस्पताल', ta: 'அருகிலுள்ள மருத்துவமனை', kn: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ', ml: 'അടുത്തുള്ള ആശുപത്രി', te: 'సమీప ఆసుపత్రి' })}</p>
          <p className="text-2xl font-extrabold text-slate-900">{nearestHospital.name}</p>
          {Number.isFinite(nearestHospital.distanceKm) && nearestHospital.distanceKm > 0 && (
            <p className="text-xl text-slate-700">{nearestHospital.distanceKm.toFixed(1)} km</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BigButton small onClick={() => onSelectHospitalForBooking(nearestHospital)}>{L({ en: 'Book a visit', hi: 'समय लें', ta: 'நேரம் பதிவு', kn: 'ಸಮಯ ಕಾಯ್ದಿರಿಸಿ', ml: 'സമയം ബുക്ക് ചെയ്യൂ', te: 'సమయాన్ని బుక్ చేయండి' })}</BigButton>
            {contacts?.hospital_call ? (
              <BigButton small variant="secondary" href={`tel:${contacts.hospital_call}`} icon={<Phone className="w-5 h-5" />}>{L({ en: 'Call', hi: 'कॉल', ta: 'அழை', kn: 'ಕರೆ', ml: 'വിളിക്കൂ', te: 'కాల్ చేయండి' })}</BigButton>
            ) : (
              <BigButton small variant="secondary" onClick={() => onNavigate('hospitals')}>{L({ en: 'More', hi: 'और', ta: 'மேலும்', kn: 'ಇನ್ನಷ್ಟು', ml: 'കൂടുതൽ', te: 'మరిన్ని' })}</BigButton>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <BigButton variant="soft" onClick={() => onNavigate('ask-sahay')} icon={<MessageSquareHeart className="w-7 h-7" />}>{L({ en: 'Ask a health question', hi: 'स्वास्थ्य का सवाल पूछें', ta: 'சுகாதாரக் கேள்வி கேள்', kn: 'ಆರೋಗ್ಯದ ಪ್ರಶ್ನೆ ಕೇಳಿ', ml: 'ആരോഗ്യ ചോദ്യം ചോദിക്കൂ', te: 'ఆరోగ్య ప్రశ్న అడగండి' })}</BigButton>
        <BigButton variant="soft" onClick={() => onNavigate('medicines')} icon={<Pill className="w-7 h-7" />}>{L({ en: 'Check a medicine price', hi: 'दवा की कीमत देखें', ta: 'மருந்தின் விலையைப் பார்', kn: 'ಔಷಧದ ಬೆಲೆ ನೋಡಿ', ml: 'മരുന്നಿന്റെ വില നോക്കൂ', te: 'మందుల ధరను తనిఖీ చేయండి' })}</BigButton>
        <BigButton variant="soft" onClick={() => onNavigate('services')} icon={<HandHelping className="w-7 h-7" />}>{L({ en: 'Home Care & Support Services', hi: 'होम केयर और सहायता सेवाएँ', ta: 'வீட்டுப் பராமரிப்பு & உதவிச் சேவைகள்', kn: 'ಮನೆ ಆರೈಕೆ ಮತ್ತು ಬೆಂಬಲ ಸೇವೆಗಳು', ml: 'ഹോം കെയർ & സപ്പോർട്ട് സേവനങ്ങൾ', te: 'హోమ్ కేర్ & సపోర్ట్ సేవలు' })}</BigButton>
      </div>

      <SectionTitle>{L({ en: 'Government services', hi: 'सरकारी सेवाएँ', ta: 'அரசு சேவைகள்', kn: 'ಸರ್ಕಾರಿ ಸೇವೆಗಳು', ml: 'സർക്കാർ സേവനങ്ങൾ', te: 'ప్రభుత్వ సేవలు' })}</SectionTitle>
      <div className="space-y-3">
        <BigButton variant="soft" href="https://beneficiary.nha.gov.in" icon={<CreditCard className="w-7 h-7" />}>{L({ en: 'Check my Ayushman card', hi: 'आयुष्मान कार्ड जाँचें', ta: 'ஆயுஷ்மான் அட்டையைப் பார்', kn: 'ನನ್ನ ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್ ಪರಿಶೀಲಿಸಿ', ml: 'എന്റെ ആയുഷ്മാൻ കാർഡ് പരിശോധിക്കൂ', te: 'నా ఆయుష్మాన్ కార్డును తనిఖీ చేయండి' })}</BigButton>
        <BigButton variant="soft" href="https://esanjeevani.mohfw.gov.in" icon={<Stethoscope className="w-7 h-7" />}>{L({ en: 'Free doctor on video (eSanjeevani)', hi: 'मुफ़्त वीडियो डॉक्टर (eSanjeevani)', ta: 'இலவச வீடியோ மருத்துவர் (eSanjeevani)', kn: 'ವಿಡಿಯೋದಲ್ಲಿ ಉಚಿತ ವೈದ್ಯರು (eSanjeevani)', ml: 'സൗജന്യ വീഡിയോ ഡോക്ടർ (eSanjeevani)', te: 'ఉచిత వీడియో డాక్టర్ (eSanjeevani)' })}</BigButton>
        <BigButton variant="soft" href="https://janaushadhi.gov.in/KendraDetails.aspx" icon={<MapPin className="w-7 h-7" />}>{L({ en: 'Find a Jan Aushadhi shop', hi: 'जन औषधि केंद्र खोजें', ta: 'ஜன் ஔஷதி கடையைக் கண்டுபிடி', kn: 'ಜನ್ ಔಷಧಿ ಅಂಗಡಿ ಹುಡುಕಿ', ml: 'ജൻ ഔഷധി കട കണ്ടെത്തൂ', te: 'జన్ ఔషధి దుకాణాన్ని కనుగొనండి' })}</BigButton>
      </div>
    </div>
  );
};
