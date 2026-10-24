'use client';

import React, { useState } from 'react';
import {
  ProductVariant,
  SpuSkuItem,
  SpuVariationGroup,
} from '@/types/product';
import {
  DEFAULT_SPU_VARIATION_IMAGE,
  EXAMPLE_CREATE_SPU_PAYLOAD,
  generateCartesianSkuList,
} from '@/services/ProductService';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface VariantsTabProps {
  hasVariants: boolean;
  setHasVariants: (v: boolean) => void;
  variantsList: ProductVariant[];
  setVariantsList: (v: ProductVariant[]) => void;
  productVariations: SpuVariationGroup[];
  setProductVariations: (v: SpuVariationGroup[]) => void;
  skuList: SpuSkuItem[];
  setSkuList: (v: SpuSkuItem[]) => void;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
}

function slugifyOptionValue(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  hasVariants,
  setHasVariants,
  setVariantsList,
  productVariations,
  setProductVariations,
  skuList,
  setSkuList,
  sku,
  price,
  costPrice,
  stock,
}) => {
  const { t } = useTranslation();
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [optionInputs, setOptionInputs] = useState<
    Record<number, { label: string; value: string; image: string }>
  >({});

  const syncVariantsFromSpu = (
    nextVariations: SpuVariationGroup[],
    nextSkuList: SpuSkuItem[]
  ) => {
    setProductVariations(nextVariations);
    setSkuList(nextSkuList);

    const mappedVariants: ProductVariant[] = nextSkuList.map((item, idx) => {
      const optionLabels = item.sku_tier_idx.map(
        (optIdx, groupIdx) =>
          nextVariations[groupIdx]?.value[optIdx]?.label ?? `${optIdx}`
      );
      const optionsRecord: Record<string, string> = {};
      item.sku_tier_idx.forEach((optIdx, groupIdx) => {
        const groupName = nextVariations[groupIdx]?.label || `Tier ${groupIdx + 1}`;
        optionsRecord[groupName] =
          nextVariations[groupIdx]?.value[optIdx]?.label ?? `${optIdx}`;
      });
      return {
        id: `var-${idx}-${item.sku_tier_idx.join('-')}`,
        sku: `${sku || 'SPU'}-${item.sku_tier_idx.join('')}`,
        name: optionLabels.join(' / '),
        options: optionsRecord,
        price: item.sku_price,
        costPrice: costPrice || Math.round(item.sku_price * 0.7),
        stock: item.sku_stock,
      };
    });
    setVariantsList(mappedVariants);
  };

  const handleLoadExampleVariations = () => {
    setHasVariants(true);
    syncVariantsFromSpu(
      EXAMPLE_CREATE_SPU_PAYLOAD.product_variations,
      EXAMPLE_CREATE_SPU_PAYLOAD.sku_list
    );
  };

  const handleRegenerateMatrix = (nextVariations = productVariations) => {
    const generated = generateCartesianSkuList(
      nextVariations,
      price || 50,
      stock || 10,
      skuList
    );
    syncVariantsFromSpu(nextVariations, generated);
  };

  const handleAddGroup = () => {
    const trimmed = newGroupLabel.trim();
    if (!trimmed) return;
    const nextVariations: SpuVariationGroup[] = [
      ...productVariations,
      {
        label: trimmed,
        value: [
          {
            label: 'Default',
            value: 'default',
            image: DEFAULT_SPU_VARIATION_IMAGE,
          },
        ],
      },
    ];
    setNewGroupLabel('');
    handleRegenerateMatrix(nextVariations);
  };

  const handleRemoveGroup = (groupIdx: number) => {
    const nextVariations = productVariations.filter((_, idx) => idx !== groupIdx);
    handleRegenerateMatrix(nextVariations);
  };

  const handleUpdateGroupLabel = (groupIdx: number, nextLabel: string) => {
    const nextVariations = productVariations.map((g, idx) =>
      idx === groupIdx ? { ...g, label: nextLabel } : g
    );
    setProductVariations(nextVariations);
  };

  const handleAddOption = (groupIdx: number) => {
    const input = optionInputs[groupIdx] || {
      label: '',
      value: '',
      image: DEFAULT_SPU_VARIATION_IMAGE,
    };
    const label = input.label.trim();
    if (!label) return;
    const val = input.value.trim() || slugifyOptionValue(label);
    const img = input.image.trim() || DEFAULT_SPU_VARIATION_IMAGE;

    const nextVariations = productVariations.map((g, idx) =>
      idx === groupIdx
        ? {
            ...g,
            value: [...g.value, { label, value: val, image: img }],
          }
        : g
    );
    setOptionInputs((prev) => ({
      ...prev,
      [groupIdx]: { label: '', value: '', image: DEFAULT_SPU_VARIATION_IMAGE },
    }));
    handleRegenerateMatrix(nextVariations);
  };

  const handleRemoveOption = (groupIdx: number, optIdx: number) => {
    const nextVariations = productVariations.map((g, idx) =>
      idx === groupIdx
        ? {
            ...g,
            value: g.value.filter((_, i) => i !== optIdx),
          }
        : g
    );
    handleRegenerateMatrix(nextVariations);
  };

  const handleUpdateOptionField = (
    groupIdx: number,
    optIdx: number,
    field: 'label' | 'value' | 'image',
    nextVal: string
  ) => {
    const nextVariations = productVariations.map((g, idx) => {
      if (idx !== groupIdx) return g;
      return {
        ...g,
        value: g.value.map((opt, i) => {
          if (i !== optIdx) return opt;
          if (field === 'label') {
            return {
              ...opt,
              label: nextVal,
              value: slugifyOptionValue(nextVal),
            };
          }
          return { ...opt, [field]: nextVal };
        }),
      };
    });
    setProductVariations(nextVariations);
  };

  const handleUpdateSkuItem = (
    skuIdx: number,
    field: 'sku_price' | 'sku_stock',
    nextVal: number
  ) => {
    const nextSkuList = skuList.map((item, idx) =>
      idx === skuIdx ? { ...item, [field]: Math.max(0, nextVal) } : item
    );
    syncVariantsFromSpu(productVariations, nextSkuList);
  };

  const getCombinationLabel = (tierIdx: number[]): string => {
    return tierIdx
      .map(
        (optIdx, groupIdx) =>
          productVariations[groupIdx]?.value[optIdx]?.label ?? `#${optIdx}`
      )
      .join(' / ');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('variants.has_variants_title')} (<code className="font-mono text-indigo-600 dark:text-indigo-400">product_variations</code> &amp; <code className="font-mono text-indigo-600 dark:text-indigo-400">sku_list</code>)
          </h4>
          <p className="text-[11px] text-slate-500">
            Cấu hình các nhóm phân loại (VD: color, size, material) và tự động sinh tổ hợp ma trận <code className="font-mono">sku_tier_idx</code>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleLoadExampleVariations}
            leftIcon={<Icons.RefreshCw size={13} />}
          >
            Nạp mẫu (color / size / material)
          </Button>
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Variation Groups Builder (product_variations) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            1. Nhóm biến thể (<code className="font-mono text-indigo-500">product_variations</code> - {productVariations.length} nhóm)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupLabel}
              onChange={(e) => setNewGroupLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGroup();
                }
              }}
              placeholder="Tên nhóm mới (VD: color, size, material)..."
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white outline-none w-56"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleAddGroup}
              leftIcon={<Icons.Plus size={13} />}
            >
              Thêm nhóm
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {productVariations.map((group, groupIdx) => {
            const draftOption = optionInputs[groupIdx] || {
              label: '',
              value: '',
              image: DEFAULT_SPU_VARIATION_IMAGE,
            };

            return (
              <div
                key={groupIdx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono font-bold">
                      Tier #{groupIdx}
                    </span>
                    <input
                      type="text"
                      value={group.label}
                      onChange={(e) => handleUpdateGroupLabel(groupIdx, e.target.value)}
                      placeholder="label (VD: color)"
                      className="text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white outline-none"
                    />
                    <span className="text-[11px] text-slate-400">
                      ({group.value.length} giá trị)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(groupIdx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Xóa nhóm biến thể"
                  >
                    <Icons.Trash2 size={14} />
                  </button>
                </div>

                {/* Options table inside group */}
                <div className="space-y-2">
                  {group.value.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs"
                    >
                      <div className="sm:col-span-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          idx: {optIdx}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) =>
                            handleUpdateOptionField(groupIdx, optIdx, 'label', e.target.value)
                          }
                          placeholder="label (VD: Red)"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) =>
                            handleUpdateOptionField(groupIdx, optIdx, 'value', e.target.value)
                          }
                          placeholder="value (VD: red)"
                          className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-600 dark:text-slate-300 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4 flex items-center gap-2">
                        <img
                          src={opt.image || DEFAULT_SPU_VARIATION_IMAGE}
                          alt={opt.label}
                          className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <input
                          type="text"
                          value={opt.image}
                          onChange={(e) =>
                            handleUpdateOptionField(groupIdx, optIdx, 'image', e.target.value)
                          }
                          placeholder="image URL..."
                          className="w-full text-[11px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(groupIdx, optIdx)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Xóa tùy chọn"
                        >
                          <Icons.X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new option to group */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={draftOption.label}
                      onChange={(e) =>
                        setOptionInputs((prev) => ({
                          ...prev,
                          [groupIdx]: {
                            ...draftOption,
                            label: e.target.value,
                            value: slugifyOptionValue(e.target.value),
                          },
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption(groupIdx);
                        }
                      }}
                      placeholder="+ Nhập label mới (VD: Blue, XL)..."
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={draftOption.value}
                      onChange={(e) =>
                        setOptionInputs((prev) => ({
                          ...prev,
                          [groupIdx]: { ...draftOption, value: e.target.value },
                        }))
                      }
                      placeholder="value (tự động slug)"
                      className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={draftOption.image}
                      onChange={(e) =>
                        setOptionInputs((prev) => ({
                          ...prev,
                          [groupIdx]: { ...draftOption, image: e.target.value },
                        }))
                      }
                      placeholder="Image URL..."
                      className="w-full text-[11px] font-mono bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleAddOption(groupIdx)}
                    >
                      + Thêm giá trị
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SKU Matrix Table (sku_list) */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              2. Ma trận tổ hợp SKU (<code className="font-mono text-indigo-500">sku_list</code> - {skuList.length} phân loại)
            </span>
            <p className="text-[11px] text-slate-400">
              Tự động kết hợp Cartesian từ <code className="font-mono">product_variations</code> theo thứ tự <code className="font-mono">sku_tier_idx</code>
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleRegenerateMatrix()}
            leftIcon={<Icons.RefreshCw size={13} />}
          >
            Đồng bộ lại sku_list
          </Button>
        </div>

        {skuList.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5 font-mono">sku_tier_idx</th>
                  <th className="p-2.5">Tổ hợp biến thể</th>
                  <th className="p-2.5 font-mono">sku_price</th>
                  <th className="p-2.5 font-mono">sku_stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {skuList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      [{item.sku_tier_idx.join(', ')}]
                    </td>
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                      {getCombinationLabel(item.sku_tier_idx)}
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        value={item.sku_price}
                        onChange={(e) =>
                          handleUpdateSkuItem(idx, 'sku_price', Number(e.target.value))
                        }
                        className="w-28 text-xs font-semibold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        value={item.sku_stock}
                        onChange={(e) =>
                          handleUpdateSkuItem(idx, 'sku_stock', Number(e.target.value))
                        }
                        className="w-24 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-emerald-600 dark:text-emerald-400 outline-none focus:border-indigo-500"
                      />
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
    </div>
  );
};
