'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProductTableViewProps {
  products: Product[];
  selectedIds: string[];
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onDuplicateProduct: (product: Product) => void;
  onToggleStatus: (id: string) => void;
  onOpenPublishModal: (product: Product) => void;
  onQuickUpdateStock: (id: string, newStock: number) => void;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onToggleSelect,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onToggleStatus,
  onOpenPublishModal,
  onQuickUpdateStock,
}) => {
  const { t, tp, tc } = useTranslation();
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleSaveStock = (id: string) => {
    onQuickUpdateStock(id, Math.max(0, inlineStockVal));
    setEditingStockId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_product')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_category')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_price')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_stock')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_status_channels')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_sold')}</th>
              <th className="py-3.5 px-4 font-semibold text-right">{t('table.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
              const isOutOfStock = p.stock === 0;
              const isDraft = p.status === 'draft';
              const translatedName = tp(p.name);

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Product Thumbnail & Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onSelectProduct(p)}
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group"
                      >
                        <img
                          src={p.thumbnail}
                          alt={translatedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {p.hasVariants && (
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] text-center font-medium py-0.5">
                            {p.variants?.length} {t('table.variants_unit')}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 max-w-xs">
                        <h4
                          onClick={() => onSelectProduct(p)}
                          className="text-xs font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                          title={translatedName}
                        >
                          {translatedName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                            {p.sku}
                          </span>
                          <span>•</span>
                          <span>{p.brand}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tc(p.category)}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(p.originalPrice)}
                          </span>
                          <span className="text-[10px] font-bold text-rose-500">
                            -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Stock with quick inline editor */}
                  <td className="py-3 px-4">
                    {editingStockId === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={inlineStockVal}
                          onChange={(e) => setInlineStockVal(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveStock(p.id)}
                          className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                          title={t('table.save')}
                        >
                          <Icons.Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingStockId(null)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          title={t('table.cancel')}
                        >
                          <Icons.X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/stock">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}
                        >
                          {p.stock} {t('table.stock_unit')}
                        </span>
                        <button
                          onClick={() => {
                            setEditingStockId(p.id);
                            setInlineStockVal(p.stock);
                          }}
                          className="opacity-0 group-hover/stock:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                          title={t('table.quick_edit_stock')}
                        >
                          <Icons.Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status & Channels */}
                  <td className="py-3 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleStatus(p.id)}
                          className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            p.status === 'active' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          title={
                            p.status === 'active'
                              ? t('table.toggle_hide')
                              : t('table.toggle_activate')
                          }
                        >
                          <div
                            className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                              p.status === 'active' ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <StatusBadge status={p.status} />
                      </div>

                      {p.channels && p.channels.length > 0 && (
                        <div className="flex items-center gap-1">
                          {p.channels.map((ch) => (
                            <span
                              key={ch}
                              className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            >
                              {ch === 'website' ? 'Web' : ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Sold count & rating */}
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.soldCount.toLocaleString()}
                      </span>
                      {p.rating > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                          ★ {p.rating} ({p.reviewCount})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isDraft ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs h-7.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
                          onClick={() => onOpenPublishModal(p)}
                          leftIcon={<Icons.Rocket size={13} />}
                        >
                          {t('table.publish')}
                        </Button>
                      ) : (
                        <button
                          onClick={() => onOpenPublishModal(p)}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title={t('table.publish_tooltip')}
                        >
                          <Icons.Rocket size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={t('table.view_detail')}
                      >
                        <Icons.Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                        title={t('table.edit_product')}
                      >
                        <Icons.Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDuplicateProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={t('table.duplicate_product')}
                      >
                        <Icons.Copy size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={t('table.delete_product')}
                      >
                        <Icons.Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
