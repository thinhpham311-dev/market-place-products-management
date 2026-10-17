'use client';

import React from 'react';
import { ProductCategory, ProductFilterState, ProductStatus } from '@/types/product';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface StatusCounts {
  all: number;
  active: number;
  out_of_stock: number;
  draft: number;
  archived: number;
}

interface ProductFilterBarProps {
  filterStatus: ProductStatus | 'all';
  setFilterStatus: (status: ProductStatus | 'all') => void;
  statusCounts: StatusCounts;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  categories: ProductCategory[];
  filterStockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  setFilterStockStatus: (stock: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  sortBy: ProductFilterState['sortBy'];
  setSortBy: (sort: ProductFilterState['sortBy']) => void;
  onResetFilters: () => void;
  onResetPage: () => void;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filterStatus,
  setFilterStatus,
  statusCounts,
  viewMode,
  setViewMode,
  filterCategory,
  setFilterCategory,
  categories,
  filterStockStatus,
  setFilterStockStatus,
  sortBy,
  setSortBy,
  onResetFilters,
  onResetPage,
}) => {
  const { t, tc } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
      {/* Status quick tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setFilterStatus('all');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_all')} ({statusCounts.all})
          </button>
          <button
            onClick={() => {
              setFilterStatus('active');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_active')} ({statusCounts.active})
          </button>
          <button
            onClick={() => {
              setFilterStatus('draft');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'draft'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_draft')} ({statusCounts.draft})
          </button>
          <button
            onClick={() => {
              setFilterStatus('out_of_stock');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'out_of_stock'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_out_of_stock')} ({statusCounts.out_of_stock})
          </button>
          <button
            onClick={() => {
              setFilterStatus('archived');
              onResetPage();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'archived'
                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('products.tab_archived')} ({statusCounts.archived})
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
            {t('categories')}
          </label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              onResetPage();
            }}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="all">{t('products.all_categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {tc(cat.name)} ({cat.productCount})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('nav.inventory')}
          </label>
          <select
            value={filterStockStatus}
            onChange={(e) => {
              setFilterStockStatus(
                e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
              );
              onResetPage();
            }}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="all">{t('products.all_stock')}</option>
            <option value="in_stock">{t('products.stock_in')}</option>
            <option value="low_stock">{t('products.stock_low')}</option>
            <option value="out_of_stock">{t('products.stock_out')}</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('filters')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProductFilterState['sortBy'])}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="created">{t('products.sort_newest')}</option>
            <option value="sold">{t('products.sort_sold')}</option>
            <option value="price_desc">{t('products.sort_price_desc')}</option>
            <option value="price_asc">{t('products.sort_price_asc')}</option>
            <option value="stock">{t('products.sort_stock_asc')}</option>
            <option value="name">{t('products.sort_name_asc')}</option>
          </select>
        </div>

        {/* Reset button */}
        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs"
            onClick={onResetFilters}
            leftIcon={<Icons.RefreshCw size={13} />}
          >
            {t('clear_all')}
          </Button>
        </div>
      </div>
    </div>
  );
};
