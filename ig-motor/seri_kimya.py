# -*- coding: utf-8 -*-
"""'1 Dakikada Kimya' Reels serisi: her bölüm tek konu, sırayla beliren öğeler, büyük altyazı,
Tuzak kartı, 'Sıra sende!' sorusu ve 3-2-1 geri sayım. Görüntü 1080x1920, 30 fps.
Bölüm 1: Kimya bilimine giriş."""
import os, sys, math, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from motor import LOGO_ISARET, altigen_kume
from reel import videoya_cevir, _calistir

KOK = os.path.dirname(os.path.abspath(__file__))
TUR, MAVI, YESIL, MUR, GRI, KAGIT, KIRMIZI = '#F85300', '#0B5C8A', '#2F8F1F', '#14110F', '#5C554F', '#FBF9F7', '#C0392B'
BAR_X, BAR_Y, BAR_W, BAR_H = 84, 110, 912, 10

CSS = f'''
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; background: #ccc; }}
.f {{ width: 1080px; height: 1920px; position: relative; overflow: hidden; background: {KAGIT}; font-family: 'Inter', sans-serif; color: {MUR}; }}
.f .desen {{ position: absolute; top: 0; right: 0; }}
.f .iz {{ position: absolute; left: {BAR_X}px; top: {BAR_Y}px; width: {BAR_W}px; height: {BAR_H}px; background: #EFE5DB; }}
.f .ust {{ position: absolute; left: 0; right: 0; top: 156px; text-align: center; font: 700 28px Inter; letter-spacing: .16em; color: {TUR}; }}
.f .noktalar {{ position: absolute; left: 0; right: 0; top: 206px; display: flex; justify-content: center; gap: 14px; }}
.f .noktalar i {{ width: 16px; height: 16px; border-radius: 50%; background: #E5D9CE; }}
.f .noktalar i.on {{ background: {TUR}; }}
.f .baslik {{ position: absolute; left: 84px; right: 84px; top: 262px; display: flex; justify-content: center; align-items: center; gap: 20px;
             font: 700 64px/1.1 Poppins; text-align: center; }}
.f .baslik .no {{ width: 74px; height: 74px; flex: none; border-radius: 50%; background: {TUR}; color: #fff; display: grid; place-items: center; font: 700 42px Poppins; }}
.f .baslik .no.tz {{ background: {KIRMIZI}; }}
.f .alan {{ position: absolute; left: 84px; right: 84px; top: 400px; height: 720px; display: flex; align-items: center; justify-content: center; }}
.f .altyazi {{ position: absolute; left: 140px; right: 140px; top: 1185px; text-align: center; font: 700 64px/1.28 Poppins; text-wrap: balance; }}
.f .altyazi em {{ font-style: normal; color: {TUR}; text-decoration: underline; text-decoration-color: rgba(248,83,0,.35);
                 text-decoration-thickness: 8px; text-underline-offset: 12px; }}
.kart {{ display: flex; align-items: center; gap: 16px; background: #fff; border: 4px solid #EBE2D9; border-radius: 26px; padding: 22px 22px;
        font: 700 34px Inter; box-shadow: 0 10px 26px rgba(20,17,15,.06); }}
.kart.bos {{ background: transparent; border: 4px dashed #E3D8CD; box-shadow: none; color: transparent; }}
.izgara {{ display: grid; grid-template-columns: 1fr 1fr; gap: 22px; width: 100%; }}
.cip {{ font: 700 54px Poppins; padding: 18px 34px; border-radius: 24px; background: #fff; border: 4px solid #EBE2D9; }}
.cip sub {{ font-size: .6em; vertical-align: -.25em; line-height: 0; }}
.sik {{ display: flex; align-items: center; gap: 20px; background: #fff; border: 4px solid #EBE2D9; border-radius: 22px; padding: 20px 26px; font: 600 40px Inter; }}
.sik b {{ width: 56px; height: 56px; border-radius: 50%; background: #FEEEE4; color: {TUR}; display: grid; place-items: center; font: 700 30px Poppins; flex: none; }}
'''


