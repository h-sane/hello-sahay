import { Language } from '../types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Play a soft audio feedback tone using Web Audio API
  playAudioChime(frequency = 520, duration = 0.18): void {
    try {
      if (typeof window === 'undefined') return;
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch {
      // AudioContext unavailable or suppressed
    }
  }

  // Text-To-Speech with Tamil, Hindi, and English voice matching
  speak(text: string, lang: Language, onEnd?: () => void): boolean {
    if (!this.synth) {
      this.playAudioChime(440, 0.3);
      onEnd?.();
      return false;
    }

    try {
      this.stop();
      this.playAudioChime(660, 0.1);

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const langCodeMap: Record<Language, string> = {
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        en: 'en-IN',
      };
      utterance.lang = langCodeMap[lang] || 'en-IN';
      utterance.rate = lang === 'ta' ? 0.9 : 0.95; // Slightly measured pace for rural patients
      utterance.pitch = 1.0;

      // Find best available native voice if available
      const voices = this.synth.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2))
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        onEnd?.();
      };

      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      onEnd?.();
      return false;
    }
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }

  // Check if speech synthesis is supported
  isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  // Check if microphone speech recognition is supported
  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
    );
  }

  // Speech Recognition listener
  createRecognition(
    lang: Language,
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): { start: () => void; stop: () => void } {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      return {
        start: () => {
          onError('Speech recognition not supported in this browser. Please use keyboard input.');
          onEnd();
        },
        stop: () => {},
      };
    }

    try {
      const recognition = new SpeechRecognitionClass();
      const langCodeMap: Record<Language, string> = {
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        en: 'en-IN',
      };
      recognition.lang = langCodeMap[lang] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        onResult(transcript);
      };

      recognition.onerror = (event: any) => {
        onError(event.error || 'Recognition error');
      };

      recognition.onend = () => {
        onEnd();
      };

      return {
        start: () => {
          try {
            recognition.start();
          } catch (e) {
            console.warn('Speech recognition start failed:', e);
          }
        },
        stop: () => {
          try {
            recognition.stop();
          } catch {}
        },
      };
    } catch {
      return {
        start: () => {
          onError('Microphone recognition could not be initialized.');
          onEnd();
        },
        stop: () => {},
      };
    }
  }
}

export const speechService = new SpeechService();
