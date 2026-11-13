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

## Home Spot 2.0 — 09.11.2026

Menu Noclegi i kafelek ze strony głównej prowadzą do zbiorczej strony `/noclegi/`.
Home Spot Jastarnia i Home Spot 2.0 mają osobne karty. Projekt 2.0 ma stałą
ścieżkę `/noclegi/home-spot-2-0/` z opisem i statusem, bez rezerwacji.
Grafika typograficzna zastępuje materiał nowej inwestycji do czasu
otrzymania zdjęć i zatwierdzonego opisu. Podgląd GitHub Pages ma `noindex`.

Pasek i blok po „Wybierz swoją przygodę” pojawiają się od północy
1 grudnia 2026 czasu polskiego. Podgląd wcześniej: dopisz `?premiera=1`
do adresu strony głównej. Po kampanii ustaw `campaignEnabled = false`
w `dist/launch.js` i opublikuj. Strony, menu i stałe karty są częścią
podglądu już teraz. Karta w aplikacji i panel CMS są osobnymi wdrożeniami.

## Wariant inspirowany Amigos Surf

Ścieżka `/amigos/` jest osobnym podglądem w tym samym wdrożeniu GitHub Pages.
Kierunek wykorzystuje pełnoekranowe otwarcie, duże karty zdjęciowe, mozaikę
i prostą typografię z inspiracji [Amigos Surf](https://www.amigossurf.com/).
Źródło zakresu: brief LONGWAVE 2.0, s. 18–29. Zdjęcia i film pochodzą z
istniejących materiałów LONGWAVE. Grafika fali przy Home Spot 2.0 pełni rolę
zapowiedzi do czasu otrzymania materiałów inwestycji.

`/amigos/?premiera=1` pokazuje pasek i blok premierowy przed datą startu.
Obie wersje korzystają z tego samego ustawienia premiery w `dist/launch.js`
oraz tego samego odświeżania katalogu w `tools/sync-offers.py`.

Animacje wariantu `/amigos/` korzystają z lokalnych GSAP i ScrollTrigger
3.15.0. Adaptacja wzorców Premium Web Agent 1.0.0: `hero-reveal`,
`scroll-reveal`, `parallax` i `motion-accessibility`. Efekty wejścia
uruchamiają się raz na blok, paralaksa działa na szerokich ekranach,
a ustawienie ograniczenia ruchu przywraca statyczny układ.

Hero wariantu Amigos wykorzystuje wyciszony fragment 00:48–00:56 z filmu
„Festiwalowe rozpoczęcie sezonu z LONGWAVE” (1120 px na desktopie,
360 × 640 na telefonie). Podczas przewijania powiększa się sam kadr,
a treść hero przesuwa się nad nim. Przejście do Home Spot 2.0 wiąże
ruch grafiki fali z pozycją przewijania bez przypinania sekcji.

Pomiar w Chrome, 390 × 844, CPU 4× wolniej, 10 s przewijania do premiery
i z powrotem: p95 odstępów rAF 16,7 → 16,7 ms, odstępy powyżej 32 ms
0 → 0, TaskDuration 0,123 → 0,232 s. Test laboratoryjny porównuje
poprzedni podgląd publiczny z nowym podglądem lokalnym po starcie filmu.

### Lokalizacje w wariancie Amigos

Katalog `/amigos/wyjazdy/` prowadzi do stron Łazów, Jastarni, Dąbek
i Rodos. W Noclegach są osobne opisy Home Spot Jastarnia i apartamentu
La Mata, obok istniejącej strony Home Spot 2.0. Treści pochodzą z briefu.
Układ nawiązuje do [Amigos Spain](https://www.amigossurf.com/spain).
Terminy i zapisy pozostają w katalogu aplikacji, a warunki noclegów
w ofercie obiektu. Zdjęcia przypisano tam, gdzie miejsce potwierdzają
materiały projektu. Podstrony pozostają podglądem z `noindex`.

### Hero lokalizacji: kontrola mobile — 13.11.2026

Łazy, Jastarnia, Dąbki i Rodos otwierają się przypisanymi relacjami YouTube.
Test przed poprawką potwierdził autostart wszystkich czterech, ale błąd
połączenia z YouTube zasłaniał zdjęcie uszkodzonym iframe, a przycisk
błędnie wskazywał odtwarzanie. Pauza usuwała iframe i restartowała relację.

`dist/amigos/editorial.js` korzysta teraz ze zdarzeń YouTube IFrame API:
wycisza przed startem, pokazuje film dopiero po potwierdzeniu odtwarzania,
zachowuje odtwarzacz/pozycję przy pauzie, wyjściu poza hero i otwarciu menu.
Błąd, blokada autoplay lub brak odpowiedzi przy starcie pozostawiają zdjęcie
i przycisk ponowienia. Reduced motion nie ładuje odtwarzacza automatycznie.
Kadry zastępcze zmieniono na 1280 × 720; CSS zachowuje wypełnienie hero
bez rozciągania filmu. ID filmu i adres kadru edytuje się w `index.html`
danej miejscówki (`data-hero-youtube`, `.location-screen img`).

Kontrole lokalne: Chrome, emulacja iPhone 390 × 844 i Android 360 × 800,
wszystkie cztery lokalizacje: rzeczywisty przyrost czasu odtwarzania bez
kliknięcia, wyciszenie, wypełnienie hero, brak poziomego overflow/błędów JS,
pauza/wznowienie z tej samej pozycji i powrót po przewinięciu. Jastarnia:
menu, poziomy ekran 844 × 390, desktop 1440 × 900, reduced motion z ręcznym
startem, bez JS, blokada API/iframe z ponowieniem po odzyskaniu połączenia,
symulowana odmowa HTMLMediaElement.play (NotAllowedError). Dodatkowa próba
Chrome: CPU 4×, 1,6 Mb/s, 150 ms opóźnienia; autostart Jastarni po ok. 2,9 s.
To pomiar laboratoryjny, nie Core Web Vitals ani test fizycznego telefonu.

Porównano działający mobilny hero https://www.amigossurf.com/spain:
Amigos serwuje osobny pionowy plik 1080 × 1920; tutaj zachowano wskazane
przez właściciela poziome relacje YouTube, przycinane centralnie do hero.
Jakość i krótkie nakładki startowe odtwarzacza zależą od YouTube.
Fizyczny iPhone/Safari i Android nie były dostępne do testu. Recenzja Claude
niedostępna: `claude auth status` zwraca `loggedIn: false`.

### Pionowe montaże mobile — 13.11.2026

Gotowy jest **Rodos**: osobna pętla 9:16, 540 × 960 / 24 fps, ok. 7,7 s
(ok. 1,3 MB), H.264 bez ścieżki audio, z nagłówkiem MP4 faststart.
Sześć wybranych ujęć z relacji klienta pokazuje uczestnika na plaży,
wybrzeże, uśmiechniętą uczestniczkę w wodzie, wingfoil i zachód słońca.
Każde ujęcie ma własny obszar kadrowania; ujęcie twarzy ma ruch kadru.
Eksport jest celowo krótki i lekko zwolniony do tempa 0,8×.

Na telefonach i urządzeniach dotykowych Rodos używa lokalnego MP4 i WebP,
bez pobierania odtwarzacza YouTube. Szeroki desktop zachowuje dotychczasową
relację. Autostart jest wyciszony i inline, z pauzą poza ekranem, w tle
oraz pod menu. Reduced motion pozostawia zdjęcie i możliwość ręcznego
startu; awaria pliku pokazuje kadr i przycisk ponowienia.

Pliki do edycji: `sources/hero-mobile/edits.json` (czasy, obszary kadrowania,
prędkość i źródło), `tools/render-mobile-heroes.py` (eksport z FFmpeg),
`dist/amigos/wyjazdy/rodos/hero-mobile.mp4` oraz `hero-mobile.webp`.
Oryginał `sources/hero-mobile/rodos-source.mp4` pozostaje lokalnie i jest
wykluczony z Git; manifest zawiera jego SHA-256 oraz publiczny adres źródła.
Render: `python3 tools/render-mobile-heroes.py rodos --ffmpeg /ścieżka/ffmpeg`.

**Łazy, Jastarnia i Dąbki czekają na pliki źródłowe od klienta**, zgodnie
z odpowiedzią właściciela z 13.11.2026. Pobranie ich z YouTube wymagało
zalogowania. Nie zastępowano tych relacji innymi materiałami. Po otrzymaniu
plików należy dobrać ujęcia i kadry, dopisać trzy montaże do tego samego
manifestu, dodać lokalne pliki do hero i powtórzyć test mobilny.

Testy lokalne Chrome: emulacja iPhone 390 × 844 i Android 360 × 800,
autostart, rozmiar dekodowanego filmu 540 × 960, wyciszenie, pętla,
pauza/wznowienie, menu, przewijanie, reduced motion z ręcznym startem,
błąd pobierania z ponowieniem oraz przełączanie mobile/desktop.
Brak żądań do YouTube na mobile Rodos, brak poziomego overflow i błędów JS.
Warianty pozostałych trzech miejscówek nadal odtwarzają YouTube.
Próba CPU 4× / 1,6 Mb/s / opóźnienie 150 ms: start Rodos po ok. 1,9 s.
Potwierdzono przyrost licznika dekodowanych klatek i zmiany ujęć w trakcie
odtwarzania. To testy laboratoryjne Chrome, bez fizycznego telefonu/Safari.
Recenzja Claude niedostępna: CLI pozostaje niezalogowane.
