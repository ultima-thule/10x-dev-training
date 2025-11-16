# Authentication Module - Technical Specification

## 1. Overview

This document outlines the technical architecture for implementing user authentication, including registration, login, logout, and password recovery. The implementation will leverage Supabase for authentication services, integrated into the existing Astro and React application. The system is designed to be secure, scalable, and provide a seamless user experience, adhering to the requirements defined in `US-001`, `US-002`, `US-003`, and `US-004.1`.

## 2. User Interface Architecture

The frontend will be enhanced with new pages and components to support authentication flows for both unauthenticated and authenticated users.

### 2.1. New Pages

- **`/login` (`src/pages/login.astro`)**: A public page containing the user login form. It will be accessible to all guest users.
- **`/signup` (`src/pages/signup.astro`)**: A public page for new user registration.
- **`/recover-password` (`src/pages/recover-password.astro`)**: A public page allowing users to request a password reset link.
- **`/reset-password` (`src/pages/reset-password.astro`)**: A page accessible via a link from the recovery email, where users can set a new password. The URL will contain a token.
- **`/dashboard` (`src/pages/dashboard.astro`)**: A protected page that will serve as the main landing area for authenticated users. Access will be restricted by middleware.

### 2.2. New & Updated Components

#### React Components (`.tsx`) for Interactivity

- **`src/components/auth/LoginForm.tsx`**: A client-side component responsible for handling user login.
  - **Responsibilities**: Manages form state, performs client-side validation (e.g., for empty fields), displays error messages returned from the backend, and submits credentials to the login API endpoint.
- **`src/components/auth/SignupForm.tsx`**: A client-side component for user registration.
  - **Responsibilities**: Similar to `LoginForm`, it will manage registration form state, validate inputs (email format, password complexity), and submit data to the signup API endpoint.
- **`src/components/auth/RecoverPasswordForm.tsx`**: A component for the password recovery process.
  - **Responsibilities**: Captures the user's email, displays success or error messages, and submits the email to the recovery API endpoint.
- **`src/components/auth/ResetPasswordForm.tsx`**: A component to handle the final password reset step.
  - **Responsibilities**: Captures and validates the new password and confirmation, extracts the reset token from the URL, and submits the new password to the backend.
- **`src/components/auth/ProfileSetupForm.tsx` (New)**: A client-side component for the initial user profile setup.
  - **Responsibilities**: Captures the user's experience level and years away from coding. Submits the data to a profile update endpoint. This will be shown to users after their first successful registration.

#### Astro Components (`.astro`) for Structure and Content

- **`src/components/landing/PublicHeader.astro` (Updated)**: The main navigation header will be updated to display conditional UI elements.
  - **Unauthenticated State**: Shows "Login" and "Sign Up" buttons.
  - **Authenticated State**: Shows a link to the "/dashboard" and a "Logout" button. The user's session will determine which state to render.
- **`src/components/auth/AuthHeader.astro` (New)**: A dedicated header for authenticated users inside the dashboard view. It could contain navigation specific to the authenticated part of the application.
- **`src/components/auth/LogoutButton.astro` (New)**: A simple component that renders a form or link to trigger the logout process via a POST request to the logout endpoint.

### 2.3. Layouts

- **`src/layouts/Layout.astro` (Updated)**: The main layout will be used for public-facing pages like the landing page, login, and signup. It will check for a user session to conditionally render parts of the header.
- **`src/layouts/DashboardLayout.astro` (New)**: A new layout for all authenticated pages. This layout will include the `AuthHeader` and any other UI elements common to the authenticated user experience. The middleware will ensure only authenticated users can access pages using this layout.

### 2.4. Scenarios and Error Handling

- **Registration**:
  - **Success**: User is redirected to the `/profile/setup` page to complete their profile.
  - **Error (Email Exists)**: "A user with this email already exists."
  - **Error (Invalid Password)**: "Password must be at least 6 characters long."
- **Login**:
  - **Success**: User is redirected to `/dashboard`.
  - **Error (Invalid Credentials)**: "Invalid email or password."
- **Password Recovery**:
  - **Success**: "If an account with this email exists, a recovery link has been sent." (This is a generic message for security).
  - **Error (Email not found)**: The same generic success message will be shown to prevent user enumeration attacks. Backend logs will differentiate.
  - **Note**: This approach differs from `US-004.1` in the PRD, which requests a specific error message. The current implementation is a deliberate security enhancement to prevent attackers from discovering registered email addresses.

## 3. Backend Logic

Backend logic will be implemented using Astro API routes and middleware to handle authentication processes securely on the server side.

### 3.1. API Endpoints

- **`POST /api/auth/signup` (`src/pages/api/auth/signup.ts`)**:
  - Receives `email` and `password` from the request body.
  - Validates input using a Zod schema.
  - Calls `supabase.auth.signUp()`.
  - On success, it may also handle setting the session cookie, although Supabase often manages this.
  - Returns a success or error JSON response.
