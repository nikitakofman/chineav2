import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  // First handle internationalization
  const intlResponse = intlMiddleware(request)
  
  // Extract locale from the URL
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  // Get the locale from the URL or use default
  const locale = pathnameHasLocale 
    ? pathname.split('/')[1] 
    : routing.defaultLocale

  // Clone the response from intl middleware
  const response = intlResponse

  // Set up Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Check protected routes
  const protectedPaths = ['/dashboard', '/items', '/categories', '/people', '/costs', '/history', '/settings']
  const isProtectedPath = protectedPaths.some(path => 
    pathname.includes(path)
  )

  if (isProtectedPath && !user) {
    const redirectUrl = new URL(`/${locale}/connect`, request.url)
    return Response.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/connect']
  const isAuthPath = authPaths.some(path => pathname.includes(path))
  
  if (isAuthPath && user) {
    const redirectUrl = new URL(`/${locale}/dashboard`, request.url)
    return Response.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(en|fr)/:path*'
  ],
}