
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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  GraduationCap,
  Bot,
  Video,
  Mic,
  BookMarked,
  LifeBuoy,
  FileText,
  Computer,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Users,
  Bed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslations } from 'next-intl';

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const links = [
    { href: `/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/modules`, label: t('modules'), icon: GraduationCap },
    { href: `/simulations`, label: t('simulations'), icon: Bot },
    { href: '/stress-calculator', label: t.has('stressCalculator') ? t('stressCalculator') : 'Stress Gauge', icon: HeartPulse },
    { href: '/domiciliary', label: t.has('domiciliary') ? t('domiciliary') : 'Bedside Companion', icon: Bed },
    { href: '/medications', label: t.has('medications') ? t('medications') : 'Medications', icon: ClipboardList },
    { href: '/care-circle', label: t('careCircle'), icon: Users },
    { href: `/appointments`, label: t('appointments'), icon: CalendarDays },
    { href: '/vital-logs', label: t('vitalLogs'), icon: HeartPulse },
    { href: '/reports', label: t('reports'), icon: FileText },
    { href: `/resources`, label: t('resources'), icon: BookMarked },
    { href: `/assessment-guide`, label: t('assessmentuide'), icon: FileText },
    { href: `/videos`, label: t('videos'), icon: Video },
    { href: `/podcasts`, label: t('podcasts'), icon: Mic },
    { href: `/sehat-opd`, label: t('sehatOpd'), icon: Computer },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border bg-sidebar-background shadow-xl"
    >
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-sidebar-border/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-all duration-300 hover:opacity-80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-primary/20 shadow-sm">
            <Image
              src="/logo.png"
              alt="Sanjeevani Logo"
              fill
              className="object-cover"
            />
          </div>
          <span
            className={cn(
              'text-xl font-bold font-headline tracking-tighter text-sidebar-foreground group-data-[collapsible=icon]:hidden'
            )}
          >
            Sanjeevani
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4 gap-6">
        <SidebarMenu className="gap-1.5">
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(link.href)}
                tooltip={{ children: link.label }}
                className={cn(
                  "h-11 px-4 rounded-lg transition-all duration-200",
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href={link.href} className="flex items-center gap-3">
                  <link.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive(link.href) ? "scale-110" : "opacity-70"
                  )} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
