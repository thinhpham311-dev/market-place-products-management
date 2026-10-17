'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface InventoryStatsCardsProps {
  totalUnits: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const InventoryStatsCards: React.FC<InventoryStatsCardsProps> = ({
  totalUnits,
  productCount,
  lowStockCount,
  outOfStockCount,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('inventory.stat_total_units')}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalUnits.toLocaleString()} {t('table.stock_unit')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('inventory.stat_across_products')} {productCount} {t('table.products_unit')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
          <Icons.Boxes size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('inventory.stat_low_stock')}
          </span>
          <h3 className="text-2xl font-bold text-amber-500 mt-1">
            {lowStockCount} {t('table.products_unit')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{t('inventory.stat_below_threshold')}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
          <Icons.AlertTriangle size={24} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('inventory.stat_out_of_stock')}
          </span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            {outOfStockCount} {t('table.products_unit')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{t('inventory.stat_need_restock')}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
          <Icons.AlertCircle size={24} />
        </div>
      </div>
    </div>
  );
};
