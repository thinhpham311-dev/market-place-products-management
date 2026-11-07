'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserState } from '@/store/auth/userSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { isSuperAdmin, isShopOwner } from '@/lib/auth/permissions';

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

  const isSuper = isSuperAdmin(user);
  const isOwner = isShopOwner(user);

  // Exact roles returned from the API
  const apiRoles: string[] =
    Array.isArray(user.authority) && user.authority.length > 0
      ? user.authority
      : user.role
      ? [user.role]
      : ['SHOP_OWNER'];

  const apiRoleText = apiRoles.join(', ');

  const displayName =
    user.userName && user.userName !== 'Super Admin' && user.userName !== 'Shop Admin'
      ? user.userName
      : isSuper
      ? 'Admin Shop (Root)'
      : isOwner
      ? (user.email === 'owneradmin@novashop.vn' ? 'Owner Admin' : 'Trần Minh (Shop Owner)')
      : user.email
      ? user.email.split('@')[0]
      : 'Shop Admin';

  const displayEmail = user.email || 'admin@novashop.vn';
  const displayAvatar =
    user.avatar && user.avatar !== 'SA'
      ? user.avatar
      : displayName
      ? displayName.slice(0, 2).toUpperCase()
      : isSuper
      ? 'SA'
      : isOwner
      ? 'SO'
      : 'AD';

  const avatarGradient = isSuper
    ? 'from-purple-600 to-violet-800'
    : isOwner
    ? 'from-indigo-600 to-blue-600'
    : 'from-indigo-500 to-pink-500';

  return (
    <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title={`${displayName} (${apiRoleText})`}
      >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} text-white font-semibold text-xs flex items-center justify-center ring-2 ring-indigo-500/20 shrink-0`}>
          {displayAvatar}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-tight ${
                isSuper
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
              }`}
              title={`Role từ API: ${apiRoleText}`}
            >
              {user.role || apiRoleText}
            </span>
          </div>
        </div>
        <Icons.ChevronDown
          size={14}
          className={`hidden lg:block text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${avatarGradient} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
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

            {/* Direct Roles Display from API */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Roles từ API:</span>
                <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {apiRoles.length} role
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {apiRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs"
                  >
                    {role}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('profile.online')}
                </span>
              </div>
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
