'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage } from '@/store/settings/languageSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

export const LANGUAGE_OPTIONS: {
  id: SupportedLanguage;
  code: string;
  subdomain: string;
  currency: string;
  label: string;
  nativeLabel: string;
  flag: string;
  desc: string;
}[] = [
  {
    id: 'vi',
    code: 'VI',
    subdomain: 'vn',
    currency: 'VND (₫)',
    label: 'Tiếng Việt',
    nativeLabel: 'Tiếng Việt (VN)',
    flag: '🇻🇳',
    desc: 'Ngôn ngữ mặc định cho thị trường Việt Nam (vn.* • VND - ₫)',
  },
  {
    id: 'en',
    code: 'EN',
    subdomain: 'en',
    currency: 'USD ($)',
    label: 'English',
    nativeLabel: 'English (US)',
    flag: '🇺🇸',
    desc: 'International English interface for global operations (en.* • USD - $)',
  },
  {
    id: 'ja',
    code: 'JA',
    subdomain: 'jp',
    currency: 'JPY (¥)',
    label: '日本語',
    nativeLabel: '日本語 (JP)',
    flag: '🇯🇵',
    desc: '日本市場およびクロスボーダーEC向けの日本語表示 (jp.* • JPY - ¥)',
  },
];

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === lang) || LANGUAGE_OPTIONS[0];

  const handleSelect = (opt: (typeof LANGUAGE_OPTIONS)[number]) => {
    setOpen(false);
    setLanguage(opt.id);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        title="Chuyển đổi ngôn ngữ / Switch Language"
      >
        <span className="text-sm leading-none">{currentOption.flag}</span>
        <span>{currentOption.code}</span>
        <Icons.ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = opt.id === lang;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{opt.flag}</span>
                  <div className="text-left">
                    <span className="block">{opt.nativeLabel}</span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      {opt.subdomain}.localhost • {opt.currency}
                    </span>
                  </div>
                </div>
                {isSelected && <Icons.Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const LanguageSelectorCards: React.FC = () => {
  const { lang, setLanguage } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {LANGUAGE_OPTIONS.map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setLanguage(opt.id);
            }}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              active
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-lg shadow-xs">
                {opt.flag}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {opt.subdomain}.* • {opt.currency}
                </span>
                {active && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Icons.Check size={12} />
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {opt.nativeLabel}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {opt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
