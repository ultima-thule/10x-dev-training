# REST API Plan - Development Refresher Training

## 1. Resources

The API is organized around the following main resources:

| Resource    | Database Table | Description                                                                          |
| ----------- | -------------- | ------------------------------------------------------------------------------------ |
| **Profile** | `profiles`     | User profile information including experience level, years away, and activity streak |
| **Topic**   | `topics`       | Review topics with hierarchical structure, status tracking, and LeetCode links       |
| **Auth**    | `auth.users`   | User authentication (managed by Supabase Auth)                                       |

## 2. Endpoints

### 2.1. Authentication Endpoints

Authentication is handled by Supabase Auth. The following endpoints are provided by Supabase:

#### Sign Up

- **Method**: `POST`
- **Path**: `/auth/v1/signup`
- **Description**: Create a new user account
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Response** (201 Created):

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-11-15T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid email or weak password
  - `422 Unprocessable Entity`: Email already registered

#### Sign In

- **Method**: `POST`
- **Path**: `/auth/v1/token?grant_type=password`
- **Description**: Authenticate existing user
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

- **Response** (200 OK):

```json
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: Invalid credentials
  - `422 Unprocessable Entity`: Missing required fields

#### Sign Out

- **Method**: `POST`
- **Path**: `/auth/v1/logout`
- **Description**: Terminate user session
- **Headers**: `Authorization: Bearer {access_token}`
- **Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired token

---

### 2.2. Profile Endpoints

#### Get Current User Profile

- **Method**: `GET`
- **Path**: `/api/profile`
- **Description**: Retrieve the authenticated user's profile
- **Headers**: `Authorization: Bearer {access_token}`
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "experience_level": "mid",
  "years_away": 3,
  "activity_streak": 7,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Profile not yet created

#### Create User Profile

- **Method**: `POST`
- **Path**: `/api/profile`
- **Description**: Create profile for the authenticated user (first-time setup)
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "experience_level": "mid",
  "years_away": 3
}
```

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "experience_level": "mid",
  "years_away": 3,
  "activity_streak": 0,
  "created_at": "2025-11-15T10:00:00Z",
  "updated_at": "2025-11-15T10:00:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation errors (invalid experience_level, years_away out of range)
  - `401 Unauthorized`: Missing or invalid authentication token
  - `409 Conflict`: Profile already exists for this user

#### Update User Profile

- **Method**: `PATCH`
- **Path**: `/api/profile`
- **Description**: Update the authenticated user's profile
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body** (all fields optional):

