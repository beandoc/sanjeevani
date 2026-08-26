'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MedicalDisclaimer } from '@/components/layout/medical-disclaimer';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

function MainContentWrapper({ children }: { children: ReactNode }) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleContentClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-screen min-w-0 w-full bg-background overflow-x-hidden pb-16 md:pb-0">
      <Header />
      <main
        onClick={handleContentClick}
        className="flex-1 p-3.5 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto"
      >
        {children}
      </main>
      <MedicalDisclaimer variant="footer" />
      <MobileBottomNav />
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <MainContentWrapper>{children}</MainContentWrapper>
    </SidebarProvider>
  );
}

