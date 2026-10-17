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

  if (!normalizedHostname || normalizedHostname === "localhost") {
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

export function buildHostnameForLanguage(hostname: string, language: SupportedLanguage): string {
  const normalizedHostname = hostname.toLowerCase();
  const targetSubdomain = getSubdomainFromLanguage(language);

  if (normalizedHostname === "localhost" || normalizedHostname.endsWith(".localhost")) {
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
