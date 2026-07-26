import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REDIRECTS: Record<string, string> = {
  '/ofertas':  '/dashboard',
  '/operacao': '/dashboard',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const [from, to] of Object.entries(REDIRECTS)) {
    if (pathname === from || pathname.startsWith(from + '/')) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ofertas', '/ofertas/:path*', '/operacao', '/operacao/:path*'],
};
