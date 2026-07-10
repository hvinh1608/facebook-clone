'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import LayoutContent with ssr: false
const SafeLayout = dynamic(() => import('./LayoutContent'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a]" />
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SafeLayout>{children}</SafeLayout>;
}
