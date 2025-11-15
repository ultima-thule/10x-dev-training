import { z } from "zod";

/**
 * Validation schema for listing user topics with filtering, sorting, and pagination
 *
 * Validates:
 * - status: Optional enum filter (to_do, in_progress, completed)
 * - technology: Optional string filter for technology name
 * - parent_id: Optional UUID or literal "null" for root topics
 * - sort: Sort field with default "created_at"
 * - order: Sort order with default "desc"
 * - page: Page number (min 1, default 1)
 * - limit: Items per page (min 1, max 100, default 50)
 */
export const ListTopicsQuerySchema = z.object({
  status: z
    .enum(["to_do", "in_progress", "completed"], {
      errorMap: () => ({
        message: "Status must be one of: to_do, in_progress, completed",
      }),
    })
    .optional(),
  technology: z.string().min(1, { message: "Technology must not be empty" }).optional(),
  parent_id: z.union([z.string().uuid({ message: "Parent ID must be a valid UUID" }), z.literal("null")]).optional(),
  sort: z
    .enum(["created_at", "updated_at", "title", "status"], {
      errorMap: () => ({
        message: "Sort must be one of: created_at, updated_at, title, status",
      }),
    })
    .default("created_at"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({
        message: "Order must be either asc or desc",
      }),
    })
    .default("desc"),
  page: z
    .number({
      invalid_type_error: "Page must be a number",
    })
    .int({ message: "Page must be an integer" })
    .min(1, { message: "Page must be at least 1" })
    .default(1),
  limit: z
    .number({
      invalid_type_error: "Limit must be a number",
    })
    .int({ message: "Limit must be an integer" })
    .min(1, { message: "Limit must be at least 1" })
    .max(100, { message: "Limit must not exceed 100" })
    .default(50),
});

/**
 * Type inference from ListTopicsQuerySchema
 * Use this type for validated query parameter data
 */
export type ListTopicsQueryInput = z.infer<typeof ListTopicsQuerySchema>;

/**
 * Validation schema for LeetCode link structure
 * Used in topic updates to validate individual link objects
 */
const LeetCodeLinkSchema = z.object({
  title: z.string().min(1, { message: "LeetCode link title is required" }),
  url: z.string().url({ message: "LeetCode URL must be valid" }),
  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    errorMap: () => ({
      message: "Difficulty must be one of: Easy, Medium, Hard",
    }),
  }),
});

/**
 * Validation schema for updating a topic
 *
 * All fields are optional to support partial updates.
 * At least one field must be provided.
 *
 * Validates:
 * - title: Optional string (1-200 chars)
 * - description: Optional string or null (max 1000 chars)
 * - status: Optional enum (to_do, in_progress, completed)
 * - technology: Optional string (1-100 chars, alphanumeric + .-_)
 * - leetcode_links: Optional array of validated link objects (max 5)
 */
export const UpdateTopicCommandSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title must not be empty" })
      .max(200, { message: "Title must not exceed 200 characters" })
      .optional(),
    description: z.string().max(1000, { message: "Description must not exceed 1000 characters" }).nullable().optional(),
    status: z
      .enum(["to_do", "in_progress", "completed"], {
        errorMap: () => ({
          message: "Status must be one of: to_do, in_progress, completed",
        }),
      })
      .optional(),
    technology: z
      .string()
      .min(1, { message: "Technology must not be empty" })
      .max(100, { message: "Technology must not exceed 100 characters" })
      .regex(/^[a-zA-Z0-9\s.\-_]+$/, {
        message: "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores",
      })
      .optional(),
    leetcode_links: z.array(LeetCodeLinkSchema).max(5, { message: "Maximum 5 LeetCode links per topic" }).optional(),
  })
  .strict() // Reject unknown fields
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Type inference from UpdateTopicCommandSchema
 * Use this type for validated update command data
 */
export type UpdateTopicCommandInput = z.infer<typeof UpdateTopicCommandSchema>;

/**
 * Validation schema for creating a new topic
 *
 * Validates:
 * - title: Required string (1-200 chars)
 * - technology: Required string (1-100 chars, alphanumeric + .-_)
 * - parent_id: Optional UUID or null
 * - description: Optional string or null (max 1000 chars)
 * - status: Optional enum (to_do, in_progress, completed), defaults to 'to_do'
 * - leetcode_links: Optional array of validated link objects (max 5)
 */
export const CreateTopicCommandSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title must not be empty" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  technology: z
    .string({ required_error: "Technology is required" })
    .min(1, { message: "Technology must not be empty" })
    .max(100, { message: "Technology must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s.\-_]+$/, {
      message: "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores",
    }),
  parent_id: z.string().uuid({ message: "Parent ID must be a valid UUID" }).nullable().optional(),
  description: z.string().max(1000, { message: "Description must not exceed 1000 characters" }).nullable().optional(),
  status: z
    .enum(["to_do", "in_progress", "completed"], {
      errorMap: () => ({
        message: "Status must be one of: to_do, in_progress, completed",
      }),
    })
    .default("to_do")
    .optional(),
  leetcode_links: z
    .array(LeetCodeLinkSchema)
    .max(5, { message: "Maximum 5 LeetCode links per topic" })
    .default([])
    .optional(),
});

/**
 * Type inference from CreateTopicCommandSchema
 * Use this type for validated create command data
 */
export type CreateTopicCommandInput = z.infer<typeof CreateTopicCommandSchema>;

// Re-export generate topics validators
export * from "./generate-topics.validator";

// Re-export topic ID validator
export * from "./topic-id.validator";
