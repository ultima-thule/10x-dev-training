# API Endpoint Implementation Plan: Get Topic Children

## 1. Endpoint Overview

The GET `/api/topics/:id/children` endpoint retrieves all direct children (first-level descendants) of a specific parent topic for the authenticated user. This endpoint supports hierarchical topic navigation and enables users to explore their topic tree structure. The endpoint verifies parent topic ownership before returning children, ensuring data isolation between users.

**Key Features:**

- Retrieve direct children only (not entire subtree)
- Parent topic ownership verification
- Row Level Security (RLS) enforcement
- Includes children_count for each returned topic (supports nested hierarchies)
- Fast query using indexed parent_id
- Security-focused error responses (404 for unauthorized)

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/topics/:id/children
```

### Headers

```
Authorization: Bearer {access_token}
```

### Path Parameters

| Parameter | Type   | Required | Validation        | Description                                |
| --------- | ------ | -------- | ----------------- | ------------------------------------------ |
| `id`      | string | Yes      | Valid UUID format | UUID of the parent topic to fetch children |

### Query Parameters

None. The endpoint returns all direct children without pagination (typical use case: <10 children per topic).

**Future Enhancement**: If topics commonly have >50 children, consider adding pagination parameters (`page`, `limit`) for consistency with `/api/topics`.

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/topics/123e4567-e89b-12d3-a456-426614174000/children \
  -H "Authorization: Bearer {access_token}"
```

## 3. Used Types

### DTOs and Command Models

**From Existing Code**:

- `TopicDTO` - Full topic data structure (already exists in `types.ts`)
- `TopicListItemDTO` - Topic with children_count (already exists in `types.ts`)
- `ErrorResponseDTO` - Standardized error response structure (already exists in `types.ts`)
- `TopicServiceError` - Service-level error class (already exists in `topic.service.ts`)

**New Type (Optional)**:

```typescript
/**
 * Response structure for topic children endpoint
 * Returns array of child topics for a given parent
 */
export interface TopicChildrenResponseDTO {
  data: TopicListItemDTO[];
  parent_id: string;
  count: number;
}
```

**Alternative**: Return bare array of `TopicListItemDTO[]` for simplicity (matches API spec).

### Validators

**Existing Schema (Reuse)**:

- `TopicIdParamSchema` - Already validates UUID path parameter (exists in `topic-id.validator.ts`)

**No New Schemas Required**

## 4. Response Details

### Success Response (200 OK)

Returns an array of direct child topics with their metadata.

```json
{
  "data": [
    {
      "id": "child-uuid-1",
      "user_id": "user-uuid",
      "parent_id": "parent-uuid",
      "title": "React Hooks Deep Dive",
      "description": "Understanding useCallback, useMemo, and custom hooks",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [
        {
          "title": "Custom Hook Challenge",
          "url": "https://leetcode.com/problems/custom-hook/",
          "difficulty": "Medium"
        }
      ],
      "created_at": "2025-11-10T10:05:00Z",
      "updated_at": "2025-11-10T10:05:00Z",
      "children_count": 3
    },
    {
      "id": "child-uuid-2",
      "user_id": "user-uuid",
      "parent_id": "parent-uuid",
      "title": "React Performance Optimization",
      "description": "Memoization, lazy loading, and code splitting",
      "status": "in_progress",
      "technology": "React",
      "leetcode_links": [],
      "created_at": "2025-11-10T10:06:00Z",
      "updated_at": "2025-11-15T14:00:00Z",
      "children_count": 0
    }
  ]
}
```

**Response Structure**:

- `data`: Array of `TopicListItemDTO` objects
- Each topic includes `children_count` for nested hierarchy navigation
- Empty array `[]` if parent has no children (not an error)

### Error Responses

#### 400 Bad Request - Validation Error

**Scenario: Invalid UUID Format**

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

#### 401 Unauthorized - Authentication Error

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 404 Not Found - Parent Topic Not Found

