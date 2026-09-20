import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/forms';
import { signInAction } from '@/lib/auth/actions';
import { getSessionUser } from '@/lib/auth/session';

export const metadata = { title: 'Log in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;

  const next = typeof params.next === 'string' ? params.next : undefined;
  if (user) redirect(next && next.startsWith('/') ? next : '/dashboard');

  let notice: string | undefined;
  if (params.reset) notice = 'Your password has been changed. Log in with the new one.';
  else if (params['signed-out']) notice = 'You have been signed out.';

  return <LoginForm action={signInAction} next={next} notice={notice} />;
}
