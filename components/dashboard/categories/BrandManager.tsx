'use client';

import React, { useMemo, useState } from 'react';
import { ProductBrand, Product } from '@/types/product';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus,
} from '@/store/slices/brandsSlice';
import { showToast } from '@/store/slices/uiSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { canManageCategoryAndBrand } from '@/lib/auth/permissions';

interface BrandManagerProps {
  products: Product[];
}

interface BrandFormData {
  name: string;
  slug: string;
  description: string;
  logo: string;
  brand_active: boolean;
}

const INITIAL_FORM: BrandFormData = {
  name: '',
  slug: '',
  description: '',
  logo: '',
  brand_active: true,
};

export const BrandManager: React.FC<BrandManagerProps> = ({ products }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const brands = useAppSelector((s) => s.brands?.items || []);

  const canManage = canManageCategoryAndBrand(user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(INITIAL_FORM);
  const [pendingDeleteBrand, setPendingDeleteBrand] = useState<ProductBrand | null>(null);

  // Compute products per brand
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of brands) {
      const bNameLower = b.name.toLowerCase();
      const bSlugLower = b.slug.toLowerCase();
      const count = products.filter((p) => {
        const prodBrand = (p.brand || p.product_brand || '').toLowerCase();
        return prodBrand === bNameLower || prodBrand === bSlugLower || prodBrand === b.id.toLowerCase();
      }).length;
      counts[b.id] = count;
    }
    return counts;
  }, [brands, products]);

  const activeBrands = useMemo(
    () => brands.filter((b) => b.brand_active !== false),
    [brands]
  );
  const inactiveBrands = useMemo(
    () => brands.filter((b) => b.brand_active === false),
    [brands]
  );

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      if (activeFilter === 'active' && b.brand_active === false) return false;
      if (activeFilter === 'inactive' && b.brand_active !== false) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
    });
  }, [brands, activeFilter, searchQuery]);

  // If user does not have permission, don't show list or controls
  if (!canManage) {
    return null;
  }

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: ProductBrand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo: brand.logo || '',
      brand_active: brand.brand_active !== false,
    });
    setIsModalOpen(true);
  };

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const resolvedSlug =
      formData.slug.trim() || generateSlug(formData.name);

    if (editingBrand) {
      dispatch(
        updateBrand({
          ...editingBrand,
          name: formData.name.trim(),
          slug: resolvedSlug,
          description: formData.description.trim(),
          logo: formData.logo.trim(),
          brand_active: formData.brand_active,
        })
      );
      dispatch(showToast(`Đã cập nhật thương hiệu "${formData.name.trim()}" thành công.`));
    } else {
      dispatch(
        addBrand({
          name: formData.name.trim(),
          slug: resolvedSlug,
          description: formData.description.trim(),
          logo: formData.logo.trim(),
          brand_active: formData.brand_active,
          productCount: 0,
        })
      );
      dispatch(showToast(`Đã thêm thương hiệu "${formData.name.trim()}" mới thành công.`));
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteBrand) return;
    dispatch(deleteBrand(pendingDeleteBrand.id));
    dispatch(showToast(`Đã xóa thương hiệu "${pendingDeleteBrand.name}".`));
    setPendingDeleteBrand(null);
  };

  const handleToggleStatus = (b: ProductBrand) => {
    const nextStatus = b.brand_active === false;
    dispatch(toggleBrandStatus({ id: b.id, brand_active: nextStatus }));
    dispatch(
      showToast(
        `Đã chuyển trạng thái thương hiệu "${b.name}" sang ${
          nextStatus ? 'Active' : 'Inactive'
        }.`
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Brand Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quản lý thương hiệu (Brands)
            </h3>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              {brands.length} tổng • {activeBrands.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý tên, mã định danh, mô tả và kích hoạt các thương hiệu kinh doanh trong hệ thống.
          </p>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              Tất cả ({brands.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'active'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'active' ? 'bg-white' : 'bg-emerald-500'}`} />
              Active ({activeBrands.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('inactive')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'inactive'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === 'inactive' ? 'bg-white' : 'bg-amber-500'}`} />
              Inactive ({inactiveBrands.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Brand Input */}
          <div className="relative flex-1 sm:w-56">
            <Icons.Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thương hiệu..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Icons.Plus size={16} />}
            className="shrink-0"
          >
            Thêm thương hiệu
          </Button>
        </div>
      </div>

      {/* Brand Grid */}
      {filteredBrands.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Icons.Package size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'Không tìm thấy thương hiệu phù hợp' : 'Chưa có thương hiệu nào'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {searchQuery
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
              : 'Hãy thêm thương hiệu đầu tiên để quản lý và gán cho sản phẩm.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Icons.Plus size={15} />}
          >
            Tạo thương hiệu mới
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((b) => {
            const isActive = b.brand_active !== false;
            const productCount = brandProductCounts[b.id] ?? (b.productCount || 0);

            return (
              <div
                key={b.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-xs ${
                  isActive
                    ? 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-600/60'
                    : 'border-amber-200/70 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {b.logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={b.logo}
                          alt={b.name}
                          className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {b.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          /{b.slug}
                        </p>
                      </div>
                    </div>

                    {/* Edit Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        onClick={() => handleToggleStatus(b)}
                        title={isActive ? 'Nhấn để chuyển sang Inactive' : 'Nhấn để chuyển sang Active'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Chỉnh sửa thương hiệu"
                      >
                        <Icons.Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPendingDeleteBrand(b)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Xóa thương hiệu"
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {b.description || 'Chưa có mô tả cho thương hiệu này.'}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {productCount} {t('table.products_unit')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {b.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Brand Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBrand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
      >
        <form onSubmit={handleSaveBrand} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Tên thương hiệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name,
                  slug: !editingBrand && !prev.slug ? generateSlug(name) : prev.slug,
                }));
              }}
              placeholder="VD: Nike, NovaWear, Adidas..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Đường dẫn Slug (Tùy chọn)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="VD: novawear, nike..."
              className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              URL Logo / Hình ảnh
            </label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mô tả ngắn thương hiệu
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Giới thiệu về xuất xứ, định vị thương hiệu..."
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Trạng thái hoạt động (Active)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hiển thị thương hiệu này trong các bộ lọc và danh sách tạo sản phẩm.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.brand_active}
              onClick={() => setFormData({ ...formData, brand_active: !formData.brand_active })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.brand_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  formData.brand_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingBrand ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Brand Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(pendingDeleteBrand)}
        title="Xác nhận xóa thương hiệu"
        message="Bạn có chắc chắn muốn xóa thương hiệu này khỏi hệ thống? Các sản phẩm đã gán thương hiệu này vẫn sẽ giữ lại tên nhưng sẽ mất liên kết phân loại."
        itemName={pendingDeleteBrand?.name || ''}
        itemSubtitle={pendingDeleteBrand ? `/${pendingDeleteBrand.slug}` : ''}
        itemMeta={`Đang liên kết với ${
          pendingDeleteBrand ? brandProductCounts[pendingDeleteBrand.id] ?? 0 : 0
        } sản phẩm`}
        onClose={() => setPendingDeleteBrand(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
