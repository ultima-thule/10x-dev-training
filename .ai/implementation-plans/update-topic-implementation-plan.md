# API Endpoint Implementation Plan: Update Topic

## 1. Endpoint Overview

The PATCH `/api/topics/:id` endpoint allows authenticated users to partially update an existing topic. This endpoint supports updating individual fields without requiring the entire topic object, following REST best practices for partial updates. All request body fields are optional, enabling granular updates to specific attributes like title, status, or LeetCode links.

**Key Features:**

- Partial updates (all fields optional)
- User ownership verification (only update own topics)
- Row Level Security (RLS) enforcement
- Input validation with detailed error messages
- Automatic `updated_at` timestamp management

## 2. Request Details

### HTTP Method

`PATCH`

### URL Structure

```
/api/topics/:id
```

### Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Path Parameters

| Parameter | Type   | Required | Validation        | Description                              |
| --------- | ------ | -------- | ----------------- | ---------------------------------------- |
| `id`      | string | Yes      | Valid UUID format | Unique identifier of the topic to update |

### Request Body

All fields are optional to support partial updates. At least one field must be provided.

```typescript
{
  title?: string;              // 1-200 characters
  description?: string | null; // Max 1000 characters, null to clear
  status?: 'to_do' | 'in_progress' | 'completed';
  technology?: string;         // 1-100 characters, alphanumeric + .-_
  leetcode_links?: Array<{     // Max 5 links
    title: string;
    url: string;               // Valid URL format
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}
```

**Example Request:**

```json
{
  "status": "completed",
  "description": "Mastered React hooks including useState, useEffect, and custom hooks"
}
```

## 3. Used Types

### DTOs and Command Models (from `src/types.ts`)

**Request:**

- `UpdateTopicCommand` - Command model for update request body

**Response:**

- `TopicDTO` - Complete topic object returned after successful update
- `LeetCodeLink` - Structure for LeetCode problem references

**Error Handling:**

- `ErrorResponseDTO` - Standardized error response structure
- `ValidationErrorDetail` - Field-level validation error details

### Validators (to be created in `src/lib/validators/topic.validators.ts`)

**New Schema Required:**

- `UpdateTopicCommandSchema` - Zod schema validating request body with:
  - Optional `title` (string, 1-200 chars)
  - Optional `description` (string/null, max 1000 chars)
  - Optional `status` (enum: to_do, in_progress, completed)
  - Optional `technology` (string, 1-100 chars, regex pattern)
  - Optional `leetcode_links` (array, max 5 items, validated structure)
  - Refinement: at least one field must be provided

**Existing Schemas:**

- `TopicIdParamSchema` - Validates UUID path parameter (already exists)

## 4. Response Details

### Success Response (200 OK)

Returns the complete updated topic object with all fields, including unchanged fields.

```typescript
{
  id: string;              // UUID
  user_id: string;         // UUID
  parent_id: string | null; // UUID or null
  title: string;
  description: string | null;
  status: 'to_do' | 'in_progress' | 'completed';
  technology: string;
  leetcode_links: LeetCodeLink[];
  created_at: string;      // ISO 8601 timestamp (unchanged)
  updated_at: string;      // ISO 8601 timestamp (automatically updated)
}
```

**Example Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987fcdeb-51a2-43d7-8c9f-123456789abc",
  "parent_id": null,
  "title": "React Hooks",
  "description": "Mastered React hooks including useState, useEffect, and custom hooks",
  "status": "completed",
  "technology": "React",
  "leetcode_links": [],
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**Scenario 1: Invalid UUID Format**

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

**Scenario 2: Invalid Request Body**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "title",
        "message": "Title must not exceed 200 characters"
      },
      {
        "field": "status",
        "message": "Status must be one of: to_do, in_progress, completed"
      }
    ]
  }
}
```

**Scenario 3: No Fields Provided**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one field must be provided for update",
    "details": []
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

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to update topic"
  }
}
```

## 5. Data Flow

### Request Processing Pipeline

```
1. HTTP PATCH Request → Astro API Route Handler
   ↓
2. Extract Supabase Client from middleware (locals.supabase)
   ↓
3. Authenticate User (supabase.auth.getUser())
   ↓ (userId extracted)
4. Validate Path Parameter (TopicIdParamSchema)
   ↓ (topicId validated)
5. Validate Request Body (UpdateTopicCommandSchema)
   ↓ (updateCommand validated)
6. Call Service Layer (updateTopic(supabase, userId, topicId, updateCommand))
   ↓
7. Service: Verify topic exists and belongs to user
   ↓
8. Service: Update topic in database
   ↓
9. Service: Transform database result to TopicDTO
   ↓
10. Return 200 OK with TopicDTO
```