Returned when:

- Parent topic doesn't exist
- Parent topic belongs to another user (don't expose this distinction for security)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Parent topic not found"
  }
}
```

**Security Note**: We return 404 (not 403) for unauthorized access to avoid leaking information about whether topics exist for other users. This matches the security pattern used in other endpoints.

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch topic children"
  }
}
```

## 5. Data Flow

### Request Processing Pipeline

```
1. HTTP GET Request → Astro API Route Handler
   ↓
2. Extract Supabase Client from middleware (locals.supabase)
   ↓
3. Authenticate User (supabase.auth.getUser())
   ↓ (userId extracted)
4. Validate Path Parameter (TopicIdParamSchema)
   ↓ (parentId validated)
5. Call Service Layer (getTopicChildren(supabase, userId, parentId))
   ↓
6. Service: Verify parent exists and belongs to user
   ↓
7. Service: Query children with parent_id filter
   ↓
8. Service: Include children_count for each child
   ↓
9. Service: Transform to TopicListItemDTO[]
   ↓
10. Return 200 OK with { data: [...] }
```

### Service Layer Logic (`getTopicChildren` function)

**Location:** `src/lib/services/topic.service.ts`

**Function Signature:**

```typescript
export async function getTopicChildren(
  supabase: SupabaseClient,
  userId: string,
  parentId: string
): Promise<TopicListItemDTO[]>;
```

**Processing Steps:**

1. **Verify Parent Topic Ownership**

   ```typescript
   // Reuse existing validateParentTopic helper
   await validateParentTopic(supabase, userId, parentId);
   // Throws TopicServiceError(404) if parent not found or unauthorized
   ```

2. **Query Children Topics**

   ```typescript
   const { data: children, error } = await supabase
     .from("topics")
     .select(
       `
       id,
       user_id,
       parent_id,
       title,
       description,
       status,
       technology,
       leetcode_links,
       created_at,
       updated_at,
       children:topics!parent_id(count)
     `
     )
     .eq("parent_id", parentId)
     .eq("user_id", userId)
     .order("created_at", { ascending: false });
   ```

3. **Handle Query Results**
   - If error: Log and throw TopicServiceError(500, INTERNAL_ERROR)
   - If data is null/undefined: Throw TopicServiceError(500, INTERNAL_ERROR)
   - If data is empty array: Return empty array (valid case, not an error)

4. **Transform to DTOs**
   - Map database results to `TopicListItemDTO[]`
   - Parse `leetcode_links` from JSONB to array
   - Extract `children_count` from subquery

**Reuse Existing Helper:**

```typescript
/**
 * Helper: Validates that a parent topic exists and belongs to the user
 * Already exists in topic.service.ts
 * Throws TopicServiceError(404) if validation fails
 */
async function validateParentTopic(supabase: SupabaseClient, userId: string, parentId: string): Promise<void>;
```

### Database Interaction

**Table:** `topics`

**Query Structure:**

```sql
SELECT
  id,
  user_id,
  parent_id,
  title,
  description,
  status,
  technology,
  leetcode_links,
  created_at,
  updated_at,
  (SELECT COUNT(*) FROM topics AS children WHERE children.parent_id = topics.id) AS children_count
FROM topics
WHERE parent_id = $1
  AND user_id = $2
ORDER BY created_at DESC;
```

**Indexes Used:**

- `idx_topics_parent_id` on `topics(parent_id)` - Fast parent_id lookup
- `idx_topics_user_id` on `topics(user_id)` - User isolation filter
- Combined filter benefits from both indexes

**Expected Performance:**

- Typical query: <10ms for <10 children
- Large subtree (50+ children): 10-50ms
- Index ensures O(log n) lookup even with 1000+ topics

## 6. Security Considerations

### Authentication

**Mechanism:** JWT Bearer Token via Supabase Auth

**Implementation:**

