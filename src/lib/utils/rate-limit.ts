import type { ErrorResponseDTO } from "@/types";

/**
 * Custom error class for rate limit violations
 * Includes retry-after information for proper HTTP response
 */
export class RateLimitError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO,
    public retryAfter: number
  ) {
    super(errorResponse.error.message);
  }
}

/**
 * Simple in-memory rate limiter (suitable for single-instance MVP)
 * For production with multiple instances, use Redis or database-backed rate limiting
 *
 * Note: This implementation uses a sliding window approach where each user
 * has a time window that resets after the configured duration.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if user has exceeded rate limit for AI generation
 *
 * @param userId - User ID to check
 * @param limitPerHour - Maximum requests per hour (default from env or 5)
 * @throws RateLimitError if limit exceeded with retry-after information
 *
 * Implementation details:
 * - Uses sliding window (resets after 1 hour from first request)
 * - Stores state in memory (lost on server restart, acceptable for MVP)
 * - Automatically creates new window if none exists or expired
 */
export function checkRateLimit(userId: string, limitPerHour?: number): void {
  const limit = limitPerHour || Number.parseInt(import.meta.env.AI_RATE_LIMIT_PER_HOUR || "5", 10);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds

  const userLimit = rateLimitStore.get(userId);

  // No existing limit record, create new window
  if (!userLimit) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return;
  }

  // Window expired, reset counter
  if (now >= userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return;
  }

  // Within window, check if limit exceeded
  if (userLimit.count >= limit) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    throw new RateLimitError(
      429,
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `AI generation rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        },
      },
      retryAfter
    );
  }

  // Increment counter within window
  userLimit.count++;
  rateLimitStore.set(userId, userLimit);
}

/**
 * Cleanup function to remove expired rate limit entries
 * Prevents memory leaks by removing old entries that are no longer needed
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [userId, limit] of rateLimitStore.entries()) {
    if (now >= limit.resetTime) {
      rateLimitStore.delete(userId);
    }
  }
}

// Schedule periodic cleanup every 10 minutes to prevent memory buildup
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 10 * 60 * 1000);
}
