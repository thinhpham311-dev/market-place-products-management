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
import { isCategoryManager, isSuperAdmin, isShopOwner } from '@/lib/auth/permissions';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const user = useAppSelector((s) => s.auth.user);
  const isCatManager = isCategoryManager(user);
  const isSuper = isSuperAdmin(user);
  const isOwner = isShopOwner(user);
  const products = useAppSelector((s) => s.products.items);
  const categories = useAppSelector((s) => s.categories.items);
  const metrics = useAppSelector(selectDashboardMetrics);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null;
    const urlClientId = searchParams.get('clientId');
    const resolvedClientId = urlClientId || user?.id;

    if (tab && tab !== 'overview' && TAB_ROUTES[tab]) {
      if (isCatManager && (tab === 'products' || tab === 'inventory')) {
        router.replace('/?tab=overview');
        return;
      }
      if (tab === 'shops' && !isSuper) {
        router.replace('/?tab=overview');
        return;
      }

      const targetRoute = TAB_ROUTES[tab];
      if (resolvedClientId) {
        const [basePath, existingQuery] = targetRoute.split('?');
        const params = new URLSearchParams(existingQuery || '');
        params.set('clientId', resolvedClientId);
        router.replace(`${basePath}?${params.toString()}`);
      } else {
        router.replace(targetRoute);
      }
      return;
    }

    if (!tab || (resolvedClientId && !urlClientId)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'overview');
      if (resolvedClientId) {
        params.set('clientId', resolvedClientId);
      }
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, user?.id, isCatManager]);

  const handleOpenCreate = () => {
    if (isCatManager) return;
    router.push('/products/new?tab=basic');
  };
  const handleOpenDetail = (product: Product) => {
    if (isCatManager) return;
    router.push(`/products/${product.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('overview.title')}
            </h1>
            {isSuper && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Icons.ShieldCheck size={13} />
                Platform Root • Global Scope
              </span>
            )}
            {isOwner && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Icons.Store size={13} />
                Shop Owner • Merchant Scope
              </span>
            )}
            {user?.authority && user.authority.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                Roles từ API: [{user.authority.join(', ')}]
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSuper
              ? 'Báo cáo tổng hợp số liệu toàn sàn, liên thông toàn bộ các Merchant và kho hàng.'
              : isOwner
              ? 'Báo cáo chỉ số hoạt động chuỗi cửa hàng và kho hàng trực thuộc doanh nghiệp của bạn.'
              : t('overview.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {isSuper && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icons.Store size={15} />}
              onClick={() => router.push('/shops')}
              className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 flex-1 sm:flex-none justify-center"
            >
              Quản lý Gian Hàng
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Icons.Download size={15} />}
            onClick={() => alert('Đã xuất báo cáo tổng quan PDF thành công!')}
            className="flex-1 sm:flex-none justify-center"
          >
            {t('products.export_csv')}
          </Button>
          {!isCatManager && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icons.Plus size={15} />}
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-none justify-center"
            >
              {t('header.add_product')}
            </Button>
          )}
        </div>
      </div>

      {/* Metrics & Analytics Overview Component */}
      <MetricsOverview
        metrics={metrics}
        products={products}
        categories={categories}
        onSelectProduct={handleOpenDetail}
        onNavigateTab={(tab) => {
          if (isCatManager && (tab === 'products' || tab === 'inventory')) {
            return;
          }
          router.push(TAB_ROUTES[tab]);
        }}
      />
    </div>
  );
}
