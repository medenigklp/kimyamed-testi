# -*- coding: utf-8 -*-
"""Öne çıkan (highlight) kapakları: 1080x1920, ortadaki daire kırpılır"""
import os, math
from playwright.sync_api import sync_playwright
from motor import LOGO_ISARET

KL = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikti', 'kapaklar')
os.makedirs(KL, exist_ok=True)

def altigen(r=330, cx=540, cy=960):
    return ' '.join(f'{cx + r * math.cos(math.radians(60 * k - 90)):.1f},{cy + r * math.sin(math.radians(60 * k - 90)):.1f}' for k in range(6))

ERLEN = '<g transform="translate(540 975) scale(.8) translate(-540 -945)"><path d="M470 700h140M490 700v170L370 1150q-20 40 25 40h290q45 0 25-40L590 870V700" fill="none" stroke="#fff" stroke-width="26" stroke-linejoin="round" stroke-linecap="round"/><path d="M420 1080h240" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".7"/></g>'
kapaklar = [
    ('gunun-sorusu', '#F85300', '<text x="540" y="1040" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="260" fill="#fff">?</text>'),
    ('9-sinif', '#F85300', '<text x="540" y="1045" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="250" fill="#fff">9</text>'),
    ('10-sinif', '#F85300', '<text x="540" y="1040" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="230" fill="#fff">10</text>'),
    ('11-sinif', '#F85300', '<text x="540" y="1040" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="230" fill="#fff">11</text>'),
    ('12-sinif', '#F85300', '<text x="540" y="1040" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="230" fill="#fff">12</text>'),
    ('yks', '#F85300', '<text x="540" y="1012" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="150" fill="#fff">YKS</text>'),
    ('araclar', '#F85300', ERLEN),
]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    for ad, renk, ic in kapaklar:
        svg = f'<svg width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="{renk}"/><polygon points="{altigen()}" fill="none" stroke="#fff" stroke-width="18" opacity=".95"/>{ic}</svg>'
        pg.set_content(f'<html><body style="margin:0">{svg}</body></html>'); pg.wait_for_timeout(150)
        pg.screenshot(path=os.path.join(KL, ad + '.png'))
    b.close()
# önizleme: daire kırpılmış hâlleri yan yana
from PIL import Image, ImageDraw
kucuk = []
for ad, _, _ in kapaklar:
    im = Image.open(os.path.join(KL, ad + '.png')).convert('RGB').crop((90, 510, 990, 1410)).resize((220, 220))
    m = Image.new('L', (220, 220), 0); ImageDraw.Draw(m).ellipse((0, 0, 219, 219), fill=255)
    tuval = Image.new('RGB', (220, 220), (255, 255, 255)); tuval.paste(im, (0, 0), m); kucuk.append(tuval)
c = Image.new('RGB', (len(kucuk) * 240 + 20, 260), (255, 255, 255))
for i, k in enumerate(kucuk): c.paste(k, (20 + i * 240, 20))
c.save(os.path.join(KL, 'onizleme.png'))
print('ok')
