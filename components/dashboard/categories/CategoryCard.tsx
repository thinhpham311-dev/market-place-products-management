'use client';

import React, { useEffect, useState } from 'react';
import { ProductCategory } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface CategoryCardProps {
  category: ProductCategory;
  level?: number;
  defaultExpanded?: boolean;
  updatingCategoryIds?: Record<string, boolean>;
  getCategoryStats: (cat: ProductCategory) => {
    directProducts: number;
    totalProducts: number;
    totalRevenue: number;
  };
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: string) => void;
  onAddSubcategory?: (parentCategory: ProductCategory) => void;
  onToggleStatus?: (category: ProductCategory, nextStatus: boolean) => void;
}

function countAllDescendants(cat: ProductCategory): number {
  if (!cat.children || cat.children.length === 0) return 0;
  return cat.children.reduce(
    (sum, child) => sum + 1 + countAllDescendants(child),
    0
  );
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  level = 0,
  defaultExpanded = true,
  updatingCategoryIds,
  getCategoryStats,
  onEdit,
  onDelete,
  onAddSubcategory,
  onToggleStatus,
}) => {
  const { t, tc, tcd, formatCurrency } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const children = category.children || [];
  const hasChildren = children.length > 0;
  const totalDescendants = countAllDescendants(category);
  const { totalProducts, totalRevenue } = getCategoryStats(category);
  const isActive = category.category_active === true;
  const isUpdatingStatus = Boolean(updatingCategoryIds?.[category.id]);

  return (
    <div
      className={`rounded-2xl border transition-all flex flex-col justify-between ${
        level === 0
          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-500/40'
          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/70 p-3.5 hover:border-indigo-500/40'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                title={expanded ? 'Thu gọn danh mục con' : 'Mở rộng danh mục con'}
              >
                {expanded ? (
                  <Icons.ChevronDown size={15} />
                ) : (
                  <Icons.ChevronRight size={15} />
                )}
              </button>
            )}

            <div
              className={`${
                level === 0 ? 'w-10 h-10' : 'w-8 h-8'
              } rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold overflow-hidden border border-indigo-100 dark:border-indigo-900/40 shrink-0`}
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={tc(category.name)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icons.Layers size={level === 0 ? 20 : 16} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={`${
                    level === 0 ? 'text-sm' : 'text-xs'
                  } font-bold text-slate-900 dark:text-white truncate`}
                >
                  {tc(category.name) || category.name || category.id}
                </h4>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => onToggleStatus?.(category, !isActive)}
                  title="Nhấn để đổi trạng thái Active / Inactive (/v1/api/category/update)"
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isUpdatingStatus
                        ? 'animate-ping bg-indigo-500'
                        : isActive
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                    }`}
                  />
                  {isActive ? 'Active' : 'Inactive'}
                </button>
                {level > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                    Cấp {level + 1}
                  </span>
                )}
                {hasChildren && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    {children.length} mục con
                    {totalDescendants > children.length
                      ? ` (${totalDescendants} tổng)`
                      : ''}
                  </span>
                )}
              </div>
              {category.slug && (
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                  /{category.slug}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleStatus && (
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                disabled={isUpdatingStatus}
                onClick={() => onToggleStatus(category, !isActive)}
                title={
                  isActive
                    ? 'Active — Nhấn để chuyển sang Inactive'
                    : 'Inactive — Nhấn để chuyển sang Active'
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-wait ${
                  isActive
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
            {onAddSubcategory && (
              <button
                type="button"
                onClick={() => onAddSubcategory(category)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                title={`Thêm danh mục con vào "${tc(category.name)}"`}
              >
                <Icons.Plus size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={t('categories.edit_tooltip')}
            >
              <Icons.Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(category.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title={t('categories.delete_tooltip')}
            >
              <Icons.Trash2 size={14} />
            </button>
          </div>
        </div>

        <div
          className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: category.description
              ? tcd(category.description)
              : t('categories.no_desc'),
          }}
        />
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {totalProducts} {t('table.products_unit')}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {formatCurrency(totalRevenue)}
        </span>
      </div>

      {/* Nested Subcategories */}
      {hasChildren && expanded && (
        <div className="mt-3.5 pl-3.5 sm:pl-5 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
          {children.map((child) => (
            <CategoryCard
              key={child.id}
              category={child}
              level={level + 1}
              defaultExpanded={defaultExpanded}
              updatingCategoryIds={updatingCategoryIds}
              getCategoryStats={getCategoryStats}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
