import React, { useRef, useState } from 'react';
import { ExternalLink, Mic, MicOff, PhoneCall, Search, Volume2, VolumeX } from 'lucide-react';
import { Hospital, Language, UserCoordinates } from '../types';
import { DoctorAdviceResponse, sahayAiService } from '../services/sahayAiService';
import { speechService } from '../services/speechService';
import { useAppData } from '../components/AppData';
import { BigButton, Card, Notice, Spinner, Title, inputCls, pick } from '../components/ui';

interface AskSahayViewProps {
  currentLang: Language;
  userCoordinates: UserCoordinates;
  onOpenVoiceMode: () => void;
  onOpenEmergency: () => void;
  onSelectHospitalForBooking: (hospital: Hospital) => void;
  onOpenLocationSelector: () => void;
}

interface Exchange {
  id: number;
  question: string;
  answer?: DoctorAdviceResponse;
  failed?: boolean;
}

const STARTERS = [
  { en: 'What is CMCHIS?', hi: 'CMCHIS क्या है?', ta: 'CMCHIS என்றால் என்ன?', kn: 'CMCHIS ಎಂದರೇನು?', ml: 'CMCHIS എന്നാൽ എന്താണ്?', te: 'CMCHIS అంటే ఏమిటి?' },
  { en: 'What are the warning signs of dengue?', hi: 'डेंगू के चेतावनी संकेत क्या हैं?', ta: 'டெங்குவின் எச்சரிக்கை அறிகுறிகள் என்ன?', kn: 'ಡೆಂಗ್ಯೂವಿನ ಎಚ್ಚರಿಕೆ ಲಕ್ಷಣಗಳು ಯಾವುವು?', ml: 'ഡെങ്കിപ്പനിയുടെ മുന്നറിയിപ്പ് ലക്ഷണങ്ങൾ എന്തൊക്കെയാണ്?', te: 'డెంగ్యూ హెచ్చరిక లక్షణాలు ఏమిటి?' },
  { en: 'How do I get medicine from Jan Aushadhi?', hi: 'जन औषधि से दवा कैसे मिलती है?', ta: 'ஜன் ஔஷதியில் மருந்து எப்படி பெறுவது?', kn: 'ಜನ್ ಔಷಧಿಯಿಂದ ಔಷಧ ಹೇಗೆ ಪಡೆಯುವುದು?', ml: 'ജൻ ഔഷധിയിൽ നിന്ന് മരുന്ന് എങ്ങനെ കിട്ടും?', te: 'జన్ ఔషధి నుండి మందులు ఎలా పొందాలి?' },
  { en: 'How do I stay safe in a heat wave?', hi: 'लू से कैसे बचें?', ta: 'வெப்ப அலையில் எப்படி பாதுகாப்பாக இருப்பது?', kn: 'ಬಿಸಿಗಾಳಿಯಲ್ಲಿ ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿರುವುದು?', ml: 'ഉഷ്ണതരംഗത്തിൽ എങ്ങനെ സുരക്ഷിതരായിരിക്കാം?', te: 'ఎండ తీవ్రత నుండి ఎలా రక్షించుకోవాలి?' },
];

