import { Medicine } from '../types';

export const DEMO_MEDICINES: Medicine[] = [
  // 1. Calpol 650 (Paracetamol)
  {
    id: 'med-1',
    brandName: 'Calpol 650 Tablet',
    genericSalts: 'Paracetamol IP',
    strength: '650 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    mrpPrice: 33.5,
    pricePerUnit: 2.23,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Paracetamol 650mg',
      price: 10.0,
      pricePerUnit: 0.67,
      packSize: 'Strip of 15 tablets',
      savingsPercent: 70,
      storeAvailability: 'Available at all Jan Aushadhi Kendras & PHCs',
      salts: 'Paracetamol 650mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Do not exceed 4,000 mg of Paracetamol daily. Avoid concurrent alcohol intake. Consult doctor if fever persists > 3 days.',
    verifiedDate: '2026-09-01',
    uses: {
      en: 'Relief of fever, body pain, headache, and post-vaccination discomfort.',
      hi: 'बुखार, सिरदर्द, बदन दर्द और मांसपेशियों के दर्द से राहत के लिए।',
      ta: 'காய்ச்சல், தலைவலி, உடல் சோர்வு மற்றும் தடுப்பூசிக்குப் பிந்தைய உடல் வலி நிவாரணம்.',
      te: 'తీవ్ర జ్వరం, తలనొప్పి, ఒంటి నొప్పులు మరియు అలసట నివారణకు.',
      kn: 'ಜ್ವರ, ತಲೆನೋವು, ಮೈಕೈ ನೋವು ಮತ್ತು ಮೈ ಆಯಾಸ ನಿವಾರಣೆಗೆ.',
      ml: 'പനി, തലവേദന, ശരീരവേദന എന്നിവയ്ക്ക് ആശ്വാസം നൽകുന്നു.',
      bn: 'জ্বর, মাথা ব্যথা, গায়ে ব্যথা ও ক্লান্তির উপশমে ব্যবহৃত হয়।',
      mr: 'ताप, डोकेदुखी, अंगदुखी आणि स्नायूंच्या वेदनांपासून मुक्तीसाठी.',
      gu: 'તાવ, માથાનો દુખાવો, બદન દર્દ અને થાકમાંથી રાહત માટે.',
    },
  },

  // 2. Glycomet 500 (Metformin)
  {
    id: 'med-2',
    brandName: 'Glycomet 500 Tablet',
    genericSalts: 'Metformin Hydrochloride',
    strength: '500 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 20 tablets',
    manufacturer: 'USV Pvt Ltd',
    mrpPrice: 48.0,
    pricePerUnit: 2.4,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Metformin 500mg',
      price: 9.5,
      pricePerUnit: 0.48,
      packSize: 'Strip of 20 tablets',
      savingsPercent: 80,
      storeAvailability: 'Available at Taluk Hospitals & Jan Aushadhi Kendras',
      salts: 'Metformin Hydrochloride 500mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Prescription-only medicine. Must be taken with or immediately after meals to reduce stomach upset. Regularly monitor HbA1c blood sugar.',
    verifiedDate: '2026-09-01',
    uses: {
      en: 'Management of type 2 diabetes mellitus to regulate blood glucose levels.',
      hi: 'टाइप 2 डायबिटीज में ब्लड शुगर के स्तर को नियंत्रित करने के लिए।',
      ta: 'டைப் 2 நீரிழிவு (சர்க்கரை நோய்) நோயாளிகளில் ரத்த சர்க்கரை அளவைக் கட்டுப்படுத்த.',
      te: 'టైప్ 2 మధుమేహం (షుగర్) నియంత్రణకు మరియు రక్తంలో గ్లూకోజ్ సమతుల్యతకు.',
      kn: 'ಟೈಪ್ 2 ಮಧುಮೇಹದಲ್ಲಿ ರಕ್ತದ ಸಕ್ಕರೆ ಮಟ್ಟವನ್ನು ನಿಯಂತ್ರಿಸಲು.',
      ml: 'ടൈപ്പ് 2 പ്രമേഹ രോഗികളിൽ രക്തത്തിലെ പഞ്ചസാരയുടെ അളവ് നിയന്ത്രിക്കുന്നു.',
      bn: 'টাইপ ২ ডায়াবেটিসে রক্তে শর্করার মাত্রা নিয়ন্ত্রণে ব্যবহৃত হয়।',
      mr: 'टाइप २ मधुमेहामध्ये रक्तातील साखरेचे प्रमाण नियंत्रित करण्यासाठी.',
      gu: 'ટાઈપ ૨ ડાયાબિટીસમાં બ્લડ સુગરને નિયંત્રિત રાખવા માટે.',
    },
  },

  // 3. Telma 40 (Telmisartan)
  {
    id: 'med-3',
    brandName: 'Telma 40 Tablet',
    genericSalts: 'Telmisartan IP',
    strength: '40 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 30 tablets',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    mrpPrice: 245.0,
    pricePerUnit: 8.17,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Telmisartan 40mg',
      price: 36.0,
      pricePerUnit: 1.2,
      packSize: 'Strip of 30 tablets',
      savingsPercent: 85,
      storeAvailability: 'Available at Jan Aushadhi Kendras & NCD Govt Clinics',
      salts: 'Telmisartan 40mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Prescription medicine for high blood pressure. Do NOT stop abruptly without physician advice. Check blood pressure regularly.',
    verifiedDate: '2026-09-05',
    uses: {
      en: 'Treatment of hypertension (high blood pressure) and prevention of cardiovascular events.',
      hi: 'उच्च रक्तचाप (हाई बीपी) को नियंत्रित करने और हृदय स्वास्थ्य की रक्षा के लिए।',
      ta: 'உயர் ரத்த அழுத்தம் (BP) மற்றும் இதய நோய்கள் தடுப்புக்கான நீண்டகால சிகிச்சை.',
      te: 'అధిక రక్తపోటు (హై బీపీ) నియంత్రణ మరియు గుండె జబ్బుల నివారణకు.',
      kn: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ (ಬಿಪಿ) ನಿಯಂತ್ರಣ ಮತ್ತು ಹೃದಯದ ರಕ್ಷಣೆಗೆ.',
      ml: 'ഉയർന്ന രക്തസമ്മർദ്ദം (ബിപി) നിയന്ത്രിക്കാനും ഹൃദയാഘാത സാധ്യത കുറയ്ക്കാനും.',
      bn: 'উচ্চ রক্তচাপ নিয়ন্ত্রণ এবং হৃদরোগ প্রতিরোধে দীর্ঘমেয়াদী চিকিৎসা।',
      mr: 'उच्च रक्तदाब (हाय बीपी) नियंत्रित करण्यासाठी व हृदयरोगाचा धोका टाळण्यासाठी.',
      gu: 'હાઈ બ્લડ પ્રેશર (બીપી) નિયંત્રિત કરવા અને હૃદયની સુરક્ષા માટે.',
    },
  },

  // 4. Pan-D Capsule (Pantoprazole + Domperidone)
  {
    id: 'med-4',
    brandName: 'Pan-D Capsule',
    genericSalts: 'Pantoprazole + Domperidone',
    strength: '40 mg + 30 mg',
    dosageForm: 'Sustained Release Capsule',
    packSize: 'Strip of 15 capsules',
    manufacturer: 'Alkem Laboratories Ltd',
    mrpPrice: 215.0,
    pricePerUnit: 14.33,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Pantoprazole & Domperidone SR',
      price: 38.0,
      pricePerUnit: 2.53,
      packSize: 'Strip of 15 capsules',
      savingsPercent: 82,
      storeAvailability: 'Available at District Jan Aushadhi Stores',
      salts: 'Pantoprazole Sodium 40mg + Domperidone SR 30mg',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Take 30 to 60 minutes before morning breakfast with plain water. Do not crush or chew capsule.',
    verifiedDate: '2026-09-10',
    uses: {
      en: 'Treatment of acid reflux (GERD), severe heartburn, gas bloating, and acidity-related nausea.',
      hi: 'एसिडिटी, सीने में जलन, गैस, पेट फूलना और उल्टी-मिचली से राहत के लिए।',
      ta: 'வயிற்றுப்புண், நெஞ்செரிச்சல், வாந்தி உணர்வு மற்றும் அசிடிட்டி தீவிர குறைப்பு.',
      te: 'ఎసిడిటీ, గుండెల్లో మంట, గ్యాస్ మరియు వాంతుల నివారణకు.',
      kn: 'ಅಸಿಡಿಟಿ, ಎದೆಯುರಿ, ಗ್ಯಾಸ್ಟ್ರಿಕ್ ಮತ್ತು ವಾಂತಿ ಸಮಸ್ಯೆಗೆ.',
      ml: 'അസിഡിറ്റി, നെഞ്ചെരിച്ചിൽ, ഗ്യാസ്, ഛർദ്ദി എന്നിവയ്ക്ക് പരിഹാരം.',
      bn: 'এসিডিটি, বুকজ্বালা, গ্যাস ও বমি ভাব কমাতে কার্যকর।',
      mr: 'अॅसिडिटी, छातीत जळजळ, पोट फुगणे व मळमळ दूर करण्यासाठी.',
      gu: 'એસિડિટી, છાતીમાં બળતરા, ગેસ અને ઉલટીના ઉપચાર માટે.',
    },
  },

  // 5. Augmentin 625 Duo (Amoxicillin + Clavulanic Acid)
  {
    id: 'med-5',
    brandName: 'Augmentin 625 Duo Tablet',
    genericSalts: 'Amoxicillin + Clavulanic Acid',
    strength: '500 mg + 125 mg',
    dosageForm: 'Film-coated Tablet',
    packSize: 'Strip of 10 tablets',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    mrpPrice: 204.0,
    pricePerUnit: 20.4,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Amoxycillin & Pot. Clavulanate 625mg',
      price: 55.0,
      pricePerUnit: 5.5,
      packSize: 'Strip of 10 tablets',
      savingsPercent: 73,
      storeAvailability: 'Available at Taluk & District Hospital Jan Aushadhi Outlets',
      salts: 'Amoxycillin Trihydrate 500mg + Potassium Clavulanate 125mg',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Strict Schedule H1 antibiotic. Complete full prescribed course even if symptoms improve to prevent bacterial resistance.',
    verifiedDate: '2026-09-12',
    uses: {
      en: 'Broad-spectrum antibiotic for bacterial lung infections, throat tonsillitis, ear infections, and skin infections.',
      hi: 'फेफड़ों के संक्रमण, निमोनिया, गले की खराश, कान दर्द व बैक्टीरियल इन्फेक्शन के लिए एंटीबायोटिक।',
      ta: 'நுரையீரல் தொற்று, சளி-இருமல் பாக்டீரியா தொற்று மற்றும் தொண்டை புண் சிகிச்சைக்கான ஆண்டிபயாடிக்.',
      te: 'ఊపిరితిత్తుల ఇన్ఫెక్షన్, గొంతు నొప్పి, చెవి ఇన్ఫెక్షన్ నివారణకు యాంటీబయాటిక్.',
      kn: 'ಶ್ವಾಸಕೋಶದ ಸೋಂಕು, ಗಂಟಲು ನೋವು ಮತ್ತು ಬ್ಯಾಕ್ಟೀರಿಯಾ ಸೋಂಕಿಗೆ ಆ್ಯಂಟಿಬಯೋಟಿಕ್.',
      ml: 'ശ്വാസകോശ അണുബാധ, തൊണ്ടവേദന, ബാക്ടീരിയൽ അണുബാധ എന്നിവയ്ക്കുള്ള ആന്റിബയോട്ടിക്.',
      bn: 'ফুসফুসের সংক্রমণ, নিউমোনিয়া, গলা ব্যথা ও ব্যাকটেরিয়াল ইনফেকশনের অ্যান্টিবায়োটিক।',
      mr: 'फुफ्फुसांचा संसर्ग, घशाचा त्रास, कान दुखणे व जिवाणू संसर्गावरील अँटीबायोटिक.',
      gu: 'ફેફસાંનો ચેપ, ગળાની ખરાશ અને બેક્ટેરિયલ ઇન્ફેક્શન માટે એન્ટિબાયોટિક.',
    },
  },

  // 6. Cetzine 10 (Cetirizine Hydrochloride)
  {
    id: 'med-6',
    brandName: 'Cetzine 10 Tablet',
    genericSalts: 'Cetirizine Hydrochloride IP',
    strength: '10 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 10 tablets',
    manufacturer: 'Dr. Reddy\'s Laboratories',
    mrpPrice: 22.0,
    pricePerUnit: 2.2,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Cetirizine 10mg',
      price: 4.5,
      pricePerUnit: 0.45,
      packSize: 'Strip of 10 tablets',
      savingsPercent: 80,
      storeAvailability: 'Available at all Jan Aushadhi stores & PHCs',
      salts: 'Cetirizine Hydrochloride 10mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'May cause mild drowsiness. Avoid driving or operating machinery after consumption. Take once daily preferably at night.',
    verifiedDate: '2026-09-15',
    uses: {
      en: 'Treatment of allergic rhinitis, sneezing, watery eyes, runny nose, and itchy skin hives.',
      hi: 'एलर्जी, छींक आना, बहती नाक, आंखों से पानी आना और त्वचा में खुजली से राहत के लिए।',
      ta: 'ஒவ்வாமை, தும்மல், மூக்கில் நீர் வடிதல் மற்றும் சரும அரிப்பு நீக்கும் மாத்திரை.',
      te: 'అలెర్జీ, తుమ్ములు, కారుతున్న ముక్కు మరియు చర్మం దురద నివారణకు.',
      kn: 'ಅಲರ್ಜಿ, ಸೀನು, ಮೂಗು ಸೋರುವುದು ಮತ್ತು ತುರಿಕೆಗೆ ಪರಿಹಾರ.',
      ml: 'അലർജി, തുമ്മൽ, ജലദോഷം, ചൊറിച്ചിൽ എന്നിവയ്ക്ക് ആശ്വാസം നൽകുന്നു.',
      bn: 'অ্যালার্জি, হাঁচি, নাক দিয়ে জল পড়া এবং চুলকানি নিরাময়ে ব্যবহৃত হয়।',
      mr: 'अॅलर्जी, शिंका, वाहणारे नाक व त्वचेवरील खाज थांबवण्यासाठी.',
      gu: 'એલર્જી, છીંક, શરદી અને ચામડીની ખંજવાળના ઉપચાર માટે.',
    },
  },

  // 7. Amlong 5 (Amlodipine)
  {
    id: 'med-7',
    brandName: 'Amlong 5 Tablet',
    genericSalts: 'Amlodipine Besylate',
    strength: '5 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'Micro Labs Ltd',
    mrpPrice: 42.0,
    pricePerUnit: 2.8,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Amlodipine 5mg',
      price: 6.0,
      pricePerUnit: 0.4,
      packSize: 'Strip of 15 tablets',
      savingsPercent: 86,
      storeAvailability: 'Available at Taluk Hospitals & Jan Aushadhi Stores',
      salts: 'Amlodipine Besylate 5mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Calcium channel blocker for hypertension. Do not skip doses. Report ankle swelling to your physician.',
    verifiedDate: '2026-09-18',
    uses: {
      en: 'Treatment of high blood pressure (hypertension) and chest pain (angina).',
      hi: 'हाई ब्लड प्रेशर को कम करने और सीने में दर्द (एंजाइना) की रोकथाम के लिए।',
      ta: 'உயர் ரத்த அழுத்தத்தைக் குறைக்கவும் இதய தமனி சுருக்கத்தை சீராக்கவும்.',
      te: 'అధిక రక్తపోటు తగ్గింపు మరియు ఛాతీ నొప్పి నివారణకు.',
      kn: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ ತಗ್ಗಿಸಲು ಮತ್ತು ಎದೆ ನೋವು ತಡೆಗಟ್ಟಲು.',
      ml: 'ഉയർന്ന രക്തസമ്മർദ്ദം കുറയ്ക്കാനും ഹൃദയ സംരക്ഷണത്തിനും.',
      bn: 'উচ্চ রক্তচাপ নিয়ন্ত্রণ ও বুকের ব্যথা নিরাময়ে কার্যকর।',
      mr: 'उच्च रक्तदाब नियंत्रित ठेवण्यासाठी आणि छातीत दुखणे थांबवण्यासाठी.',
      gu: 'હાઈ બ્લડ પ્રેશર ઘટાડવા અને છાતીના દુખાવામાં રાહત માટે.',
    },
  },

  // 8. Azithral 500 (Azithromycin)
  {
    id: 'med-8',
    brandName: 'Azithral 500 Tablet',
    genericSalts: 'Azithromycin IP',
    strength: '500 mg',
    dosageForm: 'Film-coated Tablet',
    packSize: 'Strip of 5 tablets',
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    mrpPrice: 132.0,
    pricePerUnit: 26.4,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Azithromycin 500mg',
      price: 38.0,
      pricePerUnit: 7.6,
      packSize: 'Strip of 5 tablets',
      savingsPercent: 71,
      storeAvailability: 'Available at all Jan Aushadhi Outlets',
      salts: 'Azithromycin Dihydrate 500mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Take 1 hour before or 2 hours after meals once daily. Complete 3 to 5 day course as advised.',
    verifiedDate: '2026-09-20',
    uses: {
      en: 'Antibiotic for bacterial infections of throat, tonsils, sinuses, chest bronchitis, and typhoid.',
      hi: 'गले के इन्फेक्शन, टॉन्सिल, साइनस, छाती के कफ और टाइफाइड के लिए असरदार एंटीबायोटिक।',
      ta: 'தொண்டை வலி, டான்சில் வீக்கம், சளி மற்றும் டைபாய்டு காய்ச்சலுக்கான ஆண்டிபயாடிக்.',
      te: 'గొంతు ఇన్ఫెక్షన్, టాన్సిల్స్ మరియు శ్వాసకోశ ఇన్ఫెక్షన్ల నివారణకు.',
      kn: 'ಗಂಟಲು ಸೋಂಕು, ಟಾನ್ಸಿಲ್ಸ್ ಮತ್ತು ಟೈಫಾಯಿಡ್ ಜ್ವರಕ್ಕೆ ಆ್ಯಂಟಿಬಯೋಟಿಕ್.',
      ml: 'തൊണ്ടയിലെ അണുബാധ, ടോൺസിലൈറ്റിസ്, ശ്വാസകോശ അണുബാധ എന്നിവയ്ക്ക്.',
      bn: 'গলার সংক্রমণ, টনসিল ও টাইফয়েড নিরাময়ে কার্যকরী অ্যান্টিবায়োটিক।',
      mr: 'घशाचा संसर्ग, टॉन्सिल्स, छातीतील कफ व टायफॉइडवर गुणकारी औषध.',
      gu: 'ગળાનો ચેપ, ટોન્સિલ અને શ્વસનતંત્રના રોગો માટે એન્ટિબાયોટિક.',
    },
  },

  // 9. Shelcal 500 (Calcium + Vitamin D3)
  {
    id: 'med-9',
    brandName: 'Shelcal 500 Tablet',
    genericSalts: 'Calcium + Vitamin D3',
    strength: '500 mg + 250 IU',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'Torrent Pharmaceuticals Ltd',
    mrpPrice: 144.0,
    pricePerUnit: 9.6,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Calcium 500mg + Vit D3',
      price: 24.0,
      pricePerUnit: 1.6,
      packSize: 'Strip of 15 tablets',
      savingsPercent: 83,
      storeAvailability: 'Available at all Jan Aushadhi Kendras',
      salts: 'Elemental Calcium 500mg + Cholecalciferol 250 IU',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Take after meals with water. Helpful for pregnant women, elderly patients with osteoporosis, and joint pain.',
    verifiedDate: '2026-09-22',
    uses: {
      en: 'Treatment of calcium deficiency, osteoporosis, bone strengthening, and joint weakness in elderly.',
      hi: 'कैल्शियम की कमी, कमजोर हड्डियों (ऑस्टियोपोरोसिस), जोड़ों के दर्द और बुजुर्गों के लिए।',
      ta: 'எலும்பு பலவீனம், மூட்டு தேய்மானம், மூத்த குடிமக்களுக்கான கால்சியம் சத்து மருந்து.',
      te: 'ఎముకల బలం, కీళ్ల నొప్పులు మరియు కాల్షియం లోపం నివారణకు.',
      kn: 'ಮೂಳೆಗಳ ದೃಢತೆ, ಕೀಲು ನೋವು ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂ ಕೊರತೆಗೆ ಪೂರಕ ಔಷಧ.',
      ml: 'അസ്ഥി ബലഹീനത, സന്ധി വേദന, കാൽസ്യം കുറവ് എന്നിവയ്ക്ക്.',
      bn: 'হাড় মজবুত করতে, গাঁটের ব্যথা ও ক্যালসিয়ামের ঘাটতি পূরণে ব্যবহৃত হয়।',
      mr: 'हाडांची मजबुती, सांधेदुखी आणि कॅल्शियमच्या कमतरतेवर उपयुक्त.',
      gu: 'હાડકાંની મજબૂતી, સાંધાનો દુખાવો અને કેલ્શિયમની ખામી માટે.',
    },
  },

  // 10. Combiflam (Ibuprofen + Paracetamol)
  {
    id: 'med-10',
    brandName: 'Combiflam Tablet',
    genericSalts: 'Ibuprofen + Paracetamol',
    strength: '400 mg + 325 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 20 tablets',
    manufacturer: 'Sanofi India Ltd',
    mrpPrice: 52.0,
    pricePerUnit: 2.6,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Ibuprofen & Paracetamol',
      price: 12.0,
      pricePerUnit: 0.6,
      packSize: 'Strip of 20 tablets',
      savingsPercent: 77,
      storeAvailability: 'Available at all Jan Aushadhi Kendras & Taluk Hospitals',
      salts: 'Ibuprofen 400mg + Paracetamol 325mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Take strictly after meals with water to avoid gastric irritation. Do not take on an empty stomach.',
    verifiedDate: '2026-09-25',
    uses: {
      en: 'Relief of acute muscle pain, toothache, joint inflammation, sprains, and period pain.',
      hi: 'दांत दर्द, मांसपेशियों में खिंचाव, जोड़ों में सूजन, मोच और तेज बदन दर्द से त्वरित राहत।',
      ta: 'பல் வலி, சுளுக்கு, கடுமையான தசை வலி மற்றும் மூட்டு வீக்கம் குறைக்கும் வலி மாத்திரை.',
      te: 'దంతాల నొప్పి, కండరాల నొప్పులు, బెణుకులు మరియు తీవ్ర ఒంటి నొప్పులకు.',
      kn: 'ಹಲ್ಲು ನೋವು, ಸ್ನಾಯು ಸೆಳೆತ, ಮಂಡಿ ಊತ ಮತ್ತು ತೀವ್ರ ನೋವು ನಿವಾರಕ.',
      ml: 'പല്ലുവേദന, പേശി വേദന, ഉളുക്ക്, സന്ധി വീക്കം എന്നിവയ്ക്ക് ഉത്തമം.',
      bn: 'দাঁতের ব্যথা, মাংসপেশির ব্যথা, মচকে যাওয়া ও তীব্র শারীরিক ব্যথায় দ্রুত উপশম।',
      mr: 'दातदुखी, स्नायूंचे दुखणे, सूज व तीव्र अंगदुखीवर गुणकारी पेनकिलर.',
      gu: 'દાંતનો દુખાવો, સ્નાયુઓનો દુખાવો અને સાંધાના સોજામાં ઝડપી રાહત માટે.',
    },
  },

  // 11. Atorva 10 (Atorvastatin)
  {
    id: 'med-11',
    brandName: 'Atorva 10 Tablet',
    genericSalts: 'Atorvastatin IP',
    strength: '10 mg',
    dosageForm: 'Oral Tablet',
    packSize: 'Strip of 15 tablets',
    manufacturer: 'Zydus Cadila',
    mrpPrice: 112.0,
    pricePerUnit: 7.47,
    janAushadhiEquivalent: {
      brandName: 'Jan Aushadhi Atorvastatin 10mg',
      price: 18.0,
      pricePerUnit: 1.2,
      packSize: 'Strip of 15 tablets',
      savingsPercent: 84,
      storeAvailability: 'Available at all Jan Aushadhi Kendras',
      salts: 'Atorvastatin Calcium 10mg IP',
    },
    exactSaltMatch: true,
    safetyDisclaimer: 'Prescription cholesterol-lowering medication. Usually taken at bedtime. Report unexplained muscle aches or weakness to your doctor.',
    verifiedDate: '2026-09-14',
    uses: {
      en: 'Lowers bad LDL cholesterol and triglycerides, reducing stroke and heart attack risk.',
      hi: 'रक्त में खराब कोलेस्ट्रॉल को कम कर हार्ट अटैक और स्ट्रोक के खतरे से बचाने के लिए।',
      ta: 'ரத்தத்தில் கெட்ட கொழுப்பை (Cholesterol) குறைத்து இதய அடைப்பு வராமல் காக்கும் மருந்து.',
      te: 'చెడు కొలెస్ట్రాల్ తగ్గించి గుండెపోటు మరియు పక్షవాతం ప్రమాదాన్ని నివారిస్తుంది.',
      kn: 'ರಕ್ತದಲ್ಲಿ ಕೊಲೆಸ್ಟ್ರಾಲ್ ಕಡಿಮೆ ಮಾಡಿ ಹೃದಯಾಘಾತದ ಅಪಾಯವನ್ನು ತಡೆಯುತ್ತದೆ.',
      ml: 'കൊളസ്ട്രോൾ കുറയ്ക്കാനും ഹൃദയാഘാത സാധ്യത തടയാനും സഹായിക്കുന്നു.',
      bn: 'রক্তে কোলেস্টেরল কমিয়ে হার্ট অ্যাটাক ও স্ট্রোকের ঝুঁকি হ্রাস করে।',
      mr: 'रक्तातील कोलेस्ट्रॉल कमी करून हृदयविकाराचा झटका टाळण्यासाठी उपयुक्त.',
      gu: 'કોલેસ્ટ્રોલ ઘટાડીને હાર્ટ એટેક અને લકવાના જોખમથી રક્ષણ આપે છે.',
    },
  },
];

