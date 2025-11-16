import type { APIRoute } from "astro";

/**
 * POST /api/auth/logout
 * Logs out the current user and clears their session
 *
 * @implements US-003: User Logout
 * @implements auth-spec.md Section 3.1
 *
 * Response:
 * - 302: Redirects to landing page (/)
 * - 500: { error: string } - Server errors
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    // Sign out from Supabase (clears session cookies)
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to landing page
      // The session cookies will be cleared by the middleware on next request
    }

    // Redirect to landing page
    return redirect("/", 302);
  } catch (error) {
    console.error("Unexpected logout error:", error);
    // Even on error, redirect to landing page for better UX
    return redirect("/", 302);
  }
};

/**
 * Disable prerendering for this API route
 * Required for server-side authentication handling
 */
export const prerender = false;
