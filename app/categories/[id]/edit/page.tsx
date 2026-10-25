'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateCategory, deleteCategory } from '@/store/slices/categoriesSlice';
import { setActiveTab, showErrorToast, showToast } from '@/store/slices/uiSlice';
import { getApiErrorMessage } from '@/lib/http/handleAxiosError';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import {
  CategoryFormSubmitData,
  CategoryFormView,
} from '@/components/dashboard/categories/CategoryFormView';
import {
  apiDeleteCategory,
  apiUpdateCategoryStatus,
} from '@/services/CategoryService';

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const categories = useAppSelector((s) => s.categories.items);
  const category = categories.find((c) => c.id === id);

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

  const handleSubmit = async (data: CategoryFormSubmitData) => {
    try {
      await apiUpdateCategoryStatus({
        id: category.id,
        categoryId: category.categoryId,
        category_active: data.category_active,
        category_name: data.name,
        category_slug: data.slug,
        category_description: data.description,
        category_thumb: data.image,
        parent_id: data.parentId,
      });

      dispatch(
        updateCategory({
          ...category,
          ...data,
        })
      );
      dispatch(
        showToast(
          `Đã cập nhật danh mục "${data.name}" (${
            data.category_active ? 'Active' : 'Inactive'
          }).`
        )
      );
      dispatch(setActiveTab('categories'));
      router.push('/categories');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      dispatch(showErrorToast(msg));
      throw new Error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      const primaryId =
        category.categoryId !== undefined && category.categoryId !== null
          ? String(category.categoryId).trim()
          : category.id;
      const fallbackId =
        category.id !== primaryId ? category.id : undefined;

      await apiDeleteCategory(primaryId, fallbackId);
      dispatch(deleteCategory(category.id));
      dispatch(
        showToast(
          `Đã xóa danh mục "${category.name}" thành công (/v1/api/category/delete/${primaryId}).`
        )
      );
      dispatch(setActiveTab('categories'));
      router.push('/categories');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      dispatch(
        showErrorToast(
          msg || `Không thể xóa danh mục "${category.name}". Vui lòng thử lại.`
        )
      );
      throw new Error(msg);
    }
  };

  return (
    <CategoryFormView
      initialData={category}
      categories={categories}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
