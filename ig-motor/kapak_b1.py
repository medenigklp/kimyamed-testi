# -*- coding: utf-8 -*-
"""1 Dakikada Kimya · Bölüm 1 Reels kapağı (Petek, açık zemin)"""
import os, sys
sys.argv = ['x']
from petek_b1z import kare, svg, hucre, CX, CSS, TUR, MUR, SOLUK, bas, filigran
from seri_kimya import atom
ic = (svg(hucre(CX, 700, 270, '', yanik=True))
      + f'<div style="position:absolute; left:0; right:0; top:505px; display:flex; justify-content:center">{atom(390)}</div>'
      + f'''<div style="position:absolute; left:0; right:0; top:300px; display:flex; justify-content:center">
  <div style="display:inline-flex; align-items:center; gap:14px; padding:14px 28px; border-radius:999px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 8px 24px rgba(20,17,15,.06)">
    <span style="font:800 30px Poppins; color:{TUR}">1 Dakikada Kimya</span><span style="width:8px; height:8px; border-radius:50%; background:{SOLUK}"></span><span style="font:800 30px Poppins">Bölüm 1</span></div></div>
<div style="position:absolute; left:60px; right:60px; top:1050px; text-align:center; font:800 150px/1 Poppins; letter-spacing:-.03em; color:{MUR}">Kimya<br><span style="color:{TUR}">nedir?</span></div>''')
yollar, tasma = bas([(1, kare(ic, serbest=True))], os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'petek-b1z'), 'kapak')
from PIL import Image
Image.open(yollar[0]).convert('RGB').save(os.path.join(os.path.dirname(yollar[0]), 'reel-b1v2-kapak.jpg'), quality=92, subsampling=0)
print(yollar[0], tasma)
