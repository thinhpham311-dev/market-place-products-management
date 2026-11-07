'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveWarehouse } from '@/store/slices/scopeSlice';
import { Product, InventoryLog } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { InventoryStatsCards } from './inventory/InventoryStatsCards';
import { InventoryStockTable } from './inventory/InventoryStockTable';
import { InventoryLogsTable } from './inventory/InventoryLogsTable';
import { StockTransferModal } from './inventory/StockTransferModal';

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
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { shops, warehouses, activeShopId, activeWarehouseId } = useAppSelector(
    (s) => s.scope
  );

  const activeShop = shops.find((s) => s.id === activeShopId);
  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  const tabParam = searchParams.get('tab');
  const activeSubTab: 'stock' | 'logs' = tabParam === 'logs' ? 'logs' : 'stock';

  const statusParam = searchParams.get('status');
  const filterStockStatus: 'all' | 'low' | 'out' =
    statusParam === 'low' || statusParam === 'out' ? statusParam : 'all';

  const [searchTerm] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetProduct, setTransferTargetProduct] = useState<Product | undefined>(undefined);

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

  const filteredProducts = products.filter((p) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    const currentStock = getProductStockForScope(p, activeWarehouseId);
    const threshold =
      activeWarehouseId === 'all'
        ? p.lowStockThreshold
        : Math.max(1, Math.round(p.lowStockThreshold * 0.4));

    if (filterStockStatus === 'low' && (currentStock > threshold || currentStock === 0)) return false;
    if (filterStockStatus === 'out' && currentStock > 0) return false;
    return true;
  });

  const lowStockCount = products.filter((p) => {
    const s = getProductStockForScope(p, activeWarehouseId);
    const threshold =
      activeWarehouseId === 'all'
        ? p.lowStockThreshold
        : Math.max(1, Math.round(p.lowStockThreshold * 0.4));
    return s <= threshold && s > 0;
  }).length;

  const outOfStockCount = products.filter(
    (p) => getProductStockForScope(p, activeWarehouseId) === 0
  ).length;

  const totalUnits = products.reduce(
    (acc, p) => acc + getProductStockForScope(p, activeWarehouseId),
    0
  );

  const handleOpenAdjust = (product: Product, type: 'in' | 'out' = 'in') => {
    router.push(`/inventory/${product.id}/adjust?type=${type}`);
  };

  const handleOpenTransfer = (product?: Product) => {
    setTransferTargetProduct(product);
    setIsTransferModalOpen(true);
  };

  // Filter logs if a specific warehouse is active
  const filteredLogs = logs.filter((log) => {
    if (activeWarehouseId === 'all') return true;
    if (log.warehouseId) {
      return log.warehouseId === activeWarehouseId || log.targetWarehouseId === activeWarehouseId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Scope Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-indigo-950/20 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            {activeWarehouseId === 'all' ? <Icons.Boxes size={20} /> : <Icons.Store size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Phạm vi tồn kho:
              </span>
              {activeWarehouse ? (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                  {activeWarehouse.name} [{activeWarehouse.code}]
                </span>
              ) : activeShop ? (
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80">
                  {activeShop.name} (Tất cả kho)
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                  Toàn hệ thống (Tất cả Cửa hàng & Kho)
                </span>
              )}

              {activeWarehouse?.managerName && (
                <span className="text-[11px] text-slate-500">
                  • Trưởng kho: <strong>{activeWarehouse.managerName}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeWarehouseId !== 'all'
                ? `Số liệu và phiếu biến động đang được lọc riêng biệt cho kho ${activeWarehouse?.code}.`
                : 'Đang tổng hợp số lượng tồn kho trên toàn bộ mạng lưới chi nhánh và kho hàng.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {activeWarehouseId !== 'all' && (
            <button
              type="button"
              onClick={() => dispatch(setActiveWarehouse('all'))}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold px-2 py-1"
            >
              Xem tất cả kho
            </button>
          )}

          {/* Action: Stock Transfer */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icons.Boxes size={16} />}
            onClick={() => handleOpenTransfer()}
          >
            Điều Chuyển Kho
          </Button>
        </div>
      </div>

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
              {t('inventory.tab_logs')} ({filteredLogs.length})
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
          <InventoryStockTable
            products={filteredProducts}
            activeWarehouseId={activeWarehouseId}
            warehouses={warehouses}
            onOpenAdjust={handleOpenAdjust}
            onOpenTransfer={handleOpenTransfer}
          />
        )}

        {activeSubTab === 'logs' && <InventoryLogsTable logs={filteredLogs} />}
      </div>

      {/* Stock Transfer Modal */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTargetProduct(undefined);
        }}
        products={products}
        defaultProductId={transferTargetProduct?.id}
        defaultSourceWarehouseId={activeWarehouseId !== 'all' ? activeWarehouseId : undefined}
      />
    </div>
  );
};
