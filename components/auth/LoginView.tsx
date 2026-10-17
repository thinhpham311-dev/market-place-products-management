'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { onSignInSuccess } from '@/store/auth/sessionSlice';
import { setUser, UserState } from '@/store/auth/userSlice';
import { DEFAULT_ACCOUNTS, RegisteredAccount } from '@/store/auth/accountsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { QuickAccountSwitcher } from '@/components/auth/QuickAccountSwitcher';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const LoginView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const accounts = useAppSelector(
    (s) => s.auth.accounts?.items ?? DEFAULT_ACCOUNTS
  );

  const [email, setEmail] = useState('admin@novashop.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const performLogin = (userPayload: UserState) => {
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const fakeToken = `novashop-jwt-${Date.now()}`;
      dispatch(onSignInSuccess(fakeToken));
      dispatch(setUser(userPayload));
      dispatch(showToast(`Xin chào ${userPayload.userName}! Đăng nhập thành công.`));

      const redirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      router.push(redirectUrl);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 4) {
      setError('Mật khẩu phải có ít nhất 4 ký tự.');
      return;
    }

    const matchedAccount = accounts.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedAccount) {
      if (matchedAccount.password && matchedAccount.password !== password) {
        setError('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
        return;
      }
      performLogin(matchedAccount.user);
      return;
    }

    // Support custom email login
    const namePart = email.split('@')[0] || 'User';
    const formattedName = namePart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const initials = formattedName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    performLogin({
      avatar: initials || 'US',
      userName: formattedName,
      email: email.trim(),
      role: 'Quản trị viên',
      authority: ['admin'],
    });
  };

  const handleSelectDemo = (acc: RegisteredAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    performLogin(acc.user);
  };

  return (
    <AuthSplitLayout
      badgeIcon={<Icons.Rocket size={14} />}
      badgeText="Hệ thống quản trị đa kênh thế hệ mới"
      heroTitle="Quản lý sản phẩm, tồn kho & doanh thu tập trung trên một nền tảng."
      heroDescription="Đồng bộ thời gian thực với Shopee, TikTok Shop, Lazada, Website và POS tại cửa hàng. Cảnh báo tồn kho thông minh và phân tích biên lợi nhuận tự động."
      heroStats={[
        { value: '99.9%', label: 'Đồng bộ tức thời', valueClass: 'text-white' },
        { value: '5 Kênh', label: 'Bán hàng liên thông', valueClass: 'text-emerald-400' },
        { value: '24/7', label: 'Kiểm soát kho vận', valueClass: 'text-indigo-400' },
      ]}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('login.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs font-medium">
            <Icons.AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('login.email_label')}
            </label>
            <div className="relative">
              <Icons.Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@novashop.vn"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('login.password_label')}
              </label>
              <button
                type="button"
                onClick={() => setPassword('123456')}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {t('login.fill_default_pw')}
              </button>
            </div>
            <div className="relative">
              <Icons.Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{t('login.remember_me')}</span>
            </label>
            <span className="text-slate-400 text-[11px]">{t('login.demo_pw_hint')}</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            leftIcon={<Icons.LogIn size={17} />}
            className="w-full justify-center py-2.5 shadow-md shadow-indigo-500/20"
          >
            {isLoading ? t('login.submitting') : t('login.submit_btn')}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center pt-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('login.no_account')}{' '}
            <Link
              href="/register"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
            >
              {t('login.signup_link')}
            </Link>
          </p>
        </div>

        {/* Quick Account Switcher */}
        <QuickAccountSwitcher accounts={accounts} onSelectAccount={handleSelectDemo} />
      </div>
    </AuthSplitLayout>
  );
};
