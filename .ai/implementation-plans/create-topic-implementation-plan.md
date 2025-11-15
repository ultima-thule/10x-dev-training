# API Endpoint Implementation Plan: Create Topic

## 1. Endpoint Overview

The POST `/api/topics` endpoint allows authenticated users to create a new topic in their personalized learning path. This endpoint supports creating both root-level topics and hierarchical subtopics by providing an optional parent_id. Topics include all necessary fields for tracking learning progress, including title, description, technology, status, and related LeetCode practice problems.

**Key Features:**

- Create root topics or subtopics (hierarchical support)
- Auto-generate UUID and timestamps
- Default status to 'to_do' if not provided
- User ownership automatically assigned from JWT token
- Parent topic validation (must exist and belong to user)
- Comprehensive input validation with detailed error messages

## 2. Request Details

### HTTP Method

`POST`

### URL Structure

```
/api/topics
```

### Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```typescript
{
  parent_id?: string | null;           // Optional UUID of parent topic
  title: string;                       // Required, 1-200 characters
  description?: string | null;         // Optional, max 1000 characters
  status?: 'to_do' | 'in_progress' | 'completed'; // Optional, defaults to 'to_do'
  technology: string;                  // Required, 1-100 characters, alphanumeric + .-_
  leetcode_links?: Array<{             // Optional, max 5 links, defaults to []
    title: string;
    url: string;                       // Valid URL format
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }>;
}
```

**Example Request:**

```json
{
  "parent_id": null,
  "title": "Advanced React Patterns",
  "description": "Deep dive into advanced React patterns and best practices",
  "status": "to_do",
  "technology": "React",
  "leetcode_links": [
    {
      "title": "Two Sum",
      "url": "https://leetcode.com/problems/two-sum/",
      "difficulty": "Easy"
    }
  ]
}
```

**Minimal Valid Request:**

```json
{
  "title": "React Basics",
  "technology": "React"
}
```

## 3. Used Types

### DTOs and Command Models (from `src/types.ts`)

**Request:**

- `CreateTopicCommand` - Command model for create request body (already defined)

**Response:**

- `TopicDTO` - Complete topic object returned after creation
- `LeetCodeLink` - Structure for LeetCode problem references

**Error Handling:**

- `ErrorResponseDTO` - Standardized error response structure
- `ValidationErrorDetail` - Field-level validation error details

### Validators (to be created in `src/lib/validators/topic.validators.ts`)

**New Schema Required:**

- `CreateTopicCommandSchema` - Zod schema validating request body with:
  - Required `title` (string, 1-200 chars)
  - Required `technology` (string, 1-100 chars, regex pattern)
  - Optional `parent_id` (UUID or null)
  - Optional `description` (string or null, max 1000 chars)
  - Optional `status` (enum: to_do, in_progress, completed, default 'to_do')
  - Optional `leetcode_links` (array, max 5 items, validated structure)

**Existing Schemas:**

- `LeetCodeLinkSchema` - Validates individual LeetCode link objects (already exists, can reuse)

## 4. Response Details

### Success Response (201 Created)

Returns the complete created topic object with all fields, including auto-generated id, user_id, and timestamps.

```typescript
{
  id: string;              // Auto-generated UUID
  user_id: string;         // From authenticated user
  parent_id: string | null; // As provided in request
  title: string;
  description: string | null;
  status: 'to_do' | 'in_progress' | 'completed';
  technology: string;
  leetcode_links: LeetCodeLink[];
  created_at: string;      // Auto-generated ISO 8601 timestamp
  updated_at: string;      // Auto-generated ISO 8601 timestamp (same as created_at initially)
}
```

**Example Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987fcdeb-51a2-43d7-8c9f-123456789abc",
  "parent_id": null,
  "title": "Advanced React Patterns",
  "description": "Deep dive into advanced React patterns and best practices",
  "status": "to_do",
  "technology": "React",
  "leetcode_links": [
    {
      "title": "Two Sum",
      "url": "https://leetcode.com/problems/two-sum/",
      "difficulty": "Easy"
    }
  ],
  "created_at": "2025-11-15T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**Scenario 1: Missing Required Fields**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "technology",
        "message": "Technology is required"
      }
    ]
  }
}
```

