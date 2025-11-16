# Plan implementacji widoku Landing

## 1. Przegląd

Widok publiczny `/` ma zaprezentować główną wartość Development Refresher Training, budując zaufanie i kierując użytkownika prosto do rejestracji/logowania (US-001, US-002). Treści muszą podkreślać AI-generowany plan nauki, hierarchię tematów, śledzenie postępów i integrację z LeetCode oraz gamifikację (US-005–US-010). Layout ma być semantyczny, responsywny oraz w 100% dostępny.

## 2. Routing widoku

- Ścieżka: `/`
- Implementacja: plik `src/pages/index.astro` korzystający z globalnego layoutu i SSR Astro.
- CTA kierują odpowiednio do `/auth/register` i `/auth/login` (utrzymanie zgodności z Supabase routami publicznymi).

## 3. Struktura komponentów

```
LandingPage (Astro)
├── PublicHeader
│   ├── ThemeToggle (React wyspa)
│   └── PrimaryCTA
├── <main>
│   ├── HeroSection
│   ├── BenefitList
│   ├── FeatureSplitSection (AI Topics)
│   ├── FeatureSplitSection (Dashboard)
│   ├── FeatureSplitSection (LeetCode & streak)
│   ├── CredibilityStrip (opcjonalnie metryki/streak preview)
│   └── CTABanner
└── FooterLegal
```

## 4. Szczegóły komponentów

### PublicHeader

- Opis: stały `header` z logo, przełącznikiem motywu i nawigacją (CTA „Zaloguj się”, „Zarejestruj się”); zapewnia skip link.
- Główne elementy: `<header>`, `<nav>`, lista linków, `ThemeToggle` (React wyspa), mobilny `Disclosure` (React) dla menu.
- Obsługiwane interakcje: kliknięcia CTA, toggle mobilnego menu, focus na skip link, przełączanie motywu (persist do `localStorage`).
- Walidacja: linki muszą wskazywać `/auth/login` i `/auth/register`; aria-attributes (`aria-expanded`, `aria-controls`) dla menu; `ThemeToggle` musi aktualizować `aria-pressed`.
- Typy: `HeaderNavLink`, `CTAButtonConfig`, `ThemeToggleProps`.
- Propsy: `links: HeaderNavLink[]`, `primaryCta: CTAButtonConfig`, `themeToggle: ThemeToggleProps`.

### HeroSection

- Opis: główne `section` z `h1`, opisem, listą bulletów i dwoma CTA zgodnymi z US-001/002; zawiera responsywną ilustrację.
- Główne elementy: `<section role="banner">`, `h1`, `p`, `<ul>`, przyciski, `<picture>`/`<img>`.
- Interakcje: kliknięcia CTA, focus style, optional reduced-motion animacja tła.
- Walidacja: alt tekst obrazka, lista bulletów niepusta, CTA mają `aria-label`.
- Typy: `HeroContent`, `CTAButtonConfig`.
- Propsy: `content: HeroContent`.

### BenefitList

- Opis: siatka kart opisujących korzyści (AI generacja, hierarchia, statusy, LeetCode, dashboard, streak) mapujących user stories.
- Główne elementy: `<section>`, `h2`, `<ul>` z `<li>` zawierającymi ikonę, `h3`, `p`.
- Interakcje: brak aktywnych zdarzeń, jedynie focus dla klawiatury.
- Walidacja: każdy element musi mieć tytuł i opis; ikony oznaczone `aria-hidden="true"` + tekst.
- Typy: `BenefitItem`.
- Propsy: `items: BenefitItem[]`.

### FeatureSplitSection

- Opis: moduł 50/50 z tekstem i grafiką, opisujący konkretne funkcje (AI topic generation, dashboard progresu, LeetCode + streak). Powtarzalny komponent.
- Główne elementy: `<section>`, `h2`, `p`, `<ul>`, `<picture>`; opcjonalny CTA.
- Interakcje: CTA kliknięcia, lazy-load ilustracji.
- Walidacja: `media.alt` wymagany; bullet list maks. 4, min. 1; CTA opcjonalne ale jeśli występuje to `href` musi być poprawne.
- Typy: `FeatureHighlight`, `CTAButtonConfig`.
- Propsy: `highlight: FeatureHighlight`, `reverse?: boolean`.

### CredibilityStrip

- Opis: pasek z metrykami/streak preview (np. „+90% użytkowników aktualizuje statusy”); zwiększa zaufanie.
- Główne elementy: `<section role="region">`, `<dl>`/karty.
- Interakcje: brak.
- Walidacja: wartości tekstowe (np. `value`, `label`), zapewnić kontrast.
- Typy: `MetricItem`.
- Propsy: `items: MetricItem[]`.

### CTABanner

- Opis: końcowa sekcja zachęcająca do akcji, powtarza główne CTA.
- Główne elementy: `<section>`, `h2`, `p`, przyciski.
- Interakcje: kliknięcia CTA.
- Walidacja: analogicznie do hero; przyciski muszą mieć poprawne `href`.
- Typy: `CTABannerContent`, `CTAButtonConfig`.
- Propsy: `content: CTABannerContent`.

