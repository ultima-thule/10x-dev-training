/// <reference types="astro/client" />

/**
 * Environment variable declarations for TypeScript
 */
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Astro namespace for type declarations
 */
declare namespace App {
  interface Locals {
    supabase: import("@supabase/ssr").SupabaseClient<import("./db/database.types").Database>;
  }
}
