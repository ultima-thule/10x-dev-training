# UI Architecture Plan - Development Refresher Training

## Decisions

### User Decisions

1. **Landing Page & Authentication**: Create a separate public landing page with Sign Up/Sign In CTAs; authenticated users auto-redirect to dashboard via middleware
2. **Hierarchical Topic Display**: Use expandable card-based interface with lazy-loading children via `/api/topics/:id/children` endpoint
3. **Profile Setup Flow**: Dedicated onboarding page after registration (cannot be skipped) at `/onboarding` route
4. **Topic Generation Interface**: Place on dashboard as prominent card with inline results display
5. **Navigation Structure**: Responsive top navigation bar with logo, primary links (Dashboard, Topics), and user menu
6. **State Management**: Hybrid approach - URL params for filters/sorting, React Context for auth/profile, local state for UI
7. **Optimistic UI Updates**: Implement for status changes with rollback on error
8. **Error Handling**: Three-tier approach - Error Boundaries, Toast notifications, dedicated error pages
9. **Caching Strategy**: Session-based caching with 5-minute TTL for topics, display rate limit quota from headers
10. **Dashboard Structure**: Modular card layout with Profile/Streak, Topics Overview, Technology Breakdown, and Recent Activity
11. **Form Validation**: Real-time on blur with inline error messages using Zod schemas
12. **Status Update Pattern**: Colored badge dropdown (to_do: gray, in_progress: blue, completed: green) with single-click updates
13. **Technology Input**: Hybrid autocomplete with curated list plus custom input capability
14. **AI Generation Loading**: Full-screen modal with progress messages and rate limit display
15. **Empty States**: Context-specific designs for no topics, no completed topics, and empty filtered views
16. **Topic Deletion**: Confirmation dialog with child count warning and "cannot be undone" message
17. **Filter Controls**: Sticky toolbar with status multi-select, technology filter, sort options, and view toggle
18. **LeetCode Display**: Collapsible "Practice Problems" section with difficulty-coded badges
19. **Responsive Breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px) with adaptive layouts
20. **Activity Streak Visualization**: Card with flame icon, count, 7-day calendar, and milestone animations
21. **Token Management**: httpOnly cookies with automatic refresh, session expiration modal
22. **Keyboard Navigation**: Full accessibility with Tab, Arrow keys, Enter/Space, Escape, and focus trap in modals
23. **Partial Failure Handling**: Display warning with successful/failed counts, "Retry Failed Topics" option
24. **Page Transitions**: Astro View Transitions API with 200ms fade, skeleton loaders, respect prefers-reduced-motion
25. **Dashboard Refresh**: Manual refresh button with auto-invalidation after mutations, "Last updated" timestamp
26. **Mobile Gestures**: Swipe-to-delete, pull-to-refresh, bottom sheets, 44x44px touch targets, sticky FAB
27. **API Error Mapping**: Utility function mapping API errors to form fields, show all errors simultaneously
28. **User Profile Menu**: Dropdown with email, Profile Settings link, divider, Sign Out button
29. **Filter Persistence**: URL search params for shareability, localStorage for last technology as convenience
30. **Offline Support**: Graceful degradation with offline banner, sessionStorage caching, queued mutations with retry
31. **Topic Card Structure**: Variants for parent/child with composition pattern (Header, Body, Actions sub-components)
32. **Color Palette**: Custom theme extending Tailwind - Primary (blue), Success (green), Warning (yellow), Destructive (red), Muted (gray)
33. **Text Truncation**: Titles 2 lines, descriptions 3 lines with "Read more", tooltips on hover
34. **Search Functionality**: Client-side with debounced input (300ms), highlight matches, show result count
35. **Bulk Actions**: Skip for MVP, optimize individual actions with keyboard shortcuts instead
36. **Typography Scale**: Page titles (3xl), card titles (xl), section headings (lg), body (base), meta (sm)
37. **Success Feedback**: Toast notifications (bottom-right desktop, top-center mobile) with 3-4s auto-dismiss
38. **Initial Loading**: Minimal loading screen (200-500ms) with logo and spinner, server-side auth check
39. **Profile Edit Form**: Dedicated `/profile` page with pre-populated form, unsaved changes warning
40. **Incomplete Profile Handling**: Prevent generation, display "Complete your profile" banner with CTA
41. **Icon Library**: Lucide React with semantic naming in icons.ts mapping file, standardized sizes
42. **Pagination**: URL-based with Previous/Next, page numbers, "Go to page" input, items per page selector
43. **Timestamp Display**: Relative time for recent ("2 hours ago"), absolute for older, tooltip with full timestamp
44. **Topic Detail View**: Keep interactions in list view with inline expansion, slide-out panel on mobile
45. **Manual Topic Creation**: "Create Topic" button opening modal form with all CRUD fields
46. **Breadcrumb Navigation**: Display when filtering by parent_id, clickable hierarchy, truncate long titles
47. **Dashboard Card Order**: Fixed order for MVP - Profile/Streak, Generation, Overview, Technology, Activity
48. **Recent Activity Empty State**: Friendly message with icon, "No activity yet", "View All Topics" link
49. **Error Boundary UI**: Friendly message, "Refresh Page" and "Go to Dashboard" buttons, collapsible technical details (dev only)
50. **Difficulty Badges**: Color + text + icon for accessibility (Easy: green/circle, Medium: yellow/triangle, Hard: red/square)
51. **Generated Topics Presentation**: Animate into list at top with highlight effect, success toast, auto-scroll
52. **Rate Limit Indicators**: Show remaining generations, warning at 1 remaining, disabled button with countdown when exceeded
53. **Topic Editing Workflow**: Same modal as creation, pre-populated, prevent parent_id changes, unsaved changes indicator
54. **Background Activity Feedback**: Non-blocking - top progress bar, small spinners on elements, optimistic updates with "Saving..."
55. **Onboarding**: **REJECTED - Do not implement any onboarding for MVP**
56. **Browser Navigation**: URL-based state with popstate handling, restore from cache, preserve scroll position
57. **Validation Messages**: Active, instructive voice with character counts, one error per field, positioned below field
58. **Concurrent Edits**: Simple detection - show "data may be outdated" banner after 5min inactivity, conflict error handling
59. **Help Resources**: Help link in user menu with Getting Started, FAQ, Keyboard Shortcuts, Contact Support, version number
60. **Component Organization**: By function - ui/, common/, features/topics/, features/dashboard/, features/profile/ with barrel exports
61. **Technology Autocomplete**: Show matches with highlights, "Press Enter to use custom value" message, Recently used section
62. **Expand/Collapse Accessibility**: aria-expanded, aria-controls, aria-live announcements, clear aria-labels
63. **Topic Action Menu**: Three-dot kebab with Edit, View Details, separator, Delete (destructive), keyboard shortcuts
64. **Loading Skeletons**: Mimic TopicCard structure with pulse animation, show 6-8 cards, only on initial load
65. **Experience Level Selection**: Card-style radio group with icons (Seedling/Tree/Trees), labels, descriptions, full-card clickable
66. **Nested Hierarchy Support**: Allow unlimited depth, show hierarchy in selectors with indentation, warning beyond 3 levels
67. **Conflicting Filters**: Apply as AND conditions, show empty state with active filter chips, allow individual removal
68. **Topic Card Metadata**: Technology badge, updated timestamp, children count, LeetCode count in footer with icons
69. **LeetCode Links Form**: Add/remove interface with title/URL/difficulty inputs, removable chips, max 50 with counter, drag reorder
70. **Landing Page Content**: Hero with headline/CTA, features section, "How It Works" steps, footer links, developer-focused copy

