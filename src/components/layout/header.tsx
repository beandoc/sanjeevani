'use client';

import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LifeBuoy,
  PhoneCall,
  Search,
  LogOut,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { HeaderControls } from './header-controls';
import { HealthRepository } from '@/lib/db/health-repository';
import { auth } from '@/lib/firebase/client';
import { signOutUser } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '../language-switcher';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';
import { GlobalCommandPalette } from '@/components/search/global-command-palette';
import { CaregiverTroubleshootingModal } from '@/components/search/caregiver-troubleshooting-modal';
import { useProfile } from '@/context/role-context';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { role } = useProfile();
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userLabel, setUserLabel] = useState('Abhishek Rai');
  const [initials, setInitials] = useState('AR');

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';
  const _isCaregiver = !isDoctor && !isNurse;
  const { toast } = useToast();

  const user = auth?.currentUser;
  const clinicCode = user?.uid ? `${user.uid.slice(0, 10)}…` : 'DEMO-CLINIC-2026';

  const copyClinicCode = () => {
    const codeToCopy = user?.uid || 'DEMO-CLINIC-2026';
    navigator.clipboard.writeText(codeToCopy);
    toast({
      title: 'Clinic Code Copied',
      description: 'Share this code with caregivers under Settings → Share With Your Doctor.'
    });
  };

  useEffect(() => {
    setMounted(true);
    const updateIdentity = () => {
      if (role === 'doctor' || role === 'professional') {
        setInitials('DV');
        setUserLabel('Dr. Vivek');
        return;
      }
      if (role === 'nurse') {
        setInitials('NS');
        setUserLabel('Sister Shilpa (Nurse)');
        return;
      }
      const cg = HealthRepository.getCaregiverAttributes();
      if (cg?.name && !cg.name.includes('(You)') && cg.name !== 'Suresh Kumar') {
        setUserLabel(cg.name);
        setInitials(cg.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase());
      } else if (auth?.currentUser?.displayName) {
        setUserLabel(auth.currentUser.displayName);
        setInitials(auth.currentUser.displayName.slice(0, 2).toUpperCase());
      } else if (auth?.currentUser?.email?.includes('abhishek')) {
        setUserLabel('Abhishek Rai');
        setInitials('AR');
      } else {
        setUserLabel('Abhishek Rai');
        setInitials('AR');
      }
    };
    updateIdentity();
    const unsub = auth?.onAuthStateChanged(() => updateIdentity());
    return () => unsub?.();
  }, [role]);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
        className="fixed top-0 left-0 right-0 z-50 flex h-14 w-full items-center justify-between gap-1.5 sm:gap-3 bg-sidebar border-b border-sidebar-border text-sidebar-foreground shadow-md transition-all px-2.5 sm:px-4 lg:px-6"
      >
        {/* Left: Mobile Sidebar Trigger + Brand Logo / Name */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile-only Drawer Menu Trigger (Hidden on Desktop) */}
          <SidebarTrigger
            className="md:hidden h-8 w-8 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white shrink-0 -ml-1 transition-colors"
            title="Open Menu"
          />

          <Link
            href="/dashboard"
            title="Kutumbh Healthcare Dashboard"
            className="flex items-center gap-1.5 sm:gap-2.5 transition-all hover:opacity-85 shrink-0"
          >
            <div className="relative h-7.5 w-7.5 sm:h-8 sm:w-8 overflow-hidden rounded-xl border border-white/20 shadow-2xs bg-white p-0.5 shrink-0">
              <Image
                src="/kutumbh-emblem.png"
                alt="Kutumbh Logo — स्नेह, संबल और स्वास्थ्य"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline font-black text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                कुटुम्ब <span className="font-sans text-[10px] sm:text-[11px] font-bold text-slate-300">Kutumbh</span>
              </span>
              <span className="text-[8px] text-sky-400 font-bold hidden sm:block font-sans -mt-0.5">
                स्नेह, संबल और स्वास्थ्य
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Compact Global Search Input Trigger */}
        <div className="flex-1 sm:flex-initial flex justify-center sm:justify-start min-w-0 max-w-xs mx-1 sm:mx-2">
          {/* Tablet & Desktop Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 h-8.5 w-48 sm:w-60 md:w-72 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs text-left group"
            title="Search System (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="truncate flex-1 text-slate-400 group-hover:text-slate-200">
              {isDoctor ? 'Search patients, consults...' : isNurse ? 'Search tasks, vitals...' : 'Search medicines, vitals...'}
            </span>
            <kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[9px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden rounded-xl h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Search System (⌘K)"
          >
            <Search className="h-4 w-4 text-sky-400" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        {/* Right: Theme Toggle, Language, Welcome User, User Account Icon */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {/* Theme Toggle */}
          <HeaderControls />

          {/* Language Selector */}
          <LanguageSwitcher />

          <div className="h-4 w-px bg-slate-700/80 mx-0.5 hidden md:block" />

          {/* <Welcome username> */}
          <span className="hidden md:inline-flex text-xs text-slate-300 font-medium whitespace-nowrap">
            Welcome, <strong className="font-bold text-white ml-1">{mounted ? userLabel : 'Dr. Vivek'}</strong>
          </span>

          {/* User Account Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl p-0 overflow-hidden border border-slate-700/80 shadow-2xs hover:scale-105 active:scale-95 transition-all"
                title="User Account"
              >
                <Avatar className="h-full w-full rounded-none">
                  <AvatarFallback
                    className={cn(
                      'rounded-none text-xs font-bold text-white',
                      isDoctor ? 'bg-blue-600' :
                      isNurse ? 'bg-rose-600' :
                      'bg-emerald-600'
                    )}
                    suppressHydrationWarning
                  >
                    {mounted ? initials : 'DV'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl p-2 shadow-2xl border-border/60">
              <div className="px-3 py-2 border-b border-border/40">
                <p className="text-xs font-bold text-foreground truncate" suppressHydrationWarning>
                  {mounted ? userLabel : 'Abhishek Rai'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className={cn(
                    'text-[9px] font-extrabold uppercase tracking-wider',
                    isDoctor ? 'text-blue-600 dark:text-blue-400 border-blue-500/40 bg-blue-500/10' :
                    isNurse ? 'text-rose-700 dark:text-rose-300 border-rose-600/40 bg-rose-500/15' :
                    'text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                  )}>
                    {isDoctor ? 'Doctor Portal' : isNurse ? 'Nurse Portal' : 'Caregiver Portal'}
                  </Badge>
                </div>
              </div>

              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Workspace
              </DropdownMenuLabel>
              {isDoctor ? (
                <>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/dashboard" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>Doctor Dashboard</span>
                      <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-500/30">Home</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/clinic/roster" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>All Patients</span>
                      <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">Roster</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/clinic/register-patient" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>Add New Patient</span>
                      <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-500/30">Register</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/sehat-opd" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>OPD Consults</span>
                      <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-500/30">SeHAT</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyClinicCode} className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10 flex items-center justify-between w-full text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Copy Clinic ID</span>
                    </span>
                    <code className="text-[10px] font-mono text-muted-foreground">{clinicCode}</code>
                  </DropdownMenuItem>
                </>
              ) : isNurse ? (
                <>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/dashboard" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>Nurse Shift MAR</span>
                      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Active Shift</Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                    <Link href="/domiciliary" className="flex items-center justify-between w-full text-xs font-semibold">
                      <span>Bedside Companion</span>
                      <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Procedures</Badge>
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                  <Link href="/dashboard" className="flex items-center justify-between w-full text-xs font-semibold">
                    <span>Family Care Dashboard</span>
                    <Badge variant="outline" className="text-[9px] text-primary border-primary/30">Home</Badge>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Account
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/settings" className="flex items-center gap-2 text-xs font-medium">
                  <User className="h-4 w-4 text-primary" />
                  <span>Profile & Privacy</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/privacy" className="flex items-center gap-2 text-xs font-medium">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  <span>Data Rights</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await signOutUser();
                  } catch {}
                  window.location.href = '/login';
                }}
                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out / Switch</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsCrisisOpen(true)}
                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Emergency Help</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Crisis Helpline Modal */}
      <CrisisEscalationModal
        isOpen={isCrisisOpen}
        onClose={() => setIsCrisisOpen(false)}
        severityReason="Immediate caregiver crisis support requested."
      />

      {/* Global Command Palette (Cmd+K) */}
      <GlobalCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Caregiver Bedside Troubleshooting Modal */}
      <CaregiverTroubleshootingModal
        isOpen={isTroubleshootingOpen}
        onClose={() => setIsTroubleshootingOpen(false)}
      />
    </>
  );
}
