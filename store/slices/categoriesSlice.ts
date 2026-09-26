import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductCategory } from '@/types/product';
import { mockCategories } from '@/data/mockProducts';

interface CategoriesState {
  items: ProductCategory[];
}

const initialState: CategoriesState = {
  items: mockCategories,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory(state, action: PayloadAction<Omit<ProductCategory, 'id' | 'productCount'>>) {
      const newCat: ProductCategory = {
        ...action.payload,
        id: `cat-${Date.now()}`,
        productCount: 0,
      };
      state.items.push(newCat);
    },

    updateCategory(state, action: PayloadAction<ProductCategory>) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    deleteCategory(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCategory, updateCategory, deleteCategory } = categoriesSlice.actions;

export default categoriesSlice.reducer;
