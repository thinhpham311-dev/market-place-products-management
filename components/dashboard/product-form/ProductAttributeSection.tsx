'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  SpuAttributeItem,
  SpuProductAttributes,
  SpuProductAttributeValue,
} from '@/types/product';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';

export interface AttributePreset {
  id: string;
  name: string;
  attribute_id: number;
  icon: string;
  values: Array<{ value_id: number; name: string }>;
}

const safeAttrText = (val: unknown, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    const obj = val as Record<string, any>;
    return String(obj.name || obj.label || obj.vi || obj.value || fallback);
  }
  const s = String(val).trim();
  return s === '[object Object]' ? fallback : s;
};

export const ATTRIBUTE_PRESETS: AttributePreset[] = [
  {
    id: 'material',
    name: 'Chất liệu (Material)',
    attribute_id: 200000,
    icon: '🧵',
    values: [
      { value_id: 1, name: 'Cotton 100%' },
      { value_id: 2, name: 'Polyester Thoáng Khí' },
      { value_id: 3, name: 'Vải Kaki Cao Cấp' },
      { value_id: 4, name: 'Denim Jeans Bền Bỉ' },
      { value_id: 5, name: 'Linen Tự Nhiên' },
    ],
  },
  {
    id: 'origin',
    name: 'Xuất xứ (Origin)',
    attribute_id: 200001,
    icon: '🌐',
    values: [
      { value_id: 10, name: 'Việt Nam' },
      { value_id: 11, name: 'Hàn Quốc' },
      { value_id: 12, name: 'Nhật Bản' },
      { value_id: 13, name: 'Mỹ (USA)' },
      { value_id: 14, name: 'Châu Âu (EU)' },
    ],
  },
  {
    id: 'warranty',
    name: 'Bảo hành (Warranty)',
    attribute_id: 200002,
    icon: '🛡️',
    values: [
      { value_id: 20, name: 'Bảo hành 6 tháng' },
      { value_id: 21, name: 'Bảo hành 12 tháng' },
      { value_id: 22, name: 'Bảo hành 24 tháng' },
      { value_id: 23, name: 'Đổi mới trong 30 ngày' },
    ],
  },
  {
    id: 'style',
    name: 'Kiểu dáng (Style)',
    attribute_id: 200003,
    icon: '👔',
    values: [
      { value_id: 30, name: 'Slimfit Ôm Dáng' },
      { value_id: 31, name: 'Regular Vừa Vặn' },
      { value_id: 32, name: 'Oversize Rộng Rãi' },
      { value_id: 33, name: 'Unisex Nam Nữ' },
    ],
  },
  {
    id: 'distribution',
    name: 'Thương hiệu / Phân phối',
    attribute_id: 200004,
    icon: '🏷️',
    values: [
      { value_id: 40, name: 'Chính Hãng Phân Phối' },
      { value_id: 41, name: 'Thiết Kế Độc Quyền' },
      { value_id: 42, name: 'Gia Công Xuất Khẩu' },
    ],
  },
];

interface ProductAttributeSectionProps {
  productAttributes: SpuProductAttributes;
  setProductAttributes: (v: SpuProductAttributes) => void;
}

