"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Profile moved to /profile.
export default function ProfileRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/profile'); }, [router]);
  return null;
}
