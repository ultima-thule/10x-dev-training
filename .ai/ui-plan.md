# Architektura UI dla Development Refresher Training

## 1. Przegląd struktury UI

Interfejs składa się z dwóch warstw: publicznej (landing, autoryzacja) oraz chronionej (dashboard, tematy, profil). Po zalogowaniu użytkownik trafia do aplikacji jednosesyjnej z trzema głównymi zakładkami (Dashboard, Tematy, Profil), wspólnym formularzem generowania tematów oraz dedykowanym widokiem szczegółów tematu. Całość korzysta z SSR Astro + interaktywnych wysp React, globalnego cache zapytań oraz wspólnych wzorców stanów (loading, empty, error). Route guard wymusza posiadanie ukończonego profilu przed dopuszczeniem do widoków domenowych, a wszystkie żądania API wymagają nagłówka `Authorization: Bearer {access_token}`.

## 2. Lista widoków

- **Nazwa widoku**: Landing (publiczny)  
  **Ścieżka**: `/`  
  **Główny cel**: Zaprezentować wartość produktu i skierować użytkownika do rejestracji/logowania (US-001).  
  **Kluczowe informacje**: hero z opisem, lista korzyści, CTA „Zarejestruj się” i „Zaloguj się”, linki do polityk.  
  **Kluczowe komponenty**: hero section, listy ikon, CTA buttons, stopka z linkami prawno-bezpieczeństwowymi.  
  **UX/A11y/Security**: semantyczne landmarki (`header`, `main`, `footer`), wysokie kontrasty, responsywne grafiki z `alt`; linki do polityk otwierane w tym samym oknie, brak prywatnych danych, ograniczona treść dynamiczna.

- **Nazwa widoku**: Logowanie / Rejestracja Supabase  
  **Ścieżka**: `/auth/login`, `/auth/register` (renderowana wyspa Supabase)  
  **Główny cel**: Umożliwić tworzenie i wznawianie kont (US-001, US-002).  
  **Kluczowe informacje**: pola email/hasło, walidacje, komunikaty o błędach, link do resetu hasła.  
  **Kluczowe komponenty**: formularz z kontrolkami, komunikaty błędów, spinner podczas wysyłki, linki nawigacyjne.  
  **UX/A11y/Security**: `label` + `aria-describedby` dla błędów, `type="password"` z opcją podglądu, blokada wielokrotnego submitu, informacje o błędach autoryzacji, bez lokalnego przechowywania haseł.

- **Nazwa widoku**: Ustaw profil (pierwsze logowanie)  
  **Ścieżka**: `/setup-profile` (prerender false)  
  **Główny cel**: Wymusić uzupełnienie profilu (US-004) przed wejściem na dashboard.  
  **Kluczowe informacje**: pola `experience_level` (select), `years_away` (numeric), podsumowanie celu konfiguracji.  
  **Kluczowe komponenty**: formularz z walidacją Zod, CTA „Zapisz i przejdź do dashboardu”, stan błędu/ładowania.  
  **UX/A11y/Security**: autofocus na pierwszym polu, komunikaty inline, `aria-live` dla błędów z `/api/profile`, licznik kroków onboardingowych, wyszarzanie CTA dopóki pola niepoprawne, token użyty tylko w nagłówku żądania.

- **Nazwa widoku**: Dashboard  
  **Ścieżka**: `/app/dashboard` (domyślny po zalogowaniu)  
  **Główny cel**: Zaprezentować postępy (US-010) i CTA do działań krytycznych (generowanie tematów).  
  **Kluczowe informacje**: sekcja profilu (experience level, years away, streak), karty statusów tematów (`to_do`, `in_progress`, `completed`), rozkład po technologiach, lista ostatnich aktywności, CTA „Wygeneruj tematy”.  
  **Kluczowe komponenty**: karty metryk, wykres słupkowy/stacked list, timeline aktywności, button generowania, skeletony podczas `GET /api/dashboard/stats`.  
  **UX/A11y/Security**: mobile-first kolumny (stack), `aria-live="polite"` dla aktualizacji streak, puste stany zachęcające do konfiguracji/generowania, powiązanie z `/api/dashboard/stats` i `/api/profile`; brak danych osobowych poza profilem.

