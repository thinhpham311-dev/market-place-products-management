'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

type SalesChannel = 'shopee' | 'tiktok' | 'lazada' | 'website';

interface SeoChannelsTabProps {
  channels: SalesChannel[];
  setChannels: (v: SalesChannel[]) => void;
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  seoDescription: string;
  setSeoDescription: (v: string) => void;
  name: string;
  sku: string;
  shortDescription: string;
}

export const SeoChannelsTab: React.FC<SeoChannelsTabProps> = ({
  channels,
  setChannels,
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  name,
  sku,
  shortDescription,
}) => {
  const handleToggleChannel = (channel: SalesChannel) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sales Channel Badges */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
          Kênh bán hàng kích hoạt đồng bộ
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(['website', 'shopee', 'tiktok', 'lazada'] as const).map((ch) => {
            const isChecked = channels.includes(ch);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => handleToggleChannel(ch)}
                className={`p-3 rounded-xl border text-xs font-semibold capitalize flex items-center justify-between transition-all cursor-pointer ${
                  isChecked
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span>{ch === 'website' ? 'Website Shop' : ch}</span>
                {isChecked && <Icons.Check size={14} className="text-indigo-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tiêu đề SEO (Meta Title)
          </label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={name || 'Tiêu đề hiển thị Google...'}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Mô tả SEO (Meta Description)
          </label>
          <textarea
            rows={2}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Mô tả tóm tắt chuẩn SEO..."
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Google SERP Live Simulation */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Xem trước kết quả tìm kiếm Google (SERP Preview)
          </span>
          <p className="text-sky-600 dark:text-sky-400 font-medium truncate text-sm">
            {seoTitle || name || 'Tên sản phẩm'} | NovaStore Official
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
            https://novastore.vn/products/{sku.toLowerCase()}
          </p>
          <div
            className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html:
                seoDescription ||
                shortDescription ||
                'Mua sản phẩm chính hãng với giá tốt nhất tại NovaStore. Giao hàng hỏa tốc và bảo hành chu đáo.',
            }}
          />
        </div>
      </div>
    </div>
  );
};
