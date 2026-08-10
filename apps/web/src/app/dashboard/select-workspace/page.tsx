"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to /onboard?flow=add-project.
export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/onboard?flow=add-project'); }, [router]);
  return null;
}
