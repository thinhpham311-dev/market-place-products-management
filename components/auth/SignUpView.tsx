'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { onSignInSuccess } from '@/store/auth/sessionSlice';
import { setUser, UserState } from '@/store/auth/userSlice';
import {
  DEFAULT_ACCOUNTS,
  registerAccount,
  RegisteredAccount,
} from '@/store/auth/accountsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { useTranslation } from '@/lib/i18n/useTranslation';

type RoleOptionKey =
  | 'super_admin'
  | 'category_manager'
  | 'catalog_specialist'
  | 'owner'
  | 'warehouse'
  | 'sales'
  | 'admin';

const ROLE_CONFIG: Record<
  RoleOptionKey,
  { roleTitle: string; authority: string[]; badgeColor: string }
> = {
  super_admin: {
    roleTitle: 'SUPER_ADMIN',
    authority: ['SUPER_ADMIN', 'admin', 'owner'],
    badgeColor: 'from-indigo-600 to-violet-600',
  },
  category_manager: {
    roleTitle: 'CATEGORY_MANAGER',
    authority: ['CATEGORY_MANAGER'],
    badgeColor: 'from-purple-500 to-pink-600',
  },
  catalog_specialist: {
    roleTitle: 'CATALOG_SPECIALIST',
    authority: ['CATALOG_SPECIALIST'],
    badgeColor: 'from-cyan-500 to-blue-600',
  },
  owner: {
    roleTitle: 'Chủ gian hàng',
    authority: ['admin', 'owner'],
    badgeColor: 'from-indigo-500 to-violet-600',
  },
  warehouse: {
    roleTitle: 'Quản lý kho vận',
    authority: ['warehouse', 'inventory'],
    badgeColor: 'from-emerald-500 to-teal-600',
  },
  sales: {
    roleTitle: 'Vận hành Sàn TMĐT',
    authority: ['sales', 'marketing'],
    badgeColor: 'from-amber-500 to-orange-600',
  },
  admin: {
    roleTitle: 'Quản trị viên',
    authority: ['admin'],
    badgeColor: 'from-sky-500 to-blue-600',
  },
};

export const SignUpView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const accounts = useAppSelector(
    (s) => s.auth.accounts?.items ?? DEFAULT_ACCOUNTS
  );

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleKey, setRoleKey] = useState<RoleOptionKey>('owner');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    if (pw.length < 6) {
      return { level: 1, label: t('signup.pw_weak'), color: 'bg-rose-500' };
    }
    if (pw.length < 8 || !/[0-9]/.test(pw)) {
      return { level: 2, label: t('signup.pw_medium'), color: 'bg-amber-500' };
    }
    return { level: 3, label: t('signup.pw_strong'), color: 'bg-emerald-500' };
  };

  const pwStrength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password.trim()) {
      setError(t('signup.error_empty'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t('signup.error_email_invalid'));
      return;
    }

    const emailExists = accounts.some(
      (acc) => acc.email.toLowerCase() === trimmedEmail
    );
    if (emailExists) {
      setError(t('signup.error_email_exists'));
      return;
    }

    if (password.length < 4) {
      setError(t('signup.error_pw_short'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('signup.error_pw_mismatch'));
      return;
    }

    if (!agreeTerms) {
      setError(t('signup.error_terms'));
      return;
    }

    const initials = trimmedName
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const selectedRole = ROLE_CONFIG[roleKey];
    const generatedClientId = `shop_${Date.now().toString(16)}`;
    const newUser: UserState = {
      id: generatedClientId,
      avatar: initials || 'NV',
      userName: trimmedName,
      email: trimmedEmail,
      role: selectedRole.roleTitle,
      authority: selectedRole.authority,
    };

    const newAccount: RegisteredAccount = {
      email: trimmedEmail,
      password,
      user: newUser,
      badgeColor: selectedRole.badgeColor,
      createdAt: new Date().toISOString(),
    };

    setIsLoading(true);

    setTimeout(() => {
      const fakeToken = `novashop-jwt-${Date.now()}`;
      dispatch(registerAccount(newAccount));
      dispatch(onSignInSuccess(fakeToken));
      dispatch(setUser(newUser));
      dispatch(showToast(`${t('signup.success_toast')} ${newUser.userName}!`));

      const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      const [basePath, existingQuery] = rawRedirectUrl.split('?');
      const params = new URLSearchParams(existingQuery || '');
      if (basePath === '/' && !params.get('tab')) {
        params.set('tab', 'overview');
      }
      params.set('clientId', generatedClientId);

      router.push(`${basePath}?${params.toString()}`);
    }, 400);
  };

  return (
    <AuthSplitLayout
      badgeIcon={<Icons.ShieldCheck size={14} />}
      badgeText="Khởi tạo không gian quản trị trong 30 giây"
      badgeColorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      heroTitle="Mở rộng quy mô vận hành gian hàng đa kênh cùng đội ngũ của bạn."
      heroDescription="Phân quyền linh hoạt cho Chủ shop, Quản lý kho và Vận hành sàn TMĐT. Tự động đồng bộ tồn kho, kiểm soát lịch sử xuất nhập và báo cáo lợi nhuận thời gian thực."
      heroStats={[
        { value: 'Miễn phí', label: 'Khởi tạo tài khoản', valueClass: 'text-white' },
        { value: 'Đa vai trò', label: 'Phân quyền chi tiết', valueClass: 'text-emerald-400' },
        { value: 'Tức thì', label: 'Truy cập Dashboard', valueClass: 'text-indigo-400' },
      ]}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('signup.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('signup.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs font-medium">
            <Icons.AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('signup.fullname_label')}
            </label>
            <div className="relative">
              <Icons.User
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('signup.fullname_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('signup.email_label')}
            </label>
            <div className="relative">
              <Icons.Mail
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signup.email_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('signup.role_label')}
            </label>
            <select
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value as RoleOptionKey)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            >
              <option value="super_admin">SUPER_ADMIN (Toàn quyền hệ thống & Danh mục, Thương hiệu)</option>
              <option value="category_manager">CATEGORY_MANAGER (Quản lý danh mục & thương hiệu)</option>
              <option value="catalog_specialist">CATALOG_SPECIALIST (Chuyên viên catalog sản phẩm & nhãn hàng)</option>
              <option value="owner">{t('signup.role_owner')}</option>
              <option value="warehouse">{t('signup.role_warehouse')}</option>
              <option value="sales">{t('signup.role_sales')}</option>
              <option value="admin">{t('signup.role_admin')}</option>
            </select>
          </div>

          {/* Password & Confirm Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('signup.password_label')}
              </label>
              <div className="relative">
                <Icons.Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('signup.confirm_password_label')}
              </label>
              <div className="relative">
                <Icons.Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {pwStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-all ${
                      pwStrength.level >= step
                        ? pwStrength.color
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Agree Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="leading-relaxed">{t('signup.agree_terms')}</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            leftIcon={<Icons.UserPlus size={17} />}
            className="w-full justify-center py-2.5 shadow-md shadow-indigo-500/20"
          >
            {isLoading ? t('signup.submitting') : t('signup.submit_btn')}
          </Button>
        </form>

        {/* Switch to Login Link */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('signup.have_account')}{' '}
            <Link
              href="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
            >
              {t('signup.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
