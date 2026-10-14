import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

export type Lang = 'ta' | 'hi' | 'en';
export type Key = keyof typeof en;

export const LANGS: Lang[] = ['ta', 'hi', 'en'];
const dict: Record<Lang, Record<string, string>> = { en, hi, ta };

export function t(lang: Lang, key: Key, vars?: Record<string, string>): string {
  let s = dict[lang][key] ?? en[key];
  for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
  return s;
}
