'use client';

import { useAppSelector } from '@/store/hooks';
import { InventoryManager } from '@/components/dashboard/InventoryManager';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { useProductInventoryPermission } from '@/lib/auth/permissions';

export default function InventoryPage() {
  const { canAccess } = useProductInventoryPermission();
  const products = useAppSelector((s) => s.products.items);
  const inventoryLogs = useAppSelector((s) => s.products.inventoryLogs);
  const { t } = useTranslation();

  if (!canAccess) {
    return (
      <AccessDenied
        featureName="Quản lý Tồn kho"
        restrictedRole="CATEGORY_MANAGER"
        description="Tài khoản có vai trò CATEGORY_MANAGER chỉ được phân quyền quản lý Danh mục & Thương hiệu, không có quyền truy cập vào các trang Quản lý Sản phẩm và Tồn kho."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('inventory.page_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('inventory.page_subtitle')}
          </p>
        </div>
      </div>

      <InventoryManager products={products} logs={inventoryLogs} />
    </div>
  );
}
