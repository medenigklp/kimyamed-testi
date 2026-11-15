# -*- coding: utf-8 -*-
"""Hafta 1 · Cumartesi · Ücretsiz kaynak: kimyamed + hesabın haftalık düzeni (5 slayt)
Ronya şimdilik paylaşılmıyor (kullanıcının isteği): bu gönderide yalnızca kimyamed var."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta, RENK

EKRAN = 'file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ekran')
SERI = 'arac'
SERI_METNI = 'ÜCRETSİZ KAYNAK'
T = 5


def telefon(ad, gen=360, ek=''):
    return f'<div class="telefon" style="width:{gen}px; {ek}"><img src="{EKRAN}/{ad}.png"></div>'


slaytlar = []

slaytlar.append(slayt(f'''
<div style="margin-top:56px">
  <div class="ust-not">ÜCRETSİZ · ÜYELİK YOK</div>
  <h1>Kimyayı <em>ücretsiz</em> çalış</h1>
  <p class="alt-baslik">Konu anlatımı ve 2.400'den fazla çözümlü soru</p>
</div>
<div style="position:relative; flex:1; margin:24px -84px 0">
  <div style="position:absolute; left:150px; top:64px; transform:rotate(-9deg)">{telefon('km-konu', 280)}</div>
  <div style="position:absolute; right:150px; top:64px; transform:rotate(9deg)">{telefon('km-soru', 280)}</div>
  <div style="position:absolute; left:50%; top:6px; transform:translateX(-50%)">{telefon('km-dizin', 300)}</div>
</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))


def ozellik_slayti(no, ad, alt, maddeler, ekran, adres, sayfa, boyut=60):
    lis = ''.join(f'<li>{m}</li>' for m in maddeler)
    adres_html = f'<p class="kucuk" style="margin-top:38px; font-weight:600; overflow-wrap:anywhere">{adres}</p>' if adres else ''
    return slayt(f'''
<div class="yan" style="margin-top:44px; gap:40px; flex:1; align-items:flex-start">
  <div style="flex:1; min-width:0">
    <div class="ust-not">{no}</div>
    <h2 style="font-size:{boyut}px">{ad}</h2>
    <p style="color:#4A4458; margin-bottom:34px">{alt}</p>
    <ul class="madde">{lis}</ul>
    {adres_html}
  </div>
  <div style="flex:0 0 360px; margin-top:20px">{telefon(ekran, 360)}</div>
</div>
''', SERI_METNI, SERI, sayfa, T)


slaytlar.append(ozellik_slayti('1 · KONU ANLATIMI', 'Her konu şekil ve grafikle', '9. sınıfta 9, 10 ve 11. sınıfta 6\'şar modül.',
                               ['Maarif modeli kapsamında', '270 şekil ve grafik', 'Kurallar kutuda, örnekler adım adım'],
                               'km-konu', 'medenigklp.github.io/<wbr>kimyamed-testi/<wbr>konu', 2))
slaytlar.append(ozellik_slayti('2 · ÇÖZÜMLÜ SORULAR', '2.400\'den fazla çözümlü soru', 'Çözümler gizli: önce kendin dene, sonra aç.',
                               ['9. sınıf: 916<br>10. sınıf: 584<br>11. sınıf: 904', 'Adım adım çözümler', '1.000\'den fazla “kendin çöz” sorusu'],
                               'km-soru', '', 3))
slaytlar.append(ozellik_slayti('3 · YAZILIYA PROVA', '100 puanlık yazılı denemeleri', 'Gerçek yazılı düzeninde, puanlı sorular.',
                               ['17 modülde yazılı denemesi', 'Çözümlerde puanlama notu', 'Karma tekrar ve kavram özeti'],
                               'km-yazili', '', 4))

gunler = [('Pzt', 'Konu özeti', '9-10. sınıf', RENK['yesil']), ('Sal', 'Reels', 'kimya hayatın içinde', RENK['turuncu']),
          ('Çar', 'Günün Sorusu', 'TYT-AYT tarzı', RENK['mor']), ('Per', 'Konu özeti', '11-12. sınıf', RENK['turuncu']),
          ('Cum', 'Reels', '30 saniyede kural', RENK['turuncu']), ('Cmt', 'Tuzak kartı', 'ya da ücretsiz araç', RENK['mavi'])]
satirlar = ''.join(f'''<div style="display:flex; align-items:center; gap:24px; background:#fff; border:3px solid #E7E0D9; border-radius:22px; padding:18px 24px">
  <span style="width:96px; font:700 34px Poppins; color:{r}">{g}</span>
  <span style="font:700 38px Inter; color:#14110F">{a}</span><span class="kucuk" style="margin-left:auto">{b}</span></div>''' for g, a, b, r in gunler)
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">BU HESAPTA</div>
<h2>Her gün bir kimya içeriği</h2>
<div style="display:grid; gap:14px">{satirlar}</div>
<div class="cta alta" style="margin-top:28px">
  <svg width="64" height="64" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
  <p><b>Bağlantılar profilde.</b> Takip et, kaydet, sınıf arkadaşına gönder.</p>
</div>
''', SERI_METNI, SERI, 5, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-6-cmt')
    yollar, tasma = bas(slaytlar, klasor, 'cmt2')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta.jpg'), sutun=5, gen=300))
