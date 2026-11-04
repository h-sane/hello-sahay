import React from 'react';
import { Bell, ShieldCheck, Users } from 'lucide-react';
import { HelperProfile } from '../types';

interface HeaderProps {
  profile: HelperProfile;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfileSheet: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  unreadCount,
  onOpenNotifications,
  onOpenProfileSheet,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Logo and Greeting */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-[#274236] text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#274236]">
                Sahay Sathi
              </span>
              {profile.id_verification.status === 'verified' && (
                <span className="flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 mr-0.5 inline text-emerald-600" /> Verified
                </span>
              )}
            </div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Hello, {profile.name.split(' ')[0]}
            </h1>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 active:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar Button */}
          <button
            onClick={onOpenProfileSheet}
            aria-label="Profile Menu"
            className="w-9 h-9 rounded-full bg-[#274236] text-white font-bold text-sm flex items-center justify-center active:scale-95 transition-transform border border-[#1C3228]"
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'H'}
          </button>
        </div>
      </div>
    </header>
  );
};
