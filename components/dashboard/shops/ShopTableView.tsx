'use client';

import React from 'react';
import { IShop, IWarehouse } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';

interface ShopTableViewProps {
  shops: IShop[];
  warehouses: IWarehouse[];
  activeShopId: string;
  onToggleStatus: (shop: IShop) => void;
  onSwitchScope: (shop: IShop) => void;
  onEdit: (shop: IShop) => void;
  onDelete: (shop: IShop) => void;
  onAddWarehouse: (shop: IShop) => void;
}

export const ShopTableView: React.FC<ShopTableViewProps> = ({
  shops,
  warehouses,
  activeShopId,
  onToggleStatus,
  onSwitchScope,
  onEdit,
  onDelete,
  onAddWarehouse,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Mobile Card Items View (< md) */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {shops.map((shop) => {
          const isCurrentActiveScope = activeShopId === shop.id;
          const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);

          return (
            <div
              key={shop.id}
              className={`p-4 transition-colors space-y-3 ${
                isCurrentActiveScope
                  ? 'bg-purple-50/30 dark:bg-purple-950/20'
                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
              }`}
            >
              {/* Header: Code & Name & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {shop.code.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {shop.code}
                      </span>
                      {isCurrentActiveScope && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Scope
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight mt-0.5 truncate">
                      {shop.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleStatus(shop)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                    shop.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {shop.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Owner info & Address */}
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Đại diện:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {shop.ownerName} ({shop.phone})
                  </span>
                </div>
                {shop.address && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Địa chỉ:</span>
                    <span className="truncate text-right">{shop.address}</span>
                  </div>
                )}
              </div>

              {/* Warehouses list */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <span className="text-slate-400 shrink-0">Kho hàng ({shopWarehouses.length}):</span>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {shopWarehouses.map((wh) => (
                    <span
                      key={wh.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {wh.code}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => onAddWarehouse(shop)}
                    className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer"
                    title="Thêm kho cho shop"
                  >
                    <Icons.Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => onSwitchScope(shop)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                >
                  Vào Shop này
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(shop)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Sửa thông tin"
                  >
                    <Icons.Settings size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(shop)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Xóa shop"
                  >
                    <Icons.Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Full Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-4 sm:px-5 py-3.5">Mã & Tên Gian Hàng</th>
              <th className="px-4 sm:px-5 py-3.5">Đại Diện / Liên Hệ</th>
              <th className="px-4 sm:px-5 py-3.5">Địa Chỉ</th>
              <th className="px-4 sm:px-5 py-3.5">Kho Bãi Liên Kết</th>
              <th className="px-4 sm:px-5 py-3.5">Trạng Thái</th>
              <th className="px-4 sm:px-5 py-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {shops.map((shop) => {
              const isCurrentActiveScope = activeShopId === shop.id;
              const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);

              return (
                <tr
                  key={shop.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isCurrentActiveScope
                      ? 'bg-purple-50/30 dark:bg-purple-950/20'
                      : ''
                  }`}
                >
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {shop.code.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            {shop.code}
                          </span>
                          {isCurrentActiveScope && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Scope
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                          {shop.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 sm:px-5 py-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {shop.ownerName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {shop.phone}
                    </p>
                  </td>

                  <td className="px-4 sm:px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {shop.address}
                  </td>

                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {shopWarehouses.map((wh) => (
                        <span
                          key={wh.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {wh.code}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => onAddWarehouse(shop)}
                        className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer"
                        title="Thêm kho cho shop"
                      >
                        <Icons.Plus size={12} />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 sm:px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(shop)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        shop.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {shop.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  <td className="px-4 sm:px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSwitchScope(shop)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                      >
                        Vào Shop
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(shop)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Icons.Settings size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(shop)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Xóa shop"
                      >
                        <Icons.Trash2 size={15} />
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
  );
};
