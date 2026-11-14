'use client';

import React, { useMemo } from 'react';
import { ProductCategory, Product, ProductFilterState, ProductStatus } from '@/types/product';
import { buildCategoryTree } from '@/services/CategoryService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface StatusCounts {
  all: number;
  active: number;
  out_of_stock: number;
  draft: number;
  archived: number;
}

interface ProductFilterBarProps {
  filterStatus: ProductStatus | 'all';
  setFilterStatus: (status: ProductStatus | 'all') => void;
  statusCounts: StatusCounts;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  categories: ProductCategory[];
  products?: Product[];
  filterStockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  setFilterStockStatus: (stock: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  sortBy: ProductFilterState['sortBy'];
  setSortBy: (sort: ProductFilterState['sortBy']) => void;
  onResetFilters: () => void;
  onResetPage: () => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filterStatus,
  setFilterStatus,
  statusCounts,
  viewMode,
  setViewMode,
  filterCategory,
  setFilterCategory,
  categories,
  products = [],
  filterStockStatus,
  setFilterStockStatus,
  sortBy,
  setSortBy,
  onResetFilters,
  onResetPage,
}) => {
  const { t, tc } = useTranslation();

  const totalProductCount = products?.length ?? 0;

  // Aggregate products belonging to each category (including descendants in category tree)
  const dropdownCategories = useMemo(() => {
    const tree = buildCategoryTree(categories);

    const collectCategoryKeys = (node: ProductCategory, keys = new Set<string>()): Set<string> => {
      keys.add(String(node.id));
      if (node.categoryId !== undefined && node.categoryId !== null) {
        keys.add(String(node.categoryId));
      }
      if (node.name) {
        keys.add(String(node.name).trim().toLowerCase());
      }
      if (node.slug) {
        keys.add(String(node.slug).trim().toLowerCase());
      }
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          collectCategoryKeys(child, keys);
        }
      }
      return keys;
    };

    const countProductsForKeys = (keys: Set<string>): number => {
      if (!products || products.length === 0) return 0;
      return products.filter((p) => {
        if (p.categoryId && keys.has(String(p.categoryId))) return true;
        if (p.category) {
          const s = String(p.category).trim();
          if (keys.has(s) || keys.has(s.toLowerCase())) return true;
        }
        if (Array.isArray(p.product_category)) {
          return p.product_category.some((cid) => {
            if (typeof cid === 'object' && cid !== null) {
              const objId = (cid as any).id || (cid as any)._id;
              const objName = (cid as any).name || (cid as any).category_name;
              return (
                (objId && keys.has(String(objId))) ||
                (objName && (keys.has(String(objName)) || keys.has(String(objName).toLowerCase())))
              );
            }
            const s = String(cid).trim();
            return s && s !== '[object Object]' && (keys.has(s) || keys.has(s.toLowerCase()));
          });
        }
        return false;
      }).length;
    };

    const items: Array<{
      id: string;
      name: string;
      level: number;
      productCount: number;
    }> = [];

    const traverse = (nodes: ProductCategory[], level = 0) => {
      for (const node of nodes) {
        const keys = collectCategoryKeys(node);
        const aggregatedCount = countProductsForKeys(keys);
        items.push({
          id: node.id,
          name: node.name,
          level,
          productCount: aggregatedCount,
        });
        if (node.children && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      }
    };

    traverse(tree);
    return items;
  }, [categories, products]);

  return (
    <div className="relative sm:sticky sm:top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-sm space-y-3 sm:space-y-4">
      {/* Status quick tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setFilterStatus('all');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_all')} ({statusCounts.all})
          </button>
          <button
            onClick={() => {
              setFilterStatus('active');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_active')} ({statusCounts.active})
          </button>
          <button
            onClick={() => {
              setFilterStatus('draft');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'draft'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_draft')} ({statusCounts.draft})
          </button>
          <button
            onClick={() => {
              setFilterStatus('out_of_stock');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'out_of_stock'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_out_of_stock')} ({statusCounts.out_of_stock})
          </button>
          <button
            onClick={() => {
              setFilterStatus('archived');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'archived'
                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_archived')} ({statusCounts.archived})
          </button>
        </div>

        {/* View toggle (Grid / Table) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Grid size={16} />
          </button>
        </div>
      </div>

      {/* Filters dropdowns row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('categories')}
          </label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              onResetPage();
            }}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">
              {t('products.all_categories')} ({totalProductCount})
            </option>
            {dropdownCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.level > 0 ? `${'\u00A0\u00A0'.repeat(item.level)}↳ ` : ''}{tc(item.name)} ({item.productCount})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('nav.inventory')}
          </label>
          <select
            value={filterStockStatus}
            onChange={(e) => {
              setFilterStockStatus(
                e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
              );
              onResetPage();
            }}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="all">{t('products.all_stock')}</option>
            <option value="in_stock">{t('products.stock_in')}</option>
            <option value="low_stock">{t('products.stock_low')}</option>
            <option value="out_of_stock">{t('products.stock_out')}</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('filters')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductFilterState['sortBy'])}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="priority">{t('products.sort_priority') || 'Độ ưu tiên (Kéo thả)'}</option>
            <option value="created">{t('products.sort_newest')}</option>
            <option value="sold">{t('products.sort_sold')}</option>
            <option value="price_desc">{t('products.sort_price_desc')}</option>
            <option value="price_asc">{t('products.sort_price_asc')}</option>
            <option value="stock">{t('products.sort_stock_asc')}</option>
            <option value="name">{t('products.sort_name_asc')}</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs"
            onClick={onResetFilters}
            leftIcon={<Icons.RefreshCw size={13} />}
          >
            {t('clear_all')}
          </Button>
        </div>
      </div>
    </div>
  );
};
