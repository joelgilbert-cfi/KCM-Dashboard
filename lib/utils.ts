import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

/**
 * Merge Tailwind classes with clsx — prevents conflicting utility classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for display.
 */
export function formatDate(date: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!date) return '—';
  try {
    return format(new Date(date), pattern);
  } catch {
    return '—';
  }
}

/**
 * Format a number as Indian Rupee currency.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get initials from a name for avatar display.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Status badge color mapping for clusters.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Under Closure':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Closed':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

/**
 * Progress badge color mapping for closure tracker.
 */
export function getProgressColor(progress: string | null): string {
  switch (progress) {
    case 'Initiated':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'In Progress':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Completed':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

/**
 * Asset condition badge color mapping.
 */
export function getConditionColor(condition: string | null): string {
  switch (condition) {
    case 'Good':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'Fair':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Poor':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Damaged':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}
