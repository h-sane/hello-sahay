import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Phone, User } from 'lucide-react';
import { Language } from '../types';
import { ApiError } from '../services/api';
import { ServiceBookingRow, patientApi } from '../services/patientApi';
import { useAppData } from './AppData';
import { BigButton, Card, Notice, SectionTitle, Sheet, pick, rupees } from './ui';

type Status = ServiceBookingRow['status'];
type Text = { en: string } & Partial<Record<Language, string>>;

const STATUS: Record<Status, { label: Text; cls: string }> = {
  new_request: {
    label: { en: 'Waiting for helper', hi: 'सहायक की पुष्टि बाकी', ta: 'உதவியாளர் உறுதிக்காக காத்திருக்கிறது', kn: 'ಸಹಾಯಕರ ದೃಢೀಕರಣಕ್ಕೆ ಕಾಯುತ್ತಿದೆ', ml: 'സഹായിയുടെ സ്ഥിരീകരണം കാത്തിരിക്കുന്നു', te: 'సహాయకుడి నిర్ధారణ కోసం వేచి ఉంది' },
    cls: 'bg-amber-100 text-amber-950 border-amber-400',
  },
  upcoming: {
    label: { en: 'Confirmed', hi: 'पक्का', ta: 'உறுதியானது', kn: 'ದೃಢವಾಗಿದೆ', ml: 'സ്ഥിരീകരിച്ചു', te: 'నిర్ధారించబడింది' },
    cls: 'bg-emerald-100 text-emerald-950 border-emerald-400',
  },
  in_progress: {
    label: { en: 'Helper is with you', hi: 'सहायक काम कर रहे हैं', ta: 'உதவியாளர் உங்களுடன் உள்ளார்', kn: 'ಸಹಾಯಕರು ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದಾರೆ', ml: 'സഹായി സേവനം ചെയ്യുന്നു', te: 'సహాయకుడు సేవ చేస్తున్నారు' },
    cls: 'bg-sky-100 text-sky-950 border-sky-400',
  },
  completed: {
    label: { en: 'Done', hi: 'पूरा हुआ', ta: 'முடிந்தது', kn: 'ಮುಗಿದಿದೆ', ml: 'കഴിഞ്ഞു', te: 'పూర్తయింది' },
    cls: 'bg-slate-100 text-slate-900 border-slate-400',
  },
  cancelled: {
    label: { en: 'Cancelled', hi: 'रद्द', ta: 'ரத்து செய்யப்பட்டது', kn: 'ರದ್ದಾಗಿದೆ', ml: 'റദ്ദാക്കി', te: 'రద్దు చేయబడింది' },
    cls: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  rejected: {
    label: { en: 'Helper could not come', hi: 'सहायक नहीं आ सके', ta: 'உதவியாளர் வர இயலாது', kn: 'ಸಹಾಯಕರು ಬರಲಾಗುವುದಿಲ್ಲ', ml: 'സഹായിക്ക് വരാൻ കഴിയില്ല', te: 'సహాయకుడు రాలేరు' },
    cls: 'bg-red-100 text-red-950 border-red-400',
  },
};

const REFRESH_MS = 20000;

export const ServiceBookings: React.FC<{ currentLang: Language }> = ({ currentLang }) => {
  const L = (o: Text) => pick(currentLang, o);
  const { contacts } = useAppData();
  const [rows, setRows] = useState<ServiceBookingRow[] | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<ServiceBookingRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    patientApi.serviceBookings().then((r) => { setRows(r); setError(''); }).catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await patientApi.cancelServiceBooking(cancelling.id);
      setCancelling(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setCancelling(null);
    } finally {
      setBusy(false);
    }
  };

  if (rows === null && !error) return null;
  if (rows !== null && rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionTitle>{L({ en: 'Your bookings', hi: 'आपकी बुकिंग', ta: 'உங்கள் முன்பதிவுகள்', kn: 'ನಿಮ್ಮ ಬುಕಿಂಗ್‌ಗಳು', ml: 'നിങ്ങളുടെ ബുക്കിംഗുകൾ', te: 'మీ బుకింగ్‌లు' })}</SectionTitle>
      {error && <Notice tone="error">{error}</Notice>}
      {(rows ?? []).map((b) => {
        const callNumber = b.helper && (b.helper.demo ? contacts?.helpline : b.helper.phone);
        return (
          <Card key={b.id}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-extrabold text-slate-900">{b.service_category === 'Custom request' ? (b.description || b.service_title) : b.service_title}</h3>
                <span className={`rounded-full border-2 px-3 py-1 text-base font-extrabold ${STATUS[b.status].cls}`}>{L(STATUS[b.status].label)}</span>
              </div>
              <p className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <User className="w-5 h-5 shrink-0 text-teal-800" aria-hidden />
                {b.helper?.name ?? L({ en: 'Any available helper', hi: 'कोई भी उपलब्ध सहायक', ta: 'கிடைக்கும் உதவியாளர்', kn: 'ಲಭ್ಯವಿರುವ ಸಹಾಯಕರು', ml: 'ലഭ്യമായ സഹായി', te: 'అందుబాటులో ఉన్న సహాయకుడు' })}
              </p>
              <p className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Calendar className="w-5 h-5 shrink-0 text-teal-800" aria-hidden />{b.booking_date}
                <Clock className="w-5 h-5 shrink-0 text-teal-800" aria-hidden />{b.booking_time}
              </p>
              {b.amount > 0 && <p className="text-lg font-bold text-slate-900">{rupees(b.amount)}</p>}
              <div className="grid grid-cols-2 gap-2 pt-1 empty:hidden">
                {callNumber && (b.status === 'upcoming' || b.status === 'in_progress') && (
                  <BigButton small variant="secondary" href={`tel:${callNumber}`} icon={<Phone className="w-5 h-5" />}>
                    {L({ en: 'Call', hi: 'कॉल', ta: 'அழை', kn: 'ಕರೆ', ml: 'വിളിക്കൂ', te: 'కాల్ చేయండి' })}
                  </BigButton>
                )}
                {(b.status === 'new_request' || b.status === 'upcoming') && (
                  <BigButton small variant="quiet" onClick={() => setCancelling(b)}>
                    {L({ en: 'Cancel booking', hi: 'बुकिंग रद्द करें', ta: 'முன்பதிவை ரத்து செய்', kn: 'ಬುಕಿಂಗ್ ರದ್ದು ಮಾಡಿ', ml: 'ബുക്കിംഗ് റദ്ദാക്കുക', te: 'బుకింగ్ రద్దు చేయండి' })}
                  </BigButton>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {cancelling && (
        <Sheet
          title={L({ en: 'Cancel this booking?', hi: 'यह बुकिंग रद्द करें?', ta: 'இந்த முன்பதிவை ரத்து செய்யவா?', kn: 'ಈ ಬುಕಿಂಗ್ ರದ್ದು ಮಾಡಬೇಕೇ?', ml: 'ഈ ബുക്കിംഗ് റദ്ദാക്കണോ?', te: 'ఈ బుకింగ్ రద్దు చేయాలా?' })}
          closeLabel={L({ en: 'Keep it', hi: 'रहने दें', ta: 'வைத்திரு', kn: 'ಇರಲಿ', ml: 'നിലനിർത്തുക', te: 'ఉంచండి' })}
          onClose={() => setCancelling(null)}
        >
          <p className="mb-4 text-xl font-semibold text-slate-800">{cancelling.service_title} · {cancelling.booking_date}</p>
          <BigButton variant="danger" busy={busy} onClick={confirmCancel}>
            {L({ en: 'Yes, cancel it', hi: 'हाँ, रद्द करें', ta: 'ஆம், ரத்து செய்', kn: 'ಹೌದು, ರದ್ದು ಮಾಡಿ', ml: 'അതെ, റദ്ദാക്കുക', te: 'అవును, రద్దు చేయండి' })}
          </BigButton>
        </Sheet>
      )}
    </section>
  );
};
