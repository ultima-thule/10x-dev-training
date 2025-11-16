# Product Requirements Document (PRD)

# Development Refresher Training Application

**Version:** 1.0  
**Date:** November 14, 2025  
**Status:** Approved for Development

---

## 1. Executive Summary

### 1.1 Product Vision

A web application that helps senior developers with 10+ year career gaps systematically refresh their programming skills through AI-generated learning topics and algorithm practice integration.

### 1.2 Product Name

Development Refresher Training

### 1.3 Target Launch

8-12 week development cycle with beta launch targeting 20-30 users for validation

---

## 2. Problem Statement

Senior developers who have been away from professional programming for 10+ years want to return to development roles but need structured guidance to:

- Identify knowledge gaps in modern programming practices
- Plan a systematic skills refresh strategy
- Track progress through their learning journey
- Practice algorithms relevant to technical interviews

Current solutions lack personalized, AI-driven topic generation that considers both the developer's technology choices and their learning history.

---

## 3. Target Audience

### 3.1 Primary User Persona

**Name:** Senior Developer Returner  
**Background:**

- 10+ years of professional development experience
- Career gap of 10+ years from programming
- Last worked with C++ and/or Python professionally
- Seeking to return to software development roles
- Self-motivated and comfortable with technical learning

**Needs:**

- Structured learning path for modern C++ (C++17/20/23) and Python 3
- Algorithm practice for technical interviews
- Progress tracking to stay motivated
- Self-paced learning without rigid schedules

---

## 4. Goals and Success Criteria

### 4.1 Business Goals

- Validate product-market fit with 20-30 beta users
- Establish baseline for freemium monetization model
- Build foundation for scalable SaaS product

### 4.2 Success Metrics

| Metric                        | Target                                 | Measurement Period  |
| ----------------------------- | -------------------------------------- | ------------------- |
| Monthly topic generation rate | 75% of users generate topics ≥1x/month | 60 days post-launch |
| Progress update engagement    | 90% of users update topic status       | 60 days post-launch |
| User retention                | 60% return after 30 days               | 60 days post-launch |
| Topic completion rate         | 40% of started topics completed        | 60 days post-launch |

### 4.3 User Goals

- Generate personalized learning topics based on C++ or Python
- Track learning progress from "not started" to "completed"
- Access curated algorithm problems for interview preparation
- Maintain flexibility in learning pace and focus areas

---

## 5. MVP Feature Set

### 5.1 Core Features (Must Have)

#### 5.1.1 User Authentication

- Email/password registration and login
- GitHub OAuth integration
- Password reset functionality
- No email verification (reduced friction)
- Secure session management via Supabase Auth

#### 5.1.2 AI-Powered Topic Generation

- Generate 5 topics per request using Anthropic Claude
- Technology selection: C++ and/or Python
- Optional context input (max 500 characters)
- Consider user's completed topics to avoid duplicates
- Regeneration capability with daily limits

#### 5.1.3 Topic Management (CRUD)

- Create: AI-generated or manual creation
- Read: View all topics with filtering and search
- Update: Edit topic details (title, description, estimated hours, difficulty)
- Update: Change status (not started → in progress → completed)
- Delete: Remove topics with confirmation dialog

#### 5.1.4 Topic Display and Organization

- Dashboard with overview statistics
- "In Progress" topics section
- "Suggested Next Steps" section
- All Topics page with comprehensive filtering
- Technology badges (C++/Python) on each topic

#### 5.1.5 LeetCode Integration

- Display 3-5 algorithm problems per topic
- Link directly to leetcode.com
- Show problem difficulty badges
- Focus on general algorithms, not language-specific

#### 5.1.6 Progress Tracking

- Three statuses: Not Started, In Progress, Completed
- Status change timestamps
- Completion statistics on dashboard
- Visual progress indicators

### 5.2 Secondary Features (Should Have)

#### 5.2.1 Filtering and Search

- Filter by technology (All/C++/Python)
- Filter by status (All/Not Started/In Progress/Completed)
- Text search by title and description
- Sort options: Recently Added, Recently Updated, Alphabetical, Estimated Hours

#### 5.2.2 Account Management

- View/edit profile information
- Delete account and all data
- Manage subscription status (free/premium)

---

## 6. Out of Scope for MVP

The following features are explicitly excluded from the MVP:

- Sharing topics between user accounts
- LeetCode progress synchronization
- Email reminders or notifications
- Onboarding wizard or tutorial flow
- Mobile native applications
- Collaborative features or social elements
- Pre-assessment skill testing
- Timeline or scheduling guidance
- Python 2 to Python 3 migration topics
- Custom learning paths or roadmaps
- Export functionality
- Progress analytics dashboard
- Third-party integrations beyond LeetCode

---

## 7. Technical Architecture

### 7.1 Technology Stack

**Frontend:**

- Astro 5 (SSR enabled)
- React 19 (for dynamic components)
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui components

**Backend:**

- Astro API routes (`/src/pages/api`)
- Supabase for database and authentication
- PostgreSQL (via Supabase)

**Third-Party Services:**

- Anthropic Claude 3.5 Sonnet (AI topic generation)
- LeetCode public API (problem data)
- Supabase Auth (authentication)
- Supabase Database (data storage)
- Supabase Edge Functions (API key security)

**Deployment:**

- Vercel (frontend/API hosting, free tier)
- Supabase Cloud (free tier: 50MB database, 2GB bandwidth)

### 7.2 System Architecture

```
┌─────────────────────────────────────────────────┐
│           Client (Browser)                       │
│  Astro Pages + React Islands + Tailwind UI      │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS
                 │
┌────────────────▼────────────────────────────────┐
│         Vercel (Hosting)                         │
│  ┌──────────────────────────────────────────┐  │
│  │  Astro SSR + API Routes                  │  │
│  │  - /api/topics (CRUD)                    │  │
│  │  - /api/generate (AI integration)        │  │
│  │  - /api/leetcode (fetch problems)        │  │
│  └───────────┬──────────────────────────────┘  │
└──────────────┼─────────────────────────────────┘
               │
               │
    ┌──────────┴──────────┐
    │                     │
    │                     │
┌───▼────────────┐  ┌────▼──────────────┐
│  Supabase      │  │  Anthropic        │
│  - Auth        │  │  Claude 3.5       │
│  - Database    │  │  (Topic Gen)      │
│  - RLS         │  └───────────────────┘
│  - Edge Funcs  │
└────────────────┘
```

