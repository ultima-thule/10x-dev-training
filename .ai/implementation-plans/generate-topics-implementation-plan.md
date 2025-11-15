# API Endpoint Implementation Plan: AI Topic Generation

## 1. Endpoint Overview

The AI Topic Generation endpoint enables users to generate personalized learning topics powered by AI based on their profile (experience level and years away from development) and a selected technology. The endpoint leverages OpenRouter.ai to communicate with AI models and creates topics in the database that are immediately available for the user.

**Key Features:**

- Generates multiple relevant topics based on user context
- Supports hierarchical topic generation (child topics via `parent_id`)
- Returns fully populated topic entities with LeetCode problem recommendations
- Integrates with user profile to tailor content difficulty and focus
- Implements rate limiting to prevent abuse of AI services

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/topics/generate`
- **Authentication**: Required via `Authorization: Bearer {access_token}` header
- **Content-Type**: `application/json`

### Parameters

#### Required Parameters:

- `technology` (string): The technology/framework/language for which to generate topics
  - Must be a non-empty string
  - Examples: "React", "TypeScript", "PostgreSQL", "Node.js"
  - Should be validated for reasonable length (1-100 characters)

#### Optional Parameters:

- `parent_id` (string | null): UUID of parent topic for generating subtopics
  - Must be a valid UUID format if provided
  - Must reference an existing topic owned by the authenticated user
  - If null or omitted, generates root-level topics
  - Enables hierarchical learning path creation

### Request Body Example:

```json
{
  "technology": "React",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 3. Used Types

### Command Models (Input)

**`GenerateTopicsCommand`** (from `src/types.ts`):

```typescript
interface GenerateTopicsCommand {
  technology: string;
  parent_id?: string | null;
}
```

### DTOs (Output)

**`GenerateTopicsResponseDTO`** (from `src/types.ts`):

```typescript
interface GenerateTopicsResponseDTO {
  data: TopicDTO[];
  count: number;
}
```

**`TopicDTO`** (from `src/types.ts`):

```typescript
type TopicDTO = Omit<Tables<"topics">, "leetcode_links"> & {
  leetcode_links: LeetCodeLink[];
};
```

**`LeetCodeLink`** (from `src/types.ts`):

```typescript
interface LeetCodeLink {
  title: string;
  url: string;
  difficulty: string;
}
```

**`ProfileDTO`** (from `src/types.ts`):

```typescript
type ProfileDTO = Tables<"profiles">;
```

### Internal Types

**`AIGenerationContext`** (to be defined):

```typescript
interface AIGenerationContext {
  technology: string;
  experienceLevel: "junior" | "mid" | "senior";
  yearsAway: number;
  parentTopic?: {
    id: string;
    title: string;
    description: string | null;
  };
}
```

**`AIGeneratedTopic`** (to be defined):

```typescript
interface AIGeneratedTopic {
  title: string;
  description: string;
  leetcode_links: LeetCodeLink[];
}
```

## 4. Response Details

### Success Response (201 Created)

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "parent_id": null,
      "title": "React Fundamentals",
      "description": "Core concepts of React including components, props, and state",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [],
      "created_at": "2025-11-15T10:00:00Z",
      "updated_at": "2025-11-15T10:00:00Z"
    },
    {
      "id": "uuid2",
      "user_id": "uuid",
      "parent_id": null,
      "title": "Advanced React Patterns",
      "description": "Compound components, render props, and HOCs",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [
        {
          "title": "Design Pattern Implementation",
          "url": "https://leetcode.com/problems/design-pattern/",
          "difficulty": "Medium"
        }
      ],
      "created_at": "2025-11-15T10:00:01Z",
      "updated_at": "2025-11-15T10:00:01Z"
    }
  ],
  "count": 2
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "technology",
        "message": "Technology must be a non-empty string"
      }
    ]
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User profile not found. Please create a profile first."
  }
}
```

Or:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Parent topic not found or does not belong to user"
  }
}
```

#### 429 Too Many Requests

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "AI generation rate limit exceeded. Please try again in 60 seconds."
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "AI service returned invalid response"
  }
}
```

#### 503 Service Unavailable

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Data Flow

### High-Level Flow

```
1. Client Request
   ↓
2. Authentication & Authorization (Middleware)
   ↓
3. Input Validation (Zod Schema)
   ↓
4. Rate Limit Check
   ↓
5. Fetch User Profile (Required)
   ↓
6. Validate Parent Topic (If parent_id provided)
   ↓
7. Build AI Context
   ↓
8. Call AI Service (OpenRouter)
   ↓
9. Parse AI Response
   ↓
10. Create Topics in Database (Batch Insert)
   ↓
