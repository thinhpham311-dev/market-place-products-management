import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductStatus, InventoryLog } from '@/types/product';

interface ProductsState {
  items: Product[];
  inventoryLogs: InventoryLog[];
  publishedOverrides?: Record<string, boolean>;
}

const initialState: ProductsState = {
  items: [],
  inventoryLogs: [],
  publishedOverrides: {},
};

function matchesProductId(product: Product, targetId: string): boolean {
  return (
    product.id === targetId ||
    product.product_id === targetId ||
    product.spu_id === targetId ||
    product.sku === targetId
  );
}

function recordPublishedOverride(
  state: ProductsState,
  product: Product,
  isPublished: boolean
) {
  if (!state.publishedOverrides) {
    state.publishedOverrides = {};
  }
  state.publishedOverrides[product.id] = isPublished;
  if (product.product_id) {
    state.publishedOverrides[product.product_id] = isPublished;
  }
  if (product.spu_id) {
    state.publishedOverrides[product.spu_id] = isPublished;
  }
}

function isProductExplicitlyUnpublished(
  product: Product,
  overrides?: Record<string, boolean>
): boolean {
  if (!overrides) return false;
  return (
    overrides[product.id] === false ||
    (Boolean(product.product_id) && overrides[product.product_id!] === false) ||
    (Boolean(product.spu_id) && overrides[product.spu_id!] === false)
  );
}

function isProductPublishedByOverride(
  product: Product,
  overrides?: Record<string, boolean>
): boolean {
  if (!overrides) return false;
  if (isProductExplicitlyUnpublished(product, overrides)) return false;
  return Boolean(
    overrides[product.id] ||
      (product.product_id && overrides[product.product_id]) ||
      (product.spu_id && overrides[product.spu_id])
  );
}


function cleanProdStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    const obj = val as Record<string, any>;
    return String(obj.name || obj.label || obj.title || obj.vi || fallback);
  }
  const s = String(val).trim();
  return s === '[object Object]' ? fallback : s;
}

