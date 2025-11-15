import type { APIRoute } from "astro";
import { CreateProfileSchema } from "@/lib/validators/profile.validators";
import { createProfile, ProfileServiceError } from "@/lib/services/profile.service";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";
import { ZodError } from "zod";

/**
 * Disable static pre-rendering for this API endpoint
 * This endpoint requires runtime authentication and database access
 */
export const prerender = false;

/**
 * POST /api/profile
 *
 * Creates a new user profile for the authenticated user.
 * This is a one-time operation - subsequent calls will return 409 Conflict.
 *
 * Request Body:
 * {
 *   "experience_level": "junior" | "mid" | "senior",
 *   "years_away": number (0-60)
 * }
 *
 * Response Codes:
 * - 201 Created: Profile successfully created
 * - 400 Bad Request: Invalid input data
 * - 401 Unauthorized: Missing or invalid authentication
 * - 409 Conflict: Profile already exists
 * - 500 Internal Server Error: Unexpected error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Missing or invalid authentication token",
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
    const validatedData = CreateProfileSchema.parse(body);

    // Step 4: Call service to create profile
    const profile = await createProfile(supabase, user.id, validatedData);

    // Step 5: Return success response
    return new Response(JSON.stringify(profile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle service errors (409 Conflict, 500 Internal Error)
    if (error instanceof ProfileServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/profile", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
