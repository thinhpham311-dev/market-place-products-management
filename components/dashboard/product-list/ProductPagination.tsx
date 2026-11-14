'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';

interface ProductPaginationProps {
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  totalItems,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
}) => {
  const { t } = useTranslation();

  if (totalItems === 0) return null;

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-3.5 sm:px-4 py-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>{t('table.showing')}</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
        <span>
          {t('table.of_total')} <strong>{totalItems}</strong> {t('table.products_unit')}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Trang trước"
          aria-label="Trang trước"
        >
          <Icons.ChevronLeft size={16} />
        </button>

        {/* Mobile current page indicator */}
        <span className="sm:hidden text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
          {currentPage} / {totalPages}
        </span>

        {/* Desktop / Tablet page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {visiblePages.map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-semibold transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title="Trang kế tiếp"
          aria-label="Trang kế tiếp"
        >
          <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
