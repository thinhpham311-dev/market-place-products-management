'use client';

import React from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarTheme, SidebarTheme } from '@/store/settings/themeSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { SIDEBAR_THEMES } from './sidebar/sidebarThemes';
import { SidebarBranchCard, SidebarFooterWidgets } from './sidebar/SidebarWidgets';

export type TabType = 'overview' | 'products' | 'inventory' | 'categories' | 'analytics' | 'settings';

export const TAB_ROUTES: Record<TabType, string> = {
  overview: '/?tab=overview',
  products: '/products?tab=all',
  inventory: '/inventory?tab=stock',
  categories: '/categories?tab=all',
  analytics: '/analytics?tab=overview',
  settings: '/settings?tab=general',
};

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  productCounts: {
    total: number;
    lowStock: number;
    categories: number;
  };
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  productCounts,
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const sidebarTheme: SidebarTheme = useAppSelector(
    (s) => s.settings?.theme?.sidebarTheme ?? 'adaptive'
  );
  const styles = SIDEBAR_THEMES[sidebarTheme] || SIDEBAR_THEMES.adaptive;

  const navItems: {
    id: TabType;
    href: string;
    label: string;
    icon: typeof Icons.Dashboard;
    badge: number | string | null;
    badgeVariant?: string;
  }[] = [
    { id: 'overview', href: TAB_ROUTES.overview, label: t('nav.overview'), icon: Icons.Dashboard, badge: null },
    { id: 'products', href: TAB_ROUTES.products, label: t('nav.products'), icon: Icons.Package, badge: productCounts.total },
    {
      id: 'inventory',
      href: TAB_ROUTES.inventory,
      label: t('nav.inventory'),
      icon: Icons.Boxes,
      badge: productCounts.lowStock > 0 ? productCounts.lowStock : null,
      badgeVariant: 'danger',
    },
    { id: 'categories', href: TAB_ROUTES.categories, label: t('nav.categories'), icon: Icons.Layers, badge: productCounts.categories },
    { id: 'analytics', href: TAB_ROUTES.analytics, label: t('nav.analytics'), icon: Icons.BarChart3, badge: t('nav.badge_new'), badgeVariant: 'primary' },
    { id: 'settings', href: TAB_ROUTES.settings, label: t('nav.settings'), icon: Icons.Settings, badge: null },
  ];

  const handleSelectTab = (id: TabType) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className={`relative flex flex-col h-full select-none transition-colors duration-200 ${styles.container}`}>
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-between border-b ${styles.headerBorder} ${
          collapsed ? 'px-2 gap-1' : 'px-4 gap-3'
        }`}
      >
        <Link
          href="/"
          onClick={() => handleSelectTab('overview')}
          className={`flex items-center gap-3 ${collapsed ? 'shrink-0' : 'min-w-0 overflow-hidden'}`}
          title={collapsed ? 'Market Mini Admin' : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <Icons.ShoppingBag size={20} className="text-white shrink-0" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className={`font-bold text-base tracking-tight leading-tight ${styles.brandTitle}`}>
                Market Mini Admin
              </span>
              <span className={`text-[11px] ${styles.brandSub}`}>E-commerce Hub</span>
            </div>
          )}
        </Link>

        {/* Collapse / Open toggle (desktop) - always visible */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-colors cursor-pointer shrink-0 ${styles.iconBtn}`}
          title={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          <Icons.ChevronLeft
            size={18}
            className={`transition-transform duration-200 shrink-0 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Close button (mobile) */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={`md:hidden p-1.5 rounded-lg shrink-0 ${styles.iconBtn}`}
        >
          <Icons.X size={20} />
        </button>
      </div>

      {/* Store Quick Switcher */}
      <SidebarBranchCard collapsed={collapsed} styles={styles} />

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <p className={`px-3 text-[11px] font-semibold uppercase tracking-wider mb-2 ${styles.sectionLabel}`}>
            {t('nav.sales_management')}
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                isActive ? styles.navActive : styles.navInactive
              } ${collapsed ? 'justify-center px-2' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? styles.navIconActive : styles.navIconInactive
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== null && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30'
                      : item.badgeVariant === 'primary'
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-400/30'
                      : styles.badgeDefault
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed hover */}
              {collapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Widgets (Color Swatches, Sync Channels, Logout) */}
      <SidebarFooterWidgets
        collapsed={collapsed}
        sidebarTheme={sidebarTheme}
        onSelectTheme={(theme) => dispatch(setSidebarTheme(theme))}
        styles={styles}
        onLogout={() => {
          setMobileOpen(false);
          onLogout();
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          collapsed ? 'w-[84px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
