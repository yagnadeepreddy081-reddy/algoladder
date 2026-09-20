import type { Metadata, Viewport } from 'next';

import { ThemeScript } from '@/components/theme';
import { ToastProvider } from '@/components/ui/toast';

import './globals.css';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'AlgoLadder';

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — a structured 474-problem DSA roadmap`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Work through 474 curated data-structures and algorithms problems across 19 topics, with progress tracking, spaced revision and analytics built on your own solve history.',
  applicationName: APP_NAME,
  authors: [{ name: 'Surasani Yagnadeep Reddy' }],
  keywords: ['DSA', 'data structures', 'algorithms', 'interview preparation', 'roadmap'],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#131316' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
