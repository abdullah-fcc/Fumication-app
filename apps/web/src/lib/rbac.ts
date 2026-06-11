import type { Role } from './auth';

// Top-level routes each role can access.
// Sub-routes (e.g. /jobs/new, /locations/abc/edit) are covered by prefix matching in canAccess.
const rolePermissions: Record<Role, string[]> = {
  admin:   ['/', '/jobs', '/workers', '/inventory', '/reports', '/locations'],
  manager: ['/', '/jobs', '/workers', '/inventory', '/reports', '/locations'],
  worker:  ['/', '/jobs', '/reports'],
  client:  ['/reports'],
};

// Check if a role can access a given pathname.
// Uses prefix matching so /jobs/new is covered by the /jobs permission.
export function canAccess(role: Role, pathname: string): boolean {
  const allowed = rolePermissions[role] ?? [];
  return allowed.some((route) => pathname === route || pathname.startsWith(route + '/'));
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
  { href: '/',           label: 'Dashboard', iconName: 'LayoutDashboard' },
  { href: '/jobs',       label: 'Jobs',       iconName: 'Briefcase'       },
  { href: '/workers',    label: 'Workers',    iconName: 'Users'           },
  { href: '/locations',  label: 'Locations',  iconName: 'MapPin'          },
  { href: '/inventory',  label: 'Inventory',  iconName: 'Package'         },
  { href: '/reports',    label: 'Reports',    iconName: 'FileText'        },
];

export function getNavItemsForRole(role: Role): NavItem[] {
  const allowed = getAllowedRoutes(role);
  return allNavItems.filter((item) => allowed.includes(item.href));
}