### Service Layer Logic (`updateTopic` function)

**Location:** `src/lib/services/topic.service.ts`

**Function Signature:**

```typescript
export async function updateTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  command: UpdateTopicCommand
): Promise<TopicDTO>;
```

**Processing Steps:**

1. **Prepare Update Data**
   - Build update object from command (only include provided fields)
   - Transform leetcode_links to Json type for database
   - Ensure `updated_at` is handled by database trigger

2. **Execute Update Query**

   ```typescript
   const { data, error } = await supabase
     .from("topics")
     .update(updateData)
     .eq("id", topicId)
     .eq("user_id", userId) // Ownership verification
     .select()
     .single();
   ```

3. **Handle Query Results**
   - If error: Log and throw TopicServiceError(500, INTERNAL_ERROR)
   - If data is null: Throw TopicServiceError(404, NOT_FOUND)
   - If successful: Transform to TopicDTO and return

4. **Transform Response**
   - Cast `leetcode_links` from Json to LeetCodeLink[]
   - Ensure all timestamps are ISO 8601 strings
   - Return complete TopicDTO

### Database Interaction

**Table:** `topics`

**Update Operation:**

```sql
UPDATE topics
SET
  title = COALESCE($1, title),
  description = COALESCE($2, description),
  status = COALESCE($3, status),
  technology = COALESCE($4, technology),
  leetcode_links = COALESCE($5, leetcode_links),
  updated_at = timezone('utc', now())
WHERE id = $6
  AND user_id = $7
RETURNING *;
```

**Notes:**

- Only provided fields are updated (COALESCE pattern)
- `updated_at` automatically updated by database
- `user_id` filter ensures ownership
- RLS policies provide additional security layer

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

1. Include `user_id` filter in update query
2. Query returns no results if topic belongs to another user
3. Return 404 (not 403) to avoid leaking topic existence
4. RLS policies enforce additional database-level security

**Security Benefits:**

- Prevents unauthorized topic updates
- Doesn't expose whether topic exists for other users
- Database-level enforcement via RLS

### Input Validation

**UUID Validation:**

- Prevents SQL injection via malformed IDs
- Protects against database errors from invalid UUIDs
- Returns clear 400 error for invalid format

**Request Body Validation:**

- String length limits prevent DOS attacks
- Enum validation prevents invalid states
- URL validation prevents XSS via malicious links
- Array size limits prevent resource exhaustion

**Mass Assignment Protection:**

- Only accept fields defined in UpdateTopicCommand
- Zod schema ignores unknown fields
- Prevents updating protected fields (id, user_id, created_at)

### Data Sanitization

**Automatic Protections:**

- Supabase client uses parameterized queries (prevents SQL injection)
- JSON serialization escapes special characters
- Database JSONB type validates structure

**Manual Validations:**

- LeetCode URLs validated as proper URLs
- Difficulty enum strictly validated
- Technology regex pattern prevents injection

### Row Level Security (RLS)

**Database Policies (already configured):**

