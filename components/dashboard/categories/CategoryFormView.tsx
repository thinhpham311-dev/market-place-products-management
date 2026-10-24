'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCategory } from '@/types/product';
import { flattenCategoryTreeWithDepth } from '@/services/CategoryService';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export interface CategoryFormSubmitData {
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentId?: string | null;
  category_active: boolean;
}

interface CategoryFormViewProps {
  initialData?: ProductCategory | null;
  categories?: ProductCategory[];
  isSubmitting?: boolean;
  onSubmit: (data: CategoryFormSubmitData) => void | Promise<void>;
  onDelete?: () => void;
}

export const CategoryFormView: React.FC<CategoryFormViewProps> = ({
  initialData,
  categories = [],
  isSubmitting = false,
  onSubmit,
  onDelete,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = Boolean(initialData);
  const queryParentId = searchParams.get('parentId') || '';

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [parentId, setParentId] = useState<string>(
    initialData?.parentId || queryParentId
  );
  const [categoryActive, setCategoryActive] = useState<boolean>(
    initialData?.category_active ?? false
  );
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [internalSaving, setInternalSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isBusy = isSubmitting || internalSaving;

  const generateSlugFromName = (val: string) =>
    val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên danh mục (category_name)!');
      return;
    }

    setFormError(null);
    setInternalSaving(true);
    try {
      await onSubmit({
        name: trimmedName,
        slug: slug.trim() || generateSlugFromName(trimmedName),
        description: description.trim(),
        image: image.trim() || undefined,
        parentId: parentId.trim() || null,
        category_active: categoryActive,
      });
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Không thể lưu danh mục. Vui lòng kiểm tra lại dữ liệu.';
      setFormError(msg);
    } finally {
      setInternalSaving(false);
    }
  };

  const parentOptions = useMemo(() => {
    const filtered = categories.filter((c) => c.id !== initialData?.id);
    return flattenCategoryTreeWithDepth(filtered);
  }, [categories, initialData?.id]);

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="flex items-start justify-between gap-3">
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
              {isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Phân loại nhóm sản phẩm trên website và sàn thương mại (/v1/api/category/create)
            </p>
          </div>
        </div>

        {isEditing && onDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Icons.Trash2 size={15} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Xóa danh mục
          </Button>
        )}
      </div>

      {formError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <Icons.X size={14} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 text-xs"
      >
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tên danh mục (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">category_name</code>){' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Giày thể thao & Sneakers..."
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Đường dẫn tĩnh (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">category_slug</code>)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={name ? generateSlugFromName(name) : 'VD: giay-the-thao-sneakers'}
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Danh mục cha (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">parent_id</code>)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value="">-- Danh mục gốc (Không có) --</option>
              {parentOptions.map(({ category: cat, depth }) => (
                <option key={cat.id} value={cat.id}>
                  {depth > 0 ? `${'— '.repeat(depth)}↳ ` : ''}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Trạng thái danh mục (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">category_active</code>)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Trạng thái hiện tại:{' '}
              <span
                className={`font-bold ${
                  categoryActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {categoryActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={categoryActive}
            onClick={() => setCategoryActive((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              categoryActive
                ? 'bg-emerald-500'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                categoryActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ảnh đại diện danh mục (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">category_thumb</code>)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {image.trim() ? (
                <img
                  src={image.trim()}
                  alt={name || 'Category thumbnail'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icons.Layers size={18} className="text-slate-400" />
              )}
            </div>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Mô tả danh mục (<code className="text-[11px] text-indigo-600 dark:text-indigo-400">category_description</code>)
            </label>
            <button
              type="button"
              onClick={() => setShowHtmlPreview((v) => !v)}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {showHtmlPreview ? 'Sửa mã HTML' : 'Xem trước nội dung'}
            </button>
          </div>
          {showHtmlPreview ? (
            <div
              className="min-h-[96px] p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-2 [&_p]:mb-2 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{
                __html: description || '<p class="text-slate-400 italic">Chưa có mô tả...</p>',
              }}
            />
          ) : (
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả danh mục hiển thị cho khách hàng (hỗ trợ thẻ HTML)..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => router.back()}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isBusy}
            leftIcon={<Icons.Check size={16} />}
          >
            {isBusy
              ? 'Đang gửi API...'
              : isEditing
                ? 'Lưu thay đổi'
                : 'Tạo danh mục'}
          </Button>
        </div>
      </form>

      {isEditing && initialData && onDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title="Xác nhận xóa danh mục"
          message="Bạn có chắc chắn muốn xóa danh mục này khỏi hệ thống? Các sản phẩm thuộc danh mục này sẽ cần được phân loại lại."
          itemName={initialData.name}
          itemSubtitle={`/${initialData.slug} • ${initialData.description || ''}`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete();
          }}
        />
      )}
    </div>
  );
};
