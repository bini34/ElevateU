import { NextResponse } from 'next/server';

export function middleware(request) {
  //Get the token from cookies
  const token = request.cookies.get('token');
  console.log("token", token);

  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  // This prints to the server terminal
  return NextResponse.next();
}

export const config = {
  matcher: ['/chat', '/groups', '/settings', '/[...path]', '/'],
};