# ---------- simgeler ----------
def atom(boy=300):
    c = boy / 2
    yorunge = ''.join(f'<ellipse cx="{c}" cy="{c}" rx="{boy * 0.44:.0f}" ry="{boy * 0.17:.0f}" fill="none" stroke="{MUR}" stroke-width="{boy * 0.022:.1f}" transform="rotate({a} {c} {c})"/>' for a in (0, 60, 120))
    elektron = ''.join(f'<circle cx="{c + boy * 0.44 * math.cos(math.radians(a)):.1f}" cy="{c + boy * 0.17 * math.sin(math.radians(a)):.1f}" r="{boy * 0.04:.1f}" fill="{MAVI}" transform="rotate({r} {c} {c})"/>'
                       for a, r in ((20, 0), (200, 60), (110, 120)))
    return f'<svg width="{boy}" height="{boy}" viewBox="0 0 {boy} {boy}">{yorunge}<circle cx="{c}" cy="{c}" r="{boy * 0.1:.0f}" fill="{TUR}"/>{elektron}</svg>'


def kup(boy=150):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100"><polygon points="50,12 88,32 50,52 12,32" fill="#FDD3BC"/>'
            f'<polygon points="12,32 50,52 50,92 12,72" fill="{TUR}"/><polygon points="88,32 50,52 50,92 88,72" fill="#C24000"/></svg>')


def dongu(boy=150):
    return (f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100" fill="none" stroke="{MAVI}" stroke-width="9" stroke-linecap="round">'
            f'<path d="M22,46 A30,30 0 0 1 74,30"/><path d="M78,54 A30,30 0 0 1 26,70"/>'
            f'<polygon points="80,16 84,40 62,34" fill="{MAVI}" stroke="none"/><polygon points="20,84 16,60 38,66" fill="{MAVI}" stroke="none"/></svg>')


def kucuk_simge(tur, renk=TUR, boy=64):
    s = {
        'buyutec': f'<circle cx="42" cy="42" r="24" fill="none" stroke="{renk}" stroke-width="9"/><line x1="60" y1="60" x2="84" y2="84" stroke="{renk}" stroke-width="11" stroke-linecap="round"/>',
        'kristal': f'<polygon points="50,8 86,38 50,92 14,38" fill="{renk}"/><polygon points="50,8 64,38 50,92 36,38" fill="#fff" opacity=".35"/><line x1="14" y1="38" x2="86" y2="38" stroke="#fff" stroke-width="4" opacity=".6"/>',
        'dna': f'<path d="M30,8 C70,30 30,70 70,92" fill="none" stroke="{renk}" stroke-width="8"/><path d="M70,8 C30,30 70,70 30,92" fill="none" stroke="{MAVI}" stroke-width="8"/>'
               + ''.join(f'<line x1="38" y1="{y}" x2="62" y2="{y}" stroke="#CFC6BD" stroke-width="5"/>' for y in (22, 50, 78)),
        'termometre': f'<rect x="40" y="8" width="20" height="62" rx="10" fill="none" stroke="{renk}" stroke-width="7"/><circle cx="50" cy="78" r="15" fill="{renk}"/><rect x="46" y="34" width="8" height="40" fill="{renk}"/>',
        'halka': '<polygon points="' + ' '.join(f'{50 + 38 * math.cos(math.radians(60 * k - 90)):.1f},{50 + 38 * math.sin(math.radians(60 * k - 90)):.1f}' for k in range(6)) + f'" fill="none" stroke="{renk}" stroke-width="8"/><circle cx="50" cy="50" r="20" fill="none" stroke="{renk}" stroke-width="6"/>',
        'zincir': ''.join(f'<rect x="{x}" y="36" width="38" height="28" rx="14" fill="none" stroke="{renk if i % 2 == 0 else MAVI}" stroke-width="7"/>' for i, x in enumerate((6, 31, 56))),
    }[tur]
    return f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100">{s}</svg>'


