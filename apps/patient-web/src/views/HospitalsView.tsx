import React, { useCallback, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Map as MapIcon,
  List as ListIcon,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';
import { Hospital, Language, UserCoordinates } from '../types';
import { t } from '../translations';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';
import { HospitalMap } from '../components/HospitalMap';
import { BigButton, Card, Notice, Title, inputCls, pick } from '../components/ui';
import { useAppData } from '../components/AppData';

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
  const { contacts } = useAppData();
  const kind = hospital.kindLabel ?? KIND_BY_CATEGORY[hospital.category];
  const address = hospital.address[lang] || hospital.address.en;
  const schemes = hospital.schemesSupported.join(' · ');
  const showUnconfirmed = hospital.schemesSupported.length === 0 && !!hospital.schemeChecked;
  const callNumber = contacts?.hospital_call || hospital.contactPhone;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg text-slate-700">
            {kind} · <span className="font-bold text-teal-900">{hospital.distanceKm} {t('kmAway', lang)}</span>
          </p>
          <h3 className="mt-1 text-2xl font-extrabold leading-snug text-slate-900 [overflow-wrap:anywhere]">
            {hospital.nativeNames[lang] || hospital.name}
          </h3>
          {address && (
            <p className="mt-1 flex items-start gap-2 text-lg text-slate-700">
              <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden />
              <span>{address}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => onToggleSave(hospital.id)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300"
          aria-label={saved ? 'Remove from saved' : 'Save hospital'}
        >
          {saved ? <BookmarkCheck className="h-7 w-7 text-teal-800" /> : <Bookmark className="h-7 w-7 text-slate-700" />}
        </button>
      </div>

      {(hospital.emergency24x7 || schemes) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hospital.emergency24x7 && (
            <span className="rounded-xl border-2 border-red-300 bg-red-50 px-3 py-1 text-lg font-bold text-red-800">
              {pick(lang, { en: 'Open 24 hours', hi: '24 घंटे खुला', ta: '24 மணி நேரமும் திறந்திருக்கும்' })}
            </span>
          )}
          {schemes && (
            <span className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-1 text-lg font-bold text-emerald-900">{schemes}</span>
          )}
        </div>
      )}
      {showUnconfirmed && <p className="mt-3 text-lg text-slate-700">{copy.unconfirmed}</p>}

      <div className="mt-4 space-y-3">
        <BigButton onClick={() => onBook(hospital)} icon={<Calendar className="w-7 h-7" />}>
          {pick(lang, { en: 'Book a visit', hi: 'समय बुक करें', ta: 'நேரம் பதிவு செய்' })}
        </BigButton>
        <div className="grid grid-cols-2 gap-3">
          {callNumber && (
            <BigButton small variant="secondary" href={`tel:${callNumber}`} icon={<Phone className="w-5 h-5" />}>
              {pick(lang, { en: 'Call', hi: 'कॉल', ta: 'அழை' })}
            </BigButton>
          )}
          <BigButton
            small variant="secondary"
            href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
            icon={<Navigation className="w-5 h-5" />}
          >
            {pick(lang, { en: 'Directions', hi: 'रास्ता', ta: 'வழி' })}
          </BigButton>
        </div>
      </div>
    </Card>
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
      ? danger ? 'border-red-700 bg-red-700 text-white' : 'border-teal-800 bg-teal-800 text-white'
      : `border-slate-400 bg-white ${danger ? 'text-red-800' : 'text-slate-900'}`;
    return (
      <button
        key={value}
        onClick={() => setActiveFilter(value)}
        aria-pressed={on}
        className={`min-h-14 rounded-2xl border-2 px-3 text-lg font-bold ${tone}`}
      >
        {label}
      </button>
    );
  };

  const segment = (mode: 'list' | 'map', icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={`flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl text-xl font-bold ${
        viewMode === mode ? 'bg-teal-800 text-white' : 'text-slate-900'
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
    <div>
      <Title sub={copy.subtitle}>{t('hospitalsTitle', currentLang)}</Title>

      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={pick(currentLang, { en: 'Search by name or town', hi: 'नाम या शहर से खोजें', ta: 'பெயர் அல்லது ஊர் மூலம் தேடு' })}
        aria-label={t('searchPlaceholder', currentLang)}
        className={inputCls}
      />

      <div className="mt-4 flex gap-1 rounded-2xl border-2 border-slate-300 bg-white p-1">
        {segment('list', <ListIcon className="h-6 w-6" />, t('viewList', currentLang))}
        {segment('map', <MapIcon className="h-6 w-6" />, t('viewMap', currentLang))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {chip('all', t('filterAll', currentLang))}
        {chip('government', t('filterGovt', currentLang))}
        {chip('scheme', 'CMCHIS · PM-JAY')}
        {chip('emergency', pick(currentLang, { en: 'Open 24 hours', hi: '24 घंटे खुला', ta: '24 மணி நேரம்' }), true)}
      </div>

      <div className="mt-6">
        {hospitals.length === 0 ? (
          <Card>
            <Notice tone={loadError ? 'error' : 'info'}>{loadError ? copy.loadFailed : t('noHospitalsFound', currentLang)}</Notice>
            {!loadError && (
              <div className="mt-4">
                <BigButton onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>{t('clearFilters', currentLang)}</BigButton>
              </div>
            )}
          </Card>
        ) : viewMode === 'map' ? (
          <div className="space-y-4">
            <HospitalMap hospitals={hospitals} user={userCoordinates} selectedId={selected?.id ?? null} onSelect={onPick} />
            <p className="flex flex-wrap gap-x-5 gap-y-1 text-lg text-slate-800">
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-teal-700" />{pick(currentLang, { en: 'Government', hi: 'सरकारी', ta: 'அரசு' })}</span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-slate-600" />{pick(currentLang, { en: 'Private', hi: 'निजी', ta: 'தனியார்' })}</span>
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-blue-600" />{pick(currentLang, { en: 'You', hi: 'आप', ta: 'நீங்கள்' })}</span>
            </p>
            {selected && cardFor(selected)}
          </div>
        ) : (
          <div className="space-y-4">{hospitals.map(cardFor)}</div>
        )}
      </div>

      {hospitals.length > 0 && (
        <p className="mt-6 text-base text-slate-700">{isDemoData ? copy.sourceDemo : copy.sourceReal}</p>
      )}
    </div>
  );
};
