'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserAvatar } from '@/components/user-avatar';
import {
  LayoutDashboard,
  ChefHat,
  FileText,
  Package,
  ScrollText,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kitchen Master', href: '/kitchens', icon: ChefHat },
  { label: 'Closure Requests', href: '/closure-requests', icon: FileText },
  { label: 'Assets', href: '/assets', icon: Package },
  { label: 'Audit Log', href: '/audit-log', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1440px] flex h-14 items-center px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="mr-6 flex items-center gap-2 shrink-0"
        >
          <span className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-sm shadow-brand/30">
            Curefoods
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand text-white shadow-sm shadow-brand/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserAvatar />

          {/* Mobile menu button */}
          <button
            className="md:hidden ml-1 p-1.5 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
