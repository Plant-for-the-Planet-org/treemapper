"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to /create-project.
export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/create-project'); }, [router]);
  return null;
}
