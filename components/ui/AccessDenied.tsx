'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { CATEGORY_BRAND_ALLOWED_ROLES } from '@/lib/auth/permissions';

interface AccessDeniedProps {
  featureName?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  featureName = 'Danh mục & Thương hiệu',
}) => {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 sm:p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Icons.ShieldAlert size={34} />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        403 • Quyền truy cập bị giới hạn
      </span>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-4">
        Không có quyền truy cập {featureName}
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 max-w-lg mx-auto leading-relaxed">
        Chỉ các tài khoản được gán vai trò{' '}
        <strong className="text-indigo-600 dark:text-indigo-400">SUPER_ADMIN</strong>,{' '}
        <strong className="text-indigo-600 dark:text-indigo-400">CATEGORY_MANAGER</strong>, hoặc{' '}
        <strong className="text-indigo-600 dark:text-indigo-400">CATALOG_SPECIALIST</strong> mới
        có thể hiển thị danh sách và sử dụng các công cụ điều khiển chỉnh sửa danh mục và thương
        hiệu.
      </p>

      {/* Current User Info Card */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left max-w-md mx-auto">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Thông tin tài khoản hiện tại
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
              {user.avatar || 'US'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.userName || 'Người dùng'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
            {user.role || 'Chưa phân quyền'}
          </span>
        </div>
        {user.authority && user.authority.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400">Authorities:</span>
            {user.authority.map((auth, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {auth}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Required Roles Pills */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Các vai trò hợp lệ:
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CATEGORY_BRAND_ALLOWED_ROLES.map((role) => (
            <span
              key={role}
              className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/')}
          leftIcon={<Icons.ArrowLeft size={16} />}
        >
          Quay về Tổng quan
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => router.push('/login')}
          leftIcon={<Icons.LogOut size={16} />}
        >
          Đổi tài khoản
        </Button>
      </div>
    </div>
  );
};
