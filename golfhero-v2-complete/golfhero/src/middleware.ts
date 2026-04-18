import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes requiring auth
  const authRequired = ['/dashboard', '/admin']
  const isAuthRequired = authRequired.some(route => pathname.startsWith(route))

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAuthRequired && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    // Validate subscription on dashboard routes (PRD requirement: real-time check)
    if (pathname.startsWith('/dashboard')) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
        // Allow access to subscription page, redirect others
        if (!pathname.includes('/subscribe') && !pathname.includes('/billing')) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/subscribe'
          redirectUrl.searchParams.set('reason', 'subscription_required')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }

    // Check admin access
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
      if (!profile || !adminEmails.includes(profile.email)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Redirect logged-in users away from auth pages
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
