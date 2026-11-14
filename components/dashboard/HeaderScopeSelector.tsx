'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveWarehouse } from '@/store/slices/scopeSlice';
import { showToast } from '@/store/slices/uiSlice';
import { Icons } from '@/components/ui/Icons';
import { isSuperAdmin } from '@/lib/auth/permissions';

export const HeaderScopeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shops, warehouses, activeShopId, activeWarehouseId } = useAppSelector(
    (s) => s.scope
  );
  const user = useAppSelector((s) => s.auth.user);
  const isSuper = isSuperAdmin(user);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active items
  const selectedShop = shops.find((s) => s.id === activeShopId);
  const selectedWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  // Filter warehouses based on active shop selected from sidebar
  const visibleWarehouses =
    activeShopId === 'all'
      ? warehouses
      : warehouses.filter((w) => w.shopId === activeShopId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectWarehouse = (whId: string, whName?: string, whCode?: string) => {
    dispatch(setActiveWarehouse(whId));
    setIsOpen(false);

    if (whId === 'all') {
      dispatch(
        showToast(
          `Đã chọn: Tất cả kho ${
            selectedShop ? `thuộc ${selectedShop.name}` : '(Toàn hệ thống)'
          }`
        )
      );
    } else {
      dispatch(
        showToast(`Đã chọn kho: ${whName || whId} ${whCode ? `(${whCode})` : ''}`)
      );
    }
  };

  const displayText = selectedWarehouse
    ? selectedWarehouse.name
    : selectedShop
    ? `Tất cả Kho (${selectedShop.code})`
    : 'Tất cả Kho hàng';

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button: Only Warehouse Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={
          selectedWarehouse
            ? `Kho: ${selectedWarehouse.name} (${selectedWarehouse.code}) - Chi nhánh: ${
                selectedShop?.name || 'Tất cả'
              }`
            : `Tất cả Kho hàng - Chi nhánh: ${selectedShop?.name || 'Tất cả'}`
        }
        aria-label="Chọn kho hàng"
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border transition-all shadow-xs cursor-pointer group shrink-0 ${
          selectedWarehouse
            ? 'border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
            : 'border-slate-200/90 dark:border-slate-750 bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
        } text-xs`}
      >
        {user?.role && (
          <span
            className={`hidden 2xl:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
              isSuper
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {user.role}
          </span>
        )}

        {/* Warehouse pill */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="p-1 rounded-md bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icons.Boxes size={14} />
          </span>
          <span className="hidden sm:inline font-semibold truncate text-[11px] sm:text-xs max-w-[120px] md:max-w-[180px] lg:max-w-[220px]">
            {displayText}
          </span>
          {selectedWarehouse && (
            <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          )}
        </div>

        <Icons.ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform shrink-0 hidden sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu: Only Warehouse Selection */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 max-w-sm ml-auto sm:absolute sm:top-full sm:inset-x-auto sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
                Chọn Kho Hàng
              </span>
              {selectedShop ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate">
                  {selectedShop.code}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 truncate">
                  (Toàn hệ thống)
                </span>
              )}
            </div>

            {activeWarehouseId !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectWarehouse('all')}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium shrink-0 ml-2 cursor-pointer"
              >
                Tất cả kho
              </button>
            )}
          </div>

          {/* Context Banner: Chi nhánh tương ứng được chọn ở Sidebar */}
          <div className="px-2.5 py-1.5 mb-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 shrink-0">Chi nhánh:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {selectedShop ? selectedShop.name : 'Tất cả Chi nhánh'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
              {visibleWarehouses.length} kho
            </span>
          </div>

          {/* Warehouse Options List */}
          <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-0.5">
            <button
              type="button"
              onClick={() => handleSelectWarehouse('all')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                activeWarehouseId === 'all'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icons.Boxes size={15} className="text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="font-semibold truncate">
                    {selectedShop
                      ? `Tất cả Kho (${selectedShop.code})`
                      : 'Tất cả Kho hàng'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-normal truncate">
                    {selectedShop
                      ? `Xem toàn bộ tồn kho thuộc ${selectedShop.name}`
                      : 'Toàn bộ kho hàng trong hệ thống'}
                  </p>
                </div>
              </div>
              {activeWarehouseId === 'all' && (
                <Icons.Check size={14} className="text-emerald-600 shrink-0 ml-2" />
              )}
            </button>

            {visibleWarehouses.length === 0 && selectedShop && (
              <div className="py-3 px-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs text-center my-1">
                Chi nhánh <strong>{selectedShop.name}</strong> hiện chưa có kho hàng trực thuộc.
              </div>
            )}

            {visibleWarehouses.map((wh) => {
              const isSelected = activeWarehouseId === wh.id;
              const parentShop = shops.find((s) => s.id === wh.shopId);

              return (
                <button
                  key={wh.id}
                  type="button"
                  onClick={() => handleSelectWarehouse(wh.id, wh.name, wh.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icons.Boxes
                      size={15}
                      className={isSelected ? 'text-emerald-600' : 'text-slate-400'}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{wh.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal truncate">
                        <span className="font-mono font-medium">{wh.code}</span>
                        {parentShop && activeShopId === 'all' && ` • ${parentShop.code}`}
                        {wh.managerName && ` • QL: ${wh.managerName}`}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Icons.Check
                      size={14}
                      className="text-emerald-600 shrink-0 ml-2"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
