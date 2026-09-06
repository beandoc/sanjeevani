'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_PATHS = ['/privacy', '/resources', '/assessment-guide', '/modules', '/simulations'];
const isPublic = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/** Client-side backstop only. The middleware/session endpoint remains the authority. */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (isPublic(pathname)) return;
    void fetch('/api/auth/session', { cache: 'no-store' }).then((response) => {
      if (!response.ok) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }).catch(() => router.replace(`/login?next=${encodeURIComponent(pathname)}`));
  }, [pathname, router]);
  return <>{children}</>;
}
