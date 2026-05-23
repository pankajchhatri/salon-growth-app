import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Check whether real Supabase credentials have been configured.
// When running without a backend (dev / preview), skip all auth
// enforcement so developers can explore the dashboard with mock data.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isSupabaseConfigured =
  supabaseUrl.length > 0 && !supabaseUrl.includes('placeholder')

export async function updateSession(request: NextRequest) {
  // ── Dev-mode bypass ──────────────────────────────────────────────────────
  // If Supabase is not configured, skip all auth enforcement entirely.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request })
  }
  // ─────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session and check active user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect from login/register if already authenticated
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect / to /dashboard if logged in, or /login if not
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
