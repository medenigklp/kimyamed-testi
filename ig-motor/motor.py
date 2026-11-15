# -*- coding: utf-8 -*-
"""medeni gökalp Instagram görsel motoru: HTML slaytları PNG'ye çevirir.
Kaydırmalı gönderi 1080x1350, hikâye 1080x1920. Marka: logo renkleri + altıgen doku + dalgalı bordo çizgi."""
import math
import os

KOK = os.path.dirname(os.path.abspath(__file__))
VARLIK = '/home/claude/k9e/motor/varlik'
LOGO_ISARET = 'file://' + os.path.join(KOK, 'varlik_kimyamed_logo.png')
LOGO_YAZI = LOGO_ISARET

RENK = {
    'mor': '#F85300', 'turuncu': '#F85300', 'mavi': '#0B5C8A', 'yesil': '#2F8F1F',
    'yesil_acik': '#38A028', 'lacivert': '#0B5C8A', 'murekkep': '#14110F', 'gri': '#5C554F',
}
SERI_RENK = {k: '#F85300' for k in ['9', '10', '11', '12', 'yks', 'arac', 'tuzak', 'soru']}


def altigen_kume(gen=620, yuk=620, r=46, renk='#F85300', koseX=1.0, koseY=0.0):
    """köşeden solan bal peteği kümesi (SVG)"""
    w = math.sqrt(3) * r
    parcalar = []
    satir = 0
    y = -r
    while y < yuk + r:
        x0 = -w if satir % 2 == 0 else -w / 2
        x = x0
        while x < gen + w:
            cx, cy = x, y
            dx = (cx / gen) - koseX
            dy = (cy / yuk) - koseY
            uzak = math.hypot(dx, dy)
            op = max(0.0, 0.13 * (1 - uzak / 1.05))
            if op > 0.012:
                noktalar = ' '.join(f'{cx + r * math.cos(math.radians(60 * k - 30)):.1f},{cy + r * math.sin(math.radians(60 * k - 30)):.1f}' for k in range(6))
                parcalar.append(f'<polygon points="{noktalar}" fill="none" stroke="{renk}" stroke-width="2.6" opacity="{op:.3f}"/>')
                if (satir * 7 + int(x)) % 5 == 0 and op > 0.06:
                    parcalar.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.52:.1f}" fill="none" stroke="{renk}" stroke-width="2.2" opacity="{op * 0.9:.3f}"/>')
            x += w
        y += 1.5 * r
        satir += 1
    return f'<svg class="desen" width="{gen}" height="{yuk}" viewBox="0 0 {gen} {yuk}" xmlns="http://www.w3.org/2000/svg">{"".join(parcalar)}</svg>'


def dalga(gen=1080, renk='#5F0A4F', op=0.55, gen_dalga=6, yuk=14):
    noktalar = []
    for i in range(0, gen + 1, 6):
        y = yuk + yuk * math.sin(i / gen * gen_dalga * 2 * math.pi)
        noktalar.append(f'{i},{y:.1f}')
    return (f'<svg class="dalga" width="{gen}" height="{yuk * 2 + 4}" viewBox="0 0 {gen} {yuk * 2 + 4}">'
            f'<polyline points="{" ".join(noktalar)}" fill="none" stroke="{renk}" stroke-width="4" opacity="{op}"/></svg>')


