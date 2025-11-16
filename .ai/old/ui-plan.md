# UI Architecture for Development Refresher Training

## 1. UI Structure Overview

Development Refresher Training follows a **dashboard-centric, server-side rendered architecture** built with Astro 5, React 19, TypeScript, Tailwind CSS 4, and Shadcn/ui. The application guides former developers through a structured journey to refresh their technical skills using AI-powered topic generation, hierarchical learning paths, and integrated practice resources.

### Core Architecture Principles

- **Server-Side Rendering (SSR)**: Astro handles page rendering with React islands for interactive components
- **Progressive Enhancement**: Core functionality works without JavaScript; enhancements add interactivity
- **Dashboard-Centric**: All authenticated features accessible from a unified dashboard view
- **Optimistic UI**: Immediate feedback with server-side validation and rollback on errors
- **Accessibility-First**: WCAG AA compliance with full keyboard navigation and screen reader support

### Authentication & State Management

- **Authentication**: Supabase Auth with httpOnly cookies (server-managed)
- **State Strategy**:
  - URL search params for filters, sorts, pagination (shareable, browser history)
  - React Context for user profile and auth state
  - sessionStorage for cached topics (5min TTL) and profile data
  - localStorage for convenience features (last technology used)

---

## 2. View List

### 2.1. Landing Page

**Path**: `/`  
**Type**: Public (unauthenticated)  
**Main Purpose**: Convert visitors to registered users by communicating value proposition

#### Key Information to Display

- Hero section with compelling headline: "Refresh Your Coding Skills"
- Subheadline explaining AI-powered learning for returning developers
- Primary CTA: "Get Started Free" (prominent button)
- Secondary CTA: "Sign In" (header link for returning users)
- Features showcase (3 cards):
  - AI-Generated Topics
  - Progress Tracking
  - LeetCode Integration
- "How It Works" section (3 steps):
  - Create Profile → Generate Topics → Track Progress
- Footer with legal links (Privacy Policy, Terms) and contact information

#### Key Components

- Hero component with headline, subheadline, CTA buttons
- Feature cards with icons, titles, descriptions
- Process steps with numbered icons and explanatory text
- Navigation header (minimal: logo + Sign In link)
- Footer component

#### UX Considerations

- Clear value proposition within 5 seconds of landing
- Developer-focused copy that resonates with target audience
- Minimal friction to sign up (email + password only)
- Mobile-responsive with readable text and appropriately sized CTAs

#### Accessibility

- Semantic HTML (header, main, section, footer landmarks)
- Alt text for all images and icons
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators on interactive elements

#### Security

- No sensitive data exposure
- HTTPS enforcement
- CSP headers for XSS prevention

---

### 2.2. Onboarding Page

**Path**: `/onboarding`  
**Type**: Protected (authenticated, no profile)  
**Main Purpose**: Collect required profile information for AI topic generation

#### Key Information to Display

- Page title: "Set Up Your Profile"
- Introductory text: "Help us tailor topics to your experience"
- Experience level selector (required)
- Years away from development input (required)
- Save button (primary action)
- No skip option (required step)

#### Key Components

**Experience Level Selector**:

- Card-style radio group with 3 options:
  - **Junior**: Icon (Seedling 🌱), Label "Junior Developer", Description "0-2 years of professional experience"
  - **Mid**: Icon (Tree 🌳), Label "Mid-Level Developer", Description "2-5 years of professional experience"
  - **Senior**: Icon (Trees 🌲🌲), Label "Senior Developer", Description "5+ years of professional experience"
- Full card clickable (not just radio button)
- Selected card: primary border and background tint
- Vertical stack on mobile, horizontal on tablet/desktop

**Years Away Input**:

- Number input with stepper controls (+/- buttons)
- Range: 0-30 years
- Clear label: "How many years have you been away from development?"
- Helper text: "This helps us recommend relevant topics"

**Validation**:

- Real-time validation on blur
- Inline error messages below fields
- Form-level validation on submit
- Clear, instructive error messages

#### User Flow

1. User registers → Auto-login → Redirect to `/onboarding`
2. User selects experience level (required)
3. User enters years away (required)
4. User clicks "Save" → Validation
5. If valid: POST /api/profile → Redirect to `/dashboard`
6. If invalid: Show errors, allow correction

#### UX Considerations

- Cannot skip or close (required for AI generation)
- Clear explanations for why information is needed
- Simple, focused form (2 fields only)
- Encouraging tone: "Almost there!"
- Auto-focus on first field
- Enter key submits form

#### Accessibility

- Form labels properly associated with inputs
- aria-describedby for helper text
- Error messages announced with aria-live="polite"
- Keyboard navigation through radio cards
- Focus trap (Tab stays within page)

#### Security

- Server-side validation (Zod schema)
- Profile can only be created once per user
- RLS ensures user can only create own profile

---

### 2.3. Dashboard

**Path**: `/dashboard`  
**Type**: Protected (authenticated with profile)  
**Main Purpose**: Unified hub for topic generation, management, and progress tracking

#### Key Information to Display

Dashboard consists of 5 main card sections in fixed order:

1. **Profile & Streak Card** (top-right)
2. **Topic Generation Card** (top-left/center)
3. **Topics Overview Card** (metrics)
4. **Topics List** (main content area)
5. **Recent Activity Card** (bottom)

#### Key Components

##### 2.3.1. Profile & Streak Card

**Data Source**: Context (user profile), API (activity streak)

**Display Elements**:

- User email or initials
- Experience level badge (Junior/Mid/Senior with icon)
- Years away display
- Activity streak with flame icon 🔥
- Streak count (large, bold): "7 day streak!"
- Motivational text: "Keep it up!" or "Start a new streak!"
- 7-day calendar visualization with checkmarks for active days
- Milestone animations at 7, 30, 100 days (confetti effect)

