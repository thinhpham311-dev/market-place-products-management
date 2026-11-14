'use client';

import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addShop,
  updateShop,
  deleteShop,
  setActiveShop,
  addWarehouse,
} from '@/store/slices/scopeSlice';
import { showToast, showErrorToast } from '@/store/slices/uiSlice';
import { IShop, IWarehouse } from '@/types/scope';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import {
  ShopFormData,
  WarehouseFormData,
  ShopStatusFilter,
  ShopViewMode,
} from './types';
import { ShopStatsHero } from './ShopStatsHero';
import { ShopModal } from './ShopModal';
import { WarehouseModal } from './WarehouseModal';
import { ShopCard } from './ShopCard';
import { ShopTableView } from './ShopTableView';

export const ShopManager: React.FC = () => {
  const dispatch = useAppDispatch();

  const { shops, warehouses, activeShopId } = useAppSelector((s) => s.scope);
  const products = useAppSelector((s) => s.products.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<ShopViewMode>('grid');

  // Modals state
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<IShop | null>(null);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [targetShopForWh, setTargetShopForWh] = useState<IShop | null>(null);

  const [deletingShop, setDeletingShop] = useState<IShop | null>(null);

  // Stats calculation
  const totalShops = shops.length;
  const activeShops = useMemo(
    () => shops.filter((s) => s.status === 'ACTIVE').length,
    [shops]
  );
  const inactiveShops = totalShops - activeShops;
  const totalWarehouses = warehouses.length;

  // Filtered shops
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (statusFilter !== 'ALL' && shop.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        shop.name.toLowerCase().includes(q) ||
        shop.code.toLowerCase().includes(q) ||
        shop.ownerName.toLowerCase().includes(q) ||
        shop.address.toLowerCase().includes(q) ||
        shop.phone.toLowerCase().includes(q)
      );
    });
  }, [shops, statusFilter, searchQuery]);

  // Open modal to add shop
  const handleOpenAddShop = () => {
    setEditingShop(null);
    setIsShopModalOpen(true);
  };

  // Open modal to edit shop
  const handleOpenEditShop = (shop: IShop) => {
    setEditingShop(shop);
    setIsShopModalOpen(true);
  };

  // Submit shop form
  const handleSaveShop = (form: ShopFormData) => {
    if (!form.name.trim() || !form.code.trim()) {
      dispatch(showErrorToast('Vui lòng nhập tên và mã gian hàng.'));
      return;
    }

    const cleanCode = form.code.trim().toUpperCase();

    // Check duplicate code
    const isDup = shops.some(
      (s) => s.code.toUpperCase() === cleanCode && s.id !== editingShop?.id
    );
    if (isDup) {
      dispatch(
        showErrorToast(
          `Mã gian hàng "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.`
        )
      );
      return;
    }

    if (editingShop) {
      dispatch(
        updateShop({
          id: editingShop.id,
          changes: {
            name: form.name.trim(),
            code: cleanCode,
            address: form.address.trim(),
            phone: form.phone.trim(),
            ownerName: form.ownerName.trim(),
            status: form.status,
          },
        })
      );
      dispatch(
        showToast(`Đã cập nhật thông tin gian hàng "${form.name.trim()}".`)
      );
    } else {
      const newId = `shop-${Date.now().toString(36)}`;
      const newShop: IShop = {
        id: newId,
        name: form.name.trim(),
        code: cleanCode,
        address: form.address.trim(),
        phone: form.phone.trim(),
        ownerName: form.ownerName.trim() || 'Merchant Owner',
        status: form.status,
        warehouseIds: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch(addShop(newShop));
      dispatch(showToast(`Đã thêm mới gian hàng "${newShop.name}" thành công!`));
    }

    setIsShopModalOpen(false);
  };

  // Toggle single shop status
  const handleToggleShopStatus = (shop: IShop) => {
    const nextStatus = shop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    dispatch(
      updateShop({
        id: shop.id,
        changes: { status: nextStatus },
      })
    );
    dispatch(
      showToast(
        `Đã chuyển trạng thái ${shop.code} sang ${
          nextStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'
        }.`
      )
    );
  };

  // Delete shop confirmation
  const handleConfirmDelete = () => {
    if (!deletingShop) return;
    const shopName = deletingShop.name;
    dispatch(deleteShop(deletingShop.id));
    dispatch(
      showToast(
        `Đã xóa gian hàng "${shopName}" và các kho trực thuộc thành công!`
      )
    );
    setDeletingShop(null);
  };

  // Switch scope to this shop
  const handleSwitchScopeToShop = (shop: IShop) => {
    dispatch(setActiveShop(shop.id));
    dispatch(
      showToast(`Đã chuyển phạm vi làm việc sang "${shop.name}" (${shop.code})`)
    );
  };

  // Open add warehouse modal
  const handleOpenAddWarehouse = (shop: IShop) => {
    setTargetShopForWh(shop);
    setIsWarehouseModalOpen(true);
  };

  // Save warehouse
  const handleSaveWarehouse = (form: WarehouseFormData) => {
    if (!targetShopForWh || !form.name.trim() || !form.code.trim()) {
      dispatch(showErrorToast('Vui lòng nhập tên và mã kho hàng.'));
      return;
    }

    const cleanCode = form.code.trim().toUpperCase();
    const newWhId = `wh-${Date.now().toString(36)}`;
    const newWh: IWarehouse = {
      id: newWhId,
      shopId: targetShopForWh.id,
      name: form.name.trim(),
      code: cleanCode,
      address: form.address.trim(),
      managerName: form.managerName.trim(),
      phone: form.phone.trim(),
      capacity: Number(form.capacity) || 10000,
      currentStockCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    dispatch(addWarehouse(newWh));
    dispatch(
      showToast(
        `Đã thêm kho "${newWh.name}" cho gian hàng ${targetShopForWh.name}!`
      )
    );
    setIsWarehouseModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã Shop',
      'Tên Gian Hàng',
      'Chủ Sở Hữu',
      'Số Điện Thoại',
      'Địa Chỉ',
      'Số Lượng Kho',
      'Trạng Thái',
      'Ngày Tạo',
    ];
    const rows = filteredShops.map((s) => [
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.ownerName.replace(/"/g, '""')}"`,
      `"${s.phone}"`,
      `"${s.address.replace(/"/g, '""')}"`,
      s.warehouseIds.length,
      s.status,
      s.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `danh_sach_gian_hang_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dispatch(showToast('Đã xuất danh sách gian hàng sang CSV thành công!'));
  };

  const defaultNewShopCode = `SHOP-${String.fromCharCode(
    65 + (shops.length % 26)
  )}`;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Platform Root Hero Header & KPI Stats */}
      <ShopStatsHero
        totalShops={totalShops}
        activeShops={activeShops}
        totalWarehouses={totalWarehouses}
        totalProducts={products.length}
        onExportCSV={handleExportCSV}
        onOpenAddShop={handleOpenAddShop}
      />

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Icons.Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên shop, mã shop, chủ sở hữu, địa chỉ..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500 transition-colors placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs & View Mode */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-x-auto max-w-[calc(100%-80px)] sm:max-w-none">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({totalShops})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hoạt động ({activeShops})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạm dừng ({inactiveShops})
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icons.Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Dạng bảng"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icons.List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {filteredShops.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Icons.Store size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy gian hàng nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Không có gian hàng nào khớp với điều kiện tìm kiếm hiện tại. Hãy thử
            thay đổi từ khóa hoặc bộ lọc.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-4"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              warehouses={warehouses}
              isActiveScope={activeShopId === shop.id}
              onToggleStatus={handleToggleShopStatus}
              onSwitchScope={handleSwitchScopeToShop}
              onEdit={handleOpenEditShop}
              onDelete={setDeletingShop}
              onAddWarehouse={handleOpenAddWarehouse}
            />
          ))}
        </div>
      ) : (
        <ShopTableView
          shops={filteredShops}
          warehouses={warehouses}
          activeShopId={activeShopId}
          onToggleStatus={handleToggleShopStatus}
          onSwitchScope={handleSwitchScopeToShop}
          onEdit={handleOpenEditShop}
          onDelete={setDeletingShop}
          onAddWarehouse={handleOpenAddWarehouse}
        />
      )}

      {/* Modal Add / Edit Shop */}
      <ShopModal
        isOpen={isShopModalOpen}
        editingShop={editingShop}
        defaultCode={defaultNewShopCode}
        onClose={() => setIsShopModalOpen(false)}
        onSave={handleSaveShop}
      />

      {/* Modal Add Warehouse */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        targetShop={targetShopForWh}
        onClose={() => setIsWarehouseModalOpen(false)}
        onSave={handleSaveWarehouse}
      />

      {/* Confirm Delete Shop Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingShop)}
        isLoading={false}
        title="Xác nhận xóa Gian Hàng"
        message="Hành động này sẽ xóa vĩnh viễn Gian Hàng cùng toàn bộ liên kết kho bãi trực thuộc khỏi hệ thống. Bạn có chắc chắn muốn thực hiện?"
        itemName={deletingShop?.name || ''}
        itemSubtitle={
          deletingShop ? `${deletingShop.code} • ${deletingShop.address}` : ''
        }
        itemMeta={
          deletingShop
            ? `Bao gồm ${
                warehouses.filter((w) => w.shopId === deletingShop.id).length
              } kho trực thuộc`
            : undefined
        }
        onClose={() => setDeletingShop(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
