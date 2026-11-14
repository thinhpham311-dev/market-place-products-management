'use client';

import React, { useState, useEffect } from 'react';
import { IShop } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ShopFormData, emptyShopForm } from './types';

interface ShopModalProps {
  isOpen: boolean;
  editingShop: IShop | null;
  defaultCode?: string;
  onClose: () => void;
  onSave: (formData: ShopFormData) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  editingShop,
  defaultCode = 'SHOP-NEW',
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<ShopFormData>(emptyShopForm);

  useEffect(() => {
    if (!isOpen) return;

    if (editingShop) {
      setForm({
        id: editingShop.id,
        name: editingShop.name,
        code: editingShop.code,
        address: editingShop.address,
        phone: editingShop.phone,
        ownerName: editingShop.ownerName,
        status: editingShop.status,
      });
    } else {
      setForm({
        ...emptyShopForm,
        code: defaultCode,
      });
    }
  }, [isOpen, editingShop, defaultCode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Icons.Store size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingShop ? 'Cập nhật Gian Hàng' : 'Thêm Gian Hàng Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingShop
                  ? `Chỉnh sửa cấu hình ${editingShop.code}`
                  : 'Tạo mới chi nhánh / merchant trên sàn'}
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
                Mã Gian Hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="VD: SHOP-C"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trạng Thái
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500"
              >
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên Gian Hàng / Chi Nhánh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: NovaShop Chi nhánh Đà Nẵng"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chủ Sở Hữu / Đại Diện
              </label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số Điện Thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0901 234 567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa Chỉ Chi Nhánh
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 resize-none"
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
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
            >
              {editingShop ? 'Cập Nhật' : 'Tạo Gian Hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
