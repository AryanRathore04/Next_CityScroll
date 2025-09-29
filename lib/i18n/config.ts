export const languages = {
  en: {
    code: "en",
    name: "English",
    flag: "🇺🇸",
    direction: "ltr",
  },
  es: {
    code: "es",
    name: "Español",
    flag: "🇪🇸",
    direction: "ltr",
  },
  fr: {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    direction: "ltr",
  },
  de: {
    code: "de",
    name: "Deutsch",
    flag: "🇩🇪",
    direction: "ltr",
  },
  it: {
    code: "it",
    name: "Italiano",
    flag: "🇮🇹",
    direction: "ltr",
  },
  pt: {
    code: "pt",
    name: "Português",
    flag: "🇧🇷",
    direction: "ltr",
  },
  zh: {
    code: "zh",
    name: "中文",
    flag: "🇨🇳",
    direction: "ltr",
  },
  ja: {
    code: "ja",
    name: "日本語",
    flag: "🇯🇵",
    direction: "ltr",
  },
  ko: {
    code: "ko",
    name: "한국어",
    flag: "🇰🇷",
    direction: "ltr",
  },
  ar: {
    code: "ar",
    name: "العربية",
    flag: "🇸🇦",
    direction: "rtl",
  },
  hi: {
    code: "hi",
    name: "हिन्दी",
    flag: "🇮🇳",
    direction: "ltr",
  },
  ru: {
    code: "ru",
    name: "Русский",
    flag: "🇷🇺",
    direction: "ltr",
  },
};

export const currencies = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "after",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    position: "before",
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    position: "before",
  },
  KRW: {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    position: "before",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    position: "before",
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    position: "before",
  },
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    position: "before",
  },
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    position: "before",
  },
  MXN: {
    code: "MXN",
    symbol: "$",
    name: "Mexican Peso",
    position: "before",
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    position: "before",
  },
  SAR: {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    position: "before",
  },
  RUB: {
    code: "RUB",
    symbol: "₽",
    name: "Russian Ruble",
    position: "after",
  },
};

export const regions = {
  "North America": {
    countries: ["US", "CA", "MX"],
    defaultCurrency: "USD",
    defaultLanguage: "en",
    timezone: "America/New_York",
  },
  Europe: {
    countries: ["GB", "FR", "DE", "IT", "ES", "NL", "BE", "CH"],
    defaultCurrency: "EUR",
    defaultLanguage: "en",
    timezone: "Europe/London",
  },
  "Asia Pacific": {
    countries: ["JP", "KR", "CN", "IN", "AU", "SG", "TH", "VN"],
    defaultCurrency: "USD",
    defaultLanguage: "en",
    timezone: "Asia/Tokyo",
  },
  "Middle East": {
    countries: ["AE", "SA", "QA", "KW", "BH", "OM"],
    defaultCurrency: "AED",
    defaultLanguage: "ar",
    timezone: "Asia/Dubai",
  },
  "Latin America": {
    countries: ["BR", "AR", "CL", "CO", "PE", "VE"],
    defaultCurrency: "USD",
    defaultLanguage: "es",
    timezone: "America/Sao_Paulo",
  },
};

export type LanguageCode = keyof typeof languages;
export type CurrencyCode = keyof typeof currencies;
