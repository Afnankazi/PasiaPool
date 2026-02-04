'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  href?: string;
  label: string;
  isCurrentPage?: boolean;
}

const routeMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { href: '/dashboard', label: 'Dashboard', isCurrentPage: true }
  ],
  '/dashboard/groups': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/groups', label: 'Groups', isCurrentPage: true }
  ],
  '/dashboard/expenses': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/expenses', label: 'Expenses', isCurrentPage: true }
  ],
  '/dashboard/settlements': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/settlements', label: 'Settlements', isCurrentPage: true }
  ],
  '/dashboard/settlements/pending': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/settlements', label: 'Settlements' },
    { href: '/dashboard/settlements/pending', label: 'Pending', isCurrentPage: true }
  ],
  '/dashboard/settlements/history': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/settlements', label: 'Settlements' },
    { href: '/dashboard/settlements/history', label: 'History', isCurrentPage: true }
  ],
  '/dashboard/analytics': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/analytics', label: 'Analytics', isCurrentPage: true }
  ],
  '/dashboard/settings': [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/settings', label: 'Settings', isCurrentPage: true }
  ],
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  
  // Handle dynamic routes like /dashboard/groups/[id]
  let breadcrumbItems = routeMap[pathname];
  
  if (!breadcrumbItems) {
    // Handle dynamic routes
    if (pathname.startsWith('/dashboard/groups/') && pathname !== '/dashboard/groups') {
      breadcrumbItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/groups', label: 'Groups' },
        { label: 'Group Details', isCurrentPage: true }
      ];
    } else if (pathname.startsWith('/dashboard/expenses/') && pathname !== '/dashboard/expenses') {
      breadcrumbItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/expenses', label: 'Expenses' },
        { label: 'Expense Details', isCurrentPage: true }
      ];
    } else if (pathname.startsWith('/dashboard/settlements/') && pathname !== '/dashboard/settlements') {
      breadcrumbItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/settlements', label: 'Settlements' },
        { label: 'Settlement Details', isCurrentPage: true }
      ];
    } else {
      // Default fallback
      breadcrumbItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { label: 'Page', isCurrentPage: true }
      ];
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className="hidden md:block">
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
