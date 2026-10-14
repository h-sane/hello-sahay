import React, { useState } from 'react';
import { Globe, ShieldCheck, MapPin, Mic, CheckCircle2, X } from 'lucide-react';
import { Language, UserSettings } from '../types';
import { languageMeta, t } from '../translations';
import { speechService } from '../services/speechService';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  isFirstTime: boolean;
  currentSettings: UserSettings;
  onSave: (settings: {
    language: Language;
    locationPermission: boolean;
    microphonePermission: boolean;
  }) => void;
  onClose?: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  isFirstTime,
  currentSettings,
  onSave,
  onClose,
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>(currentSettings.language);
  const [allowLocation, setAllowLocation] = useState<boolean>(currentSettings.locationPermission);
  const [allowMic, setAllowMic] = useState<boolean>(currentSettings.microphonePermission);

  if (!isOpen) return null;

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    speechService.playAudioChime(600, 0.1);
  };

  const handleContinue = () => {
    speechService.playAudioChime(750, 0.15);
    onSave({
      language: selectedLang,
      locationPermission: allowLocation,
      microphonePermission: allowMic,
    });
  };

  const languageList: { code: Language; label: string; subLabel: string; prompt: string }[] = [
    { code: 'hi', label: 'हिन्दी', subLabel: 'Hindi', prompt: 'ग्रामीण नागरिकों का सरल व सुलभ स्वास्थ्य साथी' },
    { code: 'ta', label: 'தமிழ்', subLabel: 'Tamil', prompt: 'கிராமப்புற மக்களுக்கான எளிய மருத்துவ துணை' },
    { code: 'te', label: 'తెలుగు', subLabel: 'Telugu', prompt: 'గ్రామీణ రోగుల సంరక్షణ డిజిటల్ వేదిక' },
    { code: 'kn', label: 'ಕನ್ನಡ', subLabel: 'Kannada', prompt: 'ಗ್ರಾಮೀಣ ರೋಗಿಗಳಿಗೆ ಸುಲಭ ಆರೋಗ್ಯ ಒಡನಾಡಿ' },
    { code: 'ml', label: 'മലയാളം', subLabel: 'Malayalam', prompt: 'ഗ്രാമീണ രോഗികൾക്കുള്ള കരുത്തുറ്റ സഹായം' },
    { code: 'bn', label: 'বাংলা', subLabel: 'Bengali', prompt: 'গ্রামীণ স্বাস্থ্যসেবার সহজ নির্ভরযোগ্য মাধ্যম' },
    { code: 'mr', label: 'मराठी', subLabel: 'Marathi', prompt: 'ग्रामीण भागासाठी सुलभ आरोग्य साथी' },
    { code: 'gu', label: 'ગુજરાતી', subLabel: 'Gujarati', prompt: 'ગ્રામીણ દર્દીઓ માટે સરળ સ્વાસ્થ્ય સેવા' },
    { code: 'en', label: 'English', subLabel: 'English', prompt: 'Patient-first rural healthcare companion' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-language-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-teal-50 to-white border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Globe className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 id="modal-language-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {t('chooseLanguage', selectedLang)}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Select your preferred Indian language (9 major languages supported)
              </p>
            </div>
          </div>
          {!isFirstTime && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Language Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {languageList.map((item) => {
              const isSelected = selectedLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLanguageSelect(item.code)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between min-h-[58px] touch-target ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/70 shadow-xs ring-1 ring-teal-700'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-900 tracking-tight truncate">
                        {item.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.subLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.prompt}
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-teal-800 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Privacy & Location note */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Privacy & Immediate Hospital Geolocation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you enter the app, your location is automatically matched against nearby public health centres to show your closest emergency facility. All data remains private on your device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto min-w-[220px] h-13 px-6 rounded-2xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{t('continueBtn', selectedLang)}</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
