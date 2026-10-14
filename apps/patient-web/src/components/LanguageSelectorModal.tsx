import React, { useState } from 'react';
import { Language, UserSettings } from '../types';
import { speechService } from '../services/speechService';
import { BigButton, pick } from './ui';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  isFirstTime: boolean;
  currentSettings: UserSettings;
  onSave: (settings: {
    language: Language;
    locationPermission: boolean;
    microphonePermission: boolean;
  }) => void;
  onClose?: () => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'en', label: 'English' },
];

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }> = ({ on, onChange, children }) => (
  <button
    type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
    className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border-2 border-slate-300 bg-white px-4 py-2 text-left"
  >
    <span className="text-xl font-semibold text-slate-900">{children}</span>
    <span className={`flex h-9 w-16 shrink-0 items-center rounded-full px-1 ${on ? 'justify-end bg-teal-800' : 'justify-start bg-slate-400'}`}>
      <span className="h-7 w-7 rounded-full bg-white" />
    </span>
  </button>
);

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen, isFirstTime, currentSettings, onSave, onClose,
}) => {
  const [lang, setLang] = useState<Language>(['ta', 'hi', 'en'].includes(currentSettings.language) ? currentSettings.language : 'ta');
  const [allowLocation, setAllowLocation] = useState<boolean>(isFirstTime ? true : currentSettings.locationPermission);
  const [allowMic, setAllowMic] = useState<boolean>(isFirstTime ? true : currentSettings.microphonePermission);

  if (!isOpen) return null;
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[96vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl">
        <h2 className="text-[30px] font-extrabold leading-tight text-slate-900">
          {L({ en: 'Choose your language', hi: 'अपनी भाषा चुनें', ta: 'உங்கள் மொழியைத் தேர்ந்தெடுங்கள்' })}
        </h2>

        <div className="mt-5 space-y-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); speechService.playAudioChime(600, 0.1); }}
              aria-pressed={lang === l.code}
              className={`min-h-20 w-full rounded-2xl border-2 px-5 text-left text-3xl font-extrabold ${
                lang === l.code ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white text-slate-900'
              }`}
            >
              {lang === l.code ? '✓ ' : ''}{l.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Toggle on={allowLocation} onChange={setAllowLocation}>
            {L({ en: 'Use my location to find nearby hospitals', hi: 'पास के अस्पताल खोजने के लिए मेरी लोकेशन इस्तेमाल करें', ta: 'அருகிலுள்ள மருத்துவமனைகளைக் காண என் இருப்பிடத்தைப் பயன்படுத்து' })}
          </Toggle>
          <Toggle on={allowMic} onChange={setAllowMic}>
            {L({ en: 'Use the microphone to talk to Sahay', hi: 'सहाय से बात करने के लिए माइक्रोफ़ोन इस्तेमाल करें', ta: 'சஹாயுடன் பேச மைக்ரோஃபோனைப் பயன்படுத்து' })}
          </Toggle>
        </div>

        <p className="mt-4 text-lg text-slate-700">
          {L({
            en: 'Your details stay private. We only keep what is needed to book visits and help you.',
            hi: 'आपकी जानकारी निजी रहती है। हम केवल वही रखते हैं जो मुलाक़ात बुक करने और मदद के लिए ज़रूरी है।',
            ta: 'உங்கள் விவரங்கள் தனிப்பட்டவை. வருகை பதிவு மற்றும் உதவிக்குத் தேவையானவை மட்டுமே சேமிக்கப்படும்.',
          })}
        </p>

        <div className="mt-6 space-y-3">
          <BigButton
            onClick={() => {
              speechService.playAudioChime(750, 0.15);
              onSave({ language: lang, locationPermission: allowLocation, microphonePermission: allowMic });
            }}
          >
            {L({ en: 'Continue', hi: 'आगे बढ़ें', ta: 'தொடரவும்' })}
          </BigButton>
          {!isFirstTime && onClose && (
            <BigButton variant="secondary" onClick={onClose}>{L({ en: 'Cancel', hi: 'रद्द करें', ta: 'ரத்து' })}</BigButton>
          )}
        </div>
      </div>
    </div>
  );
};
