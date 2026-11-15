# kimyamed Instagram motoru

Gönderi görsellerini (1080x1350), hikâyeleri ve Reels'i (1080x1920) HTML'den üreten betikler.
Bu dal (ig-motor) siteye yayımlanmaz; yalnızca betikleri saklar.

- `motor.py`: kaydırmalı gönderi ve hikâye şablonu (kimyamed turuncusu, altıgen doku), PNG baskısı, taşma denetimi
- `reel.py`: sahne görselleri → sahne başına mp4 (içinde kısa geçiş) → birleştirme, sessiz ses izi
- `gonderiN.py`, `reels_h1.py`, `hikayeler_h1.py`: 1. haftanın içerikleri
- `plan_h1.py`: paylaşım saatleri, açıklamalar, profil metni, 4 haftalık plan
- `panel.py`: telefonda açılan paylaşım paneli
- Yayın görselleri: `main` dalında `ig/h1/` (Metricool bu adreslerden alır)