- **Nazwa widoku**: Tematy (lista)  
  **Ścieżka**: `/app/topics`  
  **Główny cel**: Zarządzać hierarchią tematów (US-005, US-006, US-007, US-008).  
  **Kluczowe informacje**: grupowanie po technologii (akordeony), filtry statusu, licznik dzieci, skrócone opisy, ikony statusów, szybkie akcje (zmiana statusu, delete).  
  **Kluczowe komponenty**: akordeony (Shadcn) sterowane danymi z `GET /api/topics` + `status/technology` query, selektory statusów, badge z liczbą dzieci, menu kontekstowe, CTA „Szczegóły” i „Usuń”, button generowania.  
  **UX/A11y/Security**: klawiszowe sterowanie akordeonem, `aria-expanded`, `aria-controls`, loading skeletony, empty states per technologia/status, potwierdzenie usuwania (modal) z opisem kaskady, optimistic UI z rollback w razie błędu, trzymanie ID w data-atrybutach (nie w DOM tekstowym), weryfikacja RLS po stronie API.

- **Nazwa widoku**: Szczegóły tematu  
  **Ścieżka**: `/app/topics/:id`  
  **Główny cel**: Pokazać pełen kontekst tematu i umożliwić działania CRUD (US-006–US-009).  
  **Kluczowe informacje**: tytuł, status (select), technologia, opis, lista LeetCode links (`target="_blank"`), dzieci (lista linków), historia zmian.  
  **Kluczowe komponenty**: nagłówek z akcjami (status, edit, delete), sekcje `Practice Problems`, `Sub-topics`, `Metadata`, breadcrumbs/Back button.  
  **UX/A11y/Security**: hierarchia nagłówków (`h1/h2`), linki LeetCode z `rel="noopener noreferrer"`, informacja o kaskadzie przy usuwaniu, fallback na `GET /api/topics/:id/children` z spinnerem, sygnalizacja statusu w `aria-live`, walidacja linków.

- **Nazwa widoku**: Profil (edycja)  
  **Ścieżka**: `/app/profile`  
  **Główny cel**: Aktualizować profil i przeglądać streak (US-004 kontynuacja).  
  **Kluczowe informacje**: aktualne pola profilu, activity streak, log ostatnich zmian.  
  **Kluczowe komponenty**: formularz (select + numeric input), karty podsumowań, CTA „Zapisz”, sekcja „Historia aktywności”.  
  **UX/A11y/Security**: te same wzorce walidacji co onboarding, disable submit, success toast, ostrzeżenie dobrowolne o wpływie zmian na rekomendacje; wrażliwe dane chronione w pamięci (bez localStorage).

- **Nazwa widoku**: Formularz generowania tematów (modal/slide-over współdzielony)  
  **Ścieżka**: komponent wywoływany przyciskami w `/app/dashboard` i `/app/topics`  
  **Główny cel**: Wysyłać żądania `/api/topics/generate` (US-005).  
  **Kluczowe informacje**: selektor technologii z autosugestią, opcjonalny parent topic (dropdown z `GET /api/topics?parent_id=null`), status API (sukces, rate limit), liczba wygenerowanych tematów.  
  **Kluczowe komponenty**: modal dialog, form controls, progress indicator, success summary.  
  **UX/A11y/Security**: focus trap, `aria-modal`, `aria-labelledby`, blokada wielokrotnego submitu, obsługa kodów błędów (VALIDATION_ERROR inline, RATE_LIMIT toast z `retry_after`), zamykanie poprzez ESC i przycisk „Anuluj”.

- **Nazwa widoku**: Globalne stany i komunikaty  
  **Ścieżka**: komponent globalny (toast center + bannery)  
  **Główny cel**: Zapewnić spójne komunikaty loading/error/empty w całej aplikacji.  
  **Kluczowe informacje**: skeletony, bannery 401/403/500, offline indicator, empty states.  
  **Kluczowe komponenty**: `Skeleton`, `Alert`, `Toast`, `EmptyStateCard`, `RetryButton`.  
  **UX/A11y/Security**: `role="status"`/`role="alert"`, `aria-live`, CTA retry ponawiające ostatnie zapytanie, ukrywanie danych w komunikatach, maskowanie technicznych błędów.

