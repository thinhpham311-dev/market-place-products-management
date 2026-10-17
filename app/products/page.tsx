'use client';

import { useRouter } from 'next/navigation';
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
} from '@/store/slices/productsSlice';
import { Product, ProductStatus } from '@/types/product';
import { ProductList } from '@/components/dashboard/ProductList';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { t } = useTranslation();

  const products = useAppSelector((s) => s.products.items);
  const categories = useAppSelector((s) => s.categories.items);
  const globalSearch = useAppSelector((s) => s.ui.globalSearch);

  const handleOpenCreate = () => router.push('/products/new');
  const handleOpenEdit = (product: Product) => router.push(`/products/${product.id}/edit`);
  const handleOpenDetail = (product: Product) => router.push(`/products/${product.id}`);
  const handleOpenPublish = (product: Product) => router.push(`/products/${product.id}/publish`);

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${target?.name}"?`)) {
      dispatch(deleteProduct(id));
      dispatch(showToast('Đã xóa sản phẩm thành công.'));
    }
  };

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

  const handleBulkDelete = (ids: string[]) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${ids.length} sản phẩm đã chọn?`)) {
      dispatch(bulkDelete(ids));
      dispatch(showToast(`Đã xóa ${ids.length} sản phẩm thành công.`));
    }
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
    </div>
  );
}
