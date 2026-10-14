import React from 'react';
import { Home, Building2, MessageSquareHeart, Pill, UserCheck } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

export type NavTab = 'home' | 'hospitals' | 'ask-sahay' | 'medicines' | 'my-health';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentLang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, currentLang }) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: t('navHome', currentLang),
      icon: Home,
    },
    {
      id: 'hospitals' as NavTab,
      label: t('navHospitals', currentLang),
      icon: Building2,
    },
    {
      id: 'ask-sahay' as NavTab,
      label: t('navAskSahay', currentLang),
      icon: MessageSquareHeart,
    },
    {
      id: 'medicines' as NavTab,
      label: t('navMedicines', currentLang),
      icon: Pill,
    },
    {
      id: 'my-health' as NavTab,
      label: t('navMyHealth', currentLang),
      icon: UserCheck,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-bottom"
      aria-label="Main Navigation"
    >
      <div className="max-w-md md:max-w-xl mx-auto grid grid-cols-5 h-16 sm:h-18 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full py-1 min-h-[48px] rounded-lg transition-colors focus:outline-hidden ${
                isActive
                  ? 'text-teal-900 font-bold bg-teal-50/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 transition-transform ${
                  isActive ? 'scale-110 text-teal-800' : 'text-slate-500'
                }`}
                strokeWidth={isActive ? 2.4 : 1.9}
              />
              <span
                className={`text-[11px] sm:text-xs tracking-tight mt-1 truncate max-w-[68px] sm:max-w-[85px] leading-tight ${
                  isActive ? 'font-bold text-teal-950' : 'font-medium text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
