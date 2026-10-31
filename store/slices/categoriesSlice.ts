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

function cleanCategory(c: ProductCategory): ProductCategory | null {
  if (!c || typeof c !== 'object') return null;
  const idStr = String(c.id || '').trim();
  if (!idStr || idStr === '[object Object]') return null;
  const nameStr =
    typeof c.name === 'object'
      ? (c.name as any).name || (c.name as any).vi || ''
      : String(c.name || '').trim();
  const safeName = nameStr === '[object Object]' ? '' : nameStr;
  const safeDesc = c.description === '[object Object]' ? '' : c.description;
  const safeSlug = c.slug === 'object-object' || !c.slug ? idStr : c.slug;

  return {
    ...c,
    id: idStr,
    name: safeName || `Danh mục ${idStr}`,
    slug: safeSlug,
    description: safeDesc,
    children: Array.isArray(c.children)
      ? (c.children.map(cleanCategory).filter(Boolean) as ProductCategory[])
      : c.children,
  };
}

function applyStatusOverrides(
  list: ProductCategory[],
  overrides: Record<string, boolean>
): ProductCategory[] {
  return list
    .map(cleanCategory)
    .filter((item): item is ProductCategory => item !== null)
    .map((item) => {
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
      const resolvedId = String(action.payload.id || '').trim() || `cat-${Date.now()}`;
      if (resolvedId === '[object Object]') return;
      const cleaned = cleanCategory({
        ...action.payload,
        id: resolvedId,
        productCount: action.payload.productCount ?? 0,
      });
      if (!cleaned) return;
      const existingIndex = state.items.findIndex((c) => c.id === resolvedId);
      if (existingIndex !== -1) {
        state.items[existingIndex] = cleaned;
      } else {
        state.items.unshift(cleaned);
      }
    },

    updateCategory(state, action: PayloadAction<ProductCategory>) {
      const cleaned = cleanCategory(action.payload);
      if (!cleaned) return;
      if (!state.statusOverrides) {
        state.statusOverrides = {};
      }
      if (cleaned.category_active !== undefined) {
        state.statusOverrides[cleaned.id] = cleaned.category_active;
        if (cleaned.categoryId !== undefined) {
          state.statusOverrides[String(cleaned.categoryId)] =
            cleaned.category_active;
        }
      }
      const index = state.items.findIndex((c) => c.id === cleaned.id);
      if (index !== -1) {
        state.items[index] = cleaned;
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
      for (const rawItem of state.items) {
        const item = cleanCategory(rawItem);
        if (!item) continue;
        byKey.set(String(item.id), item);
        if (item.categoryId !== undefined) {
          byKey.set(String(item.categoryId), item);
        }
      }
      for (const rawItem of action.payload) {
        const item = cleanCategory(rawItem);
        if (!item) continue;
        byKey.set(String(item.id), item);
        if (item.categoryId !== undefined) {
          byKey.set(String(item.categoryId), item);
        }
      }
      const uniqueItems = Array.from(
        new Map(Array.from(byKey.values()).map((c) => [c.id, c])).values()
      );
      state.items = applyStatusOverrides(
        uniqueItems,
        state.statusOverrides || {}
      );
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
