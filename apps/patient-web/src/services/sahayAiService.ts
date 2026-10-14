import { Hospital, Language, SahayAiAdvice, UserCoordinates } from '../types';
import { hospitalService } from './hospitalService';
import { locationService } from './locationService';

export const SAHAY_AI_ADVICE_COLLECTION: SahayAiAdvice[] = [
  {
    id: 'sahay-adv-1',
    category: 'seasonal',
    urgent: true,
    title: {
      en: 'Dr. Sahay Daily Guidance: Monsoon Viral Fever & Dengue Prevention',
      hi: 'डॉ. सहाय दैनिक सलाह: मानसूनी बुखार और डेंगू से बचाव के उपाय',
      ta: 'டாக்டர் சஹாய் தினசரி வழிகாட்டல்: பருவமழை காய்ச்சல் மற்றும் டெங்கு தடுப்பு',
      te: 'డాక్టర్ సహాయ్ రోజువారీ మార్గదర్శకత్వం: వర్షాకాల జ్వరాలు & డెంగ్యూ నివారణ',
      kn: 'ಡಾ. ಸಹಾಯ್ ದೈನಂದಿನ ಮಾರ್ಗದರ್ಶನ: ಮಳೆಗಾಲದ ಜ್ವರ ಮತ್ತು ಡೆಂಗ್ಯೂ ತಡೆಗಟ್ಟುವಿಕೆ',
      ml: 'ഡോ. സഹായ് ദൈനംദിന മാർഗ്ഗനിർദ്ദേശം: മഴക്കാല പനിയും ഡെങ്കിപ്പനി പ്രതിരോധവും',
      bn: 'ডা. সহায় দৈনিক পরামর্শ: বর্ষাকালীন জ্বর ও ডেঙ্গু প্রতিরোধ',
      mr: 'डॉ. सहाय दैनिक सल्ला: पावसाळी ताप आणि डेंग्यू प्रतिबंध',
      gu: 'ડૉ. સહાય દૈનિક માર્ગદર્શન: ચોમાસાનો તાવ અને ડેન્ગ્યુ નિવારણ',
    },
    advice: {
      en: 'Dr. Sahay Note: Avoid stagnant fresh water around homes to prevent mosquito breeding. If fever exceeds 2 days or is accompanied by severe joint pain, do not self-medicate with high-dose painkillers like Brufen. Visit your nearest Primary Health Centre (PHC) for a free NS1 Dengue blood test and oral hydration.',
      hi: 'डॉ. सहाय सलाह: मच्छरों को पनपने से रोकने के लिए घरों के आसपास साफ पानी जमा न होने दें। 2 दिन से अधिक बुखार या जोड़ों में तेज दर्द होने पर खुद से भारी दवाएं न लें। नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाकर निःशुल्क रक्त जांच कराएं।',
      ta: 'டாக்டர் சஹாய் மருத்துவ குறிப்பு: வீட்டை சுற்றியுள்ள நன்னீரை வாரந்தோறும் அப்புறப்படுத்துங்கள். காய்ச்சல் 2 நாட்களுக்கு மேல் நீடித்தால் கடைகளில் சுயமாக மாத்திரை வாங்காமல், ஆரம்ப சுகாதார நிலையத்திற்கு சென்று இலவச இரத்தப் பரிசோதனை செய்யுங்கள்.',
      te: 'డాక్టర్ సహాయ్ సూచన: దోమలు వ్యాపించకుండా నిల్వ ఉన్న నీటిని తొలగించండి. జ్వరం 2 రోజులు దాటితే సొంత మందులు వాడకుండా, సమీపంలోని ప్రాథమిక ఆరోగ్య కేంద్రంలో (PHC) ఉచిత రక్త పరీక్ష చేయించుకోండి.',
      kn: 'ಡಾ. ಸಹಾಯ್ ಸಲಹೆ: ಸೊಳ್ಳೆಗಳ ಸಂತಾನೋತ್ಪತ್ತಿಯನ್ನು ತಡೆಯಲು ಸ್ವಚ್ಛ ನೀರನ್ನು ಸಂಗ್ರಹವಾಗಲು ಬಿಡಬೇಡಿ. ಜ್ವರ 2 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚಿದ್ದರೆ, ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಉಚಿತ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ.',
      ml: 'ഡോ. സഹായ് നിർദ്ദേശം: കൊതുകുകൾ പെരുകുന്നത് തടയാൻ വീടിന് ചുറ്റുമുള്ള വെള്ളക്കെട്ടുകൾ ഒഴിവാക്കുക. 2 ദിവസത്തിൽ കൂടുതൽ പനി നീണ്ടുനിൽക്കുകയാണെങ്കിൽ പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിൽ പോയി രക്തപരിശോധന നടത്തുക.',
      bn: 'ডা. সহায় পরামর্শ: মশার বংশবৃদ্ধি রোধ করতে বাড়ির চারপাশে জল জমতে দেবেন না। ২ দিনের বেশি জ্বর থাকলে প্রাথমিক স্বাস্থ্য কেন্দ্রে বিনামূল্যে রক্ত পরীক্ষা করান।',
      mr: 'डॉ. सहाय सल्ला: डासांची पैदास रोखण्यासाठी घराभोवती पाणी साचू देऊ नका. ताप २ दिवसांपेक्षा जास्त राहिल्यास प्राथमिक आरोग्य केंद्रात (PHC) जाऊन मोफत रक्त तपासणी करून घ्या.',
      gu: 'ડૉ. સહાય સલાહ: મચ્છરોનો ઉપદ્રવ રોકવા ઘર આસપાસ પાણી ભરાવા ન દો. તાવ ૨ દિવસથી વધુ રહે તો નજીકના પ્રાથમિક આરોગ્ય કેન્દ્ર (PHC) પર જઈ વિનામૂલ્યે લોહી તપાસ કરાવો.',
    },
    actionStep: {
      en: 'Drink boiled water, take tender coconut water or ORS, and report persistent fever to an ASHA worker.',
      hi: 'उबला हुआ पानी पिएं, ओआरएस (ORS) लें और बुखार न उतरने पर आशा कार्यकर्ता या डॉक्टर से संपर्क करें।',
      ta: 'காய்ச்சிய நீர் அருந்தவும், ஓ.ஆர்.எஸ் (ORS) நீர்ச்சத்து கரைசல் எடுத்துக்கொள்ளவும்.',
      te: 'కాచి చల్లార్చిన నీటిని త్రాగండి, ఓఆర్ఎస్ ద్రావణం తీసుకోండి.',
      kn: 'ಕುದಿಸಿದ ನೀರನ್ನು ಕುಡಿಯಿರಿ ಮತ್ತು ಓಆರ್‌ಎಸ್ (ORS) ದ್ರಾವಣವನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ.',
      ml: 'തിളപ്പിച്ചാറ്റിയ വെള്ളം കുടിക്കുക, ഒ.ആർ.എസ് ലായനി ഉപയോഗിക്കുക.',
      bn: 'ফুটানো জল পান করুন এবং ওআরএস (ORS) গ্রহণ করুন।',
      mr: 'उकळलेले पाणी प्या आणि ओआरएस (ORS) द्रावण घ्या.',
      gu: 'ઉકાળેલું પાણી પીવો અને ઓઆરએસ (ORS) નું દ્રાવણ લો.',
    },
  },
  {
    id: 'sahay-adv-2',
    category: 'chronic',
    urgent: false,
    title: {
      en: 'Dr. Sahay Daily Guidance: Managing BP & Diabetes with Jan Aushadhi',
      hi: 'डॉ. सहाय दैनिक सलाह: जन औषधि के साथ बीपी और शुगर का सस्ता व सही इलाज',
      ta: 'டாக்டர் சஹாய் தினசரி வழிகாட்டல்: ஜன் ஔஷதி மூலம் குறைந்த செலவில் சர்க்கரை & BP கட்டுப்பாடு',
      te: 'డాక్టర్ సహాయ్ సూచన: జన్ ఔషధి ద్వారా తక్కువ ఖర్చుతో బీపీ మరియు షుగర్ నియంత్రణ',
      kn: 'ಡಾ. ಸಹಾಯ್ ಸಲಹೆ: ಜನೌಷಧಿ ಮೂಲಕ ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಬಿಪಿ ಮತ್ತು ಮಧುಮೇಹ ನಿಯಂತ್ರಣ',
      ml: 'ഡോ. സഹായ് നിർദ്ദേശം: ജൻ ഔഷധി വഴി കുറഞ്ഞ ചെലവിൽ പ്രമേഹവും ബിപിയും നിയന്ത്രിക്കാം',
      bn: 'ডা. সহায় পরামর্শ: জন ঔষধি দ্বারা স্বল্প খরচে ডায়াবেটিস ও রক্তচাপ নিয়ন্ত্রণ',
      mr: 'डॉ. सहाय सल्ला: जन औषधीद्वारे कमी खर्चात बीपी व मधुमेहाचे व्यवस्थापन',
      gu: 'ડૉ. સહાય સલાહ: જન ઔષધિ દ્વારા ઓછા ખર્ચે બીપી અને ડાયાબિટીસનું નિયંત્રણ',
    },
    advice: {
      en: 'Dr. Sahay Note: Lifelong medicines for blood pressure (Telmisartan) and diabetes (Metformin) cost up to 80% less at Jan Aushadhi Kendras without compromising quality. Never skip prescribed daily doses.',
      hi: 'डॉ. सहाय सलाह: बीपी और शुगर की नियमित दवाएं जन औषधि केंद्रों पर 80% तक सस्ती मिलती हैं। दवा की खुराक कभी न छोड़ें और महीने में एक बार बीपी जरूर जांचें।',
      ta: 'டாக்டர் சஹாய் மருத்துவ குறிப்பு: ரத்த அழுத்தம் மற்றும் சர்க்கரை நோய்க்கான மாத்திரைகள் அரசு ஜன் ஔஷதி மையங்களில் 80% வரை குறைந்த விலையில் கிடைக்கின்றன. தினசரி மருந்துகளை தவிர்க்காதீர்கள்.',
      te: 'డాక్టర్ సహాయ్ సూచన: బీపీ మరియు షుగర్ మందులు జన్ ఔషధి కేంద్రాలలో 80% వరకు తక్కువ ధరకే లభిస్తాయి. రోజూ క్రమం తప్పకుండా మందులు వాడండి.',
      kn: 'ಡಾ. ಸಹಾಯ್ ಸಲಹೆ: ಬಿಪಿ ಮತ್ತು ಶುಗರ್ ಔಷಧಿಗಳು ಜನೌಷಧಿ ಕೇಂದ್ರಗಳಲ್ಲಿ 80% ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಲಭ್ಯವಿದೆ. ನಿಯಮಿತವಾಗಿ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಿ.',
      ml: 'ഡോ. സഹായ് നിർദ്ദേശം: പ്രമേഹം, രക്തസമ്മർദ്ദം എന്നിവയ്ക്കുള്ള ഗുളികകൾ ജൻ ഔഷധി കേന്ദ്രങ്ങളിൽ 80% വരെ കുറഞ്ഞ നിരക്കിൽ ലഭ്യമാണ്.',
      bn: 'ডা. সহায় পরামর্শ: রক্তচাপ ও ডায়াবেটিসের প্রয়োজনীয় ওষুধ জন ঔষধি কেন্দ্রে ৮০% পর্যন্ত কম মূল্যে পাওয়া যায়।',
      mr: 'डॉ. सहाय सल्ला: बीपी आणि मधुमेहाची औषधे जन औषधी केंद्रावर ८०% पर्यंत स्वस्त मिळतात.',
      gu: 'ડૉ. સહાય સલાહ: બીપી અને ડાયાબિટીસની દવાઓ જન ઔષધિ કેન્દ્રો પર ૮૦% સુધી સસ્તી મળે છે. નિયમિત દવા લેવાનું ચૂકશો નહીં.',
    },
    actionStep: {
      en: 'Check your medicine salts in the Medicine tab and ask your doctor about Jan Aushadhi generic equivalents.',
      hi: 'दवाओं के साल्ट जांचने के लिए मेडिसिन टैब का उपयोग करें।',
      ta: 'மருந்து மூலப்பொருளை சரிபார்க்கவும் மருந்துகள் பகுதிக்கு செல்லவும்.',
      te: 'మందుల వివరాల కోసం మెడిసిన్స్ ట్యాబ్‌ను చూడండి.',
      kn: 'ಔಷಧಿಗಳ ಮಾಹಿತಿಗಾಗಿ ಮೆಡಿಸಿನ್ ವಿಭಾಗವನ್ನು ಪರಿಶೀಲಿಸಿ.',
      ml: 'മരുന്നുകളെക്കുറിച്ചറിയാൻ മെഡിസിൻസ് വിഭാഗം സന്ദർശിക്കുക.',
      bn: 'ওষুধের তথ্যের জন্য মেডিসিন ট্যাব দেখুন।',
      mr: 'औषधांच्या माहितीसाठी मेडिसिन टॅब पहा.',
      gu: 'દવાઓની વિગતો માટે મેડિસિન ટેબ જુઓ.',
    },
  },
];

