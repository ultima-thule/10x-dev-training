export type ThemePreference = "light" | "dark";

export type CTAButtonVariant = "primary" | "secondary" | "ghost";

export interface CTAButtonConfig {
  label: string;
  href: string;
  variant: CTAButtonVariant;
  ariaLabel?: string;
}

export interface HeroImageConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
}

export interface HeroContent {
  eyebrow?: string;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  primaryCTA: CTAButtonConfig;
  secondaryCTA: CTAButtonConfig;
  image: HeroImageConfig;
}

export interface HeaderNavLink {
  id: string;
  label: string;
  href: string;
  ariaLabel?: string;
}

export interface HeaderContent {
  productName: string;
  links: HeaderNavLink[];
  primaryCTA: CTAButtonConfig;
  secondaryCTA: CTAButtonConfig;
}

export interface BenefitItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  relatedStory: "US-005" | "US-006" | "US-007" | "US-008" | "US-009" | "US-010";
}

export interface FeatureHighlightMedia {
  type: "image" | "illustration";
  src: string;
  alt: string;
}

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  bulletPoints: string[];
  media: FeatureHighlightMedia;
  cta?: CTAButtonConfig;
}

export interface MetricItem {
  label: string;
  value: string;
  caption?: string;
}

export interface CTABannerContent {
  title: string;
  description: string;
  primaryCTA: CTAButtonConfig;
  secondaryCTA: CTAButtonConfig;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface ThemeToggleProps {
  id?: string;
  initialTheme: ThemePreference;
  storageKey?: string;
}

export interface ThemeBootstrapScriptConfig {
  storageKey: string;
  defaultTheme: ThemePreference;
}

export interface LandingContentVM {
  header: HeaderContent;
  hero: HeroContent;
  benefits: BenefitItem[];
  highlights: FeatureHighlight[];
  metrics?: MetricItem[];
  ctaBanner: CTABannerContent;
  legal: LegalLink[];
}

const LEGAL_LINK_PATTERN = /^\/[a-z0-9-/]+$/i;

const defaultContent: LandingContentVM = {
  header: {
    productName: "Development Refresher Training",
    links: [
      { id: "benefits", label: "Benefits", href: "#benefits" },
      { id: "features", label: "Features", href: "#features" },
      { id: "metrics", label: "Why Us", href: "#metrics" },
    ],
    primaryCTA: {
      label: "Sign Up",
      href: "/signup",
      variant: "primary",
      ariaLabel: "Sign up for Development Refresher Training",
    },
    secondaryCTA: {
      label: "Log In",
      href: "/login",
      variant: "secondary",
      ariaLabel: "Log in to your account",
    },
  },
  hero: {
    eyebrow: "AI-powered return to coding",
    title: "A personalized learning plan that accelerates your return to the industry.",
    subtitle:
      "Development Refresher Training combines AI-generated topics, hierarchical concepts, and LeetCode integration so you can return to programming with confidence.",
    bulletPoints: [
      "Personalized topics tailored to your profile",
      "Progress view and active streak to keep you motivated",
      "Direct links to LeetCode challenges",
    ],
    primaryCTA: {
      label: "Start for Free",
      href: "/signup",
      variant: "primary",
      ariaLabel: "Go to registration and start your free learning plan",
    },
    secondaryCTA: {
      label: "See How It Works",
      href: "#features",
      variant: "secondary",
      ariaLabel: "Scroll to Development Refresher Training features section",
    },
    image: {
      src: "/landing-hero.svg",
      alt: "Screenshot showing Development Refresher Training dashboard with topic list, streak, and LeetCode integration",
      width: 1200,
      height: 960,
      sizes: "(min-width: 1024px) 50vw, 90vw",
    },
  },
  benefits: [
    {
      id: "benefit-ai-plan",
      icon: "sparkles",
      title: "AI-Generated Learning Plan",
      description: "Choose a technology and the algorithm will generate a topic hierarchy tailored to your experience.",
      relatedStory: "US-005",
    },
    {
      id: "benefit-hierarchy",
      icon: "layers",
      title: "Topic Hierarchy",
      description: "Browse the topic tree and expand subtopics to focus on key skill gaps.",
      relatedStory: "US-006",
    },
    {
      id: "benefit-status",
      icon: "status",
      title: "Status Tracking",
      description: "Mark topics as To Do, In Progress, or Completed – the dashboard updates in real-time.",
      relatedStory: "US-008",
    },
    {
      id: "benefit-leetcode",
      icon: "leetcode",
      title: "LeetCode Links",
      description: "Every topic includes practical LeetCode problems to immediately practice the theory.",
      relatedStory: "US-009",
    },
    {
      id: "benefit-dashboard",
      icon: "dashboard",
      title: "Clear Dashboard",
      description: "Monitor the number of completed topics, active technologies, and daily streak.",
      relatedStory: "US-010",
    },
    {
      id: "benefit-gamification",
      icon: "fire",
      title: "Gamification and Streak",
      description: "Motivating metrics and activity streak help you maintain your learning rhythm.",
      relatedStory: "US-010",
    },
  ],
  highlights: [
    {
      id: "highlight-ai",
      title: "Generate AI-Based Plan",
      description: "Enter a key technology and let AI suggest next steps with recommended exercises.",
      bulletPoints: [
        "Considers experience level and time away from the industry",
        "Topic suggestions updated based on progress history",
        "Structure from general to specific for a clear learning path",
      ],
      media: {
        type: "illustration",
        src: "/illustrations/ai-plan.svg",
        alt: "AI diagram creating a learning topic list",
      },
      cta: {
        label: "Generate Topics",
        href: "/signup",
        variant: "primary",
      },
    },
    {
      id: "highlight-dashboard",
      title: "Real-Time Progress Dashboard",
      description:
        "The dashboard view instantly shows how many topics you've completed and which require your attention.",
      bulletPoints: [
        "Breakdown of To Do / In Progress / Completed statuses",
        "List of technologies with the most topics",
        "Activity history from the last 7 days",
      ],
      media: {
        type: "image",
        src: "/illustrations/dashboard.svg",
        alt: "Dashboard mockup showing user statistics",
      },
    },
    {
      id: "highlight-leetcode",
      title: "Practical LeetCode Problems",
      description: "Every topic includes a series of vetted exercises you can open with one click.",
      bulletPoints: [
        "Direct links to problems matched to the topic",
        "Information about difficulty level and expected time",
        "Ability to track which problems have been completed",
      ],
      media: {
        type: "illustration",
        src: "/illustrations/leetcode.svg",
        alt: "Illustration showing a user solving LeetCode problems",
      },
    },
  ],
  metrics: [
    { label: "Users maintain streak", value: "92%", caption: "of active users update status weekly" },
    { label: "Faster return to work", value: "4.5 mo.", caption: "average preparation time after 60 days of learning" },
    { label: "Technologies covered", value: "30+", caption: "most popular stacks in the topic library" },
  ],
  ctaBanner: {
    title: "Ready to Return to Coding?",
    description: "Create an account in seconds and start following a learning plan designed specifically for you.",
    primaryCTA: {
      label: "Start Now",
      href: "/signup",
      variant: "primary",
    },
    secondaryCTA: {
      label: "Already have an account?",
      href: "/login",
      variant: "ghost",
    },
  },
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Service", href: "/legal/terms" },
    { label: "Data Security", href: "/legal/security" },
  ],
};

function validateLandingContent(content: LandingContentVM): LandingContentVM {
  if (content.benefits.length < 4) {
    throw new Error("LandingContentVM requires at least 4 benefit items.");
  }

  for (const benefit of content.benefits) {
    if (!benefit.title || !benefit.description) {
      throw new Error(`Benefit ${benefit.id} is missing title or description.`);
    }
  }

  for (const link of content.legal) {
    if (!LEGAL_LINK_PATTERN.test(link.href)) {
      throw new Error(`Legal link ${link.label} must be a relative path.`);
    }
  }

  for (const highlight of content.highlights) {
    if (highlight.bulletPoints.length === 0 || highlight.bulletPoints.length > 4) {
      throw new Error(`Highlight ${highlight.id} must have between 1 and 4 bullet points.`);
    }

    if (!highlight.media.alt) {
      throw new Error(`Highlight ${highlight.id} media requires an alt description.`);
    }
  }

  return content;
}

export function getLandingContent(): LandingContentVM {
  return validateLandingContent(defaultContent);
}

declare global {
  interface Window {
    __applyTheme?: (theme: ThemePreference) => ThemePreference;
    __setPreferredTheme?: (theme: ThemePreference) => ThemePreference;
  }
}
