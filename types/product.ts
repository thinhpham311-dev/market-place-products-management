export type ProductStatus = 'active' | 'out_of_stock' | 'draft' | 'archived';

export interface SpuVariationOption {
  label: string;
  value: string;
  image: string;
}

export interface SpuVariationGroup {
  label: string;
  value: SpuVariationOption[];
}

export interface SpuSkuItem {
  sku_tier_idx: number[];
  sku_price: number;
  sku_stock: number;
}

export interface SpuProductAttributes {
  attribute_id: number;
  attribute_value: Array<{ value_id: number }>;
}

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
  categoryId?: string | number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  productCount: number;
  parentId?: string | null;
  category_active?: boolean;
  left?: number;
  right?: number;
  children?: ProductCategory[];
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

  // SPU / SKU API fields
  product_brand?: string;
  product_category?: string[];
  product_attributes?: SpuProductAttributes;
  product_variations?: SpuVariationGroup[];
  sku_list?: SpuSkuItem[];
  
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
