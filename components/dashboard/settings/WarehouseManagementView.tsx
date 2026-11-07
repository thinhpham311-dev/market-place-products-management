'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
  setActiveWarehouse,
} from '@/store/slices/scopeSlice';
import { showToast } from '@/store/slices/uiSlice';
import { IWarehouse } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export const WarehouseManagementView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shops, warehouses, activeWarehouseId } = useAppSelector((s) => s.scope);

  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<IWarehouse | null>(null);
  const [deletingWhId, setDeletingWhId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    shopId: shops[0]?.id || 'shop-a',
    name: '',
    code: '',
    address: '',
    managerName: '',
    phone: '',
    capacity: 10000,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const filteredWarehouses =
    selectedShopFilter === 'all'
      ? warehouses
      : warehouses.filter((w) => w.shopId === selectedShopFilter);

  const handleOpenAdd = () => {
    setEditingWarehouse(null);
    const targetShop = shops.find((s) => s.id === (selectedShopFilter !== 'all' ? selectedShopFilter : shops[0]?.id));
    const shopCode = targetShop ? targetShop.code.replace('SHOP-', '') : 'A';
    const currentCountInShop = warehouses.filter((w) => w.shopId === (targetShop?.id || '')).length;

    setFormData({
      shopId: targetShop?.id || shops[0]?.id || 'shop-a',
      name: '',
      code: `WH-${shopCode}${currentCountInShop + 1}`,
      address: '',
      managerName: '',
      phone: '',
      capacity: 15000,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wh: IWarehouse) => {
    setEditingWarehouse(wh);
    setFormData({
      shopId: wh.shopId,
      name: wh.name,
      code: wh.code,
      address: wh.address,
      managerName: wh.managerName || '',
      phone: wh.phone || '',
      capacity: wh.capacity || 10000,
      status: wh.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.shopId) {
      return;
    }

    if (editingWarehouse) {
      dispatch(
        updateWarehouse({
          id: editingWarehouse.id,
          changes: { ...formData },
        })
      );
      dispatch(showToast(`Đã cập nhật thông tin kho "${formData.name}"`));
    } else {
      const newWh: IWarehouse = {
        id: `wh-${Date.now()}`,
        ...formData,
        currentStockCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addWarehouse(newWh));
      dispatch(showToast(`Đã tạo mới kho hàng "${newWh.name}"`));
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingWhId) {
      const target = warehouses.find((w) => w.id === deletingWhId);
      dispatch(deleteWarehouse(deletingWhId));
      dispatch(showToast(`Đã xoá kho "${target?.name || deletingWhId}"`));
      setDeletingWhId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Shop Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Boxes size={18} className="text-emerald-600 dark:text-emerald-400" />
            Quản lý Kho Hàng (Warehouses)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mỗi kho hàng trực thuộc 1 Cửa hàng cụ thể và có Quản lý kho (Warehouse Manager) điều hành.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filter by shop */}
          <select
            value={selectedShopFilter}
            onChange={(e) => setSelectedShopFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">Tất cả Cửa hàng ({warehouses.length} kho)</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icons.Plus size={16} />}
            onClick={handleOpenAdd}
          >
            Thêm Kho Mới
          </Button>
        </div>
      </div>

      {/* Grid of Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((wh) => {
          const parentShop = shops.find((s) => s.id === wh.shopId);
          const isActiveScope = activeWarehouseId === wh.id;

          return (
            <div
              key={wh.id}
              className={`relative bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActiveScope
                  ? 'border-emerald-500 ring-2 ring-emerald-500/15 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {wh.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {wh.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Thuộc: <strong className="text-indigo-600 dark:text-indigo-400">{parentShop?.name || 'Chưa gán'}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                      wh.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {wh.status === 'ACTIVE' ? 'Đang mở' : 'Tạm dừng'}
                  </span>
                </div>

                {/* Info List */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Icons.User size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      Trưởng kho: <strong className="text-slate-800 dark:text-slate-200">{wh.managerName || 'Chưa gán (Manager)'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{wh.phone || 'Chưa có SĐT'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{wh.address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

                {/* Capacity metric */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Sức chứa lưu trữ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(wh.capacity || 10000).toLocaleString()} đơn vị SP
                  </span>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => dispatch(setActiveWarehouse(wh.id))}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isActiveScope ? '✓ Đang xem kho này' : '→ Lọc tồn kho theo kho này'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(wh)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Chỉnh sửa kho"
                  >
                    <Icons.Edit size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingWhId(wh.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xoá kho"
                  >
                    <Icons.Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Warehouse */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? 'Chỉnh sửa Kho Hàng' : 'Thêm Kho Hàng Mới'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Thuộc Cửa hàng (Shop chủ quản) *
            </label>
            <select
              required
              value={formData.shopId}
              onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên kho hàng *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Kho A3 - Kho Phụ Thanh Xuân"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã kho (Code) *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: WH-A3"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sức chứa tối đa (Đơn vị SP)
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trưởng kho (Warehouse Manager)
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="VD: Nguyễn Văn B"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hotline / SĐT kho
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0912 999 888"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ kho
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: Số 45 Lê Văn Lương, Thanh Xuân, Hà Nội"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="ACTIVE">Đang mở cửa tiếp nhận</option>
              <option value="INACTIVE">Tạm dừng hoạt động</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingWarehouse ? 'Lưu thay đổi' : 'Tạo Kho Hàng'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingWhId)}
        onClose={() => setDeletingWhId(null)}
        onConfirm={handleConfirmDelete}
        title="Xoá Kho Hàng?"
        message="Hành động này sẽ gỡ bỏ kho hàng khỏi hệ thống. Dữ liệu tồn kho liên kết cần được chuyển giao trước khi xoá."
      />
    </div>
  );
};
