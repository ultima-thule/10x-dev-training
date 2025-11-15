# API Endpoint Implementation Plan: Delete Topic

## 1. Endpoint Overview

The DELETE `/api/topics/:id` endpoint allows authenticated users to permanently delete a topic and all its children from their learning path. This endpoint leverages database-level cascading deletes to automatically remove the entire subtree when a parent topic is deleted. The operation is idempotent and returns no content upon success.

**Key Features:**

- Delete single topic or entire subtree (automatic cascading)
- User ownership verification (only delete own topics)
- Row Level Security (RLS) enforcement
- No response body (204 No Content)
- Database-level cascade handling (no manual traversal needed)
- Idempotent operation (safe to retry)

## 2. Request Details

### HTTP Method

`DELETE`

### URL Structure

```
/api/topics/:id
```

### Headers

```
Authorization: Bearer {access_token}
```

### Path Parameters

| Parameter | Type   | Required | Validation        | Description                              |
| --------- | ------ | -------- | ----------------- | ---------------------------------------- |
| `id`      | string | Yes      | Valid UUID format | Unique identifier of the topic to delete |

### Request Body

None. DELETE operations do not require a request body.

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/topics/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer {access_token}"
```

## 3. Used Types

### DTOs and Command Models

**From Existing Code**:

- `TopicIdParamSchema` - Validates UUID path parameter (already exists in `topic-id.validator.ts`)
- `ErrorResponseDTO` - Standardized error response structure (already exists in `types.ts`)
- `TopicServiceError` - Service-level error class (already exists in `topic.service.ts`)

**No New Types Required**:

- DELETE operations don't require command models
- No response body needed (204 No Content)

### Validators

**Existing Schema (Reuse)**:

- `TopicIdParamSchema` - Already validates UUID path parameter

**No New Schemas Required**

## 4. Response Details

### Success Response (204 No Content)

Returns an empty response with 204 status code. No response body is included.

```
HTTP/1.1 204 No Content
```

**Notes**:

- 204 No Content is the standard response for successful DELETE operations
- No JSON body is returned
- Client can check status code to confirm deletion
- Operation is idempotent (deleting already-deleted resource returns 404, not 204)

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

#### 404 Not Found - Topic Not Found

Returned when:

- Topic doesn't exist
- Topic belongs to another user (don't expose this distinction for security)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Topic not found"
  }
}
```

**Security Note**: We return 404 (not 403) for unauthorized access to avoid leaking information about whether topics exist for other users. This matches the security pattern used in UPDATE and CREATE endpoints.

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to delete topic"
  }
}
```

## 5. Data Flow

### Request Processing Pipeline

```
1. HTTP DELETE Request → Astro API Route Handler
   ↓
2. Extract Supabase Client from middleware (locals.supabase)
   ↓
3. Authenticate User (supabase.auth.getUser())
   ↓ (userId extracted)
4. Validate Path Parameter (TopicIdParamSchema)
   ↓ (topicId validated)
5. Call Service Layer (deleteTopic(supabase, userId, topicId))
   ↓
6. Service: Verify topic exists and belongs to user
   ↓
7. Service: Execute delete query (database cascades to children)
   ↓
8. Return 204 No Content
```

### Service Layer Logic (`deleteTopic` function)

**Location:** `src/lib/services/topic.service.ts`

**Function Signature:**

```typescript
export async function deleteTopic(supabase: SupabaseClient, userId: string, topicId: string): Promise<void>;
```

**Processing Steps:**

1. **Execute Delete Query**

   ```typescript
   const { error, count } = await supabase
     .from("topics")
     .delete({ count: "exact" })
     .eq("id", topicId)
     .eq("user_id", userId);
   ```

2. **Handle Query Results**
   - If error: Log and throw TopicServiceError(500, INTERNAL_ERROR)
   - If count === 0: Throw TopicServiceError(404, NOT_FOUND)
   - If count === 1: Success, return void

3. **No Response Transformation**
   - DELETE operations don't return data
   - Function returns void (Promise<void>)

### Database Interaction

**Table:** `topics`

**Delete Operation:**

```sql
DELETE FROM topics
WHERE id = $1
  AND user_id = $2;
