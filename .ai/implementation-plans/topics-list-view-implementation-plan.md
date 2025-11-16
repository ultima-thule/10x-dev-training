# View Implementation Plan: Topics List

## 1. Overview

This document outlines the implementation plan for the "Topics List" view. The primary purpose of this view is to allow users to manage their learning topics in a hierarchical structure. It will display topics grouped by technology, provide filtering options, and allow for actions such as changing a topic's status, deleting a topic, and expanding topics to view and load sub-topics.

## 2. View Routing

- **Path**: `/app/topics`
- **Accessibility**: This route must be protected and only accessible to authenticated users. The Astro page (`.astro`) will handle the authentication check and redirect to `/login` if the user is not signed in.

## 3. Component Structure

The view will be built using a main Astro page that renders a client-side React application.

```
/src/pages/app/topics.astro
└─ /src/components/topics/TopicsView.tsx
   ├─ /src/components/topics/TopicFilters.tsx
   ├─ /src/components/topics/TechnologyAccordion.tsx
   │  └─ /src/components/topics/TopicList.tsx
   │     └─ /src/components/topics/TopicItem.tsx
   │        └─ (recursive) TopicList.tsx
   └─ /src/components/topics/DeleteTopicDialog.tsx
```

## 4. Component Details

### `TopicsPage` (`/src/pages/app/topics.astro`)

- **Description**: The server-side entry point for the view. It provides the main page layout and handles authentication.
- **Main Elements**: Renders the `<Layout>` component and the client-side `<TopicsView />` React component.
- **Handled Interactions**: None. Its role is to render the initial page structure.
- **Props**: None.

### `TopicsView` (`/src/components/topics/TopicsView.tsx`)

- **Description**: The root React component that orchestrates the entire view. It manages the application state via the `useTopics` hook, handles data fetching, and renders the main UI sections.
- **Main Elements**: Contains `TopicFilters`, `TechnologyAccordion`, and `DeleteTopicDialog`. It will display loading skeletons during initial data fetch and error states if the API call fails.
- **Handled Interactions**: Manages the overall state, passing down data and handlers to child components.
- **Types**: `TopicsViewState`, `TopicViewModel`.
- **Props**: None.

### `TopicFilters` (`/src/components/topics/TopicFilters.tsx`)

- **Description**: A control bar for filtering the list and initiating topic generation.
- **Main Elements**:
  - A `Select` or `RadioGroup` (Shadcn) to filter by status (`All`, `To Do`, `In Progress`, `Completed`).
  - A `Button` (Shadcn) to navigate to the topic generation page.
- **Handled Interactions**:
  - Changing the status filter triggers an `onFilterChange` callback.
- **Props**:
  - `filters: { status?: TopicStatusEnum | 'all' }`
  - `onFilterChange: (newFilters) => void`

### `TechnologyAccordion` (`/src/components/topics/TechnologyAccordion.tsx`)

- **Description**: Displays the list of topics, grouped by technology, inside an accordion.
- **Main Elements**:
  - A Shadcn `Accordion` component with `type="multiple"` to allow multiple technologies to be expanded at once.
  - Each technology is an `AccordionItem` where the `AccordionTrigger` is the technology name and the `AccordionContent` contains the `TopicList`.
- **Handled Interactions**: Expands/collapses technology sections.
- **Types**: `TopicViewModel`.
- **Props**:
  - `topicsByTechnology: Record<string, TopicViewModel[]>`

### `TopicList` (`/src/components/topics/TopicList.tsx`)

- **Description**: A recursive or nesting component that renders a list of `TopicItem` components. It's used for both root topics within an accordion and for nested child topics.
- **Main Elements**: A `<ul>` or `<div>` that maps over an array of topics and renders a `TopicItem` for each.
- **Types**: `TopicViewModel`.
- **Props**:
  - `topics: TopicViewModel[]`
  - `level: number` (for indentation)

### `TopicItem` (`/src/components/topics/TopicItem.tsx`)

- **Description**: Renders a single topic, its metadata, and actions. It also handles the logic for expanding to show/load children.
- **Main Elements**:
  - An expander icon/button (e.g., chevron), visible if `children_count > 0`.
  - A status icon.
  - Topic title and description.
  - A `Badge` (Shadcn) with the `children_count`.
  - A `DropdownMenu` (Shadcn) for "Quick Actions" (e.g., Change Status, Delete).
  - A conditionally rendered `TopicList` for child topics.
- **Handled Interactions**:
  - Click on expander: Triggers `loadChildren` hook function and toggles visibility of the nested `TopicList`.
  - Select an action from the dropdown menu.
- **Types**: `TopicViewModel`, `TopicStatusEnum`.
- **Props**:
  - `topic: TopicViewModel`
  - `level: number`

### `DeleteTopicDialog` (`/src/components/topics/DeleteTopicDialog.tsx`)

- **Description**: A confirmation modal to prevent accidental topic deletion.
- **Main Elements**: A Shadcn `AlertDialog` component. It will display the topic's title and warn the user that deleting it will also delete all its sub-topics.
- **Handled Interactions**: `Confirm` and `Cancel` actions.
- **Props**:
  - `isOpen: boolean`
  - `onOpenChange: (isOpen: boolean) => void`
  - `onConfirm: () => void`
  - `topicTitle: string`

## 5. Types

### `TopicViewModel`

This client-side model extends the `TopicListItemDTO` to include UI state.

```typescript
import type { TopicListItemDTO } from "@/types";

export interface TopicViewModel extends TopicListItemDTO {
  children: TopicViewModel[]; // Array of loaded child topics, initially empty
  isLoadingChildren: boolean; // True while fetching children for this topic
  isExpanded: boolean; // Tracks if the topic is expanded in the UI
}
```

### `TopicsViewState`