**Scenario 2: Invalid Field Values**

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
      },
      {
        "field": "parent_id",
        "message": "Parent ID must be a valid UUID"
      }
    ]
  }
}
```

**Scenario 3: Invalid LeetCode Links**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "leetcode_links.0.url",
        "message": "LeetCode URL must be valid"
      },
      {
        "field": "leetcode_links",
        "message": "Maximum 5 LeetCode links per topic"
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

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create topic"
  }
}
```

## 5. Data Flow

### Request Processing Pipeline

```
1. HTTP POST Request → Astro API Route Handler
   ↓
2. Extract Supabase Client from middleware (locals.supabase)
   ↓
3. Authenticate User (supabase.auth.getUser())
   ↓ (userId extracted)
4. Parse and Validate Request Body (CreateTopicCommandSchema)
   ↓ (createCommand validated)
5. Call Service Layer (createTopic(supabase, userId, createCommand))
   ↓
6. Service: If parent_id provided, validate parent exists and belongs to user
   ↓
7. Service: Prepare insert data (add user_id, default values)
   ↓
8. Service: Insert topic into database
   ↓
9. Service: Transform database result to TopicDTO
   ↓
10. Return 201 Created with TopicDTO
```

### Service Layer Logic (`createTopic` function)

**Location:** `src/lib/services/topic.service.ts`

**Function Signature:**

```typescript
export async function createTopic(
  supabase: SupabaseClient,
  userId: string,
  command: CreateTopicCommand
): Promise<TopicDTO>;
```

**Processing Steps:**

1. **Validate Parent Topic (if provided)**
   - If `command.parent_id` is provided, call `validateParentTopic(supabase, userId, parent_id)`
   - Reuse existing helper function (already implemented in topic.service.ts)
   - Throws TopicServiceError(404) if parent not found or belongs to another user

2. **Prepare Insert Data**

   ```typescript
   const insertData = {
     user_id: userId,
     parent_id: command.parent_id || null,
     title: command.title,
     description: command.description || null,
     status: command.status || "to_do",
     technology: command.technology,
     leetcode_links: (command.leetcode_links || []) as unknown as Json,
   };
   ```

3. **Execute Insert Query**

   ```typescript
   const { data, error } = await supabase.from("topics").insert(insertData).select().single();
   ```

4. **Handle Query Results**
   - If error: Log and throw TopicServiceError(500, INTERNAL_ERROR)
   - If data is null: Throw TopicServiceError(500, INTERNAL_ERROR)
   - If successful: Transform to TopicDTO and return

5. **Transform Response**
   - Cast `leetcode_links` from Json to LeetCodeLink[]
   - Ensure all timestamps are ISO 8601 strings
   - Return complete TopicDTO

### Database Interaction

**Table:** `topics`

**Insert Operation:**

```sql
INSERT INTO topics (
  user_id,
  parent_id,
  title,
  description,
  status,
  technology,
  leetcode_links
) VALUES (
  $1,  -- userId from JWT
  $2,  -- parent_id or null
  $3,  -- title (required)
  $4,  -- description or null
  $5,  -- status (defaults to 'to_do')
  $6,  -- technology (required)
  $7   -- leetcode_links JSONB (defaults to [])
)
RETURNING *;
```

**Notes:**

- `id` auto-generated via `gen_random_uuid()`
- `created_at` and `updated_at` auto-generated via database defaults
- `user_id` set from authenticated user
- `status` defaults to 'to_do' if not provided
- `leetcode_links` defaults to empty array if not provided
- Foreign key constraints ensure referential integrity

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

