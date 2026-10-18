'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteCategory } from '@/store/slices/categoriesSlice';
import { showToast } from '@/store/slices/uiSlice';
import { CategoryManager } from '@/components/dashboard/CategoryManager';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { tc, tcd } = useTranslation();
  const categories = useAppSelector((s) => s.categories.items);
  const products = useAppSelector((s) => s.products.items);

  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const targetCategory = categories.find((c) => c.id === pendingCategoryId);
  const targetProductCount = targetCategory
    ? products.filter((p) => p.categoryId === targetCategory.id).length
    : 0;

  const handleConfirmDeleteCategory = () => {
    if (!targetCategory) return;
    dispatch(deleteCategory(targetCategory.id));
    dispatch(showToast(`Đã xóa danh mục "${tc(targetCategory.name)}" thành công.`));
    setPendingCategoryId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <CategoryManager
        categories={categories}
        products={products}
        onDeleteCategory={(id) => setPendingCategoryId(id)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(targetCategory)}
        title="Xác nhận xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này khỏi hệ thống? Các sản phẩm thuộc danh mục này sẽ cần được phân loại lại."
        itemName={targetCategory ? tc(targetCategory.name) : ''}
        itemSubtitle={
          targetCategory
            ? `/${targetCategory.slug} • ${tcd(targetCategory.description || '')}`
            : ''
        }
        itemMeta={`Đang liên kết với ${targetProductCount} sản phẩm`}
        onClose={() => setPendingCategoryId(null)}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}
