import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getTranslations,
  type Lang,
  type Translations,
} from '@/lib/i18n';

const LANG_KEY = '@aslquest/lang';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  i18n: Translations;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((value) => {
      if (value === 'es' || value === 'en') {
        setLangState(value);
      }
    });
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_KEY, next);
  }, []);

  const i18n = getTranslations(lang);

  const value = useMemo(
    () => ({ lang, setLang, i18n }),
    [lang, setLang, i18n],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within LangProvider');
  }
  return context;
}
