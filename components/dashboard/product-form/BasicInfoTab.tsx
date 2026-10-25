'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProductCategory, SpuProductAttributes } from '@/types/product';
import { flattenCategoryTreeWithDepth } from '@/services/CategoryService';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { ProductAttributeSection } from './ProductAttributeSection';

interface BasicInfoTabProps {
  name: string;
  setName: (v: string) => void;
  sku: string;
  setSku: (v: string) => void;
  barcode: string;
  setBarcode: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categories: ProductCategory[];
  brand: string;
  setBrand: (v: string) => void;
  shortDescription: string;
  setShortDescription: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  productCategoryList: string[];
  setProductCategoryList: (v: string[]) => void;
  productAttributes: SpuProductAttributes;
  setProductAttributes: (v: SpuProductAttributes) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  name,
  setName,
  sku,
  setSku,
  barcode,
  setBarcode,
  categoryId,
  setCategoryId,
  categories,
  brand,
  setBrand,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
  tags,
  setTags,
  productCategoryList,
  setProductCategoryList,
  productAttributes,
  setProductAttributes,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [pendingDeleteTag, setPendingDeleteTag] = useState<string | null>(null);
  const [categoryItemInput, setCategoryItemInput] = useState('');

  const activeCategories = useMemo(
    () => categories.filter((c) => c.category_active === true),
    [categories]
  );

  const nestedCategories = useMemo(
    () => flattenCategoryTreeWithDepth(activeCategories),
    [activeCategories]
  );

  const handleAddCategoryItem = () => {
    const trimmed = categoryItemInput.trim();
    if (trimmed && !productCategoryList.includes(trimmed)) {
      setProductCategoryList([...productCategoryList, trimmed]);
      setCategoryItemInput('');
    }
  };

  const handleRemoveCategoryItem = (catItem: string) => {
    setProductCategoryList(productCategoryList.filter((item) => item !== catItem));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleConfirmRemoveTag = () => {
    if (!pendingDeleteTag) return;
    setTags(tags.filter((item) => item !== pendingDeleteTag));
    setPendingDeleteTag(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
          Tên sản phẩm <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Áo Polo Nam Phối Cổ Dệt Bo Cao Cấp..."
          className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Mã SKU sản phẩm <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="VD: POLO-MEN-01"
            className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Mã vạch / Barcode (EAN/UPC)
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="VD: 8936001234567"
            className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Danh mục chính (Active)
            </label>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {nestedCategories.length} Active
            </span>
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              const selectedId = e.target.value;
              setCategoryId(selectedId);
              if (selectedId && !productCategoryList.includes(selectedId)) {
                setProductCategoryList([...productCategoryList, selectedId]);
              }
            }}
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          >
            {nestedCategories.length === 0 ? (
              <option value="">-- Chưa có danh mục Active --</option>
            ) : (
              nestedCategories.map(({ category: c, depth }) => (
                <option key={c.id} value={c.id}>
                  {depth > 0 ? `${'— '.repeat(depth)}↳ ` : ''}
                  {c.name} (Active)
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Thương hiệu / Brand ID (<code className="text-[11px] text-indigo-500">product_brand</code>)
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="VD: 131820, NovaWear..."
            className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* SPU Attributes Management Section */}
      <ProductAttributeSection
        productAttributes={productAttributes}
        setProductAttributes={setProductAttributes}
      />

      {/* SPU Category Array */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Icons.Layers size={14} className="text-indigo-500" />
            Mảng Danh mục SPU (<code className="font-mono text-indigo-600 dark:text-indigo-400">product_category: string[]</code>)
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Đã chọn: {productCategoryList.length} danh mục
          </span>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nhập mã danh mục tùy chọn
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={categoryItemInput}
                onChange={(e) => setCategoryItemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategoryItem();
                  }
                }}
                placeholder="Để trống = [] hoặc nhập Category ID..."
                className="flex-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white outline-none"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddCategoryItem}>
                Thêm
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {productCategoryList.length === 0 ? (
                <span className="text-[11px] font-mono text-slate-400">
                  product_category: [] (Mảng rỗng mặc định)
                </span>
              ) : (
                productCategoryList.map((catItem) => (
                  <span
                    key={catItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    &quot;{catItem}&quot;
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryItem(catItem)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      <Icons.X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Danh sách Categories Active ({nestedCategories.length}):
                </span>
                <Link
                  href="/categories"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Quản lý Categories →
                </Link>
              </div>
              {nestedCategories.length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                  <span>Chưa có danh mục nào ở trạng thái Active.</span>
                  <Link
                    href="/categories"
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-semibold text-[11px] shrink-0 hover:bg-amber-600 transition-colors"
                  >
                    Bật Active ngay
                  </Link>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 space-y-1">
                  {nestedCategories.map(({ category: cat, depth }) => {
                    const isAdded = productCategoryList.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        style={{ paddingLeft: `${depth * 16}px` }}
                        className="flex items-center"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              handleRemoveCategoryItem(cat.id);
                            } else {
                              setProductCategoryList([...productCategoryList, cat.id]);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            isAdded
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70 hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate font-semibold">
                              {depth > 0 ? '↳ ' : ''}
                              {cat.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                                isAdded
                                  ? 'bg-emerald-500/30 text-white'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          </div>
                          <span
                            className={`font-mono text-[10px] shrink-0 ${
                              isAdded ? 'text-indigo-100 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {isAdded ? '✓ Đã chọn' : `+ ${cat.id}`}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Mô tả ngắn gọn (Hiển thị đầu trang)
        </label>
        <input
          type="text"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Tóm tắt 1-2 câu tính năng nổi bật..."
          className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Mô tả chi tiết sản phẩm
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Thông tin chất liệu, hướng dẫn sử dụng, chính sách bảo hành..."
          className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
        />
        {description && /<[a-z][\s\S]*>/i.test(description) && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5">
              Xem trước nội dung hiển thị (HTML Preview)
            </span>
            <div
              className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Thẻ Tag tìm kiếm
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Nhập tag rồi ấn Enter..."
            className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white outline-none"
          />
          <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>
            Thêm tag
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              #{t}
              <button
                type="button"
                onClick={() => setPendingDeleteTag(t)}
                className="hover:text-rose-500 cursor-pointer"
                title="Xóa tag"
              >
                <Icons.X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteTag)}
        title="Xác nhận xóa thẻ Tag"
        message="Bạn có chắc chắn muốn gỡ bỏ thẻ Tag này khỏi sản phẩm?"
        itemName={pendingDeleteTag ? `#${pendingDeleteTag}` : ''}
        itemSubtitle="Thẻ Tag phân loại & tìm kiếm sản phẩm"
        onClose={() => setPendingDeleteTag(null)}
        onConfirm={handleConfirmRemoveTag}
      />
    </div>
  );
};
