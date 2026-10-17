'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

interface PricingTabProps {
  price: number;
  setPrice: (v: number) => void;
  originalPrice: number;
  setOriginalPrice: (v: number) => void;
  costPrice: number;
  setCostPrice: (v: number) => void;
}

export const PricingTab: React.FC<PricingTabProps> = ({
  price,
  setPrice,
  originalPrice,
  setOriginalPrice,
  costPrice,
  setCostPrice,
}) => {
  const profitMargin = price > 0 && costPrice > 0 ? Math.round(((price - costPrice) / price) * 100) : 0;
  const grossProfit = price - costPrice;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Giá bán ưu đãi (VNĐ) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Giá niêm yết gốc (VNĐ)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(Number(e.target.value))}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Giá vốn nhập kho (VNĐ)
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Live Profit Margin Calculator Widget */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
        <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-1.5">
          <Icons.BarChart3 size={16} />
          Ước tính Tỷ suất Lợi nhuận gộp
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
            <span className="text-slate-400 block text-[11px]">Lãi gộp / sản phẩm</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grossProfit)}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
            <span className="text-slate-400 block text-[11px]">Biên lợi nhuận</span>
            <span
              className={`text-sm font-bold mt-0.5 block ${
                profitMargin > 30 ? 'text-emerald-600' : profitMargin > 15 ? 'text-amber-600' : 'text-rose-600'
              }`}
            >
              {profitMargin}%
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
            <span className="text-slate-400 block text-[11px]">Mức giảm giá</span>
            <span className="text-sm font-bold text-rose-600 mt-0.5 block">
              {originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% off` : '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
