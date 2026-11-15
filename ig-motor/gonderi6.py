# -*- coding: utf-8 -*-
"""Hafta 1 · Cumartesi · Merak edilenler: Kışın yollara neden tuz dökülür? (6 slayt)
Cumartesi genel kimya günü: merak edilenler, güncel ve kültürel konular (kullanıcının isteği).
Ronya şimdilik paylaşılmıyor."""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta

SERI = 'merak'
SERI_METNI = 'MERAK EDİLENLER'
T = 6
MAVI = '#0B5C8A'
SU = '#A9D8F2'
BUZ = '#DDF0FA'
TURUNCU = '#F85300'
YESIL = '#2F8F1F'
MUREKKEP = '#14110F'
GRI = '#5C554F'
CIZGI = '#E7E0D9'


def iyon(x, y, tur, olcek=1.0):
    if tur == 'na':
        r, renk, isaret, fs = 17 * olcek, TURUNCU, '+', 26 * olcek
    else:
        r, renk, isaret, fs = 21 * olcek, YESIL, '−', 28 * olcek
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{renk}"/>'
            f'<text x="{x:.1f}" y="{y + fs * 0.33:.1f}" text-anchor="middle" font-family="Poppins" font-weight="700" '
            f'font-size="{fs:.0f}" fill="#fff">{isaret}</text>')


