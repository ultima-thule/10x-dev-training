import { createClient } from "@supabase/supabase-js";
import type { CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined. Set it in your environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_KEY is not defined. Set it in your environment variables.");
}

/**
 * Cookie options for Supabase authentication
 *
 * Security settings:
 * - httpOnly: true - Prevents JavaScript access to cookies (XSS protection)
 * - secure: Conditional based on environment (HTTPS only in production)
 * - sameSite: 'lax' - CSRF protection while allowing navigation
 * - path: '/' - Cookie available across entire site
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // true in production, false in development
  httpOnly: true,
  sameSite: "lax",
};

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;
