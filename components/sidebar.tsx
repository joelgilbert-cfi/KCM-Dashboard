'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Mail,
  Package,
  ScrollText,
  Settings,
  LogOut,
  ChefHat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { cn, getInitials } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kitchen Master', href: '/kitchens', icon: Building2 },
  { name: 'Closure Requests', href: '/closure-requests', icon: Mail },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Audit Log', href: '/audit-log', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
];

import { ThemeToggle } from '@/components/theme-toggle';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      style={{
        background: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-border/50">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              KCM Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground">Kitchen Closure Mgmt</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-indigo-400'
                    : 'text-muted-foreground group-hover:text-muted-foreground'
                )}
              />
              {!collapsed && <span>{item.name}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <>
            <ChevronLeft className="w-4 h-4" />
            <span>Collapse</span>
          </>
        )}
      </button>

      {/* Theme Toggle */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <ThemeToggle />
        </div>
      )}

      {/* User section */}
      <div className="border-t border-border/50 px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-semibold text-white">
            {user ? getInitials(user.name) : '..'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {user?.role || '—'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
