import { NextResponse } from 'next/server'
import { createClient } from './utils/supabase/middleware'

export async function middleware(request) {
  // Ensure Supabase env vars are present. If not, skip auth checks to avoid
  // crashing the middleware during development.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase env vars missing: skipping middleware auth checks')
    return NextResponse.next()
  }

  const { supabase, response } = createClient(request)
  
  try {
    // Refresh session if expired
    await supabase.auth.getSession()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { pathname } = request.nextUrl
    
    // Protected routes
    const protectedRoutes = ['/dashboard', '/profile']
    const authRoutes = ['/login', '/sign-up', '/sign-in', '/']
    
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.includes(pathname)
    
    // Redirect logic
    if (!user && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (user && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return response
  } catch (error) {
    // If auth check fails, allow the request to continue
    console.error('Middleware auth error:', error)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}