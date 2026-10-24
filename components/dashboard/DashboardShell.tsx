'use client';

import React, { Suspense, useEffect } from 'react';
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

  const isAuthPage = AUTH_PATHS.includes(pathname);
  const currentTab = getActiveTabFromPathname(pathname);

  useEffect(() => {
    if (!isAuthPage) {
      dispatch(setActiveTab(currentTab));
    }
  }, [currentTab, isAuthPage, dispatch]);

  // Fetch published (/v1/api/product/spu/published/list), drafted (/v1/api/product/spu/drafted/list) & categories (/v1/api/category/all/list) after hydration & sign-in
  useEffect(() => {
    if (!isHydrated || !signedIn || isAuthPage || !accessToken) {
      return;
    }

    let cancelled = false;
    const loadSpuAndCategories = async () => {
      const [publishedRes, draftedRes, categoriesRes] = await Promise.allSettled([
        apiGetPublishedSpuList(),
        apiGetDraftedSpuList(),
        apiGetCategoryAllList(),
      ]);

      if (cancelled) return;

      if (publishedRes.status === 'fulfilled') {
        const rawPublished = extractSpuArray(publishedRes.value.data);
        if (Array.isArray(rawPublished)) {
          const mappedPublished = rawPublished.map((item, idx) =>
            mapSpuToProduct(item, idx, 'active')
          );
          dispatch(setPublishedProducts(mappedPublished));
        }
      }

      if (draftedRes.status === 'fulfilled') {
        const rawDrafted = extractSpuArray(draftedRes.value.data);
        if (Array.isArray(rawDrafted)) {
          const mappedDrafted = rawDrafted.map((item, idx) =>
            mapSpuToProduct(item, idx, 'draft')
          );
          dispatch(setDraftedProducts(mappedDrafted));
        }
      }

      if (categoriesRes.status === 'fulfilled') {
        const rawCategories = extractCategoryArray(categoriesRes.value.data);
        if (Array.isArray(rawCategories)) {
          const mappedCategories = mapRawCategoryList(rawCategories);
          dispatch(setCategories(mappedCategories));
        }
      }
    };

    void loadSpuAndCategories();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, signedIn, isAuthPage, accessToken, user?.id, dispatch]);

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
    const timer = setTimeout(() => {
      dispatch(clearToast());
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage, dispatch]);

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
      dispatch(showToast('Đã đăng xuất tài khoản thành công (/api/shop/signout).'));
      router.push('/login');
    }
  };

  // Render standalone full-screen layout on /login or /sign-in
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Icons.Check size={14} />
            </div>
            <span className="text-xs font-semibold">{toastMessage}</span>
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
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Icons.Check size={14} />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
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
          user={user}
          onLogout={handleLogout}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
};