### 7.3 Key Technical Decisions

| Decision         | Choice                      | Rationale                                                    |
| ---------------- | --------------------------- | ------------------------------------------------------------ |
| AI Provider      | Anthropic Claude 3.5 Sonnet | High-quality output, reasonable pricing, good developer docs |
| Authentication   | Supabase Auth               | Integrated with database, supports OAuth, handles security   |
| Database         | PostgreSQL (Supabase)       | Reliable, supports RLS, free tier sufficient for MVP         |
| Hosting          | Vercel                      | Excellent Astro support, automatic deployments, free tier    |
| API Key Security | Supabase Edge Functions     | Prevents API key exposure to frontend                        |

---

## 8. User Stories

### 8.1 Authentication Stories

**US-001:** As a new user, I want to create an account with email and password so I can start tracking my learning progress.

**US-002:** As a developer, I want to sign in with GitHub so I can quickly authenticate without creating a new account.

**US-003:** As a user who forgot my password, I want to reset it via email so I can regain access to my account.

### 8.2 Topic Generation Stories

**US-004:** As a C++ developer, I want to generate modern C++ learning topics so I can understand what has changed in the language since I last coded.

**US-005:** As a Python developer, I want to generate Python 3 learning topics so I can refresh my knowledge of the current ecosystem.

**US-006:** As a user learning both languages, I want to generate topics for C++ and Python simultaneously so I can refresh multiple skills.

**US-007:** As a user with specific interests, I want to provide optional context when generating topics so the AI can personalize recommendations.

**US-008:** As a user who doesn't like the generated topics, I want to regenerate them so I can get suggestions that better fit my needs.

### 8.3 Topic Management Stories

**US-009:** As a user, I want to view all my topics in one place so I can see my complete learning roadmap.

**US-010:** As a user, I want to mark a topic as "in progress" when I start studying it so I can track what I'm actively working on.

**US-011:** As a user, I want to mark a topic as "completed" when I finish it so I can see my progress over time.

**US-012:** As a user, I want to edit topic details so I can personalize the AI's suggestions to my learning style.

**US-013:** As a user, I want to delete topics I'm no longer interested in so I can keep my topic list focused.

**US-014:** As a user, I want to see LeetCode problems linked to each topic so I can practice relevant algorithms.

### 8.4 Dashboard Stories

**US-015:** As a user, I want to see a dashboard showing my progress statistics so I can stay motivated.

**US-016:** As a user, I want to see my "in progress" topics prominently so I can quickly resume my current learning.

**US-017:** As a user, I want suggested next steps so I know what to study after completing my current topics.

### 8.5 Discovery Stories

**US-018:** As a user, I want to filter topics by technology so I can focus on C++ or Python separately.

**US-019:** As a user, I want to filter topics by status so I can see only completed or in-progress topics.

**US-020:** As a user, I want to search my topics by title or description so I can quickly find specific content.

---

## 9. Functional Requirements

### 9.1 Authentication Requirements

**FR-001:** System shall support email/password registration with minimum 8 character password.

**FR-002:** System shall support GitHub OAuth login.

**FR-003:** System shall provide password reset via email link.

**FR-004:** System shall maintain secure session cookies with appropriate expiration.

**FR-005:** System shall not require email verification for MVP.

**FR-006:** System shall collect display name during registration.

### 9.2 Topic Generation Requirements

**FR-007:** System shall generate exactly 5 topics per AI request.

**FR-008:** System shall accept technology selection (C++, Python, or both).

**FR-009:** System shall accept optional context input (max 500 characters).

**FR-010:** System shall send user's completed topic history to AI for context.

**FR-011:** System shall enforce rate limits: 5 generations/day (free), 20 generations/day (premium).

**FR-012:** System shall display remaining daily generation count.

**FR-013:** Generated topics shall include: title, description (2-3 sentences), difficulty level (beginner/intermediate/advanced), estimated hours (2-8).

**FR-014:** Each generated topic shall include 3-5 LeetCode problem links with difficulty badges.

### 9.3 Topic CRUD Requirements

**FR-015:** System shall store topics with fields: id, user_id, technology, title, description, status, difficulty_level, estimated_hours, created_at, updated_at, completed_at, leetcode_problems (JSON).

**FR-016:** System shall allow users to edit topic fields: title, description, estimated_hours, difficulty_level.

**FR-017:** System shall allow users to change topic status: not_started → in_progress → completed.

**FR-018:** System shall timestamp status changes (created_at, updated_at, completed_at).

**FR-019:** System shall require confirmation before deleting topics.

**FR-020:** System shall permanently delete topics (hard delete, no soft delete).

**FR-021:** System shall enforce Row Level Security ensuring users can only access their own topics.

### 9.4 Dashboard Requirements

**FR-022:** Dashboard shall display: total topics count, in-progress count, completed count, completion rate percentage.

**FR-023:** Dashboard shall show "In Progress Topics" section with all active topics.

**FR-024:** Dashboard shall show "Suggested Next Steps" section with 3 not-started topics.

**FR-025:** Dashboard shall include prominent "Generate New Topics" CTA button.

### 9.5 All Topics Page Requirements

**FR-026:** All Topics page shall display all user topics as cards.

**FR-027:** System shall support filtering by technology: All, C++, Python.

**FR-028:** System shall support filtering by status: All, Not Started, In Progress, Completed.

**FR-029:** System shall support text search by title and description (client-side).

**FR-030:** System shall support sorting: Recently Added, Recently Updated, Alphabetical, Estimated Hours (Low to High).

**FR-031:** System shall display result count: "Showing X of Y topics".

### 9.6 LeetCode Integration Requirements

**FR-032:** System shall fetch LeetCode problems via public API.

**FR-033:** System shall store per topic: problem URL, title, difficulty.

**FR-034:** System shall display LeetCode problems in collapsible "Practice Problems" section.

**FR-035:** System shall open LeetCode problems in new tab when clicked.

**FR-036:** System shall not synchronize user's LeetCode completion status.

### 9.7 Account Management Requirements

**FR-037:** System shall allow users to view and edit profile information.

**FR-038:** System shall allow users to delete their account and all associated data.

**FR-039:** System shall display current subscription tier (free/premium).

### 9.8 Monetization Requirements

**FR-040:** Free tier shall allow: 10 topic generations/month, up to 20 active topics.

**FR-041:** Premium tier ($9.99/month) shall allow: unlimited generations, unlimited topics.

