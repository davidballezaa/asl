import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { translations, type Translations } from '@/lib/i18n';

type LangContextValue = {
  i18n: Translations;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ i18n: translations }), []);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within LangProvider');
  }
  return context;
}
