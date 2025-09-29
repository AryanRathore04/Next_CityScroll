"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  languages,
  currencies,
  regions,
  type LanguageCode,
  type CurrencyCode,
} from "./config";
import { translations } from "./translations";

interface LocalizationContextType {
  language: LanguageCode;
  currency: CurrencyCode;
  region: string;
  setLanguage: (lang: LanguageCode) => void;
  setCurrency: (curr: CurrencyCode) => void;
  setRegion: (reg: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  isRTL: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

interface LocalizationProviderProps {
  children: ReactNode;
  defaultLanguage?: LanguageCode;
  defaultCurrency?: CurrencyCode;
  defaultRegion?: string;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
  defaultLanguage = "en",
  defaultCurrency = "USD",
  defaultRegion = "North America",
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(defaultLanguage);
  const [currency, setCurrencyState] = useState<CurrencyCode>(defaultCurrency);
  const [region, setRegionState] = useState<string>(defaultRegion);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem(
        "salon-language",
      ) as LanguageCode;
      const savedCurrency = localStorage.getItem(
        "salon-currency",
      ) as CurrencyCode;
      const savedRegion = localStorage.getItem("salon-region");

      if (savedLanguage && languages[savedLanguage]) {
        setLanguageState(savedLanguage);
      } else {
        // Auto-detect language from browser
        const browserLang = navigator.language.split("-")[0] as LanguageCode;
        if (languages[browserLang]) {
          setLanguageState(browserLang);
        }
      }

      if (savedCurrency && currencies[savedCurrency]) {
        setCurrencyState(savedCurrency);
      }

      if (savedRegion && Object.keys(regions).includes(savedRegion)) {
        setRegionState(savedRegion);
      }
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("salon-language", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = languages[lang].direction;
    }
  };

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
    if (typeof window !== "undefined") {
      localStorage.setItem("salon-currency", curr);
    }
  };

  const setRegion = (reg: string) => {
    setRegionState(reg);
    if (typeof window !== "undefined") {
      localStorage.setItem("salon-region", reg);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key as keyof typeof translations];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    let text = translation[language] || translation.en || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value));
      });
    }

    return text;
  };

  // Price formatting
  const formatPrice = (amount: number): string => {
    const currencyInfo = currencies[currency];
    const formatter = new Intl.NumberFormat(
      language === "en" ? "en-US" : language,
      {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    );

    return formatter.format(amount);
  };

  // Date formatting
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  // Time formatting
  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(language, {
      hour: "numeric",
      minute: "2-digit",
      hour12: language === "en",
    }).format(dateObj);
  };

  const isRTL = languages[language].direction === "rtl";

  const value: LocalizationContextType = {
    language,
    currency,
    region,
    setLanguage,
    setCurrency,
    setRegion,
    t,
    formatPrice,
    formatDate,
    formatTime,
    isRTL,
  };

  return (
    <LocalizationContext.Provider value={value}>
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "rtl" : "ltr"}>
        {children}
      </div>
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error(
      "useLocalization must be used within a LocalizationProvider",
    );
  }
  return context;
};

// Hook for translations only (lighter alternative)
export const useTranslation = () => {
  const { t } = useLocalization();
  return { t };
};
