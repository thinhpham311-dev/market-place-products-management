'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDashboardMetrics } from '@/store/selectors/metricsSelectors';

// UI actions
import {
  setActiveTab,
  setSidebarCollapsed,
  setMobileDrawerOpen,
  setGlobalSearch,
  openCreateModal,
  openEditModal,
  closeFormModal,
  openDetailModal,
  closeDetailModal,
  openPublishModal,
  closePublishModal,
  showToast,
  clearToast,
} from '@/store/slices/uiSlice';

// Products actions
import {
  addProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  toggleStatus,
  quickUpdateStock,
  adjustStock,
  publishProduct,
  bulkPublish,
  bulkUpdateStatus,
  bulkDelete,
} from '@/store/slices/productsSlice';

// Categories actions
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/store/slices/categoriesSlice';

import { Product, ProductCategory, ProductStatus } from '@/types/product';
import { Sidebar, TabType } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { ProductList } from '@/components/dashboard/ProductList';
import { ProductFormModal } from '@/components/dashboard/ProductFormModal';
import { ProductDetailModal } from '@/components/dashboard/ProductDetailModal';
import { PublishModal } from '@/components/dashboard/PublishModal';
import { InventoryManager } from '@/components/dashboard/InventoryManager';
import { CategoryManager } from '@/components/dashboard/CategoryManager';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const products = useAppSelector((s) => s.products.items);
  const inventoryLogs = useAppSelector((s) => s.products.inventoryLogs);
  const categories = useAppSelector((s) => s.categories.items);
  const metrics = useAppSelector(selectDashboardMetrics);

  const activeTab = useAppSelector((s) => s.ui.activeTab);
  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileDrawerOpen = useAppSelector((s) => s.ui.mobileDrawerOpen);
  const globalSearch = useAppSelector((s) => s.ui.globalSearch);

  const isFormModalOpen = useAppSelector((s) => s.ui.isFormModalOpen);
  const editingProduct = useAppSelector((s) => s.ui.editingProduct);
  const isDetailModalOpen = useAppSelector((s) => s.ui.isDetailModalOpen);
  const previewProduct = useAppSelector((s) => s.ui.previewProduct);
  const isPublishModalOpen = useAppSelector((s) => s.ui.isPublishModalOpen);
  const publishTargetProduct = useAppSelector((s) => s.ui.publishTargetProduct);
  const toastMessage = useAppSelector((s) => s.ui.toastMessage);

  // --- Toast auto-dismiss ---
  useEffect(() => {
    if (!toastMessage) return;
    const msg = toastMessage;
    const timer = setTimeout(() => {
      dispatch(clearToast());
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage, dispatch]);

  // --- Product CRUD handlers ---
  const handleOpenCreate = () => dispatch(openCreateModal());

  const handleOpenEdit = (product: Product) => dispatch(openEditModal(product));

  const handleOpenDetail = (product: Product) => dispatch(openDetailModal(product));

  const handleOpenPublish = (product: Product) => dispatch(openPublishModal(product));

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, changes: productData }));
      dispatch(showToast(`Đã cập nhật sản phẩm "${productData.name}" thành công!`));
    } else {
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
      } as Product;
      dispatch(addProduct(newProduct));

      if (newProduct.status === 'active') {
        dispatch(showToast(`Đã tạo và xuất bản sản phẩm "${newProduct.name}" thành công!`));
      } else {
        dispatch(showToast(`Đã lưu bản nháp sản phẩm "${newProduct.name}".`));
      }
    }
    dispatch(closeFormModal());
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${target?.name}"?`)) {
      dispatch(deleteProduct(id));
      dispatch(showToast('Đã xóa sản phẩm thành công.'));
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    dispatch(duplicateProduct(product));
    dispatch(showToast(`Đã nhân bản "${product.name}" thành bản nháp thành công!`));
  };

  const handleToggleStatus = (id: string) => dispatch(toggleStatus(id));

  const handleQuickUpdateStock = (id: string, newStock: number) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    dispatch(quickUpdateStock({ id, newStock }));
    dispatch(showToast(`Đã cập nhật tồn kho "${target.name}" thành ${newStock} cái.`));
  };

  // --- Bulk actions ---
  const handleBulkUpdateStatus = (ids: string[], status: ProductStatus) => {
    dispatch(bulkUpdateStatus({ ids, status }));
    dispatch(showToast(`Đã cập nhật trạng thái cho ${ids.length} sản phẩm.`));
  };

  const handleBulkDelete = (ids: string[]) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${ids.length} sản phẩm đã chọn?`)) {
      dispatch(bulkDelete(ids));
      dispatch(showToast(`Đã xóa ${ids.length} sản phẩm thành công.`));
    }
  };

  const handleBulkPublish = (ids: string[]) => {
    dispatch(bulkPublish(ids));
    dispatch(showToast(`Đã xuất bản hàng loạt ${ids.length} sản phẩm thành công!`));
  };

  // --- Stock adjustment (Inventory tab) ---
  const handleAdjustStock = (
    productId: string,
    delta: number,
    reason: string,
    type: 'in' | 'out' | 'adjustment'
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock + delta);
    dispatch(adjustStock({ productId, delta, reason, type }));
    dispatch(showToast(`Đã điều chỉnh kho cho "${target.name}" (${delta > 0 ? `+${delta}` : delta} cái).`));
  };

  // --- Publish ---
  const handleConfirmPublish = (
    productId: string,
    channels: ('shopee' | 'tiktok' | 'lazada' | 'website')[],
    publishMode: 'instant' | 'scheduled',
    scheduledTime?: string
  ) => {
    const target = products.find((p) => p.id === productId);
    dispatch(publishProduct({ productId, channels, publishMode, scheduledTime }));

    if (publishMode === 'instant') {
      dispatch(showToast(`Đã xuất bản thành công "${target?.name}" lên ${channels.join(', ').toUpperCase()}!`));
    } else {
      dispatch(showToast(`Đã đặt lịch hẹn xuất bản "${target?.name}" vào ${scheduledTime}!`));
    }
  };

  // --- Category handlers ---
  const handleAddCategory = (cat: Omit<ProductCategory, 'id' | 'productCount'>) => {
    dispatch(addCategory(cat));
    dispatch(showToast(`Đã tạo danh mục "${cat.name}" thành công!`));
  };

  const handleUpdateCategory = (cat: ProductCategory) => {
    dispatch(updateCategory(cat));
    dispatch(showToast(`Đã cập nhật danh mục "${cat.name}".`));
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (confirm(`Bạn có chắc muốn xóa danh mục "${cat?.name}"?`)) {
      dispatch(deleteCategory(id));
      dispatch(showToast('Đã xóa danh mục.'));
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Toast Notification Floating Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Icons.Check size={14} />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => dispatch(setActiveTab(tab))}
        collapsed={sidebarCollapsed}
        setCollapsed={(v) => dispatch(setSidebarCollapsed(v))}
        mobileOpen={mobileDrawerOpen}
        setMobileOpen={(v) => dispatch(setMobileDrawerOpen(v))}
        productCounts={{
          total: metrics.totalProducts,
          lowStock: metrics.lowStockProducts + metrics.outOfStockProducts,
          categories: categories.length,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenCreateProduct={handleOpenCreate}
          onOpenMobileMenu={() => dispatch(setMobileDrawerOpen(true))}
          searchQuery={globalSearch}
          setSearchQuery={(v) => dispatch(setGlobalSearch(v))}
          lowStockCount={metrics.lowStockProducts + metrics.outOfStockProducts}
        />

        {/* Dynamic Main Body based on Active Tab */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Tổng quan Quản lý Sản phẩm
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Báo cáo tình hình kinh doanh, tồn kho và danh mục sản phẩm thời gian thực.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Icons.Download size={15} />}
                    onClick={() => alert('Đã xuất báo cáo tổng quan PDF thành công!')}
                  >
                    Xuất báo cáo
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Icons.Plus size={15} />}
                    onClick={handleOpenCreate}
                  >
                    Thêm sản phẩm
                  </Button>
                </div>
              </div>

              {/* Metrics & Analytics Overview Component */}
              <MetricsOverview
                metrics={metrics}
                products={products}
                categories={categories}
                onSelectProduct={handleOpenDetail}
                onNavigateTab={(tab) => dispatch(setActiveTab(tab as TabType))}
              />
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Danh mục Sản phẩm ({products.length})
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Quản lý toàn bộ danh sách sản phẩm, giá bán, xuất bản đa kênh và tồn kho.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Icons.Plus size={16} />}
                  onClick={handleOpenCreate}
                >
                  Thêm sản phẩm mới
                </Button>
              </div>

              <ProductList
                products={products}
                categories={categories}
                searchQuery={globalSearch}
                onSelectProduct={handleOpenDetail}
                onEditProduct={handleOpenEdit}
                onDeleteProduct={handleDeleteProduct}
                onDuplicateProduct={handleDuplicateProduct}
                onToggleStatus={handleToggleStatus}
                onOpenPublishModal={handleOpenPublish}
                onQuickUpdateStock={handleQuickUpdateStock}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkPublish={handleBulkPublish}
                onBulkDelete={handleBulkDelete}
                onOpenCreateProduct={handleOpenCreate}
              />
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Quản lý Tồn kho & Nhập hàng
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Theo dõi số lượng tồn thực tế, cảnh báo định mức và lịch sử luân chuyển kho hàng.
                  </p>
                </div>
              </div>

              <InventoryManager
                products={products}
                logs={inventoryLogs}
                onAdjustStock={handleAdjustStock}
              />
            </div>
          )}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              <CategoryManager
                categories={categories}
                products={products}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icons.BarChart3 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Báo cáo & Phân tích Doanh số Chi tiết
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 mb-6">
                  Đã tích hợp module phân tích biên lợi nhuận, dự báo hết hàng bằng AI và tỷ lệ chuyển đổi đơn hàng qua từng sàn Shopee, TikTok Shop, Website.
                </p>
                <Button variant="primary" size="sm" onClick={() => dispatch(setActiveTab('overview'))}>
                  Quay về Tổng quan
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                  Cài đặt gian hàng & Đồng bộ
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Tự động cảnh báo tồn thấp</h4>
                      <p className="text-slate-500 mt-0.5">Gửi email / thông báo khi sản phẩm còn dưới 10 cái</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Đồng bộ tồn kho đa sàn thời gian thực</h4>
                      <p className="text-slate-500 mt-0.5">Tự động trừ kho liên kênh khi phát sinh đơn trên Shopee / TikTok</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" size="sm">
                      Lưu cấu hình
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Create / Edit Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => dispatch(closeFormModal())}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        categories={categories}
      />

      {/* Product Detail Preview Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => dispatch(closeDetailModal())}
        product={previewProduct}
        onEdit={handleOpenEdit}
      />

      {/* Multi-channel Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => dispatch(closePublishModal())}
        product={publishTargetProduct}
        onConfirmPublish={handleConfirmPublish}
      />
    </div>
  );
}
