import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, font, radius } from '../lib/theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[s.body, muted && { color: color.muted }]}>{children}</Text>;
}

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  loading?: boolean;
  disabled?: boolean;
};

export function Btn({ label, onPress, variant = 'primary', loading, disabled }: BtnProps) {
  const off = disabled || loading;
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={off}
      android_ripple={{ color: '#00000022' }}
      style={({ pressed }) => [
        s.btn,
        primary && s.btnPrimary,
        variant === 'secondary' && s.btnSecondary,
        variant === 'link' && s.btnLink,
        (pressed || off) && { opacity: off ? 0.6 : 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? color.white : color.teal} />
      ) : (
        <Text style={[s.btnText, !primary && { color: color.teal }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// Warning, not red: red is reserved for emergency.
export function ErrorBox({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <View style={s.error} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={26} color={color.warnInk} />
      <View style={{ flex: 1 }}>
        <Text style={s.errorText}>{message}</Text>
        {onRetry && (
          <Pressable onPress={onRetry} hitSlop={12}>
            <Text style={[s.errorText, { fontWeight: '700', textDecorationLine: 'underline', marginTop: 6 }]}>{retryLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export type IconName = ComponentProps<typeof Ionicons>['name'];

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { flexGrow: 1, padding: 24, gap: 20 },
  title: { fontSize: font.title, fontWeight: '800', color: color.ink, lineHeight: font.title * 1.3 },
  body: { fontSize: font.body, color: color.ink, lineHeight: font.body * 1.5 },
  btn: { minHeight: 60, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  btnPrimary: { backgroundColor: color.teal },
  btnSecondary: { backgroundColor: color.tealSoft },
  btnLink: { backgroundColor: 'transparent' },
  btnText: { fontSize: font.button, fontWeight: '700', color: color.white, textAlign: 'center' },
  error: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: color.warnBg, borderRadius: radius, padding: 16 },
  errorText: { fontSize: font.body, color: color.warnInk, lineHeight: font.body * 1.4 },
});
