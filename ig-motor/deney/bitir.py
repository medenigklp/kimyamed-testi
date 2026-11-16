# -*- coding: utf-8 -*-
"""Kareleri ve sesi birleştirir, kapağı çizer: python3 bitir.py <ad> -> deney-<ad>.mp4 + deney-<ad>-kapak.jpg"""
import os, sys, subprocess, threading, functools, http.server, socketserver
KOK = os.path.dirname(os.path.abspath(__file__))
AD = sys.argv[1]
hedef = os.path.join(KOK, f'deney-{AD}.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '30', '-i', os.path.join(KOK, 'kare', AD, '%05d.jpg'),
                '-i', os.path.join(KOK, f'ses_{AD}.wav'), '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60', '-bf', '0',
                '-crf', '19', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', '-use_editlist', '0',
                hedef + '.tmp.mp4'], check=True)
os.replace(hedef + '.tmp.mp4', hedef)


class Sessiz(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
s = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Sessiz, directory=KOK))
threading.Thread(target=s.serve_forever, daemon=True).start()
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.goto(f'http://127.0.0.1:{s.server_address[1]}/{AD}.html')
    pg.wait_for_function('window.HAZIR===true', timeout=180000)
    pg.evaluate('window.kapak()')
    pg.screenshot(path=os.path.join(KOK, f'deney-{AD}-kapak.jpg'), type='jpeg', quality=92)
    b.close()
print('tamam', hedef)
