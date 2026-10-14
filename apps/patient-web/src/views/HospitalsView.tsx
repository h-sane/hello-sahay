import React, { useCallback, useState } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Phone,
  Navigation,
  Calendar,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Activity,
  Info,
  Map as MapIcon,
  List as ListIcon,
  X,
} from 'lucide-react';
import { Hospital, Language, UserCoordinates } from '../types';
import { t } from '../translations';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';
import { HospitalMap } from '../components/HospitalMap';

interface HospitalsViewProps {
  currentLang: Language;
  userCoordinates?: UserCoordinates;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
}

type Filter = 'all' | 'government' | 'scheme' | 'emergency';

type Copy = { subtitle: string; unconfirmed: string; sourceReal: string; sourceDemo: string; loadFailed: string };
const COPY: Record<'en' | 'hi' | 'ta', Copy> = {
  en: {
    subtitle: 'Hospitals near you. Government options come first.',
    unconfirmed: 'Scheme cover not confirmed. Ask the hospital.',
    sourceReal: 'Names and map: OpenStreetMap. Scheme cover: Tamil Nadu CMCHIS hospital list.',
    sourceDemo: 'Demo data. Confirm timings by phone.',
    loadFailed: 'Could not load hospitals. Check your connection and reopen this tab.',
  },
  hi: {
    subtitle: 'आपके पास के अस्पताल। सरकारी विकल्प पहले दिखते हैं।',
    unconfirmed: 'योजना की पुष्टि नहीं। अस्पताल से पूछें।',
    sourceReal: 'नाम और नक्शा: OpenStreetMap। योजना: तमिलनाडु CMCHIS अस्पताल सूची।',
    sourceDemo: 'डेमो डेटा। समय फोन पर पक्का करें।',
    loadFailed: 'अस्पताल नहीं मिले। इंटरनेट जांचें और यह टैब फिर खोलें।',
  },
  ta: {
    subtitle: 'உங்களுக்கு அருகிலுள்ள மருத்துவமனைகள். அரசு மருத்துவமனைகள் முதலில்.',
    unconfirmed: 'திட்ட உறுதி இல்லை. மருத்துவமனையிடம் கேளுங்கள்.',
    sourceReal: 'பெயர், வரைபடம்: OpenStreetMap. திட்டம்: தமிழ்நாடு CMCHIS மருத்துவமனை பட்டியல்.',
    sourceDemo: 'டெமோ தரவு. நேரத்தை தொலைபேசியில் உறுதி செய்யவும்.',
    loadFailed: 'மருத்துவமனைகளை ஏற்ற முடியவில்லை. இணைப்பை சரிபார்த்து மீண்டும் திறக்கவும்.',
  },
};

const KIND_BY_CATEGORY: Record<Hospital['category'], string> = {
  government: 'Government hospital',
  phc: 'Primary health centre',
  chc: 'Community health centre',
  private: 'Private hospital',
};

interface CardProps {
  hospital: Hospital;
  lang: Language;
  copy: Copy;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onBook: (hospital: Hospital) => void;
}