**FR-042:** System shall track generation count per user per month.

**FR-043:** System shall prevent topic generation when free tier limit is exceeded.

---

## 10. Non-Functional Requirements

### 10.1 Performance Requirements

**NFR-001:** Page load time shall be <2 seconds on 3G connection.

**NFR-002:** Topic generation API response shall be <30 seconds.

**NFR-003:** CRUD operations shall complete in <500ms.

**NFR-004:** System shall support up to 100 concurrent users without degradation.

**NFR-005:** Lighthouse scores shall achieve: >90 Performance, >95 Accessibility, >95 Best Practices, >90 SEO.

**NFR-006:** All async operations shall display loading skeletons or spinners.

### 10.2 Security Requirements

**NFR-007:** All connections shall use HTTPS exclusively.

**NFR-008:** API keys shall be stored in environment variables, never exposed to frontend.

**NFR-009:** Supabase Row Level Security policies shall prevent cross-user data access.

**NFR-010:** Passwords shall be hashed using Supabase Auth's bcrypt implementation.

**NFR-011:** Session tokens shall have appropriate expiration and rotation.

### 10.3 Privacy Requirements

**NFR-012:** System shall provide Privacy Policy page describing data usage.

**NFR-013:** System shall not share user data with third parties (except required service providers).

**NFR-014:** System shall allow users to delete all their data via account deletion.

**NFR-015:** System shall comply with GDPR data deletion requirements.

### 10.4 Reliability Requirements

**NFR-016:** System shall implement retry logic for Anthropic Claude API failures (1 automatic retry).

**NFR-017:** System shall display user-friendly error messages for all failure scenarios.

**NFR-018:** System shall log all errors to Supabase for monitoring.

**NFR-019:** System shall handle Claude API rate limits gracefully with clear user messaging.

**NFR-020:** System uptime target: 99% during business hours (MVP phase).

### 10.5 Usability Requirements

**NFR-021:** System shall be responsive across mobile (<640px), tablet (640-1024px), desktop (>1024px).

**NFR-022:** Mobile touch targets shall be minimum 44px for interactive elements.

**NFR-023:** System shall use mobile-first design approach.

**NFR-024:** Forms shall display inline validation errors.

**NFR-025:** Empty states shall provide clear guidance on next actions.

**NFR-026:** No onboarding wizard required - users can start immediately after registration.

### 10.6 Accessibility Requirements

**NFR-027:** System shall meet WCAG 2.1 Level AA standards.

**NFR-028:** All interactive elements shall be keyboard accessible.

**NFR-029:** Color contrast ratios shall meet accessibility standards.

**NFR-030:** Images and icons shall include appropriate alt text.

### 10.7 Scalability Requirements

**NFR-031:** Database design shall support 10,000+ users without schema changes.

**NFR-032:** API routes shall be stateless to enable horizontal scaling.

**NFR-033:** Vercel deployment shall use edge functions where appropriate.

---

## 11. Data Model

### 11.1 Database Schema

#### Users Table (managed by Supabase Auth)

```sql
-- Managed by Supabase Auth
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  display_name: text,
  created_at: timestamp,
  last_sign_in_at: timestamp
)
```

#### User Profiles Table

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  technologies text[] DEFAULT ARRAY[]::text[], -- ['cpp', 'python']
  subscription_tier text DEFAULT 'free', -- 'free' | 'premium'
  generation_count_current_month integer DEFAULT 0,
  generation_count_reset_date timestamp DEFAULT NOW(),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Review Topics Table

```sql
CREATE TABLE review_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  technology text NOT NULL, -- 'cpp' | 'python'
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  difficulty_level text NOT NULL, -- 'beginner' | 'intermediate' | 'advanced'
  estimated_hours integer NOT NULL,
  leetcode_problems jsonb DEFAULT '[]'::jsonb, -- [{ url, title, difficulty }]
  is_ai_generated boolean DEFAULT true,
  was_edited boolean DEFAULT false,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  completed_at timestamp NULL
);

-- Indexes
CREATE INDEX idx_review_topics_user_id ON review_topics(user_id);
CREATE INDEX idx_review_topics_status ON review_topics(status);
CREATE INDEX idx_review_topics_technology ON review_topics(technology);

-- RLS Policies
ALTER TABLE review_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topics"
  ON review_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics"
  ON review_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics"
  ON review_topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics"
  ON review_topics FOR DELETE
  USING (auth.uid() = user_id);
```

#### Analytics Events Table

```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'generate_topics' | 'update_status' | 'create_topic' | 'delete_topic'
  event_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT NOW()
);

-- Index
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);
```

### 11.2 TypeScript Types

```typescript
// src/types.ts

export type Technology = "cpp" | "python";

export type TopicStatus = "not_started" | "in_progress" | "completed";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type SubscriptionTier = "free" | "premium";

export interface LeetCodeProblem {
  url: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface ReviewTopic {
  id: string;
  user_id: string;
  technology: Technology;
  title: string;
  description: string;
  status: TopicStatus;
  difficulty_level: DifficultyLevel;
  estimated_hours: number;
  leetcode_problems: LeetCodeProblem[];
  is_ai_generated: boolean;
  was_edited: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface UserProfile {
  id: string;
  technologies: Technology[];
  subscription_tier: SubscriptionTier;
  generation_count_current_month: number;
  generation_count_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: "generate_topics" | "update_status" | "create_topic" | "delete_topic";
  event_metadata: Record<string, any>;
  created_at: string;
}

// DTOs for API requests/responses
export interface GenerateTopicsRequest {
  technology: Technology;
  context?: string;
  consider_history: boolean;
}

export interface GenerateTopicsResponse {
  topics: Omit<ReviewTopic, "id" | "user_id" | "created_at" | "updated_at" | "completed_at">[];
  remaining_generations: number;
}

export interface UpdateTopicStatusRequest {
  status: TopicStatus;
}

export interface CreateTopicRequest {
  technology: Technology;
  title: string;
  description: string;
  difficulty_level: DifficultyLevel;
  estimated_hours: number;
  leetcode_problems?: LeetCodeProblem[];
}

export interface UpdateTopicRequest {
  title?: string;
  description?: string;
  difficulty_level?: DifficultyLevel;
  estimated_hours?: number;
  leetcode_problems?: LeetCodeProblem[];
}
```

---

## 12. API Specifications

### 12.1 Authentication Endpoints

All authentication handled by Supabase Auth:

