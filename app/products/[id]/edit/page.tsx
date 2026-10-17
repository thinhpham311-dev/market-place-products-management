'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProduct } from '@/store/slices/productsSlice';
import { setActiveTab, showToast } from '@/store/slices/uiSlice';
import { Product } from '@/types/product';
import { ProductFormView } from '@/components/dashboard/ProductFormView';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const product = useAppSelector((s) => s.products.items.find((p) => p.id === id));
  const categories = useAppSelector((s) => s.categories.items);

  if (!product) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm max-w-xl mx-auto">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icons.Package size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy sản phẩm</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">Sản phẩm bạn muốn chỉnh sửa không tồn tại.</p>
        <Button variant="primary" size="sm" onClick={() => router.push('/')}>
          Quay về trang chủ
        </Button>
      </div>
    );
  }

  const handleSaveProduct = (productData: Partial<Product>) => {
    dispatch(updateProduct({ id: product.id, changes: productData }));
    dispatch(showToast(`Đã cập nhật sản phẩm "${productData.name}" thành công!`));
    dispatch(setActiveTab('products'));
    router.push('/products');
  };

  return (
    <ProductFormView
      onCancel={() => router.back()}
      onSave={handleSaveProduct}
      initialData={product}
      categories={categories}
    />
  );
}
