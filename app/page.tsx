'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectDashboardMetrics } from '@/store/selectors/metricsSelectors';
import { Product } from '@/types/product';
import { TAB_ROUTES, TabType } from '@/components/dashboard/Sidebar';
import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null;
    if (!tab) {
      router.replace('/?tab=overview', { scroll: false });
    } else if (tab !== 'overview' && TAB_ROUTES[tab]) {
      router.replace(TAB_ROUTES[tab]);
    }
  }, [searchParams, router]);

  const products = useAppSelector((s) => s.products.items);
  const categories = useAppSelector((s) => s.categories.items);
  const metrics = useAppSelector(selectDashboardMetrics);

  const handleOpenCreate = () => router.push('/products/new?tab=basic');
  const handleOpenDetail = (product: Product) => router.push(`/products/${product.id}`);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('overview.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('overview.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Icons.Download size={15} />}
            onClick={() => alert('Đã xuất báo cáo tổng quan PDF thành công!')}
          >
            {t('products.export_csv')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Icons.Plus size={15} />}
            onClick={handleOpenCreate}
          >
            {t('header.add_product')}
          </Button>
        </div>
      </div>

      {/* Metrics & Analytics Overview Component */}
      <MetricsOverview
        metrics={metrics}
        products={products}
        categories={categories}
        onSelectProduct={handleOpenDetail}
        onNavigateTab={(tab) => router.push(TAB_ROUTES[tab])}
      />
    </div>
  );
}
