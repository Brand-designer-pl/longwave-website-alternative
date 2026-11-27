"""Server-rendered homepage calendar. Public terms only, exact offer and term links."""
import warnings
from collections import defaultdict
from datetime import date
from html import escape as E
from urllib.parse import urlencode

MONTHS = ('Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień')
ARROW = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg>'

def link(t):
    return E('https://app.longwaveboards.com/?'+urlencode({'offer':t['offerId'],'term':t['termId']}),quote=True)

def render(terms, today=None):
    today = today or date.today().isoformat()
    terms = sorted((t for t in terms if not t.get('draft') and t['end'] >= today),key=lambda t:(t['start'],str(t['offerId']),t['termId']))
    groups=defaultdict(list)
    for t in terms:
        groups[t['start'][:7]].append(t)
    # Always retain May–September for each offered year; never imply invented dates.
    for year in {t['start'][:4] for t in terms}:
        for month in range(5,10):
            if f'{year}-{month:02d}-31' >= today: groups.setdefault(f'{year}-{month:02d}',[])
    calendar=[]
    for i,(key,items) in enumerate(sorted(groups.items())):
        year,month=key.split('-'); ident='month-'+key
        rows=''.join(f'<a class="calendar-term" href="{link(t)}"><span class="calendar-date">{E(t["dates"])}</span><span><strong>{E(t["title"])}</strong><small>{E(t["place"])} · {E(t["age"])}</small></span><span class="calendar-price">{E(t["priceLabel"])}</span>{ARROW}</a>' for t in items)
        if not rows: rows='<p class="calendar-empty">Nie ma jeszcze opublikowanych terminów na ten miesiąc. <a href="mailto:info@longwaveboards.com">Zapytaj nas o plany.</a></p>'
        calendar.append(f'<details class="calendar-month" id="{ident}"><summary><span>{MONTHS[int(month)-1]}</span><small>{year}</small><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary><div class="calendar-panel"><h4>{MONTHS[int(month)-1]} {year}</h4>{rows}</div></details>')
    if not calendar: calendar=['<p>Przygotowujemy kolejne terminy. <a href="mailto:info@longwaveboards.com">Zapytaj o wyjazd.</a></p>']
    featured=[]
    # Editorial selections: Jastarnia camp and the season-opening festival.
    for offer_id,label in [(4,'Bestseller'),(5,'Festiwal LONGWAVE')]:
        t=next((t for t in terms if str(t['offerId'])==str(offer_id)),None)
        if not t:
            warnings.warn(f"Homepage featured offer {offer_id} ({label}) has no future public terms; update the editorial selection.", stacklevel=2)
            continue
        featured.append(f'<a class="taped-trip" href="{link(t)}"><div class="taped-visual"><span class="paper-tape">{label}</span><div class="taped-photo"><img src="../{E(t["image"])}" alt="{E(t["title"])}" width="720" height="480" loading="lazy" decoding="async"></div></div><div class="taped-caption"><div><p>{E(t["dates"])}</p><h3>{E(t["title"])}</h3><span>{E(t["priceLabel"])}</span></div>{ARROW}</div></a>')
    return ''.join(calendar),''.join(featured)
