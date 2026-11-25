"""Build informational pages from public, owner-approved LONGWAVE source content."""
from pathlib import Path
from support_layouts import KINDS, render_support
import html, json, re, os, importlib.util
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'dist/amigos'
PAGES=json.loads((ROOT/'sources/content-pages.json').read_text())
POSTS=json.loads((ROOT/'sources/blog-posts.json').read_text())
E=lambda s:html.escape(str(s),quote=True)
ARROW='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg>'
CONTROLS='<div class="offers-controls" data-offers-controls hidden><span data-offers-status aria-live="polite" aria-atomic="true"></span><div><button class="offer-arrow" data-prev type="button" aria-label="Poprzedni termin" aria-controls="content-offers-track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg></button><button class="offer-arrow" data-next type="button" aria-label="Następny termin" aria-controls="content-offers-track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></button></div></div>'
WAVE='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 13c5-8 9 8 14 0s9 8 14 0M2 22c5-8 9 8 14 0s9 8 14 0"/></svg>'
MAP={'eventy':'eventy','dla-firm':'eventy/dla-firm','surf-party':'eventy/surf-party','vanlife':'eventy/vanlife','boards':'sklep-i-boards/boards','boards-2':'sklep-i-boards/boards','blog':'blog','o-nas':'o-longwave','program-liderski':'o-longwave/program-liderski','campy':'wyjazdy/obozy-dla-dzieci','kategoria/rodzinne':'wyjazdy/rodzinne','kategoria/zagraniczne':'wyjazdy/zagraniczne','hiszpania':'noclegi/apartament-hiszpania','kontakt':'#kontakt'}
MAP.update({p['slug']:'blog/'+p['slug'] for p in POSTS})
MAP.update({'kontakt':'kontakt','polityka-prywatnosci':'polityka-prywatnosci','polityka-prywatnosci-2':'polityka-prywatnosci','regulamin-serwisu':'regulamin-serwisu'})
APP='https://app.longwaveboards.com/'
OLD_OFFERS={'wyjazdy','wszystkie-wyjazdy','zapisy-2','jastarnia-surfing','boze-cialo','dabki1','golden-resort','jastarnia1','jastarnia5','wing-foil','zakonczenie-sezonu','zjazd-absolwentow'}
# Historical booking links lead to today's catalogue, never to expired bookings.
MAP.update({x:APP+'#oferty' for x in OLD_OFFERS})
HEADER_SOURCE=ROOT/'sources/homepage.html'
SOURCE_HEADER=re.search(r'<header class="nav-shell">.*?</header>',(HEADER_SOURCE if HEADER_SOURCE.exists() else SITE/'index.html').read_text(),re.S).group()
def rel(route,target):
 if target.startswith(('https:','mailto:','tel:')): return target
 u=urlsplit(target);path=u.path.rstrip('/')
 return '../'*len([x for x in route.split('/') if x])+path+('/' if path else '')+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
def asset(route,path): return '../'*(len([x for x in route.split('/') if x])+1)+'assets/'+path
def rewrite(text,route):
 def label(m):
  visible=html.unescape(re.sub('<[^>]+>','',m[2])).strip()
  u=urlsplit(visible)
  if u.netloc.lower().removeprefix('www.') not in ('longwaveboards.com','longwave.com','hiway.brand-designer.pl'):return m[0]
  target=MAP.get(unquote(u.path).strip('/').lower(),'')
  return m[1]+('Sprawdź aktualne wyjazdy' if target.startswith(APP) else 'Poznaj LONGWAVE')+'</a>'
 text=re.sub(r'(<a\b[^>]*>)(.*?)</a>',label,text,flags=re.S)
 def fix(m):
  href=html.unescape(m[1]); u=urlsplit(href); host=u.netloc.lower().removeprefix('www.')
  if host in ('longwaveboards.com','longwave.com','hiway.brand-designer.pl'):
   key=unquote(u.path).strip('/').lower()
   if not key: target='o-longwave/opinie' if 'reviews-source' in text else ''
   elif key in MAP: target=MAP[key]
   else: raise ValueError('Unmapped old URL: '+href)
   return 'href="'+E(rel(route,target))+'"'
  if host=='longwavehomespot.com': return 'href="https://booking.hotres.pl/v4_step1?lang=pl&amp;oid=5121"'
  return m[0]
 return re.sub(r'href="([^"]+)"',fix,text)
