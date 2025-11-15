import type { SupabaseClient } from "@/db/supabase.client";
import type {
  TopicListResponseDTO,
  TopicListItemDTO,
  ErrorResponseDTO,
  LeetCodeLink,
  GenerateTopicsResponseDTO,
  TopicDTO,
} from "@/types";
import type { ListTopicsQueryInput, GenerateTopicsInput } from "@/lib/validators/topic.validators";
import { generateTopics as callAIService, AIServiceError } from "./ai.service";
import { getProfile, ProfileServiceError } from "./profile.service";

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

/**
 * Validates that parent topic exists and belongs to user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param parentId - Parent topic ID to validate
 * @returns Promise resolving to parent topic details
 * @throws TopicServiceError with 404 if parent not found or doesn't belong to user, 500 for database errors
 *
 * Business Logic:
 * 1. Query topics table for parent topic with user_id filter
 * 2. If not found or belongs to different user, throw 404
 * 3. Return parent topic details for AI context
 *
 * Error Scenarios:
 * - 404 Not Found: Parent topic doesn't exist or belongs to different user
 * - 500 Internal Error: Database operation failed
 */
async function validateParentTopic(
  supabase: SupabaseClient,
  userId: string,
  parentId: string
): Promise<{ id: string; title: string; description: string | null }> {
  const { data: parentTopic, error } = await supabase
    .from("topics")
    .select("id, title, description")
    .eq("id", parentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[TopicService] Failed to validate parent topic", {
      userId,
      parentId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new TopicServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to validate parent topic",
      },
    });
  }

  if (!parentTopic) {
    throw new TopicServiceError(404, {
      error: {
        code: "NOT_FOUND",
        message: "Parent topic not found or does not belong to user",
      },
    });
  }

  return parentTopic;
}

/**
 * Generates AI-powered topics for user based on profile and technology
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param command - Generation parameters (technology, optional parent_id)
 * @returns Promise resolving to generated topics with count
 * @throws TopicServiceError, ProfileServiceError, or AIServiceError with appropriate status codes
 *
 * Business Logic:
 * 1. Fetch user profile (required for AI context: experience_level, years_away)
 * 2. If parent_id provided, validate it exists and belongs to user
 * 3. Build AI generation context with profile + technology + optional parent
 * 4. Call AI service to generate topics (3-5 topics)
 * 5. Map AI-generated topics to database insert format
 * 6. Batch insert topics into database
 * 7. Transform and return created topics
 *
 * Error Scenarios:
 * - 404 Not Found: User profile doesn't exist OR parent topic not found
 * - 500 Internal Error: Database operation failed OR AI returned invalid data
 * - 503 Service Unavailable: AI service timeout or unavailable
 */
export async function generateUserTopics(
  supabase: SupabaseClient,
  userId: string,
  command: GenerateTopicsInput
): Promise<GenerateTopicsResponseDTO> {
  try {
    // Step 1: Fetch user profile (required for AI context)
    const profile = await getProfile(supabase, userId);

    // Step 2: Validate parent topic if provided
    let parentTopic;
    if (command.parent_id) {
      parentTopic = await validateParentTopic(supabase, userId, command.parent_id);
    }

    // Step 3: Build AI generation context
    const aiContext = {
      technology: command.technology,
      experienceLevel: profile.experience_level,
      yearsAway: profile.years_away,
      parentTopic,
    };

    // Step 4: Call AI service to generate topics
    const generatedTopics = await callAIService(aiContext);

    // Step 5: Prepare topics for database insertion
    const topicsToInsert = generatedTopics.map((topic) => ({
      user_id: userId,
      parent_id: command.parent_id || null,
      title: topic.title,
      description: topic.description,
      status: "to_do" as const,
      technology: command.technology,
      leetcode_links: topic.leetcode_links,
    }));

    // Step 6: Batch insert topics into database
    const { data: insertedTopics, error: insertError } = await supabase.from("topics").insert(topicsToInsert).select();

    if (insertError || !insertedTopics) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to insert generated topics", {
        userId,
        technology: command.technology,
        error: insertError?.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to save generated topics",
        },
      });
    }

    // Step 7: Transform and return response
    const topicDTOs: TopicDTO[] = insertedTopics.map((topic) => ({
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
    }));

    return {
      data: topicDTOs,
      count: topicDTOs.length,
    };
  } catch (error) {
    // Re-throw service errors as-is
    if (error instanceof TopicServiceError || error instanceof ProfileServiceError || error instanceof AIServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in generateUserTopics", {
      userId,
      technology: command.technology,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new TopicServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during topic generation",
      },
    });
  }
}
