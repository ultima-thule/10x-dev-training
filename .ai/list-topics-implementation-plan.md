# API Endpoint Implementation Plan: List User Topics

## 1. Endpoint Overview

This endpoint retrieves a paginated, filtered, and sorted list of topics for the authenticated user. It supports flexible querying through optional query parameters for status, technology, parent relationships, and provides metadata about the topic hierarchy (children count).

**Key Features**:

- Pagination with configurable page size (1-100 items per page, default 50)
- Filtering by status, technology, and parent topic ID
- Sorting by created_at, updated_at, title, or status
- Includes count of direct children for each topic
- Returns properly typed leetcode_links as structured objects

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/topics`
- **Authentication**: Required via Supabase auth (JWT token in Authorization header)

### Query Parameters

**All parameters are optional:**

| Parameter    | Type   | Validation                                          | Default      | Description                                   |
| ------------ | ------ | --------------------------------------------------- | ------------ | --------------------------------------------- |
| `status`     | string | Enum: `to_do`, `in_progress`, `completed`           | none         | Filter topics by status                       |
| `technology` | string | Non-empty string                                    | none         | Filter topics by technology name              |
| `parent_id`  | string | Valid UUID or literal string `"null"`               | none         | Filter by parent ID; `"null"` for root topics |
| `sort`       | string | Enum: `created_at`, `updated_at`, `title`, `status` | `created_at` | Field to sort by                              |
| `order`      | string | Enum: `asc`, `desc`                                 | `desc`       | Sort direction                                |
| `page`       | number | Integer >= 1                                        | 1            | Page number for pagination                    |
| `limit`      | number | Integer between 1 and 100                           | 50           | Number of items per page                      |

### Request Headers

```
Authorization: Bearer {supabase_jwt_token}
```

### Example Requests

**Get all root topics (no parent), sorted by title ascending:**

```
GET /api/topics?parent_id=null&sort=title&order=asc
```

**Get completed React topics, paginated:**

```
GET /api/topics?technology=React&status=completed&page=1&limit=20
```

## 3. Used Types

### DTOs (from `src/types.ts`)

- **`TopicListItemDTO`**: Extended topic with children count

  ```typescript
  interface TopicListItemDTO extends TopicDTO {
    children_count: number;
  }
  ```

- **`TopicListResponseDTO`**: Response structure

  ```typescript
  interface TopicListResponseDTO {
    data: TopicListItemDTO[];
    pagination: PaginationMetadata;
  }
  ```

- **`PaginationMetadata`**: Pagination information

  ```typescript
  interface PaginationMetadata {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
  ```

- **`LeetCodeLink`**: Structured leetcode links

  ```typescript
  interface LeetCodeLink {
    title: string;
    url: string;
    difficulty: string;
  }
  ```

- **`ErrorResponseDTO`**: Error response structure
  ```typescript
  interface ErrorResponseDTO {
    error: {
      code: string;
      message: string;
      details?: ValidationErrorDetail[];
    };
  }
  ```

### Validation Types (to be created in `src/lib/validators/topic.validators.ts`)

- **`ListTopicsQuerySchema`**: Zod schema for query parameter validation
- **`ListTopicsQueryInput`**: Inferred TypeScript type from the schema

## 4. Response Details

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "parent_id": null,
      "title": "Advanced React Patterns",
      "description": "Deep dive into advanced React patterns and best practices",
      "status": "in_progress",
      "technology": "React",
      "leetcode_links": [
        {
          "title": "Two Sum",
          "url": "https://leetcode.com/problems/two-sum/",
          "difficulty": "Easy"
        }
      ],
      "created_at": "2025-11-10T10:00:00Z",
      "updated_at": "2025-11-15T10:00:00Z",
      "children_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "total_pages": 1
  }
}
```

**Empty Result (still 200 OK):**

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "total_pages": 0
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "status",
        "message": "Status must be one of: to_do, in_progress, completed"
      }
    ]
  }
}
```

**401 Unauthorized** - Missing or invalid authentication:

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

**500 Internal Server Error** - Unexpected server error:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### High-Level Flow

```
1. Client sends GET request with optional query parameters
   ↓
2. API Route Handler (/api/topics.ts)
   - Extract query parameters from URL
   - Authenticate user via Supabase
   - Validate query parameters with Zod
   ↓
3. Topic Service (listUserTopics)
   - Build Supabase query with filters
   - Execute count query for total (for pagination)
   - Execute main query with pagination
   - Calculate children_count for each topic
   ↓
4. Return formatted response
   - Transform data to TopicListItemDTO[]
   - Calculate pagination metadata
   - Return TopicListResponseDTO with 200 OK
