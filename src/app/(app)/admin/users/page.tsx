import Link from 'next/link';

import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  buttonClass,
  inputClass,
} from '@/components/ui/primitives';
import { UserPlanSelect, UserRoleToggle } from '@/components/admin/controls';
import { requireAdmin } from '@/lib/auth/session';
import { listUsers } from '@/lib/actions/admin';

export const metadata = { title: 'Admin · Users' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';

  const users = await listUsers(q);

  return (
    <>
      <PageHeader
        title="Users"
        description={`${users.length} account${users.length === 1 ? '' : 's'}. You can change anyone's plan or grant admin access from here.`}
      />

      <form className="mb-5 flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by e-mail or name…"
          aria-label="Search users"
          className={inputClass}
        />
        <button type="submit" className={buttonClass('outline', 'md')}>
          Search
        </button>
        {q ? (
          <Link href="/admin/users" className={buttonClass('ghost', 'md')}>
            Clear
          </Link>
        ) : null}
      </form>

      {users.length === 0 ? (
        <EmptyState title="No users match" description="Try a different search." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">All registered users</caption>
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-left text-xs tracking-wide text-[hsl(var(--text-muted))] uppercase">
                <th scope="col" className="px-4 py-3 font-medium">
                  User
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Solved
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Notes
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Joined
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-[hsl(var(--text))]">
                      {u.displayName || u.email.split('@')[0]}
                    </span>
                    <span className="block text-xs text-[hsl(var(--text-muted))]">{u.email}</span>
                  </td>
                  <td className="tabular px-4 py-3 text-right">{u.solved}</td>
                  <td className="tabular px-4 py-3 text-right text-[hsl(var(--text-muted))]">
                    {u.notes}
                  </td>
                  <td className="px-4 py-3 text-xs text-[hsl(var(--text-muted))]">
                    {new Date(u.createdAt).toLocaleDateString()}
                    {u.lastLoginAt ? (
                      <span className="block text-[hsl(var(--text-subtle))]">
                        last in {new Date(u.lastLoginAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserPlanSelect userId={u.id} plan={u.plan} />
                      {u.status !== 'active' ? <Badge tone="amber">{u.status}</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleToggle userId={u.id} role={u.role} isSelf={u.id === admin.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
