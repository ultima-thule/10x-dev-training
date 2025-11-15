import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "@/db/database.types";

/**
 * Middleware to initialize Supabase client with SSR cookie handling
 *
 * This middleware creates a Supabase client that properly handles cookies
 * for authentication, making the authenticated user available in API routes
 * and pages via context.locals.supabase
 */
export const onRequest = defineMiddleware(async ({ locals, cookies }, next) => {
  locals.supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get: (key) => cookies.get(key)?.value,
      set: (key, value, options) => {
        cookies.set(key, value, options);
      },
      remove: (key, options) => {
        cookies.delete(key, options);
      },
    },
  });

  return next();
});