**Interactions**:

- Read-only display
- Link to "Edit Profile" (navigates to /profile)

**Empty State**: If streak = 0, show "Complete your first topic to start your streak!"

##### 2.3.2. Topic Generation Card

**Data Source**: API /api/topics/generate

**Display Elements**:

- Card title: "Generate Learning Topics"
- Technology input: Autocomplete combobox
  - Curated list: React, TypeScript, Node.js, Python, JavaScript, etc.
  - Custom input allowed: "Press Enter to use '[custom value]'"
  - Recently used section at top
  - Search/filter as user types
- Rate limit display: "X of 5 generations remaining this hour"
  - Green when >2, amber when 1, red when 0
  - Countdown timer when limit reached
- Generate button (primary, prominent)
  - Disabled states: No technology selected, rate limit reached, profile incomplete
  - Tooltip on disabled: "Select a technology to generate topics"

**Loading State** (AI Generation in Progress):

- Full-screen modal overlay
- Loading spinner (centered)
- Progress messages (rotate every 5 seconds):
  - "Analyzing your profile..."
  - "Generating personalized topics..."
  - "Creating your learning plan..."
- Estimated time: "This usually takes 15-30 seconds"
- Cannot be dismissed (no X button)

**Success State**:

- Modal closes
- Toast notification: "Generated X topics for [Technology]"
- New topics animate into Topics List at top with highlight effect (2s fade)
- Auto-scroll to first new topic

**Error States**:

- Complete failure: Alert dialog with "Try Again" and "Contact Support" buttons
- Partial failure: Warning toast "12 of 15 topics created. Some failed to save." + "Retry Failed" button

**Profile Incomplete State**:

- If no profile exists:
  - Disable technology input and button
  - Show banner: "Complete your profile to start generating topics"
  - "Set Up Profile" CTA button

##### 2.3.3. Topics Overview Card

**Data Source**: API /api/dashboard/stats

**Display Elements**:

- Card title: "Your Progress"
- Total topics count
- Status breakdown with colored badges:
  - To Do: X topics (gray circle)
  - In Progress: X topics (blue half-circle)
  - Completed: X topics (green checkmark)
- Technology breakdown:
  - List of technologies with progress bars
  - "React: 8/15 completed" with visual bar
- Last updated timestamp: "Updated 2 minutes ago"
- Manual refresh button (icon, non-intrusive)

**Interactions**:

- Click refresh icon → Refetch /api/dashboard/stats
- Show loading spinner on refresh
- Auto-invalidate after topic mutations

##### 2.3.4. Topics List (Main Content)

**Data Source**: API /api/topics with query params for filtering/sorting/pagination

**Structure**:

```
[Filter Toolbar]
[Search Bar]
[Topic Cards Grid]
[Pagination Controls]
```

**Filter Toolbar** (sticky, above topic cards):

