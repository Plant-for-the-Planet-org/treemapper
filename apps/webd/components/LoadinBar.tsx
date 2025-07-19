// components/LoadingBar.js
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const LoadingBar = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let progressInterval;
    let timeoutId;

    const handleStart = () => {
      setLoading(true);
      setProgress(0);
      
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
    };

    const handleComplete = () => {
      setProgress(100);
      timeoutId = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    // Listen for route changes
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleStart();
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      handleStart();
      return originalReplace.apply(router, args);
    };

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  // Complete loading when pathname changes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [pathname, loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div
        className="h-1 bg-blue-500 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      />
    </div>
  );
};

export default LoadingBar;