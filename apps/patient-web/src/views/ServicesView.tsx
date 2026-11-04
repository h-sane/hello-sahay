import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  Mic,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from 'lucide-react';
import { Language, UserCoordinates, UserSettings } from '../types';
import { BigButton, SectionTitle, Sheet, Title, pick, inputCls } from '../components/ui';
import { api } from '../services/api';

interface ServicesViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  userCoordinates?: UserCoordinates;
  onOpenVoiceCall?: () => void;
  onOpenEmergency?: () => void;
}

type LangMap<T = string> = { en: T; hi: T; ta: T; kn: T; ml: T };

export interface ProviderPerson {
  id: string;
  name: LangMap<string>;
  role: LangMap<string>;
  phone: string;
  rating: string;
  reviewsCount: number;
  experience: LangMap<string>;
  languages: string;
  rate: LangMap<string>;
  available: LangMap<string>;
  image?: string;
  badge?: LangMap<string>;
}

export interface ServiceCategory {
  id: string;
  title: LangMap<string>;
  category: LangMap<string>;
  shortTag: LangMap<string>;
  description: LangMap<string>;
  features: LangMap<string[]>;
  image: string;
  priceEstimate: LangMap<string>;
  popular?: boolean;
  providers: ProviderPerson[];
}

const CATEGORIES_DATA: ServiceCategory[] = [
  {
    id: 'personal-care-taker',
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
    providers: [
      {
        id: 'nurse-priya',
        name: {
          en: 'Sister Priya Rani',
          hi: 'सिस्टर प्रिया रानी',
          ta: 'சிஸ்டர் பிரியா ராணி',
          kn: 'ಸಿಸ್ಟರ್ ಪ್ರಿಯಾ ರಾಣಿ',
          ml: 'സിസ്റ്റർ പ്രിയ റാണി',
        },
        role: {
          en: 'Certified ANM Nurse & Senior Caretaker',
          hi: 'प्रमाणित एएनएम नर्स और वरिष्ठ परिचारक',
          ta: 'சான்றிதழ் பெற்ற செவிலியர் & மூத்த பராமரிப்பாளர்',
          kn: 'ಪ್ರಮಾಣೀಕೃತ ನರ್ಸ್ ಮತ್ತು ಹಿರಿಯ ಆರೈಕೆದಾರರು',
          ml: 'സർട്ടിഫൈഡ് നഴ്സ് & സീനിയർ പരിചാരകൻ',
        },
        phone: '+91 94441 23451',
        rating: '4.9',
        reviewsCount: 142,
        experience: {
          en: '8 yrs experience · Post-surgery & Elder Care',
          hi: '8 वर्ष अनुभव · सर्जरी बाद व बुजुर्ग देखभाल',
          ta: '8 ஆண்டுகள் அனுபவம் · அறுவைசிகிச்சை & முதியோர் நலம்',
          kn: '8 ವರ್ಷಗಳ ಅನುಭವ · ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಆರೈಕೆ',
          ml: '8 വർഷത്തെ പരിചയം · രോഗി പരിചരണം',
        },
        languages: 'Tamil, English',
        rate: { en: '₹750 / day', hi: '₹750 / दिन', ta: '₹750 / நாள்', kn: '₹750 / ದಿನ', ml: '₹750 / ദിവസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/personal-care-taker.png',
        badge: { en: 'Top Rated', hi: 'शीर्ष रेटेड', ta: 'சிறந்த மதிப்பீடு', kn: 'ಅತ್ಯುತ್ತಮ', ml: 'ടോപ്പ് റേറ്റഡ്' },
      },
      {
        id: 'nurse-anitha',
        name: {
          en: 'Sister Anitha Mary',
          hi: 'सिस्टर अनिता मेरी',
          ta: 'சிஸ்டர் அனிதா மேரி',
          kn: 'ಸಿಸ್ಟರ್ ಅನಿತಾ ಮೇರಿ',
          ml: 'സിസ്റ്റർ അനിത മേരി',
        },
        role: {
          en: 'Geriatric & Bedside Care Attendant',
          hi: 'बुजुर्ग व बेडसाइड केयर परिचारक',
          ta: 'முதியோர் படுக்கை பராமரிப்பு உதவியாளர்',
          kn: 'ಹಿರಿಯರ ಹಾಸಿಗೆಯ ಬದಿಯ ಆರೈಕೆದಾರರು',
          ml: 'ബെഡ്സൈഡ് കെയർ അസിസ്റ്റന്റ്',
        },
        phone: '+91 98402 87652',
        rating: '4.8',
        reviewsCount: 98,
        experience: {
          en: '5 yrs experience · Mobility & Daily Vitals',
          hi: '5 वर्ष अनुभव · चलना-फिरना व बीपी/शुगर',
          ta: '5 ஆண்டுகள் அனுபவம் · நடைபயிற்சி & உடல்நலம்',
          kn: '5 ವರ್ಷಗಳ ಅನುಭವ · ಚಲನಶೀಲತೆ ಮತ್ತು ನಿಗಾ',
          ml: '5 വർഷത്തെ പരിചയം · നടത്ത സഹായം',
        },
        languages: 'Tamil, Telugu',
        rate: { en: '₹750 / day', hi: '₹750 / दिन', ta: '₹750 / நாள்', kn: '₹750 / ದಿನ', ml: '₹750 / ദിവസം' },
        available: { en: 'Available Tomorrow', hi: 'कल से उपलब्ध', ta: 'நாளை கிடைக்கும்', kn: 'ನಾಳೆ ಲಭ್ಯ', ml: 'നാളെ ലഭ്യമാണ്' },
        image: '/images/caretaker-anitha.png',
      },
      {
        id: 'nurse-babu',
        name: {
          en: 'Babu Sundaram',
          hi: 'बाबू सुंदरम',
          ta: 'பாபு சுந்தரம்',
          kn: 'ಬಾಬು ಸುಂದರಂ',
          ml: 'ബാബു സുന്ദരം',
        },
        role: {
          en: 'Male Patient Attendant & Physical Support',
          hi: 'पुरुष मरीज़ परिचारक व शारीरिक सहयोग',
          ta: 'ஆண் நோயாளி உதவியாளர் & உடற்பயிற்சி உதவி',
          kn: 'ಪುರುಷ ರೋಗಿ ಸಹಾಯಕ ಮತ್ತು ದೈಹಿಕ ಬೆಂಬಲ',
          ml: 'പുരുഷ രോഗി സഹായി & ഫിസിക്കൽ സപ്പോർട്ട്',
        },
        phone: '+91 97908 43219',
        rating: '4.9',
        reviewsCount: 116,
        experience: {
          en: '6 yrs experience · Wheelchair, Bath & Night Duty',
          hi: '6 वर्ष अनुभव · व्हीलचेयर व नाइट ड्यूटी',
          ta: '6 ஆண்டுகள் அனுபவம் · சக்கர நாற்காலி & இரவு பணி',
          kn: '6 ವರ್ಷಗಳ ಅನುಭವ · ವೀಲ್‌ಚೇರ್ & ರಾತ್ರಿ ಸೇವೆ',
          ml: '6 വർഷത്തെ പരിചയം · വീൽചെയർ, രാത്രി പരിചരണം',
        },
        languages: 'Tamil, Hindi, English',
        rate: { en: '₹750 / day', hi: '₹750 / दिन', ta: '₹750 / நாள்', kn: '₹750 / ದಿನ', ml: '₹750 / ദിവസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/caretaker-babu.png',
      },
      {
        id: 'nurse-kavitha',
        name: {
          en: 'Kavitha R.',
          hi: 'कविता आर.',
          ta: 'கவிதா ஆர்.',
          kn: 'ಕವಿತಾ ಆರ್.',
          ml: 'കവിത ആർ.',
        },
        role: {
          en: 'Diabetic & Medication Care Attendant',
          hi: 'डायबिटीज व दवा देखरेख परिचारक',
          ta: 'நீரிழிவு & மருந்து பராமரிப்பு உதவியாளர்',
          kn: 'ಮಧುಮೇಹ ಮತ್ತು ಔಷಧಿ ಆರೈಕೆ ಸಹಾಯಕರು',
          ml: 'പ്രമേഹ പരിചരണ സഹായി',
        },
        phone: '+91 93616 60147',
        rating: '4.8',
        reviewsCount: 75,
        experience: {
          en: '4 yrs experience · Insulin, Diet & BP Check',
          hi: '4 वर्ष अनुभव · इंसुलिन, खानपान व बीपी',
          ta: '4 ஆண்டுகள் அனுபவம் · இன்சுலின் & உணவு முறை',
          kn: '4 ವರ್ಷಗಳ ಅನುಭವ · ಇನ್ಸುಲಿನ್ ಮತ್ತು ಬಿಪಿ',
          ml: '4 വർഷത്തെ പരിചയം · ഇൻസുലിൻ, ബിപി',
        },
        languages: 'Tamil',
        rate: { en: '₹750 / day', hi: '₹750 / दिन', ta: '₹750 / நாள்', kn: '₹750 / ದಿನ', ml: '₹750 / ദിവസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/caretaker-kavitha.png',
      },
    ],
  },
  {
    id: 'house-cleaning',
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
    providers: [
      {
        id: 'clean-radha',
        name: {
          en: 'Radha Murugan',
          hi: 'राधा मुरुगन',
          ta: 'ராதா முருகன்',
          kn: 'ರಾಧಾ ಮುರುಗನ್',
          ml: 'രാധ മുരുഗൻ',
        },
        role: {
          en: 'Patient Room & Deep Sanitization Lead',
          hi: 'मरीज़ कमरा व गहरी सफ़ाई प्रभारी',
          ta: 'நோயாளி அறை & ஆழ்ந்த சுத்தம் பொறுப்பாளர்',
          kn: 'ರೋಗಿಯ ಕೊಠಡಿ ಮತ್ತು ಡೀಪ್ ಕ್ಲೀನಿಂಗ್ ಲೀಡ್',
          ml: 'ഡീപ് സാനിറ്റൈസേഷൻ സ്പെഷ്യലിസ്റ്റ്',
        },
        phone: '+91 97890 12345',
        rating: '4.9',
        reviewsCount: 185,
        experience: {
          en: '7 yrs experience · Hospital Grade Sanitization',
          hi: '7 वर्ष अनुभव · अस्पताल स्तर का कीटाणुशोधन',
          ta: '7 ஆண்டுகள் அனுபவம் · மருத்துவமனை தர கிருமி நீக்கம்',
          kn: '7 ವರ್ಷಗಳ ಅನುಭವ · ವೈದ್ಯಕೀಯ ದರ್ಜೆಯ ನೈರ್ಮಲ್ಯ',
          ml: '7 വർഷത്തെ പരിചയം · ഹോസ്പിറ്റൽ ഗ്രേഡ് ക്ലീനിംഗ്',
        },
        languages: 'Tamil',
        rate: { en: '₹3,999 / month', hi: '₹3,999 / महीना', ta: '₹3,999 / மாதம்', kn: '₹3,999 / ತಿಂಗಳು', ml: '₹3,999 / മാസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/house-cleaning.png',
        badge: { en: 'Verified Staff', hi: 'सत्यापित कर्मचारी', ta: 'நம்பகமான பணியாளர்', kn: 'ಪರಿಶೀಲಿಸಿದ ಸಿಬ್ಬಂದಿ', ml: 'പരിശോധിച്ചുറപ്പിച്ചത്' },
      },
      {
        id: 'clean-selvi',
        name: {
          en: 'Selvi Kumar',
          hi: 'सेल्वी कुमार',
          ta: 'செல்வி குமார்',
          kn: 'ಸೆಲ್ವಿ ಕುಮಾರ್',
          ml: 'സെൽവി കുമാർ',
        },
        role: {
          en: 'Washroom & Kitchen Disinfection Specialist',
          hi: 'शौचालय व रसोई कीटाणुशोधन विशेषज्ञ',
          ta: 'கழிவறை & சமையலறை கிருமி நீக்க நிபுணர்',
          kn: 'ಸ್ನಾನಗೃಹ ಮತ್ತು ಅಡುಗೆಮನೆ ನೈರ್ಮಲ್ಯ ತಜ್ಞರು',
          ml: 'വാഷ്‌റൂം & കിച്ചൺ അണുനശീകരണ വിദഗ്ദ്ധൻ',
        },
        phone: '+91 98413 54321',
        rating: '4.8',
        reviewsCount: 130,
        experience: {
          en: '5 yrs experience · Eco-friendly Safe Materials',
          hi: '5 वर्ष अनुभव · सुरक्षित व पर्यावरण अनुकूल सामग्री',
          ta: '5 ஆண்டுகள் அனுபவம் · பாதுகாப்பான ரசாயனங்கள்',
          kn: '5 ವರ್ಷಗಳ ಅನುಭವ · ಪರಿಸರ ಸ್ನೇಹಿ ಶುಚಿಗೊಳಿಸುವಿಕೆ',
          ml: '5 വർഷത്തെ പരിചയം · സുരക്ഷിത ശുചീകരണം',
        },
        languages: 'Tamil, Telugu',
        rate: { en: '₹3,999 / month', hi: '₹3,999 / महीना', ta: '₹3,999 / மாதம்', kn: '₹3,999 / ತಿಂಗಳು', ml: '₹3,999 / മാസം' },
        available: { en: 'Available Tomorrow', hi: 'कल उपलब्ध', ta: 'நாளை கிடைக்கும்', kn: 'ನಾಳೆ ಲಭ್ಯ', ml: 'നാളെ ലഭ്യമാണ്' },
        image: '/images/cleaner-selvi.png',
      },
      {
        id: 'clean-munusamy',
        name: {
          en: 'Munusamy P.',
          hi: 'मुनुसामी पी.',
          ta: 'முனுசாமி பி.',
          kn: 'ಮುನುಸಾಮಿ ಪಿ.',
          ml: 'മുനുസാമി പി.',
        },
        role: {
          en: 'Floor Scrubbing & Dust Removal Specialist',
          hi: 'फ़र्श सफ़ाई व धूल हटाने के विशेषज्ञ',
          ta: 'தரை துடைத்தல் & தூசி அகற்றும் நிபுணர்',
          kn: 'ನೆಲ ಸ್ವಚ್ಛತೆ ಮತ್ತು ಧೂಳು ನಿವಾರಕ ತಜ್ಞರು',
          ml: 'തറ വൃത്തിയാക്കൽ വിദഗ്ദ്ധൻ',
        },
        phone: '+91 94452 67890',
        rating: '4.8',
        reviewsCount: 92,
        experience: {
          en: '6 yrs experience · Full Home Moisture Care',
          hi: '6 वर्ष अनुभव · नमी व फंगस सुरक्षा',
          ta: '6 ஆண்டுகள் அனுபவம் · வீட்டின் பூஞ்சை தடுப்பு',
          kn: '6 ವರ್ಷಗಳ ಅನುಭವ · ತೇವಾಂಶ ಆರೈಕೆ',
          ml: '6 വർഷത്തെ പരിചയം · സമഗ്ര ശുചീകരണം',
        },
        languages: 'Tamil',
        rate: { en: '₹3,999 / month', hi: '₹3,999 / महीना', ta: '₹3,999 / மாதம்', kn: '₹3,999 / ತಿಂಗಳು', ml: '₹3,999 / മാസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/cleaner-munusamy.png',
      },
      {
        id: 'clean-deepak',
        name: {
          en: 'Deepak Shanmugam',
          hi: 'दीपक षण्मुगम',
          ta: 'தீபக் சண்முகம்',
          kn: 'ದೀಪಕ್ ಷಣ್ಮುಗಂ',
          ml: 'ദീപക് ഷൺമുഖം',
        },
        role: {
          en: 'Post-Discharge Home Sanitization Lead',
          hi: 'अस्पताल से डिस्चार्ज बाद घर की सफ़ाई विशेषज्ञ',
          ta: 'மருத்துவமனையிலிருந்து திரும்பிய பின் தூய்மை பணி',
          kn: 'ಆಸ್ಪತ್ರೆಯಿಂದ ಡಿಸ್ಚಾರ್ಜ್ ಆದ ನಂತರದ ನೈರ್ಮಲ್ಯ',
          ml: 'ഡിസ്ചാർജ്ജിനു ശേഷമുള്ള അണുനശീകരണം',
        },
        phone: '+91 93616 60147',
        rating: '4.9',
        reviewsCount: 110,
        experience: {
          en: '4 yrs experience · Infection Prevention Protocol',
          hi: '4 वर्ष अनुभव · संक्रमण रोकथाम विशेषज्ञ',
          ta: '4 ஆண்டுகள் அனுபவம் · தொற்று தடுப்பு முறை',
          kn: '4 ವರ್ಷಗಳ ಅನುಭವ · ಸೋಂಕು ತಡೆಗಟ್ಟುವಿಕೆ',
          ml: '4 വർഷത്തെ പരിചയം · അണുബാധ തടയൽ',
        },
        languages: 'Tamil, English',
        rate: { en: '₹3,999 / month', hi: '₹3,999 / महीना', ta: '₹3,999 / மாதம்', kn: '₹3,999 / ತಿಂಗಳು', ml: '₹3,999 / മാസം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/cleaner-deepak.png',
      },
    ],
  },
  {
    id: 'technical-support',
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
    providers: [
      {
        id: 'tech-karthik',
        name: {
          en: 'Karthik Vijay',
          hi: 'कार्तिक विजय',
          ta: 'கார்த்திக் விஜய்',
          kn: 'ಕಾರ್ತಿಕ್ ವಿಜಯ್',
          ml: 'കാർത്തിക് വിജയ്',
        },
        role: {
          en: 'Senior Medical Device & Mobile Technician',
          hi: 'वरिष्ठ मेडिकल डिवाइस व मोबाइल तकनीशियन',
          ta: 'மூத்த மருத்துவ உபகரணங்கள் & மொபைல் நிபுணர்',
          kn: 'ಹಿರಿಯ ವೈದ್ಯಕೀಯ ಸಾಧನ ಮತ್ತು ಮೊಬೈಲ್ ತಂತ್ರಜ್ಞ',
          ml: 'സീനിയർ മെഡിക്കൽ ഡിവൈസ് ടെക്നീഷ്യൻ',
        },
        phone: '+91 98840 98765',
        rating: '4.9',
        reviewsCount: 210,
        experience: {
          en: '6 yrs experience · BP, O2 Monitors & Glucometers',
          hi: '6 वर्ष अनुभव · बीपी, ऑक्सीजन व शुगर मीटर',
          ta: '6 ஆண்டுகள் அனுபவம் · பிபி, ஆக்ஸிஜன் & சுகர் மிஷின்',
          kn: '6 ವರ್ಷಗಳ ಅನುಭವ · ಬಿಪಿ, ಆಕ್ಸಿಜನ್ ಮತ್ತು ಶುಗರ್ ಮೀಟರ್',
          ml: '6 വർഷത്തെ പരിചയം · ബിപി, ഓക്സിജൻ മീറ്ററുകൾ',
        },
        languages: 'Tamil, English, Hindi',
        rate: { en: '₹299 / visit', hi: '₹299 / विज़िट', ta: '₹299 / வருகை', kn: '₹299 / ಭೇಟಿ', ml: '₹299 / സന്ദർശനം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/technical-support.png',
        badge: { en: 'Expert Technician', hi: 'विशेषज्ञ तकनीशियन', ta: 'கைதேர்ந்த நிபுணர்', kn: 'ತಜ್ಞ ತಂತ್ರಜ್ಞ', ml: 'വിദഗ്ദ്ധൻ' },
      },
      {
        id: 'tech-suresh',
        name: {
          en: 'Suresh Kumar',
          hi: 'सुरेश कुमार',
          ta: 'சுரேஷ் குமார்',
          kn: 'ಸುರೇಶ್ ಕುಮಾರ್',
          ml: 'സുരേഷ് കുമാർ',
        },
        role: {
          en: 'Home Wi-Fi, Router & Tele-consult Specialist',
          hi: 'होम वाई-फाई, राउटर व टेली-कंसल्ट विशेषज्ञ',
          ta: 'வீட்டு வைஃபை, ரூட்டர் & வீடியோ ஆலோசனை நிபுணர்',
          kn: 'ಮನೆ ವೈಫೈ, ರೂಟರ್ ಮತ್ತು ಟೆಲಿಕನ್ಸಲ್ಟ್ ತಜ್ಞರು',
          ml: 'ഹോം വൈഫൈ, റൂട്ടർ & ടെലികൺസൾട്ടേഷൻ വിദഗ്ദ്ധൻ',
        },
        phone: '+91 97109 87654',
        rating: '4.8',
        reviewsCount: 145,
        experience: {
          en: '5 yrs experience · Fast Internet Setup for Video Consults',
          hi: '5 वर्ष अनुभव · डॉक्टर वीडियो कॉल हेतु तेज़ इंटरनेट',
          ta: '5 ஆண்டுகள் அனுபவம் · மருத்துவர் வீடியோ அழைப்புக்கு இணையம்',
          kn: '5 ವರ್ಷಗಳ ಅನುಭವ · ವೀಡಿಯೊ ಸಮಾಲೋಚನೆಗಾಗಿ ವೇಗದ ಇಂಟರ್ನೆಟ್',
          ml: '5 വർഷത്തെ പരിചയം · വേഗതയേറിയ ഇൻ്റർനെറ്റ് സജ്ജീകരണം',
        },
        languages: 'Tamil, English, Telugu',
        rate: { en: '₹299 / visit', hi: '₹299 / विज़िट', ta: '₹299 / வருகை', kn: '₹299 / ಭೇಟಿ', ml: '₹299 / സന്ദർശനം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
        image: '/images/tech-suresh.png',
      },
      {
        id: 'tech-meena',
        name: {
          en: 'Meena Sundaram',
          hi: 'मीना सुंदरम',
          ta: 'மீனா சுந்தரம்',
          kn: 'ಮೀನಾ ಸುಂದರಂ',
          ml: 'മീന സുന്ദരം',
        },
        role: {
          en: 'Smartphone Health Apps & Video Calling Tutor',
          hi: 'स्मार्टफोन ऐप व डॉक्टर वीडियो कॉल सहायक',
          ta: 'ஸ்மார்ட்போன் ஆப் & வீடியோ அழைப்பு பயிற்சியாளர்',
          kn: 'ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಆ್ಯಪ್ ಮತ್ತು ವಿಡಿಯೋ ಕಾಲ್ ಸಹಾಯಕ',
          ml: 'സ്മാർട്ട്ഫോൺ ആപ്പ് & വീഡിയോ കോൾ സഹായി',
        },
        phone: '+91 94448 12340',
        rating: '4.9',
        reviewsCount: 128,
        experience: {
          en: '5 yrs experience · Patient WhatsApp, Health Apps & Tech Tutor',
          hi: '5 वर्ष अनुभव · व्हाट्सएप, स्वास्थ्य ऐप व तकनीकी सीख',
          ta: '5 ஆண்டுகள் அனுபவம் · வாட்ஸ்அப், சுகாதார ஆப் பயிற்சி',
          kn: '5 ವರ್ಷಗಳ ಅನುಭವ · ವಾಟ್ಸಾಪ್, ಆರೋಗ್ಯ ಆ್ಯಪ್ ತರಬೇತಿ',
          ml: '5 വർഷത്തെ പരിചയം · വാട്സ്ആപ്പ്, ഹെൽത്ത് ആപ്പ് പരിശീലനം',
        },
        languages: 'Tamil, English, Hindi',
        rate: { en: '₹299 / visit', hi: '₹299 / विज़िट', ta: '₹299 / வருகை', kn: '₹299 / ಭೇಟಿ', ml: '₹299 / സന്ദർശനം' },
        available: { en: 'Available Tomorrow', hi: 'कल उपलब्ध', ta: 'நாளை கிடைக்கும்', kn: 'நாಳೆ ಲಭ್ಯ', ml: 'நாளை ലഭ്യമാണ്' },
        image: '/images/tech-meena.png',
      },
      {
        id: 'tech-shalini',
        name: {
          en: 'Shalini Ramesh',
          hi: 'शालिनी रमेश',
          ta: 'ஷாலினி ரமேஷ்',
          kn: 'ಶಾಲಿನಿ ರಮೇಶ್',
          ml: 'ശാലിനി രമേഷ്',
        },
        role: {
          en: 'Digital BP, Glucometer & Hearing Aid Setup',
          hi: 'डिजिटल बीपी, शुगर मीटर व श्रवण यंत्र सेटअप',
          ta: 'டிஜிட்டல் பிபி, சுகர் மிஷின் & கேட்கும் கருவி அமைப்பு',
          kn: 'ಡಿಜಿಟಲ್ ಬಿಪಿ, ಶುಗರ್ ಮೀಟರ್ ಮತ್ತು ಶ್ರವಣ ಸಾಧನ ಸೆಟಪ್',
          ml: 'ഡിജിറ്റൽ ബിപി, ഷുഗർ മീറ്റർ, ശ്രവണ സഹായി ക്രമീകരണം',
        },
        phone: '+91 93616 60147',
        rating: '4.8',
        reviewsCount: 104,
        experience: {
          en: '4 yrs experience · Medical Equipment & Battery Calibration',
          hi: '4 वर्ष अनुभव · मरीज़ उपकरण सेटअप व बैटरी जाँच',
          ta: '4 ஆண்டுகள் அனுபவம் · மருத்துவ உபகரண அமைப்பு & பராமரிப்பு',
          kn: '4 ವರ್ಷಗಳ ಅನುಭವ · ವೈದ್ಯಕೀಯ ಉಪಕರಣಗಳ ಮಾಪನಾಂಕ ನಿರ್ಣಯ',
          ml: '4 വർഷത്തെ പരിചയം · ഉപകരണ കാലിബ്രേഷൻ',
        },
        languages: 'Tamil, English',
        rate: { en: '₹299 / visit', hi: '₹299 / विज़िट', ta: '₹299 / வருகை', kn: '₹299 / ಭೇಟಿ', ml: '₹299 / സന്ദർശനം' },
        available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'இന്ന് ലഭ്യമാണ്' },
        image: '/images/tech-shalini.png',
      },
    ],
  },
];

const CUSTOM_COORDINATORS: ProviderPerson[] = [
  {
    id: 'coord-ramesh',
    name: {
      en: 'Ramesh V. - Wheelchair & Hospital Escort',
      hi: 'रमेश वी. - व्हीलचेयर व अस्पताल साथी',
      ta: 'ரமேஷ் வி. - சக்கர நாற்காலி & மருத்துவமனை துணை',
      kn: 'ರಮೇಶ್ ವಿ. - ವೀಲ್‌ಚೇರ್ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಜೊತೆಗಾರ',
      ml: 'രമേശ് വി. - വീൽചെയർ & ആശുപത്രി കൂട്ട്',
    },
    role: {
      en: 'Patient Clinic Transport & Escort Companion',
      hi: 'क्लिनिक साथ जाने और व्हीलचेयर में सहायता',
      ta: 'மருத்துவமனைக்கு அழைத்துச் செல்லும் பாதுகாவலர்',
      kn: 'ಆಸ್ಪತ್ರೆಗೆ ಕರೆದೊಯ್ಯುವ ನಂಬಿಕಸ್ಥ ಜೊತೆಗಾರ',
      ml: 'ആശുപത്രി സഹായിയും കൂട്ടുകാരനും',
    },
    phone: '+91 94451 11223',
    rating: '4.9',
    reviewsCount: 160,
    experience: {
      en: 'Patient clinic visits, ambulance standby & walking support',
      hi: 'अस्पताल जाने में मदद, एम्बुलेंस स्टैंडबाय व सहारा',
      ta: 'மருத்துவமனை வருகை, ஆம்புலன்ஸ் துணை & நடை உதவி',
      kn: 'ಆಸ್ಪತ್ರೆ ಭೇಟಿಗಳು ಮತ್ತು ನಡಿಗೆಗೆ ಆಸರೆ',
      ml: 'ആശുപത്രി യാത്രകൾ, താങ്ങ് സഹായം',
    },
    languages: 'Tamil, English',
    rate: { en: '₹350 / trip', hi: '₹350 / यात्रा', ta: '₹350 / முறை', kn: '₹350 / ಪ್ರಯಾಣ', ml: '₹350 / ട്രിപ്പ്' },
    available: { en: 'Available Today', hi: 'आज उपलब्ध', ta: 'இன்று கிடைக்கும்', kn: 'ಇಂದು ಲಭ್ಯ', ml: 'ഇന്ന് ലഭ്യമാണ്' },
  },
  {
    id: 'coord-geetha',
    name: {
      en: 'Geetha K. - Night Attendant Coordinator',
      hi: 'गीता के. - रात्रि देखभाल समन्वयक',
      ta: 'கீதா கே. - இரவு நேர கவனிப்பாளர்',
      kn: 'ಗೀತಾ ಕೆ. - ರಾತ್ರಿ ಆರೈಕೆ ಸಂಯೋಜಕರು',
      ml: 'ഗീത കെ. - രാത്രി പരിചരണ കോർഡിനേറ്റർ',
    },
    role: {
      en: 'Overnight Elderly Care & Vitals Watch',
      hi: 'रात भर बुजुर्गों की देखभाल और आपातकालीन निगरानी',
      ta: 'இரவு முழுதும் முதியோர் கண்காணிப்பு & உதவி',
      kn: 'ರಾತ್ರಿಯಿಡೀ ಹಿರಿಯರ ಆರೈಕೆ ಮತ್ತು ನಿಗಾ',
      ml: 'രാത്രികാല രോഗി പരിചരണവും നിരീക്ഷണവും',
    },
    phone: '+91 98405 33445',
    rating: '4.9',
    reviewsCount: 120,
    experience: {
      en: 'Bedside night assistance, water, medicine & washroom help',
      hi: 'रात में दवा, पानी, शौचालय और सुरक्षित नींद की निगरानी',
      ta: 'இரவில் மருந்து, தண்ணீர், கழிப்பறை உதவி & பாதுகாப்பு',
      kn: 'ರಾತ್ರಿ ವೇಳೆ ಔಷಧಿ, ನೀರು ಮತ್ತು ಶೌಚಾಲಯ ನೆರವು',
      ml: 'രാത്രി മരുന്ന്, വെള്ളം, സുരക്ഷിത പരിചരണം',
    },
    languages: 'Tamil',
    rate: { en: '₹850 / night', hi: '₹850 / रात', ta: '₹850 / இரவு', kn: '₹850 / ರಾತ್ರಿ', ml: '₹850 / രാത്രി' },
    available: { en: 'Available Tonight', hi: 'आज रात उपलब्ध', ta: 'இன்று இரவு கிடைக்கும்', kn: 'ಇಂದು ರಾತ್ರಿ ಲಭ್ಯ', ml: 'ഇന്ന് രാത്രി ലഭ്യമാണ്' },
  },
  {
    id: 'coord-saravanan',
    name: {
      en: 'Saravanan P. - Medicine & Lab Courier',
      hi: 'शर्वणन पी. - दवा व लैब टेस्ट कूरियर',
      ta: 'சரவணன் பி. - மருந்து & பரிசோதனை டெலிவரி',
      kn: 'ಶರವಣನ್ ಪಿ. - ಔಷಧಿ ಮತ್ತು ಲ್ಯಾಬ್ ಕೊರಿಯರ್',
      ml: 'ശരവണൻ പി. - മരുന്ന് & ലാബ് കൊറിയർ',
    },
    role: {
      en: 'Jan Aushadhi Medicine Pickup & Blood Sample Drop',
      hi: 'जन औषधि केंद्र से दवा लाना व लैब रिपोर्ट लाना',
      ta: 'ஜன் ஔஷதி மருந்து வாங்கி வருதல் & ரத்த மாதிரி சேகரிப்பு',
      kn: 'ಜನ್ ಔಷಧಿ ಅಂಗಡಿಯಿಂದ ಔಷಧಿ & ಲ್ಯಾಬ್ ಮಾದರಿ ಸಂಗ್ರಹ',
      ml: 'മരുന്ന് വാങ്ങൽ & ലാബ് സാമ്പിൾ ശേഖരണം',
    },
    phone: '+91 97910 55667',
    rating: '4.8',
    reviewsCount: 230,
    experience: {
      en: 'Fast 45-min prescription pickup from government & private shops',
      hi: '45 मिनट में सरकारी व निजी दुकानों से दवा पहुँचाना',
      ta: '45 நிமிடத்தில் மருந்து சீட்டு டெலிவரி சேவை',
      kn: '45 ನಿಮಿಷಗಳಲ್ಲಿ ಮನೆ ಬಾಗಿಲಿಗೆ ಔಷಧ ವಿತರಣೆ',
      ml: '45 മിനിറ്റിനകം വീട്ടിൽ മരുന്ന് എത്തിക്കൽ',
    },
    languages: 'Tamil',
    rate: { en: '₹99 / delivery', hi: '₹99 / डिलीवरी', ta: '₹99 / சேவை', kn: '₹99 / ಡೆಲಿವರಿ', ml: '₹99 / ഡെലിവറി' },
    available: { en: 'Available Now', hi: 'अभी उपलब्ध', ta: 'உடனடி சேவை', kn: 'ಈಗ ಲಭ್ಯ', ml: 'ഉടൻ ലഭ്യമാണ്' },
  },
  {
    id: 'coord-desk',
    name: {
      en: 'Hello Sahay Care Coordinator Desk',
      hi: 'हेलो सहाय केयर समन्वयक डेस्क',
      ta: 'ஹலோ சஹாய் ஒருங்கிணைப்பாளர் உதவி மையம்',
      kn: 'ಹಲೋ ಸಹಾಯ್ ಕೇರ್ ಸಂಯೋಜಕ ಡೆಸ್ಕ್',
      ml: 'ഹലോ സഹായ് കെയർ കോർഡിനേറ്റർ ഡെസ്ക്',
    },
    role: {
      en: '24/7 Dedicated Ambulance & Emergency Coordinator',
      hi: '24 घंटे आपातकालीन एम्बुलेंस व डॉक्टर सहायता',
      ta: '24/7 அவசர உதவி, ஆம்புலன்ஸ் & மருத்துவர் ஒருங்கிணைப்பு',
      kn: '24/7 ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ತುರ್ತು ವೈದ್ಯಕೀಯ ಸಂಯೋಜನೆ',
      ml: '24/7 ആംബുലൻസ്, അടിയന്തര ഡോക്ടർ ഏകോപനം',
    },
    phone: '+91 93989 66523',
    rating: '5.0',
    reviewsCount: 450,
    experience: {
      en: 'Direct emergency bed allotment, doctor on call & ambulance',
      hi: 'तुरंत अस्पताल बेड, ऑन-कॉल डॉक्टर व सरकारी सहायता',
      ta: 'உடனடி மருத்துவமனை படுக்கை & அரசு நலத்திட்ட வழிகாட்டல்',
      kn: 'ತಕ್ಷಣದ ಆಸ್ಪತ್ರೆ ಬೆಡ್ ಮತ್ತು ವೈದ್ಯರ ನೇರ ಸಂಪರ್ಕ',
      ml: 'ഉടനടി ആശുപത്രി സൗകര്യം & ആംബുലൻസ്',
    },
    languages: 'Tamil, Hindi, Kannada, Malayalam, English',
    rate: { en: 'Free Helpline', hi: 'मुफ़्त हेल्पलाइन', ta: 'இலவச உதவி', kn: 'ಉಚಿತ ಸಹಾಯವಾಣಿ', ml: 'സൗജന്യ ഹെൽപ്‌ലൈൻ' },
    available: { en: 'Always 24/7 Active', hi: 'हमेशा सक्रिय 24/7', ta: '24 மணிநேரமும் தயார்', kn: 'ಯಾವಾಗಲೂ ಲಭ್ಯ 24/7', ml: 'എപ്പോഴും സജീവം 24/7' },
    badge: { en: '24/7 Helpline', hi: '24/7 हेल्पलाइन', ta: '24/7 உதவி எண்', kn: '24/7 ಸಹಾಯವಾಣಿ', ml: '24/7 ഹെൽപ്‌ലൈൻ' },
  },
];

const QUICK_NEEDS: LangMap<string>[] = [
  { en: 'Wheelchair Assistance', hi: 'व्हीलचेयर सहायता', ta: 'சக்கர நாற்காலி உதவி', kn: 'ವೀಲ್‌ಚೇರ್ ನೆರವು', ml: 'വീൽചെയർ സഹായം' },
  { en: 'Hospital Escort', hi: 'अस्पताल ले जाने वाला साथी', ta: 'மருத்துவமனை துணை', kn: 'ಆಸ್ಪತ್ರೆಗೆ ಜೊತೆಗಾರ', ml: 'ആശുപത്രി കൂട്ട്' },
  { en: 'Night Nurse Attendant', hi: 'रात की नर्स परिचारक', ta: 'இரவு நர்ஸ் உதவி', kn: 'ರಾತ್ರಿ ನರ್ಸ್ ನೆರವು', ml: 'രാത്രി നഴ്സ് പരിചരണം' },
  { en: 'Medicine Home Delivery', hi: 'दवा घर पहुँचाना', ta: 'மருந்து வீடு தேடி வர', kn: 'ಔಷಧಿ ಮನೆ ಬಾಗಿಲಿಗೆ', ml: 'മരുന്ന് ഹോം ഡെലിവറി' },
  { en: 'Home Blood Sample Collection', hi: 'घर पर खून की जाँच', ta: 'வீட்டில் ரத்தப் பரிசோதனை', kn: 'ಮನೆಯಲ್ಲೇ ರಕ್ತ ಪರೀಕ್ಷೆ', ml: 'വീട്ടിൽ രക്തപരിശോധന' },
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

  // Real location fetched from AWS backend
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
    person: ProviderPerson;
    serviceTitle: string;
  } | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(tomorrowIso);
  const [calYear, setCalYear] = useState<number>(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(todayObj.getMonth());
  const [bookingSlot, setBookingSlot] = useState<string>('morning');
  const [patientName, setPatientName] = useState<string>(userSettings.userName || '');
  const [contactPhone, setContactPhone] = useState<string>(userSettings.userPhone || '');
  const [serviceAddress, setServiceAddress] = useState<string>(effectiveRealLocation);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Custom request state
  const [customNeedText, setCustomNeedText] = useState<string>('');
  const [customSubmitted, setCustomSubmitted] = useState<boolean>(false);
  const [customSubmitting, setCustomSubmitting] = useState<boolean>(false);

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
      return `${L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'இன்று' })} (${new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    }
    if (iso === tomorrowIso) {
      return `${L({ en: 'Tomorrow', hi: 'कल', ta: 'நாளை', kn: 'ನಾಳೆ', ml: 'நாளை' })} (${new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
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

  const handleOpenBooking = (person: ProviderPerson, serviceTitle: string) => {
    setSelectedPersonForBooking({ person, serviceTitle });
    setBookingSuccess(false);
    setBookingDate(tomorrowIso);
    setBookingSlot('morning');
    setServiceAddress(effectiveRealLocation);
    setPatientName(userSettings.userName || '');
    setContactPhone(userSettings.userPhone || '');
    setCalYear(todayObj.getFullYear());
    setCalMonth(todayObj.getMonth());
  };

  const handleConfirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedPersonForBooking(null);
      setBookingSuccess(false);
    }, 3500);
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customNeedText.trim()) return;
    setCustomSubmitting(true);
    setTimeout(() => {
      setCustomSubmitting(false);
      setCustomSubmitted(true);
    }, 600);
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

    const peopleList: ProviderPerson[] = isCustomNeedCategory
      ? CUSTOM_COORDINATORS
      : currentCategoryData
      ? currentCategoryData.providers
      : [];

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
            {L({
              en: 'Verified people available near you with direct phone numbers',
              hi: 'सीधे फोन नंबर के साथ आपके क्षेत्र में उपलब्ध सत्यापित लोग',
              ta: 'நேரடி தொலைபேசி எண்ணுடன் உங்களுக்கு அருகில் உள்ள சரிபார்க்கப்பட்ட நபர்கள்',
              kn: 'ನೇರ ಫೋನ್ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಹತ್ತಿರ ಲಭ್ಯವಿರುವ ಪರಿಶೀಲಿಸಿದ ಸಿಬ್ಬಂದಿ',
              ml: 'നേരിട്ടുള്ള ഫോൺ നമ്പറുകളോടെ നിങ്ങൾക്ക് സമീപം ലഭ്യമായ പരിശോധിച്ച വ്യക്തികൾ',
            })}
          </p>
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2.5 border-2 border-teal-200 text-teal-950 text-lg font-extrabold shadow-sm">
            <MapPin className="w-6 h-6 text-teal-800 shrink-0" />
            <span>{effectiveRealLocation}</span>
            <span className="text-xs font-black uppercase tracking-wider bg-teal-800 text-white px-2.5 py-0.5 rounded-full">
              {L({ en: 'AWS Backend Location', hi: 'AWS सर्वर डेटा', ta: 'AWS நேரலை தரவு', kn: 'AWS ನೈಜ ಡೇಟಾ', ml: 'AWS തത്സമയ ഡാറ്റ' })}
            </span>
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
                  {L({
                    en: 'Our Sahay care team will organize verified help within 15 minutes',
                    hi: 'हमारी सहाय टीम 15 मिनट में सत्यापित सहायता उपलब्ध कराएगी',
                    ta: 'எங்கள் சஹாய் குழு 15 நிமிடங்களில் உதவி ஏற்பாடு செய்யும்',
                    kn: 'ನಮ್ಮ ಸಹಾಯ್ ತಂಡ 15 ನಿಮಿಷಗಳಲ್ಲಿ ಸಹಾಯವನ್ನು ವ್ಯವಸ್ಥೆ ಮಾಡುತ್ತದೆ',
                    ml: 'ഞങ്ങളുടെ സഹായ് ടീം 15 മിനിറ്റിനകം സഹായം ക്രമീകരിക്കും',
                  })}
                </p>
              </div>
            </div>

            {customSubmitted ? (
              <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-400 p-6 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-extrabold text-emerald-950">
                  {L({
                    en: 'Request Received!',
                    hi: 'अनुरोध प्राप्त हुआ!',
                    ta: 'கோரிக்கை பெறப்பட்டது!',
                    kn: 'ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!',
                    ml: 'അഭ്യർത്ഥന ലഭിച്ചു!',
                  })}
                </h4>
                <p className="text-lg text-emerald-900 font-bold">
                  {L({
                    en: 'Our coordinator will call you back shortly.',
                    hi: 'हमारे समन्वयक जल्द ही आपको कॉल करेंगे।',
                    ta: 'எங்கள் ஒருங்கிணைப்பாளர் விரைவில் உங்களை அழைப்பார்.',
                    kn: 'ನಮ್ಮ ಸಂಯೋಜಕರು ಶೀಘ್ರದಲ್ಲೇ ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತಾರೆ.',
                    ml: 'ഞങ്ങളുടെ കോർഡിനേറ്റർ ഉടൻ തിരിച്ചുവിളിക്കും.',
                  })}
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

                <div className="space-y-3">
                  <BigButton
                    type="submit"
                    disabled={!customNeedText.trim() || customSubmitting}
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
                {L({
                  en: 'Or Call Dedicated Coordinators Directly',
                  hi: 'या सीधे समर्पित समन्वयकों को कॉल करें',
                  ta: 'அல்லது ஒருங்கிணைப்பாளர்களை நேரடியாக அழைக்கவும்',
                  kn: 'ಅಥವಾ ನೇರವಾಗಿ ಸಂಯೋಜಕರಿಗೆ ಕರೆ ಮಾಡಿ',
                  ml: 'അല്ലെങ്കിൽ കോർഡിനേറ്റർമാരെ നേരിട്ട് വിളിക്കുക',
                })}
              </SectionTitle>
            </div>
          </section>
        )}

        {/* 4 People Cards with Direct Phone Numbers & Action Buttons */}
        <div className="space-y-5">
          {peopleList.map((person, idx) => (
            <section
              key={person.id}
              className="overflow-hidden rounded-3xl border-2 border-slate-300 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-teal-800 hover:shadow-md space-y-4"
            >
              <div className="flex items-start gap-4">
                {/* Person Avatar / Photo with 100% Visible Head */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-100 border-2 border-slate-300 overflow-hidden shrink-0 flex items-start justify-center pt-1 shadow-inner">
                  {person.image ? (
                    <img
                      src={person.image}
                      alt={pick(currentLang, person.name)}
                      className="h-full w-full object-cover object-top scale-105 origin-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-700 to-teal-900 flex flex-col items-center justify-center text-white text-center p-1">
                      <User className="w-12 h-12 mb-1" />
                      <span className="text-sm font-black">#{idx + 1}</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 rounded-full bg-emerald-700 text-white p-1 shadow">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>

                {/* Person Core Info with Big Elderly-Friendly Typography */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                      {pick(currentLang, person.name)}
                    </h2>
                    {person.badge && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-950 border border-amber-300">
                        ★ {pick(currentLang, person.badge)}
                      </span>
                    )}
                  </div>

                  <p className="text-xl font-black text-teal-900">
                    {pick(currentLang, person.role)}
                  </p>

                  <p className="text-lg font-bold text-slate-700">
                    {pick(currentLang, person.experience)}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-base font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-amber-700">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span>{person.rating} ({person.reviewsCount} reviews)</span>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-800 font-black">
                      {pick(currentLang, person.available)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5 text-base font-bold text-slate-800">
                    <MapPin className="w-5 h-5 text-teal-800 shrink-0" />
                    <span>{L({ en: 'Serving Location', hi: 'सेवा क्षेत्र', ta: 'சேவை இருப்பிடம்', kn: 'ಸೇವಾ ಸ್ಥಳ', ml: 'സേവന സ്ഥലം' })}: <strong className="text-teal-950">{effectiveRealLocation}</strong></span>
                  </div>
                </div>
              </div>

              {/* Prominent Direct Phone Number & Fee Highlight */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-teal-50 border-2 border-teal-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-teal-800 block">
                      {L({ en: 'Direct Phone Number', hi: 'सीधा मोबाइल नंबर', ta: 'நேரடி கைபேசி எண்', kn: 'ನೇರ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', ml: 'ഫോൺ നമ്പർ' })}
                    </span>
                    <a
                      href={`tel:${person.phone}`}
                      className="text-2xl sm:text-3xl font-black text-slate-900 hover:text-teal-900 underline decoration-teal-600 underline-offset-4 tracking-wider"
                    >
                      {person.phone}
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600 block">
                    {L({ en: 'Fee / Rate', hi: 'शुल्क', ta: 'கட்டணம்', kn: 'ಶುಲ್ಕ', ml: 'നിരക്ക്' })}
                  </span>
                  <span className="text-2xl font-black text-teal-950">
                    {pick(currentLang, person.rate)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Big Touch Direct Call & Book */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <BigButton
                  variant="primary"
                  href={`tel:${person.phone}`}
                  icon={<Phone className="w-7 h-7" />}
                >
                  {L({ en: 'Call Now', hi: 'फ़ोन मिलाएँ', ta: 'அழைக்கவும்', kn: 'ಕರೆ ಮಾಡಿ', ml: 'വിളിക്കുക' })}
                </BigButton>

                <BigButton
                  onClick={() => handleOpenBooking(person, categoryTitle)}
                  icon={<Calendar className="w-6 h-6" />}
                >
                  {L({ en: 'Book Visit', hi: 'समय तय करें', ta: 'பதிவு செய்', kn: 'ಬುಕ್ ಮಾಡಿ', ml: 'ബുക്ക് ചെയ്യുക' })}
                </BigButton>
              </div>
            </section>
          ))}
        </div>

        {/* Booking Modal */}
        {selectedPersonForBooking && (
          <Sheet
            title={L({
              en: `Book ${pick(currentLang, selectedPersonForBooking.person.name)}`,
              hi: `${pick(currentLang, selectedPersonForBooking.person.name)} बुक करें`,
              ta: `${pick(currentLang, selectedPersonForBooking.person.name)} பதிவு செய்`,
              kn: `${pick(currentLang, selectedPersonForBooking.person.name)} ಬುಕ್ ಮಾಡಿ`,
              ml: `${pick(currentLang, selectedPersonForBooking.person.name)} ബുക്ക് ചെയ്യുക`,
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
                  {L({
                    en: 'Booking Request Confirmed!',
                    hi: 'बुकिंग अनुरोध प्राप्त हुआ!',
                    ta: 'பதிவு கோரிக்கை பெறப்பட்டது!',
                    kn: 'ಬುಕಿಂಗ್ ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!',
                    ml: 'ബുക്കിംഗ് അഭ്യർത്ഥന ലഭിച്ചു!',
                  })}
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed font-semibold">
                  {L({
                    en: `We have registered your request for ${pick(currentLang, selectedPersonForBooking.person.name)} on ${formatFriendlyDate(bookingDate)} at ${serviceAddress}. They will call you directly at ${contactPhone} shortly.`,
                    hi: `आपका अनुरोध ${formatFriendlyDate(bookingDate)} के लिए ${serviceAddress} पर दर्ज कर लिया गया है। वे सीधे आपके मोबाइल ${contactPhone} पर संपर्क करेंगे।`,
                    ta: `${pick(currentLang, selectedPersonForBooking.person.name)} முன்பதிவு ${formatFriendlyDate(bookingDate)} அன்று ${serviceAddress} முகவரியில் பதிவு செய்யப்பட்டுள்ளது. அவர்கள் நேரடியாக ${contactPhone} எண்ணை அழைப்பார்கள்.`,
                    kn: `${pick(currentLang, selectedPersonForBooking.person.name)} ಬುಕಿಂಗ್ ${formatFriendlyDate(bookingDate)} ರಂದು ${serviceAddress} ವಿಳಾಸದಲ್ಲಿ ದಾಖಲಾಗಿದೆ. ಅವರು ನೇರವಾಗಿ ${contactPhone} ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡುತ್ತಾರೆ.`,
                    ml: `${pick(currentLang, selectedPersonForBooking.person.name)} ബുക്കിംഗ് ${formatFriendlyDate(bookingDate)} തീയതിയിൽ ${serviceAddress} മേൽവിലാസത്തിൽ രജിസ്റ്റർ ചെയ്തു. അവർ ${contactPhone} നമ്പറിൽ വിളിക്കും.`,
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-teal-50 p-4 border border-teal-200">
                  <p className="text-2xl font-black text-teal-950">
                    {pick(currentLang, selectedPersonForBooking.person.name)}
                  </p>
                  <p className="text-base font-bold text-teal-900">
                    {pick(currentLang, selectedPersonForBooking.person.role)}
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {L({ en: 'Fee', hi: 'शुल्क', ta: 'கட்டணம்', kn: 'ಶುಲ್ಕ', ml: 'നിരക്ക്' })}: {pick(currentLang, selectedPersonForBooking.person.rate)}
                  </p>
                </div>

                {/* Real Location collected from AWS Backend */}
                <div className="rounded-2xl bg-teal-50 border-2 border-teal-300 p-4 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-800" />
                      {L({ en: 'Collected Location (AWS Backend)', hi: 'दर्ज लोकेशन (AWS सर्वर डेटा)', ta: 'பதிவு செய்யப்பட்ட இருப்பிடம்', kn: 'ದಾಖಲಾದ ನೈಜ ಸ್ಥಳ (AWS)', ml: 'രേഖപ്പെടുത്തിയ സ്ഥലം (AWS)' })}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ✓ {L({ en: 'Live Data', hi: 'सत्यापित डेटा', ta: 'நேரலை தரவு', kn: 'ನೈಜ ಮಾಹಿತಿ', ml: 'യഥാർത്ഥ ഡാറ്റ' })}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-teal-950">
                    {effectiveRealLocation}
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
                      {L({ en: 'Today', hi: 'आज', ta: 'இன்று', kn: 'ಇಂದು', ml: 'இன்று' })} ({todayObj.getDate()} {MONTH_NAMES[currentLang]?.[todayObj.getMonth()]?.slice(0, 3) || 'Nov'})
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
                      {L({ en: 'Tomorrow', hi: 'कल', ta: 'நாளை', kn: 'ನಾಳೆ', ml: 'நாளை' })} ({tomorrowObj.getDate()} {MONTH_NAMES[currentLang]?.[tomorrowObj.getMonth()]?.slice(0, 3) || 'Nov'})
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
                    {[
                      { id: 'morning', label: L({ en: 'Morning', hi: 'सुबह', ta: 'காலை', kn: 'ಬೆಳಿಗ್ಗೆ', ml: 'രാവിലെ' }) },
                      { id: 'afternoon', label: L({ en: 'Afternoon', hi: 'दोपहर', ta: 'மதியம்', kn: 'ಮಧ್ಯಾಹ್ನ', ml: 'ഉച്ചയ്ക്ക്' }) },
                      { id: 'full-day', label: L({ en: 'Full Day', hi: 'पूरा दिन', ta: 'முழு நாள்', kn: 'ಪೂರ್ಣ ದಿನ', ml: 'മുഴുവൻ ദിവസം' }) },
                    ].map((s) => (
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
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    {L({ en: 'Patient / Person Name', hi: 'मरीज़ / व्यक्ति का नाम', ta: 'நோயாளி / நபர் பெயர்', kn: 'ವ್ಯಕ್ತಿಯ ಹೆಸರು', ml: 'വ്യക്തിയുടെ പേര്' })}
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={L({ en: 'e.g. Lakshmi Ammal', hi: 'उदा. लक्ष्मी अम्माल', ta: 'உதா: லட்சுமி அம்மாள்', kn: 'ಉದಾ: ಲಕ್ಷ್ಮಿ ಅಮ್ಮಾಳ್', ml: 'ഉദാ: ലക്ഷ്മി അമ്മാൾ' })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    {L({ en: 'Phone number for confirmation', hi: 'पुष्टि के लिए मोबाइल नंबर', ta: 'உறுதிப்படுத்த கைபேசி எண்', kn: 'ದೃಢೀಕರಣಕ್ಕಾಗಿ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', ml: 'സ്ഥിരീകരണത്തിനായി ഫോൺ നമ്പർ' })}
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
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
                    {L({
                      en: 'Pre-filled with your real location collected from the backend. You can add your door number or street.',
                      hi: 'सर्वर में दर्ज आपकी असली लोकेशन से भरा गया है। आप मकान या गली का नाम जोड़ सकते हैं।',
                      ta: 'சர்வரில் சேகரிக்கப்பட்ட உங்கள் நேரலை இருப்பிடத்துடன் நிரப்பப்பட்டது. கதவு எண் அல்லது தெருவைச் சேர்க்கலாம்.',
                      kn: 'ಸರ್ವರ್‌ನಲ್ಲಿ ದಾಖಲಾದ ನಿಮ್ಮ ನೈಜ ಸ್ಥಳ. ನೀವು ಮನೆ ಸಂಖ್ಯೆ ಅಥವಾ ರಸ್ತೆ ಹೆಸರನ್ನು ಸೇರಿಸಬಹುದು.',
                      ml: 'സെർവറിൽ രേഖപ്പെടുത്തിയ നിങ്ങളുടെ യഥാർത്ഥ സ്ഥലം. വീട്ടുനമ്പറോ റോഡോ ചേർക്കാം.',
                    })}
                  </p>
                </div>

                <div className="pt-2">
                  <BigButton onClick={handleConfirmBooking} icon={<CheckCircle2 className="w-6 h-6" />}>
                    {L({
                      en: 'Confirm Booking Request',
                      hi: 'बुकिंग अनुरोध की पुष्टि करें',
                      ta: 'முன்பதிவு கோரிக்கையை உறுதி செய்',
                      kn: 'ಬುಕಿಂಗ್ ವಿನಂತಿಯನ್ನು ದೃಢೀಕರಿಸಿ',
                      ml: 'ಬುക്കിംഗ് സ്ഥിരീകരിക്കുക',
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
          sub={L({
            en: 'Tap any box below to see verified people near you with phone numbers',
            hi: 'सीधे फोन नंबर वाले सत्यापित लोगों को देखने के लिए नीचे किसी भी बॉक्स पर टैप करें',
            ta: 'உங்களுக்கு அருகில் உள்ள சரிபார்க்கப்பட்ட நபர்கள் மற்றும் எண்களைக் காண ஏதேனும் கட்டத்தைத் தொடவும்',
            kn: 'ಫೋನ್ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಸಿಬ್ಬಂದಿಯನ್ನು ನೋಡಲು ಕೆಳಗಿನ ಯಾವುದೇ ಬಾಕ್ಸ್ ಅನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ',
            ml: 'പരിശോധിച്ചുറപ്പിച്ച ജീവനക്കാരെയും ഫോൺ നമ്പറുകളെയും കാണാൻ താഴെയുള്ള ബോക്സിൽ തൊടുക',
          })}
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
          <span>{L({ en: 'Real Service Area (AWS Backend)', hi: 'सेवा क्षेत्र (AWS सर्वर)', ta: 'சேவை பகுதி (AWS சர்வர்)', kn: 'ಸೇವಾ ಪ್ರದೇಶ (AWS ಸರ್ವರ್)', ml: 'സേവന മേഖല (AWS സെർവർ)' })}: <strong>{effectiveRealLocation}</strong></span>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl bg-teal-50 border-2 border-teal-200 p-4 sm:p-5 text-teal-950 shadow-sm">
          <ShieldCheck className="w-9 h-9 shrink-0 text-teal-800" aria-hidden />
          <p className="text-lg sm:text-xl font-extrabold leading-snug">
            {L({
              en: 'All Sahay staff are verified, background-checked and trained for elderly home care.',
              hi: 'सभी कर्मचारी पुलिस-सत्यापित और बुजुर्ग होम केयर में पूरी तरह प्रशिक्षित हैं।',
              ta: 'அனைத்து பணியாளர்களும் காவல்துறை சரிபார்ப்பு மற்றும் முதியோர் பராமரிப்பு பயிற்சி பெற்றவர்கள்.',
              kn: 'ಎಲ್ಲಾ ಸಿಬ್ಬಂದಿ ಪೊಲೀಸ್ ಪರಿಶೀಲನೆ ಮತ್ತು ಹಿರಿಯರ ಆರೈಕೆಯಲ್ಲಿ ತರಬೇತಿ ಪಡೆದಿದ್ದಾರೆ.',
              ml: 'എല്ലാ ജീവനക്കാരും പോലീസ് പരിശോധനയും രോഗി പരിചരണ പരിശീലനവും നേടിയവരാണ്.',
            })}
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
                <span>{L({ en: '4 People Available', hi: '4 लोग उपलब्ध', ta: '4 நபர்கள் தயார்', kn: '4 ಜನರು ಲಭ್ಯ', ml: '4 ആളുകൾ ലഭ്യമാണ്' })}</span>
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
    </div>
  );
};