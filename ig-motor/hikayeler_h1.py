# -*- coding: utf-8 -*-
"""Hafta 1 cevap hikâyeleri: Salı (Ca ve Zn), Cuma (sıcaklık düşerse), Cumartesi (BF3)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas
from gonderi4 import grafik, GRI, TUR, E_ESIK

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti')


def el(z, s):
    return f'<span class="z">{z}</span>{s}'


sali = slayt(f'''
<div class="ust-not" style="margin-top:10px">DÜNKÜ "SIRA SENDE"</div>
<h2 style="font-size:76px">Ca ve Zn nerede?</h2>
<div class="kutu" style="margin-top:20px"><div class="formul" style="font-size:58px">{el(20, 'Ca')}: [Ar] 4s<sup>2</sup></div>
<p style="margin-top:12px">s ile bitiyor → A grubu · en dış düzey 4s<sup>2</sup> → <b class="vurgu">4. periyot, 2A</b></p></div>
<div class="kutu" style="margin-top:26px"><div class="formul" style="font-size:58px">{el(30, 'Zn')}: [Ar] 4s<sup>2</sup> 3d<sup>10</sup></div>
<p style="margin-top:12px">d ile bitiyor → B grubu · 2 + 10 = 12 → <b class="vurgu">4. periyot, 2B</b></p></div>
<div class="tuzak" style="margin-top:34px"><p>İkisinin de en dışında 4s<sup>2</sup> var ama grupları farklı: <b>Ca 2A, Zn 2B.</b></p></div>
<p class="alta ortala" style="font-weight:700; color:#F85300">Doğru bilenler, tebrikler!</p>
''', 'CEVAP', '9', hikaye=True)

cuma = slayt(f'''
<div class="ust-not" style="margin-top:10px">DÜNKÜ SORU · 11. SINIF</div>
<h2 style="font-size:70px">Sıcaklık düşürülürse?</h2>
<div>{grafik([(1.8, 1, GRI, 5, 'önce', (1.6, 24, -14)), (1.0, 1, TUR, 6, 'sonra', (0.5, 36, -14))], [(E_ESIK, '#14110F', 'Eşik değeri', True)], golge=(1.0, 1, E_ESIK, TUR), yuk=460)}</div>
<ul class="madde" style="margin-top:20px">
  <li>Eğri <b>sola kayar ve sivrileşir</b></li>
  <li>Eşik değeri <b>değişmez</b></li>
  <li>Taralı alan <b>küçülür</b> → tepkime yavaşlar</li>
</ul>
''', 'CEVAP', '11', hikaye=True)


def bf3(gen=520):
    c = gen / 2
    p = []
    for aci in (-90, 30, 150):
        x = c + 170 * math.cos(math.radians(aci)); y = c + 30 + 170 * math.sin(math.radians(aci))
        p.append(f'<line x1="{c}" y1="{c + 30}" x2="{x:.0f}" y2="{y:.0f}" stroke="#14110F" stroke-width="9" stroke-linecap="round"/>')
    p.append(f'<circle cx="{c}" cy="{c + 30}" r="62" fill="#FEE2D2"/><text x="{c}" y="{c + 48}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="50" fill="#14110F">B</text>')
    for aci in (-90, 30, 150):
        x = c + 170 * math.cos(math.radians(aci)); y = c + 30 + 170 * math.sin(math.radians(aci))
        p.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="54" fill="#fff" stroke="#E7E0D9" stroke-width="4"/><text x="{x:.0f}" y="{y + 17:.0f}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="46" fill="#14110F">F</text>')
    return f'<svg width="{gen}" height="{gen}" viewBox="0 0 {gen} {gen}">{"".join(p)}</svg>'


cumartesi = slayt(f'''
<div class="ust-not" style="margin-top:10px">DÜNKÜ REELS · 9. SINIF</div>
<h2 style="font-size:76px">BF<sub>3</sub> <span class="dogru">apolar</span></h2>
<div style="display:flex; justify-content:center">{bf3()}</div>
<ul class="madde" style="margin-top:10px">
  <li>B'nin 3 değerlik elektronu 3 bağda kullanılır; merkezde <b>ortaklanmamış çift yok</b></li>
  <li>Çevresindeki üç atom aynı (F) → yük dağılımı <b>dengeli</b></li>
</ul>
''', 'CEVAP', '9', hikaye=True)

pazar = slayt(f'''
<div class="ust-not" style="margin-top:10px">DÜNKÜ SORU · 10. SINIF</div>
<h2 style="font-size:76px">Cevap: CaCl<sub>2</sub></h2>
<div class="kutu" style="margin-top:20px"><div class="formul" style="font-size:52px">1 mol NaCl → <b>2 mol</b> iyon</div>
<p class="kucuk" style="margin-top:8px">Na<sup>+</sup> ve Cl<sup>−</sup></p></div>
<div class="kutu" style="margin-top:26px"><div class="formul" style="font-size:52px">1 mol CaCl<sub>2</sub> → <b>3 mol</b> iyon</div>
<p class="kucuk" style="margin-top:8px">Ca<sup>2+</sup> ve 2 tane Cl<sup>−</sup></p></div>
<div class="tuzak" style="margin-top:34px"><p>Suda çözünen tanecik sayısı arttıkça donma noktası <b>daha çok düşer</b>. Eşit molde CaCl<sub>2</sub> daha çok tanecik verir.</p></div>
<p class="alta ortala" style="font-weight:700; color:#F85300">Doğru bilenler, tebrikler!</p>
''', 'CEVAP', 'merak', hikaye=True)

if __name__ == '__main__':
    secim = sys.argv[1:]  # boşsa hepsi; ör. python3 hikayeler_h1.py paz-hikaye
    for ad, sl, kl in [('sal-hikaye', sali, 'h1-2-sal'), ('cum-hikaye', cuma, 'h1-5-cum'), ('cmt-hikaye', cumartesi, 'h1-6-cmt'), ('paz-hikaye', pazar, 'h1-7-paz')]:
        if secim and ad not in secim:
            continue
        yollar, tasma = bas([sl], os.path.join(KOK, kl), ad)
        print(ad, 'taşma:', tasma or 'yok')
