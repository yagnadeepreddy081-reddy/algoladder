import Link from 'next/link';

import { Badge, Card, CardHeader, PageHeader, buttonClass } from '@/components/ui/primitives';
import {
  AppearanceCard,
  DangerZone,
  PasswordForm,
  ProfileForm,
} from '@/components/settings/forms';
import { requireUser } from '@/lib/auth/session';
import { signOutEverywhereAction } from '@/lib/auth/actions';
import { getProfile } from '@/lib/actions/profile';
import { getSubscription } from '@/lib/actions/subscription';
import { canAccessFeature, describePlan } from '@/lib/premium';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser('/settings');
  const [profile, subscription] = await Promise.all([getProfile(user.id), getSubscription(user.id)]);
  const canExport = canAccessFeature(subscription, user.role);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, your password, how the app looks, and getting your data back out."
      />

      <div className="space-y-4">
        <ProfileForm profile={profile} email={user.email} />

        {/* ----------------------------------------------------- plan */}
        <Card>
          <CardHeader
            title="Plan"
            description="What your account currently has access to."
            action={
              <Link href="/premium" className={buttonClass('outline', 'sm')}>
                Manage plan
              </Link>
            }
          />
          <div className="flex flex-wrap items-center gap-3 px-4 pb-4">
            <Badge tone={canExport ? 'brand' : 'zinc'}>{describePlan(subscription)}</Badge>
            {user.role === 'admin' ? <Badge tone="violet">Admin</Badge> : null}
          </div>
        </Card>

        <AppearanceCard />

        {/* --------------------------------------------------- export */}
        <Card id="export" className="scroll-mt-20">
          <CardHeader
            title="Export your data"
            description="Everything you have written here, in a format you can keep. Your data is yours."
          />
          <div className="px-4 pb-4">
            {canExport ? (
              <div className="flex flex-wrap gap-2">
                <a href="/api/export?format=json" className={buttonClass('outline', 'md')} download>
                  Download JSON
                </a>
                <a href="/api/export?format=csv" className={buttonClass('outline', 'md')} download>
                  Download CSV
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[hsl(var(--border-strong))] px-4 py-4">
                <p className="text-sm text-[hsl(var(--text-muted))]">
                  Progress export is a Pro feature.{' '}
                  <Link href="/premium" className="text-brand-600 hover:underline dark:text-brand-400">
                    See what Pro includes
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </Card>

        <PasswordForm />

        <DangerZone signOutEverywhere={signOutEverywhereAction} />
      </div>
    </>
  );
}
