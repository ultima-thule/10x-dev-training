import type { APIRoute } from "astro";
import { CreateTopicCommandSchema, ListTopicsQuerySchema } from "@/lib/validators/topic.validators";
import { createTopic, listUserTopics, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/topics
 *
 * Retrieves a paginated, filtered list of topics for the authenticated user
 * Requires authentication via JWT token in Authorization header
 *
 * Query Parameters (all optional):
 * - status: Filter by topic status ('to_do', 'in_progress', 'completed')
 * - technology: Filter by technology name
 * - parent_id: Filter by parent ID ('null' for root topics, UUID for children)
 * - sort: Sort field ('created_at', 'updated_at', 'title', 'status')
 * - order: Sort order ('asc', 'desc')
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 *
 * Response (200 OK):
 * {
 *   "data": [...TopicListItemDTO],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 50,
 *     "total": 100,
 *     "total_pages": 2
 *   }
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ url, locals }) => {
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
    // Step 3: Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const validation = ListTopicsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join(".") || "query",
            message: issue.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = validation.data;

    // Step 4: Fetch topics via service
    const result = await listUserTopics(supabase, userId, query);

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
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
    console.error("[API] Unexpected error in GET /api/topics", {
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
