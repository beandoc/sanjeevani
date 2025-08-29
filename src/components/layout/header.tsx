
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, HeartHandshake, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useRole } from '@/context/role-context';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function Header() {
  const { role, setRole } = useRole();
  const t = useTranslations('Header');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const roles = [
    {
      value: 'caregiver',
      label: 'Family Caregiver',
      icon: HeartHandshake,
    },
    {
      value: 'professional',
      label: 'Health Professional',
      icon: User,
    },
  ];

  const handleLocaleChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
  };


  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      {/* Role Selector for smaller screens */}
      <div className="flex-1 md:hidden">
        <Select value={role} onValueChange={(value) => setRole(value as 'caregiver' | 'professional')}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                <div className="flex items-center gap-2">
                  <r.icon className="h-4 w-4" />
                  <span>{r.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Selector for larger screens */}
      <div className="hidden flex-1 items-center justify-start md:flex">
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
          {roles.map((r) => (
            <Button
              key={r.value}
              variant={role === r.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRole(r.value as 'caregiver' | 'professional')}
              className={cn(
                'transition-all',
                role === r.value
                  ? 'shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              <r.icon className="mr-2 h-4 w-4" />
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{t('language')}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
              <DropdownMenuRadioItem value="en">{t('english')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="hi">{t('hindi')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mr">{t('marathi')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t('notifications')}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <Image
                  src="https://picsum.photos/100"
                  alt="User"
                  width={40}
                  height={40}
                  data-ai-hint="person face"
                />
                <AvatarFallback>CG</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('profile')}</DropdownMenuItem>
            <DropdownMenuItem>{t('settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