```

### Detailed Service Layer Logic

**Query Building Process:**

1. **Base Query**: Select all topic fields, filter by user_id
2. **Apply Filters** (if provided):
   - `status`: Add WHERE status = {status}
   - `technology`: Add WHERE technology = {technology}
   - `parent_id`: Add WHERE parent_id = {parent_id} or IS NULL if "null"
3. **Count Total**: Execute count query with same filters
4. **Apply Sorting**: ORDER BY {sort_field} {order}
5. **Apply Pagination**: LIMIT {limit} OFFSET {(page - 1) \* limit}
6. **Enrich with Children Count**: For each topic, count children with subquery or separate query
7. **Transform Response**: Convert to TopicListItemDTO with pagination metadata

### Database Queries

**Count Query** (for total):

```sql
SELECT COUNT(*)
FROM topics
WHERE user_id = {userId}
  AND status = {status}  -- if provided
  AND technology = {technology}  -- if provided
  AND (parent_id = {parent_id} OR parent_id IS NULL)  -- if provided
```

**Main Query**:

```sql
SELECT id, user_id, parent_id, title, description, status,
       technology, leetcode_links, created_at, updated_at
FROM topics
WHERE user_id = {userId}
  -- [same filters as count query]
ORDER BY {sort_field} {order}
LIMIT {limit} OFFSET {offset}
```

**Children Count** (per topic):

```sql
SELECT COUNT(*)
FROM topics
WHERE parent_id = {topic_id}
```

## 6. Security Considerations

### Authentication

- **Requirement**: Valid Supabase JWT token required
- **Implementation**: Extract user from `locals.supabase.auth.getUser()`
- **Failure Handling**: Return 401 if authentication fails or user is null

### Authorization

- **Principle**: Users can only access their own topics
- **Implementation**: Always filter queries by `user_id = {authenticated_user_id}`
- **Defense in Depth**: Rely on Row Level Security (RLS) policies in Supabase as second layer

### Input Validation

- **Approach**: Validate all query parameters with Zod before processing
- **Prevents**: SQL injection, type confusion, invalid enum values
- **Sanitization**: Supabase query builder handles parameter escaping

### Rate Limiting

- **Consideration**: Implement rate limiting at middleware or API gateway level
- **Recommendation**: Limit to reasonable requests per minute per user (e.g., 60 req/min)

### Resource Protection

- **Max Page Size**: Hard limit at 100 items to prevent resource exhaustion
- **Pagination**: Discourage deep pagination (consider cursor-based for large datasets in future)

### Error Message Handling

- **Client**: Return generic error messages without sensitive details
- **Server**: Log detailed error information (stack traces, user IDs, timestamps)
- **Avoid**: Exposing database structure, internal paths, or user existence

## 7. Error Handling

### Error Categories and Responses

| Error Type               | HTTP Status | Error Code           | Handling Strategy                           |
| ------------------------ | ----------- | -------------------- | ------------------------------------------- |
| Missing auth token       | 401         | AUTHENTICATION_ERROR | Check `auth.getUser()` result               |
| Invalid/expired token    | 401         | AUTHENTICATION_ERROR | Supabase auth validates token automatically |
| Invalid query parameters | 400         | VALIDATION_ERROR     | Zod validation with detailed field errors   |
| Invalid enum value       | 400         | VALIDATION_ERROR     | Zod enum validation                         |
| Invalid UUID format      | 400         | VALIDATION_ERROR     | Zod UUID validation                         |
| Out of range limit/page  | 400         | VALIDATION_ERROR     | Zod min/max validation                      |
| Database query failure   | 500         | INTERNAL_ERROR       | Catch and log database errors               |
| Unexpected runtime error | 500         | INTERNAL_ERROR       | Global try-catch with error logging         |

### Error Handling Pattern

Follow the established pattern from `profile.ts`:

```typescript
try {
  // 1. Authentication (throw 401 if fails)
  // 2. Parse & validate query params (throw 400 if fails)
  // 3. Call service layer (may throw service errors)
  // 4. Return success response
} catch (error) {
  if (error instanceof ZodError) {
    // Return 400 with validation details
  }
  if (error instanceof TopicServiceError) {
    // Return error with custom status code
  }
  // Log and return 500 for unexpected errors
}
```

### Logging Strategy

**Service Layer** (`topic.service.ts`):

```typescript
console.error("[TopicService] Failed to list topics", {
  userId,
  queryParams,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

**API Layer** (`/api/topics.ts`):

```typescript
console.error("[API] Unexpected error in GET /api/topics", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **N+1 Query Problem**: Separate query for children_count per topic
   - **Impact**: Performance degrades with large result sets
   - **Mitigation**: Use subquery or LEFT JOIN with COUNT in main query

2. **Large Result Sets**: Users with thousands of topics
   - **Impact**: Slow queries, high memory usage
   - **Mitigation**: Enforce reasonable pagination limits, add database indexes

3. **Deep Pagination**: Accessing page 100+ with OFFSET
   - **Impact**: Database must scan and skip many rows
   - **Future Enhancement**: Implement cursor-based pagination for large datasets

### Optimization Strategies

#### Database Indexes

Ensure the following indexes exist on the `topics` table:

```sql
-- Primary index on user_id for efficient filtering
CREATE INDEX idx_topics_user_id ON topics(user_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_topics_user_status ON topics(user_id, status);
CREATE INDEX idx_topics_user_technology ON topics(user_id, technology);
CREATE INDEX idx_topics_user_parent ON topics(user_id, parent_id);

-- Indexes for sorting
CREATE INDEX idx_topics_user_created ON topics(user_id, created_at DESC);
CREATE INDEX idx_topics_user_updated ON topics(user_id, updated_at DESC);
CREATE INDEX idx_topics_user_title ON topics(user_id, title);

-- Index for children count calculation
CREATE INDEX idx_topics_parent_id ON topics(parent_id);
```

#### Query Optimization

**Efficient Children Count**: Use a single query with subquery:

```typescript
const { data, error } = await supabase
  .from("topics")
  .select(
    `
    *,
    children_count:topics!parent_id(count)
  `
  )
  .eq("user_id", userId);
// ... filters, sorting, pagination
```

#### Caching Considerations

For future optimization:

- Cache frequently accessed root topics
- Cache technology lists for filter dropdowns
- Consider Redis for session-based caching

## 9. Implementation Steps

### Step 1: Create Validator (`src/lib/validators/topic.validators.ts`)

Create Zod schema for query parameter validation:

```typescript
import { z } from "zod";

export const ListTopicsQuerySchema = z.object({
  status: z.enum(["to_do", "in_progress", "completed"]).optional(),
  technology: z.string().min(1).optional(),
  parent_id: z.union([z.string().uuid({ message: "Parent ID must be a valid UUID" }), z.literal("null")]).optional(),
  sort: z.enum(["created_at", "updated_at", "title", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListTopicsQueryInput = z.infer<typeof ListTopicsQuerySchema>;
```

### Step 2: Create Service Layer (`src/lib/services/topic.service.ts`)

Create service function with business logic:

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { TopicListResponseDTO, TopicListItemDTO, ErrorResponseDTO } from "@/types";
import type { ListTopicsQueryInput } from "@/lib/validators/topic.validators";

export class TopicServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}

export async function listUserTopics(
  supabase: SupabaseClient,
  userId: string,
  queryParams: ListTopicsQueryInput
): Promise<TopicListResponseDTO> {
  // Extract query parameters
  const { status, technology, parent_id, sort, order, page, limit } = queryParams;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  try {
    // Build base query for counting
    let countQuery = supabase.from("topics").select("id", { count: "exact", head: true }).eq("user_id", userId);

    // Apply filters to count query
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (technology) {
      countQuery = countQuery.eq("technology", technology);
    }
    if (parent_id !== undefined) {
      if (parent_id === "null") {
        countQuery = countQuery.is("parent_id", null);
      } else {
        countQuery = countQuery.eq("parent_id", parent_id);
      }
    }

    // Execute count query
    const { count: total, error: countError } = await countQuery;

    if (countError) {
      console.error("[TopicService] Failed to count topics", {
        userId,
        error: countError.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve topics",
        },
      });
    }

    // Build main query with children count
    let dataQuery = supabase
      .from("topics")
      .select(
        `
        *,
        children:topics!parent_id(count)
      `
      )
      .eq("user_id", userId);

    // Apply same filters to data query
    if (status) {
      dataQuery = dataQuery.eq("status", status);
    }
    if (technology) {
      dataQuery = dataQuery.eq("technology", technology);
    }
    if (parent_id !== undefined) {
      if (parent_id === "null") {
        dataQuery = dataQuery.is("parent_id", null);
      } else {
        dataQuery = dataQuery.eq("parent_id", parent_id);
      }
    }

    // Apply sorting
    dataQuery = dataQuery.order(sort, { ascending: order === "asc" });

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute main query
    const { data, error: dataError } = await dataQuery;

    if (dataError) {
      console.error("[TopicService] Failed to fetch topics", {
        userId,
        error: dataError.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve topics",
        },
      });
    }

    // Transform data to include children_count
    const topicsWithCount: TopicListItemDTO[] = (data || []).map((topic: any) => ({
      id: topic.id,
      user_id: topic.user_id,
      parent_id: topic.parent_id,
      title: topic.title,
      description: topic.description,
      status: topic.status,
      technology: topic.technology,
      leetcode_links: topic.leetcode_links,
      created_at: topic.created_at,
      updated_at: topic.updated_at,
      children_count: topic.children?.[0]?.count || 0,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil((total || 0) / limit);

    return {
      data: topicsWithCount,
      pagination: {
        page,
        limit,
        total: total || 0,
        total_pages: totalPages,
      },
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    console.error("[TopicService] Unexpected error in listUserTopics", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new TopicServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  }
}
```

### Step 3: Create API Route Handler (`src/pages/api/topics.ts`)

Create the API endpoint following Astro conventions:

```typescript
import type { APIRoute } from "astro";
import { ListTopicsQuerySchema } from "@/lib/validators/topic.validators";
import { listUserTopics, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";
import { ZodError } from "zod";

export const prerender = false;

/**
 * GET /api/topics
 *
 * Lists all topics for the authenticated user with optional filtering,
 * sorting, and pagination.
 *
 * Query Parameters:
 * - status: Filter by topic status (optional)
 * - technology: Filter by technology name (optional)
 * - parent_id: Filter by parent topic ID or "null" for root topics (optional)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (default: desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 *
 * Response Codes:
 * - 200 OK: Topics retrieved successfully
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
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

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const rawParams = {
      status: url.searchParams.get("status") || undefined,
      technology: url.searchParams.get("technology") || undefined,
      parent_id: url.searchParams.get("parent_id") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!, 10) : undefined,
      limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
    };

    // Step 3: Validate query parameters with Zod schema
    const validatedParams = ListTopicsQuerySchema.parse(rawParams);

    // Step 4: Call service to retrieve topics
    const response = await listUserTopics(supabase, user.id, validatedParams);

    // Step 5: Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: ValidationErrorDetail[] = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle service errors (500 Internal Error)
    if (error instanceof TopicServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("[API] Unexpected error in GET /api/topics", {
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

### Step 4: Add Database Indexes (if not already present)

Create migration or run SQL directly in Supabase:

```sql
-- Index for user-based queries
CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);

-- Composite indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_topics_user_status ON topics(user_id, status);
CREATE INDEX IF NOT EXISTS idx_topics_user_technology ON topics(user_id, technology);
CREATE INDEX IF NOT EXISTS idx_topics_user_parent ON topics(user_id, parent_id);

-- Indexes for sorting
CREATE INDEX IF NOT EXISTS idx_topics_user_created ON topics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_user_updated ON topics(user_id, updated_at DESC);

-- Index for children count
CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON topics(parent_id);
```

### Step 5: Verify Row Level Security (RLS)

Ensure RLS policies exist on the `topics` table:

```sql
-- Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own topics
CREATE POLICY "Users can view own topics" ON topics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own topics
CREATE POLICY "Users can create own topics" ON topics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own topics
CREATE POLICY "Users can update own topics" ON topics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own topics
CREATE POLICY "Users can delete own topics" ON topics
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 6: Testing

Create comprehensive tests covering:

1. **Authentication Tests**:
   - Request without token returns 401
   - Request with invalid token returns 401
   - Request with expired token returns 401

2. **Validation Tests**:
   - Invalid status enum returns 400 with details
   - Invalid parent_id UUID returns 400
   - Limit > 100 returns 400
   - Negative page returns 400

3. **Filtering Tests**:
   - Filter by status returns only matching topics
   - Filter by technology returns only matching topics
   - Filter by parent_id returns only child topics
   - Filter by parent_id="null" returns only root topics
   - Multiple filters work together (AND logic)

4. **Sorting Tests**:
   - Sort by created_at (default) works correctly
   - Sort by title works correctly
   - Sort by status works correctly
   - Order asc/desc works correctly

5. **Pagination Tests**:
   - Page 1 returns first N items
   - Page 2 returns next N items
   - Empty page returns empty array (not error)
   - Pagination metadata is accurate

6. **Data Integrity Tests**:
   - Users only see their own topics (isolation)
   - Children count is accurate
   - leetcode_links are properly typed

7. **Performance Tests**:
   - Query completes within acceptable time (<500ms)
   - Large result sets handled efficiently

### Step 7: Documentation

Update API documentation with:

- Endpoint description and examples
- Query parameter specifications
- Response format examples
- Error response examples
- Usage recommendations (pagination best practices)

---

## Summary

This implementation plan provides a complete guide for building the `GET /api/topics` endpoint following established patterns in the codebase. The architecture separates concerns into validation (Zod schemas), business logic (service layer), and API handling (route handler), ensuring maintainability, testability, and security.

**Key Implementation Points**:

- Use Zod for comprehensive query parameter validation
- Leverage Supabase query builder for safe, parameterized queries
- Filter all queries by authenticated user_id
- Implement proper error handling with structured logging
- Optimize database queries with appropriate indexes
- Return paginated responses with complete metadata
- Follow established patterns from `profile.ts` endpoint
