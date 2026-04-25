import type { Role } from './auth';

// Central definition of what each role can access.
// Add a route here when you add a new page.
const rolePermissions: Record<Role, string[]> = {
  admin:   ['/', '/jobs', '/workers', '/inventory', '/reports'],
  manager: ['/', '/jobs', '/workers', '/inventory', '/reports'],
  worker:  ['/', '/jobs', '/reports'],
  client:  ['/reports'],
};

export function canAccess(role: Role, pathname: string): boolean {
  return rolePermissions[role]?.includes(pathname) ?? false;
}

export function getAllowedRoutes(role: Role): string[] {
  return rolePermissions[role] ?? [];
}

// Labels shown in the sidebar for each route
export interface NavItem {
  href: string;
  label: string;
  iconName: string;
}

const allNavItems: NavItem[] = [
  { href: '/',          label: 'Dashboard',  iconName: 'LayoutDashboard' },
  { href: '/jobs',      label: 'Jobs',        iconName: 'Briefcase'       },
  { href: '/workers',   label: 'Workers',     iconName: 'Users'           },
  { href: '/inventory', label: 'Inventory',   iconName: 'Package'         },
  { href: '/reports',   label: 'Reports',     iconName: 'FileText'        },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  const allowed = getAllowedRoutes(role);
  return allNavItems.filter((item) => allowed.includes(item.href));
}
