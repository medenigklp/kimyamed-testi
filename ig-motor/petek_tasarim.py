# -*- coding: utf-8 -*-
"""kimyamed'e özgü video tasarımı önerisi: 'Petek'. Koyu laboratuvar zemini, markanın altıgen dokusu,
bilgiler altıgen hücrelerde yanar ve molekül gibi bağlarla birbirine bağlanır. 4 örnek kare."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import LOGO_ISARET
from seri_kimya import kucuk_simge, piktogram, atom

KOK = os.path.dirname(os.path.abspath(__file__))
ZEMIN, ZEMIN2, TUR, TURK, BEYAZ, SOLUK, KIRMIZI = '#0C1320', '#121C2E', '#F85300', '#33D1C6', '#F6F2EE', '#8D97A6', '#FF4D3D'

CSS = f'''
* {{ box-sizing: border-box; }} html, body {{ margin: 0; background: #000; }}
.p {{ width: 1080px; height: 1920px; position: relative; overflow: hidden; color: {BEYAZ}; font-family: Inter, sans-serif;
     background: radial-gradient(1200px 900px at 85% 8%, rgba(248,83,0,.22), transparent 60%),
                 radial-gradient(900px 900px at 0% 100%, rgba(51,209,198,.10), transparent 60%), linear-gradient(180deg, {ZEMIN2}, {ZEMIN}); }}
.p .izgara {{ position: absolute; inset: 0; }}
.p .ust {{ position: absolute; left: 84px; right: 84px; top: 120px; display: flex; align-items: center; gap: 18px; }}
.p .ust .rozet {{ font: 800 30px/1 Poppins; letter-spacing: .02em; }}
.p .ust .rozet span {{ color: {TUR}; }}
.p .ust .bolum {{ margin-left: auto; font: 700 24px Inter; letter-spacing: .18em; color: {SOLUK}; }}
.p .ilerleme {{ position: absolute; left: 84px; right: 84px; top: 196px; display: flex; gap: 12px; }}
.p .baslik {{ position: absolute; left: 84px; right: 84px; top: 270px; font: 800 70px/1.08 Poppins; letter-spacing: -.01em; }}
.p .baslik small {{ display: block; font: 700 26px Inter; letter-spacing: .2em; color: {TUR}; margin-bottom: 14px; }}
.p .altyazi {{ position: absolute; left: 110px; right: 110px; top: 1260px; text-align: center; font: 800 62px/1.25 Poppins; text-wrap: balance;
              text-shadow: 0 4px 24px rgba(0,0,0,.45); }}
.p .altyazi em {{ font-style: normal; color: {TUR}; }}
.p .imza {{ position: absolute; left: 0; right: 0; bottom: 330px; text-align: center; font: 700 26px Inter; color: {SOLUK}; letter-spacing: .12em; }}
'''


def hex_noktalar(cx, cy, r, duz=False):
    a0 = 0 if duz else -90
    return ' '.join(f'{cx + r * math.cos(math.radians(a0 + 60 * k)):.1f},{cy + r * math.sin(math.radians(a0 + 60 * k)):.1f}' for k in range(6))


def izgara():
    r, w = 54, 54 * math.sqrt(3)
    p = []
    for sira in range(-1, 26):
        for sut in range(-1, 12):
            cx = sut * w + (w / 2 if sira % 2 else 0); cy = sira * r * 1.5
            uz = math.hypot((cx - 900) / 1080, (cy - 150) / 1920)
            op = max(0.025, 0.11 - uz * 0.12)
            p.append(f'<polygon points="{hex_noktalar(cx, cy, r - 2)}" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity="{op:.3f}"/>')
    return f'<svg class="izgara" width="1080" height="1920" viewBox="0 0 1080 1920">{"".join(p)}</svg>'


def ilerleme(bolum, toplam=6):
    h = ''
    for k in range(toplam):
        dolu = k < bolum
        h += (f'<svg width="34" height="38" viewBox="0 0 34 38"><polygon points="{hex_noktalar(17, 19, 16)}" fill="{TUR if dolu else "none"}" '
              f'stroke="{TUR if dolu else "rgba(255,255,255,.25)"}" stroke-width="3"/></svg>')
    return f'<div class="ilerleme">{h}<div style="flex:1; align-self:center; height:4px; background:linear-gradient(90deg, {TUR} {bolum / toplam * 100:.0f}%, rgba(255,255,255,.12) 0)"></div></div>'


def ust(bolum, ilerleme_no):
    rozet = (f'<svg width="64" height="70" viewBox="0 0 64 70"><polygon points="{hex_noktalar(32, 35, 30)}" fill="{TUR}"/>'
             f'<text x="32" y="44" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="24" fill="#fff">1dk</text></svg>')
    return (f'<div class="ust">{rozet}<div class="rozet">1 Dakikada <span>Kimya</span></div><div class="bolum">BÖLÜM {bolum}</div></div>'
            + ilerleme(ilerleme_no))


TANIM = '''<defs>
  <filter id="parla" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="cam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".10"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".03"/></linearGradient>
  <linearGradient id="tur" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A2E"/><stop offset="1" stop-color="#E24800"/></linearGradient>
</defs>'''


def molekul(yanik):
    """merkezde KİMYA, çevresinde 6 alt dal; ilk 'yanik' tanesi yanmış, bağlarla merkeze bağlı"""
    W, H, cx, cy, R, r = 1080, 860, 540, 430, 300, 106
    adlar = [('buyutec', 'Analitik', 'kimya'), ('kristal', 'Anorganik', 'kimya'), ('dna', 'Biyokimya', ''),
             ('termometre', 'Fizikokimya', ''), ('halka', 'Organik', 'kimya'), ('zincir', 'Polimer', 'kimyası')]
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">{TANIM}']
    for i in range(6):
        a = math.radians(-90 + 60 * i); x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        yan = i < yanik
        # çift bağ çizgisi
        for d in (-7, 7):
            ox, oy = -math.sin(a) * d, math.cos(a) * d
            p.append(f'<line x1="{cx + 136 * math.cos(a) + ox:.1f}" y1="{cy + 136 * math.sin(a) + oy:.1f}" x2="{x - (r + 6) * math.cos(a) + ox:.1f}" y2="{y - (r + 6) * math.sin(a) + oy:.1f}" '
                     f'stroke="{TUR if yan else "rgba(255,255,255,.12)"}" stroke-width="5" stroke-linecap="round" opacity="{1 if yan else 1}"/>')
    p.append(f'<g filter="url(#parla)"><polygon points="{hex_noktalar(cx, cy, 128)}" fill="url(#tur)"/></g>')
    p.append(f'<text x="{cx}" y="{cy + 20}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="50" fill="#fff">KİMYA</text>')
    for i, (simge, a1, a2) in enumerate(adlar):
        a = math.radians(-90 + 60 * i); x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        yan = i < yanik
        if yan:
            p.append(f'<g filter="url(#parla)" opacity=".55"><polygon points="{hex_noktalar(x, y, r)}" fill="none" stroke="{TUR}" stroke-width="6"/></g>')
        kesik = '' if yan else 'stroke-dasharray="10 10"'
        dolgu = 'url(#cam)' if yan else 'rgba(255,255,255,.025)'
        cizgi = TUR if yan else 'rgba(255,255,255,.16)'
        p.append(f'<polygon points="{hex_noktalar(x, y, r)}" fill="{dolgu}" stroke="{cizgi}" stroke-width="{4 if yan else 3}" {kesik}/>')
        if yan:
            p.append(f'<foreignObject x="{x - 100:.0f}" y="{y - 78:.0f}" width="200" height="160"><div xmlns="http://www.w3.org/1999/xhtml" '
                     f'style="display:flex; flex-direction:column; align-items:center; gap:6px; color:#F6F2EE; text-align:center">'
                     f'{kucuk_simge(simge, TUR, 50)}<div style="font:800 27px/1.05 Poppins">{a1}</div>'
                     f'<div style="font:600 24px/1 Inter; color:#B9C1CC">{a2}</div></div></foreignObject>')
    p.append('</svg>')
    return ''.join(p)


def kare(icerik, bolum_no=1, ilerleme_no=1, baslik='', ust_not='', altyazi='', serbest=False):
    if serbest:
        return f'<section class="p">{izgara()}{icerik}</section>'
    b = f'<div class="baslik"><small>{ust_not}</small>{baslik}</div>' if baslik else ''
    return (f'<section class="p">{izgara()}{ust(bolum_no, ilerleme_no)}{b}{icerik}'
            f'<div class="altyazi">{altyazi}</div></section>')


# 1) giriş
giris = f'''
<div style="position:absolute; left:0; right:0; top:300px; display:flex; justify-content:center">
  <svg width="620" height="620" viewBox="0 0 620 620">{TANIM}
    <g filter="url(#parla)" opacity=".7"><polygon points="{hex_noktalar(310, 310, 270)}" fill="none" stroke="{TUR}" stroke-width="8"/></g>
    <polygon points="{hex_noktalar(310, 310, 270)}" fill="url(#cam)" stroke="{TUR}" stroke-width="6"/>
    <polygon points="{hex_noktalar(310, 310, 222)}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2"/>
  </svg>
</div>
<div style="position:absolute; left:0; right:0; top:420px; display:flex; justify-content:center; filter:invert(1) hue-rotate(180deg) brightness(1.1)">{atom(380)}</div>
<div style="position:absolute; left:84px; right:84px; top:1010px; text-align:center">
  <div style="font:800 112px/1 Poppins; letter-spacing:-.02em">1 Dakikada<br><span style="color:{TUR}">Kimya</span></div>
  <div style="display:inline-flex; align-items:center; gap:16px; margin-top:44px; padding:16px 30px; border:2px solid rgba(255,255,255,.18); border-radius:999px; background:rgba(255,255,255,.05)">
    <span style="font:800 30px Poppins; color:{TUR}">BÖLÜM 1</span><span style="width:8px; height:8px; border-radius:50%; background:{SOLUK}"></span>
    <span style="font:700 30px Inter">Kimya bilimine giriş</span></div>
</div>
<div class="imza" style="display:flex; justify-content:center; align-items:center; gap:14px; letter-spacing:.02em; font:700 34px Poppins; color:#F6F2EE"><img src="{LOGO_ISARET}" style="width:64px; height:64px; border-radius:50%; background:#fff">kimyamed</div>'''

# 2) alt dallar (molekül)
alt_dallar = f'<div style="position:absolute; left:0; top:400px">{molekul(4)}</div>'

# 3) tuzak
tuzak = f'''
<div style="position:absolute; left:0; right:0; top:440px; display:flex; justify-content:center">
  <svg width="760" height="700" viewBox="0 0 760 700">{TANIM}
    <g filter="url(#parla)"><polygon points="{hex_noktalar(380, 300, 200)}" fill="{KIRMIZI}"/></g>
    <text x="380" y="372" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="230" fill="#fff">!</text>
  </svg>
</div>
<div style="position:absolute; left:0; right:0; top:1050px; display:flex; justify-content:center">
  <div style="position:relative; padding:24px 44px; border-radius:24px; background:rgba(255,255,255,.06); border:2px solid rgba(255,255,255,.16); font:800 56px Poppins">
    Kimyasal = zararlı
    <svg style="position:absolute; inset:-10px" width="calc(100% + 20px)" height="calc(100% + 20px)" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="3" y1="85" x2="97" y2="15" stroke="{KIRMIZI}" stroke-width="5" stroke-linecap="round"/></svg>
  </div>
</div>'''

# 4) soru + geri sayım
def sik(h, m):
    return (f'<div style="display:flex; align-items:center; gap:22px; padding:22px 28px; border-radius:22px; background:rgba(255,255,255,.06); '
            f'border:2px solid rgba(255,255,255,.14); font:700 40px Inter">'
            f'<svg width="58" height="64" viewBox="0 0 58 64"><polygon points="{hex_noktalar(29, 32, 27)}" fill="rgba(248,83,0,.16)" stroke="{TUR}" stroke-width="3"/>'
            f'<text x="29" y="42" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="28" fill="{TUR}">{h}</text></svg>{m}</div>')


siklar = ''.join(sik(h, m) for h, m in zip('ABCD', ['Biyokimya', 'Analitik kimya', 'Astronomi', 'Polimer kimyası']))
cevre = 6 * 150
soru = f'''
<div style="position:absolute; left:84px; right:84px; top:450px">
  <div style="font:800 46px/1.3 Poppins; margin-bottom:30px">Hangisi kimyanın alt dallarından biri <span style="color:{TUR}">değildir?</span></div>
  <div style="display:grid; gap:16px">{siklar}</div>
</div>
<div style="position:absolute; left:0; right:0; top:1240px; display:flex; justify-content:center">
  <svg width="300" height="300" viewBox="0 0 300 300">{TANIM}
    <polygon points="{hex_noktalar(150, 150, 130)}" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.15)" stroke-width="10"/>
    <g filter="url(#parla)"><polygon points="{hex_noktalar(150, 150, 130)}" fill="none" stroke="{TUR}" stroke-width="10" stroke-dasharray="{cevre * 2 / 3:.0f} {cevre}" stroke-linecap="round"/></g>
    <text x="150" y="190" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="120" fill="#fff">3</text>
  </svg>
</div>'''

KARELER = [
    kare(giris, serbest=True),
    kare(alt_dallar, 1, 2, 'Alt dallar', '2 · KİMYANIN DALLARI', 'biyokimya, <em>fizikokimya</em>,'),
    kare(tuzak, 1, 5, 'Tuzak!', '! · SIK YAPILAN HATA', 'Kimyasal demek <em>zararlı</em> demek değil.'),
    kare(soru, 1, 6, 'Sıra sende!', '? · 3 SANİYEN VAR', ''),
]

if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    kl = os.path.join(KOK, 'cikti', 'petek'); os.makedirs(kl, exist_ok=True)
    html = os.path.join(kl, 'petek.html')
    open(html, 'w', encoding='utf-8').write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' + ''.join(KARELER) + '</body></html>')
    yollar = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        pg.goto('file://' + html); pg.wait_for_timeout(600); pg.evaluate('document.fonts.ready')
        for i, el in enumerate(pg.query_selector_all('section.p'), 1):
            y = os.path.join(kl, f'petek-{i}.png'); el.screenshot(path=y); yollar.append(y)
        b.close()
    from PIL import Image
    ims = [Image.open(y).convert('RGB').resize((540, 960)) for y in yollar]
    S = Image.new('RGB', (4 * 540 + 5 * 20, 960 + 40), (22, 22, 26))
    for i, im in enumerate(ims):
        S.paste(im, (20 + i * 560, 20))
    S.save(os.path.join(kl, 'petek-oneri.jpg'), quality=90)
    print(yollar)
