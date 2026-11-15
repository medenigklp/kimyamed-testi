# -*- coding: utf-8 -*-
"""Pazar 15 Kasım · ilk gönderi · Merak + kültür: Vücudundaki atomlar nereden geldi? (6 slayt)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta

SERI = 'merak'
SERI_METNI = 'MERAK EDİLENLER'
T = 6
MAVI = '#0B5C8A'      # Büyük Patlama
TURUNCU = '#F85300'   # yıldızlar
YESIL = '#2F8F1F'     # yıldız patlamaları
MUREKKEP = '#14110F'
GRI = '#5C554F'
CIZGI = '#E7E0D9'


def karo(z, sembol, ad, renk, boy=150):
    """periyodik tablo karosu (HTML)"""
    return (f'<div style="width:{boy}px; height:{boy}px; border-radius:{boy * 0.16:.0f}px; background:#fff; border:4px solid {renk}; '
            f'position:relative; flex:none; box-shadow:0 10px 24px rgba(20,17,15,.07)">'
            f'<span style="position:absolute; left:{boy * 0.1:.0f}px; top:{boy * 0.06:.0f}px; font:600 {boy * 0.17:.0f}px Inter; color:{GRI}">{z}</span>'
            f'<span style="position:absolute; inset:0; display:grid; place-items:center; font:700 {boy * 0.44:.0f}px/1 Poppins; color:{renk}; padding-top:{boy * 0.02:.0f}px">{sembol}</span>'
            f'<span style="position:absolute; left:0; right:0; bottom:{boy * 0.07:.0f}px; text-align:center; font:600 {boy * 0.13:.0f}px Inter; color:{GRI}">{ad}</span></div>')


def patlama(cx, cy, r, renk, uc=12, ic_oran=0.55):
    nok = []
    for k in range(uc * 2):
        rr = r if k % 2 == 0 else r * ic_oran
        a = math.pi * k / uc - math.pi / 2
        nok.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
    return f'<polygon points="{" ".join(nok)}" fill="{renk}"/>'


def yildiz(cx, cy, r, renk):
    return patlama(cx, cy, r, renk, uc=5, ic_oran=0.45)


def insan(cx, cy, s, renk):
    return (f'<circle cx="{cx}" cy="{cy - 34 * s:.1f}" r="{18 * s:.1f}" fill="{renk}"/>'
            f'<path d="M{cx - 30 * s:.1f},{cy + 40 * s:.1f} Q{cx - 30 * s:.1f},{cy - 10 * s:.1f} {cx},{cy - 10 * s:.1f} '
            f'Q{cx + 30 * s:.1f},{cy - 10 * s:.1f} {cx + 30 * s:.1f},{cy + 40 * s:.1f} Z" fill="{renk}"/>')


def zaman_cizelgesi():
    W, H = 912, 700
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    duraklar = [
        (150, 120, MAVI, 'Büyük Patlama', '13,8 milyar yıl önce: H', 'patlama'),
        (650, 250, TURUNCU, 'Yıldızlar', 'C, N, O üretilir', 'yildiz'),
        (230, 420, YESIL, 'Yıldız patlamaları', 'Fe ve daha ağırları', 'patlama2'),
        (690, 590, MUREKKEP, 'Sen', 'hepsini taşıyorsun', 'insan'),
    ]
    # kesikli yol
    yol = f'M{duraklar[0][0]},{duraklar[0][1]}'
    for (x0, y0, *_), (x1, y1, *_) in zip(duraklar, duraklar[1:]):
        yol += f' C{x0 + (x1 - x0) * 0.1:.0f},{(y0 + y1) / 2 + 40:.0f} {x1 - (x1 - x0) * 0.1:.0f},{(y0 + y1) / 2 - 40:.0f} {x1},{y1}'
    p.append(f'<path d="{yol}" fill="none" stroke="#CFC6BD" stroke-width="6" stroke-dasharray="4 16" stroke-linecap="round"/>')
    for x, y, renk, ad, alt, tur in duraklar:
        p.append(f'<circle cx="{x}" cy="{y}" r="74" fill="#fff" stroke="{renk}" stroke-width="6"/>')
        if tur == 'patlama':
            p.append(patlama(x, y, 46, renk))
        elif tur == 'yildiz':
            p.append(yildiz(x, y + 4, 48, renk))
        elif tur == 'patlama2':
            p.append(patlama(x, y, 48, renk, uc=9, ic_oran=0.4))
            p.append(f'<circle cx="{x}" cy="{y}" r="14" fill="#fff"/>')
        else:
            p.append(insan(x, y + 8, 1.15, renk))
        sol = x > W / 2
        tx = x - 98 if sol else x + 98
        anchor = 'end' if sol else 'start'
        p.append(f'<text x="{tx}" y="{y - 6}" text-anchor="{anchor}" font-family="Poppins" font-weight="700" font-size="40" fill="{renk}">{ad}</text>')
        p.append(f'<text x="{tx}" y="{y + 40}" text-anchor="{anchor}" font-family="Inter" font-weight="600" font-size="30" fill="{GRI}">{alt}</text>')
    p.append('</svg>')
    return ''.join(p)


def bilesim_grafigi():
    veri = [('O', 'Oksijen', 65, TURUNCU), ('C', 'Karbon', 18, TURUNCU), ('H', 'Hidrojen', 10, MAVI), ('N', 'Azot', 3, TURUNCU), ('', 'Diğer elementler', 4, GRI)]
    W, satir = 912, 118
    H = satir * len(veri) + 10
    en_uzun = 560
    p = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
    for i, (sem, ad, yuzde, renk) in enumerate(veri):
        y = i * satir + 10
        p.append(f'<text x="0" y="{y + 40}" font-family="Poppins" font-weight="700" font-size="40" fill="{MUREKKEP}">{ad}</text>')
        uz = max(14, en_uzun * yuzde / 65)
        p.append(f'<rect x="0" y="{y + 58}" width="{uz:.0f}" height="38" rx="19" fill="{renk}"/>')
        p.append(f'<text x="{uz + 20:.0f}" y="{y + 90}" font-family="Poppins" font-weight="700" font-size="38" fill="{renk}">%{yuzde}</text>')
    p.append('</svg>')
    return ''.join(p)


def ikon_svg(tur, renk, boy=180):
    c = boy / 2
    if tur == 'patlama':
        ic = patlama(c, c, boy * 0.42, renk)
    elif tur == 'yildiz':
        ic = yildiz(c, c + 6, boy * 0.44, renk)
    else:
        ic = patlama(c, c, boy * 0.44, renk, uc=9, ic_oran=0.4) + f'<circle cx="{c}" cy="{c}" r="{boy * 0.12:.0f}" fill="#fff"/>'
    return f'<svg width="{boy}" height="{boy}" viewBox="0 0 {boy} {boy}">{ic}</svg>'


slaytlar = []

slaytlar.append(slayt(f'''
<div style="margin-top:40px">
  <div class="ust-not">KİMYA VE EVREN</div>
  <h1 style="font-size:80px">Vücudundaki atomlar <em>nereden</em> geldi?</h1>
</div>
<div style="display:flex; justify-content:center; margin-top:30px">{zaman_cizelgesi()}</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">ÖNCE BİR BAKALIM</div>
<h2>Vücudun neyden yapılmış?</h2>
<p style="color:#4A433D; margin-bottom:34px">Kütlece en çok bulunan elementler:</p>
{bilesim_grafigi()}
<p class="kucuk alta">Dördü birlikte vücut kütlesinin yaklaşık %96'sını oluşturur.</p>
''', SERI_METNI, SERI, 2, T))


def koken_slayti(no, baslik, karolar, ikon, renk, maddeler, sayfa):
    lis = ''.join(f'<li>{m}</li>' for m in maddeler)
    k = ''.join(karolar)
    return slayt(f'''
<div class="ust-not" style="margin-top:40px">{no}</div>
<h2>{baslik}</h2>
<div style="display:flex; align-items:center; gap:26px; margin:6px 0 44px">{ikon_svg(ikon, renk)}<div style="display:flex; gap:20px">{k}</div></div>
<ul class="madde">{lis}</ul>
''', SERI_METNI, SERI, sayfa, T)


slaytlar.append(koken_slayti('1 · BÜYÜK PATLAMA', 'Hidrojen: evrenin ilk elementi', [karo(1, 'H', 'Hidrojen', MAVI)], 'patlama', MAVI,
                             ['Hidrojen çekirdekleri, Büyük Patlama\'nın ilk anlarında oluştu: yaklaşık <b>13,8 milyar yıl</b> önce.',
                              'Evrende en çok bulunan element hâlâ hidrojendir.',
                              'Vücudundaki her su molekülünde (H<sub>2</sub>O) bu eski atomlardan iki tane var.'], 3))
slaytlar.append(koken_slayti('2 · YILDIZLAR', 'Karbon, azot, oksijen: yıldızların içinden',
                             [karo(6, 'C', 'Karbon', TURUNCU, 140), karo(7, 'N', 'Azot', TURUNCU, 140), karo(8, 'O', 'Oksijen', TURUNCU, 140)], 'yildiz', TURUNCU,
                             ['Yıldızlar, çekirdeklerinde hafif atomları birleştirerek daha ağır atomlar üretir. Buna <b>füzyon</b> denir.',
                              'Karbonun, azotun ve oksijenin büyük kısmı böyle oluştu.',
                              'Yıldızlar ömrünü tamamlarken bu atomlar uzaya saçıldı. Gezegenler ve canlılar bu malzemeden oluştu.'], 4))
slaytlar.append(koken_slayti('3 · YILDIZ PATLAMALARI', 'Demir ve daha ağırları',
                             [karo(26, 'Fe', 'Demir', YESIL, 140), karo(79, 'Au', 'Altın', YESIL, 140)], 'patlama2', YESIL,
                             ['Kanındaki demirin büyük kısmı, <b>süpernova</b> denen yıldız patlamalarında oluştu.',
                              'Altın gibi çok ağır elementler ise nötron yıldızlarının çarpışması gibi olaylarda oluşur.',
                              'Bir altın yüzükteki atomlar, Dünya\'dan bile yaşlıdır.'], 5))

slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">KISACASI</div>
<h2 style="font-size:84px">Hepimiz <em>yıldız tozundan</em> yapıldık.</h2>
<div class="kutu renkli" style="margin-top:10px"><p>Bir sonraki soluğunda aldığın oksijen bir yıldızda, suyundaki hidrojen evrenin ilk anlarında oluştu.</p></div>
<p style="margin-top:34px; font-weight:600">Yarın 18:00: <span class="vurgu">Periyodik tabloda yerini 3 adımda bul</span></p>
<div class="cta">
  <svg width="64" height="64" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>
  <p><b>Kaydet</b> ve bunu bilmeyen bir arkadaşına gönder.</p>
</div>
''', SERI_METNI, SERI, 6, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h0-paz')
    yollar, tasma = bas(slaytlar, klasor, 'paz15')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta.jpg'), sutun=6, gen=300))
