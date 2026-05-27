"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to /select-workspace.
export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/select-workspace'); }, [router]);
  return null;
}
