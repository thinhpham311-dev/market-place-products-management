'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { userLoggedOut } from '@/store/auth/userSlice';
import {
  setDraftedProducts,
  setPublishedProducts,
} from '@/store/slices/productsSlice';
import { setCategories } from '@/store/slices/categoriesSlice';
import { useHydrated } from '@/store/StoreProvider';
import { apiSignOut } from '@/services/AuthService';
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
import { Icons } from '@/components/ui/Icons';
import { useThemeSync } from '@/components/ui/ThemeToggle';
import { useLanguageSync } from '@/lib/i18n/useTranslation';

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

  const isAuthPage = AUTH_PATHS.includes(pathname);
  const currentTab = getActiveTabFromPathname(pathname);

  useEffect(() => {
    if (!isAuthPage) {
      dispatch(setActiveTab(currentTab));
    }
  }, [currentTab, isAuthPage, dispatch]);

  const loadSpuAndCategories = useCallback(
    async (isManualRetry = false) => {
      if (!isHydrated || !signedIn || isAuthPage || !accessToken) {
        return;
      }

      if (isManualRetry) {
        setIsRetryingApi(true);
      }

      try {
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
    [isHydrated, signedIn, isAuthPage, accessToken, dispatch]
  );

  // Fetch published (/v1/api/product/spu/published/list), drafted (/v1/api/product/spu/drafted/list) & categories (/v1/api/category/all/list) after hydration & sign-in
  useEffect(() => {
    void loadSpuAndCategories(false);
  }, [loadSpuAndCategories, user?.id]);

  // Redirect unauthenticated users to /login when accessing protected pages after store hydration
  useEffect(() => {
    if (!isHydrated) return;
    if (!signedIn && !isAuthPage) {
      router.replace(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, signedIn, isAuthPage, pathname, router]);

  // Automatically refresh token if keepMeSignedIn is checked; otherwise auto-logout when accessToken expires
  useEffect(() => {
    if (!isHydrated || !signedIn || isAuthPage || !accessToken) return;

    const expMs = getJwtExpirationMs(accessToken);
    if (!expMs) return;

    const handleTokenExpired = async () => {
      if (keepMeSignedIn === false) {
        try {
          await apiSignOut({
            id: user?.id,
            email: user?.email,
          });
        } catch {
          // Proceed with local logout even if upstream signout fails
        } finally {
          dispatch(onSignOutSuccess());
          dispatch(userLoggedOut());
          dispatch(showToast('Phiên đăng nhập đã hết hạn. Đã tự động đăng xuất.'));
          router.replace('/login');
        }
        return;
      }

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
    };

    const delayMs = expMs - Date.now();
    if (delayMs <= 0) {
      void handleTokenExpired();
      return;
    }

    const timer = setTimeout(() => {
      void handleTokenExpired();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    isHydrated,
    signedIn,
    isAuthPage,
    accessToken,
    refreshToken,
    keepMeSignedIn,
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

  if (!isHydrated || !signedIn) {
    return null;
  }

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
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {apiErrors.length > 0 ? (
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
