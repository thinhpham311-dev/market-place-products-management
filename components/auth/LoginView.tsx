'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/store/StoreProvider';
import {
  onSignInSuccess,
  setKeepMeSignedIn,
  setRefreshToken,
} from '@/store/auth/sessionSlice';
import { setUser, UserState } from '@/store/auth/userSlice';
import {
  DEFAULT_ACCOUNTS,
  RegisteredAccount,
  mergeDefaultAccounts,
  updateAccountInfo,
} from '@/store/auth/accountsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { apiSignIn } from '@/services/AuthService';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { QuickAccountSwitcher } from '@/components/auth/QuickAccountSwitcher';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { normalizeRoleKey } from '@/lib/auth/permissions';

function extractUserIdFromJwt(token?: string): string | undefined {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    const uid = parsed.userId || parsed._id || parsed.id || parsed.sub;
    return typeof uid === 'string' && uid ? uid : undefined;
  } catch {
    return undefined;
  }
}

function extractRolesFromJwt(token?: string): string[] {
  if (!token) return [];
  const parts = token.split('.');
  if (parts.length !== 3) return [];
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    if (Array.isArray(parsed.roles)) return parsed.roles.map(String);
    if (typeof parsed.role === 'string') return [parsed.role];
    return [];
  } catch {
    return [];
  }
}

