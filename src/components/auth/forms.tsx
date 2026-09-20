'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { buttonClass, Card, ErrorState, Field, inputClass } from '@/components/ui/primitives';
import { checkPasswordStrength } from '@/lib/password-strength';
import type { AuthFormState } from '@/lib/auth/actions';

const EMPTY: AuthFormState = { ok: false };

function SubmitButton({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>
      {pending ? pendingLabel : children}
    </button>
  );
}

function FormError({ state }: { state: AuthFormState }) {
  if (!state.error) return null;
  return (
    <div className="mb-4">
      <ErrorState title={state.error} />
    </div>
  );
}

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const { score, problems } = checkPasswordStrength(value);
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colours = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-brand-400', 'bg-brand-500'];
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? colours[score] : 'bg-[hsl(var(--surface-3))]'}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-[hsl(var(--text-muted))]">
        {labels[score]}
        {problems.length ? ` — ${problems[0].toLowerCase()}` : ''}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- sign up --- */

export function SignUpForm({
  action,
  next,
}: {
  action: (prev: AuthFormState, data: FormData) => Promise<AuthFormState>;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);
  const [password, setPassword] = useState('');
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="p-4 sm:p-4">
      <h1 className="text-xl font-semibold text-[hsl(var(--text))]">Create your account</h1>
      <p className="mt-1.5 text-sm text-[hsl(var(--text-muted))]">
        Free forever for the full 474-problem ladder.
      </p>

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <FormError state={state} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <Field label="Name" htmlFor="displayName" error={fe.displayName}>
          <input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            className={inputClass}
            placeholder="Yagnadeep"
            aria-invalid={Boolean(fe.displayName)}
          />
        </Field>

        <Field label="E-mail" htmlFor="email" error={fe.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="you@example.com"
            aria-invalid={Boolean(fe.email)}
          />
        </Field>

        <div>
          <Field
            label="Password"
            htmlFor="password"
            error={fe.password}
            hint="At least 8 characters, with an upper-case letter and a number."
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fe.password)}
            />
          </Field>
          <PasswordStrength value={password} />
        </div>

        <Field label="Confirm password" htmlFor="confirmPassword" error={fe.confirmPassword}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
            aria-invalid={Boolean(fe.confirmPassword)}
          />
        </Field>

        <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-[hsl(var(--text-muted))]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------- log in --- */

export function LoginForm({
  action,
  next,
  notice,
}: {
  action: (prev: AuthFormState, data: FormData) => Promise<AuthFormState>;
  next?: string;
  notice?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="p-4 sm:p-4">
      <h1 className="text-xl font-semibold text-[hsl(var(--text))]">Welcome back</h1>
      <p className="mt-1.5 text-sm text-[hsl(var(--text-muted))]">
        Pick up wherever you left off on the ladder.
      </p>

      {notice ? (
        <p className="mt-4 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
          {notice}
        </p>
      ) : null}

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <FormError state={state} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <Field label="E-mail" htmlFor="email" error={fe.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="you@example.com"
            aria-invalid={Boolean(fe.email)}
          />
        </Field>

        <div>
          <Field label="Password" htmlFor="password" error={fe.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              aria-invalid={Boolean(fe.password)}
            />
          </Field>
          <p className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              Forgot your password?
            </Link>
          </p>
        </div>

        <SubmitButton pendingLabel="Signing you in…">Log in</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-[hsl(var(--text-muted))]">
        New here?{' '}
        <Link href="/signup" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

/* ----------------------------------------------------- forgot password --- */

export function ForgotPasswordForm({
  action,
}: {
  action: (prev: AuthFormState, data: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY);
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="p-4 sm:p-4">
      <h1 className="text-xl font-semibold text-[hsl(var(--text))]">Reset your password</h1>
      <p className="mt-1.5 text-sm text-[hsl(var(--text-muted))]">
        Enter your e-mail and we will send you a link valid for one hour.
      </p>

      {state.ok ? (
        <div className="mt-5 rounded-lg border border-brand-300 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-950">
          <p className="text-sm text-brand-800 dark:text-brand-300">{state.message}</p>
          {state.devResetUrl ? (
            <div className="mt-3 border-t border-brand-200 pt-3 dark:border-brand-900">
              <p className="text-xs font-semibold text-brand-800 dark:text-brand-300">
                Development mode — e-mail is switched off
              </p>
              <p className="mt-1 text-xs text-brand-700 dark:text-brand-400">
                Use this link directly, or copy it from your server console:
              </p>
              <Link
                href={state.devResetUrl}
                className="mt-2 block font-mono text-xs break-all text-brand-700 underline dark:text-brand-400"
              >
                {state.devResetUrl}
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <form action={formAction} className="mt-5 space-y-4" noValidate>
          <FormError state={state} />
          <Field label="E-mail" htmlFor="email" error={fe.email}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="you@example.com"
              aria-invalid={Boolean(fe.email)}
            />
          </Field>
          <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-[hsl(var(--text-muted))]">
        <Link href="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}

/* ------------------------------------------------------ reset password --- */

export function ResetPasswordForm({
  action,
  token,
}: {
  action: (prev: AuthFormState, data: FormData) => Promise<AuthFormState>;
  token: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);
  const [password, setPassword] = useState('');
  const fe = state.fieldErrors ?? {};

  return (
    <Card className="p-4 sm:p-4">
      <h1 className="text-xl font-semibold text-[hsl(var(--text))]">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-[hsl(var(--text-muted))]">
        Setting a new password signs you out on every other device.
      </p>

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <FormError state={state} />
        <input type="hidden" name="token" value={token} />

        <div>
          <Field label="New password" htmlFor="password" error={fe.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fe.password)}
            />
          </Field>
          <PasswordStrength value={password} />
        </div>

        <Field label="Confirm new password" htmlFor="confirmPassword" error={fe.confirmPassword}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
            aria-invalid={Boolean(fe.confirmPassword)}
          />
        </Field>

        <SubmitButton pendingLabel="Updating…">Set new password</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-[hsl(var(--text-muted))]">
        <Link href="/forgot-password" className="text-brand-600 hover:underline dark:text-brand-400">
          Request a new link
        </Link>
      </p>
    </Card>
  );
}
