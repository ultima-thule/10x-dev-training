import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateProfileCommand, ProfileDTO, ErrorResponseDTO } from "@/types";

/**
 * Custom error class for profile service operations
 * Includes HTTP status code and structured error response
 */
export class ProfileServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}

/**
 * Creates a new user profile in the database
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID from JWT token
 * @param command - Profile creation data (experience_level, years_away)
 * @returns Promise resolving to the created profile
 * @throws ProfileServiceError with appropriate status code and error response
 *
 * Business Logic:
 * 1. Check if profile already exists for the user
 * 2. If exists, throw 409 Conflict error
 * 3. If not, create new profile with default activity_streak of 0
 * 4. Return the newly created profile
 *
 * Error Scenarios:
 * - 409 Conflict: Profile already exists for this user
 * - 500 Internal Error: Database operation failed
 */
export async function createProfile(
  supabase: SupabaseClient,
  userId: string,
  command: CreateProfileCommand
): Promise<ProfileDTO> {
  // Step 1: Check for existing profile
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  // Handle database error during existence check
  if (checkError) {
    // eslint-disable-next-line no-console
    console.error("[ProfileService] Failed to check existing profile", {
      userId,
      error: checkError.message,
      timestamp: new Date().toISOString(),
    });

    throw new ProfileServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to check existing profile",
      },
    });
  }

  // Step 2: Return 409 if profile already exists
  if (existingProfile) {
    throw new ProfileServiceError(409, {
      error: {
        code: "CONFLICT",
        message: "Profile already exists for this user",
      },
    });
  }

  // Step 3: Create new profile
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      experience_level: command.experience_level,
      years_away: command.years_away,
      activity_streak: 0,
    })
    .select()
    .single();

  // Handle database error during profile creation
  if (insertError || !newProfile) {
    // eslint-disable-next-line no-console
    console.error("[ProfileService] Create profile failed", {
      userId,
      error: insertError?.message,
      timestamp: new Date().toISOString(),
    });

    throw new ProfileServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create profile",
      },
    });
  }

  // Step 4: Return the created profile
  return newProfile;
}

/**
 * Retrieves user profile by user ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch profile for
 * @returns Promise resolving to user profile
 * @throws ProfileServiceError with 404 if profile not found, 500 for database errors
 *
 * Business Logic:
 * 1. Query profiles table for user's profile
 * 2. If profile not found, throw 404 error
 * 3. Return profile data
 *
 * Error Scenarios:
 * - 404 Not Found: User profile doesn't exist (user needs to create profile first)
 * - 500 Internal Error: Database operation failed
 */
export async function getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO> {
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[ProfileService] Failed to fetch profile", {
      userId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new ProfileServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user profile",
      },
    });
  }

  if (!profile) {
    throw new ProfileServiceError(404, {
      error: {
        code: "NOT_FOUND",
        message: "User profile not found. Please create a profile first.",
      },
    });
  }

  return profile;
}
