"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { DEFAULT_LOCALE, LOCALES, interpolate, resolveKey } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

import esMessages from "@/locales/es.json";
import enMessages from "@/locales/en.json";

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  es: esMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

/** Función de traducción. t("nav.dashboard") | t("dashboard.missingCosts", { count: 2 }) */
export type TFn = (key: string, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
  locales: readonly Locale[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hidratación desde localStorage (cliente-only)
  useEffect(() => {
    const stored = localStorage.getItem("finexa_locale") as Locale | null;
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("finexa_locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback<TFn>(
    (key, params) => {
      const raw = resolveKey(MESSAGES[locale], key);
      return interpolate(raw, params);
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, locales: LOCALES }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Hook principal. Usar en cualquier Client Component. */
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale debe usarse dentro de <LocaleProvider>");
  return ctx;
}

/** Shorthand para solo obtener la función t. */
export function useT() {
  return useLocale().t;
}
