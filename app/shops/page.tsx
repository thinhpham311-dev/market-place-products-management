'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/store/StoreProvider';
import { isSuperAdmin } from '@/lib/auth/permissions';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { ShopManager } from '@/components/dashboard/shops/ShopManager';

export default function ShopsPage() {
  const isHydrated = useHydrated();
  const user = useAppSelector((s) => s.auth.user);
  const isSuper = isSuperAdmin(user);

  if (!isHydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Strictly enforce SUPER_ADMIN role access
  if (!isSuper) {
    return (
      <AccessDenied
        featureName="Quản lý Gian Hàng (Shops)"
        allowedRoles={['SUPER_ADMIN']}
        description="Trang này dành riêng cho tài khoản Root Platform SUPER_ADMIN để điều phối, giám sát và cấu hình toàn bộ các Shop / Merchant trên hệ thống."
      />
    );
  }

  return <ShopManager />;
}
