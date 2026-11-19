"""Distinct layouts for the six brief additions; public copy stays in content-pages.json."""
from html import escape as E

KINDS = {
 'wyjazdy/dla-szkol-i-grup':'schools', 'o-longwave/bezpieczenstwo':'care',
 'o-longwave/ekipa':'crew', 'o-longwave/club':'club', 'kontakt':'contact', 'faq':'answers'
}

def render_support(p, hero, photo, pill, arrow):
 r=p['route']; kind=KINDS[r]; d=p['design']
 def image(key, cls='', caption=True):
  im=d[key]
  return '<figure class="support-photo '+cls+'">'+photo(r,im['src'],im['alt'])+('<figcaption>'+E(im['caption'])+'</figcaption>' if caption and im.get('caption') else '')+'</figure>'
 def paragraphs():return ''.join('<p>'+E(t)+'</p>' for t in p['paragraphs'])
 def heading(text,kicker=''):return ('<p class="kicker">'+E(kicker)+'</p>' if kicker else '')+'<h2>'+E(text)+'</h2>'
 def intro(cls=''):
  return '<section class="wrap section support-story '+cls+'" id="szczegoly"><div>'+heading(p['heading'],d['eyebrow'])+'</div><div class="story-copy">'+paragraphs()+'</div></section>'
 def note(s):return '<section class="support-note" id="'+E(s['id'])+'"><div class="wrap section">'+heading(s['title'],'Dobrze wiedzieć')+'<p>'+E(s['text'])+'</p></div></section>'
 def action():
  return '<section class="support-outro" id="kontakt-strony"><div class="wrap section"><div><p class="kicker">'+E(d.get('outroKicker','Porozmawiajmy'))+'</p><h2>'+E(d['outro'])+'</h2></div>'+pill(r,*p['cta'])+'</div></section>' if p.get('cta') else ''
 def numbered(s):
  return '<ol class="story-list">'+''.join('<li><span class="story-number" aria-hidden="true">'+f'{i+1:02}'+'</span><div><h3>'+E(it['title'])+'</h3><p>'+E(it['text'])+'</p></div></li>' for i,it in enumerate(s['items']))+'</ol>'
 body=hero(r,p['title'],p['kicker'],p['lead'],p['image'])
 if kind=='schools':
  body+=intro()
  body+='<section class="school-journal"><div class="wrap section"><div class="story-spread">'+image('wide')+image('portrait')+'</div><p class="journal-caption">'+E(d['caption'])+'</p></div></section>'
  s=p['sections'][0]
  body+='<section class="wrap section school-planning" id="'+E(s['id'])+'"><div>'+heading(s['title'],'Od pomysłu do wspólnego wyjazdu')+'<p>'+E(s['text'])+'</p></div>'+numbered(s)+'</section>'+note(p['sections'][1])
 elif kind=='care':
  body+=intro()
  s=p['sections'][0]
  body+='<section class="care-checklist" id="'+E(s['id'])+'"><div class="wrap section care-grid"><div class="care-visual">'+image('portrait')+'<p class="photo-note">'+E(d['photoNote'])+'</p></div><div>'+heading(s['title'],'Przed wyjazdem')+'<p class="story-lead">'+E(s['text'])+'</p>'+numbered(s)+'</div></div></section>'+note(p['sections'][1])
 elif kind=='crew':
  body+='<section class="wrap section crew-story support-story" id="szczegoly"><div class="crew-title">'+heading(p['heading'],d['eyebrow'])+'</div>'+image('portrait')+'<div class="story-copy">'+paragraphs()+'</div></section>'
  body+='<section class="crew-album" id="galeria"><div class="wrap section">'+heading('Każdy wnosi coś od siebie.','Ludzie LONGWAVE')+'<div class="crew-frames">'+image('wide')+image('detail')+'</div></div></section>'
 elif kind=='club':
  body+='<section class="club-story" id="szczegoly"><div class="wrap section club-grid"><div class="support-story">'+heading(p['heading'],d['eyebrow'])+'<div class="story-copy">'+paragraphs()+'</div>'+pill(r,*p['cta'])+'</div><div class="club-photo">'+image('portrait')+'<span class="club-stamp" aria-hidden="true">LONGWAVE<br>poza sezonem.<br>bez przerwy.</span></div></div></section>'
  s=p['sections'][0]
  body+='<section class="wrap section club-how" id="'+E(s['id'])+'">'+heading(s['title'],'Twój kolejny krok')+'<p class="story-lead">'+E(s['text'])+'</p><div class="club-steps">'+''.join('<article><span class="story-number" aria-hidden="true">'+f'{i+1:02}'+'</span><h3>'+E(it['title'])+'</h3><p>'+E(it['text'])+'</p></article>' for i,it in enumerate(s['items']))+'</div></section>'
  body+='<div class="wrap club-panorama">'+image('wide')+'</div>'+note(p['sections'][1])
 elif kind=='contact':
  body+='<section class="wrap section contact-desk" id="szczegoly"><div>'+heading(p['heading'],'Najprościej — bezpośrednio')+'<a class="contact-email" href="mailto:info@longwaveboards.com">info@<wbr>longwaveboards.com'+arrow+'</a>'+pill(r,'+48 882 334 889','tel:+48882334889')+'</div><div class="story-copy">'+paragraphs()+'</div></section>'
  s=p['sections'][0]
  body+='<section class="contact-topics" id="'+E(s['id'])+'"><div class="wrap section"><div class="contact-topic-heading">'+heading(s['title'],'Wybierz temat')+'<p>'+E(s['text'])+'</p></div><div class="contact-topic-grid">'+''.join('<a class="contact-topic" href="'+E(it['href'],quote=True)+'"><span class="kicker">'+f'{i+1:02}'+'</span><div><h3>'+E(it['title'])+'</h3><p>'+E(it['text'])+'</p><span class="topic-label">'+E(it['label'])+'</span></div>'+arrow+'</a>' for i,it in enumerate(s['items']))+'</div></div></section>'
  body+='<section class="wrap section contact-photo-row">'+image('wide')+'<div>'+heading('Do zobaczenia nad wodą.','LONGWAVE')+'<p>Na wyjeździe, podczas wydarzenia albo w naszym Home Spocie. Zacznijmy od rozmowy.</p></div></section>'
 elif kind=='answers':
  body+='<section class="wrap section answer-guide" id="szczegoly"><aside class="answer-aside">'+heading(p['heading'],'Przewodnik przed wyjazdem')+image('portrait',caption=False)+'<nav aria-label="Kategorie pytań"><a href="#faq-wyjazdy">Wyjazdy i zapisy '+arrow+'</a><a href="#faq-noclegi">Noclegi '+arrow+'</a><a href="#faq-nowy-spot">Home Spot 2.0 '+arrow+'</a></nav></aside><div class="answer-content"><div class="story-copy">'+paragraphs()+'</div><div id="pytania">'
  for start,end,id_,title in [(0,7,'faq-wyjazdy','Wyjazdy i zapisy'),(7,10,'faq-noclegi','Noclegi'),(10,11,'faq-nowy-spot','Home Spot 2.0')]:
   body+='<section class="answer-group" id="'+id_+'"><h2>'+title+'</h2>'+''.join('<details><summary>'+E(q['question'])+'<span class="answer-toggle" aria-hidden="true"></span></summary><p>'+E(q['answer'])+'</p></details>' for q in p['faq'][start:end])+'</section>'
  body+='</div></div></section>'
 body+=action()
 # Compact navigation avoids another identical three-photo catalogue on every information page.
 body+='<nav class="support-next wrap" aria-label="Dalej w LONGWAVE"><span class="kicker">Odkryj więcej</span>'+''.join(pill(r,label,url) for label,url in d['next'])+'</nav>'
 return body
