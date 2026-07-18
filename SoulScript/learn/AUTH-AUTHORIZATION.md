# Authentication & Authorization

## Overview

SoulScript uses Supabase Auth with cookie-based sessions. The auth system has three layers: Next.js 16 proxy middleware for route protection, server-side Supabase client for API routes, and browser-side client for UI state.

## The Proxy (`src/proxy.ts`)

Next.js 16 replaces the old `middleware.ts` with `proxy.ts`. It runs on matched routes and handles three concerns:

```typescript
export const config = {
  matcher: ["/api/:path*", "/settings/:path*", "/login", "/signup"],
};
```

**Route protection logic:**
1. `/api/*` — returns 401 JSON if no user
2. `/settings/*` — redirects to `/login` if no user
3. `/login`, `/signup` — redirects to `/` if user is already authenticated

The proxy creates a Supabase server client that reads/writes cookies on the request and response. This is how session tokens persist across navigation.

## Dual Supabase Client Pattern

### Server Client (`src/lib/supabase/server.ts`)

```typescript
export async function createClient() {
  const cookieStore = await cookies();  // must await in Next.js 16
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — ignore (cookies are read-only there)
        }
      },
    },
  });
}
```

- Async because `cookies()` from `next/headers` is now async in Next.js 16
- `setAll` wraps in try/catch because Server Components can't set cookies
- Used in all API routes and server-side data fetching

### Browser Client (`src/lib/supabase/client.ts`)

```typescript
"use client";
export function createClient() {
  return createBrowserClient(url, key);
}
```

- Synchronous, used in client components
- Handles its own token refresh automatically

## OAuth Flow (Google)

1. User clicks "Continue with Google" on login/signup page
2. Redirects to Supabase OAuth endpoint with `provider: "google"`
3. Google redirects back to `/auth/callback?code=...`
4. Callback route exchanges code for session:

```typescript
// src/app/auth/callback/route.ts
const { error } = await supabase.auth.exchangeCodeForSession(code);
if (!error) {
  return NextResponse.redirect(`${origin}${next}`);
}
```

5. Session cookies are set, user is redirected to `/`

## Session Management

- Supabase stores session tokens in cookies (not localStorage)
- The proxy middleware calls `supabase.auth.getUser()` on every matched request, which validates the JWT and refreshes if needed
- `staleTime` in TanStack Query (5 minutes) prevents redundant auth checks on the client

## Key Decisions

- **No `NEXT_PUBLIC_` prefix on auth secrets** — server-only for security
- **User ID extracted server-side** — never trusted from client request body
- **RLS policies as backup** — even if middleware is bypassed, database-level security enforces `user_id = auth.uid()`

## Common Pitfalls

1. **Forgetting `await cookies()`** — Next.js 16 requires it; omitting throws a runtime error
2. **Setting cookies in Server Components** — silently fails; always set cookies in Route Handlers or via the proxy
3. **Not checking `user` in API routes** — the proxy protects routes, but defense-in-depth means every route handler should also verify the user
