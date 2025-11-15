# View Implementation Plan: Landing Page

## 1. Overview

The Landing Page is the entry point for unauthenticated visitors to the Development Refresher Training application. Its primary purpose is to convert visitors into registered users by clearly communicating the value proposition: an AI-powered platform that helps former developers refresh their coding skills. The page is entirely static, built with Astro components for optimal performance, and features a hero section, feature showcase, process explanation, and footer with legal information.

## 2. View Routing

**Path**: `/`  
**File Location**: `src/pages/index.astro`  
**Access Level**: Public (no authentication required)  
**Rendering Mode**: Static (prerendered at build time)

## 3. Component Structure

```
index.astro (Landing Page)
└── Layout.astro
    ├── NavigationHeader.astro
    │   ├── Logo (inline SVG or image)
    │   └── Sign In Link
    │
    ├── main
    │   ├── HeroSection.astro
    │   │   ├── h1 (Headline)
    │   │   ├── p (Subheadline)
    │   │   ├── Button (Primary CTA: "Get Started Free")
    │   │   └── Button (Secondary CTA: "Sign In")
    │   │
    │   ├── FeaturesSection.astro
    │   │   ├── FeatureCard.astro (AI-Generated Topics)
    │   │   ├── FeatureCard.astro (Progress Tracking)
    │   │   └── FeatureCard.astro (LeetCode Integration)
    │   │
    │   └── HowItWorksSection.astro
    │       ├── ProcessStep.astro (1: Create Profile)
    │       ├── ProcessStep.astro (2: Generate Topics)
    │       └── ProcessStep.astro (3: Track Progress)
    │
    └── Footer.astro
        ├── Legal Links (Privacy Policy, Terms)
        └── Contact Information
```

## 4. Component Details

### 4.1. NavigationHeader.astro

**Description**: Minimal navigation header displaying the application logo and a "Sign In" link for returning users.

**Main Elements**:

- `<header>` element with `role="banner"` for semantic HTML
- Logo/brand name (text or SVG)
- Navigation link to sign-in page

**Handled Interactions**:

- Click on "Sign In" link navigates to `/login` page

**Validation**: None required (static navigation)

**Types**: None

**Props**: None (standalone component)

**Implementation Notes**:

- Use sticky positioning for persistent header on scroll
- Apply proper ARIA labels for navigation landmark
- Ensure sufficient color contrast for WCAG AA compliance

---

### 4.2. HeroSection.astro

**Description**: Primary attention-grabbing section featuring the main headline, subheadline, and call-to-action buttons that encourage visitors to sign up or sign in.

**Main Elements**:

- `<section>` wrapper with appropriate ARIA landmark
- `<h1>` with main headline: "Refresh Your Coding Skills"
- `<p>` with subheadline explaining AI-powered learning for returning developers
- Primary CTA: `<Button>` component with "Get Started Free" text
- Secondary CTA: `<Button>` component (outlined variant) with "Sign In" text
- Optional: Hero image or illustration

**Handled Interactions**:

- Click on "Get Started Free" button navigates to `/signup` page
- Click on "Sign In" button navigates to `/login` page

**Validation**: None required (navigation only)

**Types**: None

**Props**: None

**Implementation Notes**:

- Use large, bold typography for headline (text-4xl md:text-6xl)
- Center-align content for focus
- Use contrasting button styles to differentiate primary and secondary CTAs
- Consider adding subtle background gradient or pattern
- Ensure buttons have proper focus indicators for keyboard navigation

---

### 4.3. FeaturesSection.astro

**Description**: Section showcasing the three main features of the application using visual cards.

**Main Elements**:

- `<section>` wrapper with heading "Why Choose Development Refresher Training?" or similar
- `<h2>` section heading
- Grid container (3 columns on desktop, 1 column on mobile)
- Three `<FeatureCard>` components

**Handled Interactions**: None (static content)

**Validation**: None

**Types**:

```typescript
interface Feature {
  icon: string; // Icon identifier (e.g., "brain", "chart", "code")
  title: string;
  description: string;
}
```

