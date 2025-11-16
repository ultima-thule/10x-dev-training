# Profile Setup Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /profile/setup.astro                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  <ProfileSetupForm client:load />                      │    │
│  │  ┌───────────────────────────────────────────────┐    │    │
│  │  │                                                │    │    │
│  │  │  Experience Level: [ Beginner ▼ ]            │    │    │
│  │  │  Years Away:      [ 1-2       ▼ ]            │    │    │
│  │  │                                                │    │    │
│  │  │  [Complete Setup] ────────────────────┐      │    │    │
│  │  │                                        │      │    │    │
│  │  └────────────────────────────────────────┼──────┘    │    │
│  │                                            │           │    │
│  └────────────────────────────────────────────┼───────────┘    │
│                                               │                 │
└───────────────────────────────────────────────┼─────────────────┘
                                                 │
                                                 │ POST /api/profile/setup
                                                 │ {
                                                 │   experienceLevel: "beginner",
                                                 │   yearsAway: "1-2"
                                                 │ }
                                                 │
┌────────────────────────────────────────────────┼─────────────────┐
│                         SERVER SIDE            ▼                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Middleware (src/middleware/index.ts)                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Initialize Supabase client                         │    │
│  │  2. Check authentication                               │    │
│  │  3. Exempt /profile/setup from profile check           │    │
│  │  4. Set locals.user                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│                           ▼                                     │
│  API Endpoint (src/pages/api/profile/setup.ts)                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Authentication Check                               │    │
│  │     └─ locals.user exists?                             │    │
│  │                                                         │    │
│  │  2. Parse Request Body                                 │    │
│  │     └─ JSON.parse(body)                                │    │
│  │                                                         │    │
│  │  3. Validate with Zod                                  │    │
│  │     └─ ProfileSetupSchema.parse(body)                  │    │
│  │                                                         │    │
│  │  4. Transform Data                                     │    │
│  │     └─ mapYearsAwayToNumber("1-2") → 2                │    │
│  │                                                         │    │
│  │  5. Call Service ──────────────────────┐              │    │
│  │                                         │              │    │
│  └─────────────────────────────────────────┼──────────────┘    │
│                                             │                   │
│                                             ▼                   │
│  Service Layer (src/lib/services/profile.service.ts)           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  upsertProfile()                                       │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │                                                   │ │    │
│  │  │  supabase.from("profiles")                       │ │    │
│  │  │    .upsert({                                     │ │    │
│  │  │      id: userId,                                 │ │    │
│  │  │      experience_level: "beginner",               │ │    │
│  │  │      years_away: 2,                              │ │    │
│  │  │      activity_streak: 0                          │ │    │
│  │  │    }, { onConflict: "id" })                      │ │    │
│  │  │                                                   │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│                           ▼                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              DATABASE (Supabase)                       │    │
│  │                                                         │    │
│  │  profiles table:                                       │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │ id               │ uuid    │ primary key         │ │    │
│  │  │ experience_level │ enum    │ beginner           │ │    │
│  │  │ years_away       │ smallint│ 2                  │ │    │
│  │  │ activity_streak  │ integer │ 0                  │ │    │
│  │  │ created_at       │ timestamp│ 2025-11-16...     │ │    │
│  │  │ updated_at       │ timestamp│ 2025-11-16...     │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│                           │ Success                             │
│                           ▼                                     │
│  Response to Client                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  {                                                      │    │
│  │    success: true,                                       │    │
│  │    redirectUrl: "/dashboard"                            │    │
│  │  }                                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  JavaScript Redirect                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  window.location.href = "/dashboard"                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│                           ▼                                     │
│  /dashboard                                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ✓ User authenticated                                  │    │
│  │  ✓ Profile complete                                    │    │
│  │  ✓ Access granted                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Transformation Example

### Form Input → Database Storage

