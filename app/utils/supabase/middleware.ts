import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          request.cookies.set({
            name,
            value,
            ...options,
          })

          // IMPORTANT: We must manually copy over any cookies that were set on the
          // previous response object, otherwise they will be lost when we overwrite 'response'.
          // This allows setting multiple cookies (like access + refresh tokens).
          const oldResponseCookies = response.cookies.getAll()

          // Create a new response with the updated request cookies
          // This ensures Server Components have access to the fresh cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // Copy over cookies from the old response
          oldResponseCookies.forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie);
          });

          // Set the new cookie
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

          const oldResponseCookies = response.cookies.getAll()

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          oldResponseCookies.forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie);
          });

          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session si está expirada
  await supabase.auth.getUser()

  return response
}
