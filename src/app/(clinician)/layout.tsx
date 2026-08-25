'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Stethoscope, LogOut, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/use-auth-user';
import { signOutUser, signInOrCreateDemoAccount } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';

import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

/**
 * Separate workspace shell for the clinician persona — deliberately not
 * reusing the caregiver AppSidebar, whose links (modules, simulations,
 * vital logs) belong to a different job entirely.
 */
export default function ClinicianLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthUser();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && auth) {
      void signInOrCreateDemoAccount('doctor');
    }
  }, [user, isLoading]);

  const clinicCode = user?.uid ? `${user.uid.slice(0, 10)}…` : 'DEMO-CLINIC-2026';

  const copyCode = () => {
    const codeToCopy = user?.uid || 'DEMO-CLINIC-2026';
    navigator.clipboard.writeText(codeToCopy);
    toast({ title: 'Clinic Code Copied', description: 'Share this code with caregivers under Settings → Share With Your Doctor.' });
  };

  const handleSignOut = async () => {
    await signOutUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sanjeevani_user_role');
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 md:pb-0">
      {/* Thin gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-primary to-blue-600" />
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/clinic/roster" className="flex items-center gap-2.5 font-bold text-sm group">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-xl border border-blue-500/30 bg-white p-1 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <Image
                  src="/kutumbh-emblem.png"
                  alt="Kutumbh Clinician"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="leading-tight">
                <span className="block text-xs sm:text-sm font-black">कुटुम्ब Clinician</span>
                <span className="block text-[9px] sm:text-[10px] font-bold text-rose-500">स्नेह, संबल और स्वास्थ्य</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                Doctor Dashboard
              </Link>
              <Link
                href="/clinic/roster"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors text-foreground"
              >
                Patient Roster
              </Link>
              <Link
                href="/modules"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                Caregiver Modules
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                Kutumbh Family View
              </Button>
            </Link>
            <button
              onClick={copyCode}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/70 transition-colors border border-border/60"
              title="Your Clinic Code — share with caregivers"
            >
              <Copy className="w-3 h-3" />
              <span>{clinicCode}</span>
            </button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2 sm:px-3" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