def header(route):
 prefix='../'*len([x for x in route.split('/') if x])
 s=SOURCE_HEADER
 def shift(m):
  url=m[2]
  if url.startswith(('https:','mailto:','tel:')): return m[0]
  return m[1]+'="'+prefix+url+'"'
 s=re.sub(r'(href|src)="([^"]+)"',shift,s)
 s=rewrite(s,route)
 s=s.replace('href="https://sklep.longwaveboards.com/"','href="'+rel(route,'sklep-i-boards/collection')+'"')
 s=s.replace('href="'+prefix+'#ludzie"','href="'+rel(route,'o-longwave')+'"')
 if '>Vanlife</a>' not in s:s=s.replace('>Surf Party</a>','>Surf Party</a><a href="'+rel(route,'eventy/vanlife')+'">Vanlife</a>')
 if '>Program liderski</a>' not in s:s=s.replace('>Blog i poradnik</a>','>Blog i poradnik</a><a href="'+rel(route,'o-longwave/program-liderski')+'">Program liderski</a><a href="'+rel(route,'o-longwave/opinie')+'">Opinie</a>')
 return '<div class="interior-head"><div class="wrap">'+s+'</div></div>'
def photo(route,path,alt,lazy=True):
 return f'<img src="{asset(route,path)}" alt="{E(alt)}" width="1440" height="960"'+(' loading="lazy"' if lazy else ' fetchpriority="high"')+' decoding="async">'
def pill(route,label,url):return f'<a class="pill" href="{E(rel(route,url))}">{E(label)}{ARROW}</a>'
def layout(route):
 if route in KINDS:return KINDS[route]
 if route.startswith('eventy'):return 'events'
 if route.startswith('sklep-i-boards'):return 'collection'
 if route.startswith('o-longwave'):return 'community'
 return 'destination'
def decoration(route,kind='wave'):
 prefix='../'*len([x for x in route.split('/') if x])
 return f'<div class="surf-mark content-decoration" data-content-mark="{kind}" aria-hidden="true"><img src="{prefix}art/{kind}.svg" alt="" width="100" height="100" loading="lazy"><span class="surf-mark-player"></span></div>'
def footer(route):
 links=[('wyjazdy','Wyjazdy'),('noclegi','Noclegi'),('kontakt','Kontakt'),('faq','FAQ'),('polityka-prywatnosci','Polityka prywatności'),('regulamin-serwisu','Regulamin serwisu')]
 return '<footer class="footer"><div class="wrap footer-row"><a class="wordmark" href="'+rel(route,'')+'" aria-label="LONGWAVE, strona główna"><img src="'+asset(route,'logo.webp')+'" width="1920" height="1357" alt="" decoding="async"></a><nav aria-label="Stopka">'+''.join('<a href="'+rel(route,url)+'">'+label+'</a>' for url,label in links)+'</nav><div class="footer-meta"><span>LONGWAVE Zuzanna Przybylska · NIP 5842812617</span><a href="mailto:info@longwaveboards.com">info@longwaveboards.com</a><a href="tel:+48882334889">+48 882 334 889</a></div></div></footer>'
