import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import { translations, type TranslationKey } from "@/lib/i18n/translations";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/store/settings/languageSlice";

const FALLBACK_LANGUAGE: SupportedLanguage = "en";

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
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

  if (!htmlLang) return null;
  if (htmlLang.startsWith("vi")) return "vi";
  if (htmlLang.startsWith("ja")) return "ja";
  if (htmlLang.startsWith("en")) return "en";

  return null;
}

function readLanguageFromNavigator(): SupportedLanguage | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const browserLanguage = navigator.language?.toLowerCase();

  if (!browserLanguage) return null;
  if (browserLanguage.startsWith("vi")) return "vi";
  if (browserLanguage.startsWith("ja")) return "ja";
  if (browserLanguage.startsWith("en")) return "en";

  return null;
}

export function getCurrentLanguage(): SupportedLanguage {
  return (
    readLanguageFromPersistedStore() ??
    readLanguageFromDocument() ??
    readLanguageFromNavigator() ??
    FALLBACK_LANGUAGE
  );
}

export function translateRuntime(key: TranslationKey): string {
  const currentLanguage = getCurrentLanguage();
  const dictionary = translations[currentLanguage] ?? translations[FALLBACK_LANGUAGE];

  return dictionary[key] ?? translations[FALLBACK_LANGUAGE][key] ?? key;
}
