import type { APIRoute } from "astro";
import { TopicIdParamSchema } from "@/lib/validators/topic.validators";
import { getTopicById, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/topics/:id
 *
 * Retrieves a single topic by ID
 * Requires authentication via JWT token in Authorization header
 *
 * Path Parameters:
 * - id: Topic UUID
 *
 * Response (200 OK):
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "parent_id": null,
 *   "title": "...",
 *   "description": "...",
 *   "status": "to_do",
 *   "technology": "...",
 *   "leetcode_links": [...],
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid topic ID format
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Topic not found or unauthorized
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ params, locals }) => {
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
    // Step 3: Validate path parameter
    const validationResult = TopicIdParamSchema.safeParse(params);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid topic ID format",
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join(".") || "id",
            message: issue.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id: topicId } = validationResult.data;

    // Step 4: Fetch topic from database via service
    const topic = await getTopicById(supabase, userId, topicId);

    // Step 5: Return success response
    return new Response(JSON.stringify(topic), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof TopicServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/topics/:id", {
      userId,
      topicId: params.id,
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
