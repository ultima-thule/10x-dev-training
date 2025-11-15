import type { APIRoute } from "astro";
import { GenerateTopicsCommandSchema } from "@/lib/validators/topic.validators";
import { generateUserTopics, TopicServiceError } from "@/lib/services/topic.service";
import { ProfileServiceError } from "@/lib/services/profile.service";
import { AIServiceError } from "@/lib/services/ai.service";
import { checkRateLimit, RateLimitError } from "@/lib/utils/rate-limit";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/topics/generate
 *
 * Generates AI-powered learning topics based on user profile and technology
 * Requires authentication via JWT token in Authorization header
 *
 * Request Body:
 * {
 *   "technology": "React",
 *   "parent_id": "uuid" | null (optional)
 * }
 *
 * Response (201 Created):
 * {
 *   "data": [{ ...TopicDTO }],
 *   "count": 5
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request parameters
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: User profile or parent topic not found
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected error or AI service failure
 * - 503 Service Unavailable: AI service timeout or unavailable
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 1: Extract Supabase client from middleware
  const supabase = locals.supabase;
  if (!supabase) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Supabase client not initialized",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 2: Verify authentication and get user
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

  const userId = user.id;

  try {
    // Step 3: Parse and validate request body
    const body = await request.json();
    const validationResult = GenerateTopicsCommandSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join(".") || "unknown",
            message: issue.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = validationResult.data;

    // Step 4: Check rate limit (5 requests per hour by default)
    checkRateLimit(userId);

    // Step 5: Generate topics via service layer
    const result = await generateUserTopics(supabase, userId, command);

    // Step 6: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle rate limit errors with Retry-After header
    if (error instanceof RateLimitError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": error.retryAfter.toString(),
        },
      });
    }

    // Handle service errors (TopicServiceError, ProfileServiceError, AIServiceError)
    if (error instanceof TopicServiceError || error instanceof ProfileServiceError || error instanceof AIServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
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

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in POST /api/topics/generate", {
      userId,
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
