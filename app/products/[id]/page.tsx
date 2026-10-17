'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { ProductDetailView } from '@/components/dashboard/products/ProductDetailView';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = useAppSelector((s) => s.products.items.find((p) => p.id === id));

  if (!product) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.Package size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Sản phẩm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button variant="primary" size="sm" onClick={() => router.push('/')}>
          Quay về trang chủ
        </Button>
      </div>
    );
  }

  return <ProductDetailView product={product} />;
}
