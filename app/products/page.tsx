'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showToast } from '@/store/slices/uiSlice';
import {
  deleteProduct,
  duplicateProduct,
  toggleStatus,
  quickUpdateStock,
  bulkPublish,
  bulkUpdateStatus,
  bulkDelete,
  setDraftedProducts,
  setPublishedProducts,
} from '@/store/slices/productsSlice';
import {
  apiGetDraftedSpuList,
  apiGetPublishedSpuList,
  extractSpuArray,
  mapSpuToProduct,
} from '@/services/ProductService';
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
  const handleOpenPublish = (product: Product) => router.push(`/products/${product.id}/publish`);

  const handleDeleteProduct = (id: string) => {
    setPendingDeleteIds([id]);
  };

  const handleBulkDelete = (ids: string[]) => {
    if (ids.length > 0) {
      setPendingDeleteIds(ids);
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

  const handleToggleStatus = (id: string) => dispatch(toggleStatus(id));

  const handleQuickUpdateStock = (id: string, newStock: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    dispatch(quickUpdateStock({ id, newStock }));
    dispatch(showToast(`Đã cập nhật tồn kho "${target.name}" thành ${newStock}.`));
  };

  const handleBulkUpdateStatus = (ids: string[], status: ProductStatus) => {
    dispatch(bulkUpdateStatus({ ids, status }));
    dispatch(showToast(`Đã cập nhật trạng thái cho ${ids.length} sản phẩm.`));
  };

  const handleBulkPublish = (ids: string[]) => {
    dispatch(bulkPublish(ids));
    dispatch(showToast(`Đã xuất bản hàng loạt ${ids.length} sản phẩm thành công!`));
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
        onSelectProduct={handleOpenDetail}
        onEditProduct={handleOpenEdit}
        onDeleteProduct={handleDeleteProduct}
        onDuplicateProduct={handleDuplicateProduct}
        onToggleStatus={handleToggleStatus}
        onOpenPublishModal={handleOpenPublish}
        onQuickUpdateStock={handleQuickUpdateStock}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkPublish={handleBulkPublish}
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
