'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Product,
  ProductCategory,
  ProductVariant,
  ProductStatus,
  SpuProductAttributes,
  SpuSkuItem,
  SpuVariationGroup,
} from '@/types/product';
import {
  EXAMPLE_CREATE_SPU_PAYLOAD,
  buildCreateSpuPayload,
} from '@/services/ProductService';
import { safeExtractString } from '@/services/CategoryService';
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
  onSave: (product: Partial<Product>) => void | Promise<void>;
  initialData?: Product | null;
  categories: ProductCategory[];
  isSubmitting?: boolean;
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  onCancel,
  onSave,
  initialData,
  categories,
  isSubmitting = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [internalSaving, setInternalSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isBusy = isSubmitting || internalSaving;

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

  const activeCategories = useMemo(
    () => categories.filter((c) => c.category_active === true),
    [categories]
  );

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(
    activeCategories[0]?.id || ''
  );
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

  // Variants & SPU / SKU schema
  const [hasVariants, setHasVariants] = useState(true);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [productCategoryList, setProductCategoryList] = useState<string[]>(
    EXAMPLE_CREATE_SPU_PAYLOAD.product_category
  );
  const [productAttributes, setProductAttributes] = useState<SpuProductAttributes>(
    initialData?.product_attributes || {
      attribute_id: 200000,
      attribute_value: [],
      items: [],
    }
  );
  const [productVariations, setProductVariations] = useState<SpuVariationGroup[]>(
    EXAMPLE_CREATE_SPU_PAYLOAD.product_variations
  );
  const [skuList, setSkuList] = useState<SpuSkuItem[]>(
    EXAMPLE_CREATE_SPU_PAYLOAD.sku_list
  );
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Channels & SEO
  const [channels, setChannels] = useState<('shopee' | 'tiktok' | 'lazada' | 'website')[]>(['website', 'shopee']);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const applyExampleSpuData = useCallback(() => {
    setName(EXAMPLE_CREATE_SPU_PAYLOAD.product_name);
    setSku(`SPU-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode(`893${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    const firstActive = categories.find((c) => c.category_active === true) || categories[0];
    const defaultCatId = safeExtractString(firstActive?.id, '');
    setCategoryId(defaultCatId);
    setBrand(EXAMPLE_CREATE_SPU_PAYLOAD.product_brand);
    setShortDescription('New Jeans Notification 2 - SPU Product');
    setDescription(EXAMPLE_CREATE_SPU_PAYLOAD.product_description);
    setTags(['Mới', 'SPU']);
    setThumbnail(EXAMPLE_CREATE_SPU_PAYLOAD.product_thumb);
    setImages([
      'https://res.cloudinary.com/dgincjt1i/image/upload/v1751873400/Image-not-found_qxnjwm.png',
    ]);
    setPrice(EXAMPLE_CREATE_SPU_PAYLOAD.product_price);
    setOriginalPrice(65);
    setCostPrice(35);
    setStock(
      EXAMPLE_CREATE_SPU_PAYLOAD.sku_list.reduce((sum, item) => sum + item.sku_stock, 0)
    );
    setLowStockThreshold(10);
    setWarehouseLocation('KHO-HN-A01');
    setStatus('active');
    setHasVariants(true);
    setProductCategoryList(defaultCatId ? [defaultCatId] : []);
    setProductAttributes(EXAMPLE_CREATE_SPU_PAYLOAD.product_attributes);
    setProductVariations(EXAMPLE_CREATE_SPU_PAYLOAD.product_variations);
    setSkuList(EXAMPLE_CREATE_SPU_PAYLOAD.sku_list);
    setChannels(['website', 'shopee', 'tiktok']);
    setSeoTitle(EXAMPLE_CREATE_SPU_PAYLOAD.product_name);
    setSeoDescription('New Jeans Notification 2');
  }, [categories]);

  // Auto-select first active category when activeCategories finishes loading
  useEffect(() => {
    if (!initialData && activeCategories.length > 0) {
      const existsInActive = activeCategories.some((c) => c.id === categoryId);
      if (!categoryId || !existsInActive) {
        setCategoryId(activeCategories[0].id);
      }
    }
  }, [initialData, activeCategories, categoryId]);

  // Hydrate initial data when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSku(initialData.sku || '');
      setBarcode(initialData.barcode || '');
      setCategoryId(initialData.categoryId || categories[0]?.id || '');
      setBrand(initialData.product_brand || initialData.brand || '');
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
      setHasVariants(initialData.hasVariants ?? true);
      setVariantsList(initialData.variants || []);
      const rawProductCategory =
        initialData.product_category || EXAMPLE_CREATE_SPU_PAYLOAD.product_category;
      const cleanProductCategory = Array.isArray(rawProductCategory)
        ? rawProductCategory
            .map((item) => {
              if (typeof item === 'object' && item !== null) {
                return (item as any).id || (item as any)._id || (item as any).name || '';
              }
              const s = String(item).trim();
              return s === '[object Object]' ? '' : s;
            })
            .filter((s): s is string => Boolean(s && s !== '[object Object]'))
        : [];
      setProductCategoryList(cleanProductCategory);
      setProductAttributes(
        initialData.product_attributes || {
          attribute_id: 200000,
          attribute_value: [],
          items: [],
        }
      );
      setProductVariations(
        initialData.product_variations || EXAMPLE_CREATE_SPU_PAYLOAD.product_variations
      );
      setSkuList(initialData.sku_list || EXAMPLE_CREATE_SPU_PAYLOAD.sku_list);
      setChannels(initialData.channels || ['website']);
      setSeoTitle(initialData.seoTitle || initialData.name || '');
      setSeoDescription(initialData.seoDescription || initialData.shortDescription || '');
    } else {
      applyExampleSpuData();
    }
  }, [initialData, categories, applyExampleSpuData]);

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setActiveTab('basic');
    }
  }, [searchParams, setActiveTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleProcessSave();
  };

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    void handleProcessSave('draft');
  };

  const handleProcessSave = async (targetStatus?: ProductStatus) => {
    if (isBusy) return;
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên sản phẩm trước khi lưu!');
      setActiveTab('basic');
      return;
    }

    setFormError(null);
    const selectedCategory = categories.find((c) => c.id === categoryId);
    const finalStatus = targetStatus || status;

    const resolvedName = safeExtractString(name, 'Sản phẩm mới').trim();
    const resolvedCategory = safeExtractString(selectedCategory?.name, 'Khác');
    const resolvedCategoryId = safeExtractString(categoryId, 'cat-1');
    const resolvedBrand = safeExtractString(brand, 'NovaShop');

    const cleanCategoryList = productCategoryList
      .map((c) => {
        if (typeof c === 'object' && c !== null) {
          return (c as any).id || (c as any)._id || (c as any).name || '';
        }
        const s = String(c).trim();
        return s === '[object Object]' ? '' : s;
      })
      .filter((s): s is string => Boolean(s && s !== '[object Object]'));

    const finalCategoryList =
      cleanCategoryList.length > 0
        ? cleanCategoryList
        : resolvedCategoryId && resolvedCategoryId !== 'cat-1'
          ? [resolvedCategoryId]
          : [];

    const productPayload: Partial<Product> = {
      ...(initialData ? { id: initialData.id } : {}),
      name: resolvedName,
      sku: sku || `SKU-${Date.now()}`,
      barcode,
      category: resolvedCategory,
      categoryId: resolvedCategoryId,
      brand: resolvedBrand,
      shortDescription: safeExtractString(shortDescription, ''),
      description: safeExtractString(description, ''),
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
      variantAttributes: productVariations.map((g) => ({
        name: safeExtractString(g.label, 'Phân loại'),
        values: g.value.map((v) => safeExtractString(v.label || v.value, '')),
      })),
      product_brand: resolvedBrand,
      product_category: finalCategoryList,
      product_attributes: productAttributes,
      product_variations: productVariations,
      sku_list: skuList,
      channels,
      seoTitle: seoTitle || resolvedName,
      seoDescription: seoDescription || shortDescription,
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
      soldCount: initialData?.soldCount || 0,
      rating: initialData?.rating || 5.0,
      reviewCount: initialData?.reviewCount || 0,
      revenue: initialData?.revenue || 0,
    };

    try {
      setInternalSaving(true);
      await onSave(productPayload);
    } finally {
      setInternalSaving(false);
    }
  };

  const liveSpuPayload = useMemo(
    () =>
      buildCreateSpuPayload({
        name,
        thumbnail,
        description,
        shortDescription,
        price,
        brand,
        categoryId,
        product_brand: brand,
        product_category: productCategoryList.filter(
          (c) => Boolean(c && typeof c === 'string' && c !== '[object Object]')
        ),
        product_attributes: productAttributes,
        product_variations: productVariations,
        sku_list: skuList,
        stock,
      }),
    [
      name,
      thumbnail,
      description,
      shortDescription,
      price,
      brand,
      categoryId,
      productCategoryList,
      productAttributes,
      productVariations,
      skuList,
      stock,
    ]
  );

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
              {initialData ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới (Create SPU)'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {initialData ? (
                <>
                  Cập nhật thông tin SPU &amp; SKU gửi tới{' '}
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">
                    /v1/api/product/spu/update/{initialData.product_id || initialData.id}
                  </code>
                </>
              ) : (
                <>
                  Điền thông tin SPU &amp; SKU chuẩn để gửi tới{' '}
                  <code className="font-mono text-indigo-600 dark:text-indigo-400">
                    /v1/api/product/spu/create
                  </code>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!initialData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyExampleSpuData}
              disabled={isBusy}
              leftIcon={<Icons.RefreshCw size={14} />}
            >
              Nạp JSON mẫu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isBusy}>
            Hủy bỏ
          </Button>
          {!initialData && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSubmitDraft}
              disabled={isBusy}
              isLoading={isBusy && status === 'draft'}
            >
              Lưu bản nháp
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleProcessSave(initialData ? status : 'active')}
            disabled={isBusy}
            isLoading={isBusy}
            leftIcon={<Icons.Rocket size={15} />}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-none border-transparent"
          >
            {initialData ? 'Lưu thay đổi' : 'Lưu & Xuất bản ngay'}
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
          <Icons.AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{formError}</span>
        </div>
      )}

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
              categories={activeCategories}
              brand={brand}
              setBrand={setBrand}
              shortDescription={shortDescription}
              setShortDescription={setShortDescription}
              description={description}
              setDescription={setDescription}
              tags={tags}
              setTags={setTags}
              productCategoryList={productCategoryList}
              setProductCategoryList={setProductCategoryList}
              productAttributes={productAttributes}
              setProductAttributes={setProductAttributes}
              isEdit={Boolean(initialData)}
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
              productVariations={productVariations}
              setProductVariations={setProductVariations}
              skuList={skuList}
              setSkuList={setSkuList}
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

        {/* Live SPU JSON Payload Preview */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowJsonPreview((prev) => !prev)}
            className="flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-mono">
              <Icons.Layers size={14} className="text-indigo-500" />
              {initialData
                ? `PATCH /v1/api/product/spu/update/${initialData.product_id || initialData.id} — Xem trước Request Body JSON (${skuList.length} SKUs)`
                : `POST /v1/api/product/spu/create — Xem trước Request Body JSON (${skuList.length} SKUs)`}
            </span>
            <Icons.ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 ${
                showJsonPreview ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showJsonPreview && (
            <pre className="mt-2.5 p-4 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-96 custom-scrollbar border border-slate-800">
              {JSON.stringify(liveSpuPayload, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
