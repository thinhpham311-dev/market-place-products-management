'use client';

import React from 'react';
import { Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface LowStockAlertBannerProps {
  lowStockList: Product[];
  products: Product[];
  onNavigateInventory: () => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  lowStockList,
  onNavigateInventory,
}) => {
  const { t } = useTranslation();

  if (lowStockList.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
          <Icons.AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-amber-200">
            {lowStockList.length} {t('kpi.low_stock_banner_title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {t('kpi.low_stock_banner_sub')}
          </p>
        </div>
      </div>
      <button
        onClick={onNavigateInventory}
        className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shrink-0 cursor-pointer"
      >
        {t('kpi.check_inventory_btn')}
      </button>
    </div>
  );
};