- `POST /auth/signup` - Create account
- `POST /auth/login` - Email/password login
- `POST /auth/oauth/github` - GitHub OAuth
- `POST /auth/reset-password` - Request password reset
- `POST /auth/logout` - End session

### 12.2 Topic Generation Endpoints

#### Generate Topics

```
POST /api/topics/generate

Request:
{
  "technology": "cpp" | "python",
  "context": "optional string max 500 chars",
  "consider_history": boolean
}

Response 200:
{
  "topics": [
    {
      "technology": "cpp",
      "title": "Modern C++ Memory Management",
      "description": "Learn about smart pointers, RAII, and move semantics...",
      "difficulty_level": "intermediate",
      "estimated_hours": 6,
      "leetcode_problems": [
        { "url": "https://leetcode.com/problems/...", "title": "...", "difficulty": "Medium" }
      ]
    }
  ],
  "remaining_generations": 4
}

Response 429:
{
  "error": "Daily generation limit exceeded. Upgrade to premium for unlimited generations."
}

Response 500:
{
  "error": "AI service temporarily unavailable. Please try again."
}
```

### 12.3 Topic CRUD Endpoints

#### Get All Topics

```
GET /api/topics

Response 200:
{
  "topics": ReviewTopic[]
}
```

#### Get Single Topic

```
GET /api/topics/:id

Response 200:
{
  "topic": ReviewTopic
}

Response 404:
{
  "error": "Topic not found"
}
```

#### Create Topic (Manual)

```
POST /api/topics

Request:
{
  "technology": "cpp" | "python",
  "title": "string",
  "description": "string",
  "difficulty_level": "beginner" | "intermediate" | "advanced",
  "estimated_hours": number,
  "leetcode_problems": LeetCodeProblem[]
}

Response 201:
{
  "topic": ReviewTopic
}
```

#### Update Topic

```
PATCH /api/topics/:id

Request:
{
  "title"?: "string",
  "description"?: "string",
  "difficulty_level"?: "beginner" | "intermediate" | "advanced",
  "estimated_hours"?: number,
  "leetcode_problems"?: LeetCodeProblem[]
}

Response 200:
{
  "topic": ReviewTopic
}
```

#### Update Topic Status

```
PATCH /api/topics/:id/status

Request:
{
  "status": "not_started" | "in_progress" | "completed"
}

Response 200:
{
  "topic": ReviewTopic
}
```

#### Delete Topic

```
DELETE /api/topics/:id

Response 204:
No content
```

### 12.4 User Profile Endpoints

#### Get User Profile

```
GET /api/profile

Response 200:
{
  "profile": UserProfile
}
```

#### Update User Profile

```
PATCH /api/profile

Request:
{
  "technologies"?: Technology[],
  "display_name"?: string
}

Response 200:
{
  "profile": UserProfile
}
```

#### Delete Account

```
DELETE /api/profile

Response 204:
No content
```

### 12.5 Analytics Endpoints

#### Get Dashboard Stats

```
GET /api/analytics/dashboard

Response 200:
{
  "total_topics": number,
  "in_progress_count": number,
  "completed_count": number,
  "completion_rate": number,
  "topics_by_technology": {
    "cpp": number,
    "python": number
  }
}
```

---

## 13. UI/UX Requirements

### 13.1 Design System

#### Color Palette

```
Primary (Navy/Blue):
- primary-50: #eff6ff
- primary-500: #3b82f6
- primary-600: #2563eb
- primary-700: #1d4ed8

Success (Green):
- success-500: #22c55e
- success-600: #16a34a

Warning (Amber):
- warning-500: #f59e0b
- warning-600: #d97706

Error (Red):
- error-500: #ef4444
- error-600: #dc2626

Neutral:
- gray-50 to gray-950 (Tailwind defaults)
```

#### Typography

- **Headings:** SF Pro / Inter (sans-serif)
- **Body:** SF Pro / Inter (sans-serif)
- **Code:** JetBrains Mono / Fira Code (monospace)

#### Spacing

- Use Tailwind's default spacing scale (4px base unit)
- Card padding: 6 (24px)
- Section spacing: 8 (32px)
- Button padding: px-4 py-2

#### Border Radius

- Small: rounded-md (6px)
- Medium: rounded-lg (8px)
- Large: rounded-xl (12px)

### 13.2 Page Layouts

#### Landing Page (Public)

```
┌─────────────────────────────────────────┐
│  [Logo]  Features  Pricing  [Login]     │
├─────────────────────────────────────────┤
│                                         │
│       Hero Section with CTA             │
│       "Refresh Your Dev Skills"         │
│                                         │
├─────────────────────────────────────────┤
│       Features Section (3 columns)      │
│       - AI Topics                       │
│       - Progress Tracking               │
│       - LeetCode Integration            │
├─────────────────────────────────────────┤
│       Footer                            │
└─────────────────────────────────────────┘
```

#### Dashboard (Authenticated)

```
┌─────────────────────────────────────────┐
│  [Logo]  Dashboard  Topics  Account  [👤]│
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Stats Card                     │   │
│  │  Total: 12  In Progress: 3     │   │
│  │  Completed: 5  Rate: 42%       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  In Progress Topics                     │
│  ┌──────────┐ ┌──────────┐            │
│  │ Topic 1  │ │ Topic 2  │            │
│  │ [C++]    │ │ [Python] │            │
│  └──────────┘ └──────────┘            │
│                                         │
│  Suggested Next Steps                   │
│  ┌──────────┐ ┌──────────┐            │
│  │ Topic 3  │ │ Topic 4  │            │
│  └──────────┘ └──────────┘            │
│                                         │
│  [Generate New Topics]                  │
│                                         │
└─────────────────────────────────────────┘
```

#### All Topics Page (Authenticated)

```
┌─────────────────────────────────────────┐
│  [Logo]  Dashboard  Topics  Account  [👤]│
├─────────────────────────────────────────┤
│                                         │
│  All Topics                             │
│                                         │
│  [Search...]  [🔽Sort]                  │
│  [All] [C++] [Python]  [All] [In Prog] │
│                                         │
│  Showing 12 of 45 topics                │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Modern C++ Memory Management [C++]│  │
│  │ Intermediate • 6 hours            │  │
│  │ Learn about smart pointers...     │  │
│  │ [▼ Practice Problems (5)]         │  │
│  │ Status: [In Progress ▼] [Edit] [×]│  │
│  └──────────────────────────────────┘  │
│                                         │
│  [More topics...]                       │
│                                         │
└─────────────────────────────────────────┘
```

