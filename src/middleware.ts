import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/privacy', '/resources', '/assessment-guide', '/modules', '/simulations'];
const isPublic = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname) || pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (!request.cookies.has('__session')) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)'] };
