'use client';

import React from 'react';
import { Product } from '@/types/product';
import { isProductPublished } from '@/services/ProductService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProductGridViewProps {
  products: Product[];
  selectedIds: string[];
  publishingIds?: Record<string, boolean>;
  unpublishingIds?: Record<string, boolean>;
  onToggleSelect: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenPublishModal: (product: Product) => void;
  onUnpublishProduct?: (product: Product) => void;
}

export const ProductGridView: React.FC<ProductGridViewProps> = ({
  products,
  selectedIds,
  publishingIds = {},
  unpublishingIds = {},
  onToggleSelect,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenPublishModal,
  onUnpublishProduct,
}) => {
  const { t, tp, tc, formatCurrency, formatNumber } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => {
        const isSelected = selectedIds.includes(p.id);
        const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
        const isOutOfStock = p.stock === 0;
        const isDraft = p.status === 'draft';
        const isPublished = isProductPublished(p);
        const translatedName = tp(p.name);

        return (
          <div
            key={p.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group shadow-sm hover:shadow-md ${
              isSelected
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {/* Image & Badges */}
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={p.thumbnail}
                alt={translatedName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Checkbox */}
              <div className="absolute top-3 left-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(p.id)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shadow"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <StatusBadge status={p.status} />
              </div>

              {/* Discount pill */}
              {p.originalPrice && p.originalPrice > p.price && (
                <div className="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                </div>
              )}

              {/* Publish hover button for draft */}
              {isDraft && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={Boolean(publishingIds[p.id])}
                    disabled={Boolean(publishingIds[p.id])}
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs w-full shadow-lg"
                    onClick={() => onOpenPublishModal(p)}
                    leftIcon={<Icons.Rocket size={14} />}
                  >
                    {t('table.publish_now')}
                  </Button>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {p.sku}
                  </span>
                  <span>{tc(p.category)}</span>
                </div>

                <h4
                  onClick={() => onSelectProduct(p)}
                  className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 cursor-pointer"
                >
                  {translatedName}
                </h4>

                {/* Pricing */}
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(p.price)}
                  </span>
                  {p.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrency(p.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Stock level progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">{t('table.col_stock')}</span>
                    <span
                      className={`font-semibold ${
                        isOutOfStock
                          ? 'text-rose-600'
                          : isLowStock
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {p.stock} {t('table.stock_unit')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOutOfStock
                          ? 'bg-rose-500'
                          : isLowStock
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {t('table.col_sold')}: <strong>{formatNumber(p.soldCount)}</strong>
                </span>
                <div className="flex items-center gap-1">
                  {!isDraft && onUnpublishProduct && (
                    <button
                      onClick={() => onUnpublishProduct(p)}
                      disabled={Boolean(unpublishingIds[p.id] || publishingIds[p.id])}
                      className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors disabled:opacity-50"
                      title={t('table.unpublish_tooltip')}
                    >
                      <Icons.EyeOff size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => onOpenPublishModal(p)}
                    disabled={Boolean(publishingIds[p.id] || unpublishingIds[p.id])}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors disabled:opacity-50"
                    title={t('table.publish_tooltip')}
                  >
                    <Icons.Rocket size={15} />
                  </button>
                  <button
                    onClick={() => onSelectProduct(p)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t('table.view_detail')}
                  >
                    <Icons.Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEditProduct(p)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                    title={t('table.edit_product')}
                  >
                    <Icons.Edit2 size={15} />
                  </button>
                  {!isPublished && (
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title={t('table.delete_product')}
                    >
                      <Icons.Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
