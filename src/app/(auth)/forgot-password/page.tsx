import { ForgotPasswordForm } from '@/components/auth/forms';
import { requestPasswordResetAction } from '@/lib/auth/actions';

export const metadata = { title: 'Forgot your password' };
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm action={requestPasswordResetAction} />;
}
