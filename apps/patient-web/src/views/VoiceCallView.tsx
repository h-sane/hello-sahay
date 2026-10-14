import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  VolumeX,
  RotateCcw,
  X,
  PhoneCall,
  Radio,
  Send,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { sahayAiService } from '../services/sahayAiService';
import { speechService } from '../services/speechService';

interface VoiceCallViewProps {
  currentLang: Language;
  onClose: () => void;
  onOpenEmergency: () => void;
}

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({
  currentLang,
  onClose,
  onOpenEmergency,
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [responseTranscript, setResponseTranscript] = useState<string>('');
  const [manualText, setManualText] = useState('');
  const [recognitionObj, setRecognitionObj] = useState<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    const greetings: Record<Language, string> = {
      hi: 'नमस्ते। मैं सहाय AI हूँ। कृपया अपनी स्वास्थ्य समस्या या प्रश्न बताएं।',
      ta: 'வணக்கம். நான் சஹாய் AI. உங்கள் உடல்நலப் பிரச்சனையை அல்லது மருத்துவக் கேள்வியை சொல்லுங்கள்.',
      te: 'నమస్తే. నేను సహాయ్ AI ని. మీ ఆరోగ్య సమస్య లేదా ప్రశ్నను అడగండి.',
      kn: 'ನಮಸ್ಕಾರ. ನಾನು ಸಹಾಯ್ AI. ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ಹೇಳಿ.',
      ml: 'നമസ്കാരം. ഞാൻ സഹായ് AI ആണ്. നിങ്ങളുടെ ആരോഗ്യ പ്രശ്നങ്ങൾ ചോദിക്കാം.',
      bn: 'নমস্কার। আমি সহায় AI। আপনার স্বাস্থ্য সমস্যা বা প্রশ্ন বলুন।',
      mr: 'नमस्कार. मी सहाय AI आहे. आपली आरोग्य समस्या सांगा.',
      gu: 'નમસ્તે. હું સહાય AI છું. તમારી સ્વાસ્થ્ય સમસ્યા અથવા પ્રશ્ન જણાવો.',
      en: 'Hello. I am Sahay AI. Please speak your health query or question.',
    };

    const initialGreeting = greetings[currentLang] || greetings.en;
    setResponseTranscript(initialGreeting);
    setVoiceState('speaking');
    speechService.speak(initialGreeting, currentLang, () => {
      setVoiceState('idle');
    });

    return () => {
      speechService.stop();
    };
  }, [currentLang]);

  const handleStartListening = () => {
    speechService.stop();
    setTranscript('');
    setVoiceState('listening');
    speechService.playAudioChime(680, 0.1);

    if (speechService.isRecognitionSupported()) {
      const rec = speechService.createRecognition(
        currentLang,
        (currentText) => {
          setTranscript(currentText);
        },
        (err) => {
          console.warn('Speech error:', err);
          simulateDemonstrationVoiceResponse(currentLang);
        },
        () => {
          handleProcessVoiceInput(transcript);
        }
      );
      setRecognitionObj(rec);
      rec.start();
    } else {
      setTimeout(() => {
        simulateDemonstrationVoiceResponse(currentLang);
      }, 1500);
    }
  };

  const handleStopListening = () => {
    if (recognitionObj) {
      recognitionObj.stop();
    }
    handleProcessVoiceInput(transcript);
  };

  const simulateDemonstrationVoiceResponse = async (lang: Language) => {
    setVoiceState('processing');
    const demoQueries: Record<Language, string> = {
      hi: 'निकटतम प्राथमिक स्वास्थ्य केंद्र पर ओपीडी समय क्या है?',
      ta: 'அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்தின் ஓபிடி நேரம் என்ன?',
      te: 'సమీప ప్రాథమిక ఆరోగ్య కేంద్రం ఓపీడీ సమయాలు ఏమిటి?',
      kn: 'ಹತ್ತಿರದ ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದ ಒಪಿಡಿ ಸಮಯ ಏನು?',
      ml: 'അടുത്തുള്ള പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിലെ ഒപിഡി സമയം എപ്പോഴാണ്?',
      bn: 'নিকটতম প্রাথমিক স্বাস্থ্য কেন্দ্রের ওপিডি সময় কী?',
      mr: 'जवळच्या प्राथमिक आरोग्य केंद्राची ओपीडी वेळ काय आहे?',
      gu: 'નજીકના પ્રાથમિક આરોગ્ય કેન્દ્રનો ઓપીડી સમય શું છે?',
      en: 'What are the OPD hours at the nearest Primary Health Centre?',
    };

    const q = demoQueries[lang] || demoQueries.en;
    setTranscript(q);

    const aiRes = await sahayAiService.consultSahayAi(q, lang);
    setResponseTranscript(aiRes.reply);
    setVoiceState('speaking');
    speechService.speak(aiRes.reply, lang, () => {
      setVoiceState('idle');
    });
  };

  const handleProcessVoiceInput = async (queryText: string) => {
    const text = queryText.trim() || manualText.trim();
    if (!text) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('processing');

    try {
      const aiResult = await sahayAiService.consultSahayAi(text, currentLang);
      setResponseTranscript(aiResult.reply);
      setVoiceState('speaking');
      speechService.speak(aiResult.reply, currentLang, () => {
        setVoiceState('idle');
      });
    } catch {
      simulateDemonstrationVoiceResponse(currentLang);
    }
  };

  const handleRepeatSpeech = () => {
    if (!responseTranscript) return;
    setVoiceState('speaking');
    speechService.speak(responseTranscript, currentLang, () => {
      setVoiceState('idle');
    });
  };

  const handleStopAudio = () => {
    speechService.stop();
    setVoiceState('idle');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-gradient-to-b from-teal-950 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-800/40 flex flex-col items-center justify-between min-h-[580px] max-h-[92vh] overflow-y-auto">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between border-b border-teal-800/40 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="font-extrabold text-base tracking-tight text-white">
              Call Sahay (Voice Mode)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-teal-800/80 text-xs font-bold text-teal-200">
              {currentLang.toUpperCase()}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Close voice mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Microphone Orb */}
        <div className="my-auto text-center space-y-6 w-full max-w-md">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
              {voiceState === 'listening'
                ? 'Listening to you...'
                : voiceState === 'processing'
                ? 'Sahay AI clinical reasoning...'
                : voiceState === 'speaking'
                ? 'Speaking response...'
                : 'Tap microphone to speak'}
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            {voiceState === 'listening' && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-teal-500/20 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-teal-500/30 animate-pulse" />
              </>
            )}
            {voiceState === 'speaking' && (
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/30 animate-pulse" />
            )}

            <button
              onClick={
                voiceState === 'listening'
                  ? handleStopListening
                  : voiceState === 'speaking'
                  ? handleStopAudio
                  : handleStartListening
              }
              className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 touch-target ${
                voiceState === 'listening'
                  ? 'bg-red-600 text-white shadow-red-500/50 scale-105'
                  : voiceState === 'speaking'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/50'
                  : 'bg-teal-700 hover:bg-teal-600 text-white shadow-teal-500/30'
              }`}
              aria-label="Toggle voice listening"
            >
              {voiceState === 'listening' ? (
                <MicOff className="w-12 h-12" />
              ) : voiceState === 'speaking' ? (
                <VolumeX className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
          </div>

          {/* Live Transcript / Response display */}
          <div className="p-4 rounded-2xl bg-black/40 border border-teal-800/40 text-left space-y-3 min-h-[110px]">
            {transcript && (
              <div>
                <span className="text-[11px] font-bold text-teal-300 uppercase block">
                  You said:
                </span>
                <p className="text-sm font-semibold text-white">
                  "{transcript}"
                </p>
              </div>
            )}

            {responseTranscript && (
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase block">
                  Sahay responded:
                </span>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {responseTranscript}
                </p>
              </div>
            )}
          </div>

          {/* Audio Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleRepeatSpeech}
              className="h-10 px-4 rounded-xl bg-teal-800/60 hover:bg-teal-800 border border-teal-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-300" />
              <span>Repeat Speech</span>
            </button>

            {voiceState === 'speaking' && (
              <button
                onClick={handleStopAudio}
                className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Audio</span>
              </button>
            )}

            <button
              onClick={() => simulateDemonstrationVoiceResponse(currentLang)}
              className="h-10 px-4 rounded-xl bg-teal-800/40 hover:bg-teal-800 border border-teal-600 text-teal-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Try Demo Query</span>
            </button>
          </div>
        </div>

        {/* Manual Fallback Input */}
        <div className="w-full pt-4 border-t border-teal-800/40 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessVoiceInput(manualText);
              }}
              placeholder="Or type your health query here..."
              className="flex-1 h-11 px-4 rounded-xl bg-black/40 border border-teal-800/60 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-teal-400"
            />
            <button
              onClick={() => handleProcessVoiceInput(manualText)}
              className="h-11 px-4 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-teal-300/80">
            <span>Direct Client Speech AI Active</span>
            <button
              onClick={onOpenEmergency}
              className="text-red-400 hover:text-red-300 font-bold underline flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Emergency 108</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
