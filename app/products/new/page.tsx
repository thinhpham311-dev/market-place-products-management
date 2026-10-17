'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addProduct } from '@/store/slices/productsSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { Product } from '@/types/product';
import { ProductFormView } from '@/components/dashboard/ProductFormView';

export default function NewProductPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.items);

  const handleSaveProduct = (productData: Partial<Product>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    } as Product;
    dispatch(addProduct(newProduct));

    if (newProduct.status === 'active') {
      dispatch(showToast(`Đã tạo và xuất bản sản phẩm "${newProduct.name}" thành công!`));
    } else {
      dispatch(showToast(`Đã lưu bản nháp sản phẩm "${newProduct.name}".`));
    }
    dispatch(setActiveTab('products'));
    router.push('/products');
  };

  return (
    <ProductFormView
      onCancel={() => router.back()}
      onSave={handleSaveProduct}
      categories={categories}
    />
  );
}
