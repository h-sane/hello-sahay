import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { Language, UserCoordinates, UserSettings } from '../types';
import { BigButton, Notice, SectionTitle, Sheet, Spinner, Title, pick, inputCls } from '../components/ui';
import { ApiError, api } from '../services/api';
import { ServiceProvider, patientApi } from '../services/patientApi';
import { ServiceBookings } from '../components/ServiceBookings';

interface ServicesViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  userCoordinates?: UserCoordinates | null;
  onOpenVoiceCall?: () => void;
  onOpenEmergency?: () => void;
}

type LangMap<T = string> = { en: T; hi: T; ta: T; kn: T; ml: T; te?: T };

export interface ServiceCategory {
  id: string;
  title: LangMap<string>;
  category: LangMap<string>;
  shortTag: LangMap<string>;
  description: LangMap<string>;
  features: LangMap<string[]>;
  apiCategory: string;
  image: string;
  priceEstimate: LangMap<string>;
  popular?: boolean;
}

const CATEGORIES_DATA: ServiceCategory[] = [
  {
    id: 'personal-care-taker',
    apiCategory: 'Personal Caretaker',
    title: {
      en: 'Personal Caretaker',
      hi: 'व्यक्तिगत देखभाल (केयरटेकर)',
      ta: 'தனிநபர் உதவியாளர் (கேர்டேக்கர்)',
      kn: 'ವೈಯಕ್ತಿಕ ಆರೈಕೆದಾರ (ಕೇರ್‌ಟೇಕರ್)',
      ml: 'വ്യക്തിഗത പരിചാരകൻ (കെയർടേക്കർ)',
    },
    category: {
      en: 'Healthcare & Eldercare',
      hi: 'स्वास्थ्य और बुजुर्गों की सेवा',
      ta: 'சுகாதாரம் & முதியோர் பராமரிப்பு',
      kn: 'ಆರೋಗ್ಯ ಮತ್ತು ಹಿರಿಯರ ಆರೈಕೆ',
      ml: 'ആരോഗ്യവും മുതിർന്നവരുടെ പരിചരണവും',
    },
    shortTag: {
      en: 'Elder Care',
      hi: 'बुजुर्ग सेवा',
      ta: 'முதியோர் நலம்',
      kn: 'ಹಿರಿಯರ ಆರೈಕೆ',
      ml: 'മുതിർന്നവർക്ക്',
    },
    description: {
      en: 'Trained attendants for elderly parents, post-surgery recovery, vitals tracking, feeding, mobility assistance, and bedside companionship at home.',
      hi: 'बुजुर्गों और मरीजों के लिए प्रशिक्षित सहायक — दवा समय पर देना, बीपी/शुगर जाँच, चलना-फिरना और घर पर चौबीसों घंटे देखभाल।',
      ta: 'முதியோர்கள் மற்றும் நோயாளிகளுக்கான பயிற்சி பெற்ற உதவியாளர்கள் — மருந்து வழங்குதல், நடைபயிற்சி உதவி மற்றும் அன்பான கவனிப்பு.',
      kn: 'ಹಿರಿಯರು ಮತ್ತು ರೋಗಿಗಳಿಗೆ ತರಬೇತಿ ಪಡೆದ ಪರಿಚಾರಕರು — ಔಷಧಿ ನೀಡುವುದು, ಬಿಪಿ/ಶುಗರ್ ತಪಾಸಣೆ ಮತ್ತು ಮನೆಯಲ್ಲಿ ಸಂಪೂರ್ಣ ಕಾಳಜಿ.',
      ml: 'മുതിർന്നവർക്കും രോഗികൾക്കും പരിശീലനം ലഭിച്ച പരിചാരകർ — മരുന്ന് നൽകൽ, നടത്ത സഹായം, വീട്ടിലെ പരിചരണം.',
    },
    features: {
      en: [
        'Daily Vitals & Medication Tracking',
        'Mobility & Bathing Assistance',
        '12-hour Day or 24/7 Full-time Care',
        'Police Verified & Background Checked',
      ],
      hi: [
        'दैनिक बीपी, शुगर और दवा की निगरानी',
        'नहलाने और चलने-फिरने में पूरी मदद',
        '12 घंटे या 24 घंटे की सेवा उपलब्ध',
        'सत्यापित और विश्वसनीय सहायक',
      ],
      ta: [
        'தினசரி உடல்நலம் மற்றும் மருந்து கண்காணிப்பு',
        'குளிப்பாட்டுதல் மற்றும் நடைபயிற்சி உதவி',
        '12 மணிநேரம் அல்லது 24 மணிநேர சேவை',
        'சரிபார்க்கப்பட்ட நம்பிக்கையான உதவியாளர்கள்',
      ],
      kn: [
        'ದೈನಂದಿನ ಬಿಪಿ, ಶುಗರ್ ಮತ್ತು ಔಷಧಿ ನಿಗಾ',
        'ಸ್ನಾನ ಮತ್ತು ಓಡಾಟಕ್ಕೆ ನೆರವು',
        '12 ಗಂಟೆ ಅಥವಾ 24 ಗಂಟೆಗಳ ಸೇವೆ',
        'ಪರಿಶೀಲಿಸಿದ ನಂಬಿಕಸ್ಥ ಆರೈಕೆದಾರರು',
      ],
      ml: [
        'പ്രതിദിന ബിപി, ഷുഗർ, മരുന്ന് നിരീക്ഷണം',
        'കുളിപ്പിക്കാനും നടക്കാനുമുള്ള സഹായം',
        '12 മണിക്കൂർ അല്ലെങ്കിൽ 24 മണിക്കൂർ സേവനം',
        'പരിശോധിച്ചുറപ്പിച്ച പരിചാരകർ',
      ],
    },
    image: '/images/personal-care-taker.png',
    priceEstimate: {
      en: '₹750 / day',
      hi: '₹750 / दिन',
      ta: '₹750 / நாள்',
      kn: '₹750 / ದಿನ',
      ml: '₹750 / ദിവസം',
    },

  },
  {
    id: 'house-cleaning',
    apiCategory: 'House Cleaning',
    title: {
      en: 'House Cleaning',
      hi: 'घर की गहरी सफ़ाई',
      ta: 'வீடு சுத்தம் செய்தல்',
      kn: 'ಮನೆ ಸ್ವಚ್ಛತೆ',
      ml: 'വീട് വൃത്തിയാക്കൽ',
    },
    category: {
      en: 'Hygiene & Sanitization',
      hi: 'स्वच्छता और सुरक्षा',
      ta: 'சுகாதாரம் & கிருமிநாசினி',
      kn: 'ನೈರ್ಮಲ್ಯ ಮತ್ತು ಸುರಕ್ಷತೆ',
      ml: 'ശുചിത്വവും അണുനശീകരണവും',
    },
    shortTag: {
      en: 'Deep Cleaning',
      hi: 'गहरी सफ़ाई',
      ta: 'ஆழ்ந்த சுத்தம்',
      kn: 'ಡೀಪ್ ಕ್ಲೀನಿಂಗ್',
      ml: 'ഡീപ് ക്ലീനിംഗ്',
    },
    description: {
      en: 'Hospital-grade sanitization, patient room dusting, floor mopping, kitchen disinfection, and deep washroom scrubbing for allergy-free recovery.',
      hi: 'मरीजों के कमरे का कीटाणुशोधन, बाथरूम और किचन की गहरी सफ़ाई ताकि घर पूरी तरह संक्रमण-मुक्त और स्वच्छ रहे।',
      ta: 'நோயாளி அறை கிருமி நீக்கம், சமையலறை மற்றும் கழிப்பறை ஆழமான சுத்தம் செய்து பாதுகாப்பான சூழலை உருவாக்குதல்.',
      kn: 'ರೋಗಿಯ ಕೋಣೆಯ ಸೋಂಕುರಹಿತಗೊಳಿಸುವಿಕೆ, ಅಡುಗೆಮನೆ ಮತ್ತು ಸ್ನಾನಗೃಹದ ಆಳವಾದ ಸ್ವಚ್ಛತೆ.',
      ml: 'രോഗിയുടെ മുറി അണുവിമുക്തമാക്കൽ, അടുക്കള, ബാത്ത്റൂം എന്നിവയുടെ സമഗ്രമായ ശുചീകരണം.',
    },
    features: {
      en: [
        'Patient Room Medical Sanitization',
        'Washroom & Kitchen Deep Scrubbing',
        'Safe, Odor-free Disinfectants',
        'Trained Professional Cleaning Staff',
      ],
      hi: [
        'मरीज़ के कमरे की विशेष सफाई',
        'शौचालय और रसोई की गहरी सफ़ाई',
        'सुरक्षित व गंधहीन कीटाणुनाशक',
        'अनुभवी सफाई कर्मचारी',
      ],
      ta: [
        'நோயாளி அறை சிறப்பு கிருமி நீக்கம்',
        'கழிவறை & சமையலறை ஆழ்ந்த சுத்தம்',
        'பாதுகாப்பான மணமற்ற கிருமிநாசினிகள்',
        'பயிற்சி பெற்ற துப்புரவு பணியாளர்கள்',
      ],
      kn: [
        'ರೋಗಿಯ ಕೋಣೆಗೆ ವಿಶೇಷ ನೈರ್ಮಲ್ಯ',
        'ಸ್ನಾನಗೃಹ ಮತ್ತು ಅಡುಗೆಮನೆ ಡೀಪ್ ಕ್ಲೀನಿಂಗ್',
        'ಸುರಕ್ಷಿತ ಸೋಂಕುನಿವಾರಕಗಳು',
        'ತರಬೇತಿ ಪಡೆದ ಸಿಬ್ಬಂದಿ',
      ],
      ml: [
        'രോഗിയുടെ മുറിയിലെ പ്രത്യേക ശുചിത്വം',
        'ബാത്ത്റൂം, അടുക്കള ഡീപ് ക്ലീനിംഗ്',
        'സുരക്ഷിതമായ അണുനാശിനികൾ',
        'പരിശീലനം ലഭിച്ച ജീവനക്കാർ',
      ],
    },
    image: '/images/house-cleaning.png',
    priceEstimate: {
      en: '₹3,999 / month',
      hi: '₹3,999 / महीना',
      ta: '₹3,999 / மாதம்',
      kn: '₹3,999 / ತಿಂಗಳು',
      ml: '₹3,999 / മാസം',
    },

  },
  {
    id: 'technical-support',
    apiCategory: 'Technical Support',
    title: {
      en: 'Technical Support',
      hi: 'तकनीकी सहायता',
      ta: 'தொழில்நுட்ப உதவி',
      kn: 'ತಾಂತ್ರಿಕ ಬೆಂಬಲ',
      ml: 'സാങ്കേതിക സഹായം',
    },
    category: {
      en: 'Smart Devices & Setup',
      hi: 'स्मार्ट डिवाइस और डिजिटल मदद',
      ta: 'டிஜிட்டல் சாதனங்கள் உதவி',
      kn: 'ಡಿಜಿಟಲ್ ಸಾಧನಗಳ ನೆರವು',
      ml: 'ഡിജിറ്റൽ ഉപകരണ സഹായം',
    },
    shortTag: {
      en: 'Device Help',
      hi: 'डिवाइस मदद',
      ta: 'கருவி உதவி',
      kn: 'ಸಾಧನಗಳ ನೆರವು',
      ml: 'ഉപകരണ സഹായം',
    },
    description: {
      en: 'Friendly doorstep technician to set up digital BP machines, glucometers, Wi-Fi routers, phone health apps, and troubleshooting family video calls.',
      hi: 'डिजिटल बीपी मशीन, शुगर मीटर, वाई-फाई और मोबाइल स्वास्थ्य ऐप चालू करने के लिए घर पर कुशल तकनीकी विशेषज्ञ।',
      ta: 'டிஜிட்டல் பிபி மிஷின், சர்க்கரை மானிட்டர், வைஃபை மற்றும் குடும்ப வீடியோ அழைப்புகளை அமைக்க வீட்டுக்கே வரும் தொழில்நுட்ப வல்லுநர்.',
      kn: 'ಡಿಜಿಟಲ್ ಬಿಪಿ ಯಂತ್ರ, ಶುಗರ್ ಮೀಟರ್, ವೈಫೈ ಮತ್ತು ಮೊಬೈಲ್ ಆರೋಗ್ಯ ಆ್ಯಪ್ ಸೆಟಪ್ ಮಾಡಲು ಮನೆ ಬಾಗಿಲಿಗೆ ತಂತ್ರಜ್ಞ.',
      ml: 'ഡിജിറ്റൽ ബിപി മെഷീൻ, ഷുഗർ മീറ്റർ, വൈഫൈ, മൊബൈൽ ഹെൽത്ത് ആപ്പ് എന്നിവ സജ്ജീകരിക്കാൻ സാങ്കേതിക വിദഗ്ദ്ധൻ.',
    },
    features: {
      en: [
        'Digital BP & Glucometer Calibration',
        'Smartphone App & WhatsApp Video Setup',
        'Home Wi-Fi & Smart TV Connectivity',
        'Patient-friendly Patient Tech Guidance',
      ],
      hi: [
        'डिजिटल बीपी और शुगर मीटर सेटअप',
        'स्मार्टफोन ऐप और वीडियो कॉल मदद',
        'घर का वाई-फाई व इंटरनेट कनेक्शन',
        'बुजुर्गों के लिए आसान तकनीकी सीख',
      ],
      ta: [
        'டிஜிட்டல் பிபி & சர்க்கரை அளவு கருவி அமைப்பு',
        'ஸ்மார்ட்போன் ஆப் & வீடியோ கால் உதவி',
        'வீட்டு வைஃபை இணைய இணைப்பு சரிசெய்தல்',
        'முதியோர்களுக்கு எளிதான பயிற்சி',
      ],
      kn: [
        'ಡಿಜಿಟಲ್ ಬಿಪಿ & ಶುಗರ್ ಮೀಟರ್ ಸೆಟಪ್',
        'ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಆ್ಯಪ್ ಮತ್ತು ವಿಡಿಯೋ ಕರೆ',
        'ಮನೆಯ ವೈ-ಫೈ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ',
        'ಹಿರಿಯರಿಗೆ ಸರಳ ತಾಂತ್ರಿಕ ಮಾರ್ಗದರ್ಶನ',
      ],
      ml: [
        'ഡിജിറ്റൽ ബിപി, ഷുഗർ മീറ്റർ സെറ്റപ്പ്',
        'സ്മാർട്ട്ഫോൺ ആപ്പ്, വീഡിയോ കോൾ സഹായം',
        'ഹോം വൈഫൈ ഇന്റർനെറ്റ് സജ്ജീകരണം',
        'ലളിതമായ സാങ്കേതിക മാർഗ്ഗനിർദ്ദേശം',
      ],
    },
    image: '/images/technical-support.png',
    priceEstimate: {
      en: '₹299 / visit',
      hi: '₹299 / विज़िट',
      ta: '₹299 / வருகை',
      kn: '₹299 / ಭೇಟಿ',
      ml: '₹299 / സന്ദർശനം',
    },

  },
];
const QUICK_NEEDS: LangMap<string>[] = [
  { en: 'Wheelchair Assistance', hi: 'व्हीलचेयर सहायता', ta: 'சக்கர நாற்காலி உதவி', kn: 'ವೀಲ್‌ಚೇರ್ ನೆರವು', ml: 'വീൽചെയർ സഹായം' },
  { en: 'Hospital Escort', hi: 'अस्पताल ले जाने वाला साथी', ta: 'மருத்துவமனை துணை', kn: 'ಆಸ್ಪತ್ರೆಗೆ ಜೊತೆಗಾರ', ml: 'ആശുപത്രി കൂട്ട്' },
  { en: 'Night Nurse Attendant', hi: 'रात की नर्स परिचारक', ta: 'இரவு நர்ஸ் உதவி', kn: 'ರಾತ್ರಿ ನರ್ಸ್ ನೆರವು', ml: 'രാത്രി നഴ്സ് പരിചരണം' },
  { en: 'Medicine Home Delivery', hi: 'दवा घर पहुँचाना', ta: 'மருந்து வீடு தேடி வர', kn: 'ಔಷಧಿ ಮನೆ ಬಾಗಿಲಿಗೆ', ml: 'മരുന്ന് ഹോം ഡെലിവറി' },
  { en: 'Home Blood Sample Collection', hi: 'घर पर खून की जाँच', ta: 'வீட்டில் ரத்தப் பரிசோதனை', kn: 'ಮನೆಯಲ್ಲೇ ರಕ್ತ ಪರೀಕ್ಷೆ', ml: 'വീട്ടിൽ രക്തപരിശോധന' },
];

