'use client';

import React, { useState, useEffect } from 'react';
import { IShop } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { WarehouseFormData } from './types';

interface WarehouseModalProps {
  isOpen: boolean;
  targetShop: IShop | null;
  onClose: () => void;
  onSave: (formData: WarehouseFormData) => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  targetShop,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<WarehouseFormData>({
    shopId: '',
    name: '',
    code: '',
    address: '',
    managerName: '',
    phone: '',
    capacity: 15000,
  });

  useEffect(() => {
    if (!isOpen || !targetShop) return;

    setForm({
      shopId: targetShop.id,
      name: `Kho ${targetShop.code} - `,
      code: `WH-${targetShop.code.replace('SHOP-', '')}${
        targetShop.warehouseIds.length + 1
      }`,
      address: targetShop.address,
      managerName: `Thủ kho ${targetShop.name}`,
      phone: targetShop.phone,
      capacity: 15000,
    });
  }, [isOpen, targetShop]);

  if (!isOpen || !targetShop) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Icons.Boxes size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thêm Kho Cho {targetShop.name}
              </h3>
              <p className="text-xs text-slate-400">
                Kho hàng sẽ trực thuộc quản lý của {targetShop.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã Kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="WH-C1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sức Chứa (Capacity)
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
                placeholder="10000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Kho Hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Kho Trung Chuyển Hải Châu"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người Quản Lý Kho
              </label>
              <input
                type="text"
                value={form.managerName}
                onChange={(e) =>
                  setForm({ ...form, managerName: e.target.value })
                }
                placeholder="Nguyễn Văn Kho"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Điện Thoại Kho
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa Chỉ Kho Hàng
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Khu công nghiệp, số đường kho hàng..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              Lưu Kho Hàng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
