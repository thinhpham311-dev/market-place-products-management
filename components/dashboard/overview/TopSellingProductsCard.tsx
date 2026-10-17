'use client';

import React from 'react';
import { Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface TopSellingProductsCardProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateProducts: () => void;
}

export const TopSellingProductsCard: React.FC<TopSellingProductsCardProps> = ({
  products,
  onSelectProduct,
  onNavigateProducts,
}) => {
  const { t, tp, tc } = useTranslation();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('kpi.top_selling_title')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('kpi.top_selling_sub')}
          </p>
        </div>
        <button
          onClick={onNavigateProducts}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {t('see_more')}
          <Icons.ChevronRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {products.map((product, idx) => {
          const translatedName = tp(product.name);
          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={product.thumbnail}
                    alt={translatedName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-800 shadow">
                    #{idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:text-indigo-600 transition-colors">
                    {translatedName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-mono">{product.sku}</span>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-300">{tc(product.category)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {product.soldCount.toLocaleString()} {t('kpi.sold_units')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
