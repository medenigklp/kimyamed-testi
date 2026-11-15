# -*- coding: utf-8 -*-
"""Pazar 22 Kasım · Haftanın mini testi: haftanın gönderilerinden 6 soru (5 slayt, cevaplar sonda)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta

SERI = 'test'
SERI_METNI = 'HAFTANIN MİNİ TESTİ'
T = 5

SORULAR = [
    ('Pazartesi · Periyodik tablo', '<sub style="font-size:.6em">19</sub>K atomu periyodik tablonun neresindedir?',
     ['3. periyot 1A', '4. periyot 1A', '4. periyot 2A', '3. periyot 8A'], 'B'),
    ('Salı · Evde güvenlik', 'Çamaşır suyu ile tuz ruhu karıştırılınca hangi zehirli gaz açığa çıkar?',
     ['Oksijen', 'Karbon dioksit', 'Klor', 'Hidrojen'], 'C'),
    ('Çarşamba · Günün sorusu', 'O<sup>2−</sup>, F<sup>−</sup> ve Na<sup>+</sup> taneciklerinden yarıçapı en küçük olan hangisidir?',
     ['O<sup>2−</sup>', 'F<sup>−</sup>', 'Na<sup>+</sup>', 'Üçü eşit'], 'C'),
    ('Perşembe · Tepkime hızı', 'Katalizör eklenince tanecik enerji dağılımı grafiğinde ne değişir?',
     ['Eğri sağa kayar', 'Eşik değeri çizgisi sola kayar', 'Toplam alan büyür', 'Hiçbir şey'], 'B'),
    ('Cuma · Polarlık', 'Aşağıdaki moleküllerden hangisi polardır?',
     ['CO<sub>2</sub>', 'CH<sub>4</sub>', 'H<sub>2</sub>O', 'CCl<sub>4</sub>'], 'C'),
    ('Cumartesi · Kimya merakı', 'Kışın yollara tuz dökülmesinin nedeni nedir?',
     ['Tuz buzu ısıtır', 'Tuz suyun donma noktasını düşürür', 'Tuz suyun kaynama noktasını düşürür', 'Tuz buzu sertleştirir'], 'B'),
]


def soru_kutusu(no, etiket, metin, siklar):
    sik_html = ''.join(
        f'<div style="display:flex; align-items:center; gap:14px; background:#fff; border:3px solid #E7E0D9; border-radius:18px; padding:18px 20px; '
        f'font:600 34px/1.25 Inter; color:#14110F"><span style="width:44px; height:44px; flex:none; border-radius:50%; background:#FEEEE4; color:#F85300; '
        f'display:grid; place-items:center; font:700 24px Poppins">{h}</span><span>{s}</span></div>'
        for h, s in zip('ABCD', siklar))
    return f'''<div style="margin-bottom:56px">
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px"><span class="daire" style="width:56px; height:56px; font-size:30px">{no}</span>
    <span class="kucuk" style="font-weight:700; letter-spacing:.04em">{etiket}</span></div>
  <p style="font-weight:700; font-size:42px; margin-bottom:20px">{metin}</p>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px">{sik_html}</div>
</div>'''


slaytlar = []
slaytlar.append(slayt('''
<div style="margin-top:60px">
  <div class="ust-not">PAZAR TEKRARI</div>
  <h1>Bu haftayı <em>ne kadar</em> hatırlıyorsun?</h1>
  <p class="alt-baslik">Haftanın gönderilerinden 6 soru. Cevaplar son slaytta, önce kendin dene!</p>
</div>
<div style="flex:1; display:flex; align-items:center; justify-content:center; gap:22px">
  <div style="font:700 300px/1 Poppins; color:#F85300">6</div>
  <div style="font:700 56px/1.15 Poppins; color:#14110F">soru<br><span style="color:#5C554F; font-size:40px">yaklaşık 3 dakika</span></div>
</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))

for s in range(3):
    kutular = ''.join(soru_kutusu(2 * s + i + 1, *SORULAR[2 * s + i][:3]) for i in range(2))
    slaytlar.append(slayt(f'<div style="margin-top:44px">{kutular}</div>', SERI_METNI, SERI, s + 2, T))

cevaplar = ''.join(f'<div style="display:flex; flex-direction:column; align-items:center; gap:8px"><span class="daire" style="width:70px; height:70px; font-size:34px">{i}</span>'
                   f'<span style="font:700 60px Poppins; color:#2E7D1F">{c}</span></div>' for i, (_, _, _, c) in enumerate(SORULAR, 1))
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">CEVAPLAR</div>
<h2>Kaç doğru yaptın?</h2>
<div class="kutu" style="display:flex; justify-content:space-between; padding:34px 44px">{cevaplar}</div>
<ul class="madde" style="margin-top:40px">
  <li><b>6 doğru:</b> Haftanın yıldızısın!</li>
  <li><b>4-5 doğru:</b> Çok iyi. Kaçırdığın gönderiye bir daha bak.</li>
  <li><b>0-3 doğru:</b> Sorun değil, gönderiler profilde seni bekliyor.</li>
</ul>
<div class="cta">
  <svg width="64" height="64" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>
  <p>Puanını <b>yorumlara</b> yaz. Her pazar yeni bir mini test!</p>
</div>
''', SERI_METNI, SERI, 5, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-7-paz')
    yollar, tasma = bas(slaytlar, klasor, 'paz22')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta-paz22.jpg'), sutun=5, gen=300))
