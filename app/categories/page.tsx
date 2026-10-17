'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteCategory } from '@/store/slices/categoriesSlice';
import { showToast } from '@/store/slices/uiSlice';
import { CategoryManager } from '@/components/dashboard/CategoryManager';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items);
  const products = useAppSelector((s) => s.products.items);

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (confirm(`Bạn có chắc muốn xóa danh mục "${cat?.name}"?`)) {
      dispatch(deleteCategory(id));
      dispatch(showToast('Đã xóa danh mục.'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <CategoryManager
        categories={categories}
        products={products}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}
