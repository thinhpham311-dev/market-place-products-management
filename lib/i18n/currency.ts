import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import type { SupportedLanguage } from "@/store/settings/languageSlice";

type CurrencyDisplayConfig = {
  currency: string;
  locale: string;
};

const CURRENCY_DISPLAY_CONFIG: Record<SupportedLanguage, CurrencyDisplayConfig> = {
  en: {
    currency: "USD",
    locale: "en-US",
  },
  vi: {
    currency: "VND",
    locale: "vi-VN",
  },
  ja: {
    currency: "JPY",
    locale: "ja-JP",
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
  const resolvedLanguage =
    readLanguageFromPersistedStore() ??
    readLanguageFromDocument() ??
    readLanguageFromNavigator() ??
    "en";

  return CURRENCY_DISPLAY_CONFIG[resolvedLanguage];
}

export function getCurrencyDisplayConfig(language: SupportedLanguage): CurrencyDisplayConfig {
  return CURRENCY_DISPLAY_CONFIG[language] ?? CURRENCY_DISPLAY_CONFIG.en;
}
