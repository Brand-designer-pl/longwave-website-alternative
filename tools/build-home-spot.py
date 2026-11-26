"""Build the dedicated Home Spot 2.0 teaser, preserving shared navigation/footer."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
p = ROOT / 'dist/amigos/noclegi/home-spot-2-0/index.html'
s = p.read_text()
s, n = re.subn(r'<main id="main">.*?</main>', (ROOT/'sources/home-spot-2.html').read_text().strip(), s, count=1, flags=re.S)
assert n == 1
s = s.replace('<body>', '<body class="homespot-page">')
s = re.sub(r'<link rel="stylesheet" href="../../place-photos.css[^\"]*">', '', s)
s = re.sub(r'<script defer src="../../motion.js[^\"]*"></script>', '', s)
s = re.sub(r'<link rel="stylesheet" href="../../home-spot.css[^\"]*">', '', s)
s = re.sub(r'<script defer src="../../home-spot.js[^\"]*"></script>', '', s)
for vendor in ('gsap.min.js', 'ScrollTrigger.min.js'):
 if vendor not in s:
  s = s.replace('</head>', f'<script defer src="../../../vendor/{vendor}"></script></head>')
s = s.replace('</head>', '<link rel="stylesheet" href="../../home-spot.css?v=20261126"><script defer src="../../home-spot.js?v=20261126"></script></head>')
p.write_text(s)
print('Built Home Spot 2.0')
