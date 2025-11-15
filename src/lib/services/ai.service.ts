import type { LeetCodeLink, ErrorResponseDTO } from "@/types";
import { AIGeneratedTopicsArraySchema } from "@/lib/validators/generate-topics.validator";

/**
 * Custom error class for AI service operations
 * Includes HTTP status code and structured error response
 */
export class AIServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}

/**
 * Context information for AI topic generation
 * Used to personalize the generated topics based on user profile
 */
export interface AIGenerationContext {
  technology: string;
  experienceLevel: "junior" | "mid" | "senior";
  yearsAway: number;
  parentTopic?: {
    id: string;
    title: string;
    description: string | null;
  };
}

/**
 * Structure of a single AI-generated topic before database insertion
 */
export interface AIGeneratedTopic {
  title: string;
  description: string;
  leetcode_links: LeetCodeLink[];
}

/**
 * Generates learning topics using OpenRouter AI service
 *
 * @param context - Context including technology, user profile, and optional parent topic
 * @returns Promise resolving to array of generated topics (3-10 topics)
 * @throws AIServiceError with appropriate status code (500 or 503)
 *
 * Error Scenarios:
 * - 500 Internal Error: API key not configured, invalid response structure
 * - 503 Service Unavailable: Timeout, network error, or OpenRouter service issues
 *
 * Implementation Notes:
 * - Uses AbortController for 30-second timeout
 * - Validates AI response against strict Zod schema
 * - Handles various OpenRouter error responses appropriately
 */
export async function generateTopics(context: AIGenerationContext): Promise<AIGeneratedTopic[]> {
  // Extract environment variables
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const model = import.meta.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";
  const timeout = Number.parseInt(import.meta.env.AI_GENERATION_TIMEOUT || "30000", 10);

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.error("[AIService] OpenRouter API key not configured");
    throw new AIServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "AI service not configured",
      },
    });
  }

  // Build system prompt with generation rules
  const systemPrompt = buildSystemPrompt(context);

  // Build user prompt with specific request
  const userPrompt = buildUserPrompt(context);

  // Prepare OpenRouter API request body
  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
    temperature: 0.7,
  };

  // Create abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10x-dev-training.app", // Optional: for OpenRouter analytics
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses from OpenRouter
    if (!response.ok) {
      if (response.status === 429) {
        throw new AIServiceError(503, {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "AI service rate limit exceeded. Please try again later.",
          },
        });
      }

      if (response.status >= 500) {
        throw new AIServiceError(503, {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "AI service is temporarily unavailable. Please try again later.",
          },
        });
      }

      throw new AIServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "AI service request failed",
        },
      });
    }

    // Parse JSON response
    const data = await response.json();

    // Extract content from response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      // eslint-disable-next-line no-console
      console.error("[AIService] Invalid response structure", { data });
      throw new AIServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "AI service returned invalid response",
        },
      });
    }

    // Parse JSON content from AI
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // eslint-disable-next-line no-console
      console.error("[AIService] Failed to parse AI response as JSON", { content });
      throw new AIServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "AI service returned invalid JSON",
        },
      });
    }

    // Extract topics array (AI may wrap in object with "topics" key)
    const topicsArray = parsedContent.topics || parsedContent;

    // Validate response structure with Zod
    const validationResult = AIGeneratedTopicsArraySchema.safeParse(topicsArray);
    if (!validationResult.success) {
      // eslint-disable-next-line no-console
      console.error("[AIService] AI response validation failed", {
        errors: validationResult.error.issues,
        response: topicsArray,
      });
      throw new AIServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "AI service returned invalid data structure",
        },
      });
    }

    return validationResult.data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Re-throw AIServiceError as-is
    if (error instanceof AIServiceError) {
      throw error;
    }

    // Handle abort (timeout)
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIServiceError(503, {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "AI service request timed out. Please try again.",
        },
      });
    }

    // Handle fetch errors (network issues)
    // eslint-disable-next-line no-console
    console.error("[AIService] Unexpected error calling AI service", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new AIServiceError(503, {
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "AI service is temporarily unavailable. Please try again later.",
      },
    });
  }
}

/**
 * Builds system prompt with rules for topic generation
 * Provides context and constraints for the AI model
 */
function buildSystemPrompt(context: AIGenerationContext): string {
  return `You are an expert software development educator creating personalized learning topics.

RULES:
1. Generate 3-5 relevant topics for the given technology
2. Tailor content to user's experience level: ${context.experienceLevel}
3. User has been away from development for ${context.yearsAway} years
4. Each topic must have:
   - Clear, concise title (max 200 characters)
   - Detailed description explaining what will be covered (max 1000 characters)
   - 0-3 relevant LeetCode problems (with title, URL, difficulty)
5. ${context.parentTopic ? `Generate subtopics for: "${context.parentTopic.title}"` : "Generate root-level topics"}
6. Focus on practical, hands-on skills
7. Order topics from fundamental to advanced

EXPERIENCE LEVEL GUIDANCE:
- Junior: Focus on fundamentals, syntax, basic patterns
- Mid: Include design patterns, best practices, common pitfalls
- Senior: Emphasize architecture, advanced patterns, performance optimization

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanations):
{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Detailed description",
      "leetcode_links": [
        {
          "title": "Problem Name",
          "url": "https://leetcode.com/problems/...",
          "difficulty": "Easy|Medium|Hard"
        }
      ]
    }
  ]
}`;
}

/**
 * Builds user prompt with specific generation request
 * Provides the specific task for topic generation
 */
function buildUserPrompt(context: AIGenerationContext): string {
  if (context.parentTopic) {
    return `Generate subtopics for "${context.technology}" under the parent topic: "${context.parentTopic.title}"

Parent topic description: ${context.parentTopic.description || "Not provided"}

Create 3-5 subtopics that dive deeper into this specific area.`;
  }

  return `Generate 3-5 root-level learning topics for ${context.technology}.

Focus on what a ${context.experienceLevel} developer who has been away for ${context.yearsAway} years needs to refresh or learn.`;
}
