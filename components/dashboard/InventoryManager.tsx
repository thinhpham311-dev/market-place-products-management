'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product, InventoryLog } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { InventoryStatsCards } from './inventory/InventoryStatsCards';
import { InventoryStockTable } from './inventory/InventoryStockTable';
import { InventoryLogsTable } from './inventory/InventoryLogsTable';

interface InventoryManagerProps {
  products: Product[];
  logs: InventoryLog[];
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  logs,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const tabParam = searchParams.get('tab');
  const activeSubTab: 'stock' | 'logs' = tabParam === 'logs' ? 'logs' : 'stock';

  const statusParam = searchParams.get('status');
  const filterStockStatus: 'all' | 'low' | 'out' =
    statusParam === 'low' || statusParam === 'out' ? statusParam : 'all';

  const [searchTerm] = useState('');

  const updateUrlParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => params.set(k, v));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!searchParams.get('tab')) {
      updateUrlParams({ tab: 'stock' });
    }
  }, [searchParams, updateUrlParams]);

  const setActiveSubTab = (tab: 'stock' | 'logs') => {
    updateUrlParams({ tab });
  };

  const setFilterStockStatus = (status: 'all' | 'low' | 'out') => {
    updateUrlParams({ status });
  };

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (filterStockStatus === 'low' && (p.stock > p.lowStockThreshold || p.stock === 0)) return false;
    if (filterStockStatus === 'out' && p.stock > 0) return false;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  const handleOpenAdjust = (product: Product, type: 'in' | 'out' = 'in') => {
    router.push(`/inventory/${product.id}/adjust?type=${type}`);
  };

  return (
    <div className="space-y-6">
      <InventoryStatsCards
        totalUnits={totalUnits}
        productCount={products.length}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 py-3 -mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'stock'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('inventory.tab_stock_list')} ({products.length})
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'logs'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('inventory.tab_logs')} ({logs.length})
            </button>
          </div>

          {activeSubTab === 'stock' && (
            <div className="flex items-center gap-2">
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as 'all' | 'low' | 'out')}
                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">{t('inventory.filter_all_status')}</option>
                <option value="low">
                  {t('products.stock_low')} ({lowStockCount})
                </option>
                <option value="out">
                  {t('products.tab_out_of_stock')} ({outOfStockCount})
                </option>
              </select>
            </div>
          )}
        </div>

        {activeSubTab === 'stock' && (
          <InventoryStockTable products={filteredProducts} onOpenAdjust={handleOpenAdjust} />
        )}

        {activeSubTab === 'logs' && <InventoryLogsTable logs={logs} />}
      </div>
    </div>
  );
};
