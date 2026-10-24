'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addProduct } from '@/store/slices/productsSlice';
import { setCategories } from '@/store/slices/categoriesSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
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

      const newProduct: Product = {
        ...(productData as Product),
        ...(mappedFromApi || {}),
        id: mappedFromApi?.id || `prod-${Date.now()}`,
        name: mappedFromApi?.name || productData.name || 'Sản phẩm mới',
        price: mappedFromApi?.price ?? Number(productData.price ?? 0),
        originalPrice: productData.originalPrice,
        costPrice: productData.costPrice ?? mappedFromApi?.costPrice ?? 0,
        stock: mappedFromApi?.stock ?? Number(productData.stock ?? 0),
        category: productData.category || mappedFromApi?.category || 'Khác',
        categoryId: productData.categoryId || mappedFromApi?.categoryId || 'cat-1',
        brand: productData.brand || mappedFromApi?.brand || 'NovaShop',
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
            `Đã tạo sản phẩm "${newProduct.name}" thành công (/v1/api/product/spu/create)!`
          )
        );
      } else {
        dispatch(
          showToast(
            `Đã lưu bản nháp "${newProduct.name}" thành công (/v1/api/product/spu/create)!`
          )
        );
      }

      dispatch(setActiveTab('products'));
      router.push(
        newProduct.status === 'draft' ? '/products?tab=draft' : '/products?tab=all'
      );
    } catch (err: unknown) {
      const errMessage =
        (err as { message?: string })?.message ||
        'Không thể tạo sản phẩm qua API (/v1/api/product/spu/create). Vui lòng thử lại.';
      dispatch(showToast(errMessage));
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