const SLOT_OPTIONS: { id: 'morning' | 'afternoon' | 'evening'; label: LangMap<string> }[] = [
  { id: 'morning', label: { en: 'Morning', hi: 'सुबह', ta: 'காலை', kn: 'ಬೆಳಿಗ್ಗೆ', ml: 'രാവിലെ', te: 'ఉదయం' } },
  { id: 'afternoon', label: { en: 'Afternoon', hi: 'दोपहर', ta: 'மதியம்', kn: 'ಮಧ್ಯಾಹ್ನ', ml: 'ഉച്ചയ്ക്ക്', te: 'మధ్యాహ్నం' } },
  { id: 'evening', label: { en: 'Evening', hi: 'शाम', ta: 'மாலை', kn: 'ಸಂಜೆ', ml: 'വൈകുന്നേരം', te: 'సాయంత్రం' } },
];

const MONTH_NAMES: Partial<Record<Language, string[]>> & { en: string[] } = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
  ta: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'],
  kn: ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'],
  ml: ['ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മെയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'],
};

const WEEKDAY_NAMES: Partial<Record<Language, string[]>> & { en: string[] } = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
  kn: ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'],
  ml: ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'],
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  currentLang,
  userSettings,
  userCoordinates,
  onOpenVoiceCall,
}) => {
  const L = (o: LangMap<string>) => pick(currentLang, o);

  // Active category: null = 2x2 grid main page; otherwise shows the page with 4 people!
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // The patient's saved village, from their profile
  const [backendLocation, setBackendLocation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const phone = userSettings.userPhone;
    if (phone) {
      api.getPatient(phone)
        .then((res) => {
          if (!cancelled && res?.village) {
            setBackendLocation(res.village);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [userSettings.userPhone]);

  const effectiveRealLocation =
    backendLocation ||
    userSettings.villageTown ||
    userCoordinates?.districtDetected ||
    'Chennai & Chengalpattu, Tamil Nadu';

  const todayObj = new Date();
  const formatYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayIso = formatYmd(todayObj);
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowIso = formatYmd(tomorrowObj);

  // Modal State for service booking
  const [selectedPersonForBooking, setSelectedPersonForBooking] = useState<{
    person: ServiceProvider;
    category: string;
  } | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(tomorrowIso);
  const [calYear, setCalYear] = useState<number>(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(todayObj.getMonth());
  const [bookingSlot, setBookingSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [serviceAddress, setServiceAddress] = useState<string>(effectiveRealLocation);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingBusy, setBookingBusy] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string>('');

  // Helpers for the open category come from the server
  const [people, setPeople] = useState<ServiceProvider[]>([]);
  const [peopleState, setPeopleState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [peopleError, setPeopleError] = useState<string>('');
  const openCategory =
    activeCategory === 'describe-need' ? 'Care Support' : CATEGORIES_DATA.find((c) => c.id === activeCategory)?.apiCategory ?? null;

  useEffect(() => {
    if (!openCategory) return;
    let cancelled = false;
    setPeopleState('loading');
    patientApi
      .serviceProviders(openCategory)
      .then((rows) => {
        if (cancelled) return;
        setPeople(rows);
        setPeopleState('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        setPeopleError(e instanceof ApiError ? e.message : String(e));
        setPeopleState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [openCategory]);

  // Custom request state
  const [customNeedText, setCustomNeedText] = useState<string>('');
  const [customSubmitted, setCustomSubmitted] = useState<boolean>(false);
  const [customSubmitting, setCustomSubmitting] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string>('');
  const [customDay, setCustomDay] = useState<'today' | 'tomorrow'>('tomorrow');
  const [customSlot, setCustomSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // Month Calendar Navigation Helpers
  const canGoPrevMonth =
    calYear > todayObj.getFullYear() ||
    (calYear === todayObj.getFullYear() && calMonth > todayObj.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (calMonth === 0) {
      setCalYear(calYear - 1);
      setCalMonth(11);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear(calYear + 1);
      setCalMonth(0);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const startingWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const formatFriendlyDate = (iso: string) => {
    if (!iso) return '';
    if (iso === todayIso) {
      return `${L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'ഇന്ന്' })} (${new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    }
    if (iso === tomorrowIso) {
      return `${L({ en: 'Tomorrow', hi: 'कल', ta: 'நாளை', kn: 'ನಾಳೆ', ml: 'നാളെ' })} (${new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    }
    const [y, m, d] = iso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(currentLang === 'en' ? 'en-IN' : currentLang, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleOpenBooking = (person: ServiceProvider, category: string) => {
    setSelectedPersonForBooking({ person, category });
    setBookingSuccess(false);
    setBookingError('');
    setBookingDate(tomorrowIso);
    setBookingSlot('morning');
    setServiceAddress(effectiveRealLocation);
    setCustomerNotes('');
    setCalYear(todayObj.getFullYear());
    setCalMonth(todayObj.getMonth());
  };

  const errorText = (e: unknown) =>
    e instanceof ApiError
      ? e.message
      : L({ en: 'Something went wrong. Please try again.', hi: 'कुछ गड़बड़ हुई। फिर से कोशिश करें।', ta: 'ஏதோ தவறு நடந்தது. மீண்டும் முயலவும்.', kn: 'ಏನೋ ತೊಂದರೆಯಾಯಿತು. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', ml: 'എന്തോ പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.', te: 'ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.' });

  const handleConfirmBooking = async () => {
    if (!selectedPersonForBooking || bookingBusy) return;
    setBookingBusy(true);
    setBookingError('');
    try {
      await patientApi.bookService({
        helper_id: selectedPersonForBooking.person.id,
        service_category: selectedPersonForBooking.category,
        service_title: selectedPersonForBooking.category,
        booking_date: bookingDate,
        slot: bookingSlot,
        location_address: serviceAddress.trim(),
        customer_notes: customerNotes.trim() || undefined,
      });
      setBookingSuccess(true);
    } catch (e) {
      setBookingError(errorText(e));
    } finally {
      setBookingBusy(false);
    }
  };

  const handleCustomSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNeedText.trim() || customSubmitting) return;
    setCustomSubmitting(true);
    setCustomError('');
    try {
      await patientApi.bookService({
        helper_id: null,
        service_category: 'Custom request',
        service_title: 'Custom request',
        description: customNeedText.trim(),
        booking_date: customDay === 'today' ? todayIso : tomorrowIso,
        slot: customSlot,
        location_address: serviceAddress.trim(),
      });
      setCustomSubmitted(true);
    } catch (err) {
      setCustomError(errorText(err));
    } finally {
      setCustomSubmitting(false);
    }
  };

  const currentCategoryData = CATEGORIES_DATA.find((c) => c.id === activeCategory);

  // ==========================================
  // DETAIL PAGE: "MORE PEOPLE LIKE THEM" (4 PEOPLE)
  // ==========================================
  if (activeCategory !== null) {
    const isCustomNeedCategory = activeCategory === 'describe-need';
    const categoryTitle = isCustomNeedCategory
      ? L({
          en: 'Describe What You Need & Local Coordinators',
          hi: 'अपनी जरूरत बताएँ और स्थानीय समन्वयक',
          ta: 'உங்களுக்கு என்ன உதவி & உள்ளூர் ஒருங்கிணைப்பாளர்கள்',
          kn: 'ನಿಮ್ಮ ಅಗತ್ಯವನ್ನು ತಿಳಿಸಿ & ಸ್ಥಳೀಯ ಸಂಯೋಜಕರು',
          ml: 'ആവശ്യങ്ങൾ വ്യക്തമാക്കുക & കോർഡിനേറ്റർമാർ',
        })
      : currentCategoryData
      ? pick(currentLang, currentCategoryData.title)
      : '';

    return (
      <div className="space-y-6">
        {/* Sticky Top Back Bar so elderly users never lose the back button */}
        <div className="sticky top-16 z-30 bg-[#FBFBFA]/95 backdrop-blur py-2.5 -mx-5 px-5 border-b-2 border-slate-200">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center gap-3 rounded-2xl border-2 border-teal-800 bg-white px-5 py-3 text-xl font-extrabold text-teal-900 shadow-sm active:bg-teal-50"
          >
            <ArrowLeft className="w-7 h-7" />
            <span>
              {L({
                en: 'Back to all services',
                hi: 'सभी सेवाओं पर वापस',
                ta: 'அனைத்து சேவைகளுக்கும் திரும்பு',
                kn: 'ಎಲ್ಲಾ ಸೇವೆಗಳಿಗೆ ಹಿಂತಿರುಗಿ',
                ml: 'എല്ലാ സേവനങ്ങളിലേക്കും മടങ്ങുക',
              })}
            </span>
          </button>
        </div>

        {/* Page Header with High Contrast and Big Fonts */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            {categoryTitle}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-slate-700">
            {L({ en: 'ID-checked helpers you can book for a home visit', hi: 'घर आने के लिए बुक कर सकने वाले आईडी-जाँचे सहायक', ta: 'வீட்டிற்கு வர முன்பதிவு செய்யக்கூடிய அடையாளம் சரிபார்க்கப்பட்ட உதவியாளர்கள்', kn: 'ಮನೆ ಭೇಟಿಗೆ ಬುಕ್ ಮಾಡಬಹುದಾದ ಗುರುತು ಪರಿಶೀಲಿಸಿದ ಸಹಾಯಕರು', ml: 'വീട്ടിലെത്താൻ ബുക്ക് ചെയ്യാവുന്ന തിരിച്ചറിയൽ പരിശോധിച്ച സഹായികൾ', te: 'ఇంటికి రావడానికి బుక్ చేయగల ID తనిఖీ చేసిన సహాయకులు' })}
          </p>
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2.5 border-2 border-teal-200 text-teal-950 text-lg font-extrabold shadow-sm">
            <MapPin className="w-6 h-6 text-teal-800 shrink-0" />
            <span>{effectiveRealLocation}</span>
          </div>
        </div>

        {/* IF CUSTOM NEED CATEGORY: SHOW FORM FIRST, THEN 4 PEOPLE */}
        {isCustomNeedCategory && (
          <section className="overflow-hidden rounded-3xl border-2 border-teal-800 bg-gradient-to-b from-teal-50 to-white p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-800 rounded-2xl text-white">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {L({
                    en: 'Type your custom requirement',
                    hi: 'अपनी विशेष आवश्यकता यहाँ लिखें',
                    ta: 'உங்கள் தேவையை இங்கே எழுதவும்',
                    kn: 'ನಿಮ್ಮ ಅಗತ್ಯವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ',
                    ml: 'നിങ്ങളുടെ ആവശ്യം ഇവിടെ എഴുതുക',
                  })}
                </h3>
                <p className="text-lg text-slate-700 font-semibold">
                  {L({ en: 'Describe what you need. A helper who can do it will accept your request.', hi: 'अपनी ज़रूरत बताइए। कोई उपयुक्त सहायक आपका अनुरोध स्वीकार करेगा।', ta: 'உங்கள் தேவையைச் சொல்லுங்கள். பொருத்தமான உதவியாளர் உங்கள் கோரிக்கையை ஏற்பார்.', kn: 'ನಿಮ್ಮ ಅಗತ್ಯವನ್ನು ತಿಳಿಸಿ. ಸೂಕ್ತ ಸಹಾಯಕರು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಒಪ್ಪುತ್ತಾರೆ.', ml: 'നിങ്ങളുടെ ആവശ്യം പറയൂ. അനുയോജ്യനായ സഹായി അഭ്യർത്ഥന സ്വീകരിക്കും.', te: 'మీకు ఏమి కావాలో చెప్పండి. తగిన సహాయకుడు మీ అభ్యర్థనను అంగీకరిస్తారు.' })}
                </p>
              </div>
            </div>

            {customSubmitted ? (
              <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-400 p-6 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-extrabold text-emerald-950">
                  {L({ en: 'Request sent', hi: 'अनुरोध भेजा गया', ta: 'கோரிக்கை அனுப்பப்பட்டது', kn: 'ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ', ml: 'അഭ്യർത്ഥന അയച്ചു', te: 'అభ్యర్థన పంపబడింది' })}
                </h4>
                <p className="text-lg text-emerald-900 font-bold">
                  {L({ en: 'A helper will accept it soon. You can follow it under "Your bookings".', hi: 'कोई सहायक जल्द स्वीकार करेगा। आप इसे "आपकी बुकिंग" में देख सकते हैं।', ta: 'ஒரு உதவியாளர் விரைவில் ஏற்பார். "உங்கள் முன்பதிவுகள்" பகுதியில் பார்க்கலாம்.', kn: 'ಸಹಾಯಕರು ಶೀಘ್ರದಲ್ಲೇ ಒಪ್ಪುತ್ತಾರೆ. "ನಿಮ್ಮ ಬುಕಿಂಗ್‌ಗಳು" ನಲ್ಲಿ ನೋಡಬಹುದು.', ml: 'ഒരു സഹായി ഉടൻ സ്വീകരിക്കും. "നിങ്ങളുടെ ബുക്കിംഗുകൾ" എന്നതിൽ കാണാം.', te: 'ఒక సహాయకుడు త్వరలో అంగీకరిస్తారు. "మీ బుకింగ్‌లు" లో చూడవచ్చు.' })}
                </p>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {QUICK_NEEDS.map((chip, idx) => {
                    const text = pick(currentLang, chip);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomNeedText((prev) => (prev ? `${prev}, ${text}` : text))}
                        className="rounded-full border border-teal-300 bg-white px-4 py-2 text-base font-bold text-teal-900 hover:bg-teal-50 active:scale-95 transition-all shadow-sm"
                      >
                        + {text}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={customNeedText}
                  onChange={(e) => setCustomNeedText(e.target.value)}
                  placeholder={L({
                    en: 'e.g. Need someone to help my father walk to the clinic tomorrow morning...',
                    hi: 'उदा. कल सुबह पिताजी को क्लिनिक ले जाने के लिए सहायक चाहिए...',
                    ta: 'உதா: நாளை காலை தந்தையை மருத்துவமனைக்கு அழைத்துச் செல்ல உதவியாளர் தேவை...',
                    kn: 'ಉದಾ: ನಾಳೆ ಬೆಳಿಗ್ಗೆ ತಂದೆಯನ್ನು ಕ್ಲಿನಿಕ್‌ಗೆ ಕರೆದೊಯ್ಯಲು ಸಹಾಯ ಬೇಕು...',
                    ml: 'ഉദാ: നാളെ രാവിലെ അച്ഛനെ ക്ലിനിക്കിൽ കൊണ്ടുപോകാൻ സഹായി വേണം...',
                  })}
                  className="w-full min-h-32 rounded-2xl border-2 border-slate-300 bg-white p-4 text-xl text-slate-900 placeholder:text-slate-400 focus:border-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-800/20"
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-2">
                  {(['today', 'tomorrow'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomDay(d)}
                      className={`h-12 rounded-2xl border-2 font-bold text-base transition-all ${
                          customDay === d
                            ? 'border-teal-800 bg-teal-800 text-white'
                            : 'border-slate-300 bg-white text-slate-800 active:bg-slate-100'
                        }`}
                    >
                      {d === 'today'
                        ? L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'ഇന്ന്', te: 'ఈ రోజు' })
                        : L({ en: 'Tomorrow', hi: 'कल', ta: 'நாளை', kn: 'ನಾಳೆ', ml: 'നാളെ', te: 'రేపు' })}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SLOT_OPTIONS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setCustomSlot(slot.id)}
                      className={`h-12 rounded-2xl border-2 font-bold text-base transition-all ${
                          customSlot === slot.id
                            ? 'border-teal-800 bg-teal-800 text-white'
                            : 'border-slate-300 bg-white text-slate-800 active:bg-slate-100'
                        }`}
                    >
                      {L(slot.label)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  aria-label={L({ en: 'Home address', hi: 'घर का पता', ta: 'வீட்டு முகவரி', kn: 'ಮನೆಯ ವಿಳಾಸ', ml: 'വീട്ടു വിലാസം', te: 'ఇంటి చిరునామా' })}
                  placeholder={L({ en: 'Home address with door number and street', hi: 'मकान नंबर और गली सहित घर का पता', ta: 'கதவு எண் மற்றும் தெருவுடன் வீட்டு முகவரி', kn: 'ಮನೆ ಸಂಖ್ಯೆ ಮತ್ತು ರಸ್ತೆಯೊಂದಿಗೆ ವಿಳಾಸ', ml: 'വീട്ടുനമ്പറും റോഡും സഹിതം വിലാസം', te: 'ఇంటి నంబర్ మరియు వీధితో చిరునామా' })}
                  className={inputCls}
                />
                {customError && <Notice tone="error">{customError}</Notice>}

                <div className="space-y-3">
                  <BigButton
                    type="submit"
                    disabled={!customNeedText.trim() || serviceAddress.trim().length < 3 || customSubmitting}
                    busy={customSubmitting}
                    icon={<Send className="w-6 h-6" />}
                  >
                    {L({
                      en: 'Send My Request',
                      hi: 'अनुरोध भेजें',
                      ta: 'கோரிக்கையை அனுப்பு',
                      kn: 'ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಿ',
                      ml: 'അഭ്യർത്ഥന അയക്കുക',
                    })}
                  </BigButton>
                </div>
              </form>
            )}

            <div className="pt-2">
              <SectionTitle>
                {L({ en: 'Or pick a coordinator', hi: 'या कोई समन्वयक चुनें', ta: 'அல்லது ஒருங்கிணைப்பாளரைத் தேர்ந்தெடுக்கவும்', kn: 'ಅಥವಾ ಸಂಯೋಜಕರನ್ನು ಆರಿಸಿ', ml: 'അല്ലെങ്കിൽ ഒരു കോർഡിനേറ്ററെ തിരഞ്ഞെടുക്കുക', te: 'లేదా ఒక సమన్వయకర్తను ఎంచుకోండి' })}
              </SectionTitle>
            </div>
          </section>
        )}

        {/* Helpers from the server */}
        <div className="space-y-5">
          {peopleState === 'loading' && (
            <Spinner label={L({ en: 'Finding helpers...', hi: 'सहायक खोज रहे हैं...', ta: 'உதவியாளர்களைத் தேடுகிறோம்...', kn: 'ಸಹಾಯಕರನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇವೆ...', ml: 'സഹായികളെ തിരയുന്നു...', te: 'సహాయకులను వెతుకుతున్నాము...' })} />
          )}
          {peopleState === 'error' && <Notice tone="error">{peopleError}</Notice>}
          {peopleState === 'ready' && people.length === 0 && (
            <Notice tone="info">
              {L({ en: 'No helpers are listed for this service yet. Please check again soon.', hi: 'इस सेवा के लिए अभी कोई सहायक सूचीबद्ध नहीं है। कृपया थोड़ी देर में फिर देखें।', ta: 'இந்தச் சேவைக்கு இன்னும் உதவியாளர்கள் இல்லை. சிறிது நேரம் கழித்துப் பாருங்கள்.', kn: 'ಈ ಸೇವೆಗೆ ಇನ್ನೂ ಸಹಾಯಕರಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ನೋಡಿ.', ml: 'ഈ സേവനത്തിന് ഇതുവരെ സഹായികളില്ല. അൽപ്പം കഴിഞ്ഞ് നോക്കുക.', te: 'ఈ సేవకు ఇంకా సహాయకులు లేరు. కొంత సమయం తర్వాత చూడండి.' })}
            </Notice>
          )}
          {peopleState === 'ready' &&
            people.map((person) => (
              <section
                key={person.id}
                className="overflow-hidden rounded-3xl border-2 border-slate-300 bg-white p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-100 border-2 border-slate-300 overflow-hidden shrink-0 flex items-start justify-center pt-1 shadow-inner">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} className="h-full w-full object-cover object-top scale-105 origin-top" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white">
                        <User className="w-14 h-14" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded-full bg-emerald-700 text-white p-1 shadow">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{person.name}</h2>
                      {person.demo && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700 border border-slate-300">
                          {L({ en: 'Demo profile', hi: 'डेमो प्रोफ़ाइल', ta: 'டெமோ சுயவிவரம்', kn: 'ಡೆಮೋ ಪ್ರೊಫೈಲ್', ml: 'ഡെമോ പ്രൊഫൈൽ', te: 'డెమో ప్రొఫైల్' })}
                        </span>
                      )}
                    </div>
                    {person.description && <p className="text-xl font-black text-teal-900">{person.description}</p>}
                    <p className="text-lg font-bold text-slate-700">
                      {L({ en: `${person.experience_years} yrs experience`, hi: `${person.experience_years} वर्ष का अनुभव`, ta: `${person.experience_years} ஆண்டுகள் அனுபவம்`, kn: `${person.experience_years} ವರ್ಷಗಳ ಅನುಭವ`, ml: `${person.experience_years} വർഷത്തെ പരിചയം`, te: `${person.experience_years} సంవత్సరాల అనుభవం` })}
                      {person.languages.length > 0 && ` · ${person.languages.join(', ')}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-base font-bold text-slate-700">
                      <span className="flex items-center gap-1 text-amber-700">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span>
                          {person.rating} ({L({ en: `${person.jobs_done} jobs done`, hi: `${person.jobs_done} काम पूरे`, ta: `${person.jobs_done} வேலைகள் முடிந்தன`, kn: `${person.jobs_done} ಕೆಲಸ ಮುಗಿದಿದೆ`, ml: `${person.jobs_done} ജോലികൾ പൂർത്തിയായി`, te: `${person.jobs_done} పనులు పూర్తయ్యాయి` })})
                        </span>
                      </span>
                      <span>•</span>
                      <span className={person.online ? 'text-emerald-800 font-black' : 'text-slate-600 font-black'}>
                        {person.online
                          ? L({ en: 'Taking bookings', hi: 'बुकिंग ले रहे हैं', ta: 'முன்பதிவு ஏற்கிறார்', kn: 'ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸುತ್ತಿದ್ದಾರೆ', ml: 'ബുക്കിംഗ് സ്വീകരിക്കുന്നു', te: 'బుకింగ్‌లు తీసుకుంటున్నారు' })
                          : L({ en: 'Not taking bookings now', hi: 'अभी बुकिंग नहीं ले रहे', ta: 'இப்போது முன்பதிவு இல்லை', kn: 'ಈಗ ಬುಕಿಂಗ್ ಇಲ್ಲ', ml: 'ഇപ്പോൾ ബുക്കിംഗ് ഇല്ല', te: 'ఇప్పుడు బుకింగ్‌లు లేవు' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl bg-teal-50 border-2 border-teal-600 p-4">
                  <span className="text-lg font-black text-slate-700">
                    {L({ en: 'Fee / Rate', hi: 'शुल्क', ta: 'கட்டணம்', kn: 'ಶುಲ್ಕ', ml: 'നിരക്ക്', te: 'రుసుము' })}
                  </span>
                  <span className="text-2xl font-black text-teal-950">{person.rate_label}</span>
                </div>

                <BigButton
                  disabled={!person.online}
                  onClick={() => handleOpenBooking(person, openCategory ?? '')}
                  icon={<Calendar className="w-6 h-6" />}
                >
                  {L({ en: 'Book Visit', hi: 'समय तय करें', ta: 'பதிவு செய்', kn: 'ಬುಕ್ ಮಾಡಿ', ml: 'ബുക്ക് ചെയ്യുക', te: 'బుక్ చేయండి' })}
                </BigButton>
              </section>
            ))}
        </div>

        {/* Booking Modal */}
        {selectedPersonForBooking && (
          <Sheet
            title={L({
              en: `Book ${selectedPersonForBooking.person.name}`,
              hi: `${selectedPersonForBooking.person.name} बुक करें`,
              ta: `${selectedPersonForBooking.person.name} பதிவு செய்`,
              kn: `${selectedPersonForBooking.person.name} ಬುಕ್ ಮಾಡಿ`,
              ml: `${selectedPersonForBooking.person.name} ബുക്ക് ചെയ്യുക`,
            })}
            closeLabel={L({ en: 'Cancel', hi: 'रद्द करें', ta: 'ரத்து', kn: 'ರದ್ದು', ml: 'റദ്ദാക്കുക' })}
            onClose={() => setSelectedPersonForBooking(null)}
          >
            {bookingSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {L({ en: 'Request sent', hi: 'अनुरोध भेजा गया', ta: 'கோரிக்கை அனுப்பப்பட்டது', kn: 'ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ', ml: 'അഭ്യർത്ഥന അയച്ചു', te: 'అభ్యర్థన పంపబడింది' })}
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed font-semibold">
                  {L({
                    en: `Your request for ${selectedPersonForBooking.person.name} on ${formatFriendlyDate(bookingDate)} is sent. They will confirm it soon. You can follow it under "Your bookings".`,
                    hi: `${selectedPersonForBooking.person.name} के लिए ${formatFriendlyDate(bookingDate)} का आपका अनुरोध भेज दिया गया है। वे जल्द पुष्टि करेंगे। आप इसे "आपकी बुकिंग" में देख सकते हैं।`,
                    ta: `${selectedPersonForBooking.person.name} அவர்களுக்கான ${formatFriendlyDate(bookingDate)} கோரிக்கை அனுப்பப்பட்டது. அவர் விரைவில் உறுதிப்படுத்துவார். "உங்கள் முன்பதிவுகள்" பகுதியில் பார்க்கலாம்.`,
                    kn: `${selectedPersonForBooking.person.name} ಅವರಿಗೆ ${formatFriendlyDate(bookingDate)} ರ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ. ಅವರು ಶೀಘ್ರದಲ್ಲೇ ದೃಢೀಕರಿಸುತ್ತಾರೆ. "ನಿಮ್ಮ ಬುಕಿಂಗ್‌ಗಳು" ನಲ್ಲಿ ನೋಡಬಹುದು.`,
                    ml: `${selectedPersonForBooking.person.name}-നുള്ള ${formatFriendlyDate(bookingDate)}-ലെ അഭ്യർത്ഥന അയച്ചു. അവർ ഉടൻ സ്ഥിരീകരിക്കും. "നിങ്ങളുടെ ബുക്കിംഗുകൾ" എന്നതിൽ കാണാം.`,
                    te: `${selectedPersonForBooking.person.name} కోసం ${formatFriendlyDate(bookingDate)} అభ్యర్థన పంపబడింది. వారు త్వరలో నిర్ధారిస్తారు. "మీ బుకింగ్‌లు" లో చూడవచ్చు.`,
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-teal-50 p-4 border border-teal-200">
                  <p className="text-2xl font-black text-teal-950">
                    {selectedPersonForBooking.person.name}
                  </p>
                  <p className="text-base font-bold text-teal-900">
                    {selectedPersonForBooking.person.description ?? ''}
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {L({ en: 'Fee', hi: 'शुल्क', ta: 'கட்டணம்', kn: 'ಶುಲ್ಕ', ml: 'നിരക്ക്' })}: {selectedPersonForBooking.person.rate_label}
                  </p>
                </div>

                {/* Interactive Month Calendar for choosing visit date */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-teal-800" />
                      <span>{L({ en: 'Choose Visit Date', hi: 'मुलाक़ात की तारीख चुनें', ta: 'தேதி தேர்ந்தெடுக்கவும்', kn: 'ಭೇಟಿಯ ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ', ml: 'സന്ദർശന തീയതി തിരഞ്ഞെടുക്കുക' })}</span>
                    </label>
                    <span className="text-sm font-black text-teal-900 bg-teal-100 px-2.5 py-1 rounded-xl">
                      {formatFriendlyDate(bookingDate)}
                    </span>
                  </div>

                  {/* Quick Select Shortcut Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingDate(todayIso);
                        setCalYear(todayObj.getFullYear());
                        setCalMonth(todayObj.getMonth());
                      }}
                      className={`h-12 rounded-xl border-2 font-black text-base transition-all ${
                        bookingDate === todayIso
                          ? 'border-teal-800 bg-teal-800 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'ഇന്ന്' })} ({todayObj.getDate()} {MONTH_NAMES[currentLang]?.[todayObj.getMonth()]?.slice(0, 3) || 'Nov'})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingDate(tomorrowIso);
                        setCalYear(tomorrowObj.getFullYear());
                        setCalMonth(tomorrowObj.getMonth());
                      }}
                      className={`h-12 rounded-xl border-2 font-black text-base transition-all ${
                        bookingDate === tomorrowIso
                          ? 'border-teal-800 bg-teal-800 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {L({ en: 'Tomorrow', hi: 'कल', ta: 'நாளை', kn: 'ನಾಳೆ', ml: 'നാളെ' })} ({tomorrowObj.getDate()} {MONTH_NAMES[currentLang]?.[tomorrowObj.getMonth()]?.slice(0, 3) || 'Nov'})
                    </button>
                  </div>

                  {/* Month Calendar Grid */}
                  <div className="rounded-2xl border-2 border-slate-300 bg-white p-3 sm:p-4 space-y-3 shadow-sm">
                    {/* Month / Year header with Prev/Next buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        disabled={!canGoPrevMonth}
                        onClick={handlePrevMonth}
                        className={`p-2 rounded-xl border transition-colors ${
                          canGoPrevMonth
                            ? 'border-slate-300 hover:bg-slate-100 text-slate-900 active:scale-95'
                            : 'border-slate-200 text-slate-300 cursor-not-allowed'
                        }`}
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      <span className="text-xl font-black text-slate-900">
                        {MONTH_NAMES[currentLang]?.[calMonth] || MONTH_NAMES.en[calMonth]} {calYear}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-900 transition-colors active:scale-95"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center font-black text-xs sm:text-sm text-slate-600">
                      {(WEEKDAY_NAMES[currentLang] || WEEKDAY_NAMES.en).map((day, idx) => (
                        <div key={idx} className="py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startingWeekday }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-10 sm:h-11 w-full" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateIso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isPast = dateIso < todayIso;
                        const isToday = dateIso === todayIso;
                        const isSelected = dateIso === bookingDate;

                        return (
                          <button
                            key={dateIso}
                            type="button"
                            disabled={isPast}
                            onClick={() => setBookingDate(dateIso)}
                            className={`h-10 sm:h-11 w-full rounded-xl flex items-center justify-center font-extrabold text-base transition-all ${
                              isSelected
                                ? 'bg-teal-800 text-white shadow-md scale-105 z-10'
                                : isPast
                                ? 'text-slate-300 cursor-not-allowed bg-slate-50/50'
                                : isToday
                                ? 'bg-white text-teal-950 border-2 border-teal-700 hover:bg-teal-50 font-black'
                                : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{dayNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    {L({ en: 'Preferred time', hi: 'पसंदीदा समय', ta: 'விருப்பமான நேரம்', kn: 'ಆದ್ಯತೆಯ ಸಮಯ', ml: 'ആവശ്യമായ സമയം' })}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SLOT_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setBookingSlot(s.id)}
                        className={`h-12 rounded-2xl border-2 font-bold text-base transition-all ${
                          bookingSlot === s.id
                            ? 'border-teal-800 bg-teal-800 text-white'
                            : 'border-slate-300 bg-white text-slate-800 active:bg-slate-100'
                        }`}
                      >
                        {L(s.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    {L({ en: 'Note for the helper (optional)', hi: 'सहायक के लिए संदेश (वैकल्पिक)', ta: 'உதவியாளருக்கான குறிப்பு (விருப்பம்)', kn: 'ಸಹಾಯಕರಿಗೆ ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)', ml: 'സഹായിക്കുള്ള കുറിപ്പ് (ഓപ്ഷണൽ)', te: 'సహాయకుడికి గమనిక (ఐచ్ఛికం)' })}
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    maxLength={500}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    {L({ en: 'Home Address / Specific Landmark for Visit', hi: 'घर का पता / विशिष्ट लैंडमार्क', ta: 'வீட்டு முகவரி / முக்கிய அடையாளம்', kn: 'ಮನೆಯ ವಿಳಾಸ / ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್', ml: 'മേൽവിലാസം / ലാൻഡ്മാർക്ക്' })}
                  </label>
                  <input
                    type="text"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder={effectiveRealLocation}
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 font-semibold">
                    {L({ en: 'Pre-filled from your saved location. Add your door number and street so the helper can find you.', hi: 'आपकी सहेजी लोकेशन से भरा गया है। मकान नंबर और गली जोड़ें ताकि सहायक आपको ढूँढ सकें।', ta: 'சேமித்த இருப்பிடத்திலிருந்து நிரப்பப்பட்டது. உதவியாளர் கண்டுபிடிக்க கதவு எண் மற்றும் தெருவைச் சேர்க்கவும்.', kn: 'ನಿಮ್ಮ ಉಳಿಸಿದ ಸ್ಥಳದಿಂದ ತುಂಬಲಾಗಿದೆ. ಸಹಾಯಕರು ಹುಡುಕಲು ಮನೆ ಸಂಖ್ಯೆ ಮತ್ತು ರಸ್ತೆ ಸೇರಿಸಿ.', ml: 'സേവ് ചെയ്ത സ്ഥലത്തുനിന്ന് പൂരിപ്പിച്ചു. സഹായിക്ക് കണ്ടെത്താൻ വീട്ടുനമ്പറും റോഡും ചേർക്കുക.', te: 'మీ సేవ్ చేసిన స్థానం నుండి నింపబడింది. సహాయకుడు కనుగొనడానికి ఇంటి నంబర్ మరియు వీధి జోడించండి.' })}
                  </p>
                </div>

                {bookingError && <Notice tone="error">{bookingError}</Notice>}

                <div className="pt-2">
                  <BigButton onClick={handleConfirmBooking} busy={bookingBusy} disabled={serviceAddress.trim().length < 3} icon={<CheckCircle2 className="w-6 h-6" />}>
                    {L({
                      en: 'Confirm Booking Request',
                      hi: 'बुकिंग अनुरोध की पुष्टि करें',
                      ta: 'முன்பதிவு கோரிக்கையை உறுதி செய்',
                      kn: 'ಬುಕಿಂಗ್ ವಿನಂತಿಯನ್ನು ದೃಢೀಕರಿಸಿ',
                      ml: 'ബുക്കിംഗ് സ്ഥിരീകരിക്കുക',
                    })}
                  </BigButton>
                </div>
              </div>
            )}
          </Sheet>
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN 2 ROW X 2 COLUMN VIEW (BIG TOUCH BUTTONS)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* View Header with Big Elderly-Friendly Typography */}
      <div>
        <Title
          sub={L({ en: 'Tap a box to see helpers you can book', hi: 'बुक करने योग्य सहायकों को देखने के लिए किसी बॉक्स पर टैप करें', ta: 'முன்பதிவு செய்யக்கூடிய உதவியாளர்களைக் காண ஒரு கட்டத்தைத் தொடவும்', kn: 'ಬುಕ್ ಮಾಡಬಹುದಾದ ಸಹಾಯಕರನ್ನು ನೋಡಲು ಬಾಕ್ಸ್ ಟ್ಯಾಪ್ ಮಾಡಿ', ml: 'ബുക്ക് ചെയ്യാവുന്ന സഹായികളെ കാണാൻ ഒരു ബോക്സിൽ തൊടുക', te: 'బుక్ చేయగల సహాయకులను చూడటానికి ఒక బాక్స్‌ను తాకండి' })}
        >
          {L({
            en: 'Services',
            hi: 'सेवाएँ',
            ta: 'சேவைகள்',
            kn: 'ಸೇವೆಗಳು',
            ml: 'സേവനങ്ങൾ',
          })}
        </Title>

        {/* Safe Trust Banner */}
        <div className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3.5 py-1.5 border-2 border-teal-200 text-teal-950 text-base sm:text-lg font-extrabold mb-3">
          <MapPin className="w-5 h-5 text-teal-800" />
          <span>{L({ en: 'Service area', hi: 'सेवा क्षेत्र', ta: 'சேவை பகுதி', kn: 'ಸೇವಾ ಪ್ರದೇಶ', ml: 'സേവന മേഖല', te: 'సేవా ప్రాంతం' })}: <strong>{effectiveRealLocation}</strong></span>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl bg-teal-50 border-2 border-teal-200 p-4 sm:p-5 text-teal-950 shadow-sm">
          <ShieldCheck className="w-9 h-9 shrink-0 text-teal-800" aria-hidden />
          <p className="text-lg sm:text-xl font-extrabold leading-snug">
            {L({ en: 'Every helper listed here has passed an ID check.', hi: 'यहाँ दिखाए हर सहायक की आईडी जाँच हो चुकी है।', ta: 'இங்கு உள்ள ஒவ்வொரு உதவியாளரும் அடையாளச் சரிபார்ப்பை முடித்தவர்.', kn: 'ಇಲ್ಲಿರುವ ಪ್ರತಿಯೊಬ್ಬ ಸಹಾಯಕರ ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.', ml: 'ഇവിടെയുള്ള ഓരോ സഹായിയും തിരിച്ചറിയൽ പരിശോധന പാസായവരാണ്.', te: 'ఇక్కడ ఉన్న ప్రతి సహాయకుడి ID తనిఖీ పూర్తయింది.' })}
          </p>
        </div>
      </div>

      {/* 2 Row x 2 Column Grid — Every box is a big touch button! */}
      <div className="grid grid-cols-2 gap-4">
        {/* Box 1, 2, 3: Services (Bumblebee pop-out style: borderless character, good border on details board) */}
        {CATEGORIES_DATA.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => setActiveCategory(service.id)}
            className="group flex flex-col justify-end text-left relative focus:outline-none focus:ring-4 focus:ring-teal-800/20 active:scale-[0.98] transition-transform duration-200"
          >
            {/* Pop-out Character Container: Head and upper body pop out freely, no enclosing card border */}
            <div className="relative h-56 sm:h-64 w-full flex items-end justify-center">
              {/* Centered Character Upper Body / Face */}
              <img
                src={service.image}
                alt={pick(currentLang, service.title)}
                className="relative z-10 h-full w-auto max-h-full object-contain object-bottom drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Price badge in the top-right corner, clear of the centered face */}
              <span className="absolute top-1 right-1 z-20 rounded-xl bg-white/95 backdrop-blur px-2.5 py-1 text-xs sm:text-sm font-black text-teal-950 border-2 border-slate-300 shadow-sm">
                {pick(currentLang, service.priceEstimate)}
              </span>
            </div>

            {/* Bottom Board with good border overlapping character's waist — only details board has the card border */}
            <div className="-mt-6 relative z-20 flex flex-col flex-1 justify-between rounded-3xl border-2 border-slate-300 bg-white p-4 sm:p-5 shadow-lg group-hover:border-teal-800 group-hover:shadow-2xl transition-all duration-200 space-y-2">
              <div>
                <span className="inline-block text-sm sm:text-base font-black uppercase tracking-wider text-teal-900 bg-teal-100/90 px-3 py-1 rounded-xl">
                  {pick(currentLang, service.shortTag)}
                </span>
                <h3 className="mt-2 text-2xl sm:text-[26px] font-black text-slate-900 leading-snug group-hover:text-teal-900">
                  {pick(currentLang, service.title)}
                </h3>
              </div>

              {/* Big Tap Indicator */}
              <div className="pt-3 flex items-center justify-between text-base sm:text-lg font-black text-teal-900 border-t border-slate-200">
                <span>{L({ en: 'See who is available', hi: 'उपलब्ध लोग देखें', ta: 'கிடைப்பவர்களைப் பார்', kn: 'ಲಭ್ಯರನ್ನು ನೋಡಿ', ml: 'ലഭ്യരായവരെ കാണുക', te: 'అందుబాటులో ఉన్నవారిని చూడండి' })}</span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform shrink-0" />
              </div>
            </div>
          </button>
        ))}

        {/* Box 4: "Describe What You Need" (Row 2, Column 2) */}
        <button
          type="button"
          onClick={() => setActiveCategory("describe-need")}
          className="group flex flex-col justify-end text-left relative focus:outline-none focus:ring-4 focus:ring-teal-800/20 active:scale-[0.98] transition-transform duration-200"
        >
          {/* Top Graphic Container with arched backdrop */}
          <div className="relative h-56 sm:h-64 w-full flex items-end justify-center">
            <div className="absolute inset-x-3 bottom-0 top-6 rounded-t-[36px] bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 flex flex-col items-center justify-center p-3 text-center shadow-md">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white mb-2 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-amber-300" />
              </div>
              <span className="rounded-full bg-white/20 backdrop-blur px-3 py-0.5 text-xs sm:text-sm font-black text-white tracking-wide">
                {L({ en: 'Custom Help', hi: 'विशेष सहायता', ta: 'தனிப்பயன் உதவி', kn: 'ವಿಶೇಷ ನೆರವು', ml: 'പ്രത്യേക സഹായം' })}
              </span>
            </div>
          </div>

          {/* Bottom Board with good border overlapping */}
          <div className="-mt-6 relative z-20 flex flex-col flex-1 justify-between rounded-3xl border-2 border-teal-800 bg-white p-4 sm:p-5 shadow-lg group-hover:border-teal-950 group-hover:shadow-2xl transition-all duration-200 space-y-2">
            <div>
              <span className="inline-block text-sm sm:text-base font-black uppercase tracking-wider text-teal-900 bg-teal-100/90 px-3 py-1 rounded-xl">
                {L({ en: 'Tell Us', hi: 'अपनी जरूरत', ta: 'உங்களுக்கு', kn: 'ತಿಳಿಸಿ', ml: 'നിങ്ങൾക്ക്' })}
              </span>
              <h3 className="mt-2 text-2xl sm:text-[26px] font-black text-slate-900 leading-snug group-hover:text-teal-900">
                {L({
                  en: 'Describe What You Need',
                  hi: 'बताएँ आपको क्या चाहिए',
                  ta: 'உங்களுக்கு என்ன உதவி?',
                  kn: 'ಏನು ಸಹಾಯ ಬೇಕು?',
                  ml: 'എന്താണ് ആവശ്യം?',
                })}
              </h3>
            </div>

            {/* Big Tap Indicator */}
            <div className="pt-3 flex items-center justify-between text-base sm:text-lg font-black text-teal-900 border-t border-teal-100">
              <span>{L({ en: 'Tap to tell us', hi: 'लिखें या बोलें', ta: 'எழுத தொடவும்', kn: 'ಬರೆಯಲು ಟ್ಯಾಪ್', ml: 'പറയുക' })}</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
          </div>
        </button>
      </div>

      <ServiceBookings currentLang={currentLang} />
    </div>
  );
};