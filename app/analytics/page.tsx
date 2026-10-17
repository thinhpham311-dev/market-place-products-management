'use client';

import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
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
        <Button variant="primary" size="sm" onClick={() => router.push('/')}>
          Quay về Tổng quan
        </Button>
      </div>
    </div>
  );
}
