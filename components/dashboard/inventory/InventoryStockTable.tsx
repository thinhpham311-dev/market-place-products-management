'use client';

import React from 'react';
import { Product } from '@/types/product';
import { IWarehouse } from '@/types/scope';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface InventoryStockTableProps {
  products: Product[];
  activeWarehouseId: string;
  warehouses: IWarehouse[];
  onOpenAdjust: (product: Product, type: 'in' | 'out') => void;
  onOpenTransfer: (product: Product) => void;
}

export const InventoryStockTable: React.FC<InventoryStockTableProps> = ({
  products,
  activeWarehouseId,
  warehouses,
  onOpenAdjust,
  onOpenTransfer,
}) => {
  const { t, tp, tc } = useTranslation();

  const getProductStockForScope = (p: Product, whId: string): number => {
    if (whId === 'all') return p.stock;
    if (p.warehouseStock && typeof p.warehouseStock[whId] === 'number') {
      return p.warehouseStock[whId];
    }
    if (whId === 'wh-a1') return Math.round(p.stock * 0.5);
    if (whId === 'wh-a2') return Math.round(p.stock * 0.3);
    if (whId === 'wh-b1') return Math.max(0, p.stock - Math.round(p.stock * 0.5) - Math.round(p.stock * 0.3));
    return Math.max(0, Math.round(p.stock / 3));
  };

  const activeWh = warehouses.find((w) => w.id === activeWarehouseId);

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_product')}</th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_sku')}</th>
            <th className="py-3 px-4 font-semibold">
              {activeWarehouseId === 'all' ? 'Vị trí kho' : `Vị trí tại [${activeWh?.code || 'Kho'}]`}
            </th>
            <th className="py-3 px-4 font-semibold">
              {activeWarehouseId === 'all' ? t('inventory.col_current_stock') : `Tồn kho [${activeWh?.code}]`}
            </th>
            <th className="py-3 px-4 font-semibold">{t('inventory.col_min_threshold')}</th>
            <th className="py-3 px-4 font-semibold text-right sticky right-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-l border-slate-200/60 dark:border-slate-700/60">
              {t('inventory.col_quick_adjust')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((p) => {
            const scopedStock = getProductStockForScope(p, activeWarehouseId);
            const isOut = scopedStock === 0;
            const isLow = scopedStock <= Math.max(1, Math.round(p.lowStockThreshold * (activeWarehouseId === 'all' ? 1 : 0.4))) && !isOut;
            const translatedName = tp(p.name);

            return (
              <tr key={p.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
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
                  {activeWarehouseId === 'all' ? (
                    <span>{p.warehouseLocation || 'KHO-CHÍNH'}</span>
                  ) : (
                    <span>Kệ {activeWh?.code}-A{p.sku.slice(-2) || '01'}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                        isOut
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          : isLow
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}
                    >
                      {scopedStock} {t('table.stock_unit')}
                    </span>

                    {/* Breakdown by warehouse if "All" is active */}
                    {activeWarehouseId === 'all' && (
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
                        {warehouses.map((w) => {
                          const whStock = getProductStockForScope(p, w.id);
                          return (
                            <span
                              key={w.id}
                              className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title={w.name}
                            >
                              {w.code}: {whStock}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4 text-xs text-slate-500">
                  ≥ {activeWarehouseId === 'all' ? p.lowStockThreshold : Math.max(1, Math.round(p.lowStockThreshold * 0.4))} {t('table.stock_unit')}
                </td>

                <td className="py-3 px-4 text-right sticky right-0 z-10 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 backdrop-blur-sm border-l border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Transfer Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      onClick={() => onOpenTransfer(p)}
                      title="Chuyển kho sản phẩm này"
                      leftIcon={<Icons.Boxes size={12} />}
                    >
                      Chuyển
                    </Button>

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
                      leftIcon={<Icons.Minus size={12} />}
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
