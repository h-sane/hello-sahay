import React, { useState } from 'react';
import {
  Building2,
  MessageSquareHeart,
  Pill,
  CalendarCheck,
  BellRing,
  ShieldCheck,
  Users,
  Volume2,
  VolumeX,
  PhoneCall,
  ArrowRight,
  Sparkles,
  MapPin,
  Navigation,
  Phone,
  Calendar,
  Activity,
  Bot,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import { Hospital, Language, SahayAiAdvice, UserCoordinates, UserSettings } from '../types';
import { t } from '../translations';
import { NavTab } from '../components/BottomNav';
import { sahayAiService } from '../services/sahayAiService';
import { speechService } from '../services/speechService';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';
import { hospitalService } from '../services/hospitalService';

interface HomeViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  userCoordinates: UserCoordinates;
  nearestHospital: Hospital | null;
  onNavigate: (tab: NavTab) => void;
  onOpenEmergency: () => void;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
  onOpenLocationSelector: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentLang,
  userCoordinates,
  nearestHospital,
  onNavigate,
  onOpenEmergency,
  onSelectHospitalForBooking,
  onOpenLocationSelector,
}) => {
  const [adviceIndex, setAdviceIndex] = useState(0);
  const [isPlayingAdviceAudio, setIsPlayingAdviceAudio] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');
  const currentAdvice: SahayAiAdvice = sahayAiService.getDailyAdvice(adviceIndex);
  const reminders = storageService.getReminders();
  const appointments = storageService.getAppointments().filter((a) => a.status === 'confirmed_demo');

  // Compute nearby hospitals for user location
  const allHospitals = hospitalService.getAll();
  const sortedNearby = locationService.computeDistances(allHospitals, userCoordinates).slice(0, 3);

  // Complete vernacular text dictionary for Home View
  const homeTexts: Record<
    Language,
    {
      distance: string;
      km: string;
      emergency24x7: string;
      changeLocation: string;
      callHospital: string;
      getDirections: string;
      bookToken: string;
      symptomCardTitle: string;
      symptomCardSub: string;
      openFullChat: string;
      tapSymptomLabel: string;
      symptomPh: string;
      consultDoctorBtn: string;
      actionTitle: string;
      actionFindHospSub: string;
      actionAskSahaySub: string;
      actionCheckMedSub: string;
      actionApptSub: string;
      nearbyListTitle: string;
      viewAll: string;
      remindersTitle: string;
      remindersSub: string;
      schemesTitle: string;
      schemesSub: string;
      familyTitle: string;
      familySub: string;
      actionLabel: string;
      askDoctorMore: string;
      symptoms: { label: string; q: string }[];
    }
  > = {
    ta: {
      distance: 'தூரம்',
      km: 'கி.மீ',
      emergency24x7: '24x7 அவசர சிகிச்சை தயார்',
      changeLocation: 'மாற்ற',
      callHospital: 'அழைக்க',
      getDirections: 'வழித்தடம்',
      bookToken: 'டோக்கன் பதிவு',
      symptomCardTitle: 'டாக்டர் சஹாய் — நோய் அறிகுறிகள் & மருத்துவமனை பரிந்துரை',
      symptomCardSub: 'உங்கள் உடல்நலக் குறையை கூறுங்கள், டாக்டர் சஹாய் சிறந்த அரசு மருத்துவமனையை பரிந்துரைப்பார்',
      openFullChat: 'முழு உரையாடல் →',
      tapSymptomLabel: 'அறிகுறியை தட்டவும் அல்லது எழுதவும்:',
      symptomPh: 'அறிகுறிகளை எழுதவும் (எ.கா: 3 நாட்களாக காய்ச்சல், நெஞ்சு வலி, வயிற்றுப்போக்கு)...',
      consultDoctorBtn: 'மருத்துவரிடம் கேட்க',
      actionTitle: 'முதன்மை சேவைகள்',
      actionFindHospSub: 'அருகிலுள்ள அரசு ஆரம்ப சுகாதார நிலையங்கள் & காப்பீட்டு மருத்துவமனைகள்',
      actionAskSahaySub: '9 இந்திய மொழிகளில் டாக்டர் மருத்துவ வழிகாட்டல் & ஆலோசனைகள்',
      actionCheckMedSub: 'ஜன் ஔஷதி மையங்களில் 80% குறைந்த விலை ஜெனரிக் மாத்திரைகள்',
      actionApptSub: 'சேமிக்கப்பட்ட ஓபிடி முன்பதிவு சீட்டுகள் மற்றும் டோக்கன்கள்',
      nearbyListTitle: 'உங்கள் பகுதிக்கான அருகிலுள்ள மருத்துவமனைகள்',
      viewAll: 'அனைத்தையும் காண்க',
      remindersTitle: 'மாத்திரை நினைவூட்டல்',
      remindersSub: `${reminders.length} மருந்துகள் நினைவூட்டலில் உள்ளன`,
      schemesTitle: 'PM-JAY & முதலமைச்சர் காப்பீடு',
      schemesSub: 'ரூ.5 லட்சம் வரை இலவச சிகிச்சை வழிகாட்டல்',
      familyTitle: 'குடும்பத்தினர் சுயவிவரம்',
      familySub: 'பெற்றோர் மற்றும் பெரியவர்களின் மருத்துவ வருகை மேலாண்மை',
      actionLabel: 'மருத்துவர் அறிவுரை:',
      askDoctorMore: 'மேலும் கேட்க →',
      symptoms: [
        { label: '🤒 கடும் காய்ச்சல் & சளி', q: 'காய்ச்சல் மற்றும் சளி' },
        { label: '⚡ நெஞ்சு வலி & பாரம்', q: 'நெஞ்சு வலி மற்றும் மூச்சுத்திணறல்' },
        { label: '🤢 வயிற்று வலி & வாந்தி', q: 'வயிற்று வலி மற்றும் வாந்தி' },
        { label: '👁️ கண் சிவத்தல் & பார்வை மங்கல்', q: 'கண் சிவத்தல் மற்றும் பார்வை மங்கல்' },
        { label: '🦴 மூட்டு வலி & சுளுக்கு', q: 'மூட்டு வலி மற்றும் நடக்க முடியவில்லை' },
        { label: '👶 குழந்தைக்கு காய்ச்சல்', q: 'குழந்தைக்கு காய்ச்சல்' },
        { label: '🩸 சர்க்கரை & ரத்த அழுத்தம்', q: 'சர்க்கரை மற்றும் BP மருந்துகள்' },
      ],
    },
    hi: {
      distance: 'दूरी',
      km: 'किमी',
      emergency24x7: '24x7 आपातकालीन सेवा सक्रिय',
      changeLocation: 'बदलें',
      callHospital: 'कॉल करें',
      getDirections: 'रास्ता देखें',
      bookToken: 'ओपीडी टोकन',
      symptomCardTitle: 'डॉ. सहाय — लक्षण जांच व सबसे सही अस्पताल की सिफारिश',
      symptomCardSub: 'अपने लक्षण बताएं — डॉ. सहाय सही प्राथमिक सलाह व नजदीकी अस्पताल सुझाएंगे',
      openFullChat: 'पूरा चैट खोलें →',
      tapSymptomLabel: 'अपना लक्षण चुनें या लिखें:',
      symptomPh: 'लक्षण लिखें (उदा: 3 दिन से तेज बुखार, सीने में दर्द, पेट मरोड़)...',
      consultDoctorBtn: 'डॉक्टर से पूछें',
      actionTitle: 'प्रमुख स्वास्थ्य सेवाएं',
      actionFindHospSub: 'नजदीकी सरकारी पीएचसी, तालुक अस्पताल व आयुष्मान भारत केंद्र',
      actionAskSahaySub: '9 प्रमुख भारतीय भाषाओं में डॉक्टर परामर्श व अस्पताल सिफारिश',
      actionCheckMedSub: 'जन औषधि केंद्रों पर ब्रांडेड दवाओं से 80% सस्ती जेनेरिक दवाएं',
      actionApptSub: 'सहेजी गई ओपीडी पर्चियां और टोकन नंबर देखें',
      nearbyListTitle: 'आपके क्षेत्र के नजदीकी अस्पताल',
      viewAll: 'सभी देखें',
      remindersTitle: 'दवा खुराक रिमाइंडर',
      remindersSub: `${reminders.length} सक्रिय दवा रिमाइंडर`,
      schemesTitle: 'आयुष्मान भारत (PM-JAY)',
      schemesSub: '₹5 लाख तक मुफ्त अस्पताल इलाज की जानकारी',
      familyTitle: 'परिवार व बुजुर्ग प्रोफाइल',
      familySub: 'माता-पिता व परिजनों की अस्पताल यात्रा का प्रबंधन',
      actionLabel: 'डॉक्टर सलाह:',
      askDoctorMore: 'और जानें →',
      symptoms: [
        { label: '🤒 तेज बुखार और बदन दर्द', q: 'तेज बुखार और बदन दर्द' },
        { label: '⚡ सीने में तेज दर्द व भारीपन', q: 'सीने में तेज दर्द और सांस फूलना' },
        { label: '🤢 पेट में मरोड़ व उल्टी', q: 'पेट दर्द और उल्टी दस्त' },
        { label: '👁️ आंख लाल होना व धुंधलापन', q: 'आंख में लालिमा और धुंधलापन' },
        { label: '🦴 घुटने व जोड़ों में दर्द', q: 'घुटने में तेज दर्द और मोच' },
        { label: '👶 बच्चे को बुखार व सुस्ती', q: 'बच्चे को तेज बुखार' },
        { label: '🩸 शुगर व बीपी की दवाएं', q: 'शुगर और बीपी की सस्ती दवाएं' },
      ],
    },
    te: {
      distance: 'దూరం',
      km: 'కి.మీ',
      emergency24x7: '24x7 అత్యవసర సేవ అందుబాటులో ఉంది',
      changeLocation: 'మార్చండి',
      callHospital: 'కాల్ చేయండి',
      getDirections: 'దారి చూడండి',
      bookToken: 'ఓపీడీ టోకెన్',
      symptomCardTitle: 'డాక్టర్ సహాయ్ — లక్షణాలు & ఆసుపత్రి సిఫార్సు',
      symptomCardSub: 'మీ లక్షణాలను తెలపండి, డాక్టర్ సహాయ్ సరైన ఆసుపత్రిని సూచిస్తారు',
      openFullChat: 'చాట్ తెరవండి →',
      tapSymptomLabel: 'లక్షణాన్ని ఎంచుకోండి లేదా రాయండి:',
      symptomPh: 'మీ లక్షణాలను ఇక్కడ రాయండి...',
      consultDoctorBtn: 'వైద్యుడిని సంప్రదించండి',
      actionTitle: 'ప్రధాన సేవలు',
      actionFindHospSub: 'సమీప ప్రభుత్వ పీహెచ్‌సీలు మరియు ఆసుపత్రులు',
      actionAskSahaySub: '9 భారతీయ భాషలలో వైద్య సలహా',
      actionCheckMedSub: 'జన్ ఔషధి కేంద్రాలలో 80% తక్కువ ధరకే మందులు',
      actionApptSub: 'ఓపీడీ టోకెన్లు మరియు అపాయింట్‌మెంట్లు',
      nearbyListTitle: 'మీ ప్రాంతానికి సమీపంలోని ఆసుపత్రులు',
      viewAll: 'అన్నీ చూడండి',
      remindersTitle: 'మందుల రిమైండర్',
      remindersSub: `${reminders.length} యాక్టివ్ రిమైండర్లు`,
      schemesTitle: 'ఆయుష్మాన్ భారత్ (PM-JAY)',
      schemesSub: 'రూ. 5 లక్షల వరకు ఉచిత చికిత్స',
      familyTitle: 'కుటుంబ ప్రొఫైల్',
      familySub: 'కుటుంబ సభ్యుల ఆరోగ్య సంరక్షణ',
      actionLabel: 'వైద్యుల సలహా:',
      askDoctorMore: 'మరింత సమాచారం →',
      symptoms: [
        { label: '🤒 తీవ్ర జ్వరం & జలుబు', q: 'జ్వరం మరియు జలుబు' },
        { label: '⚡ గుండె నొప్పి', q: 'తీవ్ర గుండె నొప్పి' },
        { label: '🤢 కడుపు నొప్పి & వాంతులు', q: 'కడుపు నొప్పి' },
        { label: '🦴 కీళ్ల నొప్పులు', q: 'కీళ్ల నొప్పులు' },
      ],
    },
    kn: {
      distance: 'ದೂರ',
      km: 'ಕಿ.ಮೀ',
      emergency24x7: '24x7 ತುರ್ತು ಸೇವೆ ಸಕ್ರಿಯವಾಗಿದೆ',
      changeLocation: 'ಬದಲಾಯಿಸಿ',
      callHospital: 'ಕರೆ ಮಾಡಿ',
      getDirections: 'ಮಾರ್ಗ ನೋಡಿ',
      bookToken: 'ಟೋಕನ್ ಬುಕಿಂಗ್',
      symptomCardTitle: 'ಡಾ. ಸಹಾಯ್ — ಲಕ್ಷಣ ತಪಾಸಣೆ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಶಿಫಾರಸು',
      symptomCardSub: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ತಿಳಿಸಿ, ಸೂಕ್ತ ಆಸ್ಪತ್ರೆಯನ್ನು ಸೂಚಿಸುತ್ತೇವೆ',
      openFullChat: 'ಪೂರ್ಣ ಚಾಟ್ →',
      tapSymptomLabel: 'ಲಕ್ಷಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
      symptomPh: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಯನ್ನು ಬರೆಯಿರಿ...',
      consultDoctorBtn: 'ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ',
      actionTitle: 'ಪ್ರಮುಖ ಸೇವೆಗಳು',
      actionFindHospSub: 'ಹತ್ತಿರದ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಕ್ಲಿನಿಕ್‌ಗಳು',
      actionAskSahaySub: 'ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ ವೈದ್ಯಕೀಯ ಮಾರ್ಗದರ್ಶನ',
      actionCheckMedSub: 'ಜನೌಷಧಿ ಕೇಂದ್ರಗಳಲ್ಲಿ 80% ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಔಷಧಿಗಳು',
      actionApptSub: 'ಬುಕಿಂಗ್ ಟೋಕನ್‌ಗಳು ಮತ್ತು ರಸೀದಿಗಳು',
      nearbyListTitle: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು',
      viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
      remindersTitle: 'ಔಷಧಿ ರಿಮೈಂಡರ್',
      remindersSub: `${reminders.length} ಸಕ್ರಿಯ ರಿಮೈಂಡರ್‌ಗಳು`,
      schemesTitle: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್',
      schemesSub: 'ಉಚಿತ ಚಿಕಿತ್ಸೆ ಮಾಹಿತಿ',
      familyTitle: 'ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್',
      familySub: 'ಹಿರಿಯರ ಆರೋಗ್ಯ ನಿರ್ವಹಣೆ',
      actionLabel: 'ವೈದ್ಯಕೀಯ ಸಲಹೆ:',
      askDoctorMore: 'ಹೆಚ್ಚು ತಿಳಿಯಿರಿ →',
      symptoms: [
        { label: '🤒 ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಶೀತ', q: 'ಜ್ವರ ಮತ್ತು ಶೀತ' },
        { label: '⚡ ಎದೆ ನೋವು', q: 'ಎದೆ ನೋವು' },
        { label: '🤢 ಹೊಟ್ಟೆ ನೋವು', q: 'ಹೊಟ್ಟೆ ನೋವು' },
        { label: '🦴 ಕೀಲು ನೋವು', q: 'ಕೀಲು ನೋವು' },
      ],
    },
    ml: {
      distance: 'ദൂരം',
      km: 'കി.മീ',
      emergency24x7: '24x7 അടിയന്തര സേവനം ലഭ്യമാണ്',
      changeLocation: 'മാറ്റുക',
      callHospital: 'വിളിക്കുക',
      getDirections: 'വഴി കാണുക',
      bookToken: 'ടോക്കൺ ബുക്കിംഗ്',
      symptomCardTitle: 'ഡോ. സഹായ് — രോഗലക്ഷണങ്ങളും ആശുപത്രി നിർദ്ദേശവും',
      symptomCardSub: 'നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ പറയുക, അനുയോജ്യമായ ആശുപത്രി നിർദ്ദേശിക്കാം',
      openFullChat: 'മുഴുവൻ ചാറ്റ് →',
      tapSymptomLabel: 'ലക്ഷണം തിരഞ്ഞെടുക്കുക:',
      symptomPh: 'രോഗലക്ഷണങ്ങൾ ഇവിടെ എഴുതുക...',
      consultDoctorBtn: 'ഡോക്ടറോട് ചോദിക്കുക',
      actionTitle: 'പ്രധാന സേവനങ്ങൾ',
      actionFindHospSub: 'അടുത്തുള്ള സർക്കാർ ആശുപത്രികൾ',
      actionAskSahaySub: 'പ്രാദേശിക ഭാഷകളിൽ ഡോക്ടറുടെ സഹായം',
      actionCheckMedSub: 'ജൻ ഔഷധി വഴി കുറഞ്ഞ ചിലവിൽ മരുന്നുകൾ',
      actionApptSub: 'ബുക്കിംഗ് ടോക്കണുകൾ കാണുക',
      nearbyListTitle: 'നിങ്ങളുടെ അടുത്തുള്ള ആശുപത്രികൾ',
      viewAll: 'എല്ലാം കാണുക',
      remindersTitle: 'മരുന്ന് ഓർമ്മപ്പെടുത്തൽ',
      remindersSub: `${reminders.length} ഓർമ്മപ്പെടുത്തലുകൾ`,
      schemesTitle: 'ആയുഷ്മാൻ ഭാരത്',
      schemesSub: '5 ലക്ഷം രൂപ വരെയുള്ള സൗജന്യ ചികിത്സ',
      familyTitle: 'കുടുംബ വിവരങ്ങൾ',
      familySub: 'മുതിർന്നവരുടെ ആരോഗ്യ പരിചരണം',
      actionLabel: 'ഡോക്ടറുടെ നിർദ്ദേശം:',
      askDoctorMore: 'കൂടുതൽ അറിയുക →',
      symptoms: [
        { label: '🤒 കഠിനമായ പനി', q: 'പനി' },
        { label: '⚡ നെഞ്ചുവേദന', q: 'നെഞ്ചുവേദന' },
        { label: '🤢 വയറുവേദന', q: 'വയറുവേദന' },
      ],
    },
    bn: {
      distance: 'দূরত্ব',
      km: 'কিমি',
      emergency24x7: '২৪x৭ জরুরী চিকিৎসা চালু আছে',
      changeLocation: 'পরিবর্তন',
      callHospital: 'কল করুন',
      getDirections: 'দিকনির্দেশ',
      bookToken: 'টোকেন বুকিং',
      symptomCardTitle: 'ডা. সহায় — লক্ষণ যাচাই ও উপযুক্ত হাসপাতাল সুপারিশ',
      symptomCardSub: 'আপনার লক্ষণগুলি জানান, ডা. সহায় সঠিক হাসপাতাল সুপারিশ করবেন',
      openFullChat: 'সম্পূর্ণ চ্যাট →',
      tapSymptomLabel: 'লক্ষণ নির্বাচন করুন:',
      symptomPh: 'এখানে আপনার লক্ষণগুলি লিখুন...',
      consultDoctorBtn: 'ডাক্তারের পরামর্শ নিন',
      actionTitle: 'প্রধান স্বাস্থ্য পরিষেবা',
      actionFindHospSub: 'নিকটতম সরকারি স্বাস্থ্য কেন্দ্র ও হাসপাতাল',
      actionAskSahaySub: 'ভারতীয় ভাষায় চিকিৎসা পরামর্শ',
      actionCheckMedSub: 'জন ঔষধি কেন্দ্রে ৮০% সাশ্রয়ী জেনেরিক ওষুধ',
      actionApptSub: 'সংরক্ষিত ওপিডি টোকেন ও রসিদ',
      nearbyListTitle: 'আপনার এলাকার নিকটবর্তী হাসপাতাল',
      viewAll: 'সবগুলি দেখুন',
      remindersTitle: 'ওষুধের ডোজ রিমাইন্ডার',
      remindersSub: `${reminders.length}টি সক্রিয় রিমাইন্ডার`,
      schemesTitle: 'আয়ুষ্মান ভারত (PM-JAY)',
      schemesSub: '৫ লাখ টাকা পর্যন্ত বিনামূল্যে চিকিৎসা',
      familyTitle: 'পারিবারিক প্রোফাইল',
      familySub: 'পিতামাতা ও প্রবীণদের যত্ন',
      actionLabel: 'চিকিৎসা পরামর্শ:',
      askDoctorMore: 'আরও জানুন →',
      symptoms: [
        { label: '🤒 তীব্র জ্বর ও সর্দি', q: 'জ্বর ও সর্দি' },
        { label: '⚡ বুকে তীব্র ব্যথা', q: 'বুকে ব্যথা' },
        { label: '🤢 পেটে ব্যথা ও বমি', q: 'পেট ব্যথা' },
      ],
    },
    mr: {
      distance: 'अंतर',
      km: 'किमी',
      emergency24x7: '२४ तास आणीबाणी सेवा सुरू',
      changeLocation: 'बदला',
      callHospital: 'कॉल करा',
      getDirections: 'रस्ता पहा',
      bookToken: 'टोकन बुक करा',
      symptomCardTitle: 'डॉ. सहाय — लक्षणे व योग्य रुग्णालयाची शिफारस',
      symptomCardSub: 'आपली लक्षणे सांगा, डॉ. सहाय योग्य रुग्णालय सुचवतील',
      openFullChat: 'संपूर्ण चॅट →',
      tapSymptomLabel: 'लक्षण निवडा किंवा लिहा:',
      symptomPh: 'आपली लक्षणे येथे लिहा...',
      consultDoctorBtn: 'डॉक्टरांशी बोला',
      actionTitle: 'प्रमुख आरोग्य सेवा',
      actionFindHospSub: 'जवळची सरकारी रुग्णालये व प्राथमिक आरोग्य केंद्र',
      actionAskSahaySub: 'भारतीय भाषांमध्ये वैद्यकीय सल्ला व मार्गदर्शन',
      actionCheckMedSub: 'जन औषधी केंद्रांवर ८०% स्वस्त औषधे',
      actionApptSub: 'जतन केलेल्या ओपीडी पावत्या व टोकन',
      nearbyListTitle: 'आपल्या भागातील जवळची रुग्णालये',
      viewAll: 'सर्व पहा',
      remindersTitle: 'औषध स्मरणपत्रे',
      remindersSub: `${reminders.length} औषध स्मरणपत्रे`,
      schemesTitle: 'आयुष्मान भारत योजना',
      schemesSub: '₹५ लाख मोफत उपचार माहिती',
      familyTitle: 'कुटुंब आरोग्य प्रोफाइल',
      familySub: 'ज्येष्ठांचे आरोग्य व्यवस्थापन',
      actionLabel: 'वैद्यकीय सल्ला:',
      askDoctorMore: 'अधिक जाणून घ्या →',
      symptoms: [
        { label: '🤒 तीव्र ताप व अंगदुखी', q: 'ताप आणि अंगदुखी' },
        { label: '⚡ छातीत तीव्र वेदना', q: 'छातीत दुखणे' },
        { label: '🤢 पोटदुखी व उलट्या', q: 'पोटदुखी' },
      ],
    },
    gu: {
      distance: 'અંતર',
      km: 'કિમી',
      emergency24x7: '૨૪ કલાક ઇમરજન્સી ઉપલબ્ધ',
      changeLocation: 'બદલો',
      callHospital: 'કૉલ કરો',
      getDirections: 'દિશા જુઓ',
      bookToken: 'ટોકન બુક કરો',
      symptomCardTitle: 'ડૉ. સહાય — લક્ષણ તપાસ અને હોસ્પિટલ ભલામણ',
      symptomCardSub: 'તમારા લક્ષણો જણાવો, ડૉ. સહાય શ્રેષ્ઠ હોસ્પિટલ સૂચવશે',
      openFullChat: 'સંપૂર્ણ ચેટ →',
      tapSymptomLabel: 'લક્ષણ પસંદ કરો:',
      symptomPh: 'તમારા લક્ષણો અહીં લખો...',
      consultDoctorBtn: 'ડૉક્ટરની સલાહ લો',
      actionTitle: 'મુખ્ય સેવાઓ',
      actionFindHospSub: 'નજીકના સરકારી પીએચસી અને સિવિલ હોસ્પિટલો',
      actionAskSahaySub: 'પ્રાદેશિક ભાષાઓમાં તબીબી માર્ગદર્શન',
      actionCheckMedSub: 'જન ઔષધિ કેન્દ્રો પર ૮૦% સસ્તી દવાઓ',
      actionApptSub: 'સાચવેલ ઓપીડી ટોકન જુઓ',
      nearbyListTitle: 'તમારા નજીકની હોસ્પિટલો',
      viewAll: 'બધું જુઓ',
      remindersTitle: 'દવા રીમાઇન્ડર',
      remindersSub: `${reminders.length} દવા રીમાઇન્ડર્સ`,
      schemesTitle: 'આયુષ્માન ભારત',
      schemesSub: '₹૫ લાખ સુધીની મફત સારવાર',
      familyTitle: 'પરિવાર પ્રોફાઇલ',
      familySub: 'વડીલોની સંભાળ વ્યવસ્થાપન',
      actionLabel: 'તબીબી સલાહ:',
      askDoctorMore: 'વધુ જાણો →',
      symptoms: [
        { label: '🤒 તીવ્ર તાવ અને શરદી', q: 'તાવ અને શરદી' },
        { label: '⚡ છાતીમાં દુખાવો', q: 'છાતીમાં દુખાવો' },
        { label: '🤢 પેટમાં દુખાવો', q: 'પેટનો દુખાવો' },
      ],
    },
    en: {
      distance: 'Distance',
      km: 'km',
      emergency24x7: '24x7 Emergency Active',
      changeLocation: 'Change',
      callHospital: 'Call',
      getDirections: 'Directions',
      bookToken: 'Book OPD Token',
      symptomCardTitle: 'Dr. Sahay — Symptom Checker & Hospital Recommendation',
      symptomCardSub: 'Describe your symptoms for Dr. Sahay triage & matching hospital care',
      openFullChat: 'Open Full Chat →',
      tapSymptomLabel: 'Select or Tap Your Symptom:',
      symptomPh: 'Type your symptoms (e.g. fever for 3 days, chest pain, loose motions)...',
      consultDoctorBtn: 'Consult Dr. Sahay',
      actionTitle: 'Primary Healthcare Services',
      actionFindHospSub: 'Nearby Govt PHCs, Taluk hospitals & PM-JAY / CMCHIS centres',
      actionAskSahaySub: 'Doctor consultation & hospital triage in 9 major Indian languages',
      actionCheckMedSub: 'Compare brand prices with Jan Aushadhi generic equivalents',
      actionApptSub: 'View saved OPD booking vouchers and token slips',
      nearbyListTitle: 'Hospitals Near Your Active Location',
      viewAll: 'View All',
      remindersTitle: 'Dose Reminders',
      remindersSub: `${reminders.length} active reminders with voice`,
      schemesTitle: 'PM-JAY & CMCHIS',
      schemesSub: '₹5 Lakhs free hospitalization guides',
      familyTitle: 'Family Caregiver Profiles',
      familySub: 'Manage parents & elders visits',
      actionLabel: 'Doctor Guidance:',
      askDoctorMore: 'Ask Dr. Sahay More →',
      symptoms: [
        { label: '🤒 High Fever & Body Ache', q: 'fever' },
        { label: '⚡ Severe Chest Pain', q: 'chest pain' },
        { label: '🤢 Stomach Ache & Vomiting', q: 'stomach ache' },
        { label: '👁️ Eye Redness / Infection', q: 'eye' },
        { label: '🦴 Knee & Joint Injury', q: 'knee joint' },
        { label: '👶 Child High Fever', q: 'child fever' },
        { label: '🩸 High Blood Sugar & BP', q: 'diabetes bp' },
      ],
    },
  };

  const ht = homeTexts[currentLang] || homeTexts.en;

  const handleToggleAdviceAudio = () => {
    if (isPlayingAdviceAudio) {
      speechService.stop();
      setIsPlayingAdviceAudio(false);
    } else {
      const adviceTitle = currentAdvice.title[currentLang] || currentAdvice.title.en;
      const adviceBody = currentAdvice.advice[currentLang] || currentAdvice.advice.en;
      const textToRead = `${adviceTitle}. ${adviceBody}`;
      setIsPlayingAdviceAudio(true);
      speechService.speak(textToRead, currentLang, () => {
        setIsPlayingAdviceAudio(false);
      });
    }
  };

  const handleNextAdvice = () => {
    speechService.stop();
    setIsPlayingAdviceAudio(false);
    setAdviceIndex((prev) => prev + 1);
    speechService.playAudioChime(650, 0.1);
  };

  const handleQuickSymptomSearch = (_symptomQuery: string) => {
    onNavigate('ask-sahay');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. AUTO-LOCATED NEAREST HOSPITAL SUPPORT CARD */}
      <section aria-labelledby="nearest-support-title">
        <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-teal-700/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* Header pill with live GPS badge & Change Location Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h2 id="nearest-support-title" className="text-xs sm:text-sm font-black tracking-wide uppercase text-teal-200">
                  {t('nearestSupportHeading', currentLang)}
                </h2>
              </div>

              {/* Location pill with Change button */}
              <button
                onClick={onOpenLocationSelector}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-200 bg-teal-800/90 hover:bg-teal-700/90 px-3 py-1.5 rounded-full border border-teal-600 transition-all active:scale-95 group shadow-xs"
                title="Change active location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                  {userCoordinates.districtDetected || 'Chengalpattu Rural, Tamil Nadu'}
                </span>
                <span className="bg-emerald-500 text-teal-950 font-black text-[10px] px-1.5 py-0.2 rounded-full uppercase ml-1 group-hover:bg-emerald-400">
                  {ht.changeLocation}
                </span>
              </button>
            </div>

            {/* Nearest Hospital Info */}
            {nearestHospital ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-teal-300 uppercase tracking-wide">
                        {nearestHospital.category.toUpperCase()} · {nearestHospital.district}
                      </span>
                      {nearestHospital.emergency24x7 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full">
                          <Activity className="w-3 h-3" />
                          {ht.emergency24x7}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {nearestHospital.nativeNames[currentLang] || nearestHospital.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-teal-100/90 pt-1">
                      {nearestHospital.address[currentLang] || nearestHospital.address.en}
                    </p>
                  </div>

                  {/* Distance Callout Badge */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shrink-0 text-center sm:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold block">
                      {ht.distance}
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                      {nearestHospital.distanceKm} {ht.km}
                    </span>
                  </div>
                </div>

                {/* Direct Action Triggers */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <a
                    href={`tel:${nearestHospital.contactPhone}`}
                    className="flex-1 sm:flex-none h-12 px-4 rounded-xl bg-white text-teal-950 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-teal-50 shadow-md active:scale-98 transition-all"
                  >
                    <Phone className="w-4 h-4 text-teal-800" />
                    <span>{ht.callHospital} ({nearestHospital.contactPhone})</span>
                  </a>

                  <a
                    href={`https://maps.google.com/?q=${nearestHospital.latitude},${nearestHospital.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none h-12 px-4 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 border border-teal-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-emerald-300" />
                    <span>{ht.getDirections}</span>
                  </a>

                  <button
                    onClick={() => onSelectHospitalForBooking(nearestHospital)}
                    className="w-full sm:w-auto h-12 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-teal-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{ht.bookToken}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-teal-200">
                {t('locatingGps', currentLang)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 2. DOCTOR SYMPTOM CHECKER & HOSPITAL MATCH INTERACTIVE SECTION */}
      <section aria-labelledby="symptom-doctor-title">
        <div className="bg-white rounded-3xl border-2 border-teal-800/30 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 id="symptom-doctor-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {ht.symptomCardTitle}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {ht.symptomCardSub}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ask-sahay')}
              className="text-xs font-black text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all shrink-0"
            >
              {ht.openFullChat}
            </button>
          </div>

          {/* Quick Tap Symptoms in Selected Language */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {ht.tapSymptomLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {ht.symptoms.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSymptomSearch(item.q)}
                  className="px-3.5 py-2 rounded-full bg-slate-50 hover:bg-teal-800 hover:text-white border border-slate-200 hover:border-teal-800 text-slate-800 text-xs font-bold transition-all shadow-2xs active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Input Action */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNavigate('ask-sahay');
              }}
              placeholder={ht.symptomPh}
              className="flex-1 h-12 px-4 rounded-2xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm placeholder:text-slate-400 bg-slate-50"
            />
            <button
              onClick={() => onNavigate('ask-sahay')}
              className="h-12 px-5 rounded-2xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
            >
              <span>{ht.consultDoctorBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC DR. SAHAY CLINICAL ADVISORY CARD */}
      <section aria-labelledby="sahay-advice-title">
        <div className="bg-white rounded-3xl border border-teal-800/30 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 id="sahay-advice-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {t('sahayAiAdvisingHeading', currentLang)}
                  </h2>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full uppercase">
                    AI Clinical
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {currentLang === 'hi'
                    ? 'डॉ. सहाय द्वारा प्रमाणित दैनिक स्वास्थ्य सलाह'
                    : currentLang === 'ta'
                    ? 'டாக்டர் சஹாய் வழங்கும் தினசரி மருத்துவ வழிகாட்டல்'
                    : currentLang === 'te'
                    ? 'డాక్టర్ సహాయ్ రోజువారీ వైద్య సలహా'
                    : currentLang === 'kn'
                    ? 'ಡಾ. ಸಹಾಯ್ ದೈನಂದಿನ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶನ'
                    : currentLang === 'ml'
                    ? 'ഡോ. സഹായ് നൽകുന്ന ആരോഗ്യ നിർദ്ദേശം'
                    : currentLang === 'bn'
                    ? 'ডা. সহায় দৈনিক স্বাস্থ্য পরামর্শ'
                    : currentLang === 'mr'
                    ? 'डॉ. सहाय दैनिक आरोग्य मार्गदर्शन'
                    : currentLang === 'gu'
                    ? 'ડૉ. સહાય દૈનિક સ્વાસ્થ્ય માર્ગદર્શન'
                    : 'Preventative healthcare guidance from Dr. Sahay'}
                </span>
              </div>
            </div>

            {/* Read Out Loud & Next Advice Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAdviceAudio}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isPlayingAdviceAudio
                    ? 'bg-teal-800 text-white ring-2 ring-teal-600 animate-pulse'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                }`}
                aria-label="Listen to Sahay AI speech"
              >
                {isPlayingAdviceAudio ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>{t('stopAudio', currentLang)}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-teal-700" />
                    <span>{t('listenToSahayAi', currentLang)}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNextAdvice}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Next health guidance topic"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advice Content in selected language */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-teal-950 leading-snug">
              {currentAdvice.title[currentLang] || currentAdvice.title.en}
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {currentAdvice.advice[currentLang] || currentAdvice.advice.en}
            </p>
          </div>

          {/* Action Step Pill */}
          <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-xs sm:text-sm text-teal-950 font-medium flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>{ht.actionLabel}</strong>{' '}
                {currentAdvice.actionStep[currentLang] || currentAdvice.actionStep.en}
              </span>
            </div>
            <button
              onClick={() => onNavigate('ask-sahay')}
              className="font-bold text-teal-800 hover:underline shrink-0 text-xs"
            >
              {ht.askDoctorMore}
            </button>
          </div>
        </div>
      </section>

      {/* 4. FOUR PRIMARY ACTION TILES IN SELECTED LANGUAGE */}
      <section aria-labelledby="primary-actions-title">
        <h2 id="primary-actions-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-4">
          {ht.actionTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: Find Hospital */}
          <button
            onClick={() => onNavigate('hospitals')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 touch-target"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0 group-hover:bg-teal-800 group-hover:text-white transition-colors">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {t('actionFindHospitalTitle', currentLang)}
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {ht.actionFindHospSub}
              </p>
            </div>
          </button>

          {/* Action 2: Ask Sahay AI */}
          <button
            onClick={() => onNavigate('ask-sahay')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 touch-target"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
              <MessageSquareHeart className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {t('actionAskSahayTitle', currentLang)}
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {ht.actionAskSahaySub}
              </p>
            </div>
          </button>

          {/* Action 3: Check Medicines */}
          <button
            onClick={() => onNavigate('medicines')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 touch-target"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-800 group-hover:text-white transition-colors">
              <Pill className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {t('actionCheckMedicinesTitle', currentLang)}
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {ht.actionCheckMedSub}
              </p>
            </div>
          </button>

          {/* Action 4: My Appointments */}
          <button
            onClick={() => onNavigate('my-health')}
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 touch-target"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-800 group-hover:text-white transition-colors">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                    {t('actionMyAppointmentsTitle', currentLang)}
                  </h3>
                  {appointments.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {appointments.length}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {ht.actionApptSub}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. TOP 3 CLOSEST HOSPITALS LIST */}
      <section aria-labelledby="closest-hospitals-list-title">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-800" />
            <h3 id="closest-hospitals-list-title" className="text-lg font-black text-slate-900">
              {ht.nearbyListTitle}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('hospitals')}
            className="text-xs font-bold text-teal-800 hover:underline"
          >
            {ht.viewAll} ({allHospitals.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sortedNearby.map((hosp) => (
            <div
              key={hosp.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-teal-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-teal-800 uppercase bg-teal-50 px-2 py-0.5 rounded-md">
                    {hosp.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {hosp.distanceKm} {ht.km}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 line-clamp-1">
                  {hosp.nativeNames[currentLang] || hosp.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {hosp.district}, {hosp.state}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                <button
                  onClick={() => onSelectHospitalForBooking(hosp)}
                  className="flex-1 h-9 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{ht.bookToken}</span>
                </button>
                <a
                  href={`tel:${hosp.contactPhone}`}
                  className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{ht.callHospital}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAST SHORTCUTS IN SELECTED LANGUAGE */}
      <section aria-labelledby="quick-shortcuts-title">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('my-health')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 transition-all text-left flex items-center justify-between touch-target group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 group-hover:text-teal-900 block leading-tight">
                  {ht.remindersTitle}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {ht.remindersSub}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
          </button>

          <button
            onClick={() => onNavigate('my-health')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 transition-all text-left flex items-center justify-between touch-target group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 group-hover:text-teal-900 block leading-tight">
                  {ht.schemesTitle}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {ht.schemesSub}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
          </button>

          <button
            onClick={() => onNavigate('my-health')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-700 transition-all text-left flex items-center justify-between touch-target group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 group-hover:text-teal-900 block leading-tight">
                  {ht.familyTitle}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {ht.familySub}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
          </button>
        </div>
      </section>
    </div>
  );
};
