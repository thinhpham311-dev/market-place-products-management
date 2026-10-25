'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCategory, Product } from '@/types/product';
import { buildCategoryTree } from '@/services/CategoryService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { CategoryCard } from './categories/CategoryCard';

interface CategoryManagerProps {
  categories: ProductCategory[];
  products: Product[];
  isLoading?: boolean;
  updatingCategoryIds?: Record<string, boolean>;
  onRefresh?: () => void;
  onToggleCategoryStatus?: (category: ProductCategory, nextStatus: boolean) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  products,
  isLoading = false,
  updatingCategoryIds,
  onRefresh,
  onToggleCategoryStatus,
  onDeleteCategory,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [layoutMode, setLayoutMode] = useState<'tree' | 'grid'>('tree');
  const [activeFilter, setActiveFilter] = useState<'all' | 'inactive' | 'active'>('all');
  const [expandSeed, setExpandSeed] = useState<{ version: number; expanded: boolean }>({
    version: 0,
    expanded: true,
  });

  const inactiveCategories = useMemo(
    () => categories.filter((c) => c.category_active !== true),
    [categories]
  );
  const activeCategories = useMemo(
    () => categories.filter((c) => c.category_active === true),
    [categories]
  );

  const categoryTree = useMemo(() => {
    // Always build tree from all categories so child categories are strictly nested under their parent
    const fullTree = buildCategoryTree(categories);
    if (activeFilter === 'all') return fullTree;

    const targetActive = activeFilter === 'active';

    const hasMatchInSubtree = (node: ProductCategory): boolean => {
      if (Boolean(node.category_active) === targetActive) return true;
      if (node.children && node.children.length > 0) {
        return node.children.some(hasMatchInSubtree);
      }
      return false;
    };

    // Filter root categories that match or have matching descendants,
    // but DO NOT strip or delete child categories! All children remain intact.
    return fullTree.filter(hasMatchInSubtree);
  }, [categories, activeFilter]);

  const getCategoryStats = useCallback(
    (cat: ProductCategory) => {
      const collectCategoryKeys = (node: ProductCategory, keys = new Set<string>()) => {
        keys.add(String(node.id));
        if (node.categoryId !== undefined && node.categoryId !== null) {
          keys.add(String(node.categoryId));
        }
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            collectCategoryKeys(child, keys);
          }
        }
        return keys;
      };

      const directKeys = new Set<string>([String(cat.id)]);
      if (cat.categoryId !== undefined && cat.categoryId !== null) {
        directKeys.add(String(cat.categoryId));
      }
      const treeKeys = collectCategoryKeys(cat);

      const matchesKeys = (p: Product, keys: Set<string>) => {
        if (p.categoryId && keys.has(String(p.categoryId))) return true;
        if (Array.isArray(p.product_category)) {
          return p.product_category.some((cid) => keys.has(String(cid)));
        }
        return false;
      };

      const directProducts = products.filter((p) => matchesKeys(p, directKeys)).length;
      const matchingTreeProducts = products.filter((p) => matchesKeys(p, treeKeys));
      const totalProducts =
        matchingTreeProducts.length > 0
          ? matchingTreeProducts.length
          : cat.productCount || 0;
      const totalRevenue = matchingTreeProducts.reduce(
        (acc, curr) => acc + curr.revenue,
        0
      );

      return {
        directProducts,
        totalProducts,
        totalRevenue,
      };
    },
    [products]
  );

  const handleOpenAdd = () => {
    router.push('/categories/new');
  };

  const handleAddSubcategory = (parentCat: ProductCategory) => {
    router.push(`/categories/new?parentId=${encodeURIComponent(parentCat.id)}`);
  };

  const handleOpenEdit = (cat: ProductCategory) => {
    router.push(`/categories/${cat.id}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('categories.header_title')}
            </h3>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {categoryTree.length} danh mục gốc • {categories.length} tổng
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('categories.header_desc')}
          </p>

          {/* Status Filter Tabs (All / category_active: false / category_active: true) */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              Tất cả ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('inactive')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'inactive'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeFilter === 'inactive' ? 'bg-white' : 'bg-amber-500'
                }`}
              />
              Inactive ({inactiveCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'active'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeFilter === 'active' ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
              Active ({activeCategories.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setLayoutMode('tree')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icons.List size={14} />
              <span>Cây phân cấp</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icons.Grid size={14} />
              <span>Lưới lồng nhau</span>
            </button>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icons.RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setExpandSeed((prev) => ({
                version: prev.version + 1,
                expanded: !prev.expanded,
              }))
            }
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {expandSeed.expanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Icons.Plus size={16} />}
          >
            {t('categories.create_btn')}
          </Button>
        </div>
      </div>

      {/* Nested Categories Display */}
      {categoryTree.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Icons.Layers size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Chưa có danh mục nào
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            Hãy tạo danh mục gốc hoặc danh mục con đầu tiên từ API /v1/api/category/create.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Icons.Plus size={15} />}
          >
            {t('categories.create_btn')}
          </Button>
        </div>
      ) : (
        <div
          className={
            layoutMode === 'tree'
              ? 'space-y-4'
              : 'grid grid-cols-1 lg:grid-cols-2 gap-4 items-start'
          }
        >
          {categoryTree.map((rootCat) => (
            <CategoryCard
              key={`${rootCat.id}-${expandSeed.version}`}
              category={rootCat}
              level={0}
              defaultExpanded={expandSeed.expanded}
              updatingCategoryIds={updatingCategoryIds}
              getCategoryStats={getCategoryStats}
              onEdit={handleOpenEdit}
              onDelete={onDeleteCategory}
              onAddSubcategory={handleAddSubcategory}
              onToggleStatus={onToggleCategoryStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
