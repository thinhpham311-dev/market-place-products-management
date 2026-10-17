'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface HeroStat {
  value: string;
  label: string;
  valueClass?: string;
}

interface AuthSplitLayoutProps {
  badgeIcon?: React.ReactNode;
  badgeText: string;
  badgeColorClass?: string;
  heroTitle: string;
  heroDescription: string;
  heroStats: HeroStat[];
  children: React.ReactNode;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
  badgeIcon,
  badgeText,
  badgeColorClass = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
  heroTitle,
  heroDescription,
  heroStats,
  children,
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Hero Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            <Icons.ShoppingBag size={24} />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight block leading-none">
              Market Mini Admin
            </span>
            <span className="text-xs text-slate-400">Omnichannel E-Commerce Hub</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${badgeColorClass}`}
          >
            {badgeIcon} {badgeText}
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            {heroTitle}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">{heroDescription}</p>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            {heroStats.map((stat, idx) => (
              <div key={idx}>
                <p className={`text-2xl font-bold ${stat.valueClass || 'text-white'}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <span>© 2026 Market Mini Commerce. All rights reserved.</span>
          <span>Phiên bản v2.4.0</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle
            showLabel
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 shadow-xs"
          />
        </div>

        <div className="w-full max-w-md space-y-6 my-8">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              <Icons.ShoppingBag size={22} />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight block leading-none">
                Market Mini Admin
              </span>
              <span className="text-[11px] text-slate-500">E-Commerce Hub</span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
