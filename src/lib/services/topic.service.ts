import type { SupabaseClient } from "@/db/supabase.client";
import type {
  TopicListResponseDTO,
  TopicListItemDTO,
  ErrorResponseDTO,
  LeetCodeLink,
  GenerateTopicsResponseDTO,
  TopicDTO,
  UpdateTopicCommand,
  CreateTopicCommand,
} from "@/types";
import type { Json } from "@/db/database.types";
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
      leetcode_links: topic.leetcode_links as unknown as Json,
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

/**
 * Retrieves a single topic by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param topicId - Topic UUID to retrieve
 * @returns Promise resolving to topic details
 * @throws TopicServiceError with 404 if not found, 500 for database errors
 *
 * Business Logic:
 * 1. Query topics table by ID and user_id
 * 2. Return topic if found
 * 3. Throw 404 if not found or unauthorized (RLS enforces user isolation)
 *
 * Error Scenarios:
 * - 404 Not Found: Topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function getTopicById(supabase: SupabaseClient, userId: string, topicId: string): Promise<TopicDTO> {
  const { data: topic, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[TopicService] Failed to fetch topic", {
      userId,
      topicId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new TopicServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve topic",
      },
    });
  }

  if (!topic) {
    throw new TopicServiceError(404, {
      error: {
        code: "NOT_FOUND",
        message: "Topic not found",
      },
    });
  }

  // Transform to TopicDTO (ensure leetcode_links is properly typed)
  return {
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
  };
}

/**
 * Updates an existing topic with partial data
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param topicId - Topic UUID to update
 * @param command - Update command with optional fields
 * @returns Promise resolving to updated topic
 * @throws TopicServiceError with 404 if not found, 500 for database errors
 *
 * Business Logic:
 * 1. Build update object with only provided fields
 * 2. Execute update query with user_id filter for authorization
 * 3. Return 404 if topic not found or unauthorized (don't distinguish)
 * 4. Transform and return updated topic
 *
 * Error Scenarios:
 * - 404 Not Found: Topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function updateTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  command: UpdateTopicCommand
): Promise<TopicDTO> {
  try {
    // Step 1: Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (command.title !== undefined) {
      updateData.title = command.title;
    }
    if (command.description !== undefined) {
      updateData.description = command.description;
    }
    if (command.status !== undefined) {
      updateData.status = command.status;
    }
    if (command.technology !== undefined) {
      updateData.technology = command.technology;
    }
    if (command.leetcode_links !== undefined) {
      updateData.leetcode_links = command.leetcode_links as unknown as Json;
    }

    // Step 2: Execute update query with authorization check
    const { data: updatedTopic, error } = await supabase
      .from("topics")
      .update(updateData)
      .eq("id", topicId)
      .eq("user_id", userId) // Authorization: only update own topics
      .select()
      .maybeSingle();

    // Step 3: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to update topic", {
        userId,
        topicId,
        updateFields: Object.keys(updateData),
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update topic",
        },
      });
    }

    // Step 4: Handle not found (topic doesn't exist or belongs to another user)
    if (!updatedTopic) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Topic not found",
        },
      });
    }

    // Step 5: Transform to TopicDTO
    return {
      id: updatedTopic.id,
      user_id: updatedTopic.user_id,
      parent_id: updatedTopic.parent_id,
      title: updatedTopic.title,
      description: updatedTopic.description,
      status: updatedTopic.status,
      technology: updatedTopic.technology,
      leetcode_links: (updatedTopic.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: updatedTopic.created_at,
      updated_at: updatedTopic.updated_at,
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in updateTopic", {
      userId,
      topicId,
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
 * Creates a new topic for the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param command - Create command with topic data
 * @returns Promise resolving to created topic
 * @throws TopicServiceError with 404 if parent not found, 500 for database errors
 *
 * Business Logic:
 * 1. Validate parent topic if parent_id provided
 * 2. Prepare insert data with user_id and defaults
 * 3. Execute insert query with select to return created topic
 * 4. Transform and return created topic
 *
 * Error Scenarios:
 * - 404 Not Found: Parent topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function createTopic(
  supabase: SupabaseClient,
  userId: string,
  command: CreateTopicCommand
): Promise<TopicDTO> {
  try {
    // Step 1: Validate parent topic if provided
    if (command.parent_id) {
      await validateParentTopic(supabase, userId, command.parent_id);
    }

    // Step 2: Prepare insert data
    const insertData = {
      user_id: userId,
      parent_id: command.parent_id || null,
      title: command.title,
      description: command.description || null,
      status: command.status || "to_do",
      technology: command.technology,
      leetcode_links: (command.leetcode_links || []) as unknown as Json,
    };

    // Step 3: Execute insert query
    const { data: createdTopic, error } = await supabase.from("topics").insert(insertData).select().single();

    // Step 4: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to create topic", {
        userId,
        title: command.title,
        technology: command.technology,
        hasParent: !!command.parent_id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create topic",
        },
      });
    }

    // Step 5: Handle unexpected null result
    if (!createdTopic) {
      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create topic",
        },
      });
    }

    // Step 6: Transform to TopicDTO
    return {
      id: createdTopic.id,
      user_id: createdTopic.user_id,
      parent_id: createdTopic.parent_id,
      title: createdTopic.title,
      description: createdTopic.description,
      status: createdTopic.status,
      technology: createdTopic.technology,
      leetcode_links: (createdTopic.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: createdTopic.created_at,
      updated_at: createdTopic.updated_at,
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in createTopic", {
      userId,
      title: command.title,
      technology: command.technology,
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
 * Deletes a topic and all its children (cascading delete)
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param topicId - Topic UUID to delete
 * @returns Promise resolving to void (no data returned)
 * @throws TopicServiceError with 404 if not found, 500 for database errors
 *
 * Business Logic:
 * 1. Execute delete query with user_id filter for authorization
 * 2. Use count to verify deletion occurred
 * 3. Return 404 if topic not found or unauthorized (don't distinguish)
 * 4. Database automatically cascades delete to children via ON DELETE CASCADE
 *
 * Error Scenarios:
 * - 404 Not Found: Topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function deleteTopic(supabase: SupabaseClient, userId: string, topicId: string): Promise<void> {
  try {
    // Step 1: Execute delete query with count to verify deletion
    const { error, count } = await supabase
      .from("topics")
      .delete({ count: "exact" })
      .eq("id", topicId)
      .eq("user_id", userId); // Authorization: only delete own topics

    // Step 2: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to delete topic", {
        userId,
        topicId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete topic",
        },
      });
    }

    // Step 3: Handle not found (topic doesn't exist or belongs to another user)
    if (count === 0) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Topic not found",
        },
      });
    }

    // Step 4: Success - return void (no data to return)
    // Note: Database automatically cascaded delete to all children
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in deleteTopic", {
      userId,
      topicId,
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