### 13.3 Component Specifications

#### Topic Card Component

- Display: title, technology badge, difficulty, estimated hours, description (truncated)
- Actions: status dropdown, edit button, delete button
- Expandable section: LeetCode problems list
- Visual status indicator (color-coded border/badge)

#### Generate Topics Modal

- Technology selector (dropdown)
- Optional context textarea (500 char limit with counter)
- "Consider completed topics" checkbox (default: true)
- Remaining generations display
- Generate button (disabled if limit reached)

#### Topic Edit Modal

- Editable fields: title, description, estimated_hours, difficulty_level
- LeetCode problems list (add/remove)
- Save/Cancel buttons
- Validation messages

#### Status Dropdown

- Three options: Not Started, In Progress, Completed
- Color-coded icons
- Updates immediately on selection
- Confirmation for completed status

### 13.4 Responsive Behavior

#### Mobile (<640px)

- Single column layout
- Collapsible navigation menu (hamburger)
- Stacked topic cards
- Full-width buttons
- Bottom sheet modals

#### Tablet (640-1024px)

- Two column layout for topic cards
- Visible navigation bar
- Side drawer modals

#### Desktop (>1024px)

- Three column layout for topic cards
- Full navigation bar
- Centered modals (max-width)
- Hover states on interactive elements

### 13.5 Interaction Patterns

#### Loading States

- Skeleton loaders for topic cards
- Spinner for topic generation (with timeout warning at 20s)
- Inline spinners for status updates

#### Empty States

- Dashboard with no topics: "Get started by generating your first topics"
- No in-progress topics: "Start learning by marking a topic as in progress"
- No completed topics: "You haven't completed any topics yet"
- Filtered view with no results: "No topics match your filters"

#### Error States

- API failure: Red banner with retry button
- Validation errors: Inline red text below field
- Network timeout: Friendly message with support contact

#### Success States

- Topic created/updated: Green toast notification (3s auto-dismiss)
- Status changed: Smooth transition animation
- Account deleted: Redirect to landing page with confirmation

---

## 14. AI Integration Specifications

### 14.1 Anthropic Claude Configuration

**Model:** Claude 3.5 Sonnet  
**API Endpoint:** `https://api.anthropic.com/v1/messages`  
**Max Tokens:** 2000 (output)  
**Temperature:** 0.7 (balanced creativity/consistency)  
**Timeout:** 30 seconds

### 14.2 Cost Estimation

**Pricing:**

- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens

**Per Generation:**

- Input: ~2,000 tokens (prompt + user history)
- Output: ~1,000 tokens (5 topics with details)
- Cost per generation: ~$0.02

**Monthly Budget:**

- 5,000 generations/month = ~$100/month
- Free tier: 10 generations/user/month × 30 users = 300 generations = ~$6
- Premium tier buffer: $94 for growth

### 14.3 Rate Limiting Strategy

**Application Level:**

- Free tier: 5 generations per day, 10 per month
- Premium tier: 20 generations per day, unlimited monthly
- Track in `user_profiles.generation_count_current_month`
- Reset monthly on `generation_count_reset_date`

**API Level:**

- Anthropic limit: 50 requests/minute (default)
- Implement exponential backoff for rate limit errors
- Queue requests if necessary (simple FIFO)

### 14.4 Prompt Engineering

#### System Prompt Template

```
You are an expert technical educator helping senior software developers refresh their skills after a 10+ year career break. Your role is to generate personalized learning topics that bridge the gap between their historical knowledge and modern practices.

Generate exactly 5 learning topics for a developer who wants to refresh their {TECHNOLOGY} skills.

Requirements:
1. Focus on modern {TECHNOLOGY} features and paradigm shifts since ~2010-2015
2. Include current ecosystem, tooling, and best practices
3. Emphasize practical, interview-relevant algorithms and data structures
4. Consider the user's learning history to avoid repetition
5. Provide topics with varied difficulty: mix of beginner, intermediate, and advanced

For each topic, provide:
- title: Clear, specific title (5-10 words)
- description: Concise explanation of what will be learned (2-3 sentences, ~150 characters)
- difficulty_level: "beginner" | "intermediate" | "advanced"
- estimated_hours: Realistic time to complete (2-8 hours)
- leetcode_problems: Array of 3-5 relevant algorithm problems with:
  - url: Full leetcode.com problem URL
  - title: Problem name
  - difficulty: "Easy" | "Medium" | "Hard"

Format your response as a valid JSON array matching this structure:
[
  {
    "title": "...",
    "description": "...",
    "difficulty_level": "...",
    "estimated_hours": 6,
    "leetcode_problems": [
      {"url": "https://leetcode.com/problems/two-sum/", "title": "Two Sum", "difficulty": "Easy"}
    ]
  }
]
```

#### User Prompt Template

```
Technology: {TECHNOLOGY} (C++ or Python)

User's Completed Topics:
{HISTORY}
(List of previously completed topic titles to avoid duplication)

User's Additional Context:
{CONTEXT}
(Optional user input for specific focus areas)

Generate 5 new learning topics that complement the user's history and address their specific interests.
```

#### Example C++ Generation

```
Technology: C++

User's Completed Topics:
- Smart Pointers and RAII
- Lambda Expressions and Closures

User's Additional Context:
"I want to focus on modern concurrency"

[AI generates 5 topics focused on std::thread, atomics, async/await, etc.]
```

#### Example Python Generation

```
Technology: Python

User's Completed Topics:
- Type Hints and Static Analysis
- Async/Await Patterns

User's Additional Context:
"Need to refresh data structures"

[AI generates 5 topics focused on collections, algorithms, performance optimization, etc.]
```

### 14.5 Response Parsing and Validation

```typescript
interface AIGeneratedTopic {
  title: string;
  description: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  leetcode_problems: LeetCodeProblem[];
}

function validateAIResponse(response: any): AIGeneratedTopic[] {
  // Validate response is array of 5 topics
  if (!Array.isArray(response) || response.length !== 5) {
    throw new Error("Invalid AI response: expected 5 topics");
  }

  // Validate each topic structure
  response.forEach((topic, index) => {
    if (!topic.title || typeof topic.title !== "string") {
      throw new Error(`Topic ${index}: missing or invalid title`);
    }
    if (!topic.description || typeof topic.description !== "string") {
      throw new Error(`Topic ${index}: missing or invalid description`);
    }
    if (!["beginner", "intermediate", "advanced"].includes(topic.difficulty_level)) {
      throw new Error(`Topic ${index}: invalid difficulty_level`);
    }
    if (typeof topic.estimated_hours !== "number" || topic.estimated_hours < 2 || topic.estimated_hours > 8) {
      throw new Error(`Topic ${index}: estimated_hours must be 2-8`);
    }
    if (!Array.isArray(topic.leetcode_problems) || topic.leetcode_problems.length < 3) {
      throw new Error(`Topic ${index}: must have 3-5 LeetCode problems`);
    }
  });

  return response;
}
```

