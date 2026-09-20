import { queryOne } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { signOutAction } from '@/lib/auth/actions';
import { getSubscription } from '@/lib/actions/subscription';
import { describePlan, isPremiumActive } from '@/lib/premium';
import {
  MobileBottomNav,
  MobileTopBar,
  Sidebar,
  SignOutButton,
  type NavUser,
} from '@/components/nav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const subscription = await getSubscription(user.id);

  const due = await queryOne<{ n: number }>(
    'SELECT count(*)::int AS n FROM revision_items WHERE user_id = $1 AND due_date <= CURRENT_DATE',
    [user.id],
  );

  const navUser: NavUser = {
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    plan: describePlan(subscription),
    isPremium: isPremiumActive(subscription) || user.role === 'admin',
  };

  const signOut = <SignOutButton action={signOutAction} />;

  return (
    <div className="flex min-h-dvh">
      <Sidebar user={navUser} revisionDue={due?.n ?? 0} signOut={signOut} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar user={navUser} signOut={signOut} />

        <main id="main" className="flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <MobileBottomNav revisionDue={due?.n ?? 0} />
    </div>
  );
}