**Props**: None

**Implementation Notes**:

- Define features array with content:
  1. AI-Generated Topics
  2. Progress Tracking
  3. LeetCode Integration
- Use Tailwind grid classes: `grid grid-cols-1 md:grid-cols-3 gap-6`
- Map over features array to render FeatureCard components

---

### 4.4. FeatureCard.astro

**Description**: Reusable card component displaying a single feature with icon, title, and description.

**Main Elements**:

- `<div>` card container with border and padding
- Icon container (SVG or icon component)
- `<h3>` feature title
- `<p>` feature description

**Handled Interactions**: None (static display)

**Validation**: None

**Types**:

```typescript
interface Props {
  icon: string;
  title: string;
  description: string;
}
```

**Props**:

- `icon`: String identifier or icon component reference
- `title`: Feature name
- `description`: Brief explanation of the feature

**Implementation Notes**:

- Use Shadcn/ui Card component as base
- Style icon with distinctive color (e.g., primary brand color)
- Ensure card has subtle hover effect for visual feedback
- Use semantic HTML with proper heading hierarchy

---

### 4.5. HowItWorksSection.astro

**Description**: Section explaining the three-step process users follow to get started with the platform.

**Main Elements**:

- `<section>` wrapper
- `<h2>` section heading: "How It Works"
- Flex or grid container for process steps
- Three `<ProcessStep>` components

**Handled Interactions**: None (informational content)

**Validation**: None

**Types**:

```typescript
interface ProcessStepData {
  number: number;
  title: string;
  description: string;
}
```

**Props**: None

**Implementation Notes**:

- Define steps array:
  1. Create Profile → Set your experience level and years away
  2. Generate Topics → AI creates personalized learning plan
  3. Track Progress → Mark topics complete and build your streak
- Consider visual connectors (arrows) between steps on desktop
- Use responsive layout: horizontal on desktop, vertical on mobile

---

### 4.6. ProcessStep.astro

**Description**: Reusable component displaying a single step in the process with numbered icon, title, and description.

**Main Elements**:

- `<div>` container
- Numbered badge/circle (e.g., "1", "2", "3")
- `<h3>` step title
- `<p>` step description

**Handled Interactions**: None (static display)

**Validation**: None

**Types**:

```typescript
interface Props {
  number: number;
  title: string;
  description: string;
}
```

**Props**:

- `number`: Step number (1, 2, or 3)
- `title`: Step name
- `description`: Step explanation

**Implementation Notes**:

- Use circular badge with number, styled with brand colors
- Align content for readability
- Consider subtle animation on scroll (optional enhancement)

---

### 4.7. Footer.astro

**Description**: Footer section containing legal links, contact information, and copyright notice.

**Main Elements**:

- `<footer>` element with `role="contentinfo"`
- Links section:
  - Privacy Policy link
  - Terms of Service link
- Contact information section (optional)
- Copyright notice
- Optional: Social media links

**Handled Interactions**:

- Click on legal links navigates to respective pages
- Click on contact link opens email client or contact form

**Validation**: None

**Types**:

```typescript
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}
```

**Props**: None

**Implementation Notes**:

- Use grid or flex layout for responsive design
- Ensure adequate spacing and readability
- External links should have `rel="noopener noreferrer"` for security
- Consider dark background to visually separate from main content

## 5. Types

Since the Landing Page is a static, public-facing page with no API integration, we only need simple view model types for component props:

### 5.1. Feature (Component Props)

```typescript
interface Feature {
  icon: string; // Icon identifier or name (e.g., "brain", "chart-bar", "code")
  title: string; // Feature name (e.g., "AI-Generated Topics")
  description: string; // Brief description of the feature (2-3 sentences)
}
```

**Usage**: Passed to `FeatureCard.astro` component to render feature information.

**Example**:

```typescript
const features: Feature[] = [
  {
    icon: "brain",
    title: "AI-Generated Topics",
    description:
      "Get a personalized learning plan based on your experience level and the technology you want to refresh.",
  },
  // ... more features
];
```

