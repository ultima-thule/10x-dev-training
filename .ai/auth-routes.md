# Authentication Routes Overview

## Public Routes (Unauthenticated Users)

### Landing Page
- **URL**: `/`
- **File**: `src/pages/index.astro`
- **Purpose**: Main entry point, shows hero section and benefits
- **Links to**: `/login`, `/signup`

### Login
- **URL**: `/login`
- **File**: `src/pages/login.astro`
- **Component**: `LoginForm.tsx`
- **Purpose**: User authentication
- **Fields**: Email, Password
- **Links to**: 
  - `/recover-password` (Forgot password)
  - `/signup` (Create account)
- **Success**: Redirects to `/dashboard` (not yet implemented)

### Sign Up
- **URL**: `/signup`
- **File**: `src/pages/signup.astro`
- **Component**: `SignupForm.tsx`
- **Purpose**: New user registration
- **Fields**: Email, Password, Confirm Password
- **Links to**: `/login` (Already have account)
- **Success**: Redirects to `/profile/setup`

### Recover Password
- **URL**: `/recover-password`
- **File**: `src/pages/recover-password.astro`
- **Component**: `RecoverPasswordForm.tsx`
- **Purpose**: Request password reset link
- **Fields**: Email
- **Links to**: `/login` (Back to sign in)
- **Success**: Shows confirmation message, sends email with reset link

### Reset Password
- **URL**: `/reset-password`
- **File**: `src/pages/reset-password.astro`
- **Component**: `ResetPasswordForm.tsx`
- **Purpose**: Set new password (accessed via email link)
- **Fields**: New Password, Confirm New Password
- **Query Params**: Token (from email link)
- **Success**: Redirects to `/login`

### Profile Setup
- **URL**: `/profile/setup`
- **File**: `src/pages/profile/setup.astro`
- **Component**: `ProfileSetupForm.tsx`
- **Purpose**: Initial profile configuration for new users
- **Fields**: 
  - Experience Level (Beginner/Intermediate/Advanced/Expert)
  - Time Away from Coding (< 1yr, 1-2yrs, 3-5yrs, > 5yrs)
- **Success**: Redirects to `/dashboard` (not yet implemented)

## Authentication Flow Diagrams

### Registration Flow
```
1. User visits /signup
2. Fills out registration form
3. Backend creates account (TODO)
4. Redirects to /profile/setup
5. User completes profile
6. Redirects to /dashboard
```

### Login Flow
```
1. User visits /login
2. Enters credentials
3. Backend validates (TODO)
4. Checks profile completion (TODO)
   - If incomplete: redirect to /profile/setup
   - If complete: redirect to /dashboard
```

### Password Recovery Flow
```
1. User visits /recover-password
2. Enters email address
3. Backend sends recovery email (TODO)
4. User clicks link in email
5. Opens /reset-password?token=XXX
6. User sets new password
7. Redirects to /login
```

## Testing URLs

Start the dev server and test these URLs:

```bash
npm run dev

# Then visit:
http://localhost:3000/login
http://localhost:3000/signup
http://localhost:3000/recover-password
http://localhost:3000/reset-password
http://localhost:3000/profile/setup
```

## Form Validation Rules

### Email Validation
- Required field
- Must contain "@" symbol
- Case insensitive

### Password Validation
- Required field
- Minimum 6 characters
- Must match confirmation (signup/reset)

### Profile Setup Validation
- Experience level: Required selection
- Time away: Required selection

## Accessibility Testing

All forms support:
- ✅ Keyboard navigation (Tab, Shift+Tab, Enter)
- ✅ Screen reader announcements (ARIA live regions)
- ✅ Focus visible indicators
- ✅ Proper label associations
- ✅ Error message announcements
- ✅ Loading state announcements

## Browser Compatibility

Tested and working on:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Dark/Light theme support

## Security Considerations (UI Layer)

- ✅ No password display (type="password")
- ✅ Autocomplete attributes for password managers
- ✅ Client-side validation prevents common errors
- ✅ Generic success messages for password recovery (prevents user enumeration)
- ✅ Loading states prevent double submissions
- ✅ CSRF protection (to be added in backend)
- ✅ Form validation happens on submit (noValidate attribute with custom handling)

## Known Limitations (To Be Addressed)

1. **No Backend Integration**: All forms show placeholder messages
2. **No Session Management**: Cannot track logged-in state
3. **No Protected Routes**: Dashboard not implemented yet
4. **No Email Verification**: Email confirmation flow not implemented
5. **No OAuth Providers**: Social login not implemented
6. **No Rate Limiting**: To be added in backend
7. **No Password Strength Meter**: Could be enhanced in future
8. **No Remember Me**: Session persistence to be implemented

## Next Implementation Steps

See `auth-ui-implementation.md` for detailed next steps.

