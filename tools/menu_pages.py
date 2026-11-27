"""Render the approved MENU copy; shared by manual builds and hourly offer refreshes."""
from pathlib import Path
import html, json, re, importlib.util, hashlib
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'dist/amigos'
E=lambda x:html.escape(str(x),quote=True)
VERSION='menu-'+hashlib.sha256((SITE/'brief-pages.css').read_bytes()+(SITE/'brief-pages.js').read_bytes()).hexdigest()[:12]
ARROW='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg>'
MENU=[('Obozy dla dzieci i młodzieży',[('Kalendarz','#wyjazdy'),('Łazy','wyjazdy/lazy/'),('Jastarnia','wyjazdy/jastarnia/'),('Dąbki','wyjazdy/dabki/'),('Grecja','wyjazdy/rodos/')]),('Wyjazdy dla każdego',[('Festiwal LONGWAVE','wyjazdy/festiwal-longwave/'),('Rejsy Chorwacja','wyjazdy/rejsy-chorwacja/'),('Grecja Rodos','wyjazdy/rodos-dla-kazdego/')]),('Eventy',[('Oferty dla grup','eventy/dla-firm/'),('Zielone szkoły','eventy/zielone-szkoly/'),('Wydarzenia','eventy/')]),('Noclegi Jastarnia',[('LONGWAVE Home Spot','noclegi/home-spot-jastarnia/'),('LONGWAVE Home Spot 2.0','noclegi/home-spot-2-0/')]),('Sklep i LONGWAVE Boards',[('Merch','https://sklep.longwaveboards.com/'),('Deski LONGWAVE','sklep-i-boards/boards/')]),('O LONGWAVE',[('Nasza historia','o-longwave/'),('Bezpieczeństwo','o-longwave/bezpieczenstwo/'),('Community','o-longwave/club/'),('Program liderski','o-longwave/program-liderski/'),('Blog','blog/'),('Opinie','o-longwave/opinie/'),('FAQ','faq/'),('Kontakt','kontakt/')])]
ICONS=[ '<path d="M3 15c3-5 6 5 9 0s6 5 9 0M3 20c3-5 6 5 9 0s6 5 9 0M12 3v9m-5-5 5-4 5 4"/>', '<path d="m3 11 9-8 9 8v10H3Zm6 10v-8h6v8"/>', '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>', '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m2-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>' ]
def feature_icon(title,index):
 text=title.casefold()
 if any(x in text for x in ('bezpie','ubezpie','formal','opieka','organizator','profesjonal')): shape='<path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5Zm-4 9 3 3 5-6"/>'
 elif any(x in text for x in ('ludz','kadra','grup','rodzin','pokole','zesp','przyja','ekip','razem')): shape=ICONS[3]
 elif any(x in text for x in ('baza','spot','dom','ośro','miejsce','wyłączność','komfort','zakwater')): shape=ICONS[1]
 elif any(x in text for x in ('rejs','żagl','katamaran','jacht')): shape='<path d="M12 2v15H3Zm3 3 6 12h-6M2 19h20l-3 3H5Z"/>'
 elif any(x in text for x in ('wod','surf','basen','aquapark','sport')): shape=ICONS[0]
 else: shape=ICONS[index%4]
 return '<svg viewBox="0 0 24 24" aria-hidden="true">'+shape+'</svg>'
def prefix(route):return '../'*len(route.split('/')) if route else ''
def href(route,target):return target if target.startswith(('https:','mailto:','tel:')) else prefix(route)+target

def nav(route):
 return '<nav aria-label="Menu główne">'+''.join('<details><summary>'+E(label)+'</summary><div class="dropdown">'+''.join(f'<a href="{E(href(route,url))}">{E(name)}</a>' for name,url in links)+'</div></details>' for label,links in MENU)+'</nav>'