def gunluk_simge(tur, boy=150):
    s = {
        'ilac': f'<g transform="rotate(-40 50 50)"><rect x="18" y="34" width="64" height="32" rx="16" fill="#fff" stroke="{MUR}" stroke-width="5"/><path d="M50,34 h16 a16,16 0 0 1 0,32 h-16 z" fill="{TUR}"/></g>',
        'gida': f'<path d="M50,30 C28,18 10,36 16,58 C22,82 40,92 50,84 C60,92 78,82 84,58 C90,36 72,18 50,30 Z" fill="{KIRMIZI}"/><path d="M50,30 C50,20 54,12 60,8" stroke="{MUR}" stroke-width="5" fill="none"/><path d="M54,20 C64,8 78,12 80,16 C72,24 62,24 54,20 Z" fill="{YESIL}"/>',
        'temizlik': f'<rect x="30" y="40" width="40" height="52" rx="8" fill="{MAVI}"/><rect x="38" y="24" width="20" height="16" fill="{MUR}"/><path d="M58,26 h18 v8 h-18 z" fill="{MUR}"/>'
                    + ''.join(f'<circle cx="{x}" cy="{y}" r="3.5" fill="{MAVI}"/>' for x, y in ((84, 22), (90, 30), (86, 38), (94, 20), (95, 38))),
        'enerji': f'<polygon points="58,6 22,56 46,56 38,94 78,40 54,40" fill="#F5A300" stroke="{MUR}" stroke-width="4" stroke-linejoin="round"/>',
    }[tur]
    return f'<svg width="{boy}" height="{boy}" viewBox="0 0 100 100">{s}</svg>'


GHS = os.path.join(KOK, 'varlik_ghs')  # resmî GHS piktogramları (Wikimedia, kamu malı)
GHS_DOSYA = {'alev': 'GHS-pictogram-flamme.svg', 'kurukafa': 'GHS-pictogram-skull.svg', 'unlem': 'GHS-pictogram-exclam.svg'}


def piktogram(tur, boy=230):
    """resmî GHS piktogramı (GHS02 alev, GHS06 kuru kafa, GHS07 ünlem)"""
    return f'<img src="file://{os.path.join(GHS, GHS_DOSYA[tur])}" width="{boy}" height="{boy}" style="display:block">'


# ---------- kare kalıbı ----------
NOKTA = 6  # dört başlık + tuzak + soru


def kare(alan='', altyazi='', baslik='', no=None, nokta=None, ust='1 DAKİKADA KİMYA · BÖLÜM 1', serbest=''):
    """serbest: başlık/alan düzenini kullanmayan tam kare içerik (giriş, bitiş)"""
    desen = altigen_kume(620, 620, 46, TUR)
    if serbest:
        return f'<section class="f">{desen}<div class="iz"></div>{serbest}</section>'
    noktalar = ''.join(f'<i class="{"on" if nokta is not None and k <= nokta else ""}"></i>' for k in range(NOKTA))
    no_html = '' if no is None else (f'<span class="no tz">!</span>' if no == '!' else f'<span class="no">{no}</span>')
    return (f'<section class="f">{desen}<div class="iz"></div><div class="ust">{ust}</div><div class="noktalar">{noktalar}</div>'
            f'<div class="baslik">{no_html}<span>{baslik}</span></div><div class="alan">{alan}</div><div class="altyazi">{altyazi}</div></section>')


def kartlar(ogeler, dolu):
    """ogeler: (simge, ad); ilk 'dolu' tanesi görünür, kalanlar kesikli boş yer"""
    h = []
    for i, (s, ad) in enumerate(ogeler):
        if i < dolu:
            h.append(f'<div class="kart">{kucuk_simge(s)}<span>{ad}</span></div>')
        else:
            h.append(f'<div class="kart bos"><span style="width:64px; height:64px; display:inline-block"></span><span>{ad}</span></div>')
    return f'<div class="izgara">{"".join(h)}</div>'


