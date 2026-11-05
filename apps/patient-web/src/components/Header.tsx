import React from 'react';
import { Activity, Globe, WifiOff } from 'lucide-react';
import { Language } from '../types';
import { languageMeta } from '../translations';
import { pick } from './ui';

interface HeaderProps {
  currentLang: Language;
  locationLabel?: string;
  onOpenLocationModal?: () => void;
  onOpenLanguageModal: () => void;
  onOpenEmergency: () => void;
  onOpenMyHealth: () => void;
  isMyHealthActive?: boolean;
  isOnline: boolean;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onOpenLanguageModal,
  onOpenEmergency,
  onOpenMyHealth,
  isMyHealthActive,
  isOnline,
  onNavigateHome,
}) => {
  const langName = languageMeta[currentLang]?.nativeName || 'English';
  return (
    <header className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3">
        <button onClick={onNavigateHome} className="flex min-h-12 items-center gap-1.5 shrink-0" aria-label="Hello Sahay">
          <img src="/logo-mark.webp" alt="" className="h-12 w-12 rounded-xl" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-base font-bold text-amber-900" role="status">
              <WifiOff className="h-6 w-6" aria-hidden />
              {pick(currentLang, { en: 'Offline', hi: 'ऑफ़लाइन', ta: 'இணைப்பு இல்லை', kn: 'ಸಂಪರ್ಕ ಇಲ್ಲ', ml: 'കണക്ഷൻ ഇല്ല', te: 'కనెక్షన్ లేదు' })}
            </span>
          )}
          <button
            onClick={onOpenLanguageModal}
            className="flex min-h-12 items-center gap-1 rounded-xl border-2 border-slate-400 px-2 sm:px-3 text-sm sm:text-base md:text-lg font-bold text-slate-900"
            aria-label={pick(currentLang, { en: 'Change language', hi: 'भाषा बदलें', ta: 'மொழியை மாற்று', kn: 'ಭಾಷೆ ಬದಲಿಸಿ', ml: 'ഭാഷ മാറ്റുക', te: 'భాషను మార్చండి' })}
          >
            <Globe className="hidden h-5 w-5 min-[400px]:block" aria-hidden />
            {langName}
          </button>
          <button
            onClick={onOpenEmergency}
            className="min-h-12 rounded-xl bg-red-700 px-2.5 sm:px-3 text-sm sm:text-base md:text-lg font-extrabold text-white active:bg-red-800 shrink-0"
          >
            {pick(currentLang, { en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்', kn: 'ತುರ್ತು', ml: 'അടിയന്തരം', te: 'అత్యవసరం' })}
          </button>
          <button
            onClick={onOpenMyHealth}
            className={`flex min-h-12 items-center gap-1.5 rounded-xl border-2 px-2.5 sm:px-3 text-sm sm:text-base md:text-lg font-extrabold transition-all active:scale-95 shrink-0 ${
              isMyHealthActive
                ? 'border-teal-800 bg-teal-800 text-white shadow-sm'
                : 'border-slate-400 bg-white text-teal-950 hover:border-teal-800 active:bg-slate-100'
            }`}
            aria-label={pick(currentLang, { en: 'My Health', hi: 'मेरी सेहत', ta: 'என் நலம்', kn: 'ನನ್ನ ಆರೋಗ್ಯ', ml: 'എന്റെ ആരോഗ്യം', te: 'నా ఆరోగ్యం' })}
          >
            <Activity className={`h-5 w-5 shrink-0 ${isMyHealthActive ? 'text-white' : 'text-teal-800'}`} aria-hidden />
            <span>{pick(currentLang, { en: 'My Health', hi: 'मेरी सेहत', ta: 'என் நலம்', kn: 'ನನ್ನ ಆರೋಗ್ಯ', ml: 'എന്റെ ആരോഗ്യം', te: 'నా ఆరోగ్యం' })}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
