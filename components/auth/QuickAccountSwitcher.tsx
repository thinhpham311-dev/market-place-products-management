'use client';

import React from 'react';
import { RegisteredAccount } from '@/store/auth/accountsSlice';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/lib/i18n/useTranslation';

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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {t('login.quick_demo_title')}
      </p>
      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
        {accounts.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => onSelectAccount(acc)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${acc.badgeColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}
              >
                {acc.user.avatar}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {acc.user.userName}{' '}
                  <span className="font-normal text-slate-400">({acc.user.role})</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</p>
              </div>
            </div>
            <Icons.ChevronRight
              size={15}
              className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