```json
{
  "experience_level": "senior",
  "years_away": 2,
  "activity_streak": 10
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "experience_level": "senior",
  "years_away": 2,
  "activity_streak": 10,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation errors
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Profile does not exist

---

### 2.3. Topic Endpoints

#### List User Topics

- **Method**: `GET`
- **Path**: `/api/topics`
- **Description**: Retrieve all topics for the authenticated user with optional filtering and sorting
- **Headers**: `Authorization: Bearer {access_token}`
- **Query Parameters**:
  - `status` (optional): Filter by status (`to_do`, `in_progress`, `completed`)
  - `technology` (optional): Filter by technology name
  - `parent_id` (optional): Filter by parent topic ID (use `null` for root topics only)
  - `sort` (optional): Sort field (`created_at`, `updated_at`, `title`, `status`). Default: `created_at`
  - `order` (optional): Sort order (`asc`, `desc`). Default: `desc`
  - `page` (optional): Page number for pagination. Default: `1`
  - `limit` (optional): Items per page (1-100). Default: `50`
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
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

- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters
  - `401 Unauthorized`: Missing or invalid authentication token

#### Get Topic by ID

- **Method**: `GET`
- **Path**: `/api/topics/:id`
- **Description**: Retrieve a specific topic by ID
- **Headers**: `Authorization: Bearer {access_token}`
- **Path Parameters**:
  - `id`: Topic UUID
- **Response** (200 OK):

```json
{
  "id": "uuid",
  "user_id": "uuid",
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
  "updated_at": "2025-11-15T10:00:00Z"
}
```

- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `403 Forbidden`: Topic belongs to another user (RLS)
  - `404 Not Found`: Topic does not exist

#### Get Topic Children

- **Method**: `GET`
- **Path**: `/api/topics/:id/children`
- **Description**: Retrieve all direct children of a specific topic
- **Headers**: `Authorization: Bearer {access_token}`
- **Path Parameters**:
  - `id`: Parent topic UUID
- **Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "parent_id": "parent_uuid",
      "title": "React Hooks Deep Dive",
      "description": "Understanding useCallback, useMemo, and custom hooks",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [],
      "created_at": "2025-11-10T10:05:00Z",
      "updated_at": "2025-11-10T10:05:00Z",
      "children_count": 0
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `403 Forbidden`: Topic belongs to another user (RLS)
  - `404 Not Found`: Parent topic does not exist

#### Create Topic

- **Method**: `POST`
- **Path**: `/api/topics`
- **Description**: Create a new topic for the authenticated user
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "parent_id": "uuid or null",
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

- **Response** (201 Created):

```json
{
  "id": "uuid",
  "user_id": "uuid",
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

- **Error Responses**:
  - `400 Bad Request`: Validation errors (missing required fields, invalid status, invalid leetcode_links format)
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Parent topic does not exist

#### Update Topic

- **Method**: `PATCH`
- **Path**: `/api/topics/:id`
- **Description**: Update an existing topic
- **Headers**: `Authorization: Bearer {access_token}`
- **Path Parameters**:
  - `id`: Topic UUID
- **Request Body** (all fields optional):

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "completed",
  "technology": "React",
  "leetcode_links": []
}
```

- **Response** (200 OK):

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "parent_id": null,
  "title": "Updated Title",
  "description": "Updated description",
  "status": "completed",
  "technology": "React",
  "leetcode_links": [],
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

- **Error Responses**:
  - `400 Bad Request`: Validation errors (invalid UUID, empty body, invalid fields)
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: Topic does not exist or belongs to another user (security: don't distinguish)

#### Delete Topic

- **Method**: `DELETE`
- **Path**: `/api/topics/:id`
- **Description**: Delete a topic and all its children (cascading delete)
- **Headers**: `Authorization: Bearer {access_token}`
- **Path Parameters**:
  - `id`: Topic UUID
- **Response** (204 No Content)
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `403 Forbidden`: Topic belongs to another user (RLS)
  - `404 Not Found`: Topic does not exist

---

### 2.4. AI Topic Generation Endpoint

#### Generate Topics

- **Method**: `POST`
- **Path**: `/api/topics/generate`
- **Description**: Generate AI-powered review topics based on user profile and selected technology
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:

```json
{
  "technology": "React",
  "parent_id": "uuid or null"
}
```

- **Response** (201 Created):

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

- **Error Responses**:
  - `400 Bad Request`: Missing or invalid technology parameter
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: User profile not found (required for AI generation)
  - `429 Too Many Requests`: Rate limit exceeded for AI generation
  - `500 Internal Server Error`: AI service error
  - `503 Service Unavailable`: AI service temporarily unavailable

---

### 2.5. Dashboard Endpoints

#### Get Dashboard Statistics

- **Method**: `GET`
- **Path**: `/api/dashboard/stats`
- **Description**: Retrieve user's progress statistics and metrics
- **Headers**: `Authorization: Bearer {access_token}`
- **Response** (200 OK):

```json
{
  "profile": {
    "experience_level": "mid",
    "years_away": 3,
    "activity_streak": 7
  },
  "topics": {
    "total": 45,
    "to_do": 20,
    "in_progress": 10,
    "completed": 15
  },
  "technologies": [
    {
      "name": "React",
      "total": 15,
      "completed": 8
    },
    {
      "name": "TypeScript",
      "total": 12,
      "completed": 4
    }
  ],
  "recent_activity": [
    {
      "topic_id": "uuid",
      "topic_title": "Advanced React Patterns",
      "action": "completed",
      "timestamp": "2025-11-15T10:00:00Z"
    }
  ]
}
```

- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid authentication token
  - `404 Not Found`: User profile not found

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **JWT (JSON Web Token)** based authentication provided by Supabase Auth:

1. **Token Generation**: Users receive an access token upon successful sign-up or sign-in
2. **Token Usage**: All protected endpoints require the `Authorization: Bearer {access_token}` header
3. **Token Expiration**: Access tokens expire after 3600 seconds (1 hour)
4. **Token Refresh**: Refresh tokens can be used to obtain new access tokens without re-authentication

### 3.2. Authorization with Row Level Security (RLS)

Authorization is enforced at the database level using PostgreSQL Row Level Security policies:

#### Profile Policies

```sql
-- Users can only read their own profile
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can only create/update their own profile
CREATE POLICY profiles_self_mutate ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
```

#### Topic Policies

```sql
-- Users can only read their own topics
CREATE POLICY topics_self_select ON topics
  FOR SELECT USING (user_id = auth.uid());

