import React, { useState } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Navigation,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Clock,
  ShieldCheck,
  Activity,
  Accessibility,
  CheckCircle2,
  Map as MapIcon,
  List as ListIcon,
  X,
} from 'lucide-react';
import { Hospital, Language } from '../types';
import { t } from '../translations';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';

interface HospitalsViewProps {
  currentLang: Language;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
}

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  currentLang,
  onSelectHospitalForBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'government' | 'PM-JAY' | 'CMCHIS' | 'emergency'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [savedHospitalIds, setSavedHospitalIds] = useState<string[]>(storageService.getSavedHospitals());
  const [selectedHospitalForMap, setSelectedHospitalForMap] = useState<Hospital | null>(null);

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = storageService.toggleSaveHospital(id);
    setSavedHospitalIds(updated);
  };

  // Filter hospitals
  const hospitals = hospitalService.search(searchQuery, {
    category: activeFilter === 'government' ? 'government' : 'all',
    scheme: activeFilter === 'PM-JAY' ? 'PM-JAY' : activeFilter === 'CMCHIS' ? 'CMCHIS' : 'all',
    emergencyOnly: activeFilter === 'emergency',
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('hospitalsTitle', currentLang)}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {currentLang === 'ta'
              ? 'அரசு ஆரம்ப சுகாதார நிலையங்கள், தாலுகா மருத்துவமனைகள் மற்றும் காப்பீட்டு மையங்கள்.'
              : currentLang === 'hi'
              ? 'निकटतम सरकारी स्वास्थ्य केंद्र, जिला अस्पताल और आयुष्मान भारत केंद्र।'
              : 'Verified government PHCs, taluk civil hospitals, and empaneled healthcare centres.'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', currentLang)}
            className="w-full h-13 pl-12 pr-10 rounded-2xl bg-white border border-slate-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-base shadow-xs transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                activeFilter === 'all'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t('filterAll', currentLang)}
            </button>

            <button
              onClick={() => setActiveFilter('government')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                activeFilter === 'government'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t('filterGovt', currentLang)}
            </button>

            <button
              onClick={() => setActiveFilter('CMCHIS')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                activeFilter === 'CMCHIS'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t('filterCmchis', currentLang)}
            </button>

            <button
              onClick={() => setActiveFilter('PM-JAY')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                activeFilter === 'PM-JAY'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t('filterPmjay', currentLang)}
            </button>

            <button
              onClick={() => setActiveFilter('emergency')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                activeFilter === 'emergency'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-red-800 hover:bg-red-50'
              }`}
            >
              {t('filterEmergency24x7', currentLang)}
            </button>
          </div>

          {/* List / Map Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>{t('viewList', currentLang)}</span>
            </button>
            <button
              onClick={() => {
                setViewMode('map');
                if (!selectedHospitalForMap && hospitals.length > 0) {
                  setSelectedHospitalForMap(hospitals[0]);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t('viewMap', currentLang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {currentLang === 'ta'
                  ? 'மாவட்ட சுகாதார வரைபடம்'
                  : currentLang === 'hi'
                  ? 'जिला स्वास्थ्य नक्शा'
                  : 'District Facilities Map'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentLang === 'ta'
                  ? 'மருத்துவமனையை வரைபடத்தில் தேர்ந்தெடுத்து விவரங்களை பார்க்கவும்'
                  : currentLang === 'hi'
                  ? 'अस्पताल चुनकर विवरण देखें'
                  : 'Select any pin to view details and start booking'}
              </p>
            </div>
          </div>

          {/* Simulated Interactive District Map Canvas */}
          <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-teal-950/5 border border-teal-800/15 overflow-hidden flex items-center justify-center p-4">
            {/* Visual Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#0b5d5b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            {/* Simulated Road network */}
            <svg className="absolute inset-0 w-full h-full stroke-teal-800/20 stroke-2 fill-none pointer-events-none">
              <path d="M 40,80 Q 200,120 400,200 T 800,280" />
              <path d="M 120,320 Q 300,220 500,150 T 750,80" />
              <circle cx="280" cy="180" r="140" strokeDasharray="4 4" className="stroke-teal-700/20" />
            </svg>

            {/* Hospital Pins */}
            {hospitals.map((h, idx) => {
              const isSelected = selectedHospitalForMap?.id === h.id;
              // Simple deterministic layout positions
              const positions = [
                { top: '30%', left: '42%' },
                { top: '55%', left: '25%' },
                { top: '22%', left: '70%' },
                { top: '70%', left: '50%' },
                { top: '40%', left: '80%' },
                { top: '65%', left: '75%' },
              ];
              const pos = positions[idx % positions.length];

              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHospitalForMap(h)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all flex items-center gap-2 group z-10 ${
                    isSelected
                      ? 'bg-teal-800 text-white shadow-xl scale-110 ring-4 ring-teal-600/30'
                      : 'bg-white text-slate-800 shadow-md border border-slate-200 hover:scale-105'
                  }`}
                  aria-label={`View ${h.name}`}
                >
                  <Building2 className={`w-5 h-5 ${isSelected ? 'text-teal-200' : 'text-teal-800'}`} />
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-bold block max-w-[140px] truncate leading-tight">
                      {h.nativeNames[currentLang] || h.name}
                    </span>
                    <span className="text-[10px] opacity-80 tabular-nums">
                      {h.distanceKm} km
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Pin Details Card */}
          {selectedHospitalForMap && (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  {selectedHospitalForMap.category.toUpperCase()} · {selectedHospitalForMap.district}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedHospitalForMap.nativeNames[currentLang] || selectedHospitalForMap.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  {selectedHospitalForMap.address[currentLang]} ·{' '}
                  <span className="font-semibold text-teal-900 tabular-nums">
                    {selectedHospitalForMap.distanceKm} {t('kmAway', currentLang)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${selectedHospitalForMap.contactPhone}`}
                  className="flex-1 sm:flex-none h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-teal-700" />
                  <span>{t('callHospital', currentLang)}</span>
                </a>
                <button
                  onClick={() => onSelectHospitalForBooking(selectedHospitalForMap)}
                  className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{t('bookDoctor', currentLang)}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {hospitals.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">
                {t('noHospitalsFound', currentLang)}
              </h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 text-white text-sm font-bold"
              >
                {t('clearFilters', currentLang)}
              </button>
            </div>
          ) : (
            hospitals.map((hospital) => {
              const isSaved = savedHospitalIds.includes(hospital.id);
              const displayName = hospital.nativeNames[currentLang] || hospital.name;
              const displayAddress = hospital.address[currentLang] || hospital.address.en;

              return (
                <article
                  key={hospital.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-700/60 transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      {/* Zero-pill metadata line */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                        <span className="font-bold text-teal-800 uppercase tracking-wide">
                          {hospital.category === 'phc'
                            ? 'Primary Health Centre (PHC)'
                            : hospital.category === 'government'
                            ? 'Government Hospital'
                            : hospital.category === 'chc'
                            ? 'Community Health Centre'
                            : 'Empaneled Facility'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-700 font-semibold">{hospital.district}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md">
                          {hospital.distanceKm} {t('kmAway', currentLang)}
                        </span>
                      </div>

                      {/* Hospital Title */}
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug pt-0.5">
                        {displayName}
                      </h3>

                      {/* Bilingual subtitle when available */}
                      {currentLang !== 'en' && (
                        <p className="text-xs text-slate-500 font-medium">
                          {hospital.name}
                        </p>
                      )}
                    </div>

                    {/* Bookmark Save Action */}
                    <button
                      onClick={(e) => handleToggleSave(hospital.id, e)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-700 hover:bg-teal-50 text-slate-600 hover:text-teal-800 transition-colors shrink-0 touch-target"
                      aria-label={isSaved ? 'Remove from saved' : 'Save hospital'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-5 h-5 text-teal-700" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Address & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{displayAddress}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hospital.openingHours}</span>
                    </div>
                  </div>

                  {/* Schemes & Key Highlights */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {hospital.emergency24x7 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <Activity className="w-3.5 h-3.5 text-red-600" />
                        <span>24x7 Emergency</span>
                      </span>
                    )}

                    {hospital.schemesSupported.map((scheme) => (
                      <span
                        key={scheme}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{scheme} Free Care</span>
                      </span>
                    ))}

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100">
                      <Accessibility className="w-3.5 h-3.5 text-slate-500" />
                      <span>{hospital.accessibilityInfo}</span>
                    </span>
                  </div>

                  {/* Departments List */}
                  <div className="text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-700 mr-1.5">
                      {t('departmentsLabel', currentLang)}:
                    </span>
                    <span>{hospital.departments.slice(0, 5).join(' · ')}</span>
                  </div>

                  {/* Diagnostics */}
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-700 mr-1.5">
                      {t('diagnosticsLabel', currentLang)}:
                    </span>
                    <span>{hospital.diagnosticServices.join(' · ')}</span>
                  </div>

                  {/* Verification timestamp */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('verifiedOn', currentLang)} {hospital.verifiedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>State Health Directory Reference Data</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${hospital.contactPhone}`}
                        className="h-11 px-4 rounded-xl border border-slate-200 hover:border-teal-700 bg-slate-50 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors touch-target"
                      >
                        <Phone className="w-4 h-4 text-teal-700" />
                        <span>{t('callHospital', currentLang)}</span>
                      </a>

                      <a
                        href={`https://maps.google.com/?q=${hospital.latitude},${hospital.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-11 px-4 rounded-xl border border-slate-200 hover:border-teal-700 bg-slate-50 hover:bg-white text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors touch-target"
                      >
                        <Navigation className="w-4 h-4 text-teal-700" />
                        <span>{t('getDirections', currentLang)}</span>
                      </a>
                    </div>

                    <button
                      onClick={() => onSelectHospitalForBooking(hospital)}
                      className="w-full sm:w-auto h-12 px-5 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all touch-target focus:ring-2 focus:ring-teal-700"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{t('bookDoctor', currentLang)}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
