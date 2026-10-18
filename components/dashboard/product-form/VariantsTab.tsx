'use client';

import React, { useState } from 'react';
import { ProductVariant } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface VariantsTabProps {
  hasVariants: boolean;
  setHasVariants: (v: boolean) => void;
  variantsList: ProductVariant[];
  setVariantsList: (v: ProductVariant[]) => void;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  hasVariants,
  setHasVariants,
  variantsList,
  setVariantsList,
  sku,
  price,
  costPrice,
  stock,
}) => {
  const { t } = useTranslation();
  const [variantOptions] = useState<{ name: string; values: string[] }[]>([
    { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
  ]);
  const [pendingDeleteVariant, setPendingDeleteVariant] = useState<ProductVariant | null>(null);

  const handleGenerateVariants = () => {
    const list: ProductVariant[] = [];
    if (variantOptions.length === 1) {
      variantOptions[0].values.forEach((v, idx) => {
        list.push({
          id: `var-${Date.now()}-${idx}`,
          sku: `${sku}-${v.toUpperCase().replace(/\s+/g, '')}`,
          name: v,
          options: { [variantOptions[0].name]: v },
          price: price || 100000,
          costPrice: costPrice || 50000,
          stock: Math.floor(stock / variantOptions[0].values.length) || 10,
        });
      });
    }
    setVariantsList(list);
  };

  const handleConfirmDeleteVariant = () => {
    if (!pendingDeleteVariant) return;
    setVariantsList(variantsList.filter((v) => v.id !== pendingDeleteVariant.id));
    setPendingDeleteVariant(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('variants.has_variants_title')}
          </h4>
          <p className="text-[11px] text-slate-500">
            {t('variants.has_variants_desc')}
          </p>
        </div>
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => setHasVariants(e.target.checked)}
          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </div>

      {hasVariants && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('variants.matrix_title')} ({variantsList.length} {t('table.variants_unit')})
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleGenerateVariants}
              leftIcon={<Icons.RefreshCw size={13} />}
            >
              {t('variants.generate_sample')}
            </Button>
          </div>

          {variantsList.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">{t('variants.col_variant')}</th>
                    <th className="p-2.5">{t('variants.col_sku')}</th>
                    <th className="p-2.5">{t('variants.col_price')}</th>
                    <th className="p-2.5">{t('variants.col_stock')}</th>
                    <th className="p-2.5 text-right">{t('table.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {variantsList.map((v, i) => (
                    <tr key={v.id || i}>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">{v.name}</td>
                      <td className="p-2.5 font-mono text-slate-500">{v.sku}</td>
                      <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN').format(v.price)} đ
                      </td>
                      <td className="p-2.5 text-emerald-600 font-bold">{v.stock}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteVariant(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Xóa biến thể"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">
              {t('variants.empty_hint')}
            </p>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteVariant)}
        title="Xác nhận xóa biến thể"
        message="Bạn có chắc chắn muốn xóa biến thể phân loại này khỏi sản phẩm?"
        itemName={pendingDeleteVariant ? `Phân loại: ${pendingDeleteVariant.name}` : ''}
        itemSubtitle={pendingDeleteVariant ? `SKU: ${pendingDeleteVariant.sku}` : ''}
        itemMeta={
          pendingDeleteVariant
            ? `Giá: ${new Intl.NumberFormat('vi-VN').format(pendingDeleteVariant.price)} đ • Tồn: ${pendingDeleteVariant.stock}`
            : ''
        }
        onClose={() => setPendingDeleteVariant(null)}
        onConfirm={handleConfirmDeleteVariant}
      />
    </div>
  );
};
