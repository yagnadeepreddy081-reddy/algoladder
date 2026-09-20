'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { Wordmark } from '@/components/brand';
import { ThemeToggle } from '@/components/theme';
import { buttonClass } from '@/components/ui/primitives';

export interface NavUser {
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  plan: string;
  isPremium: boolean;
}

/* ------------------------------------------------------------- icons --- */
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px] shrink-0" aria-hidden>
    {d}
  </svg>
);

const ICONS = {
  dashboard: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  problems: icon(<><path d="M4 6h16M4 12h16M4 18h10" /></>),
  topics: icon(<><path d="M12 3v18M5 8h14M7 13h10M9 18h6" /></>),
  bookmarks: icon(<><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" /></>),
  revision: icon(<><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>),
  notes: icon(<><path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></>),
  plan: icon(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
  analytics: icon(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
  premium: icon(<><path d="m12 2 2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.3 6.2 19.8l1.6-6.6L2.6 8.8l6.8-.5Z" /></>),
  settings: icon(<><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-1.6-1H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  admin: icon(<><path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6Z" /><path d="m9 12 2 2 4-4" /></>),
};

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
  premium?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/problems', label: 'All problems', icon: 'problems' },
  { href: '/topics', label: 'Topics', icon: 'topics' },
  { href: '/bookmarks', label: 'Bookmarks', icon: 'bookmarks' },
  { href: '/revision', label: 'Revision', icon: 'revision' },
  { href: '/notes', label: 'Notes', icon: 'notes' },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/study-plan', label: 'Study plan', icon: 'plan', premium: true },
  { href: '/analytics', label: 'Analytics', icon: 'analytics', premium: true },
  { href: '/premium', label: 'Upgrade', icon: 'premium' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

/** The five items on the mobile bottom bar. */
const MOBILE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: 'dashboard' },
  { href: '/problems', label: 'Problems', icon: 'problems' },
  { href: '/topics', label: 'Topics', icon: 'topics' },
  { href: '/revision', label: 'Revision', icon: 'revision' },
  { href: '/settings', label: 'You', icon: 'settings' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ------------------------------------------------------------ sidebar --- */

export function Sidebar({
  user,
  revisionDue,
  signOut,
}: {
  user: NavUser;
  revisionDue: number;
  signOut: ReactNode;
}) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    const badge = item.href === '/revision' ? revisionDue : undefined;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          prefetch={false}
          aria-current={active ? 'page' : undefined}
          className={clsx(
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            active
              ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
              : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]',
          )}
        >
          {ICONS[item.icon]}
          <span className="flex-1 truncate">{item.label}</span>
          {item.premium && !user.isPremium ? (
            <span className="rounded bg-[hsl(var(--surface-3))] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[hsl(var(--text-subtle))] uppercase">
              Pro
            </span>
          ) : null}
          {badge ? (
            <span className="tabular rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
              {badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] lg:flex lg:flex-col">
      <div className="px-5 py-5">
        <Wordmark href="/dashboard" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        <ul className="space-y-0.5">{PRIMARY_NAV.map(renderItem)}</ul>

        <p className="mt-6 mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-[hsl(var(--text-subtle))] uppercase">
          More
        </p>
        <ul className="space-y-0.5">{SECONDARY_NAV.map(renderItem)}</ul>

        {user.role === 'admin' ? (
          <>
            <p className="mt-6 mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-[hsl(var(--text-subtle))] uppercase">
              Admin
            </p>
            <ul className="space-y-0.5">
              {renderItem({ href: '/admin', label: 'Admin panel', icon: 'admin' })}
            </ul>
          </>
        ) : null}
      </nav>

      <div className="border-t border-[hsl(var(--border))] p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white dark:bg-brand-500 dark:text-brand-950"
          >
            {user.displayName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[hsl(var(--text))]">
              {user.displayName}
            </span>
            <span className="block truncate text-xs text-[hsl(var(--text-subtle))]">{user.plan}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle compact />
          {signOut}
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------- mobile nav --- */

export function MobileTopBar({ user, signOut }: { user: NavUser; signOut: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4">
        <Wordmark href="/dashboard" />
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]"
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="animate-in-up border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-3"
        >
          <ul className="space-y-0.5">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                    isActive(pathname, item.href)
                      ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'text-[hsl(var(--text-muted))]',
                  )}
                >
                  {ICONS[item.icon]}
                  {item.label}
                </Link>
              </li>
            ))}
            {user.role === 'admin' ? (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[hsl(var(--text-muted))]"
                >
                  {ICONS.admin}
                  Admin panel
                </Link>
              </li>
            ) : null}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-[hsl(var(--border))] px-3 pt-3">
            <span className="text-xs text-[hsl(var(--text-subtle))]">{user.email}</span>
            {signOut}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileBottomNav({ revisionDue }: { revisionDue: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = item.href === '/revision' ? revisionDue : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-[hsl(var(--text-subtle))]',
                )}
              >
                {ICONS[item.icon]}
                {item.label}
                {badge ? (
                  <span className="tabular absolute top-1 right-[22%] rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button type="submit" className={buttonClass('ghost', 'sm')}>
        Sign out
      </button>
    </form>
  );
}
