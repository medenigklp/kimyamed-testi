# -*- coding: utf-8 -*-
"""1 Dakikada Kimya · Bölüm 1, öğretmenin kendi sesiyle.
Kayıttaki satırlar (sn) elle eşlendi: ilk deneme (3.5-5.1) atıldı, uzun duraklar kısaltıldı,
geri sayımda 3 tık sesi, ses temizleme ve ses düzeyi eşitleme yapıldı. Kareler satır başlarına göre süreleniyor."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seri_kimya import (kare, kartlar, gunluk, piktogramlar, soru, sayac, ALT, madde_kimya, tuzak_kart, formul_cipleri, KIRMIZI,
                        giris, giris2, bitis, bas_kareler, ilerleme_cubugu)
from reel import videoya_cevir, _calistir

KOK = os.path.dirname(os.path.abspath(__file__))
SES = os.path.join(os.path.dirname(KOK), 'ses-b1', 'kayit3.m4a')  # 2. kayıt (Yeni Kayıt 3)
KLASOR = os.path.join(KOK, 'cikti', 'seri-b1')

# satır -> konuşma parçaları (kayıttaki başlangıç, bitiş)
SATIRLAR = [  # Yeni Kayıt 3 için eşleme (satır -> kayıttaki konuşma parçaları); sondaki 74.5 sn tıkırtısı atıldı
    ('L1', [(5.05, 7.37)]),
    ('L2', [(8.46, 9.07), (9.65, 10.88)]),
    ('L3', [(12.01, 12.68), (13.09, 14.29), (14.72, 15.82)]),
    ('L4', [(16.13, 18.13)]),
    ('L5', [(20.18, 21.73), (22.34, 22.71), (23.54, 24.76), (25.74, 27.03)]),
    ('L6', [(27.65, 28.82), (29.17, 30.38)]),
    ('L7', [(30.82, 32.88)]),
    ('L8', [(33.69, 35.22)]),
    ('L9', [(35.71, 37.58), (38.05, 39.58)]),
    ('L10', [(40.87, 43.31)]),
    ('L11', [(44.64, 47.08)]),
    ('L12', [(48.60, 50.06), (51.99, 54.50)]),
    ('L13', [(55.44, 56.11), (56.67, 57.21), (57.53, 59.59)]),
    ('L14', [(60.97, 62.23), (63.44, 64.39)]),
    ('SAYAC', None),
    ('L16', [(67.69, 69.54), (71.22, 73.20)]),
]
ON, ARA_IC, ARA_SATIR, SON, PAY_ON, PAY_SON = 0.25, 0.20, 0.24, 1.10, 0.04, 0.08
TEMPO = 1.12  # konuşma %12 hızlı (ses perdesi değişmez): daha canlı anlatım


def ses_kur(hedef):
    """konuşma parçalarını kısaltılmış aralarla birleştirir; satır başlangıç zamanlarını döndürür"""
    parcalar, zaman, baslar, harita = [], 0.0, {}, []
    parcalar.append(('sus', ON)); zaman += ON
    for i, (ad, ps) in enumerate(SATIRLAR):
        if ps is None:  # 3 saniyelik geri sayım: her saniye başında bir tık
            baslar[ad] = zaman
            for _ in range(3):
                parcalar.append(('tik', 0.07)); parcalar.append(('sus', 0.93)); zaman += 1.0
            continue
        if i > 0 and SATIRLAR[i - 1][1] is not None:
            parcalar.append(('sus', ARA_SATIR)); zaman += ARA_SATIR
        baslar[ad] = zaman
        for j, (s, e) in enumerate(ps):
            if j > 0:
                ara = min(ARA_IC, s - ps[j - 1][1]); parcalar.append(('sus', ara)); zaman += ara
            s2, e2 = s - PAY_ON, e + PAY_SON
            harita.append((s2, e2, zaman))
            parcalar.append(('ses', (s2, e2))); zaman += (e2 - s2) / TEMPO
    parcalar.append(('sus', SON)); zaman += SON
    girdiler, zincir, etiketler, n_tik = [], [], [], sum(1 for p in parcalar if p[0] == 'tik')
    zincir.append(f'[1:a]asplit={n_tik}' + ''.join(f'[t{k}]' for k in range(n_tik)))
    k_tik = 0
    for k, (tur, v) in enumerate(parcalar):
        if tur == 'ses':
            zincir.append(f'[0:a]atrim=start={v[0]:.3f}:end={v[1]:.3f},asetpts=PTS-STARTPTS,atempo={TEMPO},aformat=sample_rates=48000:channel_layouts=mono[p{k}]')
        elif tur == 'sus':
            zincir.append(f'anullsrc=r=48000:cl=mono,atrim=duration={v:.3f}[p{k}]')
        else:
            zincir.append(f'[t{k_tik}]aformat=sample_rates=48000:channel_layouts=mono[p{k}]'); k_tik += 1
        etiketler.append(f'[p{k}]')
    zincir.append(''.join(etiketler) + f'concat=n={len(etiketler)}:v=0:a=1[c]')
    zincir.append('[c]highpass=f=80,equalizer=f=180:t=q:w=1.0:g=1.5,equalizer=f=3200:t=q:w=1.4:g=4,equalizer=f=6500:t=q:w=1.5:g=2,'
                  'afftdn=nf=-42,acompressor=threshold=-19dB:ratio=2.6:attack=4:release=80:makeup=2,'
                  'loudnorm=I=-15:TP=-1.5:LRA=8,aresample=48000,pan=stereo|c0=c0|c1=c0[son]')
    tmp = hedef + '.tmp.m4a'
    _calistir(['ffmpeg', '-y', '-i', SES, '-f', 'lavfi', '-i', 'sine=frequency=1150:duration=0.07,afade=t=out:st=0.02:d=0.05,volume=0.30',
               '-filter_complex', ';'.join(zincir), '-map', '[son]', '-c:a', 'aac', '-b:a', '160k', '-t', f'{zaman:.3f}', tmp])
    os.replace(tmp, hedef)
    return baslar, zaman, harita


ONCE_OGE, ONCE_YAZI = 0.40, 0.25  # öğe sesten 0,40 sn, altyazı 0,25 sn önce gelsin (önce yazı, sonra ses)


def kareler_sureli(baslar, toplam, harita):
    def t(orij):
        """kayıttaki zamanı birleştirilmiş sesteki zamana çevirir"""
        for s2, e2, cikis in harita:
            if s2 <= orij <= e2:
                return cikis + (orij - s2) / TEMPO
        sonraki = min((h for h in harita if h[0] > orij), key=lambda h: h[0], default=harita[-1])
        return sonraki[2]
    b = {k: max(0.0, v - ONCE_YAZI) for k, v in baslar.items()}
    o = lambda orij: max(0.0, t(orij) - ONCE_OGE)
    unlem = (f'<div style="width:300px; height:300px; border-radius:50%; background:{KIRMIZI}; color:#fff; display:grid; place-items:center; '
             f'font:700 220px/1 Poppins; box-shadow:0 20px 50px rgba(192,57,43,.25)">!</div>')
    alt5 = 'Alt dalları: <em>analitik</em>, <em>anorganik</em>,'
    alt6 = '<em>biyokimya</em>, <em>fizikokimya</em>,'
    alt7 = '<em>organik</em> ve <em>polimer</em> kimyası.'
    sira = [
        (0.0, kare(serbest=giris + '<div class="altyazi">Kimyayı <em>1 dakikada</em> tekrar ediyoruz!</div>')),
        (b['L2'], kare(serbest=giris2 + '<div class="altyazi">Bölüm 1: <em>Kimya bilimine</em> giriş.</div>')),
        (b['L3'], kare(madde_kimya, 'Kimya; maddenin <em>yapısını</em>, <em>özelliklerini</em>', 'Kimya nedir?', 1, 0)),
        (b['L4'], kare(madde_kimya, 've <em>değişimlerini</em> inceleyen bilimdir.', 'Kimya nedir?', 1, 0)),
        # alt dallar: her biri adı söylenmeden hemen önce tek tek
        (b['L5'], kare(kartlar(ALT, 0), alt5, 'Alt dallar', 2, 1)),
        (o(23.54), kare(kartlar(ALT, 1), alt5, 'Alt dallar', 2, 1)),
        (o(25.74), kare(kartlar(ALT, 2), alt5, 'Alt dallar', 2, 1)),
        (min(b['L6'], o(27.65)), kare(kartlar(ALT, 3), alt6, 'Alt dallar', 2, 1)),
        (o(29.17), kare(kartlar(ALT, 4), alt6, 'Alt dallar', 2, 1)),
        (min(b['L7'], o(30.82)), kare(kartlar(ALT, 5), alt7, 'Alt dallar', 2, 1)),
        (o(31.66), kare(kartlar(ALT, 6), alt7, 'Alt dallar', 2, 1)),
        # kimya her yerde: ilaç, gıda, temizlik, enerji tek tek
        (min(b['L8'], o(33.69)), kare(gunluk(1), '<em>İlaçtan</em> gıdaya,', 'Kimya her yerde', 3, 2)),
        (o(34.50), kare(gunluk(2), '<em>İlaçtan</em> <em>gıdaya</em>,', 'Kimya her yerde', 3, 2)),
        (min(b['L9'], o(35.71)), kare(gunluk(3), '<em>temizlikten</em> enerjiye, kimya her yerde.', 'Kimya her yerde', 3, 2)),
        (o(36.70), kare(gunluk(4), '<em>temizlikten</em> <em>enerjiye</em>, kimya her yerde.', 'Kimya her yerde', 3, 2)),
        # güvenlik: işaretler tek tek
        (min(b['L10'], o(40.87)), kare(piktogramlar(1), 'Bir kimyasalı kullanmadan önce,', 'Güvenlik', 4, 3)),
        (o(41.60), kare(piktogramlar(2), 'Bir kimyasalı kullanmadan önce,', 'Güvenlik', 4, 3)),
        (o(42.33), kare(piktogramlar(3), 'Bir kimyasalı kullanmadan önce,', 'Güvenlik', 4, 3)),
        (b['L11'], kare(piktogramlar(3), 'etiketteki <em>uyarı işaretlerine</em> bak.', 'Güvenlik', 4, 3)),
        # tuzak
        (b['L12'], kare(unlem, '<em>Dikkat, tuzak!</em>', 'Tuzak!', '!', 4)),
        (o(51.99), kare(f'<div style="text-align:center">{tuzak_kart}</div>', 'Kimyasal demek <em>zararlı</em> demek değil.', 'Tuzak!', '!', 4)),
        (min(b['L13'], o(55.44)), kare(f'<div style="text-align:center">{tuzak_kart}{formul_cipleri(1)}</div>', '<em>Su</em>, tuz ve oksijen de birer kimyasaldır.', 'Tuzak!', '!', 4)),
        (o(56.67), kare(f'<div style="text-align:center">{tuzak_kart}{formul_cipleri(2)}</div>', '<em>Su</em>, <em>tuz</em> ve oksijen de birer kimyasaldır.', 'Tuzak!', '!', 4)),
        (o(57.74), kare(f'<div style="text-align:center">{tuzak_kart}{formul_cipleri(3)}</div>', '<em>Su</em>, <em>tuz</em> ve <em>oksijen</em> de birer kimyasaldır.', 'Tuzak!', '!', 4)),
        # soru ve geri sayım
        (b['L14'], kare(soru(siklar_acik=True), 'Şimdi <em>sıra sende!</em> Üç saniyen var.', 'Sıra sende!', None, 5)),
        (baslar['SAYAC'], kare(soru(3), sayac(3), 'Sıra sende!', None, 5)),
        (baslar['SAYAC'] + 1.0, kare(soru(2), sayac(2), 'Sıra sende!', None, 5)),
        (baslar['SAYAC'] + 2.0, kare(soru(1), sayac(1), 'Sıra sende!', None, 5)),
        (b['L16'], kare(serbest=bitis)),
    ]
    # çok yakın düşen durumlar: sonraki öncekinin yerini alır
    temiz = []
    for zaman, k in sira:
        if temiz and zaman - temiz[-1][0] < 0.15:
            temiz[-1] = (temiz[-1][0], k)
        else:
            temiz.append((zaman, k))
    sureler = [round(temiz[i + 1][0] - temiz[i][0], 3) for i in range(len(temiz) - 1)] + [round(toplam - temiz[-1][0], 3)]
    assert all(x > 0 for x in sureler), sureler
    return [(d, k) for d, (_, k) in zip(sureler, temiz)]


if __name__ == '__main__':
    ses = os.path.join(KLASOR, 'b1-ses.m4a')
    baslar, toplam, harita = ses_kur(ses)
    print('ses süresi:', round(toplam, 2), {k: round(v, 2) for k, v in baslar.items()})
    kareler = kareler_sureli(baslar, toplam, harita)
    print('kare süreleri:', [s for s, _ in kareler], 'toplam:', round(sum(s for s, _ in kareler), 2))
    yollar, tasma = bas_kareler(kareler, KLASOR, 'b1s')
    print('taşma:', tasma or 'yok')
    ham = os.path.join(KLASOR, 'b1s-ham.mp4')
    videoya_cevir(yollar, [s for s, _ in kareler], ham, gecis=0.15)
    cubuklu = os.path.join(KLASOR, 'b1s-cubuk.mp4')
    ilerleme_cubugu(ham, cubuklu, toplam)
    hedef = os.path.join(KLASOR, 'bolum1-sesli.mp4')
    _calistir(['ffmpeg', '-y', '-i', cubuklu, '-i', ses, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest',
               '-movflags', '+faststart', hedef + '.tmp.mp4'])
    os.replace(hedef + '.tmp.mp4', hedef)
    print('tamam:', hedef)