11. Return Generated Topics (201 Created)
```

### Detailed Data Flow

#### Step 1-3: Request Handling & Validation

- Astro middleware extracts and validates JWT token from Authorization header
- Supabase client initialized with user context (via `context.locals.supabase`)
- Request body parsed and validated against `GenerateTopicsCommandSchema`
- Early return with 400 if validation fails

#### Step 4: Rate Limiting

- Check Redis/database for recent generation attempts by user
- Implement sliding window rate limit (e.g., 5 generations per hour)
- Return 429 if limit exceeded
- Note: Consider using Supabase edge functions or separate rate limiting service

#### Step 5: User Profile Retrieval

- Call `getProfile(supabase, userId)` from `profile.service.ts`
- Return 404 if profile doesn't exist
- Profile is essential for AI prompt personalization

#### Step 6: Parent Topic Validation (Conditional)

- If `parent_id` provided:
  - Query `topics` table for topic with matching `id` and `user_id`
  - Return 404 if not found or doesn't belong to user
  - RLS policies will enforce user ownership, but explicit check provides better error message
  - Retrieve parent topic details for AI context

#### Step 7: Build AI Generation Context

- Create `AIGenerationContext` object containing:
  - Technology name
  - User's experience level
  - Years away from development
  - Parent topic details (if applicable)
- This context will inform the AI prompt

#### Step 8: AI Service Call

- Call `generateTopics(context)` from new `ai.service.ts`
- Service constructs prompt based on context:
  - Junior + many years away → more fundamental topics
  - Senior + few years away → refresher topics with advanced patterns
  - Parent topic provided → generate subtopics related to parent
- Use OpenRouter API with appropriate model (e.g., GPT-4, Claude)
- Implement timeout (e.g., 30 seconds)
- Return 503 if service unreachable
- Return 500 if response malformed

#### Step 9: Parse AI Response

- AI should return structured JSON array of topics
- Validate response structure:
  - Array of objects
  - Each object has: title (string), description (string), leetcode_links (array)
  - leetcode_links items have: title, url, difficulty
- Sanitize and validate each field
- Return 500 if parsing fails

#### Step 10: Database Insertion

- Map AI-generated topics to database insert objects:
  - Add `user_id` from authenticated user
  - Add `parent_id` if provided
  - Add `technology` from request
  - Set `status` to 'to_do'
  - Convert `leetcode_links` to JSONB
- Use Supabase batch insert:
  ```typescript
  supabase.from("topics").insert(topicsArray).select();
  ```
- Handle database errors (return 500)
- RLS policies ensure topics are created with correct user_id

#### Step 11: Response Formatting

- Transform inserted records to `TopicDTO[]`
- Return response with:
  - `data`: Array of created topics
  - `count`: Number of topics created
- HTTP status: 201 Created

### External Service Integration

#### OpenRouter.ai Integration

- **Authentication**: API key stored in environment variable (`OPENROUTER_API_KEY`)
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model Selection**: Configurable via environment (e.g., `openai/gpt-4`, `anthropic/claude-3-sonnet`)
- **Request Structure**:
  ```json
  {
    "model": "openai/gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "System prompt with generation rules"
      },
      {
        "role": "user",
        "content": "Generate topics for {technology}, user is {experience_level}..."
      }
    ],
    "response_format": { "type": "json_object" }
  }
  ```
- **Response Parsing**: Extract JSON from assistant message
- **Error Handling**: Handle HTTP errors, timeouts, rate limits from OpenRouter

## 6. Security Considerations

### Authentication & Authorization

#### Authentication

- **Requirement**: Valid JWT token in `Authorization: Bearer {token}` header
- **Enforcement**: Astro middleware extracts token and creates authenticated Supabase client
- **Validation**: Supabase validates token signature and expiration
- **Error**: Return 401 if token missing, invalid, or expired

#### Authorization

- **User Context**: All operations scoped to authenticated user via `userId`
- **RLS Enforcement**:
  - Profile retrieval: User can only access their own profile
  - Parent topic validation: User can only reference their own topics
  - Topic creation: Topics automatically associated with authenticated user
- **Parent ID Validation**: Explicit check that parent_id belongs to user prevents unauthorized topic hierarchy manipulation

### Input Validation & Sanitization

#### Technology Parameter

- **Validation**:
  - Required field
  - Must be non-empty string
  - Length limit: 1-100 characters
  - Allowed characters: alphanumeric, spaces, dots, hyphens, underscores
  - Regex: `^[a-zA-Z0-9\s.\-_]+$`
- **Threat**: Prompt injection attacks (malicious content in technology name)
- **Mitigation**:
  - Strict character whitelist
  - Sanitize before including in AI prompt
  - Limit length to prevent context overflow

#### Parent ID Parameter

- **Validation**:
  - Optional field
  - Must be valid UUID format if provided
  - Must reference existing topic owned by user
- **Threat**: Unauthorized access to other users' topics
- **Mitigation**:
  - UUID format validation
  - Database query with user_id filter
  - RLS policies as defense-in-depth

#### AI Response Validation

- **Validation**:
  - Verify response is valid JSON
  - Validate array structure
  - Validate each topic has required fields
  - Validate LeetCode URLs are actual URLs
  - Limit topic titles/descriptions length
- **Threat**: Malicious AI output with XSS, SQL injection, or malformed data
- **Mitigation**:
  - Strict schema validation with Zod
  - Sanitize all text fields
  - URL validation for LeetCode links
  - Database constraints prevent invalid data

### API Key Security

#### OpenRouter API Key

- **Storage**: Environment variable (`OPENROUTER_API_KEY`)
- **Access**: Only server-side code (never exposed to client)
- **Rotation**: Support for key rotation without code changes
- **Validation**: Check key presence at startup

### Rate Limiting

#### Purpose

- Prevent abuse of expensive AI service
- Protect against denial-of-service
- Control costs

#### Implementation Strategy

- **Per-User Limit**: 5 generations per hour (configurable)
- **Storage**: Use Supabase database or Redis for rate limit tracking
- **Window**: Sliding window (more accurate than fixed window)
- **Response**: 429 Too Many Requests with Retry-After header

#### Rate Limit Tracking Table (Optional)

```sql
CREATE TABLE rate_limits (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL,
  PRIMARY KEY (user_id, endpoint, window_start)
);
```

### Data Privacy

- **User Isolation**: RLS ensures users only access their own data
- **Profile Data**: User profile (experience level, years away) sent to AI but is non-sensitive
- **No PII to AI**: Don't include user email, name, or other PII in AI prompts
- **Audit Trail**: Log AI generation requests for debugging (without sensitive data)

## 7. Error Handling

### Error Scenarios & Status Codes

#### 400 Bad Request

**Scenario 1: Missing technology parameter**

- **Trigger**: Request body missing `technology` field
- **Response**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request parameters",
      "details": [
        {
          "field": "technology",
          "message": "Technology is required"
        }
      ]
    }
  }
  ```
