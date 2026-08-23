'use client';

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
  Stethoscope
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const navSections = [
    {
      title: t('groupOverview'),
      items: [
        {
          href: '/dashboard',
          label: t('dashboard'),
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      title: t('groupDailyCare'),
      items: [
        {
          href: '/domiciliary',
          label: t.has('domiciliary') ? t('domiciliary') : 'Bedside Companion',
          icon: Bed,
          badge: null
        },
        {
          href: '/medications',
          label: t.has('medications') ? t('medications') : 'Medication Schedule',
          icon: ClipboardList,
          badge: null
        },
        {
          href: '/vital-logs',
          label: t('vitalLogs'),
          icon: Activity,
          badge: null
        },
        {
          href: '/appointments',
          label: t('appointments'),
          icon: CalendarDays,
          badge: null
        },
        {
          href: '/care-circle',
          label: t('careCircle'),
          icon: Users,
          badge: null
        }
      ]
    },
    {
      title: t('groupClinicalAssessment'),
      items: [
        {
          href: '/onboarding',
          label: t.has('onboarding') ? t('onboarding') : 'Clinical Onboarding Wizard',
          icon: Sparkles,
          badge: 'Setup',
          isHighlighted: true
        },
        {
          href: '/stress-calculator',
          label: t.has('stressCalculator') ? t('stressCalculator') : 'Burden & Stress Gauge',
          icon: HeartPulse,
          badge: 'Zarit'
        },
        {
          href: '/reports',
          label: t('reports'),
          icon: FileText,
          badge: null
        }
      ]
    },
    {
      title: t('groupEducation'),
      items: [
        {
          href: '/modules',
          label: t('modules'),
          icon: GraduationCap,
          badge: null
        },
        {
          href: '/simulations',
          label: t('simulations'),
          icon: Bot,
          badge: '21 Sims'
        },
        {
          href: '/assessment-guide',
          label: t('assessmentuide'),
          icon: Stethoscope,
          badge: null
        }
      ]
    },
    {
      title: t('groupKnowledge'),
      items: [
        {
          href: '/resources',
          label: t('resources'),
          icon: BookMarked,
          badge: null
        },
        {
          href: '/videos',
          label: t('videos'),
          icon: Video,
          badge: null
        },
        {
          href: '/podcasts',
          label: t('podcasts'),
          icon: Mic,
          badge: null
        },
        {
          href: '/sehat-opd',
          label: t('sehatOpd'),
          icon: Computer,
          badge: null
        }
      ]
    }
  ];

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border bg-sidebar-background shadow-xl"
    >
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border/50">
        <Link
          href="/dashboard"
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
    </Sidebar>
  );
}
