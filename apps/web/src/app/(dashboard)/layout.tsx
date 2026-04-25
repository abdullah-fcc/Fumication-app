'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getToken, getStoredUser } from '@/lib/auth';
import { canAccess } from '@/lib/rbac';

const pageTitles: Record<string, string> = {
  '/':          'Dashboard',
  '/jobs':      'Jobs',
  '/workers':   'Workers',
  '/inventory': 'Inventory',
  '/reports':   'Reports',
};

type GuardState = 'loading' | 'ready' | 'redirect';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>('loading');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check route-level permission
    if (!canAccess(user.role, pathname)) {
      router.replace('/unauthorized');
      return;
    }

    setState('ready');
  }, [pathname, router]);

  if (state !== 'ready') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-16 min-w-0">
        <Header title={pageTitles[pathname]} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
