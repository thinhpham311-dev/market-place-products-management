'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProductCategory, Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { CategoryCard } from './categories/CategoryCard';

interface CategoryManagerProps {
  categories: ProductCategory[];
  products: Product[];
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  products,
  onDeleteCategory,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleOpenAdd = () => {
    router.push('/categories/new');
  };

  const handleOpenEdit = (cat: ProductCategory) => {
    router.push(`/categories/${cat.id}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('categories.header_title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('categories.header_desc')}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Icons.Plus size={16} />}
        >
          {t('categories.create_btn')}
        </Button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const productCount = products.filter((p) => p.categoryId === cat.id).length;
          const totalCatRevenue = products
            .filter((p) => p.categoryId === cat.id)
            .reduce((acc, curr) => acc + curr.revenue, 0);

          return (
            <CategoryCard
              key={cat.id}
              category={cat}
              productCount={productCount}
              totalRevenue={totalCatRevenue}
              onEdit={handleOpenEdit}
              onDelete={onDeleteCategory}
            />
          );
        })}
      </div>
    </div>
  );
};
