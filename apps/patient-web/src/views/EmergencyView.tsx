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
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);
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
    <Sheet title={L({ en: 'Emergency', hi: 'आपातकाल', ta: 'அவசரம்' })} closeLabel={L({ en: 'Close', hi: 'बंद करें', ta: 'மூடு' })} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xl font-semibold text-slate-900">
          {L({ en: 'If someone is in danger, call now.', hi: 'अगर किसी की जान को ख़तरा है तो अभी कॉल करें।', ta: 'யாருக்காவது ஆபத்து என்றால் உடனே அழையுங்கள்.' })}
        </p>
        <BigButton variant="danger" href="tel:108" icon={<PhoneCall className="w-8 h-8" />}>
          {L({ en: 'Call 108 ambulance', hi: '108 एम्बुलेंस बुलाएँ', ta: '108 ஆம்புலன்ஸ் அழை' })}
        </BigButton>
        {contacts?.emergency && (
          <BigButton variant="danger" href={`tel:${contacts.emergency}`} icon={<Phone className="w-7 h-7" />}>
            {L({ en: 'Call Sahay emergency help', hi: 'सहाय आपातकालीन मदद', ta: 'சஹாய் அவசர உதவி' })}
          </BigButton>
        )}
        <BigButton variant="secondary" href="tel:112" icon={<Phone className="w-7 h-7" />}>
          {L({ en: 'Call 112', hi: '112 पर कॉल करें', ta: '112 அழை' })}
        </BigButton>

        {contact && (
          <BigButton variant="soft" href={`tel:${contact.phone}`} icon={<UserRound className="w-7 h-7" />}>
            {L({ en: `Call ${contact.name}`, hi: `${contact.name} को कॉल करें`, ta: `${contact.name} அவரை அழை` })}
          </BigButton>
        )}

        {hospital && (
          <Card>
            <p className="flex items-center gap-2 text-lg font-bold text-slate-700"><MapPin className="w-6 h-6" aria-hidden />{L({ en: 'Nearest emergency hospital', hi: 'नज़दीकी आपातकालीन अस्पताल', ta: 'அருகிலுள்ள அவசர மருத்துவமனை' })}</p>
            <p className="text-2xl font-extrabold text-slate-900">{hospital.name}</p>
            {hospital.distanceKm > 0 && <p className="text-xl text-slate-700">{hospital.distanceKm.toFixed(1)} km</p>}
            <div className="mt-3">
              <BigButton
                small variant="secondary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              >
                {L({ en: 'Show the way', hi: 'रास्ता देखें', ta: 'வழியைக் காட்டு' })}
              </BigButton>
            </div>
          </Card>
        )}

        {mapLink && (
          <BigButton variant="quiet" onClick={shareLocation} icon={<Share2 className="w-6 h-6" />}>
            {shared ? L({ en: 'Location shared', hi: 'लोकेशन भेज दी', ta: 'இருப்பிடம் பகிரப்பட்டது' }) : L({ en: 'Share my location', hi: 'मेरी लोकेशन भेजें', ta: 'என் இருப்பிடத்தைப் பகிர்' })}
          </BigButton>
        )}
      </div>
    </Sheet>
  );
};
