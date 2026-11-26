"""Render owner-supplied photos without altering offers or reservation status."""
from pathlib import Path
from html import escape as E
import json,re
ROOT=Path(__file__).resolve().parents[1]
LIB=json.loads((ROOT/'sources/photo-library.json').read_text())
MOMENTS=json.loads((ROOT/'sources/place-moments.json').read_text())

def image(key,prefix,sizes='(max-width: 700px) 92vw, 45vw',lazy=True):
 p=LIB[key]
 return f'<img src="{prefix}{p["src"]}" srcset="{prefix}{p["small"]} {p["smallWidth"]}w, {prefix}{p["src"]} {p["width"]}w" sizes="{sizes}" width="{p["width"]}" height="{p["height"]}" alt="{E(p["alt"],quote=True)}" loading="{"lazy" if lazy else "eager"}" decoding="async">'

# Home Spot 2.0 is owned by build-home-spot.py and its dedicated source template.
GALLERIES={
 'wyjazdy/lazy':('Tu odpoczywamy.','Zakwaterowanie · Łazy',['lazy-domki','lazy-salon','lazy-sypialnia']),
 'wyjazdy/jastarnia':('Blisko wody. Blisko siebie.','Zakwaterowanie · Jastarnia',['jastarnia-domek','jastarnia-kuchnia','jastarnia-pokoj']),
 'wyjazdy/dabki':('Po dniu pełnym wrażeń.','Zakwaterowanie · Dąbki',['dabki-domki','dabki-pokoj','dabki-wnetrze']),
 'wyjazdy/rodos':('Chwila wytchnienia.','Zakwaterowanie · Rodos',['rodos-basen','rodos-pokoj','rodos-taras']),
 'noclegi/home-spot-jastarnia':('Rozgość się w Home Spocie.','Jastarnia · Domki i wspólna przestrzeń',['jastarnia-domek','jastarnia-kuchnia','jastarnia-pokoj']),
 'wyjazdy/zagraniczne':('Chorwacja. Nowy kierunek.','Zapowiedź · Na katamaranie',['chorwacja-katamaran','chorwacja-poklad','chorwacja-kabina']),
 'wyjazdy/obozy-dla-dzieci':('Tak wygląda obozowy dzień.','Kadry z LONGWAVE CAMP · Łazy',['lazy-grupa','lazy-longboard','lazy-ruch'])}

def gallery(route):
 title,kicker,keys=GALLERIES[route];prefix='../'*(len(route.split('/'))+1)+'assets/'
 croatia=route.endswith('zagraniczne')
 note='Przygotowujemy nowy kierunek. O szczegóły i planowane terminy zapytaj nas bezpośrednio.' if croatia else 'Szczegóły zakwaterowania i dostępne warianty pobytu sprawdź w opisie wybranego terminu.'
 figures=''.join('<figure>'+image(key,prefix,'(max-width: 700px) 92vw, 60vw' if i==0 else '(max-width: 700px) 92vw, 30vw')+'<figcaption aria-hidden="true">'+E(LIB[key]['alt'])+'</figcaption></figure>' for i,key in enumerate(keys))
 extra='<a class="pill" href="mailto:info@longwaveboards.com?subject=Wyjazd%20do%20Chorwacji">Zapytaj o Chorwację</a>' if croatia else ''
 return '<!-- PLACE_PHOTOS_START --><section class="place-photo-section" id="zdjecia"><div class="wrap section"><div class="place-photo-heading"><div><p class="kicker">'+E(kicker)+'</p><h2>'+E(title)+'</h2></div><p>'+note+'</p></div><div class="place-photo-grid">'+figures+'</div>'+extra+'</div></section><!-- PLACE_PHOTOS_END -->'

