import React, { useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, Building2, Search, ArrowRight, X } from 'lucide-react';
import { Hospital, Language, UserCoordinates } from '../types';
import { hospitalService } from '../services/hospitalService';
import { locationService } from '../services/locationService';
import { speechService } from '../services/speechService';

interface LocationSetupModalProps {
  isOpen: boolean;
  currentLang: Language;
  currentLocation: UserCoordinates;
  onSelectLocation: (coords: UserCoordinates) => void;
  onClose?: () => void;
}

const PRESET_DISTRICTS: { name: string; state: string; lat: number; lon: number }[] = [
  { name: 'Chengalpattu (செங்கல்பட்டு)', state: 'Tamil Nadu', lat: 12.6841, lon: 79.9836 },
  { name: 'Maduranthakam (மதுராந்தகம்)', state: 'Tamil Nadu', lat: 12.5113, lon: 79.8837 },
  { name: 'Tambaram / Chennai (தாம்பரம்)', state: 'Tamil Nadu', lat: 12.9249, lon: 80.1165 },
  { name: 'Ranipet / Arcot (ராணிப்பேட்டை)', state: 'Tamil Nadu', lat: 12.9275, lon: 79.3333 },
  { name: 'Salem (சேலம்)', state: 'Tamil Nadu', lat: 11.6643, lon: 78.146 },
  { name: 'Coimbatore (கோயம்புத்தூர்)', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Madurai (மதுரை)', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
  { name: 'Gorakhpur (गोरखपुर)', state: 'Uttar Pradesh', lat: 26.7606, lon: 83.3732 },
  { name: 'Varanasi (वाराणसी)', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Lucknow (लखनऊ)', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Patna (पटना)', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Hyderabad (హైదరాబాద్)', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { name: 'Bengaluru (ಬೆಂಗಳೂರು)', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Kochi (കൊച്ചി)', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Kolkata (কলকাতা)', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune (पुणे)', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad (અમદાવાદ)', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
];

export const LocationSetupModal: React.FC<LocationSetupModalProps> = ({
  isOpen,
  currentLang,
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'gps' | 'manual'>('gps');
  const [isLocating, setIsLocating] = useState(false);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [previewHospital, setPreviewHospital] = useState<Hospital | null>(null);

  if (!isOpen) return null;

  const handleGpsDetect = async () => {
    setIsLocating(true);
    speechService.playAudioChime(640, 0.1);

    try {
      const coords = await locationService.detectUserLocation();
      const allHospitals = hospitalService.getAll();
      const nearest = locationService.getNearestHospital(allHospitals, coords);
      setPreviewHospital(nearest);
      setIsLocating(false);
      onSelectLocation(coords);
      speechService.playAudioChime(850, 0.15);
    } catch {
      setIsLocating(false);
    }
  };

  const handleSelectDistrict = (dist: typeof PRESET_DISTRICTS[0]) => {
    speechService.playAudioChime(700, 0.1);
    const coords: UserCoordinates = {
      latitude: dist.lat,
      longitude: dist.lon,
      districtDetected: `${dist.name}, ${dist.state}`,
    };
    const allHospitals = hospitalService.getAll();
    const nearest = locationService.getNearestHospital(allHospitals, coords);
    setPreviewHospital(nearest);
    onSelectLocation(coords);
  };

  const handlePinCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCodeInput.trim()) return;

    // PIN code matching
    const allHospitals = hospitalService.getAll();
    const matched = allHospitals.find((h) => h.pinCode.startsWith(pinCodeInput.slice(0, 3)));
    const lat = matched ? matched.latitude : 12.6841;
    const lon = matched ? matched.longitude : 79.9836;

    const coords: UserCoordinates = {
      latitude: lat,
      longitude: lon,
      districtDetected: `PIN ${pinCodeInput} (${matched ? matched.district : 'Rural Zone'})`,
    };

    onSelectLocation(coords);
  };

  const filteredDistricts = PRESET_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
    d.state.toLowerCase().includes(searchDistrict.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 to-teal-800 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-700/60 text-teal-200 flex items-center justify-center shrink-0 border border-teal-600/40 shadow-inner">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                Setup Healthcare Location
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {currentLang === 'ta'
                  ? 'உங்கள் இருப்பிடத்தை தேர்ந்தெடுக்கவும்'
                  : currentLang === 'hi'
                  ? 'अस्पताल खोजने के लिए स्थान चुनें'
                  : 'Locate Nearest Hospital Support'}
              </h2>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Selection: GPS vs Manual */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setSelectedMethod('gps')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              selectedMethod === 'gps'
                ? 'bg-white text-teal-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-teal-700" />
            <span>GPS Auto-Detect</span>
          </button>

          <button
            onClick={() => setSelectedMethod('manual')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              selectedMethod === 'manual'
                ? 'bg-white text-teal-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-teal-700" />
            <span>Manual District / PIN</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* METHOD 1: GPS Auto-Detect */}
          {selectedMethod === 'gps' && (
            <div className="space-y-4 text-center">
              <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-800 text-white flex items-center justify-center mx-auto shadow-md">
                  <Navigation className="w-8 h-8 text-teal-200" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Detect Current Device Location
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                  Automatically calculates distance to the closest 24x7 Government Hospital, Primary Health Centre (PHC), and emergency ambulance point.
                </p>

                <button
                  disabled={isLocating}
                  onClick={handleGpsDetect}
                  className="w-full h-12 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting Location...' : 'Use My Current Location'}</span>
                </button>
              </div>

              {currentLocation.districtDetected && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block">Current Location:</span>
                    <span className="font-mono text-teal-900 font-semibold">{currentLocation.districtDetected}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* METHOD 2: Manual District / PIN Selector */}
          {selectedMethod === 'manual' && (
            <div className="space-y-4">
              {/* PIN Code Quick Input */}
              <form onSubmit={handlePinCodeSubmit} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Enter 6-Digit PIN Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCodeInput}
                    onChange={(e) => setPinCodeInput(e.target.value)}
                    placeholder="e.g. 603001, 273001"
                    className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-mono font-bold"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-xl bg-teal-800 text-white font-bold text-xs"
                  >
                    Locate
                  </button>
                </div>
              </form>

              {/* District Search & List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Or Pick Your District / Town:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchDistrict}
                    onChange={(e) => setSearchDistrict(e.target.value)}
                    placeholder="Search district or town..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {filteredDistricts.map((dist) => {
                    const isSelected = currentLocation.districtDetected?.includes(dist.name.split(' ')[0]);
                    return (
                      <button
                        key={dist.name}
                        onClick={() => handleSelectDistrict(dist)}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-white hover:bg-teal-50 text-slate-800 border border-slate-200/80'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{dist.name}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-teal-200' : 'text-slate-500'}`}>
                            {dist.state}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-200 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Preview of Nearest Hospital */}
          {previewHospital && (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs space-y-1">
              <span className="font-bold text-emerald-950 uppercase tracking-wider block">
                Closest Healthcare Facility Found:
              </span>
              <p className="font-black text-sm text-slate-900">
                {previewHospital.nativeNames[currentLang] || previewHospital.name}
              </p>
              <p className="text-slate-600">
                {previewHospital.category.toUpperCase()} ·{' '}
                <strong className="text-emerald-800">{previewHospital.distanceKm} km away</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full h-12 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-md flex items-center justify-center gap-2"
          >
            <span>Confirm Healthcare Location</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
