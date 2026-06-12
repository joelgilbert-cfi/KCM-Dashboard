'use client';

import { getInitials } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Shield } from 'lucide-react';

export function UserAvatar() {
  const { user, signOut } = useUser();

  if (!user) return null;

  const roleBadgeColor = {
    finance: 'text-emerald-600 dark:text-emerald-400',
    expansion: 'text-blue-600 dark:text-blue-400',
    admin: 'text-amber-600 dark:text-amber-400',
  }[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
          <Avatar className="h-8 w-8 border-2 border-brand/30 hover:border-brand/60 transition-colors">
            <AvatarFallback className="bg-brand text-white text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <span className={`text-xs font-medium flex items-center gap-1 ${roleBadgeColor}`}>
              <Shield className="h-3 w-3" />
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
