'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface ShopFormData {
  id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  ownerName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface WarehouseFormData {
  shopId: string;
  name: string;
  code: string;
  address: string;
  managerName: string;
  phone: string;
  capacity: number;
}

const emptyShopForm: ShopFormData = {
  name: '',
  code: '',
  address: '',
  phone: '',
  ownerName: '',
  status: 'ACTIVE',
};

export const ShopManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { shops, warehouses, activeShopId } = useAppSelector((s) => s.scope);
  const products = useAppSelector((s) => s.products.items);
  const user = useAppSelector((s) => s.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<IShop | null>(null);
  const [shopForm, setShopForm] = useState<ShopFormData>(emptyShopForm);

  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [targetShopForWh, setTargetShopForWh] = useState<IShop | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormData>({
    shopId: '',
    name: '',
    code: '',
    address: '',
    managerName: '',
    phone: '',
    capacity: 10000,
  });

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
    setShopForm({
      ...emptyShopForm,
      code: `SHOP-${String.fromCharCode(65 + (shops.length % 26))}`,
    });
    setIsShopModalOpen(true);
  };

  // Open modal to edit shop
  const handleOpenEditShop = (shop: IShop) => {
    setEditingShop(shop);
    setShopForm({
      id: shop.id,
      name: shop.name,
      code: shop.code,
      address: shop.address,
      phone: shop.phone,
      ownerName: shop.ownerName,
      status: shop.status,
    });
    setIsShopModalOpen(true);
  };

  // Submit shop form
  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopForm.name.trim() || !shopForm.code.trim()) {
      dispatch(showErrorToast('Vui lòng nhập tên và mã gian hàng.'));
      return;
    }

    const cleanCode = shopForm.code.trim().toUpperCase();

    // Check duplicate code
    const isDup = shops.some(
      (s) => s.code.toUpperCase() === cleanCode && s.id !== editingShop?.id
    );
    if (isDup) {
      dispatch(showErrorToast(`Mã gian hàng "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.`));
      return;
    }

    if (editingShop) {
      dispatch(
        updateShop({
          id: editingShop.id,
          changes: {
            name: shopForm.name.trim(),
            code: cleanCode,
            address: shopForm.address.trim(),
            phone: shopForm.phone.trim(),
            ownerName: shopForm.ownerName.trim(),
            status: shopForm.status,
          },
        })
      );
      dispatch(showToast(`Đã cập nhật thông tin gian hàng "${shopForm.name.trim()}".`));
    } else {
      const newId = `shop-${Date.now().toString(36)}`;
      const newShop: IShop = {
        id: newId,
        name: shopForm.name.trim(),
        code: cleanCode,
        address: shopForm.address.trim(),
        phone: shopForm.phone.trim(),
        ownerName: shopForm.ownerName.trim() || 'Merchant Owner',
        status: shopForm.status,
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
    dispatch(showToast(`Đã xóa gian hàng "${shopName}" và các kho trực thuộc thành công!`));
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
    setWarehouseForm({
      shopId: shop.id,
      name: `Kho ${shop.code} - `,
      code: `WH-${shop.code.replace('SHOP-', '')}${shop.warehouseIds.length + 1}`,
      address: shop.address,
      managerName: `Thủ kho ${shop.name}`,
      phone: shop.phone,
      capacity: 15000,
    });
    setIsWarehouseModalOpen(true);
  };

  // Save warehouse
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShopForWh || !warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      dispatch(showErrorToast('Vui lòng nhập tên và mã kho hàng.'));
      return;
    }

    const cleanCode = warehouseForm.code.trim().toUpperCase();
    const newWhId = `wh-${Date.now().toString(36)}`;
    const newWh: IWarehouse = {
      id: newWhId,
      shopId: targetShopForWh.id,
      name: warehouseForm.name.trim(),
      code: cleanCode,
      address: warehouseForm.address.trim(),
      managerName: warehouseForm.managerName.trim(),
      phone: warehouseForm.phone.trim(),
      capacity: Number(warehouseForm.capacity) || 10000,
      currentStockCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    dispatch(addWarehouse(newWh));
    dispatch(showToast(`Đã thêm kho "${newWh.name}" cho gian hàng ${targetShopForWh.name}!`));
    setIsWarehouseModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã Shop', 'Tên Gian Hàng', 'Chủ Sở Hữu', 'Số Điện Thoại', 'Địa Chỉ', 'Số Lượng Kho', 'Trạng Thái', 'Ngày Tạo'];
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
    link.setAttribute('download', `danh_sach_gian_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    dispatch(showToast('Đã xuất danh sách gian hàng sang CSV thành công!'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Platform Root Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-md">
                <Icons.ShieldCheck size={14} className="text-purple-300" />
                SUPER_ADMIN Dedicated Console
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/10 text-slate-200 border border-white/10">
                Root Scope • Multi-Merchant
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Quản lý Toàn bộ Gian Hàng (Shops)
            </h1>

            <p className="text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              Khu vực quản trị cấp cao dành riêng cho <strong>SUPER_ADMIN</strong>. Cho phép giám sát tập trung, cấu hình chi nhánh, quản trị liên kết kho bãi và chuyển đổi trực tiếp phạm vi hoạt động giữa các Merchant trên toàn sàn.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Icons.Download size={16} />}
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm"
            >
              Xuất CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Icons.Plus size={16} />}
              onClick={handleOpenAddShop}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/25 border-0"
            >
              Thêm Gian Hàng Mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shops */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
            <Icons.Store size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Gian Hàng
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalShops}
            </h3>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              Toàn hệ sinh thái
            </span>
          </div>
        </div>

        {/* Active Shops */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <Icons.Check size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đang Hoạt Động
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeShops}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {totalShops > 0 ? `${Math.round((activeShops / totalShops) * 100)}% tổng số` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Warehouses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
            <Icons.Boxes size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kho Bãi Trực Thuộc
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {totalWarehouses}
            </h3>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Phân bổ liên tỉnh
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60">
            <Icons.Package size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sản Phẩm Lưu Thông
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {products.length}
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              SPU đang mở bán
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Icons.Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên shop, mã (SHOP-A), đại diện, SĐT..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs & View Mode */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạm dừng ({inactiveShops})
            </button>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Dạng lưới"
              className={`p-1.5 rounded-lg text-xs transition-all ${
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
              className={`p-1.5 rounded-lg text-xs transition-all ${
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
            Không có gian hàng nào khớp với điều kiện tìm kiếm hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc.
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
          {filteredShops.map((shop) => {
            const isCurrentActiveScope = activeShopId === shop.id;
            const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);

            return (
              <div
                key={shop.id}
                className={`relative rounded-3xl p-5 bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isCurrentActiveScope
                    ? 'border-purple-500 ring-2 ring-purple-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900'
                }`}
              >
                {/* Active Scope Badge */}
                {isCurrentActiveScope && (
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
                            onClick={() => handleToggleShopStatus(shop)}
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
                        onClick={() => handleOpenAddWarehouse(shop)}
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
                    onClick={() => handleSwitchScopeToShop(shop)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrentActiveScope
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Chuyển phạm vi làm việc của toàn bộ hệ thống sang Gian hàng này"
                  >
                    <Icons.Store size={14} />
                    {isCurrentActiveScope ? 'Đang chọn' : 'Vào Shop'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditShop(shop)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Icons.Settings size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingShop(shop)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title="Xóa gian hàng"
                    >
                      <Icons.Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Mã & Tên Gian Hàng</th>
                  <th className="px-5 py-3.5">Đại Diện / Liên Hệ</th>
                  <th className="px-5 py-3.5">Địa Chỉ</th>
                  <th className="px-5 py-3.5">Kho Bãi Liên Kết</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShops.map((shop) => {
                  const isCurrentActiveScope = activeShopId === shop.id;
                  const shopWarehouses = warehouses.filter((w) => w.shopId === shop.id);

                  return (
                    <tr
                      key={shop.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrentActiveScope ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
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

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {shop.ownerName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {shop.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {shop.address}
                      </td>

                      <td className="px-5 py-4">
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
                            onClick={() => handleOpenAddWarehouse(shop)}
                            className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 cursor-pointer"
                            title="Thêm kho cho shop"
                          >
                            <Icons.Plus size={12} />
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleShopStatus(shop)}
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

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSwitchScopeToShop(shop)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                          >
                            Vào Shop
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditShop(shop)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Icons.Settings size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingShop(shop)}
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
      )}

      {/* Modal Add / Edit Shop */}
      {isShopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
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
                    {editingShop ? `Chỉnh sửa cấu hình ${editingShop.code}` : 'Tạo mới chi nhánh / merchant trên sàn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShopModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Gian Hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopForm.code}
                    onChange={(e) => setShopForm({ ...shopForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SHOP-C"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 font-mono font-bold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={shopForm.status}
                    onChange={(e) => setShopForm({ ...shopForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
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
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="VD: NovaShop Chi nhánh Đà Nẵng"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ Sở Hữu / Đại Diện
                  </label>
                  <input
                    type="text"
                    value={shopForm.ownerName}
                    onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
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
                    value={shopForm.phone}
                    onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
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
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsShopModalOpen(false)}
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
      )}

      {/* Modal Add Warehouse */}
      {isWarehouseModalOpen && targetShopForWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <Icons.Boxes size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thêm Kho Cho {targetShopForWh.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kho hàng sẽ trực thuộc quản lý của {targetShopForWh.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value.toUpperCase() })}
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
                    value={warehouseForm.capacity}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: Number(e.target.value) })}
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
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  placeholder="VD: Kho Trung Chuyển Hải Châu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Người Quản Lý Kho
                  </label>
                  <input
                    type="text"
                    value={warehouseForm.managerName}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, managerName: e.target.value })}
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
                    value={warehouseForm.phone}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
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
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  placeholder="Khu công nghiệp, số đường kho hàng..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsWarehouseModalOpen(false)}
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
      )}

      {/* Confirm Delete Shop Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingShop)}
        isLoading={false}
        title="Xác nhận xóa Gian Hàng"
        message="Hành động này sẽ xóa vĩnh viễn Gian Hàng cùng toàn bộ liên kết kho bãi trực thuộc khỏi hệ thống. Bạn có chắc chắn muốn thực hiện?"
        itemName={deletingShop?.name || ''}
        itemSubtitle={deletingShop ? `${deletingShop.code} • ${deletingShop.address}` : ''}
        itemMeta={
          deletingShop
            ? `Bao gồm ${warehouses.filter((w) => w.shopId === deletingShop.id).length} kho trực thuộc`
            : undefined
        }
        onClose={() => setDeletingShop(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