export interface DoctorAdviceResponse {
  reply: string;
  emergency: boolean;
  sources: string[];
  doctorConsultation?: {
    assessment: string;
    homeCare: string;
    medicineGuidance: string;
    warningSigns: string;
  };
  recommendedHospital?: Hospital;
  recommendedDepartment?: string;
  recommendedReason?: string;
}

export const sahayAiService = {
  getDailyAdvice(index = 0): SahayAiAdvice {
    return SAHAY_AI_ADVICE_COLLECTION[index % SAHAY_AI_ADVICE_COLLECTION.length];
  },

  getAllAdvice(): SahayAiAdvice[] {
    return SAHAY_AI_ADVICE_COLLECTION;
  },

  // Dr. Sahay: Virtual Physician Clinical Consultation & Hospital Matching
  async consultSahayAi(
    userMessage: string,
    lang: Language,
    customCoords?: UserCoordinates
  ): Promise<DoctorAdviceResponse> {
    const q = userMessage.toLowerCase().trim();

    // Determine user coordinates for dynamic distance and hospital matching
    const allHospitals = hospitalService.getAll();
    const coords = customCoords || locationService.getSavedLocation() || {
      latitude: 12.5113,
      longitude: 79.8837,
      districtDetected: 'Chengalpattu Rural, Tamil Nadu',
      isLocating: false,
    };

    // Hospital match for this condition
    const match = locationService.matchHospitalByCondition(q, allHospitals, coords);

    // ==========================================
    // 1. CARDIAC / CHEST PAIN EMERGENCY (Critical)
    // ==========================================
    if (
      q.includes('chest') ||
      q.includes('heart') ||
      q.includes('breath') ||
      q.includes('நெஞ்சு') ||
      q.includes('சீனா') ||
      q.includes('छाती') ||
      q.includes('सांस') ||
      q.includes('గుండె') ||
      q.includes('ఎద') ||
      q.includes('ನೆಂಜ್') ||
      q.includes('ಎದೆ') ||
      q.includes('നെഞ്ച്') ||
      q.includes('বুক') ||
      q.includes('छातीत')
    ) {
      const emergencyReplies: Record<Language, string> = {
        hi: `⚠️ डॉ. सहाय आपातकालीन चेतावनी:\nसीने में तेज दर्द, भारीपन, बाईं बांह में खिंचाव या सांस फूलना एक गंभीर दिल का दौरा (Cardiac Emergency) हो सकता है।\n\nतत्काल कदम:\n1. बिना किसी देरी के 108 (एम्बुलेंस) या 112 डायल करें।\n2. मरीज को सीधा बैठाएं (लेटने न दें), कपड़े ढीले करें और शांत रखें।\n3. खुद गाड़ी चलाकर अस्पताल न जाएं।`,
        ta: `⚠️ டாக்டர் சஹாய் அவசர மருத்துவ எச்சரிக்கை:\nநெஞ்சு வலி, பாரம், இடது கைக்கு வலி பரவுதல் அல்லது மூச்சுத்திணறல் உடனடியாக கவனிக்கப்பட வேண்டிய அவசர இதயப் பிரச்சனை ஆகும்.\n\nஉடனடி நடவடிக்கைகள்:\n1. உடனடியாக 108 ஆம்புலன்ஸ் அல்லது 112 எண்ணை அழைக்கவும்.\n2. நோயாளியை அமர வைக்கவும் (படுக்க வைக்க வேண்டாம்).\n3. தாமதமின்றி 24x7 அவசர தீவிர சிகிச்சைப் பிரிவு கொண்ட அருகிலுள்ள மருத்துவமனைக்கு செல்லவும்.`,
        te: `⚠️ డాక్టర్ సహాయ్ అత్యవసర హెచ్చరిక:\nతీవ్రమైన గుండె నొప్పి, ఛాతీలో ఒత్తిడి లేదా శ్వాస ఆడకపోవడం గుండెపోటు లక్షణం కావచ్చు.\n\nతక్షణ చర్యలు:\n1. వెంటనే 108 లేదా 112 కు కాల్ చేయండి.\n2. రోగిని కూర్చోబెట్టండి, నడవనివ్వవద్దు.\n3. అత్యవసర ICU ఉన్న ఆసుపత్రికి వెళ్లండి.`,
        kn: `⚠️ ಡಾ. ಸಹಾಯ್ ತುರ್ತು ಎಚ್ಚರಿಕೆ:\nಎದೆ ನೋವು, ಭಾರವಾದ ಅನುಭವ ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಹೃದಯಾಘಾತದ ಲಕ್ಷಣವಾಗಿರಬಹುದು.\n\nತಕ್ಷಣದ ಕ್ರಮಗಳು:\n1. ಕೂಡಲೇ 108 ಅಥವಾ 112 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ.\n2. ರೋಗಿಯನ್ನು ಕುಳಿತುಕೊಳ್ಳಲು ಹೇಳಿ.\n3. ತಕ್ಷಣ ತುರ್ತು ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.`,
        ml: `⚠️ ഡോ. സഹായ് അടിയന്തിര മുന്നറിയിപ്പ്:\nകഠിനമായ നെഞ്ചുവേദനയോ ശ്വാസതടസ്സമോ ഹൃദയാഘാത ലക്ഷണമാകാം.\n\nഉടൻ ചെയ്യേണ്ട കാര്യങ്ങൾ:\n1. ഉടൻ തന്നെ 108 അല്ലെങ്കിൽ 112 വിളിക്കുക.\n2. രോഗിയെ ഇരിക്കാൻ അനുവദിക്കുക.\n3. അടുത്തുള്ള എമർജൻസി ആശുപത്രിയിലേക്ക് കൊണ്ടുപോകുക.`,
        bn: `⚠️ ডা. সহায় জরুরী সতর্কতা:\nবুকে তীব্র ব্যথা বা শ্বাসকষ্ট হার্ট অ্যাটাকের লক্ষণ হতে পারে।\n\nঅবিলম্বে করণীয়:\n১. অবিলম্বে ১০৮ বা ১১২ এম্বুলেন্সে কল করুন।\n২. রোগীকে বসিয়ে রাখুন।\n৩. নিকটস্থ জরুরী হাসপাতালে নিয়ে যান।`,
        mr: `⚠️ डॉ. सहाय आणीबाणी इशारा:\nछातीत तीव्र वेदना किंवा श्वास घेण्यास त्रास होणे हृदयविकाराचा झटका असू शकतो.\n\nतातडीची पावले:\n१. त्वरित १०८ किंवा ११२ वर कॉल करा.\n२. रुग्णाला बसवून ठेवा.\n३. जवळच्या कार्डियाक आयसीयू रुग्णालयात जा.`,
        gu: `⚠️ ડૉ. સહાય ઇમરજન્સી ચેતવણી:\nછાતીમાં તીવ્ર દુખાવો કે શ્વાસ લેવામાં તકલીફ હાર્ટ એટેક હોઈ શકે છે.\n\nતાત્કાલિક પગલાં:\n૧. તરત જ ૧૦૮ અથવા ૧૧૨ પર કૉલ કરો.\n૨. દર્દીને બેસાડી રાખો.\n૩. નજીકની આઈસીયુ હોસ્પિટલમાં પહોંચો.`,
        en: `⚠️ DR. SAHAY EMERGENCY CLINICAL ALERT:\nSevere chest pain, heavy pressure, radiation to the left arm/jaw, or sudden breathlessness strongly indicates a potential cardiac emergency.\n\nImmediate Life-Saving Steps:\n1. Call 108 (Ambulance) or 112 right now.\n2. Keep the patient in a comfortable seated upright position; loosen tight collar/clothing.\n3. Do not attempt to drive yourself; wait for trained paramedics.`,
      };

      const consultationTexts: Record<Language, { assessment: string; homeCare: string; medicineGuidance: string; warningSigns: string }> = {
        hi: {
          assessment: 'गंभीर हृदय रोग / संभावित एक्यूट कोरोनरी सिंड्रोम।',
          homeCare: 'मरीज को शांत रखें, सीधा बैठाएं, शारीरिक हलचल बिल्कुल न करने दें।',
          medicineGuidance: 'डॉक्टर की सलाह के बिना कोई भी भारी दवा न दें। पैरामेडिक्स का इंतजार करें।',
          warningSigns: 'ठंडा पसीना आना, बेहोशी, होंठ नीले पड़ना, अत्यधिक बेचैनी।',
        },
        ta: {
          assessment: 'தீவிர இதய பாதிப்பு / அவசர மருத்துவ நிலை.',
          homeCare: 'நோயாளியை அமர வைக்கவும். நடப்பதை முழுமையாக தவிர்க்கவும்.',
          medicineGuidance: 'மருத்துவ ஆலோசனையின்றி மருந்துகளை சுயமாக உட்கொள்ளாதீர்கள்.',
          warningSigns: 'குளிர்ந்த வியர்வை, மயக்கம், உதடுகள் நீலமாதல், மூச்சுத்திணறல்.',
        },
        te: {
          assessment: 'తీవ్రమైన గుండె సంబంధిత అత్యవసర పరిస్థితి.',
          homeCare: 'రోగిని కదలకుండా విశ్రాంతిగా కూర్చోబెట్టండి.',
          medicineGuidance: 'సొంత మందులు వేయవద్దు, అంబులెన్స్ కోసం వేచి ఉండండి.',
          warningSigns: 'చల్లని చెమటలు, స్పృహ కోల్పోవడం, తీవ్రమైన ఛాతీ ఒత్తిడి.',
        },
        kn: {
          assessment: 'ತೀವ್ರ ಹೃದಯ ಸಂಬಂಧಿ ತುರ್ತು ಸ್ಥಿತಿ.',
          homeCare: 'ರೋಗಿಯನ್ನು ಕದಲದಂತೆ ಕುಳ್ಳಿರಿಸಿ ವಿಶ್ರಾಂತಿ ನೀಡಿ.',
          medicineGuidance: 'ವೈದ್ಯರ ಸಲಹೆ ಇಲ್ಲದೆ ಯಾವುದೇ ಮಾತ್ರೆ ನೀಡಬೇಡಿ.',
          warningSigns: 'ತಣ್ಣನೆಯ ಬೆವರು, ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು, ತೀವ್ರ ಎದೆ ನೋವು.',
        },
        ml: {
          assessment: 'അടിയന്തിര ഹൃദയ സംബന്ധമായ രോഗാവസ്ഥ.',
          homeCare: 'രോഗിയെ അനങ്ങാതെ ഇരുത്തുക, വസ്ത്രങ്ങൾ അയക്കുക.',
          medicineGuidance: 'സ്വയം മരുന്നുകൾ കഴിക്കരുത്, ആംബുലൻസിനായി കാത്തിരിക്കുക.',
          warningSigns: 'തണുത്ത വിയർപ്പ്, ബോധക്ഷയം, അതികഠിനമായ വേദന.',
        },
        bn: {
          assessment: 'জরুরী হৃদরোগ সংক্রান্ত সমস্যা।',
          homeCare: 'রোগীকে সোজা বসিয়ে রাখুন, নড়াচড়া করতে দেবেন না।',
          medicineGuidance: 'ডাক্তারের পরামর্শ ছাড়া কোনো ওষুধ দেবেন না।',
          warningSigns: 'ঠান্ডা ঘাম, অজ্ঞান হওয়া, ঠোঁট নীল হওয়া।',
        },
        mr: {
          assessment: 'गंभीर हृदयविकार आणीबाणी परिस्थिती.',
          homeCare: 'रुग्णाला हालचाल करू न देता सरळ बसवून ठेवा.',
          medicineGuidance: 'वैद्यकीय सल्ल्याशिवाय औषध देऊ नका, रुग्णवाहिकेची वाट पहा.',
          warningSigns: 'थंड घाम, चक्कर येणे, ओठ निळे पडणे.',
        },
        gu: {
          assessment: 'ગંભીર હૃદય રોગની કટોકટી.',
          homeCare: 'દર્દીને હલનચલન ન કરવા દો અને શાંત બેસાડી રાખો.',
          medicineGuidance: 'જાતે કોઈ દવા ન આપો, એમ્બ્યુલન્સની રાહ જુઓ.',
          warningSigns: 'ઠંડો પરસેવો, બેભાન થવું, અતિશય ગભરામણ.',
        },
        en: {
          assessment: 'Suspected Acute Coronary Syndrome / Severe Cardiac Distress.',
          homeCare: 'Rest in seated position with knees slightly bent. Restrict all exertion.',
          medicineGuidance: 'Do not administer heavy oral medications without doctor advice.',
          warningSigns: 'Cold sweats, fainting, lips turning bluish, crushing chest pain.',
        },
      };

      return {
        reply: emergencyReplies[lang] || emergencyReplies.en,
        emergency: true,
        sources: ['National Health Mission (NHM)', 'Indian Council of Medical Research (ICMR Cardiac Protocol)', '108 EMRI'],
        doctorConsultation: consultationTexts[lang] || consultationTexts.en,
        recommendedHospital: match?.hospital,
        recommendedDepartment: match?.department || '24x7 Emergency Cardiac ICU',
        recommendedReason: match?.matchReason || 'Equipped with 24x7 emergency resuscitation, ECG, defibrillators, and critical care physicians.',
      };
    }

    // ==========================================
    // 2. FEVER, COLD, COUGH, MALARIA, DENGUE
    // ==========================================
    if (
      q.includes('fever') ||
      q.includes('cold') ||
      q.includes('cough') ||
      q.includes('shiver') ||
      q.includes('chills') ||
      q.includes('dengue') ||
      q.includes('malaria') ||
      q.includes('காய்ச்சல்') ||
      q.includes('சளி') ||
      q.includes('இருமல்') ||
      q.includes('बुखार') ||
      q.includes('खांसी') ||
      q.includes('सर्दी') ||
      q.includes('జ్వరం') ||
      q.includes('దగ్గు') ||
      q.includes('ಜ್ವರ') ||
      q.includes('ಕೆಮ್ಮು') ||
      q.includes('പനി') ||
      q.includes('ചുമ') ||
      q.includes('জ্বর') ||
      q.includes('কাশি') ||
      q.includes('ताप') ||
      q.includes('તાવ')
    ) {
      const feverReplies: Record<Language, string> = {
        hi: `👨‍⚕️ नमस्ते, मैं डॉ. सहाय बोल रहा हूँ।\nआपके लक्षणों से लगता है कि आपको मौसमी वायरल बुखार या सर्दी-जुकाम है।\n\nडॉक्टर की सलाह और घरेलू देखभाल:\n• पर्याप्त आराम करें और दिनभर में कम से कम 2-3 लीटर उबला हुआ गुनगुना पानी पिएं।\n• भोजन में हल्का आहार जैसे पतली खिचड़ी, दलिया या मूंग दाल का पानी लें।\n• अगर तेज बुखार हो तो सिर पर सामान्य पानी की ठंडी पट्टी रखें।\n\nदवा संबंधी जानकारी:\n• बुखार और बदन दर्द के लिए पैरासिटामोल (Paracetamol 650mg) भोजन के बाद ली जा सकती है (24 घंटे में अधिकतम 3-4 बार)।\n• यह दवा जन औषधि केंद्र पर मात्र ₹10-15 में उपलब्ध है। खुद से एंटीबायोटिक्स कभी न लें।\n\nखतरे के लक्षण:\nयदि बुखार 3 दिन से अधिक रहे या तेज उल्टी हो, तो नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाकर निःशुल्क डेंगू व मलेरिया जांच कराएं।`,
        ta: `👨‍⚕️ வணக்கம், நான் டாக்டர் சஹாய் பேசுகிறேன்.\nஉங்கள் அறிகுறிகளைப் பார்க்கும்போது (காய்ச்சல், சளி, உடல் வலி), இது பருவமழை வைரஸ் தொற்றாக இருக்க வாய்ப்புள்ளது.\n\nமருத்துவரின் எளிய வழிமுறைகள்:\n• போதுமான ஓய்வு எடுங்கள். காய்ச்சிய வெந்நீர் மற்றும் சீரக நீர் நாள் முழுவதும் பருகவும்.\n• எளிதில் செரிமானமாகும் கஞ்சி, இட்லி போன்றவற்றை உட்கொள்ளவும்.\n• உடல் வெப்பநிலை அதிகமாக இருந்தால், சுத்தமான துணியை நீரில் நனைத்து நெற்றியில் ஒத்தடம் கொடுக்கவும்.\n\nமருந்து வழிகாட்டல்:\n• காய்ச்சல் மற்றும் தலைவலிக்கு பாராசிட்டமால் (Paracetamol 650mg) உணவுக்குப் பின் எடுத்துக்கொள்ளலாம்.\n• அரசு ஜன் ஔஷதி மையத்தில் இந்த மாத்திரை வெறும் ₹10-க்கு கிடைக்கிறது.\n\nஎச்சரிக்கை அறிகுறிகள்:\nகாய்ச்சல் 3 நாட்களுக்கு மேல் நீடித்தால், ஆரம்ப சுகாதார நிலையத்திற்கு (PHC) சென்று இலவச பரிசோதனை செய்துகொள்ளுங்கள்.`,
        te: `👨‍⚕️ నమస్తే, నేను డాక్టర్ సహాయ్ ని.\nమీ లక్షణాలు వైరల్ జ్వరం లేదా జలుబును సూచిస్తున్నాయి.\n\nవైద్యుల సలహా:\n• పుష్కలంగా కాచి చల్లార్చిన నీరు త్రాగండి మరియు పూర్తి విశ్రాంతి తీసుకోండి.\n• తేలికపాటి ఆహారం (గంజి, కిచిడీ) తీసుకోండి.\n• జ్వరం ఎక్కువగా ఉంటే తలపై తడి గుడ్డ వేయండి.\n\nమందుల సమాచారం:\n• జ్వరం, ఒంటి నొప్పులకు పారాసిటమాల్ 650mg భోజనం తర్వాత వేసుకోవచ్చు (జన్ ఔషధి కేంద్రంలో రూ. 10 కే లభిస్తుంది).\n• జ్వరం 3 రోజులు దాటితే సమీప ప్రాథమిక ఆరోగ్య కేంద్రంలో (PHC) ఉచిత రక్త పరీక్ష చేయించుకోండి.`,
        kn: `👨‍⚕️ ನಮಸ್ಕಾರ, ನಾನು ಡಾ. ಸಹಾಯ್.\nನಿಮ್ಮ ಲಕ್ಷಣಗಳು ವೈರಲ್ ಜ್ವರ ಅಥವಾ ಶೀತವನ್ನು ಸೂಚಿಸುತ್ತವೆ.\n\nವೈದ್ಯಕೀಯ ಸಲಹೆ:\n• ಸಾಕಷ್ಟು ಕುದಿಸಿದ ನೀರು ಕುಡಿಯಿರಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.\n• ಜ್ವರ ಹೆಚ್ಚಿದ್ದರೆ ಹಣೆಯ ಮೇಲೆ ತಣ್ಣೀರಿನ ಬಟ್ಟೆ ಇರಿಸಿ.\n• ಪ್ಯಾರಸಿಟಮಲ್ 650mg ಮಾತ್ರೆ ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ (ಜನೌಷಧಿಯಲ್ಲಿ ₹10 ಗೆ ಲಭ್ಯ).\n• ಜ್ವರ 3 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚಿದ್ದರೆ ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.`,
        ml: `👨‍⚕️ നമസ്കാരം, ഞാൻ ഡോ. സഹായ് ആണ്.\nലക്ഷണങ്ങൾ വൈറൽ പനിയെ സൂചിപ്പിക്കുന്നു.\n\nഡോക്ടറുടെ നിർദ്ദേശം:\n• തിളപ്പിച്ചാറ്റിയ വെള്ളം ധാരാളം കുടിക്കുക, പൂർണ്ണ വിശ്രമം എടുക്കുക.\n• പനി കൂടുതലാണെങ്കിൽ നനഞ്ഞ തുണി കൊണ്ട് നെറ്റി തുടയ്ക്കുക.\n• പാരസെറ്റമോൾ 650mg ഭക്ഷണത്തിന് ശേഷം കഴിക്കാം.\n• 3 ദിവസത്തിൽ കൂടുതൽ പനി നീണ്ടുനിൽക്കുകയാണെങ്കിൽ പി.എച്ച്.സി സന്ദർശിക്കുക.`,
        bn: `👨‍⚕️ নমস্কার, আমি ডা. সহায়।\nআপনার লক্ষণগুলি ভাইরাল জ্বর বা সর্দির ইঙ্গিত দেয়।\n\nপরামর্শ:\n• প্রচুর জল ও তরল খাবার গ্রহণ করুন এবং বিশ্রাম নিন।\n• জ্বর বেশি হলে কপালে জলপট্টি দিন।\n• প্যারাসিটামল 650mg খাবারের পর গ্রহণ করুন (জন ঔষধি কেন্দ্রে মাত্র ₹১০)।\n• ৩ দিনের বেশি জ্বর থাকলে স্বাস্থ্য কেন্দ্রে রক্ত পরীক্ষা করান।`,
        mr: `👨‍⚕️ नमस्कार, मी डॉ. सहाय बोलत आहे.\nही लक्षणे व्हायरल ताप किंवा सर्दीची असू शकतात.\n\nडॉक्टरांचा सल्ला:\n• उकळलेले कोमट पाणी भरपूर प्या आणि विश्रांती घ्या.\n• जास्त ताप असल्यास डोक्यावर थंड पाण्याची पट्टी ठेवा.\n• तापासाठी पॅरासिटामॉल 650mg जेवणानंतर घ्या (जन औषधी केंद्रावर ₹१० मध्ये उपलब्ध).\n• ताप ३ दिवसांपेक्षा जास्त राहिल्यास प्राथमिक आरोग्य केंद्रात मोफत तपासणी करा.`,
        gu: `👨‍⚕️ નમસ્તે, હું ડૉ. સહાય છું.\nઆ લક્ષણો મોસમી વાયરલ તાવના છે.\n\nડૉક્ટરની સલાહ:\n• ઉકાળેલું પાણી પુષ્કળ પીવો અને પૂરતો આરામ કરો.\n• તાવ વધુ હોય તો કપાળ પર ભીનું પોતા મૂકો.\n• પેરાસિટામોલ 650mg જમ્યા પછી લઈ શકાય છે (જન ઔષધિમાં માત્ર ₹૧૦ માં).\n• તાવ ૩ દિવસથી વધુ રહે તો પીએચસી પર જઈ લોહી તપાસ કરાવો.`,
        en: `👨‍⚕️ Hello, this is Dr. Sahay, your virtual health physician.\nBased on your symptoms (fever, body ache, or cold), this appears consistent with an acute seasonal viral fever.\n\nDoctor's Home Care & Immediate Relief:\n• Hydration is key: Drink plenty of boiled, lukewarm water or ORS to replenish fluids.\n• Rest completely; if temperature is high (> 100°F), perform forehead sponging with clean water.\n• For temperature and body aches: Paracetamol 650mg taken after meals (maximum 3-4 tablets in 24 hours).\n• Available at Jan Aushadhi Kendras for just ₹10 per strip under generic pricing. Never self-prescribe antibiotics.\n\nRed Flag Warning Signs:\nIf fever persists beyond 3 days or temperature exceeds 102°F, visit your nearest Primary Health Centre (PHC) for a free Dengue & Malaria blood test.`,
      };

      const feverConsultation: Record<Language, { assessment: string; homeCare: string; medicineGuidance: string; warningSigns: string }> = {
        hi: {
          assessment: 'मौसमी वायरल बुखार / ऊपरी श्वसन संक्रमण।',
          homeCare: 'उबला पानी, ओआरएस, हल्का सुपाच्य भोजन (खिचड़ी/दलिया), सिर पर ठंडे पानी की पट्टी।',
          medicineGuidance: 'पैरासिटामोल 650mg भोजन के बाद। ब्रूफेन या बिना डॉक्टर की एंटीबायोटिक न लें।',
          warningSigns: '3 दिन से अधिक बुखार, 102°F से तेज तापमान, अत्यधिक उल्टी या शरीर पर चकत्ते।',
        },
        ta: {
          assessment: 'பருவமழை வைரஸ் காய்ச்சல் / சளி தொற்று.',
          homeCare: 'காய்ச்சிய வெந்நீர், ஓஆர்எஸ் கரைசல், மிதமான கஞ்சி, நெற்றியில் நனைத்த துணி ஒத்தடம்.',
          medicineGuidance: 'பாராசிட்டமால் 650mg உணவுக்குப் பின். சுயமாக வலி மாத்திரைகளை தவிர்க்கவும்.',
          warningSigns: '3 நாட்களுக்கு மேல் காய்ச்சல், 102°F அதிக வெப்பம், கடுமையான வாந்தி, தோலில் தடிப்புகள்.',
        },
        te: {
          assessment: 'వైరల్ జ్వరం / శ్వాసకోశ ఇన్ఫెక్షన్.',
          homeCare: 'కాచి చల్లార్చిన నీరు, ఓఆర్ఎస్, గంజి, తలపై తడి గుడ్డ.',
          medicineGuidance: 'పారాసిటమాల్ 650mg భోజనం తర్వాత. యాంటీబయాటిక్స్ సొంతంగా వాడవద్దు.',
          warningSigns: '3 రోజులు మించిన జ్వరం, తీవ్ర అలసట, వాంతులు.',
        },
        kn: {
          assessment: 'ವೈರಲ್ ಜ್ವರ / ಶೀತ ಸೋಂಕು.',
          homeCare: 'ಕುದಿಸಿದ ನೀರು, ಗಂಜಿ, ವಿಶ್ರಾಂತಿ, ಹಣೆಗೆ ತಣ್ಣೀರಿನ ಬಟ್ಟೆ.',
          medicineGuidance: 'ಪ್ಯಾರಸಿಟಮಲ್ 650mg ಊಟದ ನಂತರ. ಅತಿಯಾದ ನೋವು ನಿವಾರಕ ಬೇಡ.',
          warningSigns: '3 ದಿನಕ್ಕಿಂತ ಹೆಚ್ಚು ಜ್ವರ, ತೀವ್ರ ವಾಂತಿ, ದದ್ದುಗಳು.',
        },
        ml: {
          assessment: 'വൈറൽ പനി / ശ്വാസകോശ അണുബാധ.',
          homeCare: 'തിളപ്പിച്ചാറ്റിയ വെള്ളം, ഒ.ആർ.എസ്, കഞ്ഞി, വിശ്രമം.',
          medicineGuidance: 'പാരസെറ്റമോൾ 650mg ഭക്ഷണത്തിന് ശേഷം.',
          warningSigns: '3 ദിവസത്തിൽ കൂടുതൽ പനി, അതികഠിനമായ ക്ഷീണം.',
        },
        bn: {
          assessment: 'মৌসুমি ভাইরাল জ্বর ও সর্দি।',
          homeCare: 'ফুটানো জল, ওআরএস, পাতলা খিচুড়ি, মাথায় জলপট্টি।',
          medicineGuidance: 'প্যারাসিটামল 650mg খাবারের পর। অপ্রয়োজনীয় অ্যান্টিবায়োটিক বর্জন করুন।',
          warningSigns: '৩ দিনের বেশি জ্বর, তীব্র বমি, লাল দাগ।',
        },
        mr: {
          assessment: 'व्हायरल ताप आणि सर्दी संसर्ग.',
          homeCare: 'उकळलेले पाणी, हलका आहार, विश्रांती, डोक्यावर पाण्याची घडी.',
          medicineGuidance: 'पॅरासिटामॉल 650mg जेवणानंतर.',
          warningSigns: '३ दिवसांपेक्षा जास्त ताप, अंगावर पुरळ, उलटी.',
        },
        gu: {
          assessment: 'વાયરલ તાવ અને શરદીનો ચેપ.',
          homeCare: 'ઉકાળેલું પાણી, ઓઆરએસ, હળવો ખોરાક, કપાળે ભીના પોતા.',
          medicineGuidance: 'પેરાસિટામોલ 650mg જમ્યા પછી.',
          warningSigns: '૩ દિવસથી વધુ તાવ, અતિશય નબળાઈ, ઉલટી.',
        },
        en: {
          assessment: 'Acute Seasonal Viral Pyrexia / Upper Respiratory Infection.',
          homeCare: 'Boiled water hydration, ORS, light soft diet (khichdi/kanji), forehead water sponging.',
          medicineGuidance: 'Paracetamol 650mg after food. Avoid heavy NSAIDs and unverified antibiotics.',
          warningSigns: 'Fever > 3 days, temperature > 102°F, dark urine, extreme drowsiness.',
        },
      };

      return {
        reply: feverReplies[lang] || feverReplies.en,
        emergency: false,
        sources: ['National Vector Borne Disease Control Programme (NVBDCP)', 'Indian Council of Medical Research (ICMR)'],
        doctorConsultation: feverConsultation[lang] || feverConsultation.en,
        recommendedHospital: match?.hospital,
        recommendedDepartment: match?.department || 'General OPD & Fever Screening Clinic',
        recommendedReason: match?.matchReason || 'Closest government health facility with free doctor consultation and diagnostic testing.',
      };
    }

    // ==========================================
    // 3. STOMACH PAIN, DIARRHEA, VOMITING, ACIDITY
    // ==========================================
    if (
      q.includes('stomach') ||
      q.includes('belly') ||
      q.includes('vomit') ||
      q.includes('diarrhea') ||
      q.includes('loose') ||
      q.includes('motion') ||
      q.includes('acidity') ||
      q.includes('gastric') ||
      q.includes('வயிறு') ||
      q.includes('வாந்தி') ||
      q.includes('பேதி') ||
      q.includes('पेट') ||
      q.includes('उल्टी') ||
      q.includes('दस्त') ||
      q.includes('కడుపు') ||
      q.includes('వాంతులు') ||
      q.includes('ಹೊಟ್ಟೆ') ||
      q.includes('വയറുവേദന') ||
      q.includes('পেট') ||
      q.includes('पोट')
    ) {
      const stomachReplies: Record<Language, string> = {
        hi: `👨‍⚕️ नमस्ते, मैं डॉ. सहाय बोल रहा हूँ।\nपेट दर्द, उल्टी या दस्त के लक्षणों में सबसे महत्वपूर्ण बात शरीर में पानी की कमी (Dehydration) को रोकना है।\n\nडॉक्टर की सलाह:\n• 1 लीटर उबले पानी में 1 पैकेट ओआरएस (ORS) घोलकर घूंट-घूंट पिएं।\n• छाछ, नारियल पानी या चावल का मांड़ लें। तला-भुना खाना बिल्कुल न खाएं।\n• गैस और जलन के लिए पैंटोप्राजोल या एंटासिड लिया जा सकता है।\n• जन औषधि केंद्र पर ओआरएस मात्र ₹4 में उपलब्ध है। खून आने पर तुरंत अस्पताल जाएं।`,
        ta: `👨‍⚕️ வணக்கம், நான் டாக்டர் சஹாய் பேசுகிறேன்.\nவயிற்று வலி, வாந்தி அல்லது வயிற்றுப்போக்கு ஏற்படும் போது உடலில் நீர்ச்சத்து குறைவதைத் தடுப்பது மிகவும் அவசியம்.\n\nமருத்துவரின் வழிகாட்டல்:\n• 1 லிட்டர் காய்ச்சிய நீரில் 1 பாக்கெட் ஓ.ஆர்.எஸ் (ORS) கரைத்து சிறிது சிறிதாக குடிக்கவும்.\n• மோர், இளநீர், சீரகத் தண்ணீர் பருகவும். காரமான உணவுகளை தவிர்க்கவும்.\n• வாய்வு மற்றும் நெஞ்செரிச்சலுக்கு பான்டோபிரசோல் (Pantoprazole 40mg) அல்லது ஜெல் மருந்துகள் உதவும்.\n• ஜன் ஔஷதி மையத்தில் ORS கரைசல் வெறும் ₹4 விலையில் கிடைக்கிறது.`,
        te: `👨‍⚕️ నమస్తే, నేను డాక్టర్ సహాయ్ ని.\nకడుపు నొప్పి, వాంతులు లేదా విరేచనాల సమయంలో డీహైడ్రేషన్ నివారించడం ముఖ్యం.\n\nవైద్యుల సలహా:\n• 1 లీటరు కాచిన నీటిలో 1 ప్యాకెట్ ఓఆర్ఎస్ కలిపి కొద్దికొద్దిగా త్రాగండి.\n• కొబ్బరి నీళ్ళు, మజ్జిగ తీసుకోండి. మసాలా ఆహారం తినవద్దు.\n• ఎసిడిటీకి పాంటోప్రజోల్ తీసుకోవచ్చు. జన్ ఔషధిలో ఓఆర్ఎస్ రూ. 4 కే లభిస్తుంది.`,
        kn: `👨‍⚕️ ನಮಸ್ಕಾರ, ನಾನು ಡಾ. ಸಹಾಯ್.\nಹೊಟ್ಟೆ ನೋವು, ವಾಂತಿ ಭೇದಿಯಾದಾಗ ನಿರ್ಜಲೀಕರಣ ತಡೆಗಟ್ಟುವುದು ಮುಖ್ಯ.\n\nವೈದ್ಯಕೀಯ ಸಲಹೆ:\n• 1 ಲೀಟರ್ ಕುದಿಸಿದ ನೀರಿಗೆ 1 ಪ್ಯಾಕೆಟ್ ಓಆರ್‌ಎಸ್ ಬೆರೆಸಿ ಕುಡಿಯಿರಿ.\n• ಎಳನೀರು, ಮಜ್ಜಿಗೆ ಸೇವಿಸಿ. ಮಸಾಲೆಯುಕ್ತ ಆಹಾರ ಬೇಡ.\n• ಜನೌಷಧಿಯಲ್ಲಿ ಓಆರ್‌ಎಸ್ ಕೇವಲ ₹4 ಗೆ ಲಭ್ಯವಿದೆ.`,
        ml: `👨‍⚕️ നമസ്കാരം, ഞാൻ ഡോ. സഹായ് ആണ്.\nവയറുവേദന, ഛർദ്ദി എന്നിവയിൽ നിർജ്ജലീകരണം തടയുക എന്നതാണ് പ്രധാനം.\n\nഡോക്ടറുടെ നിർദ്ദേശം:\n• 1 ലിറ്റർ തിളപ്പിച്ച വെള്ളത്തിൽ 1 പാക്കറ്റ് ഒ.ആർ.എസ് കലക്കി കുടിക്കുക.\n• ഇളനീർ, മോര് എന്നിവ കുടിക്കുക. എരിവുള്ള ഭക്ഷണം ഒഴിവാക്കുക.\n• ജൻ ഔഷധിയിൽ ഒ.ആർ.എസ് 4 രൂപയ്ക്ക് ലഭ്യമാണ്.`,
        bn: `👨‍⚕️ নমস্কার, আমি ডা. সহায়।\nপেট ব্যথা, বমি বা পাতলা পায়খানায় ডিহাইড্রেশন রোধ করা জরুরি।\n\nপরামর্শ:\n• ১ লিটার ফুটানো জলে ১ প্যাকেট ওআরএস মিশিয়ে বারবার পান করুন।\n• ডাবের জল, ঘোল খান। মশলাদার খাবার খাবেন না।\n• জন ঔষধি কেন্দ্রে ওআরএস মাত্র ₹৪-এ পাওয়া যায়।`,
        mr: `👨‍⚕️ नमस्कार, मी डॉ. सहाय बोलत आहे.\nपोटदुखी, उलटी किंवा जुलाबामध्ये शरीरातील पाणी कमी होऊ न देणे महत्त्वाचे आहे.\n\nडॉक्टरांचा सल्ला:\n• १ लिटर उकळलेल्या पाण्यात १ पाकीट ओआरएस मिसळून घोट-घोट प्या.\n• ताक, नारळ पाणी घ्या. मसालेदार जेवण टाळा.\n• जन औषधी केंद्रावर ओआरएस फक्त ₹४ मध्ये उपलब्ध आहे.`,
        gu: `👨‍⚕️ નમસ્તે, હું ડૉ. સહાય છું.\nપેટનો દુખાવો, ઉલટી કે ઝાડામાં ડિહાઇડ્રેશન રોકવું જરૂરી છે.\n\nડૉક્ટરની સલાહ:\n• ૧ લિટર ઉકાળેલા પાણીમાં ૧ પેકેટ ઓઆરએસ ઓગાળીને ઘૂંટડે-ઘૂંટડે પીવો.\n• છાશ, નાળિયેર પાણી લો. તીખો ખોરાક ટાળો.\n• જન ઔષધિ કેન્દ્ર પર ઓઆરએસ માત્ર ₹૪ માં ઉપલબ્ધ છે.`,
        en: `👨‍⚕️ Hello, this is Dr. Sahay, your virtual health physician.\nFor abdominal cramps, nausea, vomiting, or loose motions, the primary clinical focus is preventing acute dehydration and resting the gut.\n\nDoctor's Home Care & Rehydration:\n• Oral Rehydration Solution (ORS): Dissolve 1 sachet in 1 Litre of clean boiled water; sip continuously.\n• Tender coconut water, buttermilk, or rice water (kanji). Avoid spicy and oily foods.\n• For acidity: Generic Pantoprazole 40mg before meals. ORS sachets cost just ₹4 at Jan Aushadhi Kendras.`,
      };

      const stomachConsultation: Record<Language, { assessment: string; homeCare: string; medicineGuidance: string; warningSigns: string }> = {
        hi: {
          assessment: 'गैस्ट्रोएंटेराइटिस / एसिडिटी पेप्टिक या आंतों का हल्का संक्रमण।',
          homeCare: 'ओआरएस घोल, छाछ, नारियल पानी, हल्का भोजन। मसालेदार भोजन से पूर्ण परहेज।',
          medicineGuidance: 'पैंटोप्राजोल 40mg खाली पेट या ओआरएस व जिंक। खुद से भारी पेनकिलर न लें।',
          warningSigns: 'उल्टी या मल में खून, तेज बुखार, लगातार पानी न रुकना, पेशाब बंद होना।',
        },
        ta: {
          assessment: 'இரைப்பை அழற்சி / அசிடிட்டி அல்லது வயிற்றுப்போக்கு.',
          homeCare: 'ஓ.ஆர்.எஸ் கரைசல், மோர், இளநீர், மிதமான உணவு. காரமான உணவை தவிர்க்கவும்.',
          medicineGuidance: 'பான்டோபிரசோல் 40mg உணவுக்கு முன் அல்லது ORS கரைசல்.',
          warningSigns: 'மலத்தில் ரத்தம், கடும் தலைசுற்றல், சிறுநீர் வெளியேறாமை.',
        },
        te: {
          assessment: 'గ్యాస్ట్రిక్ / డయేరియా లక్షణాలు.',
          homeCare: 'ఓఆర్ఎస్, కొబ్బరి నీళ్ళు, మజ్జిగ, చల్లని ద్రవాలు.',
          medicineGuidance: 'పాంటోప్రజోల్ 40mg ఉదయాన్నే పరగడుపున.',
          warningSigns: 'రక్తపు వాంతులు, తీవ్రమైన కడుపు నొప్పి.',
        },
        kn: {
          assessment: 'ಗ್ಯಾಸ್ಟ್ರಿಕ್ / ಅತಿಸಾರ ಸಮಸ್ಯೆ.',
          homeCare: 'ಓಆರ್‌ಎಸ್, ಎಳನೀರು, ಮಜ್ಜಿಗೆ, ಸುಲಭವಾಗಿ ಜೀರ್ಣವಾಗುವ ಆಹಾರ.',
          medicineGuidance: 'ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್ 40mg ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ.',
          warningSigns: 'ಮಲದಲ್ಲಿ ರಕ್ತ, ತೀವ್ರ ನಿರ್ಜಲೀಕರಣ.',
        },
        ml: {
          assessment: 'ഗ്യാസ്ട്രിക് / വയറിളക്കം.',
          homeCare: 'ഒ.ആർ.എസ് ലായനി, കരിക്കിൻ വെള്ളം, മോര്.',
          medicineGuidance: 'പാന്റോപ്രാസോൾ 40mg ഒഴിഞ്ഞ വയറ്റിൽ.',
          warningSigns: 'രക്തസ്രാവം, അമിതമായ ക്ഷീണം.',
        },
        bn: {
          assessment: 'গ্যাস্ট্রিক / ডায়রিয়া সমস্যা।',
          homeCare: 'ওআরএস, ডাবের জল, ঘোল, সহজপাচ্য খাদ্য।',
          medicineGuidance: 'প্যান্টোপ্রাজল 40mg খালি পেটে।',
          warningSigns: 'মলে রক্ত, তীব্র জলশূন্যতা।',
        },
        mr: {
          assessment: 'अॅसिडिटी / पोटाचा संसर्ग व जुलाब.',
          homeCare: 'ओआरएस, ताक, शहाळ्याचे पाणी, साधे जेवण.',
          medicineGuidance: 'पँटोप्राझोल 40mg रिकाम्या पोटी.',
          warningSigns: 'उलटीत रक्त, लघवी कमी होणे.',
        },
        gu: {
          assessment: 'એસિડિટી / પેટનો ચેપ અને ઝાડા.',
          homeCare: 'ઓઆરએસ, છાશ, નાળિયેર પાણી, હળવો ખોરાક.',
          medicineGuidance: 'પેન્ટોપ્રાઝોલ 40mg ભૂખ્યા પેટે.',
          warningSigns: 'ઝાડામાં લોહી, વધુ પડતી નબળાઈ.',
        },
        en: {
          assessment: 'Acute Gastroenteritis / Acid Peptic Irritation.',
          homeCare: 'ORS continuous sips, tender coconut water, light khichdi.',
          medicineGuidance: 'Pantoprazole 40mg before food. Oral zinc with ORS.',
          warningSigns: 'Blood in stool or vomit, severe rigid cramping, no urination.',
        },
      };

      return {
        reply: stomachReplies[lang] || stomachReplies.en,
        emergency: false,
        sources: ['World Health Organization (WHO Diarrhoea Guidelines)', 'National Health Portal (NHP India)'],
        doctorConsultation: stomachConsultation[lang] || stomachConsultation.en,
        recommendedHospital: match?.hospital,
        recommendedDepartment: match?.department || 'Gastroenterology & General Medicine OPD',
        recommendedReason: match?.matchReason || 'Equipped with oral rehydration corners, IV drip facilities, and essential digestive medicines.',
      };
    }

    // ==========================================
    // 4. DIABETES (SUGAR) & HYPERTENSION (BP)
    // ==========================================
    if (
      q.includes('sugar') ||
      q.includes('diabetes') ||
      q.includes('bp') ||
      q.includes('pressure') ||
      q.includes('hypertension') ||
      q.includes('சர்க்கரை') ||
      q.includes('ரத்த அழுத்தம்') ||
      q.includes('शुगर') ||
      q.includes('बीपी') ||
      q.includes('రక్తపోటు') ||
      q.includes('మధుమేహం') ||
      q.includes('ಸಕ್ಕರೆ') ||
      q.includes('ಪ್ರಮೇహం') ||
      q.includes('ডায়াবেটিস') ||
      q.includes('डायबिटीज')
    ) {
      const chronicReplies: Record<Language, string> = {
        hi: `👨‍⚕️ नमस्ते, मैं डॉ. सहाय बोल रहा हूँ।\nडायबिटीज और हाई बीपी का इलाज जीवनभर नियमित दवा और सही खानपान से पूरी तरह संभव है।\n\nडॉक्टर की सलाह:\n• रोज 30 मिनट तेज गति से टहलें। भोजन में नमक, मीठा और रिफाइंड तेल कम करें।\n• अपने पैरों की रोज जांच करें ताकि कोई छोटा घाव या छाला न छूटे।\n\nदवा संबंधी जानकारी (जन औषधि भारी बचत):\n• बीपी की दवा (Telmisartan 40mg) और शुगर की दवा (Metformin 500mg) सरकारी जन औषधि केंद्र पर मात्र ₹9 से ₹36 में पूरे महीने की मिल जाती है, जबकि प्राइवेट में यह ₹200-300 की होती है।\n• दवा की खुराक कभी भी खुद से न छोड़ें। महीने में एक बार सरकारी क्लिनिक में बीपी और शुगर मुफ्त जांच कराएं।`,
        ta: `👨‍⚕️ வணக்கம், நான் டாக்டர் சஹாய் பேசுகிறேன்.\nசர்க்கரை நோய் மற்றும் ரத்த அழுத்தத்தை (BP) முறையான வாழ்க்கை முறை மற்றும் தொடர் மருந்துகள் மூலம் எளிதாக கட்டுப்படுத்தலாம்.\n\nமருத்துவரின் எளிய ஆலோசனைகள்:\n• தினமும் 30 நிமிடங்கள் நடைப்பயிற்சி செய்யுங்கள். உணவில் உப்பை குறைக்கவும்.\n• கால்களில் காயம் ஏற்படாமல் பாதுகாக்க மென்மையான காலணிகளை அணியுங்கள்.\n\nஜன் ஔஷதி மருந்து சேமிப்பு:\n• டெல்மிசார்ட்டன் (Telmisartan 40mg) மற்றும் மெட்ஃபார்மின் (Metformin 500mg) மருந்துகள் அரசு ஜன் ஔஷதி மையங்களில் 80% குறைந்த விலையில் கிடைக்கின்றன.\n• மருந்துகளை ஒருபோதும் தவிர்க்காதீர்கள். ஆரம்ப சுகாதார நிலையத்தில் இலவசமாக சர்க்கரை அளவை பரிசோதியுங்கள்.`,
        te: `👨‍⚕️ నమస్తే, నేను డాక్టర్ సహాయ్ ని.\nషుగర్ మరియు బీపీని క్రమం తప్పకుండా మందులు వాడటం ద్వారా సులభంగా నియంత్రించవచ్చు.\n\nవైద్యుల సలహా:\n• రోజూ 30 నిమిషాలు నడవండి. ఉప్పు, నూనె తగ్గించండి.\n• జన్ ఔషధి కేంద్రాలలో మెట్‌ఫార్మిన్ మరియు టెల్మిసార్టన్ మందులు 80% తక్కువ ధరకే లభిస్తాయి.\n• నెలకు ఒకసారి ఉచితంగా షుగర్ మరియు బీపీ పరీక్ష చేయించుకోండి.`,
        kn: `👨‍⚕️ ನಮಸ್ಕಾರ, ನಾನು ಡಾ. ಸಹಾಯ್.\nಮಧುಮೇಹ ಮತ್ತು ಬಿಪಿಯನ್ನು ನಿಯಮಿತ ಔಷಧಿಯಿಂದ ನಿಯಂತ್ರಿಸಬಹುದು.\n\nವೈದ್ಯಕೀಯ ಸಲಹೆ:\n• ದಿನವೂ 30 ನಿಮಿಷ ವ್ಯಾಯಾಮ ಮಾಡಿ. ಉಪ್ಪು ಕಡಿಮೆ ಮಾಡಿ.\n• ಜನೌಷಧಿಯಲ್ಲಿ ಬಿಪಿ ಮತ್ತು ಶುಗರ್ ಮಾತ್ರೆಗಳು 80% ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಲಭ್ಯವಿದೆ.\n• ಮಾತ್ರೆಗಳನ್ನು ಎಂದಿಗೂ ನಿಲ್ಲಿಸಬೇಡಿ.`,
        ml: `👨‍⚕️ നമസ്കാരം, ഞാൻ ഡോ. സഹായ് ആണ്.\nപ്രമേഹവും ബിപിയും മരുന്നുകളിലൂടെയും വ്യായാമത്തിലൂടെയും നിയന്ത്രിക്കാം.\n\nഡോക്ടറുടെ നിർദ്ദേശം:\n• ദിവസവും 30 മിനിറ്റ് നടക്കുക. ഉപ്പും മധുരവും കുറയ്ക്കുക.\n• ജൻ ഔഷധി കേന്ദ്രങ്ങളിൽ 80% കുറഞ്ഞ നിരക്കിൽ മരുന്നുകൾ ലഭിക്കും.\n• മരുന്നുകൾ മുടങ്ങാതെ കഴിക്കുക.`,
        bn: `👨‍⚕️ নমস্কার, আমি ডা. সহায়।\nডায়াবেটিস ও রক্তচাপ নিয়ন্ত্রণে নিয়মিত ওষুধ খাওয়া অপরিহার্য।\n\nপরামর্শ:\n• প্রতিদিন ৩০ মিনিট হাঁটুন। নুন ও মিষ্টি কম খান।\n• জন ঔষধি কেন্দ্রে প্রয়োজনীয় ওষুধ ৮০% কম মূল্যে পাওয়া যায়।\n• কোনো দিনও ওষুধ বাদ দেবেন না।`,
        mr: `👨‍⚕️ नमस्कार, मी डॉ. सहाय बोलत आहे.\nमधुमेह आणि बीपी नियमित औषधोपचाराने नियंत्रणात राहू शकतात.\n\nडॉक्टरांचा सल्ला:\n• दररोज ३० मिनिटे चाला. जेवणात मीठ कमी करा.\n• जन औषधी केंद्रावर बीपी व शुगरची औषधे ८०% पर्यंत स्वस्त मिळतात.\n• औषधांचा डोस कधीही चुकवू नका.`,
        gu: `👨‍⚕️ નમસ્તે, હું ડૉ. સહાય છું.\nડાયાબિટીસ અને બીપી નિયમિત દવાઓ દ્વારા કાબૂમાં રાખી શકાય છે.\n\nડૉક્ટરની સલાહ:\n• રોજ ૩૦ મિનિટ ચાલો. ખોરાકમાં મીઠું ઘટાડો.\n• જન ઔષધિ કેન્દ્રો પર બીપી અને ડાયાબિટીસની દવાઓ ૮૦% સસ્તી મળે છે.\n• નિયમિત દવા લેવાનું ચાલુ રાખો.`,
        en: `👨‍⚕️ Hello, this is Dr. Sahay, your virtual health physician.\nChronic management of Type-2 Diabetes and Hypertension requires consistent daily compliance and lifestyle adaptation.\n\nDoctor's Lifestyle & Dietary Advice:\n• Brisk walking 30 minutes daily. Reduce salt and refined carbohydrates.\n• Daily foot inspection to prevent diabetic ulcers.\n\nAffordable Jan Aushadhi Generic Savings:\n• Lifelong medications like Metformin 500mg and Telmisartan 40mg cost up to 80% less at PM Jan Aushadhi Kendras (₹9 to ₹36 per pack vs ₹200+ for brands).\n• Never stop anti-hypertensives abruptly. Screen your blood pressure monthly at your local government clinic.`,
      };

      const chronicConsultation: Record<Language, { assessment: string; homeCare: string; medicineGuidance: string; warningSigns: string }> = {
        hi: {
          assessment: 'टाइप-2 डायबिटीज मेलिटस / आवश्यक उच्च रक्तचाप (हाइपरटेंशन)।',
          homeCare: 'नियमित 30 मिनट तेज सैर, कम नमक, कम चीनी, नियमित पैरों की जांच।',
          medicineGuidance: 'मेटफॉर्मिन व टेलमिसार्टन जन औषधि से लें (80% बचत)। डॉक्टर के बिना खुराक न बदलें।',
          warningSigns: 'अचानक चक्कर आना, हाथ-पैरों में सुन्नपन, नजर कमजोर होना, सीने में भारीपन।',
        },
        ta: {
          assessment: 'டைப்-2 நீரிழிவு / உயர் ரத்த அழுத்தம் (BP) கண்காணிப்பு.',
          homeCare: 'தினசரி 30 நிமிடம் நடைப்பயிற்சி, குறைந்த உப்பு, கால்களை சுத்தமாக பராமரித்தல்.',
          medicineGuidance: 'ஜன் ஔஷதி மையத்தில் மெட்ஃபார்மின் & டெல்மிசார்ட்டன் பெறவும் (80% சேமிப்பு).',
          warningSigns: 'மயக்கம், கால்களில் உணர்வின்மை, பார்வை மங்குதல், நெஞ்சு வலி.',
        },
        te: {
          assessment: 'మధుమేహం / రక్తపోటు నియంత్రణ.',
          homeCare: 'రోజూ 30 నిమిషాల వాకింగ్, తక్కువ ఉప్పు, పాదాల సంరక్షణ.',
          medicineGuidance: 'జన్ ఔషధిలో తక్కువ ధరకు మెట్‌ఫార్మిన్ మరియు టెల్మిసార్టన్ తీసుకోండి.',
          warningSigns: 'కళ్ళు తిరగడం, తిమ్మిర్లు, చూపు మందగించడం.',
        },
        kn: {
          assessment: 'ಮಧುಮೇಹ ಮತ್ತು ಅಧಿಕ ರಕ್ತದೊತ್ತಡ.',
          homeCare: 'ದಿನನಿತ್ಯ ನಡಿಗೆ, ಕಡಿಮೆ ಉಪ್ಪು, ಪಾದಗಳ ಸ್ವಚ್ಛತೆ.',
          medicineGuidance: 'ಜನೌಷಧಿ ಕೇಂದ್ರದಲ್ಲಿ ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಔಷಧಿ ಪಡೆಯಿರಿ.',
          warningSigns: 'ತಲೆಸುತ್ತು, ಎದೆ ಭಾರ, ಕಣ್ಣು ಮಸುಕಾಗುವುದು.',
        },
        ml: {
          assessment: 'പ്രമേഹം / രക്തസമ്മർദ്ദം.',
          homeCare: 'വ്യായാമം, ഉപ്പ് കുറയ്ക്കുക, പാദ സംരക്ഷണം.',
          medicineGuidance: 'ജൻ ഔഷധി വഴി കുറഞ്ഞ നിരക്കിൽ മരുന്നുകൾ വാങ്ങുക.',
          warningSigns: 'തലകറക്കം, കാഴ്ച മങ്ങൽ, നെഞ്ചുവേദന.',
        },
        bn: {
          assessment: 'ডায়াবেটিস ও উচ্চ রক্তচাপ ব্যবস্থাপনা।',
          homeCare: 'নিয়মিত হাঁটা, নুন নিয়ন্ত্রণ, পায়ের যত্ন।',
          medicineGuidance: 'জন ঔষধি থেকে জেনেরিক ওষুধ নিন (৮০% সাশ্রয়)।',
          warningSigns: 'মাথা ঘোরা, দৃষ্টি ঝাপসা হওয়া, বুকে ব্যথা।',
        },
        mr: {
          assessment: 'मधुमेह आणि उच्च रक्तदाब व्यवस्थापन.',
          homeCare: 'दररोज चालणे, कमी मीठ, पायांची काळजी.',
          medicineGuidance: 'जन औषधी केंद्रातून औषधे घ्या (८०% बचत).',
          warningSigns: 'चक्कर येणे, अंधुक दिसणे, छातीत अस्वस्थता.',
        },
        gu: {
          assessment: 'ડાયાબિટીસ અને હાઈ બ્લડ પ્રેશર.',
          homeCare: 'રોજ ચાલવું, ઓછું મીઠું, પગની સંભાળ.',
          medicineGuidance: 'જન ઔષધિ કેન્દ્રમાંથી દવાઓ લો (૮૦% બચત).',
          warningSigns: 'ચક્કર આવવા, દ્રષ્ટિ ઝાંખી થવી.',
        },
        en: {
          assessment: 'Type 2 Diabetes Mellitus / Essential Hypertension Follow-Up.',
          homeCare: '30-minute daily walk, low sodium, foot inspection, hydration.',
          medicineGuidance: 'Metformin and Telmisartan via Jan Aushadhi (80% savings). Never skip doses.',
          warningSigns: 'Sudden dizziness, limb numbness, vision blurriness, chest tightness.',
        },
      };

      return {
        reply: chronicReplies[lang] || chronicReplies.en,
        emergency: false,
        sources: ['National Programme for Prevention and Control of Cancer, Diabetes, CVD and Stroke (NPCDCS)', 'ICMR Guidelines'],
        doctorConsultation: chronicConsultation[lang] || chronicConsultation.en,
        recommendedHospital: match?.hospital,
        recommendedDepartment: match?.department || 'NCD Chronic Disease & Diabetes Clinic',
        recommendedReason: match?.matchReason || 'Provides free monthly hypertension/sugar screening and Jan Aushadhi dispensary.',
      };
    }

    // ==========================================
    // 5. DEFAULT: GENERAL MEDICINE & CLINICAL TRIAGE
    // ==========================================
    const generalReplies: Record<Language, string> = {
      hi: `👨‍⚕️ नमस्ते, मैं डॉ. सहाय बोल रहा हूँ — आपका वर्चुअल ग्रामीण स्वास्थ्य चिकित्सक।\nमैंने आपके लक्षणों को समझ लिया है।\n\nडॉक्टर की प्राथमिक सलाह:\n• भरपूर आराम करें और पर्याप्त पानी पिएं।\n• किसी भी लक्षण में खुद से भारी दवाइयां या बिना डॉक्टर की पर्ची के एंटीबायोटिक न लें।\n• सस्ती व प्रमाणित जेनेरिक दवाओं के लिए हमारे मेडिसिन टैब में जन औषधि विकल्प देखें।\n\nयदि लक्षण 2 दिन से अधिक बने रहें, तो नजदीकी सरकारी स्वास्थ्य केंद्र पर डॉक्टर से परामर्श अवश्य लें।`,
      ta: `👨‍⚕️ வணக்கம், நான் டாக்டர் சஹாய் பேசுகிறேன் — உங்கள் கிராமப்புற சுகாதார மருத்துவர்.\nஉங்கள் உடல்நல அறிகுறிகளை புரிந்து கொண்டேன்.\n\nமருத்துவரின் எளிய வழிகாட்டல்:\n• போதுமான ஓய்வு மற்றும் நீர்ச்சத்து எடுத்துக்கொள்ளுங்கள்.\n• கடைகளில் சுயமாக வலி மாத்திரைகளையோ அல்லது ஆன்டிபயாடிக்குகளையோ வாங்க வேண்டாம்.\n• குறைந்த விலையில் ஜெனரிக் மருந்துகளைப் பெற எங்களின் மருந்துகள் பகுதியை பயன்படுத்தவும்.\n\nஅறிகுறிகள் தொடர்ந்தால் அருகிலுள்ள ஆரம்ப சுகாதார நிலைய மருத்துவரை அணுகவும்.`,
      te: `👨‍⚕️ నమస్తే, నేను డాక్టర్ సహాయ్ ని — మీ వర్చువల్ ఆరోగ్య వైద్యుడిని.\nమీ సమస్యను అర్థం చేసుకున్నాను.\n\nవైద్యుల సలహా:\n• తగినంత విశ్రాంతి తీసుకోండి మరియు నీరు ఎక్కువగా త్రాగండి.\n• సొంత వైద్యం చేసుకోకండి.\n• తక్కువ ధర మందుల కోసం జన్ ఔషధి విభాగాన్ని చూడండి.`,
      kn: `👨‍⚕️ ನಮಸ್ಕಾರ, ನಾನು ಡಾ. ಸಹಾಯ್ — ನಿಮ್ಮ ಆರೋಗ್ಯ ವೈದ್ಯ.\nನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಗಮನಿಸಿದ್ದೇನೆ.\n\nವೈದ್ಯಕೀಯ ಸಲಹೆ:\n• ಪೂರ್ಣ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ.\n• ವೈದ್ಯರ ಸಲಹೆಯಿಲ್ಲದೆ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.\n• ಕಡಿಮೆ ದರದ ಔಷಧಿಗಳಿಗಾಗಿ ಜನೌಷಧಿ ವಿಭಾಗವನ್ನು ವೀಕ್ಷಿಸಿ.`,
      ml: `👨‍⚕️ നമസ്കാരം, ഞാൻ ഡോ. സഹായ് ആണ്.\nനിങ്ങളുടെ പ്രശ്നം ഞാൻ മനസ്സിലാക്കുന്നു.\n\nഡോക്ടറുടെ നിർദ്ദേശം:\n• വിശ്രമം എടുക്കുക, ധാരാളം വെള്ളം കുടിക്കുക.\n• സ്വയം മരുന്നുകൾ കഴിക്കരുത്.\n• കുറഞ്ഞ നിരക്കിലുള്ള മരുന്നുകൾക്കായി ജൻ ഔഷധി പരിശോധിക്കുക.`,
      bn: `👨‍⚕️ নমস্কার, আমি ডা. সহায় — আপনার স্বাস্থ্য চিকিৎসক।\nআপনার লক্ষণগুলি বুঝতে পেরেছি।\n\nপরামর্শ:\n• পর্যাপ্ত বিশ্রাম ও জল গ্রহণ করুন।\n• নিজে নিজে কোনো ভারী ওষুধ খাবেন না।\n• সুলভ মূল্যের ওষুধের জন্য জন ঔষধি তালিকা দেখুন।`,
      mr: `👨‍⚕️ नमस्कार, मी डॉ. सहाय बोलत आहे.\nआपली लक्षणे मी समजून घेतली आहेत.\n\nडॉक्टरांचा सल्ला:\n• पुरेशी विश्रांती घ्या आणि पाणी भरपूर प्या.\n• परस्पर औषधे घेऊ नका.\n• स्वस्त औषधांसाठी जन औषधी पर्याय तपासा.`,
      gu: `👨‍⚕️ નમસ્તે, હું ડૉ. સહાય છું — આપના સ્વાસ્થ્ય સાથી.\nતમારી સમસ્યા સમજી ગયો છું.\n\nડૉક્ટરની સલાહ:\n• પૂરતો આરામ કરો અને પાણી પીવો.\n• જાતે ભારે દવાઓ ન લેશો.\n• સસ્તી દવાઓ માટે જન ઔષધિ વિકલ્પો તપાસો.`,
      en: `👨‍⚕️ Hello, I am Dr. Sahay — your virtual rural health physician.\nI have noted your clinical symptoms carefully.\n\nDoctor's Primary Health Guidance:\n• Rest adequately and ensure sound fluid intake.\n• Never purchase over-the-counter antibiotics or heavy painkillers without clinical evaluation.\n• Review generic equivalents in our Medicines section to save 50-80% at PM Jan Aushadhi Kendras.\n\nIf symptoms persist beyond 48 hours, visit your nearest Primary Health Centre (PHC) for an in-person physical examination.`,
    };

    const generalConsultation: Record<Language, { assessment: string; homeCare: string; medicineGuidance: string; warningSigns: string }> = {
      hi: {
        assessment: 'प्राथमिक स्वास्थ्य मूल्यांकन एवं सामान्य चिकित्सा परामर्श।',
        homeCare: 'पर्याप्त आराम, गुनगुना पानी, सुपाच्य पौष्टिक भोजन।',
        medicineGuidance: 'आवश्यकता होने पर प्राथमिक दवाएं सरकारी जन औषधि केंद्र से लें।',
        warningSigns: 'तेज दर्द, अत्यधिक कमजोरी, तेज बुखार या सांस लेने में परेशानी।',
      },
      ta: {
        assessment: 'ஆரம்ப சுகாதார மதிப்பீடு மற்றும் மருத்துவ வழிகாட்டல்.',
        homeCare: 'போதிய ஓய்வு, காய்ச்சிய நீர், எளிய சத்தான உணவு.',
        medicineGuidance: 'அரசு ஜன் ஔஷதி மையத்தில் தரமான ஜெனரிக் மருந்துகளைப் பெறலாம்.',
        warningSigns: 'கடுமையான வலி, அதிக சோர்வு, மூச்சுத்திணறல்.',
      },
      te: {
        assessment: 'ప్రాథమిక ఆరోగ్య పరిశీలన.',
        homeCare: 'విశ్రాంతి, కాచిన నీరు, బలవర్ధక ఆహారం.',
        medicineGuidance: 'జన్ ఔషధి ద్వారా తక్కువ ధర మందులు.',
        warningSigns: 'తీవ్రమైన నొప్పి, ఆయాసం.',
      },
      kn: {
        assessment: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ತಪಾಸಣೆ.',
        homeCare: 'ವಿಶ್ರಾಂತಿ, ಕುದಿಸಿದ ನೀರು, ಪೌಷ್ಟಿಕ ಆಹಾರ.',
        medicineGuidance: 'ಜನೌಷಧಿ ಕೇಂದ್ರದ ಔಷಧಿಗಳು.',
        warningSigns: 'ತೀವ್ರ ನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ.',
      },
      ml: {
        assessment: 'പ്രാഥമിക ആരോഗ്യ പരിശോധന.',
        homeCare: 'വിശ്രമം, ചൂടുവെള്ളം, ലഘുഭക്ഷണം.',
        medicineGuidance: 'ജൻ ഔഷധി മരുന്നുകൾ തിരഞ്ഞെടുക്കുക.',
        warningSigns: 'കഠിനമായ വേദന, ശ്വാസതടസ്സം.',
      },
      bn: {
        assessment: 'প্রাথমিক স্বাস্থ্য মূল্যায়ন।',
        homeCare: 'বিশ্রাম, ফুটানো জল, পুষ্টিকর খাবার।',
        medicineGuidance: 'জন ঔষধি কেন্দ্রের সুলভ ওষুধ।',
        warningSigns: 'তীব্র যন্ত্রণা, শ্বাসকষ্ট।',
      },
      mr: {
        assessment: 'प्राथमिक आरोग्य तपासणी.',
        homeCare: 'विश्रांती, कोमट पाणी, पौष्टिक आहार.',
        medicineGuidance: 'जन औषधी केंद्रातील स्वस्त औषधे.',
        warningSigns: 'तीव्र वेदना, धाप लागणे.',
      },
      gu: {
        assessment: 'પ્રાથમિક આરોગ્ય સલાહ.',
        homeCare: 'આરામ, ઉકાળેલું પાણી, પૌષ્ટિક આહાર.',
        medicineGuidance: 'જન ઔષધિ કેન્દ્રની દવાઓ.',
        warningSigns: 'તીવ્ર દુખાવો, શ્વાસની તકલીફ.',
      },
      en: {
        assessment: 'Primary Healthcare Evaluation and Clinical Triage.',
        homeCare: 'Adequate rest, lukewarm water hydration, balanced soft nutrition.',
        medicineGuidance: 'Avail verified generic salts from PM Jan Aushadhi Kendras.',
        warningSigns: 'Acute agonizing pain, sudden weakness, persistent fever, breathlessness.',
      },
    };

    return {
      reply: generalReplies[lang] || generalReplies.en,
      emergency: false,
      sources: ['National Health Portal (NHP India)', 'Ministry of Health & Family Welfare (MoHFW)'],
      doctorConsultation: generalConsultation[lang] || generalConsultation.en,
      recommendedHospital: match?.hospital,
      recommendedDepartment: match?.department || 'General Outpatient OPD',
      recommendedReason: match?.matchReason || 'Nearest verified government healthcare facility with doctors and free medicines.',
    };
  },
};
