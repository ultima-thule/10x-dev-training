# API Endpoint Implementation Plan: Create User Profile

## 1. Endpoint Overview

This endpoint creates a new user profile for an authenticated user during their first-time setup. The profile stores essential information about the user's experience level and time away from development, which will be used for personalizing learning recommendations and tracking progress.

**Key Characteristics:**

- One-time operation per user (subsequent calls return 409 Conflict)
- Requires authentication via JWT bearer token
- Profile ID matches the authenticated user's ID from `auth.users`
- Auto-initializes `activity_streak` to 0
- Auto-generates timestamps (`created_at`, `updated_at`)

## 2. Request Details

- **HTTP Method**: `POST`
- **URL Structure**: `/api/profile`
- **Content-Type**: `application/json`

### Parameters

#### Headers (Required)

- `Authorization: Bearer {access_token}` - JWT token from Supabase Auth

#### Request Body (Required)

| Field              | Type   | Required | Constraints                     | Description                        |
| ------------------ | ------ | -------- | ------------------------------- | ---------------------------------- |
| `experience_level` | string | Yes      | Enum: `junior`, `mid`, `senior` | User's experience level            |
| `years_away`       | number | Yes      | Integer, range: 0-30            | Years away from active development |

**Example Request Body:**

```json
{
  "experience_level": "mid",
  "years_away": 3
}
```

## 3. Used Types

### Import from `src/types.ts`

**Request Validation:**

- `CreateProfileCommand` - Command model for profile creation input

**Response:**

- `ProfileDTO` - Complete profile entity returned to client

**Error Handling:**

- `ErrorResponseDTO` - Standard error response structure
- `ErrorCode` - Error code type for consistent error handling
- `ValidationErrorDetail` - Field-level validation error details

**Enums:**

- `ExperienceLevelEnum` - Re-exported from database types

### Zod Schema (to be created)

Create a Zod schema based on `CreateProfileCommand` for runtime validation:

```typescript
import { z } from "zod";

const CreateProfileSchema = z.object({
  experience_level: z.enum(["junior", "mid", "senior"], {
    errorMap: () => ({ message: "Experience level must be one of: junior, mid, senior" }),
  }),
  years_away: z
    .number()
    .int()
    .min(0)
    .max(30)
    .refine((val) => Number.isInteger(val), {
      message: "Years away must be an integer between 0 and 30",
    }),
});
```

## 4. Response Details

### Success Response (201 Created)

Returns the newly created profile with all fields populated:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "experience_level": "mid",
  "years_away": 3,
  "activity_streak": 0,
  "created_at": "2025-11-15T10:00:00.000Z",
  "updated_at": "2025-11-15T10:00:00.000Z"
}
```

**Response Type:** `ProfileDTO`

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "experience_level",
        "message": "Experience level must be one of: junior, mid, senior"
      },
      {
        "field": "years_away",
        "message": "Years away must be an integer between 0 and 30"
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

#### 409 Conflict - Profile Already Exists

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Profile already exists for this user"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Step-by-Step Flow

1. **Request Reception**
   - Astro endpoint receives POST request at `/api/profile`
   - Extracts `Authorization` header

2. **Authentication** (Middleware)
   - Supabase middleware validates JWT token
   - Extracts `user_id` from token payload
   - Sets authenticated user in `context.locals.supabase`

3. **Input Validation**
   - Parse request body as JSON
   - Validate against `CreateProfileSchema` using Zod
   - Return 400 if validation fails

4. **Business Logic** (Profile Service)
   - Check if profile already exists for `user_id`
   - If exists, return 409 Conflict
   - If not, proceed to create profile

5. **Database Operation**
   - Insert new record into `profiles` table
   - Use `user_id` from authentication as primary key
   - Set `activity_streak` to 0 (default)
   - Auto-generate `created_at` and `updated_at` timestamps

6. **Response Formation**
   - Transform database result to `ProfileDTO`
   - Return 201 Created with profile data

### Database Query Pattern

```typescript
// Check for existing profile
const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();

if (existingProfile) {
  // Return 409 Conflict
}

// Create new profile
const { data: newProfile, error } = await supabase
  .from("profiles")
  .insert({
    id: userId,
    experience_level: command.experience_level,
    years_away: command.years_away,
    activity_streak: 0,
  })
  .select()
  .single();
