# -*- coding: utf-8 -*-
"""Reels motoru: sahne başına bir görsel (1080x1920) → sahne başına bir mp4 (içinde kısa geçiş) → birleştirme.
Ses yok (sessiz AAC izi eklenir; paylaşırken Instagram'dan müzik seçilir)."""
import os, subprocess, shutil
from playwright.sync_api import sync_playwright
from motor import LOGO_ISARET, LOGO_YAZI

CSS = r'''
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
.r { width: 1080px; height: 1920px; position: relative; overflow: hidden; color: #fff;
     background: radial-gradient(120% 80% at 85% 0%, #4A2210 0%, #20140E 46%, #120C09 100%);
     padding: 300px 150px 360px 90px; display: flex; flex-direction: column; justify-content: center; }
.r.acik { background: #FBF9F6; color: #211A2E; }
.r .logo { position: absolute; top: 190px; left: 90px; display: flex; align-items: center; gap: 14px; }
.r .logo img.i { height: 74px; width: 74px; border-radius: 50%; background: #fff; } .r .logo .m { font: 700 42px/1 Poppins; color: #fff; }
.r.acik .logo .m { color: #F85300; }
.r .etiket { position: absolute; top: 205px; right: 150px; font: 700 26px Inter; letter-spacing: .1em; padding: 14px 22px 13px;
             border-radius: 999px; background: rgba(255,255,255,.14); }
.r.acik .etiket { background: #F85300; color: #fff; }
.r .desen { position: absolute; right: -40px; top: -40px; opacity: .9; }
h1 { font: 700 118px/1.04 Poppins, sans-serif; margin: 0; letter-spacing: -.01em; text-wrap: balance; }
h2 { font: 700 86px/1.1 Poppins, sans-serif; margin: 0 0 30px; text-wrap: balance; }
p { font: 600 60px/1.32 Inter, sans-serif; margin: 0; }
p + p { margin-top: 28px; }
.v { color: #FF7A2E; } .r.acik .v { color: #F85300; }
.y { color: #FF6B6B; } .g { color: #8EE07A; }
.kucuk { font: 600 44px/1.35 Inter; opacity: .85; }
.kart { background: rgba(255,255,255,.1); border: 4px solid rgba(255,255,255,.22); border-radius: 36px; padding: 40px 44px; }
.r.acik .kart { background: #fff; border-color: #EDE7EF; }
.kart + .kart { margin-top: 26px; }
sub { font-size: .6em; vertical-align: -.22em; line-height: 0; } sup { font-size: .6em; vertical-align: .6em; line-height: 0; }
.cizgi { height: 10px; width: 180px; border-radius: 6px; background: #F85300; margin: 40px 0; }
.satir { display: flex; align-items: center; gap: 30px; }
.liste { display: grid; gap: 30px; }
.liste .o { display: flex; gap: 26px; align-items: flex-start; font: 600 58px/1.3 Inter; }
.liste .o .n { flex: none; width: 76px; height: 76px; border-radius: 50%; background: #F85300; color: #fff; display: grid; place-items: center; font: 700 40px Poppins; margin-top: -2px; }
'''


def sahne(icerik, etiket='', acik=False, desen=''):
    return (f'<section class="r{" acik" if acik else ""}">{desen}<div class="logo"><img class="i" src="{LOGO_ISARET}"><span class="m">kimyamed</span></div>'
            + (f'<span class="etiket">{etiket}</span>' if etiket else '') + f'<div>{icerik}</div></section>')


def gorselleri_bas(sahneler, klasor, onek):
    os.makedirs(klasor, exist_ok=True)
    html = os.path.join(klasor, onek + '.html')
    with open(html, 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' + ''.join(sahneler) + '</body></html>')
    yollar = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
        pg.goto('file://' + html); pg.wait_for_timeout(400); pg.evaluate('document.fonts.ready')
        tasma = pg.evaluate('''() => [...document.querySelectorAll('section.r')].map((s, i) => {
            const d = s.lastElementChild; const r = d.getBoundingClientRect(); const sr = s.getBoundingClientRect();
            return (r.top - sr.top < 270 || sr.bottom - r.bottom < 330 || d.scrollWidth > d.clientWidth + 2) ? (i + 1) + ': güvenli alan dışı (' + Math.round(r.top - sr.top) + '/' + Math.round(sr.bottom - r.bottom) + ')' : null; }).filter(Boolean)''')
        for i, el in enumerate(pg.query_selector_all('section.r'), 1):
            y = os.path.join(klasor, f'{onek}-{i:02d}.png')
            el.screenshot(path=y); yollar.append(y)
        b.close()
    return yollar, tasma


def _calistir(komut):
    r = subprocess.run(komut, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-1500:])


def videoya_cevir(yollar, sureler, hedef, gecis=0.3):
    """her sahne kendi dosyası; sahne i, önceki görselden kısa bir geçişle başlar"""
    klasor = os.path.dirname(hedef)
    gecici = os.path.join(klasor, '_sahneler'); os.makedirs(gecici, exist_ok=True)
    ortak = ['-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', '-video_track_timescale', '30000']
    dosyalar = []
    for i, (y, d) in enumerate(zip(yollar, sureler)):
        cikis = os.path.join(gecici, f's{i:02d}.mp4'); tmp = cikis + '.tmp.mp4'
        if i == 0:
            komut = ['ffmpeg', '-y', '-framerate', '30', '-i', y, '-vf', f'format=yuv420p,loop=-1:1,trim=duration={d},fade=t=in:st=0:d=0.25', *ortak, tmp]
        else:
            onceki = yollar[i - 1]
            komut = ['ffmpeg', '-y', '-framerate', '30', '-i', onceki, '-framerate', '30', '-i', y,
                     '-filter_complex', f'[0]format=yuv420p,loop=-1:1,trim=duration={gecis}[a];[1]format=yuv420p,loop=-1:1,trim=duration={d}[b];[a][b]xfade=transition=fade:duration={gecis}:offset=0[v]',
                     '-map', '[v]', *ortak, tmp]
        _calistir(komut)
        os.replace(tmp, cikis); dosyalar.append(cikis)
    liste = os.path.join(gecici, 'liste.txt')
    with open(liste, 'w') as f:
        f.writelines(f"file '{d}'\n" for d in dosyalar)
    sessiz = os.path.join(gecici, 'birlesik.mp4')
    _calistir(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', sessiz + '.tmp.mp4'])
    os.replace(sessiz + '.tmp.mp4', sessiz)
    toplam = sum(sureler)
    _calistir(['ffmpeg', '-y', '-i', sessiz, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', f'{toplam}', '-map', '0:v', '-map', '1:a',
               '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', hedef + '.tmp.mp4'])
    os.replace(hedef + '.tmp.mp4', hedef)
    shutil.rmtree(gecici, ignore_errors=True)
    return hedef
