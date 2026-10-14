import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Btn, Screen } from '../components/ui';
import { useApp } from '../lib/app-state';
import { LANGS, t } from '../lib/i18n';
import { color, font, radius } from '../lib/theme';

export default function Language() {
  const { lang, consented, token, setLang, t: tr } = useApp();
  const setUp = !!lang && consented && !!token;

  const pick = (l: (typeof LANGS)[number]) => {
    setLang(l);
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        {LANGS.map((l) => (
          <Text key={l} style={s.heading}>
            {t(l, 'lang.title')}
          </Text>
        ))}
      </View>
      <View style={{ gap: 16 }}>
        {LANGS.map((l) => (
          <Pressable
            key={l}
            accessibilityRole="button"
            onPress={() => pick(l)}
            android_ripple={{ color: '#00000022' }}
            style={({ pressed }) => [s.option, l === lang && s.optionOn, pressed && { opacity: 0.85 }]}
          >
            <Text style={[s.optionText, l === lang && { color: color.white }]}>{t(l, 'lang.name')}</Text>
          </Pressable>
        ))}
      </View>
      {setUp && <Btn variant="link" label={tr('common.back')} onPress={() => router.replace('/home')} />}
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: color.ink, lineHeight: 32 },
  option: { minHeight: 88, borderRadius: radius, borderWidth: 2, borderColor: color.teal, backgroundColor: color.surface, justifyContent: 'center', alignItems: 'center' },
  optionOn: { backgroundColor: color.teal },
  optionText: { fontSize: font.title + 6, fontWeight: '800', color: color.teal, lineHeight: (font.title + 6) * 1.4 },
});
