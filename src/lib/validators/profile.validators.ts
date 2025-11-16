import { z } from "zod";

/**
 * Experience level enum matching database type
 */
const experienceLevelEnum = ["beginner", "intermediate", "advanced", "expert"] as const;

/**
 * Years away range values from the profile setup form
 */
const yearsAwayRangeEnum = ["less-than-1", "1-2", "3-5", "more-than-5"] as const;

/**
 * Maps years away string ranges to numeric values for database storage
 *
 * @param range - String range from form ("less-than-1", "1-2", "3-5", "more-than-5")
 * @returns Numeric value representing the range
 *
 * Mapping:
 * - "less-than-1" → 0
 * - "1-2" → 2
 * - "3-5" → 5
 * - "more-than-5" → 10
 */
export const mapYearsAwayToNumber = (range: string): number => {
  const mapping: Record<string, number> = {
    "less-than-1": 0,
    "1-2": 2,
    "3-5": 5,
    "more-than-5": 10,
  };

  return mapping[range] ?? 0;
};

/**
 * Validation schema for profile setup form (client-side)
 *
 * @implements US-004: Initial User Profile Setup
 * @implements auth-spec.md Section 3.2
 *
 * Validates:
 * - experienceLevel: Must be one of "beginner", "intermediate", "advanced", "expert"
 * - yearsAway: Must be one of the predefined range strings
 *
 * This schema accepts form values and transforms them for API consumption
 */
export const ProfileSetupSchema = z.object({
  experienceLevel: z.enum(experienceLevelEnum, {
    errorMap: () => ({
      message: "Please select your experience level",
    }),
  }),
  yearsAway: z.enum(yearsAwayRangeEnum, {
    errorMap: () => ({
      message: "Please select how long you've been away from coding",
    }),
  }),
});

/**
 * Validation schema for creating/updating a user profile (API-side)
 *
 * Validates:
 * - experience_level: Must be one of "beginner", "intermediate", "advanced", "expert"
 * - years_away: Must be an integer between 0 and 60
 */
export const CreateProfileSchema = z.object({
  experience_level: z.enum(experienceLevelEnum, {
    errorMap: () => ({
      message: "Experience level must be one of: beginner, intermediate, advanced, expert",
    }),
  }),
  years_away: z
    .number({
      required_error: "Years away is required",
      invalid_type_error: "Years away must be a number",
    })
    .int({ message: "Years away must be an integer" })
    .min(0, { message: "Years away must be at least 0" })
    .max(60, { message: "Years away must not exceed 60" }),
});

/**
 * Type inference from validation schemas
 */
export type ProfileSetupInput = z.infer<typeof ProfileSetupSchema>;
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
