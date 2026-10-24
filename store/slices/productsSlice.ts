import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductStatus, InventoryLog } from '@/types/product';

interface ProductsState {
  items: Product[];
  inventoryLogs: InventoryLog[];
}

const initialState: ProductsState = {
  items: [],
  inventoryLogs: [],
};


const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Create
    addProduct(state, action: PayloadAction<Product>) {
      state.items.unshift(action.payload);
    },

    // Update
    updateProduct(state, action: PayloadAction<{ id: string; changes: Partial<Product> }>) {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.changes };
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
      const product = state.items.find((p) => p.id === action.payload);
      if (product) {
        product.status = product.status === 'active' ? 'archived' : 'active';
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
      const product = state.items.find((p) => p.id === productId);
      if (!product) return;

      product.channels = channels;
      if (publishMode === 'instant') {
        product.status = 'active';
        product.publishedAt = now;
      } else {
        product.scheduledPublishAt = scheduledTime;
      }
    },

    // Bulk publish
    bulkPublish(state, action: PayloadAction<string[]>) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      state.items.forEach((p) => {
        if (action.payload.includes(p.id)) {
          p.status = 'active';
          p.publishedAt = now;
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
        if (ids.includes(p.id)) {
          p.status = status;
        }
      });
    },

    // Bulk delete
    bulkDelete(state, action: PayloadAction<string[]>) {
      state.items = state.items.filter((p) => !action.payload.includes(p.id));
    },

    // Sync drafted products fetched from /v1/api/product/spu/drafted/list
    setDraftedProducts(state, action: PayloadAction<Product[]>) {
      const incomingIds = new Set(action.payload.map((p) => p.id));
      const nonDraftItems = state.items.filter(
        (p) => p.status !== 'draft' && !incomingIds.has(p.id)
      );
      state.items = [...nonDraftItems, ...action.payload];
    },

    // Sync published products fetched from /v1/api/product/spu/published/list
    setPublishedProducts(state, action: PayloadAction<Product[]>) {
      const incomingIds = new Set(action.payload.map((p) => p.id));
      const draftItems = state.items.filter(
        (p) => p.status === 'draft' && !incomingIds.has(p.id)
      );
      state.items = [...action.payload, ...draftItems];
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
  bulkPublish,
  bulkUpdateStatus,
  bulkDelete,
  setDraftedProducts,
  setPublishedProducts,
} = productsSlice.actions;

export default productsSlice.reducer;
