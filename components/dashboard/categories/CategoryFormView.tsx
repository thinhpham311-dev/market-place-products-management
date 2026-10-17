'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCategory } from '@/types/product';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface CategoryFormViewProps {
  initialData?: ProductCategory | null;
  onSubmit: (data: { name: string; slug: string; description: string }) => void;
}

export const CategoryFormView: React.FC<CategoryFormViewProps> = ({
  initialData,
  onSubmit,
}) => {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên danh mục!');
      return;
    }

    onSubmit({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
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
            Phân loại nhóm sản phẩm trên website và sàn thương mại
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 text-xs"
      >
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tên danh mục <span className="text-rose-500">*</span>
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

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Đường dẫn tĩnh (Slug URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="VD: giay-the-thao-sneakers"
            className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mô tả ngắn danh mục
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả danh mục hiển thị cho khách hàng..."
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Icons.Check size={16} />}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </form>
    </div>
  );
};