---

### 5.2. ProcessStepData (Component Props)

```typescript
interface ProcessStepData {
  number: number; // Step number (1, 2, 3)
  title: string; // Step name (e.g., "Create Profile")
  description: string; // Step explanation
}
```

**Usage**: Passed to `ProcessStep.astro` component to render process steps.

**Example**:

```typescript
const steps: ProcessStepData[] = [
  {
    number: 1,
    title: "Create Profile",
    description: "Tell us about your previous experience level and how long you've been away from coding.",
  },
  // ... more steps
];
```

---

### 5.3. FooterLink (Component Props)

```typescript
interface FooterLink {
  label: string; // Link text
  href: string; // Link destination
  external?: boolean; // Whether link opens in new tab
}
```

**Usage**: Used to render footer navigation links.

**Example**:

```typescript
const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];
```

---

### 5.4. Type Declarations Location

Create a new file for landing page specific types:

**File**: `src/components/landing/types.ts`

This file should export all the interfaces defined above. Since these are simple view models, they don't need to be in the global `src/types.ts` file.

## 6. State Management

**No state management required.**

The Landing Page is entirely static with no dynamic content, form inputs, or API calls. All components are Astro components that render server-side with no client-side JavaScript needed.

**Rationale**:

- No user input to capture
- No API calls to manage
- No dynamic content updates
- Navigation handled through standard HTML links

If future enhancements require interactivity (e.g., newsletter signup form, animated elements), consider:

- Converting specific components to React with `client:load` directive
- Using simple component-level state with `useState` hook
- No need for global state management (Redux, Zustand) at this stage

## 7. API Integration

**No API integration required for MVP.**

The Landing Page has no backend communication. User actions result in navigation to authentication pages:

**Navigation Flows**:

1. **Sign Up Flow**:
   - User clicks "Get Started Free" button
   - Navigate to: `/signup` or Supabase-hosted auth page
   - Implementation: `<a href="/signup">` or `<Button>` component with `onclick` navigation

2. **Sign In Flow**:
   - User clicks "Sign In" link or button
   - Navigate to: `/login` or Supabase-hosted auth page
   - Implementation: `<a href="/login">`

**Future Enhancements** (Post-MVP):

- Newsletter signup form (POST to `/api/newsletter`)
- Contact form submission
- Analytics event tracking

## 8. User Interactions

### 8.1. Primary CTA: "Get Started Free"

**Location**: HeroSection.astro

**Trigger**: User clicks the primary call-to-action button

**Expected Behavior**:

1. Button shows hover state (visual feedback)
2. On click, navigate to `/signup` page
3. User is taken to registration form

**Implementation**:

```astro
<Button as="a" href="/signup" size="lg" variant="default"> Get Started Free </Button>
```

---

### 8.2. Secondary CTA: "Sign In"

**Location**: NavigationHeader.astro and HeroSection.astro

**Trigger**: User clicks "Sign In" link or button

**Expected Behavior**:

1. Link/button shows hover state
2. On click, navigate to `/login` page
3. User is taken to login form

**Implementation**:

```astro
<!-- In Header -->
<a href="/login" class="text-sm font-medium hover:underline"> Sign In </a>

<!-- In Hero -->
<Button as="a" href="/login" size="lg" variant="outline"> Sign In </Button>
```

---

### 8.3. Footer Links

**Location**: Footer.astro

**Trigger**: User clicks legal or contact links

**Expected Behavior**:

1. Link shows hover state (underline)
2. On click, navigate to destination page
3. External links open in new tab with proper security attributes

**Implementation**:

```astro
<a href="/privacy" class="text-sm text-muted-foreground hover:underline"> Privacy Policy </a>
```

---

### 8.4. Responsive Navigation

**Location**: NavigationHeader.astro

**Trigger**: User views page on mobile device

**Expected Behavior**:

1. Header adapts to smaller screen
2. Logo and Sign In remain visible
3. Touch targets are adequately sized (minimum 44x44px)

---

