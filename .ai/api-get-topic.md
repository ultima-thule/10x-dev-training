# API Documentation: Get Topic by ID Endpoint

## Overview

The Get Topic by ID endpoint retrieves complete details for a single topic using its unique identifier. This is a simple, fast read operation that returns all topic information including title, description, status, technology, and associated LeetCode practice problems.

## Endpoint Details

- **URL**: `/api/topics/:id`
- **Method**: `GET`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: Not applicable (GET request)

## Request

### Headers

```
Authorization: Bearer {access_token}
```

### Path Parameters

| Parameter | Type          | Required | Description                                |
| --------- | ------------- | -------- | ------------------------------------------ |
| `id`      | string (UUID) | Yes      | Unique identifier of the topic to retrieve |

#### Validation Rules

**`id` (Path Parameter)**:

- Must be valid UUID v4 format
- Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`
- Examples of valid UUIDs:
  - `550e8400-e29b-41d4-a716-446655440000`
  - `123e4567-e89b-12d3-a456-426614174000`
- Examples of invalid formats:
  - `abc123` (not UUID format)
  - `550e8400-invalid-uuid` (malformed)
  - Empty string

### Example Requests

```bash
# Get topic by ID
curl -X GET http://localhost:3000/api/topics/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGc..."

# With environment variable for token
export TOKEN="your_jwt_token_here"
curl -X GET http://localhost:3000/api/topics/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

## Response

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "789e0123-e89b-12d3-a456-426614174111",
  "parent_id": null,
  "title": "Advanced React Patterns",
  "description": "Deep dive into advanced React patterns and best practices including compound components, render props, HOCs, and custom hooks for building reusable and maintainable components.",
  "status": "in_progress",
  "technology": "React",
  "leetcode_links": [
    {
      "title": "Two Sum",
      "url": "https://leetcode.com/problems/two-sum/",
      "difficulty": "Easy"
    },
    {
      "title": "Design Pattern",
      "url": "https://leetcode.com/problems/design-pattern/",
      "difficulty": "Medium"
    }
  ],
  "created_at": "2025-11-10T10:00:00.000Z",
  "updated_at": "2025-11-15T10:00:00.000Z"
}
```

#### Response Fields

| Field            | Type                  | Description                                                           |
| ---------------- | --------------------- | --------------------------------------------------------------------- |
| `id`             | string (UUID)         | Topic unique identifier                                               |
| `user_id`        | string (UUID)         | Owner's user ID (always matches authenticated user)                   |
| `parent_id`      | string (UUID) \| null | Parent topic ID for subtopics, null for root topics                   |
| `title`          | string                | Topic title (max 200 characters)                                      |
| `description`    | string \| null        | Detailed topic description (max 1000 characters)                      |
| `status`         | enum                  | Current progress status: `"to_do"`, `"in_progress"`, or `"completed"` |
| `technology`     | string                | Technology/framework name                                             |
| `leetcode_links` | Array<LeetCodeLink>   | Related coding problems (0-5 per topic)                               |
| `created_at`     | string (ISO 8601)     | Topic creation timestamp                                              |
| `updated_at`     | string (ISO 8601)     | Last modification timestamp                                           |

**LeetCodeLink Object:**

| Field        | Type         | Description                                           |
| ------------ | ------------ | ----------------------------------------------------- |
| `title`      | string       | Problem title/name                                    |
| `url`        | string (URL) | Direct link to LeetCode problem                       |
| `difficulty` | enum         | Problem difficulty: `"Easy"`, `"Medium"`, or `"Hard"` |

### Error Responses

#### 400 Bad Request

**Scenario: Invalid UUID format**

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

**Triggers:**

- Path parameter is not a valid UUID format
- Malformed UUID
- Empty string or special characters

#### 401 Unauthorized

**Scenario 1: Missing authentication token**

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

**Triggers:**

- No `Authorization` header provided
- Header format incorrect (not "Bearer {token}")

**Scenario 2: Invalid or expired token**

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

**Triggers:**

- JWT signature is invalid
- JWT token has expired
- Token is malformed

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Topic not found"
  }
}
```

**Triggers:**

- Topic ID doesn't exist in the database
- Topic exists but belongs to a different user (RLS enforcement)

