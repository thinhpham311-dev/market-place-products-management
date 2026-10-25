import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductCategory } from '@/types/product';

interface CategoriesState {
  items: ProductCategory[];
  statusOverrides?: Record<string, boolean>;
}

const initialState: CategoriesState = {
  items: [],
  statusOverrides: {},
};

function applyStatusOverrides(
  list: ProductCategory[],
  overrides: Record<string, boolean>
): ProductCategory[] {
  return list.map((item) => {
    const overrideVal =
      overrides[item.id] ??
      (item.categoryId !== undefined
        ? overrides[String(item.categoryId)]
        : undefined);
    const resolvedActive =
      overrideVal !== undefined ? overrideVal : item.category_active;
    const children =
      item.children && item.children.length > 0
        ? applyStatusOverrides(item.children, overrides)
        : item.children;
    return {
      ...item,
      category_active: resolvedActive,
      ...(children ? { children } : {}),
    };
  });
}

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory(
      state,
      action: PayloadAction<
        Omit<ProductCategory, 'id' | 'productCount'> & {
          id?: string;
          productCount?: number;
        }
      >
    ) {
      const resolvedId = action.payload.id || `cat-${Date.now()}`;
      const newCat: ProductCategory = {
        ...action.payload,
        id: resolvedId,
        productCount: action.payload.productCount ?? 0,
      };
      const existingIndex = state.items.findIndex((c) => c.id === resolvedId);
      if (existingIndex !== -1) {
        state.items[existingIndex] = newCat;
      } else {
        state.items.unshift(newCat);
      }
    },

    updateCategory(state, action: PayloadAction<ProductCategory>) {
      if (!state.statusOverrides) {
        state.statusOverrides = {};
      }
      if (action.payload.category_active !== undefined) {
        state.statusOverrides[action.payload.id] = action.payload.category_active;
        if (action.payload.categoryId !== undefined) {
          state.statusOverrides[String(action.payload.categoryId)] =
            action.payload.category_active;
        }
      }
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    deleteCategory(state, action: PayloadAction<string>) {
      const targetId = String(action.payload).trim();
      const filterRecursive = (list: ProductCategory[]): ProductCategory[] => {
        return list
          .filter(
            (c) =>
              c.id !== targetId &&
              String(c.categoryId) !== targetId
          )
          .map((c) => ({
            ...c,
            ...(c.children ? { children: filterRecursive(c.children) } : {}),
          }));
      };
      state.items = filterRecursive(state.items);
    },

    toggleCategoryStatus(
      state,
      action: PayloadAction<{ id: string; category_active?: boolean }>
    ) {
      const { id, category_active } = action.payload;
      if (!state.statusOverrides) {
        state.statusOverrides = {};
      }
      const updateInList = (list: ProductCategory[]) => {
        for (const item of list) {
          if (item.id === id || String(item.categoryId) === id) {
            const nextVal =
              category_active !== undefined
                ? category_active
                : !(item.category_active === true);
            item.category_active = nextVal;
            state.statusOverrides![item.id] = nextVal;
            if (item.categoryId !== undefined) {
              state.statusOverrides![String(item.categoryId)] = nextVal;
            }
          }
          if (item.children && item.children.length > 0) {
            updateInList(item.children);
          }
        }
      };
      updateInList(state.items);
    },

    // Sync categories fetched from /v1/api/category/all/list directly from database
    setCategories(state, action: PayloadAction<ProductCategory[]>) {
      const byKey = new Map<string, ProductCategory>();
      for (const item of state.items) {
        byKey.set(String(item.id), item);
        if (item.categoryId !== undefined) {
          byKey.set(String(item.categoryId), item);
        }
      }
      for (const item of action.payload) {
        byKey.set(String(item.id), item);
        if (item.categoryId !== undefined) {
          byKey.set(String(item.categoryId), item);
        }
      }
      const uniqueItems = Array.from(
        new Map(Array.from(byKey.values()).map((c) => [c.id, c])).values()
      );
      state.items = uniqueItems;
      state.statusOverrides = {};
    },
  },
});

export const {
  addCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  setCategories,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