---

## Key Recommendations Summary

### 1. Application Structure & Navigation

- Public landing page with auth redirect via Astro middleware
- Top navigation bar (responsive: hamburger on mobile)
- User menu dropdown with Profile Settings and Sign Out
- Dashboard-centric architecture with minimal page navigation
- URL-based routing with proper browser back/forward support

### 2. Authentication & Authorization

- httpOnly cookies for token storage (server-side managed)
- Automatic token refresh before 1-hour expiration
- Session expiration modal with re-login and URL preservation
- Dedicated `/onboarding` page after registration (required)
- Profile completion check before allowing topic generation

### 3. Core Views & Pages

- **Landing Page** (`/`): Hero, features, how it works, CTAs
- **Dashboard** (`/dashboard`): Profile/streak card, topic generation, statistics, recent activity
- **Topics List**: Filterable, sortable, paginated with hierarchical display
- **Profile Page** (`/profile`): Edit experience level and years away
- **Onboarding** (`/onboarding`): First-time profile setup (required)

### 4. Topic Management Interface

- **Topic Cards**: Parent/child variants with visual hierarchy
- **Expandable Hierarchy**: Lazy-load children via `/api/topics/:id/children`
- **Status Updates**: Badge dropdown (gray/blue/green) with optimistic UI
- **Action Menu**: Three-dot kebab with Edit and Delete options
- **Manual Creation**: Modal form with all CRUD fields
- **AI Generation**: Dashboard card with technology autocomplete and inline results

### 5. Topic Card Components

- Title (truncate 2 lines), description (truncate 3 lines with "Read more")
- Status badge (top-right corner with colored indicators)
- Metadata footer: technology badge, timestamp, children count, LeetCode count
- Action menu (three-dot) for Edit and Delete
- Expand/collapse button for parent topics with children_count

### 6. Filtering & Search

