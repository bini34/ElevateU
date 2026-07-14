import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');

  if (!token) {
    const signinUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signinUrl);
  }
  return NextResponse.next();
}

// Guard the app's authenticated areas. /signin and /signup stay public.
export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/groups/:path*',
    '/settings/:path*',
    '/create-post',
    '/post/:path*',
    '/notifications',
  ],
};
