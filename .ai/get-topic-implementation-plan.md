# API Endpoint Implementation Plan: Get Topic by ID

## 1. Endpoint Overview

The Get Topic by ID endpoint retrieves a single topic's details by its unique identifier. It's a simple read operation that returns complete topic information including title, description, status, technology, and associated LeetCode practice problems.

**Key Features:**

- Simple, fast lookup by UUID
- Returns complete topic details
- Enforces user ownership via Row Level Security (RLS)
- Read-only operation with no side effects

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/topics/:id`
- **Authentication**: Required via `Authorization: Bearer {access_token}` header
- **Content-Type**: Not applicable (GET request)

### Parameters

#### Required Parameters:

**Path Parameter:**

- `id` (string): Topic UUID
  - Must be valid UUID v4 format
  - Example: `550e8400-e29b-41d4-a716-446655440000`

**Header:**

- `Authorization: Bearer {access_token}`
  - JWT token from Supabase authentication
  - Validated by Astro middleware

#### Optional Parameters:

- None

### Request Examples

```bash
# Get topic by ID
curl -X GET http://localhost:3000/api/topics/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGc..."
```

## 3. Used Types

### DTOs (Output)

**`TopicDTO`** (from `src/types.ts` - already exists):

```typescript
type TopicDTO = Omit<Tables<"topics">, "leetcode_links"> & {
  leetcode_links: LeetCodeLink[];
};
```

**`LeetCodeLink`** (from `src/types.ts` - already exists):

```typescript
interface LeetCodeLink {
  title: string;
  url: string;
  difficulty: string;
}
```

### Validators (Input)

**Path Parameter Validation** (to be created):

```typescript
// Simple UUID validation schema
const TopicIdParamSchema = z.object({
  id: z.string().uuid({ message: "Topic ID must be a valid UUID" }),
});
```

### Service Layer Types

No new types needed. Will use existing `TopicServiceError` from `topic.service.ts`.

## 4. Response Details

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "789e0123-e89b-12d3-a456-426614174111",
  "parent_id": null,
  "title": "Advanced React Patterns",
  "description": "Deep dive into advanced React patterns and best practices including compound components, render props, HOCs, and custom hooks.",
  "status": "in_progress",
  "technology": "React",
  "leetcode_links": [
    {
      "title": "Two Sum",
      "url": "https://leetcode.com/problems/two-sum/",
      "difficulty": "Easy"
    }
  ],
  "created_at": "2025-11-10T10:00:00.000Z",
  "updated_at": "2025-11-15T10:00:00.000Z"
}
```

**Response Fields:**

| Field            | Type                  | Description                                            |
| ---------------- | --------------------- | ------------------------------------------------------ |
| `id`             | string (UUID)         | Topic unique identifier                                |
| `user_id`        | string (UUID)         | Owner's user ID                                        |
| `parent_id`      | string (UUID) \| null | Parent topic ID or null for root topics                |
| `title`          | string                | Topic title                                            |
| `description`    | string \| null        | Detailed description                                   |
| `status`         | enum                  | Current status: `to_do`, `in_progress`, or `completed` |
| `technology`     | string                | Technology/framework name                              |
| `leetcode_links` | Array<LeetCodeLink>   | Related coding problems                                |
| `created_at`     | string (ISO 8601)     | Creation timestamp                                     |
| `updated_at`     | string (ISO 8601)     | Last modification timestamp                            |

### Error Responses

#### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid topic ID format",
    "details": [
      {
        "field": "id",
        "message": "Topic ID must be a valid UUID"
      }
    ]
  }
}
```

**Trigger**: Invalid UUID format in path parameter

#### 401 Unauthorized

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

**Trigger**: Missing or invalid JWT token

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Topic not found"
  }
}
```

**Triggers**:

- Topic doesn't exist in database
- Topic exists but belongs to another user (RLS blocks access)

**Note**: RLS makes 403 (Forbidden) and 404 (Not Found) indistinguishable since unauthorized queries return no rows. We use 404 for both cases to avoid leaking information about topic existence.

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve topic"
  }
}
```

**Trigger**: Database operation error

## 5. Data Flow

### High-Level Flow

```
1. Client Request (GET /api/topics/:id)
   ↓
2. Authentication & Authorization (Middleware)
   ↓
3. Path Parameter Validation (UUID format)
   ↓
4. Query Database (with RLS enforcement)
   ↓
