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

// Re-export generate topics validators
export * from "./generate-topics.validator";

// Re-export topic ID validator
export * from "./topic-id.validator";
