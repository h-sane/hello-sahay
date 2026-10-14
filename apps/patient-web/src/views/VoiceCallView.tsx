import React, { useEffect, useRef, useState } from 'react';
import { PhoneCall, PhoneOff, X, AlertTriangle, Mic } from 'lucide-react';
import { Language } from '../types';

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

const COPY: Record<'en' | 'hi' | 'ta', Record<string, string>> = {
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
};

export const VoiceCallView: React.FC<VoiceCallViewProps> = ({ currentLang, onClose, onOpenEmergency }) => {
  const lang: 'en' | 'hi' | 'ta' = currentLang === 'hi' || currentLang === 'ta' ? currentLang : 'en';
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 to-teal-800 text-white flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <PhoneCall className="w-6 h-6" />
              {c.title}
            </h2>
            <p className="text-sm text-teal-100">{c.lead}</p>
          </div>
          <button
            onClick={() => {
              cleanup(true);
              onClose();
            }}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-3">
            <button
              onClick={() => (inCall ? (cleanup(true), setState('idle')) : start())}
              className={`flex-1 h-14 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 ${
                inCall ? 'bg-red-700 hover:bg-red-800' : 'bg-teal-800 hover:bg-teal-900'
              }`}
            >
              {inCall ? <PhoneOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {inCall ? c.end : c.start}
            </button>
            <button
              onClick={onOpenEmergency}
              className="h-14 px-4 rounded-2xl border-2 border-red-300 text-red-800 font-bold text-sm flex items-center gap-2 hover:bg-red-50"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{c.emergency}</span>
            </button>
          </div>

          <p role="status" className="font-bold text-slate-800">
            {stateText}
          </p>
          {error && (
            <p role="alert" className="font-bold text-red-700">
              {error}
            </p>
          )}
          {heard && <p aria-live="polite" className="italic text-slate-500">{heard}</p>}

          <ol className="grid gap-2.5">
            {lines.map((l, i) => (
              <li
                key={i}
                className={`p-3 rounded-xl bg-slate-50 border border-slate-200 border-l-[6px] ${
                  l.role === 'assistant' ? 'border-l-teal-700' : 'border-l-slate-800'
                }`}
              >
                <b className="block text-xs text-slate-500">{l.role === 'assistant' ? c.sahay : c.you}</b>
                <span className="text-base">{l.text}</span>
              </li>
            ))}
          </ol>
          <div ref={endRef} />

          {latencies.length > 0 && (
            <p className="text-xs text-slate-500">Time to first audio per turn (ms): {latencies.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
