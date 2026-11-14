import { IShop, IWarehouse } from '@/types/scope';

export interface ShopFormData {
  id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  ownerName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface WarehouseFormData {
  shopId: string;
  name: string;
  code: string;
  address: string;
  managerName: string;
  phone: string;
  capacity: number;
}

export const emptyShopForm: ShopFormData = {
  name: '',
  code: '',
  address: '',
  phone: '',
  ownerName: '',
  status: 'ACTIVE',
};

export type ShopStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type ShopViewMode = 'grid' | 'table';
