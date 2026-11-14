'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface ShopStatsHeroProps {
  totalShops: number;
  activeShops: number;
  totalWarehouses: number;
  totalProducts: number;
  onExportCSV: () => void;
  onOpenAddShop: () => void;
}

export const ShopStatsHero: React.FC<ShopStatsHeroProps> = ({
  totalShops,
  activeShops,
  totalWarehouses,
  totalProducts,
  onExportCSV,
  onOpenAddShop,
}) => {
  return (
    <>
      {/* Platform Root Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-7 lg:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-md">
                <Icons.ShieldCheck size={14} className="text-purple-300 shrink-0" />
                SUPER_ADMIN Dedicated Console
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-medium bg-white/10 text-slate-200 border border-white/10">
                Root Scope • Multi-Merchant
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5 sm:gap-3">
              Quản lý Toàn bộ Gian Hàng (Shops)
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              Khu vực quản trị cấp cao dành riêng cho <strong>SUPER_ADMIN</strong>. Cho phép giám sát tập trung, cấu hình chi nhánh, quản trị liên kết kho bãi và chuyển đổi trực tiếp phạm vi hoạt động giữa các Merchant trên toàn sàn.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Icons.Download size={16} />}
              onClick={onExportCSV}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm flex-1 sm:flex-none justify-center text-xs sm:text-sm"
            >
              Xuất CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Icons.Plus size={16} />}
              onClick={onOpenAddShop}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/25 border-0 flex-1 sm:flex-none justify-center text-xs sm:text-sm"
            >
              Thêm Gian Hàng Mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Shops */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
            <Icons.Store size={20} className="sm:hidden" />
            <Icons.Store size={22} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Tổng Gian Hàng
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalShops}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate block">
              Toàn hệ sinh thái
            </span>
          </div>
        </div>

        {/* Active Shops */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <Icons.Check size={20} className="sm:hidden" />
            <Icons.Check size={22} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Đang Hoạt Động
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeShops}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate block">
              {totalShops > 0 ? `${Math.round((activeShops / totalShops) * 100)}% tổng số` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Warehouses */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
            <Icons.Boxes size={20} className="sm:hidden" />
            <Icons.Boxes size={22} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Kho Bãi Trực Thuộc
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalWarehouses}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate block">
              Phân bổ liên tỉnh
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60">
            <Icons.Package size={20} className="sm:hidden" />
            <Icons.Package size={22} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Sản Phẩm Lưu Thông
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalProducts}
            </h3>
            <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate block">
              SPU đang mở bán
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
