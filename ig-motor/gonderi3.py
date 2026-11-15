# -*- coding: utf-8 -*-
"""Hafta 1 · Çarşamba · Günün Sorusu (TYT, 9. sınıf periyodik özellikler) + Perşembe cevap hikâyesi"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta, RENK


def iy(z, s, yuk):
    return f'<span class="z" style="color:inherit; opacity:.75">{z}</span>{s}<sup>{yuk}</sup>'


soru = slayt(f'''
<div style="margin-top:56px">
  <div class="ust-not" style="color:#FFE3D2">9. SINIF · PERİYODİK ÖZELLİKLER</div>
  <p style="font-size:46px; line-height:1.38; font-weight:600">
    {iy(9, 'F', '−')}, {iy(11, 'Na', '+')} ve {iy(12, 'Mg', '2+')} taneciklerinin elektron sayıları eşittir.</p>
  <p style="font-size:46px; line-height:1.38; font-weight:600; margin-top:22px">Bu taneciklerin yarıçaplarının <u style="text-decoration-thickness:4px; text-underline-offset:8px">büyükten küçüğe</u> sıralanışı hangisidir?</p>
</div>
<div class="siklar" style="margin-top:44px">
  <div class="sik"><span class="harf">A</span><span>Na<sup>+</sup> &gt; F<sup>−</sup> &gt; Mg<sup>2+</sup></span></div>
  <div class="sik"><span class="harf">B</span><span>F<sup>−</sup> &gt; Na<sup>+</sup> &gt; Mg<sup>2+</sup></span></div>
  <div class="sik"><span class="harf">C</span><span>Mg<sup>2+</sup> &gt; Na<sup>+</sup> &gt; F<sup>−</sup></span></div>
  <div class="sik"><span class="harf">D</span><span>F<sup>−</sup> &gt; Mg<sup>2+</sup> &gt; Na<sup>+</sup></span></div>
  <div class="sik"><span class="harf">E</span><span>Na<sup>+</sup> &gt; Mg<sup>2+</sup> &gt; F<sup>−</sup></span></div>
</div>
<p class="alta" style="font-size:34px; font-weight:600; opacity:.92">Cevabını yorumlara yaz · açıklaması yarın hikâyede</p>
''', 'GÜNÜN SORUSU · TYT', 'soru', koyu=True)


def daire_svg():
    """üç izoelektronik taneciğin yarıçap karşılaştırması"""
    veriler = [('F', '−', 9, 150, RENK['yesil']), ('Na', '+', 11, 118, RENK['mavi']), ('Mg', '2+', 12, 100, RENK['turuncu'])]
    x = 20
    parca = []
    for ad, yuk, p, r, renk in veriler:
        cx = x + r
        parca.append(f'<circle cx="{cx}" cy="170" r="{r}" fill="{renk}" opacity=".14"/><circle cx="{cx}" cy="170" r="{r}" fill="none" stroke="{renk}" stroke-width="5"/>')
        parca.append(f'<text x="{cx}" y="182" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="48" fill="#14110F">{ad}<tspan font-size="30" dy="-20">{yuk}</tspan></text>')
        parca.append(f'<text x="{cx}" y="372" text-anchor="middle" font-family="Inter" font-weight="700" font-size="30" fill="{renk}">{p} proton</text>')
        parca.append(f'<text x="{cx}" y="410" text-anchor="middle" font-family="Inter" font-weight="600" font-size="27" fill="#5C554F">10 elektron</text>')
        x = cx + r + 40
    return f'<svg width="912" height="420" viewBox="0 0 912 420">{"".join(parca)}</svg>'


cevap = slayt(f'''
<div class="ust-not" style="margin-top:20px">DÜNÜN SORUSU</div>
<div style="display:flex; align-items:center; gap:30px">
  <span class="daire" style="width:150px; height:150px; font-size:92px">B</span>
  <div class="formul" style="font-size:64px">F<sup>−</sup> &gt; Na<sup>+</sup> &gt; Mg<sup>2+</sup></div>
</div>
<div style="margin-top:60px">{daire_svg()}</div>

<div class="kutu renkli" style="margin-top:40px"><p>Üçünde de <b>10 elektron</b> var. Elektron sayısı aynıysa <b>proton sayısı büyük olan</b> elektronları daha güçlü çeker; <b>yarıçap küçülür.</b></p></div>
<p class="alta ortala" style="font-weight:700; color:#F85300">Yeni soru her çarşamba</p>
''', 'CEVAP', 'soru', hikaye=True)

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-3-car')
    yollar, tasma = bas([soru], klasor, 'car')
    print('taşma:', tasma or 'yok', yollar)
    yollar2, tasma2 = bas([cevap], klasor, 'per-hikaye')
    print('taşma:', tasma2 or 'yok', yollar2)
