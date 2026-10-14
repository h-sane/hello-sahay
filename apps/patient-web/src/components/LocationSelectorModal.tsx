import React, { useState } from 'react';
import {
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  X,
  Navigation,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Language, UserCoordinates } from '../types';
import { INDIAN_LOCATION_PRESETS, LocationPreset, locationService } from '../services/locationService';

interface LocationSelectorModalProps {
  isOpen: boolean;
  isInitialPopup?: boolean;
  currentCoords: UserCoordinates;
  currentLang: Language;
  onSelectLocation: (coords: UserCoordinates) => void;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  isInitialPopup = false,
  currentCoords,
  currentLang,
  onSelectLocation,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');

  if (!isOpen) return null;

  const detectingStatusTexts: Record<Language, string> = {
    hi: 'सटीक जीपीएस / नेटवर्क स्थान खोजा जा रहा है...',
    ta: 'நேரடி ஜிபிஎஸ் / நெட்வொர்க் இருப்பிடத்தை கண்டறிகிறது...',
    te: 'ప్రత్యక్ష GPS / నెట్‌వర్క్ స్థానాన్ని గుర్తిస్తోంది...',
    kn: 'ನೇರ ಜಿಪಿಎಸ್ / ನೆಟ್‌ವರ್ಕ್ ಸ್ಥಳವನ್ನು ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...',
    ml: 'ലൈവ് ജിപിഎസ് ലൊക്കേഷൻ കണ്ടെത്തുന്നു...',
    bn: 'লাইভ জিপিএস / নেটওয়ার্ক অবস্থান অনুসন্ধান করা হচ্ছে...',
    mr: 'थेट जीपीएस / नेटवर्क स्थान शोधत आहे...',
    gu: 'લાઇવ જીપીએસ / નેટવર્ક સ્થાન શોધી રહ્યું છે...',
    en: 'Detecting live GPS / Network location & closest hospitals...',
  };

  const detectedSuccessTexts: Record<Language, (name: string) => string> = {
    hi: (name) => `स्थान सफलतापूर्वक चुना गया: ${name}`,
    ta: (name) => `அமைவிடம் உறுதிசெய்யப்பட்டது: ${name}`,
    te: (name) => `స్థానం విజయవంతంగా ఎంపికైంది: ${name}`,
    kn: (name) => `ಸ್ಥಳವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ: ${name}`,
    ml: (name) => `ലൊക്കേഷൻ കണ്ടെത്തി: ${name}`,
    bn: (name) => `অবস্থান সফলভাবে নির্বাচিত: ${name}`,
    mr: (name) => `स्थान यशस्वीरित्या निश्चित केले: ${name}`,
    gu: (name) => `સ્થાન સફળતાપૂર્વક પસંદ થયું: ${name}`,
    en: (name) => `Location detected: ${name}`,
  };

  const manualSelectedTexts: Record<Language, (name: string, state: string) => string> = {
    hi: (name, state) => `चुना गया: ${name}, ${state}`,
    ta: (name, state) => `தேர்ந்தெடுக்கப்பட்டது: ${name}, ${state}`,
    te: (name, state) => `ఎంపిక చేయబడింది: ${name}, ${state}`,
    kn: (name, state) => `ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ: ${name}, ${state}`,
    ml: (name, state) => `തിരഞ്ഞെടുത്തു: ${name}, ${state}`,
    bn: (name, state) => `নির্বাচিত: ${name}, ${state}`,
    mr: (name, state) => `निवडले: ${name}, ${state}`,
    gu: (name, state) => `પસંદ કર્યું: ${name}, ${state}`,
    en: (name, state) => `Selected: ${name}, ${state}`,
  };

  const gpsFailedTexts: Record<Language, string> = {
    hi: 'जीपीएस उपलब्ध नहीं है। कृपया नीचे से अपना जिला चुनें।',
    ta: 'ஜிபிஎஸ் கிடைக்கவில்லை. கீழே உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்.',
    te: 'GPS అందుబాటులో లేదు. దయచేసి క్రింద మీ జిల్లాను ఎంచుకోండి.',
    kn: 'ಜಿಪಿಎಸ್ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗೆ ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    ml: 'ജിപിഎസ് ലഭ്യമല്ല. താഴെ നിന്ന് നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക.',
    bn: 'জিপিএস উপলভ্য নেই। অনুগ্রহ করে নিচে থেকে আপনার জেলা নির্বাচন করুন।',
    mr: 'जीपीएस उपलब्ध नाही. कृपया खालून आपला जिल्हा निवडा.',
    gu: 'જીપીએસ ઉપલબ્ધ નથી. કૃપા કરીને નીચેથી તમારો જિલ્લો પસંદ કરો.',
    en: 'GPS unavailable. Please tap your district below.',
  };

