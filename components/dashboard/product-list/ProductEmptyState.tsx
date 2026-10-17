'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface ProductEmptyStateProps {
  onClearFilters: () => void;
  onOpenCreateProduct: () => void;
}

export const ProductEmptyState: React.FC<ProductEmptyStateProps> = ({
  onClearFilters,
  onOpenCreateProduct,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icons.Package size={32} />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {t('table.empty_title')}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
        {t('table.empty_desc')}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          {t('table.clear_filters')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icons.Plus size={16} />}
          onClick={onOpenCreateProduct}
        >
          {t('products.create_new')}
        </Button>
      </div>
    </div>
  );
};
