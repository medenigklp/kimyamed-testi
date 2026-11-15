# -*- coding: utf-8 -*-
"""Hafta 1 · Pazartesi · 9. sınıf · Periyodik tabloda yer bulma (7 slayt)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, pafta, RENK

SERI = '9'
SERI_METNI = '9. SINIF · KONU ÖZETİ'
T = 7


def mini_tablo(vurgu=None, etiket='', gen=912, yuk_hucre=46, bosluk=4):
    """18 sütun x 7 periyot sade periyodik tablo; vurgu=(periyot, sütun)"""
    hg = (gen - 17 * bosluk) / 18
    blok_renk = {'s': '#DCEFD0', 'p': '#D3E4F6', 'd': '#FBE0CF'}
    parcalar = []
    for per in range(1, 8):
        for sut in range(1, 19):
            if per == 1 and sut not in (1, 18):
                continue
            if per in (2, 3) and 3 <= sut <= 12:
                continue
            blok = 's' if sut <= 2 else ('d' if sut <= 12 else 'p')
            if per == 1 and sut == 18:
                blok = 'p'
            x = (sut - 1) * (hg + bosluk)
            y = (per - 1) * (yuk_hucre + bosluk)
            dolgu = blok_renk[blok]
            if vurgu and (per, sut) == vurgu:
                dolgu = RENK['mor']
            parcalar.append(f'<rect x="{x:.1f}" y="{y}" width="{hg:.1f}" height="{yuk_hucre}" rx="7" fill="{dolgu}"/>')
            if vurgu and (per, sut) == vurgu and etiket:
                parcalar.append(f'<text x="{x + hg / 2:.1f}" y="{y + yuk_hucre / 2 + 9}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="26" fill="#fff">{etiket}</text>')
    toplam_yuk = 7 * (yuk_hucre + bosluk)
    # blok adları
    parcalar.append(f'<text x="{(hg + bosluk) - 2:.1f}" y="{toplam_yuk + 40}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="24" fill="#2F8F1F">s bloku</text>')
    parcalar.append(f'<text x="{7.5 * (hg + bosluk):.1f}" y="{toplam_yuk + 40}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="24" fill="#C4561A">d bloku</text>')
    parcalar.append(f'<text x="{15.5 * (hg + bosluk):.1f}" y="{toplam_yuk + 40}" text-anchor="middle" font-family="Inter" font-weight="700" font-size="24" fill="#0062B1">p bloku</text>')
    return f'<svg width="{gen}" height="{toplam_yuk + 52}" viewBox="0 0 {gen} {toplam_yuk + 52}">{"".join(parcalar)}</svg>'


def el(z, s):
    return f'<span class="z">{z}</span>{s}'


def serit(adlar, vurgu=None):
    renk = {'s': ('#DCEFD0', '#2F6E12'), 'p': ('#D3E4F6', '#0B4F8C'), 'd': ('#FBE0CF', '#A8440E')}
    parca = []
    for i, a in enumerate(adlar):
        zemin, yazi = renk[a[-1]]
        kenar = 'box-shadow:0 0 0 5px #F85300;' if vurgu and i in vurgu else ''
        parca.append(f'<span style="display:inline-block; min-width:118px; text-align:center; padding:16px 18px; border-radius:18px; background:{zemin}; color:{yazi}; font:700 44px Inter; {kenar}">{a}</span>')
        if i < len(adlar) - 1:
            parca.append('<svg width="34" height="30" viewBox="0 0 34 30"><path d="M2 15h22" stroke="#9A93A6" stroke-width="4" stroke-linecap="round"/><path d="M20 5l12 10-12 10z" fill="#9A93A6"/></svg>')
    return ''.join(parca)


slaytlar = []

# 1 · kapak
slaytlar.append(slayt(f'''
<div style="margin-top:64px">
  <div class="ust-not">ATOMDAN PERİYODİK TABLOYA</div>
  <h1>Periyodik tabloda <em>yerini</em> 3&nbsp;adımda bul</h1>
  <p class="alt-baslik">Elektron diziliminden periyodu ve grubu okumanın en kısa yolu.</p>
</div>
<div class="ara"></div>
<div style="position:relative">
  {mini_tablo(vurgu=(3, 17), etiket='Cl')}
  <div style="position:absolute; right:0; top:-74px; display:flex; align-items:center; gap:12px">
    <span class="etiket" style="background:#F85300">₁₇Cl → 3. periyot · 7A</span>
  </div>
</div>
''', SERI_METNI, SERI, 1, T, kaydir=True))

# 2 · adım 1
slaytlar.append(slayt(f'''
<div class="adim" style="margin-top:40px"><span class="daire">1</span><span class="ad">ADIM 1</span></div>
<h2>Elektron dizilimini yaz</h2>
<div class="kutu renkli"><div class="formul">{el(17, 'Cl')} : 1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> 3s<sup>2</sup> 3p<sup>5</sup></div>
<p class="kucuk" style="margin-top:14px">Kısaltılmış hâli: <b style="color:#14110F">[Ne] 3s<sup>2</sup> 3p<sup>5</sup></b> &nbsp;·&nbsp; kontrol: 2+2+6+2+5 = <b style="color:#14110F">17</b></p></div>
<div style="margin:auto 0">
  <p class="kucuk" style="font-weight:700; color:#F85300; letter-spacing:.08em; margin-bottom:18px">DOLDURMA SIRASI</p>
  <div style="display:flex; flex-wrap:wrap; gap:14px 10px; align-items:center">
    {serit(['1s','2s','2p','3s','3p'])}
  </div>
  <div style="display:flex; flex-wrap:wrap; gap:14px 10px; align-items:center; margin-top:16px">
    {serit(['4s','3d','4p','5s','4d'], vurgu=(0, 1))}<span class="kucuk" style="font-size:40px; font-weight:700">…</span>
  </div>
  <div class="tuzak" style="margin-top:28px; border-left-color:#F85300; background:#FEEEE4"><p><b>4s, 3d'den önce dolar.</b> Aynı kayma bir üst katta da var: 5s, 4d'den önce dolar.</p></div>
</div>
''', SERI_METNI, SERI, 2, T))

# 3 · adım 2 periyot
slaytlar.append(slayt(f'''
<div class="adim" style="margin-top:40px"><span class="daire">2</span><span class="ad">ADIM 2</span></div>
<h2>Periyot = <em>en yüksek</em> enerji düzeyi</h2>
<div class="kutu renkli"><div class="formul">1s<sup>2</sup> 2s<sup>2</sup> 2p<sup>6</sup> <span class="isaretle">3</span>s<sup>2</sup> <span class="isaretle">3</span>p<sup>5</sup></div>
<p style="margin-top:14px">En büyük katsayı <b>3</b> → Cl, <b>3. periyottadır.</b></p></div>
<table class="t" style="margin-top:34px">
  <tr><th>Atom</th><th>Dizilimin sonu</th><th>Periyot</th></tr>
  <tr><td>{el(11, 'Na')}</td><td>… 3s<sup>1</sup></td><td><b>3</b></td></tr>
  <tr><td>{el(20, 'Ca')}</td><td>… 4s<sup>2</sup></td><td><b>4</b></td></tr>
  <tr><td>{el(26, 'Fe')}</td><td>… 4s<sup>2</sup> 3d<sup>6</sup></td><td><b>4</b> <span class="kucuk">(3d ile bitse de en yüksek düzey 4)</span></td></tr>
</table>
''', SERI_METNI, SERI, 3, T))

# 4 · adım 3a A grubu
slaytlar.append(slayt(f'''
<div class="adim" style="margin-top:40px"><span class="daire">3</span><span class="ad">ADIM 3 · s VEYA p İLE BİTİYORSA</span></div>
<h2>A grubu: en dış düzeydeki elektronları <em>topla</em></h2>
<div class="kutu renkli"><div class="formul">3s<sup>2</sup> 3p<sup>5</sup> → 2 + 5 = 7 → <span class="vurgu">7A</span></div>
<p style="margin-top:14px">{el(17, 'Cl')}: <b>3. periyot, 7A grubu</b> (halojen)</p></div>
<table class="t" style="margin-top:34px">
  <tr><th>Atom</th><th>En dış düzey</th><th>Grup</th></tr>
  <tr><td>{el(12, 'Mg')}</td><td>3s<sup>2</sup> → 2</td><td><b>2A</b></td></tr>
  <tr><td>{el(15, 'P')}</td><td>3s<sup>2</sup> 3p<sup>3</sup> → 2 + 3</td><td><b>5A</b></td></tr>
  <tr><td>{el(8, 'O')}</td><td>2s<sup>2</sup> 2p<sup>4</sup> → 2 + 4</td><td><b>6A</b></td></tr>
</table>
''', SERI_METNI, SERI, 4, T))

# 5 · adım 3b B grubu
slaytlar.append(slayt(f'''
<div class="adim" style="margin-top:28px"><span class="daire">3</span><span class="ad">ADIM 3 · d İLE BİTİYORSA</span></div>
<h2>B grubu: son <em>s ve d</em> elektronlarını topla</h2>
<div class="kutu renkli"><div class="formul">{el(26, 'Fe')}: [Ar] 4s<sup>2</sup> 3d<sup>6</sup><br>2 + 6 = 8 → <span class="vurgu">8B</span></div>
<p style="margin-top:14px">Fe: <b>4. periyot, 8B grubu</b></p></div>
<table class="t" style="margin-top:24px">
  <tr><th>s + d toplamı</th><th>Grup</th></tr>
  <tr><td>3, 4, 5, 6, 7</td><td><b>3B … 7B</b></td></tr>
  <tr><td>8, 9 veya 10</td><td><b>8B</b> <span class="kucuk">(üç sütun)</span></td></tr>
  <tr><td>11</td><td><b>1B</b></td></tr>
  <tr><td>12</td><td><b>2B</b></td></tr>
</table>
''', SERI_METNI, SERI, 5, T))

# 6 · tuzaklar
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px; color:#E2621A">YAZILIDA EN ÇOK PUAN KAYBETTİREN</div>
<h2>3 tuzak</h2>
<div class="tuzak"><b class="baslik">1 · Yalnız son orbitali sayma</b>
<p>Cl: 3p<sup>5</sup> → <span class="yanlis">5A</span> &nbsp; 3s<sup>2</sup> 3p<sup>5</sup> → <span class="dogru">7A</span></p></div>
<div class="tuzak"><b class="baslik">2 · Helyum 2A değildir</b>
<p>{el(2, 'He')}: 1s<sup>2</sup> → <span class="yanlis">2A</span> &nbsp; <span class="dogru">1. periyot, 8A</span> (soy gaz)</p></div>
<div class="tuzak"><b class="baslik">3 · B grubunda yalnız d'yi sayma</b>
<p>Fe: 3d<sup>6</sup> → <span class="yanlis">6B</span> &nbsp; 4s<sup>2</sup> 3d<sup>6</sup> → <span class="dogru">8B</span></p></div>
''', SERI_METNI, SERI, 6, T))

# 7 · sıra sende + kaydet
slaytlar.append(slayt(f'''
<div class="ust-not" style="margin-top:40px">SIRA SENDE</div>
<h2>Bu iki atom nerede?</h2>
<div class="yan">
  <div class="kutu ortala" style="padding:40px 20px"><div class="formul" style="font-size:72px">{el(20, 'Ca')}</div><p class="kucuk" style="margin-top:8px">periyot? grup?</p></div>
  <div class="kutu ortala" style="padding:40px 20px"><div class="formul" style="font-size:72px">{el(30, 'Zn')}</div><p class="kucuk" style="margin-top:8px">periyot? grup?</p></div>
</div>
<p style="margin-top:30px">Cevabını <b>yorumlara</b> yaz; doğru cevap yarın hikâyede.</p>
<div class="cta">
  <svg width="56" height="68" viewBox="0 0 24 29"><path d="M3 2h18v25l-9-6-9 6z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>
  <p><b>Kaydet</b>, yazılıdan önce bir daha bak.<br><span style="font-weight:500; opacity:.9">9. sınıf konu anlatımı ve 900'den fazla çözümlü soru: <b>kimyamed</b> (profildeki bağlantı)</span></p>
</div>
''', SERI_METNI, SERI, 7, T))

if __name__ == '__main__':
    klasor = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'h1-1-pzt')
    yollar, tasma = bas(slaytlar, klasor, 'pzt')
    print('taşma:', tasma or 'yok')
    print(pafta(yollar, os.path.join(klasor, 'pafta.jpg'), sutun=4))
