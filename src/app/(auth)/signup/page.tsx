import { redirect } from 'next/navigation';

import { SignUpForm } from '@/components/auth/forms';
import { signUpAction } from '@/lib/auth/actions';
import { getSessionUser } from '@/lib/auth/session';

export const metadata = { title: 'Create an account' };
export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : undefined;

  return <SignUpForm action={signUpAction} next={next} />;
}
