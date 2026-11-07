# LONGWAVE — alternatywna strona główna
Niezależny prototyp, oparty na briefie LONGWAVE 2.0. Dotychczasowy podgląd pozostaje bez zmian.

## Podgląd
https://brand-designer-pl.github.io/longwave-website-alternative/

Uruchom: `python3 -m http.server 4187 --directory dist`.
Strona nie wymaga bundlera. GSAP 3.15.0 + ScrollTrigger są lokalne; font Manrope i fotografie WebP również. Licencje GSAP: https://gsap.com/standard-license/; Manrope: SIL OFL.

## Zakres
10 sekcji: hero, wybór przygody, najbliższe terminy, wartości, Home Spot, projekty marki, ludzie/opinie, aplikacja/Club, FAQ/kontakt, CTA i stopka. Statyczne zdjęcia i normalny scroll, animacje wejścia/wyjścia oraz paralaksa. Menu mobilne jest natywnym dialogiem; reduced motion wyłącza animacje.

## Oferta
`tools/sync-offers.py` pobiera wyłącznie publiczny katalog https://app.longwaveboards.com/api/offers i zdjęcia ofert. Generuje odfiltrowane dane oraz HTML trzech najbliższych turnusów (także bez JS). Ceny w API są w groszach, warianty prezentowane od najniższej ceny. Front filtruje terminy według kategorii.
GitHub Actions odświeża katalog przy publikacji i co godzinę (harmonogram GitHub może być opóźniony). To cache, nie pobranie live w każdej przeglądarce: API aplikacji nie udostępnia CORS dla GitHub Pages. Po 24 h JS ukrywa nieaktualną cenę/dostępność. Błąd synchronizacji zatrzymuje publikację i zachowuje ostatnią działającą wersję. Przed zapisem cenę i dostępność potwierdza aplikacja.
Karty prowadzą do katalogu aplikacji; nie wymyślamy nieobsługiwanych linków do konkretnych turnusów. Konto tworzy się w aplikacji. Home Spot prowadzi do istniejącej strony rezerwacyjnej. To prototyp homepage, nie wdrożenie WordPress ani nowe podstrony.

## Weryfikacja 2026-11-07
Chrome desktop i emulacja iPhone 13: 10 sekcji, brak błędów JS/poziomego overflow, 3 karty, filtr rodzinny 1 karta, menu otwiera/zamyka się. GSAP 3.15.0. Test fizycznego iPhone pozostaje do wykonania. Próba recenzji Claude nie powiodła się: CLI niezalogowane.

## Aktualizacja ruchu i hero — 2026-11-07
Wejście, faza czytelna i wyjście elementów są jedną osią GSAP scrub (bez konkurujących transformacji). Działa w obie strony, również mobile. Panele fotograficzne rozszerzają się podczas wejścia. Nie blokujemy scrolla.
Hero: fragment filmu klienta `1920x1080_Longwave_baza_dron.mp4`, pętla 9,4 s z przenikaniem 0,6 s, H.264 bez dźwięku. Desktop 1280 px / 4,1 MB, mobile 720 px / 1,5 MB, poster WebP 81 KB. Wstrzymanie poza ekranem i przy ukrytej karcie. Autoplay wyciszony inline; przy blokadzie systemu pozostaje poster i ponowienie przy zwykłym dotknięciu. Reduced motion zachowuje statyczny kadr. Oznaczenia „Wstrzymaj tło” i „Blisko wody. Bliżej siebie.” usunięte na życzenie użytkownika.
Test Chrome desktop i emulacja iPhone 13: autoplay działa, wejście/środek/wyjście mają opacity 0/1/0 także przy powrocie; film pauzuje poza hero; reduced motion usuwa triggery i pokazuje treść. Brak błędów JS i overflow. Recenzja Claude nadal niedostępna (brak logowania). Fizyczny iPhone nietestowany.

## Optymalizacja telefonu — 2026-11-07
Mobile do 767 px: jeden IntersectionObserver uruchamia krótkie, wielokrotnie używane animacje GSAP opacity/translate zamiast ciągłego scrub dla wszystkich elementów. Powroty zachowane; wyłączona dekoracyjna paralaksa i zmiana promienia dużych paneli. Szkło kart jest lekkim półprzezroczystym gradientem; menu nadal ma prawdziwy blur 12 px. Film pionowy 360×640, ok. 1 MB; pauzuje również pod otwartym menu. Po udanym autoplay usuwany listener ponawiania przy dotyku.
Pomiar lokalny Chrome, emulacja iPhone 13, CPU 4× wolniej, ta sama 12-sekundowa trasa scrolla w dół i z powrotem: TaskDuration 3,483 → 2,399 s (−31%), ScriptDuration 0,743 → 0,357 s; aktywne ScrollTriggers 52 → 1; elementy z backdrop-filter 26 → 7 (wlicza ukryte menu desktop). p95 interwałów rAF 16,8 → 16,7 ms. To pomiar laboratoryjny, nie dowód płynności na fizycznym iPhonie.
Kontrole: desktop bez zmian ruchu; mobile autoplay, pauza poza hero, menu i kotwice, reduced motion (0 triggerów i widoczne treści), brak overflow. Claude review niedostępne: CLI niezalogowane.

### Wygładzenie wejść — 2026-11-07
Po uwadze o odczuwalnym szarpaniu zastąpiono mobilny IntersectionObserver stabilnymi progami ScrollTrigger (callbacki, bez scrub). Ruch i opacity mają wspólny czas 0,75 s i easing power2.inOut; przesunięcie wejścia 20 px. Wielokrotnie używane quickTo pozostają, bez tworzenia animacji na każdą klatkę. Desktop: mniejsze przesunięcie i łagodniejsze wygładzanie scrub. Zachowane wcześniejsze odchudzenie szkła i filmu.
Ta sama emulowana trasa 12 s / CPU 4×: TaskDuration 1,710 s, ScriptDuration 0,241 s, p95 rAF 16,7 ms, 0 odstępów ponad 32 ms; 47 triggerów callbackowych. Pojedynczy pomiar laboratoryjny, wyniki zależą od środowiska. Sprawdzone wejście/wyjście i powrót, pauza filmu poza hero oraz reduced motion (0 triggerów i widoczna treść).
