import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { DashboardMetrics } from '@/types/product';

const selectProducts = (state: RootState) => state.products.items;

export const selectDashboardMetrics = createSelector(
  selectProducts,
  (products): DashboardMetrics => {
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const lowStockProducts = products.filter(
      (p) => p.stock <= p.lowStockThreshold && p.stock > 0
    ).length;
    const outOfStockProducts = products.filter(
      (p) => p.stock === 0 || p.status === 'out_of_stock'
    ).length;
    const draftProducts = products.filter((p) => p.status === 'draft').length;
    const totalInventoryValue = products.reduce(
      (acc, p) => acc + p.costPrice * p.stock,
      0
    );
    const totalRevenue = products.reduce((acc, p) => acc + p.revenue, 0);
    const totalSold = products.reduce((acc, p) => acc + p.soldCount, 0);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      draftProducts,
      totalInventoryValue,
      totalRevenue,
      totalSold,
      growthRate: 0,
    };
  }
);
