'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addShop, updateShop, deleteShop, setActiveShop } from '@/store/slices/scopeSlice';
import { showToast } from '@/store/slices/uiSlice';
import { IShop } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export const ShopManagementView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { shops, warehouses, activeShopId } = useAppSelector((s) => s.scope);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<IShop | null>(null);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    address: '',
    ownerName: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const handleOpenAdd = () => {
    setEditingShop(null);
    setFormData({
      name: '',
      code: `SHOP-${String.fromCharCode(65 + shops.length)}`,
      phone: '',
      address: '',
      ownerName: 'Admin Shop Owner',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shop: IShop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      code: shop.code,
      phone: shop.phone,
      address: shop.address,
      ownerName: shop.ownerName,
      status: shop.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      return;
    }

    if (editingShop) {
      dispatch(
        updateShop({
          id: editingShop.id,
          changes: { ...formData },
        })
      );
      dispatch(showToast(`Đã cập nhật thông tin cửa hàng "${formData.name}"`));
    } else {
      const newShop: IShop = {
        id: `shop-${Date.now()}`,
        ...formData,
        warehouseIds: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addShop(newShop));
      dispatch(showToast(`Đã tạo mới cửa hàng "${newShop.name}"`));
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingShopId) {
      const target = shops.find((s) => s.id === deletingShopId);
      dispatch(deleteShop(deletingShopId));
      dispatch(showToast(`Đã xoá cửa hàng "${target?.name || deletingShopId}" và các kho trực thuộc`));
      setDeletingShopId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icons.Store size={18} className="text-indigo-600 dark:text-indigo-400" />
            Danh sách Cửa hàng (Shops / Branches)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý các chi nhánh cửa hàng trực thuộc Shop Owner. Mỗi cửa hàng có thể sở hữu nhiều kho hàng độc lập.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icons.Plus size={16} />}
          onClick={handleOpenAdd}
        >
          Thêm Cửa Hàng
        </Button>
      </div>

      {/* Grid of Shops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((shop) => {
          const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);
          const isActiveScope = activeShopId === shop.id;

          return (
            <div
              key={shop.id}
              className={`relative bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all ${
                isActiveScope
                  ? 'border-indigo-500 ring-2 ring-indigo-500/15 shadow-md'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              {/* Header card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {shop.code.replace('SHOP-', '')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {shop.name}
                      {isActiveScope && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          Đang chọn
                        </span>
                      )}
                    </h4>
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Mã: {shop.code}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    shop.status === 'ACTIVE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {shop.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Icons.MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{shop.address || 'Chưa cập nhật địa chỉ'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{shop.phone || 'Chưa có SĐT'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.User size={14} className="text-slate-400 shrink-0" />
                  <span>Người quản lý: <strong className="text-slate-800 dark:text-slate-200">{shop.ownerName}</strong></span>
                </div>
              </div>

              {/* Warehouses list preview */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Icons.Boxes size={13} />
                    Kho trực thuộc ({shopWarehouses.length})
                  </span>
                </div>

                {shopWarehouses.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có kho hàng nào</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {shopWarehouses.map((w) => (
                      <span
                        key={w.id}
                        className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        title={w.name}
                      >
                        {w.code} ({w.name.split('-')[0].trim()})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => dispatch(setActiveShop(shop.id))}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {isActiveScope ? '✓ Đang làm việc' : '→ Chuyển vùng tới Shop này'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(shop)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Icons.Edit size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingShopId(shop.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xoá cửa hàng"
                  >
                    <Icons.Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Shop */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShop ? 'Chỉnh sửa Cửa Hàng' : 'Thêm Cửa Hàng Mới'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên cửa hàng / Chi nhánh *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: NovaShop Chi nhánh C (Đà Nẵng)"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mã định danh (Code) *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SHOP-C"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0905 123 456"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ chi nhánh
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 250 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chủ sở hữu / Phụ trách
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
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
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng hoạt động</option>
              </select>
            </div>
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
              {editingShop ? 'Lưu thay đổi' : 'Tạo Cửa Hàng'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingShopId)}
        onClose={() => setDeletingShopId(null)}
        onConfirm={handleConfirmDelete}
        title="Xoá Cửa Hàng?"
        message="Hành động này sẽ xoá toàn bộ các kho hàng trực thuộc cửa hàng này. Dữ liệu không thể khôi phục."
      />
    </div>
  );
};
