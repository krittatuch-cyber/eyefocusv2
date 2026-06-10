// components/shared/language-switcher.tsx
"use client";

import React from "react";
import { useI18n } from "@/lib/i18n-context";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex items-center space-x-1 bg-primary-medium/10 dark:bg-card/40 p-1 rounded-xl border border-border">
      <button
        onClick={() => setLocale("th")}
        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
          locale === "th"
            ? "bg-accent text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Switch to Thai"
      >
        TH
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
          locale === "en"
            ? "bg-accent text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}
