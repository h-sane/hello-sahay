import { Redirect } from 'expo-router';
import { useApp } from '../lib/app-state';

export default function Index() {
  const { lang, consented, token } = useApp();
  if (!lang) return <Redirect href="/language" />;
  if (!consented) return <Redirect href="/consent" />;
  if (!token) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
