import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import type { Database } from './types/database';

const intlMiddleware = createIntlMiddleware(routing);

const AUTH_PAGES = ['/login'];
const PUBLIC_PATHS = ['/api/'];

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => pathname.endsWith(p));
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getLocale(pathname: string) {
  const match = pathname.match(/^\/(ko|ja)(\/|$)/);
  return match ? match[1] : routing.defaultLocale;
}

async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let response = intlMiddleware(request);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const locale = getLocale(pathname);

  if (!user && !isAuthPage(pathname)) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export default middleware;

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)', '/api/auth/callback'],
};
