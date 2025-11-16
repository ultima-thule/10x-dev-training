import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { upsertProfile, ProfileServiceError } from "@/lib/services/profile.service";
import { ProfileSetupSchema, mapYearsAwayToNumber } from "@/lib/validators/profile.validators";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";

/**
 * Disable static pre-rendering for this API endpoint
 * This endpoint requires runtime authentication and database access
 *
 * @implements US-004: Initial User Profile Setup
 * @implements auth-spec.md Section 3.1 (POST /api/profile/setup)
 */
export const prerender = false;

/**
 * POST /api/profile/setup
 *
 * Creates or updates the user profile with experience level and years away from coding.
 * Uses UPSERT logic to handle both first-time setup and profile updates.
 * After successful profile setup, redirects to /dashboard.
 *
 * Request Body:
 * {
 *   "experienceLevel": "beginner" | "intermediate" | "advanced" | "expert",
 *   "yearsAway": "less-than-1" | "1-2" | "3-5" | "more-than-5"
 * }
 *
 * Response Codes:
 * - 200 OK: Returns redirect URL to /dashboard
 * - 400 Bad Request: Invalid input data (validation errors with details)
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Database operation failed (generic error message)
 *
 * Error Handling Strategy:
 * - Validation errors: Return detailed field-level errors
 * - Database/system errors: Return generic error message for security
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    // User should already be authenticated due to middleware, but we double-check
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "You must be logged in to complete profile setup",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Validate input data with Zod schema
    // This validates the form-level data (string ranges for yearsAway)
    const validatedFormData = ProfileSetupSchema.parse(body);

    // Step 4: Transform form data to database format
    // Convert string range to numeric value for database storage
    const profileCommand = {
      experience_level: validatedFormData.experienceLevel,
      years_away: mapYearsAwayToNumber(validatedFormData.yearsAway),
    };

    // Step 5: Call service to create or update profile (UPSERT)
    await upsertProfile(supabase, user.id, profileCommand);

    // Step 6: Return success response with redirect URL
    // The client will handle the redirect to /dashboard
    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: "/dashboard",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle Zod validation errors (detailed error response)
    if (error instanceof ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Please check your input and try again",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle service errors (generic error response for security)
    if (error instanceof ProfileServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors (generic error response)
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/profile/setup", {
      userId: locals.user?.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

