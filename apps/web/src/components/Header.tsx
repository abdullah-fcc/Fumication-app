'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from '@/components/icons';
import { getStoredUser, clearAuth, type AuthUser } from '@/lib/auth';

export default function Header({ title }: { title?: string }) {
  const router = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function logout() {
    clearAuth();
    router.push('/login');
  }

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
      {title && (
        <p className="text-sm font-semibold text-gray-500 hidden sm:block">{title}</p>
      )}
      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.name ?? '—'}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role ?? ''}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {menuOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p className="text-xs font-medium text-indigo-600 capitalize mt-0.5">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
