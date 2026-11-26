"""Build the homepage from the 0471ef0cc78bf239 client brief and public offer data."""
import json
from pathlib import Path
from home_offers import render

ROOT=Path(__file__).resolve().parents[1]

def build():
    terms=json.loads((ROOT/'dist/offers.json').read_text())['items']
    calendar,featured=render(terms)
    html=(ROOT/'sources/homepage.html').read_text()
    for key,value in [('HOME_TIMELINE',calendar),('HOME_FEATURED',featured)]:
        html=html.replace('{{'+key+'}}',value)
    (ROOT/'dist/amigos/index.html').write_text(html)
    print('Built homepage: brief 0471ef0cc78bf239')

if __name__=='__main__': build()
