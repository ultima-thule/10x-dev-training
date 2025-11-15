import { z } from "zod";

/**
 * Validation schema for topic ID path parameter
 *
 * Validates that the ID is a valid UUID format.
 * Used in GET /api/topics/:id endpoint.
 */
export const TopicIdParamSchema = z.object({
  id: z.string().uuid({ message: "Topic ID must be a valid UUID" }),
});

/**
 * Type inference from TopicIdParamSchema
 * Use this type for validated path parameter data
 */
export type TopicIdParam = z.infer<typeof TopicIdParamSchema>;
