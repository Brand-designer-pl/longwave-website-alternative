#!/usr/bin/env python3
"""Run from the repository root. Master stays in the private project sources."""
import subprocess,time,json
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description='Encode the complete festival film: 1080p desktop and native portrait mobile.')
parser.add_argument('--ffmpeg',default='ffmpeg')
args=parser.parse_args()
ff=args.ffmpeg
src=next(Path('../strona-www/sources').rglob('FESTIWALOWE ROZPOCZE*Z LONGWAVE .mov'))
outdir=Path('dist/amigos'); result=[]
for name,vf,rate,cap,crf in [('desktop','scale=1920:1080:flags=lanczos',1400,1600,32),('mobile','crop=1216:2160:1312:0,scale=608:1080:flags=lanczos',500,650,33)]:
 for codec,ext in [('libvpx-vp9','webm'),('libx264','mp4')]:
  out=outdir/f'festival-hq-{name}.{ext}'
  opts=['-deadline','good','-cpu-used','3','-row-mt','1','-tile-columns','2','-b:v',f'{rate}k','-maxrate',f'{cap}k','-bufsize',f'{cap*2}k','-crf',str(crf)] if ext=='webm' else ['-preset','slow','-crf','25','-maxrate',f'{cap}k','-bufsize',f'{cap*2}k','-movflags','+faststart']
  start=time.time()
  subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-i',str(src),'-an','-map_metadata','-1','-vf',vf+',setsar=1','-c:v',codec,*opts,'-threads','4','-g','50','-pix_fmt','yuv420p',str(out)],check=True)
  result.append({'file':str(out),'bytes':out.stat().st_size,'seconds':round(time.time()-start,1)})
  print(result[-1],flush=True)
print(json.dumps(result,indent=2))
