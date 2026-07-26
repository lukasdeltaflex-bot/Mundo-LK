import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /ofertas → /dashboard (permanent)
  if (pathname === '/ofertas' || pathname.startsWith('/ofertas/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ofertas', '/ofertas/:path*'],
};
