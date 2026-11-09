import json, re, html, urllib.request
from pathlib import Path
from datetime import datetime, timezone
ROOT = Path(__file__).resolve().parents[1] / 'dist'
def get(url):
    with urllib.request.urlopen(url, timeout=30) as r: return r.read()
def esc(v): return html.escape(str(v))
def card(t, asset_prefix):
    return f'''<a class="trip-card" href="https://app.longwaveboards.com/"><div class="trip-image"><img src="{esc(asset_prefix + t['image'])}" alt="{esc(t['title'])}" loading="lazy" width="720" height="480"><span class="trip-category">{esc(t['category'])}</span></div><div class="trip-body"><p class="trip-place">{esc(t['place'])}</p><h3>{esc(t['title'])}</h3><p class="trip-date">{esc(t['dates'])}</p><p class="trip-age">{esc(t['age'])}</p><div class="trip-foot"><strong class="trip-price">{esc(t['priceLabel'])}</strong><span class="trip-status">{esc(t['status'])}</span><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></div></div></a>'''
data=json.loads(get('https://app.longwaveboards.com/api/offers'))
items=[]
for o in data['offers']:
    slug=o.get('image','')
    if not re.fullmatch(r'[a-zA-Z0-9_-]+',slug): continue
    image='assets/offers/'+slug+'.webp'
    target=ROOT/image; target.parent.mkdir(exist_ok=True)
    target.write_bytes(get('https://app.longwaveboards.com/assets/'+slug+'.webp'))
    variants=o.get('price_variants',[])
    if isinstance(variants,str): variants=json.loads(variants)
    price=min([v['price'] for v in variants]) if variants else o.get('promo_price') or o['price']
    for t in o.get('terms',[]):
        if t['end_date'] < datetime.now(timezone.utc).date().isoformat(): continue
        start=datetime.fromisoformat(t['start_date']); end=datetime.fromisoformat(t['end_date'])
        items.append(dict(title=o['title'],place=o['place'],category=o['category'],image=image,start=t['start_date'],end=t['end_date'],dates=f'{start:%d.%m} – {end:%d.%m.%Y}',age='Każdy wiek' if o.get('age_unrestricted') else f"{o['age_min']}–{o['age_max']} lat",priceLabel=('od ' if variants else '')+f'{price/100:g} zł',status='Dostępne' if t.get('available') else 'Sprawdź dostępność'))
items.sort(key=lambda t:t['start'])
payload=dict(updatedAt=datetime.now(timezone.utc).isoformat(),items=items)
(ROOT/'offers.json').write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
for page, asset_prefix in ((ROOT/'index.html', ''), (ROOT/'amigos/index.html', '../')):
    markup = ''.join(card(term, asset_prefix) for term in items[:3])
    if not markup:
        markup = '<p>Sprawdź kolejne terminy w aplikacji LONGWAVE.</p>'
    content = page.read_text(encoding='utf-8')
    updated = re.sub(
        r'<!-- OFFERS_START -->.*?<!-- OFFERS_END -->',
        lambda _: '<!-- OFFERS_START -->' + markup + '<!-- OFFERS_END -->',
        content,
        flags=re.S,
    )
    page.write_text(updated, encoding='utf-8')
print(f'Synchronized {len(items)} terms')
