# -*- coding: utf-8 -*-
"""1 Dakikada Kimya · Bölüm 2: Kimyanın alt dalları — Petek (açık zemin), öğretmenin sesiyle.
Her öğe söylenmeden hemen önce ekrana gelir (önce yazı, sonra ses).
Kullanım: python3 petek_b2.py            -> kareleri deneme zamanlarıyla basar (önizleme)
          python3 petek_b2.py --video    -> kayıtla sesi kurar, kareleri basar, videoyu çıkarır"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
_argv = sys.argv
sys.argv = ['x']
import petek_b1z as P
sys.argv = _argv
from petek_b1z import (svg, hucre, bag, kare, etiket, rozet_html, tuzak_unlem, geri_sayim, bas, CX, MUR, YESIL, TUR,
                       KIRMIZI, SOLUK, LOGO_ISARET, hex_noktalar, TANIM, sik, atom, kucuk_simge, videoya_cevir, _calistir)

KOK = os.path.dirname(os.path.abspath(__file__))
KLASOR = os.path.join(KOK, 'cikti', 'petek-b2')
P.BOLUM, P.TOPLAM_ADIM = 2, 8          # üst bant: Bölüm 2, 6 dal + tuzak + soru
MAVI = '#2F7DD1'

# ---------- ses: kayıt gelince doldurulur ----------
SES_B2 = os.path.join(os.path.dirname(KOK), 'ses-b2', 'kayit.m4a')
SATIRLAR_B2 = []      # [('L1', [(bas, son), ...]), ..., ('L13', [...]), ('SAYAC', None), ('L14', [...])]
KELIME = {}           # 'altisi', 'tanim0..5', 'ornek0..5', 'kok', 'uc' -> kayıttaki başlangıç saniyesi
SES_AYAR = dict(ON=0.25, ARA_IC=0.22, ARA_SATIR=0.30, SON=1.2, PAY_ON=0.04, PAY_SON=0.08, TEMPO=1.0)

# ---------- simgeler ----------
def tup(boy=130):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><g transform="rotate(20 50 50)">'
            f'<path d="M38,10 h24 v60 a12,12 0 0 1 -24,0 z" fill="#fff" stroke="{MUR}" stroke-width="5" stroke-linejoin="round"/>'
            f'<path d="M40,46 h20 v24 a10,10 0 0 1 -20,0 z" fill="#F5B82E"/>'
            f'<rect x="34" y="6" width="32" height="8" rx="3" fill="{MUR}"/></g>'
            f'<path d="M78,40 c6,9 6,15 0,17 c-6,-2 -6,-8 0,-17 z" fill="{MAVI}"/></svg>')


def corap(boy=130):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100">'
            f'<path d="M34,8 h30 v44 c0,6 4,10 10,13 l8,4 c12,6 9,25 -6,25 h-26 c-16,0 -24,-10 -24,-24 v-7 c0,-6 2,-10 6,-14 l2,-2 z" '
            f'fill="#fff" stroke="{MUR}" stroke-width="5" stroke-linejoin="round"/>'
            f'<rect x="34" y="8" width="30" height="12" fill="{TUR}"/><rect x="34" y="25" width="30" height="6" fill="{TUR}" opacity=".55"/>'
            f'<path d="M66,92 c10,0 14,-12 6,-19" fill="none" stroke="{TUR}" stroke-width="5" stroke-linecap="round"/></svg>')


def simsek(boy=66, renk=TUR):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><polygon points="58,6 22,56 46,56 38,94 78,40 54,40 64,6" '
            f'fill="{renk}" stroke="{MUR}" stroke-width="4" stroke-linejoin="round"/></svg>')


def sise(boy=120):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100">'
            f'<rect x="41" y="6" width="18" height="10" rx="2" fill="{TUR}"/>'
            f'<path d="M43,16 h14 v8 c0,4 12,8 12,20 v42 a8,8 0 0 1 -8,8 h-22 a8,8 0 0 1 -8,-8 v-42 c0,-12 12,-16 12,-20 z" fill="#DDF1FB" stroke="{MAVI}" stroke-width="4"/>'
            f'<rect x="31" y="52" width="38" height="16" fill="#fff" stroke="{MAVI}" stroke-width="3"/>'
            f'<text x="50" y="64" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="11" fill="{MAVI}">PET</text></svg>')


# 6 dal: (simge, ad, kısa ad, örnekler, tanım altyazısı). Halkada saat yönünde, sol üstten başlar.
DALLAR = [
    ('halka', 'Organik kimya', 'Organik', ['Şeker', 'Yağ', 'İlaç'], 'Karbon bileşiklerini inceler.', 'Şeker, yağ, ilaç.'),
    ('kristal', 'Anorganik kimya', 'Anorganik', ['Demir', 'Tuz', 'Kum'], 'Metalleri ve mineralleri inceler.', 'Demir, tuz, kum.'),
    ('buyutec', 'Analitik kimya', 'Analitik', ['Su analizi', 'Doping testi'], 'Maddede ne var, ne kadar var, onu bulur.', 'Su analizi, doping testi.'),
    ('dna', 'Biyokimya', 'Biyokimya', ['Sindirim', 'Fotosentez'], 'Canlılardaki kimyasal olayları inceler.', 'Sindirim, fotosentez.'),
    ('simsek', 'Fizikokimya', 'Fizikokimya', ['Pil', 'Yakıt'], 'Tepkimelerin enerjisini ve hızını inceler.', 'Pil, yakıt.'),
    ('zincir', 'Polimer kimyası', 'Polimer', ['Naylon', 'PET şişe'], 'Küçük moleküllerin oluşturduğu dev zincirleri inceler.', 'Naylon, PET şişe.'),
]
HCY, HD, HR, MR = 735, 236, 114, 124      # halka merkezi, merkezden uzaklık, hücre ve merkez yarıçapı
ACILAR = [240, 300, 0, 60, 120, 180]


def dal_simge(tur, boy=76):
    return simsek(boy) if tur == 'simsek' else kucuk_simge(tur, TUR, boy)


def halka(n, aktif=None, ornek=None, cy=HCY):
    """n: yanan dal sayısı, aktif: parlayan dalın sırası, ornek: altta gösterilecek örnek çipleri (dal sırası)"""
    p = ''
    yer = [(CX + HD * math.cos(math.radians(a)), cy + HD * math.sin(math.radians(a))) for a in ACILAR]
    for i, (x, y) in enumerate(yer):
        p += bag(CX, cy, MR, x, y, HR, TUR if i < n else 'rgba(20,17,15,.10)', cift=True)
    p += f'<g filter="url(#parla)"><polygon points="{hex_noktalar(CX, cy, MR)}" fill="url(#tur)"/></g>'
    p += f'<text x="{CX}" y="{cy + 16}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="44" fill="#fff">KİMYA</text>'
    for i, ((x, y), d) in enumerate(zip(yer, DALLAR)):
        ic = f'<div style="display:flex">{dal_simge(d[0])}</div><div style="font:800 26px Poppins">{d[2]}</div>' if i < n else ''
        p += hucre(x, y, HR, ic, yanik=i < n, parla=(aktif == i))
    s = svg(p)
    if ornek is not None:
        cip = ''.join(f'<span style="font:800 34px Poppins; padding:12px 26px; border-radius:999px; background:#fff; border:3px solid {TUR}; '
                      f'box-shadow:0 8px 20px rgba(248,83,0,.16)">{o}</span>' for o in DALLAR[ornek][3])
        s += f'<div style="position:absolute; left:60px; right:60px; top:1080px; display:flex; justify-content:center; gap:18px; flex-wrap:wrap">{cip}</div>'
    return s


def kanca(etap):
    """etap 1: doping testi ve naylon çorap, üstte soru işareti; etap 2: üstte KİMYA, iki farklı dal"""
    sol, sag, ust = (300, 880), (780, 880), (CX, 520)
    p = ''
    for (x, y) in (sol, sag):
        p += bag(ust[0], ust[1], 150, x, y, 170, TUR if etap >= 2 else 'rgba(20,17,15,.10)', kalin=9)
    if etap >= 2:
        p += f'<g filter="url(#parla)"><polygon points="{hex_noktalar(*ust, 150)}" fill="url(#tur)"/></g>'
        p += f'<text x="{ust[0]}" y="{ust[1] + 18}" text-anchor="middle" font-family="Poppins" font-weight="800" font-size="52" fill="#fff">KİMYA</text>'
    else:
        p += hucre(*ust, 150, '<div style="font:800 120px Poppins; color:rgba(20,17,15,.22)">?</div>', yanik=False)
    p += hucre(*sol, 170, f'<div style="display:flex">{tup(130)}</div><div style="font:800 30px Poppins">Doping testi</div>', yanik=True, parla=etap < 2)
    p += hucre(*sag, 170, f'<div style="display:flex">{corap(130)}</div><div style="font:800 30px Poppins">Naylon çorap</div>', yanik=True, parla=etap < 2)
    return svg(p)


def baslik_karesi():
    return (svg(hucre(CX, 600, 250, '', yanik=True) + f'<polygon points="{hex_noktalar(CX, 600, 205)}" fill="none" stroke="rgba(248,83,0,.22)" stroke-width="2"/>')
            + f'<div style="position:absolute; left:0; right:0; top:420px; display:flex; justify-content:center">{atom(360)}</div>'
            + f'''<div style="position:absolute; left:84px; right:84px; top:930px; text-align:center">
  <div style="font:800 112px/1 Poppins; letter-spacing:-.02em">1 Dakikada<br><span style="color:{TUR}">Kimya</span></div>
  <div style="display:inline-flex; align-items:center; gap:16px; margin-top:44px; padding:16px 30px; border:2px solid rgba(20,17,15,.12); border-radius:999px; background:#fff; box-shadow:0 8px 24px rgba(20,17,15,.06)">
    <span style="font:800 32px Poppins; color:{TUR}">BÖLÜM 2</span><span style="width:8px; height:8px; border-radius:50%; background:{SOLUK}"></span>
    <span style="font:800 32px Poppins">Kimyanın alt dalları</span></div></div>''')


def tuzak_kart(etap=1):
    alt = ''
    if etap >= 2:
        alt = svg(hucre(CX, 1000, 150, f'<div style="display:flex">{sise(118)}</div><div style="font:800 30px Poppins">Plastik</div>', yanik=True))
        alt += (f'<div style="position:absolute; left:0; right:0; top:1160px; display:flex; justify-content:center">'
                f'{rozet_html("organik bileşik ✓", YESIL).replace("font:800 31px Inter", "font:800 34px Inter")}</div>')
    return alt + f'''<div style="position:absolute; left:0; right:0; top:560px; display:flex; justify-content:center">
  <div style="position:relative; padding:26px 46px; border-radius:24px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 12px 30px rgba(20,17,15,.07); font:800 60px Poppins">
    Organik = doğal
    <svg style="position:absolute; inset:-10px" width="calc(100% + 20px)" height="calc(100% + 20px)" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="3" y1="85" x2="97" y2="15" stroke="{KIRMIZI}" stroke-width="5" stroke-linecap="round"/></svg></div></div>'''


SIKLAR = ['Analitik kimya', 'Biyokimya', 'Polimer kimyası', 'Fizikokimya']   # cevap C


def soru_alani():
    s = ''.join(sik(h, m) for h, m in zip('ABCD', SIKLAR))
    return (f'<div style="position:absolute; left:84px; right:84px; top:430px"><div style="font:800 52px/1.25 Poppins; margin-bottom:34px">'
            f'Naylon çorabın ipliği hangi dalın <span style="color:{TUR}">konusudur?</span></div><div style="display:grid; gap:18px">{s}</div></div>')


def bitis():
    return (svg(hucre(CX, 640, 220, '', yanik=True))
            + f'<div style="position:absolute; left:0; right:0; top:500px; display:flex; justify-content:center"><img src="{LOGO_ISARET}" style="width:280px; height:280px; border-radius:50%; background:#fff"></div>'
            + f'''<div style="position:absolute; left:84px; right:84px; top:920px; text-align:center">
  <div style="font:800 72px/1.15 Poppins">Cevabını<br><span style="color:{TUR}">yorumlara</span> yaz!</div>
  <div style="display:inline-flex; flex-direction:column; align-items:center; gap:6px; margin-top:52px; padding:16px 34px; border-radius:28px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 8px 24px rgba(20,17,15,.06)">
    <span style="font:800 28px Poppins; color:{TUR}">SIRADAKİ · BÖLÜM 3</span><span style="font:800 34px Poppins">Kimya hangi mesleklerde var?</span></div></div>''')


def uzun(metin):
    return f'<div style="font-size:48px; line-height:1.22">{metin}</div>' if len(metin) > 44 else metin


# ---------- sahneler: (zaman anahtarı, kare) ----------
def sahneler():
    K = kare
    bas_ = '1–6 · ALT DALLAR'
    sira = [
        ('L1', K(kanca(1), serbest=True)[:-10] + '<div class="altyazi">Doping testiyle naylon çorabın <em>ortak noktası</em> ne?</div></section>'),
        ('L2', K(kanca(2), serbest=True)[:-10] + '<div class="altyazi">İkisi de <em>kimya</em>, ama farklı dalları!</div></section>'),
        ('L3', K(baslik_karesi(), serbest=True)),
        ('altisi', K(halka(0), 0, bas_, 'Kimyanın alt dalları', 'İşte en bilinen <em>altısı!</em>')),
    ]
    for i, (_, ad, _, ornek, tanim_, ornek_yazi) in enumerate(DALLAR):
        kucuk = f'{i + 1}/6 · ALT DALLAR'
        sira += [
            (f'ad{i}', K(halka(i + 1, i), i + 1, kucuk, 'Kimyanın alt dalları', f'<em>{ad}</em>')),
            (f'tanim{i}', K(halka(i + 1, i), i + 1, kucuk, 'Kimyanın alt dalları', uzun(tanim_))),
            (f'ornek{i}', K(halka(i + 1, i, i), i + 1, kucuk, 'Kimyanın alt dalları', ornek_yazi)),
        ]
    tz = ('! · SIK YAPILAN HATA', 'Tuzak!')
    sq = ('? · 3 SANİYEN VAR', 'Sıra sende!')
    sira += [
        ('L10', K(tuzak_unlem(), 7, *tz, '<em>Dikkat, tuzak!</em>')),
        ('L11', K(tuzak_kart(1), 7, *tz, 'Organik demek <em>doğal</em> demek değil.')),
        ('L12', K(tuzak_kart(2), 7, *tz, '<em>Plastikler</em> de organik bileşiktir!')),
        ('L13', K(soru_alani(), 8, *sq, 'Şimdi <em>sıra sende!</em>')),
        ('kok', K(soru_alani(), 8, *sq, 'Naylon çorabın ipliği hangi dalın konusudur?')),
        ('uc', K(soru_alani(), 8, *sq, '<em>Üç saniyen var!</em>')),
        ('SAYAC', K(soru_alani() + geri_sayim(3), 8, *sq, '')),
        ('SAYAC+1', K(soru_alani() + geri_sayim(2), 8, *sq, '')),
        ('SAYAC+2', K(soru_alani() + geri_sayim(1), 8, *sq, '')),
        ('L14', K(bitis(), serbest=True)),
    ]
    return sira


def kapak():
    ic = (f'<div style="position:absolute; left:0; right:0; top:250px; display:flex; justify-content:center">'
          f'<div style="display:inline-flex; align-items:center; gap:14px; padding:14px 28px; border-radius:999px; background:#fff; border:2px solid rgba(20,17,15,.12); box-shadow:0 8px 24px rgba(20,17,15,.06)">'
          f'<span style="font:800 30px Poppins; color:{TUR}">1 Dakikada Kimya</span><span style="width:8px; height:8px; border-radius:50%; background:{SOLUK}"></span>'
          f'<span style="font:800 30px Poppins">Bölüm 2</span></div></div>'
          + halka(6, cy=690)
          + f'<div style="position:absolute; left:50px; right:50px; top:1060px; text-align:center; font:800 128px/1.02 Poppins; letter-spacing:-.03em; color:{MUR}">'
            f'Kimyanın<br><span style="color:{TUR}">alt dalları</span></div>')
    return kare(ic, serbest=True)


def zamanla(sira, zaman, toplam):
    """zaman: anahtar -> çıktı saniyesi (öne alma uygulanmış). Yakın geçişler birleşir."""
    duz = sorted(((zaman[k], h) for k, h in sira), key=lambda x: x[0])
    temiz = []
    for z, h in duz:
        if temiz and z - temiz[-1][0] < 0.15:
            temiz[-1] = (temiz[-1][0], h)
        else:
            temiz.append((z, h))
    sureler = [round(temiz[i + 1][0] - temiz[i][0], 3) for i in range(len(temiz) - 1)] + [round(toplam - temiz[-1][0], 3)]
    assert all(x > 0 for x in sureler), sureler
    return [(d, h) for d, (_, h) in zip(sureler, temiz)]


if __name__ == '__main__':
    if '--kapak' in sys.argv:
        from PIL import Image
        y, t = bas([(1, kapak())], KLASOR, 'kapak')
        Image.open(y[0]).convert('RGB').save(os.path.join(KLASOR, 'reel-b2-kapak.jpg'), quality=92, subsampling=0)
        print('kapak', t or 'taşma yok'); sys.exit()
    sira = sahneler()
    if '--video' in sys.argv:
        P.SES, P.SATIRLAR = SES_B2, SATIRLAR_B2
        for k, v in SES_AYAR.items():
            setattr(P, k, v)
        os.makedirs(KLASOR, exist_ok=True)
        ses = os.path.join(KLASOR, 'ses.m4a')
        baslar, toplam, harita = P.ses_kur(ses)

        def t(orij):
            for s2, e2, cikis in harita:
                if s2 <= orij <= e2:
                    return cikis + (orij - s2) / P.TEMPO
            return min((h for h in harita if h[0] > orij), key=lambda h: h[0], default=harita[-1])[2]
        zaman = {}
        for k, _ in sira:
            if k.startswith('SAYAC'):
                zaman[k] = baslar['SAYAC'] + (int(k.split('+')[1]) if '+' in k else 0)
            elif k.startswith('L'):
                zaman[k] = max(0.0, baslar[k] - 0.25)
            elif k.startswith('ad'):
                zaman[k] = max(0.0, baslar[f'L{4 + int(k[2:])}'] - 0.25)
            else:
                zaman[k] = max(0.0, t(KELIME[k]) - 0.40)
        kk = zamanla(sira, zaman, toplam)
        print('ses', round(toplam, 2), 'sn · kare', len(kk))
        yollar, tasma = bas(kk, KLASOR, 'k')
        print('taşma:', tasma or 'yok')
        ham = os.path.join(KLASOR, 'ham.mp4')
        videoya_cevir(yollar, [d for d, _ in kk], ham, gecis=0.15)
        hedef = os.path.join(KLASOR, '1-dakikada-kimya-bolum2.mp4')
        _calistir(['ffmpeg', '-y', '-i', ham, '-i', ses, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                   '-r', '30', '-g', '60', '-bf', '0', '-crf', '19', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
                   '-shortest', '-movflags', '+faststart', '-use_editlist', '0', hedef + '.tmp.mp4'])
        os.replace(hedef + '.tmp.mp4', hedef)
        print('tamam', hedef)
    else:
        zaman = {k: float(i) for i, (k, _) in enumerate(sira)}   # önizleme: her kare 1 sn
        kk = zamanla(sira, zaman, len(sira))
        yollar, tasma = bas(kk, KLASOR, 'onizleme')
        print('kare', len(yollar), 'taşma:', tasma or 'yok')
