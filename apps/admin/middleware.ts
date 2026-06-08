import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = new Set(['en', 'ru', 'uz']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, maybeLocale, ...rest] = pathname.split('/');

  if (!maybeLocale || !LOCALES.has(maybeLocale)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${rest.join('/')}` || '/';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
