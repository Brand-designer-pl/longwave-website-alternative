"""Render the owner-selected source reviews into semantic, no-JS homepage HTML."""
from pathlib import Path
import html,json,re
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'sources/reviews.json').read_text())
esc=lambda s:html.escape(str(s),quote=True)
star='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3L3.2 9.4l6.3-.9Z"/></svg>'
def card(r):
 parts=r['author'].split()
 initials=parts[0][0]+(parts[-1][0] if len(parts)>1 else '')
 return f'''<figure class="review-card"><figcaption><span class="review-avatar" aria-hidden="true">{esc(initials)}</span><span><strong>{esc(r['author'])}</strong><span class="review-origin">Opinia z {esc(data['sourceLabel'])}</span></span></figcaption><div class="review-stars" role="img" aria-label="Ocena {r['rating']} na 5">{star*r['rating']}</div><blockquote><p>{esc(r['text'])}</p></blockquote></figure>'''
rows='\n'.join('<div class="reviews-row"><div class="reviews-track"><div class="reviews-set">'+''.join(card(r) for r in data['reviews'][i::2])+'</div></div></div>' for i in range(2))
markup=f'''<section class="wrap section reviews-section" id="opinie" aria-labelledby="reviews-title">
    <div class="section-heading"><div><p class="kicker">Wasze opinie</p><h2 id="reviews-title">GŁOSY<br>LONGWAVE</h2></div><div class="reviews-intro"><p>Głosy rodziców i uczestników naszych wyjazdów.</p><a class="reviews-source" href="o-longwave/opinie/">Opinie opublikowane na {esc(data['sourceLabel'])}<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15"/></svg></a></div></div>
    <div class="reviews-actions" hidden><button class="pill review-pause" type="button" aria-pressed="false" aria-controls="reviews-wall"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg><span>Zatrzymaj przewijanie</span></button><button class="reviews-read-all" type="button" aria-pressed="false" aria-controls="reviews-wall">Pokaż wszystkie opinie</button></div>
    <div class="reviews-wall" id="reviews-wall">{rows}</div>
  </section>'''
p=ROOT/'dist/amigos/index.html';s=p.read_text()
if '<!-- REVIEWS_START -->' not in s:
 s=s.replace('  <section class="wrap section" id="aplikacja">','  <!-- REVIEWS_START --><!-- REVIEWS_END -->\n  <section class="wrap section" id="aplikacja">')
s=re.sub(r'<!-- REVIEWS_START -->.*?<!-- REVIEWS_END -->',lambda _: '<!-- REVIEWS_START -->'+markup+'<!-- REVIEWS_END -->',s,flags=re.S)
p.write_text(s)
