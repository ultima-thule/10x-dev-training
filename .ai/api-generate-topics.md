# API Documentation: Generate Topics Endpoint

## Overview

The Generate Topics endpoint uses AI to create personalized learning topics based on user profile and selected technology. It integrates with OpenRouter.ai to generate contextually appropriate topics tailored to the user's experience level and time away from development.

## Endpoint Details

- **URL**: `/api/topics/generate`
- **Method**: `POST`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: `application/json`

## Request

### Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Body

```json
{
  "technology": "React",
  "parent_id": "550e8400-e29b-41d4-a716-446655440000"  // optional
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `technology` | string | Yes | Technology/framework/language name (1-100 chars, alphanumeric + spaces, dots, hyphens, underscores) |
| `parent_id` | string \| null | No | UUID of parent topic for generating subtopics. If null/omitted, generates root-level topics |

#### Validation Rules

**`technology`**:
- Required field
- Length: 1-100 characters
- Allowed characters: alphanumeric, spaces, dots (.), hyphens (-), underscores (_)
- Pattern: `^[a-zA-Z0-9\s.\-_]+$`
- Examples: "React", "Node.js", "Python 3.x", "PostgreSQL"

**`parent_id`**:
- Optional field
- Must be valid UUID format if provided
- Must reference existing topic owned by authenticated user
- Use for generating subtopics related to parent topic

### Example Requests

**Generate root-level topics:**
```bash
curl -X POST http://localhost:3000/api/topics/generate \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "technology": "React"
  }'
```

**Generate subtopics:**
```bash
curl -X POST http://localhost:3000/api/topics/generate \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "technology": "React",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## Response

### Success Response (201 Created)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "789e0123-e89b-12d3-a456-426614174111",
      "parent_id": null,
      "title": "React Fundamentals",
      "description": "Core concepts of React including components, props, and state management. Learn about JSX syntax, component lifecycle, and basic hooks.",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [
        {
          "title": "Implement React Component",
          "url": "https://leetcode.com/problems/example/",
          "difficulty": "Easy"
        }
      ],
      "created_at": "2025-11-15T10:00:00.000Z",
      "updated_at": "2025-11-15T10:00:00.000Z"
    },
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
      "user_id": "789e0123-e89b-12d3-a456-426614174111",
      "parent_id": null,
      "title": "Advanced React Patterns",
      "description": "Deep dive into advanced patterns including compound components, render props, HOCs, and custom hooks for reusable logic.",
      "status": "to_do",
      "technology": "React",
      "leetcode_links": [
        {
          "title": "Design Pattern Implementation",
          "url": "https://leetcode.com/problems/design-pattern/",
          "difficulty": "Medium"
        }
      ],
      "created_at": "2025-11-15T10:00:01.000Z",
      "updated_at": "2025-11-15T10:00:01.000Z"
    }
  ],
  "count": 2
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data` | Array<TopicDTO> | Array of generated topics (3-10 topics) |
| `count` | number | Number of topics generated |

**TopicDTO fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique topic identifier |
| `user_id` | string (UUID) | User who owns the topic |
| `parent_id` | string (UUID) \| null | Parent topic ID if subtopic, null for root topics |
| `title` | string | Topic title (max 200 chars) |
| `description` | string | Detailed description (max 1000 chars) |
| `status` | enum | Topic status: `"to_do"`, `"in_progress"`, or `"completed"` |
| `technology` | string | Technology name from request |
| `leetcode_links` | Array<LeetCodeLink> | Array of related LeetCode problems (0-3 per topic) |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |

**LeetCodeLink fields:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Problem title |
| `url` | string (URL) | LeetCode problem URL |
| `difficulty` | enum | Problem difficulty: `"Easy"`, `"Medium"`, or `"Hard"` |

### Error Responses

#### 400 Bad Request

**Scenario: Missing or invalid parameters**

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

**Common validation errors:**
- Missing `technology` field
- `technology` contains invalid characters
- `technology` exceeds 100 characters
- `parent_id` is not a valid UUID
- Invalid JSON in request body

#### 401 Unauthorized

**Scenario: Missing or invalid authentication**

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authentication token"
  }
}
```

**Causes:**
- No `Authorization` header provided
- Invalid JWT token
- Expired JWT token

#### 404 Not Found

**Scenario 1: User profile not found**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User profile not found. Please create a profile first."
  }
}
```

**Scenario 2: Parent topic not found**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Parent topic not found or does not belong to user"
  }
}
```

#### 429 Too Many Requests

**Scenario: Rate limit exceeded**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "AI generation rate limit exceeded. Please try again in 60 seconds."
  }
}
```

**Headers:**
```
Retry-After: 60
```

**Rate limits:**
- Default: 5 requests per hour per user
- Configurable via `AI_RATE_LIMIT_PER_HOUR` environment variable
- Uses sliding window (resets 1 hour after first request)

#### 500 Internal Server Error

**Scenario 1: Database operation failed**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to generate topics"
  }
}
```