```

### Service Architecture

**File:** `src/lib/services/profile.service.ts`

The service should export:

- `createProfile(supabase: SupabaseClient, userId: string, command: CreateProfileCommand): Promise<ProfileDTO>`
- Error handling wrapped in try-catch with typed error responses

## 6. Security Considerations

### Authentication

- **JWT Validation**: Supabase middleware validates token signature and expiration
- **Token Extraction**: User ID extracted from verified JWT payload (`auth.uid()`)
- **No User Input for ID**: Profile ID is derived from authenticated user, never from request body

### Authorization

- **Row Level Security (RLS)**: Database policies ensure users can only create their own profile
  ```sql
  CREATE POLICY profiles_self_mutate ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());
  ```
- **Ownership Verification**: Profile ID must match authenticated user ID

### Input Validation

- **Zod Schema Validation**: All inputs validated against strict schema before processing
- **Type Safety**: TypeScript ensures type correctness throughout the flow
- **Enum Validation**: `experience_level` restricted to defined enum values
- **Range Validation**: `years_away` constrained to 0-30 range

### Data Sanitization

- **No HTML/Script Content**: Profile fields are simple data types (enum, number)
- **Database Parameterization**: Supabase client uses parameterized queries (SQL injection protection)

### Rate Limiting

- **Profile Operations**: 30 requests per minute (as per API plan)
- **Headers**: Include `X-RateLimit-*` headers in response

### Security Headers

All responses should include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 7. Error Handling

### Error Scenarios and Handling

| Scenario                      | Detection                     | Status Code | Error Code             | Action                            |
| ----------------------------- | ----------------------------- | ----------- | ---------------------- | --------------------------------- |
| Missing Authorization header  | No header present             | 401         | `AUTHENTICATION_ERROR` | Return error immediately          |
| Invalid/expired JWT           | Token verification fails      | 401         | `AUTHENTICATION_ERROR` | Return error immediately          |
| Malformed JSON body           | JSON parse error              | 400         | `VALIDATION_ERROR`     | Return error with details         |
| Invalid experience_level      | Zod validation fails          | 400         | `VALIDATION_ERROR`     | Return field-specific error       |
| years_away out of range (>30) | Zod validation fails          | 400         | `VALIDATION_ERROR`     | Return field-specific error       |
| Missing required fields       | Zod validation fails          | 400         | `VALIDATION_ERROR`     | Return field-specific errors      |
| Profile already exists        | Database query finds existing | 409         | `CONFLICT`             | Return conflict error             |
| Database connection error     | Supabase query error          | 500         | `INTERNAL_ERROR`       | Log error, return generic message |
| Unexpected error              | Catch block                   | 500         | `INTERNAL_ERROR`       | Log error, return generic message |

### Error Response Format

All errors follow the `ErrorResponseDTO` structure:

```typescript
{
  error: {
    code: ErrorCode,
    message: string,
    details?: ValidationErrorDetail[]
  }
}
```

### Error Logging Strategy

- **Client Errors (4xx)**: Log at INFO level with sanitized details
- **Server Errors (5xx)**: Log at ERROR level with full stack trace
- **PII Protection**: Never log sensitive user data (passwords, tokens)
- **Structured Logging**: Use consistent format for easier debugging

```typescript
console.error("[CreateProfile] Database error", {
  userId,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

## 8. Performance Considerations

### Database Performance

- **Single Query Optimization**: Use `maybeSingle()` for existence check to avoid fetching unnecessary data
- **Index Usage**: Primary key lookup on `profiles.id` is indexed by default
- **Connection Pooling**: Supabase handles connection pooling automatically

### Response Time Targets

- **Expected Response Time**: < 200ms for successful creation
- **Maximum Acceptable**: < 500ms including authentication

### Optimization Strategies

1. **Early Returns**: Validate and fail fast before database operations
2. **Minimal Data Transfer**: Only select necessary fields
3. **Avoid N+1 Queries**: Single insert operation with `.select().single()`

### Caching Considerations

- **No Caching**: Profile creation is a write operation (not cacheable)
- **Future Consideration**: Cache profile data after creation for read operations

## 9. Implementation Steps

### Step 1: Create Profile Service

**File:** `src/lib/services/profile.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateProfileCommand, ProfileDTO, ErrorResponseDTO } from "@/types";

export class ProfileServiceError extends Error {
  constructor(
    public statusCode: number,
    public errorResponse: ErrorResponseDTO
  ) {
    super(errorResponse.error.message);
  }
}

export async function createProfile(
  supabase: SupabaseClient,
  userId: string,
  command: CreateProfileCommand
): Promise<ProfileDTO> {
  // Check for existing profile
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (checkError) {
    throw new ProfileServiceError(500, {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to check existing profile",
      },
    });
  }

  if (existingProfile) {
    throw new ProfileServiceError(409, {
      error: {
        code: "CONFLICT",
        message: "Profile already exists for this user",
      },
    });
  }

  // Create new profile
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

  if (insertError || !newProfile) {
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

  return newProfile;
}
```

### Step 2: Create Validation Schema

**File:** `src/lib/validators/profile.validators.ts`

```typescript
import { z } from "zod";

export const CreateProfileSchema = z.object({
  experience_level: z.enum(["junior", "mid", "senior"], {
    errorMap: () => ({
      message: "Experience level must be one of: junior, mid, senior",
    }),
  }),
  years_away: z
    .number({
      required_error: "Years away is required",
      invalid_type_error: "Years away must be a number",
    })
    .int({ message: "Years away must be an integer" })
    .min(0, { message: "Years away must be at least 0" })
    .max(30, { message: "Years away must not exceed 30" }),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
```

### Step 3: Create API Endpoint

**File:** `src/pages/api/profile.ts`

```typescript
import type { APIRoute } from "astro";
import { CreateProfileSchema } from "@/lib/validators/profile.validators";
import { createProfile, ProfileServiceError } from "@/lib/services/profile.service";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";
import { ZodError } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Authentication check
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

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
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

    const validatedData = CreateProfileSchema.parse(body);

    // 3. Call service to create profile
    const profile = await createProfile(supabase, user.id, validatedData);

    // 4. Return success response
    return new Response(JSON.stringify(profile), {
      status: 201,
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
          message: "Invalid input data",
          details,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle service errors
    if (error instanceof ProfileServiceError) {
      return new Response(JSON.stringify(error.errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("[API] Unexpected error in POST /api/profile", {
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

### Step 4: Configure Middleware for Authentication

**File:** `src/middleware/index.ts` (verify/update)

Ensure the middleware properly initializes Supabase client and attaches it to `locals`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async ({ request, locals, cookies }, next) => {
  locals.supabase = createServerClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => cookies.get(key)?.value,
      set: (key, value, options) => {
        cookies.set(key, value, options);
      },
      remove: (key, options) => {
        cookies.delete(key, options);
      },
    },
  });

  return next();
});
```

### Step 5: Update Environment Types

**File:** `src/env.d.ts`

Ensure type definitions include Supabase client in locals:

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
  }
}
```

### Step 6: Testing Checklist

**Manual Testing:**

1. ✅ Test successful profile creation with valid data
2. ✅ Test 401 error with missing Authorization header
3. ✅ Test 401 error with invalid JWT token
4. ✅ Test 400 error with invalid `experience_level` value
5. ✅ Test 400 error with `years_away` < 0
6. ✅ Test 400 error with `years_away` > 30
7. ✅ Test 400 error with malformed JSON
8. ✅ Test 409 error when profile already exists
9. ✅ Verify timestamps are auto-generated correctly
10. ✅ Verify `activity_streak` defaults to 0

**Security Testing:**

1. ✅ Verify RLS policies prevent cross-user profile creation
2. ✅ Test with expired JWT token
3. ✅ Attempt to create profile with different user_id in body (should be ignored)

**Integration Testing:**

1. ✅ Test complete flow: Sign up → Create profile → Verify profile exists
2. ✅ Test that subsequent profile creation attempts return 409

### Step 7: Documentation Updates

1. Update API documentation if needed
2. Add JSDoc comments to service functions
3. Document any environment variables required
4. Update README if this is a new service pattern

---

## Summary

This implementation plan provides a complete roadmap for creating the **POST /api/profile** endpoint. The approach follows best practices for:

- **Type Safety**: Leveraging TypeScript and Zod for end-to-end type safety
- **Security**: Authentication, authorization, and input validation at multiple layers
- **Error Handling**: Comprehensive error scenarios with appropriate status codes
- **Maintainability**: Separation of concerns (endpoint → service → database)
- **Performance**: Optimized database queries and early validation

The implementation uses the existing tech stack (Astro, Supabase, TypeScript) and adheres to the project's architectural patterns and coding standards.
