# -*- coding: utf-8 -*-
"""Telefonda açılan paylaşım paneli: bu hafta, profil, 4 haftalık plan"""
import html, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_h1 import PLAN, PROFIL_AD, PROFIL_BIO, BAGLANTILAR, ONE_CIKANLAR, HAFTALAR

KOK = os.path.dirname(os.path.abspath(__file__))
DURUM_DOSYA = os.path.join(KOK, 'panel', 'durum.json')  # {"pzt": "planlandi", ...}
durum = json.load(open(DURUM_DOSYA)) if os.path.exists(DURUM_DOSYA) else {}
e = lambda s: html.escape(s, quote=True)

TUR_AD = {'POST': 'Gönderi', 'REEL': 'Reels', 'STORY': 'Hikâye'}


def medya(k, tur, dosyalar, kapak):
    if tur == 'REEL':
        return f'<video class="reel" controls playsinline preload="none" poster="g/{kapak}" src="g/{dosyalar[0]}"></video>'
    if tur == 'STORY':
        return f'<img class="hikaye" src="g/{dosyalar[0]}" alt="" loading="lazy">'
    imgs = ''.join(f'<img src="g/{d}" alt="{i + 1}. slayt" loading="lazy">' for i, d in enumerate(dosyalar))
    return f'<div class="serit">{imgs}</div>'


gunler = {}
for k, gun, zaman, tur, baslik, dosyalar, kapak, aciklama in PLAN:
    gunler.setdefault(gun, []).append((k, zaman, tur, baslik, dosyalar, kapak, aciklama))

kartlar = []
for gun, ogeler in gunler.items():
    parca = [f'<section class="gun"><h3>{e(gun)}</h3>']
    for k, zaman, tur, baslik, dosyalar, kapak, aciklama in ogeler:
        saat = zaman[11:16]
        d = durum.get(k)
        durum_cip = '<span class="cip ok">Metricool\'da planlandı</span>' if d == 'planlandi' else '<span class="cip hazir">Hazır</span>'
        ek = ''
        if tur == 'POST' and len(dosyalar) > 1:
            ek = f' · {len(dosyalar)} slayt'
        acik = ''
        if aciklama:
            acik = (f'<details class="aciklama"><summary>Açıklama ve etiketler</summary><pre id="a-{k}">{e(aciklama)}</pre>'
                    f'<button type="button" class="kopya" data-hedef="a-{k}">Açıklamayı kopyala</button></details>')
        parca.append(f'''<article class="oge oge-{tur.lower()}">
  <div class="ust"><span class="saat">{saat}</span><span class="tur">{TUR_AD[tur]}{ek}</span>{durum_cip}</div>
  <p class="baslik">{e(baslik)}</p>
  {medya(k, tur, dosyalar, kapak)}
  {acik}
</article>''')
    parca.append('</section>')
    kartlar.append(''.join(parca))

baglantilar = ''.join(f'''<li><span class="ad">{e(a)}</span><code id="b-{i}">{e(u)}</code><button type="button" class="kopya kucuk" data-hedef="b-{i}">Kopyala</button></li>''' for i, (a, u) in enumerate(BAGLANTILAR))
kapaklar = ''.join(f'<figure><img src="g/kapak-{d}.jpg" alt="{e(a)} kapağı" loading="lazy"><figcaption>{e(a)}</figcaption></figure>' for d, a in ONE_CIKANLAR)
haftalar = ''.join(f'<div class="hafta{" su-an" if i == 0 else ""}"><h3>{e(b)}</h3><ol>' + ''.join(f'<li><span class="g">{g}</span>{e(m)}</li>' for g, m in zip(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], ms)) + '</ol></div>' for i, (b, ms) in enumerate(HAFTALAR))
planli = sum(1 for k in durum.values() if k == 'planlandi')
ust_durum = (f'<span class="cip ok">{planli} paylaşım Metricool\'da planlandı</span>' if planli else
             '<span class="cip hazir">Metricool bağlanınca otomatik paylaşılacak</span>')

