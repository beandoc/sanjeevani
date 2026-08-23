'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  GraduationCap,
  Bot,
  Video,
  Mic,
  BookMarked,
  FileText,
  Computer,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Users,
  Bed,
  Sparkles,
  Activity,
  Stethoscope,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useProfile, Role } from '@/context/role-context';
import { GlobalCommandPalette } from '@/components/search/global-command-palette';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge: string | null;
  isHighlighted?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');
  const { role, setRole } = useProfile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';

  const doctorSections: NavSection[] = [
    {
      title: 'Doctor & Clinician Portal',
      items: [
        {
          href: '/clinic/roster',
          label: 'Patient Roster & Risk Banding',
          icon: Stethoscope,
          badge: 'Roster',
          isHighlighted: true
        },
        {
          href: '/sehat-opd',
          label: 'SeHAT OPD Tele-Consultation',
          icon: Computer,
          badge: 'Tele-OPD'
        },
        {
          href: '/reports',
          label: 'Longitudinal Trajectory Reports',
          icon: FileText,
          badge: 'Analytics'
        }
      ]
    },
    {
      title: 'Pharmacology & Diagnostics',
      items: [
        {
          href: '/medications',
          label: 'AGS Beers 2023 Drug Safety',
          icon: ClipboardList,
          badge: 'BEERS'
        },
        {
          href: '/stress-calculator',
          label: 'Zarit Psychometrics Review',
          icon: HeartPulse,
          badge: 'ZBI-22'
        },
        {
          href: '/vital-logs',
          label: 'Patient Vitals Telemetry',
          icon: Activity,
          badge: 'Vitals'
        }
      ]
    },
    {
      title: 'Clinical Workforce & Training',
      items: [
        {
          href: '/modules',
          label: 'Geriatric Clinical Modules',
          icon: GraduationCap,
          badge: 'Modules'
        },
        {
          href: '/simulations',
          label: 'Virtual Clinical Simulations',
          icon: Bot,
          badge: '21 Sims'
        },
        {
          href: '/onboarding',
          label: 'Patient Intake Wizard',
          icon: Sparkles,
          badge: 'Intake'
        }
      ]
    },
    {
      title: 'Switch Portal / Sign Out',
      items: [
        {
          href: '/login',
          label: 'Main Sign In / Account Switcher',
          icon: Users,
          badge: 'Login'
        }
      ]
    }
  ];

  const nurseSections: NavSection[] = [
    {
      title: 'Nurse & Attendant Portal',
      items: [
        {
          href: '/domiciliary',
          label: 'Bedside Companion & Q2H Clock',
          icon: Bed,
          badge: 'Bedside',
          isHighlighted: true
        },
        {
          href: '/vital-logs',
          label: 'Vital Signs & Shift Telemetry',
          icon: Activity,
          badge: 'Vitals'
        },
        {
          href: '/medications',
          label: 'eMAR Medication Schedule',
          icon: ClipboardList,
          badge: 'eMAR'
        }
      ]
    },
    {
      title: 'Care Coordination & Pathway',
      items: [
        {
          href: '/appointments',
          label: 'Telemedicine & Doctor Visits',
          icon: CalendarDays,
          badge: 'Visits'
        },
        {
          href: '/care-circle',
          label: 'Care Circle Dyad Roster',
          icon: Users,
          badge: 'Team'
        },
        {
          href: '/onboarding',
          label: 'Clinical Onboarding Intake',
          icon: Sparkles,
          badge: 'Setup'
        }
      ]
    },
    {
      title: 'Skill Modules & Training',
      items: [
        {
          href: '/modules',
          label: 'Practical Nursing Modules',
          icon: GraduationCap,
          badge: 'Nursing'
        },
        {
          href: '/simulations',
          label: 'Interactive Patient Simulations',
          icon: Bot,
          badge: '21 Sims'
        }
      ]
    },
    {
      title: 'Switch Portal / Sign Out',
      items: [
        {
          href: '/login',
          label: 'Main Sign In / Account Switcher',
          icon: Users,
          badge: 'Login'
        }
      ]
    }
  ];

  const caregiverSections: NavSection[] = [
    {
      title: 'Family Caregiver Portal',
      items: [
        {
          href: '/dashboard',
          label: 'Caregiver Dashboard',
          icon: LayoutDashboard,
          badge: 'Caregiver'
        },
        {
          href: '/domiciliary',
          label: 'Bedside Care & Turn Alarm',
          icon: Bed,
          badge: 'Bedside'
        },
        {
          href: '/medications',
          label: 'Medication Schedule & Alarms',
          icon: ClipboardList,
          badge: 'Schedule'
        },
        {
          href: '/vital-logs',
          label: 'Vital Signs & Daily Log',
          icon: Activity,
          badge: 'Vitals'
        },
        {
          href: '/appointments',
          label: 'Doctor Appointments',
          icon: CalendarDays,
          badge: null
        },
        {
          href: '/care-circle',
          label: 'Family Care Circle',
          icon: Users,
          badge: null
        }
      ]
    },
    {
      title: 'Clinical Tools & Assessment',
      items: [
        {
          href: '/onboarding',
          label: 'Clinical Onboarding Wizard',
          icon: Sparkles,
          badge: 'Setup',
          isHighlighted: true
        },
        {
          href: '/reports',
          label: 'Clinical Care Gap Reports',
          icon: FileText,
          badge: null
        }
      ]
    },
    {
      title: 'Education & VR Simulations',
      items: [
        {
          href: '/modules',
          label: 'Learning Modules',
          icon: GraduationCap,
          badge: null
        },
        {
          href: '/simulations',
          label: '21 Virtual Simulations',
          icon: Bot,
          badge: 'Sims'
        },
        {
          href: '/assessment-guide',
          label: 'Clinical Assessment Guide',
          icon: Stethoscope,
          badge: null
        }
      ]
    },
    {
      title: 'Account & Login',
      items: [
        {
          href: '/login',
          label: 'Main Sign In / Switch Role',
          icon: Users,
          badge: 'Login'
        }
      ]
    }
  ];

  const navSections = isDoctor ? doctorSections : isNurse ? nurseSections : caregiverSections;

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border bg-sidebar-background shadow-xl"
    >
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border/50">
        <Link
          href="/login"
          title="Navigate to Main Login & Account Selection"
          className="flex items-center gap-3 transition-all duration-300 hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-primary/20 shadow-sm shrink-0">
            <Image
              src="/logo.png"
              alt="Sanjeevani Logo"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-black font-headline tracking-tight text-sidebar-foreground">
              Sanjeevani
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold -mt-0.5 tracking-wider uppercase">
              Geriatric Care
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-4 overflow-y-auto">
        {/* Active Portal Indicator & Quick Role Switcher */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div className="px-3 py-2.5 rounded-xl bg-sidebar-accent/60 border border-sidebar-border group-data-[collapsible=icon]:hidden space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Active Portal</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wider',
                    isDoctor ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' :
                    isNurse ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                    'border-primary/40 text-primary bg-primary/10'
                  )}
                >
                  {isDoctor ? 'Doctor Portal' : isNurse ? 'Nurse Portal' : 'Caregiver Portal'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex-1 text-center',
                    role === 'caregiver' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-sidebar-accent'
                  )}
                >
                  Caregiver
                </button>
                <button
                  type="button"
                  onClick={() => setRole('nurse')}
                  className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex-1 text-center',
                    role === 'nurse' ? 'bg-amber-600 text-white shadow-xs' : 'text-muted-foreground hover:bg-sidebar-accent'
                  )}
                >
                  Nurse
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={cn(
                    'text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex-1 text-center',
                    isDoctor ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:bg-sidebar-accent'
                  )}
                >
                  Doctor
                </button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Quick Omnibar Search Trigger */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsSearchOpen(true)}
                  tooltip={{ children: 'Quick Search (⌘K)' }}
                  className="h-9 px-3 rounded-xl bg-primary/5 hover:bg-primary/15 text-primary font-semibold text-xs border border-primary/20 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Search className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">Quick Search</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 group-data-[collapsible=icon]:hidden">
                    ⌘K
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navSections.map((section, idx) => (
          <SidebarGroup key={idx} className="p-0">
            {section.title && (
              <SidebarGroupLabel className="px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 mb-1 group-data-[collapsible=icon]:hidden">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={{ children: link.label }}
                        className={cn(
                          'h-9 px-3 rounded-xl transition-all duration-200 text-xs font-medium',
                          active
                            ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20'
                            : link.isHighlighted
                            ? 'bg-primary/10 text-primary hover:bg-primary/15 font-semibold'
                            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/85'
                        )}
                      >
                        <Link href={link.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <link.icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-200',
                                active ? 'scale-110 text-primary-foreground' : link.isHighlighted ? 'text-primary' : 'opacity-70'
                              )}
                            />
                            <span className="truncate">{link.label}</span>
                          </div>

                          {link.badge && (
                            <span
                              className={cn(
                                'text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider group-data-[collapsible=icon]:hidden shrink-0 ml-1.5',
                                active
                                  ? 'bg-white/20 text-white'
                                  : link.isHighlighted
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Global Omnibar Command Palette */}
      <GlobalCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </Sidebar>
  );
}