1. Extract token from `Authorization: Bearer {token}` header
2. Verify token using `supabase.auth.getUser()`
3. Extract `userId` from authenticated user
4. Return 401 if authentication fails

**Code Pattern:**

```typescript
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Missing or invalid authentication token",
      },
    }),
    { status: 401 }
  );
}
```

### Authorization

**Mechanism:** Parent Topic Ownership Verification

**Implementation:**

1. Verify parent topic exists and belongs to user via `validateParentTopic()`
2. Query children with both `parent_id` AND `user_id` filters
3. Return 404 (not 403) for unauthorized access to avoid leaking existence
4. RLS policies enforce additional database-level security

**Security Benefits:**

- Users can only fetch children of their own topics
- Cannot enumerate other users' topic hierarchies
- Doesn't expose whether topics exist for other users
- Database-level enforcement via RLS

### Input Validation

**UUID Validation:**

- Prevents SQL injection via malformed IDs
- Protects against database errors from invalid UUIDs
- Returns clear 400 error for invalid format

**No Query Parameter Validation:**

- GET operations don't have request bodies
- Only path parameter needs validation

### Row Level Security (RLS)

**Database Policies (already configured):**

```sql
-- Select policy: Users can only see their own topics
CREATE POLICY "Users can select own topics"
ON topics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Benefits:**

- Defense-in-depth security layer
- Enforced at database level
- Works even if application code has bugs
- Automatic user isolation

### Information Leakage Prevention

**Security Pattern**: Return 404 for both non-existent and unauthorized parents

**Why**: Prevents attackers from enumerating valid topic UUIDs belonging to other users

**Implementation**: `validateParentTopic()` throws same 404 error for both cases

## 7. Error Handling

### Error Handling Strategy

1. **Validation Errors (400)** - Caught early at path parameter validation, returned with field-level messages
2. **Authentication Errors (401)** - Handled at API route level before service calls
3. **Not Found Errors (404)** - Returned from service when parent doesn't exist or unauthorized
4. **Internal Errors (500)** - Logged with full context, returned with generic message

### Error Scenarios and Responses

| Scenario                       | Detection Point                | Status | Error Code           | Response Message                        |
| ------------------------------ | ------------------------------ | ------ | -------------------- | --------------------------------------- |
| Invalid UUID format            | Path parameter validation      | 400    | VALIDATION_ERROR     | Topic ID must be a valid UUID           |
| Missing auth token             | Authentication check           | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token |
| Expired/invalid token          | Authentication check           | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token |
| Parent doesn't exist           | Service layer (validateParent) | 404    | NOT_FOUND            | Parent topic not found                  |
| Parent belongs to another user | Service layer (validateParent) | 404    | NOT_FOUND            | Parent topic not found                  |
| Database connection error      | Service layer (query children) | 500    | INTERNAL_ERROR       | Failed to fetch topic children          |
| Unexpected exception           | Try-catch in API route         | 500    | INTERNAL_ERROR       | An unexpected error occurred            |

### Error Logging Pattern

**Service Layer Logging:**

```typescript
console.error("[TopicService] Failed to fetch topic children", {
  userId,
  parentId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

**API Layer Logging:**

```typescript
console.error("[API] Unexpected error in GET /api/topics/:id/children", {
  userId,
  parentId: params.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

### Custom Error Class

**Use Existing `TopicServiceError`:**

```typescript
export class TopicServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}
```

**Throw Pattern:**

```typescript
throw new TopicServiceError(404, {
  error: {
    code: "NOT_FOUND",
    message: "Parent topic not found",
  },
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Large Number of Children**
   - Most topics have <10 children (fast)
   - Topics with 50+ children: 10-50ms query time
   - Consider pagination if >100 children becomes common
   - Current implementation: Return all children (acceptable for MVP)

2. **Children Count Subquery**
   - Each child topic includes its own `children_count`
   - Adds overhead: ~1-2ms per child with subquery
   - Impact: Minimal for <10 children (~10-20ms total)
   - Benefit: Enables nested hierarchy navigation without additional requests

3. **Database Query**
   - Single SELECT with filters on `parent_id` and `user_id`
   - Uses indexes: `idx_topics_parent_id` and `idx_topics_user_id`
   - Impact: ~5-20ms per request (typical case)

4. **Authentication Token Verification**
   - JWT verification on every request
   - Cached by Supabase client
   - Impact: ~5-20ms

### Optimization Strategies

1. **Index Optimization**
   - Database has indexes on:
     - `parent_id` (for hierarchy queries)
     - `user_id` (for RLS and user filtering)
   - Combined filter benefits from both indexes
   - Query planner chooses optimal index

2. **Early Validation**
   - Validate UUID format before database operations
   - Fail fast on invalid data
   - Saves database round trip for invalid requests

3. **Efficient Subquery**
   - Use Supabase's built-in subquery syntax for `children_count`
   - Single query instead of N+1 queries
   - Database optimizes subquery execution

4. **No Pagination (MVP)**
   - Return all children in single response
   - Acceptable for typical case (<10 children)
   - Add pagination in future if needed (rare case: >50 children)

### Expected Performance

**Typical Request (Parent with <10 Children):**

- Validation: <5ms
- Authentication: 5-20ms
- Parent validation: 5-15ms
- Children query: 5-20ms
- **Total: 20-60ms**

**Request With Many Children (50+ Children):**

- Validation: <5ms
- Authentication: 5-20ms
- Parent validation: 5-15ms
- Children query: 20-80ms
- **Total: 35-120ms**

**Empty Result (Parent with No Children):**

- Validation: <5ms
- Authentication: 5-20ms
- Parent validation: 5-15ms
- Children query: 5-15ms (fast, returns empty array)
- **Total: 20-55ms**

**Load Capacity:**

- Single instance: 100-200 concurrent requests/sec
- Bottleneck: Database connection pool
- Scaling: Horizontal (more app servers) or vertical (larger database)

### Monitoring Recommendations

1. **Log Slow Queries**
   - Log if database operation takes >100ms
   - Track number of children returned
   - Investigate if many parents have >50 children

2. **Track Error Rates**
   - Monitor 404 rate (potential UX issue or unauthorized attempts)
   - Monitor 500 rate (system health issue)

3. **Monitor Hierarchy Depth**
   - Track maximum `children_count` values
   - Alert if unusually high (could indicate pagination need)
   - Could indicate data modeling issues

## 9. Implementation Steps

### Step 1: Implement Service Layer Function

**File:** `src/lib/services/topic.service.ts`

**Action:** Add the following function after the `deleteTopic` function:

```typescript
/**
 * Retrieves all direct children of a parent topic
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param parentId - Parent topic UUID
 * @returns Promise resolving to array of child topics with children_count
 * @throws TopicServiceError with 404 if parent not found, 500 for database errors
 *
 * Business Logic:
 * 1. Verify parent topic exists and belongs to user
 * 2. Query all children with parent_id filter
 * 3. Include children_count for each child (nested hierarchy support)
 * 4. Transform and return as TopicListItemDTO[]
 *
 * Error Scenarios:
 * - 404 Not Found: Parent topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function getTopicChildren(
  supabase: SupabaseClient,
  userId: string,
  parentId: string
): Promise<TopicListItemDTO[]> {
  try {
    // Step 1: Verify parent topic exists and belongs to user
    await validateParentTopic(supabase, userId, parentId);

    // Step 2: Query children topics with children_count subquery
    const { data: children, error } = await supabase
      .from("topics")
      .select(
        `
        id,
        user_id,
        parent_id,
        title,
        description,
        status,
        technology,
        leetcode_links,
        created_at,
        updated_at,
        children:topics!parent_id(count)
      `
      )
      .eq("parent_id", parentId)
      .eq("user_id", userId) // Redundant with RLS, but explicit for clarity
      .order("created_at", { ascending: false });

    // Step 3: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to fetch topic children", {
        userId,
        parentId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch topic children",
        },
      });
    }

    // Step 4: Handle unexpected null result
    if (!children) {
      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch topic children",
        },
      });
    }

    // Step 5: Transform to TopicListItemDTO[]
    // Note: Empty array is valid (parent has no children)
    return children.map((child) => ({
      id: child.id,
      user_id: child.user_id,
      parent_id: child.parent_id,
      title: child.title,
      description: child.description,
      status: child.status,
      technology: child.technology,
      leetcode_links: (child.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: child.created_at,
      updated_at: child.updated_at,
      children_count: child.children?.[0]?.count || 0,
    }));
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in getTopicChildren", {
      userId,
      parentId,
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

### Step 2: Create API Route Handler

**File:** `src/pages/api/topics/[id]/children.ts` (new file)

**Action:** Create the following API route:

```typescript
import type { APIRoute } from "astro";
import { TopicIdParamSchema } from "@/lib/validators/topic.validators";
import { getTopicChildren, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/topics/:id/children
 *
 * Retrieves all direct children of a parent topic
 * Requires authentication via JWT token in Authorization header
 *
 * Path Parameters:
 * - id: Parent topic UUID
 *
 * Response (200 OK):
 * {
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "user_id": "uuid",
 *       "parent_id": "parent_uuid",
 *       "title": "Child Topic",
 *       "description": "Description",
 *       "status": "to_do",
 *       "technology": "React",
 *       "leetcode_links": [...],
 *       "created_at": "...",
 *       "updated_at": "...",
 *       "children_count": 0
 *     }
 *   ]
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid parent topic ID format
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Parent topic not found or unauthorized
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
    const pathValidation = TopicIdParamSchema.safeParse(params);

    if (!pathValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid topic ID format",
          details: pathValidation.error.issues.map((issue) => ({
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

    const { id: parentId } = pathValidation.data;

    // Step 4: Fetch children via service
    const children = await getTopicChildren(supabase, userId, parentId);

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        data: children,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle service errors
    if (error instanceof TopicServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in GET /api/topics/:id/children", {
      userId,
      parentId: params.id,
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

### Step 3: Test the Implementation

**Manual Testing Checklist:**

1. **Success Case - Parent With Children**

   ```bash
   curl -X GET http://localhost:3000/api/topics/{parent-uuid}/children \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 200 OK with array of child topics

2. **Success Case - Parent With No Children**

   ```bash
   curl -X GET http://localhost:3000/api/topics/{leaf-topic-uuid}/children \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 200 OK with empty array `{ "data": [] }`

3. **Error Case - Invalid UUID**

   ```bash
   curl -X GET http://localhost:3000/api/topics/not-a-uuid/children \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 400 Bad Request with validation error

4. **Error Case - Missing Authentication**

   ```bash
   curl -X GET http://localhost:3000/api/topics/{valid-uuid}/children
   ```

   Expected: 401 Unauthorized

5. **Error Case - Parent Not Found**

   ```bash
   curl -X GET http://localhost:3000/api/topics/00000000-0000-0000-0000-000000000000/children \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 404 Not Found

6. **Error Case - Fetch Another User's Topic Children**

   ```bash
   curl -X GET http://localhost:3000/api/topics/{other-user-topic-uuid}/children \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 404 Not Found (not 403, for security)

7. **Verify Nested Hierarchy**
   ```bash
   # Create parent → child → grandchild
   # Fetch children of parent (should show child with children_count=1)
   # Fetch children of child (should show grandchild with children_count=0)
   ```

### Step 4: Verify Database State

After successful queries, verify in Supabase dashboard:

1. **Check Query Performance**
   - Review query execution time in Supabase logs
   - Verify index usage (should use `idx_topics_parent_id`)
   - Confirm <50ms query time for typical cases

2. **Check RLS Isolation**
   - Verify users only see their own topics' children
   - Test with two different user accounts
   - Confirm RLS policies work correctly

3. **Check Children Count Accuracy**
   - Verify `children_count` matches actual number of children
   - Test with nested hierarchies (parent → child → grandchild)
   - Confirm subquery returns correct counts

### Step 5: Run Linter and Fix Issues

```bash
npm run lint
```

If there are any linting issues, fix them:

```bash
npm run lint:fix
```

### Step 6: Update Documentation

**File:** `.ai/api-plan.md`

Update existing "Get Topic Children" section with implementation details:

````markdown
#### Get Topic Children

**Endpoint:** `GET /api/topics/:id/children`  
**Authentication:** Required  
**Description:** Retrieve all direct children of a parent topic

**Path Parameters:**

- `id`: Parent topic UUID (validated as UUID format)

**Response:** 200 OK with array of child topics

**Key Features:**

- Returns direct children only (not entire subtree)
- Includes `children_count` for nested navigation
- Parent ownership verification
- Returns empty array if parent has no children (not an error)
- Security-focused error responses (404 for unauthorized)

**Example:**

```bash
curl -X GET http://localhost:3000/api/topics/{parent-uuid}/children \
  -H "Authorization: Bearer {token}"
```
````

**Notes:**

- No pagination (returns all children)
- Ordered by creation date (newest first)
- Typical response time: 20-60ms for <10 children

```

```

**File:** `README.md`

Add to "Completed features" section:

```markdown
✅ **API - Get Topic Children**: GET `/api/topics/:id/children` to retrieve child topics

- Fetch all direct children of a parent topic
- Parent ownership verification
- Includes children_count for nested hierarchy navigation
- Returns empty array if parent has no children
- Fast indexed query (<50ms typical)
```

### Step 7: Commit Changes

```bash
git add src/lib/services/topic.service.ts
git add src/pages/api/topics/[id]/children.ts
git add .ai/api-plan.md
git add README.md
git commit -m "feat: implement GET /api/topics/:id/children endpoint

- Add getTopicChildren service function with parent validation
- Create GET /api/topics/[id]/children.ts API route
- Return array of child topics with children_count
- Parent ownership verification (404 for unauthorized)
- Support for nested hierarchy navigation
- Fast indexed query on parent_id
- Update API documentation and README"
```

## 10. Post-Implementation Checklist

- [ ] Service function implemented with proper error handling
- [ ] API route handler created with GET method
- [ ] All imports updated correctly
- [ ] Manual tests passed for success cases
- [ ] Manual tests passed for error cases
- [ ] Empty result case tested (parent with no children)
- [ ] Nested hierarchy tested (children_count accuracy)
- [ ] RLS isolation verified
- [ ] Query performance verified (<50ms)
- [ ] Linter passes without errors
- [ ] Documentation updated
- [ ] Changes committed to version control

## 11. Future Enhancements

1. **Pagination Support**
   - Add query parameters: `page`, `limit`
   - Useful if topics commonly have >50 children
   - Return pagination metadata (total, pages)

2. **Sorting Options**
   - Add `sort` parameter (created_at, updated_at, title, status)
   - Add `order` parameter (asc, desc)
   - Enable custom ordering of child topics

3. **Filtering by Status**
   - Add `status` query parameter
   - Filter children by to_do, in_progress, completed
   - Useful for dashboard widgets

4. **Recursive Children Endpoint**
   - New endpoint: `GET /api/topics/:id/descendants`
   - Return entire subtree (not just direct children)
   - Include depth information for each descendant

5. **Children Summary**
   - Add endpoint: `GET /api/topics/:id/children/summary`
   - Return counts by status (to_do, in_progress, completed)
   - Useful for progress tracking

6. **Breadcrumb Support**
   - Add `include_ancestors` query parameter
   - Return parent chain for breadcrumb navigation
   - Enable "You are here" UI patterns

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Author:** AI Software Architect  
**Status:** Ready for Implementation