### 8.5. Scroll Behavior

**Location**: All sections

**Trigger**: User scrolls down the page

**Expected Behavior**:

1. Smooth scroll between sections
2. Optional: Subtle fade-in animations as sections enter viewport (enhancement)
3. Header remains accessible (sticky positioning)

## 9. Conditions and Validation

### 9.1. No Form Validation Required

Since the Landing Page contains no forms or user input, there is no validation to implement.

### 9.2. Navigation Validation

**Condition**: Links must navigate to valid routes

**Components Affected**:

- NavigationHeader.astro
- HeroSection.astro
- Footer.astro

**Implementation**:

- Ensure `/signup` and `/login` routes exist before deployment
- Use proper `href` attributes for all links
- Test all navigation paths

### 9.3. Accessibility Validation

**Condition**: Page must meet WCAG 2.1 Level AA standards

**Components Affected**: All components

**Verification Steps**:

1. **Color Contrast**: Use browser DevTools or WebAIM Contrast Checker
   - Text contrast ratio must be at least 4.5:1
   - Large text (18pt+ or 14pt+ bold) must be at least 3:1
2. **Keyboard Navigation**:
   - All interactive elements must be keyboard accessible
   - Focus indicators must be visible
   - Test with Tab key through entire page

3. **Screen Reader Compatibility**:
   - Use semantic HTML elements
   - Provide alt text for all images and icons
   - Test with screen reader (NVDA, JAWS, or VoiceOver)

4. **Landmarks**:
   - Verify proper use of `<header>`, `<main>`, `<section>`, `<footer>`
   - Each landmark should have appropriate ARIA labels if multiple of same type

### 9.4. Responsive Design Validation

**Condition**: Page must be fully functional on all screen sizes

**Breakpoints to Test**:

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px and above

**Components Affected**: All components

**Verification**:

- Test in browser responsive mode
- Verify text remains readable (no overflow)
- Ensure touch targets are adequately sized on mobile
- Check that CTAs remain prominent and accessible

### 9.5. Performance Validation

**Condition**: Page should load quickly and score well on Lighthouse

**Metrics**:

- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Implementation**:

- Use Astro's built-in image optimization
- Minimize JavaScript (Astro components have zero JS by default)
- Lazy load below-the-fold images
- Use modern image formats (WebP, AVIF)

## 10. Error Handling

### 10.1. Navigation Errors

**Scenario**: Signup or login page routes don't exist

**Handling**:

- Ensure routes are created before deploying landing page
- Test all navigation paths in development
- Configure 404 page to handle missing routes gracefully

**Implementation**:

```astro
---
import Layout from "@/layouts/Layout.astro";
---

<!-- src/pages/404.astro -->
<Layout title="Page Not Found">
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold">404 - Page Not Found</h1>
      <p class="mt-4 text-muted-foreground">The page you're looking for doesn't exist.</p>
      <a href="/" class="mt-8 inline-block">Return Home</a>
    </div>
  </div>
</Layout>
```

---

### 10.2. Asset Loading Errors

**Scenario**: Images or icons fail to load

**Handling**:

- Provide meaningful alt text for all images
- Use inline SVG for critical icons (eliminates network request)
- Implement fallback styling for missing images

**Implementation**:

```astro
<!-- Use inline SVG for icons -->
<svg class="w-12 h-12" aria-hidden="true">
  <!-- SVG content -->
</svg>

<!-- Or with alt text for images -->
<img src="/images/feature.png" alt="AI-Generated Topics feature illustration" loading="lazy" />
```

---

### 10.3. Accessibility Errors

**Scenario**: Page fails accessibility checks

**Handling**:

- Run automated tests with axe DevTools or Lighthouse
- Address all critical and serious issues before deployment
- Test with actual assistive technologies

**Prevention**:

- Use semantic HTML by default
- Include ARIA labels where needed
- Ensure all interactive elements are keyboard accessible
- Maintain proper heading hierarchy (h1 → h2 → h3)

---

### 10.4. Layout Shift Errors

