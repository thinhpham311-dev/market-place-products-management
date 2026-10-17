'use client';

import React from 'react';
import { Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface InventoryStockTableProps {
  products: Product[];
  onOpenAdjust: (product: Product, type: 'in' | 'out') => void;
}

export const InventoryStockTable: React.FC<InventoryStockTableProps> = ({
  products,
  onOpenAdjust,
}) => {
  const { t, tp, tc } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_product')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_sku')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_location')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_current_stock')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_min_threshold')}</th>
            <th className="py-3 px-4 font-semibold text-right">{t('inventory.col_quick_adjust')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((p) => {
            const isOut = p.stock === 0;
            const isLow = p.stock <= p.lowStockThreshold && !isOut;
            const translatedName = tp(p.name);

            return (
              <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.thumbnail}
                      alt={translatedName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 max-w-xs">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                        {translatedName}
                      </span>
                      <span className="text-[11px] text-slate-400">{tc(p.category)}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {p.sku}
                </td>

                <td className="py-3 px-4 text-xs font-mono text-slate-500">
                  {p.warehouseLocation || 'KHO-CHÍNH'}
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isOut
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        : isLow
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}
                  >
                    {p.stock} {t('table.stock_unit')}
                  </span>
                </td>

                <td className="py-3 px-4 text-xs text-slate-500">
                  ≥ {p.lowStockThreshold} {t('table.stock_unit')}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7 px-2.5"
                      onClick={() => onOpenAdjust(p, 'in')}
                      leftIcon={<Icons.Plus size={12} />}
                    >
                      {t('inventory.btn_stock_in')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2.5 text-slate-500"
                      onClick={() => onOpenAdjust(p, 'out')}
                    >
                      {t('inventory.btn_stock_out')}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
