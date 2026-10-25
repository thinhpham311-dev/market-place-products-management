import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductBrand } from '@/types/product';

export interface BrandsState {
  items: ProductBrand[];
}

export const INITIAL_BRANDS: ProductBrand[] = [
  {
    id: 'brand-1',
    name: 'NovaWear',
    slug: 'novawear',
    description: 'Thương hiệu thời trang ứng dụng cao cấp phân phối độc quyền bởi NovaShop.',
    logo: '',
    brand_active: true,
    productCount: 12,
  },
  {
    id: 'brand-2',
    name: 'Nike',
    slug: 'nike',
    description: 'Trang phục, giày dép & phụ kiện thể thao chính hãng toàn cầu.',
    logo: '',
    brand_active: true,
    productCount: 8,
  },
  {
    id: 'brand-3',
    name: 'Adidas',
    slug: 'adidas',
    description: 'Giày thể thao, quần áo và phụ kiện phong cách ba sọc kinh điển.',
    logo: '',
    brand_active: true,
    productCount: 6,
  },
  {
    id: 'brand-4',
    name: 'Puma',
    slug: 'puma',
    description: 'Thương hiệu thể thao tốc độ, năng động và phong cách đường phố.',
    logo: '',
    brand_active: true,
    productCount: 4,
  },
  {
    id: 'brand-5',
    name: 'Uniqlo',
    slug: 'uniqlo',
    description: 'Thời trang thường ngày LifeWear đơn giản, tinh tế và chất lượng cao.',
    logo: '',
    brand_active: true,
    productCount: 5,
  },
  {
    id: 'brand-6',
    name: 'Zara',
    slug: 'zara',
    description: 'Thời trang xu hướng thịnh hành phong cách châu Âu hiện đại.',
    logo: '',
    brand_active: false,
    productCount: 2,
  },
];

const initialState: BrandsState = {
  items: INITIAL_BRANDS,
};

export const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    addBrand(
      state,
      action: PayloadAction<Omit<ProductBrand, 'id'> & { id?: string }>
    ) {
      const resolvedId = action.payload.id || `brand-${Date.now()}`;
      const newBrand: ProductBrand = {
        ...action.payload,
        id: resolvedId,
        brand_active: action.payload.brand_active ?? true,
        productCount: action.payload.productCount ?? 0,
      };
      state.items.unshift(newBrand);
    },
    updateBrand(state, action: PayloadAction<ProductBrand>) {
      const index = state.items.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteBrand(state, action: PayloadAction<string>) {
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
    toggleBrandStatus(
      state,
      action: PayloadAction<{ id: string; brand_active?: boolean }>
    ) {
      const target = state.items.find((b) => b.id === action.payload.id);
      if (target) {
        target.brand_active =
          action.payload.brand_active !== undefined
            ? action.payload.brand_active
            : !target.brand_active;
      }
    },
    setBrands(state, action: PayloadAction<ProductBrand[]>) {
      state.items = action.payload;
    },
  },
});

export const {
  addBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus,
  setBrands,
} = brandsSlice.actions;

export default brandsSlice.reducer;
