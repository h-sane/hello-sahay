import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '../components/ui';
import { useApp } from '../lib/app-state';
import type { Key } from '../lib/i18n';
import { color, font, radius } from '../lib/theme';

const TILES: { key: Key; icon: IconName; href: Href; solid?: boolean }[] = [
  { key: 'home.ask', icon: 'chatbubbles', href: '/chat', solid: true },
  { key: 'home.appointments', icon: 'calendar', href: '/appointments' },
  { key: 'home.medicines', icon: 'medkit', href: '/medicines' },
  { key: 'home.call', icon: 'call', href: '/call' },
];

export default function Home() {
  const { t, logout } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.greeting}>{t('home.greeting')}</Text>
        <View style={s.chips}>
          <Pressable style={s.chip} onPress={() => router.push('/language')} accessibilityRole="button" accessibilityLabel={t('home.language')}>
            <Ionicons name="language" size={22} color={color.teal} />
            <Text style={s.chipText}>{t('home.language')}</Text>
          </Pressable>
          <Pressable
            style={s.chip}
            onPress={() => {
              logout();
              router.replace('/');
            }}
            accessibilityRole="button"
            accessibilityLabel={t('home.logout')}
          >
            <Ionicons name="log-out-outline" size={22} color={color.teal} />
            <Text style={s.chipText}>{t('home.logout')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.grid}>
        {TILES.map((tile) => (
          <View key={tile.key} style={s.cell}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(tile.href)}
              android_ripple={{ color: '#00000022' }}
              style={({ pressed }) => [s.tile, tile.solid && s.tileSolid, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name={tile.icon} size={56} color={tile.solid ? color.white : color.teal} />
              <Text style={[s.tileText, tile.solid && { color: color.white }]}>{t(tile.key)}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={s.disclaimer}>{t('home.disclaimer')}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.call108')}
        onPress={() => Linking.openURL('tel:108')}
        android_ripple={{ color: '#00000033' }}
        style={({ pressed }) => [s.sos, { paddingBottom: 16 + insets.bottom }, pressed && { opacity: 0.9 }]}
      >
        <Ionicons name="call" size={30} color={color.white} />
        <Text style={s.sosText}>{t('home.call108')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  greeting: { fontSize: font.title + 4, fontWeight: '800', color: color.ink },
  chips: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 16, borderRadius: 999, backgroundColor: color.tealSoft },
  chipText: { fontSize: font.small + 1, fontWeight: '700', color: color.teal },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 14, alignContent: 'stretch' },
  cell: { width: '50%', height: '50%', padding: 6 },
  tile: { flex: 1, borderRadius: radius, backgroundColor: color.tealSoft, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 8 },
  tileSolid: { backgroundColor: color.teal },
  tileText: { fontSize: 22, fontWeight: '800', color: color.teal, textAlign: 'center', lineHeight: 30 },
  disclaimer: { fontSize: font.small, color: color.muted, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 12, lineHeight: 22 },
  sos: { flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: color.red, paddingTop: 16, minHeight: 72 },
  sosText: { fontSize: font.button + 1, fontWeight: '800', color: color.white },
});
