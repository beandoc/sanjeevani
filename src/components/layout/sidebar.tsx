'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
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
  UserPlus,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/role-context';
import { auth } from '@/lib/firebase/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge: string | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useProfile();
  const { isMobile, setOpenMobile, toggleSidebar, state } = useSidebar();

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
    if (href === '/clinic/roster') {
      return (
        pathname.startsWith('/clinic/roster') ||
        pathname.startsWith('/clinic/dyad') ||
        pathname.startsWith('/clinic/trajectory')
      );
    }
    if (href === '/clinic/register-patient') {
      return (
        pathname.startsWith('/clinic/register-patient') ||
        pathname.startsWith('/clinic/add-patient')
      );
    }
    return pathname.startsWith(href);
  };

  const isDoctor = role === 'doctor' || role === 'professional';
  const isNurse = role === 'nurse';

  const doctorSections: NavSection[] = [
    {
      title: 'Doctor Portal',
      items: [
        {
          href: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null
        },
        {
          href: '/clinic/roster',
          label: 'All Patients',
          icon: Users,
          badge: null
        },
        {
          href: '/clinic/register-patient',
          label: 'Add New Patient',
          icon: UserPlus,
          badge: null
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
          badge: 'Live'
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
          badge: null
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
          badge: null
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
      className="border-r border-sidebar-border bg-sidebar shadow-xl"
    >
      <SidebarContent className="px-2.5 py-3 gap-3 overflow-y-auto group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:gap-1.5 overflow-x-hidden">
        {/* First Item: Hamburger Menu Toggle */}
        <SidebarGroup className="p-0 group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  tooltip={{ children: state === 'collapsed' ? 'Expand Menu (⌘B)' : 'Collapse Menu (⌘B)' }}
                  onClick={toggleSidebar}
                  className="h-9 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-between text-xs transition-colors cursor-pointer group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
                  aria-label={state === 'collapsed' ? 'Expand Menu' : 'Collapse Menu'}
                >
                  <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                    <Menu className="h-4 w-4 text-slate-300 group-hover:text-white shrink-0" />
                    <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
                      {state === 'collapsed' ? 'Expand Menu' : 'Collapse Menu'}
                    </span>
                  </div>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1 font-mono text-[9px] font-medium text-slate-400 group-data-[collapsible=icon]:hidden">
                    ⌘B
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navSections.map((section, idx) => (
          <SidebarGroup key={idx} className="p-0 group-data-[collapsible=icon]:p-0">
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

                  return (
                    <SidebarMenuItem key={link.href} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={{ children: link.label }}
                        className={cn(
                          'h-9 px-3 rounded-xl transition-all duration-200 text-xs font-semibold',
                          'group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center',
                          active
                            ? activeStyle
                            : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                        )}
                      >
                        <Link
                          href={link.href}
                          title={link.label}
                          className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                            <link.icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-200',
                                active
                                  ? 'scale-110 text-white'
                                  : 'text-slate-300 group-hover:text-white'
                              )}
                            />
                            <span className="truncate group-data-[collapsible=icon]:hidden">{link.label}</span>
                          </div>

                          {link.badge && (
                            <span
                              className={cn(
                                'text-xs font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider group-data-[collapsible=icon]:hidden shrink-0 ml-1.5 border',
                                active
                                  ? 'bg-white/20 text-white border-white/30'
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

      <SidebarRail />
    </Sidebar>
  );
}
