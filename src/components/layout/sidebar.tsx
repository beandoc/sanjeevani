
'use client';

import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();

  const links = [
    { href: `/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/modules`, label: 'Modules', icon: GraduationCap },
    { href: `/simulations`, label: 'Simulations', icon: Bot },
    { href: `/appointments`, label: 'Appointments', icon: CalendarDays },
    { href: '/vital-logs', label: 'Vital Logs', icon: ClipboardList },
    { href: `/videos`, label: 'Video Library', icon: Video },
    { href: `/podcasts`, label: 'Podcasts', icon: Mic },
    { href: `/assessment-guide`, label: 'Assessment Guide', icon: FileText },
    { href: `/resources`, label: 'Resources', icon: BookMarked },
    { href: `/sehat-opd`, label: 'Sehat OPD', icon: Computer },
  ];

  // A helper function to check if a link is active
  const isActive = (href: string) => {
    // Exact match for the dashboard page
    if (href === '/dashboard') {
      return pathname === href;
    }
    // For all other links, check if the current path starts with the link's href.
    // This handles nested routes correctly (e.g., /simulations/managing-a-fall).
    return pathname.startsWith(href);
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="p-4">
        <Link
          href={`/dashboard`}
          className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <LifeBuoy className="h-8 w-8 text-primary" />
          <h1
            className={cn(
              'text-xl font-bold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden'
            )}
          >
            Sanjeevani
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(link.href)}
                tooltip={{ children: link.label }}
              >
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
