'use client';

import React from 'react';
import { Product, ProductCategory, DashboardMetrics } from '@/types/product';
import { KpiMetricCards } from './overview/KpiMetricCards';
import { TopSellingProductsCard } from './overview/TopSellingProductsCard';
import { CategoryRevenueCard } from './overview/CategoryRevenueCard';
import { LowStockAlertBanner } from './overview/LowStockAlertBanner';

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
  const topSellingProducts = [...products]
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 4);

  const lowStockList = products.filter(
    (p) => p.stock <= p.lowStockThreshold || p.status === 'out_of_stock'
  );

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
      <KpiMetricCards
        metrics={metrics}
        products={products}
        onNavigateTab={onNavigateTab}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopSellingProductsCard
          products={topSellingProducts}
          onSelectProduct={onSelectProduct}
          onNavigateProducts={() => onNavigateTab('products')}
        />

        <CategoryRevenueCard
          categorySales={categorySales}
          totalCategories={categories.length}
        />
      </div>

      <LowStockAlertBanner
        lowStockList={lowStockList}
        products={products}
        onNavigateInventory={() => onNavigateTab('inventory')}
      />
    </div>
  );
};
