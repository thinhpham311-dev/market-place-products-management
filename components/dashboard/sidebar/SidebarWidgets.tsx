'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  SidebarTheme,
  StoreBranchId,
  setActiveBranch,
} from '@/store/settings/themeSlice';
import { setActiveShop } from '@/store/slices/scopeSlice';
import { showToast } from '@/store/slices/uiSlice';
import { SidebarStyleConfig, COLOR_SWATCHES } from './sidebarThemes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { isSuperAdmin } from '@/lib/auth/permissions';

const BRANCH_DOT_COLORS = [
  'bg-emerald-500 ring-emerald-500/20',
  'bg-indigo-500 ring-indigo-500/20',
  'bg-amber-500 ring-amber-500/20',
  'bg-sky-500 ring-sky-500/20',
  'bg-purple-500 ring-purple-500/20',
  'bg-rose-500 ring-rose-500/20',
  'bg-teal-500 ring-teal-500/20',
];

interface SidebarBranchCardProps {
  collapsed: boolean;
  styles: SidebarStyleConfig;
}

export const SidebarBranchCard: React.FC<SidebarBranchCardProps> = ({
  collapsed,
  styles,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { shops, warehouses, activeShopId } = useAppSelector((s) => s.scope);

  const currentShop = shops.find((s) => s.id === activeShopId);
  const isAll = activeShopId === 'all' || !currentShop;

  const currentShopIndex = currentShop
    ? shops.findIndex((s) => s.id === currentShop.id)
    : -1;
  const currentDotColor = isAll
    ? 'bg-blue-500 ring-blue-500/20'
    : BRANCH_DOT_COLORS[currentShopIndex % BRANCH_DOT_COLORS.length] ||
      BRANCH_DOT_COLORS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectShop = (
    shopId: string,
    shopName: string,
    shopCode: string
  ) => {
    dispatch(setActiveShop(shopId));
    dispatch(setActiveBranch(shopId as StoreBranchId));
    setOpen(false);

    if (shopId === 'all') {
      dispatch(
        showToast(
          'Đã chọn: Tất cả Chi nhánh - Header hiển thị toàn bộ kho hàng'
        )
      );
    } else {
      const childCount = warehouses.filter((w) => w.shopId === shopId).length;
      dispatch(
        showToast(
          `Đã chuyển sang chi nhánh ${shopName} (${shopCode}) - Dropdown Header hiển thị ${childCount} kho tương ứng`
        )
      );
    }
  };

  return (
    <div
      className={`p-3 border-b relative ${styles.headerBorder}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={
          isAll
            ? 'Tất cả Chi nhánh (Toàn hệ thống)'
            : `${currentShop.name} (${currentShop.code})`
        }
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
          styles.switcherCard
        } ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${currentDotColor}`}
          />
          {!collapsed && (
            <div className="truncate text-left">
              <p
                className={`text-xs font-semibold truncate ${styles.switcherTitle}`}
              >
                {isAll ? 'Tất cả Chi nhánh' : currentShop.name}
              </p>
              <p className={`text-[10px] truncate ${styles.switcherSub}`}>
                {isAll
                  ? `${shops.length} chi nhánh • ${warehouses.length} kho`
                  : `${currentShop.code} • ${
                      warehouses.filter((w) => w.shopId === currentShop.id)
                        .length
                    } kho hàng`}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Icons.ChevronDown
            size={14}
            className={`${styles.brandSub} shrink-0 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Branch Dropdown Menu */}
      {open && (
        <div
          className={`absolute z-50 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
            collapsed ? 'left-16 top-2 w-64' : 'left-3 right-3 w-auto'
          }`}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{t('sidebar.select_branch')}</span>
            <span className="text-[9px] font-medium text-indigo-500 lowercase">
              đồng bộ header
            </span>
          </div>

          {/* Option: All branches */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
            <button
              type="button"
              onClick={() =>
                handleSelectShop('all', 'Tất cả Chi nhánh', 'ALL')
              }
              className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isAll
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
                <div className="truncate">
                  <p className="text-xs font-semibold truncate">
                    Tất cả Chi nhánh (Toàn bộ)
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {shops.length} chi nhánh • {warehouses.length} kho
                  </p>
                </div>
              </div>
              {isAll && (
                <Icons.Check
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400 shrink-0"
                />
              )}
            </button>

            {/* Option: Each shop */}
            {shops.map((shop, idx) => {
              const isSelected = !isAll && currentShop?.id === shop.id;
              const shopWhs = warehouses.filter((w) => w.shopId === shop.id);
              const dotColor = BRANCH_DOT_COLORS[idx % BRANCH_DOT_COLORS.length];

              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() =>
                    handleSelectShop(shop.id, shop.name, shop.code)
                  }
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        dotColor.split(' ')[0]
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">
                        {shop.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        <span className="font-mono font-medium">{shop.code}</span>{' '}
                        • {shopWhs.length} kho hàng
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Icons.Check
                      size={14}
                      className="text-indigo-600 dark:text-indigo-400 shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const SidebarContentWidgets: React.FC<{
  sidebarTheme: SidebarTheme;
  onSelectTheme: (theme: SidebarTheme) => void;
  styles: SidebarStyleConfig;
}> = ({ sidebarTheme, onSelectTheme, styles }) => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const isSuper = isSuperAdmin(user);
  const activeSwatch = COLOR_SWATCHES.find((s) => s.id === sidebarTheme);

  return (
    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
      {/* Current Logged-in User & Role Card */}
      {(user?.email || user?.userName) && (
        <div className={`p-2.5 rounded-2xl border ${styles.footerCard}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                isSuper ? 'from-purple-600 to-violet-800' : 'from-indigo-600 to-blue-600'
              } text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-indigo-500/20`}
            >
              {user.avatar || (user.email ? user.email.slice(0, 2).toUpperCase() : 'SO')}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold truncate ${styles.footerTitle}`}>
                {user.userName || user.email.split('@')[0]}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    isSuper
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800'
                  }`}
                >
                  {user.role || (Array.isArray(user.authority) && user.authority[0]) || (isSuper ? 'SUPER_ADMIN' : 'SHOP_OWNER')}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/switch-account"
            className="w-full mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            title="Mở trang chuyển đổi tài khoản"
          >
            <span className="flex items-center gap-1">
              <Icons.User size={12} />
              <span>Chuyển đổi tài khoản</span>
            </span>
            <Icons.ChevronRight size={12} className="text-slate-400" />
          </Link>
        </div>
      )}

      {/* Quick Sidebar Color Swatches */}
      <div className={`px-3 py-2 rounded-2xl border ${styles.footerCard}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-semibold ${styles.footerTitle}`}>
            {t('sidebar.color_title')}
          </span>
          <span className={`text-[10px] ${styles.brandSub}`}>
            {activeSwatch ? t(activeSwatch.labelKey) : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = sidebarTheme === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => onSelectTheme(swatch.id)}
                title={t(swatch.labelKey)}
                className={`w-5 h-5 rounded-full ${swatch.dotClass} transition-transform cursor-pointer ${
                  isSelected
                    ? 'scale-115 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : 'opacity-75 hover:opacity-100 hover:scale-105'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Store status footer */}
      <div className={`p-3 rounded-2xl border ${styles.footerCard}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold ${styles.footerTitle}`}>
            {t('sidebar.sync_channels')}
          </span>
          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium">
            {t('sidebar.status_good')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded ${styles.channelPill}`}>Shopee</span>
          <span className={`text-[10px] px-2 py-0.5 rounded ${styles.channelPill}`}>TikTok</span>
          <span className={`text-[10px] px-2 py-0.5 rounded ${styles.channelPill}`}>Web</span>
        </div>
      </div>
    </div>
  );
};

interface SidebarFooterWidgetsProps {
  collapsed: boolean;
  sidebarTheme: SidebarTheme;
  onSelectTheme: (theme: SidebarTheme) => void;
  styles: SidebarStyleConfig;
  onLogout: () => void;
}

export const SidebarFooterWidgets: React.FC<SidebarFooterWidgetsProps> = ({
  collapsed,
  sidebarTheme,
  onSelectTheme,
  styles,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {!collapsed && (
        <div className="px-3">
          <SidebarContentWidgets
            sidebarTheme={sidebarTheme}
            onSelectTheme={onSelectTheme}
            styles={styles}
          />
        </div>
      )}

      {/* Logout Button */}
      <div className={`p-3 border-t shrink-0 ${styles.headerBorder}`}>
        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            styles.logoutBtn
          } ${collapsed ? 'justify-center px-2' : ''}`}
          title={t('sidebar.logout')}
        >
          <Icons.LogOut size={18} className="shrink-0" />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
        </button>
      </div>
    </>
  );
};
