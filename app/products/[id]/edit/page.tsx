'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setDraftedProducts,
  setPublishedProducts,
  updateProduct,
} from '@/store/slices/productsSlice';
import { setCategories } from '@/store/slices/categoriesSlice';
import { setActiveTab, showErrorToast, showToast } from '@/store/slices/uiSlice';
import { getApiErrorMessage } from '@/lib/http/handleAxiosError';
import {
  apiGetDraftedSpuList,
  apiGetPublishedSpuList,
  apiUpdateSpu,
  buildUpdateSpuPayload,
  extractSpuArray,
  extractUpdatedSpu,
  mapSpuToProduct,
} from '@/services/ProductService';
import {
  apiGetCategoryAllList,
  extractCategoryArray,
  mapRawCategoryList,
} from '@/services/CategoryService';
import { Product } from '@/types/product';
import { ProductFormView } from '@/components/dashboard/ProductFormView';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const product = useAppSelector((s) =>
    s.products.items.find(
      (p) =>
        p.id === id ||
        p.product_id === id ||
        p.spu_id === id ||
        p.sku === id
    )
  );
  const categories = useAppSelector((s) => s.categories.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Fetch categories if not yet in store
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

  // Fetch products if user opened URL directly or refreshed
  useEffect(() => {
    if (product) return;
    let cancelled = false;
    setIsLoadingProduct(true);

    Promise.allSettled([apiGetPublishedSpuList(), apiGetDraftedSpuList()])
      .then(([publishedRes, draftedRes]) => {
        if (cancelled) return;
        if (publishedRes.status === 'fulfilled') {
          const rawPublished = extractSpuArray(publishedRes.value.data);
          if (Array.isArray(rawPublished)) {
            dispatch(
              setPublishedProducts(
                rawPublished.map((item, idx) => mapSpuToProduct(item, idx, 'active'))
              )
            );
          }
        }
        if (draftedRes.status === 'fulfilled') {
          const rawDrafted = extractSpuArray(draftedRes.value.data);
          if (Array.isArray(rawDrafted)) {
            dispatch(
              setDraftedProducts(
                rawDrafted.map((item, idx) => mapSpuToProduct(item, idx, 'draft'))
              )
            );
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProduct(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product, dispatch]);

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!product) return;
    setIsSubmitting(true);
    const targetStatus = productData.status || product.status || 'active';

    try {
      const mergedProduct = {
        ...product,
        ...productData,
      };

      const spuPayload = buildUpdateSpuPayload(mergedProduct);
      const targetId = String(
        product.product_id ||
          product.spu_id ||
          product.id ||
          product.sku ||
          id
      ).trim();

      const res = await apiUpdateSpu(targetId, spuPayload);
      const rawUpdatedSpu = extractUpdatedSpu(res.data);

      const mappedFromApi = rawUpdatedSpu
        ? mapSpuToProduct(rawUpdatedSpu, 0, targetStatus)
        : null;

      const updatedChanges: Partial<Product> = {
        ...productData,
        ...(mappedFromApi || {}),
        status: targetStatus,
      };

      dispatch(updateProduct({ id: product.id, changes: updatedChanges }));
      dispatch(
        showToast(
          `Đã cập nhật sản phẩm "${productData.name || product.name}" thành công (/v1/api/product/spu/update)!`
        )
      );

      // Re-fetch in background to keep store fully consistent with backend
      void Promise.allSettled([apiGetPublishedSpuList(), apiGetDraftedSpuList()]).then(
        ([publishedRes, draftedRes]) => {
          if (publishedRes.status === 'fulfilled') {
            const rawPublished = extractSpuArray(publishedRes.value.data);
            if (Array.isArray(rawPublished)) {
              dispatch(
                setPublishedProducts(
                  rawPublished.map((item, idx) => mapSpuToProduct(item, idx, 'active'))
                )
              );
            }
          }
          if (draftedRes.status === 'fulfilled') {
            const rawDrafted = extractSpuArray(draftedRes.value.data);
            if (Array.isArray(rawDrafted)) {
              dispatch(
                setDraftedProducts(
                  rawDrafted.map((item, idx) => mapSpuToProduct(item, idx, 'draft'))
                )
              );
            }
          }
        }
      );

      dispatch(setActiveTab('products'));
      router.push('/products');
    } catch (error: unknown) {
      dispatch(showErrorToast(getApiErrorMessage(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    if (isLoadingProduct) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto animate-pulse">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.RefreshCw size={28} className="animate-spin text-indigo-500" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Đang tải dữ liệu sản phẩm...
          </h2>
          <p className="text-xs text-slate-500 mt-1">Vui lòng đợi trong giây lát.</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.Package size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Không tìm thấy sản phẩm
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Sản phẩm bạn muốn chỉnh sửa không tồn tại.
        </p>
        <Button variant="primary" size="sm" onClick={() => router.push('/products')}>
          Quay về danh sách sản phẩm
        </Button>
      </div>
    );
  }

  return (
    <ProductFormView
      onCancel={() => router.back()}
      onSave={handleSaveProduct}
      initialData={product}
      categories={categories}
      isSubmitting={isSubmitting}
    />
  );
}
