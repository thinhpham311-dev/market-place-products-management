'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCategory, deleteCategory } from '@/store/slices/categoriesSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { CategoryFormView } from '@/components/dashboard/categories/CategoryFormView';

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const category = useAppSelector((s) => s.categories.items.find((c) => c.id === id));

  if (!category) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.Layers size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy danh mục</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">Danh mục cần chỉnh sửa không tồn tại.</p>
        <Button variant="primary" size="sm" onClick={() => router.push('/')}>
          Quay về trang chủ
        </Button>
      </div>
    );
  }

  const handleSubmit = (data: { name: string; slug: string; description: string }) => {
    dispatch(
      updateCategory({
        ...category,
        ...data,
      })
    );
    dispatch(showToast(`Đã cập nhật danh mục "${data.name}".`));
    dispatch(setActiveTab('categories'));
    router.push('/categories');
  };

  const handleDelete = () => {
    dispatch(deleteCategory(category.id));
    dispatch(showToast(`Đã xóa danh mục "${category.name}" thành công.`));
    dispatch(setActiveTab('categories'));
    router.push('/categories');
  };

  return <CategoryFormView initialData={category} onSubmit={handleSubmit} onDelete={handleDelete} />;
}
