import { z } from "zod";

/**
 * Validation schema for AI topic generation request
 *
 * Validates:
 * - technology: Required string (1-100 chars, alphanumeric + limited special chars)
 * - parent_id: Optional UUID
 */
export const GenerateTopicsCommandSchema = z.object({
  technology: z
    .string({ required_error: "Technology is required" })
    .min(1, { message: "Technology must not be empty" })
    .max(100, { message: "Technology must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s.\-_]+$/, {
      message: "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores",
    }),
  parent_id: z.string().uuid({ message: "Parent ID must be a valid UUID" }).optional().nullable(),
});

export type GenerateTopicsInput = z.infer<typeof GenerateTopicsCommandSchema>;

/**
 * Validation schema for AI service response
 * Ensures AI returns properly structured data
 */
export const AIGeneratedTopicSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Topic title is required" })
    .max(200, { message: "Topic title must not exceed 200 characters" }),
  description: z
    .string()
    .min(1, { message: "Topic description is required" })
    .max(1000, { message: "Topic description must not exceed 1000 characters" }),
  leetcode_links: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url({ message: "LeetCode URL must be valid" }),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
      })
    )
    .max(5, { message: "Maximum 5 LeetCode links per topic" }),
});

export const AIGeneratedTopicsArraySchema = z
  .array(AIGeneratedTopicSchema)
  .min(1, { message: "AI must generate at least 1 topic" })
  .max(10, { message: "AI cannot generate more than 10 topics at once" });