**Mechanism:** User Ownership Assignment + Parent Validation

**Implementation:**

1. Automatically set `user_id` to authenticated user (prevents creating topics for other users)
2. If `parent_id` provided, verify parent exists and belongs to user
3. Return 404 (not 403) for invalid parent to avoid leaking information
4. RLS policies enforce additional database-level security

**Security Benefits:**

- Users can only create topics for themselves
- Cannot attach subtopics to other users' topics
- Doesn't expose whether topics exist for other users
- Database-level enforcement via RLS

### Input Validation

**Required Field Validation:**

- `title` and `technology` must be provided
- Returns 400 with field-level error messages

**String Length Validation:**

- `title`: 1-200 chars (prevent DOS, ensure usability)
- `description`: max 1000 chars (prevent DOS)
- `technology`: 1-100 chars (reasonable limit)

**Format Validation:**

- `parent_id`: Must be valid UUID format
- `status`: Must be valid enum value
- `technology`: Alphanumeric + limited special chars (regex pattern)
- `leetcode_links`: Valid URL format, valid difficulty enum

**Array Size Validation:**

- `leetcode_links`: Max 5 items (prevent resource exhaustion)

**Mass Assignment Protection:**

- Only accept fields defined in CreateTopicCommand
- Zod schema rejects unknown fields
- Prevents setting `id`, `user_id`, `created_at`, `updated_at` directly

### Data Sanitization

**Automatic Protections:**

- Supabase client uses parameterized queries (prevents SQL injection)
- JSON serialization escapes special characters
- Database JSONB type validates structure

**Manual Validations:**

- LeetCode URLs validated as proper URLs (prevents XSS)
- Difficulty enum strictly validated (prevents invalid data)
- Technology regex pattern prevents injection attempts
- String length limits prevent buffer overflow attacks

### Row Level Security (RLS)

**Database Policies (already configured):**

