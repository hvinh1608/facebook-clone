import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth tokens live in localStorage (access) and localStorage/cookie (refresh from API domain).
// Cross-origin deploys (Vercel + Render) cannot share httpOnly cookies with this middleware,
// so route protection is handled client-side in LayoutContent.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
