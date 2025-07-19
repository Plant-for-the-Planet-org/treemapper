import { Suspense } from 'react';
import LoginContent from './LoginContent';
import { TreePine } from 'lucide-react';

function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-2xl mx-auto shadow-lg animate-pulse">
          <TreePine className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600">Loading TreeMapper...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}