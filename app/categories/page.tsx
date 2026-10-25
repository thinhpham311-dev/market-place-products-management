'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteCategory,
  setCategories,
  toggleCategoryStatus,
} from '@/store/slices/categoriesSlice';
import { showErrorToast, showToast } from '@/store/slices/uiSlice';
import { getApiErrorMessage } from '@/lib/http/handleAxiosError';
import {
  apiDeleteCategory,
  apiGetCategoryAllList,
  apiUpdateCategoryStatus,
  extractCategoryArray,
  mapRawCategoryList,
} from '@/services/CategoryService';
import { useHydrated } from '@/store/StoreProvider';
import { ProductCategory } from '@/types/product';
import { CategoryManager } from '@/components/dashboard/CategoryManager';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useCategoryBrandPermission } from '@/lib/auth/permissions';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const isHydrated = useHydrated();
  const { tc, tcd } = useTranslation();
  const { canManage } = useCategoryBrandPermission();
  const categories = useAppSelector((s) => s.categories.items);
  const products = useAppSelector((s) => s.products.items);
  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const accessToken = useAppSelector((s) => s.auth.session.token);

  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<boolean>(false);
  const [updatingCategoryIds, setUpdatingCategoryIds] = useState<
    Record<string, boolean>
  >({});

  const fetchCategories = useCallback(async () => {
    if (!isHydrated || !signedIn) return;
    setIsLoading(true);
    try {
      const res = await apiGetCategoryAllList();
      const rawCategories = extractCategoryArray(res.data);
      if (Array.isArray(rawCategories)) {
        const mapped = mapRawCategoryList(rawCategories);
        dispatch(setCategories(mapped));
      }
    } catch {
      // Keep existing categories state if upstream API is unreachable
    } finally {
      setIsLoading(false);
    }
  }, [isHydrated, signedIn, accessToken, dispatch]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const targetCategory = categories.find((c) => c.id === pendingCategoryId);
  const targetProductCount = targetCategory
    ? products.filter((p) => p.categoryId === targetCategory.id).length
    : 0;

  const handleConfirmDeleteCategory = async () => {
    if (!targetCategory || isDeletingCategory) return;
    const catId = targetCategory.id;
    const catName = tc(targetCategory.name) || targetCategory.name || catId;
    const primaryId =
      targetCategory.categoryId !== undefined && targetCategory.categoryId !== null
        ? String(targetCategory.categoryId).trim()
        : targetCategory.id;
    const fallbackId =
      targetCategory.id !== primaryId ? targetCategory.id : undefined;

    setIsDeletingCategory(true);
    try {
      await apiDeleteCategory(primaryId, fallbackId);
      dispatch(deleteCategory(catId));
      dispatch(
        showToast(
          `Đã xóa danh mục "${catName}" thành công (/v1/api/category/delete/${primaryId}).`
        )
      );
      setPendingCategoryId(null);
      void fetchCategories();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      dispatch(
        showErrorToast(
          msg || `Không thể xóa danh mục "${catName}". Vui lòng thử lại.`
        )
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleToggleCategoryStatus = async (
    category: ProductCategory,
    nextStatus: boolean
  ) => {
    const targetCategoryId = String(category.id || category.categoryId || '').trim();
    if (updatingCategoryIds[category.id]) return;

    setUpdatingCategoryIds((prev) => ({ ...prev, [category.id]: true }));
    dispatch(
      toggleCategoryStatus({
        id: category.id,
        category_active: nextStatus,
      })
    );

    try {
      await apiUpdateCategoryStatus({
        id: category.id,
        categoryId: category.categoryId,
        category_active: nextStatus,
        category_name: category.name,
        category_slug: category.slug,
        category_description: category.description,
        category_thumb: category.image,
        parent_id: category.parentId ?? null,
      });
      dispatch(
        showToast(
          `Đã chuyển trạng thái "${tc(category.name)}" sang ${
            nextStatus ? 'Active' : 'Inactive'
          } (/v1/api/category/update/${targetCategoryId})`
        )
      );
      void fetchCategories();
    } catch (err: unknown) {
      dispatch(
        toggleCategoryStatus({
          id: category.id,
          category_active: !nextStatus,
        })
      );
      dispatch(showErrorToast(getApiErrorMessage(err)));
    } finally {
      setUpdatingCategoryIds((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
    }
  };

  if (!canManage) {
    return <AccessDenied featureName="Danh mục & Thương hiệu" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CategoryManager
        categories={categories}
        products={products}
        isLoading={isLoading}
        updatingCategoryIds={updatingCategoryIds}
        onRefresh={() => void fetchCategories()}
        onToggleCategoryStatus={handleToggleCategoryStatus}
        onDeleteCategory={(id) => setPendingCategoryId(id)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(targetCategory)}
        isLoading={isDeletingCategory}
        title="Xác nhận xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này khỏi hệ thống? Các sản phẩm thuộc danh mục này sẽ cần được phân loại lại."
        itemName={targetCategory ? (tc(targetCategory.name) || targetCategory.name || targetCategory.id) : ''}
        itemSubtitle={
          targetCategory
            ? `/${targetCategory.slug} • ${tcd(targetCategory.description || '')}`
            : ''
        }
        itemMeta={`Đang liên kết với ${targetProductCount} sản phẩm`}
        onClose={() => {
          if (!isDeletingCategory) setPendingCategoryId(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
}