- Sticky toolbar with status multi-select, technology filter, sort dropdown
- View toggle: "All topics" vs "Root topics only"
- Client-side search with debounced input (300ms delay)
- Active filter chips with individual removal
- "Clear all filters" button when filters active
- URL persistence for shareability

### 7. Forms & Validation

- **Zod schemas** for all validation (client and server)
- Real-time validation on blur with inline error messages
- Character counters for title (500 max) and description (5000 max)
- Technology autocomplete with curated list + custom input
- LeetCode links: title/URL/difficulty with max 50 links
- Profile form: card-style radio group for experience level, number input for years away

### 8. State Management Strategy

- **URL search params**: Filters, sorting, pagination
- **React Context**: User profile, authentication state
- **Local component state**: UI interactions (modals, dropdowns)
- **sessionStorage**: Cached topics (5min TTL) and profile data
- **localStorage**: Last used technology, help tour dismissal
- Automatic cache invalidation on mutations

### 9. Loading & Feedback States

- **AI Generation**: Full-screen modal with progress messages (15-30s)
- **Page Loads**: Top progress bar (nprogress-style)
- **Initial Load**: Skeleton loaders (6-8 cards mimicking TopicCard)
- **Mutations**: Small spinner on affected element + optimistic update
- **Success**: Toast notifications (3-4s, bottom-right/top-center)
- **Empty States**: Context-specific with illustrations and CTAs

### 10. Error Handling

- **React Error Boundaries**: Friendly UI with refresh and dashboard options
- **Toast Notifications**: User-friendly messages from API error codes
- **Form Validation**: Inline errors below fields, all shown simultaneously
- **API Errors**: Map to form fields via utility function
- **Rate Limits**: Display remaining quota, disable button with countdown
- **Partial Failures**: Show success count, "Retry Failed" option

### 11. Responsive Design

- **Mobile** (<768px): Single column, stacked cards, hamburger menu, bottom sheets
- **Tablet** (768-1024px): Two-column grid, sidebar navigation
- **Desktop** (>1024px): Three-column grid, persistent sidebar
- Touch targets: 44x44px minimum
- Mobile gestures: swipe-to-delete, pull-to-refresh

### 12. Accessibility (WCAG AA)

- Full keyboard navigation (Tab, Arrow, Enter, Escape)
- Focus trap in modals, visible focus indicators
- ARIA attributes: expanded, controls, live regions, labels
- Screen reader support (aria-labels on icon buttons)
- Color + text + icon for status/difficulty (color-blind friendly)
- Minimum contrast ratios (4.5:1)
- Respect prefers-reduced-motion

### 13. Visual Design System

- **Color Palette**: Primary (blue), Success (green), Warning (yellow), Destructive (red), Muted (gray)
- **Typography**: Page titles (3xl), card titles (xl), body (base), meta (sm)
- **Icons**: Lucide React with semantic naming, standardized sizes (16/20/24/32px)
- **Components**: Shadcn/ui library (Button, Card, Form, Toast, Dialog, etc.)
- **Spacing**: Consistent use of Tailwind scale
- **Animations**: 200ms fade transitions, pulse on updates, respect reduced-motion

### 14. Performance Optimizations

- Session-based caching (5min TTL for topics)
- Lazy-load child topics (only when expanded)
- Optimistic UI updates with rollback
- Skeleton loaders on initial load only
- Debounced search (300ms)
- Non-blocking background API calls
- Top progress bar for long operations

### 15. Rate Limiting UI

- Display remaining generations below Generate button
- Warning color when 1 remaining
- Disabled button with countdown when limit exceeded
- Use X-RateLimit-\* headers from API
- Clear messaging: "Rate limit reached. Resets in X minutes"

### 16. Dashboard Composition

1. **Profile/Streak Card**: Flame icon, count, 7-day calendar, milestones
2. **Topic Generation Card**: Technology input, Generate button, rate limit info
3. **Topics Overview Card**: Counts by status (to_do, in_progress, completed)
4. **Technology Breakdown**: Progress per technology
5. **Recent Activity**: Timeline of completed actions

### 17. Security Considerations

- httpOnly cookies (not localStorage) for tokens
- CSRF protection via Supabase Auth
- Row Level Security (RLS) enforced at database
- Sanitize user input (Zod validation)
- Secure headers in API responses
- No sensitive data in URLs or client storage

### 18. API Integration Patterns

- Supabase client from `context.locals` in Astro routes
- JWT Bearer token in Authorization header for all protected endpoints
- Optimistic updates with rollback on error
- Error mapping utility for API → form field errors
- Cache invalidation on mutations
- Respect rate limits with UI feedback

### 19. Component Architecture

```
src/components/
  ├── ui/                    # Shadcn/ui base components
  ├── common/                # Shared (Header, Footer, ErrorBoundary)
  ├── features/
  │   ├── topics/           # TopicCard, TopicList, TopicForm
  │   ├── dashboard/        # StatsCard, ActivityFeed, StreakCard
  │   └── profile/          # ProfileForm, ProfileSetup
```

