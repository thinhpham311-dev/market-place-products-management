'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import store from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDashboardMetrics } from '@/store/selectors/metricsSelectors';
import {
  setActiveTab,
  setSidebarCollapsed,
  setMobileDrawerOpen,
  setGlobalSearch,
  clearToast,
  showToast,
  showErrorToast,
  addApiError,
  removeApiError,
  clearApiErrors,
  DashboardApiError,
} from '@/store/slices/uiSlice';
import {
  onSignOutSuccess,
} from '@/store/auth/sessionSlice';
import { userLoggedOut, setUser } from '@/store/auth/userSlice';
import {
  setDraftedProducts,
  setPublishedProducts,
} from '@/store/slices/productsSlice';
import { setCategories } from '@/store/slices/categoriesSlice';
import { useHydrated } from '@/store/StoreProvider';
import { apiSignOut, apiGetShopProfile } from '@/services/AuthService';
import { refreshAccessTokenSingleFlight } from '@/services/BaseService';
import {
  getApiErrorMessage,
  toUserFriendlyErrorMessage,
} from '@/lib/http/handleAxiosError';
import {
  apiGetDraftedSpuList,
  apiGetPublishedSpuList,
  extractSpuArray,
  mapSpuToProduct,
} from '@/services/ProductService';
import {
  apiGetCategoryAllList,
  extractCategoryArray,
  mapRawCategoryList,
} from '@/services/CategoryService';
import { Sidebar, TabType, TAB_ROUTES } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { Icons } from '@/components/ui/Icons';
import { useThemeSync } from '@/components/ui/ThemeToggle';
import { useLanguageSync } from '@/lib/i18n/useTranslation';
import { isCategoryManager, normalizeRoleKey } from '@/lib/auth/permissions';

const AUTH_PATHS = ['/login', '/sign-in', '/register', '/sign-up'];

function getJwtExpirationMs(token?: string): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    if (typeof parsed.exp === 'number') {
      return parsed.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}

