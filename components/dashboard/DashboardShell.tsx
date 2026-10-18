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
import { onSignOutSuccess } from '@/store/auth/sessionSlice';
import { userLoggedOut } from '@/store/auth/userSlice';
import { apiSignOut } from '@/services/AuthService';
import { Sidebar, TabType, TAB_ROUTES } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Icons } from '@/components/ui/Icons';
import { useThemeSync } from '@/components/ui/ThemeToggle';
import { useLanguageSync } from '@/lib/i18n/useTranslation';

const AUTH_PATHS = ['/login', '/sign-in', '/register', '/sign-up'];

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

  useThemeSync();
  useLanguageSync();

  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
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

  // Redirect unauthenticated users to /login when accessing protected pages
  useEffect(() => {
    if (!signedIn && !isAuthPage) {
      router.replace(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
    }
  }, [signedIn, isAuthPage, pathname, router]);

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

  if (!signedIn) {
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
