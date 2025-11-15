## Project name

### Development Refresher Training

![version](https://img.shields.io/badge/version-0.0.1-blue)
![node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)
![astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro&logoColor=white)
![react](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![typescript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

### Table of contents

1. [Project description](#project-description)
2. [Tech stack](#tech-stack)
3. [Getting started locally](#getting-started-locally)
4. [Available scripts](#available-scripts)
5. [Project scope](#project-scope)
6. [Project status](#project-status)
7. [License](#license)

## Project description

Development Refresher Training is a web application that helps former software developers re‑enter the industry with confidence. It uses AI to generate a personalized, hierarchical set of review topics based on a selected technology and the user’s background, lets users manage topics (CRUD) and track progress through statuses, and includes light gamification such as activity streaks. It also links directly to relevant LeetCode problems for hands‑on practice.

- Personalized learning plan powered by AI
- Hierarchical topics with actionable sub‑tasks
- Full CRUD and progress tracking (To Do, In Progress, Completed)
- Direct links to LeetCode practice problems
- Dashboard showing progress and activity streaks

For detailed product context and user stories, see the PRD: [`.ai/prd.md`](.ai/prd.md).

## Tech stack

- Astro 5 (SSR) with Node adapter (standalone mode)
- React 19 for interactive UI components
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui components (via supporting packages)
- Supabase (Auth + Postgres) — planned per PRD
- OpenRouter.ai — planned for AI topic generation

Integrations and configuration:

- Server‑side rendering: `output: "server"` (`astro.config.mjs`)
- Dev server: `http://localhost:3000`
- Vite plugin: Tailwind CSS
- Integrations: React, Sitemap
- TypeScript path alias: `@/*` → `./src/*` (`tsconfig.json`)

More architectural discussion: [`.ai/tech-stack.md`](.ai/tech-stack.md).

## Getting started locally

### Prerequisites

- Node.js 22.14.0 (use `nvm` to match `.nvmrc`)
- npm (comes with Node)

### Setup

```bash
# Clone and enter the project
git clone <your-repo-url>.git
cd <your-repo-directory>

# Use the project's Node version
nvm use

# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev
```

### Build and preview (production-like)

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

### Developer notes

- TypeScript path alias is available: import with `@/*` from `./src/*`.
- SSR is enabled via `@astrojs/node` in standalone mode.
- Project structure (high level):
  - `src/pages` (routes), `src/layouts` (layouts), `src/components` (UI), `src/lib` (utilities)
  - `public/` for static assets
- Environment variables (e.g., Supabase, OpenRouter.ai) are not required to run the starter; they will be introduced when implementing the corresponding features from the PRD.

## Available scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Direct access to Astro CLI
npm run astro

# Lint and format
npm run lint
npm run lint:fix
npm run format
```

Additional tooling:

- ESLint (with `eslint-plugin-astro`, React, TypeScript) and Prettier (`prettier-plugin-astro`)
- lint-staged runs ESLint on `*.{ts,tsx,astro}` and Prettier on `*.{json,css,md}` on commit
- Husky is included; enable hooks if needed in your environment

## Project scope

### In scope for MVP

- Supabase-based authentication (sign up, login, logout)
- AI-driven generation of review topics for a selected technology
- CRUD operations for review topics
- Topic status tracking: To Do, In Progress, Completed
- Direct links to relevant LeetCode problems
- Personal dashboard with basic progress visualization

### Out of scope for MVP

- Sharing topics between different users
- Direct synchronization with LeetCode progress
- Notifications or reminders
- Rating the quality of AI-generated topics

For full requirements and user stories, see [`.ai/prd.md`](.ai/prd.md).

## Project status

- Status: MVP in progress
- Current codebase: modern Astro 5 + React 19 + Tailwind 4 starter with SSR (Node adapter), ready to implement PRD features
- Upcoming work (per PRD):
  - Supabase auth and profile setup
  - AI topic generation (OpenRouter.ai)
  - Hierarchical topic CRUD + status updates + filters/sorts
  - LeetCode link integration
  - Dashboard and gamification (streaks)
- Hosting note: Vercel is a simple option for initial MVP deployment; DigitalOcean + Docker is a viable path later

## License

TBD. This repository currently has no LICENSE file. To open‑source the project, add a `LICENSE` (e.g., MIT) and update this section accordingly.
