# -*- coding: utf-8 -*-
"""Hafta 1 · Perşembe · 11. sınıf · Tepkime hızı: sıcaklık, katalizör, derişim tek grafikte (7 slayt)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta, RENK, ok

SERI = '11'
SERI_METNI = '11. SINIF · KONU ÖZETİ'
T = 7
TUR = RENK['turuncu']
GRI = '#9A93A6'


def f(E, T=1.0, k=1.0):
    A = 2 / (math.sqrt(math.pi) * T ** 1.5)
    return k * A * math.sqrt(max(E, 0)) * math.exp(-E / T)


def grafik(egriler, esikler, golge=None, gen=912, yuk=470, ymax=0.62, Emax=8.0, etiket_esik=True, eksen_etiket=True):
    """egriler: [(T, k, renk, kalınlık, ad)], esikler: [(E, renk, ad, kesikli)], golge: (T, k, E_esik, renk)"""
    sol, alt, ust, sag = 70, 70, 30, 30
    pw, ph = gen - sol - sag, yuk - alt - ust
    X = lambda E: sol + E / Emax * pw
    Y = lambda v: ust + ph - v / ymax * ph
    p = []
    if golge:
        Tg, kg, Eg, rg = golge
        noktalar = [(X(Eg), Y(0))]
        E = Eg
        while E <= Emax:
            noktalar.append((X(E), Y(f(E, Tg, kg))))
            E += 0.04
        noktalar.append((X(Emax), Y(0)))
        p.append(f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a, b in noktalar)}" fill="{rg}" opacity=".28"/>')
    for eg in egriler:
        Tc, kc, renk, kal, ad = eg[:5]
        konum = eg[5] if len(eg) > 5 else None
        pts = []
        E = 0.0
        while E <= Emax:
            pts.append(f'{X(E):.1f},{Y(f(E, Tc, kc)):.1f}')
            E += 0.04
        p.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{renk}" stroke-width="{kal}" stroke-linejoin="round"/>')
        if ad:
            Et, dx, dy = konum if konum else (Tc / 2, 34, -14)
            p.append(f'<text x="{X(Et) + dx:.1f}" y="{Y(f(Et, Tc, kc)) + dy:.1f}" font-family="Inter" font-weight="700" font-size="30" fill="{renk}">{ad}</text>')
    for es in esikler:
        Ee, renk, ad, kesik = es[:4]
        yon = es[4] if len(es) > 4 else 'sag'
        dash = 'stroke-dasharray="14 10"' if kesik else ''
        p.append(f'<line x1="{X(Ee):.1f}" y1="{Y(0):.1f}" x2="{X(Ee):.1f}" y2="{ust + 10:.1f}" stroke="{renk}" stroke-width="5" {dash}/>')
        if etiket_esik and ad:
            if yon == 'sol':
                p.append(f'<text x="{X(Ee) - 14:.1f}" y="{ust + 40:.1f}" text-anchor="end" font-family="Inter" font-weight="700" font-size="28" fill="{renk}">{ad}</text>')
            else:
                p.append(f'<text x="{X(Ee) + 14:.1f}" y="{ust + 40:.1f}" font-family="Inter" font-weight="700" font-size="28" fill="{renk}">{ad}</text>')
    # eksenler (ok uçları açıkça çizilir)
    p.append(ok(sol, Y(0), gen - 6, Y(0), renk='#211A2E', kalinlik=4, uc=22))
    p.append(ok(sol, Y(0), sol, ust - 18, renk='#211A2E', kalinlik=4, uc=22))
    if eksen_etiket:
        p.append(f'<text x="{gen - 10}" y="{yuk - 18}" text-anchor="end" font-family="Inter" font-weight="600" font-size="28" fill="#4A4458">Kinetik enerji</text>')
        p.append(f'<text x="{sol - 26}" y="{ust + ph / 2}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="28" fill="#4A4458" transform="rotate(-90 {sol - 26} {ust + ph / 2})">Tanecik sayısı</text>')
    return f'<svg width="{gen}" height="{yuk}" viewBox="0 0 {gen} {yuk}">{"".join(p)}</svg>'


E_ESIK, E_KAT = 3.4, 2.3
slaytlar = []

# 1 kapak
slaytlar.append(slayt(f'''
<div style="margin-top:56px">
  <div class="ust-not">TEPKİME HIZI</div>
  <h1>Sıcaklık mı, katalizör mü? <em>Tek grafikte</em> 3 etki</h1>
  <p class="alt-baslik">Tanecik enerji dağılımı grafiğini okuyan, hız sorularının yarısını çözer.</p>
</div>
<div class="alta">{grafik([(1.0, 1, GRI, 5, ''), (1.8, 1, TUR, 6, '')], [(E_ESIK, '#211A2E', 'Eşik değeri', True)], golge=(1.8, 1, E_ESIK, TUR), yuk=430)}</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))

# 2 grafiği tanı
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">ÖNCE GRAFİĞİ TANI</div>
<h2>Taralı alan = <em>eşik değerine</em> ulaşan tanecikler</h2>
<div>{grafik([(1.0, 1, TUR, 6, '')], [(E_ESIK, '#211A2E', 'Eşik değeri', True)], golge=(1.0, 1, E_ESIK, TUR))}</div>
<ul class="madde alta">
  <li><b>Eşik değeri:</b> etkin çarpışma için gereken en düşük kinetik enerji</li>
  <li>Taralı alan büyüdükçe etkin çarpışma artar, <b>tepkime hızlanır</b></li>
</ul>
''', SERI_METNI, SERI, 2, T))

# 3 sıcaklık
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">1 · SICAKLIK ARTARSA</div>
<h2>Değişen: <em>eğrinin kendisi</em></h2>
<div>{grafik([(1.0, 1, GRI, 5, 'T₁', (0.85, 22, -16)), (1.8, 1, TUR, 6, 'T₂', (2.0, 20, -22))], [(E_ESIK, '#211A2E', 'Eşik değeri', True)], golge=(1.8, 1, E_ESIK, TUR))}</div>
<ul class="madde alta">
  <li>Eğri <b>sağa kayar ve basıklaşır</b>; eşik değeri yerinde kalır</li>
  <li>Toplam alan aynı (tanecik sayısı değişmez), <b>taralı alan büyür</b></li>
</ul>
''', SERI_METNI, SERI, 3, T))

# 4 katalizör
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">2 · KATALİZÖR EKLENİRSE</div>
<h2>Değişen: <em>eşik değeri çizgisi</em></h2>
<div>{grafik([(1.0, 1, '#211A2E', 5, '')], [(E_ESIK, GRI, 'Katalizörsüz', True, 'sag'), (E_KAT, TUR, 'Katalizörlü', False, 'sol')], golge=(1.0, 1, E_KAT, TUR))}</div>
<ul class="madde alta">
  <li>Eğri <b>aynı kalır</b>; çizgi <b>sola kayar</b> (daha düşük aktivasyon enerjili yol)</li>
  <li>İnhibitör tam tersini yapar: çizgi <b>sağa</b> kayar</li>
</ul>
''', SERI_METNI, SERI, 4, T))

# 5 derişim
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">3 · DERİŞİM ARTARSA</div>
<h2>Değişen: <em>eğrinin altındaki toplam alan</em></h2>
<div>{grafik([(1.0, 1, GRI, 5, 'önce', (1.3, 26, 10)), (1.0, 1.55, TUR, 6, 'sonra', (0.5, 40, -16))], [(E_ESIK, '#211A2E', 'Eşik değeri', True)], golge=(1.0, 1.55, E_ESIK, TUR), ymax=0.86)}</div>
<ul class="madde alta">
  <li>Birim hacimdeki tanecik sayısı artar; eğrinin <b>şekli aynı, boyu uzar</b></li>
  <li>Eşiği aşan tanecik <b>sayısı</b> artar, <b>oranı</b> değişmez</li>
</ul>
''', SERI_METNI, SERI, 5, T))

# 6 özet
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">ÖZET · BUNU KAYDET</div>
<h2>Grafikte ne değişir?</h2>
<table class="t">
  <tr><th>Etki</th><th>Grafikte</th><th>Eşiği aşan tanecik</th></tr>
  <tr><td style="white-space:nowrap"><b>Sıcaklık ↑</b></td><td>Eğri sağa kayar, basıklaşır</td><td>Sayısı da oranı da ↑</td></tr>
  <tr><td><b>Katalizör</b></td><td>Eşik çizgisi sola kayar</td><td>Sayısı da oranı da ↑</td></tr>
  <tr><td style="white-space:nowrap"><b>Derişim ↑</b></td><td>Toplam alan büyür</td><td>Sayısı ↑, oranı aynı</td></tr>
</table>
<div class="tuzak alta"><b class="baslik">Yazılıda en çok karıştırılan</b><p>Sıcaklık <b>eğriyi</b>, katalizör <b>çizgiyi</b>, derişim <b>alanı</b> değiştirir.</p></div>
''', SERI_METNI, SERI, 6, T))

# 7 kaydet
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">SIRA SENDE</div>
<h2>Sıcaklık düşürülürse taralı alan ve eşik değeri nasıl değişir?</h2>
<p>Cevabını <b>yorumlara</b> yaz.</p>
<div style="margin:auto 0">{grafik([(1.0, 1, TUR, 6, '')], [(E_ESIK, '#211A2E', 'Eşik değeri', True)], golge=(1.0, 1, E_ESIK, TUR), yuk=340)}</div>
<div class="cta" style="margin-top:0">
  <svg width="56" height="68" viewBox="0 0 24 29"><path d="M3 2h18v25l-9-6-9 6z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>
  <p><b>Kaydet</b>, hız konusunun yazılısında işine yarar.<br><span style="font-weight:500; opacity:.92">11. sınıf tepkime hızı konu anlatımı ve 180 çözümlü soru: <b>kimyamed</b> (profildeki bağlantı)</span></p>
</div>
''', SERI_METNI, SERI, 7, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-4-per')
    yollar, tasma = bas(slaytlar, klasor, 'per')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta.jpg'), sutun=4))