const HospitalCard: React.FC<CardProps> = ({ hospital, lang, copy, saved, onToggleSave, onBook }) => {
  const kind = hospital.kindLabel ?? KIND_BY_CATEGORY[hospital.category];
  const address = hospital.address[lang] || hospital.address.en;
  const schemes = hospital.schemesSupported.join(' · ');
  const showUnconfirmed = hospital.schemesSupported.length === 0 && !!hospital.schemeChecked;

  const secondary =
    'h-12 rounded-xl border border-slate-200 bg-white hover:border-teal-700 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-colors';

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm text-slate-600">
            {kind} <span aria-hidden="true">·</span>{' '}
            <span className="font-bold text-teal-900 tabular-nums">
              {hospital.distanceKm} {t('kmAway', lang)}
            </span>
          </p>
          <h3 className="text-lg font-extrabold text-slate-900 leading-snug break-words">
            {hospital.nativeNames[lang] || hospital.name}
          </h3>
          {address && (
            <p className="text-sm text-slate-600 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              <span className="line-clamp-2">{address}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => onToggleSave(hospital.id)}
          className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 hover:border-teal-700 flex items-center justify-center text-slate-600"
          aria-label={saved ? 'Remove from saved' : 'Save hospital'}
        >
          {saved ? <BookmarkCheck className="w-5 h-5 text-teal-700" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </div>

      {(hospital.emergency24x7 || schemes) && (
        <div className="flex flex-wrap gap-2">
          {hospital.emergency24x7 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold bg-red-50 text-red-700 border border-red-200">
              <Activity className="w-4 h-4" />
              <span>24x7 Emergency</span>
            </span>
          )}
          {schemes && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>{schemes}</span>
            </span>
          )}
        </div>
      )}
      {showUnconfirmed && (
        <p className="text-sm text-slate-500 flex items-start gap-1.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{copy.unconfirmed}</span>
        </p>
      )}

      <button
        onClick={() => onBook(hospital)}
        className="w-full h-12 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 transition-all"
      >
        <Calendar className="w-5 h-5" />
        <span>{t('bookDoctor', lang)}</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        {hospital.contactPhone ? (
          <a href={`tel:${hospital.contactPhone}`} className={secondary}>
            <Phone className="w-4 h-4 text-teal-700" />
            <span>{t('callHospital', lang)}</span>
          </a>
        ) : (
          <span className={`${secondary} opacity-50`}>
            <Phone className="w-4 h-4" />
            <span>{t('callHospital', lang)}</span>
          </span>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
          target="_blank"
          rel="noreferrer"
          className={secondary}
        >
          <Navigation className="w-4 h-4 text-teal-700" />
          <span>{t('getDirections', lang)}</span>
        </a>
      </div>
    </article>
  );
};

export const HospitalsView: React.FC<HospitalsViewProps> = ({
  currentLang,
  userCoordinates,
  onSelectHospitalForBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [savedIds, setSavedIds] = useState<string[]>(storageService.getSavedHospitals());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const copy = COPY[currentLang === 'hi' || currentLang === 'ta' ? currentLang : 'en'];

  const hospitals = hospitalService.search(searchQuery, {
    category: activeFilter === 'government' ? 'government' : 'all',
    scheme: activeFilter === 'scheme' ? 'any' : 'all',
    emergencyOnly: activeFilter === 'emergency',
  });
  const selected = hospitals.find((h) => h.id === selectedId) ?? hospitals[0];
  const isDemoData = hospitals.some((h) => h.isDemo);
  const loadError = hospitalService.getError();

  const onPick = useCallback((h: Hospital) => setSelectedId(h.id), []);
  const toggleSave = (id: string) => setSavedIds(storageService.toggleSaveHospital(id));

  const chip = (value: Filter, label: string, danger = false) => {
    const on = activeFilter === value;
    const tone = on
      ? danger
        ? 'bg-red-700 text-white'
        : 'bg-teal-800 text-white'
      : `bg-white border border-slate-200 ${danger ? 'text-red-800' : 'text-slate-700'}`;
    return (
      <button
        key={value}
        onClick={() => setActiveFilter(value)}
        className={`h-11 px-4 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${tone}`}
      >
        {label}
      </button>
    );
  };

  const segment = (mode: 'list' | 'map', icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`flex-1 h-11 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
        viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const cardFor = (h: Hospital) => (
    <HospitalCard
      key={h.id}
      hospital={h}
      lang={currentLang}
      copy={copy}
      saved={savedIds.includes(h.id)}
      onToggleSave={toggleSave}
      onBook={onSelectHospitalForBooking}
    />
  );

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('hospitalsTitle', currentLang)}</h1>
        <p className="text-base text-slate-600 mt-1">{copy.subtitle}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder', currentLang)}
          className="w-full h-12 pl-12 pr-11 rounded-xl bg-white border border-slate-200 focus:border-teal-700 text-slate-900 text-base placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-slate-400"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {segment('list', <ListIcon className="w-4 h-4" />, t('viewList', currentLang))}
        {segment('map', <MapIcon className="w-4 h-4" />, t('viewMap', currentLang))}
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
        {chip('all', t('filterAll', currentLang))}
        {chip('government', t('filterGovt', currentLang))}
        {chip('scheme', 'CMCHIS · PM-JAY')}
        {chip('emergency', t('filterEmergency24x7', currentLang), true)}
      </div>

      {hospitals.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            {loadError ? copy.loadFailed : t('noHospitalsFound', currentLang)}
          </h3>
          {!loadError && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="h-11 px-5 rounded-xl bg-teal-800 text-white text-sm font-bold"
            >
              {t('clearFilters', currentLang)}
            </button>
          )}
        </div>
      ) : viewMode === 'map' ? (
        <div className="space-y-3">
          <HospitalMap hospitals={hospitals} user={userCoordinates} selectedId={selected?.id ?? null} onSelect={onPick} />
          <p className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-700" /> Government
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-600" /> Private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600" /> You
            </span>
          </p>
          {selected && cardFor(selected)}
        </div>
      ) : (
        <div className="space-y-3">{hospitals.map(cardFor)}</div>
      )}

      {hospitals.length > 0 && (
        <p className="text-xs text-slate-500 pt-1">{isDemoData ? copy.sourceDemo : copy.sourceReal}</p>
      )}
    </div>
  );
};