def beher(x, y, w, h, icerik, kimlik):
    r = 42
    dis = (f'M{x},{y} L{x},{y + h - r} Q{x},{y + h} {x + r},{y + h} L{x + w - r},{y + h} '
           f'Q{x + w},{y + h} {x + w},{y + h - r} L{x + w},{y}')
    ic = (f'M{x + 6},{y} L{x + 6},{y + h - r} Q{x + 6},{y + h - 6} {x + r},{y + h - 6} L{x + w - r},{y + h - 6} '
          f'Q{x + w - 6},{y + h - 6} {x + w - 6},{y + h - r} L{x + w - 6},{y} Z')
    p = [f'<clipPath id="{kimlik}"><path d="{ic}"/></clipPath>', f'<g clip-path="url(#{kimlik})">']
    ust = y + 78
    if icerik == 'buz':
        p.append(f'<path d="M{x},{ust + 8} L{x + w * 0.3:.0f},{ust - 4} L{x + w * 0.62:.0f},{ust + 10} L{x + w},{ust - 2} L{x + w},{y + h} L{x},{y + h} Z" fill="{BUZ}"/>')
        for (a, b, c, d, e, f) in [(0.12, 0.22, 0.42, 0.45, 0.30, 0.78), (0.86, 0.18, 0.60, 0.50, 0.78, 0.86), (0.40, 0.62, 0.62, 0.70, 0.55, 0.95)]:
            p.append(f'<polyline points="{x + w * a:.0f},{ust + (h - 78) * b:.0f} {x + w * c:.0f},{ust + (h - 78) * d:.0f} {x + w * e:.0f},{ust + (h - 78) * f:.0f}" '
                     f'fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
        p.append(f'<rect x="{x + 22}" y="{ust + 26}" width="18" height="{h - 150}" rx="9" fill="#fff" opacity=".55"/>')
    else:
        dalga = ' '.join(f'{x + i},{ust + 6 * math.sin(i / w * 4 * math.pi):.1f}' for i in range(0, w + 1, 10))
        p.append(f'<polygon points="{dalga} {x + w},{y + h} {x},{y + h}" fill="{SU}"/>')
        for dx, dy, tur in [(0.24, 0.30, 'na'), (0.62, 0.24, 'cl'), (0.40, 0.52, 'cl'), (0.78, 0.50, 'na'), (0.22, 0.74, 'cl'), (0.58, 0.80, 'na')]:
            p.append(iyon(x + w * dx, ust + (h - 78) * dy, tur))
    p.append('</g>')
    p.append(f'<path d="{dis}" fill="none" stroke="{MUREKKEP}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>')
    p.append(f'<path d="M{x - 16},{y - 2} L{x},{y}" stroke="{MUREKKEP}" stroke-width="7" stroke-linecap="round"/>')
    p.append(f'<path d="M{x + w + 16},{y - 2} L{x + w},{y}" stroke="{MUREKKEP}" stroke-width="7" stroke-linecap="round"/>')
    return p


def kapak_svg():
    W, H = 912, 640
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    p.append(f'<rect x="{W / 2 - 190:.0f}" y="4" width="380" height="86" rx="43" fill="#fff" stroke="{CIZGI}" stroke-width="3"/>')
    # kar tanesi
    kx, ky = W / 2 - 140, 47
    for a in range(0, 180, 60):
        dx, dy = 22 * math.cos(math.radians(a)), 22 * math.sin(math.radians(a))
        p.append(f'<line x1="{kx - dx:.1f}" y1="{ky - dy:.1f}" x2="{kx + dx:.1f}" y2="{ky + dy:.1f}" stroke="{MAVI}" stroke-width="5" stroke-linecap="round"/>')
    p.append(f'<text x="{W / 2 + 30:.0f}" y="62" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="42" fill="{MAVI}">Hava −5 °C</text>')
    p += beher(128, 150, 270, 330, 'buz', 'kb1')
    p += beher(514, 150, 270, 330, 'sivi', 'kb2')
    for cx, ad, durum, renk in [(263, 'Saf su', 'donar', MAVI), (649, 'Tuzlu su', 'sıvı kalır', TURUNCU)]:
        p.append(f'<text x="{cx}" y="560" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="44" fill="{MUREKKEP}">{ad}</text>')
        p.append(f'<text x="{cx}" y="612" text-anchor="middle" font-family="Inter" font-weight="700" font-size="36" fill="{renk}">{durum}</text>')
    p.append('</svg>')
    return ''.join(p)


def termometre_svg():
    W, H = 912, 650
    ust, alt = 40, 600
    t2y = lambda t: ust + (5 - t) / 40 * (alt - ust)
    ex = 150
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    p.append(f'<rect x="{ex - 18}" y="{ust - 18}" width="36" height="{alt - ust + 36}" rx="18" fill="#fff" stroke="{CIZGI}" stroke-width="3"/>')
    for t in range(5, -36, -5):
        y = t2y(t)
        p.append(f'<line x1="{ex - 18}" y1="{y:.1f}" x2="{ex - 40}" y2="{y:.1f}" stroke="{GRI}" stroke-width="3"/>')
        etiket = f'{t}' if t <= 0 else f'+{t}'
        etiket = etiket.replace('-', '−')
        p.append(f'<text x="{ex - 52}" y="{y + 11:.1f}" text-anchor="end" font-family="Inter" font-weight="600" font-size="30" fill="{GRI}">{etiket}</text>')
    p.append(f'<text x="{ex - 52}" y="{ust - 22}" text-anchor="end" font-family="Inter" font-weight="700" font-size="28" fill="{GRI}">°C</text>')
    # aralık çubukları
    for x, t_alt, renk in [(ex + 60, -10, TURUNCU), (ex + 120, -30, MAVI)]:
        p.append(f'<rect x="{x}" y="{t2y(0):.1f}" width="34" height="{t2y(t_alt) - t2y(0):.1f}" rx="17" fill="{renk}"/>')
    yazi_x = ex + 190
    satirlar = [
        (0, MUREKKEP, 'Saf su 0 °C\'de donar', ''),
        (-10, TURUNCU, 'Yemek tuzu (NaCl)', 'yaklaşık −10 °C\'ye kadar işe yarar'),
        (-30, MAVI, 'Kalsiyum klorür (CaCl₂)', 'yaklaşık −30 °C\'ye kadar işe yarar'),
    ]
    for t, renk, bas_y, alt_y in satirlar:
        y = t2y(t)
        bas_x = ex + 18 if t == 0 else (ex + 94 if t == -10 else ex + 154)
        p.append(f'<line x1="{bas_x}" y1="{y:.1f}" x2="{yazi_x - 14}" y2="{y:.1f}" stroke="{renk}" stroke-width="3" stroke-dasharray="8 8"/>')
        p.append(f'<text x="{yazi_x}" y="{y + 12:.1f}" font-family="Poppins" font-weight="700" font-size="38" fill="{renk}">{bas_y}</text>')
        if alt_y:
            p.append(f'<text x="{yazi_x}" y="{y + 56:.1f}" font-family="Inter" font-weight="500" font-size="31" fill="{GRI}">{alt_y}</text>')
    p.append('</svg>')
    return ''.join(p)


def molekul(x, y, aci, olcek=1.0):
    """su molekülü: O ortada, iki H 104,5° açıyla"""
    p = []
    for d in (-52.25, 52.25):
        a = math.radians(aci + d)
        hx, hy = x + 19 * olcek * math.sin(a), y + 19 * olcek * math.cos(a)
        p.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{8 * olcek:.1f}" fill="#fff" stroke="#9DB8C9" stroke-width="2.5"/>')
    p.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{14 * olcek:.1f}" fill="#3C8DC5"/>')
    return ''.join(p)


def tanecik_svg(tuzlu):
    W, H = 420, 380
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">',
         f'<rect x="2" y="2" width="{W - 4}" height="{H - 4}" rx="26" fill="{"#EAF6FC" if tuzlu else BUZ}" stroke="{CIZGI}" stroke-width="3"/>']
    rnd = random.Random(7)
    aralik = 66
    noktalar = []
    for sira in range(6):
        for sut in range(6):
            x = 50 + sut * aralik + (aralik / 2 if sira % 2 else 0)
            y = 46 + sira * aralik * 0.87
            if x < W - 30 and y < H - 30:
                noktalar.append((x, y, sira))
    iyon_yeri = {5: 'na', 9: 'cl', 14: 'na', 20: 'cl', 25: 'na', 28: 'cl'} if tuzlu else {}
    for i, (x, y, sira) in enumerate(noktalar):
        if tuzlu:
            x += rnd.uniform(-13, 13); y += rnd.uniform(-11, 11)
            if i in iyon_yeri:
                p.append(iyon(x, y, iyon_yeri[i], 0.95))
                continue
            p.append(molekul(x, y, rnd.uniform(0, 360), 0.95))
        else:
            p.append(molekul(x, y, 0 if sira % 2 == 0 else 180, 0.95))
    p.append('</svg>')
    return ''.join(p)


