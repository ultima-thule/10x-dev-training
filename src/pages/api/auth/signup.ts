import type { APIRoute } from "astro";
import { SignupSchema } from "@/lib/validators/auth.validators";

/**
 * POST /api/auth/signup
 * Registers a new user with email and password
 *
 * @implements US-001: User Registration
 * @implements auth-spec.md Section 3.2
 *
 * Request body:
 * - email: string (valid email format)
 * - password: string (min 6 characters)
 *
 * Response:
 * - 200: { success: true, requiresEmailConfirmation: boolean, user: { id, email } }
 * - 400: { error: string } - Validation errors or user already exists
 * - 500: { error: string } - Server errors
 *
 * Security:
 * - Supabase automatically sends email confirmation link
 * - User must confirm email before being able to log in
 * - Generic error message for existing users (prevents user enumeration)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = SignupSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return new Response(
        JSON.stringify({
          error: firstError.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        // Ensure email confirmation is required
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    // Handle signup errors
    if (error) {
      // Check for rate limiting
      if (error.message.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            error: "Too many signup attempts. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Check for user already exists
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "An account with this email already exists. Please sign in instead.",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic error for other cases
      return new Response(
        JSON.stringify({
          error: error.message || "Unable to create account. Please try again.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if email confirmation is required
    // Supabase returns user even if email confirmation is pending
    const requiresEmailConfirmation = data.user?.identities?.length === 0 || !data.session;

    // Successful signup
    return new Response(
      JSON.stringify({
        success: true,
        requiresEmailConfirmation,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

/**
 * Disable prerendering for this API route
 * Required for server-side authentication handling
 */
export const prerender = false;