### FooterLegal

- Opis: `footer` z linkami do polityki prywatności, regulaminu, bezpieczeństwa; linki otwierane w tym samym oknie.
- Główne elementy: `<footer>`, `<nav aria-label="Linki prawne">`, lista linków.
- Interakcje: kliknięcia linków.
- Walidacja: `href` musi wskazywać istniejące strony; zapewnić `rel="nofollow"` jeśli wymagane.
- Typy: `LegalLink`.
- Propsy: `links: LegalLink[]`.

### ThemeToggle

- Opis: niewielki przycisk/`button` umożliwiający przełączanie motywu jasny/ciemny, z synchronizacją `localStorage` i aktualizacją klasy `dark` na elemencie `html`.
- Główne elementy: `<button type="button">`, ikony trybów (`☀️/🌙` lub ikonki z shadcn), etykieta tekstowa, `aria-pressed`.
- Obsługiwane interakcje: kliknięcie zmienia motyw (light ↔ dark); reaguje na `prefers-color-scheme` (listener `matchMedia`); zapewnia focus styles.
- Walidacja: `aria-pressed` odpowiada aktualnemu stanowi; label aktualizuje się zgodnie z motywem; przycisk dostępny z klawiatury.
- Typy: `ThemePreference`, `ThemeToggleProps`.
- Propsy: `initialTheme: ThemePreference`, `onToggle?: (next: ThemePreference) => void`.

## 5. Typy

- `CTAButtonConfig { label: string; href: string; variant: "primary" | "secondary" | "ghost"; ariaLabel?: string }`
- `HeroContent { eyebrow?: string; title: string; subtitle: string; bulletPoints: string[]; primaryCTA: CTAButtonConfig; secondaryCTA: CTAButtonConfig; image: { src: string; alt: string; width: number; height: number; sizes: string } }`
- `BenefitItem { id: string; icon: IconComponent | string; title: string; description: string; relatedStory: "US-005" | "US-006" | "US-007" | "US-008" | "US-009" | "US-010" }`
- `FeatureHighlight { id: string; title: string; description: string; bulletPoints: string[]; media: { type: "image" | "illustration"; src: string; alt: string }; cta?: CTAButtonConfig }`
- `MetricItem { label: string; value: string; caption?: string }`
- `CTABannerContent { title: string; description: string; primaryCTA: CTAButtonConfig; secondaryCTA: CTAButtonConfig }`
- `LegalLink { label: string; href: string }`
- `ThemePreference = "light" | "dark"`
- `ThemeToggleProps { id?: string; initialTheme: ThemePreference; storageKey?: string }`
- `ThemeBootstrapScriptConfig { storageKey: string; defaultTheme: ThemePreference }`
- `LandingContentVM { hero: HeroContent; benefits: BenefitItem[]; highlights: FeatureHighlight[]; metrics?: MetricItem[]; ctaBanner: CTABannerContent; legal: LegalLink[] }`
  Wszystkie typy deklarujemy w `src/types/ui/landing.ts` i eksportujemy do strony Astro.

## 6. Zarządzanie stanem

- Header mobilny: React hook `useMobileMenu` (`const [isOpen, setIsOpen] = useState(false)`) steruje menu; aria state aktualizowany na przyciskach. Hook znajduje się w `src/components/hooks/useMobileMenu.ts`.
- Motyw: hook `useThemePreference` (klient, React) zarządza stanem `ThemePreference`, zapisuje do `localStorage`, nasłuchuje `matchMedia('(prefers-color-scheme: dark)')` i wywołuje `window.__applyTheme`. Udostępnia API `{ theme, toggleTheme }` wykorzystywane przez `ThemeToggle`.
- Animacje hero: `usePrefersReducedMotion` (custom hook) decyduje czy odtworzyć gradienty/paralaksy; fallback do statycznego tła.
- Sekcje reveal: opcjonalny `useIntersectionReveal` dla animacji kart; jeśli użyty, działa tylko na kliencie i degraduje się do CSS gdy JS wyłączony.
- Pozostała treść jest statyczna (SSR), przechowywana w obiekcie `LandingContentVM` importowanym jako `const landingContent = getLandingContent();`.

## 7. Integracja API

- Brak zewnętrznych zapytań HTTP w tym widoku.
- Akcje frontendowe:
  - `onClick` CTA → `Astro.redirect` (jeśli użyjemy `<Button href=...>` w SSR) lub standardowe `<a>` prowadzące do `/auth/register` / `/auth/login`.
  - Ewentualny hook analityczny `window?.analytics?.track('cta_clicked', { target: 'signup' })` wywoływany po stronie klienta (opcjonalne, zabezpieczyć `typeof window !== "undefined"`).

## 8. Interakcje użytkownika

