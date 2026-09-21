import { NextResponse } from 'next/server';

export function middleware(request) {
  // Block before App Router streaming can turn notFound() into a soft 404.
  // This exception is scoped to the new preview; product auth rules stay below.
  const pathname = request.nextUrl.pathname;
  if (pathname === '/design-system' || pathname.startsWith('/design-system/')) {
    return process.env.NODE_ENV === 'development'
      ? NextResponse.next()
      : new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
  }
  const token = request.cookies.get('token');

  if (!token) {
    const signinUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signinUrl);
  }
  return NextResponse.next();
}

// Guard authenticated areas and the development-only preview. Auth forms stay public.
export const config = {
  matcher: [
    '/design-system/:path*',
    '/',
    '/chat/:path*',
    '/groups/:path*',
    '/settings/:path*',
    '/create-post',
    '/post/:path*',
    '/notifications',
  ],
};