SAYFA = f'''<title>kimyamed Instagram</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap">
<style>
/* Tek sütun: başlık, bu haftanın günleri, profil, 4 haftalık plan */
:root {{ --bg:#FBF9F7; --yuzey:#FFFFFF; --murekkep:#14110F; --gri:#5C554F; --cizgi:#E7E0D9; --vurgu:#F85300; --vurgu-acik:#FEEEE4; --ok:#2F7D1E; --ok-acik:#E8F4E4;
  --baslik:"Poppins", "Segoe UI", system-ui, sans-serif; --metin:"Inter", system-ui, -apple-system, "Segoe UI", sans-serif; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg:#141110; --yuzey:#1E1A17; --murekkep:#F3EEE9; --gri:#B7ADA4; --cizgi:#3A332D; --vurgu:#FF7A2E; --vurgu-acik:#3A2416; --ok:#86D673; --ok-acik:#1D2C19; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg:#141110; --yuzey:#1E1A17; --murekkep:#F3EEE9; --gri:#B7ADA4; --cizgi:#3A332D; --vurgu:#FF7A2E; --vurgu-acik:#3A2416; --ok:#86D673; --ok-acik:#1D2C19; color-scheme: dark; }}
body {{ background:var(--bg); color:var(--murekkep); font:16px/1.55 var(--metin); }}
.sar {{ max-width:760px; margin:0 auto; padding-block:24px 64px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:flex; flex-direction:column; gap:28px; }}
header {{ display:flex; flex-direction:column; gap:10px; }}
.marka {{ display:flex; align-items:center; gap:12px; }}
.marka img {{ width:52px; height:52px; border-radius:50%; background:#fff; border:1px solid var(--cizgi); }}
h1 {{ font:700 30px/1.15 var(--baslik); margin:0; text-wrap:balance; }}
h1 span {{ color:var(--vurgu); }}
h2 {{ font:700 22px/1.2 var(--baslik); margin:0 0 12px; }}
h3 {{ font:700 17px/1.3 var(--metin); margin:0 0 10px; }}
.alt {{ color:var(--gri); margin:0; }}
nav {{ display:flex; gap:8px; flex-wrap:wrap; }}
nav a {{ text-decoration:none; color:var(--murekkep); border:1px solid var(--cizgi); background:var(--yuzey); border-radius:999px; padding:7px 14px; font-weight:600; font-size:14px; }}
.cip {{ display:inline-block; font:600 12px/1 var(--metin); letter-spacing:.02em; padding:6px 10px; border-radius:999px; white-space:nowrap; }}
.cip.ok {{ background:var(--ok-acik); color:var(--ok); }}
.cip.hazir {{ border:1px solid var(--vurgu); color:var(--vurgu); }}
.sar > * {{ min-width:0; }}
.gun {{ min-width:0; background:var(--yuzey); border:1px solid var(--cizgi); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:16px; }}
.gun h3 {{ margin:0; }}
.oge {{ display:flex; flex-direction:column; gap:10px; min-width:0; }}
.oge + .oge {{ border-top:1px dashed var(--cizgi); padding-top:16px; }}
.oge .ust {{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }}
.saat {{ font:700 15px var(--metin); font-variant-numeric:tabular-nums; }}
.tur {{ font:600 13px var(--metin); color:var(--vurgu); background:var(--vurgu-acik); padding:5px 9px; border-radius:8px; }}
.oge .ust .cip {{ margin-left:auto; }}
.baslik {{ margin:0; font-weight:600; }}
.serit {{ display:flex; gap:8px; overflow-x:auto; scroll-snap-type:x mandatory; padding-bottom:6px; }}
.serit img {{ width:200px; max-width:62vw; aspect-ratio:4/5; object-fit:cover; border-radius:10px; border:1px solid var(--cizgi); scroll-snap-align:start; flex:none; }}
.oge-post .serit:has(img:only-child) img {{ width:260px; }}
video.reel {{ width:220px; max-width:70vw; aspect-ratio:9/16; border-radius:12px; background:#000; }}
img.hikaye {{ width:150px; aspect-ratio:9/16; object-fit:cover; border-radius:10px; border:1px solid var(--cizgi); }}
details.aciklama {{ border:1px solid var(--cizgi); border-radius:12px; padding:10px 12px; background:var(--bg); }}
details.aciklama summary {{ cursor:pointer; font-weight:600; font-size:14px; }}
pre {{ white-space:pre-wrap; font:14px/1.55 var(--metin); margin:10px 0; }}
button.kopya {{ font:600 14px var(--metin); color:#fff; background:var(--vurgu); border:0; border-radius:10px; padding:10px 14px; cursor:pointer; }}
button.kopya.kucuk {{ padding:7px 10px; font-size:13px; }}
button.kopya:focus-visible, nav a:focus-visible {{ outline:3px solid var(--murekkep); outline-offset:2px; }}
.kart {{ background:var(--yuzey); border:1px solid var(--cizgi); border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:14px; }}
.alan {{ display:flex; flex-direction:column; gap:8px; }}
.alan .etiket {{ font:700 12px var(--metin); letter-spacing:.08em; color:var(--gri); text-transform:uppercase; }}
.alan pre {{ background:var(--bg); border:1px solid var(--cizgi); border-radius:10px; padding:10px 12px; margin:0; }}
ul.baglanti {{ list-style:none; padding:0; margin:0; display:grid; gap:8px; }}
ul.baglanti li {{ display:grid; grid-template-columns:1fr auto; gap:4px 10px; align-items:center; background:var(--bg); border:1px solid var(--cizgi); border-radius:10px; padding:10px 12px; }}
ul.baglanti .ad {{ font-weight:600; }}
ul.baglanti code {{ grid-column:1; font:13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color:var(--gri); overflow-wrap:anywhere; }}
ul.baglanti button {{ grid-row:1 / span 2; grid-column:2; }}
.kapaklar {{ display:grid; grid-template-columns:repeat(auto-fill, minmax(84px, 1fr)); gap:12px; }}
.kapaklar figure {{ margin:0; text-align:center; }}
.kapaklar img {{ width:76px; height:76px; border-radius:50%; object-fit:cover; display:block; margin:0 auto 6px; border:2px solid var(--cizgi); }}
.kapaklar figcaption {{ font-size:12px; color:var(--gri); }}
.not {{ font-size:14px; color:var(--gri); margin:0; }}
.haftalar {{ display:grid; gap:12px; }}
.hafta {{ background:var(--yuzey); border:1px solid var(--cizgi); border-radius:16px; padding:14px 16px; }}
.hafta.su-an {{ border-color:var(--vurgu); }}
.hafta ol {{ list-style:none; padding:0; margin:0; display:grid; gap:6px; }}
.hafta li {{ display:flex; gap:10px; font-size:15px; }}
.hafta .g {{ width:34px; flex:none; font-weight:700; color:var(--vurgu); }}
ul.nasil {{ margin:0; padding-left:20px; display:grid; gap:6px; }}
.toast {{ position:fixed; left:50%; bottom:calc(20px + env(safe-area-inset-bottom, 0px)); transform:translateX(-50%); background:var(--murekkep); color:var(--bg); padding:10px 16px; border-radius:999px; font-weight:600; font-size:14px; }}
@media (prefers-reduced-motion: no-preference) {{ .toast {{ transition:opacity .2s; }} }}
</style>
<div class="sar">
<header>
  <div class="marka"><img src="g/logo.png" alt=""><div><h1><span>kimyamed</span> Instagram</h1><p class="alt">15–22 Kasım 2026 · her gün bir gönderi · hikâyeler 12:00 ve 21:00</p></div></div>
  <div>{ust_durum}</div>
  <nav><a href="#hafta">Bu hafta</a><a href="#profil">Profil</a><a href="#plan">4 haftalık plan</a><a href="#nasil">Nasıl çalışıyoruz</a></nav>
</header>

<section id="hafta"><h2>Bu hafta</h2><div style="display:grid; grid-template-columns:minmax(0,1fr); gap:14px">{''.join(kartlar)}</div></section>

<section id="profil"><h2>Profil düzeni</h2>
<div class="kart">
  <div class="alan"><span class="etiket">Ad</span><pre id="p-ad">{e(PROFIL_AD)}</pre><button type="button" class="kopya" data-hedef="p-ad">Adı kopyala</button></div>
  <div class="alan"><span class="etiket">Biyografi</span><pre id="p-bio">{e(PROFIL_BIO)}</pre><button type="button" class="kopya" data-hedef="p-bio">Biyografiyi kopyala</button></div>
  <div class="alan"><span class="etiket">Bağlantılar (Instagram 5 bağlantıya izin veriyor)</span><ul class="baglanti">{baglantilar}</ul></div>
  <p class="not">Instagram'da: Profili düzenle → Ad / Biyografi / Bağlantılar → Bağlantı ekle.</p>
</div>
<div class="kart" style="margin-top:14px">
  <div class="alan"><span class="etiket">Öne çıkan kapakları</span><div class="kapaklar">{kapaklar}</div></div>
  <p class="not">Kapağa uzun bas → Fotoğraflara Ekle (sayfayı Safari'de açarsan en kolayı). Sonra profilde + → Öne Çıkan Hikâye → Kapağı Düzenle → galeriden seç.</p>
</div>
</section>

<section id="plan"><h2>4 haftalık plan</h2><div class="haftalar">{haftalar}</div></section>

<section id="nasil"><h2>Nasıl çalışıyoruz</h2>
<div class="kart"><ul class="nasil">
  <li>Gönderileri ve hikâyeleri ben hazırlıyorum, Metricool'a planlıyorum; saati gelince kendiliğinden paylaşılıyor.</li>
  <li>Planlanan bir gönderiyi değiştirmek ya da silmek istersen Metricool'da Planlama ekranından yapabilirsin, ya da bana yaz.</li>
  <li>Yorumlara ve mesajlara sen cevap veriyorsun; ben Instagram'a giriş yapamıyorum.</li>
  <li>Her hafta istatistiklere bakıp hangi içeriğin tuttuğuna göre bir sonraki haftayı ayarlıyorum.</li>
</ul></div>
</section>
</div>
<script>
(function () {{
  function bildir(m) {{ var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () {{ t.remove(); }}, 1800); }}
  document.querySelectorAll('button.kopya').forEach(function (b) {{
    b.addEventListener('click', function () {{
      var el = document.getElementById(b.getAttribute('data-hedef')); var metin = el.textContent; var is;
      try {{ is = navigator.clipboard.writeText(metin); }} catch (err) {{ is = Promise.reject(err); }}
      is.then(function () {{ bildir('Kopyalandı'); }}).catch(function () {{
        var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); bildir('Metin seçildi, Kopyala\\'ya bas');
      }});
    }});
  }});
}})();
</script>
'''

if __name__ == '__main__':
    os.makedirs(os.path.join(KOK, 'panel'), exist_ok=True)
    with open(os.path.join(KOK, 'panel', 'instagram-paneli.html'), 'w', encoding='utf-8') as f:
        f.write(SAYFA)
    print('ok', len(SAYFA))
