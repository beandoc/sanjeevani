
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User, LifeBuoy } from 'lucide-react';
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

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center gap-4 bg-background/60 px-6 backdrop-blur-xl md:px-10 border-b border-border/40">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 md:gap-6">
        <HeaderControls />
        <LanguageSwitcher />

        <div className="h-8 w-px bg-border/60 mx-2 hidden md:block" />

        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/5 transition-colors relative">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-background" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-11 w-11 rounded-2xl p-0 overflow-hidden border border-border/40 shadow-sm transition-transform hover:scale-105 active:scale-95">
              <Avatar className="h-full w-full rounded-none">
                <Image
                  src="https://picsum.photos/100"
                  alt="User"
                  width={44}
                  height={44}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold">SK</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-2 shadow-2xl border-border/40">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5">
              <Link href="/settings" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5">
              <Link href="/settings" className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40" />
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer focus:bg-destructive/10 text-destructive font-medium">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
