import React from 'react';
import { Globe, HeartPulse, WifiOff } from 'lucide-react';
import { Language } from '../types';
import { languageMeta } from '../translations';
import { pick } from './ui';

interface HeaderProps {
  currentLang: Language;
  locationLabel?: string;
  onOpenLocationModal?: () => void;
  onOpenLanguageModal: () => void;
  onOpenEmergency: () => void;
  isOnline: boolean;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang, onOpenLanguageModal, onOpenEmergency, isOnline, onNavigateHome,
}) => {
  const langName = languageMeta[currentLang]?.nativeName || 'English';
  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-2 px-3">
        <button onClick={onNavigateHome} className="flex min-h-14 items-center gap-2" aria-label="Hello Sahay">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-800 text-white">
            <HeartPulse className="h-7 w-7" aria-hidden />
          </span>
          <span className="hidden text-2xl font-extrabold text-teal-950 min-[400px]:inline">Sahay</span>
        </button>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-base font-bold text-amber-900" role="status">
              <WifiOff className="h-6 w-6" aria-hidden />
              {pick(currentLang, { en: 'Offline', hi: 'ऑफ़लाइन', ta: 'இணைப்பு இல்லை' })}
            </span>
          )}
          <button
            onClick={onOpenLanguageModal}
            className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-slate-400 px-3 text-lg font-bold text-slate-900"
            aria-label={pick(currentLang, { en: 'Change language', hi: 'भाषा बदलें', ta: 'மொழியை மாற்று' })}
          >
            <Globe className="h-5 w-5" aria-hidden />
            {langName}
          </button>
          <button
            onClick={onOpenEmergency}
            className="min-h-12 rounded-xl bg-red-700 px-3 text-lg font-extrabold text-white active:bg-red-800"
          >
            {pick(currentLang, { en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்' })}
          </button>
        </div>
      </div>
    </header>
  );
};
