# Longwave — alternatywna strona

Folder roboczy: bieżący katalog. Statyczny HTML/CSS/JS w `dist/amigos/`.
Repozytorium: Brand-designer-pl/longwave-website-alternative, gałąź main.
Podgląd: https://brand-designer-pl.github.io/longwave-website-alternative/amigos/
Premiera Home Spot 2.0: dodaj `?premiera=1` do adresu strony głównej.

## Stan 16.11.2026

Wdrożone w kodzie: pełnoekranowe menu z fotografią, kompaktowa mleczna belka,
wyśrodkowane logo, uporządkowane hero, nowe karty Świata LONGWAVE i różne tła
kolejnych sekcji. Ostatni zakres: mobilna karuzela najbliższych ofert z fragmentem
następnej karty, strzałkami i natywnym gestem; zaokrąglenia galerii 28/22 px;
autorskie fala/słońce/deska, SVG + Lottie sterowane przez GSAP ScrollTrigger.
Weryfikacja oraz źródła inspiracji w końcowej części README.md.

Pliki ostatniej zmiany: `dist/amigos/index.html`, `editorial.css`,
`home-details.js`, `art/`, `dist/vendor/lottie*`, `tools/build-surf-marks.py`.
Katalog ofert odświeża `tools/sync-offers.py` w GitHub Actions; nie edytuj
ręcznie danych wewnątrz OFFERS_START/END. Kontrolki są poza tym zakresem.

Testy laboratoryjne przeszły; bez fizycznego iPhone/Safari. Claude CLI nie jest
zalogowane, więc niezależna recenzja tego modelu pozostaje niedostępna.
Przed deklaracją publikacji sprawdź najnowszy workflow Pages i publiczny adres.

## Ostatnia zmiana: opinie

Właściciel wybrał na teraz 7 rekomendacji z karuzeli longwaveboards.com.
Sekcja #opinie: dwa rzędy GSAP w przeciwnych kierunkach, wygaszanie krawędzi,
pauza i pełna statyczna lista. Źródło podpisane; to nie jest integracja Google.
Dane: sources/reviews.json; generator: tools/build-reviews.py; kod:
dist/amigos/reviews.js. Kontrole i ograniczenia w końcowej części README.

## Dalej

Kolejne korekty wizualne według właściciela. Oryginalne filmy Łazy/Jastarnia/Dąbki
na pionowe montaże nadal czekają na klienta; nie utożsamiaj tego z ukończoną
karuzelą. Rodos ma pionowy materiał. Nie zmieniaj aplikacji ani hostingu w ramach
prac nad stroną. `sources/references/` i `zadania/` zawierają lokalne materiały
oraz statusy — nie dodawaj ich automatycznie do publikacji.
