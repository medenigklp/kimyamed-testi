# -*- coding: utf-8 -*-
"""Hafta 1 yayın planı: tarih/saat, tür, medya ve açıklamalar (Metricool ve panel bunu kullanır)"""

TABAN = 'https://medenigklp.github.io/kimyamed-testi/ig/h1/'
TZ = 'Europe/Istanbul'

P1 = """Periyodik tabloda bir elementin yerini 3 adımda bul 👇

1️⃣ Elektron dizilimini yaz
2️⃣ En yüksek enerji düzeyi = periyot
3️⃣ s veya p ile bitiyorsa en dış düzeydeki elektronları topla → A grubu
d ile bitiyorsa son s ve d elektronlarını topla → B grubu

Son slaytta iki atom var: Ca ve Zn nerede? Cevabını yorumlara yaz, doğrusu yarın hikâyede.

📌 Kaydet, yazılıdan önce bir daha bak.
9. sınıf konu anlatımı ve 900'den fazla çözümlü soru profildeki bağlantıda.

#kimya #9sınıfkimya #periyodiktablo #elektrondizilimi #maarifmodeli #tyt #yks #kimyaöğretmeni #kimyamed"""

P2 = """Çamaşır suyu ile tuz ruhunu karıştırmak zehirli klor gazı açığa çıkarır ⚠️

"Daha iyi temizlesin" diye ürünleri karıştırma:
✔️ Tek seferde tek ürün kullan
✔️ Pencereyi aç, ortamı havalandır
✔️ Etiketteki uyarı işaretlerini oku

Kaydet ve ailene de gönder.
9. sınıf · Kimya hayattır

#kimya #güvenlik #çamaşırsuyu #temizlik #kimyahayattır #9sınıfkimya #kimyamed"""

P3 = """Günün sorusu 🧪

F⁻, Na⁺ ve Mg²⁺ taneciklerinin elektron sayıları eşit. Yarıçapları büyükten küçüğe nasıl sıralanır?

Cevabını harfiyle yorumlara yaz (A, B, C, D, E). Açıklaması yarın hikâyede.

#günününsorusu #tyt #yks #kimya #periyodiközellikler #izoelektronik #9sınıfkimya #kimyamed"""

P4 = """Tepkime hızında tek grafik, üç etki 👇

🌡️ Sıcaklık → eğri sağa kayar, basıklaşır
⚗️ Katalizör → eşik değeri çizgisi sola kayar
🧪 Derişim → eğrinin altındaki toplam alan büyür

Son slayttaki soruyu yorumlarda cevapla: sıcaklık düşürülürse ne olur? Cevabı yarın hikâyede.

📌 Kaydet, yazılıda işine yarar.
11. sınıf tepkime hızı, 180 çözümlü soru: profildeki bağlantıda.

#kimya #11sınıfkimya #tepkimehızı #katalizör #ayt #yks #maarifmodeli #kimyamed"""

P5 = """CCl₄'te dört polar bağ var ama molekül apolar. Neden? 🤔

Kısa yol: merkez atomda ortaklanmamış elektron çifti varsa polar; yoksa ve yük dağılımı dengeliyse apolar.
H₂O ve NH₃ polar · CO₂ ve CH₄ apolar

Peki BF₃? Cevabını yorumlara yaz, açıklaması yarın hikâyede.

#kimya #9sınıfkimya #polarlık #molekül #tyt #yks #kimyamed"""

P6 = """Kışın yollara neden tuz dökülür? 🧂❄️

Tuz suda çözününce suyun donma noktası düşer. Böylece buz 0 °C'nin altında da eriyebilir.

🔸 Yemek tuzu yaklaşık −10 °C'ye kadar işe yarar
🔸 Daha soğukta kalsiyum klorür (CaCl₂) kullanılır
🔸 Kum buzu eritmez, sadece kaymayı azaltır

Son slayttaki soruyu yorumlarda cevapla. Açıklaması yarın hikâyede.
10. sınıf · Çözeltiler: donma noktası alçalması

Her cumartesi bir kimya merakı. Kaçırmamak için takip et 🔔

#kimya #kimyahayattır #merakedilenler #kış #tuz #donmanoktası #10sınıfkimya #çözeltiler #bilim #kimyamed"""

# Cumartesi genel kimya günü: merak edilenler, güncel ve kültürel konular (kullanıcının isteği).
# Ronya şimdilik paylaşılmıyor: hiçbir gönderide, açıklamada ya da profil bağlantısında yer almaz.
P6_ALT = ["Kapak: Kışın yollara neden tuz dökülür? Hava eksi 5 derecede saf su dolu beher donmuş, tuzlu su dolu beher sıvı.",
          "Tuzlu su 0 derecede donmaz. Termometre: saf su 0 derecede donar, yemek tuzu yaklaşık eksi 10, kalsiyum klorür yaklaşık eksi 30 dereceye kadar işe yarar.",
          "Tanecik düzeyinde: saf su donarken moleküller düzenli dizilir; tuzlu suda sodyum ve klorür iyonları araya girer, buz kristali kurulamaz.",
          "NaCl suda 2 iyon, CaCl2 3 iyon verir. Çözünen tanecik sayısı arttıkça donma noktası daha çok düşer. CaCl2 çözünürken ısı açığa çıkarır.",
          "Tuzun bedeli: paslanmayı hızlandırır, toprağa ve bitkilere zarar verir. Kum buzu eritmez, yalnızca kaymayı azaltır.",
          "Sıra sende: eşit mol sayısında NaCl ve CaCl2 1'er kg suda çözülüyor; hangisi donma noktasını daha çok düşürür?"]
