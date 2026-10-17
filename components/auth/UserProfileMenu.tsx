'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserState } from '@/store/auth/userSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface UserProfileMenuProps {
  user: UserState;
  onLogout: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, onLogout }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user.userName || 'Admin Shop';
  const displayRole = user.role || 'Chủ gian hàng';
  const displayEmail = user.email || 'admin@novashop.vn';
  const displayAvatar = user.avatar || 'AD';

  return (
    <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title={displayName}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-indigo-500/20 shrink-0">
          {displayAvatar}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">{displayRole}</p>
        </div>
        <Icons.ChevronDown
          size={14}
          className={`hidden lg:block text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {displayAvatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {displayRole}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('profile.online')}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/settings?tab=general');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Icons.Settings size={15} className="text-slate-400" />
              <span>{t('profile.settings')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/login');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Icons.User size={15} className="text-slate-400" />
              <span>{t('profile.switch_account')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/register');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Icons.UserPlus size={15} className="text-slate-400" />
              <span>{t('login.signup_link')}</span>
            </button>
          </div>

          {/* Logout Action */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Icons.LogOut size={15} />
              <span>{t('profile.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