### 20. Key User Flows

1. **New User**: Landing → Sign Up → Onboarding (profile setup) → Dashboard
2. **Generate Topics**: Dashboard → Select technology → Generate → View results
3. **Update Progress**: Topics list → Change status → Optimistic update → Toast
4. **Expand Hierarchy**: Click parent topic → Lazy-load children → View nested structure
5. **Manual Topic**: Topics toolbar → Create Topic → Fill form → Save
6. **Edit Topic**: Topic card menu → Edit → Modify → Save
7. **Delete Topic**: Topic card menu → Delete → Confirm (with child warning) → Remove

---

## UI Architecture Planning Summary

### Project Context

Development Refresher Training is a web application built with **Astro 5 + React 19 + TypeScript + Tailwind CSS 4 + Shadcn/ui** to help former developers refresh their technical skills. The MVP focuses on AI-powered topic generation, progress tracking, and LeetCode integration.

---

### Main UI Architecture Requirements

#### 1. **Application Structure**

The application follows a **dashboard-centric, server-side rendered (SSR)** architecture with React islands for interactivity:

- **Public Area**: Landing page with value proposition and authentication CTAs
- **Authenticated Area**: Dashboard, Topics, Profile pages (protected via Astro middleware)
- **Onboarding Flow**: Required profile setup (experience level, years away) after registration
- **Navigation**: Top navigation bar (responsive hamburger on mobile) with user menu dropdown

#### 2. **Core Views & Screens**

##### Landing Page (`/`)

- Hero section with headline, subheadline, primary CTA
- Features showcase (3 cards): AI Generation, Progress Tracking, LeetCode Integration
- How It Works (3 steps): Create Profile → Generate Topics → Track Progress
- Footer with legal links and contact

##### Dashboard (`/dashboard`)

Modular card layout with fixed order:

1. **Profile/Streak Card**: Display experience level, years away, activity streak with flame icon and 7-day calendar
2. **Topic Generation Card**: Technology autocomplete input, Generate button, rate limit display, inline results
3. **Topics Overview Card**: Counts by status (to_do, in_progress, completed)
4. **Technology Breakdown**: Progress per technology bar chart
5. **Recent Activity**: Timeline of completed actions

##### Topics List (integrated in Dashboard)

- Sticky filter/sort toolbar (status, technology, sort order, view toggle)
- Client-side search with debounced input and highlighted results
- Paginated grid of topic cards (50 per page default)
- Expandable hierarchy (lazy-load children on expand)
- Empty states for no topics, no matches, filtered results

##### Profile Page (`/profile`)

- Form to edit experience level (card-style radio group) and years away (number input)
- Activity streak display (read-only)
- Save/Cancel buttons with unsaved changes warning

##### Onboarding (`/onboarding`)

- Required first-time profile setup (cannot be skipped)
- Clear explanations for experience level and years away
- Simple form with validation
- Redirect to dashboard on completion

#### 3. **Component Design Patterns**

##### Topic Card Component

**Variants**: Parent (default) and Child (indented with left border accent)

**Structure** (composition pattern):

- `TopicCard.Header`: Title (truncate 2 lines), status badge (top-right), action menu (three-dot)
- `TopicCard.Body`: Description (truncate 3 lines with "Read more"), LeetCode problems (collapsible)
- `TopicCard.Footer`: Technology badge, timestamp, children count, LeetCode count

**Interactions**:

- Click title/card → Expand inline to show full content
- Click status badge → Dropdown to change status (optimistic update)
- Click expand button (parent) → Lazy-load children via `/api/topics/:id/children`
- Click action menu → Edit or Delete options
- Swipe left (mobile) → Reveal delete button

##### Form Components

- **Topic Form** (Create/Edit): Modal with title, technology, description, parent selector, status, LeetCode links
- **Profile Form**: Experience level (card-style radio), years away (number input with steppers)
- **Validation**: Real-time on blur, inline errors below fields, character counters
- **LeetCode Links**: Add/remove interface with title/URL/difficulty, max 50 with counter

##### Filter/Sort Toolbar

- Status filter (multi-select dropdown)
- Technology filter (searchable dropdown)
- Sort dropdown (Newest, Oldest, Title A-Z, Recently Updated)
- View toggle (All topics / Root topics only)
- Clear filters button (when active)
- Active filter chips with individual removal

##### Loading States

- **AI Generation**: Full-screen modal with spinner, progress messages ("Analyzing...", "Generating..."), estimated time
- **Initial Page Load**: Skeleton loaders (6-8 TopicCard skeletons with pulse animation)
- **Background Mutations**: Top progress bar (nprogress-style) + small spinner on affected element
- **Optimistic Updates**: Immediate UI change + "Saving..." indicator

