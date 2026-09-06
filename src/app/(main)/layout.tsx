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
    <div className="flex flex-1 flex-col min-h-screen min-w-0 w-full bg-background overflow-x-hidden pb-24 md:pb-0">
      <Header />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions --
          Tapping the content area to dismiss the open mobile sidebar is a mouse/touch
          convenience layered on top of the real, already-accessible dismissal paths:
          Radix's Sheet (rendering the mobile sidebar) closes on Escape and has its own
          focus-trapped overlay. Making the whole <main> region a keyboard-focusable
          "button" would be actively wrong here — it isn't a control. */}
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
      <SidebarProvider>
        <AppSidebar />
        <MainContentWrapper>{children}</MainContentWrapper>
      </SidebarProvider>
    </SessionGuard>
  );
}