- **Logging**: Debug level (expected user error)

**Scenario 2: Invalid technology format**

- **Trigger**: Technology contains invalid characters or is too long
- **Response**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request parameters",
      "details": [
        {
          "field": "technology",
          "message": "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores"
        }
      ]
    }
  }
  ```
- **Logging**: Debug level

**Scenario 3: Invalid parent_id format**

- **Trigger**: parent_id is not a valid UUID
- **Response**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request parameters",
      "details": [
        {
          "field": "parent_id",
          "message": "Parent ID must be a valid UUID"
        }
      ]
    }
  }
  ```
- **Logging**: Debug level

#### 401 Unauthorized

**Scenario 1: Missing authentication token**

- **Trigger**: No Authorization header present
- **Response**:
  ```json
  {
    "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Missing authentication token"
    }
  }
  ```
- **Logging**: Info level (potential security event)
- **Handling**: Middleware returns early before reaching endpoint

**Scenario 2: Invalid or expired token**

- **Trigger**: Token signature invalid or token expired
- **Response**:
  ```json
  {
    "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Invalid or expired authentication token"
    }
  }
  ```
- **Logging**: Info level
- **Handling**: Middleware returns early

#### 404 Not Found

**Scenario 1: User profile not found**

- **Trigger**: Authenticated user doesn't have a profile record
- **Response**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "User profile not found. Please create a profile first."
    }
  }
  ```
- **Logging**: Warn level (unexpected state - user without profile)
- **Handling**: Service layer throws `ProfileServiceError(404)`

**Scenario 2: Parent topic not found**

- **Trigger**: parent_id doesn't match any topic or belongs to different user
- **Response**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Parent topic not found or does not belong to user"
    }
  }
  ```
- **Logging**: Debug level (user error)
- **Handling**: Service layer throws `TopicServiceError(404)`

#### 429 Too Many Requests

**Scenario: Rate limit exceeded**

- **Trigger**: User exceeded maximum AI generation requests in time window
- **Response**:
  ```json
  {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "AI generation rate limit exceeded. Please try again in 60 seconds."
    }
  }
  ```
- **Headers**: `Retry-After: 60`
- **Logging**: Info level (rate limit hit)
- **Handling**: Check rate limit before expensive operations

#### 500 Internal Server Error

**Scenario 1: Database operation failed**

- **Trigger**: Supabase query error during profile fetch, parent validation, or topic insertion
- **Response**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "Failed to generate topics"
    }
  }
  ```
- **Logging**: Error level with full error details and context
- **Handling**: Service layer catches database errors

**Scenario 2: AI response parsing failed**

- **Trigger**: AI returns malformed JSON or response doesn't match expected schema
- **Response**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "AI service returned invalid response"
    }
  }
  ```
- **Logging**: Error level with AI response details
- **Handling**: AI service validates and parses response