5. Return Topic or 404 (200 OK)
```

### Detailed Data Flow

#### Step 1-2: Request Handling & Authentication

- Astro middleware extracts and validates JWT token from Authorization header
- Supabase client initialized with user context (via `context.locals.supabase`)
- User ID extracted from authenticated token
- Early return with 401 if authentication fails

#### Step 3: Path Parameter Validation

- Extract `id` from URL path parameters (`Astro.params.id`)
- Validate UUID format using Zod schema
- Return 400 if validation fails

#### Step 4: Database Query

- Call service function: `getTopicById(supabase, userId, topicId)`
- Service executes Supabase query:
  ```typescript
  supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .eq("user_id", userId) // Explicit user filter (redundant with RLS but clearer)
    .maybeSingle();
  ```
- RLS policies automatically enforce that users can only see their own topics
- Database returns topic data or null

#### Step 5: Response Formatting

- If topic found: Transform to `TopicDTO` and return 200 OK
- If topic not found: Return 404 Not Found
- If database error: Return 500 Internal Server Error

### Database Interaction

**Query:**

```sql
SELECT *
FROM topics
WHERE id = $1
  AND user_id = $2  -- Explicit check (RLS also enforces this)
LIMIT 1;
```

**RLS Policy** (automatically applied):

```sql
-- Users can only select their own topics
CREATE POLICY "Users can view own topics"
  ON topics FOR SELECT
  USING (auth.uid() = user_id);
```

**Performance:**

- Primary key lookup on `id` (indexed)
- Additional filter on `user_id` (indexed)
- Expected query time: <10ms

## 6. Security Considerations

### Authentication & Authorization

#### Authentication

- **Requirement**: Valid JWT token in `Authorization: Bearer {token}` header
- **Enforcement**: Astro middleware validates token
- **Error**: Return 401 if token missing, invalid, or expired

#### Authorization

- **User Context**: All operations scoped to authenticated user
- **RLS Enforcement**:
  - Database-level policy ensures users only access their own topics
  - Even if user guesses another user's topic UUID, RLS blocks access
- **Explicit Filtering**: Service adds `user_id` filter for clarity and defense-in-depth
- **No Information Leakage**: Return 404 for both "doesn't exist" and "forbidden" cases

### Input Validation

#### Topic ID Parameter

- **Validation**:
  - Required field
  - Must be valid UUID v4 format
  - Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
- **Threat**: Path traversal, SQL injection
- **Mitigation**:
  - Strict UUID validation with Zod
  - Parameterized queries prevent SQL injection
  - Invalid format rejected before database query

### Common Security Threats

#### 1. Unauthorized Access to Other Users' Topics

- **Threat**: User tries to access another user's topic by guessing UUID
- **Mitigation**: RLS policy blocks access; returns 404 (not 403 to avoid leaking existence)

#### 2. SQL Injection

- **Threat**: Malicious UUID crafted to inject SQL
- **Mitigation**:
  - UUID format validation rejects non-UUID strings
  - Supabase uses parameterized queries
  - TypeScript type safety

#### 3. Authentication Bypass

- **Threat**: Request without valid token
- **Mitigation**: Middleware enforces authentication before endpoint logic

#### 4. Information Disclosure

- **Threat**: Error messages leak sensitive information
- **Mitigation**:
  - Generic error messages for client
  - Detailed errors only in server logs
  - Same 404 response for "not found" and "forbidden"

### Data Privacy

- **User Isolation**: RLS ensures complete data isolation between users
- **No PII Exposure**: Topic data is user-generated content, not sensitive PII
- **Audit Trail**: Access logged for debugging (server-side only)

## 7. Error Handling

### Error Scenarios & Status Codes

#### 400 Bad Request

**Scenario: Invalid UUID format**

- **Trigger**: Path parameter is not a valid UUID
- **Examples**:
  - `abc123` (not UUID format)
  - `550e8400-invalid-uuid` (malformed)
  - Empty string
- **Response**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid topic ID format",
      "details": [
        {
          "field": "id",
          "message": "Topic ID must be a valid UUID"
        }
      ]
    }
  }
  ```
- **Logging**: Debug level (expected user error)

#### 401 Unauthorized

**Scenario 1: Missing authentication token**

- **Trigger**: No Authorization header
- **Response**:
  ```json
  {
    "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Missing authentication token"
    }
  }
  ```
- **Logging**: Info level
- **Handling**: Middleware returns early

**Scenario 2: Invalid or expired token**

- **Trigger**: Token signature invalid or expired
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

**Scenario 1: Topic doesn't exist**

