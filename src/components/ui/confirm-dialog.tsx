'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { buttonClass } from '@/components/ui/primitives';

/**
 * A confirmation dialog for anything destructive. Built on <dialog> so focus
 * trapping, Escape and the backdrop come from the platform rather than from
 * three hundred lines of hand-rolled focus management.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      // Clicking the backdrop (i.e. the dialog element itself) closes it.
      if (e.target === el) el.close();
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      close();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {trigger(open)}
      <dialog
        ref={ref}
        className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-0 text-[hsl(var(--text))] backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
        aria-labelledby="confirm-title"
      >
        <div className="p-5">
          <h2 id="confirm-title" className="text-base font-semibold">
            {title}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--text-muted))]">{description}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={close} className={buttonClass('outline', 'md')} disabled={busy}>
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className={buttonClass(tone === 'danger' ? 'danger' : 'primary', 'md')}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
