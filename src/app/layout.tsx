
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { RoleProvider } from '@/context/role-context';

import { PwaRegister } from '@/components/layout/pwa-register';

export const metadata: Metadata = {
  title: 'Sanjeevani — Geriatric Decision Support & Caregiver Training',
  description:
    'Evidence-based geriatric caregiver decision support, Zarit burden assessment, and clinical simulation platform for India.',
  manifest: '/manifest.json',
  themeColor: '#0f766e',
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
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