```
┌─────────────────────────────────────────────────────────────┐
│  User Input (ProfileSetupForm)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  experienceLevel: "beginner"                                │
│  yearsAway: "1-2"                                           │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ POST /api/profile/setup
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Validator (ProfileSetupSchema)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ experienceLevel: "beginner" (valid enum)                │
│  ✓ yearsAway: "1-2" (valid enum)                           │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Transform
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  API Transformation (mapYearsAwayToNumber)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  experience_level: "beginner"                               │
│  years_away: 2  ← mapYearsAwayToNumber("1-2")              │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ UPSERT
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (profiles table)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  id: "uuid-xxx"                                             │
│  experience_level: "beginner"  ← enum type                 │
│  years_away: 2                  ← smallint type            │
│  activity_streak: 0                                         │
│  created_at: "2025-11-16T..."                              │
│  updated_at: "2025-11-16T..."                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

### Validation Error (400)

```
Client                    Server                    Response
  │                         │                          │
  │ POST {"experienceLevel":"invalid"}                 │
  │────────────────────────>│                          │
  │                         │                          │
  │                         │ ProfileSetupSchema       │
  │                         │ .parse() throws ZodError │
  │                         │                          │
  │                         │ Catch ZodError           │
  │                         │   ↓                      │
  │                         │ Format error details     │
  │                         │                          │
  │<────────────────────────│                          │
  │ 400 Bad Request         │                          │
  │ {                       │                          │
  │   error: {              │                          │
  │     code: "VALIDATION_ERROR",                     │
  │     message: "Please check your input...",        │
  │     details: [...]      │                          │
  │   }                     │                          │
  │ }                       │                          │
  │                         │                          │
  │ Display specific error  │                          │
  │ in Alert component      │                          │
  └─                        └─                         └─
```

### Server Error (500)

```
Client                    Server                    Response
  │                         │                          │
  │ POST {valid data}       │                          │
  │────────────────────────>│                          │
  │                         │                          │
  │                         │ upsertProfile()          │
  │                         │ Database connection fails│
  │                         │                          │
  │                         │ Catch ProfileServiceError│
  │                         │   ↓                      │
  │                         │ Log error details        │
  │                         │   ↓                      │
  │                         │ Return generic message   │
  │                         │                          │
  │<────────────────────────│                          │
  │ 500 Internal Error      │                          │
  │ {                       │                          │
  │   error: {              │                          │
  │     code: "INTERNAL_ERROR",                       │
  │     message: "An unexpected error occurred..."    │
  │   }                     │                          │
  │ }                       │                          │
  │                         │                          │
  │ Display generic error   │                          │
  │ (security: no leak)     │                          │
  └─                        └─                         └─
```

## Middleware Protection Flow

### User Without Profile Accessing Dashboard

```
1. User navigates to /dashboard
   │
   ├─> Middleware intercepts request
   │   │
   │   ├─> Check: isProtectedPath("/dashboard") → true
   │   │
   │   ├─> Check: locals.user exists? → true (authenticated)
   │   │
   │   ├─> Check: pathname !== "/profile/setup"? → true
   │   │
   │   ├─> Query: SELECT id FROM profiles WHERE id = user.id
   │   │   Result: null (no profile)
   │   │
   │   └─> Action: redirect("/profile/setup")
   │
   └─> User lands on /profile/setup
       │
       ├─> Fills out ProfileSetupForm
       │
       ├─> Submits to POST /api/profile/setup
       │
       ├─> Profile created in database
       │
       └─> Redirects to /dashboard
           │
           ├─> Middleware intercepts request
           │   │
           │   ├─> Check: locals.user exists? → true
           │   │
           │   ├─> Query: SELECT id FROM profiles
           │   │   Result: profile found ✓
           │   │
           │   └─> Action: next() (allow access)
           │
           └─> Dashboard renders successfully
```

## UPSERT Logic

### First Time (INSERT)

```
profiles table: (empty)

UPSERT {
  id: "user-123",
  experience_level: "beginner",
  years_away: 2,
  activity_streak: 0
}

↓

profiles table:
┌─────────┬──────────────────┬────────────┬─────────────────┐
│ id      │ experience_level │ years_away │ activity_streak │
├─────────┼──────────────────┼────────────┼─────────────────┤
│ user-123│ beginner         │ 2          │ 0               │
└─────────┴──────────────────┴────────────┴─────────────────┘
```

### Second Time (UPDATE)

```
profiles table:
┌─────────┬──────────────────┬────────────┬─────────────────┐
│ id      │ experience_level │ years_away │ activity_streak │
├─────────┼──────────────────┼────────────┼─────────────────┤
│ user-123│ beginner         │ 2          │ 5               │ ← streak increased
└─────────┴──────────────────┴────────────┴─────────────────┘

UPSERT {
  id: "user-123",          ← conflict on primary key
  experience_level: "advanced",
  years_away: 5,
  activity_streak: 0       ← will NOT overwrite existing 5
}

↓

profiles table:
┌─────────┬──────────────────┬────────────┬─────────────────┐
│ id      │ experience_level │ years_away │ activity_streak │
├─────────┼──────────────────┼────────────┼─────────────────┤
│ user-123│ advanced         │ 5          │ 5               │ ← preserved!
└─────────┴──────────────────┴────────────┴─────────────────┘
```