def moments_gallery(route):
 data=MOMENTS[route];prefix='../'*(len(route.split('/'))+1)+'assets/'
 figures=''.join('<figure>'+image(key,prefix,'(max-width: 700px) 88vw, 30vw')+'<figcaption aria-hidden="true">'+E(LIB[key]['alt'])+'</figcaption></figure>' for key in data['keys'])
 return '<!-- PLACE_MOMENTS_START --><section class="place-photo-section place-photo-moments" id="kadry"><div class="wrap section"><div class="place-photo-heading"><div><p class="kicker">'+E(data['kicker'])+'</p><h2>'+E(data['title'])+'</h2></div></div><div class="place-moments-grid">'+figures+'</div></div></section><!-- PLACE_MOMENTS_END -->'

def build_moments():
 for route in MOMENTS:
  p=ROOT/'dist/amigos'/route/'index.html';s=p.read_text()
  s=re.sub(r'<!-- PLACE_MOMENTS_START -->.*?<!-- PLACE_MOMENTS_END -->\n?','',s,flags=re.S)
  anchors=['<!-- PLACE_PHOTOS_START -->','<section class="wrap section content-offers"','<section class="destination-faq']
  anchor=next((a for a in anchors if a in s),None)
  if not anchor:raise ValueError('No moments insertion point: '+route)
  s=s.replace(anchor,moments_gallery(route)+'\n'+anchor,1)
  css='../'*len(route.split('/'))+'place-photos.css?v=20261126'
  if 'place-photos.css' not in s:s=s.replace('</head>',f'<link rel="stylesheet" href="{css}"></head>')
  else:s=re.sub(r'place-photos.css\?v=[^"\s]+','place-photos.css?v=20261126',s)
  if 'class="wrap location-tabs"' in s and 'href="#kadry"' not in s:
   s=re.sub(r'(<nav class="wrap location-tabs"[^>]*>)',r'\1<a href="#kadry">Życie na wyjeździe</a>',s,count=1)
  if 'class="content-jump"' in s and 'href="#kadry"' not in s:
   s=re.sub(r'(<nav class="content-jump"[^>]*>)',r'\1<a href="#kadry">Kadry z wyjazdów</a>',s,count=1)
  p.write_text("\n".join(line.rstrip() for line in s.splitlines())+"\n")

def build_heroes():
 # Owner-selected photography replaces the background players on these routes.
 for route,data in json.loads((ROOT/'sources/place-heroes.json').read_text()).items():
  p=ROOT/'dist/amigos'/route/'index.html';s=p.read_text()
  prefix='../'*(len(route.split('/'))+1)+'assets/'
  desktop,mobile=data['desktop'],data['mobile']
  picture=(f'<picture class="place-hero-photo" style="--place-position-mobile:{E(data.get("mobilePosition","50% 50%"))}"><source media="(max-width: 650px)" srcset="{prefix}{mobile["src"]}" width="{mobile["width"]}" height="{mobile["height"]}">'
   f'<img src="{prefix}{desktop["src"]}" width="{desktop["width"]}" height="{desktop["height"]}" alt="" fetchpriority="high" decoding="async"></picture>')
  if route.startswith('wyjazdy/'):
   s=re.sub(r' data-hero-youtube="[^"]+"','',s,count=1)
   s,n=re.subn(r'(<div class="location-screen" aria-hidden="true">).*?(</div>)',lambda m:m[1]+picture+m[2],s,count=1,flags=re.S)
   # The anchor remains useful but no longer promises a film.
   s=s.replace('</svg>Relacja</a>','</svg>Na początek</a>')
  else:
   s,n=re.subn(r'(<div class="content-hero-photo">).*?(</div>)',lambda m:m[1]+picture+m[2],s,count=1,flags=re.S)
  if n!=1:raise ValueError('Missing hero: '+route)
  s=re.sub(r'place-photos.css\?v=[^\"\s]+','place-photos.css?v=hero-20261126',s)
  p.write_text(s)

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
  p.write_text("\n".join(line.rstrip() for line in s.splitlines())+"\n")

 build_moments()
 build_heroes()

if __name__=='__main__':build()
