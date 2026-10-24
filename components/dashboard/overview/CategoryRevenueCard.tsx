'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CategorySaleItem {
  name: string;
  revenue: number;
  sold: number;
  count: number;
  percentage: number;
}

interface CategoryRevenueCardProps {
  categorySales: CategorySaleItem[];
  totalCategories: number;
}

export const CategoryRevenueCard: React.FC<CategoryRevenueCardProps> = ({
  categorySales,
  totalCategories,
}) => {
  const { t, tc, formatCurrency } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('kpi.category_share_title')}
          </h3>
          <span className="text-xs text-slate-400">
            {totalCategories} {t('overview.tab_categories')}
          </span>
        </div>

        <div className="space-y-4">
          {categorySales.map((cat, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                  {tc(cat.name)}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(cat.revenue)} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    i === 0
                      ? 'bg-indigo-500'
                      : i === 1
                      ? 'bg-sky-500'
                      : i === 2
                      ? 'bg-emerald-500'
                      : i === 3
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">{t('sidebar.sync_channels')}</span>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
          Shopee • TikTok • Lazada
        </div>
      </div>
    </div>
  );
};
