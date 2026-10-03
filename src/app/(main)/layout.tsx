'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MedicalDisclaimer } from '@/components/layout/medical-disclaimer';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import { SessionGuard } from '@/components/auth/session-guard';

function MainContentWrapper({ children }: { children: ReactNode }) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleContentClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full overflow-x-hidden pb-24 md:pb-0">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions --
          Tapping the content area to dismiss the open mobile sidebar is a mouse/touch
          convenience layered on top of the real, already-accessible dismissal paths:
          Radix's Sheet (rendering the mobile sidebar) closes on Escape and has its own
          focus-trapped overlay. */}
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
    <SessionGuard>
      <SidebarProvider className="flex flex-col min-h-screen w-full">
        {/* Full-width thin horizontal header across all pages */}
        <Header />
        {/* Expandable/collapsible sidebar and main content starting after the header */}
        <div className="flex flex-1 min-h-0 w-full relative pt-14">
          <AppSidebar />
          <MainContentWrapper>{children}</MainContentWrapper>
        </div>
      </SidebarProvider>
    </SessionGuard>
  );
}
