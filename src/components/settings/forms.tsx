'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';

import {
  Card,
  CardHeader,
  ErrorState,
  Field,
  buttonClass,
  inputClass,
} from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { ThemeToggle } from '@/components/theme';
import { updateProfileAction, type Profile, type ProfileResult } from '@/lib/actions/profile';
import { changePasswordAction, type AuthFormState } from '@/lib/auth/actions';
import { resetAllProgressAction } from '@/lib/actions/progress';
import { CODE_LANGUAGES } from '@/lib/constants';

function Save({ label = 'Save changes' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass('primary', 'md')}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

function Banner({ message, tone }: { message?: string; tone: 'ok' | 'error' }) {
  if (!message) return null;
  if (tone === 'error') return <ErrorState title={message} />;
  return (
    <p className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
      {message}
    </p>
  );
}

/* ------------------------------------------------------------- profile --- */

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const [state, action] = useActionState(async (prev: ProfileResult, data: FormData) => {
    const res = await updateProfileAction(prev, data);
    if (res.ok) router.refresh();
    return res;
  }, { ok: false } as ProfileResult);

  return (
    <Card>
      <CardHeader title="Profile" description="How AlgoLadder addresses you, and what you are aiming at." />
      <form action={action} className="space-y-4 px-4 pb-4">
        <Banner message={state.error} tone="error" />
        <Banner message={state.ok ? state.message : undefined} tone="ok" />

        <Field label="Name" htmlFor="displayName">
          <input
            id="displayName"
            name="displayName"
            defaultValue={profile.displayName}
            required
            maxLength={60}
            className={inputClass}
          />
        </Field>

        <Field label="E-mail" htmlFor="email" hint="Sign-in address. Not editable here.">
          <input id="email" value={email} readOnly disabled className={inputClass} />
        </Field>

        <Field label="About you" htmlFor="bio">
          <textarea
            id="bio"
            name="bio"
            rows={2}
            maxLength={400}
            defaultValue={profile.bio}
            className={clsx(inputClass, 'resize-y')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What are you preparing for?" htmlFor="targetRole">
            <input
              id="targetRole"
              name="targetRole"
              maxLength={80}
              defaultValue={profile.targetRole}
              placeholder="Campus placements"
              className={inputClass}
            />
          </Field>
          <Field label="Target date" htmlFor="targetDate">
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              defaultValue={profile.targetDate ?? ''}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Problems per day" htmlFor="dailyGoal">
            <input
              id="dailyGoal"
              name="dailyGoal"
              type="number"
              min={1}
              max={50}
              defaultValue={profile.dailyGoal}
              className={inputClass}
            />
          </Field>
          <Field label="Preferred language" htmlFor="preferredLanguage">
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              defaultValue={profile.preferredLanguage}
              className={clsx(inputClass, 'cursor-pointer')}
            >
              {CODE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone" htmlFor="timezone">
            <input
              id="timezone"
              name="timezone"
              defaultValue={profile.timezone}
              className={inputClass}
            />
          </Field>
        </div>

        <Save />
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------ password --- */

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, { ok: false } as AuthFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader
        title="Password"
        description="Changing it here does not sign you out. Use the button below for that."
      />
      <form action={action} className="space-y-4 px-4 pb-4">
        <Banner message={state.error} tone="error" />
        <Banner message={state.ok ? state.message : undefined} tone="ok" />

        <Field label="Current password" htmlFor="currentPassword" error={fe.currentPassword}>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={fe.newPassword}>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={fe.confirmPassword}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </Field>

        <Save label="Change password" />
      </form>
    </Card>
  );
}

/* ----------------------------------------------------------- appearance --- */

export function AppearanceCard() {
  return (
    <Card>
      <CardHeader
        title="Appearance"
        description="Stored in this browser. System follows your operating system setting."
      />
      <div className="px-4 pb-4">
        <ThemeToggle />
      </div>
    </Card>
  );
}

/* -------------------------------------------------------- danger zone --- */

export function DangerZone({ signOutEverywhere }: { signOutEverywhere: () => Promise<void> }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [, start] = useTransition();

  return (
    <Card className="border-rose-300 dark:border-rose-900">
      <CardHeader
        title="Careful with these"
        description="Both are immediate. Neither deletes your account."
      />
      <div className="space-y-4 px-4 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--text))]">Sign out everywhere</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Invalidates every session on every device, including this one.
            </p>
          </div>
          <form action={signOutEverywhere}>
            <button type="submit" className={buttonClass('outline', 'md')}>
              Sign out everywhere
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--text))]">Reset all progress</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Clears every status, bookmark and revision schedule. Your notes are kept.
            </p>
          </div>
          <ConfirmDialog
            title="Reset all of your progress?"
            description="Every solved mark, bookmark, attempt count, logged minute and revision schedule is deleted. Your written notes are kept. This cannot be undone."
            confirmLabel="Yes, reset everything"
            onConfirm={() =>
              start(async () => {
                const res = await resetAllProgressAction();
                if (res.ok) {
                  success(res.message ?? 'Progress cleared');
                  router.refresh();
                } else {
                  error(res.error ?? 'Could not reset');
                }
              })
            }
            trigger={(open) => (
              <button type="button" onClick={open} className={buttonClass('danger', 'md')}>
                Reset progress
              </button>
            )}
          />
        </div>
      </div>
    </Card>
  );
}
