"use client";

import { useLanguage } from "@/lib/i18n/context";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
    >
      <span className={lang === "es" ? "text-foreground font-semibold" : ""}>
        ES
      </span>
      <span className="opacity-40">/</span>
      <span className={lang === "en" ? "text-foreground font-semibold" : ""}>
        EN
      </span>
    </button>
  );
}
