import { Suspense } from 'react';
import ProductPagePreview from './ProductPagePreview';

// Internal preview of the TreeMapper product page. The page itself is still a
// POC, so it lives here behind a Plant-for-the-Planet sign-in instead of at
// /login, which keeps serving the real login screen.
export default function ProductPagePreviewRoute() {
  return (
    <Suspense fallback={null}>
      <ProductPagePreview />
    </Suspense>
  );
}