## 3. Mapa podróży użytkownika

1. **Landing → Autoryzacja**: użytkownik klika CTA i trafia do formularza Supabase.
2. **Autoryzacja → Ustaw profil**: po udanym logowaniu aplikacja sprawdza `/api/profile`; jeśli 404, kieruje do `/setup-profile`.
3. **Ustaw profil → Dashboard**: zapis formularza (POST `/api/profile`) przekierowuje na dashboard i odświeża `/api/dashboard/stats`.
4. **Dashboard → Generator → Tematy**: użytkownik wybiera technologię, wysyła POST `/api/topics/generate`, otrzymuje potwierdzenie i jest przekierowywany (lub otrzymuje link) do `/app/topics`.
5. **Tematy → Szczegóły / Inline akcje**: w liście zmienia status (PATCH `/api/topics/:id`) lub przechodzi do szczegółów, gdzie może dokończyć zadania, otworzyć linki LeetCode (US-009), edytować lub usunąć temat (DELETE).
6. **Profil**: z nawigacji przechodzi do `/app/profile`, aktualizuje dane (PATCH `/api/profile`), obserwuje wpływ na rekomendacje.
7. **Wylogowanie**: globalne menu umożliwia POST `/auth/v1/logout`, po czym użytkownik wraca na landing.

Przypadki alternatywne: brak tematów na dashboardzie (empty state → CTA do generatora), błędy API (bannery + retry), utrata sesji (banner auth + redirect).

## 4. Układ i struktura nawigacji

- **Główna nawigacja prywatna**: trzy zakładki (Dashboard, Tematy, Profil). Desktop: top bar z logo, zakładkami i avatar menu. Mobile: bottom nav z ikonami i etykietami; centralny FAB otwiera generator tematów.
- **Wtórna nawigacja**: breadcrumbs w widoku szczegółów (`Tematy > [Tytuł]`); w profilach link do logów aktywności; link „Powrót” w modalu generatora.
- **Route guards**:
  - `/app/*` wymaga aktywnej sesji Supabase.
  - `/app/dashboard`, `/app/topics`, `/app/profile` wymagają posiadania profilu (`GET /api/profile` ≠ 404).
  - `/app/topics/:id` dodatkowo waliduje, że temat należy do użytkownika (błąd 404 pokazuje ekran „Nie znaleziono / brak dostępu”).
- **Publiczna nawigacja**: landing + auth posiadają uproszczone menu (logo, linki do dokumentów).
- **Stany responsywne**: mobile-first (stacked content), na większych ekranach siatka (dashboard) i dwukolumnowe layouty (tematy: lista + panel filtrów).

## 5. Kluczowe komponenty

- **`TopNav` / `BottomNav`**: wspólna nawigacja z obsługą aktywnego stanu, token logout, responsywne warianty.
- **`RouteGuard`**: komponent SSR sprawdzający kontekst Supabase i profil; przekierowuje do `/auth/login` lub `/setup-profile`.
- **`StatsCard`**: karta metryk (tytuł, wartość, trend) używana w dashboardzie i ewentualnie w profilu.
- **`TopicsAccordion`**: grupuje tematy po technologii, zarządza stanem otwarcia, pobiera dzieci on-demand (`GET /api/topics/:id/children`).
- **`StatusBadge` + `StatusSelect`**: reprezentacja i zmiana statusu tematu (kolory spójne z legendą).
- **`TopicActionMenu`**: menu kontekstowe (edit, delete, view details) z potwierdzeniem usunięcia; używane w liście i szczegółach.
- **`LeetCodeLinks`**: lista linków z walidacją URL, ikoną poziomu trudności, otwieraniem w nowej karcie.
- **`ProfileForm`**: formularz z select/number input, walidacjami i obsługą błędów API; reużyty w onboarding i widoku profilu.
- **`GenerateTopicsModal`**: modal z formularzem, loaderem i wynikami; centralizuje logikę generowania oraz obsługę kodów błędów.
- **`FeedbackLayer`**: skeletony, empty states, toasty, alerty; parametryzowany kodem błędu (AUTHENTICATION_ERROR, RATE_LIMIT_EXCEEDED, itp.).