```

**Cascading Behavior:**

The database schema has `ON DELETE CASCADE` configured:

```sql
CREATE TABLE topics (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  ...
);
```

When a topic is deleted:

1. Database automatically deletes all child topics
2. Child deletion triggers cascade to grandchildren
3. Process continues recursively until entire subtree is removed
4. No application-level traversal needed

**Benefits of Database Cascading**:

- Atomic operation (all or nothing)
- Efficient (single DELETE statement)
- No race conditions
- Database-enforced referential integrity

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

**Mechanism:** User Ownership Verification

**Implementation:**

1. Include `user_id` filter in delete query
2. Query returns count=0 if topic belongs to another user
3. Return 404 (not 403) to avoid leaking topic existence
4. RLS policies enforce additional database-level security

**Security Benefits:**

- Users can only delete their own topics
- Cannot delete other users' topics
- Doesn't expose whether topics exist for other users
- Database-level enforcement via RLS

### Input Validation

**UUID Validation:**

- Prevents SQL injection via malformed IDs
- Protects against database errors from invalid UUIDs
- Returns clear 400 error for invalid format

**No Request Body Validation:**

- DELETE operations don't have request bodies
- Only path parameter needs validation

### Cascade Safety

**Database-Level Safety:**

- Cascading deletes only affect topics owned by the same user
- Parent-child relationships are within user's data
- No cross-user cascade possible due to RLS

**Verification:**

- User can only create topics for themselves (enforced by CREATE)
- All children inherit user_id from parent
- RLS ensures user sees only their own data

### Row Level Security (RLS)

**Database Policies (already configured):**

```sql
-- Delete policy: Users can only delete their own topics
CREATE POLICY "Users can delete own topics"
ON topics FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Benefits:**

- Defense-in-depth security layer
- Enforced at database level
- Works even if application code has bugs
- Automatic user isolation

## 7. Error Handling

### Error Handling Strategy

1. **Validation Errors (400)** - Caught early at path parameter validation, returned with field-level messages
2. **Authentication Errors (401)** - Handled at API route level before service calls
3. **Not Found Errors (404)** - Returned from service when topic doesn't exist or unauthorized
4. **Internal Errors (500)** - Logged with full context, returned with generic message

### Error Scenarios and Responses

| Scenario                      | Detection Point                  | Status | Error Code           | Response Message                        |
| ----------------------------- | -------------------------------- | ------ | -------------------- | --------------------------------------- |
| Invalid UUID format           | Path parameter validation        | 400    | VALIDATION_ERROR     | Topic ID must be a valid UUID           |
| Missing auth token            | Authentication check             | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token |
| Expired/invalid token         | Authentication check             | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token |
| Topic doesn't exist           | Service layer (delete count = 0) | 404    | NOT_FOUND            | Topic not found                         |
| Topic belongs to another user | Service layer (delete count = 0) | 404    | NOT_FOUND            | Topic not found                         |
| Database connection error     | Service layer (delete error)     | 500    | INTERNAL_ERROR       | Failed to delete topic                  |
| Unexpected exception          | Try-catch in API route           | 500    | INTERNAL_ERROR       | An unexpected error occurred            |

### Error Logging Pattern

**Service Layer Logging:**

