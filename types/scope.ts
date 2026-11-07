export interface IWarehouse {
  id: string;
  shopId: string;
  name: string;
  code: string; // e.g. "WH-A1", "WH-A2", "WH-B1"
  address: string;
  managerName?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  capacity?: number;
  currentStockCount?: number;
  createdAt: string;
}

export interface IShop {
  id: string;
  name: string;
  code: string; // e.g. "SHOP-A", "SHOP-B"
  address: string;
  phone: string;
  ownerName: string;
  status: 'ACTIVE' | 'INACTIVE';
  warehouseIds: string[];
  createdAt: string;
}

export interface ScopeState {
  shops: IShop[];
  warehouses: IWarehouse[];
  activeShopId: string; // 'all' or shop id
  activeWarehouseId: string; // 'all' or warehouse id
}
