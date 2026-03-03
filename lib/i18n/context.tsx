"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

const STORAGE_KEY = "maestro_fim_lang";
const DEFAULT_LANG: Lang = "es";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  tArray: (key: TranslationKey) => string[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "es" || stored === "en") {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (translations[lang] as any)[key];
      if (typeof val === "string") return val;
      // Fallback to Spanish
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallback = (translations["es"] as any)[key];
      if (typeof fallback === "string") return fallback;
      return key;
    },
    [lang]
  );

  const tArray = useCallback(
    (key: TranslationKey): string[] => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (translations[lang] as any)[key];
      if (Array.isArray(val)) return val as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallback = (translations["es"] as any)[key];
      if (Array.isArray(fallback)) return fallback as string[];
      return [];
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}
