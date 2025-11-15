import type { APIRoute } from "astro";
import { ListTopicsQuerySchema } from "@/lib/validators/topic.validators";
import { listUserTopics, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";
import { ZodError } from "zod";

/**
 * Disable static pre-rendering for this API endpoint
 * This endpoint requires runtime authentication and database access
 */
export const prerender = false;

/**
 * GET /api/topics
 *
 * Lists all topics for the authenticated user with optional filtering,
 * sorting, and pagination.
 *
 * Query Parameters:
 * - status (optional): Filter by topic status (to_do, in_progress, completed)
 * - technology (optional): Filter by technology name
 * - parent_id (optional): Filter by parent topic ID or "null" for root topics only
 * - sort (optional): Sort field (created_at, updated_at, title, status). Default: created_at
 * - order (optional): Sort order (asc, desc). Default: desc
 * - page (optional): Page number for pagination (min: 1). Default: 1
 * - limit (optional): Items per page (1-100). Default: 50
 *
 * Response Codes:
 * - 200 OK: Topics retrieved successfully (including empty results)
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Step 2: Parse query parameters from URL
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const rawParams = {
      status: url.searchParams.get("status") || undefined,
      technology: url.searchParams.get("technology") || undefined,
      parent_id: url.searchParams.get("parent_id") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: pageParam ? Number.parseInt(pageParam, 10) : undefined,
      limit: limitParam ? Number.parseInt(limitParam, 10) : undefined,
    };

    // Step 3: Validate query parameters with Zod schema
    const validatedParams = ListTopicsQuerySchema.parse(rawParams);

    // Step 4: Call service to retrieve topics
    const response = await listUserTopics(supabase, user.id, validatedParams);

    // Step 5: Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
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
          message: "Invalid query parameters",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle service errors (500 Internal Error)
    if (error instanceof TopicServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/topics", {
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
