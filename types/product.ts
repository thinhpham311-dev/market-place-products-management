export type ProductStatus = 'active' | 'out_of_stock' | 'draft' | 'archived';

export interface ProductVariant {
  id: string;
  sku: string;
  name: string; // e.g., "Size M / Đen"
  options: { [key: string]: string }; // { Size: 'M', Color: 'Đen' }
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  barcode?: string;
  image?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount: number;
  parentId?: string | null;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string; // Category ID or Name
  categoryId: string;
  brand: string;
  tags: string[];
  
  // Pricing
  price: number;
  originalPrice?: number;
  costPrice: number;
  
  // Inventory
  stock: number;
  lowStockThreshold: number;
  warehouseLocation?: string;
  
  // Media
  thumbnail: string;
  images: string[];
  
  // Status & Metrics
  status: ProductStatus;
  soldCount: number;
  rating: number;
  reviewCount: number;
  revenue: number;
  
  // Variants
  hasVariants: boolean;
  variantAttributes?: { name: string; values: string[] }[];
  variants?: ProductVariant[];
  
  // Sales channels & SEO
  channels: ('shopee' | 'tiktok' | 'lazada' | 'website')[];
  channelStatus?: {
    channel: 'shopee' | 'tiktok' | 'lazada' | 'website';
    status: 'published' | 'pending' | 'failed' | 'draft';
    publishedAt?: string;
  }[];
  publishedAt?: string;
  scheduledPublishAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  staffName: string;
  date: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  draftProducts: number;
  totalInventoryValue: number;
  totalRevenue: number;
  totalSold: number;
  growthRate: number;
}

export interface ProductFilterState {
  search: string;
  category: string;
  status: ProductStatus | 'all';
  stockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  minPrice?: number;
  maxPrice?: number;
  sortBy: 'name' | 'price_asc' | 'price_desc' | 'stock' | 'sold' | 'created';
}
