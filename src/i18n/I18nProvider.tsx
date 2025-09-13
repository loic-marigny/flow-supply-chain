// src/i18n/I18nProvider.tsx
// Minimal i18n provider with EN/FR dictionaries and string interpolation.
import React, { createContext, useContext, useMemo, useState } from 'react';
import { en, fr } from './lang';
import { ru } from './ru';

// Local union type including Russian
type Lang = 'en' | 'fr' | 'ru';

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const DICTS: Record<Lang, Record<string, string>> = { en, fr, ru };

export const I18nProvider: React.FC<{ children: React.ReactNode; defaultLang?: Lang }> = ({ children, defaultLang = 'en' }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    return saved === 'fr' || saved === 'en' || saved === 'ru' ? saved : defaultLang;
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  };

  const t = useMemo(() => {
    const dict = DICTS[lang] ?? en;
    return (key: string, params?: Record<string, string | number>) => {
      let s = dict[key] ?? en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return s;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

