'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Stethoscope, LogOut, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/use-auth-user';
import { signOutUser } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

/**
 * Separate workspace shell for the clinician persona — deliberately not
 * reusing the caregiver AppSidebar, whose links (modules, simulations,
 * vital logs) belong to a different job entirely.
 */
export default function ClinicianLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const router = useRouter();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/login" title="Navigate to Main Login & Account Selection" className="flex items-center gap-2 font-bold text-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <span>Sanjeevani Clinician Workspace</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              title="Your Clinic Code — share with caregivers"
            >
              <Copy className="w-3 h-3" />
              <span>{clinicCode}</span>
            </button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
