import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { Language, UserSettings } from '../types';
import { api, ApiPatient } from '../services/api';

type Stage = 'phone' | 'code' | 'details';
type Gender = 'female' | 'male' | 'other';

interface ProfileSetupModalProps {
  currentLang: Language;
  settings: UserSettings;
  onDone: (profile: Partial<UserSettings>) => void;
}

const COPY: Record<'en' | 'hi' | 'ta', Record<string, string>> = {
  en: {
    step: 'Step',
    of: 'of 3',
    phoneTitle: 'Your mobile number',
    phoneHelp: 'We use it to send your booking details and to recognise you when you call.',
    phoneLabel: 'Mobile number',
    phoneBad: 'Enter a 10-digit mobile number.',
    sendCode: 'Send code',
    codeTitle: 'Enter the 6-digit code',
    codeFor: 'Code for',
    demoNote: 'SMS is not connected in this demo. Your code is',
    useCode: 'Fill it in',
    codeLabel: 'Code',
    verify: 'Verify',
    resend: 'Send a new code',
    resendIn: 'New code in',
    change: 'Change number',
    detailsTitle: 'About you',
    detailsHelp: 'The doctor sees these details when you book.',
    name: 'Full name',
    age: 'Age',
    gender: 'Gender',
    female: 'Female',
    male: 'Male',
    other: 'Other',
    village: 'Village or town',
    save: 'Save and continue',
    required: 'Fill in every field.',
    ageBad: 'Enter an age between 0 and 120.',
    privacy: 'Your details are shared only with the hospital you book.',
  },
  hi: {
    step: 'चरण',
    of: '/ 3',
    phoneTitle: 'आपका मोबाइल नंबर',
    phoneHelp: 'बुकिंग की जानकारी भेजने और कॉल पर आपको पहचानने के लिए।',
    phoneLabel: 'मोबाइल नंबर',
    phoneBad: '10 अंकों का मोबाइल नंबर डालें।',
    sendCode: 'कोड भेजें',
    codeTitle: '6 अंकों का कोड डालें',
    codeFor: 'कोड इस नंबर के लिए',
    demoNote: 'इस डेमो में SMS जुड़ा नहीं है। आपका कोड है',
    useCode: 'भर दें',
    codeLabel: 'कोड',
    verify: 'जाँचें',
    resend: 'नया कोड भेजें',
    resendIn: 'नया कोड',
    change: 'नंबर बदलें',
    detailsTitle: 'आपके बारे में',
    detailsHelp: 'बुकिंग पर डॉक्टर ये जानकारी देखता है।',
    name: 'पूरा नाम',
    age: 'उम्र',
    gender: 'लिंग',
    female: 'महिला',
    male: 'पुरुष',
    other: 'अन्य',
    village: 'गाँव या शहर',
    save: 'सेव करें और आगे बढ़ें',
    required: 'सभी जानकारी भरें।',
    ageBad: '0 से 120 के बीच उम्र डालें।',
    privacy: 'आपकी जानकारी सिर्फ़ उसी अस्पताल को मिलती है जहाँ आप बुक करते हैं।',
  },
  ta: {
    step: 'படி',
    of: '/ 3',
    phoneTitle: 'உங்கள் மொபைல் எண்',
    phoneHelp: 'முன்பதிவு விவரங்களை அனுப்பவும், நீங்கள் அழைக்கும்போது அடையாளம் காணவும்.',
    phoneLabel: 'மொபைல் எண்',
    phoneBad: '10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.',
    sendCode: 'குறியீட்டை அனுப்பு',
    codeTitle: '6 இலக்கக் குறியீட்டை உள்ளிடவும்',
    codeFor: 'குறியீடு இந்த எண்ணுக்கு',
    demoNote: 'இந்த டெமோவில் SMS இணைக்கப்படவில்லை. உங்கள் குறியீடு',
    useCode: 'நிரப்பு',
    codeLabel: 'குறியீடு',
    verify: 'சரிபார்',
    resend: 'புதிய குறியீடு அனுப்பு',
    resendIn: 'புதிய குறியீடு',
    change: 'எண்ணை மாற்று',
    detailsTitle: 'உங்களைப் பற்றி',
    detailsHelp: 'முன்பதிவு செய்யும்போது மருத்துவர் இந்த விவரங்களைப் பார்ப்பார்.',
    name: 'முழு பெயர்',
    age: 'வயது',
    gender: 'பாலினம்',
    female: 'பெண்',
    male: 'ஆண்',
    other: 'மற்றவை',
    village: 'கிராமம் அல்லது நகரம்',
    save: 'சேமித்து தொடரவும்',
    required: 'எல்லா விவரங்களையும் நிரப்பவும்.',
    ageBad: '0 முதல் 120 வரை வயதை உள்ளிடவும்.',
    privacy: 'நீங்கள் முன்பதிவு செய்யும் மருத்துவமனைக்கு மட்டுமே உங்கள் விவரங்கள் செல்லும்.',
  },
};

