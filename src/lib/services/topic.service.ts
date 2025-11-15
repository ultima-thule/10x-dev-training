import type { SupabaseClient } from "@/db/supabase.client";
import type { TopicListResponseDTO, TopicListItemDTO, ErrorResponseDTO, LeetCodeLink } from "@/types";
import type { ListTopicsQueryInput } from "@/lib/validators/topic.validators";

/**
 * Custom error class for topic service operations
 * Includes HTTP status code and structured error response
 */
export class TopicServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}

/**
 * Retrieves a paginated, filtered, and sorted list of topics for a user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID from JWT token
 * @param queryParams - Validated query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated topic list with metadata
 * @throws TopicServiceError with appropriate status code and error response
 *
 * Business Logic:
 * 1. Build count query with filters to get total records
 * 2. Execute count query for pagination metadata
 * 3. Build main query with same filters plus sorting and pagination
 * 4. Include children_count using Supabase subquery
 * 5. Transform and return data with pagination metadata
 *
 * Error Scenarios:
 * - 500 Internal Error: Database operation failed (count or data query)
 */
export async function listUserTopics(
  supabase: SupabaseClient,
  userId: string,
  queryParams: ListTopicsQueryInput
): Promise<TopicListResponseDTO> {
  // Extract query parameters
  const { status, technology, parent_id, sort, order, page, limit } = queryParams;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  try {
    // Step 1: Build base query for counting total records
    let countQuery = supabase.from("topics").select("id", { count: "exact", head: true }).eq("user_id", userId);

    // Apply filters to count query
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (technology) {
      countQuery = countQuery.eq("technology", technology);
    }
    if (parent_id !== undefined) {
      if (parent_id === "null") {
        countQuery = countQuery.is("parent_id", null);
      } else {
        countQuery = countQuery.eq("parent_id", parent_id);
      }
    }

    // Step 2: Execute count query
    const { count: total, error: countError } = await countQuery;

    if (countError) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to count topics", {
        userId,
        error: countError.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve topics",
        },
      });
    }

    // Step 3: Build main query with children count
    let dataQuery = supabase
      .from("topics")
      .select(
        `
        *,
        children:topics!parent_id(count)
      `
      )
      .eq("user_id", userId);

    // Apply same filters to data query
    if (status) {
      dataQuery = dataQuery.eq("status", status);
    }
    if (technology) {
      dataQuery = dataQuery.eq("technology", technology);
    }
    if (parent_id !== undefined) {
      if (parent_id === "null") {
        dataQuery = dataQuery.is("parent_id", null);
      } else {
        dataQuery = dataQuery.eq("parent_id", parent_id);
      }
    }

    // Step 4: Apply sorting
    dataQuery = dataQuery.order(sort, { ascending: order === "asc" });

    // Step 5: Apply pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Step 6: Execute main query
    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to fetch topics", {
        userId,
        error: dataError.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve topics",
        },
      });
    }

    // Step 7: Transform data to include children_count
    const topicsWithCount: TopicListItemDTO[] = (data || []).map((topic) => ({
      id: topic.id,
      user_id: topic.user_id,
      parent_id: topic.parent_id,
      title: topic.title,
      description: topic.description,
      status: topic.status,
      technology: topic.technology,
      leetcode_links: (topic.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      children_count: Array.isArray(topic.children) && topic.children.length > 0 ? topic.children[0].count : 0,
    }));

    // Step 8: Calculate pagination metadata
    const totalPages = Math.ceil((total || 0) / limit);

    return {
      data: topicsWithCount,
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: totalPages,
      },
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in listUserTopics", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new TopicServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
}
