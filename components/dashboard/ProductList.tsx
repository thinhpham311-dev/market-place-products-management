'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductCategory, ProductStatus, ProductFilterState } from '@/types/product';
import { BulkActionToolbar } from './BulkActionToolbar';
import { ProductFilterBar } from './product-list/ProductFilterBar';
import { ProductTableView } from './product-list/ProductTableView';
import { ProductGridView } from './product-list/ProductGridView';
import { ProductPagination } from './product-list/ProductPagination';
import { ProductEmptyState } from './product-list/ProductEmptyState';

const VALID_STATUS_TABS: (ProductStatus | 'all')[] = [
  'all',
  'active',
  'draft',
  'out_of_stock',
  'archived',
];

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read tab & filters from URL search params
  const rawTab = searchParams.get('tab') as ProductStatus | 'all' | null;
  const filterStatus: ProductStatus | 'all' =
    rawTab && VALID_STATUS_TABS.includes(rawTab) ? rawTab : 'all';

  const viewMode: 'table' | 'grid' = searchParams.get('view') === 'grid' ? 'grid' : 'table';
  const filterCategory: string = searchParams.get('category') || 'all';
  const rawStock = searchParams.get('stock');
  const filterStockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' =
    rawStock === 'in_stock' || rawStock === 'low_stock' || rawStock === 'out_of_stock'
      ? rawStock
      : 'all';
  const rawSort = searchParams.get('sort') as ProductFilterState['sortBy'] | null;
  const sortBy: ProductFilterState['sortBy'] = rawSort || 'created';

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!searchParams.get('tab')) {
      updateUrlParams({ tab: 'all' });
    }
  }, [searchParams, updateUrlParams]);

  const setFilterStatus = (status: ProductStatus | 'all') => updateUrlParams({ tab: status });
  const setViewMode = (mode: 'table' | 'grid') =>
    updateUrlParams({ view: mode === 'table' ? null : mode });
  const setFilterCategory = (cat: string) =>
    updateUrlParams({ category: cat === 'all' ? null : cat });
  const setFilterStockStatus = (stock: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') =>
    updateUrlParams({ stock: stock === 'all' ? null : stock });
  const setSortBy = (sort: ProductFilterState['sortBy']) =>
    updateUrlParams({ sort: sort === 'created' ? null : sort });

  // Selected product IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchBarcode = p.barcode?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand && !matchBarcode) return false;
        }

        if (filterCategory !== 'all' && p.categoryId !== filterCategory) {
          return false;
        }

        if (filterStatus !== 'all' && p.status !== filterStatus) {
          return false;
        }

        if (filterStockStatus === 'in_stock' && (p.stock <= p.lowStockThreshold || p.stock === 0))
          return false;
        if (filterStockStatus === 'low_stock' && (p.stock > p.lowStockThreshold || p.stock === 0))
          return false;
        if (filterStockStatus === 'out_of_stock' && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        if (sortBy === 'sold') return b.soldCount - a.soldCount;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
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
    paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id));

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
      <ProductFilterBar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
        filterStockStatus={filterStockStatus}
        setFilterStockStatus={setFilterStockStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onResetPage={() => setCurrentPage(1)}
        onResetFilters={() => {
          updateUrlParams({ tab: 'all', category: null, stock: null, sort: null });
          setCurrentPage(1);
        }}
      />

      {paginatedProducts.length === 0 ? (
        <ProductEmptyState
          onClearFilters={() => {
            updateUrlParams({ tab: 'all', category: null, stock: null });
            setCurrentPage(1);
          }}
          onOpenCreateProduct={onOpenCreateProduct}
        />
      ) : viewMode === 'table' ? (
        <ProductTableView
          products={paginatedProducts}
          selectedIds={selectedIds}
          isAllSelected={isAllSelected}
          onSelectAll={handleSelectAll}
          onToggleSelect={handleToggleSelect}
          onSelectProduct={onSelectProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onDuplicateProduct={onDuplicateProduct}
          onToggleStatus={onToggleStatus}
          onOpenPublishModal={onOpenPublishModal}
          onQuickUpdateStock={onQuickUpdateStock}
        />
      ) : (
        <ProductGridView
          products={paginatedProducts}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectProduct={onSelectProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onOpenPublishModal={onOpenPublishModal}
        />
      )}

      <ProductPagination
        totalItems={filteredProducts.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

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
