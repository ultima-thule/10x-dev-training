import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "@/db/database.types";

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
 * Middleware to initialize Supabase client with SSR cookie handling
 *
 * This middleware creates a Supabase client that properly handles cookies
 * for authentication, making the authenticated user available in API routes
 * and pages via context.locals.supabase
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, request }, next) => {
  locals.supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll: () => parseRequestCookies(request.headers.get("cookie")),
      setAll: (cookieList) => {
        for (const cookie of cookieList) {
          cookies.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });

  return next();
});
