"""Refresh public offers plus owner-approved draft snapshots for destination pages."""
import json, re, html, urllib.request, unicodedata
from pathlib import Path
from urllib.parse import quote, urlencode
from datetime import datetime, timezone
ROOT = Path(__file__).resolve().parents[1] / 'dist'
SOURCE = ROOT.parent / 'sources/location-drafts.json'
APP = 'https://app.longwaveboards.com/'
LOCATIONS = {'jastarnia':'Jastarnia', 'lazy':'Łazy', 'dabki':'Dąbki', 'rodos':'Rodos'}
ARROW = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg>'
def get(url):
    with urllib.request.urlopen(url, timeout=30) as r: return r.read()
def esc(v): return html.escape(str(v), quote=True)
def location(place):
    text = ''.join(c for c in unicodedata.normalize('NFD',place.lower().replace('ł','l')) if unicodedata.category(c)!='Mn')
    found = [key for key, pattern in [('jastarnia',r'\bjastarnia\b'),('lazy',r'\blazy\b'),('dabki',r'\bdabki\b'),('rodos',r'\b(rodos|prasonisi|rhodes)\b')] if re.search(pattern,text)]
    return found[0] if len(found)==1 else None

def normalize(offers, draft=False, today=None):
    today = today or datetime.now(timezone.utc).date().isoformat()
    result=[]
    for o in offers:
        if o.get('deleted') or o.get('archived'): continue
        slug=o.get('image','')
        if not re.fullmatch(r'[a-zA-Z0-9_-]+',slug): raise ValueError('Invalid offer image')
        variants=o.get('price_variants',[])
        if isinstance(variants,str): variants=json.loads(variants)
        price=min(v['price'] for v in variants) if variants else o.get('promo_price') or o['price']
        for term in o.get('terms',[]):
            if term['end_date'] < today: continue
            start=datetime.fromisoformat(term['start_date']); end=datetime.fromisoformat(term['end_date'])
            result.append(dict(offerId=o['id'],termId=term['id'],location=location(o['place']),draft=draft,
                title=o['title'],place=o['place'],category=o['category'],image='assets/offers/'+slug+'.webp',
                start=term['start_date'],end=term['end_date'],dates=f'{start:%d.%m} – {end:%d.%m.%Y}',
                age='Każdy wiek' if o.get('age_unrestricted') else f"{o['age_min']}–{o['age_max']} lat",
                priceLabel=('od ' if variants else '')+f'{price/100:g} zł',
                status='Zapisy wkrótce' if draft else 'Dostępne' if term.get('available') else 'Sprawdź dostępność'))
    return sorted(result,key=lambda t:(t['start'],t['offerId'],t['termId']))

def combine(public, snapshots):
    # Once a draft is published, live terms/prices replace its whole snapshot.
    live_ids={o['id'] for o in public}
    drafts=[o for o in snapshots if not o.get('active') and o['id'] not in live_ids and location(o['place'])]
    return normalize(public)+normalize(drafts, draft=True)

def filter_terms(terms, group):
    return [t for t in terms if
        (group=='camp' and t['category'].casefold()=='camp') or
        (group in ('family','events') and t['category'].casefold()=='wyjazd rodzinny') or
        (group=='foreign' and ('zagran' in t['category'].casefold() or t.get('location')=='rodos'))]

def card(t, asset_prefix):
    draft=t.get('draft',False)
    tag='article' if draft else 'a'
    href='' if draft else f' href="{esc(APP + "?" + urlencode({"offer": t["offerId"], "term": t["termId"]}))}"'
    badge='<span class="trip-draft">Zapowiedź</span>' if draft else ''
    action='' if draft else '<span class="trip-action">Sprawdź w aplikacji</span>'
    # Drafts are visible previews, never a false booking action or a broken private link.
    return f'''<{tag} class="trip-card{' trip-card-draft' if draft else ''}"{href} data-offer-id="{t['offerId']}"><div class="trip-image"><img src="{esc(asset_prefix+t['image'])}" alt="{esc(t['title'])}" loading="lazy" width="720" height="480"><span class="trip-category">{esc(t['category'])}</span>{badge}</div><div class="trip-body"><p class="trip-place">{esc(t['place'])}</p><h3>{esc(t['title'])}</h3><p class="trip-date">{esc(t['dates'])}</p><p class="trip-age">{esc(t['age'])}</p><div class="trip-foot"><strong class="trip-price">{esc(t['priceLabel'])}</strong><span class="trip-status">{esc(t['status'])}</span>{'' if draft else ARROW}</div>{action}</div></{tag}>'''

def destination_cta(terms, label):
    # Match the destination and prefer its camp when published; never link to a private draft.
    active=sorted((t for t in terms if not t['draft']),
                  key=lambda t:(t['category'].casefold()!='camp',t['status']!='Dostępne',t['start'],t['offerId'],t['termId']))
    if active:
        t=active[0]
        return (APP+'?'+urlencode({'offer':t['offerId'],'term':t['termId']}),
                'Sprawdź terminy', 'Sprawdź terminy: '+t['title'],
                'LONGWAVE CAMP' if t['category'].casefold()=='camp' else t['category'].upper())
    if terms:
        return ('#dostepnosc','Zobacz zapowiedź','Zobacz zapowiedź wyjazdu: '+label,'ZAPISY WKRÓTCE')
    return ('mailto:info@longwaveboards.com?subject='+quote('Wyjazd '+label),
            'Zapytaj o termin','Zapytaj o termin wyjazdu: '+label,'WYJAZDY LONGWAVE')

