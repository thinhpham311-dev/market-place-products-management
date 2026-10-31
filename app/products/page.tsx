'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showErrorToast, showToast } from '@/store/slices/uiSlice';
import {
  deleteProduct,
  duplicateProduct,
  toggleStatus,
  quickUpdateStock,
  publishProduct,
  unpublishProduct,
  bulkPublish,
  bulkUnpublish,
  bulkUpdateStatus,
  bulkDelete,
  setDraftedProducts,
  setPublishedProducts,
} from '@/store/slices/productsSlice';
import {
  apiGetDraftedSpuList,
  apiGetPublishedSpuList,
  apiPublishSpu,
  apiUnpublishSpu,
  extractSpuArray,
  isProductPublished,
  mapSpuToProduct,
} from '@/services/ProductService';
import { getApiErrorMessage } from '@/lib/http/handleAxiosError';
import { useHydrated } from '@/store/StoreProvider';
import { Product, ProductStatus } from '@/types/product';
import { ProductList } from '@/components/dashboard/ProductList';
import { DeleteProductModal } from '@/components/dashboard/products/DeleteProductModal';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const { t } = useTranslation();

  const products = useAppSelector((s) => s.products.items);
  const categories = useAppSelector((s) => s.categories.items);
  const globalSearch = useAppSelector((s) => s.ui.globalSearch);
  const signedIn = useAppSelector((s) => s.auth.session.signedIn);
  const accessToken = useAppSelector((s) => s.auth.session.token);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [publishingIds, setPublishingIds] = useState<Record<string, boolean>>({});
  const [unpublishingIds, setUnpublishingIds] = useState<Record<string, boolean>>({});
  const activeTab = searchParams.get('tab');

  const fetchSpuProducts = useCallback(async () => {
    if (!isHydrated || !signedIn || !accessToken) {
      return;
    }

    const [publishedRes, draftedRes] = await Promise.allSettled([
      apiGetPublishedSpuList(),
      apiGetDraftedSpuList(),
    ]);

    if (publishedRes.status === 'fulfilled') {
      const rawPublished = extractSpuArray(publishedRes.value.data);
      if (Array.isArray(rawPublished)) {
        const mappedPublished = rawPublished.map((item, idx) =>
          mapSpuToProduct(item, idx, 'active')
        );
        dispatch(setPublishedProducts(mappedPublished));
      }
    }

    if (draftedRes.status === 'fulfilled') {
      const rawDrafted = extractSpuArray(draftedRes.value.data);
      if (Array.isArray(rawDrafted)) {
        const mappedDrafts = rawDrafted.map((item, idx) =>
          mapSpuToProduct(item, idx, 'draft')
        );
        dispatch(setDraftedProducts(mappedDrafts));
      }
    }
  }, [isHydrated, signedIn, accessToken, userId, dispatch]);

  useEffect(() => {
    void fetchSpuProducts();
  }, [fetchSpuProducts, activeTab]);

  const handleOpenCreate = () => router.push('/products/new');
  const handleOpenEdit = (product: Product) => router.push(`/products/${product.id}/edit`);
  const handleOpenDetail = (product: Product) => router.push(`/products/${product.id}`);

  const handleOpenPublish = async (product: Product) => {
    if (publishingIds[product.id] || unpublishingIds[product.id]) return;

    setPublishingIds((prev) => ({ ...prev, [product.id]: true }));
    try {
      await apiPublishSpu(product);
      dispatch(
        publishProduct({
          productId: product.id,
          channels: product.channels?.length ? product.channels : ['website'],
          publishMode: 'instant',
        })
      );
      dispatch(showToast(`Đã xuất bản sản phẩm "${product.name}" thành công!`));
      void fetchSpuProducts();
    } catch (error: unknown) {
      dispatch(showErrorToast(getApiErrorMessage(error)));
    } finally {
      setPublishingIds((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const handleUnpublish = async (product: Product) => {
    if (unpublishingIds[product.id] || publishingIds[product.id]) return;

    setUnpublishingIds((prev) => ({ ...prev, [product.id]: true }));
    try {
      await apiUnpublishSpu(product);
      dispatch(unpublishProduct(product.id));
      dispatch(showToast(`Đã gỡ xuất bản sản phẩm "${product.name}" thành công!`));
      void fetchSpuProducts();
    } catch (error: unknown) {
      dispatch(showErrorToast(getApiErrorMessage(error)));
    } finally {
      setUnpublishingIds((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (target && isProductPublished(target)) return;
    setPendingDeleteIds([id]);
  };

  const handleBulkDelete = (ids: string[]) => {
    const deletableIds = ids.filter((id) => {
      const target = products.find((p) => p.id === id);
      return target && !isProductPublished(target);
    });
    if (deletableIds.length > 0) {
      setPendingDeleteIds(deletableIds);
    }
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteIds.length === 1) {
      dispatch(deleteProduct(pendingDeleteIds[0]));
      dispatch(showToast(t('delete_modal.success_toast')));
    } else if (pendingDeleteIds.length > 1) {
      dispatch(bulkDelete(pendingDeleteIds));
      dispatch(showToast(`Đã xóa ${pendingDeleteIds.length} sản phẩm thành công.`));
    }
    setPendingDeleteIds([]);
  };

  const productsToDelete = products.filter((p) => pendingDeleteIds.includes(p.id));

  const handleDuplicateProduct = (product: Product) => {
    dispatch(duplicateProduct(product));
    dispatch(showToast(`Đã nhân bản "${product.name}" thành bản nháp thành công!`));
  };

  const handleToggleStatus = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target || publishingIds[id] || unpublishingIds[id]) return;

    const isCurrentlyPublished = target.status === 'active' || isProductPublished(target);
    if (isCurrentlyPublished) {
      await handleUnpublish(target);
      return;
    }

    await handleOpenPublish(target);
  };

  const handleQuickUpdateStock = (id: string, newStock: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    dispatch(quickUpdateStock({ id, newStock }));
    dispatch(showToast(`Đã cập nhật tồn kho "${target.name}" thành ${newStock}.`));
  };

  const handleBulkUpdateStatus = async (ids: string[], status: ProductStatus) => {
    if (status === 'active') {
      await handleBulkPublish(ids);
      return;
    }
    if (status === 'draft') {
      await handleBulkUnpublish(ids);
      return;
    }
    dispatch(bulkUpdateStatus({ ids, status }));
    dispatch(showToast(`Đã cập nhật trạng thái cho ${ids.length} sản phẩm.`));
  };

  const handleBulkPublish = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => {
          const target = products.find((p) => p.id === id);
          return apiPublishSpu(target || id);
        })
      );
      dispatch(bulkPublish(ids));
      dispatch(showToast(`Đã xuất bản hàng loạt ${ids.length} sản phẩm thành công!`));
      void fetchSpuProducts();
    } catch (error: unknown) {
      dispatch(showErrorToast(getApiErrorMessage(error)));
    }
  };

  const handleBulkUnpublish = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => {
          const target = products.find((p) => p.id === id);
          return apiUnpublishSpu(target || id);
        })
      );
      dispatch(bulkUnpublish(ids));
      dispatch(showToast(`Đã gỡ xuất bản hàng loạt ${ids.length} sản phẩm thành công!`));
      void fetchSpuProducts();
    } catch (error: unknown) {
      dispatch(showErrorToast(getApiErrorMessage(error)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('products.page_title')} ({products.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('products.page_subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icons.Plus size={16} />}
          onClick={handleOpenCreate}
        >
          {t('products.create_new')}
        </Button>
      </div>

      <ProductList
        products={products}
        categories={categories}
        searchQuery={globalSearch}
        publishingIds={publishingIds}
        unpublishingIds={unpublishingIds}
        onSelectProduct={handleOpenDetail}
        onEditProduct={handleOpenEdit}
        onDeleteProduct={handleDeleteProduct}
        onDuplicateProduct={handleDuplicateProduct}
        onToggleStatus={handleToggleStatus}
        onOpenPublishModal={handleOpenPublish}
        onUnpublishProduct={handleUnpublish}
        onQuickUpdateStock={handleQuickUpdateStock}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkDelete={handleBulkDelete}
        onOpenCreateProduct={handleOpenCreate}
      />

      <DeleteProductModal
        isOpen={pendingDeleteIds.length > 0}
        productsToDelete={productsToDelete}
        onClose={() => setPendingDeleteIds([])}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
