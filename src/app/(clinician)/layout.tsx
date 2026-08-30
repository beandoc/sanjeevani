'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Stethoscope,
  LogOut,
  Copy,
  Users,
  LayoutDashboard,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthUser } from '@/hooks/use-auth-user';
import { signOutUser, signInOrCreateDemoAccount } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/client';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { HeaderControls } from '@/components/layout/header-controls';
import { cn } from '@/lib/utils';

/**
 * Modern workspace shell for the clinician persona with executive clinical aesthetics,
 * active route pills, physician identity, and clinic connectivity controls.
 */
export default function ClinicianLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthUser();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && auth) {
      void signInOrCreateDemoAccount('doctor');
    }
  }, [user, isLoading]);

  const clinicCode = user?.uid ? `${user.uid.slice(0, 10)}…` : 'DEMO-CLINIC-2026';

  const copyCode = () => {
    const codeToCopy = user?.uid || 'DEMO-CLINIC-2026';
    navigator.clipboard.writeText(codeToCopy);
    toast({
      title: 'Clinic Code Copied',
      description: 'Share this code with caregivers under Settings → Share With Your Doctor.'
    });
  };

  const handleSignOut = async () => {
    await signOutUser();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sanjeevani_user_role');
    }
    router.push('/login');
  };

  const isRosterActive = pathname.startsWith('/clinic/roster') || pathname.startsWith('/clinic/dyad');
  const isDashboardActive = pathname === '/dashboard';
  const isModulesActive = pathname.startsWith('/modules');

  const clinicianName = user?.displayName || 'Dr. Vivek Sharma';
  const initials = clinicianName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 pb-16 md:pb-0">
      {/* Top clinical accent gradient bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 shadow-xs" />

      {/* Main Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Clinician Title */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              href="/clinic/roster"
              className="flex items-center gap-3 font-bold text-sm group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-800 p-1 shrink-0 group-hover:scale-105 transition-all shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                <Image
                  src="/kutumbh-emblem.png"
                  alt="Kutumbh Clinician"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold tracking-tight text-foreground">
                    कुटुम्ब <span className="text-blue-600 dark:text-blue-400">Clinician</span>
                  </span>
                  <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] px-1.5 py-0 font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60">
                    OPD Suite
                  </Badge>
                </div>
                <span className="block text-[10px] font-medium text-muted-foreground/90">
                  स्नेह, संबल और स्वास्थ्य • Geriatric Care Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 pl-2 border-l border-border/60">
              <Link
                href="/clinic/roster"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  isRosterActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Patient Roster</span>
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  isDashboardActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Doctor Dashboard</span>
              </Link>
              <Link
                href="/modules"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  isModulesActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Caregiver Modules</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clinic Code Badge */}
            <button
              onClick={copyCode}
              className="hidden lg:flex items-center gap-2 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/60 shadow-2xs group cursor-pointer"
              title="Click to copy your Clinic ID for caregiver linking"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Clinic ID</span>
              <code className="font-mono font-semibold text-foreground">{clinicCode}</code>
              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Switch to Family View */}
            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-border/80 bg-background/80 hover:bg-muted/60 hover:text-primary transition-all shadow-2xs"
              >
                <span>Family View</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </Link>

            {/* Theme Toggle */}
            <HeaderControls />

            {/* Clinician Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 sm:pl-1 sm:pr-2 rounded-xl hover:bg-muted/70 transition-all border border-transparent hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  <Avatar className="h-8 w-8 rounded-lg border border-blue-500/30 bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {initials || 'DR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden xl:block text-left text-xs leading-tight">
                    <span className="font-bold text-foreground block truncate max-w-[120px]">{clinicianName}</span>
                    <span className="text-[10px] text-muted-foreground block">Physician</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none text-foreground">{clinicianName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">Geriatric Care Specialist</p>
                    <p className="text-[10px] font-mono text-muted-foreground/70 pt-1">UID: {user?.uid?.slice(0, 12) || 'Demo Session'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl text-xs cursor-pointer">
                  <Link href="/clinic/roster" className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Patient Clinical Roster</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs cursor-pointer">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Open Kutumbh Family Portal</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyCode} className="rounded-xl text-xs cursor-pointer">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                  <span>Copy Clinic Invite Code</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Page Workspace Container */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
      <MobileBottomNav />
    </div>
  );
}