**Important Note**: For security reasons, the API returns the same 404 error whether a topic doesn't exist or the user doesn't have access to it. This prevents information leakage about topic existence.

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve topic"
  }
}
```

**Triggers:**

- Database connection failure
- Unexpected server error
- Query execution error

## How It Works

### Flow Diagram

```
1. Client sends GET request with topic ID
   ↓
2. Middleware validates JWT token
   ↓
3. Extract user ID from token
   ↓
4. Validate UUID format (Zod)
   ↓
5. Query database (with RLS)
   ↓
6. Return topic (200 OK) or 404
```

### Database Query

The endpoint performs a simple primary key lookup:

```sql
SELECT *
FROM topics
WHERE id = $1
  AND user_id = $2  -- Explicit user filter
LIMIT 1;
```

**Row Level Security (RLS)** also enforces:

```sql
-- Users can only view their own topics
CREATE POLICY "Users can view own topics"
  ON topics FOR SELECT
  USING (auth.uid() = user_id);
```

### Performance Characteristics

- **Query Type**: Primary key lookup
- **Index**: Automatic B-tree index on `id` (primary key)
- **Time Complexity**: O(log n)
- **Expected Latency**: <10ms for database query
- **Total Response Time**: 20-100ms (including network)

## Security

### Authentication & Authorization

- **Authentication**: JWT token verified by Supabase via middleware
- **Authorization**: Row Level Security (RLS) automatically enforces user isolation
- **Defense in Depth**: Service layer adds explicit `user_id` filter
- **Information Leakage Prevention**: Same 404 response for "not found" and "forbidden"

### Data Privacy

- **User Isolation**: Users can only access their own topics
- **RLS Enforcement**: Database-level security, not just application-level
- **No PII Exposure**: Topic content is user-generated, not sensitive
- **Audit Trail**: All access attempts logged server-side

### Common Security Threats

#### 1. Unauthorized Access

- **Threat**: User tries to access another user's topic by guessing UUID
- **Mitigation**: RLS blocks access; returns 404 (same as non-existent)

#### 2. SQL Injection

- **Threat**: Malicious UUID crafted to inject SQL commands
- **Mitigation**:
  - UUID format validation rejects non-UUID strings
  - Parameterized queries prevent injection
  - TypeScript type safety

#### 3. Information Disclosure

- **Threat**: Different error messages reveal topic existence
- **Mitigation**: Same 404 response for all unauthorized/not-found cases

## Best Practices

### Client-Side Implementation

```typescript
// Example TypeScript/JavaScript client implementation
async function getTopicById(topicId: string, token: string) {
  try {
    const response = await fetch(`/api/topics/${topicId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 400:
          throw new Error(`Invalid topic ID: ${error.error.message}`);
        case 401:
          throw new Error("Authentication required");
        case 404:
          throw new Error("Topic not found");
        case 500:
          throw new Error("Server error. Please try again.");
        default:
          throw new Error("Unexpected error");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch topic:", error);
    throw error;
  }
}
```

### Error Handling

1. **Validate UUID client-side** before making request
2. **Cache responses** for frequently accessed topics
3. **Handle 404 gracefully** (could be deleted or never existed)
4. **Retry 500 errors** with exponential backoff
5. **Refresh token** on 401 errors

### Caching Strategy

For production applications, consider:

```typescript
// Redis cache example (5-minute TTL)
const cacheKey = `topic:${userId}:${topicId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const topic = await getTopicById(topicId);
await redis.setex(cacheKey, 300, JSON.stringify(topic));
return topic;
```

**Cache Invalidation**: Clear cache on topic updates/deletes.

## Testing

### Manual Testing Checklist

- [ ] **Valid request** with authenticated user → 200 OK
- [ ] **Invalid UUID** format → 400 Bad Request
- [ ] **Non-existent UUID** → 404 Not Found
- [ ] **No auth header** → 401 Unauthorized
- [ ] **Expired token** → 401 Unauthorized
- [ ] **Another user's topic** → 404 Not Found
- [ ] **Verify response fields** are complete and correctly typed
- [ ] **Verify timestamps** are ISO 8601 format
- [ ] **Verify LeetCode links** are properly formatted arrays

### Example Test Scenarios

#### Test 1: Happy Path

```bash
# Step 1: Generate topics to get a valid ID
RESPONSE=$(curl -s -X POST http://localhost:3000/api/topics/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technology":"React"}')

TOPIC_ID=$(echo $RESPONSE | jq -r '.data[0].id')

# Step 2: Retrieve the topic
curl -X GET http://localhost:3000/api/topics/$TOPIC_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with complete topic data
```

#### Test 2: Invalid UUID

```bash
curl -X GET http://localhost:3000/api/topics/invalid-uuid \
  -H "Authorization: Bearer $TOKEN"

# Expected: 400 Bad Request
# {
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Invalid topic ID format",
#     "details": [...]
#   }
# }
```

#### Test 3: Non-existent Topic

```bash
curl -X GET http://localhost:3000/api/topics/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN"

# Expected: 404 Not Found
# {
#   "error": {
#     "code": "NOT_FOUND",
#     "message": "Topic not found"
#   }
# }
```

#### Test 4: No Authentication

```bash
curl -X GET http://localhost:3000/api/topics/550e8400-e29b-41d4-a716-446655440000

# Expected: 401 Unauthorized
# {
#   "error": {
#     "code": "AUTHENTICATION_ERROR",
#     "message": "Missing or invalid authentication token"
#   }
# }
```

#### Test 5: Cross-User Access (Security)

```bash
# User A creates a topic
USER_A_TOKEN="token_for_user_a"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/topics/generate \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technology":"React"}')

TOPIC_ID=$(echo $RESPONSE | jq -r '.data[0].id')

# User B tries to access User A's topic
USER_B_TOKEN="token_for_user_b"
curl -X GET http://localhost:3000/api/topics/$TOPIC_ID \
  -H "Authorization: Bearer $USER_B_TOKEN"

# Expected: 404 Not Found (RLS blocks access, same as non-existent)
```

### Integration Testing

```typescript
describe("GET /api/topics/:id", () => {
  let authToken: string;
  let topicId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    authToken = await createTestUser();

    // Create a test topic
    const response = await createTestTopic(authToken);
    topicId = response.data[0].id;
  });

  it("should return topic when authenticated user requests their own topic", async () => {
    const response = await fetch(`/api/topics/${topicId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    const topic = await response.json();
    expect(topic.id).toBe(topicId);
    expect(topic.title).toBeDefined();
  });

  it("should return 400 for invalid UUID format", async () => {
    const response = await fetch("/api/topics/invalid-uuid", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 for non-existent topic", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await fetch(`/api/topics/${fakeId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(404);
  });

  it("should return 401 without authentication", async () => {
    const response = await fetch(`/api/topics/${topicId}`);
    expect(response.status).toBe(401);
  });
});
```

## Performance

### Optimization

- **Already Optimal**: Primary key lookups are O(log n)
- **Indexed**: Both `id` (primary key) and `user_id` are indexed
- **Fast**: Expected query time <10ms
- **Scalable**: Horizontal scaling supported (stateless)

### Monitoring

Track these metrics:

- Request count by status code
- Response time (p50, p95, p99)
- 404 rate (potential security scanning)
- Cache hit rate (if caching implemented)

## Troubleshooting

### Common Issues

**Issue: 404 - Topic not found**

- **Cause**: Topic deleted or never existed
- **Solution**: Verify topic ID is correct; refresh topic list

**Issue: 401 - Unauthorized**

- **Cause**: Token expired or invalid
- **Solution**: Refresh authentication token

**Issue: Slow responses**

- **Cause**: Database connection issues or network latency
- **Solution**: Check database status; consider adding caching

**Issue: UUID validation fails**

- **Cause**: UUID not in correct format
- **Solution**: Validate UUID format client-side before request

## Related Endpoints

- `GET /api/topics` - List all topics (with filtering/pagination)
- `POST /api/topics/generate` - Generate AI-powered topics
- `PUT /api/topics/:id` - Update topic (future)
- `DELETE /api/topics/:id` - Delete topic (future)
- `GET /api/topics/:id/children` - Get topic children (future)

## Related Documentation

- [Implementation Plan](.ai/get-topic-implementation-plan.md)
- [API Specification](.ai/api-plan.md)
- [Database Schema](.ai/db-plan.md)
- [Generate Topics API](.ai/api-generate-topics.md)
- [List Topics API](.ai/list-topics-implementation-plan.md)
- [PRD](.ai/prd.md)
