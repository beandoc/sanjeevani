import { NextIntlClientProvider, useMessages } from 'next-intl';
import { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = useMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SidebarProvider>
        <div className="flex">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </NextIntlClientProvider>
  );
}
