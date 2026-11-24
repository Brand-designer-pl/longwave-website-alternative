"""Render owner-supplied photos without altering offers or reservation status."""
from pathlib import Path
from html import escape as E
import json,re
ROOT=Path(__file__).resolve().parents[1]
LIB=json.loads((ROOT/'sources/photo-library.json').read_text())

def image(key,prefix,sizes='(max-width: 700px) 92vw, 45vw',lazy=True):
 p=LIB[key]
 return f'<img src="{prefix}{p["src"]}" srcset="{prefix}{p["small"]} {p["smallWidth"]}w, {prefix}{p["src"]} {p["width"]}w" sizes="{sizes}" width="{p["width"]}" height="{p["height"]}" alt="{E(p["alt"],quote=True)}" loading="{"lazy" if lazy else "eager"}" decoding="async">'

GALLERIES={
 'wyjazdy/lazy':('Tu odpoczywamy.','Zakwaterowanie · Łazy',['lazy-domki','lazy-salon','lazy-sypialnia']),
 'wyjazdy/jastarnia':('Blisko wody. Blisko siebie.','Zakwaterowanie · Jastarnia',['jastarnia-domek','jastarnia-kuchnia','jastarnia-pokoj']),
 'wyjazdy/dabki':('Po dniu pełnym wrażeń.','Zakwaterowanie · Dąbki',['dabki-domki','dabki-pokoj','dabki-wnetrze']),
 'wyjazdy/rodos':('Chwila wytchnienia.','Zakwaterowanie · Rodos',['rodos-basen','rodos-pokoj','rodos-taras']),
 'noclegi/home-spot-jastarnia':('Rozgość się w Home Spocie.','Jastarnia · Domki i wspólna przestrzeń',['jastarnia-domek','jastarnia-kuchnia','jastarnia-pokoj']),
 'noclegi/home-spot-2-0':('Tak wyobrażamy sobie nowy spot.','Home Spot 2.0 · Wizualizacje projektu',['home-spot-2-front','home-spot-2-lounge','home-spot-2-aerial']),
 'wyjazdy/zagraniczne':('Chorwacja. Nowy kierunek.','Zapowiedź · Na katamaranie',['chorwacja-katamaran','chorwacja-poklad','chorwacja-kabina']),
 'wyjazdy/obozy-dla-dzieci':('Tak wygląda obozowy dzień.','Kadry z LONGWAVE CAMP · Łazy',['lazy-grupa','lazy-longboard','lazy-ruch'])}

def gallery(route):
 title,kicker,keys=GALLERIES[route];prefix='../'*(len(route.split('/'))+1)+'assets/'
 project=route.endswith('home-spot-2-0');croatia=route.endswith('zagraniczne')
 note='Wizualizacje przedstawiają koncepcję projektu, a nie zdjęcia gotowego obiektu. Szczegóły miejsca i rezerwacji ogłosimy po ich potwierdzeniu.' if project else 'Przygotowujemy nowy kierunek. O szczegóły i planowane terminy zapytaj nas bezpośrednio.' if croatia else 'Szczegóły zakwaterowania i dostępne warianty pobytu sprawdź w opisie wybranego terminu.'
 figures=''.join('<figure>'+image(key,prefix,'(max-width: 700px) 92vw, 60vw' if i==0 else '(max-width: 700px) 92vw, 30vw')+'<figcaption aria-hidden="true">'+E(LIB[key]['alt'])+'</figcaption></figure>' for i,key in enumerate(keys))
 extra='<a class="pill" href="mailto:info@longwaveboards.com?subject=Wyjazd%20do%20Chorwacji">Zapytaj o Chorwację</a>' if croatia else ''
 return '<!-- PLACE_PHOTOS_START --><section class="place-photo-section" id="zdjecia"><div class="wrap section"><div class="place-photo-heading"><div><p class="kicker">'+E(kicker)+'</p><h2>'+E(title)+'</h2></div><p>'+note+'</p></div><div class="place-photo-grid">'+figures+'</div>'+extra+'</div></section><!-- PLACE_PHOTOS_END -->'

def build():
 for route in GALLERIES:
  p=ROOT/'dist/amigos'/route/'index.html';s=p.read_text()
  s=re.sub(r'<!-- PLACE_PHOTOS_START -->.*?<!-- PLACE_PHOTOS_END -->\n?','',s,flags=re.S)
  anchors=['<section class="wrap section project-text" id="idea">','<section class="destination-faq','<section class="wrap section contact" id="pytania">','<section class="wrap section content-offers"']
  anchor=next((a for a in anchors if a in s),None)
  if not anchor:raise ValueError('No gallery insertion point: '+route)
  s=s.replace(anchor,gallery(route)+'\n'+anchor,1)
  css='../'*len(route.split('/'))+'place-photos.css?v=20261124'
  if 'place-photos.css' not in s:s=s.replace('</head>',f'<link rel="stylesheet" href="{css}"></head>')
  s=s.replace('<a href="#zdjecia">Zdjęcia i noclegi</a>','')
  # Add a direct anchor to photo sections on destination pages.
  if 'class="wrap location-tabs"' in s and 'href="#zdjecia"' not in s:
   s=re.sub(r'(<nav class="wrap location-tabs"[^>]*>)',r'\1<a href="#zdjecia"><svg class="destination-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/></svg>Zdjęcia i noclegi</a>',s,count=1)
  if 'class="content-jump"' in s and 'href="#zdjecia"' not in s:
   s=re.sub(r'(<nav class="content-jump"[^>]*>)',r'\1<a href="#zdjecia">Zdjęcia</a>',s,count=1)
  if route.endswith('home-spot-2-0'):
   s=s.replace('href="#idea">Poznaj projekt','href="#zdjecia">Zobacz wizualizacje')
  p.write_text("\n".join(line.rstrip() for line in s.splitlines())+"\n")

if __name__=='__main__':build()