```sql
-- Insert policy: Users can create topics for themselves
CREATE POLICY "Users can insert own topics"
ON topics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Select policy: Users can only read their own topics
CREATE POLICY "Users can select own topics"
ON topics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Benefits:**

- Defense-in-depth security layer
- Enforced at database level (works even if app code has bugs)
- Automatic user isolation
- Prevents unauthorized data access

## 7. Error Handling

### Error Handling Strategy

1. **Validation Errors (400)** - Caught early at request body parsing, returned with detailed field-level messages
2. **Authentication Errors (401)** - Handled at API route level before service calls
3. **Not Found Errors (404)** - Returned from service when parent topic validation fails
4. **Internal Errors (500)** - Logged with full context, returned with generic message to avoid information leakage

### Error Scenarios and Responses

| Scenario                           | Detection Point                   | Status | Error Code           | Response Message                                        |
| ---------------------------------- | --------------------------------- | ------ | -------------------- | ------------------------------------------------------- |
| Missing title                      | Request body validation           | 400    | VALIDATION_ERROR     | Title is required                                       |
| Missing technology                 | Request body validation           | 400    | VALIDATION_ERROR     | Technology is required                                  |
| Empty title                        | Request body validation           | 400    | VALIDATION_ERROR     | Title must not be empty                                 |
| Title too long (>200 chars)        | Request body validation           | 400    | VALIDATION_ERROR     | Title must not exceed 200 characters                    |
| Description too long (>1000 chars) | Request body validation           | 400    | VALIDATION_ERROR     | Description must not exceed 1000 characters             |
| Invalid status enum                | Request body validation           | 400    | VALIDATION_ERROR     | Status must be one of: to_do, in_progress, completed    |
| Invalid parent_id format           | Request body validation           | 400    | VALIDATION_ERROR     | Parent ID must be a valid UUID                          |
| Invalid technology format          | Request body validation           | 400    | VALIDATION_ERROR     | Technology must contain only alphanumeric characters... |
| Too many LeetCode links (>5)       | Request body validation           | 400    | VALIDATION_ERROR     | Maximum 5 LeetCode links per topic                      |
| Invalid LeetCode URL               | Request body validation           | 400    | VALIDATION_ERROR     | LeetCode URL must be valid                              |
| Invalid LeetCode difficulty        | Request body validation           | 400    | VALIDATION_ERROR     | Difficulty must be one of: Easy, Medium, Hard           |
| Invalid JSON in request body       | Request body parsing              | 400    | VALIDATION_ERROR     | Invalid JSON in request body                            |
| Missing auth token                 | Authentication check              | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token                 |
| Expired/invalid token              | Authentication check              | 401    | AUTHENTICATION_ERROR | Missing or invalid authentication token                 |
| Parent topic doesn't exist         | Service layer (parent validation) | 404    | NOT_FOUND            | Parent topic not found                                  |
| Parent belongs to another user     | Service layer (parent validation) | 404    | NOT_FOUND            | Parent topic not found                                  |
| Database connection error          | Service layer (insert error)      | 500    | INTERNAL_ERROR       | Failed to create topic                                  |
| Unexpected exception               | Try-catch in API route            | 500    | INTERNAL_ERROR       | An unexpected error occurred                            |

### Error Logging Pattern

**Service Layer Logging:**

```typescript
console.error("[TopicService] Failed to create topic", {
  userId,
  title: command.title,
  technology: command.technology,
  hasParent: !!command.parent_id,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

**API Layer Logging:**

```typescript
console.error("[API] Unexpected error in POST /api/topics", {
  userId,
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

1. **Parent Topic Validation**
   - Extra SELECT query when parent_id provided
   - Impact: ~10-50ms per request with parent
   - Mitigation: Only execute when parent_id is provided

2. **Database Insert Operation**
   - Single INSERT with RETURNING clause
   - Impact: ~10-50ms per request
   - Primary key index on id ensures fast lookups

3. **JSON Transformation**
   - Converting leetcode_links between Json and LeetCodeLink[]
   - Minimal overhead for small arrays (max 5 items)
   - Impact: <1ms

4. **Authentication Token Verification**
   - JWT verification on every request
   - Cached by Supabase client
   - Impact: ~5-20ms

### Optimization Strategies

1. **Single Database Operation**
   - Use `.insert().select()` chain to return created data
   - Avoids separate SELECT after INSERT
   - Reduces latency by ~50%

2. **Early Validation**
   - Validate request body before database operations
   - Fail fast on invalid data
   - Saves database round trip for invalid requests

3. **Conditional Parent Validation**
   - Only validate parent when parent_id is provided
   - Skip validation for root topics
   - Reduces latency for most common case

4. **Index Optimization**
   - Database has indexes on:
     - `id` (primary key) - used by parent validation
     - `user_id` - used by RLS policies
     - `parent_id` - used for hierarchical queries
   - Insert operation remains fast even with large datasets

### Expected Performance

**Typical Request (Root Topic, No Parent):**

- Validation: <5ms
- Authentication: 5-20ms
- Database insert: 10-50ms
- JSON transformation: <1ms
- **Total: 20-80ms**

**Request With Parent Validation:**

- Validation: <5ms
- Authentication: 5-20ms
- Parent validation: 10-50ms
- Database insert: 10-50ms
- JSON transformation: <1ms
- **Total: 30-130ms**

**Load Capacity:**

- Single instance: 50-100 concurrent creates/sec
- Bottleneck: Database write capacity
- Scaling: Vertical (larger database) or horizontal (read replicas + write primary)

### Monitoring Recommendations

1. **Log Slow Operations**
   - Log if database operation takes >100ms
   - Log if parent validation takes >100ms
   - Investigate and optimize if common

2. **Track Error Rates**
   - Monitor 400 rate (potential UX or validation issues)
   - Monitor 404 rate (parent validation issues)
   - Monitor 500 rate (system health issues)

3. **Monitor Creation Patterns**
   - Track percentage of topics with parents
   - Track average LeetCode links per topic
   - Use for capacity planning

## 9. Implementation Steps

### Step 1: Create Validation Schema

**File:** `src/lib/validators/topic.validators.ts`

**Action:** Add the following schema to the file (can reuse existing LeetCodeLinkSchema):

```typescript
/**
 * Validation schema for creating a new topic
 *
 * Validates:
 * - title: Required string (1-200 chars)
 * - technology: Required string (1-100 chars, alphanumeric + .-_)
 * - parent_id: Optional UUID or null
 * - description: Optional string or null (max 1000 chars)
 * - status: Optional enum (to_do, in_progress, completed), defaults to 'to_do'
 * - leetcode_links: Optional array of validated link objects (max 5)
 */
export const CreateTopicCommandSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title must not be empty" })
    .max(200, { message: "Title must not exceed 200 characters" }),
  technology: z
    .string({ required_error: "Technology is required" })
    .min(1, { message: "Technology must not be empty" })
    .max(100, { message: "Technology must not exceed 100 characters" })
    .regex(/^[a-zA-Z0-9\s.\-_]+$/, {
      message: "Technology must contain only alphanumeric characters, spaces, dots, hyphens, and underscores",
    }),
  parent_id: z.string().uuid({ message: "Parent ID must be a valid UUID" }).nullable().optional(),
  description: z.string().max(1000, { message: "Description must not exceed 1000 characters" }).nullable().optional(),
  status: z
    .enum(["to_do", "in_progress", "completed"], {
      errorMap: () => ({
        message: "Status must be one of: to_do, in_progress, completed",
      }),
    })
    .default("to_do")
    .optional(),
  leetcode_links: z
    .array(LeetCodeLinkSchema)
    .max(5, { message: "Maximum 5 LeetCode links per topic" })
    .default([])
    .optional(),
});