-- Users can only create/update/delete their own topics
CREATE POLICY topics_self_mutate ON topics
  FOR INSERT WITH CHECK (user_id = auth.uid());
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  FOR DELETE USING (user_id = auth.uid());
```

### 3.3. API-Level Authorization

The API layer enforces additional authorization checks:

1. **Endpoint Access**: All endpoints except authentication endpoints require a valid JWT
2. **Resource Ownership**: The API validates that the authenticated user owns the requested resource
3. **Cascading Operations**: When deleting a topic with children, the API ensures the user owns the entire subtree

### 3.4. Security Headers

All API responses include the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 4. Validation and Business Logic

### 4.1. Profile Validation

#### Field: `experience_level`

- **Type**: Enum
- **Valid Values**: `junior`, `mid`, `senior`
- **Required**: Yes (on create)
- **Error Message**: "Experience level must be one of: junior, mid, senior"

#### Field: `years_away`

- **Type**: Integer (smallint)
- **Range**: 0 to 30
- **Required**: Yes (on create)
- **Error Message**: "Years away must be between 0 and 60"

#### Field: `activity_streak`

- **Type**: Integer
- **Range**: >= 0
- **Default**: 0
- **Required**: No
- **Error Message**: "Activity streak must be a non-negative integer"

### 4.2. Topic Validation

#### Field: `title`

- **Type**: String (text)
- **Required**: Yes
- **Constraints**: Non-empty, max length 500 characters (application-level)
- **Error Message**: "Title is required and must not exceed 500 characters"

#### Field: `description`

- **Type**: String (text)
- **Required**: No
- **Constraints**: Max length 5000 characters (application-level)
- **Error Message**: "Description must not exceed 5000 characters"

#### Field: `status`

- **Type**: Enum
- **Valid Values**: `to_do`, `in_progress`, `completed`
- **Default**: `to_do`
- **Required**: No
- **Error Message**: "Status must be one of: to_do, in_progress, completed"

#### Field: `technology`

- **Type**: String (text)
- **Required**: Yes
- **Constraints**: Non-empty, max length 100 characters (application-level)
- **Error Message**: "Technology is required and must not exceed 100 characters"

#### Field: `leetcode_links`

- **Type**: JSONB Array
- **Required**: No
- **Default**: `[]`
- **Structure**: Array of objects with `title`, `url`, and `difficulty` properties
- **Validation**:
  - Must be a valid JSON array
  - Each object must have `title` (string), `url` (valid URL), and `difficulty` (string)
  - Max 50 links per topic (application-level)
- **Error Message**: "LeetCode links must be a valid array of objects with title, url, and difficulty fields"

#### Field: `parent_id`

- **Type**: UUID
- **Required**: No
- **Constraints**: Must reference an existing topic owned by the same user
- **Error Message**: "Parent topic does not exist or is not accessible"

### 4.3. Business Logic

#### Activity Streak Calculation

- **Trigger**: When a user updates a topic status to `completed`
- **Logic**:
  1. Check if the user completed any topic yesterday
  2. If yes, increment `activity_streak` by 1
  3. If no, reset `activity_streak` to 1
  4. If last completion was more than 1 day ago, reset to 1
- **Implementation**: API endpoint `/api/topics/:id` (PATCH) triggers streak update

#### AI Topic Generation

- **Input**:
  - User's `experience_level`
  - User's `years_away`
  - Selected `technology`
  - History of completed topics (for context)
- **Process**:
  1. Fetch user profile from database
  2. Fetch completed topics for the selected technology
  3. Construct prompt for AI model including profile context and completed topics
  4. Call OpenRouter.ai API with the prompt
  5. Parse AI response to extract topic data
  6. Validate generated topics against schema
  7. Insert topics into database
  8. Return created topics to client
- **Rate Limiting**: Max 5 generation requests per hour per user
- **Error Handling**: Graceful fallback if AI service is unavailable

#### Hierarchical Topic Deletion

- **Trigger**: DELETE request to `/api/topics/:id`
- **Logic**:
  1. Verify user owns the topic
  2. Database automatically cascades deletion to all children due to `ON DELETE CASCADE` constraint
  3. Return success (204 No Content)
- **Note**: Cascade deletion is handled at database level, not API level

#### Topic Filtering and Sorting

- **Supported Filters**:
  - `status`: Filter by topic status
  - `technology`: Filter by technology name
  - `parent_id`: Filter by parent (for hierarchical queries)
- **Supported Sorting**:
  - `created_at`: Sort by creation date
  - `updated_at`: Sort by last update
  - `title`: Sort alphabetically
  - `status`: Sort by status (to_do → in_progress → completed)
- **Pagination**:
  - Default: 50 items per page
  - Max: 100 items per page
  - Response includes total count and total pages

### 4.4. Timestamps

All resources automatically manage timestamps:

- **`created_at`**: Set to current UTC timestamp on creation
- **`updated_at`**: Automatically updated to current UTC timestamp on any modification
- **Trigger Function**: `set_updated_at()` function is called by database triggers on UPDATE operations

### 4.5. Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "experience_level",
        "message": "Experience level must be one of: junior, mid, senior"
      }
    ]
  }
}
```