##### Empty States

- **No Topics**: Large illustration, "Start your learning journey" heading, "Generate Topics" CTA
- **No Completed Topics**: Encouraging message with progress-focused copy
- **Filtered Empty**: "No topics match your filters" + "Clear filters" button
- **Recent Activity Empty**: "No activity yet" + "View All Topics" link

#### 4. **API Integration & State Management**

##### State Management Strategy (Hybrid Approach)

1. **URL Search Params**: Filters, sorting, pagination (enables sharing and browser history)
2. **React Context**: User profile, authentication state (global app state)
3. **Local Component State**: UI interactions (modals open/closed, dropdowns, form inputs)
4. **sessionStorage**: Cached topics list (5min TTL), profile data
5. **localStorage**: Last used technology (convenience), help dismissal flags

##### API Communication Patterns

- **Authentication**: httpOnly cookies with JWT tokens (managed server-side)
- **Protected Endpoints**: Authorization header with Bearer token
- **Optimistic Updates**: Immediate UI change → API call → Rollback on error
- **Error Mapping**: Utility function maps API error codes to user-friendly messages
- **Cache Invalidation**: Clear cache after mutations (create/update/delete)
- **Rate Limiting**: Display remaining quota from X-RateLimit-\* headers

##### Key API Integrations

| Feature         | Endpoint                   | Method | State Management                  |
| --------------- | -------------------------- | ------ | --------------------------------- |
| Dashboard Stats | `/api/dashboard/stats`     | GET    | React Context + Manual Refresh    |
| Topics List     | `/api/topics`              | GET    | URL params + sessionStorage cache |
| Topic Children  | `/api/topics/:id/children` | GET    | Lazy-load on expand               |
| Create Topic    | `/api/topics`              | POST   | Optimistic + Cache invalidation   |
| Update Topic    | `/api/topics/:id`          | PATCH  | Optimistic + Toast feedback       |
| Delete Topic    | `/api/topics/:id`          | DELETE | Optimistic + Confirmation dialog  |
| Generate Topics | `/api/topics/generate`     | POST   | Loading modal + Rate limit check  |
| Get Profile     | `/api/profile`             | GET    | React Context (cached)            |
| Update Profile  | `/api/profile`             | PATCH  | Optimistic + Context update       |

##### Caching Strategy

- **Profile Data**: Cache on login, refresh only on explicit update
- **Topics List**: Cache for 5 minutes, manual refresh button available
- **Dashboard Stats**: Fetch on load, auto-invalidate after mutations
- **Filters/Sorts**: Persist in URL for shareability
- **Last Technology**: Store in localStorage for convenience

##### Error Handling (Three-Tier)

1. **React Error Boundaries**: Component crashes → Friendly fallback UI with "Refresh" and "Go to Dashboard" buttons
2. **Toast Notifications**: API errors → User-friendly messages (bottom-right desktop, top-center mobile, 3-4s auto-dismiss)
3. **Dedicated Error Pages**: 401 → Redirect to login, 404 → Not Found page

##### Rate Limiting UI

- Display remaining generations below Generate button: "X of 5 generations remaining this hour"
- Warning color (amber) when 1 remaining
- Disable button and show countdown when limit exceeded: "Rate limit reached. Resets in 42 minutes"
- Use X-RateLimit-Remaining and X-RateLimit-Reset headers

#### 5. **Responsiveness & Adaptive Design**

##### Breakpoints (Tailwind defaults)

- **Mobile** (<768px): Single column, stacked cards, hamburger menu, bottom sheets for modals
- **Tablet** (768-1024px): Two-column grid, sidebar navigation visible
- **Desktop** (>1024px): Three-column grid for topics, persistent sidebar, side-by-side dashboard cards

##### Mobile-Specific Optimizations

- Touch targets: 44x44px minimum
- Swipe-to-delete gesture on topic cards
- Pull-to-refresh on topics list
- Bottom sheet modals (instead of center modals)
- Sticky FAB for "Generate Topics" action
- Larger spacing between interactive elements (8px min)

##### Layout Adaptations

- **Dashboard Cards**: 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
- **Topics Grid**: 3 columns → 2 columns → 1 column
- **Filter Toolbar**: Horizontal controls → "Filters" drawer on mobile
- **Navigation**: Top bar → Hamburger menu with drawer
- **Breadcrumbs**: Full path → Truncated on mobile

#### 6. **Accessibility Considerations (WCAG AA)**

##### Keyboard Navigation

- Tab navigation through all interactive elements in logical order
- Arrow keys for navigating topic cards in grid
- Enter/Space to expand/collapse hierarchies
- Escape to close modals and dropdowns
- Focus trap in modals (Tab cycles within)
- Visible focus indicators (Tailwind focus-visible: variants)

