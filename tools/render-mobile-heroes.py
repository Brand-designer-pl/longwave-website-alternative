#!/usr/bin/env python3
"""Render approved portrait edits; full source videos stay outside Git."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('locations', nargs='*')
parser.add_argument('--ffmpeg', default='ffmpeg')
args = parser.parse_args()
recipes = json.loads((ROOT / 'sources/hero-mobile/edits.json').read_text())
for slug in args.locations or recipes:
    edit = recipes[slug]
    source = ROOT / 'sources/hero-mobile' / edit['source']
    output = ROOT / 'dist/amigos/wyjazdy' / slug
    width, height = edit['size']
    with tempfile.TemporaryDirectory(prefix='longwave-edit-') as tmp:
        clips = []
        for i, shot in enumerate(edit['shots']):
            clip = Path(tmp) / f'{i}.mp4'
            crop = ':'.join(map(str, shot['crop']))
            filters = f"crop={crop},scale={width}:{height}:flags=lanczos,setsar=1,setpts=(PTS-STARTPTS)/{edit['speed']},fps={edit['fps']}"
            subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                '-ss', str(shot['start']), '-t', str(shot['duration']), '-i', str(source),
                '-an', '-vf', filters, '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-maxrate', '1100k', '-bufsize', '1600k',
                '-pix_fmt', 'yuv420p', '-profile:v', 'main', '-level:v', '3.1',
                '-g', '48', '-movflags', '+faststart', str(clip)], check=True)
            clips.append(clip)
        listing = Path(tmp) / 'concat.txt'
        listing.write_text(''.join(f"file '{p}'\n" for p in clips))
        video = output / 'hero-mobile.mp4'
        subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'concat', '-safe', '0', '-i', str(listing), '-c', 'copy', '-an',
            '-movflags', '+faststart', str(video)], check=True)
        subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
            '-ss', str(edit['poster_time']), '-i', str(video), '-frames:v', '1',
            '-c:v', 'libwebp', '-quality', '82', str(output / 'hero-mobile.webp')], check=True)
        print(slug, video.stat().st_size, 'bytes')
