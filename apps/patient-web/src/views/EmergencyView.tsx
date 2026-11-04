import React, { useState } from 'react';
import { MapPin, Phone, PhoneCall, Share2, UserRound } from 'lucide-react';
import { Language, UserCoordinates } from '../types';
import { hospitalService } from '../services/hospitalService';
import { useAppData } from '../components/AppData';
import { BigButton, Card, Sheet, pick } from '../components/ui';

interface EmergencyViewProps {
  currentLang: Language;
  userCoordinates?: UserCoordinates;
  onClose: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ currentLang, userCoordinates, onClose }) => {
  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(currentLang, o);
  const { contacts, family } = useAppData();
  const [shared, setShared] = useState(false);

  const contact = family.find((f) => f.phone);
  const hospital = hospitalService.getAll().find((h) => h.emergency24x7) || hospitalService.getAll()[0];
  const mapLink = userCoordinates ? `https://maps.google.com/?q=${userCoordinates.latitude},${userCoordinates.longitude}` : null;

  const shareLocation = async () => {
    if (!mapLink) return;
    try {
      if (navigator.share) await navigator.share({ title: 'My location', url: mapLink });
      else await navigator.clipboard.writeText(mapLink);
      setShared(true);
    } catch {
      /* the person closed the share sheet */
    }
  };

  return (
    <Sheet title={L({ en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்', kn: 'ತುರ್ತು', ml: 'അടിയന്തരം', te: 'అత్యవసరం' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xl font-semibold text-slate-900">
          {L({ en: 'If someone is in danger, call now.', hi: 'अगर किसी की जान को ख़तरा है तो अभी कॉल करें।', ta: 'யாருக்காவது ஆபத்து என்றால் உடனே அழையுங்கள்.', kn: 'ಯಾರಿಗಾದರೂ ಅಪಾಯವಿದ್ದರೆ ಈಗಲೇ ಕರೆ ಮಾಡಿ.', ml: 'ആർക്കെങ്കിലും അപകടമുണ്ടെങ്കിൽ ഉടൻ വിളിക്കുക.', te: 'ఎవరికైనా ప్రాణాపాయం ఉంటే, ఇప్పుడే కాల్ చేయండి.' })}
        </p>
        <BigButton variant="danger" href="tel:108" icon={<PhoneCall className="w-8 h-8" />}>
          {L({ en: 'Call 108 ambulance', hi: '108 एम्बुलेंस बुलाएँ', ta: '108 ஆம்புலன்ஸ் அழை', kn: '108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ', ml: '108 ആംബുലൻസ് വിളിക്കുക', te: '108 అంబులెన్స్‌కు కాల్ చేయండి' })}
        </BigButton>
        {contacts?.emergency && (
          <BigButton variant="danger" href={`tel:${contacts.emergency}`} icon={<Phone className="w-7 h-7" />}>
            {L({ en: 'Call Sahay emergency help', hi: 'सहाय आपातकालीन मदद', ta: 'சஹாய் அவசர உதவி', kn: 'ಸಹಾಯ್ ತುರ್ತು ಸಹಾಯ', ml: 'സഹായ് അടിയന്തര സഹായം', te: 'సహాయ్ అత్యవసర సహాయానికి కాల్ చేయండి' })}
          </BigButton>
        )}
        <BigButton variant="secondary" href="tel:112" icon={<Phone className="w-7 h-7" />}>
          {L({ en: 'Call 112', hi: '112 पर कॉल करें', ta: '112 அழை', kn: '112 ಗೆ ಕರೆ ಮಾಡಿ', ml: '112 വിളിക്കുക', te: '112 కు కాల్ చేయండి' })}
        </BigButton>

        {contact && (
          <BigButton variant="soft" href={`tel:${contact.phone}`} icon={<UserRound className="w-7 h-7" />}>
            {L({ en: `Call ${contact.name}`, hi: `${contact.name} को कॉल करें`, ta: `${contact.name} அவரை அழை`, kn: `${contact.name} ಅವರಿಗೆ ಕರೆ ಮಾಡಿ`, ml: `${contact.name}നെ വിളിക്കുക`, te: `${contact.name} కు కాల్ చేయండి` })}
          </BigButton>
        )}

        {hospital && (
          <Card>
            <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><MapPin className="w-6 h-6" aria-hidden />{L({ en: 'Nearest emergency hospital', hi: 'नज़दीकी आपातकालीन अस्पताल', ta: 'அருகிலுள்ள அவசர மருத்துவமனை', kn: 'ಹತ್ತಿರದ ತುರ್ತು ಆಸ್ಪತ್ರೆ', ml: 'അടുത്തുള്ള അടിയന്തര ആശുപത്രി', te: 'సమీప అత్యవసర ఆసుపత్రి' })}</p>
            <p className="text-2xl font-extrabold text-slate-900">{hospital.name}</p>
            {hospital.distanceKm > 0 && <p className="text-xl text-slate-700">{hospital.distanceKm.toFixed(1)} km</p>}
            <div className="mt-3">
              <BigButton
                small variant="secondary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              >
                {L({ en: 'Show the way', hi: 'रास्ता देखें', ta: 'வழியைக் காட்டு', kn: 'ದಾರಿ ತೋರಿಸಿ', ml: 'വഴി കാണിക്കുക', te: 'దారి చూపించండి' })}
              </BigButton>
            </div>
          </Card>
        )}

        {mapLink && (
          <BigButton variant="quiet" onClick={shareLocation} icon={<Share2 className="w-6 h-6" />}>
            {shared ? L({ en: 'Location shared', hi: 'लोकेशन भेज दी', ta: 'இருப்பிடம் பகிரப்பட்டது', kn: 'ಸ್ಥಳ ಕಳುಹಿಸಲಾಗಿದೆ', ml: 'ലൊക്കേഷൻ അയച്ചു', te: 'స్థానం పంపబడింది' }) : L({ en: 'Share my location', hi: 'मेरी लोकेशन भेजें', ta: 'என் இருப்பிடத்தைப் பகிர்', kn: 'ನನ್ನ ಸ್ಥಳ ಕಳುಹಿಸಿ', ml: 'എന്റെ ലൊക്കേഷൻ അയയ്ക്കുക', te: 'నా స్థానాన్ని భాగస్వామ్యం చేయండి' })}
          </BigButton>
        )}
      </div>
    </Sheet>
  );
};
