import React, { useEffect, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { Language, UserCoordinates } from '../types';
import { locationService } from '../services/locationService';
import { api } from '../services/api';
import { BigButton, Notice, Sheet, inputCls, pick } from './ui';

interface LocationSelectorModalProps {
  isOpen: boolean;
  isInitialPopup: boolean;
  currentCoords?: UserCoordinates;
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
  const [places, setPlaces] = useState<{ name: string; detail: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const q = query.trim();

  // Live place search against OpenStreetMap through our API, once the patient pauses typing
  useEffect(() => {
    if (q.length < 2) {
      setPlaces([]);
      setSearchFailed(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api.placeSearch(q)
        .then((r) => { setPlaces(r); setSearchFailed(false); })
        .catch(() => { setPlaces([]); setSearchFailed(true); })
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  if (!isOpen) return null;
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(currentLang, o);

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

  const choose = (place: { name: string; detail: string; lat: number; lng: number }) =>
    onSelectLocation(locationService.setManualLocation(place));

  return (
    <Sheet title={L({ en: 'Where are you?', hi: 'आप कहाँ हैं?', ta: 'நீங்கள் எங்கே இருக்கிறீர்கள்?', kn: 'ನೀವು ಎಲ್ಲಿದ್ದೀರಿ?', ml: 'നിങ്ങൾ എവിടെയാണ്?', te: 'మీరు ఎక్కడ ఉన్నారు?' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })} onClose={onClose}>
      <div className="space-y-4">
        {currentCoords?.districtDetected && (
          <p className="text-lg text-slate-700">
            {L({ en: 'Now', hi: 'अभी', ta: 'இப்போது', kn: 'ಈಗ', ml: 'ഇപ്പോൾ', te: 'ఇప్పుడు' })}: <strong>{currentCoords.districtDetected}</strong>
          </p>
        )}
        <BigButton onClick={useGps} busy={detecting} icon={<LocateFixed className="w-7 h-7" />}>
          {L({ en: 'Use my current location', hi: 'मेरी मौजूदा लोकेशन', ta: 'என் தற்போதைய இருப்பிடம்', kn: 'ನನ್ನ ಈಗಿನ ಸ್ಥಳ ಬಳಸಿ', ml: 'എന്റെ ഇപ്പോഴത്തെ സ്ഥലം ഉപയോഗിക്കുക', te: 'నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి' })}
        </BigButton>
        {failed && (
          <Notice tone="warn">
            {L({ en: 'Could not find your location. Search your area below.', hi: 'लोकेशन नहीं मिली। नीचे अपना ज़िला चुनें।', ta: 'இருப்பிடம் கிடைக்கவில்லை. கீழே உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்.', kn: 'ನಿಮ್ಮ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಕೆಳಗೆ ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆರಿಸಿ.', ml: 'നിങ്ങളുടെ സ്ഥലം കണ്ടെത്താനായില്ല. താഴെ നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക.', te: 'మీ స్థానం కనుగొనబడలేదు. క్రింద మీ జిల్లాను ఎంచుకోండి.' })}
          </Notice>
        )}

        <p className="pt-2 text-xl font-bold text-slate-900">{L({ en: 'Or choose your area', hi: 'या अपना क्षेत्र चुनें', ta: 'அல்லது உங்கள் பகுதியைத் தேர்ந்தெடுங்கள்', kn: 'ಅಥವಾ ನಿಮ್ಮ ಪ್ರದೇಶವನ್ನು ಆರಿಸಿ', ml: 'അല്ലെങ്കിൽ നിങ്ങളുടെ പ്രദേശം തിരഞ്ഞെടുക്കുക', te: 'లేదా మీ ప్రాంతాన్ని ఎంచుకోండి' })}</p>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={inputCls}
          placeholder={L({ en: 'Search your village, town or area', hi: 'गाँव, शहर या इलाका खोजें', ta: 'கிராமம், ஊர் அல்லது பகுதியைத் தேடு', kn: 'ಹಳ್ಳಿ, ಊರು ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಹುಡುಕಿ', ml: 'ഗ്രാമം, പട്ടണം അല്ലെങ്കിൽ പ്രദേശം തിരയുക', te: 'గ్రామం, పట్టణం లేదా ప్రాంతాన్ని శోధించండి' })}
        />
        <div className="space-y-3" aria-live="polite">
          {q.length < 2 && <p className="text-lg text-slate-700">{L({ en: 'Type your village, town or area.', hi: 'अपना गाँव, शहर या इलाका लिखें।', ta: 'உங்கள் கிராமம், ஊர் அல்லது பகுதியை எழுதுங்கள்.', kn: 'ನಿಮ್ಮ ಹಳ್ಳಿ, ಊರು ಅಥವಾ ಪ್ರದೇಶವನ್ನು ಬರೆಯಿರಿ.', ml: 'നിങ്ങളുടെ ഗ്രാമം, പട്ടണം അല്ലെങ്കിൽ പ്രദേശം ടൈപ്പ് ചെയ്യുക.', te: 'మీ గ్రామం, పట్టణం లేదా ప్రాంతాన్ని టైప్ చేయండి.' })}</p>}
          {searching && <p className="text-lg text-slate-700">{L({ en: 'Searching...', hi: 'खोज रहे हैं...', ta: 'தேடுகிறோம்...', kn: 'ಹುಡುಕುತ್ತಿದ್ದೇವೆ...', ml: 'തിരയുന്നു...', te: 'వెతుకుతున్నాము...' })}</p>}
          {searchFailed && !searching && (
            <Notice tone="warn">{L({ en: 'The place search is busy. Try again in a moment.', hi: 'जगह की खोज अभी व्यस्त है। थोड़ी देर में फिर कोशिश करें।', ta: 'இடத் தேடல் பிஸியாக உள்ளது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.', kn: 'ಸ್ಥಳದ ಹುಡುಕಾಟ ಬ್ಯುಸಿಯಾಗಿದೆ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', ml: 'സ്ഥല തിരച്ചിൽ തിരക്കിലാണ്. അൽപ്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.', te: 'స్థల శోధన బిజీగా ఉంది. కొంత సేపటి తర్వాత మళ్లీ ప్రయత్నించండి.' })}</Notice>
          )}
          {q.length >= 2 && !searching && !searchFailed && places.length === 0 && (
            <p className="text-lg text-slate-700">{L({ en: 'No place found. Try another spelling, or a bigger town nearby.', hi: 'कोई जगह नहीं मिली। दूसरी वर्तनी या पास का बड़ा शहर आज़माएँ।', ta: 'இடம் கிடைக்கவில்லை. வேறு எழுத்துப்பிழை அல்லது அருகிலுள்ள பெரிய ஊரை முயற்சிக்கவும்.', kn: 'ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಕಾಗುಣಿತ ಅಥವಾ ಹತ್ತಿರದ ದೊಡ್ಡ ಊರನ್ನು ಪ್ರಯತ್ನಿಸಿ.', ml: 'സ്ഥലം കണ്ടില്ല. മറ്റൊരു അക്ഷരവിന്യാസം അല്ലെങ്കിൽ അടുത്തുള്ള വലിയ പട്ടണം പരീക്ഷിക്കുക.', te: 'స్థలం కనుగొనబడలేదు. వేరే స్పెల్లింగ్ లేదా దగ్గరలోని పెద్ద పట్టణాన్ని ప్రయత్నించండి.' })}</p>
          )}
          {places.map((p) => (
            <button
              key={`${p.name}-${p.lat}-${p.lng}`} onClick={() => choose(p)}
              className="min-h-16 w-full rounded-2xl border-2 border-slate-400 bg-white px-4 py-2 text-left active:bg-teal-50"
            >
              <span className="block text-xl font-bold text-slate-900">{p.name}</span>
              <span className="block text-base text-slate-700">{p.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
};