CSS = r'''
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #ddd; }
body { font-family: 'Inter', sans-serif; color: #14110F; -webkit-font-smoothing: antialiased; }
.s { width: 1080px; height: 1350px; position: relative; overflow: hidden; background: #FBF9F7;
     padding: 70px 84px 64px; display: flex; flex-direction: column; margin: 0 0 40px; }
.s.hikaye { height: 1920px; padding: 230px 84px 290px; }
.s.hikaye .dalga { bottom: 200px; }
.s .desen { position: absolute; top: 0; right: 0; pointer-events: none; }
.s .dalga { position: absolute; left: 0; bottom: 30px; }
.ust { display: flex; align-items: center; gap: 14px; position: relative; z-index: 2; }
.ust .isaret { height: 70px; width: 70px; border-radius: 50%; background: #fff; }
.ust .marka { font: 700 40px/1 'Poppins', sans-serif; color: #F85300; letter-spacing: -.01em; margin-top: 4px; }
.koyu .ust .marka { color: #fff; }
.alt .imza { display: flex; align-items: center; gap: 12px; font: 600 25px 'Inter', sans-serif; color: #5C554F; }
.alt .imza img { width: 46px; height: 46px; border-radius: 50%; background: #fff; }
.alt .imza b { color: #14110F; font-weight: 700; }
.koyu .alt .imza, .koyu .alt .imza b { color: #fff; }
.seri { margin-left: auto; font: 700 21px/1 'Inter', sans-serif; letter-spacing: .09em; color: #fff;
        padding: 13px 20px 12px; border-radius: 999px; white-space: nowrap; }
.govde { flex: 1; display: flex; flex-direction: column; position: relative; z-index: 2; min-height: 0; }
.alt { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 2;
       font: 600 26px 'Inter', sans-serif; color: #5C554F; margin-top: 18px; }
.alt .kaydir { color: var(--vurgu); font-weight: 700; }
.koyu .alt .kaydir, .koyu .alt .sayfa { color: #fff; }
.alt .sayfa { letter-spacing: .04em; }
.alt .hesap { font-weight: 600; color: #F85300; }
h1 { font: 700 92px/1.04 'Poppins', sans-serif; margin: 0; letter-spacing: -.01em; color: #14110F; text-wrap: balance; }
h1 em, h2 em { font-style: normal; color: var(--vurgu); }
h2 { font: 700 66px/1.1 'Poppins', sans-serif; margin: 0 0 26px; color: #14110F; text-wrap: balance; }
.ust-not { font: 700 26px 'Inter', sans-serif; letter-spacing: .12em; color: var(--vurgu); margin: 0 0 14px; }
.alt-baslik { font: 500 38px/1.4 'Inter', sans-serif; color: #4A433D; margin: 26px 0 0; max-width: 860px; }
p, li { font: 500 40px/1.42 'Inter', sans-serif; margin: 0; }
p + p { margin-top: 18px; }
ul.madde { list-style: none; padding: 0; margin: 0; display: grid; gap: 22px; }
ul.madde li { padding-left: 46px; position: relative; }
ul.madde li::before { content: ''; position: absolute; left: 4px; top: 17px; width: 18px; height: 18px; border-radius: 4px;
                      background: var(--vurgu); transform: rotate(45deg); }
b, strong { font-weight: 700; }
.kutu { background: #fff; border: 3px solid #E7E0D9; border-radius: 28px; padding: 34px 38px; }
.kutu.renkli { background: var(--acik); border-color: transparent; }
.kutu + .kutu { margin-top: 24px; }
.formul { font: 600 56px/1.32 'Inter', sans-serif; letter-spacing: .01em; color: #14110F; }
.formul sup { font-size: .6em; vertical-align: .75em; line-height: 0; }
.formul sub, p sub, li sub, h1 sub, h2 sub, td sub, .k sub { font-size: .62em; vertical-align: -.25em; line-height: 0; }
p sup, li sup, td sup, h2 sup, .k sup { font-size: .62em; vertical-align: .6em; line-height: 0; }
.z { font-size: .58em; vertical-align: -.22em; margin-right: .06em; color: #5C554F; font-weight: 600; }
.vurgu { color: var(--vurgu); }
.isaretle { background: linear-gradient(transparent 58%, var(--isik) 58%); padding: 0 .08em; }
.daire { display: inline-grid; place-items: center; width: 64px; height: 64px; border-radius: 50%;
         background: var(--vurgu); color: #fff; font: 700 34px 'Poppins', sans-serif; flex: none; }
.adim { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
.adim .ad { font: 700 30px 'Inter', sans-serif; letter-spacing: .1em; color: var(--vurgu); }
.yan { display: flex; gap: 22px; }
.yan > * { flex: 1; min-width: 0; }
table.t { width: 100%; border-collapse: separate; border-spacing: 0; font: 500 35px/1.3 'Inter', sans-serif; background: #fff;
          border-radius: 24px; overflow: hidden; border: 3px solid #E7E0D9; }
table.t th { background: var(--vurgu); color: #fff; font-weight: 700; text-align: left; padding: 22px 26px; font-size: 29px; letter-spacing: .03em; }
table.t td { padding: 24px 26px; border-top: 2px solid #EFE9E3; vertical-align: top; }
table.t tr:nth-child(even) td { background: #FCFAF8; }
.etiket { display: inline-block; font: 700 24px/1 'Inter', sans-serif; letter-spacing: .08em; color: #fff; background: var(--vurgu);
          padding: 12px 16px 11px; border-radius: 12px; }
.tuzak { border-left: 12px solid #F85300; background: #FEEEE4; border-radius: 0 24px 24px 0; padding: 32px 34px; }
.tuzak + .tuzak { margin-top: 26px; }
.tuzak b.baslik { display: block; font: 700 32px 'Inter', sans-serif; color: #C24000; margin-bottom: 8px; letter-spacing: .02em; }
.dogru { color: #2E7D1F; font-weight: 700; }
.yanlis { color: #C0392B; font-weight: 700; text-decoration: line-through; text-decoration-thickness: 4px; }
.cta { margin-top: auto; display: flex; align-items: center; gap: 26px; background: var(--vurgu); color: #fff; border-radius: 28px; padding: 30px 36px; }
.cta p { color: #fff; font-weight: 600; }
.cta .ikon { font-size: 60px; line-height: 1; }
.kucuk { font-size: 31px; color: #5C554F; }
.alta { margin-top: auto; }
.ortala { text-align: center; }
.ara { flex: 1; }
.siklar { display: grid; gap: 18px; }
.sik { display: flex; align-items: center; gap: 22px; background: rgba(255,255,255,.1); border: 3px solid rgba(255,255,255,.28);
       border-radius: 22px; padding: 22px 28px; font: 600 40px 'Inter', sans-serif; color: #fff; }
.sik .harf { width: 58px; height: 58px; border-radius: 50%; background: #fff; color: #F85300; display: grid; place-items: center;
             font: 700 30px 'Poppins', sans-serif; flex: none; }
.sik sup { font-size: .6em; vertical-align: .62em; line-height: 0; }
.sik sub { font-size: .6em; vertical-align: -.25em; line-height: 0; }
.koyu { background: #F85300; color: #fff; }
.koyu h1, .koyu h2, .koyu p, .koyu li { color: #fff; }
.koyu .alt { color: rgba(255,255,255,.75); }
.koyu .alt .hesap { color: #fff; }
.telefon { width: 380px; border-radius: 52px; background: #1d1726; padding: 16px; box-shadow: 0 30px 60px rgba(33,26,46,.22); flex: none; }
.telefon img { display: block; width: 100%; border-radius: 38px; }
'''


