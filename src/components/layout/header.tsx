'use client';

import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  User,
  LifeBuoy,
  ShieldAlert,
  PhoneCall,
  Sparkles,
  Search,
  HeartPulse,
  Stethoscope,
  Computer,
  Bed,
  Activity,
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
import { LanguageSwitcher } from '../language-switcher';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';
import { GlobalCommandPalette } from '@/components/search/global-command-palette';
import { CaregiverTroubleshootingModal } from '@/components/search/caregiver-troubleshooting-modal';
import { useProfile } from '@/context/role-context';

export function Header() {
  const { role } = useProfile();
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';
  const isCaregiver = !isDoctor && !isNurse;

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
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-1.5 sm:gap-4 bg-background/95 px-3 sm:px-6 md:px-8 backdrop-blur-xl border-b border-border/50 transition-all">
        {/* Left: Trigger & Brand & Search */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger
            className="h-9 w-9 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground shrink-0"
            title="Toggle Sidebar (⌘B)"
          />
          <Link href="/login" title="Navigate to Main Login & Account Selection" className="flex items-center gap-2 md:hidden">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-border/80 bg-white p-0.5 shrink-0">
              <Image
                src="/kutumbh-emblem.png"
                alt="Kutumbh Logo — स्नेह, संबल और स्वास्थ्य"
                fill
                className="object-contain"
              />
            </div>
            <div className="leading-none">
              <span className="font-headline font-black text-xs tracking-tight text-foreground block">
                कुटुम्ब <span className="font-sans text-[10px] font-bold text-muted-foreground">Kutumbh</span>
              </span>
              <span className="text-[8px] text-primary font-bold block font-sans">
                स्नेह, संबल और स्वास्थ्य
              </span>
            </div>
          </Link>

          {/* Desktop Global Search Input Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 h-9 px-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 text-muted-foreground transition-all w-60 lg:w-72 text-xs text-left"
          >
            <Search className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate flex-1">
              {isDoctor ? 'Search patients, consults, medicines...' : isNurse ? 'Search tasks, medicines, vitals...' : 'Search medicines, vitals, care tasks...'}
            </span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {/* Mobile Search Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden h-8 w-8 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground"
            title="Global Search (⌘K)"
          >
            <Search className="h-3.5 w-3.5 text-primary" />
          </Button>

          {/* ─── DOCTOR PORTAL ADDONS ─── */}
          {isDoctor && (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:inline-flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <Link href="/clinic/roster">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Patients</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <Link href="/sehat-opd">
                  <Computer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Consults</span>
                </Link>
              </Button>
            </>
          )}

          {/* ─── NURSE PORTAL ADDONS ─── */}
          {isNurse && (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:inline-flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <Link href="/domiciliary">
                  <Bed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Today</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <Link href="/vital-logs">
                  <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Vitals</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCrisisOpen(true)}
                className="hidden sm:inline-flex rounded-full h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>SOS</span>
              </Button>
            </>
          )}

          {/* ─── CAREGIVER PORTAL ADDONS ─── */}
          {isCaregiver && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTroubleshootingOpen(true)}
                className="hidden lg:inline-flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <HeartPulse className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Bedside Help</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCrisisOpen(true)}
                className="hidden sm:inline-flex rounded-full h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 shadow-xs gap-1.5 shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>SOS & Helplines</span>
              </Button>
            </>
          )}

          <HeaderControls />
          <LanguageSwitcher />

          <div className="h-5 w-px bg-border/60 mx-0.5 hidden sm:block" />

          {/* Profile & Role Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 overflow-hidden border border-border/50 shadow-xs hover:scale-105 active:scale-95 transition-all"
              >
                <Avatar className="h-full w-full rounded-none">
                  <AvatarFallback className="rounded-none bg-primary/15 text-primary text-xs font-bold">
                    {role === 'doctor' || role === 'professional' ? 'DV' : role === 'nurse' ? 'NA' : 'SK'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl p-2 shadow-2xl border-border/60">
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Switch View
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/dashboard" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Family Today</span>
                  <Badge variant="outline" className="text-[9px] text-primary border-primary/30">Kutumbh</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/clinic/roster" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Doctor Patients</span>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">Doctor</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/domiciliary" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Nurse Today</span>
                  <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Nurse</Badge>
                </Link>
              </DropdownMenuItem>

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
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-primary">
                  <User className="h-4 w-4 text-primary" />
                  <span>Sign In / Switch</span>
                </Link>
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
