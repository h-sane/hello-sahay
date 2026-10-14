import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGS, t as translate, type Key, type Lang } from './i18n';
import { getItem, setItem } from './storage';

type State = {
  ready: boolean;
  lang: Lang | null;
  consented: boolean;
  token: string | null;
  setLang: (l: Lang) => void;
  consent: () => void;
  login: (token: string) => void;
  logout: () => void;
  t: (key: Key, vars?: Record<string, string>) => string;
};

const Ctx = createContext<State | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<Lang | null>(null);
  const [consented, setConsented] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const l = await getItem('lang');
      setLangState(LANGS.find((x) => x === l) ?? null);
      setConsented((await getItem('consent')) === '1');
      setToken(await getItem('token'));
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setItem('lang', l);
  }, []);
  const consent = useCallback(() => {
    setConsented(true);
    setItem('consent', '1');
  }, []);
  const login = useCallback((tk: string) => {
    setToken(tk);
    setItem('token', tk);
  }, []);
  const logout = useCallback(() => {
    setToken(null);
    setItem('token', null);
  }, []);

  const value = useMemo<State>(
    () => ({
      ready,
      lang,
      consented,
      token,
      setLang,
      consent,
      login,
      logout,
      t: (key, vars) => translate(lang ?? 'en', key, vars),
    }),
    [ready, lang, consented, token, setLang, consent, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): State {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppStateProvider');
  return v;
}
