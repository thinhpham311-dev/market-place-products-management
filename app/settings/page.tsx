'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/slices/uiSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ThemeSelectorCards, SidebarThemeSelector } from '@/components/ui/ThemeToggle';
import { LanguageSelectorCards } from '@/components/ui/LanguageSwitcher';

type SettingsTab = 'general' | 'appearance' | 'language';

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const tabParam = searchParams.get('tab');
  const currentTab: SettingsTab =
    tabParam === 'appearance' || tabParam === 'language' ? tabParam : 'general';

  const handleTabChange = (tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* URL-synced Settings Tabs */}
      <div className="sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pt-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar scrollbar-thin">
        <button
          type="button"
          onClick={() => handleTabChange('general')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'general'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icons.Settings size={15} />
          {t('settings.tab_general')}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('appearance')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'appearance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icons.Moon size={15} />
          {t('settings.tab_appearance')}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('language')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            currentTab === 'language'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icons.Globe size={15} />
          {t('settings.tab_language')}
        </button>
      </div>

      {currentTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.store_sync_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.store_sync_sub')}
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t('settings.low_stock_toggle')}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('settings.low_stock_toggle_desc')}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {t('settings.realtime_sync_toggle')}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('settings.realtime_sync_toggle_desc')}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Icons.Check size={16} />}
                onClick={() => dispatch(showToast(t('settings.saved_toast')))}
              >
                {t('settings.save_btn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('settings.theme_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('settings.theme_sub')}
              </p>
            </div>

            <ThemeSelectorCards />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('settings.sidebar_theme_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('settings.sidebar_theme_sub')}
              </p>
            </div>

            <SidebarThemeSelector />
          </div>
        </div>
      )}

      {currentTab === 'language' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.language_title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('settings.language_sub')}
            </p>
          </div>

          <LanguageSelectorCards />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}