def nokta_dizisi(renkler):
    p = ''.join(f'<circle cx="{26 + i * 52}" cy="26" r="{17 if r == TURUNCU else 21}" fill="{r}"/>' for i, r in enumerate(renkler))
    return f'<svg width="{len(renkler) * 52}" height="52" viewBox="0 0 {len(renkler) * 52} 52">{p}</svg>'


slaytlar = []

slaytlar.append(slayt(f'''
<div style="margin-top:44px">
  <div class="ust-not">KİMYA HAYATIN İÇİNDE</div>
  <h1>Kışın yollara neden <em>tuz</em> dökülür?</h1>
</div>
<div style="display:flex; justify-content:center; margin-top:40px">{kapak_svg()}</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">1 · DONMA NOKTASI DÜŞER</div>
<h2>Tuzlu su 0 °C'de donmaz</h2>
<p style="color:#4A433D">Tuz suda çözününce suyun donma noktası düşer. Bu yüzden buz, 0 °C'nin altında da eriyebilir.</p>
<div style="margin-top:34px">{termometre_svg()}</div>
''', SERI_METNI, SERI, 2, T))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">2 · TANECİK DÜZEYİNDE</div>
<h2>İyonlar buzun düzenini bozar</h2>
<div class="yan" style="gap:28px; margin-top:8px">
  <div><div style="display:flex; justify-content:center">{tanecik_svg(False)}</div>
    <p class="ortala" style="font-size:34px; margin-top:18px"><b>Saf su donarken</b><br>moleküller düzenli dizilir: buz</p></div>
  <div><div style="display:flex; justify-content:center">{tanecik_svg(True)}</div>
    <p class="ortala" style="font-size:34px; margin-top:18px"><b>Tuzlu suda</b><br>Na<sup>+</sup> ve Cl<sup>−</sup> iyonları araya girer</p></div>
</div>
<div class="kutu renkli alta"><p>Buz kristali kurulamaz. Suyun donması için <b>daha çok soğuması</b> gerekir.</p></div>
''', SERI_METNI, SERI, 3, T))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">3 · TANECİK SAYISI</div>
<h2>Çok soğukta neden başka tuz?</h2>
<div class="kutu" style="display:flex; align-items:center; justify-content:space-between; gap:20px">
  <div class="formul" style="font-size:50px">NaCl → Na<sup>+</sup> + Cl<sup>−</sup></div>{nokta_dizisi([TURUNCU, YESIL])}</div>
<div class="kutu" style="display:flex; align-items:center; justify-content:space-between; gap:20px">
  <div class="formul" style="font-size:50px">CaCl<sub>2</sub> → Ca<sup>2+</sup> + 2Cl<sup>−</sup></div>{nokta_dizisi([TURUNCU, YESIL, YESIL])}</div>
<ul class="madde" style="margin-top:38px">
  <li>Suda çözünen tanecik sayısı arttıkça donma noktası <b>daha çok düşer</b>.</li>
  <li>Aynı sayıda birimden CaCl<sub>2</sub> <b>3</b>, NaCl <b>2</b> iyon verir.</li>
  <li>CaCl<sub>2</sub> çok daha düşük sıcaklıklarda da çalışır ve çözünürken <b>ısı açığa çıkarır</b>.</li>
</ul>
''', SERI_METNI, SERI, 4, T))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">4 · BİR DE BEDELİ VAR</div>
<h2>Tuz her derde deva değil</h2>
<div class="tuzak"><b class="baslik">Paslanma</b><p>Tuzlu su, araçlardaki ve köprülerdeki demirin paslanmasını hızlandırır.</p></div>
<div class="tuzak"><b class="baslik">Toprak ve bitkiler</b><p>Yol kenarına akan tuz, toprağa ve bitkilere zarar verir.</p></div>
<div class="tuzak"><b class="baslik">Kum buzu eritmez</b><p>Kum yalnızca kaymayı azaltır. Buzu eriten tuzdur.</p></div>
''', SERI_METNI, SERI, 5, T))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">SIRA SENDE</div>
<h2>Hangisi donma noktasını daha çok düşürür?</h2>
<div class="kutu"><p>Eşit mol sayısında <b>NaCl</b> ve <b>CaCl<sub>2</sub></b>, ayrı ayrı 1'er kg suda çözülüyor.</p></div>
<p style="margin-top:30px">Cevabını yorumlara yaz. Açıklaması yarın hikâyede.</p>
<p class="kucuk" style="margin-top:22px; font-weight:600">10. sınıf · Çözeltiler: donma noktası alçalması</p>
<div class="cta">
  <svg width="64" height="64" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>
  <p><b>Kaydet,</b> kış gelince arkadaşına anlat. Her cumartesi bir kimya merakı.</p>
</div>
''', SERI_METNI, SERI, 6, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-6-cmt')
    yollar, tasma = bas(slaytlar, klasor, 'cmt3')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta.jpg'), sutun=6, gen=300))
