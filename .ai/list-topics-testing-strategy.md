# Testing Strategy: GET /api/topics Endpoint

## Overview

This document outlines a comprehensive testing strategy for the `GET /api/topics` endpoint, covering all functionality including authentication, validation, filtering, sorting, and pagination.

## Testing Pyramid

```
                    /\
                   /  \
                  / E2E \           - Full user flow tests
                 /______\
                /        \
               / Integration \      - API endpoint tests
              /______________\
             /                \
            /   Unit Tests     \   - Service & validator tests
           /____________________\
```

## 1. Unit Tests

### 1.1 Validator Tests (`topic.validators.ts`)

**Test Suite**: `ListTopicsQuerySchema`

#### Valid Input Tests

| Test Case               | Input                                                           | Expected                                                    |
| ----------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| All defaults            | `{}`                                                            | `{ sort: "created_at", order: "desc", page: 1, limit: 50 }` |
| Valid status filter     | `{ status: "in_progress" }`                                     | Passes validation                                           |
| Valid technology filter | `{ technology: "React" }`                                       | Passes validation                                           |
| Valid parent_id (UUID)  | `{ parent_id: "valid-uuid" }`                                   | Passes validation                                           |
| Valid parent_id (null)  | `{ parent_id: "null" }`                                         | Passes validation                                           |
| Custom pagination       | `{ page: 2, limit: 25 }`                                        | Passes validation                                           |
| All sort fields         | `{ sort: "title" \| "status" \| "created_at" \| "updated_at" }` | Passes validation                                           |
| Both orders             | `{ order: "asc" \| "desc" }`                                    | Passes validation                                           |

#### Invalid Input Tests

| Test Case              | Input                         | Expected Error                                               |
| ---------------------- | ----------------------------- | ------------------------------------------------------------ |
| Invalid status         | `{ status: "invalid" }`       | "Status must be one of: to_do, in_progress, completed"       |
| Empty technology       | `{ technology: "" }`          | "Technology must not be empty"                               |
| Invalid parent_id UUID | `{ parent_id: "not-a-uuid" }` | "Parent ID must be a valid UUID"                             |
| Invalid sort field     | `{ sort: "invalid" }`         | "Sort must be one of: created_at, updated_at, title, status" |
| Invalid order          | `{ order: "invalid" }`        | "Order must be either asc or desc"                           |
| Page < 1               | `{ page: 0 }`                 | "Page must be at least 1"                                    |
| Negative page          | `{ page: -1 }`                | "Page must be at least 1"                                    |
| Limit < 1              | `{ limit: 0 }`                | "Limit must be at least 1"                                   |
| Limit > 100            | `{ limit: 101 }`              | "Limit must not exceed 100"                                  |
| Non-integer page       | `{ page: 1.5 }`               | "Page must be an integer"                                    |
| Non-integer limit      | `{ limit: 50.7 }`             | "Limit must be an integer"                                   |
| Non-number page        | `{ page: "abc" }`             | "Page must be a number"                                      |
| Non-number limit       | `{ limit: "xyz" }`            | "Limit must be a number"                                     |

### 1.2 Service Tests (`topic.service.ts`)

**Test Suite**: `listUserTopics`

#### Success Scenarios

| Test Case                | Setup                 | Expected Behavior                                     |
| ------------------------ | --------------------- | ----------------------------------------------------- |
| Empty result set         | User with no topics   | Returns `{ data: [], pagination: { total: 0, ... } }` |
| Single page result       | 10 topics, limit 50   | Returns all topics, pagination shows page 1 of 1      |
| Multiple pages           | 75 topics, limit 50   | Page 1 returns 50, page 2 returns 25                  |
| Accurate children count  | Topic with 3 children | `children_count: 3`                                   |
| Topic with no children   | Root topic            | `children_count: 0`                                   |
| LeetCode links transform | Topic with links      | Array of `LeetCodeLink` objects                       |
| Empty LeetCode links     | Topic with `[]`       | Returns empty array                                   |

#### Filtering Tests

