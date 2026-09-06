
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { RoleProvider } from '@/context/role-context';

import { PwaRegister } from '@/components/layout/pwa-register';

// Self-hosted at build time (next/font downloads and serves the font files
// from this origin) — no runtime request to fonts.googleapis.com, and no
// font-swap layout shift while that request resolves. Exposed as CSS
// variables rather than a default className so both fonts are available
// everywhere via the Tailwind fontFamily config (tailwind.config.ts).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' }
  ]
};

export const metadata: Metadata = {
  title: 'Kutumbh — Geriatric Decision Support & Family Caregiver Training',
  description:
    'Evidence-based geriatric caregiver decision support, Zarit burden assessment, and clinical simulation platform for India.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kutumbh'
  },
  formatDetection: {
    telephone: true
  }
};

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <RoleProvider>
              {children}
              <Toaster />
              <PwaRegister />
            </RoleProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
