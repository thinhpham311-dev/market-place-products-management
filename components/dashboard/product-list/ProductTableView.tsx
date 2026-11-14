'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { isProductPublished } from '@/services/ProductService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProductTableViewProps {
  products: Product[];
  selectedIds: string[];
  isAllSelected: boolean;
  publishingIds?: Record<string, boolean>;
  unpublishingIds?: Record<string, boolean>;
  onSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onDuplicateProduct: (product: Product) => void;
  onToggleStatus: (id: string) => void;
  onOpenPublishModal: (product: Product) => void;
  onUnpublishProduct?: (product: Product) => void;
  onQuickUpdateStock: (id: string, newStock: number) => void;
  onReorder?: (sourceId: string, targetId: string) => void;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  selectedIds,
  isAllSelected,
  publishingIds = {},
  unpublishingIds = {},
  onSelectAll,
  onToggleSelect,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onToggleStatus,
  onOpenPublishModal,
  onUnpublishProduct,
  onQuickUpdateStock,
  onReorder,
}) => {
  const { t, tp, tc, formatCurrency, formatNumber } = useTranslation();
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== id && dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    if (sourceId && targetId && sourceId !== targetId) {
      onReorder?.(sourceId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleSaveStock = (id: string) => {
    onQuickUpdateStock(id, Math.max(0, inlineStockVal));
    setEditingStockId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Mobile / Tablet Responsive Items Card View (< md) */}
      <div className="md:hidden">
        {/* Mobile Select All & Header Info */}
        <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span>Chọn tất cả ({products.length})</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Đã chọn {selectedIds.length}
            </span>
          )}
        </div>

        {/* List of Mobile Product Cards */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((p, index) => {
            const isSelected = selectedIds.includes(p.id);
            const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
            const isOutOfStock = p.stock === 0;
            const isDraft = p.status === 'draft';
            const isPublished = isProductPublished(p);
            const translatedName = tp(p.name);

            return (
              <div
                key={p.id}
                className={`p-3.5 sm:p-4 transition-all ${
                  isSelected
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Top bar: Checkbox + Priority + Toggle + Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <div
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-slate-500"
                      title="Thứ tự ưu tiên"
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{p.priority ?? index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(p.id)}
                      disabled={Boolean(publishingIds[p.id] || unpublishingIds[p.id])}
                      className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        p.status === 'active' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      } disabled:opacity-50`}
                      title={
                        p.status === 'active'
                          ? t('table.unpublish_tooltip')
                          : t('table.toggle_activate')
                      }
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                          p.status === 'active' ? 'translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                {/* Body: Thumbnail & Details */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => onSelectProduct(p)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group"
                  >
                    <img
                      src={p.thumbnail}
                      alt={translatedName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {p.hasVariants && (
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[8px] sm:text-[9px] text-center font-medium py-0.5">
                        {p.variants?.length} {t('table.variants_unit')}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => onSelectProduct(p)}
                      className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                      title={translatedName}
                    >
                      {translatedName}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {p.sku}
                      </span>
                      {p.brand && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{p.brand}</span>
                        </>
                      )}
                      {p.category && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[100px]">{tc(p.category)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <>
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatCurrency(p.originalPrice)}
                          </span>
                          <span className="text-[10px] font-bold text-rose-500">
                            -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock, Sold, Channels Info */}
                <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  {/* Stock */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Kho:</span>
                    {editingStockId === p.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={inlineStockVal}
                          onChange={(e) => setInlineStockVal(parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 text-xs rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveStock(p.id)}
                          className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                          title={t('table.save')}
                        >
                          <Icons.Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStockId(null)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title={t('table.cancel')}
                        >
                          <Icons.X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
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
                          type="button"
                          onClick={() => {
                            setEditingStockId(p.id);
                            setInlineStockVal(p.stock);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title={t('table.quick_edit_stock')}
                        >
                          <Icons.Edit2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sold & Rating */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {t('table.col_sold')}: <strong className="text-slate-800 dark:text-slate-200">{formatNumber(p.soldCount)}</strong>
                    </span>
                    {p.rating > 0 && (
                      <span className="text-amber-500 font-medium">
                        ★ {p.rating}
                      </span>
                    )}
                  </div>

                  {/* Channels */}
                  {p.channels && p.channels.length > 0 && (
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <span className="text-[10px] text-slate-400">Kênh:</span>
                      {p.channels.map((ch) => (
                        <span
                          key={ch}
                          className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                          {ch === 'website' ? 'Web' : ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="mt-3 pt-2.5 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    {isDraft ? (
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={Boolean(publishingIds[p.id])}
                        disabled={Boolean(publishingIds[p.id])}
                        className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
                        onClick={() => onOpenPublishModal(p)}
                        leftIcon={<Icons.Rocket size={12} />}
                      >
                        {t('table.publish')}
                      </Button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenPublishModal(p)}
                          disabled={Boolean(publishingIds[p.id] || unpublishingIds[p.id])}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title={t('table.publish_tooltip')}
                        >
                          <Icons.Rocket size={14} />
                        </button>
                        {onUnpublishProduct && (
                          <button
                            type="button"
                            onClick={() => onUnpublishProduct(p)}
                            disabled={Boolean(unpublishingIds[p.id] || publishingIds[p.id])}
                            className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title={t('table.unpublish_tooltip')}
                          >
                            <Icons.EyeOff size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(p)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={t('table.view_detail')}
                    >
                      <Icons.Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      title={t('table.edit_product')}
                    >
                      <Icons.Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateProduct(p)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={t('table.duplicate_product')}
                    >
                      <Icons.Copy size={14} />
                    </button>
                    {!isPublished && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title={t('table.delete_product')}
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Full Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[800px] text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-3 w-16 text-center font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center justify-center gap-1">
                  <Icons.ArrowUpDown size={12} className="text-slate-400" />
                  <span>{t('table.col_priority') || 'Ưu tiên'}</span>
                </span>
              </th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_product')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_price')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_stock')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_status_channels')}</th>
              <th className="py-3.5 px-4 font-semibold">{t('table.col_sold')}</th>
              <th className="py-3.5 px-4 font-semibold text-right sticky right-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-l border-slate-200/60 dark:border-slate-700/60">
                {t('table.col_actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((p, index) => {
              const isSelected = selectedIds.includes(p.id);
              const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
              const isOutOfStock = p.stock === 0;
              const isDraft = p.status === 'draft';
              const isPublished = isProductPublished(p);
              const translatedName = tp(p.name);
              const isDraggingThis = draggedId === p.id;
              const isOverThis = dragOverId === p.id && draggedId !== p.id;

              return (
                <tr
                  key={p.id}
                  onDragOver={(e) => handleDragOver(e, p.id)}
                  onDragLeave={() => handleDragLeave(p.id)}
                  onDrop={(e) => handleDrop(e, p.id)}
                  className={`group transition-all ${
                    isDraggingThis
                      ? 'opacity-30 bg-indigo-50/40 dark:bg-indigo-950/20'
                      : isOverThis
                        ? 'border-t-2 border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
                        : isSelected
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
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

                  {/* Drag Handle & Priority badge */}
                  <td className="py-3 px-3 text-center">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      onDragEnd={handleDragEnd}
                      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-grab active:cursor-grabbing select-none"
                      title="Kéo thả để sắp xếp thứ tự ưu tiên"
                    >
                      <Icons.GripVertical size={13} className="shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        #{p.priority ?? index + 1}
                      </span>
                    </div>
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
                          disabled={Boolean(publishingIds[p.id] || unpublishingIds[p.id])}
                          className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            p.status === 'active' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          } disabled:opacity-50`}
                          title={
                            p.status === 'active'
                              ? t('table.unpublish_tooltip')
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
                        {formatNumber(p.soldCount)}
                      </span>
                      {p.rating > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                          ★ {p.rating} ({p.reviewCount})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right sticky right-0 z-10 bg-white/95 dark:bg-slate-900/95 group-hover:bg-slate-50/95 dark:group-hover:bg-slate-800/95 backdrop-blur-sm border-l border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-end gap-1.5">
                      {isDraft ? (
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={Boolean(publishingIds[p.id])}
                          disabled={Boolean(publishingIds[p.id])}
                          className="text-xs h-7.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
                          onClick={() => onOpenPublishModal(p)}
                          leftIcon={<Icons.Rocket size={13} />}
                        >
                          {t('table.publish')}
                        </Button>
                      ) : (
                        <>
                          {onUnpublishProduct && (
                            <button
                              onClick={() => onUnpublishProduct(p)}
                              disabled={Boolean(unpublishingIds[p.id] || publishingIds[p.id])}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title={t('table.unpublish_tooltip')}
                            >
                              <Icons.EyeOff size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenPublishModal(p)}
                            disabled={Boolean(publishingIds[p.id] || unpublishingIds[p.id])}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title={t('table.publish_tooltip')}
                          >
                            <Icons.Rocket size={15} />
                          </button>
                        </>
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
                      {!isPublished && (
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title={t('table.delete_product')}
                        >
                          <Icons.Trash2 size={16} />
                        </button>
                      )}
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
