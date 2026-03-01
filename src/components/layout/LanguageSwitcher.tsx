"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

export function LanguageSwitcher() {
  const { locale, setLocale, locales, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("lang.ariaSwitch")}
      className="flex items-center overflow-hidden rounded-md border border-border bg-card text-xs font-medium"
    >
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          title={t(`lang.${l}`)}
          className={[
            "px-2.5 py-1 uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
            locale === l
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
