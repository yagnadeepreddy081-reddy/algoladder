import Link from 'next/link';

import { Badge } from '@/components/ui/primitives';
import { requireAdmin } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/problems', label: 'Problems' },
  { href: '/admin/data', label: 'Import / export' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/reports', label: 'Reports' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Role-based access control. Anyone who is not an admin is redirected here,
  // before a single byte of admin data is queried.
  await requireAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-[hsl(var(--border))] pb-3">
        <Badge tone="violet">Admin</Badge>
        <nav aria-label="Admin sections" className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-lg px-3 py-1.5 text-sm text-[hsl(var(--text-muted))] transition-colors hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--text))]"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
