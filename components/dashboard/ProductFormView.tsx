'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductCategory, ProductVariant, ProductStatus } from '@/types/product';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { BasicInfoTab } from './product-form/BasicInfoTab';
import { MediaTab } from './product-form/MediaTab';
import { PricingTab } from './product-form/PricingTab';
import { VariantsTab } from './product-form/VariantsTab';
import { InventoryTab } from './product-form/InventoryTab';
import { SeoChannelsTab } from './product-form/SeoChannelsTab';

export type FormTab = 'basic' | 'media' | 'pricing' | 'variants' | 'inventory' | 'seo';
const VALID_FORM_TABS: FormTab[] = ['basic', 'media', 'pricing', 'variants', 'inventory', 'seo'];

interface ProductFormViewProps {
  onCancel: () => void;
  onSave: (product: Partial<Product>) => void;
  initialData?: Product | null;
  categories: ProductCategory[];
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  onCancel,
  onSave,
  initialData,
  categories,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as FormTab | null;
  const activeTab: FormTab = tabParam && VALID_FORM_TABS.includes(tabParam) ? tabParam : 'basic';

  const setActiveTab = useCallback(
    (tab: FormTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Media
  const [thumbnail, setThumbnail] = useState('');
  const [images, setImages] = useState<string[]>([]);

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
  }, [initialData, categories]);

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setActiveTab('basic');
    }
  }, [searchParams, setActiveTab]);

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
      publishedAt:
        finalStatus === 'active'
          ? new Date().toISOString().slice(0, 16).replace('T', ' ')
          : initialData?.publishedAt,
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
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header & Back Navigation (Sticky below Header) */}
      <div className="sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mx-2 px-2 border-b border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="mt-0.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Quay lại"
          >
            <Icons.ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Điền đầy đủ thông tin chi tiết để cập nhật lên các sàn thương mại điện tử
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Hủy bỏ
          </Button>
          {!initialData && (
            <Button type="button" variant="secondary" size="sm" onClick={handleSubmitDraft}>
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

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6">
        {/* Form Navigation Tabs */}
        <div className="sticky top-[8.25rem] z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-1 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto custom-scrollbar">
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
                onClick={() => setActiveTab(tab.id as FormTab)}
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
          {activeTab === 'basic' && (
            <BasicInfoTab
              name={name}
              setName={setName}
              sku={sku}
              setSku={setSku}
              barcode={barcode}
              setBarcode={setBarcode}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              categories={categories}
              brand={brand}
              setBrand={setBrand}
              shortDescription={shortDescription}
              setShortDescription={setShortDescription}
              description={description}
              setDescription={setDescription}
              tags={tags}
              setTags={setTags}
            />
          )}

          {activeTab === 'media' && (
            <MediaTab
              thumbnail={thumbnail}
              setThumbnail={setThumbnail}
              images={images}
              setImages={setImages}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingTab
              price={price}
              setPrice={setPrice}
              originalPrice={originalPrice}
              setOriginalPrice={setOriginalPrice}
              costPrice={costPrice}
              setCostPrice={setCostPrice}
            />
          )}

          {activeTab === 'variants' && (
            <VariantsTab
              hasVariants={hasVariants}
              setHasVariants={setHasVariants}
              variantsList={variantsList}
              setVariantsList={setVariantsList}
              sku={sku}
              price={price}
              costPrice={costPrice}
              stock={stock}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              stock={stock}
              setStock={setStock}
              lowStockThreshold={lowStockThreshold}
              setLowStockThreshold={setLowStockThreshold}
              warehouseLocation={warehouseLocation}
              setWarehouseLocation={setWarehouseLocation}
              status={status}
              setStatus={setStatus}
            />
          )}

          {activeTab === 'seo' && (
            <SeoChannelsTab
              channels={channels}
              setChannels={setChannels}
              seoTitle={seoTitle}
              setSeoTitle={setSeoTitle}
              seoDescription={seoDescription}
              setSeoDescription={setSeoDescription}
              name={name}
              sku={sku}
              shortDescription={shortDescription}
            />
          )}
        </form>
      </div>
    </div>
  );
};
