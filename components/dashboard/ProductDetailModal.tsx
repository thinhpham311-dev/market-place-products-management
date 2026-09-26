'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeImage, setActiveImage] = useState<string>('');

  if (!product) return null;

  const currentImage = activeImage || product.thumbnail;
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết sản phẩm"
      description={`Mã SKU: ${product.sku}`}
      maxWidth="3xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            leftIcon={<Icons.Edit2 size={15} />}
          >
            Chỉnh sửa thông tin
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Images & Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    currentImage === img
                      ? 'border-indigo-600 scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Stats */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge status={product.status} />
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {product.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-slate-500 mt-1">
                Thương hiệu: <strong className="text-slate-700 dark:text-slate-300">{product.brand}</strong>
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500">
              <div>
                Giá vốn: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(product.costPrice)}</strong>
              </div>
              <div>
                Lãi gộp: <strong className="text-emerald-600">{formatCurrency(product.price - product.costPrice)}</strong>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 block text-[11px]">Tồn kho thực tế</span>
              <span className={`text-base font-bold mt-0.5 block ${product.stock <= product.lowStockThreshold ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                {product.stock} cái
              </span>
              <span className="text-[10px] text-slate-400">Vị trí: {product.warehouseLocation || 'Kho tổng'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 block text-[11px]">Doanh số đã bán</span>
              <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">
                {product.soldCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Doanh thu: {formatCurrency(product.revenue)}</span>
            </div>
          </div>

          {/* Variants preview if available */}
          {product.hasVariants && product.variants && product.variants.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phân loại biến thể ({product.variants.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {v.name} ({v.stock} tồn)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Mô tả chi tiết:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
