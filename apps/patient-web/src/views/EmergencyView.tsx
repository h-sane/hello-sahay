import React, { useState } from 'react';
import {
  PhoneCall,
  AlertOctagon,
  MapPin,
  Copy,
  Check,
  Building2,
  Navigation,
  ShieldAlert,
  X,
  Phone,
  UserCheck,
} from 'lucide-react';
import { Hospital, Language } from '../types';
import { t } from '../translations';
import { hospitalService } from '../services/hospitalService';

interface EmergencyViewProps {
  currentLang: Language;
  onClose: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ currentLang, onClose }) => {
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [trustedContactName, setTrustedContactName] = useState('கார்த்திக் (மகன் / Son)');
  const [trustedContactPhone, setTrustedContactPhone] = useState('9840199999');

  // Realistic sample GPS location coordinates in Tamil Nadu rural belt
  const gpsCoordinates = '12.6841° N, 79.9836° E (Maduranthakam, Chengalpattu District)';

  // Nearest 24x7 emergency facilities
  const emergencyHospitals: Hospital[] = hospitalService
    .getAll()
    .filter((h) => h.emergency24x7)
    .slice(0, 3);

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(gpsCoordinates);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-red-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-red-600 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Urgent Header */}
        <div className="p-6 bg-red-600 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {t('emergencyTitle', currentLang)}
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium pt-0.5">
                {t('emergencySubtitle', currentLang)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close emergency screen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Two Primary Action Emergency Buttons (108 & 112) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 108 Ambulance */}
            <a
              href="tel:108"
              className="p-5 rounded-2xl bg-red-700 hover:bg-red-800 text-white shadow-lg active:scale-98 transition-all flex items-center gap-4 group border-2 border-red-600"
            >
              <div className="w-14 h-14 rounded-2xl bg-white text-red-700 flex items-center justify-center shrink-0 shadow-md">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-wider block font-mono">
                  108
                </span>
                <span className="text-xs sm:text-sm font-bold text-red-100 leading-tight block">
                  {t('call108Ambulance', currentLang)}
                </span>
              </div>
            </a>

            {/* 112 National Helpline */}
            <a
              href="tel:112"
              className="p-5 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-lg active:scale-98 transition-all flex items-center gap-4 group border-2 border-slate-800"
            >
              <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-md">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-wider block font-mono">
                  112
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-200 leading-tight block">
                  {t('call112Emergency', currentLang)}
                </span>
              </div>
            </a>
          </div>

          {/* Trusted Family Contact Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                Trusted Family Emergency Contact
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                Configured
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-base font-extrabold text-slate-900 block">
                  {trustedContactName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  +91 {trustedContactPhone}
                </span>
              </div>

              <a
                href={`tel:${trustedContactPhone}`}
                className="h-11 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call Contact</span>
              </a>
            </div>
          </div>

          {/* GPS Location Sharing */}
          <div className="p-4.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
              <span>{t('shareGpsLocation', currentLang)}</span>
            </div>

            <p className="text-xs sm:text-sm font-mono font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200">
              {gpsCoordinates}
            </p>

            <button
              onClick={handleCopyLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-colors"
            >
              {copiedLocation ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLocation ? 'Coordinates Copied!' : t('copyLocationBtn', currentLang)}</span>
            </button>
          </div>

          {/* Nearest 24x7 Emergency Facilities List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t('nearestEmergencyCentres', currentLang)}
            </h3>

            <div className="space-y-2.5">
              {emergencyHospitals.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      {h.nativeNames[currentLang] || h.name}
                    </span>
                    <p className="text-xs text-slate-500">
                      {h.district} ·{' '}
                      <span className="font-bold text-red-700 tabular-nums">
                        {h.distanceKm} km away
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${h.contactPhone}`}
                      className="p-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      title="Call hospital casualty"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${h.latitude},${h.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Directions"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Emergency services (108/112) operate 24x7 nationwide across all states of India.
          </p>
        </div>
      </div>
    </div>
  );
};
