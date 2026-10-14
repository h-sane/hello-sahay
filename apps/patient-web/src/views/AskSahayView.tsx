import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  Sparkles,
  PhoneCall,
  Bot,
  User,
  Radio,
  MapPin,
  Building2,
  Calendar,
  Navigation,
  Phone,
  AlertTriangle,
  Stethoscope,
  Pill,
  Droplets,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { ChatMessage, Hospital, Language, UserCoordinates } from '../types';
import { t } from '../translations';
import { sahayAiService } from '../services/sahayAiService';
import { speechService } from '../services/speechService';

interface AskSahayViewProps {
  currentLang: Language;
  userCoordinates: UserCoordinates;
  onOpenVoiceMode: () => void;
  onOpenEmergency: () => void;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
  onOpenLocationSelector: () => void;
}

export const AskSahayView: React.FC<AskSahayViewProps> = ({
  currentLang,
  userCoordinates,
  onOpenVoiceMode,
  onOpenEmergency,
  onSelectHospitalForBooking,
  onOpenLocationSelector,
}) => {
  // Localized UI dictionary for AskSahayView in all 9 Indian languages
  const uiTexts: Record<
    Language,
    {
      pageTitle: string;
      pageSubtitle: string;
      consultationBadge: string;
      verifiedGuidance: string;
      homeCareHeading: string;
      medicineHeading: string;
      recommendedHospTitle: string;
      kmAway: string;
      departmentLabel: string;
      whyFacilityLabel: string;
      bookTokenBtn: string;
      callBtn: string;
      routeBtn: string;
      clinicalProtocolLabel: string;
      quickChipsHeading: string;
      inputPh: string;
      sendBtn: string;
      listeningText: string;
      stopAudioText: string;
      listenAdviceText: string;
      emergencyCallout: string;
      emergencyBtn: string;
      aiDisclaimer: string;
      locatingBadge: string;
    }
  > = {
    hi: {
      pageTitle: 'डॉ. सहाय — आपका वर्चुअल ग्रामीण स्वास्थ्य चिकित्सक',
      pageSubtitle: 'अपने लक्षण बताएं — डॉ. सहाय आपको सही डॉक्टर सलाह देंगे और नजदीकी उपयुक्त अस्पताल सुझाएंगे',
      consultationBadge: 'डॉ. सहाय क्लिनिकल परामर्श',
      verifiedGuidance: 'प्रमाणित मार्गदर्शन',
      homeCareHeading: 'घरेलू देखभाल व हाइड्रेशन',
      medicineHeading: 'दवा व जेनेरिक साल्ट',
      recommendedHospTitle: 'आपकी बीमारी के लिए अनुशंसित अस्पताल',
      kmAway: 'किमी दूर',
      departmentLabel: 'विभाग:',
      whyFacilityLabel: 'यह अस्पताल क्यों चुना गया:',
      bookTokenBtn: 'ओपीडी टोकन बुक करें',
      callBtn: 'कॉल करें',
      routeBtn: 'रास्ता देखें',
      clinicalProtocolLabel: 'मानक क्लिनिकल प्रोटोकॉल:',
      quickChipsHeading: '1-टैप त्वरित लक्षण चुनें:',
      inputPh: 'अपने लक्षण लिखें (उदा: 3 दिन से तेज बुखार, सीने में दर्द, पेट मरोड़)...',
      sendBtn: 'परामर्श लें',
      listeningText: 'डॉ. सहाय सुन रहे हैं... बोलिए',
      stopAudioText: 'आवाज रोकें',
      listenAdviceText: 'डॉ. सहाय की आवाज में सुनें',
      emergencyCallout: 'आपातकालीन चेतावनी: तुरंत 108 पर एम्बुलेंस बुलाएं',
      emergencyBtn: '108 कॉल करें',
      aiDisclaimer: 'सूचना: डॉ. सहाय प्राथमिक मार्गदर्शन व अस्पताल सिफारिश हेतु है। गंभीर स्थिति में तुरंत अस्पताल जाएं।',
      locatingBadge: 'सक्रिय स्वास्थ्य क्षेत्र:',
    },
    ta: {
      pageTitle: 'டாக்டர் சஹாய் — உங்கள் கிராமப்புற சுகாதார மருத்துவர்',
      pageSubtitle: 'உங்கள் உடல்நலக் குறையை கூறுங்கள் — உடனடி மருத்துவ ஆலோசனையையும் அருகிலுள்ள சிறந்த மருத்துவமனையையும் பரிந்துரைப்போம்',
      consultationBadge: 'டாக்டர் சஹாய் மருத்துவ ஆலோசனை',
      verifiedGuidance: 'உறுதிப்படுத்தப்பட்ட வழிகாட்டல்',
      homeCareHeading: 'வீட்டு பராமரிப்பு & நீர்ச்சத்து',
      medicineHeading: 'மருந்து & ஜெனரிக் மாத்திரை',
      recommendedHospTitle: 'உங்கள் நோய்க்குரிய பரிந்துரைக்கப்பட்ட மருத்துவமனை',
      kmAway: 'கி.மீ தொலைவில்',
      departmentLabel: 'பிரிவு:',
      whyFacilityLabel: 'இந்த மருத்துவமனை பரிந்துரைக்கான காரணம்:',
      bookTokenBtn: 'டோக்கன் பதிவு',
      callBtn: 'அழைக்க',
      routeBtn: 'வழித்தடம்',
      clinicalProtocolLabel: 'மருத்துவ வரைமுறை:',
      quickChipsHeading: 'விரைவு அறிகுறிகள் (தட்டவும்):',
      inputPh: 'அறிகுறிகளை எழுதுங்கள் (எ.கா: காய்ச்சல், நெஞ்சு வலி, வயிற்றுப்போக்கு)...',
      sendBtn: 'ஆலோசனை பெற',
      listeningText: 'டாக்டர் சஹாய் கேட்கிறார்... பேசுங்கள்',
      stopAudioText: 'நிறுத்த',
      listenAdviceText: 'குரலில் கேட்க',
      emergencyCallout: 'அவசர எச்சரிக்கை: உடனடியாக 108 ஆம்புலன்ஸை அழைக்கவும்',
      emergencyBtn: '108 அழைக்க',
      aiDisclaimer: 'பொறுப்புத் துறப்பு: டாக்டர் சஹாய் முதற்கட்ட ஆலோசனை வழிகாட்டி மட்டுமே. அவசரத்தில் உடனே மருத்துவமனைக்கு செல்லவும்.',
      locatingBadge: 'செயலில் உள்ள பகுதி:',
    },
    te: {
      pageTitle: 'డాక్టర్ సహాయ్ — మీ వర్చువల్ గ్రామీణ వైద్యులు',
      pageSubtitle: 'మీ లక్షణాలను తెలపండి — సరైన వైద్య సలహాను మరియు సమీప ఆసుపత్రిని మేము సూచిస్తాము',
      consultationBadge: 'డాక్టర్ సహాయ్ వైద్య సలహా',
      verifiedGuidance: 'ధృవీకరించబడిన మార్గదర్శకత్వం',
      homeCareHeading: 'గృహ సంరక్షణ & ద్రవాలు',
      medicineHeading: 'మందులు & జెనెరిక్ సాల్ట్స్',
      recommendedHospTitle: 'మీ లక్షణాలకు సిఫార్సు చేయబడిన ఆసుపత్రి',
      kmAway: 'కి.మీ దూరంలో',
      departmentLabel: 'విభాగం:',
      whyFacilityLabel: 'ఈ ఆసుపత్రి ఎందుకు సిఫార్సు చేయబడింది:',
      bookTokenBtn: 'ఓపీడీ టోకెన్ బుక్ చేయండి',
      callBtn: 'కాల్ చేయండి',
      routeBtn: 'దారి చూడండి',
      clinicalProtocolLabel: 'వైద్య ప్రమాణాలు:',
      quickChipsHeading: 'త్వరిత లక్షణాలు (ట్యాప్ చేయండి):',
      inputPh: 'మీ లక్షణాలను ఇక్కడ రాయండి...',
      sendBtn: 'సలహా పొందండి',
      listeningText: 'వింటోంది... మాట్లాడండి',
      stopAudioText: 'ఆపండి',
      listenAdviceText: 'వాయిస్‌లో వినండి',
      emergencyCallout: 'అత్యవసర హెచ్చరిక: వెంటనే 108 కు కాల్ చేయండి',
      emergencyBtn: '108 కాల్',
      aiDisclaimer: 'సహాయ్ కేవలం ప్రాథమిక మార్గదర్శి మాత్రమే. అత్యవసరంలో ఆసుపత్రికి వెళ్లండి.',
      locatingBadge: 'ప్రస్తుత ప్రాంతం:',
    },
    kn: {
      pageTitle: 'ಡಾ. ಸಹಾಯ್ — ನಿಮ್ಮ ಆರೋಗ್ಯ ವೈದ್ಯಕೀಯ ಒಡನಾಡಿ',
      pageSubtitle: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ತಿಳಿಸಿ — ಸೂಕ್ತ ಆಸ್ಪತ್ರೆ ಮತ್ತು ಚಿಕಿತ್ಸಾ ಸಲಹೆಯನ್ನು ಪಡೆಯಿರಿ',
      consultationBadge: 'ಡಾ. ಸಹಾಯ್ ಕ್ಲಿನಿಕಲ್ ಸಲಹೆ',
      verifiedGuidance: 'ಪರಿಶೀಲಿಸಿದ ಮಾರ್ಗದರ್ಶನ',
      homeCareHeading: 'ಮನೆ ಆರೈಕೆ & ನೀರು ಸೇವನೆ',
      medicineHeading: 'ಔಷಧಿ & ಜನೌಷಧಿ ಸೌಲಭ್ಯ',
      recommendedHospTitle: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳಿಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಆಸ್ಪತ್ರೆ',
      kmAway: 'ಕಿ.ಮೀ ದೂರ',
      departmentLabel: 'ವಿಭಾಗ:',
      whyFacilityLabel: 'ಈ ಆಸ್ಪತ್ರೆಯ ಶಿಫಾರಸಿಗೆ ಕಾರಣ:',
      bookTokenBtn: 'ಟೋಕನ್ ಬುಕ್ ಮಾಡಿ',
      callBtn: 'ಕರೆ ಮಾಡಿ',
      routeBtn: 'ಮಾರ್ಗ ನೋಡಿ',
      clinicalProtocolLabel: 'ವೈದ್ಯಕೀಯ ಪ್ರೋಟೋಕಾಲ್:',
      quickChipsHeading: 'ತ್ವರಿತ ಲಕ್ಷಣಗಳು:',
      inputPh: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಯನ್ನು ಬರೆಯಿರಿ...',
      sendBtn: 'ಸಲಹೆ ಪಡೆಯಿರಿ',
      listeningText: 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ... ಮಾತನಾಡಿ',
      stopAudioText: 'ನಿಲ್ಲಿಸಿ',
      listenAdviceText: 'ಧ್ವನಿ ಕೇಳಿ',
      emergencyCallout: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ: ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ',
      emergencyBtn: '108 ಕರೆ',
      aiDisclaimer: 'ಡಾ. ಸಹಾಯ್ ಪ್ರಾಥಮಿಕ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ.',
      locatingBadge: 'ಸಕ್ರಿಯ ಸ್ಥಳ:',
    },
    ml: {
      pageTitle: 'ഡോ. സഹായ് — നിങ്ങളുടെ ആരോഗ്യ സഹായി',
      pageSubtitle: 'രോഗലക്ഷണങ്ങൾ പറയുക — കൃത്യമായ ചികിത്സാ മാർഗ്ഗനിർദ്ദേശവും ആശുപത്രിയും നിർദ്ദേശിക്കാം',
      consultationBadge: 'ഡോ. സഹായ് ക്ലിനിക്കൽ കൺസൾട്ടേഷൻ',
      verifiedGuidance: 'പരിശോധിച്ച മാർഗ്ഗനിർദ്ദേശം',
      homeCareHeading: 'വീട്ടു പരിചരണം & ജലാംശം',
      medicineHeading: 'മരുന്നുകൾ & ജൻ ഔഷധി',
      recommendedHospTitle: 'നിങ്ങൾക്കായി ശുപാർശ ചെയ്യുന്ന ആശുപത്രി',
      kmAway: 'കി.മീ അകലെ',
      departmentLabel: 'വിഭാഗം:',
      whyFacilityLabel: 'ഈ ആശുപത്രി തിരഞ്ഞെടുക്കാനുള്ള കാരണം:',
      bookTokenBtn: 'ടോക്കൺ ബുക്ക് ചെയ്യുക',
      callBtn: 'വിളിക്കുക',
      routeBtn: 'വഴി കാണുക',
      clinicalProtocolLabel: 'ക്ലിനിക്കൽ പ്രോട്ടോക്കോൾ:',
      quickChipsHeading: 'പ്രധാന ലക്ഷണങ്ങൾ:',
      inputPh: 'രോഗലക്ഷണങ്ങൾ എഴുതുക...',
      sendBtn: 'ചോദിക്കുക',
      listeningText: 'കേൾക്കുന്നു... സംസാരിക്കൂ',
      stopAudioText: 'നിർത്തുക',
      listenAdviceText: 'കേൾക്കുക',
      emergencyCallout: 'അടിയന്തിര മുന്നറിയിപ്പ്: ഉടൻ 108 വിളിക്കുക',
      emergencyBtn: '108 വിളിക്കുക',
      aiDisclaimer: 'ഡോ. സഹായ് പ്രാഥമിക വിവര സഹായി മാത്രമാണ്.',
      locatingBadge: 'നിലവിലെ സ്ഥലം:',
    },
    bn: {
      pageTitle: 'ডা. সহায় — আপনার স্বাস্থ্য চিকিৎসক',
      pageSubtitle: 'আপনার লক্ষণগুলি জানান — সঠিক চিকিৎসা পরামর্শ ও উপযুক্ত হাসপাতালের সন্ধান পান',
      consultationBadge: 'ডা. সহায় ক্লিনিকাল পরামর্শ',
      verifiedGuidance: 'যাচাইকৃত নির্দেশিকা',
      homeCareHeading: 'ঘরোয়া যত্ন ও জলীয় খাবার',
      medicineHeading: 'ওষুধ ও জেনেরিক সাশ্রয়',
      recommendedHospTitle: 'আপনার উপসর্গের জন্য প্রস্তাবিত হাসপাতাল',
      kmAway: 'কিমি দূরে',
      departmentLabel: 'বিভাগ:',
      whyFacilityLabel: 'কেন এই হাসপাতালটি সুপারিশ করা হলো:',
      bookTokenBtn: 'টোকেন বুক করুন',
      callBtn: 'কল করুন',
      routeBtn: 'দিকনির্দেশ',
      clinicalProtocolLabel: 'ক্লিনিকাল প্রোটোকল:',
      quickChipsHeading: 'দ্রুত লক্ষণ বেছে নিন:',
      inputPh: 'লক্ষণগুলি লিখুন...',
      sendBtn: 'পরামর্শ নিন',
      listeningText: 'শুনছি... বলুন',
      stopAudioText: 'থামান',
      listenAdviceText: 'কণ্ঠে শুনুন',
      emergencyCallout: 'জরুরী সতর্কতা: অবিলম্বে ১০৮ এ কল করুন',
      emergencyBtn: '১০৮ কল করুন',
      aiDisclaimer: 'ডা. সহায় প্রাথমিক স্বাস্থ্য নির্দেশক মাত্র।',
      locatingBadge: 'সক্রিয় এলাকা:',
    },
    mr: {
      pageTitle: 'डॉ. सहाय — आपले आरोग्य मार्गदर्शक',
      pageSubtitle: 'आपली लक्षणे सांगा — योग्य वैद्यकीय सल्ला आणि जवळचे रुग्णालय मिळवा',
      consultationBadge: 'डॉ. सहाय क्लिनिकल सल्ला',
      verifiedGuidance: 'प्रमाणित मार्गदर्शन',
      homeCareHeading: 'घरगुती काळजी व हायड्रेशन',
      medicineHeading: 'औषध व जेनेरिक साल्ट',
      recommendedHospTitle: 'आपल्या आजारासाठी सुचवलेले रुग्णालय',
      kmAway: 'किमी अंतरावर',
      departmentLabel: 'विभाग:',
      whyFacilityLabel: 'हे रुग्णालय सुचवण्याचे कारण:',
      bookTokenBtn: 'टोकन बुक करा',
      callBtn: 'कॉल करा',
      routeBtn: 'रस्ता पहा',
      clinicalProtocolLabel: 'क्लिनिकल प्रोटोकॉल:',
      quickChipsHeading: 'लक्षणे निवडा:',
      inputPh: 'लक्षणे येथे लिहा...',
      sendBtn: 'सल्ला घ्या',
      listeningText: 'ऐकत आहे... बोला',
      stopAudioText: 'थांबवा',
      listenAdviceText: 'आवाजात ऐका',
      emergencyCallout: 'आणीबाणी इशारा: त्वरित १०८ वर कॉल करा',
      emergencyBtn: '१०८ कॉल करा',
      aiDisclaimer: 'डॉ. सहाय केवळ प्राथमिक माहिती देणारा मार्गदर्शक आहे.',
      locatingBadge: 'सक्रिय क्षेत्र:',
    },
    gu: {
      pageTitle: 'ડૉ. સહાય — આપના ગ્રામીણ આરોગ્ય સાથી',
      pageSubtitle: 'તમારા લક્ષણો જણાવો — યોગ્ય તબીબી સલાહ અને નજીકની હોસ્પિટલ મેળવો',
      consultationBadge: 'ડૉ. સહાય ક્લિનિકલ સલાહ',
      verifiedGuidance: 'પ્રમાણિત માર્ગદર્શન',
      homeCareHeading: 'ઘરેલું સંભાળ અને હાઇડ્રેશન',
      medicineHeading: 'દવા અને જેનરિક સાલ્ટ',
      recommendedHospTitle: 'તમારા લક્ષણો માટે ભલામણ કરેલ હોસ્પિટલ',
      kmAway: 'કિમી દૂર',
      departmentLabel: 'વિભાગ:',
      whyFacilityLabel: 'આ હોસ્પિટલ શા માટે પસંદ કરાઈ:',
      bookTokenBtn: 'ટોકન બુક કરો',
      callBtn: 'કૉલ કરો',
      routeBtn: 'દિશા જુઓ',
      clinicalProtocolLabel: 'ક્લિનિકલ પ્રોટોકોલ:',
      quickChipsHeading: 'ઝડપી લક્ષણ પસંદ કરો:',
      inputPh: 'તમારા લક્ષણો અહીં લખો...',
      sendBtn: 'સલાહ લો',
      listeningText: 'સાંભળી રહ્યા છીએ... બોલો',
      stopAudioText: 'રોકો',
      listenAdviceText: 'અવાજમાં સાંભળો',
      emergencyCallout: 'ઇમરજન્સી ચેતવણી: તરત ૧૦૮ પર કૉલ કરો',
      emergencyBtn: '૧૦૮ કૉલ',
      aiDisclaimer: 'ડૉ. સહાય માત્ર પ્રાથમિક માર્ગદર્શક છે.',
      locatingBadge: 'સક્રિય વિસ્તાર:',
    },
    en: {
      pageTitle: 'Dr. Sahay — Virtual Rural Health Physician',
      pageSubtitle: 'Describe your symptoms — Dr. Sahay provides verified medical advice and matches you to the best nearby hospital',
      consultationBadge: 'Dr. Sahay Clinical Consultation',
      verifiedGuidance: 'Verified Clinical Guidance',
      homeCareHeading: 'Home Care & Hydration',
      medicineHeading: 'Medicine & Generic Salts',
      recommendedHospTitle: 'Recommended Hospital for Your Condition',
      kmAway: 'km away',
      departmentLabel: 'Department:',
      whyFacilityLabel: 'Why this facility:',
      bookTokenBtn: 'Book Doctor Token',
      callBtn: 'Call Facility',
      routeBtn: 'Directions',
      clinicalProtocolLabel: 'Clinical Protocol:',
      quickChipsHeading: '1-Tap Quick Symptoms:',
      inputPh: 'Type your symptoms (e.g. fever for 3 days, chest pain, loose motions)...',
      sendBtn: 'Consult Doctor',
      listeningText: 'Dr. Sahay is listening... Speak now',
      stopAudioText: 'Stop Audio',
      listenAdviceText: 'Listen in Audio',
      emergencyCallout: 'Emergency Alert: Call 108 ambulance immediately',
      emergencyBtn: 'Call 108 Now',
      aiDisclaimer: 'Disclaimer: Dr. Sahay provides triage and guidance. In severe distress, visit hospital directly.',
      locatingBadge: 'Active Healthcare Region:',
    },
  };

  const ui = uiTexts[currentLang] || uiTexts.en;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcomeTexts: Record<Language, string> = {
      hi: '👨‍⚕️ नमस्ते! मैं डॉ. सहाय हूँ — आपका वर्चुअल ग्रामीण स्वास्थ्य चिकित्सक। अपने लक्षणों (जैसे बुखार, सीने में दर्द, पेट दर्द, जोड़ों में दर्द, खांसी या शुगर/बीपी) के बारे में बताएं। मैं सही डॉक्टर परामर्श दूंगा और आपके नजदीकी सबसे उपयुक्त अस्पताल की सिफारिश करूंगा।',
      ta: '👨‍⚕️ வணக்கம்! நான் டாக்டர் சஹாய் — உங்கள் கிராமப்புற சுகாதார மருத்துவர். உங்கள் அறிகுறிகளை (காய்ச்சல், நெஞ்சு வலி, வயிற்று வலி, சர்க்கரை, எலும்பு வலி) கூறுங்கள். உடனடி மருத்துவ ஆலோசனையையும், உங்கள் நோய்க்குரிய சிறந்த அருகிலுள்ள மருத்துவமனையையும் பரிந்துரைப்பேன்.',
      te: '👨‍⚕️ నమస్తే! నేను డాక్టర్ సహాయ్ ని. మీ లక్షణాలు (జ్వరం, గుండె నొప్పి, కడుపు నొప్పి, కీళ్ల నొప్పులు) చెప్పండి. నేను సరైన వైద్య సలహాను మరియు సమీప ఆసుపత్రిని సిఫార్సు చేస్తాను.',
      kn: '👨‍⚕️ ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಸಹಾಯ್. ನಿಮ್ಮ ಆರೋಗ್ಯ ಲಕ್ಷಣಗಳನ್ನು (ಜ್ವರ, ಎದೆ ನೋವು, ಹೊಟ್ಟೆ ನೋವು, ಕೀಲು ನೋವು) ತಿಳಿಸಿ. ಸೂಕ್ತ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಹಾಗೂ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಯನ್ನು ನಾನು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.',
      ml: '👨‍⚕️ നമസ്കാരം! ഞാൻ ഡോ. സഹായ് ആണ്. നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ (പനി, നെഞ്ചുവേദന, വയറുവേദന) പറയുക. ഡോക്ടറുടെ ശരിയായ മാർഗ്ഗനിർദ്ദേശവും അടുത്തുള്ള ആശുപത്രിയും ഞാൻ നിർദ്ദേശിക്കാം.',
      bn: '👨‍⚕️ নমস্কার! আমি ডা. সহায়। আপনার লক্ষণগুলি (জ্বর, বুকে ব্যথা, পেটের সমস্যা, গাঁটের ব্যথা) জানান। আমি চিকিৎসা পরামর্শ এবং নিকটতম হাসপাতালের সুপারিশ করব।',
      mr: '👨‍⚕️ नमस्कार! मी डॉ. सहाय आहे. आपली लक्षणे (ताप, छातीत दुखणे, पोटदुखी, सांधेदुखी) सांगा. मी योग्य वैद्यकीय सल्ला व जवळच्या रुग्णालयाची शिफारस करेन.',
      gu: '👨‍⚕️ નમસ્તે! હું ડૉ. સહાય છું. તમારા લક્ષણો (તાવ, છાતીમાં દુખાવો, પેટનો દુખાવો, સાંધાનો દુખાવો) જણાવો. હું યોગ્ય તબીબી સલાહ અને નજીકની હોસ્પિટલની ભલામણ કરીશ.',
      en: '👨‍⚕️ Hello! I am Dr. Sahay — your virtual rural health physician. Please tell me your symptoms (e.g., high fever, chest pain, stomach ache, bone injury, blood sugar, or cough). I will provide structured doctor guidance and recommend the best nearby hospital for your care.',
    };

    return [
      {
        id: 'msg-welcome',
        sender: 'sahay',
        text: welcomeTexts[currentLang] || welcomeTexts.en,
        timestamp: 'Just now',
        sources: ['Ministry of Health & Family Welfare (MoHFW)', 'National Health Portal (NHP India)'],
        isAiGenerated: true,
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick 1-tap symptom selector for rural patients
  const symptomQuickChips: Record<Language, { label: string; query: string }[]> = {
    hi: [
      { label: '🤒 तेज बुखार और सर्दी', query: 'मुझे 2 दिन से तेज बुखार और बदन दर्द है' },
      { label: '⚡ सीने में तेज दर्द', query: 'सीने में तेज दर्द और सांस लेने में दिक्कत' },
      { label: '🤢 पेट दर्द और उल्टी', query: 'पेट में मरोड़, दस्त और उल्टी की समस्या है' },
      { label: '🩸 शुगर और बीपी नियंत्रण', query: 'शुगर और बीपी की सस्ती दवाएं कैसे लें' },
      { label: '🦴 घुटने व हड्डी का दर्द', query: 'घुटने में तेज दर्द और मोच है, चलने में असमर्थ' },
      { label: '👶 बच्चे को तेज बुखार', query: 'बच्चे को तेज बुखार है और दूध नहीं पी रहा' },
    ],
    ta: [
      { label: '🤒 கடுமையான காய்ச்சல் & சளி', query: 'எனக்கு 2 நாட்களாக கடுமையான காய்ச்சல் மற்றும் உடல் வலி உள்ளது' },
      { label: '⚡ நெஞ்சு வலி & மூச்சுத்திணறல்', query: 'கடுமையான நெஞ்சு வலி மற்றும் மூச்சுத்திணறல் உள்ளது' },
      { label: '🤢 வயிற்று வலி & வாந்தி', query: 'வயிற்று வலி, வாந்தி மற்றும் பேதி பிரச்சனை' },
      { label: '🩸 சர்க்கரை & ரத்த அழுத்தம்', query: 'சர்க்கரை மற்றும் BP மருந்துகளை குறைந்த விலையில் பெறுவது எப்படி?' },
      { label: '🦴 மூட்டு வலி & எலும்பு காயம்', query: 'முழங்கால் மற்றும் எலும்பு வலி, நடக்க முடியவில்லை' },
      { label: '👶 குழந்தைக்கு காய்ச்சல்', query: 'குழந்தைக்கு அதிக காய்ச்சல் மற்றும் பால் குடிக்க மறுக்கிறது' },
    ],
    te: [
      { label: '🤒 తీవ్ర జ్వరం & జలుబు', query: 'నాకు తీవ్ర జ్వరం మరియు ఒంటి నొప్పులు ఉన్నాయి' },
      { label: '⚡ గుండె నొప్పి & ఆయాసం', query: 'తీవ్రమైన గుండె నొప్పి మరియు శ్వాస ఆడటం లేదు' },
      { label: '🤢 కడుపు నొప్పి & వాంతులు', query: 'కడుపు నొప్పి మరియు వాంతులు అవుతున్నాయి' },
      { label: '🩸 షుగర్ & బీపీ నియంత్రణ', query: 'షుగర్ మరియు బీపీ తక్కువ ధర మందులు' },
      { label: '🦴 కీళ్ల నొప్పి / ఎముక గాయం', query: 'మోకాలి నొప్పి మరియు నడవలేకపోతున్నాను' },
    ],
    kn: [
      { label: '🤒 ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಶೀತ', query: 'ನನಗೆ ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಮೈಕೈ ನೋವು ಇದೆ' },
      { label: '⚡ ಎದೆ ನೋವು & ಉಸಿರಾಟ', query: 'ತೀವ್ರ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಇದೆ' },
      { label: '🤢 ಹೊಟ್ಟೆ ನೋವು & ವಾಂತಿ', query: 'ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ವಾಂತಿ ಭೇದಿ ಆಗುತ್ತಿದೆ' },
      { label: '🩸 ಸಕ್ಕರೆ ಕಾಯಿಲೆ & ಬಿಪಿ', query: 'ಮಧುಮೇಹ ಮತ್ತು ರಕ್ತದೊತ್ತಡ ಮಾಹಿತಿ' },
      { label: '🦴 ಮೂಳೆ / ಕೀಲು ನೋವು', query: 'ಮಂಡಿ ನೋವು ಮತ್ತು ಕಾಲು ಊತ ಇದೆ' },
    ],
    ml: [
      { label: '🤒 കഠിനമായ പനി', query: 'എനിക്ക് കഠിനമായ പനിയും ശരീരവേദനയുമുണ്ട്' },
      { label: '⚡ നെഞ്ചുവേദന', query: 'കഠിനമായ നെഞ്ചുവേദനയും ശ്വാസതടസ്സവുമുണ്ട്' },
      { label: '🤢 വയറുവേദന', query: 'വയറുവേദനയും ഛർദ്ദിയുമുണ്ട്' },
      { label: '🩸 പ്രമേഹം & ബിപി', query: 'പ്രമേഹ നിയന്ത്രണ മരുന്നുകൾ' },
      { label: '🦴 സന്ധി വേദന', query: 'കാൽമുട്ട് വേദന കാരണം നടക്കാൻ സാധിക്കുന്നില്ല' },
    ],
    bn: [
      { label: '🤒 তীব্র জ্বর ও সর্দি', query: 'আমার ২ দিন ধরে তীব্র জ্বর ও গায়ে ব্যথা আছে' },
      { label: '⚡ বুকে তীব্র ব্যথা', query: 'বুকে তীব্র ব্যথা ও শ্বাসকষ্ট হচ্ছে' },
      { label: '🤢 পেট ব্যথা ও বমি', query: 'পেটে তীব্র ব্যথা ও পাতলা পায়খানা হচ্ছে' },
      { label: '🩸 ডায়াবেটিস ও রক্তচাপ', query: 'ব্লাড সুগার ও রক্তচাপ নিয়ন্ত্রণ' },
      { label: '🦴 হাঁটু ও গাঁটের ব্যথা', query: 'হাঁটুর ব্যথায় হাঁটতে পারছি না' },
    ],
    mr: [
      { label: '🤒 तीव्र ताप व थंडी', query: 'मला २ दिवसांपासून तीव्र ताप व अंगदुखी आहे' },
      { label: '⚡ छातीत तीव्र वेदना', query: 'छातीत तीव्र वेदना व श्वास घेण्यास त्रास' },
      { label: '🤢 पोटदुखी व उलटी', query: 'पोटात मळमळ, जुलाब व पोटदुखी' },
      { label: '🩸 मधुमेह व बीपी', query: 'शुगर आणि बीपी नियंत्रण औषधे' },
      { label: '🦴 सांधेदुखी व हाडांचे दुखणे', query: 'गुडघेदुखीमुळे चालता येत नाही' },
    ],
    gu: [
      { label: '🤒 તીવ્ર તાવ અને શરદી', query: 'મને ૨ દિવસથી ખૂબ તાવ અને બદન દર્દ છે' },
      { label: '⚡ છાતીમાં તીવ્ર દુખાવો', query: 'છાતીમાં દુખાવો અને શ્વાસ લેવામાં તકલીફ' },
      { label: '🤢 પેટનો દુખાવો અને ઉલટી', query: 'પેટમાં ચૂંક અને ઉલટી ઝાડા છે' },
      { label: '🩸 ડાયાબિટીસ અને બીપી', query: 'ડાયાબિટીસ અને બીપી કંટ્રોલ' },
      { label: '🦴 સાંધાનો દુખાવો', query: 'ઢીંચણમાં દુખાવો છે' },
    ],
    en: [
      { label: '🤒 High Fever & Cold', query: 'I have severe fever and body ache since 2 days' },
      { label: '⚡ Severe Chest Pain', query: 'Sudden chest pain and heavy breathing' },
      { label: '🤢 Stomach Ache & Vomit', query: 'Severe stomach cramps, loose motion and vomiting' },
      { label: '🩸 Sugar & BP Check', query: 'How to manage high blood sugar and BP at low cost' },
      { label: '🦴 Knee / Bone Injury', query: 'Severe knee pain and leg injury, cannot walk' },
      { label: '👶 Child High Fever', query: 'My child has high fever, cold and not drinking milk' },
    ],
  };

  const chips = symptomQuickChips[currentLang] || symptomQuickChips.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    speechService.stop();
    setPlayingMessageId(null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      speechService.playAudioChime(520, 0.1);

      // Dr. Sahay virtual physician advice engine
      const doctorAdvice = await sahayAiService.consultSahayAi(
        textToSend,
        currentLang,
        userCoordinates
      );

      const sahayMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'sahay',
        text: doctorAdvice.reply,
        timestamp: 'Just now',
        emergency: doctorAdvice.emergency,
        sources: doctorAdvice.sources,
        isAiGenerated: true,
        doctorConsultation: doctorAdvice.doctorConsultation,
        recommendedHospital: doctorAdvice.recommendedHospital,
        recommendedDepartment: doctorAdvice.recommendedDepartment,
        recommendedReason: doctorAdvice.recommendedReason,
      };

      setMessages((prev) => [...prev, sahayMsg]);
      speechService.playAudioChime(780, 0.15);
    } catch (e) {
      console.warn('Dr. Sahay advice error:', e);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        sender: 'sahay',
        text: currentLang === 'ta'
          ? 'டாக்டர் சஹாய்: இணைய இணைப்பு குறைபாடு காரணமாக தற்காலிக தாமதம். அவசர உதவிக்கு 108 அழைக்கவும்.'
          : currentLang === 'hi'
          ? 'डॉ. सहाय: नेटवर्क धीमा होने के कारण मार्गदर्शन पुनः लोड करें। आपातकाल में 108 डायल करें।'
          : 'Dr. Sahay: Network delay. For urgent medical emergencies, call 108 right away.',
        timestamp: 'Just now',
        isAiGenerated: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMessageAudio = (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      speechService.stop();
      setPlayingMessageId(null);
      return;
    }

    speechService.stop();
    setPlayingMessageId(msg.id);

    // Speak clinical reply
    let speechContent = msg.text;
    if (msg.doctorConsultation) {
      speechContent += ` ${msg.doctorConsultation.homeCare} ${msg.doctorConsultation.medicineGuidance}`;
    }

    speechService.speak(speechContent, currentLang, () => {
      setPlayingMessageId(null);
    });
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      speechService.stopVoiceRecognition();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechService.startVoiceRecognition(
      currentLang,
      (transcript) => {
        setIsListening(false);
        setInputQuery(transcript);
        handleSendMessage(transcript);
      },
      (err) => {
        console.warn('Voice error:', err);
        setIsListening(false);
      }
    );
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Banner: Dr. Sahay Persona & Location */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 text-white border-2 border-teal-700/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                {ui.pageTitle}
              </h1>
              <span className="text-[10px] font-bold bg-emerald-400 text-teal-950 px-2 py-0.5 rounded-full uppercase">
                AI Active
              </span>
            </div>
            <p className="text-xs text-teal-200/90 pt-0.5">
              {ui.pageSubtitle}
            </p>
          </div>
        </div>

        {/* Location selector trigger */}
        <button
          onClick={onOpenLocationSelector}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-200 bg-teal-800/80 hover:bg-teal-700 px-3 py-1.5 rounded-xl border border-teal-600 self-start sm:self-auto"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="truncate max-w-[200px]">
            {userCoordinates.districtDetected || 'Chengalpattu Rural, Tamil Nadu'}
          </span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isSahay = msg.sender === 'sahay';
          const isPlayingThis = playingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isSahay ? 'justify-start' : 'justify-end'}`}
            >
              {isSahay && (
                <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Stethoscope className="w-5 h-5 text-emerald-300" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 ${
                  isSahay
                    ? msg.emergency
                      ? 'bg-red-50 border-2 border-red-400 text-red-950'
                      : 'bg-white border-2 border-teal-800/30 text-slate-900'
                    : 'bg-teal-800 text-white rounded-br-xs'
                }`}
              >
                {/* Emergency callout banner */}
                {isSahay && msg.emergency && (
                  <div className="p-3 bg-red-600 text-white rounded-2xl flex items-center justify-between gap-2 shadow-sm animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                      <span className="text-xs sm:text-sm font-black uppercase">
                        {ui.emergencyCallout}
                      </span>
                    </div>
                    <button
                      onClick={onOpenEmergency}
                      className="px-3 py-1.5 bg-white text-red-700 font-black text-xs rounded-xl shadow-xs active:scale-95"
                    >
                      {ui.emergencyBtn}
                    </button>
                  </div>
                )}

                {/* Sender badge */}
                {isSahay && (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-teal-950">
                        {ui.consultationBadge}
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-full">
                        {ui.verifiedGuidance}
                      </span>
                    </div>
                  </div>
                )}

                {/* Main text message */}
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Structured Doctor Clinical Assessment Cards if present */}
                {isSahay && msg.doctorConsultation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-teal-950">
                        <Droplets className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>{ui.homeCareHeading}</span>
                      </div>
                      <p className="text-slate-700 leading-snug">
                        {msg.doctorConsultation.homeCare}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                        <Pill className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{ui.medicineHeading}</span>
                      </div>
                      <p className="text-slate-700 leading-snug">
                        {msg.doctorConsultation.medicineGuidance}
                      </p>
                    </div>
                  </div>
                )}

                {/* MATCHED RECOMMENDED HOSPITAL CARD */}
                {isSahay && msg.recommendedHospital && (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-teal-950 to-teal-900 text-white border-2 border-teal-600/50 shadow-md space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-teal-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-300" />
                        <span className="text-xs font-black uppercase tracking-wider text-teal-200">
                          {ui.recommendedHospTitle}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        {msg.recommendedHospital.distanceKm} {ui.kmAway}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                        {msg.recommendedHospital.nativeNames[currentLang] || msg.recommendedHospital.name}
                      </h4>
                      <p className="text-xs text-teal-200 pt-0.5">
                        {ui.departmentLabel} <strong>{msg.recommendedDepartment || 'General Medicine'}</strong> · {msg.recommendedHospital.district}
                      </p>
                    </div>

                    {msg.recommendedReason && (
                      <p className="text-xs text-teal-100/90 bg-teal-900/60 p-2.5 rounded-xl border border-teal-800">
                        💡 <strong>{ui.whyFacilityLabel}</strong> {msg.recommendedReason}
                      </p>
                    )}

                    {/* Action Triggers */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectHospitalForBooking(msg.recommendedHospital!)}
                        className="flex-1 h-10 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-teal-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{ui.bookTokenBtn}</span>
                      </button>

                      <a
                        href={`tel:${msg.recommendedHospital.contactPhone}`}
                        className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{ui.callBtn}</span>
                      </a>

                      <a
                        href={`https://maps.google.com/?q=${msg.recommendedHospital.latitude},${msg.recommendedHospital.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5 text-teal-300" />
                        <span>{ui.routeBtn}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Sources Footnote */}
                {isSahay && msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{ui.clinicalProtocolLabel}</span>
                    <span>{msg.sources.join(' · ')}</span>
                  </div>
                )}

                {/* Timestamp & Listen Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span
                    className={`text-[11px] ${
                      isSahay ? 'text-slate-400' : 'text-teal-200'
                    }`}
                  >
                    {msg.timestamp}
                  </span>

                  {isSahay && (
                    <button
                      onClick={() => handleToggleMessageAudio(msg)}
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                        isPlayingThis
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-teal-800 bg-teal-50 hover:bg-teal-100'
                      }`}
                      aria-label="Listen to message"
                    >
                      {isPlayingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlayingThis ? ui.stopAudioText : ui.listenAdviceText}</span>
                    </button>
                  )}
                </div>
              </div>

              {!isSahay && (
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs sm:text-sm font-semibold p-3 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-emerald-300 animate-spin" />
            </div>
            <span>Dr. Sahay is reviewing your symptoms & closest hospital...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick 1-Tap Symptom Chips in Selected Language */}
      <div className="shrink-0 space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          {ui.quickChipsHeading}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              className="px-3.5 py-2 rounded-full bg-white hover:bg-teal-800 hover:text-white border border-slate-200 hover:border-teal-800 text-slate-800 text-xs font-bold whitespace-nowrap shadow-2xs active:scale-95 transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Input Controls */}
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          {/* Voice Input Trigger */}
          <button
            onClick={handleToggleVoiceInput}
            className={`h-13 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isListening
                ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                : 'bg-white border border-slate-300 hover:border-teal-700 text-teal-900'
            }`}
            title="Speak your symptoms in your language"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-teal-800" />}
            <span className="hidden sm:inline">
              {isListening ? ui.listeningText : ui.pageTitle.split('—')[0]}
            </span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={isListening ? ui.listeningText : ui.inputPh}
            disabled={isLoading}
            className="flex-1 h-13 px-4 rounded-2xl border border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-sm sm:text-base bg-white shadow-xs"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="h-13 px-5 rounded-2xl bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{ui.sendBtn}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          {ui.aiDisclaimer}
        </p>
      </div>
    </div>
  );
};