export const AskSahayView: React.FC<AskSahayViewProps> = ({
  currentLang, userCoordinates, onOpenEmergency, onSelectHospitalForBooking,
}) => {
  const { contacts } = useAppData();
  const [question, setQuestion] = useState('');
  const [items, setItems] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const recognition = useRef<{ start: () => void; stop: () => void } | null>(null);
  const nextId = useRef(1);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const id = nextId.current++;
    speechService.stop();
    setSpeakingId(null);
    setQuestion('');
    setLoading(true);
    setItems((prev) => [{ id, question: q }, ...prev]);
    try {
      const answer = await sahayAiService.consultSahayAi(q, currentLang, userCoordinates);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, answer } : x)));
    } catch {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, failed: true } : x)));
    } finally {
      setLoading(false);
    }
  };

  const listen = (item: Exchange) => {
    if (!item.answer) return;
    if (speakingId === item.id) {
      speechService.stop();
      setSpeakingId(null);
      return;
    }
    speechService.stop();
    setSpeakingId(item.id);
    speechService.speak(item.answer.reply, currentLang, () => setSpeakingId(null));
  };

  const speak = () => {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    let heard = '';
    setListening(true);
    recognition.current = speechService.createRecognition(
      currentLang,
      (text) => { heard = text; setQuestion(text); },
      () => setListening(false),
      () => { setListening(false); if (heard.trim()) ask(heard); }
    );
    recognition.current.start();
  };

  const L = (o: { en: string; hi: string; ta: string; kn: string; ml: string; te: string }) => pick(currentLang, o);

  return (
    <div>
      <Title
        sub={L({
          en: 'Ask about government health schemes and health advice. Answers come only from official government websites.',
          hi: 'सरकारी स्वास्थ्य योजनाओं और स्वास्थ्य सलाह के बारे में पूछें। उत्तर केवल सरकारी वेबसाइटों से आते हैं।',
          ta: 'அரசு சுகாதாரத் திட்டங்கள் மற்றும் ஆலோசனை பற்றி கேளுங்கள். பதில்கள் அரசு இணையதளங்களில் இருந்து மட்டுமே வரும்.',
          kn: 'ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಯೋಜನೆಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಸಲಹೆಯ ಬಗ್ಗೆ ಕೇಳಿ. ಉತ್ತರಗಳು ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್‌ಗಳಿಂದ ಮಾತ್ರ ಬರುತ್ತವೆ.',
          ml: 'സർക്കാർ ആരോഗ്യ പദ്ധതികളെയും ആരോഗ്യ ഉപദേശത്തെയും കുറിച്ച് ചോദിക്കൂ. ഉത്തരങ്ങൾ സർക്കാർ വെബ്‌സൈറ്റുകളിൽ നിന്ന് മാത്രമാണ് വരുന്നത്.',
          te: 'ప్రభుత్వ ఆరోగ్య పథకాలు మరియు ఆరోగ్య సలహాల గురించి అడగండి. సమాధానాలు అధికారిక ప్రభుత్వ వెబ్‌సైట్ల నుండి మాత్రమే వస్తాయి.',
        })}
      >
        {L({ en: 'Ask Sahay', hi: 'सहाय से पूछें', ta: 'சஹாயிடம் கேளுங்கள்', kn: 'ಸಹಾಯ್‌ಗೆ ಕೇಳಿ', ml: 'സഹായ്‌യോട് ചോദിക്കൂ', te: 'సహాయ్‌ని అడగండి' })}
      </Title>

      <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="space-y-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className={inputCls}
          maxLength={500}
          placeholder={L({ en: 'Type your question', hi: 'अपना सवाल लिखें', ta: 'உங்கள் கேள்வியை எழுதுங்கள்', kn: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಬರೆಯಿರಿ', ml: 'നിങ്ങളുടെ ചോദ്യം എഴുതൂ', te: 'మీ ప్రశ్నను టైప్ చేయండి' })}
          aria-label={L({ en: 'Your question', hi: 'आपका सवाल', ta: 'உங்கள் கேள்வி', kn: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ', ml: 'നിങ്ങളുടെ ചോദ്യം', te: 'మీ ప్రశ్న' })}
        />
        <div className="grid grid-cols-2 gap-3">
          <BigButton variant="secondary" onClick={speak} icon={listening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}>
            {listening ? L({ en: 'Stop', hi: 'रोकें', ta: 'நிறுத்து', kn: 'ನಿಲ್ಲಿಸಿ', ml: 'നിർത്തൂ', te: 'ఆపండి' }) : L({ en: 'Speak', hi: 'बोलें', ta: 'பேசுங்கள்', kn: 'ಮಾತನಾಡಿ', ml: 'സംസാരിക്കൂ', te: 'మాట్లాడండి' })}
          </BigButton>
          <BigButton type="submit" disabled={!question.trim()} busy={loading} icon={<Search className="w-7 h-7" />}>
            {L({ en: 'Ask', hi: 'पूछें', ta: 'கேள்', kn: 'ಕೇಳಿ', ml: 'ചോദിക്കൂ', te: 'అడగండి' })}
          </BigButton>
        </div>
      </form>

      {items.length === 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xl font-bold text-slate-900">{L({ en: 'Or tap a question', hi: 'या कोई सवाल चुनें', ta: 'அல்லது ஒரு கேள்வியைத் தொடுங்கள்', kn: 'ಅಥವಾ ಒಂದು ಪ್ರಶ್ನೆಯನ್ನು ಒತ್ತಿ', ml: 'അല്ലെങ്കിൽ ഒരു ചോദ്യം തൊടൂ', te: 'లేదా ఒక ప్రశ్నను ఎంచుకోండి' })}</p>
          {STARTERS.map((s) => (
            <button
              key={s.en}
              onClick={() => ask(L(s))}
              className="w-full min-h-16 rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-left text-xl font-semibold text-slate-900 active:bg-teal-50"
            >
              {L(s)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {items.map((item) => {
          const a = item.answer;
          const urgent = a?.emergency;
          return (
            <Card key={item.id} tone={urgent ? 'red' : 'plain'}>
              <p className="text-lg font-bold text-slate-700">{item.question}</p>
              {!a && !item.failed && <Spinner label={L({ en: 'Checking official government websites…', hi: 'सरकारी वेबसाइटें देख रहे हैं…', ta: 'அரசு இணையதளங்களைப் பார்க்கிறோம்…', kn: 'ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್‌ಗಳನ್ನು ನೋಡುತ್ತಿದ್ದೇವೆ…', ml: 'സർക്കാർ വെബ്‌സൈറ്റുകൾ നോക്കുന്നു…', te: 'అధికారిక ప్రభుత్వ వెబ్‌సైట్‌లను చూస్తున్నాము…' })} />}
              {item.failed && (
                <div className="mt-3">
                  <Notice tone="error">
                    {L({ en: 'Could not reach Sahay. Check your internet and try again.', hi: 'सहाय से संपर्क नहीं हो सका। इंटरनेट देखें और फिर कोशिश करें।', ta: 'சஹாயை அடைய முடியவில்லை. இணையத்தைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', kn: 'ಸಹಾಯ್ ಅನ್ನು ತಲುಪಲು ಆಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', ml: 'സഹായ് നെ ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ഇന്റർനെറ്റ് നോക്കി വീണ്ടും ശ്രമിക്കൂ.', te: 'సహాయ్‌ని సంప్రదించలేకపోయాము. ఇంటర్నెట్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.' })}
                  </Notice>
                </div>
              )}
              {a && (
                <div className="mt-3 space-y-4">
                  <p className={`text-[22px] leading-relaxed font-semibold ${urgent ? 'text-red-950' : 'text-slate-900'}`}>{a.reply}</p>

                  {urgent && (
                    <div className="space-y-3">
                      {contacts?.emergency && (
                        <BigButton variant="danger" href={`tel:${contacts.emergency}`} icon={<PhoneCall className="w-7 h-7" />}>
                          {L({ en: 'Call emergency help', hi: 'आपातकालीन मदद बुलाएँ', ta: 'அவசர உதவிக்கு அழைக்கவும்', kn: 'ತುರ್ತು ಸಹಾಯಕ್ಕೆ ಕರೆ ಮಾಡಿ', ml: 'അടിയന്തര സഹായത്തിന് വിളിക്കൂ', te: 'అత్యవసర సహాయానికి కాల్ చేయండి' })}
                        </BigButton>
                      )}
                      <BigButton variant="danger" href="tel:108" icon={<PhoneCall className="w-7 h-7" />}>
                        {L({ en: 'Call 108 ambulance', hi: '108 एम्बुलेंस बुलाएँ', ta: '108 ஆம்புலன்ஸ் அழைக்கவும்', kn: '108 ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕರೆ ಮಾಡಿ', ml: '108 ആംബുലൻസ് വിളിക്കൂ', te: '108 అంబులెన్స్‌కు కాల్ చేయండి' })}
                      </BigButton>
                    </div>
                  )}

                  {a.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-slate-800">{L({ en: 'Official source', hi: 'आधिकारिक स्रोत', ta: 'அதிகாரப்பூர்வ ஆதாரம்', kn: 'ಅಧಿಕೃತ ಮೂಲ', ml: 'ഔദ്യോഗിക ഉറവിടം', te: 'అధికారిక మూలం' })}</p>
                      {a.sources.slice(0, 2).map((s, i) =>
                        s.url ? (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                             className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-teal-700 px-4 py-2 text-lg font-bold text-teal-900 [overflow-wrap:anywhere]">
                            <span>
                              <span className="block">{s.label}</span>
                              {s.host && <span className="block text-base font-semibold text-slate-700">{s.host}</span>}
                            </span>
                            <ExternalLink className="w-6 h-6 shrink-0" aria-hidden />
                          </a>
                        ) : (
                          <p key={i} className="text-lg text-slate-800">{s.label}</p>
                        )
                      )}
                    </div>
                  )}

                  {!urgent && a.sources.length === 0 && a.recommendedHospital && (
                    <div className="rounded-2xl bg-slate-100 p-4 space-y-3">
                      <p className="text-lg font-bold text-slate-900">{L({ en: 'Nearest government hospital', hi: 'नज़दीकी सरकारी अस्पताल', ta: 'அருகிலுள்ள அரசு மருத்துவமனை', kn: 'ಹತ್ತಿರದ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ', ml: 'അടുത്തുള്ള സർക്കാർ ആശുപത്രി', te: 'సమీప ప్రభుత్వ ఆసుపత్రి' })}</p>
                      <p className="text-xl font-semibold">{a.recommendedHospital.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <BigButton small onClick={() => onSelectHospitalForBooking(a.recommendedHospital!)}>{L({ en: 'Book a visit', hi: 'समय लें', ta: 'நேரம் பதிவு', kn: 'ಸಮಯ ಕಾಯ್ದಿರಿಸಿ', ml: 'സമയം ബുക്ക് ചെയ്യൂ', te: 'సమయాన్ని బుక్ చేయండి' })}</BigButton>
                        {contacts?.hospital_call && (
                          <BigButton small variant="secondary" href={`tel:${contacts.hospital_call}`}>{L({ en: 'Call', hi: 'कॉल', ta: 'அழை', kn: 'ಕರೆ', ml: 'വിളിക്കൂ', te: 'కాల్ చేయండి' })}</BigButton>
                        )}
                      </div>
                    </div>
                  )}

                  <BigButton
                    variant="soft" small onClick={() => listen(item)}
                    icon={speakingId === item.id ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  >
                    {speakingId === item.id ? L({ en: 'Stop reading', hi: 'पढ़ना रोकें', ta: 'படிப்பதை நிறுத்து', kn: 'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ', ml: 'വായന നിർത്തൂ', te: 'చదవడం ఆపండి' }) : L({ en: 'Read it to me', hi: 'मुझे पढ़कर सुनाएँ', ta: 'படித்துக் காட்டு', kn: 'ನನಗೆ ಓದಿ ಹೇಳಿ', ml: 'എനിക്ക് വായിച്ചു കേൾപ്പിക്കൂ', te: 'నాకు చదివి వినిపించండి' })}
                  </BigButton>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-lg text-slate-700">
        {L({ en: 'Sahay does not give medical advice or diagnose.', hi: 'सहाय चिकित्सा सलाह या निदान नहीं देता।', ta: 'சஹாய் மருத்துவ ஆலோசனை அல்லது நோய் கண்டறிதல் வழங்காது.', kn: 'ಸಹಾಯ್ ವೈದ್ಯಕೀಯ ಸಲಹೆ ಅಥವಾ ರೋಗನಿರ್ಣಯ ನೀಡುವುದಿಲ್ಲ.', ml: 'സഹായ് വൈദ്യോപദേശമോ രോഗനിർണയമോ നൽകില്ല.', te: 'సహాయ్ వైద్య సలహా లేదా వ్యాధి నిర్ధారణ ఇవ్వదు.' })}{' '}
        <button onClick={onOpenEmergency} className="font-bold text-red-800 underline underline-offset-4">
          {L({ en: 'Emergency? Tap here.', hi: 'आपातकाल? यहाँ दबाएँ।', ta: 'அவசரமா? இங்கே தொடுங்கள்.', kn: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯೇ? ಇಲ್ಲಿ ಒತ್ತಿ.', ml: 'അടിയന്തരമാണോ? ഇവിടെ തൊടൂ.', te: 'అత్యవసరమా? ఇక్కడ నొక్కండి.' })}
        </button>
      </p>
    </div>
  );
};
