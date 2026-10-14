import React, { useRef, useState } from 'react';
import { BellPlus, Camera, Search } from 'lucide-react';
import { Language } from '../types';
import { MedicineItem, MedicineScan, MedicineSearch, patientApi } from '../services/patientApi';
import { ReminderSheet } from '../components/ReminderSheet';
import { BigButton, Card, Field, Notice, Spinner, Title, inputCls, pick, rupees } from '../components/ui';

interface MedicinesViewProps {
  currentLang: Language;
}

/** Shrink a phone photo before upload: label text stays readable at 1400 px and the file stays small. */
async function photoToJpeg(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const el = new Image();
      el.onload = () => ok(el);
      el.onerror = () => fail(new Error('image'));
      el.src = url;
    });
    const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const PriceCompare: React.FC<{ item: MedicineItem; lang: Language }> = ({ item, lang }) => {
  const L = (o: { en: string; hi: string; ta: string }) => pick(lang, o);
  const jan = item.jan_aushadhi;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-slate-300 p-3">
          <p className="text-base font-bold text-slate-700">{L({ en: 'Your medicine', hi: 'आपकी दवा', ta: 'உங்கள் மருந்து' })}</p>
          <p className="text-3xl font-extrabold text-slate-900">{item.price_rs !== null ? rupees(item.price_rs) : '—'}</p>
          {item.pack && <p className="text-base text-slate-700">{item.pack}</p>}
        </div>
        <div className={`rounded-2xl border-2 p-3 ${jan ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>
          <p className="text-base font-bold text-slate-700">Jan Aushadhi</p>
          <p className="text-3xl font-extrabold text-emerald-900">{jan ? rupees(jan.price_rs) : '—'}</p>
          {jan?.pack && <p className="text-base text-slate-700">{jan.pack}</p>}
        </div>
      </div>
      {jan?.saving_percent ? (
        <p className="rounded-2xl bg-emerald-700 px-4 py-3 text-center text-2xl font-extrabold text-white">
          {L({ en: `You save about ${jan.saving_percent}%`, hi: `लगभग ${jan.saving_percent}% बचत`, ta: `சுமார் ${jan.saving_percent}% சேமிப்பு` })}
        </p>
      ) : jan ? (
        <p className="text-lg font-semibold text-slate-800">{L({ en: 'A Jan Aushadhi medicine with the same contents exists.', hi: 'वही सामग्री वाली जन औषधि दवा उपलब्ध है।', ta: 'அதே உள்ளடக்கமுள்ள ஜன் ஔஷதி மருந்து உள்ளது.' })}</p>
      ) : (
        <Notice tone="info">{L({ en: 'No Jan Aushadhi medicine with exactly the same contents was found. Ask your pharmacist.', hi: 'ठीक वही सामग्री वाली जन औषधि दवा नहीं मिली। अपने फार्मासिस्ट से पूछें।', ta: 'அதே உள்ளடக்கமுள்ள ஜன் ஔஷதி மருந்து கிடைக்கவில்லை. மருந்தாளரிடம் கேளுங்கள்.' })}</Notice>
      )}
    </div>
  );
};

export const MedicinesView: React.FC<MedicinesViewProps> = ({ currentLang }) => {
  const L = (o: { en: string; hi: string; ta: string }) => pick(currentLang, o);
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<MedicineScan | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [results, setResults] = useState<MedicineSearch | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [remindFor, setRemindFor] = useState<string | null>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setScan(null);
    setResults(null);
    setScanning(true);
    try {
      const jpeg = await photoToJpeg(file);
      setPhoto(jpeg);
      setScan(await patientApi.scanMedicine(jpeg));
    } catch (err) {
      setError(err instanceof Error ? err.message : L({ en: 'Could not read the photo.', hi: 'फ़ोटो पढ़ी नहीं जा सकी।', ta: 'புகைப்படத்தைப் படிக்க முடியவில்லை.' }));
    } finally {
      setScanning(false);
    }
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setError('');
    setScan(null);
    setPhoto(null);
    setSearching(true);
    try {
      setResults(await patientApi.searchMedicines(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const item = scan?.matches[0];

  return (
    <div>
      <Title
        sub={L({
          en: 'Scan a medicine label or type its name to see its price and the cheaper Jan Aushadhi medicine.',
          hi: 'दवा का लेबल स्कैन करें या नाम लिखें। कीमत और सस्ती जन औषधि दवा देखें।',
          ta: 'மருந்தின் லேபிளை ஸ்கேன் செய்யுங்கள் அல்லது பெயரை எழுதுங்கள். விலையையும் மலிவான ஜன் ஔஷதி மருந்தையும் பாருங்கள்.',
        })}
      >
        {L({ en: 'Medicines', hi: 'दवाएँ', ta: 'மருந்துகள்' })}
      </Title>

      <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} aria-hidden tabIndex={-1} />
      <BigButton onClick={() => fileInput.current?.click()} busy={scanning} icon={<Camera className="w-8 h-8" />}>
        {L({ en: 'Scan medicine label', hi: 'दवा का लेबल स्कैन करें', ta: 'மருந்து லேபிளை ஸ்கேன் செய்' })}
      </BigButton>

      <form onSubmit={search} className="mt-6 space-y-3">
        <Field label={L({ en: 'Or type the medicine name', hi: 'या दवा का नाम लिखें', ta: 'அல்லது மருந்தின் பெயரை எழுதுங்கள்' })}>
          <input className={inputCls} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Calpol, Metformin…" maxLength={80} />
        </Field>
        <BigButton type="submit" variant="secondary" busy={searching} disabled={query.trim().length < 2} icon={<Search className="w-7 h-7" />}>
          {L({ en: 'Search', hi: 'खोजें', ta: 'தேடு' })}
        </BigButton>
      </form>

      {error && <div className="mt-5"><Notice tone="error">{error}</Notice></div>}
      {scanning && <Spinner label={L({ en: 'Reading your label…', hi: 'लेबल पढ़ रहे हैं…', ta: 'லேபிளைப் படிக்கிறோம்…' })} />}

      {scan && (
        <div className="mt-6 space-y-4">
          {photo && <img src={photo} alt="" className="max-h-40 w-full rounded-2xl border-2 border-slate-300 object-contain bg-slate-100" />}
          {scan.status === 'unreadable' && (
            <Notice tone="warn">
              {L({
                en: 'We could not read a medicine label in this photo. Hold the strip flat in good light, close enough to read the name, then try again. You can also type the name above.',
                hi: 'इस फ़ोटो में दवा का लेबल पढ़ा नहीं जा सका। पट्टी को रोशनी में सीधा पकड़ें, नाम पढ़ने लायक पास से फ़ोटो लें। आप ऊपर नाम भी लिख सकते हैं।',
                ta: 'இந்தப் படத்தில் மருந்து லேபிளைப் படிக்க முடியவில்லை. நல்ல வெளிச்சத்தில் பெயர் தெரியும்படி அருகில் எடுத்து மீண்டும் முயற்சிக்கவும். மேலே பெயரையும் எழுதலாம்.',
              })}
            </Notice>
          )}
          {scan.status === 'brand_only' && (
            <Notice tone="warn">
              {L({
                en: `We read the name "${scan.read.brand ?? ''}" but not what it contains, so we cannot compare prices. Photograph the side that lists the contents, or type the name above.`,
                hi: `हमने नाम "${scan.read.brand ?? ''}" पढ़ा, पर सामग्री नहीं पढ़ी, इसलिए कीमत की तुलना नहीं हो सकती। सामग्री वाली तरफ़ की फ़ोटो लें या ऊपर नाम लिखें।`,
                ta: `"${scan.read.brand ?? ''}" என்ற பெயரைப் படித்தோம், ஆனால் உள்ளடக்கம் தெரியவில்லை. உள்ளடக்கம் உள்ள பக்கத்தைப் படம் எடுக்கவும் அல்லது பெயரை எழுதவும்.`,
              })}
            </Notice>
          )}
          {item && (
            <Card>
              <p className="text-base font-bold text-slate-600">{L({ en: 'We read this on your label', hi: 'आपके लेबल पर यह लिखा है', ta: 'உங்கள் லேபிளில் இது உள்ளது' })}</p>
              <p className="text-2xl font-extrabold text-slate-900">{item.brand ?? scan.read.composition}</p>
              {item.composition && <p className="text-xl text-slate-800">{L({ en: 'Contains', hi: 'सामग्री', ta: 'உள்ளடக்கம்' })}: {item.composition}</p>}
              {item.manufacturer && <p className="text-lg text-slate-700">{item.manufacturer}</p>}
              <div className="mt-4"><PriceCompare item={item} lang={currentLang} /></div>
              {item.price_from === 'dataset' && (
                <p className="mt-3 text-base text-slate-700">
                  {L({ en: 'Your label showed no price, so this brand price is from a public dataset and may be old.', hi: 'लेबल पर कीमत नहीं दिखी, इसलिए यह ब्रांड की कीमत सार्वजनिक डेटा से है और पुरानी हो सकती है।', ta: 'லேபிளில் விலை தெரியவில்லை; இந்த விலை பொது தரவிலிருந்து வந்தது, பழையதாக இருக்கலாம்.' })}
                </p>
              )}
              <div className="mt-4">
                <BigButton variant="soft" small icon={<BellPlus className="w-6 h-6" />} onClick={() => setRemindFor(item.brand ?? item.composition ?? '')}>
                  {L({ en: 'Remind me to take it', hi: 'दवा लेने की याद दिलाएँ', ta: 'மருந்து சாப்பிட நினைவூட்டு' })}
                </BigButton>
              </div>
            </Card>
          )}
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-4">
          {results.brands.length === 0 && results.generics.length === 0 && (
            <Notice tone="info">{L({ en: 'No medicine found with that name. Check the spelling.', hi: 'इस नाम की कोई दवा नहीं मिली। वर्तनी जाँचें।', ta: 'அந்தப் பெயரில் மருந்து கிடைக்கவில்லை. எழுத்துப்பிழையைச் சரிபார்க்கவும்.' })}</Notice>
          )}
          {results.brands.map((b) => (
            <Card key={b.id}>
              <p className="text-2xl font-extrabold text-slate-900">{b.brand}</p>
              {b.composition && <p className="text-xl text-slate-800">{b.composition}</p>}
              {b.manufacturer && <p className="text-base text-slate-600">{b.manufacturer}</p>}
              <div className="mt-3"><PriceCompare item={b} lang={currentLang} /></div>
              <div className="mt-3">
                <BigButton variant="soft" small icon={<BellPlus className="w-6 h-6" />} onClick={() => setRemindFor(b.brand ?? '')}>
                  {L({ en: 'Remind me', hi: 'याद दिलाएँ', ta: 'நினைவூட்டு' })}
                </BigButton>
              </div>
            </Card>
          ))}
          {results.generics.length > 0 && (
            <Card tone="teal">
              <p className="mb-2 text-xl font-extrabold text-teal-950">{L({ en: 'Jan Aushadhi medicines', hi: 'जन औषधि दवाएँ', ta: 'ஜன் ஔஷதி மருந்துகள்' })}</p>
              <ul className="space-y-3">
                {results.generics.map((g) => (
                  <li key={g.name} className="flex items-start justify-between gap-3 text-lg">
                    <span className="font-semibold text-slate-900">{g.name}{g.pack ? ` · ${g.pack}` : ''}</span>
                    <span className="shrink-0 font-extrabold text-emerald-900">{rupees(g.price_rs)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <p className="text-base text-slate-700">{results.note}</p>
        </div>
      )}

      <p className="mt-8 text-lg font-semibold text-slate-800">
        {L({ en: 'Always confirm with your doctor or pharmacist before changing a medicine.', hi: 'दवा बदलने से पहले हमेशा अपने डॉक्टर या फार्मासिस्ट से पूछें।', ta: 'மருந்தை மாற்றும் முன் எப்போதும் மருத்துவர் அல்லது மருந்தாளரிடம் உறுதிசெய்யுங்கள்.' })}
      </p>

      {remindFor !== null && <ReminderSheet lang={currentLang} medicineName={remindFor} onClose={() => setRemindFor(null)} />}
    </div>
  );
};
