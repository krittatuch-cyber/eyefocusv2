// lib/i18n-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { th, en, TranslationKey } from "./dictionary";

type Locale = "th" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string | null) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  // Load locale from cookie or localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale === "th" || savedLocale === "en") {
      setLocaleState(savedLocale);
      document.cookie = `locale=${savedLocale}; path=/; max-age=31536000`;
    } else {
      // Check document cookie
      const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
      if (match && (match[1] === "th" || match[1] === "en")) {
        setLocaleState(match[1] as Locale);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    
    // Set html tag attribute for SEO and translation engines
    document.documentElement.lang = newLocale === "th" ? "th" : "en";
  };

  const t = (key: TranslationKey): string => {
    const dictionary = locale === "th" ? th : en;
    return (dictionary[key] || th[key] || key) as string;
  };

  const formatCurrency = (amount: number): string => {
    if (locale === "th") {
      return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    
    if (locale === "th") {
      // Thai Buddhist Era (BE) formatting
      return d.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatCurrency, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