**Scenario**: Content shifts as page loads, poor CLS score

**Handling**:

- Define explicit width/height for images
- Reserve space for dynamic content
- Use Astro's Image component for automatic optimization

**Implementation**:

```astro
---
import { Image } from "astro:assets";
import heroImage from "@/assets/hero-image.png";
---

<Image src={heroImage} alt="Hero illustration" width={800} height={600} loading="eager" />
```

---

### 10.5. Responsive Layout Issues

**Scenario**: Layout breaks on specific screen sizes

**Handling**:

- Use mobile-first responsive design approach
- Test at all breakpoints during development
- Use Tailwind's responsive utilities systematically

**Implementation**:

```astro
<!-- Mobile-first approach -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Content automatically adjusts -->
</div>
```

---

### 10.6. Browser Compatibility Issues

**Scenario**: Features don't work in older browsers

**Handling**:

- Use progressive enhancement
- Test in modern browsers (Chrome, Firefox, Safari, Edge)
- Avoid cutting-edge CSS features without fallbacks

**Target Browser Support**:

- Modern browsers (last 2 versions)
- Browsers with >1% market share
- No IE11 support required (per modern web standards)

## 11. Implementation Steps

### Step 1: Set Up Project Structure

1. Create component directories:

   ```bash
   mkdir -p src/components/landing
   ```

2. Create type definitions file:

   ```bash
   touch src/components/landing/types.ts
   ```

3. Define types for landing components:

   ```typescript
   // src/components/landing/types.ts
   export interface Feature {
     icon: string;
     title: string;
     description: string;
   }

   export interface ProcessStepData {
     number: number;
     title: string;
     description: string;
   }

   export interface FooterLink {
     label: string;
     href: string;
     external?: boolean;
   }
   ```

---

### Step 2: Create Reusable Components

1. **Create FeatureCard.astro**:

   ```astro
   ---
   // src/components/landing/FeatureCard.astro
   interface Props {
     icon: string;
     title: string;
     description: string;
   }

   const { icon, title, description } = Astro.props;
   ---

   <div class="rounded-lg border bg-card p-6 shadow-sm">
     <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
       <!-- Icon implementation -->
       <span class="text-2xl" aria-hidden="true">{icon}</span>
     </div>
     <h3 class="mb-2 text-xl font-semibold">{title}</h3>
     <p class="text-muted-foreground">{description}</p>
   </div>
   ```

2. **Create ProcessStep.astro**:

   ```astro
   ---
   // src/components/landing/ProcessStep.astro
   interface Props {
     number: number;
     title: string;
     description: string;
   }

   const { number, title, description } = Astro.props;
   ---

   <div class="flex flex-col items-center text-center">
     <div
       class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
     >
       {number}
     </div>
     <h3 class="mb-2 text-xl font-semibold">{title}</h3>
     <p class="text-muted-foreground">{description}</p>
   </div>
   ```

---

### Step 3: Create Section Components

1. **Create NavigationHeader.astro**:

   ```astro
   ---
   // src/components/landing/NavigationHeader.astro
   ---

   <header
     class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
   >
     <div class="container flex h-16 items-center justify-between">
       <a href="/" class="text-xl font-bold"> DevRefresh </a>
       <nav>
         <a href="/login" class="text-sm font-medium hover:underline"> Sign In </a>
       </nav>
     </div>
   </header>
   ```

2. **Create HeroSection.astro**:

   ```astro
   ---
   // src/components/landing/HeroSection.astro
   import { Button } from "@/components/ui/button";
   ---

   <section class="container flex min-h-[600px] flex-col items-center justify-center py-12 text-center">
     <h1 class="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
       Refresh Your Coding Skills
     </h1>
     <p class="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
       AI-powered learning paths designed for developers returning to the field. Get personalized topics, track
       progress, and practice with LeetCode.
     </p>
     <div class="flex flex-col gap-4 sm:flex-row">
       <Button size="lg" asChild>
         <a href="/signup">Get Started Free</a>
       </Button>
       <Button size="lg" variant="outline" asChild>
         <a href="/login">Sign In</a>
       </Button>
     </div>
   </section>
   ```