```sql
-- Update policy: Users can only update their own topics
CREATE POLICY "Users can update own topics"
ON topics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

**Benefits:**

- Defense-in-depth security layer
- Enforced at database level
- Works even if application code has bugs

## 7. Error Handling

### Error Handling Strategy

1. **Validation Errors (400)** - Caught early, returned with detailed field-level messages
2. **Authentication Errors (401)** - Handled at API route level before service calls
3. **Not Found Errors (404)** - Returned from service when topic doesn't exist/unauthorized
4. **Internal Errors (500)** - Logged with full context, returned with generic message

### Error Scenarios and Responses

| Scenario                      | Detection Point                     | Status | Error Code           | Response Message                                        |
| ----------------------------- | ----------------------------------- | ------ | -------------------- | ------------------------------------------------------- |
| Invalid UUID format           | Path parameter validation           | 400    | VALIDATION_ERROR     | Topic ID must be a valid UUID                           |
| Empty request body            | Request body validation             | 400    | VALIDATION_ERROR     | At least one field must be provided for update          |
| Title too long (>200 chars)   | Request body validation             | 400    | VALIDATION_ERROR     | Title must not exceed 200 characters                    |
| Invalid status enum           | Request body validation             | 400    | VALIDATION_ERROR     | Status must be one of: to_do, in_progress, completed    |
| Invalid technology format     | Request body validation             | 400    | VALIDATION_ERROR     | Technology must contain only alphanumeric characters... |
| Too many LeetCode links (>5)  | Request body validation             | 400    | VALIDATION_ERROR     | Maximum 5 LeetCode links per topic                      |
| Invalid LeetCode URL          | Request body validation             | 400    | VALIDATION_ERROR     | LeetCode URL must be valid                              |
| Missing auth token            | Authentication check                | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token                 |
| Expired/invalid token         | Authentication check                | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token                 |
| Topic doesn't exist           | Service layer (update returns null) | 404    | NOT_FOUND            | Topic not found                                         |
| Topic belongs to another user | Service layer (update returns null) | 404    | NOT_FOUND            | Topic not found                                         |
| Database connection error     | Service layer (database error)      | 500    | INTERNAL_ERROR       | Failed to update topic                                  |
| Unexpected exception          | Try-catch in API route              | 500    | INTERNAL_ERROR       | An unexpected error occurred                            |

### Error Logging Pattern

**Service Layer Logging:**

```typescript
console.error("[TopicService] Failed to update topic", {
  userId,
  topicId,
  updateFields: Object.keys(command),
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

**API Layer Logging:**

```typescript
console.error("[API] Unexpected error in PATCH /api/topics/:id", {
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

1. **Database Round Trips**
   - Single update query with `.select()` returns updated data
   - No separate SELECT after UPDATE needed
   - Minimal impact: ~10-50ms per request

2. **JSON Transformation**
   - Converting leetcode_links between Json and LeetCodeLink[]
   - Minimal overhead for small arrays (max 5 items)
   - Impact: <1ms

3. **Authentication Token Verification**
   - JWT verification on every request
   - Cached by Supabase client
   - Impact: ~5-20ms

### Optimization Strategies

1. **Single Database Query**
   - Use `.update().select()` chain to return updated data
   - Avoids separate SELECT query
   - Reduces latency by 50%

2. **Early Validation**
   - Validate inputs before database operations
   - Fail fast on invalid data
   - Saves database round trip for invalid requests

3. **Conditional Updates**
   - Only include provided fields in update
   - Reduces update payload size
   - Slightly faster for partial updates

4. **Index Optimization**
   - Ensure indexes on `(id, user_id)` exist
   - Database query plan should use index scan
   - Update operation remains fast even with large datasets

### Expected Performance

**Typical Request:**

- Validation: <5ms
- Authentication: 5-20ms
- Database update: 10-50ms
- JSON transformation: <1ms
- **Total: 20-80ms**

**Load Capacity:**

- Single instance: 50-100 concurrent updates/sec
- Bottleneck: Database write capacity
- Scaling: Vertical (larger database) or horizontal (read replicas for read-heavy operations)

### Monitoring Recommendations

1. **Log Slow Queries**
   - Log if database operation takes >100ms
   - Investigate and optimize if common

2. **Track Error Rates**
   - Monitor 404 rate (potential UX issue)
   - Monitor 500 rate (system health issue)

3. **Monitor Authentication Failures**
   - High 401 rate may indicate token expiry issues
   - Could indicate security probing

## 9. Implementation Steps

### Step 1: Create Update Validation Schema

**File:** `src/lib/validators/topic.validators.ts`

**Action:** Add the following schema to the end of the file:

```typescript
/**
 * Validation schema for LeetCode link structure
 * Used in topic updates to validate individual link objects
 */
const LeetCodeLinkSchema = z.object({
  title: z.string().min(1, { message: "LeetCode link title is required" }),
  url: z.string().url({ message: "LeetCode URL must be valid" }),
  difficulty: z.enum(["Easy", "Medium", "Hard"], {
    errorMap: () => ({
      message: "Difficulty must be one of: Easy, Medium, Hard",
    }),
  }),
});

/**
 * Validation schema for updating a topic
 *
 * All fields are optional to support partial updates.
 * At least one field must be provided.
 *
 * Validates:
 * - title: Optional string (1-200 chars)
 * - description: Optional string or null (max 1000 chars)
 * - status: Optional enum (to_do, in_progress, completed)
 * - technology: Optional string (1-100 chars, alphanumeric + .-_)
 * - leetcode_links: Optional array of validated link objects (max 5)
 */
export const UpdateTopicCommandSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: "Title must not be empty" })
      .max(200, { message: "Title must not exceed 200 characters" })
      .optional(),
    description: z.string().max(1000, { message: "Description must not exceed 1000 characters" }).nullable().optional(),
    status: z
      .enum(["to_do", "in_progress", "completed"], {
        errorMap: () => ({
          message: "Status must be one of: to_do, in_progress, completed",
        }),
      })
      .optional(),
    technology: z
      .string()
      .min(1, { message: "Technology must not be empty" })
      .max(100, { message: "Technology must not exceed 100 characters" })
      .regex(/^[a-zA-Z0-9\s.\-_]+$/, {
        message: "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores",
      })
      .optional(),
    leetcode_links: z.array(LeetCodeLinkSchema).max(5, { message: "Maximum 5 LeetCode links per topic" }).optional(),
  })
  .strict() // Reject unknown fields
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Type inference from UpdateTopicCommandSchema
 * Use this type for validated update command data
 */
