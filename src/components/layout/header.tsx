'use client';

import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, User, LifeBuoy, ShieldAlert, PhoneCall, Sparkles } from 'lucide-react';
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

export function Header() {
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 bg-background/80 px-4 sm:px-6 md:px-10 backdrop-blur-xl border-b border-border/50 transition-all">
        {/* Left: Mobile Trigger & Brand */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-muted/80" />
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
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
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
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

          {/* Profile Dropdown */}
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
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-2 shadow-2xl border-border/60">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Caregiver Profile
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
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
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10">
                <Link href="/login" className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>Switch Account / Sign In</span>
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
    </>
  );
}
