import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Language, UserSettings } from '../types';
import { api } from '../services/api';
import { CarePlanInfo, FamilyMemberRow, patientApi } from '../services/patientApi';
import { useAppData } from './AppData';
import { BigButton, Field, Notice, Sheet, inputCls, pick } from './ui';

const RELATIONS = ['mother', 'father', 'spouse', 'son', 'daughter', 'other'] as const;
const REL_LABEL: Record<(typeof RELATIONS)[number], { en: string; hi: string; ta: string; kn: string; ml: string; te: string }> = {
  mother: { en: 'Mother', hi: 'माँ', ta: 'அம்மா', kn: 'ತಾಯಿ', ml: 'അമ്മ', te: 'తల్లి' },
  father: { en: 'Father', hi: 'पिता', ta: 'அப்பா', kn: 'ತಂದೆ', ml: 'അച്ഛൻ', te: 'తండ్రి' },
  spouse: { en: 'Husband or wife', hi: 'पति या पत्नी', ta: 'கணவன் அல்லது மனைவி', kn: 'ಗಂಡ ಅಥವಾ ಹೆಂಡತಿ', ml: 'ഭർത്താവ് അല്ലെങ്കിൽ ഭാര്യ', te: 'భర్త లేదా భార్య' },
  son: { en: 'Son', hi: 'बेटा', ta: 'மகன்', kn: 'ಮಗ', ml: 'മകൻ', te: 'కొడుకు' },
  daughter: { en: 'Daughter', hi: 'बेटी', ta: 'மகள்', kn: 'ಮಗಳು', ml: 'മകൾ', te: 'కూతురు' },
  other: { en: 'Other', hi: 'अन्य', ta: 'மற்றவர்', kn: 'ಬೇರೆಯವರು', ml: 'മറ്റുള്ളവർ', te: 'ఇతరులు' },
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
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(lang, o);

  const save = async () => {
    if (name.trim().length < 2) {
      setError(L({ en: 'Write their name.', hi: 'उनका नाम लिखें।', ta: 'அவர் பெயரை எழுதுங்கள்.', kn: 'ಅವರ ಹೆಸರು ಬರೆಯಿರಿ.', ml: 'അവരുടെ പേര് എഴുതുക.', te: 'వారి పేరు రాయండి.' }));
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
      title={member ? L({ en: 'Change family member', hi: 'सदस्य बदलें', ta: 'உறுப்பினரை மாற்று', kn: 'ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಬದಲಿಸಿ', ml: 'കുടുംബാംഗത്തെ മാറ്റുക', te: 'కుటుంబ సభ్యుడిని మార్చండి' }) : L({ en: 'Add family member', hi: 'परिवार का सदस्य जोड़ें', ta: 'குடும்ப உறுப்பினரைச் சேர்', kn: 'ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ', ml: 'കുടുംബാംഗത്തെ ചേർക്കുക', te: 'కుటుంబ సభ్యుడిని జోడించండి' })}
      closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })}
      onClose={onClose}
    >
      <div className="space-y-5">
        <Field label={L({ en: 'Name', hi: 'नाम', ta: 'பெயர்', kn: 'ಹೆಸರು', ml: 'പേര്', te: 'పేరు' })}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} autoFocus />
        </Field>
        <Field
          label={L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்', kn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', ml: 'മൊബൈൽ നമ്പർ', te: 'మొబైల్ నంబర్' })}
          hint={L({ en: 'Needed if you want to pay the Care plan for them.', hi: 'उनके लिए केयर प्लान लेने के लिए चाहिए।', ta: 'அவர்களுக்கு கேர் திட்டம் வாங்க தேவை.', kn: 'ಅವರಿಗಾಗಿ ಕೇರ್ ಪ್ಲಾನ್ ಪಾವತಿಸಲು ಇದು ಬೇಕು.', ml: 'അവർക്കായി കെയർ പ്ലാൻ അടയ്ക്കാൻ ഇത് വേണം.', te: 'మీరు వారి కోసం కేర్ ప్లాన్ చెల్లించాలనుకుంటే ఇది అవసరం.' })}
        >
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="numeric" maxLength={15} />
        </Field>
        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">{L({ en: 'Who are they to you?', hi: 'वे आपके कौन हैं?', ta: 'அவர் உங்களுக்கு யார்?', kn: 'ಅವರು ನಿಮಗೆ ಏನಾಗಬೇಕು?', ml: 'അവർ നിങ്ങൾക്ക് ആരാണ്?', te: 'వారు మీకు ఏమవుతారు?' })}</p>
          <div className="grid grid-cols-2 gap-3">
            {RELATIONS.map((r) => (
              <Choice key={r} on={relation === r} onClick={() => setRelation(r)}>{L(REL_LABEL[r])}</Choice>
            ))}
          </div>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <BigButton onClick={save} busy={busy}>{L({ en: 'Save', hi: 'सहेजें', ta: 'சேமி', kn: 'ಉಳಿಸಿ', ml: 'സേവ് ചെയ്യുക', te: 'సేవ్ చేయండి' })}</BigButton>
      </div>
    </Sheet>
  );
};

const CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js';

/** Opens Razorpay checkout and resolves with the signed proof, or rejects when the person closes it. */
function razorpayCheckout(o: { key_id: string; order_id: string; amount: number; currency: string }, name: string): Promise<Record<string, string>> {
  const w = window as unknown as { Razorpay?: new (opts: object) => { open: () => void } };
  const load = w.Razorpay
    ? Promise.resolve()
    : new Promise<void>((ok, fail) => {
        const s = document.createElement('script');
        s.src = CHECKOUT_JS;
        s.onload = () => ok();
        s.onerror = () => fail(new Error('Could not load the payment window. Check your internet and try again.'));
        document.head.appendChild(s);
      });
  return load.then(
    () =>
      new Promise((ok, fail) => {
        new w.Razorpay!({
          key: o.key_id, order_id: o.order_id, amount: o.amount, currency: o.currency, name: 'Hello Sahay', description: name,
          handler: (r: Record<string, string>) => ok(r),
          modal: { ondismiss: () => fail(new Error('Payment cancelled')) },
        }).open();
      }),
  );
}

/** Pay is the payment in demo mode; with Razorpay keys on the server it opens Razorpay (test mode takes no real money). The server then marks the number as Care plan (pro). */
export const PaySheet: React.FC<{ lang: Language; price: number; phone?: string; name?: string; onClose: () => void }> = ({
  lang, price, phone: initialPhone = '', name, onClose,
}) => {
  const { refresh } = useAppData();
  const [phone, setPhone] = useState(initialPhone.replace(/^\+91/, ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<CarePlanInfo | null>(null);
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(lang, o);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const order = await patientApi.careOrder();
      const proof = order.mode === 'razorpay' ? await razorpayCheckout(order, 'Care plan') : {};
      const r = await patientApi.payCarePlan(phone, proof);
      setDone(r.plan);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={L({ en: 'Care plan', hi: 'केयर प्लान', ta: 'கேர் திட்டம்', kn: 'ಕೇರ್ ಪ್ಲಾನ್', ml: 'കെയർ പ്ലാൻ', te: 'కేర్ ప్లాన్' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })} onClose={onClose}>
      {done ? (
        <div className="space-y-5">
          <Notice tone="success">
            {L({
              en: `Done. ${name || done.parent_phone} is now on the Care plan. When they open Sahay they will see that you are looking after them.`,
              hi: `हो गया। ${name || done.parent_phone} अब केयर प्लान पर हैं। सहाय खोलने पर उन्हें दिखेगा कि आप उनका ध्यान रख रहे हैं।`,
              ta: `முடிந்தது. ${name || done.parent_phone} இப்போது கேர் திட்டத்தில் உள்ளார். சஹாயைத் திறந்ததும் நீங்கள் அவரைக் கவனித்துக் கொள்கிறீர்கள் என்று பார்ப்பார்.`,
              kn: `ಆಯಿತು. ${name || done.parent_phone} ಈಗ ಕೇರ್ ಪ್ಲಾನ್‌ನಲ್ಲಿ ಇದ್ದಾರೆ. ಅವರು ಸಹಾಯ್ ತೆರೆದಾಗ ನೀವು ಅವರನ್ನು ನೋಡಿಕೊಳ್ಳುತ್ತಿದ್ದೀರಿ ಎಂದು ಕಾಣುತ್ತದೆ.`,
              ml: `കഴിഞ്ഞു. ${name || done.parent_phone} ഇപ്പോൾ കെയർ പ്ലാനിലാണ്. അവർ സഹായ് തുറക്കുമ്പോൾ നിങ്ങൾ അവരെ നോക്കുന്നുണ്ടെന്ന് കാണാം.`,
              te: `పూర్తయింది. ${name || done.parent_phone} ఇప్పుడు కేర్ ప్లాన్‌లో ఉన్నారు. వారు సహాయ్ తెరిచినప్పుడు మీరు వారిని చూసుకుంటున్నారని చూస్తారు.`,
            })}
          </Notice>
          <BigButton onClick={onClose} icon={<CheckCircle2 className="w-7 h-7" />}>{L({ en: 'OK', hi: 'ठीक है', ta: 'சரி', kn: 'ಸರಿ', ml: 'ശരി', te: 'సరే' })}</BigButton>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xl text-slate-900">
            {L({
              en: 'Pay for a parent or family member. You can then see their medicine reminders and appointments, and they get Care plan benefits.',
              hi: 'माता-पिता या परिवार के सदस्य के लिए भुगतान करें। आप उनके दवा रिमाइंडर और अपॉइंटमेंट देख सकेंगे।',
              ta: 'பெற்றோர் அல்லது குடும்ப உறுப்பினருக்காக செலுத்துங்கள். அவர்களின் மருந்து நினைவூட்டல்கள் மற்றும் முன்பதிவுகளை நீங்கள் பார்க்கலாம்.',
              kn: 'ಪೋಷಕರು ಅಥವಾ ಕುಟುಂಬ ಸದಸ್ಯರಿಗಾಗಿ ಪಾವತಿಸಿ. ನೀವು ಅವರ ಔಷಧ ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ನೋಡಬಹುದು, ಮತ್ತು ಅವರಿಗೆ ಕೇರ್ ಪ್ಲಾನ್ ಸೌಲಭ್ಯ ಸಿಗುತ್ತದೆ.',
              ml: 'മാതാപിതാക്കൾക്കോ കുടുംബാംഗത്തിനോ വേണ്ടി അടയ്ക്കുക. അവരുടെ മരുന്ന് ഓർമ്മപ്പെടുത്തലുകളും അപ്പോയിന്റ്‌മെന്റുകളും നിങ്ങൾക്ക് കാണാം, അവർക്ക് കെയർ പ്ലാൻ ആനുകൂല്യങ്ങളും ലഭിക്കും.',
              te: 'తల్లిదండ్రులు లేదా కుటుంబ సభ్యుల కోసం చెల్లించండి. మీరు వారి మందుల రిమైండర్‌లు మరియు అపాయింట్‌మెంట్‌లను చూడవచ్చు, మరియు వారు కేర్ ప్లాన్ ప్రయోజనాలను పొందుతారు.',
            })}
          </p>
          <Field label={L({ en: 'Their mobile number', hi: 'उनका मोबाइल नंबर', ta: 'அவர்களின் கைபேசி எண்', kn: 'ಅವರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', ml: 'അവരുടെ മൊബൈൽ നമ്പർ', te: 'వారి మొబైల్ నంబర్' })}>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="numeric" maxLength={15} autoFocus />
          </Field>
          <p className="text-3xl font-extrabold text-slate-900">₹{price} <span className="text-xl font-semibold text-slate-700">{L({ en: 'per month', hi: 'प्रति माह', ta: 'மாதத்திற்கு', kn: 'ತಿಂಗಳಿಗೆ', ml: 'പ്രതിമാസം', te: 'నెలకు' })}</span></p>
          {error && <Notice tone="error">{error}</Notice>}
          <BigButton onClick={pay} busy={busy} disabled={phone.replace(/\D/g, '').length < 10}>{L({ en: `Pay ₹${price}`, hi: `₹${price} चुकाएँ`, ta: `₹${price} செலுத்து`, kn: `₹${price} ಪಾವತಿಸಿ`, ml: `₹${price} അടയ്ക്കുക`, te: `₹${price} చెల్లించండి` })}</BigButton>
          <p className="text-base text-slate-600">{L({ en: 'Demo: no real money is taken.', hi: 'डेमो: कोई असली पैसा नहीं लिया जाता।', ta: 'டெமோ: உண்மையான பணம் எடுக்கப்படாது.', kn: 'ಡೆಮೊ: ನಿಜವಾದ ಹಣ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ.', ml: 'ഡെമോ: യഥാർത്ഥ പണം എടുക്കില്ല.', te: 'డెమో: అసలు డబ్బు తీసుకోబడదు.' })}</p>
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
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(lang, o);

  const save = async () => {
    const years = Number(age);
    if (name.trim().length < 2 || !Number.isInteger(years) || years < 0 || years > 120 || !gender || village.trim().length < 2) {
      setError(L({ en: 'Please fill in every box.', hi: 'कृपया सभी खाने भरें।', ta: 'எல்லா கட்டங்களையும் நிரப்பவும்.', kn: 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಖಾಲಿ ಜಾಗಗಳನ್ನು ತುಂಬಿ.', ml: 'ദയവായി എല്ലാ കള്ളികളും പൂരിപ്പിക്കുക.', te: 'దయచేసి అన్ని వివరాలను పూరించండి.' }));
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

  const genders: { id: 'female' | 'male' | 'other'; l: { en: string; hi: string; ta: string; kn: string; ml: string; te: string } }[] = [
    { id: 'female', l: { en: 'Woman', hi: 'महिला', ta: 'பெண்', kn: 'ಮಹಿಳೆ', ml: 'സ്ത്രീ', te: 'మహిళ' } },
    { id: 'male', l: { en: 'Man', hi: 'पुरुष', ta: 'ஆண்', kn: 'ಪುರುಷ', ml: 'പുരുഷൻ', te: 'పురుషుడు' } },
    { id: 'other', l: { en: 'Other', hi: 'अन्य', ta: 'மற்றவை', kn: 'ಇತರೆ', ml: 'മറ്റുള്ളവർ', te: 'ఇతర' } },
  ];

  return (
    <Sheet title={L({ en: 'My details', hi: 'मेरी जानकारी', ta: 'என் விவரங்கள்', kn: 'ನನ್ನ ವಿವರಗಳು', ml: 'എന്റെ വിവരങ്ങൾ', te: 'నా వివరాలు' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })} onClose={onClose}>
      <div className="space-y-5">
        <Field label={L({ en: 'Name', hi: 'नाम', ta: 'பெயர்', kn: 'ಹೆಸರು', ml: 'പേര്', te: 'పేరు' })}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        </Field>
        <Field label={L({ en: 'Age', hi: 'उम्र', ta: 'வயது', kn: 'ವಯಸ್ಸು', ml: 'പ്രായം', te: 'వయస్సు' })}>
          <input className={inputCls} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={3} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          {genders.map((g) => <Choice key={g.id} on={gender === g.id} onClick={() => setGender(g.id)}>{L(g.l)}</Choice>)}
        </div>
        <Field label={L({ en: 'Village or town', hi: 'गाँव या शहर', ta: 'கிராமம் அல்லது நகரம்', kn: 'ಹಳ್ಳಿ ಅಥವಾ ಪಟ್ಟಣ', ml: 'ഗ്രാമം അല്ലെങ്കിൽ പട്ടണം', te: 'గ్రామం లేదా పట్టణం' })}>
          <input className={inputCls} value={village} onChange={(e) => setVillage(e.target.value)} maxLength={200} />
        </Field>
        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">{L({ en: 'Language', hi: 'भाषा', ta: 'மொழி', kn: 'ಭಾಷೆ', ml: 'ഭാഷ', te: 'భాష' })}</p>
          <div className="grid grid-cols-2 gap-3">
            <Choice on={language === 'ta'} onClick={() => setLanguage('ta')}>தமிழ்</Choice>
            <Choice on={language === 'hi'} onClick={() => setLanguage('hi')}>हिन्दी</Choice>
            <Choice on={language === 'te'} onClick={() => setLanguage('te')}>తెలుగు</Choice>
            <Choice on={language === 'kn'} onClick={() => setLanguage('kn')}>ಕನ್ನಡ</Choice>
            <Choice on={language === 'ml'} onClick={() => setLanguage('ml')}>മലയാളം</Choice>
            <Choice on={language === 'en'} onClick={() => setLanguage('en')}>English</Choice>
          </div>
        </div>
        <p className="text-lg text-slate-700">
          {L({ en: 'Mobile number', hi: 'मोबाइल नंबर', ta: 'கைபேசி எண்', kn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', ml: 'മൊബൈൽ നമ്പർ', te: 'మొబైల్ నంబర్' })}: <strong>{settings.userPhone}</strong>{' '}
          {L({ en: '(this is how you sign in, it cannot be changed here)', hi: '(इसी से आप साइन इन करते हैं, यहाँ बदला नहीं जा सकता)', ta: '(இதன் மூலம் உள்நுழைகிறீர்கள், இங்கே மாற்ற முடியாது)', kn: '(ಇದರಿಂದ ನೀವು ಸೈನ್ ಇನ್ ಆಗುತ್ತೀರಿ, ಇಲ್ಲಿ ಬದಲಿಸಲು ಆಗುವುದಿಲ್ಲ)', ml: '(ഇതുപയോഗിച്ചാണ് നിങ്ങൾ സൈൻ ഇൻ ചെയ്യുന്നത്, ഇവിടെ മാറ്റാൻ കഴിയില്ല)', te: '(దీని ద్వారా మీరు సైన్ ఇన్ చేస్తారు, దీన్ని ఇక్కడ మార్చలేరు)' })}
        </p>
        {error && <Notice tone="error">{error}</Notice>}
        <BigButton onClick={save} busy={busy}>{L({ en: 'Save', hi: 'सहेजें', ta: 'சேமி', kn: 'ಉಳಿಸಿ', ml: 'സേവ് ചെയ്യുക', te: 'సేవ్ చేయండి' })}</BigButton>
      </div>
    </Sheet>
  );
};