def support_sections(route,page):
 out=''
 for i,s in enumerate(page.get('sections',[])):
  out+='<section class="support-band'+(' support-band--dark' if i%2 else '')+'" id="'+E(s['id'])+'"><div class="wrap section"><h2>'+E(s['title'])+'</h2><p class="support-lead">'+E(s['text'])+'</p>'
  if s.get('items'):
   out+='<div class="support-grid">'+''.join('<article>'+WAVE+'<h3>'+E(item['title'])+'</h3><p>'+E(item['text'])+'</p>'+(pill(route,item['label'],item['href']) if item.get('href') else '')+'</article>' for item in s['items'])+'</div>'
  out+='</div></section>'
 if page.get('faq'):
  out+='<section class="wrap section support-faq" id="pytania"><h2>Najczęstsze pytania.</h2>'+''.join('<details><summary>'+E(q['question'])+'</summary><p>'+E(q['answer'])+'</p></details>' for q in page['faq'])+'</section>'
 return out
def shell(route,title,desc,body):
 prefix='../'*len([x for x in route.split('/') if x]); p=SITE/route/'index.html';p.parent.mkdir(parents=True,exist_ok=True)
 motion='' if route.startswith('blog/') or route=='sklep-i-boards/boards' else f'<script defer src="{prefix}content-motion.js?v=editorial-20261119"></script>'
 boards=f'<link rel="stylesheet" href="{prefix}boards.css?v=volume-20261118"><script defer src="{prefix}../vendor/gsap.min.js"></script><script defer src="{prefix}boards.js?v=wide-tyres-20261118"></script>' if route=='sklep-i-boards/boards' else ''
 carousel=f'<script defer src="{prefix}offers-carousel.js?v=locations-20261116"></script>' if 'data-offers-track' in body else ''
 support_css=f'<link rel="stylesheet" href="{prefix}support-layouts.css?v=editorial-20261119">' if route in KINDS else ''
 s=f'''<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{E(title)} | LONGWAVE</title><meta name="description" content="{E(desc)}"><meta property="og:title" content="{E(title)} | LONGWAVE"><meta property="og:description" content="{E(desc)}"><link rel="icon" href="{asset(route,'favicon.webp')}"><link rel="stylesheet" href="{prefix}editorial.css?v=home-0471ef-20261123"><link rel="stylesheet" href="{prefix}content-pages.css?v=brief-20261119"><script defer src="{prefix}editorial.js?v=photos-20261124"></script>{carousel}{motion}{boards}{support_css}</head><body class="content-page content-layout-{layout(route)}{' content-article' if route.startswith('blog/') else ' boards-page' if route=='sklep-i-boards/boards' else ''}"><a class="skip" href="#main">Przejdź do treści</a>{header(route)}<main id="main">{body}</main>{footer(route)}</body></html>'''
 p.write_text(rewrite(s,route))
def hero(route,title,kicker,lead,img):
 page=next((p for p in PAGES if p['route']==route),{})
 post=next((p for p in POSTS if 'blog/'+p['slug']==route),{})
 action=('Sprawdź terminy','#terminy') if page.get('offers') else page.get('cta') or ('Poznaj miejsce' if route.startswith('noclegi/') else 'Czytaj historię' if route.startswith('blog/') else 'Odkryj więcej','#szczegoly')
 focal=page.get('heroPosition','50% 50%'); mobile=page.get('heroPositionMobile','72% 50%' if route=='blog/szkolenia-surfingowe-nad-baltykiem' else focal)
 buttons=pill(route,action[0],action[1]) if not action[1].startswith('#') else f'<a class="pill" href="{action[1]}">{E(action[0])}{ARROW}</a>'
 if action[1]!='#szczegoly':buttons+='<a class="hero-detail" href="#szczegoly">Poznaj szczegóły<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></a>'
 wide=' content-hero--wide' if page.get('heroMobileWide') else ''
 markup=f'<section class="content-hero{wide}" style="--hero-position:{E(focal)};--hero-position-mobile:{E(mobile)}"><div class="content-hero-photo">{photo(route,img,"",False)}</div><div class="wrap content-hero-inner"><div class="content-hero-copy"><a class="content-back" href="{rel(route,"")}">LONGWAVE / {E(kicker)}</a><h1>{E(title)}</h1><p>{E(lead)}</p><div class="content-hero-actions">{buttons}</div></div></div></section>'
 jumps=[('#szczegoly','Historia' if route.startswith('blog/') else 'Poznaj nas' if route.startswith('o-longwave') else 'Artykuły' if route=='blog' else 'W skrócie')]
 if page.get('gallery') or page.get('design',{}).get('galleryAnchor') or len(post.get('images',[]))>1:jumps.append(('#galeria','Galeria'))
 if page.get('sections') and route!='kontakt':jumps.append(('#'+page['sections'][0]['id'],'Informacje'))
 if page.get('faq'):jumps.append(('#pytania','Pytania i odpowiedzi'))
 if route=='kontakt':jumps.append(('#wybierz-temat','Kontakt'))
 if page.get('offers'):jumps.append(('#terminy','Terminy wyjazdów'))
 if page.get('cta'):jumps.append(('#kontakt-strony','Kontakt' if page['cta'][1].startswith(('mailto:','kontakt')) else 'Aplikacja' if page['cta'][1].startswith(APP) else 'Przejdź do sklepu'))
 markup+='<nav class="content-jump" aria-label="Na tej stronie"><div class="wrap">'+''.join(f'<a href="{url}">{label}</a>' for url,label in jumps)+'</div></nav>'
 return markup