3. **Create FeaturesSection.astro**:

   ```astro
   ---
   // src/components/landing/FeaturesSection.astro
   import FeatureCard from "./FeatureCard.astro";
   import type { Feature } from "./types";

   const features: Feature[] = [
     {
       icon: "🧠",
       title: "AI-Generated Topics",
       description:
         "Get a personalized learning plan based on your experience level and the technology you want to refresh.",
     },
     {
       icon: "📊",
       title: "Progress Tracking",
       description: "Track your learning journey with visual progress indicators and maintain your activity streak.",
     },
     {
       icon: "💻",
       title: "LeetCode Integration",
       description: "Practice coding with curated LeetCode problems relevant to each topic you're reviewing.",
     },
   ];
   ---

   <section class="container py-12 md:py-24">
     <h2 class="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
       Why Choose Development Refresher Training?
     </h2>
     <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
       {features.map((feature) => <FeatureCard {...feature} />)}
     </div>
   </section>
   ```

4. **Create HowItWorksSection.astro**:

   ```astro
   ---
   // src/components/landing/HowItWorksSection.astro
   import ProcessStep from "./ProcessStep.astro";
   import type { ProcessStepData } from "./types";

   const steps: ProcessStepData[] = [
     {
       number: 1,
       title: "Create Profile",
       description: "Tell us about your previous experience level and how long you've been away from coding.",
     },
     {
       number: 2,
       title: "Generate Topics",
       description: "Our AI creates a personalized learning plan tailored to your background and goals.",
     },
     {
       number: 3,
       title: "Track Progress",
       description: "Mark topics as complete, maintain your streak, and watch your skills improve.",
     },
   ];
   ---

   <section class="container py-12 md:py-24">
     <h2 class="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
     <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
       {steps.map((step) => <ProcessStep {...step} />)}
     </div>
   </section>
   ```

5. **Create Footer.astro**:

   ```astro
   ---
   // src/components/landing/Footer.astro
   import type { FooterLink } from "./types";

   const legalLinks: FooterLink[] = [
     { label: "Privacy Policy", href: "/privacy" },
     { label: "Terms of Service", href: "/terms" },
   ];

   const currentYear = new Date().getFullYear();
   ---

   <footer class="border-t bg-background">
     <div class="container py-8 md:py-12">
       <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
         <div>
           <p class="text-sm font-semibold">Development Refresher Training</p>
           <p class="mt-2 text-sm text-muted-foreground">AI-powered learning for returning developers</p>
         </div>

         <div>
           <p class="text-sm font-semibold">Legal</p>
           <ul class="mt-2 space-y-2">
             {
               legalLinks.map((link) => (
                 <li>
                   <a href={link.href} class="text-sm text-muted-foreground hover:underline">
                     {link.label}
                   </a>
                 </li>
               ))
             }
           </ul>
         </div>

         <div>
           <p class="text-sm font-semibold">Contact</p>
           <p class="mt-2 text-sm text-muted-foreground">support@devrefresh.app</p>
         </div>
       </div>

       <div class="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
         © {currentYear} Development Refresher Training. All rights reserved.
       </div>
     </div>
   </footer>
   ```

---

### Step 4: Create Main Landing Page

**Create src/pages/index.astro**:

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";
import NavigationHeader from "@/components/landing/NavigationHeader.astro";
import HeroSection from "@/components/landing/HeroSection.astro";
import FeaturesSection from "@/components/landing/FeaturesSection.astro";
import HowItWorksSection from "@/components/landing/HowItWorksSection.astro";
import Footer from "@/components/landing/Footer.astro";
---

<Layout
  title="Development Refresher Training - AI-Powered Learning for Returning Developers"
  description="Refresh your coding skills with personalized AI-generated learning paths, progress tracking, and LeetCode integration."
>
  <NavigationHeader />

  <main>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
  </main>

  <Footer />
