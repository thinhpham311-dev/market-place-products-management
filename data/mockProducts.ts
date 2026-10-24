import { Product, ProductCategory, InventoryLog, DashboardMetrics } from '@/types/product';

export const mockCategories: ProductCategory[] = [];

export const initialProducts: Product[] = [];

export const mockInventoryLogs: InventoryLog[] = [];

export const mockMetrics: DashboardMetrics = {
  totalProducts: 0,
  activeProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  draftProducts: 0,
  totalInventoryValue: 0,
  totalRevenue: 0,
  totalSold: 0,
  growthRate: 0,
};
