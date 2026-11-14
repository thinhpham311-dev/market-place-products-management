'use client';

import React from 'react';
import { IShop, IWarehouse } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';

interface ShopCardProps {
  shop: IShop;
  warehouses: IWarehouse[];
  isActiveScope: boolean;
  onToggleStatus: (shop: IShop) => void;
  onSwitchScope: (shop: IShop) => void;
  onEdit: (shop: IShop) => void;
  onDelete: (shop: IShop) => void;
  onAddWarehouse: (shop: IShop) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  warehouses,
  isActiveScope,
  onToggleStatus,
  onSwitchScope,
  onEdit,
  onDelete,
  onAddWarehouse,
}) => {
  const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);

  return (
    <div
      className={`relative rounded-3xl p-5 bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
        isActiveScope
          ? 'border-purple-500 ring-2 ring-purple-500/20'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900'
      }`}
    >
      {/* Active Scope Badge */}
      {isActiveScope && (
        <div className="absolute -top-2.5 right-5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-sm flex items-center gap-1">
          <Icons.ShieldCheck size={11} />
          Phạm vi hiện tại
        </div>
      )}

      <div>
        {/* Shop Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              {shop.code.slice(0, 4)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {shop.code}
                </span>
                <span
                  onClick={() => onToggleStatus(shop)}
                  className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    shop.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                  title="Bấm để đổi trạng thái hoạt động"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {shop.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug line-clamp-1">
                {shop.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Shop Details */}
        <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Icons.User size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-400">Đại diện:</span>
            <strong className="text-slate-800 dark:text-slate-200 truncate">
              {shop.ownerName || 'Merchant Owner'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <Icons.Phone size={14} className="text-slate-400 shrink-0" />
            <span className="text-slate-400">Liên hệ:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {shop.phone || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Icons.MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">Địa chỉ:</span>
            <span className="line-clamp-2 text-slate-700 dark:text-slate-300">
              {shop.address || 'Toàn quốc'}
            </span>
          </div>
        </div>

        {/* Warehouses list */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Icons.Boxes size={13} />
              Kho bãi ({shopWarehouses.length}):
            </span>
            <button
              type="button"
              onClick={() => onAddWarehouse(shop)}
              className="text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <Icons.Plus size={12} />
              Thêm kho
            </button>
          </div>

          {shopWarehouses.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              Chưa liên kết kho bãi nào
            </p>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {shopWarehouses.map((wh) => (
                <span
                  key={wh.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  title={`${wh.name} (${wh.address})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {wh.code}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSwitchScope(shop)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            isActiveScope
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
          }`}
          title="Chuyển phạm vi làm việc của toàn bộ hệ thống sang Gian hàng này"
        >
          <Icons.Store size={14} />
          {isActiveScope ? 'Đang chọn' : 'Vào Shop'}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(shop)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
            title="Chỉnh sửa thông tin"
          >
            <Icons.Settings size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(shop)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title="Xóa gian hàng"
          >
            <Icons.Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
