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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('AppSidebar');

  const links = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/modules', label: t('modules'), icon: GraduationCap },
    { href: '/simulations', label: t('simulations'), icon: Bot },
    { href: '/videos', label: t('videoLibrary'), icon: Video },
    { href: '/podcasts', label: t('podcasts'), icon: Mic },
    { href: '/assessment-guide', label: t('assessmentGuide'), icon: FileText },
    { href: '/resources', label: t('resources'), icon: BookMarked },
  ];

  // Remove the locale from the pathname for comparison
  const barePathname = pathname.replace(/^\/(en|hi|mr)/, '');

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <LifeBuoy className="h-8 w-8 text-primary" />
          <h1
            className={cn(
              'text-xl font-bold font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden'
            )}
          >
            {t('title')}
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  barePathname === link.href ||
                  (link.href !== '/dashboard' && barePathname.startsWith(link.href))
                }
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
