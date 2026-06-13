'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, LayoutDashboard, Briefcase,
  Users, Package, FileText, MapPin,
} from '@/components/icons';
import { getStoredUser } from '@/lib/auth';
import { getNavItemsForRole } from '@/lib/rbac';
import type { LucideProps } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard,
  Briefcase,
  Users,
  MapPin,
  Package,
  FileText,
};

export default function Sidebar() {
  const pathname = usePathname();
  const user     = getStoredUser();
  const navItems = user ? getNavItemsForRole(user.role) : [];

  return (
    <>
      {/* Desktop/tablet: left icon rail */}
      <aside className="hidden sm:flex w-16 bg-white border-r border-gray-200 flex-col h-full fixed left-0 top-0 z-40 select-none">

        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-4 overflow-hidden">
          {navItems.map(({ href, label, iconName }) => {
            const Icon   = iconMap[iconName];
            const active = pathname === href;

            return (
              // Tooltip wrapper — shows label on hover via CSS only
              <div key={href} className="relative group w-full flex justify-center">
                <Link
                  href={href}
                  title={label}
                  className={[
                    'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150',
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                  ].join(' ')}
                >
                  {Icon && <Icon size={18} strokeWidth={active ? 2.5 : 2} />}
                </Link>

                {/* Floating label tooltip */}
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {label}
                  {/* Arrow */}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom spacer */}
        <div className="h-14 border-t border-gray-100" />
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around h-14 select-none">
        {navItems.map(({ href, label, iconName }) => {
          const Icon   = iconMap[iconName];
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors',
                active ? 'text-indigo-600' : 'text-gray-400',
              ].join(' ')}
            >
              {Icon && <Icon size={18} strokeWidth={active ? 2.5 : 2} />}
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