```typescript
console.error("[TopicService] Failed to delete topic", {
  userId,
  topicId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

**API Layer Logging:**

```typescript
console.error("[API] Unexpected error in DELETE /api/topics/:id", {
  userId,
  topicId: params.id,
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
    message: "Topic not found",
  },
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Large Subtree Deletion**
   - Deleting a topic with many children could be slow
   - Database handles cascade automatically
   - Impact: ~10-100ms per topic in subtree
   - Typical: Most topics have <10 children

2. **Database Delete Operation**
   - Single DELETE with count to verify deletion
   - Impact: ~10-50ms per request
   - Cascading happens automatically in same transaction

3. **Authentication Token Verification**
   - JWT verification on every request
   - Cached by Supabase client
   - Impact: ~5-20ms

### Optimization Strategies

1. **Database-Level Cascading**
   - Leverage existing `ON DELETE CASCADE`
   - No application-level traversal needed
   - Single transaction ensures atomicity
   - Database optimizes cascade internally

2. **Early Validation**
   - Validate UUID format before database operations
   - Fail fast on invalid data
   - Saves database round trip for invalid requests

3. **Count Verification**
   - Use `{ count: 'exact' }` to verify deletion
   - Single query returns both result and count
   - Avoids separate SELECT to verify existence

4. **Index Optimization**
   - Database has indexes on:
     - `id` (primary key)
     - `user_id` (for RLS)
     - `parent_id` (for cascade)
   - Delete operation remains fast even with large datasets

### Expected Performance

**Typical Request (Leaf Topic, No Children):**

- Validation: <5ms
- Authentication: 5-20ms
- Database delete: 10-50ms
- **Total: 20-80ms**

**Request With Children (Small Subtree, <10 children):**

- Validation: <5ms
- Authentication: 5-20ms
- Database delete with cascade: 20-100ms
- **Total: 30-130ms**

**Request With Large Subtree (100+ children):**

- Validation: <5ms
- Authentication: 5-20ms
- Database delete with cascade: 100-500ms
- **Total: 110-530ms**

**Load Capacity:**

- Single instance: 50-100 concurrent deletes/sec (leaf topics)
- With cascading: 10-20 concurrent deletes/sec (average subtree)
- Bottleneck: Database write capacity
- Scaling: Vertical (larger database) recommended for write-heavy workloads

### Monitoring Recommendations

1. **Log Slow Deletions**
   - Log if database operation takes >200ms
   - Track subtree size for slow deletions
   - Investigate if many large subtrees

2. **Track Error Rates**
   - Monitor 404 rate (potential UX issue or unauthorized attempts)
   - Monitor 500 rate (system health issue)

3. **Monitor Cascade Depth**
   - Track maximum subtree depth deleted
   - Alert if unusually deep hierarchies
   - Could indicate data modeling issues

## 9. Implementation Steps

### Step 1: Implement Service Layer Function

**File:** `src/lib/services/topic.service.ts`

**Action:** Add the following function after the `createTopic` function:

```typescript
/**
 * Deletes a topic and all its children (cascading delete)
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param topicId - Topic UUID to delete
 * @returns Promise resolving to void (no data returned)
 * @throws TopicServiceError with 404 if not found, 500 for database errors
 *
 * Business Logic:
 * 1. Execute delete query with user_id filter for authorization
 * 2. Use count to verify deletion occurred
 * 3. Return 404 if topic not found or unauthorized (don't distinguish)
 * 4. Database automatically cascades delete to children via ON DELETE CASCADE
 *
 * Error Scenarios:
 * - 404 Not Found: Topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function deleteTopic(supabase: SupabaseClient, userId: string, topicId: string): Promise<void> {
  try {
    // Step 1: Execute delete query with count to verify deletion
    const { error, count } = await supabase
      .from("topics")
      .delete({ count: "exact" })
      .eq("id", topicId)
      .eq("user_id", userId); // Authorization: only delete own topics

    // Step 2: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to delete topic", {
        userId,
        topicId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete topic",
        },
      });
    }

    // Step 3: Handle not found (topic doesn't exist or belongs to another user)
    if (count === 0) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Topic not found",
        },
      });
    }

    // Step 4: Success - return void (no data to return)
    // Note: Database automatically cascaded delete to all children
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in deleteTopic", {
      userId,
      topicId,
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

### Step 2: Add DELETE Handler to Existing API Route

**File:** `src/pages/api/topics/[id].ts`

**Action:** Add the DELETE handler to the existing file (after PATCH handler):

```typescript
/**
 * DELETE /api/topics/:id
 *
 * Deletes a topic and all its children (cascading delete)
 * Requires authentication via JWT token in Authorization header
 *
 * Path Parameters:
 * - id: Topic UUID
 *
 * Response (204 No Content):
 * Empty response body
 *
 * Error Responses:
 * - 400 Bad Request: Invalid topic ID format
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Topic not found or unauthorized
 * - 500 Internal Server Error: Database error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const { id: topicId } = pathValidation.data;

    // Step 4: Delete topic via service
    await deleteTopic(supabase, userId, topicId);

    // Step 5: Return success response (204 No Content)
    return new Response(null, {
      status: 204,
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
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in DELETE /api/topics/:id", {
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

**Important:** Also update the imports at the top of the file:

```typescript
import type { APIRoute } from "astro";
import { TopicIdParamSchema, UpdateTopicCommandSchema } from "@/lib/validators/topic.validators";
import { getTopicById, updateTopic, deleteTopic, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";
```

### Step 3: Test the Implementation

**Manual Testing Checklist:**

1. **Success Case - Delete Leaf Topic**

   ```bash
   curl -X DELETE http://localhost:3000/api/topics/{valid-leaf-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -v
   ```

   Expected: 204 No Content (empty response)

2. **Success Case - Delete Topic With Children**

   ```bash
   # First, create a parent and child
   # Then delete the parent
   curl -X DELETE http://localhost:3000/api/topics/{parent-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -v
   ```

   Expected: 204 No Content, verify children are also deleted

3. **Error Case - Invalid UUID**

   ```bash
   curl -X DELETE http://localhost:3000/api/topics/not-a-uuid \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 400 Bad Request with validation error

4. **Error Case - Missing Authentication**

   ```bash
   curl -X DELETE http://localhost:3000/api/topics/{valid-uuid}
   ```

   Expected: 401 Unauthorized

5. **Error Case - Topic Not Found**

   ```bash
   curl -X DELETE http://localhost:3000/api/topics/00000000-0000-0000-0000-000000000000 \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 404 Not Found

6. **Error Case - Delete Another User's Topic**

   ```bash
   curl -X DELETE http://localhost:3000/api/topics/{other-user-topic-uuid} \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: 404 Not Found (not 403, for security)

7. **Idempotency Test - Delete Same Topic Twice**

   ```bash
   # First delete
   curl -X DELETE http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}"
   # Second delete (should fail)
   curl -X DELETE http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}"
   ```

   Expected: First returns 204, second returns 404

### Step 4: Verify Database State

After successful deletion, verify in Supabase dashboard:

1. **Check Topic Deleted**
   - Verify topic no longer exists in database
   - Search by UUID should return no results

2. **Check Children Deleted**
   - If topic had children, verify they're also deleted
   - Check by parent_id (should return no results)
   - Verify entire subtree removed

3. **Check Other Users' Topics**
   - Verify other users' topics unaffected
   - RLS isolation working correctly

4. **Check Cascade Behavior**
   - Create test hierarchy (parent → child → grandchild)
   - Delete parent
   - Verify all descendants deleted automatically

### Step 5: Run Linter and Fix Issues

```bash
npm run lint
```

If there are any linting issues, fix them:

```bash
npm run lint:fix
```

### Step 6: Update Documentation

**File:** `README.md` or `.ai/api-plan.md`

Update API documentation:

```markdown
### Delete Topic

**Endpoint:** `DELETE /api/topics/:id`
**Authentication:** Required
**Description:** Delete a topic and all its children (cascading delete)

**Response:** 204 No Content (empty response)

**Notes:**

- Cascading delete handled at database level
- All children automatically deleted
- Idempotent operation
- Returns 404 if topic not found or unauthorized
```

### Step 7: Commit Changes

```bash
git add src/lib/services/topic.service.ts
git add src/pages/api/topics/[id].ts
git commit -m "feat: implement DELETE /api/topics/:id endpoint with cascading delete"
```

## 10. Post-Implementation Checklist

- [ ] Service function implemented with proper error handling
- [ ] API route handler added with DELETE method
- [ ] All imports updated correctly
- [ ] Manual tests passed for success cases
- [ ] Manual tests passed for error cases
- [ ] Database state verified after deletion
- [ ] Cascading delete behavior tested
- [ ] Idempotency tested
- [ ] Linter passes without errors
- [ ] Documentation updated
- [ ] Changes committed to version control

## 11. Future Enhancements

1. **Soft Delete**
   - Add `deleted_at` timestamp column
   - Mark topics as deleted instead of removing
   - Enable "undo" functionality
   - Periodic cleanup of old deleted topics

2. **Delete Confirmation**
   - Add query parameter `?confirm=true`
   - Require explicit confirmation for topics with children
   - Return subtree size in error message if not confirmed

3. **Bulk Delete**
   - Create separate endpoint for deleting multiple topics
   - `DELETE /api/topics` with array of IDs in body
   - Optimize with batch delete

4. **Audit Trail**
   - Log deletions to audit table
   - Track who deleted what and when
   - Enable recovery from audit log

5. **Archive Instead of Delete**
   - Add `archived` boolean flag
   - Move topics to archive instead of deleting
   - Separate endpoint to permanently delete archived topics

6. **Deletion Metrics**
   - Track deletion patterns
   - Alert on mass deletions
   - Analytics on what types of topics get deleted

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Author:** AI Software Architect  
**Status:** Ready for Implementation
