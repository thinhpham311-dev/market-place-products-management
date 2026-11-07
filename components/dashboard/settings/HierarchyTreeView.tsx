'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveShop, setActiveWarehouse } from '@/store/slices/scopeSlice';
import { Icons } from '@/components/ui/Icons';

export const HierarchyTreeView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shops, warehouses, activeShopId, activeWarehouseId } = useAppSelector(
    (s) => s.scope
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icons.ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
          Sơ đồ Phân cấp Tổ chức & Quyền hạn (Organizational Tree)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Biểu diễn trực quan cây phân quyền và phạm vi dữ liệu từ Platform Super Admin xuống từng Cửa hàng, Kho hàng và Nhân viên thực thi.
        </p>
      </div>

      {/* Visual Tree */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="min-w-[680px] space-y-6 font-sans">
          {/* Level 1: SUPER ADMIN */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2.5 shadow-md">
              <Icons.ShieldCheck size={16} />
              <span>SUPER ADMIN (Platform Root)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Toàn quyền hệ thống • Scope: GLOBAL
            </span>
          </div>

          {/* Branch to Level 2: SHOP OWNER */}
          <div className="pl-6 border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-5 space-y-6">
            <div className="relative pt-2">
              <div className="absolute -left-6 top-6 w-6 h-0.5 bg-indigo-200 dark:border-indigo-900/60" />
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-2.5 shadow-md">
                  <Icons.User size={16} />
                  <span>SHOP OWNER (Chủ Chuỗi Cửa Hàng)</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Quản trị toàn bộ Merchant • Scope: MERCHANT
                </span>
              </div>

              {/* Branch to Level 3: SHOPS */}
              <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-5 mt-5 space-y-8">
                {shops.map((shop) => {
                  const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);
                  const isShopActive = activeShopId === shop.id;

                  return (
                    <div key={shop.id} className="relative">
                      <div className="absolute -left-6 top-5 w-6 h-0.5 bg-slate-200 dark:bg-slate-800" />
                      
                      {/* Shop Node */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => dispatch(setActiveShop(shop.id))}
                          className={`px-3.5 py-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                            isShopActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                          }`}
                        >
                          <Icons.Store size={15} className="text-indigo-600 dark:text-indigo-400" />
                          <span>{shop.name} ({shop.code})</span>
                          {isShopActive && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-normal">Active</span>}
                        </button>
                        <span className="text-[11px] text-slate-400">
                          {shopWarehouses.length} kho trực thuộc
                        </span>
                      </div>

                      {/* Branch to Level 4: WAREHOUSES */}
                      <div className="pl-6 border-l-2 border-emerald-200 dark:border-emerald-950 ml-5 mt-4 space-y-4">
                        {shopWarehouses.map((wh) => {
                          const isWhActive = activeWarehouseId === wh.id;

                          return (
                            <div key={wh.id} className="relative">
                              <div className="absolute -left-6 top-4 w-6 h-0.5 bg-emerald-200 dark:bg-emerald-950" />
                              
                              {/* Warehouse Node */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => dispatch(setActiveWarehouse(wh.id))}
                                  className={`px-3 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                                    isWhActive
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                                  }`}
                                >
                                  <Icons.Boxes size={14} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>{wh.name}</span>
                                  <span className="font-mono text-[10px] text-slate-400">[{wh.code}]</span>
                                  {isWhActive && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-normal">Active</span>}
                                </button>

                                {/* Staff & Manager sub-badges */}
                                <div className="flex items-center gap-1.5 pl-2">
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                    Manager: {wh.managerName || 'Chưa gán'}
                                  </span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    Warehouse Staff
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
