import React from 'react';
import { PhoneCall, Globe, Wifi, WifiOff, HeartPulse } from 'lucide-react';
import { Language } from '../types';
import { languageMeta, t } from '../translations';

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
  currentLang,
  locationLabel,
  onOpenLocationModal,
  onOpenLanguageModal,
  onOpenEmergency,
  isOnline,
  onNavigateHome,
}) => {
  const currentLangLabel = languageMeta[currentLang]?.nativeName || 'English';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden"
          aria-label="Hello Sahay Home"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:bg-teal-900 transition-colors">
            <HeartPulse className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-teal-950 block leading-tight">
              {t('appName', currentLang)}
            </span>
            <span className="text-xs text-slate-500 hidden sm:block font-medium">
              {t('appTagline', currentLang)}
            </span>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
              isOnline ? 'text-emerald-800 bg-emerald-50' : 'text-amber-800 bg-amber-50'
            }`}
            title={isOnline ? 'Online mode' : 'Offline cache active'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('onlineBadge', currentLang)}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('offlineBadge', currentLang)}</span>
              </>
            )}
          </div>

          {/* Location button */}
          {onOpenLocationModal && (
            <button
              onClick={onOpenLocationModal}
              className="hidden sm:flex items-center gap-1.5 h-11 px-3 rounded-lg border border-teal-200 hover:border-teal-700 bg-teal-50/70 hover:bg-teal-100/70 text-teal-900 text-xs sm:text-sm font-bold transition-all focus:ring-2 focus:ring-teal-700 max-w-[190px]"
              aria-label="Change Location"
              title="Click to change your district or use GPS"
            >
              <span className="truncate">{locationLabel || 'Chengalpattu'}</span>
              <span className="text-[10px] bg-teal-800 text-white px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0">
                GPS
              </span>
            </button>
          )}

          {/* Language Switch Button */}
          <button
            onClick={onOpenLanguageModal}
            className="flex items-center gap-1.5 h-11 px-3 rounded-lg border border-slate-200 hover:border-teal-700 bg-slate-50 hover:bg-white text-slate-800 text-sm font-semibold transition-colors focus:ring-2 focus:ring-teal-700"
            aria-label="Change Language"
          >
            <Globe className="w-4 h-4 text-teal-700" />
            <span className="tracking-wide">{currentLangLabel}</span>
          </button>

          {/* Urgent Emergency Quick Button */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-2 h-11 px-3 sm:px-4 rounded-lg bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-sm transition-all focus:ring-2 focus:ring-red-500"
            aria-label="Emergency Call 112 or 108"
          >
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            <span className="whitespace-nowrap font-bold">112 / 108</span>
          </button>
        </div>
      </div>
    </header>
  );
};
