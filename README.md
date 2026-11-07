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
