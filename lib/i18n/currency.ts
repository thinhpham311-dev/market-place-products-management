import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import { getLanguageFromHostname } from "@/lib/i18n/location-subdomain";
import type { SupportedLanguage } from "@/store/settings/languageSlice";

export type CurrencyDisplayConfig = {
  currency: "VND" | "USD" | "JPY";
  locale: "vi-VN" | "en-US" | "ja-JP";
  symbol: string;
  /** Exchange rate multiplier from base VND amount */
  rateFromVnd: number;
  fractionDigits: number;
};

const CURRENCY_DISPLAY_CONFIG: Record<SupportedLanguage, CurrencyDisplayConfig> = {
  vi: {
    currency: "VND",
    locale: "vi-VN",
    symbol: "₫",
    rateFromVnd: 1,
    fractionDigits: 0,
  },
  en: {
    currency: "USD",
    locale: "en-US",
    symbol: "$",
    rateFromVnd: 1 / 25000,
    fractionDigits: 2,
  },
  ja: {
    currency: "JPY",
    locale: "ja-JP",
    symbol: "¥",
    rateFromVnd: 1 / 160,
    fractionDigits: 0,
  },
};

function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === "en" || value === "vi" || value === "ja";
}

function readLanguageFromPersistedStore(): SupportedLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawPersistStore = window.localStorage.getItem(PERSIST_STORE_NAME);

    if (!rawPersistStore) {
      return null;
    }

    const parsedStore = JSON.parse(rawPersistStore) as {
      settings?: string | { language?: { current?: string } };
    };
    const settings =
      typeof parsedStore.settings === "string"
        ? (JSON.parse(parsedStore.settings) as { language?: { current?: string } })
        : parsedStore.settings;

    const currentLanguage = settings?.language?.current;

    return isSupportedLanguage(currentLanguage) ? currentLanguage : null;
  } catch {
    return null;
  }
}

function readLanguageFromDocument(): SupportedLanguage | null {
  if (typeof document === "undefined") {
    return null;
  }

  const htmlLang = document.documentElement.lang?.toLowerCase();

  if (!htmlLang) {
    return null;
  }

  if (htmlLang.startsWith("vi")) {
    return "vi";
  }

  if (htmlLang.startsWith("ja")) {
    return "ja";
  }

  if (htmlLang.startsWith("en")) {
    return "en";
  }

  return null;
}

function readLanguageFromNavigator(): SupportedLanguage | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const browserLanguage = navigator.language?.toLowerCase();

  if (!browserLanguage) {
    return null;
  }

  if (browserLanguage.startsWith("vi")) {
    return "vi";
  }

  if (browserLanguage.startsWith("ja")) {
    return "ja";
  }

  if (browserLanguage.startsWith("en")) {
    return "en";
  }

  return null;
}

export function getCurrentCurrencyDisplayConfig(): CurrencyDisplayConfig {
  const subdomainLanguage =
    typeof window !== "undefined" ? getLanguageFromHostname(window.location.hostname) : null;
  const resolvedLanguage =
    subdomainLanguage ??
    readLanguageFromPersistedStore() ??
    readLanguageFromDocument() ??
    readLanguageFromNavigator() ??
    "vi";

  return CURRENCY_DISPLAY_CONFIG[resolvedLanguage];
}

export function getCurrencyDisplayConfig(language: SupportedLanguage): CurrencyDisplayConfig {
  return CURRENCY_DISPLAY_CONFIG[language] ?? CURRENCY_DISPLAY_CONFIG.vi;
}

export function convertFromVnd(amountInVnd: number, language: SupportedLanguage): number {
  const config = getCurrencyDisplayConfig(language);
  const raw = (Number(amountInVnd) || 0) * config.rateFromVnd;
  if (config.fractionDigits === 0) {
    return Math.round(raw);
  }
  const factor = Math.pow(10, config.fractionDigits);
  return Math.round(raw * factor) / factor;
}

export function convertToVnd(amountInTargetCurrency: number, language: SupportedLanguage): number {
  const config = getCurrencyDisplayConfig(language);
  const val = Number(amountInTargetCurrency) || 0;
  if (config.rateFromVnd <= 0) return val;
  return Math.round(val / config.rateFromVnd);
}

export function formatCurrencyByLanguage(
  amountInVnd: number,
  language: SupportedLanguage,
  options?: { convert?: boolean }
): string {
  const config = getCurrencyDisplayConfig(language);
  const shouldConvert = options?.convert ?? true;
  const displayAmount = shouldConvert
    ? convertFromVnd(amountInVnd, language)
    : Number(amountInVnd) || 0;

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(displayAmount);
}

export function formatNumberByLanguage(value: number, language: SupportedLanguage): string {
  const config = getCurrencyDisplayConfig(language);
  return new Intl.NumberFormat(config.locale).format(Number(value) || 0);
}

