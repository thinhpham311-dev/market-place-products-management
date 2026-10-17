'use client';

import React from 'react';
import { ProductStatus } from '@/types/product';

interface InventoryTabProps {
  stock: number;
  setStock: (v: number) => void;
  lowStockThreshold: number;
  setLowStockThreshold: (v: number) => void;
  warehouseLocation: string;
  setWarehouseLocation: (v: string) => void;
  status: ProductStatus;
  setStatus: (v: ProductStatus) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  stock,
  setStock,
  lowStockThreshold,
  setLowStockThreshold,
  warehouseLocation,
  setWarehouseLocation,
  status,
  setStatus,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Số lượng tồn kho ban đầu <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ngưỡng cảnh báo sắp hết hàng
          </label>
          <input
            type="number"
            min="1"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(Number(e.target.value))}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Vị trí lưu kho / Kệ hàng
          </label>
          <input
            type="text"
            value={warehouseLocation}
            onChange={(e) => setWarehouseLocation(e.target.value)}
            placeholder="VD: KHO-HN-A12..."
            className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Trạng thái sản phẩm
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          >
            <option value="active">Đang bán (Active)</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="archived">Tạm ẩn (Archived)</option>
            <option value="out_of_stock">Hết hàng (Out of stock)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