##### ARIA Attributes

- `aria-expanded` and `aria-controls` on expandable topics
- `aria-live="polite"` for status change announcements
- `aria-label` on icon-only buttons (action menu, navigation icons)
- `aria-labelledby` for form sections and modal titles
- `role="region"` for expanded child topics container
- `aria-current` for active navigation items

##### Visual Accessibility

- Color contrast: 4.5:1 minimum for text (WCAG AA)
- Status indicators: Color + text + icon (not color alone)
  - To Do: gray circle + "To Do" text
  - In Progress: blue half-circle + "In Progress" text
  - Completed: green checkmark + "Completed" text
- Difficulty badges: Color + text + icon
  - Easy: green background + "Easy" + circle icon
  - Medium: yellow background + "Medium" + triangle icon
  - Hard: red background + "Hard" + square icon
- Respect `prefers-reduced-motion` for animations

##### Screen Reader Support

- Clear aria-labels: "Expand to show 3 child topics" on expand buttons
- Announce state changes with aria-live regions
- Semantic HTML (main, nav, article, section landmarks)
- Skip to main content link
- Form labels properly associated with inputs

#### 7. **Security & Authorization**

##### Client-Side Security

- **Token Storage**: httpOnly cookies (server-managed), NOT localStorage
- **Token Refresh**: Automatic before 1-hour expiration via Supabase
- **Session Expiration**: Modal with "Sign in again" on token failure
- **Input Sanitization**: Zod validation on all form inputs
- **XSS Prevention**: React's built-in escaping + CSP headers
- **CSRF Protection**: Supabase Auth built-in protection

##### Authorization Patterns