const RESEND_SECONDS = 30;
const digits = (v: string) => v.replace(/\D/g, '');

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ currentLang, settings, onDone }) => {
  const c = COPY[currentLang === 'hi' || currentLang === 'ta' ? currentLang : 'en'];

  const [stage, setStage] = useState<Stage>(settings.phoneVerified ? 'details' : 'phone');
  const [phone, setPhone] = useState(digits(settings.userPhone || '').slice(-10));
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [wait, setWait] = useState(0);
  const [name, setName] = useState(settings.userName || '');
  const [age, setAge] = useState(settings.userAge ? String(settings.userAge) : '');
  const [gender, setGender] = useState<Gender | ''>(settings.userGender || '');
  const [village, setVillage] = useState(settings.villageTown || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const stepNumber = stage === 'phone' ? 1 : stage === 'code' ? 2 : 3;
  const run = async (job: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return setError(c.phoneBad);
    run(async () => {
      const res = await api.requestOtp(phone);
      setDemoCode(res.demo_code || '');
      setCode('');
      setWait(RESEND_SECONDS);
      setStage('code');
    });
  };

  const verify = () =>
    run(async () => {
      const res = await api.verifyOtp(phone, code);
      // A returning patient's saved details fill the next screen.
      const p: ApiPatient = res.patient;
      if (p.name) setName(p.name);
      if (p.age) setAge(String(p.age));
      if (p.gender) setGender(p.gender);
      if (p.village) setVillage(p.village);
      onDone({ userPhone: res.patient.phone, phoneVerified: true });
      setStage('details');
    });

  const save = () => {
    const ageNumber = Number(age);
    if (name.trim().length < 2 || !gender || village.trim().length < 2 || !age) return setError(c.required);
    if (!Number.isInteger(ageNumber) || ageNumber < 0 || ageNumber > 120) return setError(c.ageBad);
    run(async () => {
      await api.saveProfile({
        name: name.trim(),
        age: ageNumber,
        gender,
        village: village.trim(),
        language: ['ta', 'hi', 'en'].includes(currentLang) ? currentLang : undefined,
      });
      onDone({
        userName: name.trim(),
        userAge: ageNumber,
        userGender: gender,
        villageTown: village.trim(),
        profileComplete: true,
      });
    });
  };

  const input =
    'w-full h-14 px-4 rounded-2xl border-2 border-slate-200 focus:border-teal-700 focus:outline-none text-lg font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal';
  const label = 'block text-base font-bold text-slate-800 mb-1.5';
  const primary =
    'w-full h-14 rounded-2xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-md';

  const errorBox = error ? (
    <div role="alert" className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-base font-semibold text-red-900">
      {error}
    </div>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <div className="max-w-md mx-auto min-h-full flex flex-col px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-black text-teal-900">Hello Sahay</span>
          <span className="text-sm font-bold text-slate-500">
            {c.step} {stepNumber} {c.of}
          </span>
        </div>

        {stage === 'phone' && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <div>
              <h2 id="profile-title" className="text-2xl font-black text-slate-900">
                {c.phoneTitle}
              </h2>
              <p className="text-base text-slate-600 mt-1">{c.phoneHelp}</p>
            </div>
            <div>
              <label htmlFor="phone" className={label}>
                {c.phoneLabel}
              </label>
              <div className="flex gap-2">
                <span className="h-14 px-4 rounded-2xl bg-slate-100 flex items-center gap-1.5 text-lg font-bold text-slate-700 shrink-0">
                  <Phone className="w-4 h-4" /> +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(digits(e.target.value))}
                  className={`${input} font-mono tracking-wider`}
                  placeholder="98765 43210"
                />
              </div>
            </div>
            {errorBox}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{c.sendCode}</span>
              {!busy && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {stage === 'code' && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) verify();
            }}
          >
            <div>
              <h2 id="profile-title" className="text-2xl font-black text-slate-900">
                {c.codeTitle}
              </h2>
              <p className="text-base text-slate-600 mt-1">
                {c.codeFor} <span className="font-bold text-slate-900">+91 {phone}</span>
              </p>
            </div>

            {demoCode && (
              <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-amber-950">{c.demoNote}</p>
                  <p className="text-3xl font-black font-mono tracking-[0.25em] text-amber-950">{demoCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(demoCode)}
                  className="h-12 px-4 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold shrink-0"
                >
                  {c.useCode}
                </button>
              </div>
            )}

            <div>
              <label htmlFor="otp" className={label}>
                {c.codeLabel}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(digits(e.target.value))}
                className={`${input} text-center text-2xl font-mono tracking-[0.5em]`}
                placeholder="------"
              />
            </div>

            {errorBox}
            <button type="submit" disabled={busy || code.length !== 6} className={primary}>
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{c.verify}</span>
            </button>

            <div className="flex items-center justify-between text-base font-bold">
              <button type="button" onClick={() => setStage('phone')} className="text-slate-600 underline h-11">
                {c.change}
              </button>
              <button
                type="button"
                disabled={wait > 0 || busy}
                onClick={sendCode}
                className="text-teal-800 underline h-11 disabled:text-slate-400 disabled:no-underline"
              >
                {wait > 0 ? `${c.resendIn} ${wait}s` : c.resend}
              </button>
            </div>
          </form>
        )}

        {stage === 'details' && (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div>
              <h2 id="profile-title" className="text-2xl font-black text-slate-900">
                {c.detailsTitle}
              </h2>
              <p className="text-base text-slate-600 mt-1">{c.detailsHelp}</p>
            </div>

            <div>
              <label htmlFor="name" className={label}>
                {c.name}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
              />
            </div>

            <div>
              <label htmlFor="age" className={label}>
                {c.age}
              </label>
              <input
                id="age"
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={age}
                onChange={(e) => setAge(digits(e.target.value))}
                className={input}
              />
            </div>

            <div>
              <span className={label}>{c.gender}</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={c.gender}>
                {(['female', 'male', 'other'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={gender === g}
                    onClick={() => setGender(g)}
                    className={`h-14 rounded-2xl border-2 text-lg font-bold ${
                      gender === g
                        ? 'border-teal-700 bg-teal-800 text-white'
                        : 'border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {c[g]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="village" className={label}>
                {c.village}
              </label>
              <input
                id="village"
                type="text"
                autoComplete="address-level2"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className={input}
              />
            </div>

            {errorBox}
            <button type="submit" disabled={busy} className={primary}>
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              <span>{c.save}</span>
              {!busy && <ArrowRight className="w-5 h-5" />}
            </button>

            <p className="flex items-start gap-2 text-sm text-slate-600">
              <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              <span>{c.privacy}</span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};
