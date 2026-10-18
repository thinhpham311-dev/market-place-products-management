'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { useAppDispatch } from '@/store/hooks';
import { deleteProduct } from '@/store/slices/productsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { DeleteProductModal } from './DeleteProductModal';

interface ProductDetailViewProps {
  product: Product;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, tp, tc } = useTranslation();
  const [activeImage, setActiveImage] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentImage = activeImage || product.thumbnail;
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleConfirmDelete = () => {
    dispatch(deleteProduct(product.id));
    dispatch(showToast(t('delete_modal.success_toast')));
    setShowDeleteModal(false);
    router.push('/products');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header (Sticky below Header) */}
      <div className="sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mx-2 px-2 border-b border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Quay lại"
          >
            <Icons.ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('table.view_detail')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Icons.Trash2 size={15} />}
          >
            {t('table.delete_product')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/products/${product.id}/publish`)}
            leftIcon={<Icons.Rocket size={15} />}
          >
            {t('table.publish')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/products/${product.id}/edit`)}
            leftIcon={<Icons.Edit2 size={15} />}
          >
            {t('table.edit_product')}
          </Button>
        </div>
      </div>

      {/* Product Detail Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Images & Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img
                src={currentImage}
                alt={tp(product.name)}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar scrollbar-thin pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      currentImage === img
                        ? 'border-indigo-600 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Stats */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={product.status} />
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {tc(product.category)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {tp(product.name)}
              </h3>
              {product.brand && (
                <p className="text-xs text-slate-500 mt-1">
                  Brand: <strong className="text-slate-700 dark:text-slate-300">{product.brand}</strong>
                </p>
              )}
            </div>

            {/* Pricing Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500">
                <div>
                  Giá vốn:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {formatCurrency(product.costPrice)}
                  </strong>
                </div>
                <div>
                  Lãi gộp:{' '}
                  <strong className="text-emerald-600">
                    {formatCurrency(product.price - product.costPrice)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 block text-[11px]">{t('table.col_stock')}</span>
                <span
                  className={`text-base font-bold mt-0.5 block ${
                    product.stock <= product.lowStockThreshold
                      ? 'text-amber-500'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {product.stock} {t('table.stock_unit')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t('inventory.col_location')}: {product.warehouseLocation || 'Kho tổng'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 block text-[11px]">{t('table.col_sold')}</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {product.soldCount.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            </div>

            {/* Variants preview if available */}
            {product.hasVariants && product.variants && product.variants.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('variants.matrix_title')} ({product.variants.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <span
                      key={v.id}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {v.name} ({v.stock} {t('table.stock_unit')})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mô tả chi tiết:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteProductModal
        isOpen={showDeleteModal}
        productsToDelete={[product]}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
