'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { transferStockBetweenWarehouses } from '@/store/slices/productsSlice';
import { showToast, showErrorToast } from '@/store/slices/uiSlice';
import { Product } from '@/types/product';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  defaultProductId?: string;
  defaultSourceWarehouseId?: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  products,
  defaultProductId,
  defaultSourceWarehouseId,
}) => {
  const dispatch = useAppDispatch();
  const { warehouses } = useAppSelector((s) => s.scope);
  const user = useAppSelector((s) => s.auth.user);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    defaultProductId || products[0]?.id || ''
  );

  const activeWarehouses = warehouses.filter((w) => w.status === 'ACTIVE');
  const [fromWhId, setFromWhId] = useState<string>(
    defaultSourceWarehouseId || activeWarehouses[0]?.id || ''
  );
  const [toWhId, setToWhId] = useState<string>(
    activeWarehouses.find((w) => w.id !== fromWhId)?.id || activeWarehouses[1]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Helper to get stock of product in a warehouse
  const getWhStock = (p: Product | undefined, whId: string): number => {
    if (!p) return 0;
    if (p.warehouseStock && typeof p.warehouseStock[whId] === 'number') {
      return p.warehouseStock[whId];
    }
    // Fallback ratio
    if (whId === 'wh-a1') return Math.round(p.stock * 0.5);
    if (whId === 'wh-a2') return Math.round(p.stock * 0.3);
    if (whId === 'wh-b1') return Math.max(0, p.stock - Math.round(p.stock * 0.5) - Math.round(p.stock * 0.3));
    return Math.max(0, Math.round(p.stock / Math.max(1, activeWarehouses.length)));
  };

  const availableInSource = getWhStock(selectedProduct, fromWhId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (fromWhId === toWhId) {
      dispatch(showErrorToast('Kho xuất và kho nhập phải khác nhau'));
      return;
    }

    if (quantity <= 0) {
      dispatch(showErrorToast('Số lượng chuyển kho phải lớn hơn 0'));
      return;
    }

    if (quantity > availableInSource) {
      dispatch(showErrorToast(`Kho xuất chỉ còn ${availableInSource} sản phẩm, không đủ để chuyển`));
      return;
    }

    const sourceWh = warehouses.find((w) => w.id === fromWhId);
    const destWh = warehouses.find((w) => w.id === toWhId);

    dispatch(
      transferStockBetweenWarehouses({
        productId: selectedProduct.id,
        fromWarehouseId: fromWhId,
        fromWarehouseName: sourceWh?.name || fromWhId,
        toWarehouseId: toWhId,
        toWarehouseName: destWh?.name || toWhId,
        quantity,
        reason: reason.trim() || `Điều chuyển hàng từ ${sourceWh?.code} sang ${destWh?.code}`,
        staffName: user?.userName || 'Warehouse Manager',
      })
    );

    dispatch(
      showToast(
        `Đã tạo phiếu điều chuyển ${quantity} x [${selectedProduct.sku}] từ ${sourceWh?.code} sang ${destWh?.code} thành công!`
      )
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Phiếu Điều Chuyển Kho (Stock Transfer)"
      description="Luân chuyển hàng hóa giữa các kho hàng trong chuỗi để cân bằng tồn kho hoặc đáp ứng đơn hàng."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select Product */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Chọn Sản phẩm cần chuyển *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setQuantity(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} [{p.sku}] — Tổng tồn: {p.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Source & Dest Warehouse */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Kho xuất hàng *</span>
              <span className="text-[11px] font-normal text-slate-500">
                Khả dụng: <strong className="text-emerald-600 dark:text-emerald-400">{availableInSource}</strong>
              </span>
            </label>
            <select
              value={fromWhId}
              onChange={(e) => {
                const newFrom = e.target.value;
                setFromWhId(newFrom);
                if (newFrom === toWhId) {
                  const alt = activeWarehouses.find((w) => w.id !== newFrom);
                  if (alt) setToWhId(alt.id);
                }
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              {activeWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Kho nhập hàng *</span>
              <span className="text-[11px] font-normal text-slate-500">
                Hiện có: <strong className="text-indigo-600 dark:text-indigo-400">{getWhStock(selectedProduct, toWhId)}</strong>
              </span>
            </label>
            <select
              value={toWhId}
              onChange={(e) => setToWhId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              {activeWarehouses
                .filter((w) => w.id !== fromWhId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Số lượng chuyển *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={availableInSource}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setQuantity(availableInSource)}
                className="px-2.5 py-2 text-xs rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Max
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Người thực hiện
            </label>
            <input
              type="text"
              disabled
              value={user?.userName || 'Warehouse Manager'}
              className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Lý do / Ghi chú điều chuyển
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Điều chuyển bù kho Cầu Giấy phục vụ flash sale cuối tuần"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={availableInSource <= 0 || quantity <= 0}
            leftIcon={<Icons.Boxes size={16} />}
          >
            Xác nhận Chuyển Kho
          </Button>
        </div>
      </form>
    </Modal>
  );
};
