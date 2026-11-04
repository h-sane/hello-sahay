import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Language } from '../types';
import { backgroundLocation } from '../services/backgroundLocation';
import { BigButton, Card, Notice, Sheet, pick } from './ui';

type Status = { foreground: boolean; background: boolean; enabled: boolean };
type Words = { en: string; hi: string; ta: string; kn: string; ml: string; te: string };

const CLOSE: Words = { en: 'Close', hi: 'बंद करें', ta: 'மூடு', kn: 'ಮುಚ್ಚಿ', ml: 'അടയ്ക്കുക', te: 'మూసివేయి' };

/** Asks once, in plain words, before Android's own permission screens appear. */
export const LocationSharingSheet: React.FC<{ lang: Language; phone: string; onClose: () => void }> = ({ lang, phone, onClose }) => {
  const L = (o: Words) => pick(lang, o);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Status | null>(null);

  const allow = async () => {
    setBusy(true);
    try {
      const s = await backgroundLocation.enable(phone);
      if (s.foreground && s.background) onClose(); else setResult(s);
    } catch {
      setResult({ foreground: false, background: false, enabled: false });
    } finally {
      setBusy(false);
    }
  };

  const notNow = () => {
    backgroundLocation.declined();
    onClose();
  };

  return (
    <Sheet
      title={L({ en: 'Let the helpline find you?', hi: 'हेल्पलाइन को आपकी लोकेशन मिलने दें?', ta: 'உதவி எண் உங்களைக் கண்டறியட்டுமா?', kn: 'ಸಹಾಯವಾಣಿ ನಿಮ್ಮನ್ನು ಪತ್ತೆ ಹಚ್ಚಲಿ?', ml: 'ഹെൽപ്‌ലൈൻ നിങ്ങളെ കണ്ടെത്തട്ടെ?', te: 'హెల్ప్‌లైన్ మిమ్మల్ని కనుగొనవచ్చా?' })}
      closeLabel={L(CLOSE)}
      onClose={notNow}
    >
      <div className="space-y-4">
        <p className="text-xl text-slate-900">
          {L({
            en: 'When you call us, we then know where you are and do not need to ask. Your location is sent about every 30 minutes, even when the app is closed.',
            hi: 'जब आप हमें फ़ोन करेंगे, हमें पहले से पता होगा कि आप कहाँ हैं। आपकी लोकेशन लगभग हर 30 मिनट में भेजी जाती है, ऐप बंद होने पर भी।',
            ta: 'நீங்கள் அழைக்கும்போது நீங்கள் எங்கே இருக்கிறீர்கள் என்று எங்களுக்கு ஏற்கனவே தெரியும். ஆப் மூடியிருந்தாலும் உங்கள் இருப்பிடம் சுமார் 30 நிமிடத்திற்கு ஒருமுறை அனுப்பப்படும்.',
            kn: 'ನೀವು ಕರೆ ಮಾಡಿದಾಗ ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ನಮಗೆ ಮೊದಲೇ ತಿಳಿದಿರುತ್ತದೆ. ಆ್ಯಪ್ ಮುಚ್ಚಿದ್ದರೂ ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಸುಮಾರು ಪ್ರತಿ 30 ನಿಮಿಷಕ್ಕೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
            ml: 'നിങ്ങൾ വിളിക്കുമ്പോൾ നിങ്ങൾ എവിടെയാണെന്ന് ഞങ്ങൾക്ക് മുൻകൂട്ടി അറിയാം. ആപ്പ് അടച്ചിരുന്നാലും നിങ്ങളുടെ സ്ഥലം ഏകദേശം 30 മിനിറ്റിൽ ഒരിക്കൽ അയയ്ക്കും.',
            te: 'మీరు కాల్ చేసినప్పుడు మీరు ఎక్కడ ఉన్నారో మాకు ముందే తెలుస్తుంది. యాప్ మూసివేసి ఉన్నా మీ స్థానం సుమారు ప్రతి 30 నిమిషాలకు పంపబడుతుంది.',
          })}
        </p>
        <p className="text-lg text-slate-700">
          {L({
            en: 'It is used only to find hospitals near you and is not shared with anyone else. You can turn it off in My Health, under More.',
            hi: 'इसका उपयोग सिर्फ़ आपके पास के अस्पताल खोजने के लिए होता है, किसी और को नहीं दिया जाता। आप इसे मेरा स्वास्थ्य में "और" के अंदर बंद कर सकते हैं।',
            ta: 'இது உங்களுக்கு அருகிலுள்ள மருத்துவமனைகளைக் கண்டறிய மட்டுமே பயன்படும்; வேறு யாருடனும் பகிரப்படாது. என் ஆரோக்கியம் > மேலும் என்பதில் இதை நிறுத்தலாம்.',
            kn: 'ಇದನ್ನು ನಿಮ್ಮ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಲು ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ, ಬೇರೆ ಯಾರಿಗೂ ನೀಡುವುದಿಲ್ಲ. ನನ್ನ ಆರೋಗ್ಯ > ಇನ್ನಷ್ಟು ಇಲ್ಲಿ ಆರಿಸಿ ನಿಲ್ಲಿಸಬಹುದು.',
            ml: 'ഇത് നിങ്ങൾക്ക് അടുത്തുള്ള ആശുപത്രികൾ കണ്ടെത്താൻ മാത്രമാണ് ഉപയോഗിക്കുന്നത്, മറ്റാരുമായും പങ്കിടില്ല. എന്റെ ആരോഗ്യം > കൂടുതൽ എന്നതിൽ ഇത് ഓഫ് ചെയ്യാം.',
            te: 'ఇది మీకు దగ్గరలోని ఆసుపత్రులను కనుగొనడానికి మాత్రమే ఉపయోగిస్తారు, ఇతరులకు ఇవ్వరు. నా ఆరోగ్యం > మరిన్ని లో దీన్ని ఆపవచ్చు.',
          })}
        </p>
        <Notice tone="info">
          {L({
            en: 'Your phone will ask next. Choose "Allow all the time" so it works when the app is closed.',
            hi: 'अब आपका फ़ोन पूछेगा। ऐप बंद होने पर भी काम करने के लिए "हमेशा अनुमति दें" चुनें।',
            ta: 'அடுத்து உங்கள் போன் கேட்கும். ஆப் மூடியிருக்கும்போதும் வேலை செய்ய "எப்போதும் அனுமதி" என்பதைத் தேர்ந்தெடுங்கள்.',
            kn: 'ಮುಂದೆ ನಿಮ್ಮ ಫೋನ್ ಕೇಳುತ್ತದೆ. ಆ್ಯಪ್ ಮುಚ್ಚಿದ್ದಾಗಲೂ ಕೆಲಸ ಮಾಡಲು "ಯಾವಾಗಲೂ ಅನುಮತಿಸಿ" ಆರಿಸಿ.',
            ml: 'അടുത്തതായി ഫോൺ ചോദിക്കും. ആപ്പ് അടച്ചിരിക്കുമ്പോഴും പ്രവർത്തിക്കാൻ "എപ്പോഴും അനുവദിക്കുക" തിരഞ്ഞെടുക്കുക.',
            te: 'తర్వాత మీ ఫోన్ అడుగుతుంది. యాప్ మూసివేసినప్పుడు కూడా పని చేయడానికి "ఎల్లప్పుడూ అనుమతించు" ఎంచుకోండి.',
          })}
        </Notice>
        {result && (
          <Notice tone="warn">
            {result.foreground
              ? L({
                  en: 'Location only works while the app is open. Open your phone Settings, Apps, Hello Sahay, Permissions, Location, and choose "Allow all the time".',
                  hi: 'लोकेशन सिर्फ़ ऐप खुला होने पर काम करेगी। फ़ोन की सेटिंग्स, ऐप्स, Hello Sahay, अनुमतियाँ, लोकेशन में "हमेशा अनुमति दें" चुनें।',
                  ta: 'ஆப் திறந்திருக்கும்போது மட்டுமே இருப்பிடம் வேலை செய்யும். போன் அமைப்புகள், ஆப்ஸ், Hello Sahay, அனுமதிகள், இருப்பிடம் என்பதில் "எப்போதும் அனுமதி" என்பதைத் தேர்ந்தெடுங்கள்.',
                  kn: 'ಆ್ಯಪ್ ತೆರೆದಿರುವಾಗ ಮಾತ್ರ ಸ್ಥಳ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ಫೋನ್ ಸೆಟ್ಟಿಂಗ್ಸ್, ಆ್ಯಪ್ಸ್, Hello Sahay, ಅನುಮತಿಗಳು, ಸ್ಥಳದಲ್ಲಿ "ಯಾವಾಗಲೂ ಅನುಮತಿಸಿ" ಆರಿಸಿ.',
                  ml: 'ആപ്പ് തുറന്നിരിക്കുമ്പോൾ മാത്രമേ ലൊക്കേഷൻ പ്രവർത്തിക്കൂ. ഫോൺ സെറ്റിംഗ്സ്, ആപ്പ്സ്, Hello Sahay, അനുമതികൾ, ലൊക്കേഷൻ എന്നിവയിൽ "എപ്പോഴും അനുവദിക്കുക" തിരഞ്ഞെടുക്കുക.',
                  te: 'యాప్ తెరిచి ఉన్నప్పుడు మాత్రమే స్థానం పని చేస్తుంది. ఫోన్ సెట్టింగ్స్, యాప్స్, Hello Sahay, అనుమతులు, స్థానం లో "ఎల్లప్పుడూ అనుమతించు" ఎంచుకోండి.',
                })
              : L({
                  en: 'Location was not allowed, so the helpline will ask you where you are.',
                  hi: 'लोकेशन की अनुमति नहीं मिली, इसलिए हेल्पलाइन आपसे पूछेगी कि आप कहाँ हैं।',
                  ta: 'இருப்பிட அனுமதி கிடைக்கவில்லை, எனவே நீங்கள் எங்கே இருக்கிறீர்கள் என்று உதவி எண் கேட்கும்.',
                  kn: 'ಸ್ಥಳದ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ, ಆದ್ದರಿಂದ ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ಸಹಾಯವಾಣಿ ಕೇಳುತ್ತದೆ.',
                  ml: 'ലൊക്കേഷൻ അനുമതി കിട്ടിയില്ല, അതിനാൽ നിങ്ങൾ എവിടെയാണെന്ന് ഹെൽപ്‌ലൈൻ ചോദിക്കും.',
                  te: 'స్థాన అనుమతి లభించలేదు, కాబట్టి మీరు ఎక్కడ ఉన్నారో హెల్ప్‌లైన్ అడుగుతుంది.',
                })}
          </Notice>
        )}
        {result ? (
          <BigButton onClick={onClose}>{L({ en: 'OK', hi: 'ठीक है', ta: 'சரி', kn: 'ಸರಿ', ml: 'ശരി', te: 'సరే' })}</BigButton>
        ) : (
          <>
            <BigButton onClick={allow} busy={busy} icon={<MapPin className="w-7 h-7" />}>
              {L({ en: 'Allow', hi: 'अनुमति दें', ta: 'அனுமதி', kn: 'ಅನುಮತಿಸಿ', ml: 'അനുവദിക്കുക', te: 'అనుమతించు' })}
            </BigButton>
            <BigButton variant="secondary" onClick={notNow}>
              {L({ en: 'Not now', hi: 'अभी नहीं', ta: 'இப்போது வேண்டாம்', kn: 'ಈಗ ಬೇಡ', ml: 'ഇപ്പോൾ വേണ്ട', te: 'ఇప్పుడు వద్దు' })}
            </BigButton>
          </>
        )}
      </div>
    </Sheet>
  );
};