### 14.6 Error Handling

**Claude API Errors:**

- 400 Bad Request → Log error, show generic message to user
- 401 Unauthorized → Alert developer, show maintenance message
- 429 Rate Limited → Wait and retry with exponential backoff
- 500 Server Error → Retry once, then show error message
- Timeout (>30s) → Cancel request, show timeout message

**Fallback Strategy:**

- If API consistently fails (3+ consecutive errors), log alert for monitoring
- Consider implementing pre-generated topic templates as emergency fallback (post-MVP)

---

## 15. Third-Party Integrations

### 15.1 LeetCode Integration

#### API Details

- **Type:** Public/unofficial API (LeetCode GraphQL)
- **Endpoint:** `https://leetcode.com/graphql`
- **Authentication:** None required for problem metadata
- **Rate Limit:** Unknown (implement conservative rate limiting)

#### Data Retrieved

- Problem title
- Problem URL slug
- Difficulty level (Easy/Medium/Hard)
- Topic tags (for matching)

#### Integration Approach

1. AI generates topic titles (e.g., "Binary Search Trees")
2. Server-side API route queries LeetCode GraphQL for problems matching tags
3. Filter and select 3-5 most relevant problems by difficulty mix
4. Store problem metadata in `review_topics.leetcode_problems` JSON field
5. Display as clickable links opening leetcode.com in new tab

#### Sample GraphQL Query

```graphql
query getProblemsbyTag($tag: String!) {
  problemsetQuestionList(categorySlug: "", limit: 10, skip: 0, filters: { tags: [$tag] }) {
    questions {
      title
      titleSlug
      difficulty
      topicTags {
        name
      }
    }
  }
}
```

#### Error Handling

- LeetCode API unavailable → Skip LeetCode problems, store empty array
- Matching problems not found → Fall back to general algorithm problems
- Rate limit exceeded → Cache results, reuse for similar topics

#### Limitations (MVP)

- No authentication with user's LeetCode account
- No synchronization of completion status
- No direct problem submission from app
- Manual problem selection, not fully automated matching

### 15.2 Supabase Integration

#### Services Used

**Supabase Auth:**

- Email/password authentication
- GitHub OAuth provider
- Session management
- Password reset flows

**Supabase Database (PostgreSQL):**

- User profiles storage
- Review topics storage
- Analytics events storage
- Row Level Security for data isolation

**Supabase Edge Functions:**

- Secure Claude API calls (hide API keys)
- LeetCode API proxying (if needed)
- Complex server-side logic

**Supabase Realtime (Future):**

- Not used in MVP
- Potential for collaborative features post-MVP

#### Configuration

**Environment Variables:**

```env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-secret-key]
```

**RLS Policies:**

- All tables enforce user-level data isolation
- Service role bypasses RLS for admin operations
- Anon key used for public (pre-auth) access

### 15.3 Vercel Deployment Integration

**Features Used:**

- Automatic deployments from Git (main branch)
- Environment variable management
- Edge Functions for API routes
- Analytics (basic)

**Build Configuration:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

---

## 16. Security and Privacy

### 16.1 Security Measures

**Authentication Security:**

- Passwords hashed with bcrypt (Supabase default)
- Secure session cookies (httpOnly, secure, sameSite)
- OAuth state verification for GitHub login
- CSRF protection on all state-changing operations

**API Security:**

- API keys stored in environment variables only
- Supabase service role key never exposed to frontend
- Claude API calls proxied through Edge Functions
- Rate limiting on all API endpoints

**Database Security:**

- Row Level Security enforced on all tables
- Prepared statements prevent SQL injection
- Foreign key constraints ensure referential integrity
- Backup strategy via Supabase automatic backups

**Frontend Security:**

- Content Security Policy headers
- XSS protection via React's built-in escaping
- No eval() or dangerous innerHTML usage
- Dependency vulnerability scanning (npm audit)

### 16.2 Privacy Compliance

**Data Collection:**

- Email address (required for account)
- Display name (optional)
- Learning topics and progress (core functionality)
- Analytic events (timestamps, action types)

**Data Not Collected:**

- No tracking cookies beyond session management
- No third-party analytics in MVP
- No social media pixels
- No advertising identifiers

**User Rights (GDPR Compliance):**

- Right to access: Users can view all their data via UI
- Right to portability: Account export (post-MVP)
- Right to deletion: Full account deletion available
- Right to rectification: Users can edit all their data

**Privacy Policy Requirements:**

- What data is collected and why
- How data is stored (Supabase, US/EU regions)
- Third-party services (Anthropic, LeetCode)
- Data retention policy (deleted on account deletion)
- Contact information for privacy inquiries

### 16.3 Compliance Checklist

- [ ] HTTPS enforced on all connections
- [ ] Password requirements meet industry standards (8+ chars)
- [ ] Row Level Security policies tested and verified
- [ ] API keys rotated regularly
- [ ] Privacy Policy page created and linked in footer
- [ ] Terms of Service created (basic)
- [ ] Account deletion tested and verified (cascading deletes)
- [ ] Email opt-out mechanism (if notifications added post-MVP)
- [ ] GDPR cookie consent (if analytics cookies added)
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

---

## 17. Testing Strategy

### 17.1 Testing Scope

**Unit Tests:**

- API utility functions
- Data validation functions
- Date/time calculations
- Permission checks

**Integration Tests:**

- API endpoints (CRUD operations)
- Authentication flows
- Database queries
- Third-party API calls

**E2E Tests (Critical Paths):**

- User registration and login
- Topic generation flow
- Topic status updates
- Account deletion

**Manual Testing:**

- UI/UX review on multiple devices
- Accessibility testing with screen readers
- Cross-browser compatibility
- Performance testing

### 17.2 Test Coverage Goals

