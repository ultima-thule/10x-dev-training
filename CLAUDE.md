# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Astro starter template (10x-astro-starter) for building fast, accessible, and AI-friendly web applications using:

- **Astro 5** (configured for server-side rendering)
- **React 19** (for interactive components only)
- **TypeScript 5**
- **Tailwind CSS 4**
- **Shadcn/ui** components

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000
npm install              # Install dependencies

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier

# Production
npm run build            # Build for production
npm run preview          # Preview production build
```

**Node Version**: v22.14.0 (see `.nvmrc`)

## Project Architecture

### Directory Structure

- `src/layouts` - Astro layout templates
- `src/pages` - Astro pages and routing
- `src/pages/api` - API endpoints (must use `export const prerender = false`)
- `src/middleware/index.ts` - Astro middleware for request/response modification
- `src/components` - UI components (Astro for static, React for dynamic)
- `src/components/ui` - Shadcn/ui component library
- `src/lib` - Services and helper utilities
- `src/db` - Supabase clients and types
- `src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `src/assets` - Internal static assets
- `public` - Public static assets

### Key Configuration

- **Path Aliases**: Use `@/*` to import from `./src/*` (configured in tsconfig.json)
- **Output Mode**: Server-side rendering (`output: "server"`)
- **Adapter**: Node.js standalone mode (`@astrojs/node`)
- **Port**: Development server runs on port 3000
- **Integrations**: React, Sitemap
- **Vite Plugins**: Tailwind CSS

## Coding Practices

### Error Handling Pattern

- Handle errors and edge cases at the beginning of functions
- Use early returns to avoid deeply nested if statements
- Place the happy path last in the function
- Avoid unnecessary else statements; prefer if-return pattern
- Use guard clauses for preconditions and invalid states

### Astro-Specific

- Use **uppercase** format for endpoint handlers (`POST`, `GET`)
- Use `export const prerender = false` for API routes
- Use **Zod** for input validation in API routes
- Extract business logic into services in `src/lib/services`
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`
- Leverage View Transitions API for smooth page transitions

### React-Specific

- Use functional components with hooks (no class components)
- **Never use Next.js directives** like "use client" (this is Astro + React, not Next.js)
- Extract custom logic into hooks in `src/components/hooks`
- Use `React.memo()` for expensive components that render often with same props
- Use `React.lazy()` and `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Use `useId()` for generating accessibility IDs
- Consider `useOptimistic` for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates

### Component Selection

- Use **Astro components** (.astro) for static content and layouts
- Use **React components** (.tsx) only when interactivity is needed

### Styling with Tailwind

- Use `@layer` directive to organize styles (components, utilities, base)
- Use arbitrary values with square brackets for one-off designs (e.g., `w-[123px]`)
- Leverage responsive variants (`sm:`, `md:`, `lg:`)
- Use state variants (`hover:`, `focus-visible:`, `active:`)
- Implement dark mode with `dark:` variant
- Access Tailwind theme values using `theme()` function in CSS

### Accessibility (ARIA)

- Use ARIA landmarks for page regions (main, navigation, search)
- Apply appropriate ARIA roles to custom elements lacking semantic HTML
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions for dynamic content updates
- Apply `aria-label` or `aria-labelledby` for elements without visible labels
- Use `aria-describedby` for form input descriptions
- Implement `aria-current` for current items in navigation
- Avoid redundant ARIA that duplicates native HTML semantics

### Backend & Database (Supabase)

- Use Supabase for authentication and database operations
- Validate data with Zod schemas when exchanging with backend
- In Astro routes, use `supabase` from `context.locals` instead of importing directly
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

## Linting & Pre-commit

- **Husky** and **lint-staged** are configured for pre-commit hooks
- TypeScript/TSX/Astro files: Auto-fixed with ESLint
- JSON/CSS/Markdown files: Auto-formatted with Prettier
- Use linter feedback to improve code quality when making changes