- **`POST /api/auth/login` (`src/pages/api/auth/login.ts`)**:
  - Receives `email` and `password`.
  - Validates input.
  - Calls `supabase.auth.signInWithPassword()`.
  - On success, Supabase Auth sets a secure, HTTP-only cookie.
  - Returns a success or error response.
- **`POST /api/auth/logout` (`src/pages/api/auth/logout.ts`)**:
  - Calls `supabase.auth.signOut()`.
  - Clears the session cookie.
  - Redirects the user to the landing page (`/`).
- **`POST /api/auth/recover` (`src/pages/api/auth/recover.ts`)**:
  - Receives `email`.
  - Calls `supabase.auth.resetPasswordForEmail()`.
  - Returns a success response regardless of whether the email exists.
- **`GET /api/auth/callback` (`src/pages/api/auth/callback.ts`)**:
  - Handles callbacks from Supabase for OAuth providers or email confirmation links.
  - Uses the code from the URL to exchange it for a session with `supabase.auth.exchangeCodeForSession()`.
  - Redirects the user to the `/dashboard`.
- **`POST /api/profile/setup` (`src/pages/api/profile/setup.ts`) (New)**:
  - Receives user profile data (experience level, years away).
  - Validates the input.
  - Saves the data to the `profiles` table in the database, linking it to the authenticated user's ID.
  - Updates a flag (e.g., `profile_completed`) to ensure the user is not prompted again.
  - Redirects to `/dashboard` upon successful setup.

### 3.2. Data Validation

- Zod schemas will be defined in `src/lib/validators/auth.validators.ts`.
- **`SignupSchema`**: `email` (valid email format), `password` (min 6 characters).
- **`LoginSchema`**: `email`, `password`.
- **`RecoverPasswordSchema`**: `email`.
- **`ProfileSetupSchema` (New)**: `experienceLevel`, `yearsAway`.
- These schemas will be used in the API routes to validate incoming data before processing.

### 3.3. Middleware

- **`src/middleware/index.ts` (Updated)**:
  - On every request, it will create a Supabase client instance with the cookies from the request.
  - It will use `supabase.auth.getUser()` to check for an active session.
  - The user session object and Supabase client will be attached to `Astro.locals` (`context.locals.user`, `context.locals.supabase`) to be available in all server-rendered pages and API routes.
  - For protected routes (e.g., `/dashboard`), if `context.locals.user` is null, the middleware will redirect the user to `/login`.
  - It will also check a flag on the user's profile (e.g., `profile_completed`). If the user is authenticated but has not completed the profile setup, it will redirect them to `/profile/setup`, except for the setup API endpoint itself.

## 4. Authentication System (Supabase + Astro)

### 4.1. Supabase Integration

- The Supabase client will be initialized in `src/db/supabase.client.ts`. It will be configured using environment variables for the Supabase URL and anon key (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- Server-side Supabase interactions (in middleware and API routes) will be handled by creating a new client instance for each request, using the cookies from the request to maintain the user's session context.

### 4.2. Authentication Flows

1.  **Sign-up**:
    - User fills out `SignupForm.tsx` -> `POST /api/auth/signup`.
    - API route validates data and calls `supabase.auth.signUp()`.
    - If email confirmation is enabled in Supabase, the user will receive an email. `GET /api/auth/callback` will handle the confirmation link.
    - User is logged in and redirected to `/profile/setup`.
2.  **Profile Setup**:
    - User is redirected to `/profile/setup` after registration.
    - User fills out `ProfileSetupForm.tsx` -> `POST /api/profile/setup`.
    - API route saves profile data.
    - User is redirected to `/dashboard`.
3.  **Login**:
    - User fills out `LoginForm.tsx` -> `POST /api/auth/login`.
    - API route validates and calls `supabase.auth.signInWithPassword()`.
    - Supabase sets the session cookie.
    - User is redirected to `/dashboard`.
4.  **Logout**:
    - User clicks logout button -> `POST /api/auth/logout`.
    - API route calls `supabase.auth.signOut()`, clearing the session.
    - User is redirected to `/`.
5.  **Session Management & Route Protection**:
    - User navigates to a protected page like `/dashboard`.
    - `middleware/index.ts` intercepts the request.
    - It checks for a session cookie and validates it with `supabase.auth.getUser()`.
    - If the session is valid, the request proceeds. `Astro.locals` is populated. The middleware also checks if the profile is complete and redirects to `/profile/setup` if necessary.
    - If not, the user is redirected to `/login`.
6.  **Password Recovery**:
    - User enters email in `RecoverPasswordForm.tsx` -> `POST /api/auth/recover`.
    - API route calls `supabase.auth.resetPasswordForEmail()`.
    - Supabase sends an email with a unique link to `/reset-password`.
    - User clicks the link, lands on `reset-password.astro`, and sees `ResetPasswordForm.tsx`.
    - The component handles the password update by calling a new API endpoint which in turn uses `supabase.auth.updateUser()` with the new password. The session from the recovery link is used for authorization.