  const handleAutoGps = async () => {
    setIsDetectingGps(true);
    setStatusMessage(detectingStatusTexts[currentLang] || detectingStatusTexts.en);

    try {
      const coords = await locationService.detectUserLocation();
      const name = coords.districtDetected || 'India';
      const successFn = detectedSuccessTexts[currentLang] || detectedSuccessTexts.en;
      setStatusMessage(successFn(name));

      setTimeout(() => {
        setIsDetectingGps(false);
        onSelectLocation(coords);
        onClose();
      }, 600);
    } catch (err) {
      console.warn('GPS detection failed:', err);
      setIsDetectingGps(false);
      setStatusMessage(gpsFailedTexts[currentLang] || gpsFailedTexts.en);
    }
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    const coords = locationService.setManualLocation(preset);
    const selectFn = manualSelectedTexts[currentLang] || manualSelectedTexts.en;
    setStatusMessage(selectFn(preset.name, preset.state));

    setTimeout(() => {
      onSelectLocation(coords);
      onClose();
    }, 350);
  };

  const filteredPresets = INDIAN_LOCATION_PRESETS.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState =
      selectedStateFilter === 'all' || p.state.toLowerCase().includes(selectedStateFilter.toLowerCase());

    return matchesSearch && matchesState;
  });

  const texts: Record<
    Language,
    {
      main: string;
      sub: string;
      currentLoc: string;
      activeBadge: string;
      recommendedGps: string;
      gpsBtn: string;
      gpsBtnLoading: string;
      gpsSub: string;
      orManual: string;
      searchPh: string;
      allRegions: string;
      continueBtn: string;
      footerNote: string;
      quickDistrictsTitle: string;
    }
  > = {
    hi: {
      main: 'अपना स्वास्थ्य सेवा स्थान चुनें',
      sub: 'हैलो सहाय आपके स्थान के अनुसार नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC), तालुक अस्पताल और आपातकालीन सेवाएं सुझाएगा।',
      currentLoc: 'सक्रिय स्थान:',
      activeBadge: 'सक्रिय',
      recommendedGps: 'स्वचालित जीपीएस (अनुशंसित)',
      gpsBtn: 'मेरा वर्तमान जीपीएस स्थान खोजें',
      gpsBtnLoading: 'स्थान खोजा जा रहा है...',
      gpsSub: 'निकटतम स्वास्थ्य केंद्र व वास्तविक दूरी (km) स्वतः खोजें',
      orManual: 'या 1-टैप से अपना जिला / क्षेत्र चुनें',
      searchPh: 'जिला या शहर खोजें (उदा. चेंगलपट्टू, गोरखपुर, वाराणसी, पुणे, लखनऊ)...',
      allRegions: 'सभी राज्य',
      continueBtn: 'सहेजें व अस्पताल देखें →',
      footerNote: 'निकटतम अस्पतालों व यात्रा दूरी की स्वतः गणना',
      quickDistrictsTitle: 'प्रमुख स्वास्थ्य जिले (सीधे टैप करें):',
    },
    ta: {
      main: 'உங்கள் மருத்துவ இருப்பிடத்தை தேர்ந்தெடுக்கவும்',
      sub: 'ஹலோ சஹாய் உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள அரசு ஆரம்ப சுகாதார நிலையங்கள் (PHC) மற்றும் தலைமை மருத்துவமனைகளை பரிந்துரைக்கும்.',
      currentLoc: 'தற்போதைய பகுதி:',
      activeBadge: 'செயலில்',
      recommendedGps: 'தானியங்கி இருப்பிடம் (பரிந்துரைக்கப்படுகிறது)',
      gpsBtn: 'என் நேரடி GPS இருப்பிடத்தை கண்டறி',
      gpsBtnLoading: 'இருப்பிடம் தேடப்படுகிறது...',
      gpsSub: 'அருகிலுள்ள ஆரம்ப சுகாதார நிலையங்கள் மற்றும் தூரத்தை உடனடியாக கணக்கிடும்',
      orManual: 'அல்லது மாவட்டத்தை நீங்களே 1-தட்டலில் தேர்ந்தெடுக்கவும்',
      searchPh: 'மாவட்டம் அல்லது ஊர் பெயரை தேடவும் (எ.கா: செங்கல்பட்டு, மதுரை, காஞ்சிபுரம், திருச்சி)...',
      allRegions: 'அனைத்து பகுதிகள்',
      continueBtn: 'சேமித்து தொடரவும் →',
      footerNote: 'அருகிலுள்ள மருத்துவமனைகளின் தூரம் உடனடியாக கணக்கிடப்படும்',
      quickDistrictsTitle: 'முக்கிய மாவட்டங்கள் (உடனே தட்டவும்):',
    },
    te: {
      main: 'మీ ఆరోగ్య సంరక్షణ స్థానాన్ని ఎంచుకోండి',
      sub: 'సమీపంలోని ప్రాథమిక ఆరోగ్య కేంద్రాలు మరియు ఆసుపత్రులను కనుగొనడానికి మీ స్థానాన్ని నమోదు చేయండి.',
      currentLoc: 'ప్రస్తుత స్థానం:',
      activeBadge: 'యాక్టివ్',
      recommendedGps: 'ఆటో జీపీఎస్ (సిఫార్సు చేయబడింది)',
      gpsBtn: 'నా ప్రస్తుత జీపీఎస్ స్థానాన్ని కనుగొనండి',
      gpsBtnLoading: 'లొకేషన్ వెతుకుతోంది...',
      gpsSub: 'సమీప పీహెచ్‌సీలు మరియు దూరాన్ని తక్షణమే లెక్కిస్తుంది',
      orManual: 'లేదా జిల్లా / పట్టణాన్ని నేరుగా ఎంచుకోండి',
      searchPh: 'జిల్లా లేదా పట్టణాన్ని వెతకండి (ఉదా: గుంటూరు, హైదరాబాద్, విశాఖ)...',
      allRegions: 'అన్ని ప్రాంతాలు',
      continueBtn: 'కొనసాగించండి →',
      footerNote: 'సమీప ఆసుపత్రుల తక్షణ గణన',
      quickDistrictsTitle: 'ప్రముఖ జిల్లాలు (ఒక ట్యాప్):',
    },
    kn: {
      main: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಸೇವಾ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      sub: 'ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಲು ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ನಿಗದಿಪಡಿಸಿ.',
      currentLoc: 'ಪ್ರಸ್ತುತ ಸ್ಥಳ:',
      activeBadge: 'ಸಕ್ರಿಯ',
      recommendedGps: 'ಸ್ವಯಂ ಜಿಪಿಎಸ್ (ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ)',
      gpsBtn: 'ನನ್ನ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳವನ್ನು ಪತ್ತೆಹಚ್ಚಿ',
      gpsBtnLoading: 'ಸ್ಥಳ ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
      gpsSub: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ತಕ್ಷಣವೇ ಪತ್ತೆಹಚ್ಚುತ್ತದೆ',
      orManual: 'ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು 1-ಟ್ಯಾಪ್ ಮೂಲಕ ಆಯ್ಕೆಮಾಡಿ',
      searchPh: 'ಜಿಲ್ಲೆ ಅಥವಾ ಪಟ್ಟಣವನ್ನು ಹುಡುಕಿ (ಉದಾ: ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ, ಮೈಸೂರು)...',
      allRegions: 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
      continueBtn: 'ಮುಂದುವರಿಯಿರಿ →',
      footerNote: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳ ತಕ್ಷಣದ ಲೆಕ್ಕಾಚಾರ',
      quickDistrictsTitle: 'ಪ್ರಮುಖ ಜಿಲ್ಲೆಗಳು:',
    },
    ml: {
      main: 'നിങ്ങളുടെ ആരോഗ്യ സംരക്ഷണ സ്ഥലം തിരഞ്ഞെടുക്കുക',
      sub: 'ഏറ്റവും അടുത്തുള്ള സർക്കാർ ആശുപത്രികളും പ്രാഥമികാരോഗ്യ കേന്ദ്രങ്ങളും കണ്ടെത്തുക.',
      currentLoc: 'നിലവിലെ സ്ഥലം:',
      activeBadge: 'ആക്ടീവ്',
      recommendedGps: 'ഓട്ടോ ജിപിഎസ് (ശുപാർശ ചെയ്യുന്നത്)',
      gpsBtn: 'എന്റെ ജിപിഎസ് ലൊക്കേഷൻ കണ്ടെത്തുക',
      gpsBtnLoading: 'ലൊക്കേഷൻ കണ്ടെത്തുന്നു...',
      gpsSub: 'ഏറ്റവും അടുത്തുള്ള ആശുപത്രികൾ കണ്ടെത്തുന്നു',
      orManual: 'അല്ലെങ്കിൽ ജില്ല തിരഞ്ഞെടുക്കുക',
      searchPh: 'ജില്ല അല്ലെങ്കിൽ സ്ഥലം തിരയുക (ഉദാ: തിരുവനന്തപുരം, എറണാകുളം)...',
      allRegions: 'എല്ലാ പ്രദേശങ്ങളും',
      continueBtn: 'തുടരുക →',
      footerNote: 'അടുത്തുള്ള ആശുപത്രികളുടെ വിവരങ്ങൾ',
      quickDistrictsTitle: 'പ്രധാന ജില്ലകൾ:',
    },
    bn: {
      main: 'আপনার স্বাস্থ্যসেবা অবস্থান নির্বাচন করুন',
      sub: 'নিকটতম প্রাথমিক স্বাস্থ্য কেন্দ্র ও হাসপাতাল খুঁজতে আপনার অবস্থান দিন।',
      currentLoc: 'বর্তমান অবস্থান:',
      activeBadge: 'সক্রিয়',
      recommendedGps: 'স্বয়ংক্রিয় জিপিএস (প্রস্তাবিত)',
      gpsBtn: 'আমার বর্তমান জিপিএস অবস্থান খুঁজুন',
      gpsBtnLoading: 'অবস্থান খোঁজা হচ্ছে...',
      gpsSub: 'নিকটতম স্বাস্থ্য কেন্দ্রের দূরত্ব অবিলম্বে গণনা করে',
      orManual: 'অথবা সরাসরি জেলা / শহর নির্বাচন করুন',
      searchPh: 'জেলা বা শহর অনুসন্ধান করুন (যেমন: উত্তর ২৪ পরগনা, কলকাতা, পাটনা)...',
      allRegions: 'সমস্ত অঞ্চল',
      continueBtn: 'সংরক্ষণ করুন ও এগিয়ে যান →',
      footerNote: 'নিকটতম হাসপাতালের সঠিক দূরত্ব গণনা',
      quickDistrictsTitle: 'প্রধান স্বাস্থ্য জেলা:',
    },
    mr: {
      main: 'आपले आरोग्य सेवा स्थान निवडा',
      sub: 'जवळचे प्राथमिक आरोग्य केंद्र आणि शासकीय रुग्णालय शोधण्यासाठी स्थान निश्चित करा.',
      currentLoc: 'सध्याचे स्थान:',
      activeBadge: 'सक्रिय',
      recommendedGps: 'स्वयंचलित जीपीएस (अनुशंसित)',
      gpsBtn: 'माझे सध्याचे जीपीएस स्थान शोधा',
      gpsBtnLoading: 'स्थान शोधत आहे...',
      gpsSub: 'जवळचे रुग्णालय व अंतर त्वरित मोजते',
      orManual: 'किंवा १-टॅपमध्ये जिल्हा / शहर निवडा',
      searchPh: 'जिल्हा किंवा शहर शोधा (उदा. पुणे, नाशिक, नागपूर)...',
      allRegions: 'सर्व प्रदेश',
      continueBtn: 'जतन करा व पुढे जा →',
      footerNote: 'जवळच्या रुग्णालयांची त्वरित मोजणी',
      quickDistrictsTitle: 'प्रमुख जिल्हे:',
    },
    gu: {
      main: 'તમારું આરોગ્ય સેવા સ્થાન પસંદ કરો',
      sub: 'નજીકના પ્રાથમિક આરોગ્ય કેન્દ્રો અને હોસ્પિટલો શોધવા માટે તમારું સ્થાન પસંદ કરો.',
      currentLoc: 'હાલનું સ્થાન:',
      activeBadge: 'સક્રિય',
      recommendedGps: 'ઓટો જીપીએસ (ભલામણ કરેલ)',
      gpsBtn: 'મારું જીપીએસ સ્થાન શોધો',
      gpsBtnLoading: 'સ્થાન શોધી રહ્યું છે...',
      gpsSub: 'નજીકના આરોગ્ય કેન્દ્રોની તરત ગણતરી કરે છે',
      orManual: 'અથવા મેન્યુઅલી જિલ્લો પસંદ કરો',
      searchPh: 'જિલ્લો અથવા શહેર શોધો (દા.ત. અમદાવાદ, સુરત, રાજકોટ)...',
      allRegions: 'બધા પ્રદેશો',
      continueBtn: 'સાચવો અને આગળ વધો →',
      footerNote: 'નજીકની હોસ્પિટલનું અંતર ગણતરી',
      quickDistrictsTitle: 'મુખ્ય જિલ્લાઓ:',
    },
    en: {
      main: 'Select Your Healthcare Location',
      sub: 'Hello Sahay uses your location to discover the closest Primary Health Centres (PHCs), Taluk Hospitals, and emergency facilities.',
      currentLoc: 'Active Location:',
      activeBadge: 'Active',
      recommendedGps: 'Recommended (One-Tap GPS)',
      gpsBtn: 'Use My Current GPS Location',
      gpsBtnLoading: 'Detecting Location...',
      gpsSub: 'Calculates nearest PHCs & accurate road travel distance',
      orManual: 'Or Tap Your District / City',
      searchPh: 'Search district or town (e.g., Chengalpattu, Gorakhpur, Pune, Bengaluru)...',
      allRegions: 'All States',
      continueBtn: 'Save Location & View Hospitals →',
      footerNote: 'Distances to nearest hospitals update dynamically',
      quickDistrictsTitle: 'Popular Healthcare Hubs (1-Tap):',
    },
  };

  const tr = texts[currentLang] || texts.en;

  // Top quick district chips for immediate selection
  const popularPresets = INDIAN_LOCATION_PRESETS.slice(0, 8);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-modal-title"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-teal-800/20 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white p-5 sm:p-6 relative">
          {!isInitialPopup && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="loc-modal-title" className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {tr.main}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-teal-100/90 pt-1 leading-snug">
                {tr.sub}
              </p>
            </div>
          </div>

          {/* Active location indicator */}
          <div className="mt-4 pt-3 border-t border-teal-700/60 flex items-center justify-between text-xs font-medium text-teal-200">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-300" />
              {tr.currentLoc} <strong>{currentCoords.districtDetected || 'Chengalpattu Rural, Tamil Nadu'}</strong>
            </span>
            <span className="bg-teal-700/60 px-2 py-0.5 rounded-full text-[11px] text-teal-100">
              {tr.activeBadge}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Message Notification */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 1. AUTO-GPS BUTTON (PRIMARY RECOMMENDED ACTION) */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {tr.recommendedGps}
            </span>

            <button
              onClick={handleAutoGps}
              disabled={isDetectingGps}
              className="w-full h-15 px-5 rounded-2xl bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 active:scale-98 text-white font-extrabold text-base flex items-center justify-between shadow-lg shadow-teal-900/20 transition-all border border-teal-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Crosshair className={`w-5 h-5 text-emerald-300 ${isDetectingGps ? 'animate-spin' : ''}`} />
                </div>
                <div className="text-left">
                  <span className="block leading-tight font-black">
                    {isDetectingGps ? tr.gpsBtnLoading : tr.gpsBtn}
                  </span>
                  <span className="text-xs text-teal-200 font-normal">
                    {tr.gpsSub}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-teal-300" />
            </button>
          </div>

          {/* QUICK 1-TAP POPULAR DISTRICT PRESET CHIPS */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {tr.quickDistrictsTitle}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-800 hover:text-white border border-slate-200 hover:border-teal-800 text-slate-800 text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3 text-teal-600" />
                  <span>{preset.district}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200" />
            <span className="shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {tr.orManual}
            </span>
            <div className="grow border-t border-slate-200" />
          </div>

          {/* 2. MANUAL DISTRICT / REGIONAL SEARCH */}
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr.searchPh}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm placeholder:text-slate-400 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of Indian Presets */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
              {filteredPresets.map((preset) => {
                const isSelected =
                  currentCoords.districtDetected?.includes(preset.district) ||
                  currentCoords.districtDetected?.includes(preset.name);

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all pt-2.5 ${
                      isSelected
                        ? 'bg-teal-50 border border-teal-300 text-teal-950 font-black'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold leading-tight">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {preset.district}, {preset.state} {preset.isRuralHub && '· Rural Hub'}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            {tr.footerNote}
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>{tr.continueBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