/** My Health, More: shows whether the phone is reporting its location and turns it on or off. */
export const LocationSharingCard: React.FC<{ lang: Language; phone?: string }> = ({ lang, phone }) => {
  const L = (o: Words) => pick(lang, o);
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const refresh = () => backgroundLocation.status().then(setStatus).catch(() => {});
  useEffect(() => { refresh(); }, []);
  if (!backgroundLocation.supported || !phone) return null;

  const on = !!status?.enabled && status.foreground;
  const full = on && status?.background;
  return (
    <Card>
      <p className="text-xl font-bold text-slate-900">
        {L({ en: 'Share my location with the helpline', hi: 'हेल्पलाइन के साथ मेरी लोकेशन साझा करें', ta: 'உதவி எண்ணுடன் என் இருப்பிடத்தைப் பகிர்', kn: 'ಸಹಾಯವಾಣಿಯೊಂದಿಗೆ ನನ್ನ ಸ್ಥಳ ಹಂಚಿ', ml: 'ഹെൽപ്‌ലൈനുമായി എന്റെ സ്ഥലം പങ്കിടുക', te: 'హెల్ప్‌లైన్‌తో నా స్థానాన్ని పంచుకోండి' })}
      </p>
      <p className="mt-1 mb-3 text-lg text-slate-700">
        {full
          ? L({ en: 'On. Sent about every 30 minutes, even when the app is closed.', hi: 'चालू। ऐप बंद होने पर भी लगभग हर 30 मिनट में भेजी जाती है।', ta: 'இயக்கத்தில். ஆப் மூடியிருந்தாலும் சுமார் 30 நிமிடத்திற்கு ஒருமுறை அனுப்பப்படும்.', kn: 'ಆನ್ ಆಗಿದೆ. ಆ್ಯಪ್ ಮುಚ್ಚಿದ್ದರೂ ಸುಮಾರು ಪ್ರತಿ 30 ನಿಮಿಷಕ್ಕೆ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.', ml: 'ഓൺ. ആപ്പ് അടച്ചിരുന്നാലും ഏകദേശം 30 മിനിറ്റിൽ ഒരിക്കൽ അയയ്ക്കും.', te: 'ఆన్‌లో ఉంది. యాప్ మూసివేసినా సుమారు ప్రతి 30 నిమిషాలకు పంపబడుతుంది.' })
          : on
            ? L({ en: 'On, but only while the app is open. In phone Settings choose "Allow all the time".', hi: 'चालू, पर सिर्फ़ ऐप खुला होने पर। फ़ोन सेटिंग्स में "हमेशा अनुमति दें" चुनें।', ta: 'இயக்கத்தில், ஆனால் ஆப் திறந்திருக்கும்போது மட்டும். போன் அமைப்புகளில் "எப்போதும் அனுமதி" என்பதைத் தேர்ந்தெடுங்கள்.', kn: 'ಆನ್ ಆಗಿದೆ, ಆದರೆ ಆ್ಯಪ್ ತೆರೆದಿರುವಾಗ ಮಾತ್ರ. ಫೋನ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ "ಯಾವಾಗಲೂ ಅನುಮತಿಸಿ" ಆರಿಸಿ.', ml: 'ഓൺ, പക്ഷേ ആപ്പ് തുറന്നിരിക്കുമ്പോൾ മാത്രം. ഫോൺ സെറ്റിംഗ്സിൽ "എപ്പോഴും അനുവദിക്കുക" തിരഞ്ഞെടുക്കുക.', te: 'ఆన్‌లో ఉంది, కానీ యాప్ తెరిచి ఉన్నప్పుడు మాత్రమే. ఫోన్ సెట్టింగ్స్‌లో "ఎల్లప్పుడూ అనుమతించు" ఎంచుకోండి.' })
            : L({ en: 'Off. The helpline will ask where you are when you call.', hi: 'बंद। फ़ोन करने पर हेल्पलाइन पूछेगी कि आप कहाँ हैं।', ta: 'அணைக்கப்பட்டுள்ளது. அழைக்கும்போது நீங்கள் எங்கே இருக்கிறீர்கள் என்று உதவி எண் கேட்கும்.', kn: 'ಆಫ್ ಆಗಿದೆ. ಕರೆ ಮಾಡಿದಾಗ ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ಸಹಾಯವಾಣಿ ಕೇಳುತ್ತದೆ.', ml: 'ഓഫ്. വിളിക്കുമ്പോൾ നിങ്ങൾ എവിടെയാണെന്ന് ഹെൽപ്‌ലൈൻ ചോദിക്കും.', te: 'ఆఫ్‌లో ఉంది. కాల్ చేసినప్పుడు మీరు ఎక్కడ ఉన్నారో హెల్ప్‌లైన్ అడుగుతుంది.' })}
      </p>
      {on ? (
        <BigButton variant="secondary" small onClick={() => backgroundLocation.disable().then(refresh)}>
          {L({ en: 'Turn off', hi: 'बंद करें', ta: 'அணை', kn: 'ಆಫ್ ಮಾಡಿ', ml: 'ഓഫ് ചെയ്യുക', te: 'ఆఫ్ చేయండి' })}
        </BigButton>
      ) : (
        <BigButton small onClick={() => setOpen(true)}>
          {L({ en: 'Turn on', hi: 'चालू करें', ta: 'இயக்கு', kn: 'ಆನ್ ಮಾಡಿ', ml: 'ഓൺ ചെയ്യുക', te: 'ఆన్ చేయండి' })}
        </BigButton>
      )}
      {open && <LocationSharingSheet lang={lang} phone={phone} onClose={() => { setOpen(false); refresh(); }} />}
    </Card>
  );
};
