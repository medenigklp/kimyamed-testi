# Öğretmen ses kayıtları

Sesli Ders tahtası bir cümlenin kaydını burada bulursa cihaz sesi yerine o kaydı çalar.

Kayıt eklemek için:

1. Sesli Ders → Ayarlar → **Kendi sesinle kaydet** ile cümleleri kendi sesinle oku.
2. **Kayıtları indir** ile `sesli-….json` dosyasını al.
3. Dosyayı bu klasöre koy ve adını `liste.json` içindeki listeye yaz:

```json
{"paketler": ["sesli-konu.json"]}
```

Bu klasördeki kayıtlar herkese açıktır: siteyi açan herkes bu sesleri dinleyebilir ve indirebilir.

# Doğal sesler (Google)

`bulut.json` içindeki `adres` doluysa sesli anlatım Google'ın doğal Türkçe seslerini kullanır; boşsa cihazın kendi sesleri kullanılır. Ses servisi Ronya ile ortaktır: kurulumu ve kodu Ronya deposundaki `sesli/README.md` ve `sesli/ses-servisi.js` dosyalarında.

# Öğrenci sesleri, Ders PDF'si, grafik çizimi, akıllı tahta

- Öğrenciler yalnızca öğretmenin seçtiği iki doğal sesi (bir kadın, bir erkek) seçebilir; öğretmen modu ve öğrenci seslerinin değiştirilmesi Ronya deposundaki `sesli/README.md`'de anlatılıyor. Ses servisine ulaşılamazsa `bulut.json`'daki `ogrenci` sesleri kullanılır.
- **Ders PDF'si** için `pdf-lib.min.js` (pdf-lib 1.17.1, MIT), `pdf-yazi.js` (DejaVu Sans alt kümesi) ve `sesli-pdf.js` bu klasördedir; yalnızca PDF istenince yüklenir.