def sayfa_html(slaytlar):
    return ('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + CSS +
            '</style></head><body>' + ''.join(slaytlar) + '</body></html>')


def slayt(govde, seri_metni, seri='9', sayfa=None, toplam=None, kaydir=False, hikaye=False, koyu=False,
          desen=True, hesap='', ek_sinif=''):
    vurgu = SERI_RENK.get(seri, RENK['mor'])
    acik = '#FEEEE4'
    isik = '#FDD3BC'
    stil = f'--vurgu:{vurgu};--acik:{acik};--isik:{isik};'
    sinif = 's' + (' hikaye' if hikaye else '') + (' koyu' if koyu else '') + (' ' + ek_sinif if ek_sinif else '')
    desen_svg = altigen_kume(renk='#FFFFFF' if koyu else '#F85300') if desen else ''
    alt_sol = f'<span class="imza"><img src="{LOGO_ISARET}"><b>kimyamed</b> · kayıt yok · link profilde</span>'
    alt_sag = '<span class="kaydir">kaydır →</span>' if kaydir else (f'<span class="sayfa">{sayfa}/{toplam}</span>' if sayfa and toplam else '<span></span>')
    logo = f'<img class="isaret" src="{LOGO_ISARET}"><span class="marka">kimyamed</span>'
    return (f'<section class="{sinif}" style="{stil}">{desen_svg}'
            f'<header class="ust">{logo}<span class="seri" style="background:{"rgba(255,255,255,.16)" if koyu else vurgu}">{seri_metni}</span></header>'
            f'<div class="govde">{govde}</div>'
            f'<footer class="alt">{alt_sol}{alt_sag}</footer></section>')


