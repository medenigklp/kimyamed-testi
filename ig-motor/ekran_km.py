# kimyamed ekran görüntüleri (iPhone boyutu 1170x2532)
from playwright.sync_api import sync_playwright
import pathlib, sys
KONU = pathlib.Path('/home/claude/kimyamed-testi/konu')
OUT = pathlib.Path(__file__).resolve().parent / 'ekran'

def ust(pg, js_secici, kaydir=-70):
    pg.evaluate(f"""() => {{ const el = {js_secici}; const y = el.getBoundingClientRect().top + window.scrollY + ({kaydir}); window.scrollTo({{top: y, behavior: 'instant'}}); }}""")
    pg.wait_for_timeout(400)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    # 1 dizin: 9. sınıf sekmesi
    pg.goto((KONU / 'index.html').as_uri() + '?sinif=9'); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / 'km-dizin.png'))
    # 2 konu anlatımı: 9. sınıf Modül 4, Bölüm 3 (B grubu) başlığı ve şekli
    pg.goto((KONU / '9-modul-4-periyodik-tablo.html').as_uri()); pg.wait_for_timeout(1500)
    pg.add_style_tag(content='#yukari{display:none!important}')
    pg.evaluate("""() => { const h = document.getElementById('b3');
        window.__f = [...document.querySelectorAll('figure, svg')].find(e => h.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING); }""")
    ust(pg, "window.__f", -330)
    pg.screenshot(path=str(OUT / 'km-konu.png'))
    # 3 çözümlü soru: Bölüm 3'ün ilk sorusu, çözüm açık
    pg.evaluate("""() => { const h = document.getElementById('b3'); let el = h; 
        while (el && !(el.classList && el.classList.contains('soru'))) { el = el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling); 
          if (el && el.querySelector && !el.classList.contains('soru') && el.querySelector('.soru')) { el = el.querySelector('.soru'); } }
        window.__s = el; const d = el.querySelector('details.cozum'); if (d) d.open = true; }""")
    pg.wait_for_timeout(300)
    ust(pg, "window.__s", -72)
    pg.screenshot(path=str(OUT / 'km-soru.png'))
    # 4 yazılı denemesi
    ust(pg, "document.getElementById('yazili')", -72)
    pg.screenshot(path=str(OUT / 'km-yazili.png'))
    b.close()
print('tamam')
