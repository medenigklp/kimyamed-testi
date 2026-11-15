# -*- coding: utf-8 -*-
"""Hafta 1 Reels: Salı (evde karıştırma) ve Cuma (polar bağ ≠ polar molekül)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reel import sahne, gorselleri_bas, videoya_cevir
from motor import ok

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti')


# ---------- Salı: Evde asla karıştırma ----------
def sise(x, ad, renk, kapak='#1d1726'):
    return (f'<g transform="translate({x} 0)">'
            f'<rect x="58" y="10" width="64" height="44" rx="10" fill="{kapak}"/>'
            f'<path d="M48 54h84v40q40 22 40 70v196q0 26-26 26H34q-26 0-26-26V164q0-48 40-70z" fill="{renk}" stroke="#fff" stroke-width="6"/>'
            f'<rect x="22" y="200" width="136" height="110" rx="14" fill="#fff"/>'
            f'<text x="90" y="246" text-anchor="middle" font-family="Inter" font-weight="800" font-size="25" fill="#211A2E">{ad[0]}</text>'
            f'<text x="90" y="280" text-anchor="middle" font-family="Inter" font-weight="800" font-size="25" fill="#211A2E">{ad[1]}</text></g>')


def iki_sise(orta='x'):
    if orta == 'x':
        isaret = ('<g transform="translate(450 190)"><circle r="78" fill="#FF6B6B"/>'
                  '<path d="M-34 -34L34 34M34 -34L-34 34" stroke="#fff" stroke-width="18" stroke-linecap="round"/></g>')
    else:
        isaret = '<g transform="translate(450 190)"><path d="M-46 0H46M0 -46V46" stroke="#FF7A2E" stroke-width="20" stroke-linecap="round"/></g>'
    return (f'<svg width="840" height="400" viewBox="0 0 840 400">{sise(110, ("Çamaşır", "suyu"), "#3E8EDB")}'
            f'{isaret}{sise(600, ("Tuz", "ruhu"), "#F2C14E")}</svg>')


def bulut():
    return ('<svg width="420" height="260" viewBox="0 0 420 260"><g fill="#B9E36B" opacity=".9">'
            '<circle cx="120" cy="150" r="80"/><circle cx="210" cy="110" r="96"/><circle cx="300" cy="150" r="80"/>'
            '<rect x="100" y="150" width="220" height="80" rx="40"/></g>'
            '<text x="210" y="175" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="76" fill="#14110F">Cl<tspan font-size="46" dy="14">2</tspan></text></svg>')


ET1 = '9. SINIF · GÜVENLİ KULLANIM'
sal = [
    sahne(f'<h1>Bu ikisini evde <span class="v">ASLA</span> karıştırma!</h1><div style="margin-top:80px">{iki_sise("x")}</div>', ET1),
    sahne(f'<h2>Çamaşır suyu <span class="v">+</span> tuz ruhu</h2><div style="margin-top:50px">{iki_sise("+")}</div>', ET1),
    sahne(f'<h2>= <span class="y">zehirli klor gazı</span></h2><div style="margin-top:40px">{bulut()}</div><p class="kucuk" style="margin-top:30px">Kapalı bir banyoda birkaç nefes bile tehlikelidir.</p>', ET1),
    sahne('''<h2>Belirtileri</h2><div class="liste">
      <div class="o"><span class="n">1</span><span>Keskin, boğucu koku</span></div>
      <div class="o"><span class="n">2</span><span>Göz ve boğazda yanma</span></div>
      <div class="o"><span class="n">3</span><span>Öksürük, nefes darlığı</span></div></div>''', ET1),
    sahne('''<h2>Tek kural</h2><div class="kart"><p>Çamaşır suyunu <span class="v">hiçbir</span> temizlik ürünüyle karıştırma.</p></div>
      <p class="kucuk" style="margin-top:34px">Amonyaklı temizleyicilerle de zehirli gazlar çıkar.</p>''', ET1),
    sahne('''<h2>Güvenli kullanım</h2><div class="liste">
      <div class="o"><span class="n">✓</span><span>Tek seferde tek ürün</span></div>
      <div class="o"><span class="n">✓</span><span>Pencereyi aç, ortamı havalandır</span></div>
      <div class="o"><span class="n">✓</span><span>Etiketteki uyarı işaretlerini oku</span></div></div>''', ET1),
    sahne('''<h1>Kaydet, <span class="v">ailene</span> de gönder.</h1><div class="cizgi"></div>
      <p class="kucuk">9. sınıf · Kimya hayattır<br>Her salı yeni bir Reels</p>''', ET1),
]
sal_sure = [2.6, 3.0, 3.4, 3.6, 3.4, 3.6, 3.0]


# ---------- Cuma: Polar bağ ≠ polar molekül ----------
def atom(x, y, ad, r=56, merkez=False):
    dolgu = '#FFE6D2' if merkez else '#FFFFFF'
    fs = 44 if len(ad) == 1 else 38
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{dolgu}"/>'
            f'<text x="{x}" y="{y + fs * 0.36:.0f}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="{fs}" fill="#14110F">{ad}</text>')


def bag(x1, y1, x2, y2, cift=False):
    if not cift:
        return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'
    dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy); px, py = -dy / L * 10, dx / L * 10
    return (f'<line x1="{x1 + px:.0f}" y1="{y1 + py:.0f}" x2="{x2 + px:.0f}" y2="{y2 + py:.0f}" stroke="#fff" stroke-width="8"/>'
            f'<line x1="{x1 - px:.0f}" y1="{y1 - py:.0f}" x2="{x2 - px:.0f}" y2="{y2 - py:.0f}" stroke="#fff" stroke-width="8"/>')


def cift_e(x, y, aci, uzak=88):
    """merkez atomda ortaklanmamış elektron çifti (turuncu iki nokta)"""
    cx = x + uzak * math.cos(math.radians(aci)); cy = y + uzak * math.sin(math.radians(aci))
    px, py = -math.sin(math.radians(aci)) * 16, math.cos(math.radians(aci)) * 16
    return f'<circle cx="{cx + px:.0f}" cy="{cy + py:.0f}" r="11" fill="#FF7A2E"/><circle cx="{cx - px:.0f}" cy="{cy - py:.0f}" r="11" fill="#FF7A2E"/>'


def ccl4(oklar=False, gen=600):
    c = gen / 2; d = 190
    parca = [bag(c, c, c, c - d), bag(c, c, c, c + d), bag(c, c, c - d, c), bag(c, c, c + d, c)]
    if oklar:
        for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
            px, py = -dy * 40, dx * 40  # bağa paralel, yana kaydırılmış ok
            parca.append(ok(c + dx * 70 + px, c + dy * 70 + py, c + dx * 160 + px, c + dy * 160 + py, renk='#FF7A2E', kalinlik=7, uc=26))
    parca += [atom(c, c, 'C', 62, True), atom(c, c - d, 'Cl'), atom(c, c + d, 'Cl'), atom(c - d, c, 'Cl'), atom(c + d, c, 'Cl')]
    return f'<svg width="{gen}" height="{gen}" viewBox="0 0 {gen} {gen}">{"".join(parca)}</svg>'


def mini(ad, gen=380):
    c = gen / 2
    if ad == 'H2O':
        p = [bag(c, c, c - 110, c + 80), bag(c, c, c + 110, c + 80), cift_e(c, c, -125, 70), cift_e(c, c, -55, 70),
             atom(c, c, 'O', 50, True), atom(c - 110, c + 80, 'H', 40), atom(c + 110, c + 80, 'H', 40)]
    elif ad == 'NH3':
        p = [bag(c, c, c - 120, c + 60), bag(c, c, c + 120, c + 60), bag(c, c, c, c + 125), cift_e(c, c, -90, 72),
             atom(c, c, 'N', 50, True), atom(c - 120, c + 60, 'H', 40), atom(c + 120, c + 60, 'H', 40), atom(c, c + 125, 'H', 40)]
    elif ad == 'CO2':
        p = [bag(c - 130, c, c, c, True), bag(c, c, c + 130, c, True), atom(c, c, 'C', 50, True), atom(c - 130, c, 'O', 44), atom(c + 130, c, 'O', 44)]
    else:  # CH4
        p = [bag(c, c, c, c - 115), bag(c, c, c, c + 115), bag(c, c, c - 115, c), bag(c, c, c + 115, c),
             atom(c, c, 'C', 50, True), atom(c, c - 115, 'H', 40), atom(c, c + 115, 'H', 40), atom(c - 115, c, 'H', 40), atom(c + 115, c, 'H', 40)]
    return f'<svg width="{gen}" height="{gen}" viewBox="0 0 {gen} {gen}">{"".join(p)}</svg>'


def ornek_kart(svg, formul, sonuc, renk):
    return (f'<div class="kart" style="padding:20px 10px 26px; text-align:center; margin:0">{svg}'
            f'<p style="font-size:50px; margin-top:-10px">{formul}</p><p class="kucuk" style="margin-top:6px; color:{renk}; opacity:1; font-weight:800">{sonuc}</p></div>')


ET2 = '9. SINIF · MOLEKÜL POLARLIĞI'
cum = [
    sahne('<h1>Polar bağ var diye molekül <span class="v">polar</span> mı olur?</h1>', ET2),
    sahne(f'<h2>CCl<sub>4</sub>: dört <span class="v">polar</span> bağ</h2><div style="display:flex; justify-content:center; margin-top:20px">{ccl4(oklar=True)}</div>'
          '<p class="kucuk" style="text-align:center">Her bağda elektronlar Cl\'ye kayar.</p>', ET2),
    sahne(f'<h2>…ama molekül <span class="g">APOLAR!</span></h2><div style="display:flex; justify-content:center; margin-top:10px">{ccl4(oklar=True)}</div>'
          '<p class="kucuk" style="text-align:center">Eşit ve zıt yönlü etkiler birbirini götürür.</p>', ET2),
    sahne('''<h2>Kısa yol</h2>
      <div class="kart"><p style="font-size:52px">Merkez atomda <span class="v">ortaklanmamış elektron çifti</span> varsa → <b>polar</b></p></div>
      <div class="kart"><p style="font-size:52px">Yoksa ve yük dağılımı dengeliyse → <b class="g">apolar</b></p></div>''', ET2),
    sahne(f'''<div style="display:grid; grid-template-columns:1fr 1fr; gap:26px">
      {ornek_kart(mini("H2O", 330), 'H<sub>2</sub>O', '2 çift → POLAR', '#FF7A2E')}
      {ornek_kart(mini("NH3", 330), 'NH<sub>3</sub>', '1 çift → POLAR', '#FF7A2E')}
      {ornek_kart(mini("CO2", 330), 'CO<sub>2</sub>', 'çift yok → APOLAR', '#8EE07A')}
      {ornek_kart(mini("CH4", 330), 'CH<sub>4</sub>', 'çift yok → APOLAR', '#8EE07A')}</div>''', ET2),
    sahne('<h1>Peki <span class="v">BF<sub>3</sub></span> polar mı, apolar mı?</h1><div class="cizgi"></div><p>Cevabını yorumlara yaz.</p>', ET2),
    sahne('<h1>Kaydet, <span class="v">yazılıda</span> çıkar.</h1><div class="cizgi"></div><p class="kucuk">9. sınıf · Etkileşimler<br>Her cuma yeni bir Reels</p>', ET2),
]
cum_sure = [2.8, 3.4, 3.4, 4.2, 4.6, 3.2, 2.8]

if __name__ == '__main__':
    for ad, sahneler, sureler in [('h1-2-sal', sal, sal_sure), ('h1-5-cum', cum, cum_sure)]:
        kl = os.path.join(KOK, ad)
        yollar, tasma = gorselleri_bas(sahneler, kl, 'sahne')
        print(ad, 'güvenli alan:', tasma or 'tamam')
        if '--video' in sys.argv:
            print(videoya_cevir(yollar, sureler, os.path.join(kl, ad.split('-')[-1] + '-reels.mp4')))
