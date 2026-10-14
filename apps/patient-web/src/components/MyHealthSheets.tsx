import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Language, UserSettings } from '../types';
import { api } from '../services/api';
import { CarePlanInfo, FamilyMemberRow, patientApi } from '../services/patientApi';
import { useAppData } from './AppData';
import { BigButton, Field, Notice, Sheet, inputCls, pick } from './ui';

const RELATIONS = ['mother', 'father', 'spouse', 'son', 'daughter', 'other'] as const;
const REL_LABEL: Record<(typeof RELATIONS)[number], { en: string; hi: string; ta: string }> = {
  mother: { en: 'Mother', hi: 'माँ', ta: 'அம்மா' },
  father: { en: 'Father', hi: 'पिता', ta: 'அப்பா' },
  spouse: { en: 'Husband or wife', hi: 'पति या पत्नी', ta: 'கணவன் அல்லது மனைவி' },
  son: { en: 'Son', hi: 'बेटा', ta: 'மகன்' },
  daughter: { en: 'Daughter', hi: 'बेटी', ta: 'மகள்' },
  other: { en: 'Other', hi: 'अन्य', ta: 'மற்றவர்' },
};
export const relationLabel = (lang: Language, r: string | null) =>
  r && r in REL_LABEL ? pick(lang, REL_LABEL[r as keyof typeof REL_LABEL]) : '';

const Choice: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button
    type="button" onClick={onClick} aria-pressed={on}
    className={`min-h-16 rounded-2xl border-2 px-3 text-xl font-bold ${on ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'}`}
  >
    {children}
  </button>
);

