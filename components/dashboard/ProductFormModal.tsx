'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductVariant, ProductStatus } from '@/types/product';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  initialData?: Product | null;
  categories: ProductCategory[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'pricing' | 'variants' | 'inventory' | 'seo'>('basic');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Media
  const [thumbnail, setThumbnail] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Pricing
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);

  // Inventory
  const [stock, setStock] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<{ name: string; values: string[] }[]>([
    { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
  ]);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  // Channels & SEO
  const [channels, setChannels] = useState<('shopee' | 'tiktok' | 'lazada' | 'website')[]>(['website', 'shopee']);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Hydrate initial data when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSku(initialData.sku || '');
      setBarcode(initialData.barcode || '');
      setCategoryId(initialData.categoryId || categories[0]?.id || '');
      setBrand(initialData.brand || '');
      setShortDescription(initialData.shortDescription || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags || []);
      setThumbnail(initialData.thumbnail || '');
      setImages(initialData.images || []);
      setPrice(initialData.price || 0);
      setOriginalPrice(initialData.originalPrice || 0);
      setCostPrice(initialData.costPrice || 0);
      setStock(initialData.stock || 0);
      setLowStockThreshold(initialData.lowStockThreshold || 10);
      setWarehouseLocation(initialData.warehouseLocation || '');
      setStatus(initialData.status || 'active');
      setHasVariants(initialData.hasVariants || false);
      setVariantsList(initialData.variants || []);
      setChannels(initialData.channels || ['website']);
      setSeoTitle(initialData.seoTitle || initialData.name || '');
      setSeoDescription(initialData.seoDescription || initialData.shortDescription || '');
    } else {
      // Default reset for new product
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`893${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setCategoryId(categories[0]?.id || '');
      setBrand('');
      setShortDescription('');
      setDescription('');
      setTags(['Mới', 'Chính Hãng']);
      setThumbnail('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80');
      setImages([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      ]);
      setPrice(250000);
      setOriginalPrice(350000);
      setCostPrice(120000);
      setStock(50);
      setLowStockThreshold(10);
      setWarehouseLocation('KHO-HN-A01');
      setStatus('active');
      setHasVariants(false);
      setVariantsList([]);
      setChannels(['website', 'shopee', 'tiktok']);
      setSeoTitle('');
      setSeoDescription('');
    }
    setActiveTab('basic');
  }, [initialData, isOpen, categories]);

  // Calculate profit margin
  const profitMargin = price > 0 && costPrice > 0 ? Math.round(((price - costPrice) / price) * 100) : 0;
  const grossProfit = price - costPrice;

  // Add Tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Add gallery image
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  // Toggle channel
  const handleToggleChannel = (channel: 'shopee' | 'tiktok' | 'lazada' | 'website') => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  // Generate Variants Matrix
  const handleGenerateVariants = () => {
    const list: ProductVariant[] = [];
    if (variantOptions.length === 1) {
      variantOptions[0].values.forEach((v, idx) => {
        list.push({
          id: `var-${Date.now()}-${idx}`,
          sku: `${sku}-${v.toUpperCase().replace(/\s+/g, '')}`,
          name: v,
          options: { [variantOptions[0].name]: v },
          price: price || 100000,
          costPrice: costPrice || 50000,
          stock: Math.floor(stock / variantOptions[0].values.length) || 10,
        });
      });
    }
    setVariantsList(list);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSave();
  };

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSave('draft');
  };

  const handleProcessSave = (targetStatus?: ProductStatus) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên sản phẩm!');
      setActiveTab('basic');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);

    const finalStatus = targetStatus || status;

    const productPayload: Partial<Product> = {
      ...(initialData ? { id: initialData.id } : {}),
      name,
      sku: sku || `SKU-${Date.now()}`,
      barcode,
      category: selectedCategory?.name || 'Khác',
      categoryId,
      brand: brand || 'No Brand',
      shortDescription,
      description,
      tags,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      images: images.length > 0 ? images : [thumbnail],
      price: Number(price),
      originalPrice: Number(originalPrice) || undefined,
      costPrice: Number(costPrice) || 0,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      warehouseLocation,
      status: finalStatus,
      publishedAt: finalStatus === 'active' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : initialData?.publishedAt,
      hasVariants,
      variants: hasVariants ? variantsList : undefined,
      channels,
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || shortDescription,
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
      soldCount: initialData?.soldCount || 0,
      rating: initialData?.rating || 5.0,
      reviewCount: initialData?.reviewCount || 0,
      revenue: initialData?.revenue || 0,
    };

    onSave(productPayload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      description="Điền đầy đủ thông tin chi tiết để cập nhật lên các sàn thương mại điện tử"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Hủy bỏ
          </Button>
          <div className="flex items-center gap-2">
            {!initialData && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSubmitDraft}
              >
                Lưu bản nháp
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleProcessSave(initialData ? status : 'active')}
              leftIcon={<Icons.Rocket size={15} />}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
            >
              {initialData ? 'Lưu thay đổi' : 'Lưu & Xuất bản ngay'}
            </Button>
          </div>
        </div>
      }
    >
      {/* Form Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto custom-scrollbar">
        {[
          { id: 'basic', label: 'Thông tin chung', icon: Icons.Package },
          { id: 'media', label: 'Hình ảnh & Media', icon: Icons.ImageIcon },
          { id: 'pricing', label: 'Giá & Lợi nhuận', icon: Icons.DollarSign },
          { id: 'variants', label: 'Biến thể sản phẩm', icon: Icons.Layers },
          { id: 'inventory', label: 'Kho & Định mức', icon: Icons.Boxes },
          { id: 'seo', label: 'Kênh bán & SEO', icon: Icons.Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tên sản phẩm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Áo Polo Nam Phối Cổ Dệt Bo Cao Cấp..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mã SKU sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="VD: POLO-MEN-01"
                  className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mã vạch / Barcode (EAN/UPC)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="VD: 8936001234567"
                  className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Danh mục chính
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Thương hiệu (Brand)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="VD: NovaWear, Sony, DermaLab..."
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả ngắn gọn (Hiển thị đầu trang)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Tóm tắt 1-2 câu tính năng nổi bật..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả chi tiết sản phẩm
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thông tin chất liệu, hướng dẫn sử dụng, chính sách bảo hành..."
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Thẻ Tag tìm kiếm
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Nhập tag rồi ấn Enter..."
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white outline-none"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>
                  Thêm tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-500"
                    >
                      <Icons.X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA & IMAGES */}
        {activeTab === 'media' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Ảnh đại diện chính (Cover Thumbnail URL)
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Thumbnail Preview */}
            {thumbnail && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <img
                  src={thumbnail}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Ảnh bìa hiển thị</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tỷ lệ khuyến nghị 1:1, dung lượng dưới 2MB</p>
                </div>
              </div>
            )}

            {/* Gallery Images */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Bộ sưu tập ảnh phụ (Gallery)
              </label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Dán URL hình ảnh phụ..."
                  className="flex-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddImage} leftIcon={<Icons.Plus size={14} />}>
                  Thêm ảnh
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICING & PROFIT CALCULATOR */}
        {activeTab === 'pricing' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Giá bán ưu đãi (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Giá niêm yết gốc (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Giá vốn nhập kho (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Live Profit Margin Calculator Widget */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-1.5">
                <Icons.BarChart3 size={16} />
                Ước tính Tỷ suất Lợi nhuận gộp
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Lãi gộp / sản phẩm</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grossProfit)}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Biên lợi nhuận</span>
                  <span
                    className={`text-sm font-bold mt-0.5 block ${
                      profitMargin > 30 ? 'text-emerald-600' : profitMargin > 15 ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  >
                    {profitMargin}%
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Mức giảm giá</span>
                  <span className="text-sm font-bold text-rose-600 mt-0.5 block">
                    {originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% off` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VARIANTS */}
        {activeTab === 'variants' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Sản phẩm có nhiều biến thể phân loại?
                </h4>
                <p className="text-[11px] text-slate-500">
                  Áp dụng khi sản phẩm có nhiều Size, Màu sắc, Switch...
                </p>
              </div>
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {hasVariants && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ma trận biến thể ({variantsList.length} phân loại)
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateVariants}
                    leftIcon={<Icons.RefreshCw size={13} />}
                  >
                    Sinh biến thể mẫu
                  </Button>
                </div>

                {variantsList.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5">Phân loại</th>
                          <th className="p-2.5">SKU Biến thể</th>
                          <th className="p-2.5">Giá bán</th>
                          <th className="p-2.5">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {variantsList.map((v, i) => (
                          <tr key={v.id || i}>
                            <td className="p-2.5 font-medium text-slate-900 dark:text-white">{v.name}</td>
                            <td className="p-2.5 font-mono text-slate-500">{v.sku}</td>
                            <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('vi-VN').format(v.price)} đ
                            </td>
                            <td className="p-2.5 text-emerald-600 font-bold">{v.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Nhấn &quot;Sinh biến thể mẫu&quot; để thiết lập nhanh danh sách phân loại.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng tồn kho ban đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ngưỡng cảnh báo sắp hết hàng
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vị trí lưu kho / Kệ hàng
                </label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="VD: KHO-HN-A12..."
                  className="w-full text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái sản phẩm
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                >
                  <option value="active">Đang bán (Active)</option>
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="archived">Tạm ẩn (Archived)</option>
                  <option value="out_of_stock">Hết hàng (Out of stock)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SEO & SALES CHANNELS */}
        {activeTab === 'seo' && (
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
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 line-clamp-2">
                  {seoDescription || shortDescription || 'Mua sản phẩm chính hãng với giá tốt nhất tại NovaStore. Giao hàng hỏa tốc và bảo hành chu đáo.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
