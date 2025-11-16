import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "@/db/database.types";
import { cookieOptions } from "@/db/supabase.client";

/**
 * Public paths that don't require authentication
 * These routes are accessible to all users (authenticated and unauthenticated)
 */
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/signup",
  "/recover-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/recover",
  "/api/auth/callback",
];

/**
 * Protected paths that require authentication
 * Users must be logged in to access these routes
 */
const PROTECTED_PATHS = ["/dashboard", "/app", "/profile", "/api/profile", "/api/topics"];

const parseRequestCookies = (headerValue: string | null) => {
  if (!headerValue) {
    return [];
  }

  return headerValue.split(/;\s*/).reduce<{ name: string; value: string }[]>((acc, chunk) => {
    if (!chunk) {
      return acc;
    }

    const separatorIndex = chunk.indexOf("=");
    if (separatorIndex === -1) {
      return acc;
    }

    const name = chunk.slice(0, separatorIndex).trim();
    if (!name) {
      return acc;
    }

    const value = chunk.slice(separatorIndex + 1).trim();
    acc.push({ name, value: decodeURIComponent(value) });
    return acc;
  }, []);
};

/**
 * Check if a path is public (doesn't require authentication)
 */
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some((publicPath) => pathname === publicPath || pathname.startsWith(publicPath + "/"));
};

/**
 * Check if a path is protected (requires authentication)
 */
const isProtectedPath = (pathname: string): boolean => {
  return PROTECTED_PATHS.some(
    (protectedPath) => pathname === protectedPath || pathname.startsWith(protectedPath + "/")
  );
};

/**
 * Middleware for authentication and route protection
 *
 * @implements US-002: User Login (route protection)
 * @implements US-004: Initial User Profile Setup (profile completion check)
 * @implements auth-spec.md Section 3.3
 *
 * Responsibilities:
 * 1. Initialize Supabase client with SSR cookie handling
 * 2. Check user authentication status
 * 3. Protect routes that require authentication
 * 4. Redirect to profile setup if profile is incomplete
 * 5. Make user session available via context.locals
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, request, url, redirect }, next) => {
  // Initialize Supabase client with SSR cookie handling
  locals.supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll: () => parseRequestCookies(request.headers.get("cookie")),
      setAll: (cookieList) => {
        for (const cookie of cookieList) {
          cookies.set(cookie.name, cookie.value, {
            ...cookieOptions,
            ...cookie.options,
          });
        }
      },
    },
  });

  // Get authenticated user session
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  // Set user in locals (null if not authenticated)
  locals.user = user?.email
    ? {
        id: user.id,
        email: user.email,
      }
    : null;

  const pathname = url.pathname;

  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return next();
  }

  // Protect routes that require authentication
  if (isProtectedPath(pathname)) {
    if (!locals.user) {
      // Redirect unauthenticated users to login
      return redirect("/login");
    }

    // Check if profile is complete (except for profile setup endpoints)
    if (pathname !== "/profile/setup" && !pathname.startsWith("/api/profile/setup")) {
      const { data: profile, error } = await locals.supabase
        .from("profiles")
        .select("id")
        .eq("id", locals.user.id)
        .single();

      // If profile doesn't exist, redirect to profile setup
      if (error || !profile) {
        return redirect("/profile/setup");
      }
    }
  }

  return next();
});