def gunluk(dolu):
    ogeler = [('ilac', 'İlaç'), ('gida', 'Gıda'), ('temizlik', 'Temizlik'), ('enerji', 'Enerji')]
    h = []
    for i, (s, ad) in enumerate(ogeler):
        gor = i < dolu
        h.append(f'<div style="display:flex; flex-direction:column; align-items:center; gap:14px; background:{"#fff" if gor else "transparent"}; '
                 f'border:4px {"solid #EBE2D9" if gor else "dashed #E3D8CD"}; border-radius:30px; padding:30px 10px">'
                 f'<div style="opacity:{1 if gor else 0}">{gunluk_simge(s)}</div><span style="font:700 40px Inter; color:{MUR if gor else "transparent"}">{ad}</span></div>')
    return f'<div class="izgara" style="gap:28px">{"".join(h)}</div>'


def piktogramlar(dolu):
    ogeler = [('alev', 'Yanıcı'), ('kurukafa', 'Zehirli'), ('unlem', 'Tahriş edici')]
    h = []
    for i, (s, ad) in enumerate(ogeler):
        gor = i < dolu
        h.append(f'<div style="display:flex; flex-direction:column; align-items:center; gap:10px; opacity:{1 if gor else .0}">{piktogram(s)}'
                 f'<span style="font:700 36px Inter">{ad}</span></div>')
    return f'<div style="display:flex; justify-content:space-between; width:100%">{"".join(h)}</div>'


def sayac(n):
    return (f'<div style="display:flex; justify-content:center"><div style="width:170px; height:170px; border-radius:50%; '
            f'border:12px solid {TUR}; display:grid; place-items:center; font:700 96px Poppins; color:{TUR}; background:#fff">{n}</div></div>')


def soru(sayac=None, siklar_acik=None):
    siklar = ''.join(f'<div class="sik"><b>{h}</b>{m}</div>' for h, m in zip('ABCD', ['Biyokimya', 'Analitik kimya', 'Astronomi', 'Polimer kimyası']))
    sayac_html = ''
    return (f'<div style="width:100%"><div class="kart" style="display:block; font:700 44px/1.3 Inter; padding:30px 34px; margin-bottom:26px">'
            f'Aşağıdakilerden hangisi kimyanın alt dallarından biri <u>değildir</u>?</div>'
            f'<div style="display:grid; gap:16px; opacity:{1 if (sayac or siklar_acik) else 0}">{siklar}</div>{sayac_html}</div>')


# ---------- Bölüm 1 zaman çizelgesi ----------
ALT = [('buyutec', 'Analitik kimya'), ('kristal', 'Anorganik kimya'), ('dna', 'Biyokimya'), ('termometre', 'Fizikokimya'), ('halka', 'Organik kimya'), ('zincir', 'Polimer kimyası')]
madde_kimya = (f'<div style="display:flex; align-items:center; gap:26px">'
               f'<div style="display:flex; flex-direction:column; align-items:center; gap:10px">{kup()}<span style="font:700 40px Inter">Madde</span></div>'
               f'<div style="width:60px; height:8px; background:#E3D8CD"></div>'
               f'<div style="width:260px; height:260px; border-radius:50%; background:{TUR}; color:#fff; display:grid; place-items:center; font:700 54px Poppins">KİMYA</div>'
               f'<div style="width:60px; height:8px; background:#E3D8CD"></div>'
               f'<div style="display:flex; flex-direction:column; align-items:center; gap:10px">{dongu()}<span style="font:700 40px Inter">Değişim</span></div></div>')