def bas(slaytlar, klasor, onek, jpg=False):
    """slaytları PNG olarak kaydeder; dosya yollarını döndürür"""
    from playwright.sync_api import sync_playwright
    os.makedirs(klasor, exist_ok=True)
    html_yol = os.path.join(klasor, onek + '.html')
    with open(html_yol, 'w', encoding='utf-8') as f:
        f.write(sayfa_html(slaytlar))
    yollar = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1080, 'height': 1350}, device_scale_factor=1)
        pg.goto('file://' + html_yol)
        pg.wait_for_timeout(400)
        pg.evaluate('document.fonts.ready')
        for i, el in enumerate(pg.query_selector_all('section.s'), 1):
            yol = os.path.join(klasor, f'{onek}-{i}.' + ('jpg' if jpg else 'png'))
            if jpg:
                el.screenshot(path=yol, type='jpeg', quality=92)
            else:
                el.screenshot(path=yol)
            yollar.append(yol)
        # taşma denetimi: gövdenin içeriği kutusundan taşıyor mu
        tasma = pg.evaluate('''() => [...document.querySelectorAll('section.s')].map((s, i) => {
            const g = s.querySelector('.govde'); const r = [];
            if (g.scrollHeight > g.clientHeight + 2) r.push('govde ' + (g.scrollHeight - g.clientHeight) + 'px');
            s.querySelectorAll('.govde *').forEach(e => { if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') r.push(e.tagName + ' yatay'); });
            return r.length ? (i + 1) + ': ' + r.join(', ') : null; }).filter(Boolean)''')
        b.close()
    return yollar, tasma


def pafta(yollar, hedef, sutun=4, gen=360):
    """küçük önizleme paftası"""
    from PIL import Image
    ims = [Image.open(y).convert('RGB') for y in yollar]
    oran = ims[0].height / ims[0].width
    yuk = int(gen * oran)
    satir = math.ceil(len(ims) / sutun)
    can = Image.new('RGB', (sutun * gen + (sutun + 1) * 16, satir * yuk + (satir + 1) * 16), (230, 230, 230))
    for i, im in enumerate(ims):
        im = im.resize((gen, yuk))
        can.paste(im, (16 + (i % sutun) * (gen + 16), 16 + (i // sutun) * (yuk + 16)))
    can.save(hedef, quality=85)
    return hedef


def ok(x1, y1, x2, y2, renk='#14110F', kalinlik=4, uc=18, op=1.0):
    """düz ok: çizgi + ucu açıkça hesaplanmış üçgen (marker kullanılmaz)"""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    bx, by = x2 - ux * uc, y2 - uy * uc
    px, py = -uy, ux
    w = uc * 0.55
    tri = f'{x2:.1f},{y2:.1f} {bx + px * w:.1f},{by + py * w:.1f} {bx - px * w:.1f},{by - py * w:.1f}'
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{renk}" stroke-width="{kalinlik}" stroke-linecap="round" opacity="{op}"/>'
            f'<polygon points="{tri}" fill="{renk}" opacity="{op}"/>')


def aufbau(gen=560, satir=6, renk='#4F9A24'):
    """orbital doldurma sırası (köşegen kuralı) şeması"""
    harfler = ['s', 'p', 'd', 'f']
    sx, sy = 120, 66
    ox, oy = 40, 40
    parca = []
    hucre = {}
    for n in range(1, satir + 1):
        for l in range(min(n, 4)):
            x = ox + l * sx
            y = oy + (n - 1) * sy
            hucre[(n, l)] = (x, y)
            parca.append(f'<text x="{x}" y="{y + 12}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="34" fill="#14110F">{n}{harfler[l]}</text>')
    # köşegenler: n + l sabit
    for k in range(1, satir + 1):
        noktalar = [(n, l) for (n, l) in hucre if n + l == k]
        if len(noktalar) < 1:
            continue
        noktalar.sort(key=lambda t: -t[1])  # sağ üstten sol alta
        (n1, l1), (n2, l2) = noktalar[0], noktalar[-1]
        x1, y1 = hucre[(n1, l1)]
        x2, y2 = hucre[(n2, l2)]
        # oku hücrelerin biraz dışından başlat/bitir
        x1 += 34; y1 -= 30; x2 -= 30; y2 += 30
        if (n1, l1) == (n2, l2):
            x1, y1 = hucre[(n1, l1)][0] + 40, hucre[(n1, l1)][1] - 26
            x2, y2 = hucre[(n1, l1)][0] - 34, hucre[(n1, l1)][1] + 30
        parca.append(ok(x1, y1, x2, y2, renk=renk, kalinlik=4, uc=20, op=0.85))
    yuk = oy + (satir - 1) * sy + 60
    return f'<svg width="{gen}" height="{yuk}" viewBox="0 0 {gen} {yuk}">{"".join(parca)}</svg>'
