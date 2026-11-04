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
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string }) => pick(currentLang, o);

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
    <Sheet title={L({ en: 'Where are you?', hi: 'आप कहाँ हैं?', ta: 'நீங்கள் எங்கே இருக்கிறீர்கள்?', kn: 'ನೀವು ಎಲ್ಲಿದ್ದೀರಿ?', ml: 'നിങ്ങൾ എവിടെയാണ്?' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക' })} onClose={onClose}>
      <div className="space-y-4">
        {currentCoords.districtDetected && (
          <p className="text-lg text-slate-700">
            {L({ en: 'Now', hi: 'अभी', ta: 'இப்போது', kn: 'ಈಗ', ml: 'ഇപ്പോൾ' })}: <strong>{currentCoords.districtDetected}</strong>
          </p>
        )}
        <BigButton onClick={useGps} busy={detecting} icon={<LocateFixed className="w-7 h-7" />}>
          {L({ en: 'Use my current location', hi: 'मेरी मौजूदा लोकेशन', ta: 'என் தற்போதைய இருப்பிடம்', kn: 'ನನ್ನ ಈಗಿನ ಸ್ಥಳ ಬಳಸಿ', ml: 'എന്റെ ഇപ്പോഴത്തെ സ്ഥലം ഉപയോഗിക്കുക' })}
        </BigButton>
        {failed && (
          <Notice tone="warn">
            {L({ en: 'Could not find your location. Choose your district below.', hi: 'लोकेशन नहीं मिली। नीचे अपना ज़िला चुनें।', ta: 'இருப்பிடம் கிடைக்கவில்லை. கீழே உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்.', kn: 'ನಿಮ್ಮ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಕೆಳಗೆ ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆರಿಸಿ.', ml: 'നിങ്ങളുടെ സ്ഥലം കണ്ടെത്താനായില്ല. താഴെ നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക.' })}
          </Notice>
        )}

        <p className="pt-2 text-xl font-bold text-slate-900">{L({ en: 'Or choose your area', hi: 'या अपना क्षेत्र चुनें', ta: 'அல்லது உங்கள் பகுதியைத் தேர்ந்தெடுங்கள்', kn: 'ಅಥವಾ ನಿಮ್ಮ ಪ್ರದೇಶವನ್ನು ಆರಿಸಿ', ml: 'അല്ലെങ്കിൽ നിങ്ങളുടെ പ്രദേശം തിരഞ്ഞെടുക്കുക' })}</p>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={inputCls}
          placeholder={L({ en: 'Search a district or town', hi: 'ज़िला या शहर खोजें', ta: 'மாவட்டம் அல்லது ஊரைத் தேடு', kn: 'ಜಿಲ್ಲೆ ಅಥವಾ ಊರನ್ನು ಹುಡುಕಿ', ml: 'ജില്ലയോ സ്ഥലമോ തിരയുക' })}
        />
        <div className="space-y-3">
          {shown.length === 0 && <p className="text-lg text-slate-700">{L({ en: 'No match. Try another spelling.', hi: 'कोई नहीं मिला। दूसरी वर्तनी आज़माएँ।', ta: 'பொருத்தம் இல்லை. வேறு எழுத்துப்பிழையை முயற்சிக்கவும்.', kn: 'ಯಾವುದೂ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಕಾಗುಣಿತ ಪ್ರಯತ್ನಿಸಿ.', ml: 'ഒന്നും കണ്ടില്ല. മറ്റൊരു അക്ഷരവിന്യാസം പരീക്ഷിക്കുക.' })}</p>}
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