- **Trigger**: UUID doesn't match any topic in database
- **Response**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Topic not found"
    }
  }
  ```
- **Logging**: Debug level (normal use case)

**Scenario 2: Topic belongs to another user**

- **Trigger**: Topic exists but `user_id` doesn't match authenticated user
- **Response**: Same as Scenario 1 (404 Not Found)
- **Logging**: Info level (potential security event)
- **Note**: RLS blocks query, returns no rows (same as non-existent)

#### 500 Internal Server Error

**Scenario: Database operation failed**

- **Trigger**: Supabase query error
- **Response**:
  ```json
  {
    "error": {
      "code": "INTERNAL_ERROR",
      "message": "Failed to retrieve topic"
    }
  }
  ```
- **Logging**: Error level with full error details
- **Handling**: Service catches database errors

### Error Logging Strategy

#### Log Levels

- **Debug**: Expected user errors (validation, not found)
- **Info**: Authentication events, authorization attempts
- **Error**: Unexpected errors, database failures

#### Log Format

```typescript
console.error("[TopicService] Error description", {
  userId,
  topicId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

#### Sensitive Data

- Never log authentication tokens
- Don't log full topic content in error logs
- Sanitize user input before logging

## 8. Performance Considerations

### Potential Bottlenecks

#### Database Query

- **Issue**: Single-row lookup by primary key
- **Impact**: Minimal - primary key lookups are O(log n) with B-tree index
- **Expected Latency**: <10ms for typical database
- **Mitigation**: Already optimal - indexed primary key lookup

#### Network Latency

- **Issue**: Round-trip time to database
- **Impact**: Depends on database location (Supabase hosted)
- **Expected Latency**: 20-100ms depending on region
- **Mitigation**:
  - Use Supabase region close to application server
  - Consider read replicas for high traffic (future)

### Optimization Strategies

#### Database Indexes

- **Already Optimized**:
  - `topics(id)` - Primary key, automatically indexed
  - `topics(user_id)` - Indexed for RLS and filtering
- **No Additional Indexes Needed**: Single-row lookup by primary key

#### Caching (Future Enhancement)

- **For MVP**: No caching needed
- **For Production**: Consider caching if:
  - Topic is accessed frequently without changes
  - Implement cache invalidation on topic updates
  - Use Redis with 5-minute TTL
  - Cache key: `topic:{user_id}:{topic_id}`

#### Connection Pooling

- **Supabase Handles**: Connection pooling automatically managed
- **No Action Needed**: Let Supabase optimize connections

### Scalability Considerations

#### Horizontal Scaling

- **Stateless Design**: Endpoint can run on multiple instances
- **No Sessions**: All state in database via RLS
- **Load Balancing**: Standard HTTP load balancer compatible

#### Database Scaling

- **Read Replicas**: Supabase supports read replicas for read-heavy loads
- **Vertical Scaling**: Upgrade Supabase plan if needed
- **Expected Load**: Low - simple key lookup, fast response

## 9. Implementation Steps

### Phase 1: Validation Layer

#### Step 1.1: Create Path Parameter Validator

- Create `src/lib/validators/topic-id.validator.ts`:

  ```typescript
  import { z } from "zod";

  /**
   * Validation schema for topic ID path parameter
   */
  export const TopicIdParamSchema = z.object({
    id: z.string().uuid({ message: "Topic ID must be a valid UUID" }),
  });

  export type TopicIdParam = z.infer<typeof TopicIdParamSchema>;
  ```

- Export from `src/lib/validators/topic.validators.ts`:
  ```typescript
  export * from "./topic-id.validator";
  ```

### Phase 2: Service Layer

#### Step 2.1: Extend Topic Service

- Add function to `src/lib/services/topic.service.ts`:

  ```typescript
  /**
   * Retrieves a single topic by ID
   *
   * @param supabase - Supabase client instance
   * @param userId - Authenticated user's ID
   * @param topicId - Topic UUID to retrieve
   * @returns Promise resolving to topic details
   * @throws TopicServiceError with 404 if not found, 500 for database errors
   *
   * Business Logic:
   * 1. Query topics table by ID and user_id
   * 2. Return topic if found
   * 3. Throw 404 if not found or unauthorized
   *
   * Error Scenarios:
   * - 404 Not Found: Topic doesn't exist or belongs to another user
   * - 500 Internal Error: Database operation failed
   */
  export async function getTopicById(supabase: SupabaseClient, userId: string, topicId: string): Promise<TopicDTO> {
    const { data: topic, error } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[TopicService] Failed to fetch topic", {
        userId,
        topicId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve topic",
        },
      });
    }

    if (!topic) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Topic not found",
        },
      });
    }

    // Transform to TopicDTO (ensure leetcode_links is properly typed)
    return {
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
    };
  }
  ```

### Phase 3: API Endpoint

#### Step 3.1: Create Endpoint Handler

- Create `src/pages/api/topics/[id].ts`:

  ```typescript
  import type { APIRoute } from "astro";
  import { TopicIdParamSchema } from "@/lib/validators/topic.validators";
  import { getTopicById, TopicServiceError } from "@/lib/services/topic.service";
  import type { ErrorResponseDTO } from "@/types";

  export const prerender = false;

  /**
   * GET /api/topics/:id
   *
   * Retrieves a single topic by ID
   * Requires authentication via JWT token in Authorization header
   *
   * Path Parameters:
   * - id: Topic UUID
   *
   * Response (200 OK):
   * {
   *   "id": "uuid",
   *   "user_id": "uuid",
   *   "parent_id": null,
   *   "title": "...",
   *   "description": "...",
   *   "status": "to_do",
   *   "technology": "...",
   *   "leetcode_links": [...],
   *   "created_at": "...",
   *   "updated_at": "..."
   * }
   *
   * Error Responses:
   * - 400 Bad Request: Invalid topic ID format
   * - 401 Unauthorized: Missing or invalid authentication token
   * - 404 Not Found: Topic not found or unauthorized
   * - 500 Internal Server Error: Database error
   */
  export const GET: APIRoute = async ({ params, locals }) => {
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
      // Step 3: Validate path parameter
      const validationResult = TopicIdParamSchema.safeParse(params);

      if (!validationResult.success) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid topic ID format",
            details: validationResult.error.issues.map((issue) => ({
              field: issue.path.join(".") || "id",
              message: issue.message,
            })),
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { id: topicId } = validationResult.data;

      // Step 4: Fetch topic from database via service
      const topic = await getTopicById(supabase, userId, topicId);

      // Step 5: Return success response
      return new Response(JSON.stringify(topic), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Handle service errors
      if (error instanceof TopicServiceError) {
        return new Response(JSON.stringify(error.errorResponse), {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle unexpected errors
      console.error("[API] Unexpected error in GET /api/topics/:id", {
        userId,
        topicId: params.id,
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

### Phase 4: Testing & Validation

#### Step 4.1: Manual Testing Checklist

- [ ] Test with valid token and valid UUID → 200 OK
- [ ] Test without Authorization header → 401 Unauthorized
- [ ] Test with expired token → 401 Unauthorized
- [ ] Test with invalid UUID format → 400 Bad Request
- [ ] Test with non-existent UUID → 404 Not Found
- [ ] Test with another user's topic UUID → 404 Not Found
- [ ] Verify response contains all expected fields
- [ ] Verify leetcode_links are properly formatted
- [ ] Verify timestamps are ISO 8601 format
- [ ] Verify status is one of valid enum values

#### Step 4.2: Integration Testing

- Test with topics created via POST /api/topics/generate
- Verify RLS enforcement (user A cannot access user B's topics)
- Test with hierarchical topics (parent-child relationships)

#### Step 4.3: Security Testing

- [ ] Verify RLS blocks unauthorized access
- [ ] Test SQL injection attempts in UUID parameter
- [ ] Verify API key is not exposed in responses
- [ ] Test authentication bypass attempts

### Phase 5: Documentation

#### Step 5.1: Update API Documentation

- Add endpoint to `.ai/api-plan.md`
- Document all request/response formats
- Document all error codes

#### Step 5.2: Code Documentation

- Ensure all functions have JSDoc comments
- Document error scenarios in service function
- Add inline comments for complex logic

## 10. Testing Scenarios

### Happy Path

```bash
# 1. Create a topic (to get ID)
TOPIC_ID=$(curl -s -X POST http://localhost:3000/api/topics/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technology":"React"}' | jq -r '.data[0].id')

# 2. Get the topic
curl -X GET http://localhost:3000/api/topics/$TOPIC_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with topic details
```

### Error Cases

```bash
# Invalid UUID format
curl -X GET http://localhost:3000/api/topics/invalid-uuid \
  -H "Authorization: Bearer $TOKEN"
# Expected: 400 Bad Request

# Non-existent UUID
curl -X GET http://localhost:3000/api/topics/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found

# No authentication
curl -X GET http://localhost:3000/api/topics/$TOPIC_ID
# Expected: 401 Unauthorized
```

## 11. Future Enhancements

### Phase 2 Improvements (Post-MVP)

1. **Response Caching**
   - Cache frequently accessed topics
   - Invalidate on update/delete
   - 5-minute TTL in Redis

2. **Include Children Count**
   - Add `children_count` field to response
   - Show how many subtopics exist
   - Useful for UI tree rendering

3. **Conditional Requests**
   - Support `If-None-Match` (ETag)
   - Support `If-Modified-Since`
   - Return 304 Not Modified when appropriate

4. **Expanded Response**
   - Optional query param: `?expand=children`
   - Include child topics in response
   - Optional: `?expand=parent` for breadcrumb navigation

5. **Analytics**
   - Track which topics are viewed most
   - User engagement metrics
   - Popular topics for recommendations