function sanitizeProduct(p: Product): Product {
  const safeName = cleanProdStr(p.name, 'Sản phẩm');
  const safeCategory = cleanProdStr(p.category, 'Chưa phân loại');
  const safeCategoryId = cleanProdStr(p.categoryId, 'cat-1');
  const safeBrand = cleanProdStr(p.brand, 'NovaShop');
  const safeProductCategory = Array.isArray(p.product_category)
    ? p.product_category
        .map((c) => cleanProdStr(c, ''))
        .filter((c) => Boolean(c && c !== '[object Object]'))
    : safeCategoryId ? [safeCategoryId] : [];

  return {
    ...p,
    name: safeName,
    category: safeCategory,
    categoryId: safeCategoryId,
    brand: safeBrand,
    product_brand: cleanProdStr(p.product_brand, safeBrand),
    product_category: safeProductCategory,
    slug: p.slug === 'object-object' || !p.slug ? p.id : p.slug,
  };
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Create
    addProduct(state, action: PayloadAction<Product>) {
      state.items.unshift(sanitizeProduct(action.payload));
    },

    // Update
    updateProduct(state, action: PayloadAction<{ id: string; changes: Partial<Product> }>) {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = sanitizeProduct({ ...state.items[index], ...action.payload.changes });
      }
    },

    // Delete
    deleteProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },

    // Duplicate
    duplicateProduct(state, action: PayloadAction<Product>) {
      const duplicated: Product = {
        ...action.payload,
        id: `prod-${Date.now()}`,
        sku: `${action.payload.sku}-COPY`,
        name: `${action.payload.name} (Bản sao)`,
        soldCount: 0,
        revenue: 0,
        reviewCount: 0,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      state.items.unshift(duplicated);
    },

    // Toggle status
    toggleStatus(state, action: PayloadAction<string>) {
      const product = state.items.find((p) => matchesProductId(p, action.payload));
      if (product) {
        product.status = product.status === 'active' ? 'archived' : 'active';
        if (product.status === 'active') {
          recordPublishedOverride(state, product, true);
        }
      }
    },

    // Quick update stock from product list
    quickUpdateStock(
      state,
      action: PayloadAction<{ id: string; newStock: number }>
    ) {
      const { id, newStock } = action.payload;
      const product = state.items.find((p) => p.id === id);
      if (!product) return;

      const diff = newStock - product.stock;
      const previousStock = product.stock;

      product.stock = newStock;
      if (newStock === 0) {
        product.status = 'out_of_stock';
      } else if (product.status === 'out_of_stock') {
        product.status = 'active';
      }

      if (diff !== 0) {
        state.inventoryLogs.unshift({
          id: `log-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: diff > 0 ? 'in' : 'out',
          quantity: diff,
          previousStock,
          newStock,
          reason: 'Chỉnh sửa nhanh số tồn tại bảng sản phẩm',
          staffName: 'Admin Shop',
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
      }
    },

    // Adjust stock from Inventory tab
    adjustStock(
      state,
      action: PayloadAction<{
        productId: string;
        delta: number;
        reason: string;
        type: 'in' | 'out' | 'adjustment';
      }>
    ) {
      const { productId, delta, reason, type } = action.payload;
      const product = state.items.find((p) => p.id === productId);
      if (!product) return;

      const previousStock = product.stock;
      const newStock = Math.max(0, previousStock + delta);

      product.stock = newStock;
      if (newStock === 0) {
        product.status = 'out_of_stock';
      } else if (product.status === 'out_of_stock') {
        product.status = 'active';
      }

      state.inventoryLogs.unshift({
        id: `log-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type,
        quantity: delta,
        previousStock,
        newStock,
        reason: reason || 'Phiếu điều chỉnh tồn kho',
        staffName: 'Admin Shop',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    },

    // Publish / schedule a product to channels
    publishProduct(
      state,
      action: PayloadAction<{
        productId: string;
        channels: ('shopee' | 'tiktok' | 'lazada' | 'website')[];
        publishMode: 'instant' | 'scheduled';
        scheduledTime?: string;
      }>
    ) {
      const { productId, channels, publishMode, scheduledTime } = action.payload;
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const product = state.items.find((p) => matchesProductId(p, productId));
      if (!product) return;

      product.channels = channels;
      if (publishMode === 'instant') {
        product.status = 'active';
        product.publishedAt = now;
        recordPublishedOverride(state, product, true);
      } else {
        product.scheduledPublishAt = scheduledTime;
      }
    },

    // Unpublish a product back to draft
    unpublishProduct(state, action: PayloadAction<string>) {
      const product = state.items.find((p) => matchesProductId(p, action.payload));
      if (!product) return;
      product.status = 'draft';
      delete product.publishedAt;
      if (Array.isArray(product.tags)) {
        product.tags = product.tags.filter((t) => t !== 'published');
        if (!product.tags.includes('draft')) {
          product.tags.push('draft');
        }
      }
      recordPublishedOverride(state, product, false);
    },

    // Bulk publish
    bulkPublish(state, action: PayloadAction<string[]>) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      state.items.forEach((p) => {
        if (action.payload.some((id) => matchesProductId(p, id))) {
          p.status = 'active';
          p.publishedAt = now;
          recordPublishedOverride(state, p, true);
        }
      });
    },

    // Bulk unpublish
    bulkUnpublish(state, action: PayloadAction<string[]>) {
      state.items.forEach((p) => {
        if (action.payload.some((id) => matchesProductId(p, id))) {
          p.status = 'draft';
          delete p.publishedAt;
          if (Array.isArray(p.tags)) {
            p.tags = p.tags.filter((t) => t !== 'published');
            if (!p.tags.includes('draft')) {
              p.tags.push('draft');
            }
          }
          recordPublishedOverride(state, p, false);
        }
      });
    },

    // Bulk update status
    bulkUpdateStatus(
      state,
      action: PayloadAction<{ ids: string[]; status: ProductStatus }>
    ) {
      const { ids, status } = action.payload;
      state.items.forEach((p) => {
        if (ids.some((id) => matchesProductId(p, id))) {
          p.status = status;
          if (status === 'active') {
            recordPublishedOverride(state, p, true);
          } else if (status === 'draft') {
            recordPublishedOverride(state, p, false);
          }
        }
      });
    },

    // Bulk delete
    bulkDelete(state, action: PayloadAction<string[]>) {
      state.items = state.items.filter(
        (p) => !action.payload.some((id) => matchesProductId(p, id))
      );
    },

    // Sync drafted products fetched from /v1/api/product/spu/drafted/list
    setDraftedProducts(state, action: PayloadAction<Product[]>) {
      const overrides = state.publishedOverrides || {};
      const adjustedIncoming = action.payload.map(sanitizeProduct).map((p) =>
        isProductPublishedByOverride(p, overrides)
          ? { ...p, status: 'active' as ProductStatus }
          : p
      );
      const incomingKeys = new Set<string>();
      adjustedIncoming.forEach((p) => {
        incomingKeys.add(p.id);
        if (p.product_id) incomingKeys.add(p.product_id);
        if (p.spu_id) incomingKeys.add(p.spu_id);
      });
      const nonDraftItems = state.items.filter(
        (p) =>
          p.status !== 'draft' &&
          !incomingKeys.has(p.id) &&
          !(p.product_id && incomingKeys.has(p.product_id)) &&
          !(p.spu_id && incomingKeys.has(p.spu_id))
      );
      state.items = [...nonDraftItems, ...adjustedIncoming];
    },

    // Sync published products fetched from /v1/api/product/spu/published/list
    setPublishedProducts(state, action: PayloadAction<Product[]>) {
      const overrides = state.publishedOverrides || {};
      const sanitizedIncoming = action.payload
        .map(sanitizeProduct)
        .filter((p) => !isProductExplicitlyUnpublished(p, overrides));
      const incomingKeys = new Set<string>();
      sanitizedIncoming.forEach((p) => {
        incomingKeys.add(p.id);
        if (p.product_id) incomingKeys.add(p.product_id);
        if (p.spu_id) incomingKeys.add(p.spu_id);
      });
      const draftItems = state.items.filter(
        (p) =>
          p.status === 'draft' &&
          !incomingKeys.has(p.id) &&
          !(p.product_id && incomingKeys.has(p.product_id)) &&
          !(p.spu_id && incomingKeys.has(p.spu_id))
      );
      state.items = [...sanitizedIncoming, ...draftItems];
    },
  },
});

export const {
  addProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  toggleStatus,
  quickUpdateStock,
  adjustStock,
  publishProduct,
  unpublishProduct,
  bulkPublish,
  bulkUnpublish,
  bulkUpdateStatus,
  bulkDelete,
  setDraftedProducts,
  setPublishedProducts,
} = productsSlice.actions;

export default productsSlice.reducer;