| Test Case            | Setup                               | Filter                                 | Expected                        |
| -------------------- | ----------------------------------- | -------------------------------------- | ------------------------------- |
| Filter by status     | 5 to_do, 3 in_progress, 2 completed | `status: "in_progress"`                | Returns 3 topics                |
| Filter by technology | 4 React, 3 Python                   | `technology: "React"`                  | Returns 4 topics                |
| Filter by parent_id  | Root + children                     | `parent_id: {uuid}`                    | Returns only children           |
| Filter root topics   | Root + children                     | `parent_id: "null"`                    | Returns only root topics        |
| Combined filters     | Various                             | `status: "to_do", technology: "React"` | Returns intersection            |
| No matches           | Various                             | Non-existent values                    | Returns empty array (not error) |

#### Sorting Tests

| Test Case                         | Setup                | Sort Params                         | Expected Order                              |
| --------------------------------- | -------------------- | ----------------------------------- | ------------------------------------------- |
| Sort by created_at desc (default) | Random order         | Default                             | Newest first                                |
| Sort by created_at asc            | Random order         | `sort: "created_at", order: "asc"`  | Oldest first                                |
| Sort by updated_at desc           | Various update times | `sort: "updated_at", order: "desc"` | Recently updated first                      |
| Sort by title asc                 | "Z", "A", "M"        | `sort: "title", order: "asc"`       | A, M, Z                                     |
| Sort by title desc                | "Z", "A", "M"        | `sort: "title", order: "desc"`      | Z, M, A                                     |
| Sort by status                    | Mixed statuses       | `sort: "status"`                    | Alphabetical: completed, in_progress, to_do |

#### Pagination Tests

| Test Case         | Setup      | Params               | Expected                            |
| ----------------- | ---------- | -------------------- | ----------------------------------- |
| First page        | 100 topics | `page: 1, limit: 50` | Topics 1-50, total: 100, pages: 2   |
| Second page       | 100 topics | `page: 2, limit: 50` | Topics 51-100, total: 100, pages: 2 |
| Last page partial | 75 topics  | `page: 2, limit: 50` | Topics 51-75 (25 items), pages: 2   |
| Beyond last page  | 50 topics  | `page: 3, limit: 50` | Empty array, total: 50, pages: 1    |
| Custom limit      | 100 topics | `limit: 25`          | 25 topics, pages: 4                 |
| Max limit         | 150 topics | `limit: 100`         | 100 topics, pages: 2                |

#### Error Scenarios

| Test Case            | Setup                   | Expected Error                                         |
| -------------------- | ----------------------- | ------------------------------------------------------ |
| Database count error | Mock count failure      | TopicServiceError(500, "Failed to retrieve topics")    |
| Database data error  | Mock data fetch failure | TopicServiceError(500, "Failed to retrieve topics")    |
| Unexpected error     | Throw Error             | TopicServiceError(500, "An unexpected error occurred") |

## 2. Integration Tests

### 2.1 API Endpoint Tests

**Test Suite**: `GET /api/topics`

#### Authentication Tests

| Test Case          | Setup                                | Expected Response          |
| ------------------ | ------------------------------------ | -------------------------- |
| No auth token      | Request without Authorization header | `401 AUTHENTICATION_ERROR` |
| Invalid auth token | Request with malformed token         | `401 AUTHENTICATION_ERROR` |
| Expired auth token | Request with expired JWT             | `401 AUTHENTICATION_ERROR` |
| Valid auth token   | Request with valid JWT               | `200 OK` with topics       |

#### Query Parameter Validation Tests

| Test Case                  | Query String             | Expected Response                                  |
| -------------------------- | ------------------------ | -------------------------------------------------- |
| Invalid status enum        | `?status=invalid`        | `400 VALIDATION_ERROR` with field details          |
| Invalid parent_id format   | `?parent_id=not-uuid`    | `400 VALIDATION_ERROR`                             |
| Limit too high             | `?limit=101`             | `400 VALIDATION_ERROR`                             |
| Negative page              | `?page=-1`               | `400 VALIDATION_ERROR`                             |
| Multiple validation errors | `?status=invalid&page=0` | `400 VALIDATION_ERROR` with multiple field details |

#### Functional Tests

