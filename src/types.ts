/**
 * DTO (Data Transfer Object) and Command Model Types
 *
 * This file contains type definitions for data exchanged between the API and clients.
 * All types are derived from database entity definitions to ensure type safety and consistency.
 */

import type { Database, Tables } from "./db/database.types";

// ==============================================================================
// Utility Types
// ==============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * LeetCode problem link structure
 * Used in topics to reference related coding problems
 */
export interface LeetCodeLink {
  title: string;
  url: string;
  difficulty: string;
}

// ==============================================================================
// Profile DTOs
// ==============================================================================

/**
 * Profile entity as returned by the API
 * Derived from the profiles table Row type
 */
export type ProfileDTO = Tables<"profiles">;

/**
 * Command model for creating a new user profile
 * Only includes fields that the user must provide during profile creation
 */
export interface CreateProfileCommand {
  experience_level: Database["public"]["Enums"]["experience_level_enum"];
  years_away: number;
}

/**
 * Command model for updating an existing user profile
 * All fields are optional to support partial updates
 */
export interface UpdateProfileCommand {
  experience_level?: Database["public"]["Enums"]["experience_level_enum"];
  years_away?: number;
  activity_streak?: number;
}

// ==============================================================================
// Topic DTOs
// ==============================================================================

/**
 * Base topic entity with properly typed leetcode_links
 * Transforms the Json type from database to strongly-typed LeetCodeLink array
 */
export type TopicDTO = Omit<Tables<"topics">, "leetcode_links"> & {
  leetcode_links: LeetCodeLink[];
};

/**
 * Extended topic DTO that includes the count of direct children
 * Used in list responses where hierarchical information is needed
 */
export interface TopicListItemDTO extends TopicDTO {
  children_count: number;
}

/**
 * Response structure for paginated topic lists
 */
export interface TopicListResponseDTO {
  data: TopicListItemDTO[];
  pagination: PaginationMetadata;
}

/**
 * Response structure for topic children endpoint
 */
export interface TopicChildrenResponseDTO {
  data: TopicListItemDTO[];
}

/**
 * Command model for creating a new topic
 * Omits user_id (derived from auth) and auto-managed fields
 */
export interface CreateTopicCommand {
  parent_id?: string | null;
  title: string;
  description?: string | null;
  status?: Database["public"]["Enums"]["topic_status_enum"];
  technology: string;
  leetcode_links?: LeetCodeLink[];
}

/**
 * Command model for updating an existing topic
 * All fields are optional to support partial updates
 */
export interface UpdateTopicCommand {
  title?: string;
  description?: string | null;
  status?: Database["public"]["Enums"]["topic_status_enum"];
  technology?: string;
  leetcode_links?: LeetCodeLink[];
}

/**
 * Command model for AI-powered topic generation
 */
export interface GenerateTopicsCommand {
  technology: string;
  parent_id?: string | null;
}

/**
 * Response structure for AI-generated topics
 */
export interface GenerateTopicsResponseDTO {
  data: TopicDTO[];
  count: number;
}

// ==============================================================================
// Dashboard DTOs
// ==============================================================================

/**
 * Statistics breakdown by topic status
 */
export interface TopicStatsDTO {
  total: number;
  to_do: number;
  in_progress: number;
  completed: number;
}

/**
 * Statistics for a specific technology
 */
export interface TechnologyStatsDTO {
  name: string;
  total: number;
  completed: number;
}

/**
 * Recent user activity item
 */
export interface RecentActivityDTO {
  topic_id: string;
  topic_title: string;
  action: string;
  timestamp: string;
}

/**
 * Profile summary for dashboard
 * Subset of ProfileDTO with only relevant fields
 */
export interface DashboardProfileDTO {
  experience_level: Database["public"]["Enums"]["experience_level_enum"];
  years_away: number;
  activity_streak: number;
}

/**
 * Complete dashboard statistics response
 * Aggregates various metrics for the user dashboard view
 */
export interface DashboardStatsResponseDTO {
  profile: DashboardProfileDTO;
  topics: TopicStatsDTO;
  technologies: TechnologyStatsDTO[];
  recent_activity: RecentActivityDTO[];
}

// ==============================================================================
// Enum Re-exports
// ==============================================================================

/**
 * Re-export enums for convenient access throughout the application
 */
export type ExperienceLevelEnum = Database["public"]["Enums"]["experience_level_enum"];
export type TopicStatusEnum = Database["public"]["Enums"]["topic_status_enum"];

// ==============================================================================
// Query Parameter Types
// ==============================================================================

/**
 * Query parameters for filtering and sorting topic lists
 */
export interface TopicListQueryParams {
  status?: TopicStatusEnum;
  technology?: string;
  parent_id?: string | null;
  sort?: "created_at" | "updated_at" | "title" | "status";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ==============================================================================
// Error Response Types
// ==============================================================================

/**
 * Field-level validation error
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}

/**
 * Error codes used throughout the API
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";