- Unit tests: >80% coverage for utility functions
- Integration tests: 100% coverage for API endpoints
- E2E tests: All critical user journeys
- Manual tests: Comprehensive checklist before beta launch

### 17.3 Testing Tools

- **Unit/Integration:** Vitest (fast, Vite-compatible)
- **E2E:** Playwright (cross-browser)
- **Manual:** BrowserStack (device testing)
- **Performance:** Lighthouse CI

---

## 18. Analytics and Monitoring

### 18.1 Key Metrics to Track

**User Acquisition:**

- New registrations per day/week/month
- Registration source (email vs GitHub OAuth)
- Time to first topic generation

**User Engagement:**

- Monthly Active Users (MAU)
- Topic generations per user per month
- Topics created per user
- Topic status updates per user
- Completion rate (completed / total topics)

**Feature Usage:**

- Technology distribution (C++ vs Python)
- Topic difficulty distribution
- Average estimated hours per topic
- LeetCode problem click-through rate
- Edit frequency (how often users edit AI topics)

**Retention:**

- Day 1, Day 7, Day 30 retention rates
- Churn rate
- Time since last activity

**Success Criteria Tracking:**

- % users generating topics monthly (target: 75%)
- % users updating progress (target: 90%)

### 18.2 Monitoring and Alerting

**Application Monitoring:**

- Error rate by endpoint
- API response times (p50, p95, p99)
- Claude API failure rate
- Database query performance

**Infrastructure Monitoring:**

- Vercel deployment status
- Supabase uptime
- Database connection pool usage
- Edge function errors

**Alerts:**

- Error rate >5% for any endpoint
- Claude API consecutive failures (3+)
- Database connection failures
- Deployment failures

**Tools:**

- Sentry (error tracking - optional for MVP)
- Vercel Analytics (basic metrics - included)
- Supabase Dashboard (database metrics - included)
- Custom Supabase queries (success criteria tracking)

---

## 19. Development Timeline

### 19.1 Project Phases

**Phase 1: Foundation (Weeks 1-2)**

- Project setup (Astro, TypeScript, Tailwind, Shadcn)
- Supabase project creation and configuration
- Database schema design and implementation
- Authentication setup (email/password + GitHub OAuth)
- Basic UI layouts (landing, dashboard, topics pages)

**Phase 2: Core Features (Weeks 3-4)**

- Topic CRUD API endpoints
- Topics listing and filtering UI
- Topic cards component
- Status update functionality
- Manual topic creation form

**Phase 3: AI Integration (Weeks 5-6)**

- Anthropic Claude API integration
- Supabase Edge Function for secure API calls
- Topic generation UI (modal/form)
- Prompt engineering and testing
- Rate limiting implementation

**Phase 4: LeetCode Integration (Weeks 7-8)**

- LeetCode GraphQL API integration
- Problem matching algorithm
- Problem display in topic cards
- Error handling for API failures

**Phase 5: Polish and Testing (Weeks 9-10)**

- Responsive design refinement
- Loading states and error handling
- Empty states and user guidance
- Accessibility improvements
- Performance optimization
- Cross-browser testing

**Phase 6: Beta Launch (Weeks 11-12)**

- Beta user onboarding
- Bug fixes and iteration
- Analytics validation
- Documentation (user guide, FAQ)
- Monitoring setup

### 19.2 Milestone Deliverables

| Week | Milestone            | Deliverables                            |
| ---- | -------------------- | --------------------------------------- |
| 2    | Foundation Complete  | Working auth, database, basic UI        |
| 4    | CRUD Complete        | Full topic management without AI        |
| 6    | AI Complete          | Topic generation working end-to-end     |
| 8    | Integration Complete | LeetCode problems linked to topics      |
| 10   | MVP Complete         | All features implemented, tested        |
| 12   | Beta Launch          | 20-30 users onboarded, metrics tracking |

### 19.3 Team Structure (Recommended)

**For MVP Development:**

- 1 Full-Stack Developer (primary)
- 1 Designer (part-time, weeks 1-2 and 9-10)
- 1 Product Manager (oversight, user testing coordination)

**Time Commitment:**

- Full-Stack Developer: Full-time (8-12 weeks)
- Designer: Part-time (~40 hours total)
- Product Manager: Part-time (~20 hours total)

---

## 20. Budget Estimate

### 20.1 Development Costs

**Personnel:**

- Full-Stack Developer: 8-12 weeks × $5,000-8,000/week = $40,000-96,000
- Designer (part-time): 40 hours × $75-125/hour = $3,000-5,000
- Product Manager (oversight): 20 hours × $100-150/hour = $2,000-3,000

**Total Development:** $45,000-104,000

### 20.2 Infrastructure Costs (Monthly)

**MVP Phase (0-100 users):**

- Vercel: $0 (free tier)
- Supabase: $0 (free tier, 50MB DB, 2GB bandwidth)
- Anthropic Claude API: ~$100 (estimated 5,000 generations)
- Domain name: ~$15/year = $1.25/month
- **Total Monthly:** ~$101

**Growth Phase (100-500 users):**

- Vercel: $20 (Pro plan)
- Supabase: $25 (Pro plan, 8GB DB)
- Anthropic Claude API: ~$500 (estimated 25,000 generations)
- **Total Monthly:** ~$545

### 20.3 Total MVP Budget

**Development:** $45,000-104,000 (one-time)  
**Infrastructure:** $100-150/month (ongoing)  
**Contingency (20%):** $9,000-21,000

**Total MVP Budget:** $54,000-125,000 + ongoing operational costs

---

## 21. Risks and Mitigation Strategies

### 21.1 Technical Risks

| Risk                                     | Probability | Impact | Mitigation                                                            |
| ---------------------------------------- | ----------- | ------ | --------------------------------------------------------------------- |
| Claude API unavailability                | Medium      | High   | Implement retry logic, error messaging, fallback templates (post-MVP) |
| Claude API cost overruns                 | Medium      | Medium | Strict rate limiting, usage monitoring, alerts at $150/month          |
| LeetCode API changes/breaks              | Medium      | Low    | Use unofficial API cautiously, prepare to switch to manual curation   |
| Supabase free tier limits exceeded       | Low         | Medium | Monitor usage closely, upgrade plan proactively                       |
| Performance issues with topic generation | Low         | Medium | Optimize prompts, implement caching, set timeout limits               |

### 21.2 Product Risks

