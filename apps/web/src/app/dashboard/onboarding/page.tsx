"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to /onboard.
export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/onboard'); }, [router]);
  return null;
}