def patch_menu(text,route):return re.sub(r'<nav aria-label="Menu główne">.*?</nav>',lambda _:nav(route),text,flags=re.S)
LIB=json.loads((ROOT/'sources/photo-library.json').read_text())
LIB.update({
 'team.webp':{'src':'team.webp','width':1000,'height':750,'alt':'Ekipa LONGWAVE przy bazie sportów wodnych'},
 'together.webp':{'src':'together.webp','width':1000,'height':750,'alt':'Wspólne chwile społeczności LONGWAVE'},
 'world-boards.webp':{'src':'world-boards.webp','width':1000,'height':750,'alt':'Jazda na desce LONGWAVE przy nadmorskiej promenadzie'}
})
for key in ('dabki','rodos','eventy'):
 LIB['hero-'+key]={'src':f'places/hero-{key}-desktop.webp','mobile':f'places/hero-{key}-mobile.webp','width':1920,'height':1200,'alt':{'dabki':'Windsurfing w bazie WIND4YOU nad jeziorem Bukowo','rodos':'Windsurfing na Prasonisi, Rodos','eventy':'Wspólne chwile podczas festiwalu LONGWAVE'}[key]}
def image(route,key,hero=False):
 data=LIB.get(key,{'src':key,'width':1440,'height':960,'alt':''})
 url=prefix(route)+'../assets/'
 attrs=f' width="{data["width"]}" height="{data["height"]}" alt="{E(data["alt"])}" decoding="async" '+('fetchpriority="high"' if hero else 'loading="lazy"')
 srcset=f' srcset="{url+data["small"]} {data["smallWidth"]}w, {url+data["src"]} {data["width"]}w" sizes="(max-width:700px) 100vw, 60vw"' if data.get('small') else ''
 tag=f'<img src="{url+data["src"]}"{srcset}{attrs}>'
 if hero and data.get('mobile'):tag=f'<picture><source media="(max-width:700px)" srcset="{url+data["mobile"]}">{tag}</picture>'
 return tag

def copy(blocks):
 out='';inlist=False
 for b in blocks:
  if b['type']=='li' and not inlist:out+='<ul>';inlist=True
  if b['type']!='li' and inlist:out+='</ul>';inlist=False
  tag=b['type'];text=E(b['text']).replace('\n','<br>')
  out+=f'<{tag}>{text}</{tag}>'
 return out+('</ul>' if inlist else '')
def button(route,label,target,extra=''):return f'<a class="pill" href="{E(href(route,target))}" {extra}>{E(label)}{ARROW}</a>'
def gallery(route,keys,label='Chwile, które zostają.',ident='galeria'):
 return f'<section class="brief-gallery" id="{ident}"><div class="wrap brief-gallery-head"><div><p class="kicker">Kadry LONGWAVE</p><h2>{E(label)}</h2></div><div class="brief-gallery-controls" hidden><button type="button" data-gallery-prev aria-label="Poprzednie zdjęcia" aria-controls="{ident}-track">{ARROW}</button><button type="button" data-gallery-next aria-label="Następne zdjęcia" aria-controls="{ident}-track">{ARROW}</button></div></div><div class="brief-photo-track" id="{ident}-track" tabindex="0" role="region" aria-label="{E(label)}">'+''.join('<figure>'+image(route,k)+'<figcaption>'+E(LIB.get(k,{}).get('alt',''))+'</figcaption></figure>' for k in keys)+'</div></section>'
