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
      { id: "benefits", label: "Korzyści", href: "#benefits" },
      { id: "features", label: "Funkcje", href: "#features" },
      { id: "metrics", label: "Dlaczego my", href: "#metrics" },
    ],
    primaryCTA: {
      label: "Zarejestruj się",
      href: "/auth/register",
      variant: "primary",
      ariaLabel: "Zarejestruj się w Development Refresher Training",
    },
    secondaryCTA: {
      label: "Zaloguj się",
      href: "/auth/login",
      variant: "secondary",
      ariaLabel: "Zaloguj się do swojego konta",
    },
  },
  hero: {
    eyebrow: "AI-powered powrót do kodowania",
    title: "Indywidualny plan nauki, który przyspiesza Twój powrót do branży.",
    subtitle:
      "Development Refresher Training łączy generowanie tematów przez AI, hierarchię zagadnień oraz integrację z LeetCode, abyś mógł wrócić do programowania z pewnością siebie.",
    bulletPoints: [
      "Spersonalizowane tematy zgodne z Twoim profilem",
      "Widok postępów i aktywny streak motywujący do działania",
      "Bezpośrednie linki do wyzwań LeetCode",
    ],
    primaryCTA: {
      label: "Rozpocznij bezpłatnie",
      href: "/auth/register",
      variant: "primary",
      ariaLabel: "Przejdź do rejestracji i rozpocznij bezpłatny plan nauki",
    },
    secondaryCTA: {
      label: "Zobacz jak to działa",
      href: "#features",
      variant: "secondary",
      ariaLabel: "Przewiń do sekcji z funkcjami Development Refresher Training",
    },
    image: {
      src: "/landing-hero.svg",
      alt: "Zrzut ekranu przedstawiający dashboard Development Refresher Training z listą tematów, streakiem i integracją z LeetCode",
      width: 1200,
      height: 960,
      sizes: "(min-width: 1024px) 50vw, 90vw",
    },
  },
  benefits: [
    {
      id: "benefit-ai-plan",
      icon: "sparkles",
      title: "AI-generowany plan nauki",
      description: "Wybierz technologię, a algorytm wygeneruje hierarchię tematów dopasowaną do Twojego doświadczenia.",
      relatedStory: "US-005",
    },
    {
      id: "benefit-hierarchy",
      icon: "layers",
      title: "Hierarchia zagadnień",
      description:
        "Przeglądaj drzewo tematów i rozwijaj podtematy, aby skupić się na kluczowych lukach kompetencyjnych.",
      relatedStory: "US-006",
    },
    {
      id: "benefit-status",
      icon: "status",
      title: "Śledzenie statusów",
      description:
        "Oznaczaj tematy jako Do zrobienia, W trakcie lub Ukończone – dashboard aktualizuje się w czasie rzeczywistym.",
      relatedStory: "US-008",
    },
    {
      id: "benefit-leetcode",
      icon: "leetcode",
      title: "Linki do LeetCode",
      description: "Każdy temat zawiera praktyczne zadania z LeetCode, aby natychmiast przećwiczyć teorię.",
      relatedStory: "US-009",
    },
    {
      id: "benefit-dashboard",
      icon: "dashboard",
      title: "Czytelny dashboard",
      description: "Monitoruj liczbę ukończonych tematów, aktywne technologie i dzienny streak.",
      relatedStory: "US-010",
    },
    {
      id: "benefit-gamification",
      icon: "fire",
      title: "Gamifikacja i streak",
      description: "Motywujące wskaźniki oraz streak aktywności pozwalają utrzymać rytm nauki.",
      relatedStory: "US-010",
    },
  ],
  highlights: [
    {
      id: "highlight-ai",
      title: "Generuj plan oparty na AI",
      description:
        "Wprowadź kluczową technologię i pozwól AI zaproponować kolejne kroki wraz z rekomendowanymi zadaniami.",
      bulletPoints: [
        "Uwzględnia poziom doświadczenia i przerwę od branży",
        "Sugestie tematów aktualizowane na podstawie historii postępów",
        "Struktura od ogółu do szczegółu dla jasnej ścieżki nauki",
      ],
      media: {
        type: "illustration",
        src: "/illustrations/ai-plan.svg",
        alt: "Schemat AI tworzący listę tematów nauki",
      },
      cta: {
        label: "Wygeneruj tematy",
        href: "/auth/register",
        variant: "primary",
      },
    },
    {
      id: "highlight-dashboard",
      title: "Panel postępów w czasie rzeczywistym",
      description: "Widok dashboardu od razu pokazuje ile tematów ukończyłeś i które wymagają Twojej uwagi.",
      bulletPoints: [
        "Podział statusów Do zrobienia / W trakcie / Ukończone",
        "Lista technologii z największą liczbą tematów",
        "Historia aktywności z ostatnich 7 dni",
      ],
      media: {
        type: "image",
        src: "/illustrations/dashboard.svg",
        alt: "Makieta dashboardu pokazująca statystyki użytkownika",
      },
    },
    {
      id: "highlight-leetcode",
      title: "Praktyczne zadania z LeetCode",
      description: "Każdy temat zawiera serię sprawdzonych ćwiczeń, które otworzysz jednym kliknięciem.",
      bulletPoints: [
        "Bezpośrednie linki do zadań dopasowanych do tematu",
        "Informacje o poziomie trudności i oczekiwanym czasie",
        "Możliwość śledzenia, które zadania zostały ukończone",
      ],
      media: {
        type: "illustration",
        src: "/illustrations/leetcode.svg",
        alt: "Ilustracja przedstawiająca użytkownika rozwiązującego zadania LeetCode",
      },
    },
  ],
  metrics: [
    { label: "Użytkownicy utrzymują streak", value: "92%", caption: "aktywnych osób aktualizuje status co tydzień" },
    { label: "Szybszy powrót do pracy", value: "4,5 mies.", caption: "średni czas przygotowania po 60 dniach nauki" },
    { label: "Pokryte technologie", value: "30+", caption: "najpopularniejszych stosów w bibliotece tematów" },
  ],
  ctaBanner: {
    title: "Gotowy wrócić do kodowania?",
    description: "Załóż konto w kilka sekund i zacznij realizować plan nauki ułożony specjalnie dla Ciebie.",
    primaryCTA: {
      label: "Rozpocznij teraz",
      href: "/auth/register",
      variant: "primary",
    },
    secondaryCTA: {
      label: "Masz już konto?",
      href: "/auth/login",
      variant: "ghost",
    },
  },
  legal: [
    { label: "Polityka prywatności", href: "/legal/privacy" },
    { label: "Regulamin", href: "/legal/terms" },
    { label: "Bezpieczeństwo danych", href: "/legal/security" },
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

  content.highlights.forEach((highlight) => {
    if (highlight.bulletPoints.length === 0 || highlight.bulletPoints.length > 4) {
      throw new Error(`Highlight ${highlight.id} must have between 1 and 4 bullet points.`);
    }

    if (!highlight.media.alt) {
      throw new Error(`Highlight ${highlight.id} media requires an alt description.`);
    }
  });

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
