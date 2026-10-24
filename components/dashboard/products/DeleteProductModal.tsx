'use client';

import React from 'react';
import { Product } from '@/types/product';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface DeleteProductModalProps {
  isOpen: boolean;
  productsToDelete: Product[];
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  productsToDelete,
  onClose,
  onConfirm,
}) => {
  const { t, tp, tc, formatCurrency } = useTranslation();

  if (!isOpen || productsToDelete.length === 0) return null;

  const isBulk = productsToDelete.length > 1;
  const singleProduct = productsToDelete[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBulk ? `${t('delete_modal.bulk_title')} (${productsToDelete.length})` : t('delete_modal.title')}
      description={t('delete_modal.subtitle')}
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('delete_modal.cancel_btn')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Icons.Trash2 size={15} />}
            onClick={onConfirm}
          >
            {t('delete_modal.confirm_btn')}
            {isBulk ? ` (${productsToDelete.length})` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Alert Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-rose-500/30">
            <Icons.AlertTriangle size={18} />
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
            {isBulk ? t('delete_modal.bulk_warning') : t('delete_modal.warning')}
          </p>
        </div>

        {/* Single Product Preview Card */}
        {!isBulk && singleProduct && (
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <img
              src={singleProduct.thumbnail}
              alt={tp(singleProduct.name)}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {tp(singleProduct.name)}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                  {singleProduct.sku}
                </span>
                <span>•</span>
                <span className="truncate">{tc(singleProduct.category)}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(singleProduct.price)}
                </span>
                <span className="text-slate-400">
                  {t('table.col_stock')}:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {singleProduct.stock} {t('table.stock_unit')}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Products Preview List */}
        {isBulk && (
          <div className="max-h-56 overflow-y-auto custom-scrollbar scrollbar-thin space-y-2 pr-1">
            {productsToDelete.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70"
              >
                <img
                  src={item.thumbnail}
                  alt={tp(item.name)}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {tp(item.name)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    SKU: {item.sku} • {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
