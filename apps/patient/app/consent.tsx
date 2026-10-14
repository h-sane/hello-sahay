import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Btn, Screen, Title } from '../components/ui';
import { useApp } from '../lib/app-state';
import type { Key } from '../lib/i18n';
import { color, font, radius } from '../lib/theme';

function Group({ title, items, icon, tint }: { title: string; items: string[]; icon: 'checkmark-circle' | 'close-circle'; tint: string }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {items.map((it) => (
        <View key={it} style={s.row}>
          <Ionicons name={icon} size={28} color={tint} />
          <Text style={s.rowText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Consent() {
  const { t, consent } = useApp();
  const items = (keys: Key[]) => keys.map((k) => t(k));

  return (
    <Screen>
      <Title>{t('consent.title')}</Title>
      <Body muted>{t('consent.intro')}</Body>
      <Group title={t('consent.store_title')} icon="checkmark-circle" tint={color.teal} items={items(['consent.store_1', 'consent.store_2', 'consent.store_3'])} />
      <Group title={t('consent.nostore_title')} icon="close-circle" tint={color.muted} items={items(['consent.nostore_1'])} />
      <Body>{t('consent.delete')}</Body>
      <View style={{ gap: 4, marginTop: 'auto' }}>
        <Btn
          label={t('consent.agree')}
          onPress={() => {
            consent();
            router.replace('/');
          }}
        />
        <Btn variant="link" label={t('common.back')} onPress={() => router.replace('/language')} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius, padding: 20, gap: 12, borderWidth: 1, borderColor: color.line },
  cardTitle: { fontSize: font.button, fontWeight: '800', color: color.ink },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowText: { flex: 1, fontSize: font.body, color: color.ink, lineHeight: font.body * 1.4 },
});
