import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Btn, ErrorBox, Screen, Title } from '../components/ui';
import { ApiError, requestOtp, verifyOtp } from '../lib/api';
import { useApp } from '../lib/app-state';
import type { Key } from '../lib/i18n';
import { color, font, radius } from '../lib/theme';

export default function Login() {
  const { t, login } = useApp();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Key | null>(null);

  const fail = (e: unknown, rejected: Key) =>
    setError(e instanceof ApiError ? (e.kind === 'network' ? 'err.network' : e.kind === 'rejected' ? rejected : 'err.server') : 'err.server');

  const sendCode = async () => {
    if (phone.length !== 10) return setError('login.err_phone');
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone);
      setCode('');
      setStep('code');
    } catch (e) {
      fail(e, 'login.err_phone');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) return setError('login.err_code');
    setError(null);
    setBusy(true);
    try {
      const { token } = await verifyOtp(phone, code);
      login(token);
      router.replace('/');
    } catch (e) {
      fail(e, 'login.err_wrong');
      setBusy(false);
    }
  };

  const digits = (v: string) => v.replace(/\D/g, '');

  return (
    <Screen>
      <Title>{t('login.title')}</Title>
      {step === 'phone' ? (
        <>
          <View style={{ gap: 8 }}>
            <Text style={s.label}>{t('login.phone_label')}</Text>
            <View style={s.field}>
              <Text style={s.prefix}>+91</Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={(v) => setPhone(digits(v).slice(-10))}
                placeholder={t('login.phone_hint')}
                placeholderTextColor={color.muted}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
                editable={!busy}
                onSubmitEditing={sendCode}
              />
            </View>
          </View>
          {error && <ErrorBox message={t(error)} />}
          <Btn label={busy ? t('login.sending') : t('login.send')} onPress={sendCode} loading={busy} />
        </>
      ) : (
        <>
          <Body>{t('login.code_label', { phone: `+91 ${phone}` })}</Body>
          <TextInput
            style={[s.field, s.code]}
            value={code}
            onChangeText={(v) => setCode(digits(v).slice(0, 6))}
            placeholder="------"
            placeholderTextColor={color.line}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!busy}
            onSubmitEditing={verify}
            textContentType="oneTimeCode"
          />
          <View style={s.hint}>
            <Text style={s.hintText}>{t('login.demo_hint')}</Text>
          </View>
          {error && <ErrorBox message={t(error)} />}
          <Btn label={busy ? t('login.verifying') : t('login.verify')} onPress={verify} loading={busy} />
          <Btn variant="secondary" label={t('login.resend')} onPress={sendCode} disabled={busy} />
          <Btn
            variant="link"
            label={t('login.change')}
            onPress={() => {
              setError(null);
              setStep('phone');
            }}
            disabled={busy}
          />
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: font.body, fontWeight: '700', color: color.ink },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.surface, borderWidth: 2, borderColor: color.teal, borderRadius: radius, paddingHorizontal: 16, minHeight: 68 },
  prefix: { fontSize: 26, fontWeight: '700', color: color.muted, marginRight: 10 },
  input: { flex: 1, fontSize: 26, fontWeight: '700', color: color.ink, paddingVertical: 12 },
  code: { fontSize: 34, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: color.ink },
  hint: { alignSelf: 'flex-start', backgroundColor: color.tealSoft, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  hintText: { fontSize: font.small, fontWeight: '700', color: color.teal },
});
