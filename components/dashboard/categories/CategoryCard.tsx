'use client';

import React from 'react';
import { ProductCategory } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface CategoryCardProps {
  category: ProductCategory;
  productCount: number;
  totalRevenue: number;
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  productCount,
  totalRevenue,
  onEdit,
  onDelete,
}) => {
  const { t, tc, tcd } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Icons.Layers size={20} />
          </div>
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={t('categories.edit_tooltip')}
            >
              <Icons.Edit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title={t('categories.delete_tooltip')}
            >
              <Icons.Trash2 size={15} />
            </button>
          </div>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          {tc(category.name)}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {category.description ? tcd(category.description) : t('categories.no_desc')}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {productCount} {t('table.products_unit')}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
        </span>
      </div>
    </div>
  );
};
