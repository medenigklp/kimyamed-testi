# -*- coding: utf-8 -*-
"""Her akşam 21:00 · "Bunu biliyor muydun?" hikâyeleri (15–22 Kasım)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import slayt, bas, WA_IMZA
from gonderi0 import karo, MAVI, TURUNCU, YESIL, MUREKKEP, GRI, CIZGI

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'bilgi')
KIRMIZI = '#C0392B'


def ciz(ic):
    """karonun üstüne kırmızı çapraz çizgi"""
    return (f'<div style="position:relative">{ic}<svg style="position:absolute; inset:-10px" width="calc(100% + 20px)" height="calc(100% + 20px)" '
            f'viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="8" y1="92" x2="92" y2="8" stroke="{KIRMIZI}" stroke-width="5" stroke-linecap="round"/></svg></div>')


def bos_karo(harf, boy=260):
    return (f'<div style="width:{boy}px; height:{boy}px; border-radius:{boy * 0.16:.0f}px; border:6px dashed #CFC6BD; display:grid; place-items:center; '
            f'font:700 {boy * 0.5:.0f}px/1 Poppins; color:#D9D1C9">{harf}</div>')


def gunes(boy=200):
    c = 100
    isinlar = ''.join(f'<line x1="{c + 62 * math.cos(math.radians(a)):.1f}" y1="{c + 62 * math.sin(math.radians(a)):.1f}" '
                      f'x2="{c + 92 * math.cos(math.radians(a)):.1f}" y2="{c + 92 * math.sin(math.radians(a)):.1f}" stroke="#F5A300" stroke-width="10" stroke-linecap="round"/>'
                      for a in range(0, 360, 30))
    return f'<svg width="{boy}" height="{boy}" viewBox="0 0 200 200">{isinlar}<circle cx="{c}" cy="{c}" r="48" fill="#F5A300"/></svg>'


def bardak():
    W, H = 300, 330
    return (f'<svg width="{W * 1.2:.0f}" height="{H * 1.2:.0f}" viewBox="0 0 {W} {H}">'
            f'<path d="M40,30 L70,300 Q72,316 90,316 L210,316 Q228,316 230,300 L260,30" fill="none" stroke="{MUREKKEP}" stroke-width="8" stroke-linejoin="round"/>'
            f'<path d="M56,120 L74,296 Q76,306 90,306 L210,306 Q224,306 226,296 L244,120 Z" fill="#A9D8F2"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity=".8"/>' for x, y, r in [(110, 200, 9), (160, 250, 7), (190, 170, 10), (130, 270, 6), (200, 230, 6)])
            + '</svg>')


def ozon():
    W, H = 460, 270
    a, b, c = (90, 200), (230, 70), (370, 200)
    return (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{MUREKKEP}" stroke-width="10"/>'
            f'<line x1="{b[0]}" y1="{b[1]}" x2="{c[0]}" y2="{c[1]}" stroke="{MUREKKEP}" stroke-width="10"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="54" fill="#E74C3C"/><text x="{x}" y="{y + 17}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="50" fill="#fff">O</text>'
                      for x, y in (a, b, c))
            + '</svg>')


def hikaye(gorsel, baslik, metin, wa=False):
    alt_satir = "Her akşam yeni bir kimya bilgisi" if wa else "Her akşam 21:00'de bir kimya bilgisi"
    return slayt(f'''
<div class="ust-not" style="margin-top:10px">BUNU BİLİYOR MUYDUN?</div>
<div style="flex:1; display:flex; flex-direction:column; justify-content:center">
  <div style="display:flex; justify-content:center; align-items:center; gap:30px; margin-bottom:64px; min-height:270px">{gorsel}</div>
  <h2 style="font-size:84px">{baslik}</h2>
  <p style="color:#4A433D; font-size:45px">{metin}</p>
</div>
<p class="kucuk ortala" style="font-weight:600">{alt_satir}</p>
''', 'BİLGİ', 'bilgi', hikaye=True, imza=WA_IMZA if wa else None)


tek_harf = [(1, 'H'), (5, 'B'), (6, 'C'), (7, 'N'), (8, 'O'), (9, 'F'), (15, 'P'), (16, 'S'), (19, 'K'), (23, 'V'), (39, 'Y'), (53, 'I'), (74, 'W'), (92, 'U')]
mini = ''.join(karo(z, s, '', TURUNCU, 118) for z, s in tek_harf)

def bilgiler(wa=False):
  return [
    ('2026-11-15', 'bilgi-1', hikaye(f'{karo(6, "C", "Karbon", TURUNCU, 260)}{ciz(karo(82, "Pb", "Kurşun", GRI, 260))}',
                                     'Kurşun kalemde kurşun yok!',
                                     'Kalemin ucu <b>grafit</b> ve kilden yapılır. Grafitte karbon atomları katmanlar hâlinde dizilir. Katmanlar kolayca kayar ve kâğıtta iz bırakır.', wa=wa)),
    ('2026-11-16', 'bilgi-2', hikaye(f'{bos_karo("J")}{bos_karo("Q")}',
                                     'Periyodik tabloda J ve Q harfleri yok',
                                     '118 elementin hiçbirinin sembolünde <b>J</b> ve <b>Q</b> harfleri geçmez. Bir dahaki derste sınıf arkadaşlarına sor bakalım!', wa=wa)),
    ('2026-11-17', 'bilgi-3', hikaye(f'{gunes(250)}{karo(2, "He", "Helyum", TURUNCU, 260)}',
                                     'Helyum önce Güneş\'te bulundu',
                                     '1868\'deki bir güneş tutulmasında Güneş ışığında bilinmeyen sarı bir çizgi görüldü. Yeni element, Yunanca Güneş anlamındaki <b>helios</b>\'tan adını aldı. Dünya\'da ancak 1895\'te bulundu.', wa=wa)),
    ('2026-11-18', 'bilgi-4', hikaye(f'{bardak()}<div style="font:700 64px Poppins; color:{MAVI}">≈ 8 × 10<sup style="font-size:.6em; vertical-align:.7em; line-height:0">24</sup></div>',
                                     'Bir bardak suda kaç molekül var?',
                                     '250 mL su yaklaşık 14 mol eder. Bu da yaklaşık <b>8 × 10<sup>24</sup></b> su molekülü demek: 8\'in yanına 24 sıfır!', wa=wa)),
    ('2026-11-19', 'bilgi-5', hikaye(f'{karo(80, "Hg", "Cıva", TURUNCU, 260)}{karo(35, "Br", "Brom", MAVI, 260)}',
                                     'Oda sıcaklığında sıvı olan tek metal: cıva',
                                     'Oda sıcaklığında sıvı olan yalnızca iki element vardır: metal olan <b>cıva</b> ve ametal olan <b>brom</b>.', wa=wa)),
    ('2026-11-20', 'bilgi-6', hikaye(ozon(),
                                     'Ozon: yukarıda kalkan, aşağıda kirletici',
                                     'Atmosferin üst katmanındaki ozon tabakası Güneş\'in zararlı UV ışınlarını tutar. Yere yakın ozon ise solunum yollarını tahriş eden bir hava kirleticisidir.', wa=wa)),
    ('2026-11-21', 'bilgi-7', hikaye(f'{karo(11, "Na", "Sodyum", GRI, 240)}<div style="font:700 70px Poppins; color:{MUREKKEP}">+</div>{karo(17, "Cl", "Klor", GRI, 240)}',
                                     'Sofra tuzu iki tehlikeli maddeden oluşur',
                                     '<b>Sodyum</b> metali suyla şiddetli tepkime verir, <b>klor</b> ise zehirli bir gazdır. Birleşince sofrada güvenle kullandığımız <b>NaCl</b> oluşur.', wa=wa)),
    ('2026-11-22', 'bilgi-8', hikaye(f'<div style="display:grid; grid-template-columns:repeat(7, 118px); gap:12px">{mini}</div>',
                                     'Sembolü tek harf olan 14 element var',
                                     'H, B, C, N, O, F, P, S, K, V, Y, I, W ve U. Hepsinin adını sayabilir misin?', wa=wa)),
  ]

if __name__ == '__main__':
    for wa in (False, True):
        for tarih, ad, sl in bilgiler(wa):
            yollar, tasma = bas([sl], KOK, ('wa-' if wa else '') + ad)
            print(tarih, ('wa-' if wa else '') + ad, 'taşma:', tasma or 'yok')