**Scenario 3: Unexpected error**

- **Trigger**: Any unhandled exception in business logic
- **Response**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "An unexpected error occurred"
    }
  }
  ```
- **Logging**: Error level with stack trace
- **Handling**: Top-level try-catch in endpoint handler

#### 503 Service Unavailable

**Scenario 1: AI service timeout**

- **Trigger**: OpenRouter API doesn't respond within timeout (30s)
- **Response**:
  ```json
  {
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "AI service request timed out. Please try again."
    }
  }
  ```
- **Logging**: Warn level
- **Handling**: AI service implements timeout with AbortController

**Scenario 2: AI service unreachable**

- **Trigger**: Network error or OpenRouter API returns 502/503
- **Response**:
  ```json
  {
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "AI service is temporarily unavailable. Please try again later."
    }
  }
  ```
- **Logging**: Error level
- **Handling**: AI service catches fetch errors

**Scenario 3: AI service rate limit**

- **Trigger**: OpenRouter returns 429 (their rate limit)
- **Response**:
  ```json
  {
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "AI service rate limit exceeded. Please try again later."
    }
  }
  ```
- **Logging**: Warn level
- **Handling**: Map OpenRouter 429 to our 503

### Error Logging Strategy

#### Log Levels

- **Debug**: Expected user errors (validation failures)
- **Info**: Authentication events, rate limiting
- **Warn**: Recoverable errors, service degradation
- **Error**: Unexpected errors, service failures

#### Log Format

```typescript
console.error("[ServiceName] Error description", {
  userId,
  technology,
  parentId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

#### Sensitive Data

- Never log authentication tokens
- Don't log full AI prompts/responses in production
- Sanitize user input before logging

## 8. Performance Considerations

### Potential Bottlenecks

#### AI Service Latency

- **Issue**: OpenRouter API calls can take 5-30 seconds depending on model and prompt complexity
- **Impact**: User waits for response, endpoint timeout risk
- **Mitigation**:
  - Set reasonable timeout (30s)
  - Show loading state in UI
  - Consider websocket/polling for long operations (future enhancement)
  - Use faster models for MVP (GPT-3.5 vs GPT-4)

#### Database Operations

- **Issue**: Multiple sequential database queries (profile, parent validation, batch insert)
- **Impact**: Increased latency, potential for race conditions
- **Mitigation**:
  - Use Supabase connection pooling
  - Consider parallel queries where possible (profile + parent validation)
  - Use batch insert for topics (already planned)
  - Ensure proper indexes on user_id and parent_id columns

#### Rate Limiting Overhead

- **Issue**: Rate limit checks add database queries or cache lookups
- **Impact**: Slight latency increase on every request
- **Mitigation**:
  - Use Redis for rate limit tracking (faster than database)
  - Consider in-memory cache with TTL for MVP
  - Implement rate limit check early to fail fast

### Optimization Strategies

#### Caching

- **User Profiles**: Cache user profile in memory/Redis after first fetch (5-minute TTL)
- **Parent Topics**: Cache parent topic details briefly (1-minute TTL)
- **AI Prompts**: Reuse prompt templates, only substitute variables
- **Note**: Implement caching in phase 2, not MVP

#### Database Indexes

- **Already Planned**:
  - `topics(user_id)` - for user-scoped queries
  - `topics(parent_id)` - for parent validation and children queries
- **Additional Recommendations**:
  - `topics(user_id, parent_id)` - composite index for common query pattern
  - `profiles(id)` - primary key, already indexed

#### AI Service Optimization

- **Model Selection**: Use cost-effective models for MVP (GPT-3.5-turbo vs GPT-4)
- **Prompt Engineering**: Shorter, more focused prompts reduce tokens and latency
- **Response Format**: Request structured JSON output to simplify parsing
- **Token Limits**: Set max_tokens to reasonable limit (e.g., 1500) to control costs and response time

#### Async Processing (Future Enhancement)

- For MVP, keep synchronous flow (simpler)
- For production, consider:
  - Background job queue for AI generation
  - Websocket updates when topics ready
  - Store generation requests with status tracking
  - Allows handling of very long AI processing times

### Scalability Considerations

#### Horizontal Scaling

- Stateless endpoint design allows multiple instances
- Rate limiting needs shared state (Redis/database)
- No server-side sessions required

#### Database Scaling

- Supabase handles connection pooling
- RLS policies scale with Postgres performance
- Consider read replicas for high read volume (future)

#### AI Service Costs

- OpenRouter charges per token
- Monitor usage and set budget alerts
- Consider fallback to cheaper models under high load
- Implement aggressive rate limiting to control costs

## 9. Implementation Steps

### Phase 1: Setup & Configuration

#### Step 1.1: Environment Variables

- Add to `.env` file:
  ```
  OPENROUTER_API_KEY=your_api_key_here
  OPENROUTER_MODEL=openai/gpt-3.5-turbo
  AI_GENERATION_TIMEOUT=30000
  AI_RATE_LIMIT_PER_HOUR=5
  ```
- Validate environment variables at startup
- Document in README

#### Step 1.2: Type Definitions

- Review existing types in `src/types.ts`:
  - ✅ `GenerateTopicsCommand` (already exists)
  - ✅ `GenerateTopicsResponseDTO` (already exists)
  - ✅ `TopicDTO` (already exists)
  - ✅ `LeetCodeLink` (already exists)
- Add new internal types to `src/lib/services/ai.service.ts`:

  ```typescript
  interface AIGenerationContext {
    technology: string;
    experienceLevel: "junior" | "mid" | "senior";
    yearsAway: number;
    parentTopic?: {
      id: string;
      title: string;
      description: string | null;
    };
  }

  interface AIGeneratedTopic {
    title: string;
    description: string;
    leetcode_links: LeetCodeLink[];
  }

  interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
  }

  interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    response_format?: { type: "json_object" };
    max_tokens?: number;
    temperature?: number;
  }

  interface OpenRouterResponse {
    id: string;
    choices: Array<{
      message: {
        role: "assistant";
        content: string;
      };
      finish_reason: string;
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }
  ```

### Phase 2: Validation Layer

#### Step 2.1: Create Zod Validation Schema

- Create `src/lib/validators/generate-topics.validator.ts`:

  ```typescript
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
  ```

- Export from `src/lib/validators/topic.validators.ts`:
  ```typescript
  export * from "./generate-topics.validator";
  ```

### Phase 3: AI Service Layer

#### Step 3.1: Create AI Service

- Create `src/lib/services/ai.service.ts`:

  ```typescript
  import type { LeetCodeLink, ProfileDTO } from '@/types';
  import { AIGeneratedTopicsArraySchema } from '@/lib/validators/generate-topics.validator';
  import type { ErrorResponseDTO } from '@/types';

  export class AIServiceError extends Error {
    constructor(
      public statusCode: number,
      public errorResponse: ErrorResponseDTO
    ) {
      super(errorResponse.error.message);
    }
  }

  interface AIGenerationContext {
    technology: string;
    experienceLevel: 'junior' | 'mid' | 'senior';
    yearsAway: number;
    parentTopic?: {
      id: string;
      title: string;
      description: string | null;
    };
  }

  interface AIGeneratedTopic {
    title: string;
    description: string;
    leetcode_links: LeetCodeLink[];
  }

  /**
   * Generates learning topics using OpenRouter AI service
   *
   * @param context - Context including technology, user profile, and optional parent topic
   * @returns Promise resolving to array of generated topics
   * @throws AIServiceError with appropriate status code
   */
  export async function generateTopics(
    context: AIGenerationContext
  ): Promise<AIGeneratedTopic[]> {
    // Extract environment variables
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const model = import.meta.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
    const timeout = parseInt(import.meta.env.AI_GENERATION_TIMEOUT || '30000', 10);

    if (!apiKey) {
      console.error('[AIService] OpenRouter API key not configured');
      throw new AIServiceError(500, {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'AI service not configured',
        },
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // Build user prompt
    const userPrompt = buildUserPrompt(context);

    // Prepare request body
    const requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.7,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10x-dev-training.app', // Optional: for OpenRouter analytics
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-200 responses
      if (!response.ok) {
        if (response.status === 429) {
          throw new AIServiceError(503, {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'AI service rate limit exceeded. Please try again later.',
            },
          });
        }

        if (response.status >= 500) {
          throw new AIServiceError(503, {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'AI service is temporarily unavailable. Please try again later.',
            },
          });
        }

        throw new AIServiceError(500, {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'AI service request failed',
          },
        });
      }

      // Parse response
      const data = await response.json();

      // Extract content
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[AIService] Invalid response structure', { data });
        throw new AIServiceError(500, {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'AI service returned invalid response',
          },
        });
      }

      // Parse JSON content
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        console.error('[AIService] Failed to parse AI response as JSON', { content });
        throw new AIServiceError(500, {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'AI service returned invalid JSON',
          },
        });
      }

      // Extract topics array (AI may wrap in object with "topics" key)
      const topicsArray = parsedContent.topics || parsedContent;

      // Validate response structure
      const validationResult = AIGeneratedTopicsArraySchema.safeParse(topicsArray);
      if (!validationResult.success) {
        console.error('[AIService] AI response validation failed', {
          errors: validationResult.error.issues,
          response: topicsArray,
        });
        throw new AIServiceError(500, {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'AI service returned invalid data structure',
          },
        });
      }

      return validationResult.data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw AIServiceError
      if (error instanceof AIServiceError) {
        throw error;
      }

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(503, {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'AI service request timed out. Please try again.',
          },
        });
      }

      // Handle fetch errors (network issues)
      console.error('[AIService] Unexpected error calling AI service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      throw new AIServiceError(503, {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'AI service is temporarily unavailable. Please try again later.',
        },
      });
    }
  }

  /**
   * Builds system prompt with rules for topic generation
   */
  function buildSystemPrompt(context: AIGenerationContext): string {
    return `You are an expert software development educator creating personalized learning topics.
  ```

RULES:

1. Generate 3-5 relevant topics for the given technology
2. Tailor content to user's experience level: ${context.experienceLevel}
3. User has been away from development for ${context.yearsAway} years
4. Each topic must have:
   - Clear, concise title (max 200 characters)
   - Detailed description explaining what will be covered (max 1000 characters)
   - 0-3 relevant LeetCode problems (with title, URL, difficulty)
5. ${context.parentTopic ? `Generate subtopics for: "${context.parentTopic.title}"` : 'Generate root-level topics'}
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

/\*\*

- Builds user prompt with specific generation request
  \*/
  function buildUserPrompt(context: AIGenerationContext): string {
  if (context.parentTopic) {
  return `Generate subtopics for "${context.technology}" under the parent topic: "${context.parentTopic.title}"

Parent topic description: ${context.parentTopic.description || 'Not provided'}

Create 3-5 subtopics that dive deeper into this specific area.`;
}

    return `Generate 3-5 root-level learning topics for ${context.technology}.

Focus on what a ${context.experienceLevel} developer who has been away for ${context.yearsAway} years needs to refresh or learn.`;
}

````

### Phase 4: Service Layer Extensions

#### Step 4.1: Extend Profile Service
- Add function to `src/lib/services/profile.service.ts`:
```typescript
/**
 * Retrieves user profile by user ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch profile for
 * @returns Promise resolving to user profile
 * @throws ProfileServiceError with 404 if profile not found
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileDTO> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[ProfileService] Failed to fetch profile', {
      userId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw new ProfileServiceError(500, {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch user profile',
      },
    });
  }

  if (!profile) {
    throw new ProfileServiceError(404, {
      error: {
        code: 'NOT_FOUND',
        message: 'User profile not found. Please create a profile first.',
      },
    });
  }

  return profile;
}
````

#### Step 4.2: Extend Topic Service

- Add functions to `src/lib/services/topic.service.ts`:

  ```typescript
  import { generateTopics as callAIService } from "./ai.service";
  import { getProfile } from "./profile.service";
  import type { GenerateTopicsResponseDTO, TopicDTO, LeetCodeLink } from "@/types";
  import type { GenerateTopicsInput } from "@/lib/validators/generate-topics.validator";

  /**
   * Validates that parent topic exists and belongs to user
   *
   * @param supabase - Supabase client instance
   * @param userId - Authenticated user's ID
   * @param parentId - Parent topic ID to validate
   * @returns Promise resolving to parent topic details
   * @throws TopicServiceError with 404 if parent not found or doesn't belong to user
   */
  async function validateParentTopic(
    supabase: SupabaseClient,
    userId: string,
    parentId: string
  ): Promise<{ id: string; title: string; description: string | null }> {
    const { data: parentTopic, error } = await supabase
      .from("topics")
      .select("id, title, description")
      .eq("id", parentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[TopicService] Failed to validate parent topic", {
        userId,
        parentId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to validate parent topic",
        },
      });
    }

    if (!parentTopic) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Parent topic not found or does not belong to user",
        },
      });
    }

    return parentTopic;
  }

  /**
   * Generates AI-powered topics for user based on profile and technology
   *
   * @param supabase - Supabase client instance
   * @param userId - Authenticated user's ID
   * @param command - Generation parameters (technology, optional parent_id)
   * @returns Promise resolving to generated topics with count
   * @throws TopicServiceError or AIServiceError with appropriate status codes
   */
  export async function generateUserTopics(
    supabase: SupabaseClient,
    userId: string,
    command: GenerateTopicsInput
  ): Promise<GenerateTopicsResponseDTO> {
    try {
      // Step 1: Fetch user profile (required for AI context)
      const profile = await getProfile(supabase, userId);

      // Step 2: Validate parent topic if provided
      let parentTopic;
      if (command.parent_id) {
        parentTopic = await validateParentTopic(supabase, userId, command.parent_id);
      }

      // Step 3: Build AI generation context
      const aiContext = {
        technology: command.technology,
        experienceLevel: profile.experience_level,
        yearsAway: profile.years_away,
        parentTopic,
      };

      // Step 4: Call AI service to generate topics
      const generatedTopics = await callAIService(aiContext);

      // Step 5: Prepare topics for database insertion
      const topicsToInsert = generatedTopics.map((topic) => ({
        user_id: userId,
        parent_id: command.parent_id || null,
        title: topic.title,
        description: topic.description,
        status: "to_do" as const,
        technology: command.technology,
        leetcode_links: topic.leetcode_links,
      }));

      // Step 6: Batch insert topics into database
      const { data: insertedTopics, error: insertError } = await supabase
        .from("topics")
        .insert(topicsToInsert)
        .select();

      if (insertError || !insertedTopics) {
        console.error("[TopicService] Failed to insert generated topics", {
          userId,
          technology: command.technology,
          error: insertError?.message,
          timestamp: new Date().toISOString(),
        });

        throw new TopicServiceError(500, {
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to save generated topics",
          },
        });
      }

      // Step 7: Transform and return response
      const topicDTOs: TopicDTO[] = insertedTopics.map((topic) => ({
        id: topic.id,
        user_id: topic.user_id,
        parent_id: topic.parent_id,
        title: topic.title,
        description: topic.description,
        status: topic.status,
        technology: topic.technology,
        leetcode_links: (topic.leetcode_links as unknown as LeetCodeLink[]) || [],
        created_at: topic.created_at,
        updated_at: topic.updated_at,
      }));

      return {
        data: topicDTOs,
        count: topicDTOs.length,
      };
    } catch (error) {
      // Re-throw service errors as-is
      if (
        error instanceof TopicServiceError ||
        error instanceof ProfileServiceError ||
        error instanceof AIServiceError
      ) {
        throw error;
      }

      // Log and wrap unexpected errors
      console.error("[TopicService] Unexpected error in generateUserTopics", {
        userId,
        technology: command.technology,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during topic generation",
        },
      });
    }
  }
  ```

### Phase 5: Rate Limiting (Simple Implementation)

#### Step 5.1: Create Rate Limit Utility

- Create `src/lib/utils/rate-limit.ts`:

  ```typescript
  import type { SupabaseClient } from "@/db/supabase.client";
  import type { ErrorResponseDTO } from "@/types";

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
   * For production, use Redis or database-backed rate limiting
   */
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * Checks if user has exceeded rate limit for AI generation
   *
   * @param userId - User ID to check
   * @param limitPerHour - Maximum requests per hour (default from env)
   * @throws RateLimitError if limit exceeded
   */
  export function checkRateLimit(userId: string, limitPerHour?: number): void {
    const limit = limitPerHour || parseInt(import.meta.env.AI_RATE_LIMIT_PER_HOUR || "5", 10);
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour in milliseconds

    const userLimit = rateLimitStore.get(userId);

    // No existing limit, create new window
    if (!userLimit) {
      rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
      return;
    }

    // Window expired, reset
    if (now >= userLimit.resetTime) {
      rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
      return;
    }

    // Within window, check limit
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

    // Increment count
    userLimit.count++;
    rateLimitStore.set(userId, userLimit);
  }

  /**
   * Cleanup function to remove expired entries (call periodically)
   */
  export function cleanupRateLimits(): void {
    const now = Date.now();
    for (const [userId, limit] of rateLimitStore.entries()) {
      if (now >= limit.resetTime) {
        rateLimitStore.delete(userId);
      }
    }
  }

  // Cleanup every 10 minutes
  if (typeof setInterval !== "undefined") {
    setInterval(cleanupRateLimits, 10 * 60 * 1000);
  }
  ```

### Phase 6: API Endpoint

#### Step 6.1: Create Endpoint Handler

- Create `src/pages/api/topics/generate.ts`:

  ```typescript
  import type { APIRoute } from "astro";
  import { GenerateTopicsCommandSchema } from "@/lib/validators/generate-topics.validator";
  import { generateUserTopics, TopicServiceError } from "@/lib/services/topic.service";
  import { ProfileServiceError } from "@/lib/services/profile.service";
  import { AIServiceError } from "@/lib/services/ai.service";
  import { checkRateLimit, RateLimitError } from "@/lib/utils/rate-limit";
  import type { ErrorResponseDTO } from "@/types";

  export const prerender = false;

  /**
   * POST /api/topics/generate
   *
   * Generates AI-powered learning topics based on user profile and technology
   * Requires authentication via JWT token in Authorization header
   */
  export const POST: APIRoute = async ({ request, locals }) => {
    // Step 1: Extract Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "Supabase client not initialized",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Verify authentication and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Missing or invalid authentication token",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    try {
      // Step 3: Parse and validate request body
      const body = await request.json();
      const validationResult = GenerateTopicsCommandSchema.safeParse(body);

      if (!validationResult.success) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: validationResult.error.issues.map((issue) => ({
              field: issue.path.join(".") || "unknown",
              message: issue.message,
            })),
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const command = validationResult.data;

      // Step 4: Check rate limit
      checkRateLimit(userId);

      // Step 5: Generate topics via service layer
      const result = await generateUserTopics(supabase, userId, command);

      // Step 6: Return success response
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle rate limit errors
      if (error instanceof RateLimitError) {
        return new Response(JSON.stringify(error.errorResponse), {
          status: error.statusCode,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": error.retryAfter.toString(),
          },
        });
      }

      // Handle service errors (TopicServiceError, ProfileServiceError, AIServiceError)
      if (
        error instanceof TopicServiceError ||
        error instanceof ProfileServiceError ||
        error instanceof AIServiceError
      ) {
        return new Response(JSON.stringify(error.errorResponse), {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON in request body",
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle unexpected errors
      console.error("[API] Unexpected error in POST /api/topics/generate", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
  ```

### Phase 7: Testing & Validation

#### Step 7.1: Manual Testing Checklist

- [ ] Test with valid token and valid request → 201 Created
- [ ] Test without Authorization header → 401 Unauthorized
- [ ] Test with expired token → 401 Unauthorized
- [ ] Test with missing technology → 400 Bad Request
- [ ] Test with invalid technology (special chars) → 400 Bad Request
- [ ] Test with invalid parent_id format → 400 Bad Request
- [ ] Test with non-existent parent_id → 404 Not Found
- [ ] Test with another user's parent_id → 404 Not Found
- [ ] Test without user profile → 404 Not Found
- [ ] Test rate limiting (6 requests in 1 hour) → 429 Too Many Requests
- [ ] Test with OpenRouter API key missing → 500 Internal Server Error
- [ ] Test AI service timeout (mock slow response) → 503 Service Unavailable
- [ ] Verify generated topics are saved to database
- [ ] Verify generated topics belong to authenticated user
- [ ] Verify parent_id is correctly set (if provided)
- [ ] Verify technology field matches request
- [ ] Verify status is 'to_do'
- [ ] Verify LeetCode links are valid URLs

#### Step 7.2: Integration Testing

- Test end-to-end flow:
  1. Create user account
  2. Create user profile
  3. Generate topics for technology (e.g., "React")
  4. Verify topics in database
  5. Generate subtopics for one topic
  6. Verify parent-child relationship

#### Step 7.3: Security Testing

- [ ] Verify RLS prevents access to other users' topics
- [ ] Test SQL injection attempts in technology field
- [ ] Test XSS attempts in technology field
- [ ] Verify API key is not exposed in responses or logs
- [ ] Test authentication bypass attempts
- [ ] Verify rate limiting cannot be bypassed

### Phase 8: Documentation

#### Step 8.1: Update API Documentation

- Document endpoint in API specification
- Include request/response examples
- Document all error codes
- Document rate limits

#### Step 8.2: Update Environment Variables Documentation

- Add to `.env.example`:
  ```
  # OpenRouter AI Service
  OPENROUTER_API_KEY=your_api_key_here
  OPENROUTER_MODEL=openai/gpt-3.5-turbo
  AI_GENERATION_TIMEOUT=30000
  AI_RATE_LIMIT_PER_HOUR=5
  ```
- Document in README.md

#### Step 8.3: Code Documentation

- Ensure all functions have JSDoc comments
- Document error scenarios in service functions
- Document environment variables usage

### Phase 9: Deployment Preparation

#### Step 9.1: Environment Configuration

- Set OpenRouter API key in production environment
- Configure appropriate timeout values
- Set rate limits based on expected usage
- Configure monitoring and alerting

#### Step 9.2: Performance Monitoring

- Add logging for:
  - AI service response times
  - Database query times
  - Rate limit hits
  - Error rates by type
- Consider adding metrics tracking (e.g., Prometheus, Datadog)

#### Step 9.3: Cost Monitoring

- Track OpenRouter API usage
- Set up budget alerts
- Monitor tokens used per request
- Optimize prompts to reduce token consumption

## 10. Future Enhancements

### Phase 2 Improvements (Post-MVP)

1. **Async Processing**
   - Move AI generation to background job queue
   - Return job ID immediately
   - Poll or websocket for completion
   - Allow longer processing times

2. **Advanced Rate Limiting**
   - Implement Redis-backed rate limiting
   - Per-user quotas based on subscription tier
   - Burst allowances
   - Global rate limits

3. **Caching**
   - Cache user profiles
   - Cache parent topic details
   - Cache similar AI requests (deduplication)

4. **Enhanced AI Features**
   - Support multiple AI models (fallback on failure)
   - A/B test different prompts
   - User feedback on generated topics
   - Iterative refinement ("generate more like this")

5. **Analytics**
   - Track which technologies are most popular
   - Monitor AI response quality
   - User engagement with generated topics
   - Cost per generation tracking

6. **Batch Operations**
   - Generate for multiple technologies at once
   - Generate learning path (multiple levels)

7. **Personalization**
   - Learn from user's topic completion history
   - Suggest next topics based on progress
   - Adapt difficulty based on performance