export const LoginView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const persistedAccounts = useAppSelector((s) => s.auth.accounts?.items);
  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const currentToken = useAppSelector((s) => s.auth.session.token);
  const isHydrated = useHydrated();

  useEffect(() => {
    if (!isHydrated) return;
    if (signedIn && currentToken) {
      const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      router.replace(rawRedirectUrl);
    }
  }, [isHydrated, signedIn, currentToken, searchParams, router]);

  const accounts = useMemo(
    () => mergeDefaultAccounts(persistedAccounts),
    [persistedAccounts]
  );

  const [email, setEmail] = useState('admin@novashop.vn');
  const [password, setPassword] = useState('novashop');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoEmail, setSelectedDemoEmail] = useState<string | undefined>(undefined);

  const performLogin = (
    userPayload: UserState,
    customToken?: string,
    customRefreshToken?: string
  ) => {
    const token = customToken || `novashop-jwt-${Date.now()}`;
    const clientId = userPayload.id || '66f1a2b3c4d5e6f7a8b9c0d1';
    const resolvedUser: UserState = {
      ...userPayload,
      id: clientId,
    };

    dispatch(onSignInSuccess(token));
    dispatch(setKeepMeSignedIn(rememberMe));
    if (customRefreshToken) {
      dispatch(setRefreshToken(customRefreshToken));
    }
    dispatch(setUser(resolvedUser));
    dispatch(showToast(`Đăng nhập thành công! Vai trò: ${resolvedUser.role}`));

    const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
    const [basePath, existingQuery] = rawRedirectUrl.split('?');
    const params = new URLSearchParams(existingQuery || '');
    if (basePath === '/' && !params.get('tab')) {
      params.set('tab', 'overview');
    }
    params.set('clientId', clientId);

    router.push(`${basePath}?${params.toString()}`);
  };

  const authenticateWithApi = async (loginEmail: string, loginPassword: string) => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (loginPassword.length < 4) {
      setError('Mật khẩu phải có ít nhất 4 ký tự.');
      return;
    }

    setIsLoading(true);
    setError('');

    let effectivePassword = loginPassword;
    let res;
    let apiData: Record<string, any> | undefined;

    try {
      res = await apiSignIn({
        email: loginEmail.trim(),
        password: effectivePassword,
      });
      apiData = res.data as Record<string, any> | undefined;
    } catch (firstErr: unknown) {
      // If authentication failed with 400/401, check if an alternate demo password exists
      const altPassword =
        effectivePassword === 'novashop'
          ? '123456'
          : effectivePassword === '123456'
          ? 'novashop'
          : null;

      if (altPassword) {
        try {
          res = await apiSignIn({
            email: loginEmail.trim(),
            password: altPassword,
          });
          const altApiData = res.data as Record<string, any> | undefined;
          if (
            altApiData &&
            altApiData.status !== 'error' &&
            !(typeof altApiData.code === 'number' && altApiData.code >= 400) &&
            !(typeof altApiData.statusCode === 'number' && altApiData.statusCode >= 400)
          ) {
            effectivePassword = altPassword;
            apiData = altApiData;
            setPassword(altPassword);
          }
        } catch {
          // Both failed
        }
      }

      if (!apiData) {
        throw firstErr;
      }
    }

    // If server responded 200 OK but payload indicates an error, check alt password
    if (
      apiData &&
      (apiData.status === 'error' ||
        (typeof apiData.code === 'number' && apiData.code >= 400) ||
        (typeof apiData.statusCode === 'number' && apiData.statusCode >= 400))
    ) {
      const altPassword =
        effectivePassword === 'novashop'
          ? '123456'
          : effectivePassword === '123456'
          ? 'novashop'
          : null;

      if (altPassword) {
        try {
          const altRes = await apiSignIn({
            email: loginEmail.trim(),
            password: altPassword,
          });
          const altApiData = altRes.data as Record<string, any> | undefined;
          if (
            altApiData &&
            altApiData.status !== 'error' &&
            !(typeof altApiData.code === 'number' && altApiData.code >= 400) &&
            !(typeof altApiData.statusCode === 'number' && altApiData.statusCode >= 400)
          ) {
            effectivePassword = altPassword;
            apiData = altApiData;
            setPassword(altPassword);
          }
        } catch {
          // ignore
        }
      }
    }

    if (
      !apiData ||
      apiData?.status === 'error' ||
      (typeof apiData?.code === 'number' && apiData.code >= 400) ||
      (typeof apiData?.statusCode === 'number' && apiData.statusCode >= 400)
    ) {
      setError(
        apiData?.message ||
          'Email hoặc mật khẩu không chính xác với tài khoản trong database. Vui lòng kiểm tra lại.'
      );
      return;
    }

    const metadata = apiData?.metadata || apiData?.data || apiData;
    const shopInfo =
      metadata?.shop ||
      metadata?.user ||
      (metadata && (metadata._id || metadata.id || metadata.email || metadata.roles) ? metadata : {}) ||
      {};
    const accessToken =
      metadata?.tokens?.accessToken ||
      metadata?.accessToken ||
      metadata?.token;
    const refreshToken =
      metadata?.tokens?.refreshToken || metadata?.refreshToken;

    if (!accessToken && !shopInfo?._id && !shopInfo?.id) {
      setError(
        apiData?.message ||
          'Đăng nhập thất bại: Không nhận được dữ liệu xác thực từ database.'
      );
      return;
    }

    const resolvedName =
      shopInfo?.name ||
      shopInfo?.userName ||
      loginEmail.split('@')[0] ||
      'Shop Admin';
    const initials = resolvedName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const resolvedClientId =
      shopInfo?._id ||
      shopInfo?.id ||
      shopInfo?.userId ||
      metadata?.clientId ||
      extractUserIdFromJwt(accessToken);

    const matchedAccount = accounts.find(
      (acc) => acc.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    const jwtRoles = extractRolesFromJwt(accessToken);
    const rawRoles: string[] =
      (Array.isArray(shopInfo?.roles) && shopInfo.roles.length > 0 && shopInfo.roles) ||
      (Array.isArray(metadata?.roles) && metadata.roles.length > 0 && metadata.roles) ||
      (jwtRoles.length > 0 && jwtRoles) ||
      (shopInfo?.role ? [shopInfo.role] : []) ||
      (metadata?.role ? [metadata.role] : []) ||
      matchedAccount?.user.authority ||
      ['SHOP_OWNER'];

    const normalizedRawRoles = rawRoles.map((r) => normalizeRoleKey(r));
    const cleanEmail = loginEmail.trim().toLowerCase();

    // Strict Role Resolution Hierarchy:
    // 1. Root Platform Super Admin (admin@novashop.vn or explicit SUPER_ADMIN in rawRoles)
    // 2. Category / Catalog Staff (catmanager@novashop.vn, CATEGORY_MANAGER, CATALOG_SPECIALIST)
    // 3. Shop Owner / Merchant Scope (owneradmin@novashop.vn, owner@novashop.vn, or SHOP / SHOP_OWNER)
    let resolvedRole = '';

    const isRootSuperAdmin =
      cleanEmail === 'admin@novashop.vn' ||
      cleanEmail.startsWith('admin@') ||
      normalizedRawRoles.includes('SUPER_ADMIN') ||
      normalizeRoleKey(shopInfo?.role) === 'SUPER_ADMIN' ||
      normalizeRoleKey(metadata?.role) === 'SUPER_ADMIN' ||
      matchedAccount?.user.role === 'SUPER_ADMIN';

    if (isRootSuperAdmin) {
      resolvedRole = 'SUPER_ADMIN';
    } else if (
      cleanEmail === 'catmanager@novashop.vn' ||
      cleanEmail === 'category@novashop.vn' ||
      normalizedRawRoles.includes('CATEGORY_MANAGER') ||
      matchedAccount?.user.role === 'CATEGORY_MANAGER'
    ) {
      resolvedRole = 'CATEGORY_MANAGER';
    } else if (
      cleanEmail === 'catalog@novashop.vn' ||
      normalizedRawRoles.includes('CATALOG_SPECIALIST') ||
      matchedAccount?.user.role === 'CATALOG_SPECIALIST'
    ) {
      resolvedRole = 'CATALOG_SPECIALIST';
    } else if (
      cleanEmail === 'owneradmin@novashop.vn' ||
      cleanEmail === 'owner@novashop.vn' ||
      normalizedRawRoles.includes('SHOP_OWNER') ||
      normalizedRawRoles.includes('SHOP') ||
      normalizedRawRoles.includes('STORE_OWNER') ||
      normalizedRawRoles.includes('OWNER') ||
      normalizedRawRoles.includes('CHỦ_GIAN_HÀNG') ||
      matchedAccount?.user.role === 'SHOP_OWNER'
    ) {
      resolvedRole = 'SHOP_OWNER';
    } else if (normalizedRawRoles.includes('ADMIN')) {
      resolvedRole = 'SUPER_ADMIN';
    } else {
      resolvedRole = matchedAccount?.user.role || 'SHOP_OWNER';
    }

    const apiRolesFromSource: string[] | null =
      (Array.isArray(shopInfo?.roles) && shopInfo.roles.length > 0 && shopInfo.roles) ||
      (Array.isArray(metadata?.roles) && metadata.roles.length > 0 && metadata.roles) ||
      (jwtRoles.length > 0 && jwtRoles) ||
      null;

    let resolvedRoles: string[] = [];
    if (resolvedRole === 'SUPER_ADMIN') {
      const baseApiRoles = apiRolesFromSource || rawRoles;
      resolvedRoles = Array.from(new Set(['SUPER_ADMIN', 'admin', ...baseApiRoles]));
    } else if (resolvedRole === 'SHOP_OWNER') {
      const baseApiRoles = apiRolesFromSource || rawRoles;
      resolvedRoles = Array.from(new Set([...baseApiRoles, 'SHOP_OWNER'])).filter(
        (r) => normalizeRoleKey(r) !== 'SUPER_ADMIN'
      );
    } else if (apiRolesFromSource && apiRolesFromSource.length > 0) {
      resolvedRoles = apiRolesFromSource;
    } else {
      resolvedRoles = [resolvedRole];
    }

    const resolvedUser: UserState = {
      id: resolvedClientId,
      avatar: initials || matchedAccount?.user.avatar || 'SH',
      userName: resolvedName || matchedAccount?.user.userName || 'Shop Admin',
      email: shopInfo?.email || loginEmail.trim(),
      role: resolvedRole,
      authority: resolvedRoles,
    };

    dispatch(
      updateAccountInfo({
        email: loginEmail.trim(),
        user: resolvedUser,
        password: effectivePassword,
      })
    );

    performLogin(resolvedUser, accessToken, refreshToken);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authenticateWithApi(email, password);
    } catch (err: unknown) {
      handleCatchAuthError(err, email, password);
    } finally {
      setIsLoading(false);
      setSelectedDemoEmail(undefined);
    }
  };

  const handleCatchAuthError = (err: unknown, loginEmail: string, loginPassword: string) => {
    const errObj = err as {
      message?: string;
      status?: number;
      response?: { status?: number; data?: { message?: string } };
    };
    const status = errObj?.response?.status ?? errObj?.status;
    const serverMessage =
      errObj?.response?.data?.message || errObj?.message;

    // If backend explicitly returned auth error (400, 401, 403, 404)
    if (status && status < 500) {
      setError(
        serverMessage && serverMessage !== 'Request failed with status code 401'
          ? serverMessage
          : 'Email hoặc mật khẩu không chính xác với tài khoản trong database.'
      );
      return;
    }

    // If server is completely offline / unreachable, fallback to mock account with notice
    const matched = accounts.find(
      (a) =>
        a.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        a.password === loginPassword
    );
    if (matched && (!status || status >= 500)) {
      dispatch(
        showToast(
          'Không thể kết nối đến máy chủ backend, dùng tài khoản mẫu tạm thời.'
        )
      );
      performLogin(matched.user);
      return;
    }

    setError(
      serverMessage && serverMessage !== 'Request failed with status code 401'
        ? serverMessage
        : 'Không thể kết nối đến máy chủ hoặc tài khoản không tồn tại trong database.'
    );
  };

  const handleSelectDemo = async (acc: RegisteredAccount) => {
    if (isLoading) return;
    setSelectedDemoEmail(acc.email);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');

    try {
      await authenticateWithApi(acc.email, acc.password);
    } catch (err: unknown) {
      handleCatchAuthError(err, acc.email, acc.password);
    } finally {
      setIsLoading(false);
      setSelectedDemoEmail(undefined);
    }
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
                onClick={() => setPassword('novashop')}
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
        <QuickAccountSwitcher
          accounts={accounts}
          onSelectAccount={handleSelectDemo}
          isLoading={isLoading}
          selectedEmail={selectedDemoEmail}
        />
      </div>
    </AuthSplitLayout>
  );
};
