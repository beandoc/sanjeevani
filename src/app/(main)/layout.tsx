'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MedicalDisclaimer } from '@/components/layout/medical-disclaimer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-screen min-w-0 w-full bg-background overflow-x-hidden">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">{children}</main>
        <MedicalDisclaimer variant="footer" />
      </div>
    </SidebarProvider>
  );
}
