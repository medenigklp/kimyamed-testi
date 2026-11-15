# -*- coding: utf-8 -*-
"""1 Dakikada Kimya · Bölüm 1: Kimya nedir? — Petek (açık zemin) tasarımı, öğretmenin sesiyle.
Her öğe söylenmeden hemen önce ekrana gelir (önce yazı, sonra ses)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import LOGO_ISARET
from seri_kimya import kucuk_simge, gunluk_simge, atom, dongu
from petek_acik import CSS, hex_noktalar, izgara, TANIM, TUR, KIRMIZI, SOLUK, sik
from reel import videoya_cevir, _calistir

KOK = os.path.dirname(os.path.abspath(__file__))
SES = os.path.join(os.path.dirname(KOK), 'ses-b1y', 'kayit.m4a')
KLASOR = os.path.join(KOK, 'cikti', 'petek-b1')
MUR, YESIL = '#14110F', '#2E9B4E'
BOLUM, TOPLAM_ADIM = 1, 7

# ---------- ses: satır -> kayıttaki konuşma parçaları ----------
SATIRLAR = [
    ('L1', [(3.38, 5.60)]), ('L2', [(6.17, 6.89), (7.43, 9.07)]), ('L3', [(9.83, 12.38), (12.69, 13.45)]),
    ('L4', [(14.50, 16.58)]), ('L5', [(16.79, 18.11)]), ('L6', [(18.39, 20.65)]),
    ('L7', [(21.19, 21.76), (22.09, 23.65)]), ('L8', [(24.39, 24.85), (25.60, 27.20)]),
    ('L9', [(28.04, 28.67), (29.07, 30.45)]), ('L10', [(31.62, 34.95)]),
    ('L11', [(35.64, 36.26), (37.72, 39.42)]), ('L12', [(40.92, 42.76)]),
    ('L13', [(43.75, 45.83), (46.29, 47.54), (48.04, 49.37)]),
    ('L14', [(50.24, 50.87), (51.41, 52.32)]), ('L15', [(54.42, 57.70)]), ('L16', [(58.17, 59.08), (59.45, 61.60)]),
    ('L17', [(62.21, 64.52), (65.52, 67.48), (68.32, 69.30)]),
    ('SAYAC', None),
    ('L19', [(72.66, 74.44), (76.25, 78.05)]),
]
ON, ARA_IC, ARA_SATIR, SON, PAY_ON, PAY_SON, TEMPO = 0.25, 0.22, 0.26, 1.0, 0.04, 0.08, 1.08


def _paylar():
    duz = [c for _, ps in SATIRLAR if ps for c in ps]
    out = {}
    for k, (s, e) in enumerate(duz):
        s2 = s - PAY_ON if k == 0 else max(s - PAY_ON, (duz[k - 1][1] + s) / 2)
        e2 = e + PAY_SON if k == len(duz) - 1 else min(e + PAY_SON, (e + duz[k + 1][0]) / 2)
        out[(s, e)] = (s2, e2)
    return out


def ses_kur(hedef):
    pay = _paylar()
    parcalar, zaman, baslar, harita = [('sus', ON)], ON, {}, []
    for i, (ad, ps) in enumerate(SATIRLAR):
        if ps is None:
            baslar[ad] = zaman
            for _ in range(3):
                parcalar += [('tik', 0.07), ('sus', 0.93)]; zaman += 1.0
            continue
        if i > 0:
            parcalar.append(('sus', ARA_SATIR)); zaman += ARA_SATIR
        baslar[ad] = zaman
        for j, (s, e) in enumerate(ps):
            if j > 0:
                ara = min(ARA_IC, s - ps[j - 1][1]); parcalar.append(('sus', ara)); zaman += ara
            s2, e2 = pay[(s, e)]
            harita.append((s2, e2, zaman)); parcalar.append(('ses', (s2, e2))); zaman += (e2 - s2) / TEMPO
    parcalar.append(('sus', SON)); zaman += SON
    n_tik = sum(1 for p in parcalar if p[0] == 'tik')
    z = [f'[1:a]asplit={n_tik}' + ''.join(f'[t{k}]' for k in range(n_tik))]; et = []; kt = 0
    for k, (tur, v) in enumerate(parcalar):
        if tur == 'ses':
            d = (v[1] - v[0]) / TEMPO
            z.append(f'[0:a]atrim=start={v[0]:.3f}:end={v[1]:.3f},asetpts=PTS-STARTPTS,atempo={TEMPO},'
                     f'afade=t=in:st=0:d=0.012,afade=t=out:st={d - 0.016:.3f}:d=0.016,aformat=sample_rates=48000:channel_layouts=mono[p{k}]')
        elif tur == 'sus':
            z.append(f'anullsrc=r=48000:cl=mono,atrim=duration={v:.3f}[p{k}]')
        else:
            z.append(f'[t{kt}]aformat=sample_rates=48000:channel_layouts=mono[p{k}]'); kt += 1
        et.append(f'[p{k}]')
    z.append(''.join(et) + f'concat=n={len(et)}:v=0:a=1[c]')
    z.append('[c]highpass=f=80,equalizer=f=180:t=q:w=1.0:g=1.5,equalizer=f=3200:t=q:w=1.4:g=3.5,equalizer=f=6500:t=q:w=1.5:g=1.5,'
             'afftdn=nf=-42,acompressor=threshold=-19dB:ratio=2.5:attack=4:release=80:makeup=2,'
             'loudnorm=I=-15.5:TP=-1.5:LRA=8,aresample=48000,pan=stereo|c0=c0|c1=c0[son]')
    _calistir(['ffmpeg', '-y', '-i', SES, '-f', 'lavfi', '-i', 'sine=frequency=1150:duration=0.07,afade=t=out:st=0.02:d=0.05,volume=0.30',
               '-filter_complex', ';'.join(z), '-map', '[son]', '-c:a', 'aac', '-b:a', '160k', '-t', f'{zaman:.3f}', hedef + '.tmp.m4a'])
    os.replace(hedef + '.tmp.m4a', hedef)
    return baslar, zaman, harita


# ---------- çizim parçaları ----------
def svg(ic, w=1080, h=1920):
    return f'<svg style="position:absolute; left:0; top:0" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{TANIM}{ic}</svg>'


def hucre(x, y, r, ic='', yanik=True, dolgu='url(#cam)', cizgi=TUR, parla=True):
    p = ''
    if yanik and parla:
        p += f'<g filter="url(#parla)" opacity=".30"><polygon points="{hex_noktalar(x, y, r)}" fill="{cizgi}"/></g>'
    if yanik:
        p += f'<polygon points="{hex_noktalar(x, y, r)}" fill="{dolgu}" stroke="{cizgi}" stroke-width="5"/>'
    else:
        p += f'<polygon points="{hex_noktalar(x, y, r)}" fill="rgba(255,255,255,.55)" stroke="rgba(20,17,15,.16)" stroke-width="3" stroke-dasharray="10 10"/>'
    if ic:
        w = r * 1.6
        p += (f'<foreignObject x="{x - w / 2:.0f}" y="{y - r * 0.8:.0f}" width="{w:.0f}" height="{r * 1.6:.0f}"><div xmlns="http://www.w3.org/1999/xhtml" '
              f'style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; text-align:center; color:{MUR}">{ic}</div></foreignObject>')
    return p


def bag(x1, y1, r1, x2, y2, r2, renk=TUR, cift=False, kalin=7):
    d = math.hypot(x2 - x1, y2 - y1); ux, uy = (x2 - x1) / d, (y2 - y1) / d
    a = (x1 + ux * r1 * 0.9, y1 + uy * r1 * 0.9); b = (x2 - ux * r2 * 0.9, y2 - uy * r2 * 0.9)
    if not cift:
        return f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{renk}" stroke-width="{kalin}" stroke-linecap="round"/>'
    out = ''
    for k in (-8, 8):
        ox, oy = -uy * k, ux * k
        out += f'<line x1="{a[0] + ox:.1f}" y1="{a[1] + oy:.1f}" x2="{b[0] + ox:.1f}" y2="{b[1] + oy:.1f}" stroke="{renk}" stroke-width="5" stroke-linecap="round"/>'
    return out


def ilerleme7(adim):
    h = ''.join(f'<svg width="34" height="38" viewBox="0 0 34 38"><polygon points="{hex_noktalar(17, 19, 16)}" fill="{TUR if k < adim else "none"}" '
                f'stroke="{TUR if k < adim else "rgba(20,17,15,.22)"}" stroke-width="3"/></svg>' for k in range(TOPLAM_ADIM))
    return f'<div class="ilerleme">{h}<div style="flex:1; align-self:center; height:4px; background:linear-gradient(90deg, {TUR} {adim / TOPLAM_ADIM * 100:.0f}%, rgba(20,17,15,.10) 0)"></div></div>'


def ust_bant(adim):
    rozet = (f'<svg width="64" height="70" viewBox="0 0 64 70"><polygon points="{hex_noktalar(32, 35, 30)}" fill="{TUR}"/>'
             f'<text x="32" y="44" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="24" fill="#fff">1dk</text></svg>')
    return f'<div class="ust">{rozet}<div class="rozet">1 Dakikada <span>Kimya</span></div><div class="bolum">BÖLÜM {BOLUM}</div></div>' + ilerleme7(adim)


def kare(icerik, adim=None, kucuk='', baslik='', altyazi='', serbest=False):
    if serbest:
        return f'<section class="p">{izgara()}{icerik}</section>'
    b = f'<div class="baslik"><small>{kucuk}</small>{baslik}</div>' if baslik else ''
    return f'<section class="p">{izgara()}{ust_bant(adim)}{b}{icerik}<div class="altyazi">{altyazi}</div></section>'


def etiket(sembol, ad, renk=MUR, boy=64, alt_renk=SOLUK, alt_boy=26):
    return f'<div style="font:800 {boy}px/1 Poppins; color:{renk}">{sembol}</div><div style="font:700 {alt_boy}px/1.1 Inter; color:{alt_renk}">{ad}</div>'


# simgeler (yeni)
def dis_fircasi(boy=300):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 200 200"><g transform="rotate(-35 100 100)">'
            f'<rect x="18" y="104" width="118" height="18" rx="9" fill="{MUR}"/>'
            f'<rect x="128" y="96" width="54" height="30" rx="9" fill="#fff" stroke="{MUR}" stroke-width="5"/>'
            + ''.join(f'<rect x="{x}" y="74" width="6" height="24" rx="2" fill="{TUR}"/>' for x in range(134, 178, 9))
            + '<path d="M128,72 C136,58 150,66 156,58 C162,50 176,58 182,66 C186,72 180,76 172,74 L134,76 C128,77 125,75 128,72 Z" fill="#8FD3F2" stroke="#3E9BC6" stroke-width="3"/>'
            '</g></svg>')


def macun(boy=110):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><g transform="rotate(-30 50 50)">'
            f'<path d="M20,38 L66,32 L66,68 L20,62 Z" fill="#fff" stroke="{MUR}" stroke-width="4" stroke-linejoin="round"/>'
            f'<rect x="66" y="40" width="12" height="20" rx="2" fill="{TUR}"/><path d="M28,44 L58,40 L58,60 L28,56 Z" fill="#8FD3F2"/></g></svg>')


def ekmek(boy=110):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><path d="M14,58 C14,36 30,26 50,26 C70,26 86,36 86,58 L86,72 C86,76 83,78 79,78 L21,78 C17,78 14,76 14,72 Z" '
            f'fill="#E3A15B" stroke="#9A5A1E" stroke-width="4"/>' + ''.join(f'<path d="M{x},40 q6,8 0,16" stroke="#9A5A1E" stroke-width="4" fill="none" stroke-linecap="round"/>' for x in (36, 50, 64)) + '</svg>')


def pil(boy=110):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><rect x="18" y="32" width="58" height="36" rx="6" fill="#fff" stroke="{MUR}" stroke-width="4"/>'
            f'<rect x="76" y="42" width="8" height="16" rx="2" fill="{MUR}"/><rect x="23" y="37" width="30" height="26" rx="3" fill="{YESIL}"/>'
            f'<text x="65" y="56" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="16" fill="{MUR}">+</text></svg>')


def rozet_html(metin, renk):
    return f'<div style="display:inline-block; margin-top:4px; padding:6px 16px; border-radius:999px; background:{renk}; color:#fff; font:800 31px Inter">{metin}</div>'


# ---------- sahneler ----------
CX = 540


def kanca(tebrik=False):
    p = hucre(CX, 760, 270, dis_fircasi(330), yanik=True)
    if tebrik:
        for k in range(8):
            a = math.radians(-90 + 45 * k); x, y = CX + 360 * math.cos(a), 760 + 360 * math.sin(a)
            p += f'<polygon points="{hex_noktalar(x, y, 26 if k % 2 else 18)}" fill="{TUR}" opacity="{.85 if k % 2 else .5}"/>'
    return svg(p)


def baslik_karesi():
    return (svg(hucre(CX, 600, 250, '', yanik=True) + f'<polygon points="{hex_noktalar(CX, 600, 205)}" fill="none" stroke="rgba(248,83,0,.22)" stroke-width="2"/>')
            + f'<div style="position:absolute; left:0; right:0; top:420px; display:flex; justify-content:center">{atom(360)}</div>'
            + f'''<div style="position:absolute; left:84px; right:84px; top:930px; text-align:center">
  <div style="font:800 112px/1 Poppins; letter-spacing:-.02em">1 Dakikada<br><span style="color:{TUR}">Kimya</span></div>
  <div style="display:inline-flex; align-items:center; gap:16px; margin-top:44px; padding:16px 30px; border:2px solid rgba(20,17,15,.12); border-radius:999px; background:#fff; box-shadow:0 8px 24px rgba(20,17,15,.06)">
    <span style="font:800 32px Poppins; color:{TUR}">BÖLÜM 1</span><span style="width:8px; height:8px; border-radius:50%; background:{SOLUK}"></span>
    <span style="font:800 32px Poppins">Kimya nedir?</span></div></div>''')


def tanim(n):
    """merkez KİMYA + Yapı / Özellik / Değişim hücreleri"""
    cy = 800; R = 310; r = 118
    hucreler = [(-150, 'Yapı', f'<div style="display:flex">{kucuk_simge("kristal", TUR, 70)}</div>'),
                (-30, 'Özellik', f'<div style="display:flex">{kucuk_simge("buyutec", TUR, 70)}</div>'),
                (90, 'Değişim', f'<div style="display:flex">{dongu(80)}</div>')]
    p = ''
    for i, (aci, ad, simge) in enumerate(hucreler):
        a = math.radians(aci); x, y = CX + R * math.cos(a), cy + R * math.sin(a)
        p += bag(CX, cy, 130, x, y, r, TUR if i < n else 'rgba(20,17,15,.10)', cift=True)
    p += f'<g filter="url(#parla)"><polygon points="{hex_noktalar(CX, cy, 130)}" fill="url(#tur)"/></g>'
    p += f'<text x="{CX}" y="{cy + 18}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="50" fill="#fff">KİMYA</text>'
    for i, (aci, ad, simge) in enumerate(hucreler):
        a = math.radians(aci); x, y = CX + R * math.cos(a), cy + R * math.sin(a)
        p += hucre(x, y, r, f'{simge}<div style="font:800 34px Poppins">{ad}</div>' if i < n else '', yanik=i < n)
    return svg(p)


def su(etap):
    """etap 0: boş, 1: Su = H2O yazısı, 2: + hidrojenler, 3: + oksijen ve bağlar"""
    ox, oy, hx = CX, 760, 230
    p = ''
    if etap >= 1:
        p += f'<text x="{CX}" y="500" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="64" fill="{MUR}">Su = H<tspan font-size="40" dy="12">2</tspan><tspan dy="-12">O</tspan></text>'
    hs = [(ox - hx, oy + 200), (ox + hx, oy + 200)]
    for (x, y) in hs:
        p += bag(ox, oy, 125, x, y, 100, TUR if etap >= 3 else 'rgba(20,17,15,.10)', kalin=9)
    p += hucre(ox, oy, 125, etiket('O', 'Oksijen', '#fff', 80, '#FFE3D3', 28) if etap >= 3 else
               '<div style="font:800 90px Poppins; color:rgba(20,17,15,.18)">?</div>', yanik=etap >= 3, dolgu='url(#tur)')
    for (x, y) in hs:
        p += hucre(x, y, 100, etiket('H', 'Hidrojen', MUR, 70) if etap >= 2 else '', yanik=etap >= 2)
    return svg(p)


def ozellik(etap):
    p = ''
    bakir = etiket('Cu', 'Bakır', '#fff', 88, '#FFE6D2', 32) + rozet_html('iletir ✓', YESIL)
    plastik = etiket('Plastik', '', MUR, 50) + rozet_html('iletmez ✗', KIRMIZI)
    p += f'<defs><linearGradient id="bakir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E39A5C"/><stop offset="1" stop-color="#A5552A"/></linearGradient></defs>'
    p += hucre(300, 780, 175, bakir if etap >= 1 else '<div style="font:800 90px Poppins; color:rgba(20,17,15,.18)">?</div>', yanik=etap >= 1, dolgu='url(#bakir)', cizgi='#B5652F')
    p += hucre(780, 780, 175, plastik if etap >= 2 else '<div style="font:800 90px Poppins; color:rgba(20,17,15,.18)">?</div>', yanik=etap >= 2, dolgu='#EEF2F6', cizgi='#8A97A6')
    if etap >= 1:
        p += f'<polygon points="540,690 505,790 535,790 520,870 575,760 545,760 560,690" fill="#F5A300" stroke="{MUR}" stroke-width="4" stroke-linejoin="round"/>'
    return svg(p)


def degisim(etap):
    p = ('<defs><linearGradient id="demir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D0D7"/><stop offset="1" stop-color="#7E8994"/></linearGradient>'
         '<linearGradient id="pas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C96A33"/><stop offset="1" stop-color="#7E3414"/></linearGradient></defs>')
    soru = '<div style="font:800 90px Poppins; color:rgba(20,17,15,.18)">?</div>'
    p += hucre(290, 790, 170, etiket('Fe', 'Demir', MUR, 92, '#3D4650', 30) if etap >= 1 else soru, yanik=etap >= 1, dolgu='url(#demir)', cizgi='#6E7882')
    p += hucre(790, 790, 170, etiket('Pas', 'demir oksit', '#fff', 70, '#FFD9C4', 26) if etap >= 2 else soru, yanik=etap >= 2, dolgu='url(#pas)', cizgi='#8E3B17')
    if etap >= 2:
        p += (f'<line x1="480" y1="790" x2="585" y2="790" stroke="{TUR}" stroke-width="10" stroke-linecap="round"/>'
              f'<polygon points="600,790 572,772 572,808" fill="{TUR}"/>'
              f'<text x="540" y="745" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="{SOLUK}">zamanla</text>')
    return svg(p)


def her_yerde(n, hepsi=False):
    yer = [(CX, 552), (CX - 146, 804), (CX + 146, 804), (CX, 1056)]
    ogeler = [(macun(132), 'Diş macunu'), (gunluk_simge('ilac', 132), 'İlaç'), (ekmek(132), 'Ekmek'), (pil(132), 'Pil')]
    p = ''
    for i, ((x, y), (simge, ad)) in enumerate(zip(yer, ogeler)):
        p += hucre(x, y, 142, f'{simge}<div style="font:800 32px Poppins">{ad}</div>' if i < n else '', yanik=i < n, parla=hepsi or i == n - 1)
    return svg(p)


def tuzak_unlem():
    return svg(f'<g filter="url(#parla)"><polygon points="{hex_noktalar(CX, 760, 210)}" fill="{KIRMIZI}"/></g>'
               f'<text x="{CX}" y="840" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="240" fill="#fff">!</text>')


def tuzak_kart(cip=0):
    cipler = ['H<sub>2</sub>O', 'NaCl']
    c = ''.join(f'<span style="opacity:{1 if i < cip else 0}; font:800 60px Poppins; padding:18px 40px; border-radius:24px; background:#fff; '
                f'border:3px solid {TUR}; box-shadow:0 10px 26px rgba(248,83,0,.18)">{x}</span>' for i, x in enumerate(cipler))
    return f'''<div style="position:absolute; left:0; right:0; top:560px; display:flex; flex-direction:column; align-items:center; gap:70px">
  <div style="position:relative; padding:26px 46px; border-radius:24px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 12px 30px rgba(20,17,15,.07); font:800 60px Poppins">
    Kimyasal = zararlı
    <svg style="position:absolute; inset:-10px" width="calc(100% + 20px)" height="calc(100% + 20px)" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="3" y1="85" x2="97" y2="15" stroke="{KIRMIZI}" stroke-width="5" stroke-linecap="round"/></svg></div>
  <div style="display:flex; gap:40px; align-items:center">{c}</div></div>'''


SIKLAR = ['Gezegenlerin hareketi', 'Demirin paslanması', 'Sesin yankılanması', 'Kuşların göçü']


def soru_alani():
    s = ''.join(sik(h, m) for h, m in zip('ABCD', SIKLAR))
    return (f'<div style="position:absolute; left:84px; right:84px; top:430px"><div style="font:800 52px/1.25 Poppins; margin-bottom:34px">'
            f'Hangisi kimyanın <span style="color:{TUR}">konusudur?</span></div><div style="display:grid; gap:18px">{s}</div></div>')


def geri_sayim(n):
    cevre = 6 * 130
    return f'''<div style="position:absolute; left:0; right:0; top:1230px; display:flex; justify-content:center">
  <svg width="300" height="300" viewBox="0 0 300 300">{TANIM}
    <polygon points="{hex_noktalar(150, 150, 130)}" fill="#fff" stroke="rgba(20,17,15,.10)" stroke-width="10"/>
    <g filter="url(#parla)"><polygon points="{hex_noktalar(150, 150, 130)}" fill="none" stroke="{TUR}" stroke-width="10" stroke-dasharray="{cevre * n / 3:.0f} {cevre}" stroke-linecap="round"/></g>
    <text x="150" y="190" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="120" fill="{MUR}">{n}</text></svg></div>'''


def bitis():
    return (svg(hucre(CX, 640, 220, '', yanik=True))
            + f'<div style="position:absolute; left:0; right:0; top:500px; display:flex; justify-content:center"><img src="{LOGO_ISARET}" style="width:280px; height:280px; border-radius:50%; background:#fff"></div>'
            + f'''<div style="position:absolute; left:84px; right:84px; top:920px; text-align:center">
  <div style="font:800 72px/1.15 Poppins">Cevabını<br><span style="color:{TUR}">yorumlara</span> yaz!</div>
  <div style="display:inline-flex; align-items:center; gap:14px; margin-top:56px; padding:16px 30px; border-radius:999px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 8px 24px rgba(20,17,15,.06)">
    <span style="font:800 30px Poppins; color:{TUR}">YARIN · BÖLÜM 2</span><span style="font:800 30px Poppins">Kimyanın alt dalları</span></div></div>''')


# ---------- zaman çizelgesi ----------
ONCE_OGE, ONCE_YAZI = 0.40, 0.25


def kareler(baslar, toplam, harita):
    def t(orij):
        for s2, e2, cikis in harita:
            if s2 <= orij <= e2:
                return cikis + (orij - s2) / TEMPO
        return min((h for h in harita if h[0] > orij), key=lambda h: h[0], default=harita[-1])[2]
    b = {k: max(0.0, v - ONCE_YAZI) for k, v in baslar.items()}
    o = lambda x: max(0.0, t(x) - ONCE_OGE)
    K = lambda *a, **k: kare(*a, **k)
    sira = [
        (0.0, K(kanca(), serbest=True) [:-10] + '<div class="altyazi">Bu sabah <em>dişini</em> fırçaladın mı?</div></section>'),
        (b['L2'], K(kanca(True), serbest=True)[:-10] + '<div class="altyazi"><em>Tebrikler</em>, güne kimyayla başladın!</div></section>'),
        (b['L3'], K(baslik_karesi(), serbest=True)),
        (b['L4'], K(tanim(1), 1, '1 · TANIM', 'Kimya nedir?', 'Kimya; maddenin <em>yapısını</em>,')),
        (b['L5'], K(tanim(2), 1, '1 · TANIM', 'Kimya nedir?', '<em>özelliklerini</em>')),
        (b['L6'], K(tanim(3), 1, '1 · TANIM', 'Kimya nedir?', 've <em>değişimlerini</em> inceler.')),
        (b['L7'], K(su(0), 2, '2 · YAPI', 'Yapı', '<em>Yapı:</em> Madde neyden oluşur?')),
        (b['L8'], K(su(1), 2, '2 · YAPI', 'Yapı', 'Su; hidrojen ve oksijenden.')),
        (o(25.60), K(su(2), 2, '2 · YAPI', 'Yapı', 'Su; <em>hidrojen</em> ve oksijenden.')),
        (o(26.38), K(su(3), 2, '2 · YAPI', 'Yapı', 'Su; <em>hidrojen</em> ve <em>oksijenden</em>.')),
        (b['L9'], K(ozellik(0), 3, '3 · ÖZELLİK', 'Özellik', '<em>Özellik:</em> Madde nasıl davranır?')),
        (o(31.62), K(ozellik(1), 3, '3 · ÖZELLİK', 'Özellik', 'Bakır elektriği <em>iletir</em>,')),
        (o(33.36), K(ozellik(2), 3, '3 · ÖZELLİK', 'Özellik', 'Bakır elektriği <em>iletir</em>, plastik <em>iletmez</em>.')),
        (b['L11'], K(degisim(0), 4, '4 · DEĞİŞİM', 'Değişim', '<em>Değişim:</em> Madde neye dönüşür?')),
        (o(40.92), K(degisim(1), 4, '4 · DEĞİŞİM', 'Değişim', 'Demir zamanla paslanır.')),
        (o(42.12), K(degisim(2), 4, '4 · DEĞİŞİM', 'Değişim', 'Demir zamanla <em>paslanır</em>.')),
        (min(b['L13'], o(43.75)), K(her_yerde(1), 5, '5 · GÜNLÜK HAYAT', 'Kimya her yerde', '<em>Diş macunundan</em> ilaca,')),
        (o(45.18), K(her_yerde(2), 5, '5 · GÜNLÜK HAYAT', 'Kimya her yerde', 'Diş macunundan <em>ilaca</em>,')),
        (o(46.29), K(her_yerde(3), 5, '5 · GÜNLÜK HAYAT', 'Kimya her yerde', '<em>ekmekten</em> pile;')),
        (o(47.15), K(her_yerde(4), 5, '5 · GÜNLÜK HAYAT', 'Kimya her yerde', 'ekmekten <em>pile</em>;')),
        (o(48.04), K(her_yerde(4, True), 5, '5 · GÜNLÜK HAYAT', 'Kimya her yerde', 'kimya <em>her yerde!</em>')),
        (b['L14'], K(tuzak_unlem(), 6, '! · SIK YAPILAN HATA', 'Tuzak!', '<em>Dikkat, tuzak!</em>')),
        (o(54.42), K(tuzak_kart(0), 6, '! · SIK YAPILAN HATA', 'Tuzak!', 'Kimyasal demek <em>zararlı</em> demek değil.')),
        (min(b['L16'], o(58.17)), K(tuzak_kart(1), 6, '! · SIK YAPILAN HATA', 'Tuzak!', '<em>Su</em> da, tuz da birer kimyasaldır.')),
        (o(59.45), K(tuzak_kart(2), 6, '! · SIK YAPILAN HATA', 'Tuzak!', '<em>Su</em> da, <em>tuz</em> da birer kimyasaldır.')),
        (b['L17'], K(soru_alani(), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', 'Şimdi <em>sıra sende!</em>')),
        (o(65.52), K(soru_alani(), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', 'Hangisi kimyanın konusudur?')),
        (o(68.32), K(soru_alani(), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', '<em>Üç saniyen var!</em>')),
        (baslar['SAYAC'], K(soru_alani() + geri_sayim(3), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', '')),
        (baslar['SAYAC'] + 1, K(soru_alani() + geri_sayim(2), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', '')),
        (baslar['SAYAC'] + 2, K(soru_alani() + geri_sayim(1), 7, '? · 3 SANİYEN VAR', 'Sıra sende!', '')),
        (b['L19'], K(bitis(), serbest=True)),
    ]
    temiz = []
    for z, k in sira:
        if temiz and z - temiz[-1][0] < 0.15:
            temiz[-1] = (temiz[-1][0], k)
        else:
            temiz.append((z, k))
    sureler = [round(temiz[i + 1][0] - temiz[i][0], 3) for i in range(len(temiz) - 1)] + [round(toplam - temiz[-1][0], 3)]
    assert all(x > 0 for x in sureler), sureler
    return [(d, k) for d, (_, k) in zip(sureler, temiz)]


def bas(kareler_, klasor, onek):
    from playwright.sync_api import sync_playwright
    os.makedirs(klasor, exist_ok=True)
    html = os.path.join(klasor, onek + '.html')
    open(html, 'w', encoding='utf-8').write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' + ''.join(k for _, k in kareler_) + '</body></html>')
    yollar = []
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page(viewport={'width': 1080, 'height': 1920})
        pg.goto('file://' + html); pg.wait_for_timeout(700); pg.evaluate('document.fonts.ready')
        tasma = pg.evaluate('''() => [...document.querySelectorAll('section.p')].map((s, i) => {
            const a = s.querySelector('.altyazi'); if (!a) return null;
            const alt = a.getBoundingClientRect().bottom - s.getBoundingClientRect().top;
            return alt > 1520 ? (i + 1) + ': altyazı ' + Math.round(alt) : null; }).filter(Boolean)''')
        for i, el in enumerate(pg.query_selector_all('section.p'), 1):
            y = os.path.join(klasor, f'{onek}-{i:02d}.png'); el.screenshot(path=y); yollar.append(y)
        br.close()
    return yollar, tasma


if __name__ == '__main__':
    os.makedirs(KLASOR, exist_ok=True)
    ses = os.path.join(KLASOR, 'ses.m4a')
    baslar, toplam, harita = ses_kur(ses)
    kk = kareler(baslar, toplam, harita)
    print('ses', round(toplam, 2), 'sn · kare', len(kk))
    yollar, tasma = bas(kk, KLASOR, 'k')
    print('taşma:', tasma or 'yok')
    if '--video' in sys.argv:
        ham = os.path.join(KLASOR, 'ham.mp4')
        videoya_cevir(yollar, [d for d, _ in kk], ham, gecis=0.15)
        hedef = os.path.join(KLASOR, '1-dakikada-kimya-bolum1-petek.mp4')
        _calistir(['ffmpeg', '-y', '-i', ham, '-i', ses, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', hedef + '.tmp.mp4'])
        os.replace(hedef + '.tmp.mp4', hedef)
        print('tamam', hedef)