export type UpdateTopicCommandInput = z.infer<typeof UpdateTopicCommandSchema>;
```

### Step 2: Implement Service Layer Function

**File:** `src/lib/services/topic.service.ts`

**Action:** Add the following function after the `getTopicById` function:

```typescript
/**
 * Updates an existing topic with partial data
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param topicId - Topic UUID to update
 * @param command - Update command with optional fields
 * @returns Promise resolving to updated topic
 * @throws TopicServiceError with 404 if not found, 500 for database errors
 *
 * Business Logic:
 * 1. Build update object with only provided fields
 * 2. Execute update query with user_id filter for authorization
 * 3. Return 404 if topic not found or unauthorized (don't distinguish)
 * 4. Transform and return updated topic
 *
 * Error Scenarios:
 * - 404 Not Found: Topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function updateTopic(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  command: UpdateTopicCommand
): Promise<TopicDTO> {
  try {
    // Step 1: Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (command.title !== undefined) {
      updateData.title = command.title;
    }
    if (command.description !== undefined) {
      updateData.description = command.description;
    }
    if (command.status !== undefined) {
      updateData.status = command.status;
    }
    if (command.technology !== undefined) {
      updateData.technology = command.technology;
    }
    if (command.leetcode_links !== undefined) {
      updateData.leetcode_links = command.leetcode_links as unknown as Json;
    }

    // Step 2: Execute update query with authorization check
    const { data: updatedTopic, error } = await supabase
      .from("topics")
      .update(updateData)
      .eq("id", topicId)
      .eq("user_id", userId) // Authorization: only update own topics
      .select()
      .maybeSingle();

    // Step 3: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to update topic", {
        userId,
        topicId,
        updateFields: Object.keys(updateData),
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update topic",
        },
      });
    }

    // Step 4: Handle not found (topic doesn't exist or belongs to another user)
    if (!updatedTopic) {
      throw new TopicServiceError(404, {
        error: {
          code: "NOT_FOUND",
          message: "Topic not found",
        },
      });
    }

    // Step 5: Transform to TopicDTO
    return {
      id: updatedTopic.id,
      user_id: updatedTopic.user_id,
      parent_id: updatedTopic.parent_id,
      title: updatedTopic.title,
      description: updatedTopic.description,
      status: updatedTopic.status,
      technology: updatedTopic.technology,
      leetcode_links: (updatedTopic.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: updatedTopic.created_at,
      updated_at: updatedTopic.updated_at,
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in updateTopic", {
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

**Important:** Also update the imports at the top of the file:

```typescript
import type {
  TopicListResponseDTO,
  TopicListItemDTO,
  ErrorResponseDTO,
  LeetCodeLink,
  GenerateTopicsResponseDTO,
  TopicDTO,
  UpdateTopicCommand, // Add this import
} from "@/types";
```

### Step 3: Implement API Route Handler

**File:** `src/pages/api/topics/[id].ts`

**Action:** Add the PATCH handler to the existing file (after the GET handler):

```typescript
/**
 * PATCH /api/topics/:id
 *
 * Updates an existing topic with partial data
 * Requires authentication via JWT token in Authorization header
 *
 * Path Parameters:
 * - id: Topic UUID
 *
 * Request Body (all fields optional, at least one required):
 * {
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "status": "completed",
 *   "technology": "React",
 *   "leetcode_links": [...]
 * }
 *
 * Response (200 OK):
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "parent_id": null,
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "status": "completed",
 *   "technology": "React",
 *   "leetcode_links": [...],
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid topic ID or request body
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Topic not found or unauthorized
 * - 500 Internal Server Error: Database error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Step 4: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
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

    const bodyValidation = UpdateTopicCommandSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: bodyValidation.error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          })),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateCommand = bodyValidation.data;

    // Step 5: Update topic via service
    const updatedTopic = await updateTopic(supabase, userId, topicId, updateCommand);

    // Step 6: Return success response
    return new Response(JSON.stringify(updatedTopic), {
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
    // eslint-disable-next-line no-console
    console.error("[API] Unexpected error in PATCH /api/topics/:id", {
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
import { getTopicById, updateTopic, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";
```

### Step 4: Test the Implementation

**Manual Testing Checklist:**

1. **Success Case - Update Single Field**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```

   Expected: 200 OK with full updated topic

2. **Success Case - Update Multiple Fields**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "New Title",
       "description": "New description",
       "status": "in_progress"
     }'
   ```

   Expected: 200 OK with all fields updated

3. **Success Case - Set Description to Null**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"description": null}'
   ```

   Expected: 200 OK with description cleared

4. **Error Case - Invalid UUID**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/not-a-uuid \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```

   Expected: 400 Bad Request with validation error

5. **Error Case - Empty Request Body**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   Expected: 400 Bad Request "At least one field must be provided"

6. **Error Case - Invalid Field Values**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "invalid_status",
       "leetcode_links": [{
         "title": "Test",
         "url": "not-a-url",
         "difficulty": "VeryHard"
       }]
     }'
   ```

   Expected: 400 Bad Request with multiple validation errors

7. **Error Case - Missing Authentication**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{valid-uuid} \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```

   Expected: 401 Unauthorized

8. **Error Case - Topic Not Found**

   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{non-existent-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```

   Expected: 404 Not Found

9. **Error Case - Update Another User's Topic**
   ```bash
   curl -X PATCH http://localhost:3000/api/topics/{other-user-topic-uuid} \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```
   Expected: 404 Not Found (not 403, for security)

### Step 5: Verify Database State

After successful updates, verify in Supabase dashboard:

1. **Check Updated Fields**
   - Verify only specified fields were changed
   - Verify unchanged fields remain the same

2. **Check Timestamps**
   - `created_at` should remain unchanged
   - `updated_at` should be current timestamp

3. **Check LeetCode Links**
   - Verify JSONB structure is valid
   - Verify array length doesn't exceed 5

### Step 6: Run Linter and Fix Issues

```bash
npm run lint
```

If there are any linting issues, fix them:

```bash
npm run lint:fix
```

### Step 7: Update Documentation

**File:** `README.md` or `.ai/api-plan.md`

Add PATCH endpoint to API documentation:

```markdown
### Update Topic

**Endpoint:** `PATCH /api/topics/:id`
**Authentication:** Required
**Description:** Update an existing topic with partial data

**Request:**

- All fields optional, at least one required
- Only updates provided fields
- Can set description to null to clear it

**Response:** 200 OK with full updated topic

**Example:**
{
"status": "completed",
"description": "Mastered all concepts"
}
```

### Step 8: Commit Changes

```bash
git add src/lib/validators/topic.validators.ts
git add src/lib/services/topic.service.ts
git add src/pages/api/topics/[id].ts
git commit -m "feat: implement PATCH /api/topics/:id endpoint for updating topics"
```

## 10. Post-Implementation Checklist

- [ ] Validation schema created and exported
- [ ] Service function implemented with proper error handling
- [ ] API route handler added with all response codes
- [ ] All imports updated correctly
- [ ] Manual tests passed for success cases
- [ ] Manual tests passed for error cases
- [ ] Database state verified after updates
- [ ] Linter passes without errors
- [ ] Documentation updated
- [ ] Changes committed to version control

## 11. Future Enhancements

1. **Optimistic Locking**
   - Add `version` field to topics table
   - Include version in update to prevent lost updates
   - Return 409 Conflict if version mismatch

2. **Audit Trail**
   - Create `topic_history` table
   - Log all changes with timestamps and user
   - Enable rollback functionality

3. **Webhook Integration**
   - Trigger webhooks on topic status changes
   - Enable external integrations
   - Support notification systems

4. **Batch Updates**
   - Create separate endpoint for bulk updates
   - `PATCH /api/topics` with array of IDs and updates
   - Optimize for updating multiple topics at once

5. **Change Validation**
   - Validate state transitions (e.g., can't skip from to_do to completed)
   - Require description when marking as completed
   - Custom business rules per technology

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Author:** AI Software Architect  
**Status:** Ready for Implementation
