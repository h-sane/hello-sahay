import React, { useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { Language, UserCoordinates } from '../types';
import { INDIAN_LOCATION_PRESETS, LocationPreset, locationService } from '../services/locationService';
import { BigButton, Notice, Sheet, inputCls, pick } from './ui';

interface LocationSelectorModalProps {
  isOpen: boolean;
  isInitialPopup: boolean;
  currentCoords: UserCoordinates;
  currentLang: Language;
  onSelectLocation: (coords: UserCoordinates) => void;
  onClose: () => void;
}

/** Choose where you are: the phone's GPS in one tap, or a district from a short list. */
export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen, currentCoords, currentLang, onSelectLocation, onClose,
}) => {
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!isOpen) return null;
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);

  const useGps = async () => {
    setDetecting(true);
    setFailed(false);
    try {
      const coords = await locationService.detectUserLocation();
      onSelectLocation(coords);
    } catch {
      setFailed(true);
    } finally {
      setDetecting(false);
    }
  };

  const choose = (preset: LocationPreset) => onSelectLocation(locationService.setManualLocation(preset));

  const q = query.trim().toLowerCase();
  const shown = INDIAN_LOCATION_PRESETS.filter((p) =>
    q ? `${p.name} ${p.district} ${p.state}`.toLowerCase().includes(q) : p.state === 'Tamil Nadu'
  );

  return (
    <Sheet title={L({ en: 'Where are you?', hi: 'आप कहाँ हैं?', ta: 'நீங்கள் எங்கே இருக்கிறீர்கள்?' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })} onClose={onClose}>
      <div className="space-y-4">
        {currentCoords.districtDetected && (
          <p className="text-lg text-slate-700">
            {L({ en: 'Now', hi: 'अभी', ta: 'இப்போது' })}: <strong>{currentCoords.districtDetected}</strong>
          </p>
        )}
        <BigButton onClick={useGps} busy={detecting} icon={<LocateFixed className="w-7 h-7" />}>
          {L({ en: 'Use my current location', hi: 'मेरी मौजूदा लोकेशन', ta: 'என் தற்போதைய இருப்பிடம்' })}
        </BigButton>
        {failed && (
          <Notice tone="warn">
            {L({ en: 'Could not find your location. Choose your district below.', hi: 'लोकेशन नहीं मिली। नीचे अपना ज़िला चुनें।', ta: 'இருப்பிடம் கிடைக்கவில்லை. கீழே உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்.' })}
          </Notice>
        )}

        <p className="pt-2 text-xl font-bold text-slate-900">{L({ en: 'Or choose your area', hi: 'या अपना क्षेत्र चुनें', ta: 'அல்லது உங்கள் பகுதியைத் தேர்ந்தெடுங்கள்' })}</p>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={inputCls}
          placeholder={L({ en: 'Search a district or town', hi: 'ज़िला या शहर खोजें', ta: 'மாவட்டம் அல்லது ஊரைத் தேடு' })}
        />
        <div className="space-y-3">
          {shown.length === 0 && <p className="text-lg text-slate-700">{L({ en: 'No match. Try another spelling.', hi: 'कोई नहीं मिला। दूसरी वर्तनी आज़माएँ।', ta: 'பொருத்தம் இல்லை. வேறு எழுத்துப்பிழையை முயற்சிக்கவும்.' })}</p>}
          {shown.map((p) => (
            <button
              key={p.id} onClick={() => choose(p)}
              className="min-h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-2 text-left active:bg-teal-50"
            >
              <span className="block text-xl font-bold text-slate-900">{p.name}</span>
              <span className="block text-base text-slate-700">{p.district}, {p.state}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
};
