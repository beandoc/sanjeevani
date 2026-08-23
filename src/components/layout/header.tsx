'use client';

import React, { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, User, LifeBuoy, ShieldAlert, PhoneCall, Sparkles, Search, HeartPulse } from 'lucide-react';
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

export function Header() {
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);

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
      <header className="sticky top-0 z-40 flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 bg-background/80 px-4 sm:px-6 md:px-10 backdrop-blur-xl border-b border-border/50 transition-all">
        {/* Left: Mobile Trigger & Brand & Search */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-muted/80" />
          </div>
          <Link href="/login" title="Navigate to Main Login & Account Selection" className="flex items-center gap-2 md:hidden">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-primary/20">
              <Image
                src="/logo.png"
                alt="Sanjeevani Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-headline font-black text-base tracking-tight text-foreground">
              Sanjeevani
            </span>
          </Link>

          {/* Desktop Global Search Input Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-3 h-10 px-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 text-muted-foreground transition-all w-64 lg:w-80 text-xs text-left"
          >
            <Search className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate flex-1">Search tools, drugs, triage...</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
          {/* Mobile Search Icon Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden h-9 w-9 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground"
            title="Global Search (⌘K)"
          >
            <Search className="h-4 w-4 text-primary" />
          </Button>

          {/* Caregiver Bedside Troubleshooting Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTroubleshootingOpen(true)}
            className="hidden lg:flex rounded-full h-8 sm:h-9 px-3 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 shadow-xs gap-1.5 shrink-0"
          >
            <HeartPulse className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Bedside Triage</span>
          </Button>

          {/* Quick 1-Click Crisis Escalation Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCrisisOpen(true)}
            className="rounded-full h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/60 shadow-xs gap-1.5 shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="hidden sm:inline">Crisis & Helplines</span>
            <span className="sm:hidden font-mono">14416 / 112</span>
          </Button>

          <HeaderControls />
          <LanguageSwitcher />

          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Profile & Role Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 overflow-hidden border border-border/50 shadow-xs hover:scale-105 active:scale-95 transition-all"
              >
                <Avatar className="h-full w-full rounded-none">
                  <AvatarFallback className="rounded-none bg-primary/15 text-primary text-xs font-bold">
                    SK
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl p-2 shadow-2xl border-border/60">
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Switch Role / Dashboard
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/dashboard" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Caregiver Hub</span>
                  <Badge variant="outline" className="text-[9px]">Caregiver</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/clinic/roster" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Doctor / Clinician Roster</span>
                  <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">Doctor</Badge>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/domiciliary" className="flex items-center justify-between w-full text-xs font-semibold">
                  <span>Nurse / Bedside Companion</span>
                  <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Nurse</Badge>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Account & Settings
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/settings" className="flex items-center gap-2 text-xs font-medium">
                  <User className="h-4 w-4 text-primary" />
                  <span>Profile & Care Scenario</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/privacy" className="flex items-center gap-2 text-xs font-medium">
                  <LifeBuoy className="h-4 w-4 text-primary" />
                  <span>Privacy & DPDP Rights</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-primary">
                  <User className="h-4 w-4 text-primary" />
                  <span>Main Login / Switch Persona</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsCrisisOpen(true)}
                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Emergency Escalation</span>
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
