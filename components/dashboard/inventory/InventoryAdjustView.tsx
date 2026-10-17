'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import { useAppDispatch } from '@/store/hooks';
import { adjustStock } from '@/store/slices/productsSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface InventoryAdjustViewProps {
  product: Product;
}

export const InventoryAdjustView: React.FC<InventoryAdjustViewProps> = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t, tp } = useTranslation();

  const adjustType: 'in' | 'out' = searchParams.get('type') === 'out' ? 'out' : 'in';

  const setAdjustType = useCallback(
    (type: 'in' | 'out') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('type', type);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!searchParams.get('type')) {
      setAdjustType('in');
    }
  }, [searchParams, setAdjustType]);

  const [adjustQty, setAdjustQty] = useState<number>(adjustType === 'in' ? 20 : 5);
  const [adjustReason, setAdjustReason] = useState<string>(
    adjustType === 'in' ? 'Nhập thêm hàng từ xưởng' : 'Xuất hủy / trả hàng lỗi'
  );

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQty <= 0) return;
    const delta = adjustType === 'out' ? -adjustQty : adjustQty;
    dispatch(adjustStock({ productId: product.id, delta, reason: adjustReason, type: adjustType }));
    dispatch(
      showToast(
        `Đã điều chỉnh kho cho "${tp(product.name)}" (${delta > 0 ? `+${delta}` : delta} ${t(
          'table.stock_unit'
        )}).`
      )
    );
    dispatch(setActiveTab('inventory'));
    router.push('/inventory');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Quay lại"
        >
          <Icons.ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('inventory.col_quick_adjust')}: {tp(product.name)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('inventory.col_sku')}: <span className="font-mono font-semibold">{product.sku}</span> •{' '}
            {t('inventory.col_current_stock')}:{' '}
            <strong>
              {product.stock} {t('table.stock_unit')}
            </strong>
          </p>
        </div>
      </div>

      <form
        onSubmit={handleConfirmAdjust}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 text-xs"
      >
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <img
            src={product.thumbnail}
            alt={tp(product.name)}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {tp(product.name)}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t('inventory.col_location')}:{' '}
              <span className="font-mono">{product.warehouseLocation || 'KHO-CHÍNH'}</span> •{' '}
              {t('inventory.col_min_threshold')}: ≥ {product.lowStockThreshold}{' '}
              {t('table.stock_unit')}
            </p>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('inventory.col_tx_type')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAdjustType('in');
                setAdjustReason('Nhập thêm hàng từ xưởng');
              }}
              className={`p-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adjustType === 'in'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Icons.Plus size={14} /> {t('inventory.btn_stock_in')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdjustType('out');
                setAdjustReason('Xuất hủy / trả hàng lỗi');
              }}
              className={`p-3 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                adjustType === 'out'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Icons.Trash2 size={14} /> {t('inventory.btn_stock_out')}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('inventory.col_delta')} ({t('table.stock_unit')})
          </label>
          <input
            type="number"
            min="1"
            value={adjustQty}
            onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            {t('inventory.col_new_stock')}:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.max(0, product.stock + (adjustType === 'out' ? -adjustQty : adjustQty))}{' '}
              {t('table.stock_unit')}
            </strong>
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('inventory.col_reason_staff')}
          </label>
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="VD: Nhập thêm từ kho tổng, Xuất trả hàng hỏng..."
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            {t('table.cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Icons.Check size={16} />}>
            {t('table.save')}
          </Button>
        </div>
      </form>
    </div>
  );
};
