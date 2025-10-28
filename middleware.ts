import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin') || path === '/pos';
  const isSuperAdminRoute = path.startsWith('/super-admin');
  const isLoggedIn = request.cookies.get('admin')?.value === 'true';
  const isSuperAdmin = request.cookies.get('super_admin')?.value === 'true';

  // Super admin routes
  if (isSuperAdminRoute && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Regular admin routes
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/pos', '/super-admin'],
};

