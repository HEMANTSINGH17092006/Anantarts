import { NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Protect all /admin routes, except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const tokenCookie = request.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify JWT token
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
      if (payload.role !== 'admin') {
        throw new Error('Not admin');
      }
      // Valid admin token, proceed
      return NextResponse.next();
    } catch (err) {
      // Invalid token, delete cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