export const FamilySheet: React.FC<{ lang: Language; member?: FamilyMemberRow; onClose: () => void }> = ({ lang, member, onClose }) => {
  const { refreshFamily } = useAppData();
  const [name, setName] = useState(member?.name ?? '');
  const [phone, setPhone] = useState(member?.phone?.replace(/^\+91/, '') ?? '');
  const [relation, setRelation] = useState<string | null>(member?.relation ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);

  const save = async () => {
    if (name.trim().length < 2) {
      setError(L({ en: 'Write their name.', hi: 'उनका नाम लिखें।', ta: 'அவர் பெயரை எழுதுங்கள்.' }));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { name: name.trim(), phone: phone.trim() || undefined, relation: relation || undefined };
      if (member) await patientApi.editFamily(member.id, body);
      else await patientApi.addFamily(body);
      await refreshFamily();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={member ? L({ en: 'Change family member', hi: 'सदस्य बदलें', ta: 'உறுப்பினரை மாற்று' }) : L({ en: 'Add family member', hi: 'परिवार का सदस्य जोड़ें', ta: 'குடும்ப உறுப்பினரைச் சேர்' })}
      closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Field label={L({ en: 'Name', hi: 'नाम', ta: 'பெயர்' })}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} autoFocus />
        </Field>
        <Field
          label={L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்' })}
          hint={L({ en: 'Needed if you want to pay the Care plan for them.', hi: 'उनके लिए केयर प्लान लेने के लिए चाहिए।', ta: 'அவர்களுக்கு கேர் திட்டம் வாங்க தேவை.' })}
        >
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="numeric" maxLength={15} />
        </Field>
        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">{L({ en: 'Who are they to you?', hi: 'वे आपके कौन हैं?', ta: 'அவர் உங்களுக்கு யார்?' })}</p>
          <div className="grid grid-cols-2 gap-3">
            {RELATIONS.map((r) => (
              <Choice key={r} on={relation === r} onClick={() => setRelation(r)}>{L(REL_LABEL[r])}</Choice>
            ))}
          </div>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <BigButton onClick={save} busy={busy}>{L({ en: 'Save', hi: 'सहेजें', ta: 'சேமி' })}</BigButton>
      </div>
    </Sheet>
  );
};

/** Demo payment: Pay is the payment. The server marks the number as Care plan (pro) straight away. */
export const PaySheet: React.FC<{ lang: Language; price: number; phone?: string; name?: string; onClose: () => void }> = ({
  lang, price, phone: initialPhone = '', name, onClose,
}) => {
  const { refresh } = useAppData();
  const [phone, setPhone] = useState(initialPhone.replace(/^\+91/, ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<CarePlanInfo | null>(null);
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await patientApi.payCarePlan(phone);
      setDone(r.plan);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={L({ en: 'Care plan', hi: 'केयर प्लान', ta: 'கேர் திட்டம்' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })} onClose={onClose}>
      {done ? (
        <div className="space-y-5">
          <Notice tone="success">
            {L({
              en: `Done. ${name || done.parent_phone} is now on the Care plan. When they open Sahay they will see that you are looking after them.`,
              hi: `हो गया। ${name || done.parent_phone} अब केयर प्लान पर हैं। सहाय खोलने पर उन्हें दिखेगा कि आप उनका ध्यान रख रहे हैं।`,
              ta: `முடிந்தது. ${name || done.parent_phone} இப்போது கேர் திட்டத்தில் உள்ளார். சஹாயைத் திறந்ததும் நீங்கள் அவரைக் கவனித்துக் கொள்கிறீர்கள் என்று பார்ப்பார்.`,
            })}
          </Notice>
          <BigButton onClick={onClose} icon={<CheckCircle2 className="w-7 h-7" />}>{L({ en: 'OK', hi: 'ठीक है', ta: 'சரி' })}</BigButton>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xl text-slate-900">
            {L({
              en: 'Pay for a parent or family member. You can then see their medicine reminders and appointments, and they get Care plan benefits.',
              hi: 'माता-पिता या परिवार के सदस्य के लिए भुगतान करें। आप उनके दवा रिमाइंडर और अपॉइंटमेंट देख सकेंगे।',
              ta: 'பெற்றோர் அல்லது குடும்ப உறுப்பினருக்காக செலுத்துங்கள். அவர்களின் மருந்து நினைவூட்டல்கள் மற்றும் முன்பதிவுகளை நீங்கள் பார்க்கலாம்.',
            })}
          </p>
          <Field label={L({ en: 'Their mobile number', hi: 'उनका मोबाइल नंबर', ta: 'அவர்களின் கைபேசி எண்' })}>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="numeric" maxLength={15} autoFocus />
          </Field>
          <p className="text-3xl font-extrabold text-slate-900">₹{price} <span className="text-xl font-semibold text-slate-700">{L({ en: 'per month', hi: 'प्रति माह', ta: 'மாதத்திற்கு' })}</span></p>
          {error && <Notice tone="error">{error}</Notice>}
          <BigButton onClick={pay} busy={busy} disabled={phone.replace(/\D/g, '').length < 10}>{L({ en: `Pay ₹${price}`, hi: `₹${price} चुकाएँ`, ta: `₹${price} செலுத்து` })}</BigButton>
          <p className="text-base text-slate-600">{L({ en: 'Demo: no real money is taken.', hi: 'डेमो: कोई असली पैसा नहीं लिया जाता।', ta: 'டெமோ: உண்மையான பணம் எடுக்கப்படாது.' })}</p>
        </div>
      )}
    </Sheet>
  );
};

export const DetailsSheet: React.FC<{
  lang: Language; settings: UserSettings; onUpdateSettings: (s: Partial<UserSettings>) => void; onClose: () => void;
}> = ({ lang, settings, onUpdateSettings, onClose }) => {
  const [name, setName] = useState(settings.userName ?? '');
  const [age, setAge] = useState(settings.userAge ? String(settings.userAge) : '');
  const [gender, setGender] = useState<'female' | 'male' | 'other' | ''>(settings.userGender ?? '');
  const [village, setVillage] = useState(settings.villageTown ?? '');
  const [language, setLanguage] = useState<Language>(lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);

  const save = async () => {
    const years = Number(age);
    if (name.trim().length < 2 || !Number.isInteger(years) || years < 0 || years > 120 || !gender || village.trim().length < 2) {
      setError(L({ en: 'Please fill in every box.', hi: 'कृपया सभी खाने भरें।', ta: 'எல்லா கட்டங்களையும் நிரப்பவும்.' }));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.saveProfile({ name: name.trim(), age: years, gender, village: village.trim(), language });
      onUpdateSettings({ userName: name.trim(), userAge: years, userGender: gender, villageTown: village.trim(), language });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const genders: { id: 'female' | 'male' | 'other'; l: { en: string; hi: string; ta: string } }[] = [
    { id: 'female', l: { en: 'Woman', hi: 'महिला', ta: 'பெண்' } },
    { id: 'male', l: { en: 'Man', hi: 'पुरुष', ta: 'ஆண்' } },
    { id: 'other', l: { en: 'Other', hi: 'अन्य', ta: 'மற்றவை' } },
  ];

  return (
    <Sheet title={L({ en: 'My details', hi: 'मेरी जानकारी', ta: 'என் விவரங்கள்' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })} onClose={onClose}>
      <div className="space-y-5">
        <Field label={L({ en: 'Name', hi: 'नाम', ta: 'பெயர்' })}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        </Field>
        <Field label={L({ en: 'Age', hi: 'उम्र', ta: 'வயது' })}>
          <input className={inputCls} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={3} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          {genders.map((g) => <Choice key={g.id} on={gender === g.id} onClick={() => setGender(g.id)}>{L(g.l)}</Choice>)}
        </div>
        <Field label={L({ en: 'Village or town', hi: 'गाँव या शहर', ta: 'கிராமம் அல்லது நகரம்' })}>
          <input className={inputCls} value={village} onChange={(e) => setVillage(e.target.value)} maxLength={200} />
        </Field>
        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">{L({ en: 'Language', hi: 'भाषा', ta: 'மொழி' })}</p>
          <div className="grid grid-cols-3 gap-3">
            <Choice on={language === 'ta'} onClick={() => setLanguage('ta')}>தமிழ்</Choice>
            <Choice on={language === 'hi'} onClick={() => setLanguage('hi')}>हिन्दी</Choice>
            <Choice on={language === 'en'} onClick={() => setLanguage('en')}>English</Choice>
          </div>
        </div>
        <p className="text-lg text-slate-700">
          {L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்' })}: <strong>{settings.userPhone}</strong>{' '}
          {L({ en: '(this is how you sign in, it cannot be changed here)', hi: '(इसी से आप साइन इन करते हैं, यहाँ बदला नहीं जा सकता)', ta: '(இதன் மூலம் உள்நுழைகிறீர்கள், இங்கே மாற்ற முடியாது)' })}
        </p>
        {error && <Notice tone="error">{error}</Notice>}
        <BigButton onClick={save} busy={busy}>{L({ en: 'Save', hi: 'सहेजें', ta: 'சேமி' })}</BigButton>
      </div>
    </Sheet>
  );
};
