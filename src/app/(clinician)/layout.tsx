'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MedicalDisclaimer } from '@/components/layout/medical-disclaimer';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useAuthUser } from '@/hooks/use-auth-user';
import { SessionGuard } from '@/components/auth/session-guard';

function ClinicianContentWrapper({ children }: { children: ReactNode }) {
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

/**
 * Standardized workspace layout for the clinician portal, unifying the left-hand
 * sidebar menu (AppSidebar), full-width global header with Omnibar search, and role verification.
 */
export default function ClinicianLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    void fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => {
        if (!ok) {
          router.replace('/login?next=/clinic/roster');
          return;
        }
        const localRole =
          typeof window !== 'undefined'
            ? localStorage.getItem('sanjeevani_user_role')
            : null;
        const isClinician =
          body.clinician === true ||
          localRole === 'professional' ||
          localRole === 'doctor' ||
          localRole === 'nurse';
        if (!isClinician) router.replace('/dashboard');
      })
      .catch(() => router.replace('/login?next=/clinic/roster'));
  }, [isLoading, router]);

  return (
    <SessionGuard>
      <SidebarProvider className="flex flex-col min-h-screen w-full">
        {/* Full-width thin horizontal header across all pages */}
        <Header />
        {/* Expandable/collapsible sidebar and clinician content starting after the header */}
        <div className="flex flex-1 min-h-0 w-full relative pt-14">
          <AppSidebar />
          <ClinicianContentWrapper>{children}</ClinicianContentWrapper>
        </div>
      </SidebarProvider>
    </SessionGuard>
  );
}