export const ProductAttributeSection: React.FC<ProductAttributeSectionProps> = ({
  productAttributes,
  setProductAttributes,
}) => {
  // Convert initial productAttributes into SpuAttributeItem list
  const initialItems = useMemo<SpuAttributeItem[]>(() => {
    if (
      Array.isArray(productAttributes?.items) &&
      productAttributes.items.length > 0
    ) {
      return productAttributes.items;
    }

    if (
      productAttributes &&
      typeof productAttributes.attribute_id === 'number' &&
      Array.isArray(productAttributes.attribute_value) &&
      productAttributes.attribute_value.length > 0
    ) {
      return [
        {
          id: `attr-${productAttributes.attribute_id}`,
          name: productAttributes.name || 'Chất liệu (Mặc định SPU)',
          attribute_id: productAttributes.attribute_id,
          attribute_value: productAttributes.attribute_value,
        },
      ];
    }

    return [
      {
        id: 'attr-200000',
        name: 'Chất liệu (Mặc định SPU)',
        attribute_id: 200000,
        attribute_value: [{ value_id: 1, name: 'Cotton' }, { value_id: 2, name: 'Polyester' }],
      },
    ];
  }, [productAttributes]);

  const [attributes, setAttributes] = useState<SpuAttributeItem[]>(initialItems);
  const [primaryAttributeId, setPrimaryAttributeId] = useState<number>(
    productAttributes?.attribute_id ?? initialItems[0]?.attribute_id ?? 200000
  );

  // Sync internal attributes to parent productAttributes
  const syncToParent = (
    nextAttributes: SpuAttributeItem[],
    chosenPrimaryId?: number
  ) => {
    setAttributes(nextAttributes);

    if (nextAttributes.length === 0) {
      const fallback: SpuProductAttributes = {
        attribute_id: 200000,
        attribute_value: [{ value_id: 1 }],
        items: [],
      };
      setProductAttributes(fallback);
      setPrimaryAttributeId(200000);
      return;
    }

    const currentPrimary =
      nextAttributes.find((a) => a.attribute_id === (chosenPrimaryId ?? primaryAttributeId)) ||
      nextAttributes[0];

    const targetId = currentPrimary.attribute_id;
    setPrimaryAttributeId(targetId);

    const payload: SpuProductAttributes = {
      attribute_id: targetId,
      name: currentPrimary.name,
      attribute_value: currentPrimary.attribute_value,
      items: nextAttributes,
    };

    setProductAttributes(payload);
  };

  // Re-sync if parent changed externally (e.g. example button clicked or reset)
  useEffect(() => {
    if (
      Array.isArray(productAttributes?.items) &&
      productAttributes.items.length > 0
    ) {
      setAttributes(productAttributes.items);
      setPrimaryAttributeId(productAttributes.attribute_id);
    } else if (
      productAttributes &&
      typeof productAttributes.attribute_id === 'number'
    ) {
      // Check if current attributes list matches
      const exists = attributes.some(
        (a) => a.attribute_id === productAttributes.attribute_id
      );
      if (!exists && productAttributes.attribute_value) {
        const item: SpuAttributeItem = {
          id: `attr-${productAttributes.attribute_id}`,
          name: productAttributes.name || `Thuộc tính #${productAttributes.attribute_id}`,
          attribute_id: productAttributes.attribute_id,
          attribute_value: productAttributes.attribute_value,
        };
        setAttributes([item]);
        setPrimaryAttributeId(productAttributes.attribute_id);
      }
    }
  }, [productAttributes]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);

  // Modal Form Inputs
  const [formName, setFormName] = useState('');
  const [formAttributeId, setFormAttributeId] = useState<number>(200000);
  const [formValues, setFormValues] = useState<SpuProductAttributeValue[]>([]);
  const [inputValueId, setInputValueId] = useState('');
  const [inputValueName, setInputValueName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline Quick Add per attribute card
  const [inlineValueId, setInlineValueId] = useState<Record<number, string>>({});
  const [inlineValueName, setInlineValueName] = useState<Record<number, string>>({});

  // Preview Collapsible
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Auto calculate next available attribute ID
  const getNextAttributeId = (): number => {
    if (attributes.length === 0) return 200000;
    const maxId = Math.max(...attributes.map((a) => a.attribute_id));
    return maxId >= 200000 ? maxId + 1 : 200000;
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingAttrId(null);
    setFormName('');
    setFormAttributeId(getNextAttributeId());
    setFormValues([
      { value_id: 1, name: 'Giá trị 1' },
      { value_id: 2, name: 'Giá trị 2' },
    ]);
    setInputValueId('');
    setInputValueName('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (attr: SpuAttributeItem) => {
    setModalMode('edit');
    setEditingAttrId(attr.attribute_id);
    setFormName(attr.name);
    setFormAttributeId(attr.attribute_id);
    setFormValues([...attr.attribute_value]);
    setInputValueId('');
    setInputValueName('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: AttributePreset) => {
    setFormName(preset.name);
    // Auto-adjust ID if current ID already taken by another attribute
    const isIdTaken = attributes.some(
      (a) => a.attribute_id === preset.attribute_id && a.attribute_id !== editingAttrId
    );
    setFormAttributeId(isIdTaken ? getNextAttributeId() : preset.attribute_id);
    setFormValues([...preset.values]);
    setFormError(null);
  };

  const handleAddValueToModal = () => {
    const valId = Number(inputValueId.trim());
    if (inputValueId.trim() === '' || Number.isNaN(valId)) {
      setFormError('Vui lòng nhập Mã giá trị (value_id) là số nguyên hợp lệ!');
      return;
    }

    if (formValues.some((v) => v.value_id === valId)) {
      setFormError(`Giá trị với value_id = ${valId} đã tồn tại trong thuộc tính này!`);
      return;
    }

    setFormValues([
      ...formValues,
      {
        value_id: valId,
        ...(inputValueName.trim() ? { name: inputValueName.trim() } : {}),
      },
    ]);
    setInputValueId('');
    setInputValueName('');
    setFormError(null);
  };

  const handleRemoveValueFromModal = (valId: number) => {
    setFormValues(formValues.filter((v) => v.value_id !== valId));
  };

  const handleSaveModal = () => {
    if (!formName.trim()) {
      setFormError('Vui lòng nhập Tên thuộc tính!');
      return;
    }
    if (!formAttributeId || Number.isNaN(formAttributeId)) {
      setFormError('Vui lòng nhập Mã thuộc tính (attribute_id) là một số!');
      return;
    }
    if (formValues.length === 0) {
      setFormError('Vui lòng thêm ít nhất 1 giá trị (value_id) cho thuộc tính!');
      return;
    }

    // Check duplicate ID
    const isDuplicate = attributes.some(
      (a) => a.attribute_id === formAttributeId && a.attribute_id !== editingAttrId
    );
    if (isDuplicate) {
      setFormError(`Mã attribute_id ${formAttributeId} đã tồn tại. Vui lòng chọn mã khác!`);
      return;
    }

    let nextList: SpuAttributeItem[];
    if (modalMode === 'create') {
      const newItem: SpuAttributeItem = {
        id: `attr-${formAttributeId}-${Date.now()}`,
        name: formName.trim(),
        attribute_id: Number(formAttributeId),
        attribute_value: formValues,
      };
      nextList = [...attributes, newItem];
    } else {
      nextList = attributes.map((a) =>
        a.attribute_id === editingAttrId
          ? {
              ...a,
              name: formName.trim(),
              attribute_id: Number(formAttributeId),
              attribute_value: formValues,
            }
          : a
      );
    }

    syncToParent(nextList, formAttributeId);
    setIsModalOpen(false);
  };

  const handleDeleteAttribute = (attrId: number) => {
    const nextList = attributes.filter((a) => a.attribute_id !== attrId);
    syncToParent(nextList);
  };

  const handleInlineAddValue = (attrId: number) => {
    const rawId = (inlineValueId[attrId] || '').trim();
    const valId = Number(rawId);
    const valName = (inlineValueName[attrId] || '').trim();

    if (!rawId || Number.isNaN(valId)) return;

    const nextList = attributes.map((attr) => {
      if (attr.attribute_id !== attrId) return attr;
      if (attr.attribute_value.some((v) => v.value_id === valId)) return attr;
      return {
        ...attr,
        attribute_value: [
          ...attr.attribute_value,
          { value_id: valId, ...(valName ? { name: valName } : {}) },
        ],
      };
    });

    setInlineValueId((prev) => ({ ...prev, [attrId]: '' }));
    setInlineValueName((prev) => ({ ...prev, [attrId]: '' }));
    syncToParent(nextList);
  };

  const handleInlineRemoveValue = (attrId: number, valId: number) => {
    const nextList = attributes.map((attr) => {
      if (attr.attribute_id !== attrId) return attr;
      return {
        ...attr,
        attribute_value: attr.attribute_value.filter((v) => v.value_id !== valId),
      };
    });
    syncToParent(nextList);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-4 shadow-sm">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Icons.Sliders size={18} />
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Thuộc tính SPU (<code className="font-mono text-indigo-600 dark:text-indigo-400">product_attributes</code>)
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {attributes.length} thuộc tính
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Định nghĩa thông số kỹ thuật (Chất liệu, Xuất xứ, Bảo hành...) đồng bộ với API SPU.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="text-xs font-mono"
            title="Xem trước cấu trúc JSON SPU gửi lên backend"
          >
            {showJsonPreview ? 'Ẩn JSON' : 'Xem JSON'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Icons.Plus size={15} />
            Tạo thuộc tính mới
          </Button>
        </div>
      </div>

      {/* JSON SPU Preview */}
      {showJsonPreview && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
            <span>Payload gửi lên /v1/api/product/spu/create</span>
            <span>Primary ID: {primaryAttributeId}</span>
          </div>
          <pre className="text-[11px] leading-relaxed">
            {JSON.stringify(
              {
                product_attributes: {
                  attribute_id: primaryAttributeId,
                  name: attributes.find((a) => a.attribute_id === primaryAttributeId)?.name,
                  attribute_value: attributes.find((a) => a.attribute_id === primaryAttributeId)
                    ?.attribute_value,
                  items: attributes,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Attribute Cards List */}
      {attributes.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
            <Icons.Layers size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chưa có thuộc tính nào được cấu hình
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tạo thuộc tính hoặc chọn từ các mẫu gợi ý sẵn để bổ sung thông số cho sản phẩm.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5"
          >
            <Icons.Plus size={14} />
            Tạo thuộc tính ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {attributes.map((attr) => {
            const isPrimary = attr.attribute_id === primaryAttributeId;
            return (
              <div
                key={attr.attribute_id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isPrimary
                    ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {safeAttrText(attr.name, `Thuộc tính #${attr.attribute_id}`)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ID: {attr.attribute_id}
                    </span>
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        SPU Chính
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => syncToParent(attributes, attr.attribute_id)}
                        className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                        title="Đặt làm thuộc tính chính được map vào SPU"
                      >
                        Đặt làm SPU chính
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(attr)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Chỉnh sửa thuộc tính"
                    >
                      <Icons.Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttribute(attr.attribute_id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Xóa thuộc tính"
                    >
                      <Icons.Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Values List */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {attr.attribute_value.length === 0 ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Chưa có giá trị nào. Vui lòng thêm giá trị bên dưới.
                      </span>
                    ) : (
                      attr.attribute_value.map((v) => (
                        <span
                          key={v.value_id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/60"
                        >
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            #{v.value_id}
                          </span>
                          {v.name && (
                            <span className="font-sans text-slate-700 dark:text-slate-300 font-medium">
                              : {safeAttrText(v.name)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleInlineRemoveValue(attr.attribute_id, v.value_id)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer ml-0.5"
                            title="Xóa giá trị này"
                          >
                            <Icons.X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Inline Quick Add Value */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      value={inlineValueId[attr.attribute_id] || ''}
                      onChange={(e) =>
                        setInlineValueId((prev) => ({
                          ...prev,
                          [attr.attribute_id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInlineAddValue(attr.attribute_id);
                        }
                      }}
                      placeholder="value_id (số)"
                      className="w-28 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={inlineValueName[attr.attribute_id] || ''}
                      onChange={(e) =>
                        setInlineValueName((prev) => ({
                          ...prev,
                          [attr.attribute_id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInlineAddValue(attr.attribute_id);
                        }
                      }}
                      placeholder="Tên giá trị (VD: Cotton, 12 tháng...)"
                      className="flex-1 max-w-xs text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleInlineAddValue(attr.attribute_id)}
                      className="text-xs px-2.5 py-1 h-auto"
                    >
                      + Thêm
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Presets Footer */}
      <div className="pt-2">
        <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
          Gợi ý nhanh thuộc tính thông dụng:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ATTRIBUTE_PRESETS.map((preset) => {
            const alreadyAdded = attributes.some((a) => a.name === preset.name);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => {
                  if (alreadyAdded) return;
                  const isIdTaken = attributes.some((a) => a.attribute_id === preset.attribute_id);
                  const nextId = isIdTaken ? getNextAttributeId() : preset.attribute_id;
                  const newItem: SpuAttributeItem = {
                    id: `attr-${nextId}-${Date.now()}`,
                    name: preset.name,
                    attribute_id: nextId,
                    attribute_value: preset.values,
                  };
                  syncToParent([...attributes, newItem], nextId);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  alreadyAdded
                    ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-2xs'
                }`}
              >
                <span>{preset.icon}</span>
                <span>{preset.name.split(' (')[0]}</span>
                {alreadyAdded ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal: Tạo / Chỉnh sửa thuộc tính */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo thuộc tính sản phẩm mới' : 'Chỉnh sửa thuộc tính'}
        description="Định cấu hình tên thuộc tính, mã định danh và các giá trị tương ứng."
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveModal}
              className="flex items-center gap-1.5"
            >
              <Icons.Check size={14} />
              {modalMode === 'create' ? 'Tạo thuộc tính' : 'Cập nhật thuộc tính'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <Icons.X size={14} />
              </button>
            </div>
          )}

          {/* Quick Preset Selector in Modal */}
          {modalMode === 'create' && (
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
              <span className="block text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Áp dụng nhanh từ mẫu gợi ý:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ATTRIBUTE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name.split(' (')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attribute Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên thuộc tính <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Chất liệu, Xuất xứ, Kiểu dáng..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã thuộc tính (<code className="font-mono">attribute_id</code>) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formAttributeId}
                onChange={(e) => setFormAttributeId(Number(e.target.value) || 0)}
                placeholder="200000"
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Attribute Values List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Danh sách giá trị (<code className="font-mono">attribute_value: [{'{ value_id }'}]</code>){' '}
              <span className="text-rose-500">*</span>
            </label>

            {/* Value Inputs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="number"
                value={inputValueId}
                onChange={(e) => setInputValueId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddValueToModal();
                  }
                }}
                placeholder="Mã value_id (VD: 1, 2)..."
                className="w-full sm:w-44 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={inputValueName}
                onChange={(e) => setInputValueName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddValueToModal();
                  }
                }}
                placeholder="Tên giá trị hiển thị (VD: Cotton 100%, Việt Nam...)"
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddValueToModal}
                className="shrink-0"
              >
                + Thêm giá trị
              </Button>
            </div>

            {/* Added Values Badges */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 min-h-16 flex flex-wrap items-center gap-1.5">
              {formValues.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  Chưa có giá trị nào được thêm. Vui lòng nhập value_id và ấn &quot;+ Thêm giá trị&quot;.
                </span>
              ) : (
                formValues.map((val) => (
                  <span
                    key={val.value_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span className="font-bold">#{val.value_id}</span>
                    {val.name && <span className="font-sans font-medium text-slate-700 dark:text-slate-300">: {safeAttrText(val.name)}</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveValueFromModal(val.value_id)}
                      className="hover:text-rose-500 cursor-pointer"
                      title="Xóa giá trị"
                    >
                      <Icons.X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
