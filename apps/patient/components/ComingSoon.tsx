import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useApp } from '../lib/app-state';
import type { Key } from '../lib/i18n';
import { color } from '../lib/theme';
import { Body, Btn, Screen, Title } from './ui';

export default function ComingSoon({ titleKey }: { titleKey: Key }) {
  const { t } = useApp();
  return (
    <Screen>
      <View style={{ gap: 16, marginTop: 24 }}>
        <Ionicons name="construct-outline" size={56} color={color.teal} />
        <Title>{t(titleKey)}</Title>
        <Body muted>{t('soon.title')}. {t('soon.body')}</Body>
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Btn label={t('soon.home')} onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}