PAZ_ALT = "Dünkü sorunun cevabı CaCl2: 1 mol CaCl2 suda 3 mol, 1 mol NaCl 2 mol iyon verir; tanecik sayısı arttıkça donma noktası daha çok düşer."

# (anahtar, gün etiketi, tarih-saat, tür, başlık, medya listesi, kapak, açıklama)
PLAN = [
    ('pzt', 'Pazartesi 16 Kasım', '2026-11-16T18:00:00', 'POST', 'Periyodik tabloda yer bulma (9. sınıf)', [f'pzt-{i}.jpg' for i in range(1, 8)], None, P1),
    ('sal-h', 'Salı 17 Kasım', '2026-11-17T12:00:00', 'STORY', 'Hikâye: Ca ve Zn cevabı', ['sal-hikaye.jpg'], None, ''),
    ('sal', 'Salı 17 Kasım', '2026-11-17T18:00:00', 'REEL', 'Reels: Bu ikisini evde asla karıştırma', ['sal-reels.mp4'], 'sal-kapak.jpg', P2),
    ('car', 'Çarşamba 18 Kasım', '2026-11-18T18:00:00', 'POST', 'Günün Sorusu: izoelektronik yarıçap (TYT)', ['car-1.jpg'], None, P3),
    ('per-h', 'Perşembe 19 Kasım', '2026-11-19T12:00:00', 'STORY', 'Hikâye: günün sorusunun cevabı', ['per-hikaye.jpg'], None, ''),
    ('per', 'Perşembe 19 Kasım', '2026-11-19T18:00:00', 'POST', 'Tepkime hızı tek grafikte (11. sınıf)', [f'per-{i}.jpg' for i in range(1, 8)], None, P4),
    ('cum-h', 'Cuma 20 Kasım', '2026-11-20T12:00:00', 'STORY', 'Hikâye: sıcaklık düşerse', ['cum-hikaye.jpg'], None, ''),
    ('cum', 'Cuma 20 Kasım', '2026-11-20T18:00:00', 'REEL', 'Reels: Polar bağ ≠ polar molekül', ['cum-reels.mp4'], 'cum-kapak.jpg', P5),
    ('cmt-h', 'Cumartesi 21 Kasım', '2026-11-21T12:00:00', 'STORY', 'Hikâye: BF₃ cevabı', ['cmt-hikaye.jpg'], None, ''),
    ('cmt', 'Cumartesi 21 Kasım', '2026-11-21T10:00:00', 'POST', 'Merak: Kışın yollara neden tuz dökülür?', [f'cmt3-{i}.jpg' for i in range(1, 7)], None, P6),
    ('paz-h', 'Pazar 22 Kasım', '2026-11-22T12:00:00', 'STORY', 'Hikâye: NaCl mi CaCl₂ mi? cevabı', ['paz-hikaye.jpg'], None, ''),
]

PROFIL_AD = 'kimyamed | Kimya · YKS'
PROFIL_BIO = """Medeni Gökalp ile kimya 🧪
Konu özeti • günün sorusu • Reels
Merak edilenler • güncel • kültür
9-12. sınıf · TYT-AYT 👇"""
BAGLANTILAR = [
    ('kimyamed konu anlatımı', 'https://medenigklp.github.io/kimyamed-testi/konu/'),
    ('kimyamed testler', 'https://medenigklp.github.io/kimyamed-testi/'),
]
ONE_CIKANLAR = [('gunun-sorusu', 'Günün Sorusu'), ('9-sinif', '9. Sınıf'), ('10-sinif', '10. Sınıf'), ('11-sinif', '11. Sınıf'),
                ('12-sinif', '12. Sınıf'), ('yks', 'YKS'), ('araclar', 'Merak')]

HAFTALAR = [
    ('1. hafta · 16–21 Kasım', ['9 · Periyodik tabloda yer bulma', 'Reels · Evde asla karıştırma', 'Günün sorusu · İzoelektronik yarıçap',
                                 '11 · Tepkime hızı tek grafikte', 'Reels · Polar bağ ≠ polar molekül', 'Merak · Kışın yollara neden tuz dökülür?']),
    ('2. hafta · 23–28 Kasım', ['10 · Mol kavramı tek şemada', 'Reels · Buz neden suda yüzer?', 'Günün sorusu · Mol (TYT)',
                                 '12 · Pil mi elektroliz mi? Anot-katot tuzağı', 'Reels · Ekzotermik mi endotermik mi?', 'Güncel · 2026 Nobel Kimya Ödülü']),
    ('3. hafta · 30 Kasım–5 Aralık', ['9 · İyonik mi kovalent mi? 3 soruda karar', 'Reels · Tuz suda nasıl çözünür?', 'Günün sorusu · Denge (AYT)',
                                       '11 · Le Chatelier: dengeyi bozunca', 'Reels · Katalizör dengeyi değiştirir mi?', 'Kültür · Aziz Sancar ve DNA onarımı']),
    ('4. hafta · 7–12 Aralık (yazılı haftası)', ['9 · 1. dönem yazılısı: 10 maddede tekrar', 'Reels · Yazılıda en çok puan kaybettiren 3 hata', 'Günün sorusu · Tepkime türleri',
                                                  '10-11 · Yazılı tekrarı', 'Reels · Son gece nasıl tekrar yapılır?', 'Merak · Kek neden kabarır?']),
]