def sync_destination_ctas(page, terms, label):
    href,text,aria,kicker=destination_cta(terms,label)
    content=page.read_text(encoding='utf-8')
    for slot in ('hero','dock'):
        cls='pill'+(' destination-dock-cta' if slot=='dock' else '')
        markup=f'<a class="{cls}" data-location-cta="{slot}" href="{esc(href)}" aria-label="{esc(aria)}">{esc(text)}{ARROW}</a>'
        content,count=re.subn(rf'<a\b[^>]*data-location-cta="{slot}"[^>]*>.*?</a>',lambda _:markup,content,flags=re.S)
        if count!=1: raise ValueError(f'Expected one {slot} CTA in {page}')
    content,count=re.subn(r'<span data-location-offer-label>.*?</span>',lambda _:f'<span data-location-offer-label>{esc(kicker)}</span>',content)
    if count!=1: raise ValueError(f'Expected one dock label in {page}')
    page.write_text(content,encoding='utf-8')

def replace(page, marker, markup):
    content=page.read_text(encoding='utf-8')
    pattern=rf'<!-- {marker}_START -->.*?<!-- {marker}_END -->'
    updated,count=re.subn(pattern,lambda _:f'<!-- {marker}_START -->{markup}<!-- {marker}_END -->',content,flags=re.S)
    if count!=1: raise ValueError(f'Expected one {marker} marker in {page}')
    page.write_text(updated,encoding='utf-8')

def homepage_cards(terms, prefix):
    return "".join(card(t,prefix) for t in terms[:3]) or "<p>Sprawdź kolejne terminy w aplikacji LONGWAVE.</p>"

def sync():
    public=json.loads(get(APP+'api/offers'))['offers']
    snapshot=json.loads(SOURCE.read_text()) if SOURCE.exists() else {'offers':[],'exportedAt':None}
    public_terms=normalize(public)
    all_terms=sorted(combine(public,snapshot['offers']),key=lambda t:(t['start'],t['offerId'],t['termId']))
    for image in sorted({t['image'] for t in public_terms+all_terms}):
        target=ROOT/image; target.parent.mkdir(parents=True,exist_ok=True)
        if not target.exists(): target.write_bytes(get(APP+'assets/'+Path(image).name))
    updated=datetime.now(timezone.utc).isoformat()
    (ROOT/'offers.json').write_text(json.dumps(dict(updatedAt=updated,items=public_terms),ensure_ascii=False))
    (ROOT/'amigos/location-offers.json').write_text(json.dumps(dict(updatedAt=updated,draftsExportedAt=snapshot['exportedAt'],items=[t for t in all_terms if t['location']]),ensure_ascii=False))
    for page,prefix in [(ROOT/'index.html',''),(ROOT/'amigos/index.html','../')]:
        replace(page,'OFFERS',homepage_cards(public_terms,prefix))
    # Homepage brief 0471ef0cc78bf239: calendar and featured cards share this live catalog.
    home=ROOT/'amigos/index.html'
    if '<!-- HOME_TIMELINE_START -->' in home.read_text():
        from home_offers import render
        calendar,featured=render(public_terms)
        replace(home,'HOME_TIMELINE',calendar)
        replace(home,'HOME_FEATURED',featured)
    for key,label in LOCATIONS.items():
        terms=[t for t in all_terms if t['location']==key]
        markup=''.join(card(t,'../../../') for t in terms)
        if not terms:
            markup=f'<div class="offers-empty"><h3>Wyjazdy: {esc(label)}.</h3><p>Nowe terminy pojawią się tutaj po dodaniu oferty. Chcesz wiedzieć więcej?</p><a class="pill" href="mailto:info@longwaveboards.com?subject={quote("Wyjazd " + label)}">Zapytaj o wyjazd{ARROW}</a></div>'
        page=ROOT/f'amigos/wyjazdy/{key}/index.html'
        replace(page,'LOCATION_OFFERS',markup)
        sync_destination_ctas(page,terms,label)
        print(f'{label}: {len(terms)} terms, {sum(t["draft"] for t in terms)} previews')
    # Informational category and event pages use the same live offer snapshot.
    for page in (ROOT/'amigos').rglob('index.html'):
        match=re.search(r'data-offer-group="(camp|family|events|foreign)"',page.read_text())
        if not match: continue
        group=match[1]
        terms=filter_terms(public_terms,group)
        prefix='../'*len(page.parent.relative_to(ROOT).parts)
        markup=''.join(card(t,prefix) for t in terms) or '<p>Przygotowujemy kolejne terminy. <a href="mailto:info@longwaveboards.com">Zapytaj nas o planowany wyjazd.</a></p>'
        replace(page,'CONTENT_OFFERS',markup)
    print(f'Synchronized {len(public_terms)} public terms')

if __name__=='__main__': sync()