</Layout>
```

---

### Step 5: Verify Shadcn/ui Button Component

Ensure the Button component from Shadcn/ui is properly installed and supports the `asChild` prop for rendering as a link:

```bash
# If not already installed
npx shadcn-ui@latest add button
```

Verify the button component at `src/components/ui/button.tsx` includes the `asChild` functionality.

---

### Step 6: Configure Layout Component

Ensure `Layout.astro` includes proper meta tags for SEO and accessibility:

```astro
---
// src/layouts/Layout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description || "Development Refresher Training"} />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

---

### Step 7: Test Responsiveness

1. Open the development server:

   ```bash
   npm run dev
   ```

2. Test at multiple breakpoints:
   - Mobile: 320px, 375px, 414px
   - Tablet: 768px, 1024px
   - Desktop: 1280px, 1920px

3. Verify:
   - Text remains readable
   - Buttons are adequately sized
   - Layout doesn't break
   - Images scale properly

---

### Step 8: Test Accessibility

1. **Run Lighthouse Audit**:
   - Open Chrome DevTools
   - Navigate to Lighthouse tab
   - Run audit with "Accessibility" category selected
   - Address any issues with score < 100

2. **Manual Keyboard Testing**:
   - Tab through entire page
   - Verify all interactive elements are reachable
   - Ensure focus indicators are visible
   - Test Enter key on buttons and links

3. **Screen Reader Testing** (optional but recommended):
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced correctly
   - Check that landmarks are properly identified

---

### Step 9: Optimize Performance

1. **Optimize Images**:
   - Use Astro's Image component for automatic optimization
   - Convert images to WebP format
   - Add appropriate width/height attributes

2. **Minimize JavaScript**:
   - Verify no unnecessary client-side JS is loaded
   - Astro components should have zero JS by default

3. **Run Performance Audit**:
   - Use Lighthouse Performance category
   - Target score > 90
   - Address any recommendations

---

### Step 10: Create Placeholder Pages

Create minimal signup and login pages so navigation doesn't break:

```astro
---
// src/pages/signup.astro
import Layout from "@/layouts/Layout.astro";
---

<Layout title="Sign Up">
  <div class="container flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold">Sign Up</h1>
      <p class="mt-4 text-muted-foreground">Signup page coming soon...</p>
      <a href="/" class="mt-8 inline-block">← Back to Home</a>
    </div>
  </div>
</Layout>
```

```astro
---
// src/pages/login.astro
import Layout from "@/layouts/Layout.astro";
---

<Layout title="Sign In">
  <div class="container flex min-h-screen items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold">Sign In</h1>
      <p class="mt-4 text-muted-foreground">Login page coming soon...</p>
      <a href="/" class="mt-8 inline-block">← Back to Home</a>
    </div>
  </div>
</Layout>
```

---

### Step 11: Final Review and Testing

1. **Visual Review**:
   - Check alignment and spacing
   - Verify typography hierarchy
   - Ensure consistent use of colors from theme
   - Test dark mode if implemented

2. **Content Review**:
   - Proofread all copy
   - Verify feature descriptions are accurate
   - Ensure CTAs are clear and compelling

3. **Cross-Browser Testing**:
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Device Testing**:
   - iPhone (Safari)
   - Android (Chrome)
   - iPad
   - Desktop

5. **Link Verification**:
   - Test all navigation links
   - Verify external links open in new tab
   - Ensure no broken links

---

### Step 12: Deploy

1. Build production version:

   ```bash
   npm run build
   ```

2. Preview production build locally:

   ```bash
   npm run preview
   ```

3. Verify everything works in production mode

4. Deploy to hosting platform (Vercel, Netlify, or DigitalOcean)

---

## Summary

This implementation plan provides a complete roadmap for building the Landing Page. The page is built entirely with Astro components for optimal performance, uses Shadcn/ui for consistent styling, and requires no client-side JavaScript. All components are modular and reusable, making future maintenance straightforward. The page is accessible, responsive, and optimized for conversion, fulfilling its primary purpose of converting visitors into registered users.