export const medicineService = {
  getAll(): Medicine[] {
    return DEMO_MEDICINES;
  },

  search(query: string): Medicine[] {
    if (!query || !query.trim()) return DEMO_MEDICINES;
    const q = query.toLowerCase().trim();
    return DEMO_MEDICINES.filter(
      (m) =>
        m.brandName.toLowerCase().includes(q) ||
        m.genericSalts.toLowerCase().includes(q) ||
        m.janAushadhiEquivalent.brandName.toLowerCase().includes(q) ||
        Object.values(m.uses).some((u) => u && u.toLowerCase().includes(q))
    );
  },

  getById(id: string): Medicine | undefined {
    return DEMO_MEDICINES.find((m) => m.id === id);
  },

  matchFromOcr(rawText: string): Medicine {
    const text = rawText.toLowerCase();

    for (const med of DEMO_MEDICINES) {
      const brandKey = med.brandName.toLowerCase().split(' ')[0];
      const saltKey = med.genericSalts.toLowerCase().split(' ')[0];

      if (text.includes(brandKey) || text.includes(saltKey)) {
        return med;
      }
    }

    // Secondary salt match checks
    if (text.includes('para') || text.includes('calpol') || text.includes('dolo') || text.includes('fever')) {
      return DEMO_MEDICINES[0]; // Calpol 650
    }
    if (text.includes('metfor') || text.includes('glyco') || text.includes('sugar') || text.includes('diabet')) {
      return DEMO_MEDICINES[1]; // Glycomet 500
    }
    if (text.includes('telma') || text.includes('telmi') || text.includes('bp') || text.includes('press')) {
      return DEMO_MEDICINES[2]; // Telma 40
    }
    if (text.includes('pan') || text.includes('panto') || text.includes('acid') || text.includes('gas')) {
      return DEMO_MEDICINES[3]; // Pan-D
    }
    if (text.includes('aug') || text.includes('amox') || text.includes('clavu') || text.includes('antibio')) {
      return DEMO_MEDICINES[4]; // Augmentin 625
    }
    if (text.includes('cet') || text.includes('aller') || text.includes('rhin')) {
      return DEMO_MEDICINES[5]; // Cetzine 10
    }
    if (text.includes('amlo') || text.includes('norvasc')) {
      return DEMO_MEDICINES[6]; // Amlong 5
    }
    if (text.includes('azi') || text.includes('throat')) {
      return DEMO_MEDICINES[7]; // Azithral 500
    }
    if (text.includes('calc') || text.includes('shel') || text.includes('bone') || text.includes('d3')) {
      return DEMO_MEDICINES[8]; // Shelcal 500
    }
    if (text.includes('combi') || text.includes('ibu') || text.includes('pain')) {
      return DEMO_MEDICINES[9]; // Combiflam
    }

    return DEMO_MEDICINES[0];
  },
};
