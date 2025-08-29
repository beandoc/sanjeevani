
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RoleProvider } from '@/context/role-context';

export const metadata: Metadata = {
  title: 'Sanjeevani',
  description:
    'Advanced training and simulation for geriatric patient caregivers.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RoleProvider>
            <SidebarProvider>
              <div className="flex">
                <AppSidebar />
                <div className="flex flex-1 flex-col min-h-screen bg-background">
                  <Header />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </RoleProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