def section(route,s,i):
 ident=s.get('id','sekcja-'+str(i));kind=s['kind'];content=copy(s['blocks'])
 heading=f'<h2>{E(s["title"])}</h2>'
 if kind=='accordion':return f'<section class="wrap brief-accordion" id="{ident}"><details><summary>{E(s["title"])}</summary><div class="brief-details-body">{content}</div></details></section>'
 if kind=='steps':
  steps=[];current=None
  for b in s['blocks']:
   if b['type']=='h3':
    current={'title':b['text'],'blocks':[]};steps.append(current)
   elif current:current['blocks'].append(b)
  content='<ol class="brief-steps">'+''.join('<li><h3>'+E(x['title'])+'</h3>'+copy(x['blocks'])+'</li>' for x in steps)+'</ol>'
 if kind=='prices' and s.get('priceOptions'):
  content='<div class="brief-price-options">'+''.join('<article><p class="kicker">'+E(x['date'])+'</p><h3>'+E(x['label'])+'</h3><p>Cena regularna: '+E(x['regular'])+' zł / osoba</p><strong>'+E(x['promo'])+' zł</strong><p>Cena promocyjna za osobę</p></article>' for x in s['priceOptions'])+'</div>'
 if kind=='day':content='<div class="brief-day">'+content+'</div>'
 pic=f'<figure class="brief-section-photo">{image(route,s["image"])}</figure>' if s.get('image') else ''
 if kind=='note':heading='<span class="brief-tape">OFFLINE IS THE NEW LUXURY</span>'+heading
 return f'<section class="brief-section brief-section--{kind}'+(' brief-reverse' if i%2 else '')+f'" id="{ident}"><div class="wrap brief-section-grid'+(' brief-section-grid--text' if not pic else '')+f'"><div class="brief-copy">{heading}{content}</div>{pic}</div></section>'
def contact(route):
 return '<section class="brief-contact" id="kontakt-strony"><div class="wrap"><p class="kicker">Porozmawiajmy o Twoim wyjeździe</p><h2>Masz pytanie? Jesteśmy.</h2><p>Opowiedz nam, co planujesz. Pomożemy dobrać wyjazd, termin lub program dla Twojej grupy.</p><div class="brief-actions">'+button(route,'Napisz do nas','mailto:info@longwaveboards.com')+button(route,'+48 882 334 889','tel:+48882334889')+'</div></div></section>'
def faq_markup(groups):
 return ''.join('<section class="wrap brief-faq-group"><h2>'+E(g['title'])+'</h2>'+''.join('<details><summary>'+E(q['title'])+'</summary><div class="brief-details-body">'+copy(q['blocks'])+'</div></details>' for q in g['questions'])+'</section>' for g in groups)
