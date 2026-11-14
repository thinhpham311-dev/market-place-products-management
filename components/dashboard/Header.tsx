'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { UserState } from '@/store/auth/userSlice';
import { DashboardApiError } from '@/store/slices/uiSlice';
import { UserProfileMenu } from '@/components/auth/UserProfileMenu';
import { HeaderScopeSelector } from '@/components/dashboard/HeaderScopeSelector';

interface HeaderProps {
  onOpenCreateProduct: () => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  lowStockCount: number;
  apiErrors?: DashboardApiError[];
  onRetryApiErrors?: () => void;
  onClearApiErrors?: () => void;
  user: UserState;
  onLogout: () => void;
  canCreateProduct?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateProduct,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
  lowStockCount,
  apiErrors = [],
  onRetryApiErrors,
  onClearApiErrors,
  user,
  onLogout,
  canCreateProduct = true,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const totalNotifications =
    apiErrors.length > 0 ? apiErrors.length : lowStockCount > 0 ? 2 : 0;

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showNotifications) setShowNotifications(false);
        if (isMobileSearchOpen) setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications, isMobileSearchOpen]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-4 transition-colors">
      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && apiErrors.length === 0 && (
        <div className="sm:hidden absolute inset-0 z-50 bg-white dark:bg-slate-900 px-2.5 flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 shadow-sm animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            title="Đóng tìm kiếm"
            aria-label="Đóng tìm kiếm"
          >
            <Icons.ArrowLeft size={19} />
          </button>
          <div className="relative flex-1 min-w-0">
            <Icons.Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('header.search_placeholder')}
              className="w-full pl-9 pr-7 py-2 text-xs bg-slate-100/90 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-1 py-1.5 shrink-0 cursor-pointer"
          >
            Xong
          </button>
        </div>
      )}

      {/* Left: Mobile hamburger + Global Search */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none shrink-0 cursor-pointer"
          title="Mở thanh điều hướng"
          aria-label="Mở thanh điều hướng"
        >
          <Icons.Menu size={20} />
        </button>

        {apiErrors.length === 0 && (
          <>
            {/* Mobile search toggle trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative shrink-0 cursor-pointer"
              title={t('header.search_placeholder')}
              aria-label="Tìm kiếm sản phẩm"
            >
              <Icons.Search size={19} />
              {searchQuery && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Desktop / Tablet inline search bar */}
            <div className="hidden sm:block relative w-full">
              <Icons.Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.search_placeholder')}
                className="w-full pl-9 sm:pl-10 pr-7 sm:pr-8 py-2 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none truncate"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <Icons.X size={14} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Scope Switcher (Shop & Warehouse) */}
        <HeaderScopeSelector />

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 sm:p-2 rounded-xl relative transition-colors cursor-pointer shrink-0 ${
              apiErrors.length > 0
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
          >
            <Icons.Bell size={18} />
            {(apiErrors.length > 0 || lowStockCount > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="fixed inset-x-3 top-16 max-w-sm ml-auto sm:absolute sm:top-full sm:inset-x-auto sm:right-0 sm:mt-2 sm:w-96 sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {t('header.notifications')} ({totalNotifications})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onClearApiErrors?.();
                    setShowNotifications(false);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {t('header.mark_read')}
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {apiErrors.length > 0 ? (
                  apiErrors.map((err) => (
                    <div
                      key={err.id}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                        <Icons.AlertCircle size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                          Tải dữ liệu chưa thành công
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          {err.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {lowStockCount > 0 && (
                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
                        <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                          <Icons.AlertTriangle size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t('header.low_stock_alert')} ({lowStockCount})
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('header.low_stock_desc')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                        <Icons.CheckCircle2 size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {t('header.sync_orders_title')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('header.sync_orders_desc')}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA: Add Product */}
        {apiErrors.length === 0 && canCreateProduct && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icons.Plus size={16} />}
            onClick={onOpenCreateProduct}
            className="shadow-sm shadow-indigo-500/20 px-2 sm:px-3 shrink-0"
            title={t('header.add_product')}
            aria-label={t('header.add_product')}
          >
            <span className="hidden md:inline">{t('header.add_product')}</span>
            <span className="hidden sm:inline md:hidden">{t('header.add_short')}</span>
          </Button>
        )}

        {/* User Profile Dropdown */}
        <UserProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};
