<conversation_summary>
<decisions>
Po zalogowaniu głównym widokiem aplikacji będzie pojedynczy dashboard oparty na danych z /api/dashboard/stats, z dodatkowymi widokami „Tematy” i „Profil” dostępnymi z nawigacji.
Hierarchia tematów będzie prezentowana w widoku „Tematy” za pomocą akordeonów (zamiast drzewa), z możliwością rozwijania/zamykania sekcji.
Pierwsza konfiguracja profilu po rejestracji będzie realizowana jako pełnoekranowy widok „Ustaw profil”, po którego ukończeniu użytkownik trafi na dashboard.
Statusy tematów (to_do, in_progress, completed) będą zmieniane zarówno inline w liście tematów, jak i z poziomu widoku szczegółów tematu, z użyciem PATCH /api/topics/:id.
Nawigacja globalna będzie zawierać trzy główne sekcje („Dashboard”, „Tematy”, „Profil”) i będzie zrealizowana jako górny pasek na desktopie oraz dolny pasek nawigacyjny z ikonami na mobile.
Widok „Tematy” będzie grupował tematy według technologii (akordeony na poziomie technologii), z filtrami po statusie wewnątrz każdej sekcji.
Szczegóły pojedynczego tematu będą prezentowane na osobnej stronie „Szczegóły tematu” (oddzielny URL), otwieranej z listy tematów.
Dla dashboardu i list tematów zostaną zaprojektowane spójne „empty states” (np. CTA „Ustaw profil”, „Wygeneruj pierwsze tematy”, komunikaty o braku wyników po filtrowaniu).
Akcja generowania tematów przez AI będzie dostępna zarówno z dashboardu, jak i z widoku „Tematy”, używając wspólnego formularza wywołującego /api/topics/generate.
Operacje dłużej trwające (np. generowanie tematów, ładowanie list) będą sygnalizowane skeletonami, loaderami i blokadą wielokrotnego kliknięcia przycisków.
Wszystkie kluczowe widoki („Dashboard”, „Tematy”, „Profil”) będą implementować standardowy zestaw stanów: loading, success, error, empty, prezentowany w spójny wizualnie sposób.
Dane z API (/api/profile, /api/topics, /api/dashboard/stats) będą trzymane w globalnym cache (np. query client), a stan lokalny ograniczy się do aspektów prezentacyjnych (np. otwarte akordeony, wybrane filtry).
Zostanie wdrożony globalny stan autoryzacji oraz route guards dla chronionych widoków, z przekazywaniem tokena Supabase w nagłówku Authorization: Bearer {access_token} do wszystkich wywołań /api/\*.
Błędy API będą obsługiwane zgodnie z typem: walidacje jako komunikaty inline w formularzach, błędy autoryzacji jako globalne bannery i przekierowanie do logowania, RATE_LIMIT_EXCEEDED jako toast/banner z informacją o czasie ponowienia, a błędy serwera jako ogólny alert z opcją retry.
UI będzie projektowany w podejściu mobile-first, z prostszą nawigacją w głąb na małych ekranach (np. lista → szczegóły) i bogatszym layoutem (np. kolumny, akordeony) na desktopie.
Aplikacja będzie celować w WCAG 2.1 AA, wykorzystując semantyczne HTML, role ARIA, poprawne zarządzanie focusem oraz pełną obsługę klawiaturą.
Użyty zostanie spójny system designu zbudowany na Tailwind CSS oraz komponentach Shadcn/ui (button, input, select, card, alert, badge, dialog, itp.).
Proste operacje na tematach (np. zmiana statusu, edycja tytułu, usunięcie) będą korzystały z optymistycznych aktualizacji po stronie klienta, z późniejszą synchronizacją z API.
Będzie wdrożona zunifikowana obsługa błędów w oparciu o standardowy format błędów API (kody typu VALIDATION_ERROR, AUTHENTICATION_ERROR, RATE_LIMIT_EXCEEDED, itp.).
Od MVP zostanie zastosowana konserwatywna polityka Content Security Policy (CSP), ograniczająca źródła skryptów i dopuszczająca tylko niezbędne domeny (w tym LeetCode, jeśli konieczne).
</decisions>
<matched_recommendations>
Dashboard jako główny widok + osobne „Tematy” i „Profil”
Dopasowane: decyzja o centralnym dashboardzie z /api/dashboard/stats i dedykowanych widokach do zarządzania tematami oraz profilem.
Widok tematów z akordeonami opartymi o /api/topics i /api/topics/:id/children
Dopasowane: pierwotne drzewo zostało zaadaptowane do akordeonów grupowanych po technologii, z możliwością eksploracji hierarchii.
Pełnoekranowa konfiguracja profilu po rejestracji
Dopasowane: widok „Ustaw profil” korzystający z /api/profile (POST/GET), jako krok wymagany przed wejściem na dashboard i generowaniem tematów.
Inline zmiana statusu tematów i widok szczegółów tematu
Dopasowane: możliwość szybkiego aktualizowania statusu na liście oraz pełny widok tematu (opis, linki LeetCode) oparty o /api/topics/:id.
Globalna nawigacja desktop/mobile
Dopasowane: prosty top-bar na desktopie oraz bottom navigation na mobile z trzema głównymi sekcjami.
Empty states i stany widoków (loading/success/error/empty)
Dopasowane: spójne wzorce dla dashboardu, list tematów i widoku profilu, z skeletonami, alertami i dedykowanymi komunikatami.
Globalny cache danych + lokalny stan prezentacyjny
Dopasowane: użycie warstwy query/caching dla danych API i ograniczenie lokalnego stanu do prezentacji (np. akordeony, filtry).
Autoryzacja i zarządzanie sesją w UI
Dopasowane: globalny „auth store”, route guards oraz przekazywanie tokena w nagłówku Authorization do wszystkich endpointów /api.
Spójny system obsługi błędów API
Dopasowane: mapowanie kodów błędów (VALIDATION_ERROR, AUTHENTICATION_ERROR, RATE_LIMIT_EXCEEDED, itp.) na konkretne zachowania UI (inline errors, bannery, toasty, redirect).
Mobile-first, dostępność i WCAG 2.1 AA
Dopasowane: projektowanie od najmniejszych ekranów, pełna obsługa klawiatury, semantyczne HTML, ARIA, odpowiednie kontrasty i fokus.
Design system oparty na Tailwind + Shadcn/ui
Dopasowane: wykorzystanie gotowych, dostępnych komponentów z Shadcn/ui w połączeniu z Tailwind do zachowania spójności i szybkości developmentu.
Optymistyczne aktualizacje i background refresh
Dopasowane: zmiany statusów i operacje CRUD na tematach z natychmiastowym odzwierciedleniem w UI i późniejszą weryfikacją z API.
CSP i bezpieczeństwo frontendu
Dopasowane: od początku wprowadzenie CSP ograniczającej XSS, z dopuszczeniem tylko koniecznych źródeł (np. LeetCode dla linków/przekierowań).
</matched_recommendations>
<ui_architecture_planning_summary>
a. Główne wymagania dotyczące architektury UI
UI musi wspierać kluczowe funkcje z PRD: rejestracja/logowanie, konfiguracja profilu, generowanie tematów przez AI, zarządzanie hierarchicznymi tematami, śledzenie postępów i integrację z LeetCode.
Interfejs ma być oparty na stacku Astro + React + TypeScript + Tailwind + Shadcn/ui, z dobrą wydajnością (SSR, lekkie interaktywne wyspy) i łatwą integracją z Supabase i API aplikacji.
Architektura UI powinna być prostą, ale skalowalną podstawą do dalszego rozwoju (gamifikacja, rozbudowane dashboardy, dodatkowe zasoby).
b. Kluczowe widoki, ekrany i przepływy użytkownika
Widok publiczny / landing (poza zakresem planowania, ale tło dla flow): CTA do rejestracji/logowania.
Rejestracja i logowanie: korzystają z Supabase Auth, po udanym logowaniu użytkownik kierowany do logiki „pierwsze logowanie” vs. „powrót”.
Pierwsza konfiguracja profilu: pełnoekranowy widok „Ustaw profil” (GET/POST /api/profile), z walidacją danych (experience_level, years_away); po zapisaniu – przekierowanie na dashboard.
Dashboard (widok po zalogowaniu):
Pobiera dane z /api/dashboard/stats i /api/profile.
Prezentuje kluczowe metryki (liczba tematów w statusach, streak, rozkład po technologiach, ostatnia aktywność).
Zawiera CTA do wygenerowania tematów (/api/topics/generate) i do przejścia do „Tematów”/„Profilu”.
Obsługuje stany loading, empty (np. brak profilu/tematów), error.
Widok „Tematy”:
Korzysta z /api/topics i /api/topics/:id/children.
Tematy są grupowane według technologii jako akordeony; wewnątrz widoczne są tematy z informacjami o statusie, liczbie dzieci i ew. skróconym opisie.
Użytkownik może:
filtrować po statusie,
zmieniać status inline (select/ikony → PATCH /api/topics/:id),
przejść do szczegółów tematu,
kasować tematy (DELETE /api/topics/:id),
wywołać generowanie tematów (przycisk „Wygeneruj tematy”).
Widok ma spójne stany: loading, empty (np. brak tematów dla danej technologii/statusu), error.
Widok „Szczegóły tematu”:
Bazuje na /api/topics/:id i ewentualnie /api/topics/:id/children.
Prezentuje pełny opis, bieżący status, technologię, listę linków LeetCode, ewentualne dzieci (np. jako listę z linkami/skrótami).
Umożliwia zmianę statusu, edycję podstawowych pól, usunięcie tematu.
Widok „Profil”:
Używa /api/profile (GET/PATCH).
Pozwala konfigurację/edycję doświadczenia, lat przerwy, ewentualnie aktywnego streaka.
Może zawierać CTA do ponownego generowania tematów dopasowanych do profilu.
Flow generowania tematów:
Uruchamiany z dashboardu lub „Tematów”.
Formularz (np. modal/strona): wybór technologii i ewentualnego parent_id.
Po wysłaniu POST /api/topics/generate – loader, blokada przycisku, obsługa RATE_LIMIT_EXCEEDED i błędów AI.
Po sukcesie – odświeżenie listy tematów i dashboardu (background refresh) oraz informacja o liczbie wygenerowanych tematów.
c. Strategia integracji z API i zarządzania stanem
Warstwa danych:
Wszystkie dane domenowe (profil, tematy, statystyki) są pobierane przez REST API (/api/profile, /api/topics, /api/topics/:id, /api/topics/:id/children, /api/topics/generate, /api/dashboard/stats).
Po stronie klienta implementowany jest mechanizm cache (np. query client) zapewniający:
automatyczne odświeżanie po modyfikacji (invalidate),
globalne zarządzanie stanem loading/error/success,
możliwość retry w razie błędu.
Stan globalny:
Obejmuje:
stan uwierzytelnienia (sesja Supabase, token, informacje o zalogowanym użytkowniku),
cache zapytań API,
ewentualny globalny system powiadomień/toastów.
Stan lokalny:
Dotyczy:
otwarcia/zamknięcia akordeonów,
wybranych filtrów (status, technologia),
lokalnych formularzy (np. generowanie tematów, edycja profilu).
Aktualizacje danych:
Proste operacje (zmiana statusu, tytułu, usunięcie tematu) stosują optymistyczne aktualizacje, natychmiast modyfikując UI i synchronizując się z API; w razie błędu – rollback i komunikat.
Zmiany wpływające na statystyki (np. zmiana statusu na completed) powodują odświeżenie /api/dashboard/stats (np. background refresh).
Obsługa błędów:
Błędy walidacji z API mapowane są bezpośrednio na pola formularzy (np. profil, generowanie tematów).
AUTHENTICATION_ERROR i 401 Unauthorized wywołują globalny komunikat oraz redirect do logowania.
RATE_LIMIT_EXCEEDED przy generowaniu tematów wyświetla toast z informacją o czasie ponowienia (retry_after).
Inne błędy serwera (INTERNAL_ERROR, SERVICE_UNAVAILABLE) są prezentowane jako ogólny alert z opcją ponowienia operacji.
d. Responsywność, dostępność i bezpieczeństwo
Responsywność:
Projekt w podejściu mobile-first, wykorzystujący Tailwind i warianty responsywne (sm, md, lg).
Na mobile:
główna nawigacja jako dolny pasek,
prostsze flow (lista → szczegóły → powrót),
akordeony dopasowane do małych ekranów.
Na desktopie:
top-bar, więcej informacji jednocześnie (np. karty dashboardu, szersza lista tematów),
wygodne filtry i akordeony z większą przestrzenią.
Dostępność (A11y):
Docelowy poziom WCAG 2.1 AA.
Semantyczny HTML (nagłówki, listy, landmarki main, nav).
Prawidłowe role ARIA dla akordeonów, przycisków, dialogów i alertów.
Pełna obsługa klawiaturą (focus states, kolejność tab, skróty nawigacyjne).
Tekstowe komunikaty błędów powiązane z polami (np. aria-describedby).
Bezpieczeństwo:
Uwierzytelnianie: Supabase Auth, token JWT przekazywany w Authorization: Bearer.
Autoryzacja zarówno w bazie (RLS), jak i na poziomie aplikacji (route guards, weryfikacja dostępu do API).
Konserwatywna CSP: blokada inline scripts, dozwolone tylko zaufane domeny (backend, CDN, opcjonalnie LeetCode).
Obsługa błędów bezpieczeństwa (np. wygasła sesja) z jasnymi komunikatami i redirectem do logowania.
e. Nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia
Szczegółowy layout dashboardu: nie ustalono jeszcze dokładnej struktury kart/metryk (które wskaźniki są najważniejsze wizualnie, kolejność, możliwe wykresy/diagramy).
Dokładna prezentacja hierarchii dzieci tematów w akordeonach i widoku szczegółów: do doprecyzowania jest sposób prezentacji wielopoziomowej hierarchii (np. ile poziomów pokazujemy inline, czy dzieci tematów w szczegółach też są akordeonami).
Forma UI dla generowania tematów: czy formularz generowania ma być modalem, osobną stroną, czy komponentem osadzonym inline (obecnie założenie jest otwarte, choć sugerowany jest wspólny formularz).
Zakres gamifikacji w UI: poza streakiem i podstawowymi statystykami nie ustalono szczegółowych rozwiązań wizualnych (odznaki, progres bary, timeline aktywności).
Szczegółowa konfiguracja CSP: konkretne dyrektywy (script-src, connect-src, frame-src) i lista domen wymagają doprecyzowania na etapie wdrożenia.
</ui_architecture_planning_summary>
<unresolved_issues>
Dokładny układ i priorytetyzacja elementów dashboardu (jakie metryki i wizualizacje są kluczowe dla MVP).
Ostateczna forma interfejsu generowania tematów (modal vs. dedykowana strona vs. sekcja inline) oraz jej wpływ na nawigację.
Szczegółowy sposób prezentacji i nawigacji po wielopoziomowych podtematach (zwłaszcza przy głębszej hierarchii niż 1–2 poziomy).
Szczegółowy zakres i formy gamifikacji w UI (np. dodatkowe wskaźniki, odznaki, komunikaty motywacyjne).
Konkretny zestaw reguł CSP (wartości poszczególnych dyrektyw i pełna lista dozwolonych domen zewnętrznych).
</unresolved_issues>
</conversation_summary>
