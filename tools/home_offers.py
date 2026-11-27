"""Server-rendered homepage offer grid. Public offers, grouped terms and month filters."""
import warnings
import json
from pathlib import Path
from collections import defaultdict
from datetime import date
from html import escape as E
from urllib.parse import urlencode

MONTHS = ('Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień')
ARROW = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg>'

def link(t):
    return E('https://app.longwaveboards.com/?'+urlencode({'offer':t['offerId'],'term':t['termId']}),quote=True)

PAGES = json.loads((Path(__file__).resolve().parents[1]/'sources/home-offer-pages.json').read_text())

def destination(t):
    route = PAGES.get(str(t['offerId']))
    if route: return route
    if t.get('location'): return 'wyjazdy/'+t['location']+'/'
    warnings.warn(f"Offer {t['offerId']} needs a homepage description route; using the trips overview.", stacklevel=2)
    return 'wyjazdy/'

def dates_label(items):
    extra = len(items)-1
    noun = 'termin' if extra == 1 else 'terminy' if extra % 10 in (2,3,4) and extra % 100 not in (12,13,14) else 'terminów'
    return items[0]['dates'] + (f" · +{extra} {noun}" if extra else '')

def render_catalog(terms):
    if not terms:
        return '<p>Przygotowujemy kolejne wyjazdy. <a href="https://app.longwaveboards.com/">Sprawdź aplikację LONGWAVE.</a></p>'
    offers=defaultdict(list)
    for t in terms: offers[str(t['offerId'])].append(t)
    months=sorted({t['start'][:7] for t in terms})
    filters=['<button type="button" data-trip-month="all" aria-pressed="true" aria-controls="home-trip-grid"><span>Wszystkie</span></button>']
    for month in months:
        year,number=month.split('-')
        filters.append(f'<button type="button" data-trip-month="{month}" aria-pressed="false" aria-controls="home-trip-grid"><span>{MONTHS[int(number)-1]}</span> <small>{year}</small></button>')
    cards=[]
    for ident,items in offers.items():
        t=items[0]; by_month={'all':dates_label(items)}
        for month in months:
            matching=[term for term in items if term['start'].startswith(month)]
            if matching: by_month[month]=dates_label(matching)
        reserve=E('https://app.longwaveboards.com/?'+urlencode({'offer':t['offerId']}),quote=True)
        cards.append(f'''<article class="home-trip-card" data-offer-id="{E(ident)}" data-trip-dates="{E(json.dumps(by_month,ensure_ascii=False),quote=True)}">
<img src="../{E(t['image'])}" alt="{E(t['title'])} — {E(t['place'])}" width="720" height="900" loading="lazy" decoding="async">
<span class="home-trip-category">{E(t['category'])}</span>
<div class="home-trip-copy"><p class="home-trip-place">{E(t['place'])} · {E(t['age'])}</p><h4>{E(t['title'])}</h4>
<p class="home-trip-dates">{E(by_month['all'])}</p><p class="home-trip-price"><strong>{E(t['priceLabel'])}</strong><small>za uczestnika</small></p>
<div class="home-trip-actions"><a href="{E(destination(t))}" aria-label="Czytaj więcej: {E(t['title'])}">Czytaj więcej</a><a class="home-trip-book" href="{reserve}" aria-label="Zarezerwuj: {E(t['title'])}">Zarezerwuj{ARROW}</a></div></div></article>''')
    return ('<div class="home-trip-filters" role="group" aria-label="Miesiąc rozpoczęcia wyjazdu" hidden>'+''.join(filters)+'</div>'
            '<p class="home-trip-count" role="status" aria-live="polite" aria-atomic="true">Wyjazdy: '+str(len(cards))+'</p>'
            '<div class="home-trip-grid" id="home-trip-grid">'+''.join(cards)+'</div>')

def render(terms, today=None):
    today = today or date.today().isoformat()
    terms = sorted((t for t in terms if not t.get('draft') and t['end'] >= today),key=lambda t:(t['start'],str(t['offerId']),t['termId']))
    catalog = render_catalog(terms)
    featured=[]
    # Editorial selections: Jastarnia camp and the season-opening festival.
    for offer_id,label in [(4,'Bestseller'),(5,'Festiwal LONGWAVE')]:
        t=next((t for t in terms if str(t['offerId'])==str(offer_id)),None)
        if not t:
            warnings.warn(f"Homepage featured offer {offer_id} ({label}) has no future public terms; update the editorial selection.", stacklevel=2)
            continue
        featured.append(f'<a class="taped-trip" href="{link(t)}"><div class="taped-visual"><span class="paper-tape">{label}</span><div class="taped-photo"><img src="../{E(t["image"])}" alt="{E(t["title"])}" width="720" height="480" loading="lazy" decoding="async"></div></div><div class="taped-caption"><div><p>{E(t["dates"])}</p><h3>{E(t["title"])}</h3><span>{E(t["priceLabel"])}</span></div>{ARROW}</div></a>')
    return catalog,''.join(featured)