| Risk                                          | Probability | Impact | Mitigation                                                               |
| --------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------ |
| AI-generated topics are low quality           | Medium      | High   | Extensive prompt engineering, beta user feedback, manual curation option |
| Success criteria not met (75%/90%)            | Medium      | Medium | Set conservative goals, iterate on UX, add engagement features           |
| Users don't see value in LeetCode integration | Low         | Low    | Make optional, gather feedback, improve matching algorithm               |
| Low user adoption                             | Medium      | High   | Strong marketing, community building, referral incentives                |
| Competition from similar products             | Low         | Medium | Focus on senior developers niche, emphasize AI personalization           |

### 21.3 Business Risks

| Risk                             | Probability | Impact | Mitigation                                                                   |
| -------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------- |
| Monetization model doesn't work  | Medium      | High   | Test pricing with beta users, offer annual discounts, add premium features   |
| CAC exceeds LTV                  | Medium      | High   | Focus on organic growth, content marketing, community building               |
| Regulatory changes (AI, privacy) | Low         | Medium | Stay informed on regulations, ensure GDPR compliance, adaptable architecture |
| Key developer unavailable        | Low         | High   | Document thoroughly, use standard technologies, backup developer identified  |

### 21.4 Risk Response Plan

**High Priority (Address Immediately):**

1. Claude API reliability → Implement comprehensive error handling and monitoring
2. AI topic quality → Invest heavily in prompt engineering and user testing
3. Cost management → Set up alerts and automatic cutoffs

**Medium Priority (Monitor and Plan):** 4. User adoption → Prepare marketing strategy and beta user outreach 5. Success criteria → Design engaging UX, minimize friction

**Low Priority (Accept and Monitor):** 6. LeetCode API stability → Use but don't over-rely on 7. Competition → Focus on differentiation through quality

---

## 22. Success Criteria and Validation

### 22.1 MVP Success Criteria

**Primary Metrics (Must Achieve):**

1. ✅ 75% of users generate new topics at least once per month
2. ✅ 90% of users update topic status (mark as in-progress or completed)

**Secondary Metrics (Nice to Have):** 3. 60% user retention after 30 days 4. 40% topic completion rate 5. <5% error rate on topic generation 6. <2s average page load time 7. >4.0/5.0 user satisfaction rating (post-beta survey)

### 22.2 Validation Methodology

**Quantitative:**

- SQL queries on `analytics_events` table
- Supabase dashboard for user activity
- Automated reports generated weekly

**Qualitative:**

- Beta user interviews (5-10 users)
- Post-beta survey (all users)
- Support ticket analysis
- Feature request tracking

### 22.3 Go/No-Go Decision Criteria

**After 60 Days of Beta:**

**GO (Proceed to Public Launch):**

- Both primary metrics achieved OR
- One primary metric achieved + strong qualitative feedback + clear path to second metric

**PIVOT (Adjust Product):**

- One primary metric achieved but weak qualitative feedback
- Missing both metrics but strong engagement in specific features

**NO-GO (Halt Development):**

- Both primary metrics missed significantly (<50% of target)
- Weak qualitative feedback
- High churn rate (>60% after 30 days)
- Unclear path to product-market fit

---

## 23. Post-MVP Roadmap

### 23.1 Potential Features (Prioritized)

**High Priority (Next 3-6 Months):**

1. Learning streaks and gamification
2. Topic recommendations based on completion patterns
3. Progress analytics dashboard
4. Export learning history (PDF/CSV)
5. Email digest (weekly progress summary)
6. More technology support (JavaScript, Java, Go)

**Medium Priority (6-12 Months):** 7. Spaced repetition reminders 8. Community features (share topics, discuss) 9. Integration with other coding platforms (HackerRank, Codewars) 10. Mobile native apps (iOS/Android) 11. Learning resources aggregation (docs, tutorials, videos) 12. Interview preparation mode

**Low Priority (Future Exploration):** 13. AI-powered code review 14. Mock interview practice 15. Mentor matching 16. Company-sponsored plans for returning developers 17. Integration with job boards

### 23.2 Scalability Considerations

**Technical Scalability:**

- Vercel's edge functions handle horizontal scaling automatically
- Supabase can scale to millions of users with plan upgrades
- Consider Redis for caching if response times degrade
- Implement CDN for static assets

**Cost Scalability:**

- Monitor Claude API costs closely (largest variable cost)
- Consider prompt caching to reduce token usage
- Negotiate volume discounts with Anthropic at scale
- Optimize database queries to stay on lower Supabase tiers longer

**Team Scalability:**

- Hire additional developer at 500+ users
- Add customer support at 1,000+ users
- Add marketing/growth role at 2,000+ users
- Consider dedicated AI/ML engineer for advanced features

---

## 24. Appendices

### 24.1 Glossary

| Term          | Definition                                                                        |
| ------------- | --------------------------------------------------------------------------------- |
| Career Gap    | Period of time away from professional programming (10+ years for target audience) |
| Topic         | A learning unit covering a specific technical concept or skill                    |
| Review        | The process of studying and completing a topic                                    |
| LeetCode      | Popular platform for algorithm practice problems                                  |
| RLS           | Row Level Security - PostgreSQL feature for data isolation                        |
| Edge Function | Serverless function running at the edge (close to users)                          |
| Freemium      | Business model with free basic tier and paid premium tier                         |

### 24.2 References

**Technical Documentation:**

- Astro: https://docs.astro.build
- Supabase: https://supabase.com/docs
- Anthropic: https://docs.anthropic.com
- LeetCode API: https://github.com/alfaarghya/alfa-leetcode-api
- Tailwind CSS: https://tailwindcss.com/docs

**Design Resources:**

- Shadcn/ui: https://ui.shadcn.com
- Tailwind UI: https://tailwindui.com

**Best Practices:**

- GDPR Compliance: https://gdpr.eu
- Web Accessibility: https://www.w3.org/WAI/WCAG21/quickref/
- Security Headers: https://securityheaders.com

### 24.3 Revision History

| Version | Date         | Author       | Changes                                     |
| ------- | ------------ | ------------ | ------------------------------------------- |
| 1.0     | Nov 14, 2025 | Product Team | Initial PRD based on stakeholder interviews |

---

## 25. Approval and Sign-off

**Product Manager:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

**Engineering Lead:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

**Design Lead:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

**Stakeholder:** **\*\*\*\***\_**\*\*\*\*** Date: **\_\_\_**

---

**End of Document**

_This PRD is a living document and will be updated as the product evolves. All changes should be documented in the revision history._