def gallery(route,imgs,label,alts=None):
 alts=alts or []
 return '<section class="content-band content-gallery-band" id="galeria"><div class="wrap section"><p class="kicker">Kadry LONGWAVE</p><h2>'+E(label)+'</h2><div class="content-gallery">'+''.join('<figure>'+photo(route,x,alts[i] if i<len(alts) else '')+'</figure>' for i,x in enumerate(imgs))+'</div></div></section>' if imgs else ''
INDEX={p['route']:(p['kicker'],p['image']) for p in PAGES}
INDEX.update({'blog':('Historie i poradniki','wybor-longwave.webp'),'o-longwave/opinie':('Wasze opinie','together.webp'),'noclegi/home-spot-jastarnia':('Home Spot Jastarnia','home-spot-taras.webp'),'noclegi/home-spot-2-0':('Home Spot 2.0','home-spot-taras.webp')})
for loc,label,img in [('lazy','Łazy','coast.webp'),('jastarnia','Jastarnia','wybor-oboz.webp'),('dabki','Dąbki','category-family.webp'),('rodos','Rodos','surf.webp')]:INDEX['wyjazdy/'+loc]=(label,img)
def related(route,items):
 if route=='eventy':
  labels={'eventy/dla-firm':'Dla firm','eventy/surf-party':'Surf Party','eventy/vanlife':'Vanlife'}
  rows=''.join(f'<a class="event-format" href="{rel(route,x)}"><div class="event-format-image">{photo(route,INDEX[x][1],"")}</div><div class="event-format-copy"><p class="kicker">0{i+1} / Wybierz swój klimat</p><h3>{E(labels[x])}</h3><p>{E(next((p["lead"] for p in PAGES if p["route"]==x),""))}</p><span class="event-format-link">Poznaj ten format {ARROW}</span></div></a>' for i,x in enumerate(items))
  return '<section class="content-related event-formats"><div class="wrap section"><p class="kicker">Nie tylko jeden sposób na spotkanie</p><h2>Jaki masz plan?</h2><div class="event-format-grid">'+rows+'</div></div></section>'
 cards=''.join(f'<a class="content-card" href="{rel(route,x)}">{photo(route,INDEX[x][1],INDEX[x][0])}<div><h3>{E(INDEX[x][0])}</h3>{ARROW}</div></a>' for x in items)
 return f'<section class="content-related"><div class="wrap section">{decoration(route,"sun") if not route.startswith("blog/") else ""}<p class="kicker">Dalej z LONGWAVE</p><h2>Odkryj więcej.</h2><div class="content-cards">{cards}</div></div></section>'
