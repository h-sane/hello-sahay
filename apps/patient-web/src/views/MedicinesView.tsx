import React, { useState } from 'react';
import {
  Search,
  Pill,
  ShieldAlert,
  CheckCircle,
  TrendingDown,
  Camera,
  Layers,
  Sparkles,
  Info,
  X,
  ScanLine,
} from 'lucide-react';
import { Language, Medicine } from '../types';
import { t } from '../translations';
import { medicineService } from '../services/medicineService';
import { MedicineCameraScannerModal } from '../components/MedicineCameraScannerModal';

interface MedicinesViewProps {
  currentLang: Language;
}

export const MedicinesView: React.FC<MedicinesViewProps> = ({ currentLang }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);

  const medicines = medicineService.search(searchQuery);

  const bannerTexts: Record<
    Language,
    {
      scanTitle: string;
      scanSub: string;
      openCameraBtn: string;
      disclaimerSub: string;
      noMedTitle: string;
      noMedSub: string;
      scannedPrefix: string;
      saltPrefix: string;
      savePrefix: string;
      saveSuffix: string;
      savePercentText: string;
      perPack: string;
      lowerCost: string;
    }
  > = {
    hi: {
      scanTitle: 'दवा पत्ता (Strip) कैमरा से स्कैन करें',
      scanSub: 'कैमरा दवा के पत्ते पर रखें, AI नाम पढ़कर सस्ती सरकारी जन औषधि विकल्प बताएगा',
      openCameraBtn: 'कैमरा स्कैनर खोलें',
      disclaimerSub: 'सभी दवा परिवर्तन केवल पंजीकृत डॉक्टर या फार्मासिस्ट की सलाह के बाद ही किए जाने चाहिए।',
      noMedTitle: 'कोई दवा नहीं मिली',
      noMedSub: 'जेनेरिक साल्ट नाम से खोजें (उदा: पैरासिटामोल, मेटफॉर्मिन, पैंटोप्राजोल, टेलमिसार्टन)',
      scannedPrefix: 'कैमरे से पहचानी गई दवा:',
      saltPrefix: 'साल्ट:',
      savePrefix: 'जन औषधि पर ₹',
      saveSuffix: 'की बचत!',
      savePercentText: 'बचत',
      perPack: 'प्रति पत्ता',
      lowerCost: 'सस्ती',
    },
    ta: {
      scanTitle: 'மருந்து அட்டையை கேமரா மூலம் ஸ்கேன் செய்க',
      scanSub: 'கேமராவை மருந்து அட்டை மீது காட்டினால், AI பெயரை படித்து குறைந்த விலை ஜன் ஔஷதி மாத்திரையை காட்டும்',
      openCameraBtn: 'கேமராவை திறக்க',
      disclaimerSub: 'அனைத்து மருந்து மாற்றங்களும் அங்கீகரிக்கப்பட்ட மருத்துவர் அல்லது மருந்தாளுநரின் மேற்பார்வையில் மட்டுமே செய்யப்பட வேண்டும்.',
      noMedTitle: 'மருந்து எதுவும் கிடைக்கவில்லை',
      noMedSub: 'மூலப்பொருள் பெயரை தேடவும் (எ.கா: Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'கேமரா மூலம் கண்டறியப்பட்டது:',
      saltPrefix: 'மூலப்பொருள்:',
      savePrefix: 'ஜன் ஔஷதி மூலம் ₹',
      saveSuffix: 'சேமிக்கலாம்!',
      savePercentText: 'சேமிப்பு',
      perPack: 'ஒரு அட்டைக்கு',
      lowerCost: 'குறைந்த விலை',
    },
    te: {
      scanTitle: 'మందుల స్ట్రిప్ కెమెరాతో స్కాన్ చేయండి',
      scanSub: 'కెమెరాను మందుల ప్యాకెట్ పై ఉంచండి — AI పేరును చదివి తక్కువ ధర జన్ ఔషధి వివరాలు చూపుతుంది',
      openCameraBtn: 'కెమెరా తెరవండి',
      disclaimerSub: 'మందుల మార్పును ఎల్లప్పుడూ అర్హత కలిగిన డాక్టర్ లేదా ఫార్మసిస్ట్ సలహాతోనే చేయండి.',
      noMedTitle: 'మందులు కనుగొనబడలేదు',
      noMedSub: 'సాల్ట్ పేరుతో శోధించండి (ఉదా: Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'కెమెరా గుర్తించిన మందు:',
      saltPrefix: 'సాల్ట్:',
      savePrefix: 'జన్ ఔషధి ద్వారా ₹',
      saveSuffix: 'ఆదా!',
      savePercentText: 'ఆదా',
      perPack: 'ఒక ప్యాక్‌కు',
      lowerCost: 'తక్కువ ధర',
    },
    kn: {
      scanTitle: 'ಔಷಧಿ ಸ್ಟ್ರಿಪ್ ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
      scanSub: 'ಕ್ಯಾಮೆರಾವನ್ನು ಔಷಧಿ ಮೇಲೆ ಇರಿಸಿ — AI ಹೆಸರನ್ನು ಓದಿ ಜನೌಷಧಿ ರಿಯಾಯಿತಿ ದರ ತಿಳಿಸುತ್ತದೆ',
      openCameraBtn: 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ',
      disclaimerSub: 'ಔಷಧಿ ಬದಲಾವಣೆಯನ್ನು ಕೇವಲ ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ಮಾತ್ರ ಮಾಡಬೇಕು.',
      noMedTitle: 'ಯಾವುದೇ ಔಷಧಿ ಕಂಡುಬಂದಿಲ್ಲ',
      noMedSub: 'ಸಾಲ್ಟ್ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ (ಉದಾ: Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಪತ್ತೆಯಾದ ಔಷಧಿ:',
      saltPrefix: 'ಸಾಲ್ಟ್:',
      savePrefix: 'ಜನೌಷಧಿಯಲ್ಲಿ ₹',
      saveSuffix: 'ಉಳಿತಾಯ!',
      savePercentText: 'ಉಳಿತಾಯ',
      perPack: 'ಪ್ರತಿ ಪ್ಯಾಕ್‌ಗೆ',
      lowerCost: 'ಕಡಿಮೆ ದರ',
    },
    ml: {
      scanTitle: 'മെഡിസിൻ സ്ട്രിപ്പ് ക്യാമറയിൽ സ്കാൻ ചെയ്യുക',
      scanSub: 'ക്യാമറ മരുന്നിന് നേരെ പിടിക്കുക — AI പേര് വായിച്ച് ജൻ ഔഷധി വിവരങ്ങൾ നൽകും',
      openCameraBtn: 'ക്യാമറ തുറക്കുക',
      disclaimerSub: 'ഡോക്ടറുടെയോ ഫാർമസിസ്റ്റിന്റെയോ നിർദ്ദേശപ്രകാരം മാത്രം മരുന്നുകൾ മാറ്റുക.',
      noMedTitle: 'മരുന്നുകൾ കണ്ടെത്തിയില്ല',
      noMedSub: 'ഘടകത്തിന്റെ പേര് നൽകി തിരയുക (ഉദാ: Paracetamol, Metformin)',
      scannedPrefix: 'തിരിച്ചറിഞ്ഞ മരുന്ന്:',
      saltPrefix: 'ഘടകം:',
      savePrefix: 'ജൻ ഔഷധി വഴി ₹',
      saveSuffix: 'ലാഭം!',
      savePercentText: 'ലാഭം',
      perPack: 'ഒരു പാക്കിന്',
      lowerCost: 'കുറഞ്ഞ വില',
    },
    bn: {
      scanTitle: 'ওষুধের স্ট্রিপ ক্যামেরা দিয়ে স্ক্যান করুন',
      scanSub: 'ক্যামেরা ওষুধের পাতার উপর রাখুন — AI নাম পড়ে স্বল্পমূল্যের জন ঔষধি বিকল্প দেখাবে',
      openCameraBtn: 'ক্যামেরা খুলুন',
      disclaimerSub: 'সকল ওষুধ পরিবর্তন কেবল লাইসেন্সপ্রাপ্ত ডাক্তার বা ফার্মাসিস্টের পরামর্শে করা উচিত।',
      noMedTitle: 'কোনো ওষুধ পাওয়া যায়নি',
      noMedSub: 'উপাদান দিয়ে অনুসন্ধান করুন (যেমন: Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'ক্যামেরায় সনাক্তকৃত ওষুধ:',
      saltPrefix: 'উপাদান:',
      savePrefix: 'জন ঔষধি কেন্দ্রে ₹',
      saveSuffix: 'সাশ্রয়!',
      savePercentText: 'সাশ্রয়',
      perPack: 'প্রতি পাতায়',
      lowerCost: 'কম মূল্যে',
    },
    mr: {
      scanTitle: 'औषध पट्टी (Strip) कॅमेऱ्याने स्कॅन करा',
      scanSub: 'कॅमेरा औषधाच्या पाकीटावर धरा — AI नाव वाचून स्वस्त जन औषधी पर्याय दाखवेल',
      openCameraBtn: 'कॅमेरा उघडा',
      disclaimerSub: 'औषध बदलण्यापूर्वी नोंदणीकृत डॉक्टर किंवा फार्मासिस्टचा सल्ला घ्यावा.',
      noMedTitle: 'कोणतेही औषध सापडले नाही',
      noMedSub: 'साल्ट नावाने शोधा (उदा: Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'कॅमेऱ्याने ओळखलेले औषध:',
      saltPrefix: 'साल्ट:',
      savePrefix: 'जन औषधीवर ₹',
      saveSuffix: 'बचत!',
      savePercentText: 'बचत',
      perPack: 'प्रति पाकीट',
      lowerCost: 'कमी खर्च',
    },
    gu: {
      scanTitle: 'દવા સ્ટ્રીપ કેમેરાથી સ્કેન કરો',
      scanSub: 'કેમેરા દવાની પટ્ટી પર રાખો — AI નામ વાંચીને સસ્તી સરકારી જન ઔષધિ માહિતી આપશે',
      openCameraBtn: 'કેમેરા ખોલો',
      disclaimerSub: 'બધા દવા પરિવર્તન રજિસ્ટર્ડ ડૉક્ટર કે ફાર્માસિસ્ટની સલાહ મુજબ જ કરવા.',
      noMedTitle: 'કોઈ દવા મળી નથી',
      noMedSub: 'સોલ્ટ નામથી શોધો (દા.ત. Paracetamol, Metformin, Pantoprazole)',
      scannedPrefix: 'કેમેરા દ્વારા ઓળખાયેલ દવા:',
      saltPrefix: 'સોલ્ટ:',
      savePrefix: 'જન ઔષધિ પર ₹',
      saveSuffix: 'ની બચત!',
      savePercentText: 'બચત',
      perPack: 'પેક દીઠ',
      lowerCost: 'ઓછી કિંમત',
    },
    en: {
      scanTitle: 'Scan Medicine Strip with Camera',
      scanSub: 'Point camera at any tablet strip. AI reads name & reveals 50-80% cheaper Jan Aushadhi generic salts',
      openCameraBtn: 'Open Camera Scanner',
      disclaimerSub: 'All substitutions must be validated by a registered medical professional or pharmacist.',
      noMedTitle: 'No matching medicine found',
      noMedSub: 'Try searching by generic salt (e.g. Paracetamol, Metformin, Pantoprazole) or common brand name.',
      scannedPrefix: 'Identified from camera:',
      saltPrefix: 'Salts:',
      savePrefix: 'Save ₹',
      saveSuffix: 'with Jan Aushadhi!',
      savePercentText: 'Save',
      perPack: 'per pack',
      lowerCost: 'lower cost',
    },
  };

  const bt = bannerTexts[currentLang] || bannerTexts.en;

  const handleMedicineIdentified = (medicine: Medicine) => {
    setSearchQuery(medicine.brandName);
    const savings = (medicine.mrpPrice - medicine.janAushadhiEquivalent.price).toFixed(0);
    const alertText = `${bt.scannedPrefix} "${medicine.brandName}" (${bt.saltPrefix} ${medicine.genericSalts}). ${bt.savePrefix}${savings} ${bt.saveSuffix}`;

    setScannedAlert(alertText);
    setTimeout(() => setScannedAlert(null), 8000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Page Title & Subtitle */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('medicineCheckerTitle', currentLang)}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {t('medicineCheckerSubtitle', currentLang)}
          </p>
        </div>

        {/* 2. REAL WORKING CAMERA SCANNER PRIMARY ACTION BANNER */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white shadow-lg border border-teal-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {bt.scanTitle}
                </h3>
                <span className="text-[10px] font-bold bg-emerald-400 text-teal-950 px-2 py-0.5 rounded-full uppercase">
                  AI Vision
                </span>
              </div>
              <p className="text-xs text-teal-200/90 pt-0.5">
                {bt.scanSub}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCameraModalOpen(true)}
            className="h-12 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-teal-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
          >
            <ScanLine className="w-4 h-4" />
            <span>{bt.openCameraBtn}</span>
          </button>
        </div>

        {/* Scanned Feedback Banner */}
        {scannedAlert && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm text-emerald-950 font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{scannedAlert}</span>
          </div>
        )}

        {/* 3. Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchMedicinePlaceholder', currentLang)}
            className="w-full h-13 pl-12 pr-10 rounded-2xl bg-white border border-slate-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 text-slate-900 text-base shadow-xs transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              aria-label="Clear medicine search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Mandatory Safety Notice Banner (Selected Language) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-bold leading-snug">
            {t('medicineSafetyDisclaimer', currentLang)}
          </p>
          <p className="text-xs text-amber-900/80">
            {bt.disclaimerSub}
          </p>
        </div>
      </div>

      {/* 5. Medicine Comparison Cards */}
      <div className="space-y-5">
        {medicines.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Pill className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              {bt.noMedTitle}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {bt.noMedSub}
            </p>
          </div>
        ) : (
          medicines.map((med: Medicine) => {
            const savingsRs = (med.mrpPrice - med.janAushadhiEquivalent.price).toFixed(1);
            return (
              <article
                key={med.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-teal-700/60 transition-all space-y-5"
              >
                {/* Header: Brand name & salt match */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {med.dosageForm} · {med.strength}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                      {med.brandName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Mfg: {med.manufacturer}
                    </p>
                  </div>

                  {/* Exact Salt Match Badge */}
                  {med.exactSaltMatch && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold self-start">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{t('exactCompositionMatch', currentLang)}</span>
                    </div>
                  )}
                </div>

                {/* Active Salts Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <Layers className="w-4 h-4 text-teal-800" />
                    <span>{t('activeSaltsLabel', currentLang)}:</span>
                  </div>
                  <span className="text-slate-900 font-mono font-bold text-sm sm:text-base">
                    {med.genericSalts} ({med.strength})
                  </span>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {med.uses[currentLang] || med.uses.en}
                  </p>
                </div>

                {/* Side-by-Side Comparison: Branded vs Jan Aushadhi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branded Private Medicine */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                      {t('mrpBrandedLabel', currentLang)}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                        ₹{med.mrpPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({med.packSize})
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>{t('pricePerUnitLabel', currentLang)}:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ₹{med.pricePerUnit.toFixed(2)} / unit
                      </span>
                    </div>
                  </div>

                  {/* Jan Aushadhi Generic Medicine */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        {t('janAushadhiLabel', currentLang)}
                      </span>
                      <span className="text-xs font-extrabold bg-emerald-700 text-white px-2 py-0.5 rounded-full tabular-nums">
                        {bt.savePercentText} {med.janAushadhiEquivalent.savingsPercent}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-950 tabular-nums">
                        ₹{med.janAushadhiEquivalent.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-emerald-800">
                        ({med.janAushadhiEquivalent.packSize})
                      </span>
                    </div>

                    <div className="text-xs text-emerald-900 pt-1 border-t border-emerald-200/80 flex items-center justify-between">
                      <span>{t('pricePerUnitLabel', currentLang)}:</span>
                      <span className="font-bold tabular-nums">
                        ₹{med.janAushadhiEquivalent.pricePerUnit.toFixed(2)} / unit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Savings Callout */}
                <div className="p-3.5 rounded-2xl bg-teal-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-300" />
                    <div>
                      <span className="text-xs font-medium text-teal-200 block">
                        {t('youSaveUpTo', currentLang)}:
                      </span>
                      <span className="text-lg font-black text-white tabular-nums">
                        ₹{savingsRs} {bt.perPack} ({med.janAushadhiEquivalent.savingsPercent}% {bt.lowerCost})
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-teal-100 font-medium">
                    {med.janAushadhiEquivalent.storeAvailability}
                  </span>
                </div>

                {/* Specific Safety Precaution for this drug */}
                <div className="text-xs text-slate-500 pt-1 flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{med.safetyDisclaimer}</span>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 6. WORKING CAMERA MEDICINE STRIP SCANNER MODAL */}
      <MedicineCameraScannerModal
        isOpen={isCameraModalOpen}
        currentLang={currentLang}
        onClose={() => setIsCameraModalOpen(false)}
        onMedicineIdentified={handleMedicineIdentified}
      />
    </div>
  );
};
