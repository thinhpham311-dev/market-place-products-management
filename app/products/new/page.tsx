'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addProduct } from '@/store/slices/productsSlice';
import { setCategories } from '@/store/slices/categoriesSlice';
import { setActiveTab, showToast, showErrorToast } from '@/store/slices/uiSlice';
import { getApiErrorMessage } from '@/lib/http/handleAxiosError';
import {
  apiCreateSpu,
  buildCreateSpuPayload,
  extractCreatedSpu,
  mapSpuToProduct,
} from '@/services/ProductService';
import {
  apiGetCategoryAllList,
  extractCategoryArray,
  mapRawCategoryList,
  safeExtractString,
} from '@/services/CategoryService';
import { Product } from '@/types/product';
import { ProductFormView } from '@/components/dashboard/ProductFormView';

export default function NewProductPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0) return;
    let cancelled = false;
    apiGetCategoryAllList()
      .then((res) => {
        if (cancelled) return;
        const raw = extractCategoryArray(res.data);
        if (Array.isArray(raw)) {
          dispatch(setCategories(mapRawCategoryList(raw)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [categories.length, dispatch]);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    setIsSubmitting(true);
    const targetStatus = productData.status || 'active';

    try {
      const spuPayload = buildCreateSpuPayload(productData);
      const res = await apiCreateSpu(spuPayload);
      const rawCreatedSpu = extractCreatedSpu(res.data);

      const mappedFromApi = rawCreatedSpu
        ? mapSpuToProduct(rawCreatedSpu, 0, targetStatus)
        : null;

      const resolvedName =
        safeExtractString(mappedFromApi?.name || productData.name, 'Sản phẩm mới').trim() ||
        'Sản phẩm mới';
      const resolvedCategory =
        safeExtractString(productData.category || mappedFromApi?.category, 'Chưa phân loại').trim() ||
        'Chưa phân loại';
      const resolvedCategoryId =
        safeExtractString(productData.categoryId || mappedFromApi?.categoryId, 'cat-1').trim() ||
        'cat-1';
      const resolvedBrand =
        safeExtractString(productData.brand || mappedFromApi?.brand, 'NovaShop').trim() ||
        'NovaShop';

      const newProduct: Product = {
        ...(productData as Product),
        ...(mappedFromApi || {}),
        id: mappedFromApi?.id || `prod-${Date.now()}`,
        name: resolvedName,
        price: mappedFromApi?.price ?? Number(productData.price ?? 0),
        originalPrice: productData.originalPrice,
        costPrice: productData.costPrice ?? mappedFromApi?.costPrice ?? 0,
        stock: mappedFromApi?.stock ?? Number(productData.stock ?? 0),
        category: resolvedCategory,
        categoryId: resolvedCategoryId,
        brand: resolvedBrand,
        status: targetStatus,
        channels: productData.channels || mappedFromApi?.channels || ['website'],
        tags: productData.tags || mappedFromApi?.tags || [],
        variants: productData.variants,
        hasVariants: Boolean(productData.hasVariants),
      };

      dispatch(addProduct(newProduct));

      if (newProduct.status === 'active') {
        dispatch(
          showToast(
            `Đã tạo sản phẩm "${resolvedName}" thành công (/v1/api/product/spu/create)!`
          )
        );
      } else {
        dispatch(
          showToast(
            `Đã lưu bản nháp "${resolvedName}" thành công (/v1/api/product/spu/create)!`
          )
        );
      }

      dispatch(setActiveTab('products'));
      router.push(
        newProduct.status === 'draft' ? '/products?tab=draft' : '/products?tab=all'
      );
    } catch (err: unknown) {
      const errMessage = getApiErrorMessage(
        err,
        'Không thể tạo sản phẩm qua API (/v1/api/product/spu/create). Vui lòng thử lại.'
      );
      dispatch(showErrorToast(errMessage));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProductFormView
      onCancel={() => router.back()}
      onSave={handleSaveProduct}
      categories={categories}
      isSubmitting={isSubmitting}
    />
  );
}
