'use client';

import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, ProductStatus, ProductFilterState } from '@/types/product';
import { Icons } from '@/components/ui/Icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BulkActionToolbar } from './BulkActionToolbar';

interface ProductListProps {
  products: Product[];
  categories: ProductCategory[];
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onDuplicateProduct: (product: Product) => void;
  onToggleStatus: (id: string) => void;
  onOpenPublishModal: (product: Product) => void;
  onQuickUpdateStock: (id: string, newStock: number) => void;
  onBulkUpdateStatus: (ids: string[], status: ProductStatus) => void;
  onBulkPublish: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onOpenCreateProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  categories,
  searchQuery,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onToggleStatus,
  onOpenPublishModal,
  onQuickUpdateStock,
  onBulkUpdateStatus,
  onBulkPublish,
  onBulkDelete,
  onOpenCreateProduct,
}) => {
  // View mode: table or grid
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selected product IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Editing stock inline
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<number>(0);

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ProductStatus | 'all'>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<ProductFilterState['sortBy']>('created');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Currency formatting
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Global search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchBarcode = p.barcode?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand && !matchBarcode) return false;
        }

        // Category filter
        if (filterCategory !== 'all' && p.categoryId !== filterCategory) {
          return false;
        }

        // Status filter
        if (filterStatus !== 'all' && p.status !== filterStatus) {
          return false;
        }

        // Stock status filter
        if (filterStockStatus === 'in_stock' && (p.stock <= p.lowStockThreshold || p.stock === 0)) return false;
        if (filterStockStatus === 'low_stock' && (p.stock > p.lowStockThreshold || p.stock === 0)) return false;
        if (filterStockStatus === 'out_of_stock' && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        if (sortBy === 'sold') return b.soldCount - a.soldCount;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Default: created desc
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchQuery, filterCategory, filterStatus, filterStockStatus, sortBy]);

  // Paginated slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.includes(p.id));

  // Quick Inline stock save
  const handleSaveStock = (id: string) => {
    onQuickUpdateStock(id, Math.max(0, inlineStockVal));
    setEditingStockId(null);
  };

  // Status counters for tab filters
  const statusCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.status === 'active').length,
      out_of_stock: products.filter((p) => p.status === 'out_of_stock' || p.stock === 0).length,
      draft: products.filter((p) => p.status === 'draft').length,
      archived: products.filter((p) => p.status === 'archived').length,
    };
  }, [products]);

  return (
    <div className="space-y-4">
      {/* Top Filter & Status Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        {/* Status quick tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả ({statusCounts.all})
            </button>
            <button
              onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Đang bán ({statusCounts.active})
            </button>
            <button
              onClick={() => { setFilterStatus('draft'); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'draft'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Bản nháp ({statusCounts.draft})
            </button>
            <button
              onClick={() => { setFilterStatus('out_of_stock'); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'out_of_stock'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Hết hàng ({statusCounts.out_of_stock})
            </button>
            <button
              onClick={() => { setFilterStatus('archived'); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'archived'
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tạm ẩn ({statusCounts.archived})
            </button>
          </div>

          {/* View toggle (Grid / Table) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem dạng bảng"
            >
              <Icons.List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem dạng lưới ảnh"
            >
              <Icons.Grid size={16} />
            </button>
          </div>
        </div>

        {/* Filters dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Danh mục
            </label>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.productCount})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Mức độ tồn kho
            </label>
            <select
              value={filterStockStatus}
              onChange={(e) => { setFilterStockStatus(e.target.value as any); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả tình trạng kho</option>
              <option value="in_stock">Còn nhiều hàng (&gt; 20)</option>
              <option value="low_stock">Sắp hết hàng (≤ định mức)</option>
              <option value="out_of_stock">Đã hết hàng (0)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Sắp xếp theo
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="created">Mới cập nhật gần đây</option>
              <option value="sold">Lượt bán chạy nhất</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="stock">Số lượng tồn kho</option>
              <option value="name">Tên sản phẩm (A - Z)</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs"
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterStockStatus('all');
                setSortBy('created');
                setCurrentPage(1);
              }}
              leftIcon={<Icons.RefreshCw size={13} />}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {paginatedProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.Package size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Không tìm thấy sản phẩm nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc danh mục và trạng thái.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterStockStatus('all');
              }}
            >
              Xóa bộ lọc
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icons.Plus size={16} />}
              onClick={onOpenCreateProduct}
            >
              Thêm sản phẩm mới
            </Button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Sản phẩm & Phân loại</th>
                  <th className="py-3.5 px-4 font-semibold">Danh mục</th>
                  <th className="py-3.5 px-4 font-semibold">Giá bán</th>
                  <th className="py-3.5 px-4 font-semibold">Tồn kho</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái & Kênh</th>
                  <th className="py-3.5 px-4 font-semibold">Đã bán</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
                  const isOutOfStock = p.stock === 0;
                  const isDraft = p.status === 'draft';

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
                          onChange={() => handleToggleSelect(p.id)}
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
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {p.hasVariants && (
                              <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] text-center font-medium py-0.5">
                                {p.variants?.length} loại
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 max-w-xs">
                            <h4
                              onClick={() => onSelectProduct(p)}
                              className="text-xs font-semibold text-slate-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title={p.name}
                            >
                              {p.name}
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
                          {p.category}
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
                              title="Lưu"
                            >
                              <Icons.Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              title="Hủy"
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
                              {p.stock} cái
                            </span>
                            <button
                              onClick={() => {
                                setEditingStockId(p.id);
                                setInlineStockVal(p.stock);
                              }}
                              className="opacity-0 group-hover/stock:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                              title="Sửa nhanh số tồn"
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
                              title={p.status === 'active' ? 'Bấm để tạm ẩn' : 'Bấm để kích hoạt bán'}
                            >
                              <div
                                className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                                  p.status === 'active' ? 'translate-x-3.5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <StatusBadge status={p.status} />
                          </div>

                          {/* Channels badges */}
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
                          {/* Publish button for draft/archived */}
                          {isDraft ? (
                            <Button
                              size="sm"
                              variant="primary"
                              className="text-xs h-7.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
                              onClick={() => onOpenPublishModal(p)}
                              leftIcon={<Icons.Rocket size={13} />}
                            >
                              Xuất bản
                            </Button>
                          ) : (
                            <button
                              onClick={() => onOpenPublishModal(p)}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Cập nhật kênh xuất bản (Publish)"
                            >
                              <Icons.Rocket size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Icons.Eye size={16} />
                          </button>
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Icons.Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDuplicateProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Nhân bản sản phẩm"
                          >
                            <Icons.Copy size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Xóa sản phẩm"
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
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const isLowStock = p.stock <= p.lowStockThreshold && p.stock > 0;
            const isOutOfStock = p.stock === 0;
            const isDraft = p.status === 'draft';

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={p.thumbnail}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Checkbox */}
                  <div className="absolute top-3 left-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(p.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shadow"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={p.status} />
                  </div>

                  {/* Discount pill */}
                  {p.originalPrice && p.originalPrice > p.price && (
                    <div className="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      -{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                    </div>
                  )}

                  {/* Publish hover button for draft */}
                  {isDraft && (
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs w-full shadow-lg"
                        onClick={() => onOpenPublishModal(p)}
                        leftIcon={<Icons.Rocket size={14} />}
                      >
                        Xuất bản ngay
                      </Button>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{p.sku}</span>
                      <span>{p.category}</span>
                    </div>

                    <h4
                      onClick={() => onSelectProduct(p)}
                      className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 cursor-pointer"
                    >
                      {p.name}
                    </h4>

                    {/* Pricing */}
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(p.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Stock level progress */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Tồn kho</span>
                        <span
                          className={`font-semibold ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {p.stock} sản phẩm
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min((p.stock / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Đã bán: <strong>{p.soldCount}</strong></span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenPublishModal(p)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Xuất bản đa kênh"
                      >
                        <Icons.Rocket size={15} />
                      </button>
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Xem chi tiết"
                      >
                        <Icons.Eye size={15} />
                      </button>
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        title="Sửa"
                      >
                        <Icons.Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Xóa"
                      >
                        <Icons.Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>trên tổng số <strong>{filteredProducts.length}</strong> sản phẩm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icons.ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icons.ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onUpdateStatus={(status) => {
          onBulkUpdateStatus(selectedIds, status);
          setSelectedIds([]);
        }}
        onBulkPublish={() => {
          onBulkPublish(selectedIds);
          setSelectedIds([]);
        }}
        onDeleteSelected={() => {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
        }}
        onExportSelected={() => {
          alert(`Đã xuất ${selectedIds.length} sản phẩm ra file Excel thành công!`);
          setSelectedIds([]);
        }}
      />
    </div>
  );
};
