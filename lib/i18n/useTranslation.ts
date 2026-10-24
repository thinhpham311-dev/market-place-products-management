'use client';

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/store/StoreProvider';
import { setLanguage, SupportedLanguage } from '@/store/settings/languageSlice';
import { showToast } from '@/store/slices/uiSlice';
import {
  dashboardTranslations,
  getDashboardTranslation,
  DashboardTranslationKey,
  translateCategoryName,
  translateCategoryDesc,
  translateProductName,
  translateLogReason,
} from '@/lib/i18n/dashboard-translations';
import {
  getCurrencyDisplayConfig,
  formatCurrencyByLanguage,
  formatNumberByLanguage,
  convertFromVnd,
  convertToVnd,
} from '@/lib/i18n/currency';
import {
  getLanguageFromHostname,
  getSubdomainFromLanguage,
  navigateToLanguageSubdomain,
} from '@/lib/i18n/location-subdomain';
import { translations, type TranslationKey } from '@/lib/i18n/translations';

function getLanguageSwitchToast(lang: SupportedLanguage): string {
  const sub = getSubdomainFromLanguage(lang);
  if (lang === 'vi') {
    return `Đã chuyển ngôn ngữ sang Tiếng Việt (${sub} • VND)`;
  }
  if (lang === 'en') {
    return `Language switched to English (${sub} • USD)`;
  }
  return `表示言語を日本語に切り替えました (${sub} • JPY)`;
}

export function useLanguageSync() {
  const dispatch = useAppDispatch();
  const isHydrated = useHydrated();
  const lang = useAppSelector((s) => s.settings?.language?.current ?? 'vi');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    const subdomainLang = getLanguageFromHostname(window.location.hostname);
    if (subdomainLang) {
      if (subdomainLang !== lang) {
        dispatch(setLanguage(subdomainLang));
      }
      return;
    }

    // Redirect root hostname (e.g. localhost:3000) to localized subdomain (e.g. vn.localhost:3000)
    navigateToLanguageSubdomain(lang);
  }, [isHydrated, lang, dispatch]);

  return lang;
}

export function useTranslation() {
  const dispatch = useAppDispatch();
  const lang: SupportedLanguage = useAppSelector(
    (s) => s.settings?.language?.current ?? 'vi'
  );

  const t = useCallback(
    (key: DashboardTranslationKey | TranslationKey): string => {
      if (key in dashboardTranslations.vi) {
        return getDashboardTranslation(lang, key as DashboardTranslationKey);
      }
      const catalogDict = translations[lang] ?? translations.vi;
      return catalogDict[key as TranslationKey] ?? key;
    },
    [lang]
  );

  const tp = useCallback(
    (productName: string) => translateProductName(productName, lang),
    [lang]
  );

  const tc = useCallback(
    (categoryName: string) => translateCategoryName(categoryName, lang),
    [lang]
  );

  const tcd = useCallback(
    (categoryDesc: string) => translateCategoryDesc(categoryDesc, lang),
    [lang]
  );

  const tlr = useCallback(
    (reason: string) => translateLogReason(reason, lang),
    [lang]
  );

  const currencyConfig = getCurrencyDisplayConfig(lang);

  const formatCurrency = useCallback(
    (amountInVnd: number, options?: { convert?: boolean }) =>
      formatCurrencyByLanguage(amountInVnd, lang, options),
    [lang]
  );

  const formatNumber = useCallback(
    (value: number) => formatNumberByLanguage(value, lang),
    [lang]
  );

  const fromVnd = useCallback(
    (amountInVnd: number) => convertFromVnd(amountInVnd, lang),
    [lang]
  );

  const toVnd = useCallback(
    (amountInTargetCurrency: number) => convertToVnd(amountInTargetCurrency, lang),
    [lang]
  );

  const changeLanguage = useCallback(
    (nextLang: SupportedLanguage) => {
      const toastMsg = getLanguageSwitchToast(nextLang);
      dispatch(setLanguage(nextLang));
      const redirected = navigateToLanguageSubdomain(nextLang, toastMsg);
      if (!redirected) {
        dispatch(showToast(toastMsg));
      }
    },
    [dispatch]
  );

  return {
    t,
    tp,
    tc,
    tcd,
    tlr,
    formatCurrency,
    formatNumber,
    fromVnd,
    toVnd,
    currencyCode: currencyConfig.currency,
    currencySymbol: currencyConfig.symbol,
    locale: currencyConfig.locale,
    subdomain: getSubdomainFromLanguage(lang),
    lang,
    setLanguage: changeLanguage,
  };
}