**Scenario 2: AI service returned invalid data**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "AI service returned invalid response"
  }
}
```

#### 503 Service Unavailable

**Scenario 1: AI service timeout**

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service request timed out. Please try again."
  }
}
```

**Scenario 2: AI service unreachable**

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## How It Works

### Flow Diagram

```
1. Client Request
   ↓
2. Authentication Check (JWT)
   ↓
3. Input Validation (Zod)
   ↓
4. Rate Limit Check (5/hour)
   ↓
5. Fetch User Profile (experience_level, years_away)
   ↓
6. Validate Parent Topic (if parent_id provided)
   ↓
7. Build AI Context
   ↓
8. Call OpenRouter.ai (GPT-3.5 or Claude)
   ↓
9. Validate AI Response
   ↓
10. Insert Topics into Database
   ↓
11. Return Created Topics (201)
```

### AI Personalization

The AI generates topics based on:

1. **Technology**: The framework/language specified in request
2. **Experience Level**: From user profile (`junior`, `mid`, `senior`)
   - Junior: Focuses on fundamentals, syntax, basic patterns
   - Mid: Includes design patterns, best practices, common pitfalls
   - Senior: Emphasizes architecture, advanced patterns, performance
3. **Years Away**: Time away from development (0-60 years)
   - More years → more foundational topics
   - Fewer years → more refresher-focused topics
4. **Parent Topic**: If generating subtopics, focuses on the parent's domain

### Generated Topics

- **Quantity**: 3-5 topics per request
- **Status**: All created with `"to_do"` status
- **Ownership**: Automatically assigned to authenticated user
- **LeetCode Links**: 0-3 relevant coding problems per topic
- **Hierarchy**: Support for parent-child relationships via `parent_id`

## Configuration

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_api_key_here

# Optional (with defaults)
OPENROUTER_MODEL=openai/gpt-3.5-turbo
AI_GENERATION_TIMEOUT=30000
AI_RATE_LIMIT_PER_HOUR=5
```

**Model Options:**
- `openai/gpt-3.5-turbo` (default, fast and cost-effective)
- `openai/gpt-4` (more accurate, slower, more expensive)
- `anthropic/claude-3-sonnet` (balanced performance)
- `anthropic/claude-3-opus` (highest quality)

See [OpenRouter.ai models](https://openrouter.ai/models) for full list.

## Best Practices

### Client-Side

1. **Show loading state**: AI generation takes 5-30 seconds
2. **Handle rate limits**: Display countdown timer for 429 responses
3. **Retry on 503**: Implement exponential backoff for service unavailable
4. **Profile check**: Ensure user has profile before allowing generation
5. **Cache topics**: Don't regenerate unnecessarily

### Error Handling

```typescript
try {
  const response = await fetch('/api/topics/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ technology: 'React' })
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    
    throw new Error(error.error.message);
  }

  const data = await response.json();
  console.log(`Generated ${data.count} topics`);
} catch (error) {
  console.error('Failed to generate topics:', error);
}
```

## Performance

- **Typical response time**: 5-15 seconds (AI generation)
- **Maximum timeout**: 30 seconds (configurable)
- **Rate limit**: 5 requests/hour/user (configurable)
- **Database operations**: Optimized with batch insert

## Security

- ✅ JWT authentication required
- ✅ Row Level Security (RLS) enforces user data isolation
- ✅ Input validation with strict regex patterns
- ✅ Rate limiting prevents abuse
- ✅ API key stored server-side only
- ✅ Parent topic ownership verified

## Testing

### Manual Testing Checklist

- [ ] Valid request with authentication → 201 Created
- [ ] Request without auth header → 401 Unauthorized
- [ ] Request with expired token → 401 Unauthorized
- [ ] Missing technology parameter → 400 Bad Request
- [ ] Invalid technology format → 400 Bad Request
- [ ] Invalid parent_id UUID → 400 Bad Request
- [ ] Non-existent parent_id → 404 Not Found
- [ ] Another user's parent_id → 404 Not Found
- [ ] User without profile → 404 Not Found
- [ ] 6 requests in 1 hour → 429 Too Many Requests
- [ ] Verify topics saved to database
- [ ] Verify parent_id correctly set
- [ ] Verify LeetCode links are valid URLs

### Example Test Cases

See implementation plan for detailed test scenarios:
- `.ai/generate-topics-implementation-plan.md` (Phase 7)

## Troubleshooting

### Common Issues

**Issue: 404 - Profile not found**
- Solution: Create user profile first using profile creation endpoint

**Issue: 503 - AI service unavailable**
- Cause: OpenRouter API key invalid or quota exceeded
- Solution: Check API key and account status at OpenRouter.ai

**Issue: Slow responses**
- Cause: GPT-4 model selected or complex prompts
- Solution: Use GPT-3.5-turbo for faster responses

**Issue: Rate limit hit during testing**
- Solution: Increase `AI_RATE_LIMIT_PER_HOUR` or wait for window reset

## Related Documentation

- [Implementation Plan](.ai/generate-topics-implementation-plan.md)
- [API Specification](.ai/api-plan.md)
- [Database Schema](.ai/db-plan.md)
- [PRD](.ai/prd.md)

