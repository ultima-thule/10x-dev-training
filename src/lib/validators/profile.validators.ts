import { z } from "zod";

/**
 * Validation schema for creating a new user profile
 *
 * Validates:
 * - experience_level: Must be one of "junior", "mid", or "senior"
 * - years_away: Must be an integer between 0 and 30
 */
export const CreateProfileSchema = z.object({
  experience_level: z.enum(["junior", "mid", "senior"], {
    errorMap: () => ({
      message: "Experience level must be one of: junior, mid, senior",
    }),
  }),
  years_away: z
    .number({
      required_error: "Years away is required",
      invalid_type_error: "Years away must be a number",
    })
    .int({ message: "Years away must be an integer" })
    .min(0, { message: "Years away must be at least 0" })
    .max(30, { message: "Years away must not exceed 30" }),
});

/**
 * Type inference from CreateProfileSchema
 * Use this type for validated input data
 */
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