tuzak_kart = (f'<div style="position:relative; display:inline-block"><div class="kart" style="font:700 56px Poppins; padding:34px 44px">Kimyasal = zararlı</div>'
              f'<svg style="position:absolute; inset:-14px" width="calc(100% + 28px)" height="calc(100% + 28px)" viewBox="0 0 100 100" preserveAspectRatio="none">'
              f'<line x1="4" y1="90" x2="96" y2="10" stroke="{KIRMIZI}" stroke-width="4" stroke-linecap="round"/></svg></div>')
def formul_cipleri(dolu=3):
    cipler = ['H<sub>2</sub>O', 'NaCl', 'O<sub>2</sub>']
    return ('<div style="display:flex; gap:24px; justify-content:center; margin-top:56px">'
            + ''.join(f'<span class="cip" style="opacity:{1 if i < dolu else 0}">{c}</span>' for i, c in enumerate(cipler)) + '</div>')


formuller = formul_cipleri(3)

giris = (f'<div style="position:absolute; left:84px; right:84px; top:330px; text-align:center">'
         f'<div style="font:700 104px/1.02 Poppins">1 Dakikada<br><span style="color:{TUR}">Kimya</span></div>'
         f'<div style="display:flex; justify-content:center; margin-top:60px">{atom(380)}</div></div>')
giris2 = giris.replace('</div></div>', '</div><div style="display:inline-block; margin-top:40px; background:' + TUR + '; color:#fff; font:700 44px Poppins; padding:16px 40px; border-radius:999px">BÖLÜM 1</div></div>', 1)
bitis = (f'<div style="position:absolute; left:84px; right:84px; top:380px; text-align:center">'
         f'<img src="{LOGO_ISARET}" style="width:300px; height:300px; border-radius:50%; background:#fff; box-shadow:0 20px 50px rgba(20,17,15,.12)">'
         f'<div style="font:700 70px Poppins; color:{TUR}; margin-top:30px">kimyamed</div>'
         f'<div style="font:700 72px/1.2 Poppins; margin-top:90px">Cevabını<br><span style="color:{TUR}">yorumlara</span> yaz!</div>'
         f'<div style="font:600 40px Inter; color:{GRI}; margin-top:60px">Sıradaki bölüm: Atom modelleri</div></div>')


def bolum1():
    """(süre sn, kare html)"""
    return [
        (2.6, kare(serbest=giris + '<div class="altyazi">Kimyayı <em>1 dakikada</em> tekrar ediyoruz!</div>')),
        (2.4, kare(serbest=giris2 + '<div class="altyazi"><em>Kimya bilimine</em> giriş.</div>')),
        (3.0, kare(madde_kimya, 'Kimya; maddenin <em>yapısını</em>, <em>özelliklerini</em>', 'Kimya nedir?', 1, 0)),
        (3.0, kare(madde_kimya, 've <em>değişimlerini</em> inceleyen bilimdir.', 'Kimya nedir?', 1, 0)),
        (2.4, kare(kartlar(ALT, 2), 'Alt dalları: <em>analitik</em>, <em>anorganik</em>,', 'Alt dallar', 2, 1)),
        (2.4, kare(kartlar(ALT, 4), '<em>biyokimya</em>, <em>fizikokimya</em>,', 'Alt dallar', 2, 1)),
        (2.6, kare(kartlar(ALT, 6), '<em>organik</em> ve <em>polimer</em> kimyası.', 'Alt dallar', 2, 1)),
        (2.4, kare(gunluk(2), '<em>İlaçtan</em> gıdaya,', 'Kimya her yerde', 3, 2)),
        (2.8, kare(gunluk(4), 'temizlikten <em>enerjiye</em> kimya her yerde.', 'Kimya her yerde', 3, 2)),
        (2.4, kare(piktogramlar(1), 'Bir kimyasalı kullanmadan önce', 'Güvenlik', 4, 3)),
        (2.8, kare(piktogramlar(3), 'etiketteki <em>uyarı işaretlerine</em> bak.', 'Güvenlik', 4, 3)),
        (2.8, kare(f'<div style="text-align:center">{tuzak_kart}</div>', 'Kimyasal demek <em>zararlı</em> demek değil.', 'Tuzak!', '!', 4)),
        (3.0, kare(f'<div style="text-align:center">{tuzak_kart}{formuller}</div>', '<em>Su</em>, <em>tuz</em> ve <em>oksijen</em> de birer kimyasaldır.', 'Tuzak!', '!', 4)),
        (2.2, kare(soru(), 'Şimdi <em>sıra sende!</em>', 'Sıra sende!', None, 5)),
        (1.0, kare(soru(3), sayac(3), 'Sıra sende!', None, 5)),
        (1.0, kare(soru(2), sayac(2), 'Sıra sende!', None, 5)),
        (1.0, kare(soru(1), sayac(1), 'Sıra sende!', None, 5)),
        (3.2, kare(serbest=bitis)),
    ]


