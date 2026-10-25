'use client';

import React from 'react';
import { RegisteredAccount } from '@/store/auth/accountsSlice';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { canManageCategoryAndBrand } from '@/lib/auth/permissions';

interface QuickAccountSwitcherProps {
  accounts: RegisteredAccount[];
  onSelectAccount: (acc: RegisteredAccount) => void;
}

export const QuickAccountSwitcher: React.FC<QuickAccountSwitcherProps> = ({
  accounts,
  onSelectAccount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {t('login.quick_demo_title')}
        </p>
        <span className="text-[10px] text-slate-400 font-mono">
          {accounts.length} tài khoản mẫu
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {accounts.map((acc) => {
          const hasCategoryBrandAccess = canManageCategoryAndBrand(acc.user);

          return (
            <button
              key={acc.email}
              type="button"
              onClick={() => onSelectAccount(acc)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-tr ${acc.badgeColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {acc.user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {acc.user.userName}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        hasCategoryBrandAccess
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {acc.user.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="font-mono truncate">{acc.email}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">PW: {acc.password}</span>
                  </div>
                </div>
              </div>
              <Icons.ChevronRight
                size={16}
                className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
