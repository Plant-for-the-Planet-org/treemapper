import { Suspense } from 'react';
import ProductPage from '@/component/product/ProductPage';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <ProductPage />
    </Suspense>
  );
}