**Error Codes**:

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Missing or invalid authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: External service unavailable

---

## 5. Rate Limiting

To prevent abuse and ensure fair usage, the following rate limits are enforced:

| Endpoint Category  | Rate Limit  | Window   |
| ------------------ | ----------- | -------- |
| Authentication     | 10 requests | 1 minute |
| Profile Operations | 30 requests | 1 minute |
| Topic CRUD         | 60 requests | 1 minute |
| AI Generation      | 5 requests  | 1 hour   |
| Dashboard Stats    | 30 requests | 1 minute |

**Rate Limit Headers**:

- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: UTC timestamp when the window resets

**Rate Limit Exceeded Response** (429 Too Many Requests):

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 3600
  }
}
```

---

## 6. API Versioning

The API uses URL-based versioning for future-proofing:

- **Current Version**: v1 (implicit in paths like `/api/topics`)
- **Future Versions**: Will use explicit versioning (e.g., `/api/v2/topics`)
- **Backward Compatibility**: v1 endpoints will be maintained for at least 12 months after v2 release

---

## 7. CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

- **Allowed Origins**: Configured per environment (dev, staging, production)
- **Allowed Methods**: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Authorization`, `Content-Type`, `X-Requested-With`
- **Exposed Headers**: `X-RateLimit-*`
- **Credentials**: Allowed (`Access-Control-Allow-Credentials: true`)
- **Max Age**: 86400 seconds (24 hours)
