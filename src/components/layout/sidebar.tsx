'use client';

import React, { useState, useEffect } from 'react';
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  GraduationCap,
  Bot,
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
import { useProfile } from '@/context/role-context';
import { auth } from '@/lib/firebase/client';
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
  const { role, setRole } = useProfile();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close mobile drawer on route change (keep desktop state intact)
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  useEffect(() => {
    if (!auth) return;
    const unsub = auth.onAuthStateChanged((user) => {
      const email = user?.email || '';

      // Auto-correct active role strictly by account persona so sessions never leak or mix up
      if (email) {
        const isEmailDoctor = email.toLowerCase().includes('doctor') || email.toLowerCase().includes('clinic');
        const isEmailNurse = email.toLowerCase().includes('nurse');
        const isEmailCaregiver = email.toLowerCase().includes('caregiver');

        if (isEmailCaregiver && role !== 'caregiver') {
          setRole('caregiver');
        } else if (isEmailNurse && role !== 'nurse') {
          setRole('nurse');
        } else if (isEmailDoctor && role !== 'doctor' && role !== 'professional') {
          setRole('doctor');
        }
      }
    });
    return () => unsub();
  }, [role, setRole]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';

  const doctorSections: NavSection[] = [
    {
      title: 'Doctor Portal',
      items: [
        {
          href: '/clinic/roster',
          label: 'Patients',
          icon: Stethoscope,
          badge: null,
          isHighlighted: true
        },
        {
          href: '/sehat-opd',
          label: 'Consults',
          icon: Computer,
          badge: null
        },
        {
          href: '/reports',
          label: 'Reports',
          icon: FileText,
          badge: null
        }
      ]
    },
    {
      title: 'Clinical Tools',
      items: [
        {
          href: '/medications',
          label: 'Medicines',
          icon: ClipboardList,
          badge: null
        },
        {
          href: '/stress-calculator',
          label: 'Stress Review',
          icon: HeartPulse,
          badge: null
        },
        {
          href: '/vital-logs',
          label: 'Vitals',
          icon: Activity,
          badge: null
        }
      ]
    },
    {
      title: 'Care Plans & Learning',
      items: [
        {
          href: '/modules',
          label: 'Learning',
          icon: GraduationCap,
          badge: null
        },
        {
          href: '/simulations',
          label: 'Practice Cases',
          icon: Bot,
          badge: null
        },
        {
          href: '/resources',
          label: 'Resources',
          icon: BookMarked,
          badge: null
        },
        {
          href: '/onboarding',
          label: 'Patient Setup',
          icon: Sparkles,
          badge: null
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          href: '/login',
          label: 'Sign In / Switch',
          icon: Users,
          badge: null
        }
      ]
    }
  ];

  const nurseSections: NavSection[] = [
    {
      title: 'Nurse Portal',
      items: [
        {
          href: '/dashboard',
          label: 'Shift Dashboard',
          icon: LayoutDashboard,
          badge: 'Live',
          isHighlighted: true
        },
        {
          href: '/domiciliary',
          label: 'Bedside Companion',
          icon: Bed,
          badge: null
        },
        {
          href: '/vital-logs',
          label: 'Vitals Log',
          icon: Activity,
          badge: null
        },
        {
          href: '/medications',
          label: 'MAR / Medicines',
          icon: ClipboardList,
          badge: null
        }
      ]
    },
    {
      title: 'Care Coordination',
      items: [
        {
          href: '/appointments',
          label: 'Appointments',
          icon: CalendarDays,
          badge: null
        },
        {
          href: '/care-circle',
          label: 'Care Team',
          icon: Users,
          badge: null
        },
        {
          href: '/onboarding',
          label: 'Patient Setup',
          icon: Sparkles,
          badge: null
        }
      ]
    },
    {
      title: 'Learning',
      items: [
        {
          href: '/modules',
          label: 'Lessons',
          icon: GraduationCap,
          badge: null
        },
        {
          href: '/simulations',
          label: 'Practice Cases',
          icon: Bot,
          badge: null
        },
        {
          href: '/resources',
          label: 'Resources',
          icon: BookMarked,
          badge: null
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          href: '/login',
          label: 'Sign In / Switch',
          icon: Users,
          badge: null
        }
      ]
    }
  ];

  const caregiverSections: NavSection[] = [
    {
      title: 'Family Care',
      items: [
        {
          href: '/dashboard',
          label: 'Today',
          icon: LayoutDashboard,
          badge: null
        },
        {
          href: '/domiciliary',
          label: 'Bedside Care',
          icon: Bed,
          badge: null
        },
        {
          href: '/medications',
          label: 'Medicines',
          icon: ClipboardList,
          badge: null
        },
        {
          href: '/vital-logs',
          label: 'Vitals',
          icon: Activity,
          badge: null
        },
        {
          href: '/appointments',
          label: 'Appointments',
          icon: CalendarDays,
          badge: null
        },
        {
          href: '/care-circle',
          label: 'Care Team',
          icon: Users,
          badge: null
        }
      ]
    },
    {
      title: 'Health Records',
      items: [
        {
          href: '/onboarding',
          label: 'Patient Setup',
          icon: Sparkles,
          badge: null,
          isHighlighted: true
        },
        {
          href: '/reports',
          label: 'Doctor Visit Notes',
          icon: FileText,
          badge: null
        }
      ]
    },
    {
      title: 'Learn',
      items: [
        {
          href: '/resources',
          label: 'Resources',
          icon: BookMarked,
          badge: null,
          isHighlighted: true
        },
        {
          href: '/modules',
          label: 'Lessons',
          icon: GraduationCap,
          badge: null
        },
        {
          href: '/simulations',
          label: 'Practice Cases',
          icon: Bot,
          badge: null
        },
        {
          href: '/assessment-guide',
          label: 'Assessment Guide',
          icon: Stethoscope,
          badge: null
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          href: '/login',
          label: 'Sign In / Switch',
          icon: Users,
          badge: null
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
      <SidebarHeader className="h-16 flex items-center px-3.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center border-b border-sidebar-border/50">
        <Link
          href="/dashboard"
          title="Kutumbh Healthcare Dashboard"
          className="flex items-center gap-3 transition-all duration-300 hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="relative h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 overflow-hidden rounded-xl border border-border/80 shadow-xs bg-white p-0.5 shrink-0">
            <Image
              src="/kutumbh-emblem.png"
              alt="Kutumbh Logo — स्नेह, संबल और स्वास्थ्य"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-black font-headline tracking-tight text-white">
              कुटुम्ब <span className="text-xs font-bold text-slate-300 font-sans">Kutumbh</span>
            </span>
            <span className="text-[10px] text-sky-400 font-bold -mt-0.5 tracking-tight font-sans">
              स्नेह, संबल और स्वास्थ्य
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-3.5 gap-4 overflow-y-auto">
        {/* Active Portal Indicator & Quick Role Switcher */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 group-data-[collapsible=icon]:hidden space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-extrabold text-slate-300 tracking-wider">Current View</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-extrabold uppercase tracking-wider',
                    isDoctor ? 'border-blue-500/50 text-blue-400 bg-blue-500/15' :
                      isNurse ? 'border-rose-600/60 text-rose-300 bg-rose-950/70' :
                        'border-emerald-500/50 text-emerald-400 bg-emerald-500/15'
                  )}
                >
                  {isDoctor ? 'Doctor Portal' : isNurse ? 'Nurse Portal' : 'Caregiver Portal'}
                </Badge>
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
                  tooltip={{ children: 'Search System (⌘K)' }}
                  onClick={() => setIsSearchOpen(true)}
                  className="h-9 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                    <span>Search</span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1 font-mono text-[9px] font-medium text-slate-400">
                    ⌘K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navSections.map((section, idx) => (
          <SidebarGroup key={idx} className="p-0">
            {section.title && (
              <SidebarGroupLabel className="px-3 text-xs uppercase font-extrabold tracking-wider text-slate-300/90 mb-1 group-data-[collapsible=icon]:hidden">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((link) => {
                  const active = isActive(link.href);
                  const activeStyle = isDoctor
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50 border border-blue-400/40'
                    : isNurse
                    ? 'bg-rose-800 text-white font-bold shadow-md shadow-rose-950/60 border border-rose-500/50'
                    : 'bg-emerald-700 text-white font-bold shadow-md shadow-emerald-950/50 border border-emerald-400/40';

                  const highlightStyle = isDoctor
                    ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 hover:text-white border border-blue-500/30'
                    : isNurse
                    ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 hover:text-white border border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:text-white border border-emerald-500/30';

                  return (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={{ children: link.label }}
                        className={cn(
                          'h-9 px-3 rounded-xl transition-all duration-200 text-xs font-semibold',
                          active
                            ? activeStyle
                            : link.isHighlighted
                              ? highlightStyle
                              : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                        )}
                      >
                        <Link href={link.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <link.icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-200',
                                active
                                  ? 'scale-110 text-white'
                                  : link.isHighlighted
                                    ? isNurse ? 'text-rose-300' : isDoctor ? 'text-blue-300' : 'text-emerald-300'
                                    : 'text-slate-300 group-hover:text-white'
                              )}
                            />
                            <span className="truncate">{link.label}</span>
                          </div>

                          {link.badge && (
                            <span
                              className={cn(
                                'text-xs font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider group-data-[collapsible=icon]:hidden shrink-0 ml-1.5 border',
                                active
                                  ? 'bg-white/20 text-white border-white/30'
                                  : link.isHighlighted
                                    ? isNurse ? 'bg-rose-600 text-white border-rose-500' : isDoctor ? 'bg-blue-600 text-white border-blue-500' : 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-slate-800 text-slate-200 border-slate-700/80 shadow-2xs'
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
      <SidebarRail />
    </Sidebar>
  );
}
