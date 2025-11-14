# Product Requirements Document (PRD) - Development Refresher Training

## 1. Product Overview

The Development Refresher Training application is a web-based tool designed to assist former software developers in their journey back to the programming field. The platform provides a structured and personalized approach to refreshing technical skills by leveraging AI to generate tailored learning plans. It helps users track their progress, practice with relevant coding challenges, and stay motivated through a supportive, gamified environment. The core goal is to bridge the gap for developers who have been out of the industry, making their transition back into a technical role smoother and more efficient.

## 2. User Problem

Former developers who have been away from programming for several years often face a daunting challenge when trying to re-enter the workforce. They need a structured way to identify and refresh their technical skills, understand what has changed, and track their learning progress effectively. Without a clear plan, the process can feel overwhelming, disorganized, and demotivating. This application directly addresses this by providing a guided and personalized path to get their skills up-to-date.

## 3. Functional Requirements

### 3.1. User Account Management

- FR-001: Users must be able to create an account, log in, and log out. Authentication will be managed by Supabase.
- FR-002: Users must be able to set up a profile specifying their previous experience level (e.g., Junior, Mid, Senior) and the number of years they have been away from the industry.

### 3.2. AI-Powered Topic Generation

- FR-003: The system shall generate a personalized list of review topics based on a user-selected technology, their experience profile, and their history of completed topics.
- FR-004: Generated topics must be presented in a hierarchical structure, allowing users to view high-level concepts and expand them to see more granular, actionable sub-tasks.

### 3.3. Topic and Progress Management

- FR-005: Users must be able to perform full CRUD (Create, Read, Update, Delete) operations on their review topics.
- FR-006: Users must be able to mark a topic with a status, such as 'To Do', 'In Progress', or 'Completed'.
- FR-007: The application must provide basic filtering and sorting options for the topic list (e.g., filter by status, sort by creation date).

### 3.4. LeetCode Integration

- FR-008: For a given review topic, the application shall provide direct links to relevant LeetCode problems, allowing users to practice the concept.

### 3.5. User Engagement and Gamification

- FR-009: The application will feature a personal dashboard that visualizes the user's progress (e.g., topics completed, skills covered).
- FR-010: The system will include subtle gamification elements, such as an activity streak counter, to motivate consistent use.

## 4. Product Boundaries

### 4.1. What's In Scope for MVP

- A simple user account system managed by Supabase.
- AI-driven generation of review topics for a selected technology.
- CRUD operations for review topics.
- Status tracking for topics ('In Progress', 'Completed').
- Integration with LeetCode via direct URL linking.
- A personal dashboard with basic progress visualization.

### 4.2. What's Out of Scope for MVP

- Sharing review topics between different user accounts.
- Direct synchronization of solved problems or progress from the LeetCode platform.
- A notification system or reminders for pending or prolonged review topics.
- A user feedback mechanism to rate the quality of AI-generated topics.

## 5. User Stories

### Authentication and Profile Management

- ID: US-001
- Title: New User Registration
- Description: As a new user, I want to be able to create an account so that I can access the application and save my progress.
- Acceptance Criteria:
  - Given I am on the landing page, when I click the "Sign Up" button, I am taken to the registration form.
  - The form must require a valid email and a password.
  - Upon successful registration, I am automatically logged in and redirected to the dashboard.
  - The system uses Supabase authentication for account creation.

- ID: US-002
- Title: User Login
- Description: As a returning user, I want to log in to my account to access my personalized learning plan and continue where I left off.
- Acceptance Criteria:
  - Given I am on the login page, I can enter my registered email and password.
  - Upon successful authentication, I am redirected to my personal dashboard.
  - If authentication fails, a clear error message is displayed.

- ID: US-003
- Title: User Logout
- Description: As a logged-in user, I want to be able to log out of my account to ensure my session is secure.
- Acceptance Criteria:
  - Given I am logged in, I can find and click a "Logout" button.
  - Upon clicking "Logout", my session is terminated and I am redirected to the public landing page.

- ID: US-004
- Title: Initial User Profile Setup
- Description: As a new user who has just registered, I want to set up my profile with my experience level and years away from coding so that the AI can generate relevant topics for me.
- Acceptance Criteria:
  - Given I have just registered and logged in for the first time, I am prompted to complete my profile.
  - I can select my prior experience level from a predefined list (e.g., Junior, Mid, Senior).
  - I can input the number of years I have been away from a developer role.
  - After saving my profile, I am taken to the main dashboard.

### Topic Generation and Management

- ID: US-005
- Title: Generate Review Topics
- Description: As a logged-in user, I want to generate a list of review topics for a specific technology so that I can start my learning plan.
- Acceptance Criteria:
  - Given I am on my dashboard, I can select a technology from a curated, auto-completing list.
  - After selecting a technology and clicking "Generate", the application displays a list of AI-generated topics.
  - The topics are based on the selected technology and my user profile.

- ID: US-006
- Title: View Hierarchical Topics
- Description: As a user, I want to view my generated topics in a hierarchical list so that I can understand the relationship between high-level concepts and detailed sub-tasks.
- Acceptance Criteria:
  - Given a list of generated topics is displayed, parent topics are shown at the top level.
  - I can click on a parent topic to expand it and view its children sub-topics.
  - The visual nesting clearly indicates the parent-child relationship.

- ID: US-007
- Title: Delete a Review Topic
- Description: As a user, I want to be able to delete a topic that I find irrelevant or no longer need.
- Acceptance Criteria:
  - Given I am viewing my list of topics, each topic has a "Delete" option.
  - When I click "Delete", a confirmation prompt appears to prevent accidental deletion.
  - Upon confirmation, the topic and all its sub-topics are permanently removed from my list.

### Progress Tracking

- ID: US-008
- Title: Update Topic Status
- Description: As a user, I want to update the status of a topic to "In Progress" or "Completed" to track my learning journey.
- Acceptance Criteria:
  - Given I am viewing a topic, I can change its status.
  - The available statuses are 'To Do', 'In Progress', and 'Completed'.
  - Changing the status is saved automatically and the UI updates to reflect the new status (e.g., with a different color or icon).

### LeetCode Integration

- ID: US-009
- Title: Access Linked LeetCode Problems
- Description: As a user reviewing a topic, I want to access relevant LeetCode problems so I can apply my knowledge through practice.
- Acceptance Criteria:
  - Given I am viewing the details of a topic, a section with "Practice Problems" is visible.
  - This section contains one or more hyperlinks to specific problems on the LeetCode website.
  - Clicking a link opens the corresponding LeetCode problem in a new browser tab.

### Dashboard and Gamification

- ID: US-010
- Title: View Personal Progress Dashboard
- Description: As a user, I want to see a personal dashboard with a summary of my progress to stay motivated and understand what I've accomplished.
- Acceptance Criteria:
  - Given I am logged in, the main page is my dashboard.
  - The dashboard displays key metrics like "Topics Completed", "Topics in Progress", and my current activity streak.
  - The data on the dashboard updates in real-time as I update topic statuses.

## 6. Success Metrics

- 6.1. User Engagement: 75% of Monthly Active Users (MAUs) must generate a new set of review topics at least once per month. An MAU is defined as a registered user who logs in and performs at least one significant action (e.g., generating topics, updating progress) within a 30-day period.
- 6.2. Progress Tracking Adoption: 90% of active users should consistently update the progress of their review topics within the application. This will be measured by the rate at which newly created topics are moved to "In Progress" or "Completed".