- Kliknięcie CTA w headerze/hero/banner → przekierowanie do odpowiedniego widoku auth; oczekiwany wynik: przejście do formularza Supabase.
- Kliknięcie `ThemeToggle` → aktualizacja motywu, natychmiastowa zmiana klas Tailwind `dark:` na całej stronie, zapis preferencji.
- Nawigacja klawiaturą: skip link przenosi do `#main-content`.
- Rozwinięcie menu mobilnego → pokazanie listy linków, focus trap w obszarze menu do czasu zamknięcia.
- Kliknięcie linków prawnych → otwarcie dokumentu w tej samej zakładce.
- Scroll do sekcji (jeśli w headerze anchor) → płynne przewinięcie (CSS `scroll-behavior: smooth`).

## 9. Warunki i walidacja

- CTA zawsze aktywne; weryfikacja polega na istnieniu tras `/auth/login` i `/auth/register` (statyczne linki, brak runtime checków).
- Obraz hero wymaga `alt` i fallback koloru tła; weryfikujemy w build-time (TypeScript) obecność pola `alt`.
- BenefitList wymaga co najmniej 4 elementów – w razie braku log warn w dev; w kodzie dodać assert.
- Linki prawne muszą być pełnymi ścieżkami (np. `/legal/privacy`); prosta walidacja regexem podczas budowy obiektu konfiguracyjnego.
- Hook `useMobileMenu` blokuje scroll `document.body.style.overflow = 'hidden'` tylko gdy `isOpen` i przywraca w `useEffect cleanup`.
- `ThemeToggle` musi walidować wejście z `localStorage`: akceptujemy tylko `"light"` lub `"dark"`; w innych przypadkach reset do domyślnego; sprawdzamy, czy `document.documentElement` istnieje przed manipulacją.
- Skrypt bootstrapowy motywu (`themeBootstrapScript`) musi być wstrzyknięty w `<head>` przed malowaniem, aby uniknąć migotania; walidacja obejmuje obecność `storageKey`.

## 10. Obsługa błędów

- Niedostępne obrazy/asset: ustaw `loading="lazy"`, `decoding="async"`, tło gradientowe na wypadek błędu.
- Brak JS: menu mobilne działa w trybie no-JS dzięki `<details>` fallback (progressive enhancement) lub default „menu zawsze widoczne”.
- Błąd nawigacji (np. brak strony auth) → link `<a>` i SSR generują 404, które powinna obsłużyć globalna strona błędu; w planie dodać QA check.
- Hooki klienckie opakować w guard `if (typeof window === 'undefined') return;`.
- Motyw: jeśli `localStorage` niedostępny (np. tryb prywatny) lub `matchMedia` nieobsługiwane, fallback do jasnego motywu i logowanie ostrzeżenia w dev. W razie błędu w hooku – przechwycić i ustawić `theme="light"` bez crashu UI.

## 11. Kroki implementacji

1. Utwórz plik `src/types/ui/landing.ts` i zdefiniuj wszystkie view modele oraz funkcję `getLandingContent()` zwracającą dane zgodne z PRD.
2. Dodaj do `Layout.astro` inline skrypt `themeBootstrapScript`, który odczyta preferencje (`localStorage`, `prefers-color-scheme`) i ustawi klasę `.dark` przed wyrenderowaniem treści; zarejestruj helpery `window.__applyTheme` i `window.__setPreferredTheme`.
3. Zbuduj komponent `ThemeToggle` (React wyspa lub mały Astro + inline JS) korzystający z hooka `useThemePreference`; umieść go w `PublicHeader`.
4. Zbuduj komponent `PublicHeader` (Astro + React wyspa dla menu mobilnego i `ThemeToggle`) z semantycznym `nav`, skip linkiem i CTA.
5. Utwórz `HeroSection.astro` wykorzystujący `HeroContent`; zadbaj o obraz przez `astro:assets` i Tailwind utilities.
6. Zaimplementuj `BenefitList.astro` renderujący dane `BenefitItem[]` jako responsywną siatkę z ikonami (np. shadcn `Icons`).
7. Stwórz wielokrotnego użytku `FeatureSplitSection.astro` i użyj go trzykrotnie z różnymi danymi (AI tematy, dashboard, LeetCode/streak).
8. Dodaj `CredibilityStrip.astro` z listą `MetricItem[]` (można wykorzystać streak & adoption metrics z PRD sekcji 6).
9. Przygotuj `CTABanner.astro` z powtórzeniem CTA oraz gradientowym tłem o wysokim kontraście.
10. Zbuduj `FooterLegal.astro` z linkami do polityk oraz informacją o prawach autorskich.
11. Scal komponenty w `src/pages/index.astro`, importując `landingContent` i przekazując propsy, ustaw landmarki (`<header>`, `<main id="main-content">`, `<footer>`).
12. Dodaj custom hooki (`useMobileMenu`, `usePrefersReducedMotion`, `useThemePreference`) w `src/components/hooks/` i podepnij do odpowiednich komponentów.
13. Zapewnij testy motywu: sprawdź, czy `ThemeToggle` przełącza klasę `.dark`, preferencja utrzymuje się po odświeżeniu i reaguje na zmianę systemowego motywu.
14. Przetestuj responsywność (sm/md/lg), nawigację klawiaturą, kontrast oraz poprawność linków; uruchom `npm run lint` i `npm run format`.
