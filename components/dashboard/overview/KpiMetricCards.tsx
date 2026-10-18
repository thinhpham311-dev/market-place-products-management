'use client';

import React from 'react';
import { DashboardMetrics, Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface KpiMetricCardsProps {
  metrics: DashboardMetrics;
  products: Product[];
  onNavigateTab: (tab: 'products' | 'inventory' | 'categories') => void;
}

export const KpiMetricCards: React.FC<KpiMetricCardsProps> = ({
  metrics,
  products,
  onNavigateTab,
}) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Card 1: Total Products */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('products.tab_all')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icons.Package size={20} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.totalProducts}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <Icons.TrendingUp size={14} className="mr-0.5" /> +12%
            </span>
            <span className="text-slate-400">{t('kpi.active_products_status')}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            {t('products.tab_active')}: <strong className="text-slate-700 dark:text-slate-200">{metrics.activeProducts}</strong>
          </span>
          <span>
            {t('products.tab_draft')}: <strong className="text-slate-700 dark:text-slate-200">{metrics.draftProducts}</strong>
          </span>
        </div>
      </div>

      {/* Card 2: Total Revenue */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('kpi.total_revenue')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Icons.DollarSign size={20} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalRevenue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
              <Icons.TrendingUp size={14} className="mr-0.5" /> +{metrics.growthRate}%
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            {t('kpi.sold_units')}: <strong className="text-slate-700 dark:text-slate-200">{metrics.totalSold.toLocaleString('vi-VN')}</strong>
          </span>
          <span>
            <strong className="text-amber-500">4.85 ★</strong>
          </span>
        </div>
      </div>

      {/* Card 3: Inventory Value */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('kpi.inventory_value')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Icons.Boxes size={20} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalInventoryValue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className="text-sky-600 dark:text-sky-400 font-medium">
              {products.reduce((acc, p) => acc + p.stock, 0)} {t('kpi.units_in_stock')}
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            HN: <strong className="text-slate-700 dark:text-slate-200">65%</strong>
          </span>
          <span>
            HCM: <strong className="text-slate-700 dark:text-slate-200">35%</strong>
          </span>
        </div>
      </div>

      {/* Card 4: Low Stock Alert */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('header.low_stock_alert')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Icons.AlertTriangle size={20} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.lowStockProducts + metrics.outOfStockProducts}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <span>
              {t('products.tab_out_of_stock')}: <strong className="text-rose-600 font-semibold">{metrics.outOfStockProducts}</strong>
            </span>
            <span>•</span>
            <span>
              Low: <strong className="text-amber-500 font-semibold">{metrics.lowStockProducts}</strong>
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => onNavigateTab('inventory')}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {t('kpi.check_inventory_btn')}
          </button>
        </div>
      </div>
    </div>
  );
};
