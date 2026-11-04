import React from 'react';
import { Home, Building2, MessageSquareHeart, Pill, HandHelping } from 'lucide-react';
import { Language } from '../types';
import { pick } from './ui';

export type NavTab = 'home' | 'hospitals' | 'ask-sahay' | 'medicines' | 'services' | 'my-health';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentLang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, currentLang }) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: pick(currentLang, { en: 'Home', hi: 'होम', ta: 'முகப்பு', kn: 'ಮುಖಪುಟ', ml: 'ഹോം', te: 'హోమ్' }),
      icon: Home,
    },
    {
      id: 'hospitals' as NavTab,
      label: pick(currentLang, { en: 'Hospitals', hi: 'अस्पताल', ta: 'மருத்துவ​மனை', kn: 'ಆಸ್ಪತ್ರೆ', ml: 'ആശുപത്രി', te: 'ఆసుపత్రి' }),
      icon: Building2,
    },
    {
      id: 'ask-sahay' as NavTab,
      label: pick(currentLang, { en: 'Ask', hi: 'पूछें', ta: 'கேளுங்கள்', kn: 'ಕೇಳಿ', ml: 'ചോദിക്കൂ', te: 'అడగండి' }),
      icon: MessageSquareHeart,
    },
    {
      id: 'medicines' as NavTab,
      label: pick(currentLang, { en: 'Medicine', hi: 'दवाएँ', ta: 'மருந்து', kn: 'ಔಷಧ', ml: 'മരുന്ന്', te: 'మందులు' }),
      icon: Pill,
    },
    {
      id: 'services' as NavTab,
      label: pick(currentLang, { en: 'Services', hi: 'सेवाएँ', ta: 'சேவைகள்', kn: 'ಸೇವೆಗಳು', ml: 'സേവനങ്ങൾ', te: 'సేవలు' }),
      icon: HandHelping,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-300 safe-bottom"
      aria-label="Main Navigation"
    >
      <div className="mx-auto grid h-20 max-w-xl grid-cols-5 items-stretch gap-1 px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl ${
                isActive ? 'bg-teal-800 text-white' : 'text-slate-800 active:bg-slate-100'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-7 w-7" strokeWidth={2.2} aria-hidden />
              <span className={`px-0.5 text-center font-bold leading-[1.1] ${currentLang === 'ml' || currentLang === 'kn' || currentLang === 'te' ? 'text-[13px]' : 'text-[14px]'}`}>
              {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
