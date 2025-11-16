import type { APIRoute } from "astro";
import { LoginSchema } from "@/lib/validators/auth.validators";

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 *
 * @implements US-002: User Login
 * @implements auth-spec.md Section 3.1
 *
 * Request body:
 * - email: string (valid email format)
 * - password: string (min 6 characters)
 *
 * Response:
 * - 200: { success: true, user: { id, email } }
 * - 400: { error: string } - Validation errors or invalid credentials
 * - 500: { error: string } - Server errors
 *
 * Security:
 * - Generic error message for failed authentication (prevents user enumeration)
 * - Supabase-specific errors (email not confirmed, rate limiting) are shown to users
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = LoginSchema.safeParse(body);

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

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      // Show specific Supabase errors (email not confirmed, rate limiting, etc.)
      if (error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            error: "Please confirm your email address before logging in. Check your inbox for the confirmation link.",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (error.message.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            error: "Too many login attempts. Please try again later.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Generic error for invalid credentials (security best practice)
      return new Response(
        JSON.stringify({
          error: "Invalid email or password",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Successful authentication
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
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
    console.error("Login error:", error);
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
