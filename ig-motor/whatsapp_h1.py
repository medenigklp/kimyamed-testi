# -*- coding: utf-8 -*-
"""WhatsApp durumu için dikey görseller: gönderi duyuruları + bilgi hikâyeleri (Instagram'a yönlendiren alt satırla)"""
import sys, os, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, WA_IMZA
from PIL import Image

KOK = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KOK, 'cikti')
WA = os.path.join(CIKTI, 'whatsapp')

# (dosya adı, kapak görseli)
DUYURULAR = [
    ('wa-15-kasim-pazar-gonderi', 'h0-paz/paz15-1.png'),
    ('wa-16-kasim-pazartesi-gonderi', 'h1-1-pzt/pzt-1.png'),
    ('wa-18-kasim-carsamba-gonderi', 'h1-3-car/car-1.png'),
    ('wa-19-kasim-persembe-gonderi', 'h1-4-per/per-1.png'),
    ('wa-21-kasim-cumartesi-gonderi', 'h1-6-cmt/cmt3-1.png'),
    ('wa-22-kasim-pazar-gonderi', 'h1-7-paz/paz22-1.png'),
]
BILGI_ADLARI = ['15-kasim-pazar', '16-kasim-pazartesi', '17-kasim-sali', '18-kasim-carsamba', '19-kasim-persembe',
                '20-kasim-cuma', '21-kasim-cumartesi', '22-kasim-pazar']
REELS = [('wa-17-kasim-sali-reels.mp4', 'h1-2-sal/sal-reels.mp4'), ('wa-20-kasim-cuma-reels.mp4', 'h1-5-cum/cum-reels.mp4')]


def duyuru(kapak):
    return slayt(f'''
<div class="ust-not" style="margin-top:10px">BUGÜN INSTAGRAM'DA</div>
<div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:44px">
  <img src="file://{os.path.join(CIKTI, kapak)}" style="width:860px; border-radius:30px; border:3px solid #E7E0D9; box-shadow:0 26px 56px rgba(20,17,15,.18)">
  <p class="ortala" style="font-weight:700; font-size:48px">Devamı Instagram'da: <span class="vurgu">@kimyamed</span></p>
</div>
''', 'YENİ GÖNDERİ', 'wa', hikaye=True, imza=WA_IMZA)


if __name__ == '__main__':
    os.makedirs(WA, exist_ok=True)
    for ad, kapak in DUYURULAR:
        yollar, tasma = bas([duyuru(kapak)], WA, ad)
        Image.open(yollar[0]).convert('RGB').save(os.path.join(WA, ad + '.jpg'), quality=90)
        os.remove(yollar[0]); os.remove(os.path.join(WA, ad + '.html'))
        print(ad, 'taşma:', tasma or 'yok')
    for i, ad in enumerate(BILGI_ADLARI, 1):
        Image.open(os.path.join(CIKTI, 'bilgi', f'wa-bilgi-{i}-1.png')).convert('RGB').save(os.path.join(WA, f'wa-{ad}-bilgi.jpg'), quality=90)
    for hedef, kaynak in REELS:
        shutil.copy(os.path.join(CIKTI, kaynak), os.path.join(WA, hedef))
    print(sorted(os.listdir(WA)))
