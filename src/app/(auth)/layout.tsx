import Link from 'next/link';

import { Wordmark } from '@/components/brand';
import { ThemeToggle } from '@/components/theme';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <ThemeToggle compact />
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-4 py-6 text-center sm:px-6">
        <p className="text-xs text-[hsl(var(--text-subtle))]">
          <Link href="/" className="hover:text-[hsl(var(--text-muted))]">
            Back to the home page
          </Link>
        </p>
      </footer>
    </div>
  );
}
