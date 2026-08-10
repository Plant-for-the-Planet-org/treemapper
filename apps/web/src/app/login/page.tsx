import { Suspense } from 'react';
import LoginContent from './components/LoginContent';


export default function LoginPage() {
  return (
    // TODO: replace fallback={null} with a login skeleton
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
