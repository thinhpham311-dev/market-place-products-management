import { PERSIST_STORE_NAME } from "@/constants/app/app.constant";
import type { SupportedLanguage } from "@/store/settings/languageSlice";

const LANGUAGE_SUBDOMAIN_MAP: Record<SupportedLanguage, string> = {
  en: "en",
  vi: "vn",
  ja: "jp",
};

const SUBDOMAIN_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  en: "en",
  vn: "vi",
  jp: "ja",
};

const WINDOW_NAME_SYNC_PREFIX = "__PERSIST_SYNC__:";

function isIpv4Address(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

export function getSubdomainFromLanguage(language: SupportedLanguage): string {
  return LANGUAGE_SUBDOMAIN_MAP[language] ?? LANGUAGE_SUBDOMAIN_MAP.en;
}

export function getLanguageFromSubdomain(subdomain?: string | null): SupportedLanguage | null {
  if (!subdomain) {
    return null;
  }

  return SUBDOMAIN_LANGUAGE_MAP[subdomain.toLowerCase()] ?? null;
}

export function getSubdomainFromHostname(hostname: string): string | null {
  const normalizedHostname = hostname.toLowerCase();

  if (
    !normalizedHostname ||
    normalizedHostname === "localhost" ||
    isIpv4Address(normalizedHostname)
  ) {
    return null;
  }

  if (normalizedHostname.endsWith(".localhost")) {
    const [subdomain] = normalizedHostname.split(".localhost");
    return subdomain || null;
  }

  const parts = normalizedHostname.split(".");

  if (parts.length <= 2) {
    return null;
  }

  return parts[0] ?? null;
}

export function getLanguageFromHostname(hostname: string): SupportedLanguage | null {
  const subdomain = getSubdomainFromHostname(hostname);
  return getLanguageFromSubdomain(subdomain);
}

export function buildHostnameForLanguage(hostname: string, language: SupportedLanguage): string {
  const normalizedHostname = hostname.toLowerCase();
  const targetSubdomain = getSubdomainFromLanguage(language);

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    isIpv4Address(normalizedHostname)
  ) {
    return `${targetSubdomain}.localhost`;
  }

  const parts = normalizedHostname.split(".");
  const currentSubdomain = getSubdomainFromHostname(normalizedHostname);

  if (parts.length <= 2) {
    return `${targetSubdomain}.${normalizedHostname}`;
  }

  if (currentSubdomain && getLanguageFromSubdomain(currentSubdomain)) {
    return [targetSubdomain, ...parts.slice(1)].join(".");
  }

  if (parts[0] === "www") {
    return [targetSubdomain, ...parts.slice(1)].join(".");
  }

  return [targetSubdomain, ...parts].join(".");
}

export function buildLocalizedUrl(currentUrl: string, language: SupportedLanguage): string {
  const url = new URL(currentUrl);
  url.hostname = buildHostnameForLanguage(url.hostname, language);
  return url.toString();
}

function updateStoredLanguageInPersistPayload(
  rawPersistStore: string | null,
  language: SupportedLanguage
): string {
  try {
    const parsedStore = rawPersistStore
      ? (JSON.parse(rawPersistStore) as Record<string, unknown>)
      : {};
    const rawSettings = parsedStore.settings;
    const settingsObj =
      typeof rawSettings === "string"
        ? (JSON.parse(rawSettings) as Record<string, unknown>)
        : typeof rawSettings === "object" && rawSettings !== null
        ? { ...(rawSettings as Record<string, unknown>) }
        : {};

    settingsObj.language = { current: language };
    parsedStore.settings = JSON.stringify(settingsObj);

    return JSON.stringify(parsedStore);
  } catch {
    return JSON.stringify({
      settings: JSON.stringify({ language: { current: language } }),
    });
  }
}

export function syncPersistedStoreForSubdomainNavigation(
  language: SupportedLanguage,
  toastMessage?: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawPersistStore = window.localStorage.getItem(PERSIST_STORE_NAME);
    const updatedPayload = updateStoredLanguageInPersistPayload(rawPersistStore, language);
    window.localStorage.setItem(PERSIST_STORE_NAME, updatedPayload);
    window.name = `${WINDOW_NAME_SYNC_PREFIX}${JSON.stringify({
      persistStore: updatedPayload,
      toastMessage: toastMessage ?? null,
    })}`;
  } catch {
    // Ignore storage write errors
  }
}

export function restorePersistedStoreFromSubdomainNavigation(): {
  language: SupportedLanguage | null;
  toastMessage: string | null;
} {
  if (typeof window === "undefined") {
    return { language: null, toastMessage: null };
  }

  let toastMessage: string | null = null;

  try {
    if (window.name && window.name.startsWith(WINDOW_NAME_SYNC_PREFIX)) {
      const rawSync = window.name.slice(WINDOW_NAME_SYNC_PREFIX.length);
      window.name = "";
      const parsedSync = JSON.parse(rawSync) as {
        persistStore?: string;
        toastMessage?: string | null;
      };
      if (parsedSync.persistStore) {
        window.localStorage.setItem(PERSIST_STORE_NAME, parsedSync.persistStore);
      }
      if (parsedSync.toastMessage) {
        toastMessage = parsedSync.toastMessage;
      }
    }
  } catch {
    window.name = "";
  }

  const subdomainLanguage = getLanguageFromHostname(window.location.hostname);

  if (subdomainLanguage) {
    try {
      const rawPersistStore = window.localStorage.getItem(PERSIST_STORE_NAME);
      const updatedPayload = updateStoredLanguageInPersistPayload(
        rawPersistStore,
        subdomainLanguage
      );
      window.localStorage.setItem(PERSIST_STORE_NAME, updatedPayload);
    } catch {
      // Ignore storage errors
    }
  }

  return { language: subdomainLanguage, toastMessage };
}

export function navigateToLanguageSubdomain(
  language: SupportedLanguage,
  toastMessage?: string
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const targetUrl = buildLocalizedUrl(window.location.href, language);
  const currentUrl = new URL(window.location.href);
  const nextUrl = new URL(targetUrl);

  if (currentUrl.hostname !== nextUrl.hostname) {
    syncPersistedStoreForSubdomainNavigation(language, toastMessage);
    window.location.assign(nextUrl.toString());
    return true;
  }

  return false;
}

