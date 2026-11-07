import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IShop, IWarehouse, ScopeState } from '@/types/scope';

export const INITIAL_SHOPS: IShop[] = [
  {
    id: 'shop-a',
    name: 'NovaShop Chi nhánh A (Hà Nội)',
    code: 'SHOP-A',
    address: '98 Hoàng Cầu, Đống Đa, Hà Nội',
    phone: '0901 234 567',
    ownerName: 'Admin Shop Owner',
    status: 'ACTIVE',
    warehouseIds: ['wh-a1', 'wh-a2'],
    createdAt: '2026-01-10',
  },
  {
    id: 'shop-b',
    name: 'NovaShop Chi nhánh B (Hồ Chí Minh)',
    code: 'SHOP-B',
    address: '152 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    phone: '0909 888 999',
    ownerName: 'Admin Shop Owner',
    status: 'ACTIVE',
    warehouseIds: ['wh-b1'],
    createdAt: '2026-02-15',
  },
];

export const INITIAL_WAREHOUSES: IWarehouse[] = [
  {
    id: 'wh-a1',
    shopId: 'shop-a',
    name: 'Kho A1 - Kho Tổng Hà Nội',
    code: 'WH-A1',
    address: 'Khu CN Đài Tư, Long Biên, Hà Nội',
    managerName: 'Nguyễn Văn Kho A1',
    phone: '0912 345 678',
    status: 'ACTIVE',
    capacity: 25000,
    currentStockCount: 1420,
    createdAt: '2026-01-12',
  },
  {
    id: 'wh-a2',
    shopId: 'shop-a',
    name: 'Kho A2 - Kho Bán Lẻ Cầu Giấy',
    code: 'WH-A2',
    address: '123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
    managerName: 'Trần Minh Kho A2',
    phone: '0923 456 789',
    status: 'ACTIVE',
    capacity: 8000,
    currentStockCount: 650,
    createdAt: '2026-01-15',
  },
  {
    id: 'wh-b1',
    shopId: 'shop-b',
    name: 'Kho B1 - Kho Trung Chuyển Tân Bình',
    code: 'WH-B1',
    address: '45 Cộng Hoà, Phường 4, Tân Bình, TP.HCM',
    managerName: 'Lê Hoàng Kho B1',
    phone: '0934 567 890',
    status: 'ACTIVE',
    capacity: 18000,
    currentStockCount: 980,
    createdAt: '2026-02-18',
  },
];

const LOCAL_STORAGE_KEY = 'novashop_scope_state';

function loadInitialState(): ScopeState {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          shops: parsed.shops?.length ? parsed.shops : INITIAL_SHOPS,
          warehouses: parsed.warehouses?.length ? parsed.warehouses : INITIAL_WAREHOUSES,
          activeShopId: parsed.activeShopId || 'all',
          activeWarehouseId: parsed.activeWarehouseId || 'all',
        };
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  return {
    shops: INITIAL_SHOPS,
    warehouses: INITIAL_WAREHOUSES,
    activeShopId: 'all',
    activeWarehouseId: 'all',
  };
}

function persistState(state: ScopeState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }
}

const initialState: ScopeState = loadInitialState();

const scopeSlice = createSlice({
  name: 'scope',
  initialState,
  reducers: {
    setActiveShop(state, action: PayloadAction<string>) {
      const newShopId = action.payload;
      state.activeShopId = newShopId;

      // If switching shop, check if current warehouse belongs to new shop
      if (newShopId !== 'all') {
        const currentWh = state.warehouses.find((w) => w.id === state.activeWarehouseId);
        if (currentWh && currentWh.shopId !== newShopId) {
          state.activeWarehouseId = 'all';
        }
      }
      persistState(state);
    },

    setActiveWarehouse(state, action: PayloadAction<string>) {
      const newWarehouseId = action.payload;
      state.activeWarehouseId = newWarehouseId;

      if (newWarehouseId !== 'all') {
        const wh = state.warehouses.find((w) => w.id === newWarehouseId);
        if (wh) {
          state.activeShopId = wh.shopId;
        }
      }
      persistState(state);
    },

    setScope(state, action: PayloadAction<{ shopId: string; warehouseId: string }>) {
      state.activeShopId = action.payload.shopId;
      state.activeWarehouseId = action.payload.warehouseId;
      persistState(state);
    },

    // Shops CRUD
    addShop(state, action: PayloadAction<IShop>) {
      state.shops.push(action.payload);
      persistState(state);
    },

    updateShop(state, action: PayloadAction<{ id: string; changes: Partial<IShop> }>) {
      const idx = state.shops.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.shops[idx] = { ...state.shops[idx], ...action.payload.changes };
        persistState(state);
      }
    },

    deleteShop(state, action: PayloadAction<string>) {
      const shopId = action.payload;
      state.shops = state.shops.filter((s) => s.id !== shopId);
      // Remove child warehouses
      state.warehouses = state.warehouses.filter((w) => w.shopId !== shopId);
      if (state.activeShopId === shopId) {
        state.activeShopId = 'all';
        state.activeWarehouseId = 'all';
      }
      persistState(state);
    },

    // Warehouses CRUD
    addWarehouse(state, action: PayloadAction<IWarehouse>) {
      state.warehouses.push(action.payload);
      const parentShop = state.shops.find((s) => s.id === action.payload.shopId);
      if (parentShop && !parentShop.warehouseIds.includes(action.payload.id)) {
        parentShop.warehouseIds.push(action.payload.id);
      }
      persistState(state);
    },

    updateWarehouse(state, action: PayloadAction<{ id: string; changes: Partial<IWarehouse> }>) {
      const idx = state.warehouses.findIndex((w) => w.id === action.payload.id);
      if (idx !== -1) {
        const oldShopId = state.warehouses[idx].shopId;
        state.warehouses[idx] = { ...state.warehouses[idx], ...action.payload.changes };

        // If shop changed, update relations
        const newShopId = state.warehouses[idx].shopId;
        if (oldShopId !== newShopId) {
          const oldShop = state.shops.find((s) => s.id === oldShopId);
          if (oldShop) {
            oldShop.warehouseIds = oldShop.warehouseIds.filter((id) => id !== action.payload.id);
          }
          const newShop = state.shops.find((s) => s.id === newShopId);
          if (newShop && !newShop.warehouseIds.includes(action.payload.id)) {
            newShop.warehouseIds.push(action.payload.id);
          }
        }
        persistState(state);
      }
    },

    deleteWarehouse(state, action: PayloadAction<string>) {
      const whId = action.payload;
      const wh = state.warehouses.find((w) => w.id === whId);
      if (wh) {
        const parentShop = state.shops.find((s) => s.id === wh.shopId);
        if (parentShop) {
          parentShop.warehouseIds = parentShop.warehouseIds.filter((id) => id !== whId);
        }
      }
      state.warehouses = state.warehouses.filter((w) => w.id !== whId);
      if (state.activeWarehouseId === whId) {
        state.activeWarehouseId = 'all';
      }
      persistState(state);
    },

    resetToDefaultScope(state) {
      state.shops = INITIAL_SHOPS;
      state.warehouses = INITIAL_WAREHOUSES;
      state.activeShopId = 'all';
      state.activeWarehouseId = 'all';
      persistState(state);
    },
  },
});

export const {
  setActiveShop,
  setActiveWarehouse,
  setScope,
  addShop,
  updateShop,
  deleteShop,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
  resetToDefaultScope,
} = scopeSlice.actions;

export default scopeSlice.reducer;
