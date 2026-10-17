'use client';

import { useAppSelector } from '@/store/hooks';
import { InventoryManager } from '@/components/dashboard/InventoryManager';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function InventoryPage() {
  const products = useAppSelector((s) => s.products.items);
  const inventoryLogs = useAppSelector((s) => s.products.inventoryLogs);
  const { t } = useTranslation();

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
