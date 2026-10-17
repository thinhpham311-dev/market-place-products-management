'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { addCategory } from '@/store/slices/categoriesSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { CategoryFormView } from '@/components/dashboard/categories/CategoryFormView';

export default function NewCategoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSubmit = (data: { name: string; slug: string; description: string }) => {
    dispatch(addCategory(data));
    dispatch(showToast(`Đã tạo danh mục "${data.name}" thành công!`));
    dispatch(setActiveTab('categories'));
    router.push('/categories');
  };

  return <CategoryFormView onSubmit={handleSubmit} />;
}