def build():
 data=json.loads((ROOT/'sources/menu-pages.json').read_text());pages=data['pages']
 source=ROOT/'sources/homepage.html';source.write_text(patch_menu(source.read_text(),''))
 spec=importlib.util.spec_from_file_location('content_builder',ROOT/'tools/build-content-pages.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 catalog=json.loads((SITE/'location-offers.json').read_text())['items']
 live=json.loads((ROOT/'dist/offers.json').read_text())['items']
 faq=next(p for p in pages if p['route']=='faq')['faq']
 values=re.findall(r'<article class="home-slide why-slide">.*?</article>',source.read_text(),re.S)
 for p in pages:
  r=p['route'];loc=p.get('location');booking=bool(loc or p.get('offerId') or p.get('inquiry'))
  cta=('#dostepnosc' if loc or p.get('offerId') else '#ceny' if '/rejsy-chorwacja/' in r else '#kontakt-strony' if p.get('contact') or p.get('inquiry') else '#opis')
  label='Sprawdź terminy' if loc or p.get('offerId') else 'Terminy i ceny' if '#ceny'==cta else 'Porozmawiajmy' if cta=='#kontakt-strony' else 'Poznaj nas'
  herocta=f'<a class="pill" href="{cta}"'+(' data-location-cta="hero" aria-label="Sprawdź terminy: '+E(p['title'])+'"' if loc else '')+'>'+label+ARROW+'</a>'
  body=f'<section class="brief-hero'+(' brief-hero--short' if p.get('faq') else '')+'">'+image(r,p['hero'],True)+'<div class="brief-hero-veil"></div><div class="wrap brief-hero-copy"><p class="kicker">'+E(p['kicker'])+'</p><h1>'+E(p['title'])+'</h1>'+herocta+'</div></section>'
  jumps=[('#opis','Opis campu' if p.get('camp') or loc=='rodos' else 'Poznaj szczegóły')]
  if any(s.get('id')=='zakwaterowanie' for s in p['sections']):jumps.append(('#zakwaterowanie','Zakwaterowanie'))
  if booking:jumps.append((cta,'Terminy i ceny' if cta=='#ceny' else 'Terminy' if cta=='#dostepnosc' else 'Zapytaj o wyjazd'))
  jumps.append(('#faq','FAQ') if p.get('camp') or p.get('faq') else ('#kontakt-strony','Kontakt'))
  body+='<nav class="brief-jump" aria-label="Na tej stronie"><div class="wrap">'+''.join(f'<a href="{u}">{E(l)}</a>' for u,l in jumps)+'</div></nav>'
  body+='<section class="wrap brief-intro"'+(' id="opis"' if p.get('faq') else '')+'>'+copy(p['intro'])+'</section>'
  if p['features']:body+='<section class="wrap brief-features" aria-label="Co nas wyróżnia">'+''.join(f'<article>{feature_icon(f["title"],i)}<h2>{E(f["title"])}</h2><p>{E(f["text"])}</p></article>' for i,f in enumerate(p['features']))+'</section>'
  if p.get('faq'):body+='<div id="faq">'+faq_markup(p['faq'])+'</div>'
  for i,s in enumerate(p['sections']):
   body+=section(r,s,i)
   if i==1 and p.get('gallery'):body+=gallery(r,p['gallery'])
   if s['kind']=='packages':body+='<div class="wrap brief-packages">'+''.join('<article><h3>'+E(x['label'])+'</h3><strong>'+E(x['price'])+'</strong><span>za osobę</span></article>' for x in p.get('packages',[]))+'</div>'
   if s.get('id')=='zakwaterowanie' and p.get('rooms'):body+=gallery(r,p['rooms'],'Zajrzyj do naszej bazy.','baza-galeria')
  if r in ('wyjazdy/rodos','wyjazdy/rodos-dla-kazdego'):
   body+='<section class="wrap brief-video"><div><p class="kicker">Zobacz Prasonisi</p><h2>Wiatr, woda i nasza ekipa.</h2><p>Zajrzyj na spot, na którym spędzamy dni pełne windsurfingu.</p></div><video controls playsinline preload="none" poster="'+prefix(r)+'../assets/places/hero-rodos-mobile.webp" src="'+href(r,'wyjazdy/rodos/hero-mobile.mp4')+'" aria-label="Film z Prasonisi na Rodos"></video></section>'
  if p.get('map'):
   query=quote(p['map'])
   body+='<section class="wrap brief-map"><h2>Tutaj się spotykamy.</h2><p>'+E(p['map'])+'</p><iframe title="Mapa: '+E(p['map'])+'" src="https://maps.google.com/maps?q='+query+'&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a href="https://www.google.com/maps/search/?api=1&amp;query='+query+'">Otwórz trasę w Mapach Google '+ARROW+'</a></section>'
  if p.get('camp'):
   body+='<section class="brief-values"><div class="wrap"><p class="kicker">Nasze wartości</p><h2>Dlaczego LONGWAVE?</h2><div class="brief-values-grid">'
   for v in values:
    h=re.search(r'<h3>(.*?)</h3>',v,re.S);text=re.findall(r'<p>(.*?)</p>',v,re.S)
    if h:body+='<details><summary>'+h[1]+'</summary><div class="brief-details-body">'+''.join('<p>'+t+'</p>' for t in text)+'</div></details>'
   body+='</div></div></section>'
   from datetime import date
   if date.today()<=date(2027,3,31):body+='<aside class="brief-promo">Do końca marca możesz skorzystać ze zniżki na wybrany wyjazd. Sprawdź cenę i warunki w ofercie.</aside>'
  if loc or p.get('offerId'):
   terms=[t for t in catalog if t['location']==loc and t['category'].casefold()=='camp'] if loc else [t for t in live if t['offerId']==p['offerId']]
   spec=importlib.util.spec_from_file_location('offer_sync',ROOT/'tools/sync-offers.py');offers=importlib.util.module_from_spec(spec);spec.loader.exec_module(offers)
   markup=''.join(offers.card(t,prefix(r)+'../') for t in terms) or '<p>Zapytaj nas o najbliższy termin i dostępność miejsc.</p>'+button(r,'Zapytaj o wyjazd','mailto:info@longwaveboards.com')
   marker='LOCATION_OFFERS' if loc else 'BRIEF_OFFERS'
   body+='<section class="wrap brief-booking" id="dostepnosc"><div class="brief-booking-intro"><p class="kicker">Twój kolejny wyjazd</p><h2>Wybierz termin.</h2><p>Zapisy odbywają się w aplikacji LONGWAVE. Przy aktywnym terminie przejdziesz bezpośrednio do oferty.</p><p>Przy zapowiedziach zapisy nie są jeszcze otwarte.</p></div><div class="brief-terms"><!-- '+marker+'_START -->'+markup+'<!-- '+marker+'_END --></div><aside class="brief-booking-app"><img src="'+prefix(r)+'../assets/app-phone.webp" alt="Podgląd aplikacji LONGWAVE do zapisów na wyjazdy" width="640" height="1200" loading="lazy"><p>Wybierz swój termin i dokończ zapis w aplikacji.</p>'+button(r,'Otwórz aplikację','https://app.longwaveboards.com/')+'</aside></section>'
   if loc:
    link,text,aria,kicker=offers.destination_cta(terms,p['title'])
    body+='<aside class="brief-dock"><div><span data-location-offer-label>'+E(kicker)+'</span><strong>'+E(p['title'])+'</strong></div><a class="pill" data-location-cta="dock" href="'+E(link)+'" aria-label="'+E(aria)+'">'+E(text)+ARROW+'</a></aside>'
  if p.get('camp'):
   items=['Czapka po pływaniu i nakrycie głowy chroniące przed słońcem','Legitymacja szkolna','Kieszonkowe — około 100 zł','Mały plecak','Krem z filtrem UV','Strój kąpielowy na przebranie','Kurtka przeciwdeszczowa','Dwa ręczniki: pod prysznic i na plażę','Dres i wygodne ubrania do aktywności']
   body+='<section class="wrap brief-packing"><h2>Nie zapomnij!</h2><ul>'+''.join('<li>'+E(x)+'</li>' for x in items)+'</ul><p>Chcesz połączyć sąsiednie turnusy? Ustalimy możliwość dłuższego pobytu indywidualnie.</p></section><section class="brief-camp-faq" id="faq"><div class="wrap"><p class="kicker">Przed przyjazdem</p><h2>Dobrze wiedzieć.</h2><p>Masz inne pytanie? Zadzwoń: <a href="tel:+48882334889">+48 882 334 889</a>.</p></div>'+faq_markup([faq[0]])+'</section>'
  body+=contact(r)
  related=[('Łazy','wyjazdy/lazy/','lazy-grupa'),('Jastarnia','wyjazdy/jastarnia/','jastarnia-ekipa'),('Dąbki','wyjazdy/dabki/','dabki-windsurf'),('Grecja','wyjazdy/rodos/','rodos-windsurf')] if loc else [('Festiwal LONGWAVE','wyjazdy/festiwal-longwave/','festiwal-ekipa'),('Rodos dla każdego','wyjazdy/rodos-dla-kazdego/','rodos-windsurf'),('Rejsy Chorwacja','wyjazdy/rejsy-chorwacja/','chorwacja-katamaran')]
  if r.startswith('o-longwave') or r=='faq':
   related=[('Nasza historia','o-longwave/','team.webp'),('Community','o-longwave/club/','together.webp'),('Program liderski','o-longwave/program-liderski/','jastarnia-ekipa'),('Bezpieczeństwo','o-longwave/bezpieczenstwo/','lazy-grupa')]
  elif r.startswith('eventy/'):
   related=[('Oferty dla grup','eventy/dla-firm/','festiwal-ekipa'),('Zielone szkoły','eventy/zielone-szkoly/','jastarnia-ekipa'),('Home Spot Jastarnia','noclegi/home-spot-jastarnia/','jastarnia-domek')]
  related=[x for x in related if x[1].rstrip('/')!=r][:3]
  body+='<section class="wrap brief-related"><h2>Widzimy się też tutaj.</h2><div>'+''.join('<a href="'+href(r,u)+'">'+image(r,img)+'<h3>'+E(t)+ARROW+'</h3></a>' for t,u,img in related if u.rstrip('/')!=r)+'</div></section>'
  desc=' '.join(p['intro'][0]['text'].split())+' '+p['kicker']
  mod.shell(r,p['title'],desc[:165],body)
  file=SITE/r/'index.html';htmltext=file.read_text().replace('class="content-page ', 'class="brief-page content-page ')
  htmltext=re.sub(r'<link rel="stylesheet" href="[^"]*support-layouts.css[^"]*">','',htmltext)
  htmltext=re.sub(r'<script defer src="[^"]*content-motion.js[^"]*"></script>','',htmltext)
  htmltext=htmltext.replace('</head>',f'<link rel="stylesheet" href="{prefix(r)}brief-pages.css?v={VERSION}"><script defer src="{prefix(r)}brief-pages.js?v={VERSION}"></script></head>')
  htmltext=htmltext.replace('<span>LONGWAVE Zuzanna Przybylska · NIP 5842812617</span>','')
  file.write_text(htmltext)
 # Sailing overview links the two distinct offers rather than mixing dates and prices.
 r='wyjazdy/rejsy-chorwacja'
 body='<section class="wrap brief-intro" id="opis"><p class="kicker">Wyjazdy dla każdego</p><h1>Chorwacja pod żaglami.</h1><p>Wybierz majówkę na katamaranie albo wrześniowy rejs. Poznaj bazę, plan i warunki każdego wyjazdu.</p></section><section class="wrap brief-sailing-grid">'
 for route,title,date,img in [('majowka','Majówka na katamaranie','1–8 maja 2027','chorwacja-katamaran'),('wrzesien','Wrzesień pod żaglami','11–18 lub 18–25 września 2027','chorwacja-poklad')]:
  body+='<a href="'+route+'/">'+image(r,img)+'<div><p class="kicker">'+date+'</p><h2>'+title+'</h2><span>Poznaj rejs '+ARROW+'</span></div></a>'
 body+='</section>'+contact(r)
 mod.shell(r,'Rejsy Chorwacja','Rejsy LONGWAVE w Chorwacji: majówka na katamaranie i wrześniowe wyjazdy pod żaglami w 2027 roku.',body)
 file=SITE/r/'index.html';file.write_text(file.read_text().replace('class="content-page ','class="brief-page content-page ').replace('</head>',f'<link rel="stylesheet" href="{prefix(r)}brief-pages.css?v={VERSION}"></head>'))
 overview=file.read_text()
 overview=re.sub(r'<script defer src="[^"]*content-motion.js[^"]*"></script>','',overview)
 overview=overview.replace('<span>LONGWAVE Zuzanna Przybylska · NIP 5842812617</span>','')
 file.write_text(overview)
 for f in SITE.rglob('index.html'):
  r=str(f.parent.relative_to(SITE));r='' if r=='.' else r
  text=patch_menu(f.read_text(),r)
  text=re.sub(r'editorial.js\?v=[^"\s]+','editorial.js?v='+VERSION,text)
  # Previous homepage content links must follow the new audience split too.
  if not r:text=text.replace('href="wyjazdy/rodzinne/"','href="wyjazdy/festiwal-longwave/"')
  f.write_text(text)
 print('MENU: rendered',len(pages)+1,'pages and updated shared navigation.')
if __name__=='__main__':build()
