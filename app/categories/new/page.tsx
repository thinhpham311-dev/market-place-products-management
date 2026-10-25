'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCategory, setCategories } from '@/store/slices/categoriesSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import {
  apiCreateCategory,
  apiGetCategoryAllList,
  apiUpdateCategoryStatus,
  buildCreateCategoryPayload,
  extractCategoryArray,
  extractCreatedCategory,
  mapRawCategoryList,
  mapRawToCategory,
} from '@/services/CategoryService';
import {
  CategoryFormSubmitData,
  CategoryFormView,
} from '@/components/dashboard/categories/CategoryFormView';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { useCategoryBrandPermission } from '@/lib/auth/permissions';

export default function NewCategoryPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { canManage } = useCategoryBrandPermission();
  const categories = useAppSelector((s) => s.categories.items);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0) return;
    let cancelled = false;
    apiGetCategoryAllList()
      .then((res) => {
        if (cancelled) return;
        const raw = extractCategoryArray(res.data);
        if (Array.isArray(raw)) {
          dispatch(setCategories(mapRawCategoryList(raw)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [categories.length, dispatch]);

  const handleSubmit = async (data: CategoryFormSubmitData) => {
    setIsSubmitting(true);
    try {
      const payload = buildCreateCategoryPayload(data);
      const res = await apiCreateCategory(payload);
      const rawCreated = extractCreatedCategory(res.data);
      const mappedFromApi = rawCreated ? mapRawToCategory(rawCreated, 0) : null;

      if (
        data.category_active === true &&
        mappedFromApi?.id &&
        mappedFromApi.category_active !== true
      ) {
        try {
          await apiUpdateCategoryStatus({
            id: mappedFromApi.id,
            categoryId: mappedFromApi.categoryId,
            category_active: true,
            category_name: mappedFromApi.name || data.name,
            category_slug: mappedFromApi.slug || data.slug,
            category_description: mappedFromApi.description ?? data.description,
            category_thumb: mappedFromApi.image || data.image,
            parent_id: mappedFromApi.parentId ?? data.parentId ?? null,
          });
          mappedFromApi.category_active = true;
        } catch {
          // Best-effort follow-up status update
        }
      }

      dispatch(
        addCategory({
          id: mappedFromApi?.id,
          categoryId: mappedFromApi?.categoryId,
          name: mappedFromApi?.name || data.name,
          slug: mappedFromApi?.slug || data.slug,
          description: mappedFromApi?.description ?? data.description,
          image: mappedFromApi?.image || data.image,
          parentId: mappedFromApi?.parentId || data.parentId || null,
          category_active:
            mappedFromApi?.category_active ?? data.category_active ?? true,
          productCount: mappedFromApi?.productCount ?? 0,
        })
      );

      dispatch(
        showToast(
          `Đã tạo danh mục "${mappedFromApi?.name || data.name}" thành công (/v1/api/category/create)!`
        )
      );
      dispatch(setActiveTab('categories'));
      router.push('/categories');
    } catch (err: unknown) {
      const errMessage =
        (err as { message?: string })?.message ||
        'Không thể tạo danh mục qua API (/v1/api/category/create). Vui lòng thử lại.';
      dispatch(showToast(errMessage));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManage) {
    return <AccessDenied featureName="Tạo danh mục mới" />;
  }

  return (
    <CategoryFormView
      categories={categories}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