- Status filter: Multi-select dropdown (To Do, In Progress, Completed)
- Technology filter: Searchable dropdown (populated from user's technologies)
- Sort dropdown: Newest First, Oldest First, Title A-Z, Recently Updated
- View toggle: "All Topics" | "Root Topics Only"
- Active filter chips: Removable (click X to remove individual filter)
- "Clear All Filters" button (visible when filters active)
- Filter count badge: "Filters (3 active)"

**Search Bar**:

- Text input with search icon
- Placeholder: "Search topics..."
- Debounced search (300ms delay)
- Matches against: title, description, technology
- Result count: "Showing 12 of 45 topics"
- Highlight matching text in results

**Topic Cards Grid**:

- Responsive grid: 3 columns (desktop), 2 (tablet), 1 (mobile)
- Gap: 6 (desktop), 4 (mobile)
- Each card follows TopicCard component structure (detailed below)

**Empty States**:

- No topics at all:
  - Large illustration
  - "Start your learning journey"
  - "Generate Topics" CTA (scrolls to generation card)
- Filtered empty:
  - "No topics match your filters"
  - Active filter chips shown
  - "Clear Filters" button
- Search empty:
  - "No results for '[query]'"
  - "Try different keywords"

**Pagination Controls** (bottom of list):

- Previous/Next buttons
- Page numbers (with ellipsis for large counts): 1 ... 5 6 7 ... 20
- "Go to page" input for quick navigation
- Items per page selector: 25, 50, 100
- Total display: "Showing 26-50 of 127 topics"
- URL-based: ?page=2&limit=50

**TopicCard Component** (detailed spec):

**Variants**:

- `parent`: Default styling, shows expand button if has children
- `child`: Left border accent, reduced padding, indented appearance

**Card Structure**:

```
┌─────────────────────────────────────────┐
│ [Title]                    [Status Badge]│
│ [Description]              [Action Menu] │
│                                          │
│ [LeetCode Section - collapsed by default]│
│                                          │
│ [Tech Badge] [Timestamp] [Children: 3]  │
└─────────────────────────────────────────┘
```

**Header Section**:

- Title: text-xl, font-semibold, truncate 2 lines
  - Tooltip on hover shows full title
  - Clickable to expand/collapse card details
- Status Badge (top-right corner):
  - Color-coded: gray (To Do), blue (In Progress), green (Completed)
  - Icon: circle, half-circle, checkmark
  - Text: "To Do", "In Progress", "Completed"
  - Clickable → Dropdown menu to change status
  - Optimistic update: immediate UI change, API call, rollback on error
- Action Menu (three-dot kebab icon):
  - Dropdown menu: Edit, View Details (if applicable), Delete (destructive)
  - aria-label="Topic actions"

**Body Section**:

- Description: text-base, truncate 3 lines
  - "Read more" link expands inline
  - Full description shows in expanded state
- LeetCode Section (collapsible):
  - Header: "Practice Problems (X)" with chevron
  - Collapsed by default (unless has links)
  - Expanded shows list of LeetCode links:
    - Problem title (linked)
    - Difficulty badge: Easy (green circle), Medium (yellow triangle), Hard (red square)
    - Color + text + icon for accessibility
    - External link icon
  - "Open all in new tabs" button if multiple problems
- Expand Button (parent topics only):
  - Shows if children_count > 0
  - Icon: ChevronDown (collapsed), ChevronUp (expanded)
  - Text: "Show X subtopics" / "Hide subtopics"
  - aria-expanded, aria-controls attributes
  - Click → Lazy load children via GET /api/topics/:id/children
  - Children render as indented child variant cards below parent

**Footer Section** (metadata):

- Technology Badge: Colored chip (category-based coloring)
- Timestamp: Relative time ("2 hours ago"), tooltip with full date/time
- Children Count (if parent): "3 subtopics" with nested icon
- LeetCode Count (if has links): "2 practice problems" with code icon
- All: text-sm, text-muted-foreground, horizontal layout

**Interactions**:

- Click title/card → Expand inline to show full content
- Click status badge → Dropdown to change status
- Click expand button → Lazy-load and show children
- Click action menu → Show Edit/Delete options
- Swipe left (mobile) → Reveal delete button
- Edit → Open modal form (pre-populated)
- Delete → Show confirmation dialog with child count warning

**Loading States**:

- Initial load: 6-8 skeleton cards with pulse animation
- Expanding children: Small spinner on expand button
- Status update: Pulse animation on status badge + "Saving..." indicator
- Mutation feedback: Non-blocking top progress bar

##### 2.3.5. Recent Activity Card

**Data Source**: API /api/dashboard/stats (recent_activity array)

**Display Elements**:

- Card title: "Recent Activity"
- Timeline list of recent completed actions:
  - Topic title (linked to topic)
  - Action: "marked as completed", "created", "updated"
  - Timestamp: relative time
  - Max 5-10 items shown
- "View All" link (if applicable)

**Empty State**:

- Icon: Activity or TrendingUp
- "No activity yet"
- "Start reviewing topics to see your progress here"
- "View All Topics" link button

#### Navigation (Dashboard)

**Top Navigation Bar** (persistent across authenticated views):

- Logo/App Name (left, linked to /dashboard)
- Primary links: "Dashboard" (active state indicator)
- User Menu (right):
  - User avatar/initials (clickable dropdown trigger)
  - Dropdown menu:
    - Email display (non-interactive, truncated if long)
    - "Profile Settings" → /profile
    - Divider
    - "Sign Out" (destructive color)

**Mobile Navigation** (<768px):

- Hamburger menu icon (left)
- Logo/App Name (center)
- User avatar (right)
- Drawer menu with same structure

#### User Flows on Dashboard

**Generate Topics Flow**:

1. Select technology from autocomplete
2. Click "Generate" → Loading modal (15-30s)
3. Topics appear at top of list with highlight animation
4. Success toast notification
5. Can immediately interact with new topics

**Update Topic Status Flow**:

1. Click status badge on topic card
2. Dropdown shows 3 status options
3. Select new status → Optimistic UI update
4. API call in background (PATCH /api/topics/:id)
5. Success: Subtle confirmation, update dashboard stats
6. Error: Rollback UI, show error toast

**Expand Hierarchy Flow**:

1. Click expand button on parent topic
2. Show loading spinner
3. Fetch children via GET /api/topics/:id/children
4. Render child cards below parent (indented, with border)
5. Repeat for nested children as needed

**Filter Topics Flow**:

1. Select filters from toolbar
2. URL updates with query params
3. Topic list re-renders with filtered results
4. Active filter chips show below toolbar
5. Click chip X or "Clear All" to remove filters

**Create Manual Topic Flow**:

1. Click "Create Topic" button in toolbar
2. Modal opens with form:
   - Title (required, max 500 chars with counter)
   - Technology (required, autocomplete)
   - Description (optional, max 5000 chars)
   - Parent topic selector (optional, searchable dropdown)
   - Status (default: To Do)
   - LeetCode links (add/remove interface)
3. Validate on blur, show inline errors
4. Click "Save" → Optimistic add to list
5. API call: POST /api/topics
6. Success: Toast confirmation
7. Error: Show error, allow retry

**Edit Topic Flow**:

1. Click action menu → Edit
2. Same modal as create, pre-populated
3. Cannot change parent_id (show as read-only)
4. Modify fields
5. Click "Save Changes" → Optimistic update
6. API call: PATCH /api/topics/:id
7. Success: Toast confirmation
8. Error: Rollback, show error

**Delete Topic Flow**:

1. Click action menu → Delete
2. Confirmation dialog opens:
   - Topic title shown
   - Warning if has children: "This will also delete X child topics"
   - "This action cannot be undone"
   - Cancel (default) and Delete (destructive) buttons
3. Click Delete → Optimistic removal from list
4. API call: DELETE /api/topics/:id (cascades to children)
5. Success: Topic and children removed
6. Error: Re-add to list, show error toast

#### UX Considerations

- Dashboard is the primary authenticated view (no separate Topics page)
- All features accessible without excessive navigation
- Clear visual hierarchy: generation at top, list in center, stats in cards
- Responsive grid adapts to screen size
- Optimistic updates for instant feedback
- Loading states prevent confusion during async operations
- Empty states guide users toward actions
- Filters and search accessible but not obtrusive

#### Accessibility

- Skip to main content link
- Landmark regions (main, navigation, complementary for cards)
- ARIA attributes on interactive elements:
  - aria-expanded on expandable topics
  - aria-controls linking expand button to children container
  - aria-live="polite" for status changes
  - aria-label on icon-only buttons
- Full keyboard navigation:
  - Tab through all interactive elements
  - Arrow keys for navigating topic card grid
  - Enter/Space to expand/collapse
  - Escape to close modals/dropdowns
- Focus trap in modals
- Visible focus indicators
- Color + text + icon for status (not color alone)
- Screen reader announcements for async updates

#### Security

- Auth check via Astro middleware (redirect if not authenticated)
- Profile check (redirect to /onboarding if incomplete)
- RLS ensures users only see own topics
- Input validation (Zod schemas on client and server)
- CSRF protection via Supabase Auth
- Rate limiting enforced and displayed
- No sensitive data in URLs
- httpOnly cookies for tokens

---

### 2.4. Profile Settings Page

**Path**: `/profile`  
**Type**: Protected (authenticated with profile)  
**Main Purpose**: Allow users to update their profile information

#### Key Information to Display

- Page title: "Profile Settings"
- Form with current profile values pre-populated
- Experience level selector (same as onboarding)
- Years away input (same as onboarding)
- Activity streak (read-only display)
- Save Changes button (primary)
- Cancel button (secondary, navigates back)

#### Key Components

- Same form components as onboarding
- Activity Streak Display:
  - Label: "Activity Streak"
  - Value with flame icon: "7 days 🔥"
  - Helper text: "This is calculated automatically"
  - Non-editable (disabled/read-only styling)

#### User Flow

1. Click "Profile Settings" from user menu
2. Navigate to /profile
3. Form displays with current values from Context
4. Edit experience level or years away
5. Validation on blur
6. Click "Save Changes" → Validation
7. If valid: Optimistic update in UI, PATCH /api/profile
8. Success: Toast "Profile updated", update Context
9. Error: Rollback UI, show error toast
10. Click "Cancel" → Navigate back (browser back or /dashboard)

#### UX Considerations

- Pre-populate all fields (no empty form)
- Show unsaved changes indicator if values differ from saved
- Warn before leaving page with unsaved changes
- Clear feedback on save success/failure
- Breadcrumb: Dashboard > Profile Settings

#### Accessibility

- Same accessibility requirements as onboarding form
- Clearly indicate read-only streak field

#### Security

- Server-side validation
- RLS ensures user can only update own profile
- No ability to change user_id or created_at

---

### 2.5. Error Pages

#### 2.5.1. 401 Unauthorized

**Trigger**: Invalid or expired token, accessing protected route without auth

**Display**:

- Status code: 401
- Icon: Lock or ShieldAlert
- Heading: "Authentication Required"
- Message: "Your session has expired. Please sign in again."
- Primary CTA: "Sign In" → Redirect to auth
- Preserve intended URL for post-login redirect

#### 2.5.2. 404 Not Found

**Trigger**: Invalid route or resource

**Display**:

- Status code: 404
- Icon: SearchX or FileQuestion
- Heading: "Page Not Found"
- Message: "The page you're looking for doesn't exist or has been moved."
- Primary CTA: "Go to Dashboard"
- Secondary: "Go to Landing Page"

#### 2.5.3. React Error Boundary Fallback

**Trigger**: Component crash/unhandled exception

**Display**:

- Icon: AlertTriangle
- Heading: "Something went wrong"
- Message: "We're sorry, but something unexpected happened. Please try refreshing the page."
- Primary CTA: "Refresh Page"
- Secondary: "Go to Dashboard"
- Collapsible technical details (development mode only)

#### Accessibility

- Clear error messages
- Actionable CTAs
- Keyboard accessible buttons

---

## 3. User Journey Map

### 3.1. New User Journey (Complete Flow)

```
[Landing Page]
    ↓ (Click "Get Started Free")
[Sign Up Form] (Supabase Auth UI)
    ↓ (Submit email + password)
[Auto-Login] (Server-side)
    ↓ (Middleware checks: authenticated ✓, profile ✗)
[Onboarding Page]
    ↓ (Select experience level + years away)
[POST /api/profile]
    ↓ (Profile created, middleware checks: profile ✓)
[Dashboard] (First time - empty state)
    ↓ (User sees "Generate Topics" CTA)
[Select Technology] (e.g., "React")
    ↓ (Click "Generate")
[Loading Modal] (15-30s, progress messages)
    ↓ (POST /api/topics/generate)
[Topics Appear] (Animated, highlighted)
    ↓ (User explores topics)
[Expand Parent Topic] (Click expand button)
    ↓ (GET /api/topics/:id/children)
[Child Topics Load] (Lazy-loaded, indented)
    ↓ (User reviews topic, clicks LeetCode link)
[Practice Problem] (Opens in new tab)
    ↓ (User returns, updates status)
[Click Status Badge] (Select "In Progress")
    ↓ (Optimistic UI update, PATCH /api/topics/:id)
[Dashboard Stats Update] (Auto-invalidate cache)
    ↓ (User completes studying)
[Change Status to "Completed"] (Optimistic update)
    ↓ (Activity streak increments)
[Dashboard Updates] (Streak shows +1, confetti if milestone)
```

**Key Touchpoints**:

- First impression: Landing page value prop
- Friction point: Registration (minimized with email+password only)
- Required step: Onboarding (cannot skip)
- Delight moment: Topics generated with animation
- Learning loop: View topic → Practice → Update status → See progress
- Gamification: Streak increments, milestone celebrations

### 3.2. Returning User Journey

```
[Navigate to Site]
    ↓ (Middleware: auth ✓, profile ✓)
[Dashboard] (Auto-login, shows current state)
    ↓ (User sees: streak, in-progress topics, stats)
[Filter Topics] (Status: "In Progress")
    ↓ (URL updates, list filters)
[Select Topic] (Click to expand)
    ↓ (Full description, LeetCode problems shown)
[Click LeetCode Link] (Opens in new tab)
    ↓ (User practices problem)
[Return to App]
    ↓ (Update status to "Completed")
[Status Badge Dropdown] (Select "Completed")
    ↓ (Optimistic update, PATCH /api/topics/:id)
[Success Toast] ("Topic marked as completed")
    ↓ (Dashboard stats auto-refresh)
[Dashboard Updates] (Completed count +1, streak continues)
```

**Key Touchpoints**:

- Seamless return: Auto-login, no interruption
- Context preserved: See where they left off
- Quick actions: One-click status updates
- Progress visible: Dashboard stats always current

### 3.3. Topic Management Journey

**Manual Topic Creation**:

```
Dashboard → Click "Create Topic" → Modal opens → Fill form → Save → API POST → Optimistic add → Toast confirmation
```

**Topic Editing**:

```
Topic card → Action menu → Edit → Modal (pre-populated) → Modify → Save → API PATCH → Optimistic update → Toast
```

**Topic Deletion**:

```
Topic card → Action menu → Delete → Confirmation dialog (shows child count) → Confirm → API DELETE (cascading) → Optimistic removal → Toast
```

**Hierarchy Navigation**:

```
View parent → Click expand → API GET children → Children render (indented) → Click child expand → API GET grandchildren → Render (further indented)
```

### 3.4. Profile Management Journey

```
Dashboard → User menu → Profile Settings → /profile → Edit fields → Save Changes → API PATCH → Toast confirmation → Updated Context → UI refreshes
```

### 3.5. Error Recovery Journeys

**Rate Limit Exceeded**:

```
Try to generate → Rate limit check fails → Button disabled → Countdown shows → Wait → Button re-enables → Generate again
```

**Offline Mode**:

```
Network drops → Offline banner appears → Cached data accessible (read-only) → Mutations queued → Network returns → Retry queued mutations → Banner dismisses
```

**Partial AI Generation Failure**:

```
Generate → Some topics save, some fail → Warning toast ("12 of 15 created") → "Retry Failed" button → Click → Retry failed topics → Success
```

**Concurrent Edit Conflict**:

```
Edit topic → Meanwhile, topic updated elsewhere → Save attempt → API returns conflict → Error toast ("Modified elsewhere, refresh") → Refresh page → See latest data
```

---

## 4. Layout and Navigation Structure

### 4.1. Layout Hierarchy

```
App Shell (Astro Layout)
├── Navigation Header (all pages)
├── Main Content Area (page-specific)
└── Footer (conditional: landing page only)

Authenticated Layout (extends App Shell)
├── Top Navigation Bar
│   ├── Logo/App Name (left)
│   ├── Primary Nav Links (center)
│   └── User Menu (right)
├── Main Content (dashboard, profile)
└── Toast Container (bottom-right desktop, top-center mobile)

Public Layout (extends App Shell)
├── Minimal Header (logo + sign in link)
├── Hero/Content
└── Footer (legal links, contact)
```

### 4.2. Navigation Patterns

#### Top Navigation Bar (Authenticated)

**Desktop (>768px)**:

```
┌────────────────────────────────────────────┐
│ [Logo] Dashboard    [User@Email ▾]         │
└────────────────────────────────────────────┘
```

**Mobile (<768px)**:

```
┌────────────────────────────────────────────┐
│ [☰]    [Logo]                   [Avatar]   │
└────────────────────────────────────────────┘
```

#### User Menu Dropdown

**Items**:

1. Email display (non-interactive, shows context)
2. "Profile Settings" (navigates to /profile)
3. Divider line
4. "Sign Out" (destructive color, triggers logout)

**Behavior**:

- Click avatar/email → Toggle dropdown
- Click outside → Close dropdown
- Escape key → Close dropdown
- Tab out → Close dropdown

#### Mobile Navigation Drawer

**Trigger**: Hamburger icon

**Contents** (slide-in from left):

- User email/avatar (top)
- "Dashboard" (active state if on dashboard)
- Divider
- "Profile Settings"
- "Sign Out"
- Close X (top-right of drawer)

**Behavior**:

- Slide animation (300ms)
- Backdrop overlay (click to close)
- Focus trap within drawer
- Escape to close

### 4.3. Breadcrumb Navigation (Conditional)

**Context**: Shown when viewing child topics or filtered by parent_id

**Format**: `All Topics > React Fundamentals > Hooks`

**Behavior**:

- Each segment clickable (navigates up hierarchy)
- Current page: aria-current="page", not linked
- Truncate long titles (max 30 chars with ellipsis)
- Hide on mobile if >2 levels (show only current)

### 4.4. URL Structure & Routing

| Route         | Purpose       | Auth Required | Profile Required         |
| ------------- | ------------- | ------------- | ------------------------ |
| `/`           | Landing page  | No            | No                       |
| `/onboarding` | Profile setup | Yes           | No (redirects if exists) |
| `/dashboard`  | Main app view | Yes           | Yes                      |
| `/profile`    | Edit profile  | Yes           | Yes                      |

**Query Parameters** (Dashboard):

- `?page=2` - Pagination
- `?limit=50` - Items per page
- `?status=in_progress` - Status filter (multiple: `status=to_do,in_progress`)
- `?technology=React` - Technology filter
- `?sort=created_at` - Sort field
- `?order=desc` - Sort order
- `?search=hooks` - Search query
- `?parent_id=uuid` - Filter by parent

**Example**: `/dashboard?status=in_progress&technology=React&sort=updated_at&order=desc`

### 4.5. Modal & Dialog Management

**Full-Screen Modals** (AI Generation):

- Centered overlay
- Cannot dismiss during operation
- Progress feedback

**Standard Modals** (Forms, Confirmations):

- Center of viewport
- Backdrop overlay (click to close, except during unsaved changes)
- Escape to close
- Focus trap
- Restore focus on close

**Bottom Sheets** (Mobile <768px):

- Slide up from bottom
- Swipe down to close
- Used for: Topic forms, filters, confirmations

### 4.6. Navigation State Management

**URL State** (persisted, shareable):

- Filters, sorts, pagination, search queries

**Context State** (session-based):

- User profile, auth status, permissions

**Local State** (component-level):

- Modal open/closed, dropdown visibility, form values

**Browser History**:

- Back/forward buttons work correctly
- State restored from URL params
- Scroll position preserved (ScrollRestoration API)

---

## 5. Key Components

### 5.1. Core UI Components (Shadcn/ui)

**Form Controls**:

- `Button`: Primary, Secondary, Destructive, Outline variants
- `Input`: Text, number, search types
- `Textarea`: Multi-line text
- `Select`: Single-select dropdown
- `Combobox`: Searchable autocomplete (for technology selection)
- `Checkbox`: Boolean options
- `RadioGroup`: Single selection from multiple options

**Layout Components**:

- `Card`: Container with header, body, footer sections
- `Separator`: Visual divider lines
- `Tabs`: Tabbed interface (future use)

**Feedback Components**:

- `Toast`: Temporary notifications (success, error, warning, info)
- `AlertDialog`: Blocking confirmations (delete actions)
- `Dialog`: Modal dialogs (forms, details)
- `Sheet`: Mobile bottom sheet modals
- `Skeleton`: Loading placeholders
- `Badge`: Status indicators, counts
- `Progress`: Progress bars (technology breakdown)

**Navigation Components**:

- `DropdownMenu`: User menu, action menus, filters
- `Breadcrumb`: Hierarchical navigation
- `Pagination`: Page navigation controls

### 5.2. Feature-Specific Components

#### TopicCard

**Purpose**: Display individual topic with all metadata and actions

**Props**:

- `variant`: "parent" | "child"
- `topic`: Topic entity (id, title, description, status, technology, leetcode_links, children_count, timestamps)
- `onStatusChange`: Handler for status updates
- `onEdit`: Handler for edit action
- `onDelete`: Handler for delete action
- `onExpand`: Handler for expanding children

**Sub-Components**:

- `TopicCard.Header`: Title, status badge, action menu
- `TopicCard.Body`: Description, LeetCode section, expand button
- `TopicCard.Footer`: Metadata (technology, timestamp, counts)

**States**:

- Default: Collapsed, key info visible
- Expanded: Full description, LeetCode problems shown
- Loading: Skeleton or spinner during actions
- Error: Error state if mutation fails

#### TopicForm (Modal)

**Purpose**: Create or edit topics

**Props**:

- `mode`: "create" | "edit"
- `topic`: Topic entity (if editing, null if creating)
- `onSubmit`: Handler for save
- `onCancel`: Handler for cancel

**Fields**:

- Title (required, 500 char max)
- Technology (required, autocomplete)
- Description (optional, 5000 char max)
- Parent Topic (optional, searchable select)
- Status (default: to_do)
- LeetCode Links (add/remove interface)

**Validation**:

- Real-time on blur
- Inline errors below fields
- Character counters
- All errors shown simultaneously on submit

#### FilterToolbar

**Purpose**: Control topic list filtering and sorting

**Elements**:

- Status multi-select dropdown
- Technology dropdown
- Sort dropdown
- View toggle (All | Root only)
- Clear filters button
- Active filter chips

**State Management**:

- Reads from URL params
- Updates URL on change
- Triggers list re-fetch

#### GenerationCard

**Purpose**: AI topic generation interface

**Elements**:

- Technology autocomplete input
- Rate limit display
- Generate button
- Loading modal (when active)
- Error alerts

**State Management**:

- Rate limit from API headers
- Technology selection (controlled)
- Loading state during generation

#### StreakCard

**Purpose**: Display activity streak and motivation

**Elements**:

- Flame icon (size varies with streak)
- Streak count (large, prominent)
- 7-day calendar visualization
- Motivational text
- Milestone animations

**State**:

- Streak value from profile
- Animation trigger on increment

#### StatsCard

**Purpose**: Display progress metrics

**Elements**:

- Total topics count
- Status breakdown with colors
- Technology breakdown with progress bars
- Last updated timestamp
- Refresh button

**State**:

- Data from /api/dashboard/stats
- Manual refresh capability
- Auto-invalidation on mutations

### 5.3. Layout Components

#### DashboardGrid

**Purpose**: Responsive layout for dashboard cards

**Structure**:

```
Desktop (>1024px):
┌─────────────┬─────────────┬─────────────┐
│ Streak      │ Generation (spans 2 cols) │
├─────────────┼─────────────┼─────────────┤
│ Stats       │ Tech Breakdown             │
├─────────────┴─────────────┴─────────────┤
│ Topics List (full width)                │
├──────────────────────────────────────────┤
│ Recent Activity (full width)            │
└──────────────────────────────────────────┘

Tablet (768-1024px):
┌─────────────┬─────────────┐
│ Streak      │ Generation  │
├─────────────┴─────────────┤
│ Stats       │ Tech        │
├─────────────┴─────────────┤
│ Topics List (full width)  │
├───────────────────────────┤
│ Recent Activity           │
└───────────────────────────┘

Mobile (<768px):
┌───────────────────────────┐
│ Streak                    │
├───────────────────────────┤
│ Generation                │
├───────────────────────────┤
│ Stats                     │
├───────────────────────────┤
│ Topics List               │
├───────────────────────────┤
│ Recent Activity           │
└───────────────────────────┘
```

#### TopicGrid

**Purpose**: Responsive grid for topic cards

**Columns**:

- Desktop (>1024px): 3 columns
- Tablet (768-1024px): 2 columns
- Mobile (<768px): 1 column

**Gap**:

- Desktop: 6 (24px)
- Mobile: 4 (16px)

### 5.4. Utility Components

#### ErrorBoundary

**Purpose**: Catch React component errors

**Props**:

- `fallback`: Component to render on error
- `onError`: Error logging handler

**Behavior**:

- Wraps application at layout level
- Catches unhandled exceptions
- Displays friendly error UI
- Logs error to monitoring service

#### LoadingSpinner

**Purpose**: Consistent loading indicator

**Variants**:

- Small: 16px (inline)
- Medium: 24px (buttons)
- Large: 48px (full-screen modals)

**Props**:

- `size`: "sm" | "md" | "lg"
- `label`: Accessible label for screen readers

#### EmptyState

**Purpose**: Display when no data exists

**Props**:

- `icon`: Lucide icon component
- `title`: Heading text
- `description`: Explanatory text
- `action`: Optional CTA button

**Variants**:

- No topics
- Filtered empty
- Search empty
- No activity

#### ConfirmDialog

**Purpose**: Confirmation for destructive actions

**Props**:

- `title`: Dialog heading
- `description`: Detailed message
- `confirmLabel`: Confirm button text
- `onConfirm`: Confirm handler
- `onCancel`: Cancel handler
- `destructive`: Boolean for styling

**Use Cases**:

- Delete topic (show child count)
- Unsaved changes warning
- Discard draft

### 5.5. Form Components

#### ExperienceLevelSelector

**Purpose**: Card-style radio group for experience selection

**Options**:

- Junior: Seedling icon, 0-2 years description
- Mid: Tree icon, 2-5 years description
- Senior: Trees icon, 5+ years description

**Styling**:

- Full card clickable
- Selected: primary border, background tint
- Hover: subtle border highlight
- Keyboard navigable

#### TechnologyAutocomplete

**Purpose**: Searchable technology selection

**Features**:

- Curated list of popular technologies
- Custom input allowed
- Recently used section (from localStorage)
- Fuzzy search/filter
- Keyboard navigation (arrow keys, enter)

**Props**:

- `value`: Selected technology
- `onChange`: Selection handler
- `placeholder`: Input placeholder

#### LeetCodeLinksForm

**Purpose**: Add/edit LeetCode problem links

**Interface**:

- List of current links (removable chips)
- Add button reveals input fields:
  - Title (text)
  - URL (validated as URL format)
  - Difficulty (select: Easy, Medium, Hard)
- Save/Cancel for new link
- Max 50 links enforced with counter
- Drag-to-reorder handles (if >3 links)

**Validation**:

- URL format check
- Required fields
- Duplicate URL prevention

---

## 6. Requirements Mapping

### 6.1. Functional Requirements → UI Elements

| Requirement                 | UI Implementation                                                   |
| --------------------------- | ------------------------------------------------------------------- |
| FR-001: Account management  | Landing page CTAs, Supabase Auth UI, User menu Sign Out             |
| FR-002: Profile setup       | Onboarding page (required), Profile Settings page (editing)         |
| FR-003: AI topic generation | GenerationCard on Dashboard with technology autocomplete            |
| FR-004: Hierarchical topics | TopicCard with expand button, lazy-load children endpoint           |
| FR-005: Topic CRUD          | Create button, TopicForm modal, Edit/Delete in action menu          |
| FR-006: Status tracking     | Status badge dropdown on TopicCard, optimistic updates              |
| FR-007: Filtering/sorting   | FilterToolbar with all controls, URL-based state                    |
| FR-008: LeetCode links      | LeetCode section in TopicCard body, LeetCodeLinksForm in modal      |
| FR-009: Dashboard progress  | DashboardGrid with StatsCard, Technology breakdown, Recent Activity |
| FR-010: Activity streak     | StreakCard with flame icon, 7-day calendar, milestone animations    |

### 6.2. User Stories → UI Flows

| User Story              | UI Flow                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| US-001: Registration    | Landing page → "Get Started" → Supabase sign-up → Auto-redirect to onboarding             |
| US-002: Login           | Landing page → "Sign In" → Supabase login → Dashboard                                     |
| US-003: Logout          | User menu → "Sign Out" → Session terminated → Landing page                                |
| US-004: Profile setup   | Onboarding page (required) → ExperienceLevelSelector + years input → Save → Dashboard     |
| US-005: Generate topics | Dashboard → GenerationCard → Select technology → Generate → Loading modal → Topics appear |
| US-006: View hierarchy  | TopicCard → Expand button → Children load (lazy) → Nested display                         |
| US-007: Delete topic    | TopicCard action menu → Delete → ConfirmDialog (with child count) → Confirm → Removed     |
| US-008: Update status   | TopicCard status badge → Dropdown → Select new status → Optimistic update                 |
| US-009: LeetCode access | TopicCard body → LeetCode section → Click problem link → Opens in new tab                 |
| US-010: Dashboard view  | Auto-navigate to /dashboard on login → See all cards with progress metrics                |

### 6.3. API Endpoints → UI Interactions

| Endpoint                     | UI Trigger                          | UI Response                                   |
| ---------------------------- | ----------------------------------- | --------------------------------------------- |
| POST /api/profile            | Onboarding save button              | Redirect to Dashboard, store in Context       |
| PATCH /api/profile           | Profile Settings save               | Toast confirmation, update Context            |
| GET /api/topics              | Dashboard load, filter/sort changes | Populate TopicGrid, update counts             |
| GET /api/topics/:id/children | TopicCard expand button             | Render child cards below parent               |
| POST /api/topics             | Create button → Save                | Optimistic add to grid, toast confirmation    |
| PATCH /api/topics/:id        | Status badge dropdown, Edit save    | Optimistic update, toast confirmation         |
| DELETE /api/topics/:id       | Action menu Delete → Confirm        | Optimistic removal, toast confirmation        |
| POST /api/topics/generate    | GenerationCard Generate button      | Loading modal, animate new topics             |
| GET /api/dashboard/stats     | Dashboard load, manual refresh      | Update StatsCard, StreakCard, Recent Activity |

---

## 7. Accessibility & Security Summary

### 7.1. Accessibility (WCAG AA Compliance)

**Keyboard Navigation**:

- All interactive elements accessible via Tab
- Arrow keys for grid navigation
- Enter/Space for activation
- Escape for dismissal
- Focus trap in modals

**ARIA Attributes**:

- `aria-label` on icon-only buttons
- `aria-expanded` on collapsible elements
- `aria-controls` linking triggers to targets
- `aria-live="polite"` for dynamic updates
- `aria-current` for navigation state

**Visual Design**:

- 4.5:1 minimum contrast ratio
- Status indicators: Color + text + icon
- Focus indicators visible
- 44x44px minimum touch targets
- Respect `prefers-reduced-motion`

**Screen Reader Support**:

- Semantic HTML (landmarks)
- Alt text on images
- Form labels associated with inputs
- Error announcements
- Loading state announcements

### 7.2. Security Measures

**Authentication**:

- httpOnly cookies (not localStorage)
- Automatic token refresh
- Session expiration handling
- Secure redirect after login

**Authorization**:

- Middleware checks on all protected routes
- Profile existence check before topic generation
- RLS at database level
- 404 for unauthorized (don't expose existence)

**Input Validation**:

- Zod schemas on client and server
- Real-time validation feedback
- Sanitization of user inputs
- Max length enforcement

**Data Protection**:

- No sensitive data in URLs
- CSRF protection via Supabase
- XSS prevention (React escaping + CSP)
- Secure headers on all responses

**Rate Limiting**:

- UI displays remaining quota
- Disable buttons when limit reached
- Countdown timer for reset
- Graceful error messages

---

## 8. Edge Cases & Error Handling

### 8.1. Edge Cases Addressed in UI

**Empty States**:

- No topics: Prominent CTA to generate
- Filtered empty: Clear filters option
- No activity: Encouraging message
- No LeetCode links: Empty section (collapsed)

**Content Edge Cases**:

- Long titles: Truncate 2 lines, tooltip on hover
- Long descriptions: Truncate 3 lines, "Read more" expand
- Many children: Lazy-load, paginate if needed
- Deep hierarchies: Breadcrumbs, visual indentation

**Rate Limiting**:

- Display remaining quota prominently
- Disable button when exhausted
- Show countdown to reset
- Allow other features to continue

**Offline Mode**:

- Detect offline state (navigator.onLine)
- Show persistent banner
- Cache data for read-only access
- Queue mutations for retry

**Concurrent Edits**:

- Inactivity warning after 5 minutes
- Conflict error on save attempt
- Prompt to refresh and see latest

**Partial Failures**:

- AI generation: Show success count, retry failed
- Bulk operations: Report individual failures

### 8.2. Error States in UI

**Form Validation Errors**:

- Inline below fields
- Red text with alert icon
- Clear, actionable messages
- All errors shown simultaneously

**API Errors**:

- Toast notifications for transient errors
- Alert dialogs for critical errors
- Error boundaries for component crashes
- Retry options where applicable

**Network Errors**:

- Offline banner (persistent)
- Retry button on failed requests
- Cached data fallback
- Clear messaging about limitations

**Authorization Errors**:

- 401: Redirect to login with preserved URL
- 403: Generic "access denied" (no details)
- 404: "Not found" (same for unauthorized)

**Rate Limit Errors**:

- 429: Disable action, show countdown
- Display quota before action
- Allow alternative features

---

## 9. Performance Considerations

### 9.1. Loading Strategies

**Server-Side Rendering**:

- Astro pre-renders public pages
- Auth check happens server-side
- Initial dashboard data from server

**Progressive Enhancement**:

- Core content accessible without JS
- Interactive features hydrate as needed
- React islands for interactivity only

**Lazy Loading**:

- Child topics loaded on expand
- Images lazy-loaded (if added)
- Code splitting for large components

### 9.2. Caching Strategy

**sessionStorage** (5min TTL):

- Topics list
- Profile data
- Dashboard stats

**localStorage** (persistent):

- Last used technology
- Filter preferences
- Help dismissal flags

**React Context** (session):

- User profile
- Auth state
- Current user permissions

**URL State** (shareable):

- Filters, sorts, pagination
- Search queries
- View preferences

### 9.3. Optimistic UI

**Immediate Feedback**:

- Status updates show instantly
- Topic creation adds to list immediately
- Deletions remove from view immediately

**Rollback on Error**:

- Revert UI if API call fails
- Show error toast
- Allow retry

**Background Sync**:

- API calls happen asynchronously
- Small "Saving..." indicators
- Non-blocking progress feedback

### 9.4. Perceived Performance

**Loading States**:

- Skeleton loaders on initial load
- Top progress bar for navigation
- Inline spinners for actions
- Smooth transitions (200ms)

**Animations**:

- Staggered fade-in for lists
- Highlight effect for new items
- Pulse on updates
- Confetti for milestones

**Debouncing**:

- Search input: 300ms
- Resize events: 150ms
- Scroll events: 100ms

---

## 10. Future Enhancements (Post-MVP)

**Documented but Deferred**:

- Bulk topic actions (multi-select, bulk status update)
- Infinite scroll (currently pagination)
- Real-time sync via WebSocket (currently polling)
- Detailed topic page with comments
- Dashboard layout customization
- Topic templates
- Export/import topics
- Sharing topics between users
- Notification system
- Mobile app (PWA)

These enhancements are explicitly scoped out of MVP to maintain focus on core functionality and rapid delivery.

---

_This UI architecture is designed to be implemented incrementally, with each view and component building on established patterns. The structure supports future expansion while maintaining consistency and usability throughout the application._
