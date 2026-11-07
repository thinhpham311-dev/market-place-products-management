'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveShop, setActiveWarehouse } from '@/store/slices/scopeSlice';
import { Icons } from '@/components/ui/Icons';

export const HeaderScopeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shops, warehouses, activeShopId, activeWarehouseId } = useAppSelector(
    (s) => s.scope
  );
  const user = useAppSelector((s) => s.auth.user);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if user is warehouse-only staff
  const isWarehouseStaff =
    user?.role?.toLowerCase().includes('kho') ||
    user?.role?.toUpperCase() === 'WAREHOUSE_STAFF';

  // Find active items
  const selectedShop = shops.find((s) => s.id === activeShopId);
  const selectedWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  // Filter warehouses based on active shop
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

  const handleSelectShop = (shopId: string) => {
    dispatch(setActiveShop(shopId));
  };

  const handleSelectWarehouse = (whId: string) => {
    dispatch(setActiveWarehouse(whId));
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-750 bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer group"
      >
        {/* Shop pill */}
        <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[160px]">
          <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Icons.Store size={13} />
          </span>
          <span className="font-semibold truncate">
            {selectedShop ? selectedShop.code : 'Tất cả Shop'}
          </span>
        </div>

        <span className="text-slate-300 dark:text-slate-650">/</span>

        {/* Warehouse pill */}
        <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[160px]">
          <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icons.Boxes size={13} />
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
            {selectedWarehouse ? selectedWarehouse.code : 'Tất cả Kho'}
          </span>
        </div>

        <Icons.ChevronDown
          size={14}
          className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Phạm vi dữ liệu
              </span>
              {isWarehouseStaff && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  Nhân viên kho
                </span>
              )}
            </div>

            {(activeShopId !== 'all' || activeWarehouseId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  dispatch(setActiveShop('all'));
                  dispatch(setActiveWarehouse('all'));
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Đặt lại tất cả
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Section 1: Shop Selection */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                <span>Cửa hàng (Shop)</span>
                <span>{shops.length} chi nhánh</span>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectShop('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    activeShopId === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icons.Store size={14} className="text-slate-400" />
                    <span>Tất cả Cửa hàng</span>
                  </div>
                  {activeShopId === 'all' && <Icons.Check size={14} className="text-indigo-600 shrink-0" />}
                </button>

                {shops.map((shop) => {
                  const isSelected = activeShopId === shop.id;
                  const shopWarehouseCount = warehouses.filter((w) => w.shopId === shop.id).length;

                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleSelectShop(shop.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icons.Store size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{shop.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {shop.code} • {shopWarehouseCount} kho
                          </p>
                        </div>
                      </div>
                      {isSelected && <Icons.Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Warehouse Selection */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                <span>Kho hàng (Warehouse)</span>
                <span>{visibleWarehouses.length} kho</span>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectWarehouse('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    activeWarehouseId === 'all'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icons.Boxes size={14} className="text-slate-400" />
                    <span>Tất cả Kho hàng</span>
                  </div>
                  {activeWarehouseId === 'all' && (
                    <Icons.Check size={14} className="text-emerald-600 shrink-0" />
                  )}
                </button>

                {visibleWarehouses.map((wh) => {
                  const isSelected = activeWarehouseId === wh.id;
                  const parentShop = shops.find((s) => s.id === wh.shopId);

                  return (
                    <button
                      key={wh.id}
                      type="button"
                      onClick={() => handleSelectWarehouse(wh.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icons.Boxes
                          size={14}
                          className={isSelected ? 'text-emerald-600' : 'text-slate-400'}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{wh.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {wh.code} • {parentShop ? parentShop.code : ''} • QL: {wh.managerName || 'Chưa gán'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <Icons.Check size={14} className="text-emerald-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
