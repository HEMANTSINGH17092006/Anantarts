import { NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');
const PRODUCTION_DOMAIN = 'anantarts.in';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const { headers } = request;

  // =============================================
  // 1. HTTPS ENFORCEMENT (Production Only)
  // Force http → https redirect
  // =============================================
  if (process.env.NODE_ENV === 'production') {
    const proto = headers.get('x-forwarded-proto');
    const host = headers.get('host') || '';

    // Redirect HTTP to HTTPS
    if (proto === 'http') {
      const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, { status: 301 });
    }

    // Redirect www → non-www for canonical domain
    if (host === `www.${PRODUCTION_DOMAIN}`) {
      const canonicalUrl = `https://${PRODUCTION_DOMAIN}${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(canonicalUrl, { status: 301 });
    }
  }

  // =============================================
  // 2. ADMIN ROUTE PROTECTION
  // Protect all /admin/* routes (except /admin/login)
  // =============================================
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const tokenCookie = request.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify JWT token is valid and role is permitted
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
      const adminRoles = ['admin', 'super_admin', 'manager', 'content_editor'];
      if (!adminRoles.includes(payload.role)) {
        throw new Error('Not authorized admin role');
      }
      // Valid admin token — proceed to admin dashboard
      return NextResponse.next();
    } catch (err) {
      // Invalid or expired token — clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes for HTTPS enforcement in production
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
