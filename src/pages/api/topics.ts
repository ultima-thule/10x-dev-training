import type { APIRoute } from "astro";
import { CreateTopicCommandSchema } from "@/lib/validators/topic.validators";
import { createTopic, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/topics
 *
 * Creates a new topic for the authenticated user
 * Requires authentication via JWT token in Authorization header
 *
 * Request Body:
 * {
 *   "parent_id": "uuid or null",       // Optional
 *   "title": "Topic Title",            // Required
 *   "description": "Description",      // Optional
 *   "status": "to_do",                 // Optional, defaults to 'to_do'
 *   "technology": "React",             // Required
 *   "leetcode_links": [...]            // Optional, defaults to []
 * }
 *
 * Response (201 Created):
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "parent_id": null,
 *   "title": "Topic Title",
 *   "description": "Description",
 *   "status": "to_do",
 *   "technology": "React",
 *   "leetcode_links": [...],
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request body or validation errors
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Parent topic not found
 * - 500 Internal Server Error: Database error
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
    let requestBody;
    try {
      requestBody = await request.json();
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

    const bodyValidation = CreateTopicCommandSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const createCommand = bodyValidation.data;

    // Step 4: Create topic via service
    const createdTopic = await createTopic(supabase, userId, createCommand);

    // Step 5: Return success response
    return new Response(JSON.stringify(createdTopic), {
      status: 201,
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
    console.error("[API] Unexpected error in POST /api/topics", {
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
