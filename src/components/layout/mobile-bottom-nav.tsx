'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  Activity,
  CalendarDays,
  ShieldAlert,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/role-context';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useProfile();
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);

  const isDoctor = role === 'doctor' || role === 'professional';

  // Navigation Items mapped to Persona
  const navItems = isDoctor
    ? [
        {
          href: '/clinic/roster',
          label: 'Roster',
          icon: Stethoscope,
          match: (path: string) => path.startsWith('/clinic')
        },
        {
          href: '/sehat-opd',
          label: 'Tele-OPD',
          icon: CalendarDays,
          match: (path: string) => path.startsWith('/sehat-opd') || path.startsWith('/appointments')
        },
        {
          href: '/reports',
          label: 'Reports',
          icon: Activity,
          match: (path: string) => path.startsWith('/reports')
        },
        {
          href: '/dashboard',
          label: 'Hub',
          icon: LayoutDashboard,
          match: (path: string) => path === '/dashboard'
        }
      ]
    : [
        {
          href: '/dashboard',
          label: 'Home',
          icon: LayoutDashboard,
          match: (path: string) => path === '/dashboard'
        },
        {
          href: '/care-circle',
          label: 'Care Circle',
          icon: Users2,
          match: (path: string) => path.startsWith('/care-circle') || path.startsWith('/clinic/dyad')
        },
        {
          href: '/vital-logs',
          label: 'Vitals',
          icon: HeartPulse,
          match: (path: string) => path.startsWith('/vital-logs') || path.startsWith('/vitals')
        },
        {
          href: '/appointments',
          label: 'Visits',
          icon: CalendarDays,
          match: (path: string) => path.startsWith('/appointments') || path.startsWith('/sehat-opd')
        }
      ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = item.match(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative group select-none min-h-[44px]',
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-xl transition-all',
                    isActive
                      ? 'bg-primary/15 text-primary scale-110 shadow-xs'
                      : 'group-hover:bg-muted'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* 5th Action: 1-Touch Crisis / Emergency Escalation */}
          <button
            type="button"
            onClick={() => setIsCrisisOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-all select-none min-h-[44px]"
            title="Emergency Escalation (14416 / 112)"
          >
            <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-all animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5 leading-none">
              Crisis
            </span>
          </button>
        </div>
      </nav>

      {/* Emergency Crisis Modal */}
      <CrisisEscalationModal isOpen={isCrisisOpen} onClose={() => setIsCrisisOpen(false)} />
    </>
  );
}
