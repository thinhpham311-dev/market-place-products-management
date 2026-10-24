'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import { useAppDispatch } from '@/store/hooks';
import { publishProduct } from '@/store/slices/productsSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface ProductPublishViewProps {
  product: Product;
}

const CHANNEL_META = {
  website: { name: 'Website Shop', color: 'bg-indigo-500', desc: '0% phí sàn, tự động cập nhật ngay' },
  shopee: { name: 'Shopee Mall / Shop', color: 'bg-orange-500', desc: 'Đồng bộ danh mục Shopee & kho tự động' },
  tiktok: { name: 'TikTok Shop VN', color: 'bg-slate-900', desc: 'Sẵn sàng gắn giỏ hàng Livestream & Video' },
  lazada: { name: 'Lazada Vietnam', color: 'bg-blue-600', desc: 'Đồng bộ SKU và bảng giá khuyến mãi' },
};

export const ProductPublishView: React.FC<ProductPublishViewProps> = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t, tp, formatCurrency } = useTranslation();

  const [selectedChannels, setSelectedChannels] = useState<
    ('shopee' | 'tiktok' | 'lazada' | 'website')[]
  >(['website', 'shopee', 'tiktok']);

  const publishMode: 'instant' | 'scheduled' =
    searchParams.get('tab') === 'scheduled' ? 'scheduled' : 'instant';

  const setPublishMode = useCallback(
    (mode: 'instant' | 'scheduled') => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', mode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setPublishMode('instant');
    }
  }, [searchParams, setPublishMode]);

  const [scheduleDate, setScheduleDate] = useState('2026-10-10');
  const [scheduleTime, setScheduleTime] = useState('00:00');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);

  const toggleChannel = (ch: 'shopee' | 'tiktok' | 'lazada' | 'website') => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length === 1) {
        alert('Vui lòng chọn ít nhất 1 kênh để xuất bản!');
        return;
      }
      setSelectedChannels(selectedChannels.filter((c) => c !== ch));
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  const checklist = [
    { label: 'Tên & SKU sản phẩm chuẩn', valid: !!product.name && !!product.sku },
    { label: 'Hình ảnh đại diện rõ nét', valid: !!product.thumbnail },
    { label: 'Giá bán & cấu hình giá vốn', valid: product.price > 0 },
    { label: 'Đã phân loại danh mục ngành hàng', valid: !!product.category },
    { label: 'Tồn kho khả dụng', valid: product.stock > 0 },
  ];

  const handleExecutePublish = () => {
    setIsPublishing(true);
    setPublishStep(1);

    setTimeout(() => {
      setPublishStep(2);
      setTimeout(() => {
        setPublishStep(3);
        setTimeout(() => {
          setIsPublishing(false);
          setPublishStep(0);
          const fullSchedule = `${scheduleDate} ${scheduleTime}`;
          dispatch(
            publishProduct({
              productId: product.id,
              channels: selectedChannels,
              publishMode,
              scheduledTime: publishMode === 'scheduled' ? fullSchedule : undefined,
            })
          );

          if (publishMode === 'instant') {
            dispatch(
              showToast(
                `Đã xuất bản thành công "${tp(product.name)}" lên ${selectedChannels
                  .join(', ')
                  .toUpperCase()}!`
              )
            );
          } else {
            dispatch(
              showToast(`Đã đặt lịch hẹn xuất bản "${tp(product.name)}" vào ${fullSchedule}!`)
            );
          }
          dispatch(setActiveTab('products'));
          router.push('/products');
        }, 600);
      }, 700);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={isPublishing}
            onClick={() => router.back()}
            className="mt-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Quay lại"
          >
            <Icons.ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Xuất bản sản phẩm đa kênh (Publish)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Đẩy sản phẩm lên các sàn thương mại điện tử và website chính thức
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5 text-slate-700 dark:text-slate-300">
        {/* Product Preview Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <img
            src={product.thumbnail}
            alt={tp(product.name)}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold block">
              {product.sku}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {tp(product.name)}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(product.price)}
              </span>
              <span>•</span>
              <span className="text-slate-500">
                {t('table.col_stock')}: <strong>{product.stock} {t('table.stock_unit')}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            1. Chọn các kênh bán hàng muốn xuất bản:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(['website', 'shopee', 'tiktok', 'lazada'] as const).map((ch) => {
              const isSelected = selectedChannels.includes(ch);
              const info = CHANNEL_META[ch];

              return (
                <div
                  key={ch}
                  onClick={() => !isPublishing && toggleChannel(ch)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-indigo-600'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Icons.Check size={13} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {info.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${info.color}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {info.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Publish Timing Options */}
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            2. Thời gian xuất bản:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPublishMode('instant')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                publishMode === 'instant'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icons.Rocket size={16} />
                <span className="text-xs">Xuất bản ngay</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-normal">
                Sản phẩm sẽ được hiển thị bán ngay lập tức
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPublishMode('scheduled')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                publishMode === 'scheduled'
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icons.Calendar size={16} />
                <span className="text-xs">Hẹn giờ đăng</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-normal">
                Tự động mở bán theo khung giờ Flash Sale / Chiến dịch
              </p>
            </button>
          </div>

          {publishMode === 'scheduled' && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Ngày mở bán (Date)
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Khung giờ mở bán (Time)
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Validation Checklist */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
            Tiêu chuẩn trước khi xuất bản
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                {item.valid ? (
                  <Icons.CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <Icons.AlertCircle size={14} className="text-amber-500 shrink-0" />
                )}
                <span
                  className={
                    item.valid
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Sync Simulator overlay */}
        {isPublishing && (
          <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between font-semibold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                {publishStep === 1
                  ? 'Đang kiểm tra dữ liệu sản phẩm & chuẩn SEO...'
                  : publishStep === 2
                  ? `Đang đẩy dữ liệu lên ${selectedChannels.length} kênh bán hàng...`
                  : 'Đã hoàn tất xuất bản và đồng bộ tồn kho!'}
              </span>
              <span>{publishStep === 1 ? '35%' : publishStep === 2 ? '75%' : '100%'}</span>
            </div>
            <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: publishStep === 1 ? '35%' : publishStep === 2 ? '75%' : '100%' }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={isPublishing}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecutePublish}
            isLoading={isPublishing}
            leftIcon={<Icons.Rocket size={15} />}
          >
            {publishMode === 'instant' ? 'Xuất bản ngay' : 'Đặt lịch hẹn giờ đăng'}
          </Button>
        </div>
      </div>
    </div>
  );
};
