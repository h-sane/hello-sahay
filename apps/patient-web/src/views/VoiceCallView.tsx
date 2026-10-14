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
    <Sheet
      title={c.title}
      closeLabel={pick(currentLang, { en: 'Close', hi: 'बंद करें', ta: 'மூடு' })}
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
