import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, AlertTriangle, Mic } from 'lucide-react';
import { Language } from '../types';
import { BigButton, Notice, Sheet, pick } from '../components/ui';

// Browser client for the voice service (services/voice, WS /call): 16 kHz mono PCM16 both ways,
// JSON events heard / transcript / latency / ended.
const VOICE_BASE: string = (import.meta as any).env?.VITE_VOICE_URL || '/voice';

const WORKLET = `
class Cap extends AudioWorkletProcessor {
  constructor(){ super(); this.buf = new Int16Array(1600); this.n = 0; }
  process(inputs){
    const ch = inputs[0][0]; if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.buf[this.n++] = Math.max(-1, Math.min(1, ch[i])) * 32767;
      if (this.n === 1600) { this.port.postMessage(this.buf.slice().buffer); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('cap', Cap);`;

interface Line {
  role: 'assistant' | 'user';
  text: string;
}

interface VoiceCallViewProps {
  currentLang: Language;
  onClose: () => void;
  onOpenEmergency: () => void;
}

const COPY: Record<'en' | 'hi' | 'ta' | 'kn' | 'ml' | 'te', Record<string, string>> = {
  en: {
    title: 'Call Sahay',
    lead: 'Speak to the free health helpline. Sahay cannot give medical advice.',
    start: 'Start call',
    end: 'End call',
    idle: 'Not connected',
    connecting: 'Connecting…',
    live: 'Connected. Sahay will greet you, then speak.',
    ended: 'Call ended',
    mic: 'Microphone blocked. Allow it in the browser address bar and try again.',
    unreachable: 'Cannot reach the voice service. Please try again, or call 108 in an emergency.',
    you: 'You',
    sahay: 'Sahay',
    emergency: 'Emergency? Call 108',
  },
  hi: {
    title: 'सहाय को कॉल करें',
    lead: 'निःशुल्क स्वास्थ्य हेल्पलाइन से बात करें। सहाय चिकित्सा सलाह नहीं देता।',
    start: 'कॉल शुरू करें',
    end: 'कॉल खत्म करें',
    idle: 'जुड़ा नहीं है',
    connecting: 'जुड़ रहा है…',
    live: 'जुड़ गया। सहाय अभिवादन करेगा, फिर आप बोलें।',
    ended: 'कॉल खत्म हुई',
    mic: 'माइक्रोफ़ोन बंद है। ब्राउज़र की एड्रेस बार में अनुमति दें और फिर कोशिश करें।',
    unreachable: 'वॉयस सेवा से संपर्क नहीं हो सका। फिर कोशिश करें, या आपातकाल में 108 पर कॉल करें।',
    you: 'आप',
    sahay: 'सहाय',
    emergency: 'आपातकाल? 108 पर कॉल करें',
  },
  ta: {
    title: 'சஹாயை அழைக்கவும்',
    lead: 'இலவச சுகாதார உதவி எண்ணுடன் பேசுங்கள். சஹாய் மருத்துவ ஆலோசனை வழங்காது.',
    start: 'அழைப்பைத் தொடங்கு',
    end: 'அழைப்பை முடி',
    idle: 'இணைக்கப்படவில்லை',
    connecting: 'இணைக்கிறது…',
    live: 'இணைந்தது. சஹாய் வரவேற்கும், பிறகு பேசுங்கள்.',
    ended: 'அழைப்பு முடிந்தது',
    mic: 'மைக்ரோஃபோன் தடுக்கப்பட்டுள்ளது. உலாவியில் அனுமதித்து மீண்டும் முயற்சிக்கவும்.',
    unreachable: 'குரல் சேவையை அடைய முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது அவசரத்தில் 108 அழைக்கவும்.',
    you: 'நீங்கள்',
    sahay: 'சஹாய்',
    emergency: 'அவசரமா? 108 அழைக்கவும்',
  },
  kn: {
    title: 'ಸಹಾಯ್‌ಗೆ ಕರೆ ಮಾಡಿ',
    lead: 'ಉಚಿತ ಆರೋಗ್ಯ ಸಹಾಯವಾಣಿಯೊಂದಿಗೆ ಮಾತನಾಡಿ. ಸಹಾಯ್ ವೈದ್ಯಕೀಯ ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ.',
    start: 'ಕರೆ ಪ್ರಾರಂಭಿಸಿ',
    end: 'ಕರೆ ಮುಗಿಸಿ',
    idle: 'ಸಂಪರ್ಕವಿಲ್ಲ',
    connecting: 'ಸಂಪರ್ಕಿಸುತ್ತಿದೆ…',
    live: 'ಸಂಪರ್ಕವಾಯಿತು. ಸಹಾಯ್ ಮೊದಲು ನಮಸ್ಕರಿಸುತ್ತದೆ, ನಂತರ ನೀವು ಮಾತನಾಡಿ.',
    ended: 'ಕರೆ ಮುಗಿದಿದೆ',
    mic: 'ಮೈಕ್ರೊಫೋನ್ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್‌ನ ವಿಳಾಸ ಪಟ್ಟಿಯಲ್ಲಿ ಅನುಮತಿಸಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    unreachable: 'ಧ್ವನಿ ಸೇವೆಯನ್ನು ತಲುಪಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ತುರ್ತು ಸಂದರ್ಭದಲ್ಲಿ 108 ಕ್ಕೆ ಕರೆ ಮಾಡಿ.',
    you: 'ನೀವು',
    sahay: 'ಸಹಾಯ್',
    emergency: 'ತುರ್ತು? 108 ಕ್ಕೆ ಕರೆ ಮಾಡಿ',
  },
  ml: {
    title: 'സഹായ്‌യെ വിളിക്കുക',
    lead: 'സൗജന്യ ആരോഗ്യ ഹെൽപ്‌ലൈനുമായി സംസാരിക്കുക. സഹായ് വൈദ്യോപദേശം നൽകില്ല.',
    start: 'കോൾ തുടങ്ങുക',
    end: 'കോൾ അവസാനിപ്പിക്കുക',
    idle: 'ബന്ധപ്പെട്ടിട്ടില്ല',
    connecting: 'ബന്ധപ്പെടുന്നു…',
    live: 'ബന്ധപ്പെട്ടു. സഹായ് ആദ്യം അഭിവാദ്യം ചെയ്യും, പിന്നെ നിങ്ങൾ സംസാരിക്കുക.',
    ended: 'കോൾ അവസാനിച്ചു',
    mic: 'മൈക്രോഫോൺ തടഞ്ഞിരിക്കുന്നു. ബ്രൗസറിന്റെ വിലാസ ബാറിൽ അനുവദിച്ച ശേഷം വീണ്ടും ശ്രമിക്കുക.',
    unreachable: 'വോയ്‌സ് സേവനത്തിൽ എത്താൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ അടിയന്തര ഘട്ടത്തിൽ 108 ൽ വിളിക്കുക.',
    you: 'നിങ്ങൾ',
    sahay: 'സഹായ്',
    emergency: 'അടിയന്തരമോ? 108 ൽ വിളിക്കുക',
  },
  te: {
    title: 'సహాయ్‌కి కాల్ చేయండి',
    lead: 'ఉచిత ఆరోగ్య హెల్ప్‌లైన్‌తో మాట్లాడండి. సహాయ్ వైద్య సలహా ఇవ్వదు.',
    start: 'కాల్ ప్రారంభించండి',
    end: 'కాల్ ముగించండి',
    idle: 'కనెక్ట్ కాలేదు',
    connecting: 'కనెక్ట్ అవుతోంది…',
    live: 'కనెక్ట్ అయింది. సహాయ్ మీకు స్వాగతం పలుకుతుంది, తర్వాత మాట్లాడండి.',
    ended: 'కాల్ ముగిసింది',
    mic: 'మైక్రోఫోన్ బ్లాక్ చేయబడింది. బ్రౌజర్ అడ్రస్ బార్‌లో అనుమతించి మళ్లీ ప్రయత్నించండి.',
    unreachable: 'వాయిస్ సేవ అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి, లేదా అత్యవసరమైతే 108కి కాల్ చేయండి.',
    you: 'మీరు',
    sahay: 'సహాయ్',
    emergency: 'అత్యవసరమా? 108కి కాల్ చేయండి',
  },
};

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({ currentLang, onClose, onOpenEmergency }) => {
  const lang: 'en' | 'hi' | 'ta' | 'kn' | 'ml' | 'te' = currentLang in COPY ? (currentLang as keyof typeof COPY) : 'en';
  const c = COPY[lang];

  const [state, setState] = useState<'idle' | 'connecting' | 'live' | 'ended'>('idle');
  const [error, setError] = useState('');
  const [heard, setHeard] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [latencies, setLatencies] = useState<number[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playAtRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lines]);

  const play = (buf: ArrayBuffer) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const pcm = new Int16Array(buf);
    const f = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f[i] = pcm[i] / 32768;
    const b = ctx.createBuffer(1, f.length, 16000);
    b.copyToChannel(f, 0);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    playAtRef.current = Math.max(playAtRef.current, ctx.currentTime + 0.05);
    s.start(playAtRef.current);
    playAtRef.current += b.duration;
  };

  const cleanup = (sendEnd: boolean) => {
    const ws = wsRef.current;
    if (sendEnd && ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'end' }));
    try {
      ws?.close();
    } catch {
      /* already closed */
    }
    wsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null;
    ctxRef.current = null;
  };

  useEffect(() => () => cleanup(true), []);

  const start = async () => {
    setError('');
    setLines([]);
    setLatencies([]);
    setHeard('');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch {
      setError(c.mic);
      return;
    }
    setState('connecting');
    const ctx = new AudioContext({ sampleRate: 16000 });
    ctxRef.current = ctx;
    playAtRef.current = 0;
    await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' })));
    const node = new AudioWorkletNode(ctx, 'cap');
    ctx.createMediaStreamSource(streamRef.current).connect(node);

    const origin = VOICE_BASE.startsWith('http')
      ? VOICE_BASE.replace(/^http/, 'ws')
      : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${VOICE_BASE}`;
    const ws = new WebSocket(`${origin}/call?lang=${lang}`);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;
    ws.onopen = () => setState('live');
    node.port.onmessage = (e) => {
      if (ws.readyState === 1) ws.send(e.data);
    };
    ws.onmessage = ({ data }) => {
      if (data instanceof ArrayBuffer) return play(data);
      const e = JSON.parse(data);
      if (e.type === 'transcript') {
        setHeard('');
        setLines((l) => [...l, { role: e.role === 'assistant' ? 'assistant' : 'user', text: e.text }]);
      } else if (e.type === 'heard') setHeard(e.final ? '' : e.text);
      else if (e.type === 'latency') setLatencies((l) => [...l, e.first_audio_ms]);
      else if (e.type === 'ended') setState('ended');
    };
    ws.onerror = () => setError(c.unreachable);
    ws.onclose = () => {
      cleanup(false);
      setState((s) => (s === 'ended' ? s : 'idle'));
    };
  };

  const stateText = { idle: c.idle, connecting: c.connecting, live: c.live, ended: c.ended }[state];
  const inCall = state === 'connecting' || state === 'live';

  return (
    <Sheet
      title={c.title}
      closeLabel={pick(currentLang, { en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' })}
      onClose={() => {
        cleanup(true);
        onClose();
      }}
    >
      <div className="space-y-4">
        <p className="text-xl text-slate-800">{c.lead}</p>

        <BigButton
          variant={inCall ? 'danger' : 'primary'}
          onClick={() => (inCall ? (cleanup(true), setState('idle')) : start())}
          icon={inCall ? <PhoneOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        >
          {inCall ? c.end : c.start}
        </BigButton>

        <p role="status" className="text-xl font-bold text-slate-900">{stateText}</p>
        {error && <Notice tone="error">{error}</Notice>}
        {heard && <p aria-live="polite" className="text-lg italic text-slate-600">{heard}</p>}

        <ol className="grid gap-3">
          {lines.map((l, i) => (
            <li
              key={i}
              className={`rounded-2xl border-2 border-l-8 bg-slate-50 p-3 ${
                l.role === 'assistant' ? 'border-teal-700 border-l-teal-700' : 'border-slate-300 border-l-slate-800'
              }`}
            >
              <b className="block text-base text-slate-600">{l.role === 'assistant' ? c.sahay : c.you}</b>
              <span className="text-xl text-slate-900">{l.text}</span>
            </li>
          ))}
        </ol>
        <div ref={endRef} />

        <BigButton variant="secondary" onClick={onOpenEmergency} icon={<AlertTriangle className="w-6 h-6" />}>
          {c.emergency}
        </BigButton>
      </div>
    </Sheet>
  );
};
