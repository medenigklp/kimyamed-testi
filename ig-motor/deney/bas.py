# -*- coding: utf-8 -*-
"""Deney Köşesi videolarını kare kare çizer: python3 bas.py lahana.html [--kareler 1,5.5,9] [--fps 30]"""
import os, sys, threading, functools, http.server, socketserver, subprocess, time
KOK = os.path.dirname(os.path.abspath(__file__))
sayfa = sys.argv[1]
ad = os.path.splitext(sayfa)[0]
FPS = int(sys.argv[sys.argv.index('--fps') + 1]) if '--fps' in sys.argv else 30


class Sessiz(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def sunucu():
    socketserver.TCPServer.allow_reuse_address = True
    h = functools.partial(Sessiz, directory=KOK)
    s = socketserver.TCPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s.server_address[1]


port = sunucu()
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    hatalar = []
    pg.on('pageerror', lambda e: hatalar.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/{sayfa}' + ('?' + sys.argv[sys.argv.index('--q') + 1] if '--q' in sys.argv else ''))
    pg.wait_for_function('window.HAZIR===true', timeout=180000)
    if hatalar:
        print('HATA:', hatalar[:3]); sys.exit(1)
    sure = pg.evaluate('window.SURE')
    if '--kareler' in sys.argv:
        anlar = [float(x) for x in sys.argv[sys.argv.index('--kareler') + 1].split(',')]
        os.makedirs(os.path.join(KOK, 'kontrol'), exist_ok=True)
        for t in anlar:
            pg.evaluate(f'window.kare({t})')
            pg.screenshot(path=os.path.join(KOK, 'kontrol', f'{ad}-{t:05.2f}.jpg'), type='jpeg', quality=88)
        print('kontrol kareleri:', len(anlar))
    else:
        klasor = os.path.join(KOK, 'kare', ad)
        os.makedirs(klasor, exist_ok=True)
        n = int(round(sure * FPS))
        t0 = time.time()
        for i in range(n):
            yol = os.path.join(klasor, f'{i:05d}.jpg')
            if os.path.exists(yol) and os.path.getsize(yol) > 10000:
                continue   # kaldığı yerden devam
            pg.evaluate(f'window.kare({i / FPS})')
            pg.screenshot(path=yol + '.tmp.jpg', type='jpeg', quality=92)
            os.replace(yol + '.tmp.jpg', yol)
            if i % 100 == 0:
                print(i, '/', n, round(time.time() - t0), 'sn', flush=True)
        print('bitti', n, 'kare', round(time.time() - t0), 'sn')
    b.close()
