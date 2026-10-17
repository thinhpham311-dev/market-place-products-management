'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  SidebarTheme,
  StoreBranchId,
  setActiveBranch,
} from '@/store/settings/themeSlice';
import { showToast } from '@/store/slices/uiSlice';
import { SidebarStyleConfig, COLOR_SWATCHES } from './sidebarThemes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DashboardTranslationKey } from '@/lib/i18n/dashboard-translations';
import { Icons } from '@/components/ui/Icons';

interface BranchOption {
  id: StoreBranchId;
  nameKey: DashboardTranslationKey;
  subKey: DashboardTranslationKey;
  code: string;
  dotColor: string;
}

const BRANCH_OPTIONS: BranchOption[] = [
  {
    id: 'hn_main',
    nameKey: 'sidebar.branch_main',
    subKey: 'sidebar.branch_sub',
    code: 'HN-01',
    dotColor: 'bg-emerald-500 ring-emerald-500/20',
  },
  {
    id: 'hcm_south',
    nameKey: 'sidebar.branch_hcm',
    subKey: 'sidebar.branch_hcm_sub',
    code: 'HCM-02',
    dotColor: 'bg-indigo-500 ring-indigo-500/20',
  },
  {
    id: 'dn_central',
    nameKey: 'sidebar.branch_dn',
    subKey: 'sidebar.branch_dn_sub',
    code: 'DN-03',
    dotColor: 'bg-amber-500 ring-amber-500/20',
  },
  {
    id: 'hp_port',
    nameKey: 'sidebar.branch_hp',
    subKey: 'sidebar.branch_hp_sub',
    code: 'HP-04',
    dotColor: 'bg-sky-500 ring-sky-500/20',
  },
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

  const activeBranchId: StoreBranchId = useAppSelector(
    (s) => s.settings?.theme?.activeBranchId ?? 'hn_main'
  );

  const currentBranch =
    BRANCH_OPTIONS.find((b) => b.id === activeBranchId) || BRANCH_OPTIONS[0];

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

  const handleSelectBranch = (branch: BranchOption) => {
    dispatch(setActiveBranch(branch.id));
    setOpen(false);
    dispatch(showToast(`${t('sidebar.branch_switched')} ${t(branch.nameKey)}`));
  };

  return (
    <div className={`p-3 border-b relative ${styles.headerBorder}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={t(currentBranch.nameKey)}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
          styles.switcherCard
        } ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-2.5 h-2.5 rounded-full ring-4 shrink-0 ${currentBranch.dotColor}`}
          />
          {!collapsed && (
            <div className="truncate text-left">
              <p className={`text-xs font-semibold truncate ${styles.switcherTitle}`}>
                {t(currentBranch.nameKey)}
              </p>
              <p className={`text-[10px] truncate ${styles.switcherSub}`}>
                {t(currentBranch.subKey)}
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
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {t('sidebar.select_branch')}
          </div>
          {BRANCH_OPTIONS.map((branch) => {
            const isSelected = branch.id === currentBranch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => handleSelectBranch(branch)}
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      branch.dotColor.split(' ')[0]
                    }`}
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold truncate">
                      {t(branch.nameKey)}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {t(branch.subKey)} • <span className="font-mono">{branch.code}</span>
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
      )}
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
  const activeSwatch = COLOR_SWATCHES.find((s) => s.id === sidebarTheme);

  return (
    <>
      {/* Quick Sidebar Color Swatches */}
      {!collapsed && (
        <div className={`px-4 py-2.5 mx-3 mb-2 rounded-2xl border ${styles.footerCard}`}>
          <div className="flex items-center justify-between mb-2">
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
      )}

      {/* Store status footer */}
      {!collapsed && (
        <div className={`p-3.5 mx-3 mb-2 rounded-2xl border ${styles.footerCard}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${styles.footerTitle}`}>
              {t('sidebar.sync_channels')}
            </span>
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium">
              {t('sidebar.status_good')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2 py-0.5 rounded ${styles.channelPill}`}>Shopee</span>
            <span className={`text-[11px] px-2 py-0.5 rounded ${styles.channelPill}`}>TikTok</span>
            <span className={`text-[11px] px-2 py-0.5 rounded ${styles.channelPill}`}>Web</span>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <div className={`p-3 border-t ${styles.headerBorder}`}>
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