| Test Case             | Setup                    | Request                                | Expected                 |
| --------------------- | ------------------------ | -------------------------------------- | ------------------------ |
| Get all topics        | User with 5 topics       | `GET /api/topics`                      | Returns all 5 topics     |
| Filter by status      | 3 completed, 2 to_do     | `GET /api/topics?status=completed`     | Returns 3 topics         |
| Filter by technology  | 2 React, 3 Python        | `GET /api/topics?technology=React`     | Returns 2 topics         |
| Get root topics only  | Mix of root and children | `GET /api/topics?parent_id=null`       | Returns only root topics |
| Get children of topic | Root with 2 children     | `GET /api/topics?parent_id={uuid}`     | Returns 2 children       |
| Sort by title         | Unsorted topics          | `GET /api/topics?sort=title&order=asc` | Returns alphabetically   |
| Pagination page 1     | 75 topics                | `GET /api/topics?limit=50&page=1`      | Returns first 50         |
| Pagination page 2     | 75 topics                | `GET /api/topics?limit=50&page=2`      | Returns remaining 25     |

#### Data Isolation Tests (Critical Security Tests)

| Test Case                       | Setup                                | Request                                            | Expected                    |
| ------------------------------- | ------------------------------------ | -------------------------------------------------- | --------------------------- |
| User A sees only own topics     | User A has 5, User B has 3           | User A: `GET /api/topics`                          | Returns 5 topics (User A's) |
| User B sees only own topics     | User A has 5, User B has 3           | User B: `GET /api/topics`                          | Returns 3 topics (User B's) |
| Filter doesn't bypass isolation | User A filters by User B's parent_id | User A: `GET /api/topics?parent_id={user_b_topic}` | Returns empty array         |
| Technology filter respects user | Both users have React topics         | User A: `GET /api/topics?technology=React`         | Only User A's React topics  |

#### Response Format Tests

| Test Case              | Expected Response Structure                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| Success response       | `{ data: TopicListItemDTO[], pagination: PaginationMetadata }`               |
| Empty result           | `{ data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } }` |
| Children count present | Each topic has `children_count` field                                        |
| LeetCode links typed   | `leetcode_links` is array of objects with title, url, difficulty             |
| Timestamps formatted   | ISO 8601 format (e.g., "2025-11-15T10:00:00Z")                               |

## 3. Performance Tests

### 3.1 Response Time Tests

| Test Case                      | Setup                      | Acceptable Response Time |
| ------------------------------ | -------------------------- | ------------------------ |
| Small dataset (< 50 topics)    | 20 topics                  | < 100ms                  |
| Medium dataset (50-500 topics) | 200 topics                 | < 250ms                  |
| Large dataset (> 500 topics)   | 1000 topics                | < 500ms                  |
| Complex filters                | Multiple filters + sorting | < 500ms                  |
| Deep pagination                | Page 20+                   | < 500ms                  |

### 3.2 Load Tests

| Test Case           | Load                     | Expected Behavior                  |
| ------------------- | ------------------------ | ---------------------------------- |
| Concurrent requests | 100 concurrent users     | All requests complete successfully |
| Sustained load      | 50 req/s for 1 minute    | No degradation, no errors          |
| Spike test          | Sudden jump to 200 req/s | System remains stable              |

### 3.3 Index Effectiveness Tests

Run `EXPLAIN ANALYZE` on queries to verify:

- [x] Queries use indexes (not sequential scans)
- [x] Index scans on `user_id` are efficient
- [x] Composite indexes used for filtered queries
- [x] Sorting uses indexes when available

## 4. End-to-End Tests

### User Scenarios

| Scenario              | Steps                                             | Expected Outcome            |
| --------------------- | ------------------------------------------------- | --------------------------- |
| View dashboard topics | 1. Login<br>2. GET /api/topics                    | See personal topics list    |
| Filter by progress    | 1. Login<br>2. GET /api/topics?status=in_progress | See only in-progress topics |
| Browse by technology  | 1. Login<br>2. GET /api/topics?technology=React   | See only React topics       |
| Navigate hierarchy    | 1. GET root topics<br>2. GET children of root     | See hierarchical structure  |
| Paginate large list   | 1. GET page 1<br>2. GET page 2                    | Navigate through pages      |

## 5. Edge Cases & Boundary Tests

| Test Case                        | Input                                 | Expected Behavior                     |
| -------------------------------- | ------------------------------------- | ------------------------------------- |
| Exact page boundary              | 50 topics, limit 50                   | Page 1 full, page 2 empty             |
| Unicode in title                 | Topics with emoji, Chinese characters | Sorted correctly                      |
| Very long technology names       | 500+ character technology             | Handles without truncation            |
| Deeply nested topics             | 5+ levels of hierarchy                | children_count accurate at each level |
| Orphaned topics (parent deleted) | Parent deleted, cascade works         | Children also deleted                 |
| Empty LeetCode links vs null     | Both `[]` and `null` in DB            | Both return `[]`                      |
| Future timestamps                | created_at in future (clock skew)     | Still returns and sorts correctly     |

## 6. Security Tests

### Authentication & Authorization

| Test Case                           | Method                                 | Expected                  |
| ----------------------------------- | -------------------------------------- | ------------------------- |
| Missing token                       | No Authorization header                | 401 error                 |
| Malformed token                     | Invalid JWT format                     | 401 error                 |
| Token from different system         | Valid JWT, wrong issuer                | 401 error                 |
| Attempt to access other user's data | Query with parent_id from another user | Empty result (RLS blocks) |

### Input Validation

| Test Case               | Input                                   | Expected                                 |
| ----------------------- | --------------------------------------- | ---------------------------------------- |
| SQL injection attempt   | `?technology='; DROP TABLE topics;--`   | 400 validation error (or safely escaped) |
| XSS attempt in query    | `?technology=<script>alert(1)</script>` | Safely handled, no script execution      |
| Extremely large numbers | `?limit=999999999999`                   | 400 validation error                     |
| Negative numbers        | `?page=-999`                            | 400 validation error                     |

## 7. Test Environment Setup

### Prerequisites

1. **Test Database**: Separate Supabase project or local instance
2. **Test Users**: At least 2 test users with known credentials
3. **Test Data**: Seed script to create predictable test topics
4. **Mocking**: Supabase client mocks for unit tests

### Test Data Fixtures

Create seed data for:

- User A: 50 topics across multiple technologies and statuses
- User B: 30 topics with hierarchical structure
- User C: Empty (no topics)
- Topics with all status values
- Topics with and without LeetCode links
- Root topics and children at multiple levels

## 8. Continuous Integration

### CI Pipeline Tests

```yaml
steps:
  - name: Unit Tests
    run: npm run test:unit

  - name: Integration Tests
    run: npm run test:integration
    env:
      SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}

  - name: E2E Tests
    run: npm run test:e2e

  - name: Lint
    run: npm run lint
```

### Test Coverage Goals

- **Unit Tests**: > 90% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user flows

## 9. Testing Tools

### Recommended Tools

- **Unit Tests**: Jest or Vitest
- **API Tests**: Supertest or Vitest with fetch
- **E2E Tests**: Playwright or Cypress
- **Mocking**: Vitest mocks or Jest mocks
- **Load Testing**: k6 or Artillery
- **SQL Analysis**: PostgreSQL EXPLAIN ANALYZE

### Example Test Structure

```typescript
// Unit test example
describe("ListTopicsQuerySchema", () => {
  it("should apply default values", () => {
    const result = ListTopicsQuerySchema.parse({});
    expect(result).toEqual({
      sort: "created_at",
      order: "desc",
      page: 1,
      limit: 50,
    });
  });

  it("should reject invalid status", () => {
    expect(() => {
      ListTopicsQuerySchema.parse({ status: "invalid" });
    }).toThrow("Status must be one of: to_do, in_progress, completed");
  });
});

// Integration test example
describe("GET /api/topics", () => {
  it("should return 401 without authentication", async () => {
    const response = await fetch("/api/topics");
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("AUTHENTICATION_ERROR");
  });

  it("should return user topics with pagination", async () => {
    const response = await fetch("/api/topics", {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.pagination).toHaveProperty("total");
  });
});
```

## 10. Test Execution Plan

### Phase 1: Development (Current)

- [ ] Write and pass all unit tests
- [ ] Manual testing with Postman/Insomnia
- [ ] Verify RLS policies manually in Supabase

### Phase 2: Pre-Production

- [ ] Write and pass integration tests
- [ ] Run performance benchmarks
- [ ] Test with realistic data volumes

### Phase 3: Production Readiness

- [ ] Complete E2E test suite
- [ ] Load testing with production-like traffic
- [ ] Security audit and penetration testing

## Summary

This comprehensive testing strategy ensures the `GET /api/topics` endpoint is:

- ✅ Functionally correct
- ✅ Secure and isolated per user
- ✅ Performant under load
- ✅ Properly validated
- ✅ Resilient to edge cases
- ✅ Production-ready

**Priority**: Focus on authentication, data isolation, and validation tests first, as these are critical for security and correctness.
