"""Original LONGWAVE line art: matching static SVG and Lottie trim-path assets."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'dist/amigos/art'

def path(start, curves, closed=False):
    vertices = [list(start)]; incoming = [[0, 0]]; outgoing = []
    for c1, c2, end in curves:
        prev = vertices[-1]
        outgoing.append([c1[0]-prev[0], c1[1]-prev[1]])
        vertices.append(list(end)); incoming.append([c2[0]-end[0], c2[1]-end[1]])
    outgoing.append([0, 0])
    d = f'M{start[0]} {start[1]}' + ''.join(f'C{a[0]} {a[1]} {b[0]} {b[1]} {c[0]} {c[1]}' for a,b,c in curves) + ('Z' if closed else '')
    return d, dict(v=vertices, i=incoming, o=outgoing, c=closed)

def line(a, b): return path(a, [(a,b,b)])
wave = [
    path((12,66), [((26,66),(31,52),(45,54)),((57,56),(59,66),(70,64)),((78,62),(83,57),(91,58))]),
    path((27,53), [((33,22),(65,16),(73,32)),((78,43),(68,51),(60,44)),((54,39),(59,32),(64,34)),((57,24),(42,36),(43,46))]),
    path((16,77), [((30,77),(33,68),(45,70)),((58,73),(59,78),(70,76)),((80,74),(82,69),(94,70))])]
sun = [path((30,58), [((30,29),(70,29),(70,58))]), line((16,61),(84,61)),
       path((24,73), [((35,66),(42,80),(53,73)),((62,67),(67,75),(77,71))]),
       line((50,18),(50,25)), line((25,27),(30,33)), line((75,27),(70,33)),line((14,46),(22,48)),line((86,46),(78,48))]
board = [path((72,15), [((44,21),(24,58),(28,82)),((48,78),(76,45),(72,15))],True),
         path((68,23), [((58,42),(42,61),(32,76))]),
         path((27,84), [((15,95),(12,81),(20,78))]),
         path((55,75), [((67,68),(70,82),(83,75))])]
for name, paths in [('wave',wave), ('sun',sun), ('board',board)]:
    shapes = [{'ty':'sh','ks':{'a':0,'k':shape},'nm':f'{name}-{i}'} for i,(_,shape) in enumerate(paths)]
    shapes += [{'ty':'st','c':{'a':0,'k':[.157,.486,.514,1]},'o':{'a':0,'k':100},'w':{'a':0,'k':2.3},'lc':2,'lj':2},
               {'ty':'tm','s':{'a':0,'k':0},'e':{'a':1,'k':[{'t':0,'s':[18],'e':[100],'o':{'x':[.3],'y':[0]},'i':{'x':[.6],'y':[1]}},{'t':89,'s':[100]}]},'o':{'a':0,'k':0},'m':1}]
    transform = {k:{'a':0,'k':v} for k,v in {'o':100,'r':0,'p':[0,0,0],'a':[0,0,0],'s':[100,100,100]}.items()}
    data = dict(v='5.13.0',fr=30,ip=0,op=90,w=100,h=100,nm='LONGWAVE '+name,ddd=0,assets=[],layers=[dict(ddd=0,ind=1,ty=4,nm=name,sr=1,ks=transform,ao=0,shapes=shapes,ip=0,op=90,st=0,bm=0)])
    (ROOT / f'{name}.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#287c83" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + ''.join(f'<path d="{d}"/>' for d,_ in paths) + '</svg>\n'
    (ROOT / f'{name}.svg').write_text(svg)
