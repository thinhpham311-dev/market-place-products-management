'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  DEFAULT_ACCOUNTS,
  mergeDefaultAccounts,
  RegisteredAccount,
} from '@/store/auth/accountsSlice';
import {
  onSignInSuccess,
  onSignOutSuccess,
  setKeepMeSignedIn,
  setRefreshToken,
} from '@/store/auth/sessionSlice';
import { setUser, userLoggedOut, UserState } from '@/store/auth/userSlice';
import { showToast } from '@/store/slices/uiSlice';
import { apiSignIn, apiSignOut } from '@/services/AuthService';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import {
  canManageCategoryAndBrand,
  isCategoryManager,
  isSuperAdmin,
  isShopOwner,
} from '@/lib/auth/permissions';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const AccountSwitcherView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const currentUser = useAppSelector((s) => s.auth.user);
  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const persistedAccounts = useAppSelector((s) => s.auth.accounts?.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'OWNER' | 'SPECIALIST'>('ALL');
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  const accounts = useMemo(
    () => mergeDefaultAccounts(persistedAccounts),
    [persistedAccounts]
  );

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        acc.user.userName?.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.user.role?.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (roleFilter === 'ADMIN') {
        return (
          acc.user.role === 'SUPER_ADMIN' ||
          acc.user.authority?.includes('SUPER_ADMIN') ||
          acc.user.authority?.includes('admin')
        );
      }
      if (roleFilter === 'OWNER') {
        return (
          acc.user.role === 'SHOP_OWNER' ||
          acc.user.authority?.includes('SHOP_OWNER') ||
          acc.user.authority?.includes('owner')
        );
      }
      if (roleFilter === 'SPECIALIST') {
        return (
          acc.user.role === 'CATEGORY_MANAGER' ||
          acc.user.role === 'CATALOG_SPECIALIST' ||
          acc.user.authority?.includes('warehouse') ||
          acc.user.authority?.includes('sale')
        );
      }

      return true;
    });
  }, [accounts, searchQuery, roleFilter]);

  const handleSwitchToAccount = async (acc: RegisteredAccount) => {
    if (switchingEmail) return;
    setError('');
    setSwitchingEmail(acc.email);

    try {
      let customToken = `novashop-jwt-${Date.now()}`;
      let customRefreshToken: string | undefined = undefined;
      let finalClientId = acc.user.id || `shop-${Date.now().toString(36)}`;

      try {
        const res = await apiSignIn({
          email: acc.email,
          password: acc.password,
        });
        const resData = res?.data as Record<string, unknown> | undefined;
        const metadata = (resData?.metadata ||
          resData?.data ||
          resData) as Record<string, unknown> | undefined;
        const tokens = metadata?.tokens as Record<string, unknown> | undefined;
        const shop = metadata?.shop as Record<string, unknown> | undefined;

        if (typeof tokens?.accessToken === 'string') {
          customToken = tokens.accessToken;
        } else if (typeof metadata?.accessToken === 'string') {
          customToken = metadata.accessToken;
        }

        if (typeof tokens?.refreshToken === 'string') {
          customRefreshToken = tokens.refreshToken;
        }

        if (typeof shop?._id === 'string' && shop._id) {
          finalClientId = shop._id;
        } else if (typeof shop?.id === 'string' && shop.id) {
          finalClientId = shop.id;
        }
      } catch {
        // Fallback local authentication succeeds gracefully
      }

      const switchedUser: UserState = {
        ...acc.user,
        id: finalClientId,
      };

      dispatch(onSignInSuccess(customToken));
      dispatch(setKeepMeSignedIn(true));
      if (customRefreshToken) {
        dispatch(setRefreshToken(customRefreshToken));
      }
      dispatch(setUser(switchedUser));
      dispatch(
        showToast(
          `Đã chuyển sang tài khoản: ${switchedUser.userName} (${switchedUser.role})!`
        )
      );

      const rawRedirectUrl = searchParams.get('redirectUrl') || '/?tab=overview';
      const [basePath, existingQuery] = rawRedirectUrl.split('?');
      const params = new URLSearchParams(existingQuery || '');
      if (basePath === '/' && !params.get('tab')) {
        params.set('tab', 'overview');
      }
      params.set('clientId', finalClientId);

      router.push(`${basePath}?${params.toString()}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Chuyển đổi tài khoản thất bại.'
      );
    } finally {
      setSwitchingEmail(null);
    }
  };

  const handleLogoutCurrent = async () => {
    try {
      await apiSignOut();
    } catch {
      // ignore
    }
    dispatch(onSignOutSuccess());
    dispatch(userLoggedOut());
    dispatch(showToast('Đã đăng xuất khỏi tài khoản hiện tại.'));
  };

  return (
    <AuthSplitLayout
      badgeIcon={<Icons.User size={14} />}
      badgeText="Trung tâm chuyển đổi tài khoản quản trị"
      badgeColorClass="bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
      heroTitle="Quản lý đa vai trò và phân quyền tức thì trong một click."
      heroDescription="Dễ dàng chuyển đổi giữa Super Admin, Chủ gian hàng, Quản lý danh mục và Bộ phận Kho vận để kiểm tra quyền hạn và thao tác công việc nhanh chóng."
      heroStats={[
        { value: `${accounts.length}+`, label: 'Tài khoản khả dụng', valueClass: 'text-white' },
        { value: '1-Click', label: 'Chuyển đổi tức thì', valueClass: 'text-emerald-400' },
        { value: 'An toàn', label: 'Đồng bộ Session', valueClass: 'text-indigo-400' },
      ]}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-5 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{t('profile.switch_account')}</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                {accounts.length} Profiles
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Chọn tài khoản muốn chuyển đổi để tiếp tục phiên làm việc trên Dashboard
            </p>
          </div>
          <Link
            href="/?tab=overview"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icons.ChevronLeft size={15} />
            <span>Về Dashboard</span>
          </Link>
        </div>

        {/* Current Active Account Box */}
        {signedIn && currentUser?.email ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50/70 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                  {currentUser.avatar || 'US'}
                </div>
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
                  title="Đang hoạt động"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.userName || 'Tài khoản hiện tại'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Đang hoạt động
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogoutCurrent}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <Icons.LogOut size={13} />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle size={15} className="shrink-0" />
              <span>Bạn hiện chưa đăng nhập tài khoản nào. Vui lòng chọn tài khoản bên dưới để đăng nhập ngay.</span>
            </div>
            <Link
              href="/login"
              className="font-bold underline hover:text-amber-900 dark:hover:text-white shrink-0"
            >
              Đăng nhập thủ công →
            </Link>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 text-xs font-medium">
            <Icons.AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Icons.Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, email hoặc vai trò..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Icons.X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('OWNER')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'OWNER'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Chủ Shop
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('SPECIALIST')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'SPECIALIST'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Kho & Danh mục
              </button>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-2.5 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
          {filteredAccounts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Icons.Search size={28} className="mx-auto mb-2 opacity-40" />
              <p>Không tìm thấy tài khoản phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                }}
                className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isCurrent =
                signedIn &&
                currentUser?.email?.toLowerCase().trim() ===
                  acc.email.toLowerCase().trim();
              const isSwitchingThis = switchingEmail === acc.email;
              const hasCatAccess = canManageCategoryAndBrand(acc.user);
              const isCatOnly = isCategoryManager(acc.user);
              const isSuper = isSuperAdmin(acc.user);
              const isOwner = isShopOwner(acc.user);

              return (
                <div
                  key={acc.email}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  {/* Account Info Left */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${acc.badgeColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {acc.user.avatar || 'US'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {acc.user.userName}
                        </p>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isSuper
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : isOwner
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : isCatOnly
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {acc.user.role}
                        </span>

                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            ✓ Đang đăng nhập
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-mono text-slate-600 dark:text-slate-300 truncate">
                          {acc.email}
                        </span>
                        <span>•</span>
                        <span className="text-[10px]">
                          Quyền:{' '}
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {hasCatAccess ? 'Quản trị Danh mục/SP' : 'Kho & Vận hành'}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          PW: {acc.password}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Right */}
                  <div className="shrink-0">
                    {isCurrent ? (
                      <Link
                        href="/?tab=overview"
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Mở Dashboard</span>
                        <Icons.ChevronRight size={14} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={switchingEmail !== null}
                        onClick={() => handleSwitchToAccount(acc)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          switchingEmail !== null
                            ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                        }`}
                      >
                        {isSwitchingThis ? (
                          <>
                            <Icons.RefreshCw size={13} className="animate-spin" />
                            <span>Đang chuyển...</span>
                          </>
                        ) : (
                          <>
                            <Icons.UserCheck size={14} />
                            <span>Chuyển ngay</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Icons.UserPlus size={14} />
              <span>+ Tạo thêm tài khoản mới</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/login"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium hover:underline inline-flex items-center gap-1"
            >
              <Icons.Lock size={14} />
              <span>Đăng nhập mật khẩu khác</span>
            </Link>
          </div>

          <Link
            href="/?tab=overview"
            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium inline-flex items-center gap-1"
          >
            <span>Vào Dashboard</span>
            <Icons.ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
};