function getActiveTabFromPathname(pathname: string): TabType {
  if (pathname.startsWith('/shops')) return 'shops';
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/categories')) return 'categories';
  if (pathname.startsWith('/analytics')) return 'analytics';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'overview';
}

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useHydrated();

  useThemeSync();
  useLanguageSync();

  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const accessToken = useAppSelector((s) => s.auth.session.token);
  const refreshToken = useAppSelector((s) => s.auth.session.refreshToken);
  const keepMeSignedIn = useAppSelector((s) => s.auth.session.keepMeSignedIn);
  const user = useAppSelector((s) => s.auth.user);

  const categories = useAppSelector((s) => s.categories.items);
  const metrics = useAppSelector(selectDashboardMetrics);

  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileDrawerOpen = useAppSelector((s) => s.ui.mobileDrawerOpen);
  const globalSearch = useAppSelector((s) => s.ui.globalSearch);
  const toastMessage = useAppSelector((s) => s.ui.toastMessage);
  const toastType = useAppSelector((s) => s.ui.toastType ?? 'success');
  const apiErrors = useAppSelector((s) => s.ui.apiErrors ?? []);

  const [isRetryingApi, setIsRetryingApi] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCheckedAuthRef = useRef(false);

  const isAuthPage = AUTH_PATHS.includes(pathname);
  const currentTab = getActiveTabFromPathname(pathname);

  useEffect(() => {
    if (!isAuthPage) {
      dispatch(setActiveTab(currentTab));
    }
  }, [currentTab, isAuthPage, dispatch]);

  const loadSpuAndCategories = useCallback(
    async (isManualRetry = false) => {
      if (!isHydrated || isCheckingAuth || !signedIn || isAuthPage || !accessToken) {
        return;
      }

      if (isManualRetry) {
        setIsRetryingApi(true);
      }

      try {
        const isCatManager = isCategoryManager(user);

        // Category Manager is restricted from products & inventory - only fetch categories
        if (isCatManager) {
          try {
            const categoriesRes = await apiGetCategoryAllList();
            const rawCategories = extractCategoryArray(categoriesRes.data);
            if (Array.isArray(rawCategories)) {
              const mappedCategories = mapRawCategoryList(rawCategories);
              dispatch(setCategories(mappedCategories));
            }
            dispatch(removeApiError('/api/category/all/list'));
          } catch (err: unknown) {
            const message = getApiErrorMessage(err);
            dispatch(
              addApiError({
                id: '/api/category/all/list',
                endpoint: '/api/category/all/list',
                label: 'Danh sách danh mục',
                status: 500,
                message,
                timestamp: new Date().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              })
            );
          }
          return;
        }

        const [publishedRes, draftedRes, categoriesRes] = await Promise.allSettled([
          apiGetPublishedSpuList(),
          apiGetDraftedSpuList(),
          apiGetCategoryAllList(),
        ]);

        const failedErrors: DashboardApiError[] = [];
        const nowTime = new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const checkResultError = (
          res: PromiseSettledResult<{ data: any }>,
          endpoint: string,
          label: string
        ) => {
          if (res.status === 'rejected') {
            const reason = res.reason as {
              status?: number;
              message?: string;
              response?: { status?: number; data?: { message?: string } };
            };
            const status =
              reason?.status ?? reason?.response?.status ?? 500;
            const message = getApiErrorMessage(reason);
            if (status >= 500) {
              const errItem: DashboardApiError = {
                id: endpoint,
                endpoint,
                label,
                status,
                message,
                timestamp: nowTime,
              };
              failedErrors.push(errItem);
              dispatch(addApiError(errItem));
            }
            return true;
          }

          const data = res.value?.data;
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const payloadCode = Number(
              data.code ??
                data.statusCode ??
                (typeof data.status === 'number' ? data.status : 0)
            );
            if (
              payloadCode >= 500 ||
              (data.status === 'error' && (!payloadCode || payloadCode >= 500))
            ) {
              const status = payloadCode >= 500 ? payloadCode : 500;
              const message = toUserFriendlyErrorMessage(
                typeof data.message === 'string' ? data.message : undefined,
                status
              );
              const errItem: DashboardApiError = {
                id: endpoint,
                endpoint,
                label,
                status,
                message,
                timestamp: nowTime,
              };
              failedErrors.push(errItem);
              dispatch(addApiError(errItem));
              return true;
            }
          }

          dispatch(removeApiError(endpoint));
          return false;
        };

        const pubFailed = checkResultError(
          publishedRes,
          '/api/product/spu/published/list',
          'Danh sách sản phẩm đang bán'
        );
        const draftFailed = checkResultError(
          draftedRes,
          '/api/product/spu/drafted/list',
          'Danh sách sản phẩm nháp'
        );
        const catFailed = checkResultError(
          categoriesRes,
          '/api/category/all/list',
          'Danh sách danh mục'
        );

        if (!pubFailed && publishedRes.status === 'fulfilled') {
          const rawPublished = extractSpuArray(publishedRes.value.data);
          if (Array.isArray(rawPublished)) {
            const mappedPublished = rawPublished.map((item, idx) =>
              mapSpuToProduct(item, idx, 'active')
            );
            dispatch(setPublishedProducts(mappedPublished));
          }
        }

        if (!draftFailed && draftedRes.status === 'fulfilled') {
          const rawDrafted = extractSpuArray(draftedRes.value.data);
          if (Array.isArray(rawDrafted)) {
            const mappedDrafted = rawDrafted.map((item, idx) =>
              mapSpuToProduct(item, idx, 'draft')
            );
            dispatch(setDraftedProducts(mappedDrafted));
          }
        }

        if (!catFailed && categoriesRes.status === 'fulfilled') {
          const rawCategories = extractCategoryArray(categoriesRes.value.data);
          if (Array.isArray(rawCategories)) {
            const mappedCategories = mapRawCategoryList(rawCategories);
            dispatch(setCategories(mappedCategories));
          }
        }

        if (failedErrors.length > 0) {
          dispatch(showErrorToast(failedErrors[0].message));
        } else if (isManualRetry) {
          dispatch(clearApiErrors());
          dispatch(showToast('Đã kết nối lại và tải dữ liệu thành công!'));
        }
      } finally {
        if (isManualRetry) {
          setIsRetryingApi(false);
        }
      }
    },
    [isHydrated, isCheckingAuth, signedIn, isAuthPage, accessToken, dispatch]
  );

  // On startup / re-access: check persisted session and renew token automatically without requiring re-login
  useEffect(() => {
    if (!isHydrated || hasCheckedAuthRef.current) return;
    hasCheckedAuthRef.current = true;

    let isCancelled = false;

    const restoreSession = async () => {
      const state = store.getState();
      const currentToken = state?.auth?.session?.token;
      const currentSignedIn = state?.auth?.session?.signedIn;

      // Check if persisted token is valid or needs renewal.
      const expMs = getJwtExpirationMs(currentToken);
      const isExpiredOrMissing =
        !currentToken || (expMs !== null && expMs <= Date.now() + 60 * 1000);

      if (isExpiredOrMissing) {
        if (!currentSignedIn) {
          setIsCheckingAuth(false);
          return;
        }
        try {
          const newToken = await refreshAccessTokenSingleFlight();
          if (newToken && !isCancelled) {
            setIsCheckingAuth(false);
            if (isAuthPage) {
              const rawRedirectUrl =
                typeof window !== 'undefined'
                  ? new URLSearchParams(window.location.search).get('redirectUrl')
                  : null;
              router.replace(rawRedirectUrl || '/?tab=overview');
            }
            return;
          }
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403) {
            if (!isCancelled) {
              dispatch(onSignOutSuccess());
              dispatch(userLoggedOut());
              setIsCheckingAuth(false);
              if (!isAuthPage) {
                router.replace(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
              }
            }
            return;
          }
        }
      }

      if (!isCancelled) {
        // Enforce role consistency for root platform admin & shop owner accounts
        const currentUser = state?.auth?.user;
        if (currentUser?.email) {
          const cleanEmail = currentUser.email.toLowerCase().trim();
          if (cleanEmail === 'admin@novashop.vn' && currentUser.role !== 'SUPER_ADMIN') {
            dispatch(
              setUser({
                ...currentUser,
                role: 'SUPER_ADMIN',
                userName:
                  currentUser.userName && currentUser.userName !== 'Shop Admin'
                    ? currentUser.userName
                    : 'Admin Shop (Root)',
                authority: Array.from(
                  new Set(['SUPER_ADMIN', 'admin', ...(currentUser.authority || [])])
                ),
              })
            );
          } else if (
            cleanEmail === 'owneradmin@novashop.vn' &&
            currentUser.role !== 'SHOP_OWNER'
          ) {
            dispatch(
              setUser({
                ...currentUser,
                role: 'SHOP_OWNER',
                userName:
                  currentUser.userName && currentUser.userName !== 'Shop Admin'
                    ? currentUser.userName
                    : 'Owner Admin',
                authority: Array.from(
                  new Set(['SHOP_OWNER', ...(currentUser.authority || [])])
                ).filter((r) => r !== 'SUPER_ADMIN'),
              })
            );
          }
        }

        setIsCheckingAuth(false);
        if (isAuthPage && (currentSignedIn || Boolean(currentToken))) {
          const rawRedirectUrl =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('redirectUrl')
              : null;
          router.replace(rawRedirectUrl || '/?tab=overview');
        }
      }
    };

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [isHydrated, isAuthPage, pathname, router, dispatch]);

  // Fetch published (/v1/api/product/spu/published/list), drafted (/v1/api/product/spu/drafted/list) & categories (/v1/api/category/all/list) after auth check & sign-in
  useEffect(() => {
    if (!isCheckingAuth && signedIn) {
      void loadSpuAndCategories(false);
    }
  }, [loadSpuAndCategories, isCheckingAuth, signedIn, user?.id]);

  // Synchronize authenticated user profile with /v1/api/shop/profile
  useEffect(() => {
    if (!isHydrated || isCheckingAuth || !signedIn || isAuthPage || !accessToken) return;

    let cancelled = false;

    const syncShopProfile = async () => {
      try {
        const res = await apiGetShopProfile();
        if (cancelled || !res?.data) return;

        const metadata =
          (res.data as Record<string, any>)?.metadata ||
          (res.data as Record<string, any>)?.data ||
          res.data;
        const shop = metadata?.shop || metadata?.user || metadata;
        if (!shop || (!shop.name && !shop.email && !shop._id && !shop.id)) return;

        const rawRoles: string[] =
          (Array.isArray(shop.roles) && shop.roles.length > 0 && shop.roles) ||
          (Array.isArray(metadata?.roles) && metadata.roles.length > 0 && metadata.roles) ||
          (shop.role ? [shop.role] : []) ||
          (metadata?.role ? [metadata.role] : []) ||
          (Array.isArray(user?.authority) && user.authority.length > 0 && user.authority) ||
          ['SHOP_OWNER'];

        const normalizedRawRoles = rawRoles.map((r) => normalizeRoleKey(r));
        const cleanEmail = (shop.email || user?.email || '').trim().toLowerCase();

        // Check SUPER_ADMIN first: If API returns SUPER_ADMIN in roles, role field, or root email admin@novashop.vn
        const isRootSuperAdmin =
          cleanEmail === 'admin@novashop.vn' ||
          cleanEmail.startsWith('admin@') ||
          normalizedRawRoles.includes('SUPER_ADMIN') ||
          normalizeRoleKey(shop.role) === 'SUPER_ADMIN' ||
          normalizeRoleKey(metadata?.role) === 'SUPER_ADMIN';

        let resolvedRole = '';
        if (isRootSuperAdmin) {
          resolvedRole = 'SUPER_ADMIN';
        } else if (
          cleanEmail === 'catmanager@novashop.vn' ||
          cleanEmail === 'category@novashop.vn' ||
          normalizedRawRoles.includes('CATEGORY_MANAGER') ||
          normalizeRoleKey(shop.role) === 'CATEGORY_MANAGER'
        ) {
          resolvedRole = 'CATEGORY_MANAGER';
        } else if (
          cleanEmail === 'catalog@novashop.vn' ||
          normalizedRawRoles.includes('CATALOG_SPECIALIST') ||
          normalizeRoleKey(shop.role) === 'CATALOG_SPECIALIST'
        ) {
          resolvedRole = 'CATALOG_SPECIALIST';
        } else if (
          cleanEmail === 'owneradmin@novashop.vn' ||
          cleanEmail === 'owner@novashop.vn' ||
          normalizedRawRoles.includes('SHOP_OWNER') ||
          normalizedRawRoles.includes('SHOP') ||
          normalizedRawRoles.includes('STORE_OWNER') ||
          normalizedRawRoles.includes('OWNER') ||
          normalizedRawRoles.includes('CHỦ_GIAN_HÀNG')
        ) {
          resolvedRole = 'SHOP_OWNER';
        } else if (normalizedRawRoles.includes('ADMIN')) {
          resolvedRole = 'SUPER_ADMIN';
        } else {
          resolvedRole = user?.role || 'SHOP_OWNER';
        }

        const apiRolesFromSource: string[] | null =
          (Array.isArray(shop.roles) && shop.roles.length > 0 && shop.roles) ||
          (Array.isArray(metadata?.roles) && metadata.roles.length > 0 && metadata.roles) ||
          (shop.role ? [shop.role] : []) ||
          null;

        let resolvedRoles: string[] = [];
        if (resolvedRole === 'SUPER_ADMIN') {
          const baseRoles = apiRolesFromSource || rawRoles;
          resolvedRoles = Array.from(new Set(['SUPER_ADMIN', ...baseRoles]));
        } else if (resolvedRole === 'SHOP_OWNER') {
          const baseRoles = apiRolesFromSource || rawRoles;
          resolvedRoles = Array.from(new Set([...baseRoles, 'SHOP_OWNER'])).filter(
            (r) => normalizeRoleKey(r) !== 'SUPER_ADMIN'
          );
        } else if (apiRolesFromSource && apiRolesFromSource.length > 0) {
          resolvedRoles = apiRolesFromSource;
        } else {
          resolvedRoles = [resolvedRole];
        }

        const name =
          shop.name ||
          shop.userName ||
          (resolvedRole === 'SUPER_ADMIN' ? 'Admin Shop (Root)' : user?.userName || 'Shop Admin');
        const initials = name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        dispatch(
          setUser({
            id: shop._id || shop.id || user?.id,
            userName: name,
            email: shop.email || user?.email || '',
            avatar: initials || user?.avatar || (resolvedRole === 'SUPER_ADMIN' ? 'SA' : 'SO'),
            role: resolvedRole,
            authority: resolvedRoles,
          })
        );
      } catch {
        // Keep current state if endpoint is temporarily unreachable
      }
    };

    void syncShopProfile();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isCheckingAuth, signedIn, isAuthPage, accessToken, dispatch]);

  // Redirect unauthenticated users to /login when accessing protected pages after initial auth check
  useEffect(() => {
    if (!isHydrated || isCheckingAuth) return;
    if (!signedIn && !isAuthPage) {
      router.replace(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isCheckingAuth, signedIn, isAuthPage, pathname, router]);

  // Automatically refresh token in background 60s before accessToken expires while app is active
  useEffect(() => {
    if (!isHydrated || isCheckingAuth || !signedIn || isAuthPage || !accessToken) return;

    const expMs = getJwtExpirationMs(accessToken);
    if (!expMs) return;

    const refreshLeadTimeMs = 60 * 1000;
    const delayMs = Math.max(0, expMs - Date.now() - refreshLeadTimeMs);

    const timer = setTimeout(async () => {
      try {
        await refreshAccessTokenSingleFlight();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          dispatch(onSignOutSuccess());
          dispatch(userLoggedOut());
          router.replace('/login');
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    isHydrated,
    isCheckingAuth,
    signedIn,
    isAuthPage,
    accessToken,
    refreshToken,
    user?.id,
    user?.email,
    dispatch,
    router,
  ]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const duration = toastType === 'error' ? 6000 : 3500;
    const timer = setTimeout(() => {
      dispatch(clearToast());
    }, duration);
    return () => clearTimeout(timer);
  }, [toastMessage, toastType, dispatch]);

  const handleSelectTab = (tab: TabType) => {
    dispatch(setActiveTab(tab));
    const targetRoute = TAB_ROUTES[tab];
    if (user?.id) {
      const [basePath, existingQuery] = targetRoute.split('?');
      const params = new URLSearchParams(existingQuery || '');
      params.set('clientId', user.id);
      router.push(`${basePath}?${params.toString()}`);
      return;
    }
    router.push(targetRoute);
  };

  const handleOpenCreateProduct = () => {
    router.push('/products/new');
  };

  const handleLogout = async () => {
    try {
      await apiSignOut({
        id: user?.id,
        email: user?.email,
      });
    } catch {
      // Proceed with local logout even if upstream signout returns an error
    } finally {
      dispatch(onSignOutSuccess());
      dispatch(userLoggedOut());
      dispatch(clearApiErrors());
      dispatch(showToast('Đã đăng xuất tài khoản thành công (/api/shop/signout).'));
      router.push('/login');
    }
  };

  // Render standalone full-screen layout on /login or /sign-in
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {toastMessage && (
          <div
            className={`fixed top-6 right-6 z-50 max-w-md px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
              toastType === 'error'
                ? 'bg-rose-950 text-white border-rose-700/80'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-200'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 ${
                toastType === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            >
              {toastType === 'error' ? (
                <Icons.AlertCircle size={14} />
              ) : (
                <Icons.Check size={14} />
              )}
            </div>
            <span className="text-xs font-semibold flex-1">{toastMessage}</span>
            <button
              onClick={() => dispatch(clearToast())}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Icons.X size={14} />
            </button>
          </div>
        )}
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    );
  }

  if (!isHydrated || (isCheckingAuth && !isAuthPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            Đang khôi phục phiên làm việc...
          </p>
        </div>
      </div>
    );
  }

  if (!signedIn && !isAuthPage) {
    return null;
  }

  const isCatManager = isCategoryManager(user);
  const isProductOrInventory =
    pathname.startsWith('/products') || pathname.startsWith('/inventory');

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Toast Notification Floating Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 max-w-md px-4 py-3 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-top-4 duration-200 ${
            toastType === 'error'
              ? 'bg-rose-950/95 text-white border-rose-700/80 shadow-rose-950/40'
              : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-200'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 ${
              toastType === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          >
            {toastType === 'error' ? (
              <Icons.AlertCircle size={14} />
            ) : (
              <Icons.Check size={14} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold break-words">
              {toastType === 'error'
                ? toUserFriendlyErrorMessage(toastMessage, 500)
                : toastMessage}
            </p>
          </div>
          <button
            onClick={() => dispatch(clearToast())}
            className="text-slate-400 hover:text-white dark:hover:text-slate-600 transition-colors shrink-0 mt-0.5 cursor-pointer"
            title="Đóng thông báo"
          >
            <Icons.X size={14} />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={currentTab}
        setActiveTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        setCollapsed={(v) => dispatch(setSidebarCollapsed(v))}
        mobileOpen={mobileDrawerOpen}
        setMobileOpen={(v) => dispatch(setMobileDrawerOpen(v))}
        productCounts={{
          total: metrics.totalProducts,
          lowStock: metrics.lowStockProducts + metrics.outOfStockProducts,
          categories: categories.length,
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onOpenCreateProduct={handleOpenCreateProduct}
          onOpenMobileMenu={() => dispatch(setMobileDrawerOpen(true))}
          searchQuery={globalSearch}
          setSearchQuery={(v) => dispatch(setGlobalSearch(v))}
          lowStockCount={metrics.lowStockProducts + metrics.outOfStockProducts}
          apiErrors={apiErrors}
          onRetryApiErrors={() => void loadSpuAndCategories(true)}
          onClearApiErrors={() => dispatch(clearApiErrors())}
          user={user}
          onLogout={handleLogout}
          canCreateProduct={!isCatManager}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isCatManager && isProductOrInventory ? (
            <AccessDenied
              featureName={
                pathname.startsWith('/inventory')
                  ? 'Quản lý Tồn kho'
                  : 'Quản lý Sản phẩm'
              }
              restrictedRole="CATEGORY_MANAGER"
              description="Tài khoản có vai trò CATEGORY_MANAGER chỉ được phân quyền quản lý Danh mục & Thương hiệu, không có quyền truy cập vào các trang Quản lý Sản phẩm và Tồn kho."
            />
          ) : apiErrors.length > 0 ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in"
            >
              <div className="max-w-md w-full rounded-3xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                  <Icons.AlertTriangle size={28} />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 mb-2">
                  Tạm thời gián đoạn
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Chưa thể tải thông tin trang quản lý
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {toUserFriendlyErrorMessage(
                    apiErrors[0]?.message,
                    apiErrors[0]?.status ?? 500
                  )}
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => void loadSpuAndCategories(true)}
                    disabled={isRetryingApi}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Icons.RefreshCw
                      size={14}
                      className={isRetryingApi ? 'animate-spin' : ''}
                    />
                    <span>{isRetryingApi ? 'Đang thử lại...' : 'Thử lại'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Suspense fallback={null}>{children}</Suspense>
          )}
        </main>
      </div>
    </div>
  );
};