- Protected routes check auth via Astro middleware
- Redirect to landing page if unauthenticated
- Redirect to onboarding if profile incomplete
- RLS enforced at database level (users see only their data)
- 404 response for unauthorized resources (don't expose existence)

##### UI-Level Security Considerations

- Never display sensitive tokens in UI or console (production)
- Disable browser autocomplete on sensitive fields
- Clear sensitive data from state on logout
- Warn before leaving page with unsaved changes
- Confirm destructive actions (delete with children count)

#### 8. **Visual Design System**

##### Color Palette

- **Primary**: Blue shades for CTAs, links, active states
- **Success**: Green for completed status, positive actions
- **Warning**: Yellow/orange for in-progress, cautions
- **Destructive**: Red for delete actions, errors
- **Muted**: Gray shades for secondary text, borders
- **Semantic tokens**: `--color-topic-todo`, `--color-topic-progress`, `--color-topic-completed`

##### Typography Scale

- **Page Titles**: text-3xl font-bold (Dashboard, Topics)
- **Card Titles**: text-xl font-semibold (Topic titles)
- **Section Headings**: text-lg font-medium (Practice Problems)
- **Body Text**: text-base (Descriptions, content)
- **Meta Text**: text-sm text-muted-foreground (Timestamps, counts)
- **Labels**: text-sm font-medium (Form labels)
- **Line Height**: 1.5 for body, 1.2 for headings
- **Base Size**: 16px minimum for accessibility

##### Icon System

- **Library**: Lucide React (aligns with Shadcn/ui)
- **Semantic Mapping**: `icons.ts` file with aliases (e.g., `StreakIcon = Flame`)
- **Sizes**: 16px (inline), 20px (buttons), 24px (card headers), 32px+ (empty states)
- **Usage**: aria-hidden="true" on decorative, aria-label on interactive

##### Spacing & Layout

- Consistent use of Tailwind spacing scale (4px increments)
- Card padding: p-6 (desktop), p-4 (mobile)
- Gap between cards: gap-4 (mobile), gap-6 (desktop)
- Section spacing: space-y-6 or space-y-8
- Minimum touch target spacing: 8px between elements

##### Animation Guidelines

- **Page Transitions**: Astro View Transitions with 200ms fade
- **Card Entrance**: Staggered fade-in for generated topics (highlight effect for 2s)
- **Status Updates**: Subtle pulse on badge during save
- **Loading**: Skeleton pulse animation, top progress bar
- **Micro-interactions**: Hover states on buttons, scale on press
- **Respect Motion**: Honor prefers-reduced-motion (disable animations)

#### 9. **Performance Optimization**

##### Loading Strategies

- **SSR**: Astro pre-renders all public pages and initial authenticated pages
- **React Islands**: Hydrate only interactive components (forms, dropdowns, modals)
- **Lazy Loading**: Load child topics only when parent expanded
- **Code Splitting**: React.lazy() for large components (if needed post-MVP)
- **Image Optimization**: Astro Image component for landing page images

##### Caching & Data Fetching

- Session-based caching for topics (5min TTL)
- Optimistic updates to avoid wait times
- Debounced search (300ms delay)
- Pagination to limit initial data fetch (50 items default)
- Manual refresh option (don't auto-poll)

##### Bundle Optimization

- Tree-shake Shadcn/ui (import only used components)
- Use Tailwind purge in production
- Minimize JavaScript payload (Astro handles this well)
- System font stack (no web font downloads)

##### Perceived Performance

- Skeleton loaders on initial load
- Optimistic UI updates (immediate feedback)
- Non-blocking API calls with subtle progress indicators
- Staggered animations on list items
- Top progress bar for long operations

#### 10. **User Flows & Journey Maps**

##### New User Journey

1. Land on landing page → Read value proposition
2. Click "Get Started Free" → Sign up form (email + password)
3. Auto-login → Redirect to `/onboarding`
4. Complete profile (experience level + years away) → Save
5. Redirect to `/dashboard` → See empty state with "Generate Topics" CTA
6. Select technology (e.g., "React") → Click "Generate"
7. Loading modal (15-30s) → Topics appear with highlight animation
8. View generated topics → Expand parent to see children
9. Click status badge → Change to "In Progress" (optimistic update)
10. Complete studying → Change status to "Completed" → Streak increments

##### Returning User Journey

1. Navigate to app URL → Auto-login (if token valid) → Dashboard
2. See dashboard with streak, stats, recent activity
3. View topics list → Apply filters (e.g., "In Progress")
4. Click topic → Expand to see LeetCode problems
5. Click LeetCode link → Open in new tab → Practice
6. Return to app → Update status to "Completed"
7. See success toast + updated dashboard stats

##### Topic Management Flow

1. **Create Manually**: Topics toolbar → "Create Topic" → Fill form → Save → Optimistic add to list
2. **Edit Topic**: Topic card menu → Edit → Modify fields → Save → Optimistic update
3. **Delete Topic**: Topic card menu → Delete → Confirmation (show children count) → Confirm → Optimistic remove
4. **Expand Hierarchy**: Click parent topic → Lazy-load children → View nested structure
5. **Filter Topics**: Select status/technology filters → URL updates → List re-renders → Clear filters

##### Profile Management Flow

1. Top navigation → User menu → "Profile Settings"
2. Navigate to `/profile` → See current values
3. Edit experience level or years away → Validation on blur
4. Click "Save Changes" → Optimistic update → Toast confirmation
5. Navigate away → No unsaved changes warning

#### 11. **Edge Cases & Special Scenarios**

##### Partial Failures

- **AI Generation**: If some topics save but others fail:
  - Display warning toast: "12 of 15 topics created. Some failed to save."
  - Show successful topics in list
  - Provide "Retry Failed Topics" button
  - Log errors for debugging

##### Concurrent Edits

- After 5min of inactivity, show banner: "Your data may be outdated. Refresh to see latest changes"
- If API returns conflict error, show: "This topic was modified elsewhere. Please refresh and try again."
- Compare updated_at timestamps to detect staleness

##### Offline Scenarios

- Detect offline state (navigator.onLine)
- Show persistent banner: "You're offline. Some features unavailable."
- Cache last fetched data in sessionStorage for read-only access
- Queue mutations in localStorage with retry when online
- Disable AI generation and network-dependent features

##### Rate Limit Exceeded

- Disable "Generate" button
- Show countdown: "Rate limit reached. Resets in 42 minutes"
- Display remaining quota before generation
- Allow other features to continue working

##### Empty Profiles

- Prevent topic generation if profile incomplete
- Show banner on dashboard: "Complete your profile to start generating topics"
- Provide "Set Up Profile" CTA
- API returns 404 if generation attempted without profile

##### Long Content

- Truncate titles after 2 lines with ellipsis
- Truncate descriptions after 3 lines with "Read more" link
- Show full content on inline expansion or tooltip
- Set max-width on cards to prevent horizontal overflow

##### Deeply Nested Hierarchies

- Allow unlimited depth (database supports it)
- Show breadcrumbs for context: "React → Hooks → useState"
- Warning if nesting beyond 3 levels (but still allow)
- Lazy-load each level to avoid fetching entire tree

#### 12. **Component Implementation Details**

##### TopicCard Component

```typescript
<TopicCard variant="parent" | "child">
  <TopicCard.Header>
    <Title /> {/* truncate-2-lines, tooltip on hover */}
    <StatusBadge /> {/* top-right, clickable dropdown */}
    <ActionMenu /> {/* three-dot, Edit/Delete options */}
  </TopicCard.Header>

  <TopicCard.Body>
    <Description /> {/* truncate-3-lines, "Read more" */}
    <LeetCodeSection /> {/* collapsible, difficulty badges */}
    {variant === "parent" && <ExpandButton />}
  </TopicCard.Body>

  <TopicCard.Footer>
    <TechnologyBadge /> {/* colored chip */}
    <Timestamp /> {/* relative time */}
    <ChildrenCount /> {/* if parent */}
    <LeetCodeCount /> {/* if has links */}
  </TopicCard.Footer>
</TopicCard>
```

##### Dashboard Layout

```typescript
<Dashboard>
  <DashboardGrid>
    <ProfileStreakCard /> {/* row 1, col 1 */}
    <TopicGenerationCard /> {/* row 1, col 2-3 */}
    <TopicsOverviewCard /> {/* row 2, col 1 */}
    <TechnologyBreakdownCard /> {/* row 2, col 2 */}
    <RecentActivityCard /> {/* row 3, full width */}
  </DashboardGrid>
</Dashboard>
```

##### Filter Toolbar

```typescript
<FilterToolbar>
  <StatusFilter multi-select />
  <TechnologyFilter searchable />
  <SortDropdown />
  <ViewToggle /> {/* All / Root only */}
  <ClearFiltersButton /> {/* if active */}
  <ActiveFilterChips /> {/* removable */}
</FilterToolbar>
```

##### Form Validation Pattern

```typescript
// Zod schema validation
const topicSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  technology: z.string().min(1).max(100),
  status: z.enum(['to_do', 'in_progress', 'completed']),
  leetcode_links: z.array(leetcodeLinkSchema).max(50)
});

// Real-time validation on blur
<Input
  onBlur={(e) => validate('title', e.target.value)}
  error={errors.title}
/>

// Show all errors on submit
<Form onSubmit={handleSubmit}>
  {errors.map(error => <ErrorMessage key={error.field} {...error} />)}
</Form>
```

#### 13. **Technology Integration Details**

##### Astro Integration

- SSR mode enabled (`output: "server"`)
- React integration for interactive islands
- Middleware for auth checks and redirects
- View Transitions API for smooth page changes
- API routes in `src/pages/api/` with `export const prerender = false`

##### React Integration

- Functional components with hooks only
- NO "use client" directive (this is Astro, not Next.js)
- Custom hooks in `src/components/hooks/`
- React.memo() for expensive components
- Error Boundaries at layout level

##### Shadcn/ui Components

Use these pre-built components:

- Button, Card, Form, Input, Textarea, Select, Checkbox, Radio
- Dialog, Sheet (mobile), Dropdown Menu, Popover
- Toast, Alert Dialog, Breadcrumb, Badge, Skeleton
- Pagination, Combobox (technology autocomplete)

##### Tailwind CSS 4

- Custom theme colors in config
- Responsive variants (sm:, md:, lg:)
- State variants (hover:, focus-visible:, active:)
- Dark mode support with `dark:` variant
- @layer directive for organized styles

##### Supabase Integration

- Auth for authentication (JWT tokens)
- PostgreSQL database with RLS
- Use `supabase` from `context.locals` in Astro
- Type-safe client from `src/db/supabase.client.ts`

#### 14. **Development Guidelines**

##### Code Organization

```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── common/             # Header, Footer, ErrorBoundary
│   └── features/
│       ├── topics/         # TopicCard, TopicList, TopicForm
│       ├── dashboard/      # Dashboard cards
│       └── profile/        # Profile forms
├── layouts/                # Astro layouts
├── pages/                  # Astro pages & API routes
├── lib/
│   ├── services/          # Business logic
│   ├── utils/             # Helpers
│   └── validators/        # Zod schemas
└── types.ts               # Shared types
```

##### Naming Conventions

- Components: PascalCase (TopicCard.tsx)
- Files: kebab-case (topic-card.tsx)
- Functions: camelCase (fetchTopics)
- Constants: UPPER_SNAKE_CASE (MAX_TOPICS)

##### Best Practices

- Handle errors at function start (guard clauses)
- Use early returns to avoid nesting
- Validate with Zod on both client and server
- Extract business logic to services
- Use TypeScript strictly (no `any`)
- Add aria-labels for accessibility
- Test with keyboard navigation and screen readers

---

## Unresolved Issues

### No Unresolved Issues

All questions have been answered and recommendations approved by the user with one exception:

**Explicitly Rejected Features:**

- Onboarding tutorials/guided tours (Question 55) - User decision: "Do not implement any onboarding for MVP"

**Clarifications for Implementation:**
All 70 questions have been addressed with clear recommendations. The UI architecture is fully defined and ready for implementation. No ambiguities or missing information remain for the MVP scope.

**Post-MVP Considerations** (Documented but not blocking):

- Bulk actions on topics (recommended to skip for MVP simplicity)
- Infinite scroll as alternative to pagination (standard pagination approved for MVP)
- WebSocket-based real-time sync for concurrent edits (simple detection approved for MVP)
- Detailed topic page with comments/attachments (inline interactions approved for MVP)
- Dashboard layout customization (fixed layout approved for MVP)