def bas_kareler(kareler, klasor, onek):
    from playwright.sync_api import sync_playwright
    os.makedirs(klasor, exist_ok=True)
    html = os.path.join(klasor, onek + '.html')
    with open(html, 'w', encoding='utf-8') as f:
        f.write('<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' + ''.join(k for _, k in kareler) + '</body></html>')
    yollar = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        pg.goto('file://' + html); pg.wait_for_timeout(500); pg.evaluate('document.fonts.ready')
        tasma = pg.evaluate('''() => [...document.querySelectorAll('section.f')].map((s, i) => {
            const r = []; const a = s.querySelector('.altyazi');
            if (a && a.getBoundingClientRect().bottom - s.getBoundingClientRect().top > 1500) r.push('altyazi alta taştı');
            const al = s.querySelector('.alan'); if (al && al.scrollHeight > al.clientHeight + 2) r.push('alan taştı');
            return r.length ? (i + 1) + ': ' + r.join(', ') : null; }).filter(Boolean)''')
        for i, el in enumerate(pg.query_selector_all('section.f'), 1):
            y = os.path.join(klasor, f'{onek}-{i:02d}.png'); el.screenshot(path=y); yollar.append(y)
        b.close()
    return yollar, tasma


def ilerleme_cubugu(girdi, cikti, sure):
    """üstteki ince çizgiyi zamanla dolan turuncu çubuğa çevirir (görüntü yeniden kodlanır, ses kopyalanır)"""
    tmp = cikti + '.tmp.mp4'
    _calistir(['ffmpeg', '-y', '-i', girdi, '-f', 'lavfi', '-i', f'color=c=0xF85300:s={BAR_W}x{BAR_H}:r=30',
               '-filter_complex', f"[0][1]overlay=x='{BAR_X}-{BAR_W}+{BAR_W}*min(t/{sure - 0.4},1)':y={BAR_Y}:shortest=1:eval=frame[a];"
                                  f"[a]drawbox=x=0:y={BAR_Y}:w={BAR_X}:h={BAR_H}:color=0xFBF9F7:t=fill[v]",
               '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30',
               '-c:a', 'copy', '-movflags', '+faststart', tmp])
    os.replace(tmp, cikti)


if __name__ == '__main__':
    klasor = os.path.join(KOK, 'cikti', 'seri-b1')
    kareler = bolum1()
    yollar, tasma = bas_kareler(kareler, klasor, 'b1')
    print('kare:', len(yollar), 'taşma:', tasma or 'yok', 'süre:', round(sum(s for s, _ in kareler), 1))
    if '--video' in sys.argv:
        ham = os.path.join(klasor, 'b1-ham.mp4')
        videoya_cevir(yollar, [s for s, _ in kareler], ham, gecis=0.18)
        ilerleme_cubugu(ham, os.path.join(klasor, 'b1-reels.mp4'), sum(s for s, _ in kareler))
        print('video tamam')
