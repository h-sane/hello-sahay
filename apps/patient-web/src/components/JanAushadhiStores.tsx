import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Store } from 'lucide-react';
import { Language, UserCoordinates } from '../types';
import { api, ApiJanAushadhiStore } from '../services/api';
import { BigButton, Card, Notice, Spinner, pick } from './ui';

interface Props {
  lang: Language;
  coords: UserCoordinates | null;
  onOpenLocationSelector: () => void;
}

export const JanAushadhiStores: React.FC<Props> = ({ lang, coords, onOpenLocationSelector }) => {
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(lang, o);
  const [stores, setStores] = useState<ApiJanAushadhiStore[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const find = async () => {
    if (!coords) return onOpenLocationSelector();
    setBusy(true);
    setFailed(false);
    try {
      setStores(await api.nearbyJanAushadhi(coords));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card tone="teal">
      <p className="text-xl font-extrabold text-teal-950">
        {L({ en: 'Where to buy at the Jan Aushadhi price', hi: 'जन औषधि कीमत पर कहाँ खरीदें', ta: 'ஜன் ஔஷதி விலையில் எங்கே வாங்குவது', kn: 'ಜನ್ ಔಷಧಿ ಬೆಲೆಯಲ್ಲಿ ಎಲ್ಲಿ ಖರೀದಿಸಬೇಕು', ml: 'ജൻ ഔഷധി വിലയിൽ എവിടെ വാങ്ങാം', te: 'జన్ ఔషధి ధరకు ఎక్కడ కొనాలి' })}
      </p>
      <p className="mt-2 text-lg text-slate-800">
        {L({
          en: 'Jan Aushadhi Kendras are government medicine stores that sell generic medicines (same contents, no brand name) at low fixed prices. Ask your doctor if the generic is right for you, then buy it there.',
          hi: 'जन औषधि केंद्र सरकारी दवा की दुकानें हैं, जहाँ जेनेरिक दवाएँ (वही सामग्री, बिना ब्रांड नाम) कम तय कीमत पर मिलती हैं। अपने डॉक्टर से पूछें कि जेनेरिक दवा आपके लिए ठीक है या नहीं, फिर वहाँ से खरीदें।',
          ta: 'ஜன் ஔஷதி கேந்திரங்கள் அரசு மருந்துக் கடைகள்; இங்கே ஜெனரிக் மருந்துகள் (அதே உள்ளடக்கம், பிராண்ட் பெயர் இல்லாமல்) குறைந்த நிலையான விலையில் கிடைக்கும். உங்களுக்கு ஜெனரிக் சரியா என்று மருத்துவரிடம் கேட்டு, பிறகு அங்கே வாங்குங்கள்.',
          kn: 'ಜನ್ ಔಷಧಿ ಕೇಂದ್ರಗಳು ಸರ್ಕಾರಿ ಔಷಧ ಅಂಗಡಿಗಳು; ಇಲ್ಲಿ ಜೆನೆರಿಕ್ ಔಷಧಗಳು (ಅದೇ ಅಂಶಗಳು, ಬ್ರಾಂಡ್ ಹೆಸರಿಲ್ಲದೆ) ಕಡಿಮೆ ನಿಗದಿತ ಬೆಲೆಗೆ ಸಿಗುತ್ತವೆ. ಜೆನೆರಿಕ್ ನಿಮಗೆ ಸರಿಯೇ ಎಂದು ವೈದ್ಯರನ್ನು ಕೇಳಿ, ನಂತರ ಅಲ್ಲಿ ಖರೀದಿಸಿ.',
          ml: 'ജൻ ഔഷധി കേന്ദ്രങ്ങൾ സർക്കാർ മരുന്നുകടകളാണ്; ഇവിടെ ജനറിക് മരുന്നുകൾ (അതേ ഘടകങ്ങൾ, ബ്രാൻഡ് പേരില്ലാതെ) കുറഞ്ഞ നിശ്ചിത വിലയ്ക്ക് കിട്ടും. ജനറിക് നിങ്ങൾക്ക് ശരിയാണോ എന്ന് ഡോക്ടറോട് ചോദിച്ച ശേഷം അവിടെ നിന്ന് വാങ്ങൂ.',
          te: 'జన్ ఔషధి కేంద్రాలు ప్రభుత్వ మందుల దుకాణాలు; ఇక్కడ జనరిక్ మందులు (అవే పదార్థాలు, బ్రాండ్ పేరు లేకుండా) తక్కువ నిర్ణీత ధరకు దొరుకుతాయి. జనరిక్ మీకు సరిపోతుందా అని డాక్టర్‌ను అడిగి, తర్వాత అక్కడ కొనండి.',
        })}
      </p>
      <div className="mt-4">
        <BigButton onClick={find} busy={busy} icon={coords ? <Store className="w-7 h-7" /> : <MapPin className="w-7 h-7" />}>
          {coords
            ? L({ en: 'Find the nearest store', hi: 'सबसे पास की दुकान खोजें', ta: 'அருகிலுள்ள கடையைத் தேடு', kn: 'ಹತ್ತಿರದ ಅಂಗಡಿ ಹುಡುಕಿ', ml: 'അടുത്തുള്ള കട കണ്ടെത്തൂ', te: 'దగ్గరి దుకాణాన్ని వెతకండి' })
            : L({ en: 'Set my location to find a store', hi: 'दुकान खोजने के लिए अपनी जगह चुनें', ta: 'கடையைத் தேட உங்கள் இடத்தைத் தேர்வு செய்யுங்கள்', kn: 'ಅಂಗಡಿ ಹುಡುಕಲು ನಿಮ್ಮ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ', ml: 'കട കണ്ടെത്താൻ നിങ്ങളുടെ സ്ഥലം തിരഞ്ഞെടുക്കൂ', te: 'దుకాణం వెతకడానికి మీ స్థానాన్ని ఎంచుకోండి' })}
        </BigButton>
      </div>
      {busy && <Spinner label={L({ en: 'Looking for stores near you…', hi: 'आपके पास की दुकानें खोज रहे हैं…', ta: 'அருகிலுள்ள கடைகளைத் தேடுகிறோம்…', kn: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಅಂಗಡಿಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇವೆ…', ml: 'അടുത്തുള്ള കടകൾ തിരയുന്നു…', te: 'మీ దగ్గరి దుకాణాలను వెతుకుతున్నాము…' })} />}
      {failed && (
        <div className="mt-4">
          <Notice tone="error">{L({ en: 'Could not look up stores right now. Please try again in a minute.', hi: 'अभी दुकानें नहीं खोजी जा सकीं। एक मिनट बाद फिर कोशिश करें।', ta: 'இப்போது கடைகளைத் தேட முடியவில்லை. ஒரு நிமிடம் கழித்து மீண்டும் முயற்சிக்கவும்.', kn: 'ಈಗ ಅಂಗಡಿಗಳನ್ನು ಹುಡುಕಲು ಆಗಲಿಲ್ಲ. ಒಂದು ನಿಮಿಷದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', ml: 'ഇപ്പോൾ കടകൾ തിരയാൻ കഴിഞ്ഞില്ല. ഒരു മിനിറ്റിനു ശേഷം വീണ്ടും ശ്രമിക്കൂ.', te: 'ఇప్పుడు దుకాణాలను వెతకలేకపోయాము. ఒక నిమిషం తర్వాత మళ్లీ ప్రయత్నించండి.' })}</Notice>
        </div>
      )}
      {stores && stores.length === 0 && (
        <div className="mt-4">
          <Notice tone="info">{L({ en: 'No Jan Aushadhi store is listed near you on the map yet. Ask at your nearest government hospital; many have one inside.', hi: 'आपके पास नक्शे पर कोई जन औषधि दुकान दर्ज नहीं है। अपने नज़दीकी सरकारी अस्पताल में पूछें; कई में एक दुकान होती है।', ta: 'உங்களுக்கு அருகில் வரைபடத்தில் ஜன் ஔஷதி கடை பதிவாகவில்லை. அருகிலுள்ள அரசு மருத்துவமனையில் கேளுங்கள்; பலவற்றில் ஒன்று உள்ளது.', kn: 'ನಿಮ್ಮ ಹತ್ತಿರ ನಕ್ಷೆಯಲ್ಲಿ ಜನ್ ಔಷಧಿ ಅಂಗಡಿ ಪಟ್ಟಿಯಾಗಿಲ್ಲ. ಹತ್ತಿರದ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಕೇಳಿ; ಹಲವರಲ್ಲಿ ಒಂದಿರುತ್ತದೆ.', ml: 'നിങ്ങളുടെ അടുത്ത് മാപ്പിൽ ജൻ ഔഷധി കട ലിസ്റ്റ് ചെയ്തിട്ടില്ല. അടുത്തുള്ള സർക്കാർ ആശുപത്രിയിൽ ചോദിക്കൂ; പലതിലും ഒരെണ്ണമുണ്ട്.', te: 'మీ దగ్గర మ్యాప్‌లో జన్ ఔషధి దుకాణం నమోదు కాలేదు. దగ్గరి ప్రభుత్వ ఆసుపత్రిలో అడగండి; చాలా వాటిలో ఒకటి ఉంటుంది.' })}</Notice>
        </div>
      )}
      {stores && stores.length > 0 && (
        <ul className="mt-4 space-y-3">
          {stores.map((s) => (
            <li key={`${s.name}${s.lat}${s.lng}`} className="rounded-2xl border-2 border-teal-200 bg-white p-4">
              <p className="text-xl font-extrabold text-slate-900">{s.name}</p>
              <p className="text-lg font-bold text-teal-900">{s.distance_km} km</p>
              {s.address && <p className="text-base text-slate-700">{s.address}</p>}
              {s.opening_hours && <p className="text-base text-slate-700">{s.opening_hours}</p>}
              <div className={`mt-3 grid gap-3 ${s.phone ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {s.phone && (
                  <BigButton small variant="secondary" href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} icon={<Phone className="w-5 h-5" />}>
                    {L({ en: 'Call', hi: 'कॉल', ta: 'அழை', kn: 'ಕರೆ', ml: 'വിളിക്കുക', te: 'కాల్ చేయండి' })}
                  </BigButton>
                )}
                <BigButton small variant="secondary" href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} icon={<Navigation className="w-5 h-5" />}>
                  {L({ en: 'Directions', hi: 'रास्ता', ta: 'வழி', kn: 'ದಾರಿ', ml: 'വഴി', te: 'దారి' })}
                </BigButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
