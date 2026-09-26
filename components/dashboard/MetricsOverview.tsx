'use client';

import React from 'react';
import { Product, ProductCategory, DashboardMetrics } from '@/types/product';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';

interface MetricsOverviewProps {
  metrics: DashboardMetrics;
  products: Product[];
  categories: ProductCategory[];
  onSelectProduct: (product: Product) => void;
  onNavigateTab: (tab: 'products' | 'inventory' | 'categories') => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  products,
  categories,
  onSelectProduct,
  onNavigateTab,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const topSellingProducts = [...products]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 4);

  const lowStockList = products.filter(
    (p) => p.stock <= p.lowStockThreshold || p.status === 'out_of_stock'
  );

  // Category sales share calculation
  const categorySales = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    const catRevenue = catProducts.reduce((acc, curr) => acc + curr.revenue, 0);
    const catSold = catProducts.reduce((acc, curr) => acc + curr.soldCount, 0);
    return {
      name: cat.name,
      revenue: catRevenue,
      sold: catSold,
      count: catProducts.length,
      percentage: metrics.totalRevenue > 0 ? Math.round((catRevenue / metrics.totalRevenue) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Products */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng sản phẩm
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Icons.Package size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalProducts}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                <Icons.TrendingUp size={14} className="mr-0.5" /> +12%
              </span>
              <span className="text-slate-400">so với tháng trước</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Đang bán: <strong className="text-slate-700 dark:text-slate-200">{metrics.activeProducts}</strong></span>
            <span>Bản nháp: <strong className="text-slate-700 dark:text-slate-200">{metrics.draftProducts}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Doanh thu luỹ kế
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icons.DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                <Icons.TrendingUp size={14} className="mr-0.5" /> +{metrics.growthRate}%
              </span>
              <span className="text-slate-400">tăng trưởng</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Đã bán: <strong className="text-slate-700 dark:text-slate-200">{metrics.totalSold.toLocaleString()}</strong> món</span>
            <span>Đánh giá: <strong className="text-amber-500">4.85 ★</strong></span>
          </div>
        </div>

        {/* Card 3: Inventory Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Giá trị tồn kho
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Icons.Boxes size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalInventoryValue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-sky-600 dark:text-sky-400 font-medium">
                {products.reduce((acc, p) => acc + p.stock, 0)} đơn vị tồn
              </span>
              <span className="text-slate-400">tại 2 kho</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Kho Hà Nội: <strong className="text-slate-700 dark:text-slate-200">65%</strong></span>
            <span>Kho HCM: <strong className="text-slate-700 dark:text-slate-200">35%</strong></span>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cảnh báo tồn kho
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Icons.AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.lowStockProducts + metrics.outOfStockProducts}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span>Hết hàng: <strong className="text-rose-600 font-semibold">{metrics.outOfStockProducts}</strong></span>
              <span>•</span>
              <span>Sắp hết: <strong className="text-amber-500 font-semibold">{metrics.lowStockProducts}</strong></span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              Xem danh sách nhập hàng
              <Icons.ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts & Highlights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Selling Products */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sản phẩm bán chạy nhất (Top Sellers)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Thống kê theo số lượng đơn bán và doanh thu thực tế
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Xem tất cả
              <Icons.ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {topSellingProducts.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-slate-800 shadow">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-mono">{product.sku}</span>
                      <span>•</span>
                      <span className="text-slate-500 dark:text-slate-300">{product.category}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    {product.soldCount.toLocaleString()} đã bán
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Category Revenue Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cơ cấu theo Danh mục
              </h3>
              <span className="text-xs text-slate-400">{categories.length} nhóm ngành</span>
            </div>

            <div className="space-y-4">
              {categorySales.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                      {cat.name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(cat.revenue)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0
                          ? 'bg-indigo-500'
                          : i === 1
                          ? 'bg-sky-500'
                          : i === 2
                          ? 'bg-emerald-500'
                          : i === 3
                          ? 'bg-amber-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Đồng bộ đa sàn thương mại</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Shopee • TikTok • Lazada
            </div>
          </div>
        </div>
      </div>

      {/* Stock warning notification banner if any */}
      {lowStockList.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <Icons.AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-amber-200">
                Có {lowStockList.length} sản phẩm cần bổ sung hàng gấp
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Các mặt hàng như Bàn phím cơ ({products.find(p => p.id === 'prod-104')?.name}), Đồng hồ Classic đang chạm mức cảnh báo.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shrink-0"
          >
            Mở Quản lý Tồn kho
          </button>
        </div>
      )}
    </div>
  );
};