/**
 * Type inference from CreateTopicCommandSchema
 * Use this type for validated create command data
 */
export type CreateTopicCommandInput = z.infer<typeof CreateTopicCommandSchema>;
```

### Step 2: Implement Service Layer Function

**File:** `src/lib/services/topic.service.ts`

**Action:** Add the following function (can reuse existing `validateParentTopic` helper):

```typescript
/**
 * Creates a new topic for the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user's ID
 * @param command - Create command with topic data
 * @returns Promise resolving to created topic
 * @throws TopicServiceError with 404 if parent not found, 500 for database errors
 *
 * Business Logic:
 * 1. Validate parent topic if parent_id provided
 * 2. Prepare insert data with user_id and defaults
 * 3. Execute insert query with select to return created topic
 * 4. Transform and return created topic
 *
 * Error Scenarios:
 * - 404 Not Found: Parent topic doesn't exist or belongs to another user
 * - 500 Internal Error: Database operation failed
 */
export async function createTopic(
  supabase: SupabaseClient,
  userId: string,
  command: CreateTopicCommand
): Promise<TopicDTO> {
  try {
    // Step 1: Validate parent topic if provided
    if (command.parent_id) {
      await validateParentTopic(supabase, userId, command.parent_id);
    }

    // Step 2: Prepare insert data
    const insertData = {
      user_id: userId,
      parent_id: command.parent_id || null,
      title: command.title,
      description: command.description || null,
      status: command.status || "to_do",
      technology: command.technology,
      leetcode_links: (command.leetcode_links || []) as unknown as Json,
    };

    // Step 3: Execute insert query
    const { data: createdTopic, error } = await supabase.from("topics").insert(insertData).select().single();

    // Step 4: Handle database errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TopicService] Failed to create topic", {
        userId,
        title: command.title,
        technology: command.technology,
        hasParent: !!command.parent_id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create topic",
        },
      });
    }

    // Step 5: Handle unexpected null result
    if (!createdTopic) {
      throw new TopicServiceError(500, {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create topic",
        },
      });
    }

    // Step 6: Transform to TopicDTO
    return {
      id: createdTopic.id,
      user_id: createdTopic.user_id,
      parent_id: createdTopic.parent_id,
      title: createdTopic.title,
      description: createdTopic.description,
      status: createdTopic.status,
      technology: createdTopic.technology,
      leetcode_links: (createdTopic.leetcode_links as unknown as LeetCodeLink[]) || [],
      created_at: createdTopic.created_at,
      updated_at: createdTopic.updated_at,
    };
  } catch (error) {
    // Re-throw TopicServiceError as-is
    if (error instanceof TopicServiceError) {
      throw error;
    }

    // Log and wrap unexpected errors
    // eslint-disable-next-line no-console
    console.error("[TopicService] Unexpected error in createTopic", {
      userId,
      title: command.title,
      technology: command.technology,
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
  UpdateTopicCommand,
  CreateTopicCommand, // Add this import
} from "@/types";
```

### Step 3: Create API Route File

**File:** `src/pages/api/topics.ts` (new file)

**Action:** Create the file with the following content:

```typescript
import type { APIRoute } from "astro";
import { CreateTopicCommandSchema } from "@/lib/validators/topic.validators";
import { createTopic, TopicServiceError } from "@/lib/services/topic.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/topics
 *
 * Creates a new topic for the authenticated user
 * Requires authentication via JWT token in Authorization header
 *
 * Request Body:
 * {
 *   "parent_id": "uuid or null",       // Optional
 *   "title": "Topic Title",            // Required
 *   "description": "Description",      // Optional
 *   "status": "to_do",                 // Optional, defaults to 'to_do'
 *   "technology": "React",             // Required
 *   "leetcode_links": [...]            // Optional, defaults to []
 * }
 *
 * Response (201 Created):
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "parent_id": null,
 *   "title": "Topic Title",
 *   "description": "Description",
 *   "status": "to_do",
 *   "technology": "React",
 *   "leetcode_links": [...],
 *   "created_at": "...",
 *   "updated_at": "..."
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request body or validation errors
 * - 401 Unauthorized: Missing or invalid authentication token
 * - 404 Not Found: Parent topic not found
 * - 500 Internal Server Error: Database error
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

    const bodyValidation = CreateTopicCommandSchema.safeParse(requestBody);

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

    const createCommand = bodyValidation.data;

    // Step 4: Create topic via service
    const createdTopic = await createTopic(supabase, userId, createCommand);

    // Step 5: Return success response
    return new Response(JSON.stringify(createdTopic), {
      status: 201,
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
    console.error("[API] Unexpected error in POST /api/topics", {
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

### Step 4: Test the Implementation

**Manual Testing Checklist:**

1. **Success Case - Minimal Valid Request**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "React Basics",
       "technology": "React"
     }'
   ```

   Expected: 201 Created with full topic (status='to_do', description=null, leetcode_links=[])

2. **Success Case - Complete Request**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Advanced React Patterns",
       "description": "Deep dive into React patterns",
       "status": "to_do",
       "technology": "React",
       "leetcode_links": [{
         "title": "Two Sum",
         "url": "https://leetcode.com/problems/two-sum/",
         "difficulty": "Easy"
       }]
     }'
   ```

   Expected: 201 Created with all fields populated

3. **Success Case - With Parent Topic**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "parent_id": "{valid-parent-uuid}",
       "title": "React Hooks",
       "technology": "React"
     }'
   ```

   Expected: 201 Created with parent_id set

4. **Error Case - Missing Required Fields**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Missing title and technology"
     }'
   ```

   Expected: 400 Bad Request with validation errors for title and technology

5. **Error Case - Invalid Field Values**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "",
       "technology": "React",
       "status": "invalid_status",
       "leetcode_links": [{
         "title": "Test",
         "url": "not-a-url",
         "difficulty": "VeryHard"
       }]
     }'
   ```

   Expected: 400 Bad Request with multiple validation errors

6. **Error Case - Missing Authentication**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test",
       "technology": "React"
     }'
   ```

   Expected: 401 Unauthorized

7. **Error Case - Invalid Parent ID**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "parent_id": "not-a-uuid",
       "title": "Test",
       "technology": "React"
     }'
   ```

   Expected: 400 Bad Request with UUID validation error

8. **Error Case - Non-Existent Parent**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "parent_id": "00000000-0000-0000-0000-000000000000",
       "title": "Test",
       "technology": "React"
     }'
   ```

   Expected: 404 Not Found "Parent topic not found"

9. **Error Case - Another User's Parent Topic**

   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Authorization: Bearer {valid-token}" \
     -H "Content-Type: application/json" \
     -d '{
       "parent_id": "{other-user-topic-uuid}",
       "title": "Test",
       "technology": "React"
     }'
   ```

   Expected: 404 Not Found (not 403, for security)

### Step 5: Verify Database State

After successful creation, verify in Supabase dashboard:

1. **Check Created Topic**
   - Verify all fields are correctly saved
   - Verify `id` is auto-generated UUID
   - Verify `user_id` matches authenticated user
   - Verify `status` defaults to 'to_do' if not provided
   - Verify `leetcode_links` defaults to [] if not provided

2. **Check Timestamps**
   - `created_at` and `updated_at` should be identical
   - Both should be current UTC timestamp
   - Format should be ISO 8601

3. **Check JSONB Structure**
   - Verify `leetcode_links` JSONB is valid
   - Verify array structure
   - Verify no corruption of special characters

4. **Check Hierarchy**
   - If parent_id provided, verify relationship is correct
   - Verify cascading delete works (delete parent, subtopic also deleted)

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

Add POST endpoint to API documentation:

```markdown
### Create Topic

**Endpoint:** `POST /api/topics`
**Authentication:** Required
**Description:** Create a new topic for authenticated user

**Request:**

- Required: title, technology
- Optional: parent_id, description, status (defaults to 'to_do'), leetcode_links

**Response:** 201 Created with full topic object

**Example:**
{
"title": "React Hooks",
"technology": "React",
"description": "Learn useState, useEffect, and custom hooks"
}
```

### Step 8: Commit Changes

```bash
git add src/lib/validators/topic.validators.ts
git add src/lib/services/topic.service.ts
git add src/pages/api/topics.ts
git commit -m "feat: implement POST /api/topics endpoint for creating topics"
```

## 10. Post-Implementation Checklist

- [ ] Validation schema created and exported
- [ ] Service function implemented with proper error handling
- [ ] API route file created with POST handler
- [ ] All imports updated correctly
- [ ] Manual tests passed for success cases
- [ ] Manual tests passed for error cases
- [ ] Database state verified after creation
- [ ] Parent-child relationship tested
- [ ] Linter passes without errors
- [ ] Documentation updated
- [ ] Changes committed to version control

## 11. Future Enhancements

1. **Bulk Creation**
   - Create separate endpoint for creating multiple topics at once
   - `POST /api/topics/bulk` with array of topics
   - Optimize with batch insert

2. **Topic Templates**
   - Predefined topic templates for common technologies
   - `GET /api/topics/templates?technology=React`
   - Speed up topic creation for users

3. **Duplicate Detection**
   - Check for duplicate titles within same technology
   - Warn user before creating duplicate
   - Option to create anyway or merge

4. **Rich Text Support**
   - Support markdown in description field
   - Allow formatting, code blocks, links
   - Store as markdown, render as HTML

5. **Topic Ordering**
   - Add `order` field to topics table
   - Allow users to manually order topics
   - Maintain order within parent-child groups

6. **Topic Import/Export**
   - Export topics as JSON for backup
   - Import topics from file or URL
   - Share topic hierarchies between users

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-15  
**Author:** AI Software Architect  
**Status:** Ready for Implementation
