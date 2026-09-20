import Link from 'next/link';

import { ResetPasswordForm } from '@/components/auth/forms';
import { resetPasswordAction } from '@/lib/auth/actions';
import { Card, buttonClass } from '@/components/ui/primitives';

export const metadata = { title: 'Set a new password' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  if (!token) {
    return (
      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-[hsl(var(--text))]">This link is incomplete</h1>
        <p className="mt-2 text-sm text-[hsl(var(--text-muted))]">
          The reset link did not carry a token. Request a fresh one and use the newest e-mail.
        </p>
        <Link href="/forgot-password" className={buttonClass('primary', 'md', 'mt-6 w-full')}>
          Request a new link
        </Link>
      </Card>
    );
  }

  return <ResetPasswordForm action={resetPasswordAction} token={token} />;
}
