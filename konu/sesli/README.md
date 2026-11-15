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