def offer_markup(route,group):
 spec=importlib.util.spec_from_file_location('offers',ROOT/'tools/sync-offers.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 terms=json.loads((ROOT/'dist/offers.json').read_text())['items']
 terms=mod.filter_terms(terms,group)
 return ''.join(mod.card(t,'../'*(len([x for x in route.split('/') if x])+1)) for t in terms) or '<p>Przygotowujemy kolejne terminy. <a href="mailto:info@longwaveboards.com">Zapytaj nas o planowany wyjazd.</a></p>'
def build():
 for p in PAGES:
  if p['route']=='sklep-i-boards/boards':
   shell(p['route'],'LONGWAVE Boards','Poznaj bambusowe deski LONGWAVE Board 140 i 100. Surferski ruch na lądzie i autorski system trucków.',(ROOT/'sources/boards-page.html').read_text());continue
  if p['route'] in KINDS:
   body=render_support(p,hero,photo,pill,ARROW);shell(p['route'],p['kicker'],p['lead'],body);continue
  r=p['route'];body=hero(r,p['title'],p['kicker'],p['lead'],p['image'])
  body+=f'<section class="wrap section content-intro" id="szczegoly">'+decoration(r,'board' if layout(r)=='collection' else 'wave')+f'<h2>{E(p["heading"])}</h2><div>'+''.join('<p>'+E(x)+'</p>' for x in p['paragraphs'])+'</div></section>'
  if p['facts']:body+='<section class="content-facts-band"><div class="wrap"><div class="content-facts">'+''.join('<div>'+WAVE+'<h3>'+E(x)+'</h3></div>' for x in p['facts'])+'</div></div></section>'
  body+=support_sections(r,p)
  body+=gallery(r,p['gallery'],p.get('galleryTitle','Tak wygląda nasz świat.'),p.get('galleryAlts'))
  if p['offers']:body+='<section class="wrap section content-offers" id="terminy"><p class="kicker">Wybierz swój termin</p><h2>Najbliższe wyjazdy.</h2><div class="offers-grid" id="content-offers-track" data-offers-track role="region" aria-label="Terminy wyjazdów" data-offer-group="'+p['offers']+'"><!-- CONTENT_OFFERS_START -->'+offer_markup(r,p['offers'])+'<!-- CONTENT_OFFERS_END --></div>'+CONTROLS+'</section>'
  if p['cta']:body+='<section class="content-callout" id="kontakt-strony"><div class="wrap section"><p class="kicker">Zróbmy kolejny krok</p><h2>'+E(p['cta'][0])+'.</h2>'+pill(r,p['cta'][0],p['cta'][1])+'</div></section>'
  body+=related(r,p['related']);shell(r,p['kicker'],p['lead'],body)
 r='blog';body=hero(r,'Historie znad wody.','Blog i poradnik','Relacje, ludzie i praktyczne wskazówki. Poznaj świat LONGWAVE z bliska.','wybor-longwave.webp')
 body+='<section class="wrap section" id="szczegoly"><p class="kicker">Archiwum LONGWAVE</p><h2>Czytaj we własnym tempie.</h2><div class="content-cards blog-cards">'
 for p in POSTS:
  body+=f'<a class="content-card" href="{p["slug"]}/">{photo(r,p["images"][0],p["title"])}<div><time datetime="{p["date"]}">{p["date"]}</time><h3>{E(p["title"])}</h3>{ARROW}</div></a>'
 body+='</div></section>';shell(r,'Blog i poradnik','Relacje z wyjazdów, historie LONGWAVE i poradniki dla uczestników oraz rodziców.',body)
 for p in POSTS:
  r='blog/'+p['slug'];desc=re.sub('<[^>]+>',' ',p['body']);desc=' '.join(html.unescape(desc).split())[:155]
  body=hero(r,p['title'],'Z archiwum LONGWAVE',p['date'],p['images'][0])
  body+='<div class="wrap archive-note">Artykuł archiwalny. Opisane terminy, ceny i warunki mogą być nieaktualne. '+pill(r,'Aktualne wyjazdy',APP+'#oferty')+'</div>'
  body+='<article class="content-prose" id="szczegoly">'+p['body']+('<h2>Filmy z relacji</h2><ul>'+''.join('<li><a href="'+E(url)+'">Zobacz film z relacji '+str(i+1)+' w YouTube</a></li>' for i,url in enumerate(p.get('videos',[])))+'</ul>' if p.get('videos') else '')+'</article>'+gallery(r,p['images'][1:],'Zobacz także kadry z relacji.')+'<div class="wrap section">'+pill(r,'Wróć do bloga','blog')+'</div>'
  shell(r,p['title'],desc,body)
 r='o-longwave/opinie';reviews=json.loads((ROOT/'sources/reviews.json').read_text())['reviews']
 body=hero(r,'Tak nas wspominacie.','Opinie uczestników i rodziców','Głosy naszej społeczności. Obozy, pasja i wspomnienia, do których chce się wracać.','together.webp')
 body+='<section class="wrap section" id="szczegoly"><p>Opinie z karuzeli dotychczasowej strony LONGWAVE, zapisane 16 listopada 2026. To archiwalny wybór opinii, bez bieżącej synchronizacji z Google.</p><div class="content-quotes">'+''.join('<figure><blockquote>'+E(x['text'])+'</blockquote><figcaption>'+E(x['author'])+' · '+str(x['rating'])+'/5</figcaption></figure>' for x in reviews)+'</div></section>'+related(r,['wyjazdy/obozy-dla-dzieci','wyjazdy/rodzinne'])
 shell(r,'Opinie uczestników i rodziców','Przeczytaj autentyczne opinie rodziców i uczestników LONGWAVE.',body)
 # Preserve the published documents; do not invent new legal terms.
 legal_pages=json.loads((ROOT/'sources/legal-pages.json').read_text())
 for p in legal_pages:
  r=p['route']
  body='<section class="legal-heading"><div class="wrap"><p class="kicker">Dokumenty LONGWAVE</p><h1>'+E(p['title'])+'</h1><p>Dokument dotyczący serwisu longwaveboards.com.</p></div></section><article class="content-prose legal-prose">'+p['body']+'</article>'
  shell(r,p['title'],p['title']+' serwisu LONGWAVE. Dane organizatora i zasady korzystania.',body)
 # Update original pages without replacing their layouts, video or interactions.
 generated={p['route'] for p in PAGES}|{p['route'] for p in legal_pages}|{'blog','o-longwave/opinie'}|{'blog/'+p['slug'] for p in POSTS}
 for file in SITE.rglob('index.html'):
  route=str(file.parent.relative_to(SITE));route='' if route=='.' else route
  # The 0471ef homepage has its own source/template and intentional Home Spot link.
  if not route and (ROOT/'sources/homepage.html').exists():continue
  if route in generated:continue
  text=file.read_text();base='../'*len([x for x in route.split('/') if x]) if route else ''
  text=text.replace('editorial.js?v=menu-photos-20261116','editorial.js?v=photos-20261124').replace('editorial.css?v=brief-20261119','editorial.css?v=home-0471ef-20261123')
  # header() counts path components; the homepage has depth zero.
  text=rewrite(text,route) if route else rewrite(text,'')
  text=re.sub(r'<header class="nav-shell">.*?</header>',lambda _:re.search(r'<header.*?</header>',header(route),re.S).group(),text,flags=re.S)
  if not route:
   # rel('') uses a dedicated root normalization below.
   text=text.replace('class="world-card world-card-collection" href="https://sklep.longwaveboards.com/"','class="world-card world-card-collection" href="sklep-i-boards/collection/"')
  text=re.sub(r'<footer class="footer">.*?</footer>',lambda _:footer(route),text,flags=re.S)
  file.write_text(text)
 (ROOT/'sources/url-map.json').write_text(json.dumps(MAP,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
 from place_photos import build as build_place_photos
 build_place_photos()
 print('Generated',len(generated),'pages; migrated all shared navigation links.')
if __name__=='__main__':build()