Represents the complete state for the `TopicsView` managed by the `useTopics` hook.

```typescript
import type { TopicViewModel } from "./TopicViewModel";
import type { PaginationMetadata, TopicStatusEnum } from "@/types";

export interface TopicsViewState {
  topicsByTechnology: Record<string, TopicViewModel[]>;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: TopicStatusEnum | "all";
  };
  pagination: PaginationMetadata;
}
```

## 6. State Management

A custom hook, `useTopics`, will encapsulate all state logic, side effects, and API interactions.

- **Location**: `/src/components/hooks/useTopics.ts`
- **Responsibilities**:
  - Manage the `TopicsViewState`.
  - Fetch initial (root) topics based on current filters.
  - Lazy-load children for a specific topic.
  - Provide functions for optimistic updates (status change, deletion) with error rollback.
  - Expose the state and action dispatchers to the `TopicsView` component.
- **Context**: To avoid prop drilling action handlers (like `updateStatus`, `deleteTopic`, `loadChildren`), a `TopicsContext` will be created to provide these functions to all descendant components.

## 7. API Integration

- **Fetch Root Topics**:
  - **Endpoint**: `GET /api/topics`
  - **Request**: `TopicListQueryParams` will be used to construct query parameters (`status`, `parent_id=null`, `page`, `limit`).
  - **Response**: `TopicListResponseDTO`.
- **Fetch Child Topics**:
  - **Endpoint**: `GET /api/topics/:id/children`
  - **Request**: The parent topic's `id` is passed as a path parameter.
  - **Response**: `TopicChildrenResponseDTO`.
- **Update Topic**:
  - **Endpoint**: `PATCH /api/topics/:id`
  - **Request**: `UpdateTopicCommand` (e.g., `{ status: 'completed' }`).
  - **Response**: `TopicDTO`.
- **Delete Topic**:
  - **Endpoint**: `DELETE /api/topics/:id`
  - **Request**: The topic's `id` is passed as a path parameter.
  - **Response**: `204 No Content`.

All requests must include the `Authorization: Bearer {token}` header.

## 8. User Interactions

- **Filtering**: Selecting a status from `TopicFilters` updates the `filters` state in `useTopics`, which triggers a refetch of root topics.
- **Expanding a Topic**: Clicking the expander on a `TopicItem` with `children_count > 0` calls the `loadChildren` function from `useTopics` (if children are not yet loaded) and toggles the `isExpanded` state of the `TopicViewModel`.
- **Changing Status**: Selecting a new status from the `TopicItem` dropdown triggers an optimistic update and calls the `PATCH /api/topics/:id` endpoint.
- **Deleting a Topic**: Clicking "Delete" opens the `DeleteTopicDialog`. Confirming triggers an optimistic removal from the state and calls the `DELETE /api/topics/:id` endpoint.

## 9. Conditions and Validation

- **Authentication**: Checked server-side in `topics.astro`. All API calls from the client will be rejected by the API routes if the auth token is missing or invalid.
- **Expandability**: The expander control on a `TopicItem` will only be rendered and enabled if `topic.children_count > 0`.
- **Empty States**: The UI will display a message if:
  - The initial fetch returns no topics for the user.
  - The current filter combination yields no results.
  - A technology group (accordion) contains no root topics matching the filter.
- **Loading State**: A loading skeleton will be shown for the entire view on the initial fetch. A smaller, inline spinner will be shown next to a `TopicItem` while its children are being fetched.

## 10. Error Handling

- **Global Fetch Error**: If the initial `GET /api/topics` call fails, the main view will show an error message with a "Retry" button.
- **Child Fetch Error**: If `GET /api/topics/:id/children` fails, a toast notification will be displayed, and the inline loading spinner on the `TopicItem` will be removed.
- **Optimistic Update Failure**: If a `PATCH` or `DELETE` request fails, the local state will be reverted to its previous value, and a toast notification will inform the user that the action failed.

## 11. Implementation Steps

1.  **Create Page File**: Create the Astro page file at `/src/pages/app/topics.astro`. Add the authentication guard and render the main React component.
2.  **Component Scaffolding**: Create the file structure and basic boilerplate for all the new React components (`TopicsView`, `TopicFilters`, `TechnologyAccordion`, `TopicList`, `TopicItem`, `DeleteTopicDialog`).
3.  **Type Definition**: Create the `TopicViewModel` and `TopicsViewState` types in a new file, e.g., `/src/components/topics/types.ts`.
4.  **`useTopics` Hook**: Implement the `useTopics` custom hook. Start with the logic for fetching and displaying root topics.
5.  **Build the View**:
    - Implement `TopicsView` to use the `useTopics` hook.
    - Build `TopicFilters` and connect its `onFilterChange` event to the hook.
    - Build `TechnologyAccordion` to group and display the topics.
    - Build `TopicList` and `TopicItem` to render the initial list of root topics (without nesting logic for now).
6.  **Implement Nesting**: Add the logic to `TopicItem` for expanding and collapsing. Implement the `loadChildren` function in the `useTopics` hook and call it from `TopicItem`. Render the nested `TopicList` when a topic is expanded.
7.  **Implement Actions**:
    - Add the `DropdownMenu` to `TopicItem`.
    - Implement the `updateTopicStatus` optimistic update logic in the hook and connect it to the menu.
    - Implement the `DeleteTopicDialog` and the `deleteTopic` optimistic update logic.
8.  **UI Polish**:
    - Add loading skeletons for the initial load.
    - Add inline spinners for lazy-loading children.
    - Implement all empty states.
    - Implement toast notifications for error handling and feedback.
9.  **Testing and Refinement**: Manually test all user interactions, filtering, error states, and responsive behavior. Ensure accessibility attributes (`aria-expanded`, etc.) are correctly applied.
