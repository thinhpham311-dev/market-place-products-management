'use client';

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage, SupportedLanguage } from '@/store/settings/languageSlice';
import {
  dashboardTranslations,
  getDashboardTranslation,
  DashboardTranslationKey,
  translateCategoryName,
  translateCategoryDesc,
  translateProductName,
  translateLogReason,
} from '@/lib/i18n/dashboard-translations';
import { translations, type TranslationKey } from '@/lib/i18n/translations';

export function useLanguageSync() {
  const lang = useAppSelector((s) => s.settings?.language?.current ?? 'vi');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

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

  const changeLanguage = useCallback(
    (nextLang: SupportedLanguage) => {
      dispatch(setLanguage(nextLang));
    },
    [dispatch]
  );

  return {
    t,
    tp,
    tc,
    tcd,
    tlr,
    lang,
    setLanguage: changeLanguage,
  };
}
