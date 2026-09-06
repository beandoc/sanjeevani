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
  HeartPulse,
  Pill,
  Bed
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/role-context';
import { CrisisEscalationModal } from '@/components/crisis/crisis-escalation-modal';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useProfile();
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';

  // Navigation Items mapped strictly to each Persona
  const doctorNavItems = [
    {
      href: '/clinic/roster',
      label: 'Patients',
      icon: Stethoscope,
      match: (path: string) => path.startsWith('/clinic')
    },
    {
      href: '/sehat-opd',
      label: 'Consults',
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
      label: 'Cockpit',
      icon: LayoutDashboard,
      match: (path: string) => path === '/dashboard'
    }
  ];

  const nurseNavItems = [
    {
      href: '/dashboard',
      label: 'Shift',
      icon: LayoutDashboard,
      match: (path: string) => path === '/dashboard'
    },
    {
      href: '/medications',
      label: 'MAR Meds',
      icon: Pill,
      match: (path: string) => path.startsWith('/medications')
    },
    {
      href: '/domiciliary',
      label: 'Bedside',
      icon: Bed,
      match: (path: string) => path.startsWith('/domiciliary')
    },
    {
      href: '/vital-logs',
      label: 'Vitals',
      icon: HeartPulse,
      match: (path: string) => path.startsWith('/vital-logs') || path.startsWith('/vitals')
    }
  ];

  const caregiverNavItems = [
    {
      href: '/dashboard',
      label: 'Today',
      icon: LayoutDashboard,
      match: (path: string) => path === '/dashboard'
    },
    {
      href: '/medications',
      label: 'Meds',
      icon: Pill,
      match: (path: string) => path.startsWith('/medications')
    },
    {
      href: '/vital-logs',
      label: 'Vitals',
      icon: HeartPulse,
      match: (path: string) => path.startsWith('/vital-logs') || path.startsWith('/vitals')
    },
    {
      href: '/care-circle',
      label: 'Care Team',
      icon: Users2,
      match: (path: string) => path.startsWith('/care-circle') || path.startsWith('/clinic/dyad')
    }
  ];

  const navItems = isDoctor
    ? doctorNavItems
    : isNurse
    ? nurseNavItems
    : caregiverNavItems;

  // Split items for left and right of the central SOS button
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2, 4);

  // Persona-specific active highlights
  const activeColorClasses = isDoctor
    ? { text: 'text-blue-600 dark:text-blue-400 font-bold', bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-xs', dot: 'bg-blue-600 dark:bg-blue-400' }
    : isNurse
    ? { text: 'text-rose-600 dark:text-rose-400 font-bold', bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs', dot: 'bg-rose-600 dark:bg-rose-400' }
    : { text: 'text-emerald-600 dark:text-emerald-400 font-bold', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs', dot: 'bg-emerald-600 dark:bg-emerald-400' };

  const renderNavLink = (item: (typeof navItems)[0]) => {
    const isActive = item.match(pathname);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative group select-none min-h-[48px] touch-target',
          isActive
            ? activeColorClasses.text
            : 'text-muted-foreground hover:text-foreground font-medium'
        )}
      >
        <div
          className={cn(
            'p-1.5 rounded-xl transition-all',
            isActive
              ? activeColorClasses.bg + ' scale-110'
              : 'group-hover:bg-muted'
          )}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-[11px] sm:text-xs tracking-normal mt-0.5 leading-none font-medium truncate max-w-[64px] text-center">
          {item.label}
        </span>
        {isActive && (
          <span className={cn('absolute -top-1 w-1.5 h-1.5 rounded-full animate-pulse', activeColorClasses.dot)} aria-hidden="true" />
        )}
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto gap-1">
          {/* Left Primary Nav Actions */}
          {leftItems.map(renderNavLink)}

          {/* Central Thumb-Zone Action: 1-Touch Crisis / Emergency Escalation */}
          <button
            type="button"
            onClick={() => setIsCrisisOpen(true)}
            aria-label="Emergency help: call helplines or alert your care team"
            aria-haspopup="dialog"
            className="flex flex-col items-center justify-center -mt-3 mx-1 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 transition-transform active:scale-95 group-hover:scale-105 border-2 border-background">
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25 pointer-events-none" />
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mt-1 leading-none">
              SOS
            </span>
          </button>

          {/* Right Primary Nav Actions */}
          {rightItems.map(renderNavLink)}
        </div>
      </nav>

      {/* Emergency Crisis Modal */}
      <CrisisEscalationModal isOpen={isCrisisOpen} onClose={() => setIsCrisisOpen(false)} />
    </>
  );
}
