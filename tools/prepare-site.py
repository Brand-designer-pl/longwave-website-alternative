"""Prepare metadata for the GitHub Pages preview.
Production indexing, canonical URLs and sitemap require an approved final domain.
"""
import html,json,re
from pathlib import Path
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parents[1]
# Tag only directional arrows inside actions; leave account/menu/section icons alone.
ARROW_PATHS={
 'M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15',
 'M12 4v16m-6-6 6 6 6-6',
 'M4 12C8 11 14 13 20 12M14 5C16 8 18 10 20 12C18 14 16 16 14 19',
 'M20 12C15 11 10 13 4 12M10 5C8 8 6 10 4 12C6 14 8 16 10 19',
 'M19 12C15 11 10 13 4 12M10 5C8 8 6 10 4 12C6 14 8 16 10 19'}
def mark_action_arrows(text):
 def action(match):
  def svg(icon):
   value=icon[0]
   paths=re.findall(r'<path[^>]* d="([^"]+)"',value)
   if not (any(d in ARROW_PATHS for d in paths) or 'location-icons.svg#arrow' in value):return value
   tag=value.split('>',1)[0]
   if re.search(r'class="[^"]*\baction-arrow\b',tag):return value
   if 'class="' in tag:return value.replace('class="','class="action-arrow ',1)
   return value.replace('<svg','<svg class="action-arrow"',1)
  return re.sub(r'<svg\b[^>]*>.*?</svg>',svg,match[0],flags=re.S)
 return re.sub(r'<(a|button)\b[^>]*>.*?</\1>',action,text,flags=re.S)

def prepare():
 output=ROOT/'dist'
 settings=json.loads((ROOT/'sources/site-settings.json').read_text())
 base=settings['preview_url'].rstrip('/')+'/'
 urls=[]
 for file in sorted((output/'amigos').rglob('index.html')):
  route=file.parent.relative_to(output/'amigos').as_posix();route='' if route=='.' else route+'/'
  url=urljoin(base,route);text=file.read_text()
  text=text.replace('<span>Panel uczestnika<small>Aplikacja LONGWAVE</small></span>','<span class="account-label-full">Panel uczestnika<small>Aplikacja LONGWAVE</small></span><svg class="icon account-user" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg><span class="account-label-short">Panel</span>')
  text=re.sub(r'editorial\.css\?v=[^\"\']+','editorial.css?v=arrow-turn-20261126',text)
  text=text.replace('M5 19 19 5M5 5h14v14','M4 20C8 18 13 11 20 4M9 4C13 5 17 4 20 4C19 8 20 12 19 15')
  text=re.sub(r'editorial\.js\?v=[^\"\']+','editorial.js?v=smooth-scroll-20261126',text)
  text=text.replace('M19 12H5m7-7-7 7 7 7','M20 12C15 11 10 13 4 12M10 5C8 8 6 10 4 12C6 14 8 16 10 19')
  text=text.replace('M5 12h14m-7-7 7 7-7 7','M4 12C8 11 14 13 20 12M14 5C16 8 18 10 20 12C18 14 16 16 14 19')
  text=mark_action_arrows(text)
  text=re.sub(r'<link\b[^>]*rel=[\"\']canonical[\"\'][^>]*>','',text)
  text=re.sub(r'<meta\b[^>]*(?:property|name)=[\"\']og:url[\"\'][^>]*>','',text)
  text=re.sub(r'<meta\b[^>]*name=[\"\']robots[\"\'][^>]*>','',text)
  tags='<meta name="robots" content="'+'noindex,nofollow'+'"><link rel="canonical" href="'+html.escape(url,quote=True)+'"><meta property="og:url" content="'+html.escape(url,quote=True)+'">'
  head,body=text.split('</head>',1)
  head=re.sub(r'(?m)^[ \t]+$', '', head)
  text=head+tags+'</head>'+body;file.write_text(text);urls.append(url)
 robots='User-agent: *\nAllow: /\n'
 (output/'robots.txt').write_text(robots)
 (output/'404.html').write_text('<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Nie znaleziono strony | LONGWAVE</title><style>body{margin:0;background:#f1f3f5;color:#14333c;font-family:Arial,sans-serif}main{max-width:760px;margin:15vh auto;padding:28px}h1{font-size:clamp(2.5rem,7vw,5rem);letter-spacing:-.05em}p{line-height:1.8}a{display:inline-block;border-radius:100px;background:#101010;color:white;padding:18px 28px;text-decoration:none}a:focus-visible{outline:3px solid #287c83;outline-offset:5px}</style></head><body><main><p>LONGWAVE · 404</p><h1>Ta fala prowadzi gdzie indziej.</h1><p>Nie znaleźliśmy strony pod tym adresem. Wróć do LONGWAVE i wybierz swoją kolejną przygodę.</p><a href="'+html.escape(base,quote=True)+'">Wróć na stronę główną</a></main></body></html>')
 return len(urls)
if __name__=='__main__':
 print('Prepared',prepare(),'preview pages')
