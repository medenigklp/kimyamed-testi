/* ============================================================
   SESLİ DERS — tahtaya yazarak sesli konu anlatımı ve soru çözümü
   Ronya ve kimyamed için ortak modül (tek dosya, bağımlılık yok).

   Kullanım
     sayfanın sonuna: script etiketiyle sesli-ders.js (defer olabilir)
     SesliDers.yerlestir(kapsayici, { dersler: SesliDers.dersler, varsayilan: 'konu', metin: true });
     SesliDers.ac(ders);                 // tam ekran pencerede tek ders
     SesliDers.sorudanDers(soruKarti);   // kimyamed .soru kartından ders
     SesliDers.parcalardanDers({ baslik, soru: [html], siklar: [html], cozum: [html], cevap: html });

   kimyamed modüllerinde her .soru kartına "Sesli anlat" düğmesi kendiliğinden eklenir.
   Sesler: cihazın Türkçe sesleri ya da öğretmenin kendi kaydı (kayıt stüdyosu).
   Öğretmen kayıtları sitede sesli/liste.json ile yayımlanırsa bütün öğrenciler duyar.
   ============================================================ */
(function () {
  'use strict';
  if (window.SesliDers) return;

  /* ================= yardımcılar ================= */
  var AZ = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Öğretmen kayıtları betiğin yanındaki sesli/ klasöründe yayımlanır
  var BETIK_DIZIN = ((document.currentScript && document.currentScript.src) || '').replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tween(ms, fn) {
    return new Promise(function (res) {
      if (AZ || ms <= 0) { fn(1); res(); return; }
      var t0 = performance.now();
      (function adim(now) {
        var t = Math.min(1, (now - t0) / ms);
        fn(t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        if (t < 1) requestAnimationFrame(adim); else res();
      })(t0);
    });
  }
  function karistir(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return '#' + pa.map(function (v, i) { var x = Math.round(v + (pb[i] - v) * t).toString(16); return x.length < 2 ? '0' + x : x; }).join('');
  }
  var depo = {
    al: function (k, d) { try { var v = localStorage.getItem('sesliDers.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    yaz: function (k, v) { try { localStorage.setItem('sesliDers.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  function ozet(s) { // FNV-1a: cümleye bağlı kayıt anahtarı
    var h = 0x811c9dc5;
    s = String(s).replace(/\s+/g, ' ').trim();
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul ? Math.imul(h, 16777619) >>> 0 : (h * 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function gurultu(boyut, oran, alfa) { // tebeşir dokusu için noktalı desen
    try {
      var c = document.createElement('canvas'); c.width = c.height = boyut;
      var x = c.getContext('2d'), im = x.createImageData(boyut, boyut);
      for (var i = 0; i < im.data.length; i += 4) {
        var del = Math.random() < oran;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
        im.data[i + 3] = alfa == null ? (del ? 0 : 255) : (del ? alfa : 0);
      }
      x.putImageData(im, 0, 0);
      return c.toDataURL('image/png');
    } catch (e) { return ''; }
  }
  function b64(buf) {
    var bytes = new Uint8Array(buf), parca = 0x8000, s = '';
    for (var i = 0; i < bytes.length; i += parca) s += String.fromCharCode.apply(null, bytes.subarray(i, i + parca));
    return btoa(s);
  }

  /* ================= doğal sesler: Google Cloud Text-to-Speech, sitenin ses servisi üzerinden =================
     Ses servisi (sesli/ses-servisi.js, Cloudflare Worker) API anahtarını saklar; adresi sesli/bulut.json'da yazar. */
  var BULUT_SESLER = (function () {
    var l = [];
    'Achernar Aoede Autonoe Callirrhoe Despina Erinome Gacrux Kore Laomedeia Leda Pulcherrima Sulafat Vindemiatrix Zephyr'.split(' ').forEach(function (a) { l.push({ id: 'tr-TR-Chirp3-HD-' + a, ad: a, cins: 'k', grup: 'dogal' }); });
    'Achird Algenib Algieba Alnilam Charon Enceladus Fenrir Iapetus Orus Puck Rasalgethi Sadachbia Sadaltager Schedar Umbriel Zubenelgenubi'.split(' ').forEach(function (a) { l.push({ id: 'tr-TR-Chirp3-HD-' + a, ad: a, cins: 'e', grup: 'dogal' }); });
    [['A', 'k'], ['B', 'e'], ['C', 'k'], ['D', 'k'], ['E', 'e']].forEach(function (x) { l.push({ id: 'tr-TR-Wavenet-' + x[0], ad: 'WaveNet ' + x[0], cins: x[1], grup: 'sade' }); });
    return l;
  })();
  var Bulut = {
    adres: null, bellek: {}, sira: [],
    hazir: function () { return !!this.adres; },
    ses: function () {
      var id = (Izin.ogretmen() && ayar.bulutSes) || Izin.sesi(ayar.cins);
      return BULUT_SESLER.filter(function (v) { return v.id === id; })[0] || BULUT_SESLER[7];
    },
    al: function (metin, sesId) {
      metin = String(metin || '').replace(/\s+/g, ' ').trim();
      if (!this.adres) return Promise.reject(new Error('ses servisi yok'));
      if (this.mola && Date.now() < this.mola) return Promise.reject(new Error('ses servisi molada'));
      if (!metin || metin.length > 1400) return Promise.reject(new Error('metin uygun değil'));
      var self = this, u = this.adres.replace(/\/+$/, '') + '/ses?ses=' + encodeURIComponent(sesId || this.ses().id) + '&m=' + encodeURIComponent(metin);
      if (this.bellek[u]) return this.bellek[u];
      var p = fetch(u, { mode: 'cors', credentials: 'omit' })
        .then(function (r) { if (!r.ok) { if (r.status === 429) self.mola = Date.now() + 10 * 60 * 1000; throw new Error('ses servisi ' + r.status); } return r.blob(); })
        .then(function (b) { if (!b.size) throw new Error('boş ses'); return { url: URL.createObjectURL(b), bulut: true }; });
      p.catch(function () { delete self.bellek[u]; var k = self.sira.indexOf(u); if (k >= 0) self.sira.splice(k, 1); });
      this.bellek[u] = p; this.sira.push(u);
      while (this.sira.length > 40) {
        var eski = this.sira.shift(), ep = this.bellek[eski]; delete this.bellek[eski];
        if (ep) ep.then(function (k) { setTimeout(function () { URL.revokeObjectURL(k.url); }, 60000); }, function () {});
      }
      return p;
    }
  };
  function kaynakNe() {
    var k = ayar.kaynak || (Bulut.hazir() ? 'bulut' : 'cihaz');
    if (!Izin.ogretmen()) k = k === 'kayit' && Yayin.var() ? 'kayit' : 'bulut';
    return k === 'bulut' && !Bulut.hazir() ? 'cihaz' : k;
  }

  /* ================= ses izinleri: öğretmen ve öğrenci =================
     Öğrenciler yalnız öğretmenin seçtiği iki doğal sesi kullanır (bir kadın, bir erkek); öteki sesler onlara kapalıdır.
     Öğretmen kendi cihazında öğretmen bağlantısını (…#ogretmen=anahtar) bir kez açar ya da Ayarlar → Öğretmen girişi'ne
     anahtarı yazar: o cihazda bütün sesler açılır, öğrenci seslerini değiştirebilir. Öğrenci sesleri ses servisinde
     saklanır (sesli/ses-servisi.js → /ayar); servise ulaşılamazsa sesli/bulut.json'daki "ogrenci" kullanılır.
     Kodda anahtarın kendisi yok, yalnız SHA-256 özeti var. */
  var OGRETMEN_OZET = 'eeb6c158a4aba2056a2d4768c8d5e11a326cd6cc2631b0a14d5d90d08eb1435c';
  var Izin = {
    ogrenci: { k: 'tr-TR-Chirp3-HD-Kore', e: 'tr-TR-Chirp3-HD-Charon' },
    anahtar: function () { return depo.al('ogrAnahtar', '') || ''; },
    ogretmen: function () { return !!this.anahtar(); },
    sesi: function (c) {
      var id = this.ogrenci[c === 'e' ? 'e' : 'k'];
      return BULUT_SESLER.some(function (v) { return v.id === id; }) ? id : (c === 'e' ? 'tr-TR-Chirp3-HD-Charon' : 'tr-TR-Chirp3-HD-Kore');
    },
    koy: function (o, sakla) {
      if (!o) return false;
      var gecerli = function (id, c) { return BULUT_SESLER.some(function (v) { return v.id === id && v.cins === c; }); }, deg = false;
      if (gecerli(o.k, 'k') && o.k !== this.ogrenci.k) { this.ogrenci.k = o.k; deg = true; }
      if (gecerli(o.e, 'e') && o.e !== this.ogrenci.e) { this.ogrenci.e = o.e; deg = true; }
      if (sakla) depo.yaz('ogrSesler', { k: this.ogrenci.k, e: this.ogrenci.e });
      return deg;
    },
    servis: function (yol) { return Bulut.adres ? Bulut.adres.replace(/\/+$/, '') + yol : null; },
    yukle: function () { // ses servisindeki güncel öğrenci sesleri
      var self = this, u = this.servis('/ayar');
      if (!u || !window.fetch) return Promise.resolve(false);
      return fetch(u, { mode: 'cors', credentials: 'omit', cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return !!(j && j.ogrenci && self.koy(j.ogrenci, true)); })
        .catch(function () { return false; });
    },
    ozetle: function (s) {
      if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.resolve('');
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      }, function () { return ''; });
    },
    gir: function (anahtar) { // true: bu cihazda öğretmen modu açıldı
      anahtar = String(anahtar || '').trim();
      return this.ozetle(anahtar).then(function (h) {
        if (!anahtar || h !== OGRETMEN_OZET) return false;
        depo.yaz('ogrAnahtar', anahtar);
        Oynatici.hepsi.forEach(function (o) { o.izinUygula(); o.sesListesi(); o.gorunumUygula(); });
        return true;
      });
    },
    cik: function () { depo.yaz('ogrAnahtar', ''); Oynatici.hepsi.forEach(function (o) { o.izinUygula(); o.sesListesi(); o.gorunumUygula(); }); },
    kaydet: function (o) { // öğrenci seslerini ses servisine yaz → 'tamam' | 'eski' | 'red' | 'ag'
      var self = this, u = this.servis('/ayar');
      if (!u || !window.fetch) return Promise.resolve('ag');
      return fetch(u, { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ anahtar: this.anahtar(), ogrenci: o }) })
        .then(function (r) {
          if (r.status === 404 || r.status === 405) return 'eski';
          if (r.status === 403) return 'red';
          if (!r.ok) return 'ag';
          self.koy(o, true); return 'tamam';
        }).catch(function () { return 'ag'; });
    }
  };
  (function () { var s = depo.al('ogrSesler', null); if (s) Izin.koy(s); })();
  // Öğretmen bağlantısı: …#ogretmen=anahtar. Anahtar adres çubuğundan hemen silinir, cihazda saklanır.
  (function () {
    var m = /(^#|&)ogretmen=([A-Za-z0-9_-]{8,64})/.exec(location.hash || '');
    if (!m) return;
    var h = location.hash.replace(m[0], m[1] === '#' ? '#' : '').replace(/^#&/, '#');
    try { history.replaceState(null, '', location.pathname + location.search + (h === '#' ? '' : h)); } catch (e) {}
    Izin.gir(m[2]).then(function (ok) { Izin.girisSonuc = ok ? 'tamam' : 'yanlis'; Oynatici.hepsi.forEach(function (o) { o.izinUygula(); }); });
  })();

  /* ================= karşılıklı anlatım: kadın ve erkek öğretmen sırayla anlatır ================= */
  var KONUSMACI = { A: { ad: 'Elif Hoca', cins: 'k' }, B: { ad: 'Kerem Hoca', cins: 'e' } };
  var TEPKILER = ['Evet, aynen öyle.', 'Çok önemli bir nokta.', 'Bunu biraz açalım.', 'Güzel, devam edelim.', 'Şöyle düşünelim.', 'Bunu not almakta fayda var.', 'Bir de şuna bakalım.'];
  function konusmaciSesi(kim) {
    var og = Izin.ogretmen();
    if (!ayar.ikili || !kim) return { bulut: Bulut.ses().id, cins: ayar.cins, ad: og ? ayar.sesAdi : '' };
    var c = KONUSMACI[kim].cins;
    return { bulut: (og && (c === 'e' ? ayar.bulutSesE : ayar.bulutSesK)) || Izin.sesi(c), cins: c, ad: og ? (c === 'e' ? ayar.sesAdiE : ayar.sesAdiK) : '' };
  }
  // Hangi adımı kimin anlatacağı: başlıkları Elif Hoca açar, anlatım sırayla paylaşılır,
  // soru cümlesini öbürü yanıtlar, not kâğıdını bir öğretmen baştan sona okur, arada kısa geçiş sözleri olur.
  function karsilikliPlan(adimlar) {
    var plan = [], son = null, tepki = 0, degisim = 0;
    var diger = function (k) { return k === 'A' ? 'B' : 'A'; };
    adimlar.forEach(function (a, i) {
      var b = (a.h || a.w || [])[0] || {}, c = ' ' + String(b.c || '') + ' ', html = String(b.html != null ? b.html : (b.t || '')), on = null, k;
      var onceki = adimlar[i - 1], oncekiSoru = !!(onceki && /\?\s*$/.test(onceki.s || ''));
      if (a.grafik && a.grafik.asama > 0 && son) k = son;
      else if (a.sil || / title /.test(c) || / label /.test(c)) k = 'A';
      else if (/ qd /.test(c) && son) k = son;
      else if (oncekiSoru) k = diger(son || 'A');
      else if (/ q /.test(c)) {
        k = diger(son || 'A');
        on = /kural/i.test(html) ? 'Burada bir kural var, iyi aklında tut.' : /tuzak|dikkat/i.test(html) ? 'Dikkat, burada sık yapılan bir hata var.' : /günlük hayat/i.test(html) ? 'Bunu günlük hayatla bağlayalım.' : null;
      } else {
        k = diger(son || 'B'); degisim++;
        if (degisim % 4 === 0 && !(a.w && !a.w.length) && (a.s || '').length > 40) on = TEPKILER[tepki++ % TEPKILER.length];
      }
      plan.push({ kim: k, on: on });
      son = k;
    });
    return plan;
  }

  /* ================= kayıt deposu (tarayıcıda) ve yayımlanmış kayıtlar ================= */
  var Kayitlar = {
    db: null,
    ac: function () {
      var self = this;
      if (this.db) return Promise.resolve(this.db);
      return new Promise(function (res, rej) {
        try {
          var r = indexedDB.open('sesliDers', 1);
          r.onupgradeneeded = function () { r.result.createObjectStore('kayit'); };
          r.onsuccess = function () { self.db = r.result; res(self.db); };
          r.onerror = function () { rej(r.error); };
        } catch (e) { rej(e); }
      });
    },
    islem: function (mod, fn) {
      return this.ac().then(function (db) {
        return new Promise(function (res, rej) {
          var tx = db.transaction('kayit', mod), st = tx.objectStore('kayit'), sonuc, r = fn(st);
          if (r) r.onsuccess = function () { sonuc = r.result; };
          tx.oncomplete = function () { res(sonuc); };
          tx.onerror = function () { rej(tx.error); };
        });
      });
    },
    al: function (k) { return this.islem('readonly', function (st) { return st.get(k); }).catch(function () { return null; }); },
    koy: function (k, v) { return this.islem('readwrite', function (st) { return st.put(v, k); }); },
    sil: function (k) { return this.islem('readwrite', function (st) { return st.delete(k); }).catch(function () {}); }
  };
  var Yayin = {
    harita: {}, soz: null,
    yukle: function (taban) {
      var self = this;
      if (this.soz) return this.soz;
      if (window.SESLI_DERS_BULUT) Bulut.adres = window.SESLI_DERS_BULUT;
      if (!window.fetch || /^(file|blob|data):/.test(location.protocol)) return (this.soz = Promise.resolve());
      var bulutSoz = Bulut.adres ? Promise.resolve() : fetch(taban + 'bulut.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (j && typeof j.adres === 'string' && /^https:\/\//.test(j.adres)) Bulut.adres = j.adres;
          if (j && j.ogrenci && !depo.al('ogrSesler', null)) Izin.koy(j.ogrenci);
        }).catch(function () {});
      var listeSoz = fetch(taban + 'liste.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('liste yok'); return r.json(); })
        .then(function (l) {
          var adlar = Array.isArray(l) ? l : (l.paketler || []);
          return Promise.all(adlar.map(function (ad) { return fetch(taban + ad).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }));
        })
        .then(function (paketler) { (paketler || []).forEach(function (p) { if (p && p.kayitlar) Object.keys(p.kayitlar).forEach(function (h) { self.harita[h] = p.kayitlar[h]; }); }); })
        .catch(function () {});
      this.soz = Promise.all([listeSoz, bulutSoz.then(function () { return Izin.yukle(); })]);
      return this.soz;
    },
    al: function (h) { return this.harita[h] || null; },
    var: function () { for (var k in this.harita) if (this.harita.hasOwnProperty(k)) return true; return false; }
  };

  /* ================= kimya: formül tanıma, yazım ve okunuş ================= */
  var SEMBOL_SET = {};
  ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu')
    .split(' ').forEach(function (s) { SEMBOL_SET[s] = 1; });
  var KATYON = { H: 'hidrojen', Li: 'lityum', Na: 'sodyum', K: 'potasyum', Rb: 'rubidyum', Cs: 'sezyum', Ag: 'gümüş', NH4: 'amonyum', Mg: 'magnezyum', Ca: 'kalsiyum', Sr: 'stronsiyum', Ba: 'baryum', Zn: 'çinko', Al: 'alüminyum', Pb: 'kurşun', Cu: 'bakır', Fe: 'demir', Hg: 'cıva', Sn: 'kalay', Mn: 'mangan', Ni: 'nikel', Co: 'kobalt', Cr: 'krom', Cd: 'kadmiyum', Au: 'altın', Pt: 'platin', Be: 'berilyum' };
  var DEGISKEN = { Pb: 1, Cu: 1, Fe: 1, Hg: 1, Sn: 1, Mn: 1, Ni: 1, Co: 1, Cr: 1, Au: 1 };
  var ANYON = { F: ['florür', 1], Cl: ['klorür', 1], Br: ['bromür', 1], I: ['iyodür', 1], O: ['oksit', 2], S: ['sülfür', 2], N: ['nitrür', 3], OH: ['hidroksit', 1], NO3: ['nitrat', 1], NO2: ['nitrit', 1], SO4: ['sülfat', 2], SO3: ['sülfit', 2], CO3: ['karbonat', 2], HCO3: ['bikarbonat', 1], PO4: ['fosfat', 3], CH3COO: ['asetat', 1], MnO4: ['permanganat', 1], Cr2O7: ['dikromat', 2], CrO4: ['kromat', 2], CN: ['siyanür', 1], ClO3: ['klorat', 1], HSO4: ['bisülfat', 1] };
  var MOLEKUL = { H2O: 'su', CO2: 'karbondioksit', CO: 'karbonmonoksit', NH3: 'amonyak', HCl: 'hidroklorik asit', HF: 'hidroflorik asit', HBr: 'hidrobromik asit', HI: 'hidrojen iyodür', I2: 'iyot', Br2: 'brom', F2: 'flor gazı', P4: 'fosfor', S8: 'kükürt', H2S: 'hidrojen sülfür', CS2: 'karbon disülfür', PCl5: 'fosfor pentaklorür', PCl3: 'fosfor triklorür', NOCl: 'nitrozil klorür', COCl2: 'fosgen', CaCO3: 'kalsiyum karbonat', CaO: 'kalsiyum oksit', N2O5: 'diazot pentoksit', N2O: 'diazot monoksit', C2H4: 'eten', C2H2: 'etin', C4H10: 'bütan', CH3OH: 'metanol', C12H22O11: 'sakkaroz', H2SO4: 'sülfürik asit', HNO3: 'nitrik asit', H3PO4: 'fosforik asit', H2CO3: 'karbonik asit', CH3COOH: 'asetik asit', CH4: 'metan', C2H6: 'etan', C3H8: 'propan', C2H5OH: 'etanol', C6H12O6: 'glikoz', O2: 'oksijen gazı', H2: 'hidrojen gazı', N2: 'azot gazı', Cl2: 'klor gazı', O3: 'ozon', H2O2: 'hidrojen peroksit', SO2: 'kükürt dioksit', SO3: 'kükürt trioksit', NO2: 'azot dioksit', NO: 'azot monoksit', N2O4: 'diazot tetroksit', NaOH: 'sodyum hidroksit', KOH: 'potasyum hidroksit' };
  var GAZ_ADI = { HCl: 'hidrojen klorür', HBr: 'hidrojen bromür', HF: 'hidrojen florür' };
  var SAYI = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi'];
  var HARF = { A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'fe', G: 'ge', H: 'ha', I: 'ı', J: 'je', K: 'ke', L: 'le', M: 'me', N: 'ne', O: 'o', P: 'pe', R: 're', S: 'se', T: 'te', U: 'u', V: 've', Y: 'ye', Z: 'ze', Q: 'kü', W: 've', X: 'iks' };
  var ROMA = { 'I': 'birinci', 'II': 'ikinci', 'III': 'üçüncü', 'IV': 'dördüncü', 'V': 'beşinci', 'VI': 'altıncı' };
  var ROMA_SAYI = { 'I': 'bir', 'II': 'iki', 'III': 'üç', 'IV': 'dört', 'V': 'beş', 'VI': 'altı' };
  var BIRIM = { 'kJ': 'kilojul', 'kJ/mol': 'kilojul bölü mol', 'J': 'jul', '°C': 'derece', 'atm': 'atmosfer', 'mL': 'mililitre', 'L': 'litre', 'g': 'gram', 'mg': 'miligram', 'kg': 'kilogram', 'mol/L': 'mol bölü litre', 'g/mol': 'gram bölü mol', 'M': 'molar', 'mmHg': 'milimetre cıva', 'cm³': 'santimetreküp', 'dm³': 'desimetreküp', 'cm3': 'santimetreküp', 'dm3': 'desimetreküp', 'm3': 'metreküp', 'cm2': 'santimetrekare', 's': 'saniye', 'dk': 'dakika', 'sa': 'saat', 'K': 'kelvin', 'pm': 'pikometre', 'nm': 'nanometre', 'cmHg': 'santimetre cıva', 'torr': 'tor', 'kPa': 'kilopaskal', 'Pa': 'paskal', 'mol/dk': 'mol bölü dakika', 'mol/s': 'mol bölü saniye', 'M/s': 'molar bölü saniye', 'M/dk': 'molar bölü dakika', 'g/dk': 'gram bölü dakika', 'g/s': 'gram bölü saniye', 'mol/L·s': 'mol bölü litre saniye', 'g/mL': 'gram bölü mililitre', 'g/L': 'gram bölü litre', 'g/cm3': 'gram bölü santimetreküp', 'J/g°C': 'jul bölü gram derece', 'kcal': 'kilokalori', 'cal': 'kalori', 'mol': 'mol', 'μm': 'mikrometre', 'mm': 'milimetre', 'cm': 'santimetre', 'm': 'metre', 'km': 'kilometre', 'ppm': 'pe pe me', 'eV': 'elektronvolt', 'u': 'atomik kütle birimi', 'akb': 'atomik kütle birimi' };

  function semboller(govde) {
    var g = govde.replace(/[()\d]/g, ''), out = [], re = /[A-Z][a-z]?/g, m, son = 0;
    while ((m = re.exec(g))) { if (m.index !== son || !SEMBOL_SET[m[0]]) return null; out.push(m[0]); son = re.lastIndex; }
    return son === g.length && out.length ? out : null;
  }
  function formulCoz(tok) {
    var m = tok.match(/^(\d*)([A-Z(][A-Za-z0-9()]*?)((?:\^\{?\d*[+\-−]\}?|[+\-−])?)((?:\((?:suda|k|s|g|aq)\))?)$/);
    if (!m) return null;
    var kat = m[1], govde = m[2], yukHam = m[3].replace(/[\^{}]/g, '').replace('-', '−'), hal = m[4];
    if (/^\(/.test(govde) && !/^\(NH4\)/.test(govde)) return null;
    if ((govde.match(/\(/g) || []).length !== (govde.match(/\)/g) || []).length) return null;
    var yuk = null;
    if (yukHam) {
      var isaret = yukHam.slice(-1), basamak = yukHam.slice(0, -1);
      if (!basamak) {
        var mm = govde.match(/^(.*?)(\d)$/);
        if (mm) {
          var aday = mm[1], n = +mm[2];
          if ((/^[A-Z][a-z]?$/.test(aday) && SEMBOL_SET[aday]) || (ANYON[aday] && ANYON[aday][1] === n && isaret === '−')) { govde = aday; basamak = String(n); }
        }
      }
      yuk = { n: basamak ? +basamak : 1, isaret: isaret, yazi: (basamak && basamak !== '1' ? basamak : '') + isaret };
    }
    var sm = semboller(govde);
    if (!sm) return null;
    if (!/\d/.test(govde) && !yuk && sm.length < 2 && !MOLEKUL[govde]) return null;
    return { kat: kat, govde: govde, yuk: yuk, hal: hal };
  }
  function formulHTML(f) {
    return (f.kat || '') + f.govde.replace(/(\d+)/g, '<sub>$1</sub>') + (f.yuk ? '<sup>' + f.yuk.yazi + '</sup>' : '') + (f.hal || '');
  }
  function harfle(govde) {
    return govde.replace(/[()]/g, ' ').replace(/([A-Z])([a-z]?)/g, function (m, a, b) { return ' ' + HARF[a] + (b ? ' ' + (HARF[b.toUpperCase()] || b) : '') + ' '; })
      .replace(/(\d+)/g, ' $1 ').replace(/\s+/g, ' ').trim();
  }
  function tuzAdi(govde) {
    var m = govde.match(/^(\(NH4\)(\d*)|NH4|[A-Z][a-z]?)(\d*)(.+)$/);
    if (!m) return null;
    var kat = m[1], katSay = +(m[3] || 1), geri = m[4], an = null, anSay = 1, mm;
    if (/^\(NH4\)/.test(kat)) { katSay = +(m[2] || 1); kat = 'NH4'; }
    if (!KATYON[kat]) return null;
    if (ANYON[geri]) an = geri;
    else if ((mm = geri.match(/^\(([^)]+)\)(\d*)$/)) && ANYON[mm[1]]) { an = mm[1]; anSay = +(mm[2] || 1); }
    else if ((mm = geri.match(/^([A-Z][a-z]?)(\d*)$/)) && ANYON[mm[1]]) { an = mm[1]; anSay = +(mm[2] || 1); }
    if (!an) return null;
    var ad = KATYON[kat];
    if (DEGISKEN[kat]) { var yb = ANYON[an][1] * anSay / katSay; if (yb % 1 === 0 && SAYI[yb]) ad += ' ' + SAYI[yb]; }
    return ad + ' ' + ANYON[an][0];
  }
  function formulOku(f) {
    var ad;
    if (f.yuk) ad = KATYON[f.govde] && f.yuk.isaret === '+' ? KATYON[f.govde] + (DEGISKEN[f.govde] && SAYI[f.yuk.n] ? ' ' + SAYI[f.yuk.n] : '') + ' iyonu' : ANYON[f.govde] && f.yuk.isaret === '−' ? ANYON[f.govde][0] + ' iyonu' : harfle(f.govde) + ' iyonu';
    else if (f.hal === '(g)' && GAZ_ADI[f.govde]) ad = GAZ_ADI[f.govde];
    else ad = MOLEKUL[f.govde] || tuzAdi(f.govde) || harfle(f.govde);
    var hal = { '(suda)': ' suda', '(aq)': ' suda', '(k)': ' katı', '(s)': ' sıvı', '(g)': ' gaz' }[f.hal] || '';
    return (f.kat ? f.kat + ' ' : '') + ad + hal;
  }
  function sozcukAyir(tok) {
    var m = tok.match(/^(["“'«(]*)(.*?)([.,;:!?"”»]*)$/), on = m[1], ic = m[2], son = m[3], ek = '';
    if (on.indexOf('(') >= 0 && !/\)/.test(ic)) { /* "(NaCl" gibi */ } else if (on.indexOf('(') >= 0) { ic = on.slice(on.indexOf('(')) + ic; on = on.slice(0, on.indexOf('(')); }
    var k = ic.match(/^(.*?)['’]([a-zçğıöşü]+)$/i);
    if (k) { ic = k[1]; ek = k[2]; }
    return { on: on, ic: ic, ek: ek, son: son };
  }
  // Seslendirme metni: formülleri adlarıyla, okları ve simgeleri sözle
  var ELEMENT_AD = { H: 'hidrojen', He: 'helyum', Li: 'lityum', Be: 'berilyum', B: 'bor', C: 'karbon', N: 'azot', O: 'oksijen', F: 'flor', Ne: 'neon', Na: 'sodyum', Mg: 'magnezyum', Al: 'alüminyum', Si: 'silisyum', P: 'fosfor', S: 'kükürt', Cl: 'klor', Ar: 'argon', K: 'potasyum', Ca: 'kalsiyum', Sc: 'skandiyum', Ti: 'titanyum', V: 'vanadyum', Cr: 'krom', Mn: 'mangan', Fe: 'demir', Co: 'kobalt', Ni: 'nikel', Cu: 'bakır', Zn: 'çinko', Ga: 'galyum', Ge: 'germanyum', As: 'arsenik', Se: 'selenyum', Br: 'brom', Kr: 'kripton', Rb: 'rubidyum', Sr: 'stronsiyum', Ag: 'gümüş', Cd: 'kadmiyum', Sn: 'kalay', Sb: 'antimon', I: 'iyot', Xe: 'ksenon', Cs: 'sezyum', Ba: 'baryum', W: 'tungsten', Pt: 'platin', Au: 'altın', Hg: 'cıva', Pb: 'kurşun', Rn: 'radon', Ra: 'radyum', U: 'uranyum' };
  var KISALTMA = { Kc: 'ka ce', Kp: 'ka pe', Ka: 'ka a', Kb: 'ka be', Ksp: 'ka es pe', 'Kçç': 'ka çe çe', pH: 'pe ha', pOH: 'pe o ha', 'ΔH': 'delta ha', 'ΔH°': 'delta ha', 'Ea': 'e a', NK: 'normal koşullar', NA: 'en a', 'NŞA': 'normal şartlar altında', 'OK': 'oda koşulları' };
  var ALT_RAKAM = '₀₁₂₃₄₅₆₇₈₉', UST_RAKAM = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function rakamCevir(s, tablo) { return s.replace(/./g, function (c) { var k = tablo.indexOf(c); return k < 0 ? c : String(k); }); }
  var HARF_SINIF = 'A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû';
  var ON_SINIR = '(^|[^' + HARF_SINIF + '])';
  var ELEMENT_RE = Object.keys(ELEMENT_AD).sort(function (a, b) { return b.length - a.length; }).join('|');
  var RE_KUTLE = new RegExp(ON_SINIR + '(' + ELEMENT_RE + ')\\s*:\\s*(\\d+(?:,\\d+)?)', 'g');
  var RE_MOLKUTLE = new RegExp(ON_SINIR + '(' + ELEMENT_RE + ')\\s*=\\s*(\\d+(?:,\\d+)?)\\s*(g\\/mol)', 'g');
  // Tek harfli simgeler sorularda etiket olarak da kullanılır (B, C, K elementleri), bu yüzden yalnız iki harfliler ve H, N, O
  var RE_ATOMU = new RegExp(ON_SINIR + '(' + Object.keys(ELEMENT_AD).filter(function (k) { return k.length > 1 || /^[HNO]$/.test(k); }).join('|') + ')\\s+(atom|element|izotop|çekirde|metal)', 'g');
  // Seslendirme metni: formülleri adlarıyla, okları, birimleri ve simgeleri sözle
  function konusmaMetni(metin) {
    metin = String(metin).replace(/[   ]/g, ' ')
      // Unicode alt ve üst simgeler: N₂O₅ → N2O5, SO₄²⁻ → SO4^2−, 10²³ → 10 üzeri 23
      .replace(/([cdkm]?m)³/g, '$13').replace(/([cdkm]?m)²/g, '$12')
      .replace(/[₀-₉]+/g, function (m) { return rakamCevir(m, ALT_RAKAM); })
      .replace(/⁻([⁰-⁹¹²³]+)/g, function (m, r) { return ' üzeri eksi ' + rakamCevir(r, UST_RAKAM) + ' '; })
      .replace(/([⁰-⁹¹²³]*)([⁺⁻])/g, function (m, r, i) { return '^' + rakamCevir(r.replace(/¹/g, '1').replace(/²/g, '2').replace(/³/g, '3'), UST_RAKAM) + (i === '⁺' ? '+' : '−'); })
      .replace(/([⁰-⁹¹²³]+)/g, function (m) { return ' üzeri ' + rakamCevir(m.replace(/¹/g, '1').replace(/²/g, '2').replace(/³/g, '3'), UST_RAKAM) + ' '; })
      .replace(/([0-9])\s*[×x·]\s*10\s*\^\s*\{?([−-]?\d+)\}?/g, '$1 çarpı 10 üzeri $2')
      .replace(/(^|[^\d,])10\s*\^\s*\{?([−-]?\d+)\}?/g, '$110 üzeri $2 ')
      .replace(/\[([A-Za-z0-9()+\-−^]+)\]/g, ' $1 derişimi ')
      .replace(/(\d)\s*×\s*(?=\d)/g, '$1 çarpı ').replace(/(\d)·(?=\d)/g, '$1 çarpı ')
      .replace(/(\d|\))\s*÷\s*/g, '$1 bölü ').replace(/(\d|\))\s*\/\s*(?=[\d(])/g, '$1 bölü ')
      .replace(/=\s*(?:\.{3,}|…+)/g, '= kaç ').replace(/(?:\.{4,}|…{2,}|_{3,})/g, ' boşluk ')
      .replace(/(\d)\s*°\s*C\b/g, '$1 derece').replace(/(\d)\s*°/g, '$1 derece')
      .replace(/(\d+)\s*[-–]\s*(\d+)\s*(saniye|dakika|s|dk|sa)\b/g, '$1 ile $2 $3')
      .replace(/%\s*(\d+(?:[.,]\d+)?)/g, 'yüzde $1').replace(/[✔✓]/g, ' doğru ').replace(/[✘✗]/g, ' yanlış ')
      .replace(/≈/g, ' yaklaşık ').replace(/≤/g, ' küçük eşit ').replace(/≥/g, ' büyük eşit ').replace(/√/g, ' karekök ')
      .replace(RE_KUTLE, function (m, on, sym, n) { return sym === 'I' || sym === 'V' ? m : on + ELEMENT_AD[sym] + ' ' + n; })
      .replace(RE_MOLKUTLE, function (m, on, sym, n, b) { return on + ELEMENT_AD[sym] + ' ' + n + ' ' + b; })
      .replace(RE_ATOMU, function (m, on, sym, ek) { return on + ELEMENT_AD[sym] + ' ' + ek; });
    var toks = metin.split(/\s+/).filter(Boolean);
    var onceFormul = false;
    var okunus = toks.map(function (tok, i) {
      var sembolOnu = /^(sembol|işaret|ok)/i.test(toks[i + 1] || '');
      if (tok === '→' || tok === '->' || tok === '⟶') { var r = sembolOnu ? 'tek yönlü ok' : onceFormul ? 'verir,' : 'yani'; onceFormul = false; return { s: r }; }
      if (tok === '⇌' || tok === '<=>' || tok === '⇄') { onceFormul = false; return { s: sembolOnu ? 'çift yönlü ok' : 'dengede,' }; }
      if (tok === '+') return { s: 'artı' };
      if (tok === '=') return { s: 'eşittir' };
      if (tok === '·' || tok === '•' || tok === '|') return { s: ',' };
      if (tok === '×') return { s: 'çarpı' };
      if (tok === '÷' || tok === '/') return { s: 'bölü' };
      if (tok === '<') return { s: 'küçüktür' };
      if (tok === '>') return { s: 'büyüktür' };
      if (tok === '−' || tok === '-' || tok === '–') return { s: i > 0 && /[\d)]$/.test(toks[i - 1]) ? 'eksi' : ',' };
      if (tok === '—') return { s: ',' };
      if (/^\d+A$/.test(tok)) { onceFormul = false; return { s: tok.replace('A', ' A') }; }
      var rm = tok.match(/^(I{1,3}|IV|V|VI)[.)]$/);
      if (rm) return { s: ROMA[rm[1]] + ',' };
      var ry = tok.match(/^(I{1,3}|IV|V|VI)([,.;:]?)$/);
      if (ry) {
        var onceki = (toks[i - 1] || '').replace(/[,.;:]$/, ''), sonraki = (toks[i + 1] || '').replace(/[,.;:]$/, '');
        var romaKomsu = i === 0 || /^[—–:-]$/.test(toks[i + 1] || '') || /^(I{1,3}|IV|V|VI)$/.test(onceki) || /^(I{1,3}|IV|V|VI)$/.test(sonraki) || /^(ve|ile|veya|yalnız|yalniz|ya|da|de)$/i.test(onceki) || /^(ve|ile|veya|ya|da|de)$/i.test(sonraki);
        var ikiOnce = (toks[i - 2] || '').replace(/[,.;:]$/, '');
        if (ry[1] === 'I' && /^(ve|ile|veya)$/i.test(onceki) && ELEMENT_AD[ikiOnce] && !/^(I{1,3}|IV|V|VI)$/.test(ikiOnce)) return { s: 'iyot' + ry[2] };
        if (ry[1].length > 1 || romaKomsu || /[,:;]/.test(ry[2])) return { s: ROMA_SAYI[ry[1]] + ry[2] };
      }
      var sk = tok.match(/^([A-E])\)$/); if (sk) return { s: sk[1] + ' şıkkı,' };
      var mk = tok.match(/^([a-hçğı])\)$/); if (mk) return { s: mk[1] + ',' };
      var p = sozcukAyir(tok);
      if (KISALTMA[p.ic]) return { s: p.on + KISALTMA[p.ic] + (p.ek ? ' ' + p.ek : '') + p.son };
      if (BIRIM[p.ic] && ((i > 0 && (/\d$/.test(toks[i - 1]) || /^kaç$/i.test(toks[i - 1]))) || (!p.ek && /^(atm|mmHg|cmHg|mL|kJ|kPa|torr|kcal|kJ\/mol|g\/mol|mol\/L)$/.test(p.ic)))) return { s: p.on + BIRIM[p.ic] + p.son };
      var f = p.ic && formulCoz(p.ic);
      if (!f) {
        onceFormul = /\)$/.test(p.ic) && /\((suda|k|s|g)\)$/.test(p.ic);
        var yaz = /^[A-ZÇĞİÖŞÜÂÎÛ]{4,}$/.test(p.ic) ? p.on + p.ic.toLocaleLowerCase('tr-TR') + (p.ek ? '’' + p.ek.toLocaleLowerCase('tr-TR') : '') + p.son : tok;
        return { s: yaz.replace(/−/g, ' eksi ').replace(/^-(\d)/, 'eksi $1'), bag: /^(ve|ile|veya|ya|da|de)$/i.test(tok) };
      }
      onceFormul = true;
      return { s: p.on + formulOku(f) + (p.ek ? ' ' + p.ek : '') + p.son, iyon: !!f.yuk };
    });
    for (var i = 0; i < okunus.length; i++) {
      if (!/^iyon/i.test(okunus[i].s)) continue;
      for (var j = i - 1; j >= 0 && (okunus[j].iyon || okunus[j].bag); j--) if (okunus[j].iyon) okunus[j].s = okunus[j].s.replace(' iyonu', '');
    }
    return okunus.map(function (o) { return o.s; }).join(' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,(\s*,)+/g, ',').replace(/^\s*,\s*/, '').replace(/\s+/g, ' ').trim();
  }
  function otomatikHTML(tok) {
    if (tok === '->') return '→';
    if (tok === '<=>') return '⇌';
    var p = sozcukAyir(tok), f = p.ic && formulCoz(p.ic);
    if (!f) return esc(tok);
    return esc(p.on) + formulHTML(f) + (p.ek ? '’' + esc(p.ek) : '') + esc(p.son);
  }
  function isaretHTML(tok) {
    var h = esc(tok).replace(/-&gt;/g, '→').replace(/&lt;=&gt;/g, '⇌');
    h = h.replace(/\*\*(.+?)\*\*/g, '<b class="vurgu">$1</b>');
    h = h.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([0-9])/g, '<sub>$1</sub>');
    h = h.replace(/\^\{([^}]*)\}/g, function (m, x) { return '<sup>' + x.replace(/-/g, '−') + '</sup>'; })
         .replace(/\^([0-9]*[+\-−])/g, function (m, x) { return '<sup>' + x.replace(/-/g, '−') + '</sup>'; });
    return h;
  }
  function sozcukler(metin) {
    metin = metin.replace(/\*\*(.+?)\*\*/g, function (m, ic) { return ic.split(' ').map(function (s) { return '**' + s + '**'; }).join(' '); });
    var out = [], re = /\[\[([\w-]+)\|([^\]]+)\]\]|(\S+)/g, m, son = 0;
    while ((m = re.exec(metin))) { out.push({ t: m[3] != null ? m[3] : m[2], k: m[1] || null, bitisik: out.length > 0 && m.index === son }); son = re.lastIndex; }
    return out;
  }
  // HTML parçasının okunuşu: üslü sayılar "üzeri", yükler formül okunuşuna bırakılır
  function htmlKonusma(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    Array.prototype.forEach.call(d.querySelectorAll('svg,table,img,canvas,style,script'), function (n) { n.remove(); });
    Array.prototype.forEach.call(d.querySelectorAll('sup'), function (s) {
      var t = s.textContent.replace(/\s+/g, ''), onceki = s.previousSibling && s.previousSibling.nodeType === 3 ? s.previousSibling.nodeValue : '';
      if (/^[−-]?\d+$/.test(t) && /\d\s*$/.test(onceki)) s.textContent = ' üzeri ' + t.replace(/[−-]/, 'eksi ') + ' ';
    });
    Array.prototype.forEach.call(d.querySelectorAll('br,li,p,div'), function (n) { n.insertAdjacentText('afterend', ' '); });
    return konusmaMetni(d.textContent.replace(/\s+/g, ' ').trim());
  }

  /* ================= hazır dersler ================= */
  var DERSLER = {
    konu: {
      baslik: 'Çökelme tepkimeleri', sekme: 'Konu anlatımı',
      adimlar: [
        { sil: 1, sahne: null, w: [{ c: 'title', t: 'Çökelme Tepkimeleri' }], s: 'Merhaba! Bu derste çökelme tepkimelerini, net iyon denklemini ve seyirci iyonları öğreneceğiz.' },
        { w: [{ t: 'İki tuz çözeltisi karıştırılınca iyonlar **eş değiştirir.**' }], s: 'İki tuz çözeltisini karıştırdığımızda, çözeltilerdeki iyonlar eş değiştirir.' },
        { w: [{ c: 'eq', t: 'AB(suda) + CD(suda) -> AD(k) + CB(suda)' }], s: 'Yani A B ile C D karıştırılınca, A D ve C B oluşur.' },
        { w: [{ t: 'Ürünlerden biri suda çözünmüyorsa katı olarak ayrılır. Bu katıya [[ck|**çökelek**]] denir.' }], halka: 'ck', s: 'Oluşan ürünlerden biri suda çözünmüyorsa katı olarak ayrılır. Bu katıya çökelek, bu olaya da çökelme tepkimesi denir.' },
        { sil: 1, sahne: 'agcl', w: [{ c: 'label', t: 'Deney' }, { t: 'AgNO_3(suda) + NaCl(suda)' }], s: 'Şimdi bir deney yapalım. Beherde gümüş nitrat çözeltisi, tüpte ise sodyum klorür çözeltisi var.' },
        { yap: 'dok', w: [], s: 'Sodyum klorür çözeltisini gümüş nitrat çözeltisine ekliyoruz.' },
        { yap: 'bulut', w: [{ c: 'note', t: 'Çözelti bulanıklaştı!' }], s: 'Bakın! Çözelti bulanıklaştı ve beyaz bir katı oluştu.' },
        { yap: 'cokel', w: [{ t: 'Dibe çöken beyaz katı: **AgCl(k)**' }], s: 'Bir süre bekleyince bu beyaz katı kabın dibine çöker. Bu katı gümüş klorürdür.' },
        { sil: 1, sahne: null, w: [{ c: 'label', t: '1) Moleküler denklem' }, { c: 'eq', t: 'AgNO_3(suda) + NaCl(suda) -> AgCl(k) + NaNO_3(suda)' }], s: 'Bu olayı üç denklemle yazabiliriz. Birincisi moleküler denklem. Burada maddeleri formül hâlinde yazarız.' },
        { w: [{ c: 'label', t: '2) İyonik denklem' }, { c: 'eq', t: 'Ag^+ + [[n1|NO_3^-]] + [[a1|Na^+]] + Cl^- -> AgCl(k) + [[a2|Na^+]] + [[n2|NO_3^-]]' }], s: 'İkincisi iyonik denklem. Suda çözünen maddeleri iyonlarına ayırarak yazarız. Gümüş klorür katı olduğu için ayrılmaz.' },
        { ciz: ['a1', 'a2', 'n1', 'n2'], w: [], s: 'Şimdi iki tarafta da aynen duran iyonları bulalım. Sodyum ve nitrat iyonları iki tarafta da var. Bunları siliyoruz.' },
        { w: [{ c: 'label', t: '3) Net iyon denklemi' }, { c: 'box', t: 'Ag^+(suda) + Cl^-(suda) -> AgCl(k)' }], s: 'Geriye net iyon denklemi kalır. Gümüş iyonu ile klorür iyonu birleşir ve katı gümüş klorür oluşur.' },
        { sil: 1, sahne: 'iyon', w: [{ c: 'label', t: 'Tanecik gözüyle' }], s: 'Şimdi aynı olaya tanecik gözüyle bakalım. Çözeltide gümüş, nitrat, sodyum ve klorür iyonları serbestçe dolaşıyor.' },
        { yap: 'esles', w: [{ t: 'Ag^+ + Cl^- -> AgCl(k)' }], s: 'Gümüş ve klorür iyonları karşılaştıkça birleşir ve katı gümüş klorür olarak dibe çöker.' },
        { yap: 'seyirci', w: [{ c: 'ok', t: 'Seyirci iyonlar: Na^+ ve NO_3^-' }], s: 'Sodyum ve nitrat iyonları ise tepkimeye girmez. Baştan sona çözeltide dolaşırlar. Bunlara seyirci iyon denir.' },
        { sil: 1, sahne: null, w: [{ c: 'note', t: 'Dikkat!' }, { t: 'Katı, sıvı ve gaz hâldeki maddeler iyonlarına ayrılmaz.' }], s: 'Birkaç noktaya dikkat edelim. Katı, sıvı ve gaz hâldeki maddeler, iyonik denklemde iyonlarına ayrılmaz.' },
        { w: [{ t: 'Net iyon denkleminde yük korunur: (+1) + (−1) = 0' }], s: 'Net iyon denkleminde yük de korunur. Solda artı bir ve eksi bir var, toplam sıfır. Sağdaki katının yükü de sıfır.' },
        { w: [{ t: 'Bütün ürünler çözünüyorsa tepkime **gerçekleşmez.**' }], s: 'Son olarak, bütün ürünler suda çözünüyorsa tepkime gerçekleşmez. Kapta yalnızca bir iyon karışımı vardır.' },
        { w: [{ c: 'ok', t: 'Sıra sende: Pb(NO_3)_2(suda) + KI(suda) -> ?' }], s: 'Şimdi sıra sende. Kurşun iki nitrat ile potasyum iyodür karıştırılırsa ne olur? Soru çözümü bölümünde birlikte bakalım.' }
      ]
    },
    soru: {
      baslik: 'Soru çözümü: Pb(NO₃)₂ + KI', sekme: 'Soru çözümü',
      adimlar: [
        { sil: 1, sahne: null, w: [{ c: 'label', t: 'Soru' }, { c: 'q', t: 'Pb(NO_3)_2 çözeltisi ile KI çözeltisi karıştırıldığında parlak sarı bir çökelek oluşuyor.' }], s: 'Soruyu okuyalım. Kurşun iki nitrat çözeltisi ile potasyum iyodür çözeltisi karıştırıldığında, parlak sarı bir çökelek oluşuyor.' },
        { w: [{ c: 'q', t: 'a) Moleküler denklemi yazıp denkleştirin. b) Net iyon denklemini yazın. c) Seyirci iyonları belirtin.' }], s: 'Bizden üç şey isteniyor. Moleküler denklemi yazıp denkleştirmemiz, net iyon denklemini yazmamız ve seyirci iyonları belirtmemiz.' },
        { sil: 1, sahne: 'pbi2', yap: 'dok', w: [{ c: 'label', t: 'Önce deneye bakalım' }], s: 'Önce deneye bakalım. Potasyum iyodür çözeltisini kurşun nitrat çözeltisine ekliyoruz.' },
        { yap: 'bulut', w: [{ c: 'note', t: 'Parlak sarı çökelek!' }], s: 'İşte parlak sarı çökelek! Bu katı kurşun iyodürdür.' },
        { sil: 1, sahne: null, w: [{ c: 'label', t: 'İyonlar eş değiştirir' }, { c: 'eq', t: 'Pb^{2+} ile I^- · K^+ ile NO_3^-' }], s: 'Çözümde ilk adım: iyonlar eş değiştirir. Kurşun iyonu iyodür ile, potasyum iyonu da nitrat ile eşleşir.' },
        { w: [{ t: 'PbI_2: çözünmez (Pb^{2+}, I^- için istisna)' }, { t: 'KNO_3: çözünür (K^+ 1A grubunda)' }], s: 'Çözünürlük kurallarına göre kurşun iyodür suda çözünmez, çünkü kurşun iyonu iyodür için bir istisnadır. Potasyum nitrat ise çözünür, çünkü potasyum bir A grubundadır.' },
        { sil: 1, w: [{ c: 'label', t: 'a) Moleküler denklem' }, { c: 'eq', t: 'Pb(NO_3)_2(suda) + **2**KI(suda) -> PbI_2(k) + **2**KNO_3(suda)' }], s: 'a şıkkı. Moleküler denklemi yazıp denkleştiriyoruz. Potasyum iyodürün ve potasyum nitratın önüne iki katsayısı gelir.' },
        { w: [{ c: 'label', t: 'İyonik denklem' }, { c: 'eq', t: 'Pb^{2+} + [[n1|2NO_3^-]] + [[k1|2K^+]] + 2I^- -> PbI_2(k) + [[k2|2K^+]] + [[n2|2NO_3^-]]' }], s: 'İyonik denklemde suda çözünenleri iyonlarına ayırıyoruz. Kurşun iyodür katı olduğu için ayrılmaz.' },
        { ciz: ['k1', 'k2', 'n1', 'n2'], w: [], s: 'İki tarafta da aynen duran potasyum ve nitrat iyonlarını siliyoruz.' },
        { w: [{ c: 'label', t: 'b) Net iyon denklemi' }, { c: 'box', t: 'Pb^{2+}(suda) + 2I^-(suda) -> PbI_2(k)' }], s: 'b şıkkı. Net iyon denklemi: kurşun iyonu ile iki iyodür iyonu birleşir ve katı kurşun iyodür oluşur.' },
        { w: [{ c: 'ok', t: 'c) Seyirci iyonlar: K^+ ve NO_3^-' }], s: 'c şıkkı. Seyirci iyonlar potasyum ve nitrat iyonlarıdır.' },
        { w: [{ c: 'note', t: 'Dikkat: I^- önündeki 2 sadeleşmez, PbI_2 formülünden gelir.' }], s: 'Dikkat! İyodürün önündeki iki katsayısı sadeleşmez, çünkü kurşun iyodürün formülünden gelir.' }
      ]
    }
  };
  var ORNEK_METIN = 'Soru: NaCl çözeltisi ile KNO3 çözeltisi karıştırılıyor. Bir öğrenci "NaNO3 ve KCl oluştu, tepkime gerçekleşti" diyor. Öğrenci haklı mıdır?\n' +
    'Olası ürünler NaNO3 ve KCl’dir.\nHer ikisinin de katyonu 1A grubunda olduğu için ikisi de suda çözünür.\n' +
    'Kapta katı, gaz ya da su oluşmaz; yalnızca Na+, Cl−, K+ ve NO3− iyonlarının karışımı vardır.\n' +
    'Bütün iyonlar seyirci olduğu için net iyon denklemi yazılamaz.\nÖğrenci haksızdır: tepkime gerçekleşmez.';

  // Ses kopyası için okuma metni (yaklaşık 4 dakika)
  var ORNEK_OKUMA = [
    'Merhaba, ben kimya öğretmeninizim. Bu kayıtta sesimi tanıtmak için birkaç paragraf okuyacağım. Her cümleyi her zamanki ders anlatır gibi, doğal bir sesle okuyorum.',
    'Kimya, maddenin yapısını, özelliklerini ve değişimini inceleyen bilim dalıdır. Sabah içtiğimiz çaydan akşam yaktığımız ışığa kadar her şeyde kimya vardır. Ekmeğin kabarması, demirin paslanması, yaprağın sararması birer kimyasal değişimdir.',
    'Şimdi bir deney düşünelim. Bir behere gümüş nitrat çözeltisi koyuyoruz. Üzerine birkaç damla sodyum klorür ekleyince ne olur? Çözelti bulanıklaşır ve beyaz bir katı oluşur. Bu katı gümüş klorürdür ve bir süre sonra kabın dibine çöker.',
    'Peki bu tepkimede hangi iyonlar seyirci kalır? Sodyum ve nitrat iyonları değişmeden çözeltide dolaşır. Bu yüzden onlara seyirci iyon deriz. Net iyon denklemi ise yalnızca gümüş ve klorür iyonlarını gösterir.',
    'Biraz da sayılarla çalışalım. Bir mol su on sekiz gramdır. Normal koşullarda bir mol gaz yirmi iki virgül dört litre hacim kaplar. Avogadro sayısı yaklaşık altı virgül sıfır iki çarpı on üzeri yirmi üçtür. Oda koşullarında saf suyun pH değeri yedidir.',
    'Dikkat! Bu cümleyi vurgulayarak okuyorum: Bir asit çözeltisinin pH değeri yediden büyük olamaz. Aynı şekilde bir baz çözeltisinin pH değeri yediden küçük olamaz.',
    'Bazen sakin anlatırım: Elektronlar, çekirdeğin çevresinde belirli enerji düzeylerinde bulunur. Atom numarası arttıkça elektron sayısı da artar. Bazen de heyecanla: İşte bu yüzden tepkime bu kadar hızlı gerçekleşiyor!',
    'Bir soru soralım: Sıcaklık artınca tepkime hızı neden artar? Çünkü taneciklerin ortalama kinetik enerjisi artar ve eşik enerjisini aşan çarpışmaların sayısı çoğalır. Katalizör ise aktivasyon enerjisini düşürerek tepkimeyi hızlandırır.',
    'Şimdi birbirine benzeyen sesleri içeren bir paragraf: Çiçekli bahçede güneşli bir öğleden sonra, ağır ağır yürüyen yaşlı bir adam, şişedeki üzüm suyunu içti. Çocuklar ışıl ışıl gözlerle, gökyüzündeki uçurtmalara bakıyordu. Öğretmenimiz, öğrencilerin sorularını tek tek yanıtladı.',
    'Periyodik tabloda hidrojen, helyum, lityum, berilyum, bor, karbon, azot, oksijen, flor ve neon ilk on elementtir. Sodyum klorür, kalsiyum karbonat, sülfürik asit ve amonyak sık karşılaştığımız maddelerdir.',
    'Ve son olarak: Bugünkü dersimiz burada bitti. Konuyu tekrar etmeyi, soruları kendi başınıza çözmeyi unutmayın. Sorularınızı bekliyorum. Hepinize kolay gelsin, görüşmek üzere.'
  ];

  /* ---- Metni tahta adımlarına böl: bir cümleden 2–3 sayfalık konuya kadar ----
     Her cümle bir adım olur. Başlık satırı yeni tahtada başlar, maddeler işaretiyle
     yazılır, çok uzun cümleler noktalı virgül, iki nokta, virgül ya da bağlaçtan
     bölünür. PDF'den kopyalanan metinde cümlenin ortasına düşen satır sonları birleşir.
     Tahta dolunca silinip yazmaya devam edilir (bkz. Oynatici.prototype.ekle). */
  var METIN_SINIR = 30000;   // eklenebilecek en uzun metin: yaklaşık 10 sayfa
  var PARCA_SINIR = 230;     // tahtaya tek adımda yazılacak en uzun parça
  var ozelSayac = 0;
  var MADDE_RE = /^(?:[-–—•*·▪●◦►✓✔]|\d{1,2}[.)]|[a-eA-E][)])\s+/;
  var KISALTMA_RE = /(?:^|[\s(])(?:vb|vs|vd|örn|ör|bkz|yy|sf|no|dr|prof|doç|yrd|av|bl)\.$/i;
  var CUMLE_SONU_RE = /[.!?…:;]["”»’)\]]*$/;
  function binlik(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function cumlelereAyir(s) {
    var out = [], bas = 0, re = /[.!?…]+["”»’)\]]*(?=\s+["“«(\[]?[A-ZÇĞİÖŞÜ0-9])/g, m, p;
    while ((m = re.exec(s))) {
      p = s.slice(bas, m.index + m[0].length);
      // kısaltma (vb., örn.), baş harf (M.) ya da madde numarası (1.) cümleyi bitirmez
      if (m[0] === '.' && (KISALTMA_RE.test(p) || /(?:^|\s)[A-ZÇĞİÖŞÜ]\.$/.test(p) || /^\s*\d{1,2}\.$/.test(p))) continue;
      if (p.trim()) out.push(p.trim());
      bas = m.index + m[0].length;
    }
    if (s.slice(bas).trim()) out.push(s.slice(bas).trim());
    return out;
  }
  function uzunuBol(c) {
    if (c.length <= PARCA_SINIR) return [c];
    var ayraclar = [/;\s+/g, /:\s+/g, /,\s+/g, /\s(?=(?:ve|veya|ya da|ancak|fakat|ama|çünkü|yani|bu nedenle|bu yüzden|böylece)\s)/g];
    for (var k = 0; k < ayraclar.length; k++) {
      var re = ayraclar[k], m, en = -1, fark = Infinity, kes;
      while ((m = re.exec(c))) {
        kes = k < 3 ? m.index + 1 : m.index; // noktalama önceki parçada kalır, bağlaç sonrakine geçer
        if (kes >= 40 && c.length - kes >= 40 && Math.abs(kes - c.length / 2) < fark) { fark = Math.abs(kes - c.length / 2); en = kes; }
      }
      if (en > 0) return uzunuBol(c.slice(0, en).trim()).concat(uzunuBol(c.slice(en).trim()));
    }
    var b = c.lastIndexOf(' ', Math.floor(c.length / 2));
    return b > 20 ? uzunuBol(c.slice(0, b)).concat(uzunuBol(c.slice(b + 1))) : [c];
  }
  function metniBol(metin) {
    var B = [];
    String(metin || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (ham) {
      var s = ham.replace(/[\t  ]+/g, ' ').trim(), son = B[B.length - 1];
      if (!s) { if (son && son.tur !== 'bos') B.push({ tur: 'bos' }); return; }
      var madde = MADDE_RE.exec(s), kucuk = /^[a-zçğıöşü(]/.test(s);
      // satır sonu cümlenin ortasına düşmüşse alt satır üsttekine eklenir
      var devam = son && son.tur !== 'bos' && !madde && (son.tur === 'metin' ? !CUMLE_SONU_RE.test(son.t) : kucuk && (son.tur === 'baslik' || !CUMLE_SONU_RE.test(son.t)));
      if (devam) {
        son.t = /[-‐]$/.test(son.t) && kucuk ? son.t.replace(/[-‐]$/, '') + s : son.t + ' ' + s;
        if (son.tur === 'baslik') son.tur = 'metin';
        return;
      }
      if (madde) { B.push({ tur: 'madde', t: s.slice(madde[0].length), isaret: /^[\da-eA-E]/.test(madde[0]) ? madde[0].trim() : '•' }); return; }
      var baslik = s.length <= 70 && s.split(' ').length <= 9 && !kucuk && !/[.!?;:,…]["”»’)\]]*$/.test(s) && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s);
      B.push({ tur: baslik ? 'baslik' : 'metin', t: s });
    });
    for (var i = B.length - 1; i >= 0; i--) if (B[i].tur !== 'bos') { if (B[i].tur === 'baslik') B[i].tur = 'metin'; break; } // en sondaki kısa satır başlık değildir
    var out = [];
    B.forEach(function (b) {
      if (b.tur === 'bos') return;
      if (b.tur === 'baslik') { out.push({ tur: 'baslik', t: b.t }); return; }
      var parca = [];
      cumlelereAyir(b.t).forEach(function (c) { parca.push.apply(parca, uzunuBol(c)); });
      parca.forEach(function (c, k) { out.push({ tur: b.tur, t: b.tur === 'madde' && k === 0 ? b.isaret + ' ' + c : c, s: c }); });
    });
    return out;
  }
  // Parçalardan tahta adımları. o.grup: eklenen metnin kimliği, o.sinif(p, i, hepsi): yazı sınıfı
  function metinAdimlari(parcalar, o) {
    o = o || {};
    return parcalar.map(function (p, i) {
      var soz = p.tur === 'baslik' && !/[.!?…]$/.test(p.t) ? p.t + '.' : (p.s || p.t);
      var a = { oto: 1, w: [{ c: p.tur === 'baslik' ? 'title' : (o.sinif ? o.sinif(p, i, parcalar) : ''), t: p.t }], s: konusmaMetni(soz) };
      if (p.tur === 'baslik' && i > 0) a.sil = 1;
      if (o.grup) a.ozel = o.grup;
      return a;
    });
  }
  function metinOzeti(metin) {
    var t = String(metin || '').trim();
    if (!t) return 'En çok ' + binlik(METIN_SINIR) + ' karakter (yaklaşık 10 sayfa) ekleyebilirsin.';
    var n = metniBol(t).length;
    return binlik(t.length) + ' / ' + binlik(METIN_SINIR) + ' karakter · ' + n + ' adım · yaklaşık ' + Math.max(1, Math.round(t.length / 800)) + ' dakika';
  }
  // Metinden ders: her cümle bir adım
  function metindenDers(metin, baslik) {
    var parcalar = metniBol(metin), kisa = parcalar.length <= 12;
    var ilkBaslik = parcalar.length && parcalar[0].tur === 'baslik' ? parcalar[0].t : null;
    var adimlar = metinAdimlari(parcalar, { sinif: function (p, i, hepsi) { return /^soru\b/i.test(p.t) ? 'q' : (kisa && i === hepsi.length - 1 ? 'ok' : ''); } });
    if (!ilkBaslik) adimlar.unshift({ w: [{ c: 'title', t: 'Birlikte çözelim' }], s: 'Bu metni birlikte tahtada inceleyelim.' });
    adimlar[0].sil = 1; adimlar[0].sahne = null;
    return { id: 'metin', baslik: baslik || ilkBaslik || 'Kendi metnin', adimlar: adimlar };
  }
  // HTML parçalarından ders (kimyamed soru kartı, Ronya çözüm kartı)
  function gorselsizMetin(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    Array.prototype.forEach.call(d.querySelectorAll('svg,table,img,canvas,style,script'), function (n) { n.remove(); });
    return d.textContent.replace(/\s+/g, ' ').trim();
  }
  // Bir kutunun içeriğini tahta satırlarına böl: <br>, paragraf, liste maddesi ve tablo ayrı satır olur
  function satirlaraBol(kok) {
    var satirlar = [], cur = '';
    var bitir = function () { if (cur.replace(/<[^>]*>|&nbsp;|\s/g, '').length || /<(svg|img|table)/i.test(cur)) satirlar.push(cur.trim()); cur = ''; };
    Array.prototype.forEach.call(kok.childNodes, function (n) {
      if (n.nodeType === 3) { cur += esc(n.nodeValue); return; }
      if (n.nodeType !== 1) return;
      var t = n.tagName;
      if (t === 'BR') { bitir(); return; }
      if (t === 'SCRIPT' || t === 'STYLE' || t === 'BUTTON' || (n.classList && n.classList.contains('sd-anlat'))) return;
      if (t === 'CANVAS') { bitir(); try { if (n.width && n.height) satirlar.push('<img src="' + n.toDataURL('image/png') + '" alt="">'); } catch (e) {} return; }
      if (t === 'UL' || t === 'OL') { bitir(); Array.prototype.forEach.call(n.children, function (li) { satirlar.push.apply(satirlar, satirlaraBol(li).length > 1 ? satirlaraBol(li) : [li.innerHTML.trim()]); }); return; }
      if (t === 'TABLE' || t === 'SVG' || t === 'svg' || t === 'IMG') { bitir(); satirlar.push(n.outerHTML); return; }
      if (/^(DIV|P|LI|SECTION|FIGURE|BLOCKQUOTE|H[1-6]|HEADER|FOOTER|ARTICLE|DETAILS)$/.test(t)) {
        bitir();
        if (n.querySelector('br,div,p,ul,ol,table,canvas,li')) satirlar.push.apply(satirlar, satirlaraBol(n));
        else if (n.textContent.replace(/\s+/g, '').length || n.querySelector('svg,img')) satirlar.push(n.innerHTML.trim());
        return;
      }
      cur += n.outerHTML;
    });
    bitir();
    return satirlar;
  }
  function parcalardanDers(o) {
    var adimlar = [], baslik = o.baslik || 'Soru', notIcinde = false;
    adimlar.push({ sil: 1, sahne: null, w: [{ c: 'label', t: baslik }], s: baslik + '. Önce soruyu okuyalım.' });
    var ekle = function (html, tur) { // tur: q = soru notu, c = çözüm satırı, ok = cevap
      var tmp = document.createElement('div'); tmp.innerHTML = html;
      var gorsel = tmp.querySelector('svg,table,img'), yazi = gorselsizMetin(html);
      if (!yazi && !gorsel) return;
      var s = yazi ? htmlKonusma(html) : (tmp.querySelector('table') ? 'Tabloya bakalım.' : 'Şekle bakalım.');
      if (!s) s = 'Şekle bakalım.';
      var sinif = tur === 'q' ? (notIcinde ? 'qd' : 'q') : tur === 'ok' ? 'ok' : '';
      var gg = gorsel && gorsel.tagName.toLowerCase() === 'svg' ? grafikAdimlari(html, sinif, yazi ? htmlKonusma(html) : '') : null;
      if (gg) adimlar.push.apply(adimlar, gg); else adimlar.push({ h: [{ c: sinif, html: html }], s: s });
      notIcinde = tur === 'q';
    };
    (o.soru || []).forEach(function (h) { ekle(h, 'q'); });
    (o.siklar || []).forEach(function (h) { ekle(h, 'q'); });
    notIcinde = false;
    var cozumBas = adimlar.length;
    if ((o.cozum || []).length || o.cevap) {
      adimlar.push({ w: [{ c: 'label', t: 'Çözüm' }], s: 'Şimdi çözüme geçelim.' });
      (o.cozum || []).forEach(function (h) { ekle(h, 'c'); });
      if (o.cevap) ekle('<b>Cevap:</b> ' + o.cevap, 'ok');
    }
    grupla(adimlar, 0, cozumBas, adimlar.length);
    return { id: o.id || ('d' + ozet(baslik + (o.soru || []).join(''))), baslik: baslik, adimlar: adimlar };
  }
  // kimyamed .soru kartı
  function sorudanDers(soru) {
    var no = soru.querySelector('.numara'), govde = soru.querySelector('.govde') || soru, o = { soru: [], cozum: [] };
    o.baslik = no ? no.textContent.trim().replace(/^SORU/, 'Soru') : 'Soru';
    Array.prototype.forEach.call(govde.children, function (c) {
      if (c.matches('details') || c.matches('.sd-anlat')) return;
      if (c.matches('ul,ol')) { Array.prototype.forEach.call(c.children, function (li) { o.soru.push(li.innerHTML); }); return; }
      o.soru.push(c.outerHTML);
    });
    var d = govde.querySelector('details.cozum');
    if (d) {
      Array.prototype.forEach.call(d.children, function (c) {
        if (c.matches('summary,.cevap')) return;
        if (c.matches('ol,ul')) Array.prototype.forEach.call(c.children, function (li) { o.cozum.push(li.innerHTML); });
        else o.cozum.push(c.outerHTML);
      });
      var cv = d.querySelector('.cevap'); if (cv) o.cevap = cv.innerHTML;
    }
    o.id = 'km-' + ozet((location.pathname || '') + o.baslik + (o.soru[0] || ''));
    return parcalardanDers(o);
  }
  // Ronya: molToggle ile açılan çözüm kutuları
  function ronyaDers(el, hedef) {
    var soru = [], baslik = '';
    if (el.contains(hedef)) {
      Array.prototype.forEach.call(el.children, function (c) { if (c !== hedef && !c.classList.contains('sd-anlat')) soru.push.apply(soru, satirlaraBol(c).length ? satirlaraBol(c) : []); });
      if (!soru.length) soru.push.apply(soru, satirlaraBol(el).filter(function (h) { return h.indexOf('sd-anlat') < 0; }));
    } else {
      var onceki = [], n = el.previousElementSibling;
      while (n) { onceki.unshift(n); n = n.previousElementSibling; }
      onceki.forEach(function (c, i) {
        if (c.classList.contains('sd-anlat')) return;
        var t = c.textContent.replace(/\s+/g, ' ').trim();
        if (i === 0 && onceki.length > 1 && t.length < 40 && !c.querySelector('canvas,svg,table,img')) { var m = t.match(/^(\d+)/); baslik = m ? 'Soru ' + m[1] : ''; return; }
        var parca = c.tagName === 'CANVAS' ? satirlaraBol({ childNodes: [c] }) : satirlaraBol(c);
        if (!parca.length && t) parca = [c.innerHTML];
        soru.push.apply(soru, parca);
      });
    }
    if (soru.length) {
      var m = gorselsizMetin(soru[0]).match(/^(\d+)\s*[.)]\s*/);
      if (m) { if (!baslik) baslik = 'Soru ' + m[1]; soru[0] = soru[0].replace(/^((?:\s|<[^>]+>)*)\d+\s*[.)]\s*/, '$1'); }
    }
    var cozum = satirlaraBol(hedef);
    return parcalardanDers({ id: 'ry-' + ozet(soru.join('|') + cozum.join('|')), baslik: baslik || 'Soru', soru: soru, cozum: cozum });
  }
  /* ================= grafikler: eksen, eğri ve yazıları tanı; tahtada adım adım çizerek anlat =================
     Konu anlatımındaki ve sorulardaki eksenli SVG grafikler tanınır: eksen çiftleri (dikey + yatay, ortak başlangıç),
     eksen adları, eğriler (renge göre), kesikli kılavuz çizgileri, eğri adları. Her öğeye çizim aşaması yazılır
     (data-ga: aşama, data-gs: sıra, data-gt: c = çizilerek, f = belirerek); ders adımları bu aşamalarla kurulur:
     önce eksenler, sonra her eğri, en son kılavuzlar ve notlar. Kalem çizilen yerin ucunu izler. */
  var grafikSayac = 0;
  function gRenk(s) { // 'rgb(1, 2, 3)' → [1,2,3] ya da null
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(s || '');
    if (!m || (m[4] != null && +m[4] === 0)) return null;
    return [+m[1], +m[2], +m[3]];
  }
  function gRenkFark(a, b) { return !a || !b ? 999 : Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); }
  function gRenkAdi(c) {
    if (!c) return '';
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0;
    var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (s < 0.18 || d < 0.08) return l < 0.3 ? 'siyah' : 'gri';
    if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    if (h < 14 || h >= 340) return 'kırmızı';
    if (h < 42) return l < 0.32 ? 'kahverengi' : 'turuncu';
    if (h < 68) return 'sarı';
    if (h < 165) return 'yeşil';
    if (h < 195) return 'camgöbeği';
    if (h < 255) return l < 0.26 ? 'lacivert' : 'mavi';
    if (h < 295) return 'mor';
    return 'pembe';
  }
  function gMatris(kok, el) { try { var a = kok.getScreenCTM(), b = el.getScreenCTM(); if (a && b) return a.inverse().multiply(b); } catch (e) {} return null; }
  function gNokta(m, x, y) { return m ? [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f] : [x, y]; }
  function gKoseler(el) { // düz çizgilerden oluşan öğenin köşeleri (yerel koordinat) ya da null
    var t = el.tagName.toLowerCase(), A = function (n) { return parseFloat(el.getAttribute(n)) || 0; };
    if (t === 'line') return [[A('x1'), A('y1')], [A('x2'), A('y2')]];
    if (t === 'polyline' || t === 'polygon') {
      var s = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(parseFloat), k = [];
      for (var i = 0; i + 1 < s.length; i += 2) k.push([s[i], s[i + 1]]);
      if (t === 'polygon' && k.length) k.push(k[0]);
      return k.length >= 2 ? k : null;
    }
    if (t === 'path') {
      var d = el.getAttribute('d') || '';
      if (/[CcSsQqTtAa]/.test(d)) return null;
      var re = /([MmLlHhVvZz])([^MmLlHhVvZz]*)/g, mm, x = 0, y = 0, x0 = 0, y0 = 0, out = [];
      while ((mm = re.exec(d))) {
        var c = mm[1], n = mm[2].trim() ? mm[2].trim().split(/[\s,]+|(?=-)/).map(parseFloat) : [], j;
        if (c === 'Z' || c === 'z') { x = x0; y = y0; out.push([x, y]); continue; }
        for (j = 0; j < n.length;) {
          if (c === 'M' || c === 'L') { x = n[j]; y = n[j + 1]; j += 2; }
          else if (c === 'm' || c === 'l') { x += n[j]; y += n[j + 1]; j += 2; }
          else if (c === 'H') { x = n[j]; j++; } else if (c === 'h') { x += n[j]; j++; }
          else if (c === 'V') { y = n[j]; j++; } else if (c === 'v') { y += n[j]; j++; }
          else break;
          if (c === 'M' || c === 'm') { x0 = x; y0 = y; }
          out.push([x, y]);
        }
      }
      return out.length >= 2 ? out : null;
    }
    return null;
  }
  // Yol düğümleri: düz parçaların uçları (duz = 1) ve eğri parçalarda ara noktalar; yay (A) varsa null
  function gYolDugum(d) {
    if (!d || /[Aa]/.test(d)) return null;
    var re = /([MmLlHhVvCcSsQqTtZz])([^MmLlHhVvCcSsQqTtZz]*)/g, mm, x = 0, y = 0, x0 = 0, y0 = 0, kx = 0, ky = 0, out = [], onc = '';
    var bez = function (pts) { // pts: [x0,y0, x1,y1, x2,y2, (x3,y3)] → 8 ara nokta
      for (var k = 1; k <= 8; k++) {
        var t = k / 8, u = 1 - t, X, Y;
        if (pts.length === 8) { X = u * u * u * pts[0] + 3 * u * u * t * pts[2] + 3 * u * t * t * pts[4] + t * t * t * pts[6]; Y = u * u * u * pts[1] + 3 * u * u * t * pts[3] + 3 * u * t * t * pts[5] + t * t * t * pts[7]; }
        else { X = u * u * pts[0] + 2 * u * t * pts[2] + t * t * pts[4]; Y = u * u * pts[1] + 2 * u * t * pts[3] + t * t * pts[5]; }
        out.push([X, Y, 0]);
      }
    };
    while ((mm = re.exec(d))) {
      var c = mm[1], n = mm[2].trim() ? mm[2].trim().replace(/(\d)-/g, '$1 -').split(/[\s,]+/).map(parseFloat) : [], j = 0, r = c === c.toLowerCase();
      if (c === 'Z' || c === 'z') { x = x0; y = y0; out.push([x, y, 1]); onc = c; continue; }
      do {
        var bx = r ? x : 0, by = r ? y : 0;
        switch (c.toUpperCase()) {
          case 'M': x = bx + n[j]; y = by + n[j + 1]; j += 2; x0 = x; y0 = y; out.push([x, y, 1]); c = r ? 'l' : 'L'; break;
          case 'L': x = bx + n[j]; y = by + n[j + 1]; j += 2; out.push([x, y, 1]); break;
          case 'H': x = bx + n[j]; j++; out.push([x, y, 1]); break;
          case 'V': y = (r ? y : 0) + n[j]; j++; out.push([x, y, 1]); break;
          case 'C': bez([x, y, bx + n[j], by + n[j + 1], kx = bx + n[j + 2], ky = by + n[j + 3], bx + n[j + 4], by + n[j + 5]]); x = bx + n[j + 4]; y = by + n[j + 5]; j += 6; break;
          case 'S': var sx = /[CcSs]/.test(onc) ? 2 * x - kx : x, sy = /[CcSs]/.test(onc) ? 2 * y - ky : y; bez([x, y, sx, sy, kx = bx + n[j], ky = by + n[j + 1], bx + n[j + 2], by + n[j + 3]]); x = bx + n[j + 2]; y = by + n[j + 3]; j += 4; break;
          case 'Q': bez([x, y, kx = bx + n[j], ky = by + n[j + 1], bx + n[j + 2], by + n[j + 3]]); x = bx + n[j + 2]; y = by + n[j + 3]; j += 4; break;
          case 'T': var tx = /[QqTt]/.test(onc) ? 2 * x - kx : x, ty = /[QqTt]/.test(onc) ? 2 * y - ky : y; kx = tx; ky = ty; bez([x, y, tx, ty, bx + n[j], by + n[j + 1]]); x = bx + n[j]; y = by + n[j + 1]; j += 2; break;
          default: j = n.length;
        }
        onc = mm[1];
      } while (j < n.length && n.length);
    }
    return out.length >= 2 && out.every(function (q) { return isFinite(q[0]) && isFinite(q[1]); }) ? out : null;
  }
  // Öğenin kök koordinatlarında örnek noktaları ve uzunluğu
  function gOrnekle(kok, el, n) {
    var m = gMatris(kok, el), k = gKoseler(el), out = [], L = 0, i;
    if (k) {
      var pk = k.map(function (p) { return gNokta(m, p[0], p[1]); }), uz = [0];
      for (i = 1; i < pk.length; i++) uz.push(uz[i - 1] + Math.hypot(pk[i][0] - pk[i - 1][0], pk[i][1] - pk[i - 1][1]));
      L = uz[uz.length - 1];
      for (i = 0; i <= n; i++) {
        var hedef = L * i / n, j = 1; while (j < uz.length - 1 && uz[j] < hedef) j++;
        var a = pk[j - 1], b = pk[j], u = uz[j] - uz[j - 1] > 0 ? (hedef - uz[j - 1]) / (uz[j] - uz[j - 1]) : 0;
        out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      }
      return { L: L, n: out, kose: pk };
    }
    try { L = el.getTotalLength(); } catch (e) { L = 0; }
    if (!(L > 0)) return { L: 0, n: [] };
    for (i = 0; i <= n; i++) { var p = el.getPointAtLength(L * i / n); out.push(gNokta(m, p.x, p.y)); }
    var s = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1;
    var dg = el.tagName.toLowerCase() === 'path' ? gYolDugum(el.getAttribute('d')) : null;
    return { L: L * s, n: out, dugum: dg ? dg.map(function (q) { var t = gNokta(m, q[0], q[1]); return [t[0], t[1], q[2]]; }) : null };
  }
  function gKutu(kok, el) {
    var b; try { b = el.getBBox(); } catch (e) { return null; }
    var m = gMatris(kok, el), p = [gNokta(m, b.x, b.y), gNokta(m, b.x + b.width, b.y), gNokta(m, b.x, b.y + b.height), gNokta(m, b.x + b.width, b.y + b.height)];
    var xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function gMetin(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function gYazi(el) { // <text>: alt simge tspan'ları ayrı sözcük olur (t<tspan>denge</tspan> → "t denge")
    var parca = [];
    (function gez(n) { Array.prototype.forEach.call(n.childNodes, function (c) { if (c.nodeType === 3) parca.push(c.nodeValue); else if (c.nodeType === 1) { parca.push(' '); gez(c); parca.push(' '); } }); })(el);
    return gMetin(parca.join('').replace(/\s+([,.;:)])/g, '$1').replace(/([(])\s+/g, '$1'));
  }
  function gSayi(t) { var m = /^[−-]?\d+(?:[.,]\d+)?$/.exec(gMetin(t).replace(/\s/g, '')); return m ? parseFloat(m[0].replace(',', '.').replace('−', '-')) : null; }
  function gAnahtar(t) { // eğri adından eşleştirme anahtarları: formüller ve sözcükler (küçük harf, alt simgesiz)
    var s = String(t || '').replace(/[₀-₉]/g, function (c) { return String(c.charCodeAt(0) - 8320); }).replace(/[⁰¹²³⁴-⁹⁺⁻]/g, '');
    return s.toLocaleLowerCase('tr-TR').split(/[^a-zçğıöşü0-9]+/).filter(function (x) { return x.length >= 2 && !/^(ve|ile|mol|sn|dk|derişim|derişimi|derişimleri|zaman|eğri|eğrisi|grafik|grafiği|grafikte|sayısı|sabit|değer|değeri|hız|hızı|gaz|katı|sıvı|suda)$/.test(x) && !/^\d+$/.test(x); });
  }
  var GRAFIK_ON = /<line\b[^>]*\bx1="([\d.]+)"[^>]*\bx2="\1"|<polyline\b|\bd="M\s*[\d.]+[\s,]+[\d.]+\s*[LV]/;
  function grafikCoz(kaynak) {
    if (!kaynak || !document.body || !window.SVGElement || !document.createElementNS) return null;
    if (!GRAFIK_ON.test(kaynak.outerHTML || '') || !kaynak.querySelector('text')) return null;
    var kap = document.createElement('div');
    kap.setAttribute('aria-hidden', 'true');
    kap.style.cssText = 'position:absolute;left:-12000px;top:0;width:900px;visibility:hidden;pointer-events:none;contain:layout';
    var svg = kaynak.cloneNode(true);
    kap.appendChild(svg); document.body.appendChild(kap);
    try { return grafikCoz2(svg); } catch (e) { return null; } finally { if (kap.parentNode) kap.parentNode.removeChild(kap); }
  }
  function grafikCoz2(svg) {
    var vb = svg.viewBox && svg.viewBox.baseVal, W = vb && vb.width ? vb.width : 0, H = vb && vb.height ? vb.height : 0;
    if (!W || !H) { var bb0 = svg.getBBox(); W = bb0.width; H = bb0.height; }
    if (!W || !H) return null;
    var oge = [], sira = 0;
    Array.prototype.forEach.call(svg.querySelectorAll('line,polyline,polygon,path,rect,circle,ellipse,text'), function (el) {
      if (el.closest('defs,clipPath,mask,marker,pattern,symbol,text') && el.tagName.toLowerCase() !== 'text') return;
      if (el.tagName.toLowerCase() === 'text' && el.parentNode && el.parentNode.closest && el.parentNode.closest('text')) return;
      var cs = getComputedStyle(el), o = { el: el, t: el.tagName.toLowerCase(), i: sira++ };
      if (cs.display === 'none') return;
      o.bb = gKutu(svg, el); if (!o.bb) return;
      o.cx = (o.bb[0] + o.bb[2]) / 2; o.cy = (o.bb[1] + o.bb[3]) / 2; o.w = o.bb[2] - o.bb[0]; o.h = o.bb[3] - o.bb[1];
      o.stroke = cs.stroke && cs.stroke !== 'none' && (parseFloat(cs.strokeWidth) || 0) > 0 ? gRenk(cs.stroke) : null;
      o.fill = cs.fill && cs.fill !== 'none' ? gRenk(cs.fill) : null;
      o.kesik = !!(cs.strokeDasharray && cs.strokeDasharray !== 'none' && !/^0(px)?$/.test(cs.strokeDasharray));
      if (o.t === 'text') { o.metin = gYazi(el); if (!o.metin) return; }
      else if (o.stroke || o.fill) { var r = gOrnekle(svg, el, o.t === 'line' ? 2 : 48); o.L = r.L; o.n = r.n; o.kose = r.kose; o.dugum = r.dugum; }
      oge.push(o);
    });
    // eksen adayları: düz dikey ve yatay çizgiler
    var enAz = Math.max(26, 0.16 * Math.min(W, H)), dikey = [], yatay = [];
    oge.forEach(function (o) {
      if (o.t === 'text' || !o.stroke || o.kesik || !o.kose) return;
      var k = o.kose;
      if (k.length === 2) {
        if (o.w < 2 && o.h >= enAz) dikey.push({ o: o, x: o.cx, ust: o.bb[1], alt: o.bb[3] });
        else if (o.h < 2 && o.w >= enAz) yatay.push({ o: o, y: o.cy, sol: o.bb[0], sag: o.bb[2] });
      } else if (k.length === 3) { // tek parça L biçimli eksen
        var a = k[0], b = k[1], c = k[2];
        if (Math.abs(a[0] - b[0]) < 2 && Math.abs(b[1] - c[1]) < 2 && Math.abs(a[1] - b[1]) >= enAz && Math.abs(c[0] - b[0]) >= enAz) {
          dikey.push({ o: o, x: b[0], ust: Math.min(a[1], b[1]), alt: Math.max(a[1], b[1]), L: true }); yatay.push({ o: o, y: b[1], sol: Math.min(b[0], c[0]), sag: Math.max(b[0], c[0]), L: true });
        }
      }
    });
    var paneller = [], kullanildi = [];
    dikey.forEach(function (v) {
      var en = null, ef = 1e9;
      yatay.forEach(function (h) {
        if (kullanildi.indexOf(h) >= 0) return;
        var f = Math.abs(v.alt - h.y) + Math.abs(v.x - h.sol);
        if (Math.abs(v.alt - h.y) <= 9 && Math.abs(v.x - h.sol) <= 9 && f < ef) { ef = f; en = h; }
      });
      if (en) { kullanildi.push(en); paneller.push({ V: v, Hz: en, ox: v.x, oy: en.y, ust: v.ust, sag: en.sag, ogeler: [] }); }
    });
    if (!paneller.length) return null;
    paneller.sort(function (a, b) { return Math.abs(a.oy - b.oy) > 30 ? a.oy - b.oy : a.ox - b.ox; });
    // öğeleri panellere dağıt
    var eksenOge = [];
    paneller.forEach(function (p) { eksenOge.push(p.V.o, p.Hz.o); p.gx = p.sag - p.ox; p.gy = p.oy - p.ust; });
    var panelBul = function (o) {
      var en = null, ef = 1e9;
      paneller.forEach(function (p) {
        var x0 = p.ox - Math.max(48, 0.24 * p.gx), x1 = p.sag + 34, y0 = p.ust - 34, y1 = p.oy + Math.max(46, 0.2 * p.gy);
        if (o.cx >= x0 && o.cx <= x1 && o.cy >= y0 && o.cy <= y1) {
          var f = Math.hypot(o.cx - (p.ox + p.sag) / 2, o.cy - (p.oy + p.ust) / 2);
          if (f < ef) { ef = f; en = p; }
        }
      });
      return en;
    };
    var disari = [];
    oge.forEach(function (o) { if (eksenOge.indexOf(o) >= 0) return; var p = panelBul(o); if (p) p.ogeler.push(o); else disari.push(o); });
    // her panelde rolleri belirle
    paneller.forEach(function (p, pi) {
      p.okler = []; p.isaret = []; p.yazilar = []; p.egriler = []; p.kesik = []; p.nokta = []; p.dolgu = []; p.olcu = [];
      p.ogeler.forEach(function (o) {
        if (o.t === 'text') { p.yazilar.push(o); return; }
        var kucuk = Math.max(o.w, o.h) <= 17;
        if (kucuk && o.fill && (o.t === 'path' || o.t === 'polygon') && (Math.hypot(o.cx - p.ox, o.cy - p.ust) < 14 || Math.hypot(o.cx - p.sag, o.cy - p.oy) < 14)) { p.okler.push(o); return; }
        if (o.stroke && o.kose && o.kose.length === 2 && (o.L || 0) < 13 && ((o.w < 2 && Math.abs(o.cy - p.oy) < 9) || (o.h < 2 && Math.abs(o.cx - p.ox) < 9))) { p.isaret.push(o); return; }
        if ((o.t === 'circle' || o.t === 'ellipse') && Math.max(o.w, o.h) <= 15) { p.nokta.push(o); return; }
        var duz = o.kose && o.kose.length === 2 && (o.w < 2 || o.h < 2);
        if (o.kesik && o.stroke && (duz || o.t === 'line')) { p.kesik.push(o); return; }
        if (o.stroke && duz && o.w < 2 && (o.L || 0) >= 12) { p.olcu.push(o); return; }
        if (o.stroke && (o.L || 0) >= 12 && o.t !== 'rect') { if (o.kesik) o.acil = true; p.egriler.push(o); return; }
        p.dolgu.push(o);
      });
      // yazılar: eksen adları, bölme yazıları, panel başlığı, eğri adları
      var xAd = null, yAd = null, baslik = null, xBol = [], yBol = [], kalan = [];
      p.yazilar.forEach(function (o) {
        var n = gSayi(o.metin), kisa = o.metin.length <= 6;
        if (o.cx < p.ox - 2 && o.cy <= p.oy + 8 && o.cy >= p.ust - 6 && (n != null || kisa) && o.bb[2] <= p.ox + 2) { yBol.push(o); return; }
        if (o.cy > p.oy + 2 && o.cy < p.oy + 30 && o.cx >= p.ox - 12 && o.cx <= p.sag - 18 && (n != null || kisa)) { xBol.push(o); return; }
        kalan.push(o);
      });
      kalan.forEach(function (o) {
        var dy = Math.hypot(o.cx - p.ox, o.cy - p.ust), dx = Math.hypot(o.cx - p.sag, o.cy - p.oy);
        if (!yAd && (dy < 62 || (Math.abs(o.bb[0] - p.ox) < 34 && o.cy < p.ust + 6 && o.cy > p.ust - 40)) && o.cy < p.ust + 22) { yAd = o; return; }
        if (!yAd && o.cx < p.ox && o.h > o.w * 1.6) { yAd = o; return; } // döndürülmüş dikey eksen adı
        if (!xAd && (dx < 76 || (Math.abs(o.bb[2] - p.sag) < 60 && o.cy > p.oy + 2 && o.cy < p.oy + 40)) && o.cy > p.oy - 24) { xAd = o; return; }
      });
      kalan = kalan.filter(function (o) { return o !== xAd && o !== yAd; });
      kalan.forEach(function (o) {
        if (!baslik && o.cy > p.oy + 20 && o.metin.length >= 5 && o.metin.length <= 44) { baslik = o; return; }
        if (o.cy > p.oy + 20 && o.metin.length > 44) { o.not = true; return; }
        if (!xAd && o.cy > p.oy + 10 && o.cy < p.oy + 40 && Math.abs(o.cx - (p.ox + p.sag) / 2) < p.gx * 0.3 && o.metin.length <= 24) xAd = o;
      });
      kalan = kalan.filter(function (o) { return o !== xAd && o !== baslik; });
      p.xAd = xAd; p.yAd = yAd; p.baslik = baslik; p.xBol = xBol; p.yBol = yBol;
      // eğrileri renge göre grupla
      var gruplar = [];
      p.egriler.forEach(function (o) {
        var g = null;
        gruplar.forEach(function (x) { if (!g && gRenkFark(x.renk, o.stroke) < 40 && x.kesik === !!o.acil) g = x; });
        if (!g) { g = { renk: o.stroke, kesik: !!o.acil, ogeler: [], yazilar: [], nokta: [] }; gruplar.push(g); }
        g.ogeler.push(o);
      });
      gruplar.forEach(function (g) { g.ogeler.sort(function (a, b) { return a.bb[0] - b.bb[0] || a.i - b.i; }); });
      // kesikli kılavuz çizgilerinin yazıları (uçlarına yakın ya da dikey çizginin altında)
      p.kesikYazi = [];
      p.kesik.forEach(function (k) {
        var uc = k.n && k.n.length ? [k.n[0], k.n[k.n.length - 1]] : [[k.cx, k.cy]];
        kalan.slice().forEach(function (o) {
          if (o.not) return;
          if (uc.some(function (q) { return Math.hypot(q[0] - o.cx, q[1] - o.cy) < 22; }) || (k.w < 2 && Math.abs(o.cx - k.cx) < 10 && o.cy > p.oy)) { p.kesikYazi.push({ k: k, o: o }); kalan.splice(kalan.indexOf(o), 1); }
        });
        p.xBol.forEach(function (o) { if (k.w < 2 && Math.abs(o.cx - k.cx) < 10) p.kesikYazi.push({ k: k, o: o, bol: true }); });
      });
      // eğri adları: aynı renkte yazı, yoksa eğrinin ucuna en yakın yazı; sayı yazıları eğrinin değeridir
      var sahipsiz = [];
      p.olcu.forEach(function (o) { o.yazilar = []; });
      kalan.forEach(function (o) {
        if (o.not) { sahipsiz.push(o); return; }
        var en = null, ef = 1e9, enO = null, efO = 1e9;
        gruplar.forEach(function (g) {
          var renkli = o.fill && gRenkFark(o.fill, g.renk) < 46;
          g.ogeler.forEach(function (e) { (e.n || []).forEach(function (q) { var f = Math.hypot(q[0] - o.cx, q[1] - o.cy) - (renkli ? 60 : 0); if (f < ef) { ef = f; en = g; } }); });
        });
        p.olcu.forEach(function (k) { var renkli = o.fill && gRenkFark(o.fill, k.stroke) < 46, f = Math.abs(o.cx - k.cx) + Math.max(0, Math.abs(o.cy - k.cy) - k.h / 2) - (renkli ? 40 : 0); if (f < efO) { efO = f; enO = k; } });
        if (enO && efO < 30 && efO <= ef) { enO.yazilar.push(o); return; }
        if (en && ef < 34) { if (gSayi(o.metin) != null) (en.degerler = en.degerler || []).push(o); else en.yazilar.push(o); }
        else sahipsiz.push(o);
      });
      p.nokta.forEach(function (o) {
        var en = null, ef = 1e9;
        gruplar.forEach(function (g) { g.ogeler.forEach(function (e) { (e.n || []).forEach(function (q) { var f = Math.hypot(q[0] - o.cx, q[1] - o.cy); if (f < ef) { ef = f; en = g; } }); }); });
        if (en && ef < 10) en.nokta.push(o); else sahipsiz.push(o);
      });
      // ölçü oklarının uçları (küçük dolu üçgenler)
      p.dolgu = p.dolgu.filter(function (o) {
        if (Math.max(o.w, o.h) > 17 || !o.fill) return true;
        var k = null; p.olcu.forEach(function (x) { if (!k && Math.abs(o.cx - x.cx) < 8 && o.cy >= x.bb[1] - 14 && o.cy <= x.bb[3] + 14) k = x; });
        if (k) { (k.uclar = k.uclar || []).push(o); return false; }
        return true;
      });
      p.gruplar = gruplar; p.sahipsiz = sahipsiz;
    });
    // aşamalar ve konuşmalar
    var asamalar = [], id = 'g' + (++grafikSayac) + '-' + Math.random().toString(36).slice(2, 6);
    var isaretle = function (o, a, s, tur) { if (!o || o.el.hasAttribute('data-ga')) return; o.el.setAttribute('data-ga', a); o.el.setAttribute('data-gs', s); o.el.setAttribute('data-gt', tur); };
    var ys = function (o) { return o ? konusmaMetni(o.metin.replace(/^\((.*)\)$/, '$1')) : ''; };
    var bs = function (o) { return o ? konusmaMetni(o.metin.replace(/^\(?[a-zçğıöşü0-9]{1,2}\)\s*/i, '').replace(/\s+[–—-]\s+/g, '-')) : ''; };
    var Ydeger = function (p, y) { return (p.oy - y) / Math.max(1, p.gy); }, Xdeger = function (p, x) { return (x - p.ox) / Math.max(1, p.gx); };
    var cokPanel = paneller.length > 1, siraAd = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü'];
    paneller.forEach(function (p, pi) {
      // 1) eksenler
      var a = asamalar.length, s = 0;
      isaretle(p.V.o, a, s++, 'c'); if (p.Hz.o !== p.V.o) isaretle(p.Hz.o, a, s++, 'c');
      p.okler.forEach(function (o) { isaretle(o, a, s++, 'f'); });
      [p.yAd, p.xAd].forEach(function (o) { isaretle(o, a, s++, 'f'); });
      p.isaret.forEach(function (o) { isaretle(o, a, s++, 'f'); });
      p.yBol.concat(p.xBol.filter(function (o) { return !p.kesikYazi.some(function (k) { return k.o === o; }); })).forEach(function (o) { isaretle(o, a, s++, 'f'); });
      isaretle(p.baslik, a, s++, 'f');
      var giris = cokPanel ? (siraAd[pi] || ((pi + 1) + '.')) + ' grafik' + (p.baslik ? ': ' + bs(p.baslik) + '.' : '.') : (p.baslik ? bs(p.baslik) + ' grafiğini adım adım çizelim.' : 'Grafiği adım adım çizelim.');
      var eksen = p.xAd && p.yAd ? ' Önce eksenler: yatay eksen ' + ys(p.xAd) + ', dikey eksen ' + ys(p.yAd) + '.' : p.yAd ? ' Önce eksenler: dikey eksen ' + ys(p.yAd) + '.' : p.xAd ? ' Önce eksenler: yatay eksen ' + ys(p.xAd) + '.' : ' Önce eksenleri çizelim.';
      asamalar.push((pi ? (cokPanel ? 'Şimdi ' + giris.charAt(0).toLocaleLowerCase('tr-TR') + giris.slice(1) : giris) : giris) + eksen);
      // 2) eğriler: çok eğri varsa ikişer ikişer
      var G = p.gruplar, adim = G.length > 4 ? 2 : 1;
      for (var gi = 0; gi < G.length; gi += adim) {
        var parca = G.slice(gi, gi + adim), soz = [];
        a = asamalar.length; s = 0;
        parca.forEach(function (g) {
          var anahtar = [gRenkAdi(g.renk)];
          g.ogeler.forEach(function (o) { isaretle(o, a, s++, 'c'); });
          g.nokta.forEach(function (o) { isaretle(o, a, s++, 'f'); });
          g.yazilar.forEach(function (o) { isaretle(o, a, s++, 'f'); anahtar = anahtar.concat(gAnahtar(o.metin)); });
          g.ogeler.forEach(function (o) { o.el.setAttribute('data-gk', anahtar.join(' ')); });
          soz.push(grafikEgriSoz(p, g, Xdeger, Ydeger, ys));
        });
        asamalar.push(soz.join(' '));
      }
      // 3) ölçü okları (Ea, ΔH gibi): her biri adıyla
      if (p.olcu.length) {
        a = asamalar.length; s = 0;
        var oSoz = [];
        p.olcu.forEach(function (k) {
          isaretle(k, a, s++, 'c');
          (k.uclar || []).forEach(function (o) { isaretle(o, a, s++, 'f'); });
          k.yazilar.forEach(function (o) { isaretle(o, a, s++, 'f'); });
          if (k.yazilar.length) oSoz.push(ys(k.yazilar[0]) + '.');
        });
        asamalar.push(oSoz.length ? oSoz.slice(0, 3).join(' ') : 'Okları da çizelim.');
      }
      // 4) kılavuzlar ve notlar
      var kalan = p.kesik.concat(p.dolgu).concat(p.sahipsiz);
      if (kalan.length) {
        a = asamalar.length; s = 0;
        var kSoz = [], notlar = [];
        p.kesik.forEach(function (k) {
          isaretle(k, a, s++, 'f');
          var yz = p.kesikYazi.filter(function (x) { return x.k === k; });
          yz.forEach(function (x) { isaretle(x.o, a, s++, 'f'); });
          var ad = yz.length ? ys(yz[0].o) : '';
          if (!ad) return;
          if (/^t\b|^t\s?\d|^t\s?denge/i.test(yz[0].o.metin)) kSoz.push('Kesikli çizgi ' + ad + ' anını gösteriyor.');
          else if (gSayi(yz[0].o.metin) == null) kSoz.push('Kesikli çizgi: ' + ad + '.');
        });
        p.dolgu.forEach(function (o) { isaretle(o, a, s++, 'f'); });
        p.sahipsiz.forEach(function (o) { isaretle(o, a, s++, 'f'); if (o.not && o.metin.length < 220) notlar.push(ys(o)); });
        var tekrar = {}; kSoz = kSoz.filter(function (x) { if (tekrar[x]) return false; tekrar[x] = 1; return true; }).slice(0, 3);
        if (!kSoz.length && !notlar.length) kSoz.push(p.kesik.length ? 'Kesikli çizgileri de ekleyelim.' : 'Grafikteki yazıları da ekleyelim.');
        asamalar.push(kSoz.concat(notlar.map(function (x) { return /[.!?]$/.test(x) ? x : x + '.'; })).join(' '));
      }
    });
    // panellerin dışındaki öğeler en son belirir
    if (disari.length) {
      var son = asamalar.length - 1, ss = 1000;
      disari.forEach(function (o) { isaretle(o, son, ss++, o.t === 'text' ? 'f' : (o.stroke && !o.kesik && (o.L || 0) > 12 ? 'c' : 'f')); });
    }
    svg.setAttribute('data-grafik', id);
    svg.setAttribute('data-gasama', String(asamalar.length));
    // x bölme yazıları (t₁ gibi): kalemle gösterilecek yerler
    paneller.forEach(function (p) { p.xBol.forEach(function (o) { var k = gAnahtar(o.metin); if (k.length) o.el.setAttribute('data-gx', k.join(' ')); }); });
    return { id: id, html: svg.outerHTML, asamalar: asamalar };
  }
  // Bir eğrinin anlatımı: renk, ad, gidişat (artıyor / azalıyor / sabit / aniden değişiyor / tepe yapıyor) ve
  // eksendeki bölme yazılarına denk gelen değerler
  function grafikEgriSoz(p, g, Xd, Yd, ys) {
    var renk = gRenkAdi(g.renk), ayni = g.yazilar.filter(function (o) { return o.fill && gRenkFark(o.fill, g.renk) < 46; });
    // ikinci ad yalnız eğrinin öbür ucundaysa (tepkenler … ürünler gibi)
    var uclar = [];
    g.ogeler.forEach(function (o) { if (o.n && o.n.length) uclar.push(o.n[0], o.n[o.n.length - 1]); });
    var ucaYakin = function (o) { var en = 0, ef = 1e9; uclar.forEach(function (q, k) { var f = Math.hypot(q[0] - o.cx, q[1] - o.cy); if (f < ef) { ef = f; en = k; } }); return { k: en, f: ef }; };
    var secilen = ayni.length ? [ayni[0]] : g.yazilar.slice(0, 1);
    if (ayni.length > 1) { var u0 = ucaYakin(ayni[0]); ayni.slice(1).forEach(function (o) { var u = ucaYakin(o); if (secilen.length < 2 && u.f < 46 && u0.f < 46 && u.k !== u0.k) secilen.push(o); }); }
    var adlar = secilen.map(ys).filter(Boolean);
    if (g.kesik) adlar = adlar.length ? adlar : [];
    var bas = (renk ? renk.charAt(0).toLocaleUpperCase('tr-TR') + renk.slice(1) + (g.kesik ? ' kesikli' : '') + ' eğri' : 'Bu eğri') + (adlar.length ? ', ' + adlar.join(' ve ') : '');
    var nk = [];
    g.ogeler.forEach(function (o) {
      var l = o.kose ? o.kose.map(function (q) { return [q[0], q[1], 1]; }) : o.dugum || (o.n || []).map(function (q) { return [q[0], q[1], 0]; });
      l.forEach(function (q) { nk.push([Xd(p, q[0]), Yd(p, q[1]), q[2]]); });
    });
    if (nk.length < 2) return bas + '.';
    // ardışık noktalardan gidişat parçaları
    var parcalar = [], yon = function (dy, dx, duz) { return dx < (duz ? 0.012 : 0.003) && Math.abs(dy) > 0.05 ? (dy > 0 ? 'sicra+' : 'sicra-') : Math.abs(dy) < Math.max(0.01, dx * 0.08) ? 'sabit' : dy > 0 ? 'artis' : 'azalis'; };
    var once = nk[0];
    for (var i = 1; i < nk.length; i++) {
      var q = nk[i], dx = Math.abs(q[0] - once[0]), dy = q[1] - once[1];
      if (dx < 0.004 && Math.abs(dy) < 0.004) continue;
      var y = yon(dy, dx, q[2]), u = parcalar[parcalar.length - 1];
      if (u && u.y === y) u.son = q; else parcalar.push({ y: y, bas: once, son: q });
      once = q;
    }
    // sıçramaya bitişik kısa artış/azalış sıçramaya katılır; çok kısa parçalar atılır
    for (i = 0; i < parcalar.length; i++) {
      var x = parcalar[i];
      if (x.y.indexOf('sicra') !== 0) continue;
      var isaret = x.y === 'sicra+' ? 'artis' : 'azalis';
      [i - 1, i + 1].forEach(function (j) { var k = parcalar[j]; if (k && k.y === isaret && Math.abs(k.son[0] - k.bas[0]) < 0.05) k.y = 'sil'; });
    }
    parcalar = parcalar.filter(function (x) { return x.y !== 'sil' && (x.y.indexOf('sicra') === 0 || Math.abs(x.son[0] - x.bas[0]) > 0.03 || Math.abs(x.son[1] - x.bas[1]) > 0.04); });
    var B = [];
    parcalar.forEach(function (x) { var u = B[B.length - 1]; if (u && u.y === x.y) u.son = x.son; else B.push({ y: x.y, bas: x.bas, son: x.son }); });
    for (i = 1; i < B.length - 1; i++) {
      var o1 = B[i - 1], o2 = B[i + 1];
      if (B[i].y === 'sabit' && Math.abs(B[i].son[0] - B[i].bas[0]) < 0.16 && ((o1.y === 'artis' && o2.y === 'azalis') || (o1.y === 'azalis' && o2.y === 'artis'))) {
        o1.son = B[i].bas; B.splice(i, 1); i--;
      }
    }
    B = B.reduce(function (l, x) { var u = l[l.length - 1]; if (u && u.y === x.y) u.son = x.son; else l.push(x); return l; }, []);
    if (!B.length) return bas + '.';
    var deger = function (Y) { // dikey eksendeki bölme yazısına ya da eğrinin sayı yazısına denk gelen değer
      var en = null, ef = 0.035;
      p.yBol.forEach(function (o) { var f = Math.abs(Yd(p, o.cy) - Y); if (gSayi(o.metin) != null && f < ef) { ef = f; en = o.metin; } });
      (g.degerler || []).forEach(function (o) { var f = Math.abs(Yd(p, o.cy) - Y); if (f < ef + 0.03) { ef = f; en = o.metin; } });
      return en;
    };
    var anAdi = function (X) { // sıçramanın olduğu yerdeki bölme yazısı (t₁ gibi)
      var px = p.ox + X * p.gx, en = null, ef = 12;
      p.xBol.concat(p.kesikYazi.map(function (k) { return k.o; })).forEach(function (o) { var f = Math.abs(o.cx - px); if (f < ef) { ef = f; en = o; } });
      return en ? ys(en) + ' anında' : 'bir anda';
    };
    var c = [], d = function (Y) { var v = deger(Y); return v ? konusmaMetni(v) + ' değerinde' : ''; };
    var ilk = B[0], v0 = deger(ilk.bas[1]);
    if (ilk.y !== 'sabit') { if (v0) c.push({ m: konusmaMetni(v0) + ' değerinden başlıyor', bas: 1 }); else if (ilk.bas[1] < 0.04) c.push({ m: 'sıfırdan başlıyor', bas: 1 }); }
    for (i = 0; i < Math.min(B.length, 5); i++) {
      var t = B[i], sn = B[i + 1], vs = deger(t.son[1]), sabitSonra = sn && sn.y === 'sabit' && Math.abs(sn.bas[1] - t.son[1]) < 0.03;
      if (t.y === 'sabit') { c.push({ m: (!i && B.length > 1 ? 'önce ' : '') + (d(t.bas[1]) ? d(t.bas[1]) + ' ' : '') + 'sabit kalıyor' }); continue; }
      if (t.y === 'sicra+' || t.y === 'sicra-') { c.push({ m: anAdi(t.bas[0]) + ' aniden ' + (vs ? konusmaMetni(vs) + ' değerine ' + (t.y === 'sicra+' ? 'çıkıyor' : 'iniyor') : (t.y === 'sicra+' ? 'artıyor' : 'azalıyor')), an: 1 }); continue; }
      if (t.y === 'artis' && sn && sn.y === 'azalis') { c.push({ m: (vs ? konusmaMetni(vs) + ' değerine çıkıp' : 'yükselip') + ' bir tepe yapıyor' }); continue; }
      if (t.y === 'azalis' && sn && sn.y === 'artis') { c.push({ m: (vs ? konusmaMetni(vs) + ' değerine inip' : 'azalıp') + ' bir çukur yapıyor' }); continue; }
      var fiil = t.y === 'artis' ? (vs ? konusmaMetni(vs) + ' değerine çıkıyor' : 'artıyor') : (vs ? konusmaMetni(vs) + ' değerine iniyor' : 'azalıyor');
      if (sabitSonra) { fiil = fiil.replace(/çıkıyor$/, 'çıkıp sabit kalıyor').replace(/iniyor$/, 'inip sabit kalıyor').replace(/^artıyor$/, 'artıp sabit kalıyor').replace(/^azalıyor$/, 'azalıp sabit kalıyor'); i++; }
      c.push({ m: fiil });
    }
    if (B.length > 5) c.push({ m: 'değişmeye devam ediyor' });
    var metin = c.map(function (x, k) {
      if (!k || x.an || x.bas) return x.m;
      return (c[k - 1].bas ? '' : 'sonra ') + x.m;
    }).join(', ').replace(/(sıfırdan|değerinden) başlıyor, /, '$1 başlayıp ');
    return bas + ': ' + metin + '.';
  }
  // Grafik içeren tahta parçası → ders adımları: ilk adım grafiği tahtaya koyar ve eksenleri çizer, sonrakiler eğrileri
  function grafikAdimlari(html, sinif, onSoz) {
    var d = document.createElement('div'); d.innerHTML = html;
    var svg = d.querySelector('svg'); if (!svg) return null;
    var g = grafikCoz(svg); if (!g || g.asamalar.length < 2) return null;
    var yeni = document.createElement('div'); yeni.innerHTML = g.html;
    if (!yeni.firstElementChild) return null;
    svg.parentNode.replaceChild(yeni.firstElementChild, svg);
    var on = String(onSoz || '').replace(/\s*Şekle bakalım\.?\s*/g, ' ').trim(), sonda = /(^|\s)sekil(\s|$)/.test(sinif || '');
    var ilkHtml = d.innerHTML, sonHtml = '';
    if (sonda) { // şekil altı yazısı grafik çizildikten sonra yazılır ve okunur
      var gEl = d.querySelector('svg[data-grafik]'), tut = gEl.outerHTML; gEl.parentNode.removeChild(gEl);
      if (gorunurUzunluk(d.innerHTML)) { sonHtml = d.innerHTML; ilkHtml = tut; }
    }
    var adim = [{ h: [{ c: ((sinif || '') + ' grafik').trim(), html: ilkHtml }], s: (on && !sonda ? on + ' ' : '') + g.asamalar[0], grafik: { id: g.id, asama: 0 } }];
    for (var k = 1; k < g.asamalar.length; k++) adim.push({ grafik: { id: g.id, asama: k }, s: g.asamalar[k] });
    if (on && sonda) { var son = adim[adim.length - 1]; son.s += ' ' + on; if (sonHtml) son.h = [{ c: sinif || '', html: sonHtml }]; }
    return adim;
  }
  /* ---- tahtada çizim: öğeler aşama aşama görünür, kalem çizginin ucunu izler ---- */
  var G_NS = 'http://www.w3.org/2000/svg';
  function gUzunluk(el) { try { var L = el.getTotalLength(); return L > 0 ? L : 0; } catch (e) { return 0; } }
  function grafikOgeKoy(o, u) {
    u = u <= 0 ? 0 : u >= 1 ? 1 : u;
    if (o.u === u) return;
    o.u = u;
    if (o.t === 'c') { o.el.style.strokeDasharray = o.L + ' ' + (o.L + 2); o.el.style.strokeDashoffset = String(o.L * (1 - u)); }
    else if (o.t === 'r') o.rect.setAttribute('width', String(o.bw * u));
    else o.el.style.opacity = String(Math.min(1, u * 1.5));
  }
  function grafikHazirla(svg) {
    if (!svg) return null;
    if (svg.__gh) return svg.__gh;
    var ogeler = [], defs = null, no = 0, kimlik = svg.getAttribute('data-grafik') || 'g';
    Array.prototype.forEach.call(svg.querySelectorAll('[data-ga]'), function (el) {
      var o = { el: el, a: +el.getAttribute('data-ga') || 0, s: +el.getAttribute('data-gs') || 0, t: el.getAttribute('data-gt') || 'f' };
      if (o.t === 'c') {
        var cs = getComputedStyle(el);
        if (cs.strokeDasharray && cs.strokeDasharray !== 'none' && !/^0(px)?$/.test(cs.strokeDasharray)) o.t = 'r';
        else { o.L = gUzunluk(el); if (!(o.L > 0)) o.t = 'f'; }
      }
      if (o.t === 'r') { // kesikli eğri: soldan sağa açılan bir kırpma ile çizilir
        try {
          var b = el.getBBox();
          if (!defs) { defs = document.createElementNS(G_NS, 'defs'); svg.insertBefore(defs, svg.firstChild); }
          var cp = document.createElementNS(G_NS, 'clipPath'), rc = document.createElementNS(G_NS, 'rect'), cid = kimlik + '-k' + (no++);
          cp.setAttribute('id', cid); rc.setAttribute('x', b.x - 4); rc.setAttribute('y', b.y - 8); rc.setAttribute('height', b.height + 16); rc.setAttribute('width', '0');
          cp.appendChild(rc); defs.appendChild(cp); el.setAttribute('clip-path', 'url(#' + cid + ')');
          o.rect = rc; o.bx = b.x - 4; o.bw = b.width + 8; o.L = gUzunluk(el);
        } catch (e) { o.t = 'f'; }
      }
      ogeler.push(o);
    });
    ogeler.sort(function (x, y) { return x.a - y.a || x.s - y.s; });
    ogeler.forEach(function (o) { grafikOgeKoy(o, 0); });
    svg.__gh = { ogeler: ogeler };
    return svg.__gh;
  }
  // Öğenin u kadar çizildiği andaki ucu (ekran koordinatı)
  function grafikUc(o, u) {
    try {
      var el = o.el, m = el.getScreenCTM(), x, y;
      if (!m) return null;
      if (o.t === 'c') { var q = el.getPointAtLength(o.L * u); x = q.x; y = q.y; }
      else if (o.t === 'r') {
        if (!o.orn) { o.orn = []; for (var i = 0; i <= 48 && o.L; i++) { var q2 = el.getPointAtLength(o.L * i / 48); o.orn.push([q2.x, q2.y]); } }
        var hx = o.bx + o.bw * u, en = null, ef = 1e9;
        o.orn.forEach(function (q3) { var f = Math.abs(q3[0] - hx); if (f < ef) { ef = f; en = q3; } });
        if (!en) return null; x = en[0]; y = en[1];
      } else { var b = el.getBBox(); x = b.x + b.width; y = b.y + b.height; }
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    } catch (e) { return null; }
  }
  // a. aşama p (0–1) kadar çizilir; kalemin gideceği yer döner (aşama bitince null)
  function grafikIlerlet(svg, a, p) {
    var G = grafikHazirla(svg); if (!G) return null;
    var liste = G.ogeler.filter(function (o) { return o.a === a; }), top = 0, gecen = 0, uc = null;
    liste.forEach(function (o) { o.pay = o.t === 'c' ? Math.max(24, o.L) : o.t === 'r' ? Math.max(40, o.L || o.bw) : 20; top += o.pay; });
    if (!top) return null;
    var hedef = p * top;
    liste.forEach(function (o) {
      var u = (hedef - gecen) / o.pay; gecen += o.pay;
      grafikOgeKoy(o, u);
      if (!uc && u > 0 && u < 1) uc = grafikUc(o, u);
    });
    return uc;
  }
  function grafikBasUc(svg, a) {
    var G = grafikHazirla(svg); if (!G) return null;
    for (var i = 0; i < G.ogeler.length; i++) { var o = G.ogeler[i]; if (o.a === a && o.u < 1) return grafikUc(o, o.t === 'f' ? 1 : 0); }
    return null;
  }
  function grafikTamamla(svg, a) { // a. aşamaya kadar her şey görünür, sonrası gizli
    var G = grafikHazirla(svg); if (!G) return;
    G.ogeler.forEach(function (o) { grafikOgeKoy(o, o.a <= a ? 1 : 0); });
  }
  function adimMetni(a) { var b = (a.h || a.w || [])[0]; if (!b) return ''; return b.html != null ? gorselsizMetin(b.html) : String(b.t || ''); }

  /* ================= Ders PDF'si: tahtaya yazılanlardan ders notu =================
     Kitaplıklar yalnızca PDF istenince yüklenir (sesli/pdf-lib.min.js, sesli/pdf-yazi.js, sesli/sesli-pdf.js). */
  var pdfSoz = null;
  function betikYukle(src) {
    return new Promise(function (ok, red) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = function () { ok(); }; s.onerror = function () { red(new Error(src)); }; document.head.appendChild(s); });
  }
  function pdfHazirla() {
    if (pdfSoz) return pdfSoz;
    var k = window.SESLI_DERS_KAYIT_KLASORU || (BETIK_DIZIN ? BETIK_DIZIN + 'sesli/' : 'sesli/');
    pdfSoz = (window.PDFLib ? Promise.resolve() : betikYukle(k + 'pdf-lib.min.js'))
      .then(function () { return window.SesliPdfYazi ? null : betikYukle(k + 'pdf-yazi.js'); })
      .then(function () { return window.SesliPdf ? null : betikYukle(k + 'sesli-pdf.js'); })
      .catch(function (e) { pdfSoz = null; throw e; });
    return pdfSoz;
  }
  // Ders adımları → sade bloklar (başlık, ara başlık, etiket, not kutusu, denklem, cevap, madde, şekil, metin)
  function dersNotu(ders, opt) {
    opt = opt || {};
    var A = ders.adimlar || [], bas = 0, son = A.length, baslik = ders.baslik || 'Ders notu', alt = '';
    if (opt.bolum != null && ders.bolumler && ders.bolumler[opt.bolum]) {
      bas = ders.bolumler[opt.bolum].adim; son = ders.bolumler[opt.bolum + 1] ? ders.bolumler[opt.bolum + 1].adim : A.length;
      alt = baslik; baslik = ders.bolumler[opt.bolum].ad;
    }
    var bloklar = [];
    A.slice(bas, son).forEach(function (a) {
      (a.h || a.w || []).forEach(function (b) {
        if (b.gorsel) { bloklar.push({ tur: 'sekil', html: '<img src="' + esc(b.gorsel.url) + '" alt="">' }); return; }
        var c = ' ' + String(b.c || '') + ' ';
        var html = b.html != null ? b.html : sozcukler(b.t || '').map(function (x, k) { return (k && !x.bitisik ? ' ' : '') + (a.oto ? otomatikHTML(x.t) : isaretHTML(x.t)); }).join('');
        if (!gorunurUzunluk(html) && !/<(svg|img|table)[\s>]/i.test(html)) return;
        var tur = / title /.test(c) ? 'baslik' : / alt /.test(c) ? 'alt' : / label /.test(c) ? 'etiket' : / (q|qd) /.test(c) ? 'not' : / eq /.test(c) ? 'denklem' : / ok /.test(c) ? 'cevap'
          : / (li|lid|li2) /.test(c) ? 'madde' : / (sekil|grafik) /.test(c) ? 'sekil' : 'metin';
        bloklar.push({ tur: tur, html: html, pg: a.pg || null, ilk: / q /.test(c), ic: / li2 /.test(c) });
      });
    });
    if (opt.bolum != null && bloklar[0] && bloklar[0].tur === 'baslik') bloklar.shift();
    return { baslik: baslik, altBaslik: alt, bloklar: bloklar };
  }
  function markaBul() {
    if (window.SesliDers && SesliDers.marka) return SesliDers.marka;
    var y = (location.pathname || '') + ' ' + (document.title || '');
    return /kimyamed/i.test(y) ? 'kimyamed' : /ronya/i.test(y) ? 'Ronya Kimya' : '';
  }
  function pdfAdi(t) { // dosya adı her cihazda bozulmasın: Türkçe harfler sadeleşir
    var tr = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U', 'â': 'a', 'î': 'i', 'û': 'u' };
    t = String(t || 'Ders notu').replace(/[çÇğĞıİöÖşŞüÜâîû]/g, function (c) { return tr[c]; }).replace(/[^\x20-\x7E]/g, '');
    return String(t || 'Ders notu').replace(/[\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) + ' - Ders notu.pdf'; }
  function dersPdf(ders, opt) {
    var notu = dersNotu(ders, opt);
    return pdfHazirla().then(function () { return window.SesliPdf.olustur(notu, { marka: markaBul(), ust: 'Ders notu', baslik: notu.baslik }); })
      .then(function (bayt) { var blob = new Blob([bayt], { type: 'application/pdf' }); indir(blob, pdfAdi(notu.baslik)); return blob; });
  }

  /* ---- soru ve çözüm grupları ----
     Bir sorunun kendisi bir tahtaya, çözümünün tamamı bir tahtaya yazılır: grup başlarken bütün grup ölçülür,
     sığmıyorsa tahta silinir (çözümde soru yeniden yazılır) ve yazı gerektiği kadar küçülür; grup yarıda silinmez. */
  var grupSayac = 0;
  function grupla(adimlar, sBas, cBas, son) {
    var id = 'gr' + (++grupSayac);
    for (var k = sBas; k < son; k++) { adimlar[k].grup = id; adimlar[k].grupTur = k < cBas ? 's' : 'c'; delete adimlar[k].grupBas; }
    if (cBas > sBas) adimlar[sBas].grupBas = true;
    if (son > cBas) adimlar[cBas].grupBas = true;
  }

  /* ================= konu anlatımından ders ================= */
  // Sayfadaki konu anlatımı (başlık, paragraf, liste, not kutusu, tablo, şekil, çözümlü örnek) tahta adımlarına çevrilir.
  var ATLA_ETIKET = /^(SCRIPT|STYLE|BUTTON|NAV|DETAILS|SUMMARY|INPUT|SELECT|TEXTAREA|FORM|AUDIO|VIDEO|IFRAME|OBJECT|NOSCRIPT|TEMPLATE|LINK|META|HR)$/;
  var ATLA_SINIF = /(^|\s)(soru|test|icindekiler|sayac|sd-anlat|sd-arac|ks|ks-kart|ks-liste|ks-alt|ks-baslik|ks-not|sekmeler|sonraki|crumb|kaz|hero|sat|cozum-btn|ltabs)(\s|$)/;
  var NOT_SINIF = /(^|\s)(kart|card|not|ozet-kutu|ipucu|dikkat|uyari|bilgi|kutu|kural|tuzak|ek-not|gunluk)(\s|$)/;
  var BLOK_ETIKET = /^(P|DIV|UL|OL|LI|TABLE|FIGURE|SECTION|ARTICLE|BLOCKQUOTE|H[1-6]|HEADER|FOOTER|ASIDE|DL|DT|DD|PRE|HR|DETAILS|MAIN|SVG|IMG|CANVAS)$/;
  function gorunmez(n) { return !!(n.hidden || (n.style && n.style.display === 'none') || (n.getAttribute && n.getAttribute('aria-hidden') === 'true')); }
  function sinifi(n) { return typeof n.className === 'string' ? n.className : ''; }
  function yaziMetni(n) { return (n && n.textContent || '').replace(/\s+/g, ' ').trim(); }
  function blokVarMi(n) { for (var c = n.firstElementChild; c; c = c.nextElementSibling) if (BLOK_ETIKET.test(c.tagName.toUpperCase())) return true; return false; }
  function gorunurUzunluk(html) { return String(html).replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().length; }
  function dugmesizKopya(n) { var k = n.cloneNode(true); Array.prototype.forEach.call(k.querySelectorAll('.sd-anlat,.sd-arac,.rozet,.onbilgi,.kazanim'), function (x) { x.remove(); }); return k; }
  function basliksizMetin(n) { return yaziMetni(dugmesizKopya(n)); }
  // HTML'i cümlelere böl; açık kalan satır içi etiketler her parçada kapatılıp yeniden açılır
  function cumleBol(html) {
    var parcalar = String(html).split(/(<[^>]+>)/), sonuc = [], cur = '', acik = [], TEK = /^(br|img|hr|wbr|input|col|source)$/i;
    parcalar.forEach(function (p) {
      if (!p) return;
      if (p.charAt(0) === '<') {
        var m = p.match(/^<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9-]*)/);
        if (m) {
          var ad = m[2].toLowerCase();
          if (m[1]) { for (var q = acik.length - 1; q >= 0; q--) if (acik[q].ad === ad) { acik.splice(q, 1); break; } }
          else if (!TEK.test(ad) && !/\/\s*>$/.test(p)) acik.push({ ad: ad, etiket: p });
        }
        cur += p; return;
      }
      var re = /([.!?…]+["”’»)]*)(\s+)(?=[A-ZÇĞİÖŞÜ0-9"“«(])/g, son = 0, m2;
      while ((m2 = re.exec(p))) {
        cur += p.slice(son, m2.index + m2[1].length);
        sonuc.push(cur + acik.slice().reverse().map(function (t) { return '</' + t.ad + '>'; }).join(''));
        cur = acik.map(function (t) { return t.etiket; }).join('');
        son = m2.index + m2[1].length + m2[2].length;
      }
      cur += p.slice(son);
    });
    if (gorunurUzunluk(cur)) sonuc.push(cur);
    return sonuc;
  }
  // Paragrafı tahta adımlarına böl: kısa cümleler bir araya gelir, uzunlar ayrı yazılır
  function paragrafParcalari(html) {
    var out = [], cur = '';
    cumleBol(html).forEach(function (c) {
      if (!cur) { cur = c; return; }
      var a = gorunurUzunluk(cur), b = gorunurUzunluk(c);
      if ((a < 90 && a + b < 230) || b < 18) cur += ' ' + c; else { out.push(cur); cur = c; }
    });
    if (cur && gorunurUzunluk(cur)) out.push(cur);
    return out;
  }
  function tabloOkunus(t) {
    var satirlar = Array.prototype.slice.call(t.querySelectorAll('tr')), metin = [];
    if (satirlar.length && satirlar[0].querySelector('th') && !satirlar[0].querySelector('td')) satirlar.shift();
    satirlar.forEach(function (tr) {
      var h = Array.prototype.map.call(tr.children, function (c) { return yaziMetni(c); }).filter(Boolean);
      if (h.length) metin.push(h[0] + (h.length > 1 ? ': ' + h.slice(1).join(', ') : '') + '.');
    });
    var s = metin.join(' ');
    if (s.length > 900) s = s.slice(0, s.lastIndexOf('.', 900) + 1) + ' Tablonun devamını tahtadan inceleyelim.';
    return s;
  }
  var pgSayac = 0;
  function IcerikYapici() { this.adimlar = []; this.not = false; this.notIlk = false; }
  IcerikYapici.prototype.ekle = function (html, sinif, s) {
    html = String(html || '').replace(/<span class="(?:rozet|onbilgi|kazanim)[^"]*">[\s\S]*?<\/span>/g, '').trim();
    var gorselVar = /<(svg|img|table)[\s>]/i.test(html);
    if (!gorunurUzunluk(html) && !gorselVar) return;
    var konusma = s != null ? s : htmlKonusma(html);
    if (!konusma) konusma = gorselVar ? (/<table/i.test(html) ? 'Tabloya bakalım.' : 'Şekle bakalım.') : '';
    if (!konusma) return;
    var c = sinif || '';
    if (this.not) {
      var k = this.notIlk ? 'q' : 'qd'; this.notIlk = false;
      if (c === 'alt' || c === 'label') html = '<b>' + html + '</b>';
      c = /^(li|li2|lid)$/.test(c) ? k + ' ' + c : k;
    }
    var gg = /<svg[\s>]/i.test(html) ? grafikAdimlari(html, c, gorunurUzunluk(html) ? htmlKonusma(html) : '') : null;
    if (gg) { this.adimlar.push.apply(this.adimlar, gg); return; }
    this.adimlar.push({ h: [{ c: c, html: html }], s: konusma });
  };
  IcerikYapici.prototype.paragraf = function (html, sinif) {
    var self = this;
    String(html).split(/<br\s*\/?>/i).forEach(function (satir) {
      var pg = ++pgSayac, once = self.adimlar.length;
      if (gorunurUzunluk(satir)) paragrafParcalari(satir.trim()).forEach(function (p, i) { self.ekle(p, i && /^li/.test(sinif || '') ? 'lid' : (sinif || '')); });
      for (var k = once; k < self.adimlar.length; k++) if (!self.adimlar[k].grafik) self.adimlar[k].pg = pg;
    });
  };
  IcerikYapici.prototype.cocuklar = function (n) { var self = this; Array.prototype.slice.call(n.childNodes).forEach(function (c) { self.dugum(c); }); };
  IcerikYapici.prototype.dugum = function (n) {
    if (n.nodeType === 3) { var t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) this.paragraf(esc(t)); return; }
    if (n.nodeType !== 1) return;
    var ust = n.tagName.toUpperCase(), cls = sinifi(n), oc = n.getAttribute('onclick') || '';
    if (ATLA_ETIKET.test(ust) || gorunmez(n) || ATLA_SINIF.test(cls) || /molToggle\(/.test(oc)) return;
    if (/^H[1-6]$/.test(ust) || /(^|\s)(slbl|baslik|alt-baslik)(\s|$)/.test(cls)) { var bh = dugmesizKopya(n).innerHTML; if (gorunurUzunluk(bh)) this.ekle(bh, 'alt'); return; }
    if (ust === 'TABLE') { this.ekle(n.outerHTML, '', 'Tabloya bakalım. ' + konusmaMetni(tabloOkunus(n))); return; }
    if (ust === 'SVG' || ust === 'IMG' || ust === 'CANVAS') { this.gorsel(n); return; }
    if (ust === 'FIGURE') { this.sekil(n); return; }
    if (ust === 'UL' || ust === 'OL') { this.liste(n, 'li'); return; }
    if (/(^|\s)ornek(\s|$)/.test(cls) && n.querySelector('.cozum')) { this.ornek(n); return; }
    if (/(^|\s)(blokform|denklem)(\s|$)/.test(cls)) { this.ekle(n.innerHTML, 'eq'); return; }
    if ((NOT_SINIF.test(cls) || ust === 'BLOCKQUOTE') && !this.not) { this.notKutusu(n); return; }
    if (/(^|\s)(tablo-kap|tablo-sar)(\s|$)/.test(cls)) { var tb = n.querySelector('table'); if (tb) { this.dugum(tb); return; } }
    if (blokVarMi(n)) { this.cocuklar(n); return; }
    this.paragraf(n.innerHTML);
  };
  IcerikYapici.prototype.gorsel = function (n) {
    var html;
    if (n.tagName.toUpperCase() === 'CANVAS') { try { if (!n.width || !n.height) return; html = '<img src="' + n.toDataURL('image/png') + '" alt="">'; } catch (e) { return; } }
    else html = n.outerHTML;
    this.ekle(html, 'sekil', 'Şekle bakalım.');
  };
  IcerikYapici.prototype.sekil = function (f) {
    var cap = f.querySelector('figcaption'), capT = cap ? yaziMetni(cap) : '', html = '';
    Array.prototype.forEach.call(f.childNodes, function (c) {
      if (c === cap || c.nodeType !== 1) return;
      if (c.tagName.toUpperCase() === 'CANVAS') { try { html += '<img src="' + c.toDataURL('image/png') + '" alt="">'; } catch (e) {} }
      else html += c.outerHTML;
    });
    if (capT) html += '<div class="altyazi-sekil">' + esc(capT) + '</div>';
    this.ekle(html, 'sekil', 'Şekle bakalım.' + (capT ? ' ' + konusmaMetni(capT) : ''));
  };
  IcerikYapici.prototype.liste = function (n, sinif) {
    var self = this, sira = 0, numarali = n.tagName.toUpperCase() === 'OL';
    Array.prototype.forEach.call(n.children, function (li) {
      if (li.tagName.toUpperCase() !== 'LI' || gorunmez(li) || ATLA_SINIF.test(sinifi(li))) return;
      sira++;
      var satir = '', bloklar = [];
      Array.prototype.forEach.call(li.childNodes, function (c) {
        if (c.nodeType === 1 && BLOK_ETIKET.test(c.tagName.toUpperCase())) bloklar.push(c);
        else if (c.nodeType === 3) satir += esc(c.nodeValue);
        else if (c.nodeType === 1 && !ATLA_ETIKET.test(c.tagName.toUpperCase())) satir += c.outerHTML;
      });
      if (gorunurUzunluk(satir)) self.paragraf((numarali ? sira + '. ' : '') + satir.trim(), numarali ? 'lid' : sinif);
      bloklar.forEach(function (b) { if (/^(UL|OL)$/.test(b.tagName.toUpperCase())) self.liste(b, 'li2'); else self.dugum(b); });
    });
  };
  IcerikYapici.prototype.notKutusu = function (n) {
    this.not = true; this.notIlk = true;
    var ilk = n.firstChild; while (ilk && ilk.nodeType === 3 && !ilk.nodeValue.trim()) ilk = ilk.nextSibling;
    if (ilk && ilk.nodeType === 1 && /^(B|STRONG)$/.test(ilk.tagName.toUpperCase()) && !blokVarMi(n)) {
      this.ekle('<b>' + ilk.innerHTML + '</b>', '');
      var kalan = ''; for (var c = ilk.nextSibling; c; c = c.nextSibling) kalan += c.nodeType === 3 ? esc(c.nodeValue) : (c.nodeType === 1 ? c.outerHTML : '');
      this.paragraf(kalan);
    } else this.cocuklar(n);
    this.not = false; this.notIlk = false;
  };
  IcerikYapici.prototype.ornek = function (n) {
    var self = this, et = n.querySelector('.etiket'), metin = n.querySelector('.metin'), coz = n.querySelector('.cozum'), ilk = true, sb = this.adimlar.length, cb;
    this.ekle(esc(et ? yaziMetni(et) : 'Örnek'), 'label');
    if (metin) satirlaraBol(metin).forEach(function (h) { self.ekle(h, ilk ? 'q' : 'qd'); ilk = false; });
    cb = this.adimlar.length;
    if (coz) { this.ekle('Çözüm', 'label', 'Çözüme bakalım.'); satirlaraBol(coz).forEach(function (h) { self.paragraf(h); }); }
    if (this.adimlar.length > sb) grupla(this.adimlar, sb, cb, this.adimlar.length);
  };
  // bolumler: [{ ad, dugumler: [düğüm...] }] → bölümlü ders
  function icerikDers(o) {
    var adimlar = [], bolumler = [];
    (o.bolumler || []).forEach(function (b) {
      var y = new IcerikYapici();
      b.dugumler.forEach(function (n) { y.dugum(n); });
      if (y.adimlar.length < (o.enAz || 1)) return;
      bolumler.push({ ad: b.ad, adim: adimlar.length, el: b.el || null });
      var bs = konusmaMetni(b.ad); if (!/[.!?:]$/.test(bs)) bs += '.';
      adimlar.push({ sil: 1, sahne: null, h: [{ c: 'title', html: esc(b.ad) }], s: bs });
      adimlar.push.apply(adimlar, y.adimlar);
    });
    if (!adimlar.length) return null;
    return { id: o.id || ('ic-' + ozet(o.baslik + adimlar.length)), baslik: o.baslik, adimlar: adimlar, bolumler: bolumler, dugme: 'Anlatımı başlat' };
  }
  // Kapsayıcının çocuklarını başlıklara (H3 ya da H2) ve başlıklı kartlara göre bölümlere ayır
  function bolumlereAyir(kok, baslik, opt) {
    opt = opt || {};
    var etiket = opt.etiket || 'H3', bolumler = [], cur = { ad: baslik, dugumler: [], el: null };
    var kapat = function () { if (cur.dugumler.length) bolumler.push(cur); };
    Array.prototype.forEach.call(kok.childNodes, function (c) {
      if (c.nodeType === 3) { if (c.nodeValue.trim()) cur.dugumler.push(c); return; }
      if (c.nodeType !== 1 || gorunmez(c) || /(^|\s)(sd-anlat|sd-arac)(\s|$)/.test(sinifi(c))) return;
      var ust = c.tagName.toUpperCase();
      if (ust === etiket) { kapat(); cur = { ad: opt.ad ? opt.ad(c) : basliksizMetin(c), dugumler: [], el: c }; return; }
      if (opt.kart && /(^|\s)card(\s|$)/.test(sinifi(c))) {
        if (c.querySelector('[onclick^="molToggle("]')) return;
        var lbl = null; for (var x = c.firstElementChild; x; x = x.nextElementSibling) if (/(^|\s)slbl(\s|$)/.test(sinifi(x))) { lbl = x; break; }
        if (lbl) {
          kapat();
          cur = { ad: basliksizMetin(lbl), dugumler: Array.prototype.filter.call(c.childNodes, function (y) { return y !== lbl; }), el: c };
          kapat(); cur = { ad: baslik, dugumler: [], el: null };
          return;
        }
      }
      cur.dugumler.push(c);
    });
    kapat();
    return bolumler;
  }
  // banka verisindeki konu nesnesi { ad, anlatim, ornek } → ders (örnekler bölümlerine yerleşir)
  function konuVerisindenDers(k, onEk) {
    var html = k.anlatim || '', ornek = k.ornek || [], parca = html.split(/(?=<h3[\s>])/), no = 0;
    var kutu = function (x) { no++; return '<div class="ornek"><div class="etiket">Çözümlü örnek ' + no + '</div><div class="metin">' + x.s + '</div><div class="cozum">' + x.c + '</div></div>'; };
    var bolumlu = ornek.some(function (x) { return typeof x.b === 'number'; }), ilkVar = !/^\s*<h3/.test(parca[0]);
    if (bolumlu) {
      html = parca.map(function (p, i) { var bi = ilkVar ? i - 1 : i; return p + ornek.filter(function (x) { return x.b === bi; }).map(kutu).join(''); }).join('');
      html += ornek.filter(function (x) { return typeof x.b !== 'number'; }).map(kutu).join('');
    } else if (ornek.length) html += '<h3>Çözümlü örnekler</h3>' + ornek.map(kutu).join('');
    var d = document.createElement('article'); d.innerHTML = html;
    return icerikDers({ id: 'rb-' + (k.id || ozet(k.ad)), baslik: (onEk || '') + k.ad, bolumler: bolumlereAyir(d, k.ad) });
  }

  /* ================= tahta, kalem ve yazı seçenekleri ================= */
  var TAHTALAR = {
    beyaz: { ad: 'Beyaz tahta', kalem: 'marker', zemin: '#FFFFFF', cerceve: 'metal', koyu: false, izgara: false },
    kareli: { ad: 'Kareli tahta', kalem: 'marker', zemin: '#FFFFFF', cerceve: 'metal', koyu: false, izgara: true },
    kara: { ad: 'Kara tahta', kalem: 'tebesir', zemin: '#262B2D', cerceve: 'ahsap', koyu: true },
    yesil: { ad: 'Yeşil tahta', kalem: 'tebesir', zemin: '#2D5A44', cerceve: 'ahsap', koyu: true },
    mavi: { ad: 'Mavi tahta', kalem: 'tebesir', zemin: '#22466F', cerceve: 'metal', koyu: true },
    akilli: { ad: 'Akıllı tahta', kalem: 'dijital', zemin: '#FCFDFF', cerceve: 'siyah', koyu: false }
  };
  var KALEMLER = {
    marker: { ad: 'Keçeli kalem', renkler: [['Siyah', '#1F2733'], ['Mavi', '#1E4FB4'], ['Kırmızı', '#D3202E'], ['Yeşil', '#17784A'], ['Mor', '#6D3FC0']],
      vurgu: { mavi: '#1E4FB4', kirmizi: '#D3202E', yesil: '#17784A', turuncu: '#E04E00', mor: '#6D3FC0', gri: '#5B6B7C' } },
    tebesir: { ad: 'Tebeşir', renkler: [['Beyaz', '#F4F2EC'], ['Sarı', '#FFE48A'], ['Pembe', '#FFB6C8'], ['Açık mavi', '#BEE3FF'], ['Yeşil', '#C9F0B9']],
      vurgu: { mavi: '#A9D6FF', kirmizi: '#FF9FB2', yesil: '#B6EBA8', turuncu: '#FFD27A', mor: '#D9BEFF', gri: '#C3C9CE' } },
    dijital: { ad: 'Akıllı kalem', renkler: [['Siyah', '#111827'], ['Mavi', '#2563EB'], ['Kırmızı', '#E11D48'], ['Yeşil', '#059669'], ['Mor', '#7C3AED']],
      vurgu: { mavi: '#2563EB', kirmizi: '#E11D48', yesil: '#059669', turuncu: '#EA580C', mor: '#7C3AED', gri: '#64748B' } }
  };
  var YAZILAR = [
    { id: 'caveat', ad: 'El yazısı', aile: '"Caveat"', css: 'Caveat:wght@500;700', olcek: 1 },
    { id: 'kalam', ad: 'Keçeli yazı', aile: '"Kalam"', css: 'Kalam:wght@400;700', olcek: 0.8 },
    { id: 'patrick', ad: 'Düzgün el yazısı', aile: '"Patrick Hand"', css: 'Patrick+Hand', olcek: 0.86 },
    { id: 'playpen', ad: 'Okul yazısı', aile: '"Playpen Sans"', css: 'Playpen+Sans:wght@400;700', olcek: 0.74 },
    { id: 'shantell', ad: 'Yuvarlak yazı', aile: '"Shantell Sans"', css: 'Shantell+Sans:wght@400;700', olcek: 0.74 },
    { id: 'duz', ad: 'Düz yazı', aile: 'system-ui', css: null, olcek: 0.72 }
  ];
  var yuklenenYazi = {};
  function yaziYukle(y) {
    if (!y.css || yuklenenYazi[y.id]) return;
    yuklenenYazi[y.id] = 1;
    try {
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + y.css + '&display=swap';
      document.head.appendChild(l);
    } catch (e) {}
  }
  var TARZLAR = [
    { ad: 'Sakin', hiz: 0.95, ton: 1.0, ara: 450 },
    { ad: 'Enerjik', hiz: 1.08, ton: 1.12, ara: 250 },
    { ad: 'Yavaş ve net', hiz: 0.82, ton: 1.0, ara: 700 },
    { ad: 'Hikâye gibi', hiz: 0.9, ton: 0.94, ara: 650 }
  ];
  var ayar = {
    tahta: depo.al('tahta', 'beyaz'), kalem: depo.al('kalem', null), renk: depo.al('renk', 0), yazi: depo.al('yazi', 'caveat'),
    cins: depo.al('cins', 'k'), sesAdi: depo.al('ses', ''), kaynak: depo.al('kaynak', null), bulutSes: depo.al('bulutSes', ''),
    ikili: !!depo.al('ikili', false), bulutSesK: depo.al('bulutSesK', ''), bulutSesE: depo.al('bulutSesE', ''), sesAdiK: depo.al('sesAdiK', ''), sesAdiE: depo.al('sesAdiE', ''),
    tarz: Math.min(3, depo.al('tarz', 0)), hiz: depo.al('hiz', 1), ogretmen: depo.al('ogretmen', true), duzen: depo.al('duzen', 'normal'), buyukluk: depo.al('buyukluk', 1)
  };
  if (!TAHTALAR[ayar.tahta]) ayar.tahta = 'beyaz';
  function kalemTuru() { return KALEMLER[ayar.kalem] ? ayar.kalem : TAHTALAR[ayar.tahta].kalem; }

  /* ================= ses motoru ================= */
  // Doğal sesin MP3'ü çözülür, başına sessizlik eklenip WAV olarak çalınır (bkz. Ses.dolgulu)
  var dolguBaglam = null;
  function dolguCoz(buf) {
    return new Promise(function (ok, red) {
      try {
        if (!dolguBaglam) {
          var O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          if (!O) { red(new Error('çözücü yok')); return; }
          try { dolguBaglam = new O(1, 1, 24000); } catch (e) { dolguBaglam = new O(1, 1, 44100); }
        }
        var p = dolguBaglam.decodeAudioData(buf, ok, red);
        if (p && p.then) p.then(ok, red);
      } catch (e) { red(e); }
    });
  }
  function dolguWav(v, sr, onSn) { // tek kanal Float32 → 16 bit WAV; başına onSn saniye sessizlik
    var on = Math.round((onSn || 0) * sr), n = on + v.length, b = new ArrayBuffer(44 + n * 2), d = new DataView(b), i;
    var yaz = function (o, s) { for (var k = 0; k < s.length; k++) d.setUint8(o + k, s.charCodeAt(k)); };
    yaz(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVE'); yaz(12, 'fmt '); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, sr, true); d.setUint32(28, sr * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); yaz(36, 'data'); d.setUint32(40, n * 2, true);
    for (i = 0; i < v.length; i++) { var x = v[i] > 1 ? 1 : v[i] < -1 ? -1 : v[i]; d.setInt16(44 + (on + i) * 2, x < 0 ? x * 0x8000 : x * 0x7FFF, true); }
    return new Blob([b], { type: 'audio/wav' });
  }
  var Ses = {
    var: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    tr: [], tut: [], ses: null, oranFn: null, acik: false,
    yukle: function () {
      if (!this.var) return;
      var v = speechSynthesis.getVoices() || [];
      this.tr = v.filter(function (x) { return /^tr([-_]|$)/i.test(x.lang || '') || /t[uü]rk/i.test(x.name || ''); });
    },
    cinsi: function (v) {
      var n = ((v.name || '') + ' ' + (v.voiceURI || '')).toLowerCase();
      if (/yelda|emel|seda|filiz|zeynep|elif|ay[sş]e|female|kad[ıi]n|google t[uü]rk/.test(n)) return 'k';
      if (/tolga|ahmet|\bcem\b|mehmet|kerem|murat|erkek|\bmale\b/.test(n)) return 'e';
      return '?';
    },
    dogal: function (v) { return /natural|online|neural|premium|enhanced|geli[sş]mi[sş]|wavenet|studio/i.test((v.name || '') + ' ' + (v.voiceURI || '')); },
    ad: function (v) {
      var n = (v.name || '').replace(/\s*\((Turkish|Türkçe)[^)]*\)\s*/i, ' ').replace(/Microsoft\s+/i, '').replace(/\s+-\s+Turkish.*$/i, '').replace(/Online\s*\(Natural\)/i, '').replace(/\s{2,}/g, ' ').trim();
      return n || v.voiceURI || 'Türkçe ses';
    },
    sec: function (cins, ad) {
      cins = cins || ayar.cins; if (ad === undefined) ad = Izin.ogretmen() ? ayar.sesAdi : '';
      if (this.var && !this.tr.length) this.yukle();
      var self = this, list = this.tr;
      if (!this.var) return { ses: null, ton: 1, not: 'Bu tarayıcı sesli okumayı desteklemiyor. Ders altyazıyla oynatılıyor.' };
      if (!list.length) return { ses: null, ton: 1, not: 'Bu cihazda Türkçe ses bulunamadı. Ders altyazıyla oynatılıyor; cihazın ses ayarlarından Türkçe ses eklenebilir.' };
      if (ad) { var el = list.filter(function (v) { return v.voiceURI === ad; })[0]; if (el) return { ses: el, ton: 1, not: '' }; }
      var sirala = function (a) { return a.slice().sort(function (x, y) { return (self.dogal(y) - self.dogal(x)) || (y.localService - x.localService); })[0]; };
      var uygun = list.filter(function (v) { return self.cinsi(v) === cins; });
      if (uygun.length) return { ses: sirala(uygun), ton: 1, not: '' };
      var bilinmeyen = list.filter(function (v) { return self.cinsi(v) === '?'; });
      if (bilinmeyen.length) return { ses: sirala(bilinmeyen), ton: cins === 'e' ? 0.82 : 1.06, not: 'Seslerin adından kadın mı erkek mi olduğu anlaşılamadı; listeden başka bir ses deneyebilirsin.' };
      return { ses: sirala(list), ton: cins === 'e' ? 0.72 : 1.18,
        not: cins === 'e' ? 'Bu cihazda erkek Türkçe ses yok; kadın sesi daha kalın tonda kullanılıyor. Gerçek erkek sesi doğal seslerle (ses servisi) gelir.' : 'Bu cihazda kadın Türkçe ses yok; erkek sesi daha ince tonda kullanılıyor.' };
    },
    sure: function (metin, hiz) { return metin.length / (14.5 * hiz) * 1000 + 350; },
    parcala: function (metin) { // uzun metni ~200 karakterlik parçalara böl (bazı tarayıcılar uzun cümleyi yarıda keser)
      var out = [], kalan = metin, MAX = 200;
      while (kalan.length > MAX) {
        var bolge = kalan.slice(0, MAX), kes = -1, m, re = /[.!?;:](\s|$)/g;
        while ((m = re.exec(bolge))) kes = m.index + 1;
        if (kes < 25) { var v = bolge.lastIndexOf(', '); kes = v > 25 ? v + 1 : -1; }
        if (kes < 25) { var bo = bolge.lastIndexOf(' '); kes = bo > 25 ? bo : MAX; }
        out.push(kalan.slice(0, kes)); kalan = kalan.slice(kes);
      }
      if (kalan.trim()) out.push(kalan);
      return out;
    },
    // metni seslendir; kayıt varsa onu çal. olay: basla(sure, sinirVar), sinir(ci, cl)
    konus: function (metin, olay, kayit, sesSecimi) {
      var self = this, t = TARZLAR[ayar.tarz], hiz = Math.max(0.5, Math.min(2, t.hiz * ayar.hiz));
      this.oranFn = null;
      if (kayit && kayit.url) {
        return new Promise(function (bitir) {
          // Doğal seste cümlenin başına kısa sessizlik eklenir (bkz. Ses.dolgulu); ilerleme konuşmanın başladığı andan sayılır
          var a = null, bitti = false, zaman, oran, oh = kayit.bulut ? hiz : Math.max(0.5, Math.min(2, ayar.hiz)), pd = 0;
          var son = function (n) {
            if (bitti) return; bitti = true; clearTimeout(zaman);
            if (self.oranFn === oran) self.oranFn = null;
            if (a) a.onended = a.onerror = a.onloadedmetadata = null;
            self.sonDolgu = pd / oh;
            if (n === 'bitti' && self.surekli) self.isit();
            bitir(n);
          };
          var surele = function (sn) { clearTimeout(zaman); zaman = setTimeout(function () { son('zaman'); }, sn * 1000); };
          oran = function () {
            if (!a) return 0;
            var d = isFinite(a.duration) && a.duration > 0 ? a.duration : (kayit.sure || 3) + pd;
            return Math.max(0, Math.min(1, (a.currentTime - pd) / Math.max(0.1, d - pd)));
          };
          self.oranFn = oran;
          self.kayitBitir = function () { son('iptal'); };
          surele(45);
          (kayit.bulut ? self.dolgulu(kayit.url) : Promise.resolve(null)).then(function (dg) {
            if (bitti) return;
            a = self.ortak(); self.ses = a; pd = dg ? dg.pad : 0;
            a.onloadedmetadata = function () { var d = isFinite(a.duration) ? a.duration : (kayit.sure || 3) + pd; olay.basla && olay.basla((d - pd) / oh * 1000, false); surele(d / oh + 10); };
            a.onended = function () { son('bitti'); };
            a.onerror = function () { son('hata'); };
            a.loop = false;
            a.src = dg ? dg.url : kayit.url;
            try { a.defaultPlaybackRate = oh; a.playbackRate = oh; } catch (e) {}
            var p = a.play(); if (p && p.catch) p.catch(function () { son('hata'); });
            surele(kayit.sure ? kayit.sure / oh + 10 : 45);
          });
        });
      }
      var s = this.sec(sesSecimi && sesSecimi.cins, sesSecimi ? sesSecimi.ad : undefined);
      return new Promise(function (bitir) {
        var bitti = false, nob;
        var son = function (n) { if (bitti) return; bitti = true; clearTimeout(nob); bitir(n); };
        if (!s.ses) {
          var tahmin = self.sure(metin, hiz);
          olay.basla && olay.basla(tahmin, false);
          self.sahte = { iptal: function () { son('iptal'); } };
          nob = setTimeout(function () { son('bitti'); }, tahmin);
          return;
        }
        var parcalar = self.parcala(metin), ofset = 0, i = 0, basladi = false;
        var sonraki = function () {
          if (bitti) return;
          if (i >= parcalar.length) { son('bitti'); return; }
          var parca = parcalar[i], buOfset = ofset;
          var u = new SpeechSynthesisUtterance(parca);
          u.lang = s.ses.lang || 'tr-TR'; u.voice = s.ses; u.rate = hiz; u.pitch = Math.max(0.1, Math.min(2, t.ton * s.ton));
          u.onstart = function () { if (!basladi) { basladi = true; olay.basla && olay.basla(self.sure(metin, hiz), true); } };
          u.onboundary = function (e) { if (e.name === 'word' || e.name == null) olay.sinir && olay.sinir(buOfset + e.charIndex, e.charLength || 0); };
          u.onend = function () { i++; ofset += parca.length; sonraki(); };
          u.onerror = function (e) { son('hata:' + (e && e.error)); };
          self.tut.push(u); if (self.tut.length > 40) self.tut.shift();
          speechSynthesis.speak(u);
        };
        nob = setTimeout(function () { son('zaman'); }, self.sure(metin, hiz) * 2.4 + 5000 * parcalar.length);
        sonraki();
      });
    },
    sus: function () {
      this.isitDur();
      if (this.sahte) { this.sahte.iptal(); this.sahte = null; }
      if (this.ses) { try { this.ses.pause(); } catch (e) {} this.ses = null; }
      if (this.kayitBitir) { var f = this.kayitBitir; this.kayitBitir = null; f(); }
      this.oranFn = null;
      if (this.var) { try { speechSynthesis.cancel(); } catch (e) {} }
    },
    // iPhone'da ses dosyası yalnızca dokunuşla açılmış bir oynatıcıdan çalar: tek oynatıcı, ilk dokunuşta açılır
    ortak: function () {
      if (!this.oynatici) { this.oynatici = new Audio(); this.oynatici.preload = 'auto'; try { this.oynatici.setAttribute('playsinline', ''); } catch (e) {} }
      if (this.isitiyor) { this.isitiyor = false; this.oynatici.loop = false; } // sessiz döngü biter, yeni ses hemen başlar
      return this.oynatici;
    },
    /* Cümle başı kesilmesin. Telefon, Bluetooth hoparlör ya da akıllı tahtanın sesi bir cümle bitince uykuya geçer;
       sonraki cümle başlarken ses yolu yeniden açılana kadar ilk kelimeler duyulmaz. İki önlem:
       1) doğal sesin her cümlesinin başına kısa bir sessizlik eklenir (kesilen kısım sessizlik olur),
       2) ders oynarken cümle aralarında duyulmayacak kadar kısık bir ses döngüsü çalar, ses yolu kapanmaz. */
    DOLGU: 0.4, dolguBellek: {}, dolguSira: [], surekli: false, sonDolgu: 0,
    dolgulu: function (url) {
      var self = this;
      if (!url) return Promise.resolve(null);
      if (this.dolguBellek[url]) return this.dolguBellek[url];
      var p = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(dolguCoz).then(function (ab) {
        return { url: URL.createObjectURL(dolguWav(ab.getChannelData(0), ab.sampleRate, self.DOLGU)), pad: self.DOLGU };
      }).catch(function () { return null; });
      this.dolguBellek[url] = p; this.dolguSira.push(url);
      while (this.dolguSira.length > 6) {
        var eski = this.dolguSira.shift(), ep = this.dolguBellek[eski]; delete this.dolguBellek[eski];
        if (ep) ep.then(function (k) { if (k) setTimeout(function () { URL.revokeObjectURL(k.url); }, 60000); });
      }
      return p;
    },
    isit: function () {
      if (!this.sesAcik || this.isitiyor) return;
      var a = this.ortak();
      if (!this.sessizUrl) { var n = 11025, v = new Float32Array(n); for (var i = 0; i < n; i++) v[i] = (Math.random() - 0.5) * 0.00006; this.sessizUrl = URL.createObjectURL(dolguWav(v, 22050, 0)); }
      try {
        a.onended = a.onerror = a.onloadedmetadata = null; a.loop = true; a.src = this.sessizUrl;
        try { a.defaultPlaybackRate = 1; a.playbackRate = 1; } catch (e) {}
        var p = a.play(); if (p && p.catch) p.catch(function () {});
        this.isitiyor = true;
      } catch (e) {}
    },
    isitDur: function () {
      if (!this.isitiyor) return;
      this.isitiyor = false;
      var a = this.oynatici; if (a) { a.loop = false; try { a.pause(); } catch (e) {} }
    },
    kilidiAc: function () {
      if (!this.sesAcik) {
        try {
          var a = this.ortak();
          a.src = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACA' + new Array(134).join('gICA');
          var p = a.play(); if (p && p.catch) p.catch(function () {});
          this.sesAcik = true;
        } catch (e) {}
      }
      if (!this.var || this.acik) return;
      try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); this.acik = true; } catch (e) {}
    }
  };
  if (Ses.var) {
    Ses.yukle();
    try { speechSynthesis.addEventListener('voiceschanged', function () { Ses.yukle(); Oynatici.hepsi.forEach(function (o) { o.sesListesi(); }); }); } catch (e) {}
  }

  /* ================= mikrofon kaydı ================= */
  var Kaydedici = {
    var: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    basla: function () {
      return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (akis) {
        var tip = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } })[0];
        var secenek = { audioBitsPerSecond: 64000 }; if (tip) secenek.mimeType = tip;
        var mr; try { mr = new MediaRecorder(akis, secenek); } catch (e) { mr = tip ? new MediaRecorder(akis, { mimeType: tip }) : new MediaRecorder(akis); }
        var parcalar = [], t0 = performance.now();
        mr.ondataavailable = function (e) { if (e.data && e.data.size) parcalar.push(e.data); };
        mr.start(250);
        return {
          durdur: function () {
            return new Promise(function (res) {
              mr.onstop = function () {
                akis.getTracks().forEach(function (t) { t.stop(); });
                var blob = new Blob(parcalar, { type: mr.mimeType || tip || 'audio/webm' });
                res({ blob: blob, sure: (performance.now() - t0) / 1000, mime: blob.type });
              };
              try { mr.stop(); } catch (e) { res(null); }
            });
          }
        };
      });
    }
  };
  function kayitUzanti(mime) { return /mp4|m4a|aac/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm'; }
  function indir(blob, ad) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = ad; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  /* ================= görünüm: biçem ve şablon ================= */
  var TEBESIR_MASKE = '', TEBESIR_TOZ = '';
  var CSS = [
    ':host{all:initial;display:block}',
    '*{box-sizing:border-box}',
    '.sd{--kagit:#FBF8F5;--kart:#FFFFFF;--murekkep:#14110F;--gri:#5C554F;--cizgi:#E7E0D9;--turuncu:#F85300;--turuncu-y:#FFF1E9;--turuncu-k:#C24100;--odak:#0B5C8A;',
    '  --ui:"Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,"Helvetica Neue",Arial,sans-serif;font-family:var(--ui);font-size:16px;line-height:1.55;color:var(--murekkep);-webkit-text-size-adjust:100%}',
    '.sd[data-tema="koyu"]{--kagit:#16130F;--kart:#1F1B17;--murekkep:#F2ECE6;--gri:#B5ABA1;--cizgi:#3A342E;--turuncu:#FF7633;--turuncu-y:#3B2316;--turuncu-k:#FF9A66;--odak:#7FB7DD;color-scheme:dark}',
    'button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer}',
    ':focus-visible{outline:3px solid var(--odak);outline-offset:2px}[hidden]{display:none!important}',
    /* pencere ve gömülü düzen */
    '.sd[data-mod="pencere"]{position:fixed;inset:0;background:rgba(20,17,15,.6);display:flex;align-items:flex-start;justify-content:center;overflow:auto;overscroll-behavior:contain;',
    '  padding:max(10px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px))}',
    '.sd-panel{background:var(--kagit);border-radius:16px;width:min(1180px,100%);padding:14px;display:grid;gap:12px;box-shadow:0 24px 60px -24px rgba(0,0,0,.7);margin:auto 0;container:sdpanel/inline-size}',
    '.sd[data-mod="satir"] .sd-panel{background:transparent;padding:0;box-shadow:none;border-radius:0;width:100%}',
    '.sd-ust{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.sd-ust h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em;flex:1 1 180px;min-width:0;overflow-wrap:anywhere}',
    '.sd-sekmeler{display:flex;gap:4px;padding:4px;background:var(--kart);border:1px solid var(--cizgi);border-radius:999px;max-width:100%;overflow-x:auto}',
    '.sd-sekmeler button{border:0;background:transparent;padding:7px 14px;border-radius:999px;font-weight:600;color:var(--gri);white-space:nowrap;font-size:14px}',
    '.sd-sekmeler button[aria-selected="true"]{background:var(--murekkep);color:var(--kagit)}',
    '@container sdpanel (max-width:560px){.sd-ust .sd-sekmeler{width:100%}.sd-ust .sd-sekmeler button{flex:1 1 0;padding:7px 6px}}',
    '.sd-kucuk{border:1px solid var(--cizgi);background:var(--kart);border-radius:999px;padding:7px 12px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px}',
    '.sd-kucuk[aria-pressed="true"]{background:var(--murekkep);color:var(--kagit);border-color:var(--murekkep)}',
    '@container sdpanel (max-width:480px){.sd[data-mod="pencere"] .sd-ust .sd-kucuk .etk{display:none}.sd[data-mod="pencere"] .sd-ust .sd-kucuk{padding:9px}.sd-ust h2{font-size:16px}}',
    '@container sdpanel (max-width:420px){.sd-alan .sd-oynatici{gap:4px}.sd-oynatici .yv{width:40px;height:40px}.sd-oynatici .yv.ana{width:50px;height:50px}.sd-oynatici .sd-ilerleme{flex-basis:52px;min-width:52px}}',
    '.sd-duzen{display:grid;gap:16px;align-items:start}',
    '@container sdpanel (min-width:1000px){.sd[data-mod="satir"] .sd-duzen{grid-template-columns:minmax(0,1fr) 330px}.sd[data-mod="pencere"].ayar-acik .sd-duzen{grid-template-columns:minmax(0,1fr) 320px}}',
    '.sd[data-mod="pencere"]:not(.ayar-acik) .sd-yan{display:none}',
    '.sd-alan{min-width:0;display:grid;gap:10px}',
    /* tahta çerçevesi */
    '.sd-cerceve{position:relative;padding:9px 9px 0;border-radius:12px;background:linear-gradient(180deg,#E4E7EB,#B9C0C8);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 10px 24px -14px rgba(20,17,15,.45)}',
    '.sd-cerceve[data-cerceve="ahsap"]{background:linear-gradient(180deg,#9A6A3C,#6E4724);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),0 10px 24px -14px rgba(20,17,15,.55)}',
    '.sd-cerceve[data-cerceve="ahsap"]::before{content:"";position:absolute;inset:0;border-radius:12px;pointer-events:none;opacity:.35;background:repeating-linear-gradient(95deg,rgba(255,255,255,.08) 0 2px,transparent 2px 9px),repeating-linear-gradient(80deg,rgba(0,0,0,.12) 0 1px,transparent 1px 13px)}',
    '.sd-cerceve[data-cerceve="siyah"]{background:linear-gradient(180deg,#2A2F36,#16191D);padding:12px 12px 0}',
    '.sd-tahta{position:relative;aspect-ratio:1/1;background:var(--zemin,#fff);border-radius:4px;overflow:hidden;container-type:inline-size;box-shadow:inset 0 0 0 1px rgba(120,130,140,.35),inset 0 3px 10px rgba(30,40,55,.08)}',
    '@container sdpanel (min-width:560px){.sd-tahta{aspect-ratio:4/3}}@container sdpanel (min-width:700px){.sd-tahta{aspect-ratio:16/10}}@container sdpanel (min-width:1300px){.sd-tahta{aspect-ratio:16/9}}',
    '.sd[data-mod="pencere"] .sd-cerceve{width:100%;max-width:max(300px,calc((100vh - 250px) * 1.6));margin:0 auto}',
    '@supports (height:100dvh){.sd[data-mod="pencere"] .sd-cerceve{max-width:max(300px,calc((100dvh - 250px) * 1.6))}}',
    '.sd-doku{position:absolute;inset:0;pointer-events:none}',
    '.sd-tahta[data-izgara="1"] .sd-doku{background-image:linear-gradient(rgba(70,120,170,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,170,.16) 1px,transparent 1px);background-size:4cqw 4cqw}',
    '.sd-tahta.koyu .sd-doku{opacity:.5;background:radial-gradient(60% 40% at 30% 30%,rgba(255,255,255,.06),transparent 70%),radial-gradient(50% 35% at 75% 70%,rgba(255,255,255,.05),transparent 70%)}',
    '.sd-tahta.koyu .sd-doku::after{content:"";position:absolute;inset:0;background-image:var(--toz);opacity:.5}',
    '.sd-tahta[data-cerceve="siyah"]{box-shadow:inset 0 0 0 1px #0E1013,inset 0 0 18px rgba(0,0,0,.12)}',
    '.sd-tahta[data-cerceve="siyah"]::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.22) 0 18%,transparent 18% 100%)}',
    '.sd-iz{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;background:linear-gradient(100deg,transparent 5%,rgba(255,255,255,.55) 30%,rgba(255,255,255,.3) 55%,transparent 80%)}',
    '.sd-tahta:not(.koyu) .sd-iz{display:none}',
    '.sd-raf{height:16px;margin:0 -9px;border-radius:0 0 12px 12px;background:linear-gradient(180deg,#C7CDD3,#AEB5BD);position:relative}',
    '.sd-cerceve[data-cerceve="ahsap"] .sd-raf{background:linear-gradient(180deg,#7B5230,#5A3A1E)}',
    '.sd-cerceve[data-cerceve="siyah"] .sd-raf{margin:0 -12px;height:22px;background:linear-gradient(180deg,#1C2025,#111317)}',
    '.sd-raf i{position:absolute;bottom:7px;height:6px;border-radius:3px}',
    /* yazı katmanı */
    '.sd-ic{position:absolute;inset:0;padding:4.6cqw 4.5cqw 4cqw 5.2cqw}',
    '@container (min-width:640px){.sd-ic{padding:3.6cqw 3.5cqw 3cqw 4cqw}}',
    '.sd-yer1{float:right;width:0;height:calc(100% - 20cqw)}.sd-yer2{float:right;clear:right;width:15.5cqw;height:20cqw}',
    '@container (min-width:640px){.sd-yer1{height:calc(100% - 15.5cqw)}.sd-yer2{width:11.5cqw;height:15.5cqw}}',
    '.sahneli .sd-yer1,.sahneli .sd-yer2,.ogretmensiz .sd-yer1,.ogretmensiz .sd-yer2{display:none}',
    '.sd-yazi{position:relative;height:100%;overflow:hidden;font-family:var(--aile),"Segoe Print","Bradley Hand","Comic Sans MS",cursive;font-size:21px;font-size:calc(5.8cqw * var(--olcek,1) * var(--sig,1) * var(--buyuk,1));line-height:1.22;color:var(--k-yazi)}',
    '@container (min-width:640px){.sd-yazi{font-size:calc(3.65cqw * var(--olcek,1) * var(--sig,1) * var(--buyuk,1))}}',
    '.sahneli .sd-yazi{height:38%}@container (min-width:640px){.sahneli .sd-yazi{height:100%;width:45%}}',
    '.sd-tahta[data-kalem="tebesir"] .blok .w:not(.w-blok){display:inline-block;-webkit-mask-image:var(--maske);mask-image:var(--maske);-webkit-mask-size:120px 120px;mask-size:120px 120px;text-shadow:0 0 1px rgba(255,255,255,.35),0 0 3px rgba(255,255,255,.12);padding:.2em .05em .3em;margin:-.2em -.05em -.3em}',
    '.sd-tahta[data-kalem="tebesir"] .blok sub .w:not(.w-blok),.sd-tahta[data-kalem="tebesir"] .blok sup .w:not(.w-blok){line-height:1;vertical-align:baseline}',
    /* tebeşir dokusu kelimenin kutusuna uygulanır: alt ve üst simgeler (CO₂, Kc) kutunun dışına taşıp silinmesin diye kutu dolgu ile genişletildi */
    '.sd-tahta[data-kalem="dijital"] .sd-yazi{text-shadow:0 0 .05em currentColor}',
    '.blok{margin:0 0 .26em;overflow-wrap:anywhere}.blok sub,.blok sup{font-size:.64em;line-height:0}',
    '.w{opacity:0;position:relative}.w.on{opacity:1;animation:yaz .3s ease-out both}',
    '.sd-tahta[data-kalem="tebesir"] .w.on{animation:yazT .42s ease-out both}',
    '.anlik.w.on,.anlik .w.on{animation:none}',
    '@keyframes yaz{from{clip-path:inset(-25% 100% -25% -4%)}to{clip-path:inset(-25% -18% -25% -4%)}}',
    '@keyframes yazT{from{clip-path:inset(-25% 100% -25% -4%);filter:blur(.6px)}to{clip-path:inset(-25% -18% -25% -4%);filter:none}}',
    '.w-blok{display:inline-block;max-width:100%}.w-blok.on{animation:solgun .5s ease-out both}@keyframes solgun{from{opacity:0}to{opacity:1}}',
    '.blok svg,.blok img{max-width:100%;height:auto;max-height:7em;vertical-align:middle}.blok table{border-collapse:collapse;font-size:.62em;font-family:var(--ui);line-height:1.35}.blok td,.blok th{border:1px solid currentColor;padding:.2em .45em;text-align:left}',
    '.b-q svg,.b-q img,.b-qd svg,.b-qd img{max-height:12em}.b-q table,.b-qd table{font-size:.92em}',
    '.koyu .w-blok{background:#fff;border-radius:8px;padding:4px;color:#1F2733}',
    '.b-title{font-size:1.42em;font-weight:700;color:var(--k-turuncu);margin-bottom:.32em}',
    '.b-title .w.on{text-decoration:underline;text-decoration-thickness:.06em;text-underline-offset:.14em}',
    '.b-eq{color:var(--k-mavi);font-weight:700;font-size:.94em}',
    '.b-box{display:inline-block;color:var(--k-turuncu);font-weight:700;padding:.04em .42em .1em;border:.07em solid transparent;border-radius:.35em;transition:border-color .5s}.b-box.acik{border-color:var(--k-turuncu)}',
    '.b-label{color:var(--k-gri);font-size:.8em;font-weight:700;margin-top:.3em;margin-bottom:.06em}',
    '.b-note{color:var(--k-kirmizi);font-weight:700}.b-ok{color:var(--k-yesil);font-weight:700}.b-ozel{color:var(--k-mor);font-weight:700}',
    '.b-q{font-family:var(--ui);font-size:.56em;line-height:1.5;color:#262B32;background:#FFFCEE;border:1px solid #EADFB6;border-radius:6px;padding:.55em .8em .6em 1.6em;position:relative;box-shadow:0 2px 0 rgba(0,0,0,.08);text-shadow:none}',
    '.b-q::before{content:"";position:absolute;left:.55em;top:.75em;width:.6em;height:.6em;border-radius:50%;background:#E04E00;box-shadow:inset -1px -1px 0 rgba(0,0,0,.25)}',
    '.b-q .w-blok,.b-qd .w-blok{background:transparent;padding:0}',
    '.b-qd{font-family:var(--ui);font-size:.56em;line-height:1.5;color:#262B32;background:#FFFCEE;border:1px solid #EADFB6;border-top:0;border-radius:0 0 6px 6px;padding:.15em .8em .6em 1.6em;margin-top:-.26em;text-shadow:none;box-shadow:0 2px 0 rgba(0,0,0,.08)}',
    '.b-q:has(+ .b-qd),.b-qd:has(+ .b-qd){border-bottom:0;border-bottom-left-radius:0;border-bottom-right-radius:0;padding-bottom:.15em;box-shadow:none}',
    '.sd-yer2 + .b-qd{border-top:1px solid #EADFB6;border-top-left-radius:6px;border-top-right-radius:6px;margin-top:0;padding-top:.55em}',
    '@container (max-width:639px){.b-q,.b-qd{font-size:.68em}}',
    /* tebeşir: soru kökü ve not kutuları da tebeşirle yazılır (basılı kâğıt görünümü yerine tebeşirle çizilmiş çerçeve) */
    '.sd-tahta[data-kalem="tebesir"] .b-q,.sd-tahta[data-kalem="tebesir"] .b-qd{font-family:var(--aile),"Segoe Print","Bradley Hand","Comic Sans MS",cursive;font-size:.8em;line-height:1.24;color:inherit;background:transparent;box-shadow:none;border-color:rgba(255,255,255,.4);border-color:color-mix(in srgb,currentColor 45%,transparent);border-width:.07em}',
    '.sd-tahta[data-kalem="tebesir"] .b-q::before{background:currentColor;box-shadow:none;opacity:.8}',
    '.sd-tahta[data-kalem="tebesir"] .b-q b,.sd-tahta[data-kalem="tebesir"] .b-qd b{font-weight:700}',
    '.sd-tahta[data-kalem="tebesir"].koyu .b-q .w-blok,.sd-tahta[data-kalem="tebesir"].koyu .b-qd .w-blok{background:#fff;border-radius:8px;padding:4px;color:#1F2733}',
    '@container (max-width:639px){.sd-tahta[data-kalem="tebesir"] .b-q,.sd-tahta[data-kalem="tebesir"] .b-qd{font-size:.92em}}',
    '.b-q b,.b-qd b{font-weight:700}.b-q sub,.b-q sup,.b-qd sub,.b-qd sup{font-size:.72em}',
    '.vurgu{color:var(--k-kirmizi)}',
    '.b-alt{font-weight:700;color:var(--k-mavi);margin-top:.28em}',
    '.b-li,.b-lid{position:relative;padding-left:1.05em}.b-li2{position:relative;padding-left:2em}',
    '.b-li::before{content:"•";position:absolute;left:.2em;color:var(--k-turuncu)}.b-li2::before{content:"–";position:absolute;left:1.05em;color:var(--k-turuncu)}',
    '.b-q.b-li,.b-qd.b-li,.b-q.b-lid,.b-qd.b-lid{padding-left:2.5em}.b-q.b-li2,.b-qd.b-li2{padding-left:3.3em}',
    '.b-q.b-li::before,.b-qd.b-li::before{left:1.55em;color:#E04E00}.b-q.b-li2::before,.b-qd.b-li2::before{left:2.4em;color:#E04E00}',
    /* grafik köşedeki öğretmenin yanına sığar (altına itilmez) */
    '.blok.b-grafik{margin:.12em 0 .3em}.blok.b-grafik svg{display:block;width:100%;height:auto;max-height:calc(40cqw * var(--sig,1));max-width:calc(100% - 16.5cqw);margin:0}',
    '@container (min-width:640px){.blok.b-grafik svg{max-width:calc(100% - 12.5cqw)}}',
    '.sahneli .blok.b-grafik svg,.ogretmensiz .blok.b-grafik svg{max-width:100%}',
    '.sd-yazi svg .ga-vurgu{filter:drop-shadow(0 0 2.5px rgba(248,83,0,.95)) drop-shadow(0 0 1px rgba(248,83,0,.9))}',
    '.sd-yazi svg .ga-halka{fill:none;stroke:#F85300;stroke-width:2.4;transform-box:fill-box;transform-origin:center;animation:gaNabiz 1.1s ease-in-out infinite}',
    '@keyframes gaNabiz{0%,100%{opacity:.95;transform:scale(1)}50%{opacity:.45;transform:scale(1.16)}}',
    '.sd-kalem.cizim{transition:transform .06s linear,opacity .2s}',
    '.b-sekil{text-align:center}.b-sekil .altyazi-sekil{font-family:var(--ui);font-size:.5em;color:var(--k-gri);margin-top:.2em;text-shadow:none}',
    '.koyu .b-sekil .altyazi-sekil{color:#E9EEF2}',
    '.w.ciz::after{content:"";position:absolute;left:-6%;right:-6%;top:50%;height:.09em;border-radius:.05em;background:var(--k-kirmizi);transform:rotate(-14deg) scaleX(0);transform-origin:left center;animation:ciz .45s .05s forwards}',
    '.w.ciz{opacity:.55}',
    '.w.halka::before{content:"";position:absolute;inset:-.16em -.32em -.1em;border:.075em solid var(--k-turuncu);border-radius:50%;transform:rotate(-4deg) scale(.6);opacity:0;animation:halka .5s forwards}',
    '.anlik.ciz::after,.anlik.halka::before{animation-duration:.01s}',
    '@keyframes ciz{to{transform:rotate(-14deg) scaleX(1)}}@keyframes halka{to{transform:rotate(-4deg) scale(1);opacity:1}}',
    '.sd-kalem{position:absolute;left:0;top:0;width:5.5cqw;min-width:18px;pointer-events:none;opacity:0;transition:transform .16s linear,opacity .25s;z-index:4}',
    '.sd-kalem.aktif{opacity:1}.sd-kalem svg{display:block;width:100%;height:auto}',
    '.sd-silgi{position:absolute;top:8%;left:-24%;width:20%;height:84%;pointer-events:none;z-index:5;display:none}',
    '.sd-silgi.calis{display:block;animation:sil .72s ease-in-out forwards}',
    '.sd-silgi div{position:absolute;top:30%;left:12%;width:76%;height:40%;border-radius:8px;background:linear-gradient(180deg,#3B4450 0 52%,#E6E9EC 52% 100%);box-shadow:0 6px 12px -6px rgba(0,0,0,.45)}',
    '.sd-tahta.koyu .sd-silgi div{background:linear-gradient(180deg,#6B4A2B 0 50%,#D8D2C6 50% 100%)}',
    '.sd-tahta[data-cerceve="siyah"] .sd-silgi div{background:linear-gradient(180deg,#E5E7EB,#CBD5E1);border-radius:50%;width:40%;left:30%}',
    '@keyframes sil{from{left:-24%}to{left:104%}}',
    '.sd-yazi.siliniyor{transition:opacity .62s ease-in;opacity:0}',
    /* sahne */
    '.sd-sahne{position:absolute;display:none;left:5cqw;right:19cqw;top:42%;bottom:2.5cqw;z-index:2}',
    '.sahneli .sd-sahne{display:block}',
    '@container (min-width:640px){.sd-sahne{left:46%;right:15cqw;top:4cqw;bottom:3cqw}}',
    '.koyu .sd-sahne{background:rgba(255,255,255,.93);border-radius:12px;padding:4px}',
    '.sd-sahne svg{width:100%;height:100%;display:block}',
    '.sd-sahne .etk{font-family:var(--ui);font-size:17px;font-weight:700;fill:#2B333D}.sd-sahne .etk.kucuk{font-size:13px;font-weight:600;fill:#6A7582}',
    '.sd-sahne .iy-yazi{font-family:var(--ui);font-size:11.5px;font-weight:800;pointer-events:none}',
    '.sd-sahne .parla circle{stroke:#E04E00;stroke-width:3.2;animation:parla 1.1s ease-in-out infinite alternate}@keyframes parla{from{stroke-opacity:.35}to{stroke-opacity:1}}',
    /* öğretmen */
    '.sd-ogretmen{position:absolute;right:1cqw;bottom:0;width:17.5cqw;z-index:6;pointer-events:none}',
    '@container (min-width:640px){.sd-ogretmen{width:13.2cqw}}',
    '.sd-ogretmen svg{display:block;width:100%;height:auto;animation:nefes 4.2s ease-in-out infinite}',
    '@keyframes nefes{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2%)}}',
    '.sd-ogretmen .agiz-acik{display:none}.sd-ogretmen.agiz .agiz-acik{display:inline}.sd-ogretmen.agiz .agiz-kapali{display:none}',
    '.sd-ogretmen .gozler{transform-box:fill-box;transform-origin:center;animation:kirp 4.6s infinite}@keyframes kirp{0%,94%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.1)}}',
    '.sd-ogretmen .kol{transform-box:view-box;transform-origin:40px 178px;transition:transform .3s}',
    '.sd-ogretmen.yaziyor .kol{animation:kolYaz .42s ease-in-out infinite alternate}.sd-ogretmen.gosteriyor .kol{transform:rotate(-22deg)}',
    '@keyframes kolYaz{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}',
    '.sd-ogretmen.erkek .sac-kadin,.sd-ogretmen.erkek .sac-arka{display:none}.sd-ogretmen.kadin .sac-erkek,.sd-ogretmen.kadin .kravat{display:none}',
    /* perde */
    '.sd-perde{position:absolute;inset:0;z-index:8;display:grid;place-items:center;background:rgba(255,255,255,.62);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}',
    '.koyu .sd-perde{background:rgba(20,24,26,.55)}',
    '.sd-perde-ic{display:grid;justify-items:center;gap:10px;text-align:center;padding:12px}',
    '.sd-perde button{display:inline-flex;align-items:center;gap:10px;border:0;border-radius:999px;background:#F85300;color:#fff;font-weight:700;font-size:clamp(15px,2.2cqw,20px);padding:12px 22px 12px 16px;box-shadow:0 10px 22px -10px rgba(248,83,0,.75)}',
    '.sd-perde button svg{width:26px;height:26px}',
    '.sd-perde small{font-family:var(--ui);color:#3E4650;font-size:clamp(12px,1.7cqw,15px);max-width:34ch;background:rgba(255,255,255,.85);border-radius:8px;padding:4px 8px}',
    /* altyazı ve oynatıcı */
    '.sd-altyazi{min-height:3.4em;background:var(--kart);border:1px solid var(--cizgi);border-radius:12px;padding:10px 14px;font-size:15.5px;line-height:1.55}',
    '.sd-altyazi .k{border-radius:4px;transition:background-color .12s,color .12s}.sd-altyazi .k.su{background:var(--turuncu-y);color:var(--turuncu-k);box-shadow:0 0 0 2px var(--turuncu-y)}',
    '.sd-altyazi .bos{color:var(--gri)}',
    '.sd-altyazi .kim{font-weight:800;font-size:12.5px;letter-spacing:.02em;padding:2px 9px;border-radius:999px;margin-right:4px;white-space:nowrap}',
    '.kim-A{background:#FCE4EE;color:#A3154B}.kim-B{background:#E1ECFA;color:#1A4A9C}',
    '.sd[data-tema="koyu"] .kim-A{background:#4A1E30;color:#FFB4CF}.sd[data-tema="koyu"] .kim-B{background:#1C2C47;color:#A9CBFF}',
    '.sd-ogr-ad{position:absolute;left:50%;bottom:3%;transform:translateX(-50%);font-family:var(--ui);font-size:clamp(9px,1.5cqw,12.5px);font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px -2px rgba(0,0,0,.35)}',
    '.sd-bolum{display:flex;align-items:center;gap:8px;min-width:0}.sd-bolum label{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gri);white-space:nowrap}',
    '.sd-bolum select{flex:1;min-width:0;width:auto;padding:7px 10px;font-size:14.5px;border-radius:10px}',
    '.sd-oynatici{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.yv{width:42px;height:42px;border-radius:50%;border:1px solid var(--cizgi);background:var(--kart);display:grid;place-items:center;color:var(--murekkep);padding:0}',
    '.yv svg{width:18px;height:18px}.yv.ana{width:54px;height:54px;border:0;background:var(--turuncu);color:#fff}.yv.ana svg{width:22px;height:22px}.yv:disabled{opacity:.4;cursor:default}',
    '.sd-ilerleme{flex:1 1 90px;min-width:76px;display:grid;gap:4px}',
    '.sd-ilerleme .cubuk{height:6px;border-radius:3px;background:var(--cizgi);overflow:hidden}.sd-ilerleme .cubuk i{display:block;height:100%;width:0;background:var(--turuncu);transition:width .3s}',
    '.sd-ilerleme span{font-size:13px;color:var(--gri);font-variant-numeric:tabular-nums}',
    /* ayarlar */
    '.sd-yan{display:grid;gap:14px;min-width:0}',
    '.ogr-giris{text-align:center;display:grid;gap:8px;justify-items:center}.ogr-giris .satir{width:100%}.ogr-giris input{flex:1 1 140px;min-width:0;padding:9px 12px;border:1px solid var(--cizgi);border-radius:10px;background:var(--kart)}',
    '.baglanti{border:0;background:none;color:var(--gri);font-size:13px;text-decoration:underline;text-underline-offset:3px;padding:4px 8px}',
    '.rozet-ogr{font-size:11px;font-weight:800;letter-spacing:.04em;color:var(--turuncu-k);background:var(--turuncu-y);border-radius:999px;padding:2px 8px;vertical-align:middle;margin-left:6px}',
    '.ogr-dinle{margin-top:6px}',
    '.kart{background:var(--kart);border:1px solid var(--cizgi);border-radius:14px;padding:16px;display:grid;gap:12px}',
    '.kart h3{margin:0;font-size:15.5px;letter-spacing:-.01em}',
    '.alan{display:grid;gap:6px}.alan>label,.alan>.etiket{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gri)}',
    '.secim{display:flex;flex-wrap:wrap;gap:6px}',
    '.secim button{border:1px solid var(--cizgi);background:transparent;border-radius:999px;padding:6px 11px;font-size:14px;display:inline-flex;align-items:center;gap:6px}',
    '.secim button[aria-pressed="true"]{background:var(--murekkep);border-color:var(--murekkep);color:var(--kagit)}',
    '.ornek-tahta{width:16px;height:12px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}',
    '.renkler{display:flex;gap:8px;flex-wrap:wrap}',
    '.renkler button{width:30px;height:30px;border-radius:50%;border:2px solid var(--cizgi);padding:0;box-shadow:inset 0 0 0 2px var(--kart)}',
    '.renkler button[aria-pressed="true"]{border-color:var(--murekkep);transform:scale(1.08)}',
    'select,input[type="text"],textarea{width:100%;border:1px solid var(--cizgi);background:var(--kagit);border-radius:10px;padding:9px 11px;font-size:15px}',
    'textarea{resize:vertical;line-height:1.5;min-height:170px}textarea.kisa{min-height:110px}',
    '.satir{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.satir input[type="range"]{flex:1;accent-color:var(--turuncu)}',
    'output{font-variant-numeric:tabular-nums;font-size:14px;min-width:3.6em;text-align:right;color:var(--gri)}',
    '.anahtar{display:flex;align-items:center;gap:10px;font-size:15px}.anahtar input{width:18px;height:18px;accent-color:var(--turuncu)}',
    '.dugme{border:0;border-radius:10px;background:var(--turuncu);color:#fff;font-weight:700;padding:10px 14px;white-space:nowrap}',
    '.dugme.ikincil{background:transparent;color:var(--murekkep);border:1px solid var(--cizgi)}.dugme:disabled{opacity:.45;cursor:default}',
    '.not{margin:0;font-size:13.5px;color:var(--gri);line-height:1.5}.not b{color:var(--murekkep)}',
    '.uyari{margin:0;font-size:13.5px;line-height:1.5;padding:8px 10px;border-radius:10px;background:var(--turuncu-y);color:var(--turuncu-k)}',
    '.ozel-liste{list-style:none;margin:0;padding:0;display:grid;gap:6px}',
    '.ozel-liste li{display:flex;gap:8px;align-items:flex-start;font-size:14px;padding:8px 10px;border:1px dashed var(--cizgi);border-radius:10px}',
    '.ozel-liste li span{flex:1;min-width:0;overflow-wrap:anywhere}.ozel-liste button{border:0;background:transparent;color:var(--gri);padding:0 2px;font-size:18px;line-height:1}',
    /* kayıt stüdyosu */
    '.sd-studyo{position:fixed;inset:0;z-index:3;background:rgba(20,17,15,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(10px,env(safe-area-inset-top,0px)) 10px 10px}',
    '.sd[data-mod="studyo"] .sd-studyo{z-index:2147483000}',
    '.studyo-panel{background:var(--kagit);border-radius:16px;width:min(760px,100%);padding:16px;display:grid;gap:12px;margin:auto 0}',
    '.studyo-panel h3{margin:0;font-size:18px}',
    '.studyo-liste{list-style:none;margin:0;padding:0;display:grid;gap:8px;max-height:52vh;overflow:auto}',
    '.studyo-liste li{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:start;padding:10px;border:1px solid var(--cizgi);border-radius:12px;background:var(--kart)}',
    '.studyo-liste li.su{border-color:var(--turuncu);box-shadow:0 0 0 2px var(--turuncu-y)}',
    '.studyo-liste .no{font-weight:800;color:var(--gri);font-variant-numeric:tabular-nums}',
    '.studyo-liste .ct{font-size:15px;line-height:1.5}.studyo-liste .durum{font-size:12.5px;color:var(--gri)}.studyo-liste .durum b{color:#17784A}',
    '.studyo-liste .islem{grid-column:2;display:flex;gap:6px;flex-wrap:wrap}',
    '.teleprompter{font-size:clamp(19px,4.6vw,26px);line-height:1.6;background:var(--kart);border:1px solid var(--cizgi);border-radius:12px;padding:16px;max-height:52vh;overflow:auto}',
    '.teleprompter p{margin:0 0 .9em}',
    '.kayit-isik{display:inline-block;width:10px;height:10px;border-radius:50%;background:#D3202E;animation:yanip 1s infinite}@keyframes yanip{50%{opacity:.25}}',
    /* akıllı tahta görünümü: tahta ekranı kaplar (16:9), yazı, altyazı ve düğmeler büyür, ayarlar sağdan açılır */
    '.pdf-menu{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--turuncu-y);border:1px solid #F7C3A5;border-radius:12px;padding:8px 10px}',
    '.pdf-menu .pdf-baslik{font-weight:800;font-size:14px;color:var(--turuncu-k);margin-right:4px}.pdf-menu .pdf-durum{font-size:13.5px;color:var(--gri);flex:1 1 160px;min-width:0}',
    '.pdf-menu .pdf-kapat{margin-left:auto;padding:6px}.sd-kucuk:disabled{opacity:.55;cursor:default}',
    '.yan-baslik{display:none;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:-16px;z-index:2;background:var(--kagit);padding:4px 0 8px}.yan-baslik b{font-size:18px}',
    '.sd.akilli{position:fixed;inset:0;z-index:2147482000;background:var(--kagit);overflow:auto;padding:0;display:block}',
    '.sd.akilli .sd-panel{width:100%;min-height:100%;max-width:none;border-radius:0;margin:0;box-shadow:none;background:var(--kagit);display:flex;flex-direction:column;gap:8px;',
    '  padding:max(8px,env(safe-area-inset-top,0px)) max(14px,env(safe-area-inset-right,0px)) max(8px,env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px))}',
    '.sd.akilli .sd-ust{flex-wrap:nowrap}.sd.akilli .sd-ust h2{font-size:clamp(17px,1.5vw,24px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.sd.akilli .sd-ust .sd-kucuk{padding:10px 16px;font-size:16px;white-space:nowrap}.sd.akilli .sd-ust .sd-kucuk svg{width:20px;height:20px}',
    '.sd.akilli .sd-duzen{display:block;flex:1 1 auto;min-height:0}',
    '.sd.akilli .sd-alan{display:flex;flex-direction:column;gap:8px;--tg:calc((100vh - 250px) * 16 / 9)}',
    '@supports (height:100dvh){.sd.akilli .sd-alan{--tg:calc((100dvh - 250px) * 16 / 9)}}',
    '.sd.akilli .sd-cerceve,.sd.akilli .sd-altyazi,.sd.akilli .sd-oynatici{width:100%;max-width:max(320px,var(--tg));margin:0 auto}',
    '.sd.akilli .sd-oynatici .sd-bolum{flex:1 1 200px;max-width:360px;min-width:0}.sd.akilli .sd-oynatici .sd-bolum label{display:none}',
    '.sd.akilli .sd-tahta{aspect-ratio:16/9}',
    '.sd.akilli .sd-altyazi{font-size:clamp(17px,1.75vw,30px);line-height:1.4;min-height:0;padding:8px 18px}.sd.akilli .sd-altyazi .kim{font-size:.72em}',
    '.sd.akilli .sd-bolum select{font-size:16px;padding:10px 12px}',
    '.sd.akilli .sd-oynatici{justify-content:center;gap:14px;flex-wrap:nowrap}',
    '.sd.akilli .yv{width:62px;height:62px}.sd.akilli .yv svg{width:26px;height:26px}.sd.akilli .yv.ana{width:78px;height:78px}.sd.akilli .yv.ana svg{width:32px;height:32px}',
    '.sd.akilli .sd-ilerleme{flex:1 1 200px}.sd.akilli .sd-ilerleme .cubuk{height:9px;border-radius:5px}.sd.akilli .sd-ilerleme span{font-size:17px}',
    '.sd.akilli .sd-yan{position:fixed;top:0;right:0;bottom:0;width:min(400px,94vw);overflow:auto;overscroll-behavior:contain;background:var(--kagit);',
    '  box-shadow:-18px 0 44px -20px rgba(20,17,15,.55);padding:16px;z-index:30;align-content:start}',
    '.sd.akilli:not(.ayar-acik) .sd-yan{display:none}.sd.akilli .yan-baslik{display:flex}',
    '@media (max-width:700px){.sd.akilli .sd-ust .sd-kucuk .etk{display:none}.sd.akilli .sd-ust .sd-kucuk{padding:10px}.sd.akilli .yv{width:48px;height:48px}.sd.akilli .yv.ana{width:60px;height:60px}.sd.akilli .sd-oynatici{gap:8px}}',
    '@media (prefers-reduced-motion:reduce){.w.on,.sd-tahta[data-kalem="tebesir"] .w.on{animation:none}.sd-ogretmen svg,.sd-ogretmen .gozler,.sd-ogretmen.yaziyor .kol{animation:none}.sd-silgi.calis{animation-duration:.01s}.sd-kalem{transition:none}}'
  ].join('\n');

  var IKON = {
    oynat: '<path d="M8 5v14l11-7z" fill="currentColor"/>', dur: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
    geri: '<path d="M6 5h2v14H6zM19 5v14L9 12z" fill="currentColor"/>', ileri: '<path d="M16 5h2v14h-2zM5 5v14l10-7z" fill="currentColor"/>',
    bastan: '<path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" fill="currentColor"/>',
    tam: '<path d="M4 9V4h5v2H6v3zm10-5h6v5h-2V6h-4zM4 15h2v3h3v2H4zm14 3v-3h2v5h-5v-2z" fill="currentColor"/>',
    ayar: '<path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" fill="currentColor" transform="translate(-1 0)"/>',
    kapat: '<path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" fill="currentColor"/>',
    tahta: '<path fill="currentColor" fill-rule="evenodd" d="M2 3.5h20v13H2zm2 2v9h16v-9z"/><path fill="currentColor" d="M11 16.5h2V19h4v2H7v-2h4z"/>',
    pdf: '<path fill="currentColor" fill-rule="evenodd" d="M6 2h8.5L20 7.5V22H6zm2 2v16h10V9h-5V4zm3 6.5h2v4.3l1.6-1.6 1.4 1.4-4 4-4-4 1.4-1.4 1.6 1.6z"/>'
  };
  function ikon(ad) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[ad] + '</svg>'; }
  function kalemSVG(tur, renk) {
    if (tur === 'tebesir') return '<svg viewBox="0 0 40 40"><g transform="rotate(-38 20 20)"><rect x="16" y="6" width="8" height="26" rx="3" fill="' + renk + '"/><path d="M16 9h8M16 15h8" stroke="rgba(0,0,0,.12)"/><path d="M16 32 L24 32 L22.5 34.5 L17.5 34.5 Z" fill="' + renk + '" opacity=".8"/></g></svg>';
    if (tur === 'dijital') return '<svg viewBox="0 0 40 40"><g transform="rotate(-38 20 20)"><rect x="17" y="2" width="6" height="28" rx="3" fill="#2B3036"/><rect x="17" y="4" width="6" height="5" rx="2" fill="' + renk + '"/><path d="M17 30 L23 30 L20 37 Z" fill="#9AA3AE"/><circle cx="20" cy="37" r="2.2" fill="' + renk + '" opacity=".75"/></g></svg>';
    return '<svg viewBox="0 0 40 40"><g transform="rotate(-38 20 20)"><rect x="16" y="2" width="8" height="26" rx="2.5" fill="' + renk + '"/><rect x="16" y="2" width="8" height="8" rx="2" fill="#14110F"/><path d="M16 28 L24 28 L21.5 35 L18.5 35 Z" fill="#14110F"/></g></svg>';
  }
  var OGRETMEN_SVG = '<svg viewBox="0 0 160 212" aria-hidden="true">' +
    '<path class="sac-arka" d="M47 96 C42 62 60 40 82 40 C106 40 122 60 117 96 C120 122 115 140 107 150 L57 150 C47 138 44 120 47 96 Z" fill="#3B2A22"/>' +
    '<path d="M22 212 C24 170 46 147 80 147 C114 147 136 170 138 212 Z" fill="#FFFFFF" stroke="#B9C0C8" stroke-width="2"/>' +
    '<path d="M64 148 L80 177 L96 148 C90 146 70 146 64 148 Z" fill="#F85300"/>' +
    '<path class="kravat" d="M77 150 L83 150 L85 158 L82 176 L78 176 L75 158 Z" fill="#1E4FB4"/>' +
    '<path d="M64 148 L75 173 L80 177 L70 151 Z" fill="#E9EDF1"/><path d="M96 148 L85 173 L80 177 L90 151 Z" fill="#E9EDF1"/>' +
    '<path d="M71 128 L71 146 C75 151 85 151 89 146 L89 128 Z" fill="#E7B28C"/>' +
    '<ellipse cx="53.5" cy="101" rx="4.5" ry="7" fill="#E7B28C"/><ellipse cx="106.5" cy="101" rx="4.5" ry="7" fill="#E7B28C"/>' +
    '<ellipse cx="80" cy="99" rx="27" ry="31" fill="#F1C6A2"/>' +
    '<path class="sac-erkek" d="M53 94 C51 70 64 61 80 61 C98 61 110 71 107 94 C103 81 93 76 80 76 C67 76 57 81 53 94 Z" fill="#3B2A22"/>' +
    '<path class="sac-kadin" d="M52 98 C49 70 64 59 82 60 C101 61 113 74 108 99 C104 84 96 74 84 72 C78 83 64 90 52 98 Z" fill="#3B2A22"/>' +
    '<g class="gozler" fill="#14110F"><ellipse cx="70" cy="101" rx="2.8" ry="3.4"/><ellipse cx="90" cy="101" rx="2.8" ry="3.4"/></g>' +
    '<g fill="none" stroke="#14110F" stroke-width="1.8"><circle cx="70" cy="101" r="8.5"/><circle cx="90" cy="101" r="8.5"/><path d="M78.5 100 Q80 98.5 81.5 100"/></g>' +
    '<g stroke="#3B2A22" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M63 89 Q70 86 76 89"/><path d="M84 89 Q90 86 97 89"/></g>' +
    '<path class="agiz-kapali" d="M73 117 Q80 122 87 117" fill="none" stroke="#8A3A26" stroke-width="2.4" stroke-linecap="round"/>' +
    '<ellipse class="agiz-acik" cx="80" cy="118.5" rx="5.2" ry="4.4" fill="#8A3A26"/>' +
    '<g class="kol"><path d="M40 178 C30 162 26 148 30 134" fill="none" stroke="#B9C0C8" stroke-width="17" stroke-linecap="round"/>' +
    '<path d="M40 178 C30 162 26 148 30 134" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round"/>' +
    '<circle cx="30" cy="130" r="7.5" fill="#F1C6A2"/><g class="el-kalem" transform="rotate(-28 30 122)"><rect x="27" y="104" width="6.5" height="19" rx="2" fill="#1E4FB4"/><rect x="27" y="99" width="6.5" height="7" rx="1.6" fill="#14110F"/></g></g></svg>';

  function sablon(o) {
    var pencere = o.mod === 'pencere';
    var sekmeler = '';
    if (!pencere && o.sekmeler && o.sekmeler.length > 1) {
      sekmeler = '<div class="sd-sekmeler" role="tablist" aria-label="Bölüm">' + o.sekmeler.map(function (s) {
        return '<button role="tab" data-ders="' + esc(s.id) + '" aria-selected="false">' + esc(s.ad) + '</button>';
      }).join('') + '</div>';
    }
    return '<div class="sd" data-mod="' + (pencere ? 'pencere' : 'satir') + '"><div class="sd-panel" role="' + (pencere ? 'dialog' : 'region') + '" aria-label="Sesli ders">' +
      '<div class="sd-ust">' + (pencere ? '<h2 data-r="baslik">Sesli anlatım</h2>' : (o.baslik ? '<h2>' + esc(o.baslik) + '</h2>' : '')) + sekmeler +
        '<button type="button" class="sd-kucuk" data-r="ikiliDugme" aria-pressed="false" title="Kadın ve erkek öğretmen sırayla anlatsın"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><circle cx="16.5" cy="8" r="3.2" fill="currentColor"/><path d="M2.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2zM11 19c.5-3.4 2.7-5.2 5.5-5.2S21.4 15.6 22 19z" fill="currentColor"/></svg><span class="etk">Karşılıklı</span></button>' +
        '<button type="button" class="sd-kucuk" data-r="pdfDugme" aria-expanded="false" title="Tahtaya yazılanları PDF ders notu olarak indir">' + ikon('pdf').replace('<svg', '<svg width="16" height="16"') + '<span class="etk">Ders PDF\'si</span></button>' +
        '<button type="button" class="sd-kucuk" data-r="akilliDugme" aria-pressed="false" title="Akıllı tahtaya yansıtma görünümü: tahta ekranı kaplar, yazı ve düğmeler büyür">' + ikon('tahta').replace('<svg', '<svg width="16" height="16"') + '<span class="etk">Akıllı tahta</span></button>' +
        '<button type="button" class="sd-kucuk" data-r="ayarDugme" aria-pressed="false" aria-label="Ayarlar">' + ikon('ayar').replace('<svg', '<svg width="16" height="16"') + '<span class="etk">Ayarlar</span></button>' +
        (pencere ? '<button type="button" class="sd-kucuk" data-r="kapat" aria-label="Kapat">' + ikon('kapat').replace('<svg', '<svg width="16" height="16"') + '<span class="etk">Kapat</span></button>' : '') +
      '</div>' +
      '<div class="pdf-menu" data-r="pdfMenu" hidden><span class="pdf-baslik">Ders PDF\'si</span>' +
        '<button type="button" class="sd-kucuk" data-r="pdfTum">Bütün ders</button><button type="button" class="sd-kucuk" data-r="pdfBolum">Bu bölüm</button>' +
        '<span class="pdf-durum" data-r="pdfDurum" aria-live="polite"></span><button type="button" class="sd-kucuk pdf-kapat" data-r="pdfKapat" aria-label="Kapat">' + ikon('kapat').replace('<svg', '<svg width="14" height="14"') + '</button></div>' +
      '<div class="sd-duzen"><section class="sd-alan">' +
        '<div class="sd-cerceve" data-r="cerceve"><div class="sd-tahta" data-r="tahta">' +
          '<div class="sd-doku"></div><div class="sd-iz" data-r="iz"></div>' +
          '<div class="sd-ic"><div class="sd-yazi" data-r="yazi"></div></div>' +
          '<div class="sd-sahne" data-r="sahne" aria-hidden="true"></div>' +
          '<div class="sd-kalem" data-r="kalem" aria-hidden="true"></div>' +
          '<div class="sd-silgi" data-r="silgi"><div></div></div>' +
          '<div class="sd-ogretmen kadin" data-r="ogretmen">' + OGRETMEN_SVG + '<span class="sd-ogr-ad" data-r="ogrAd" hidden></span></div>' +
          '<div class="sd-perde" data-r="perde"><div class="sd-perde-ic"><button type="button" data-r="perdeDugme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.22)"/><path d="M9.5 7.5 L17 12 L9.5 16.5 Z" fill="#fff"/></svg><span data-r="perdeYazi">Dersi başlat</span></button><small data-r="perdeAlt">Ses açıkken başlat. Tahtaya yazılanlar sesle birlikte ilerler.</small></div></div>' +
        '</div><div class="sd-raf" data-r="raf" aria-hidden="true"></div></div>' +
        '<div class="sd-bolum" data-r="bolumKutu" hidden><label for="sd-bolum-sec">Bölüm</label><select id="sd-bolum-sec" data-r="bolumSec" aria-label="Bölüm seç"></select></div>' +
        '<div class="sd-altyazi" data-r="altyazi"><span class="bos">Altyazı burada görünür: konuşulan kelime renklenir.</span></div>' +
        '<div class="sd-oynatici">' +
          '<button type="button" class="yv" data-r="geri" aria-label="Önceki adım">' + ikon('geri') + '</button>' +
          '<button type="button" class="yv ana" data-r="oynat" aria-label="Başlat">' + ikon('oynat') + '</button>' +
          '<button type="button" class="yv" data-r="ileri" aria-label="Sonraki adım">' + ikon('ileri') + '</button>' +
          '<button type="button" class="yv" data-r="bastan" aria-label="Baştan başlat">' + ikon('bastan') + '</button>' +
          '<div class="sd-ilerleme"><div class="cubuk"><i data-r="cubuk"></i></div><span data-r="adimYazi">Adım 0 / 0</span></div>' +
          '<button type="button" class="yv" data-r="tamEkran" aria-label="Tam ekran" hidden>' + ikon('tam') + '</button>' +
        '</div>' +
      '</section>' +
      '<aside class="sd-yan" data-r="yan" aria-label="Ayarlar">' +
        '<div class="yan-baslik"><b>Ayarlar</b><button type="button" class="sd-kucuk" data-r="yanKapat">' + ikon('kapat').replace('<svg', '<svg width="16" height="16"') + ' Kapat</button></div>' +
        (o.metin ? '<section class="kart" data-r="metinKart" hidden><h3>Kendi metnini anlat</h3><textarea data-r="metin" maxlength="' + METIN_SINIR + '" aria-label="Anlatılacak metin"></textarea><p class="not" data-r="metinSay" aria-live="polite"></p>' +
          '<div class="satir"><button type="button" class="dugme" data-r="metinDugme">Tahtada anlat</button><button type="button" class="dugme ikincil" data-r="ornekDugme">Örneği geri yükle</button></div>' +
          '<p class="not">Her cümle ayrı bir adım olur; 2–3 sayfalık bir konuyu da yapıştırabilirsin. Başlık satırları yeni tahtada başlar, tahta dolunca silinip yazmaya devam edilir. Formüller tahtada alt ve üst simgelerle yazılır, seste adlarıyla okunur: NaCl → “sodyum klorür”.</p></section>' : '') +
        '<section class="kart"><h3>Tahta ve kalem</h3>' +
          '<div class="alan"><span class="etiket">Görünüm</span><div class="secim" data-r="duzenler"><button type="button" data-duzen="normal">Normal</button><button type="button" data-duzen="akilli">Akıllı tahta</button></div>' +
            '<p class="not">Akıllı tahta görünümünde tahta ekranı kaplar; yazı, altyazı ve düğmeler sınıfın arkasından da görülecek kadar büyür.</p></div>' +
          '<div class="alan"><span class="etiket">Yazı büyüklüğü</span><div class="secim" data-r="buyuklukler"><button type="button" data-buyukluk="0.85">Küçük</button><button type="button" data-buyukluk="1">Orta</button><button type="button" data-buyukluk="1.18">Büyük</button></div></div>' +
          '<div class="alan"><span class="etiket">Tahta</span><div class="secim" data-r="tahtalar"></div></div>' +
          '<div class="alan"><span class="etiket">Kalem</span><div class="secim" data-r="kalemler"></div></div>' +
          '<div class="alan"><span class="etiket">Kalem rengi</span><div class="renkler" data-r="renkler"></div></div>' +
          '<div class="alan"><label>Yazı karakteri<select data-r="yaziSec" style="margin-top:6px"></select></label></div>' +
        '</section>' +
        '<section class="kart"><h3>Ses ve anlatım</h3>' +
          '<div class="alan"><span class="etiket">Ses kaynağı</span><div class="secim" data-r="kaynaklar"><button type="button" data-kaynak="bulut" hidden>Doğal sesler</button><button type="button" data-kaynak="cihaz">Cihaz sesi</button><button type="button" data-kaynak="kayit">Öğretmen kaydı</button></div><p class="not" data-r="kaynakNot"></p></div>' +
          '<div class="alan"><span class="etiket">Anlatım</span><div class="secim" data-r="bicimler"><button type="button" data-ikili="0">Tek öğretmen</button><button type="button" data-ikili="1">Karşılıklı · kadın ve erkek</button></div></div>' +
          '<div class="alan" data-r="ikiliSes" hidden><label>Elif Hoca (kadın)<select data-r="sesSecK" style="margin-top:6px"></select></label><label style="margin-top:8px">Kerem Hoca (erkek)<select data-r="sesSecE" style="margin-top:6px"></select></label></div>' +
          '<div class="alan" data-r="tekCins"><span class="etiket">Ses</span><div class="secim" data-r="cinsler"><button type="button" data-cins="k">Kadın</button><button type="button" data-cins="e">Erkek</button></div></div>' +
          '<div class="alan" data-r="tekSes"><label><span data-r="sesEtiket">Cihazdaki Türkçe sesler</span><select data-r="sesSec" style="margin-top:6px"></select></label></div>' +
          '<div class="alan"><span class="etiket">Anlatım tarzı</span><div class="secim" data-r="tarzlar"></div></div>' +
          '<div class="alan"><label>Hız</label><div class="satir"><input type="range" data-r="hiz" min="0.7" max="1.4" step="0.05" aria-label="Hız"><output data-r="hizDeger">1,00×</output></div></div>' +
          '<label class="anahtar"><input type="checkbox" data-r="ogrGoster"> Öğretmen figürünü göster</label>' +
          '<p class="not" data-r="ogrSesNot" hidden></p>' +
          '<p class="uyari" data-r="sesNot" hidden></p>' +
          '<button type="button" class="dugme ikincil" data-r="studyoAc">🎙️ Kendi sesinle kaydet</button>' +
        '</section>' +
        '<section class="kart" data-r="ogrKart" hidden><h3>Öğrenci sesleri <span class="rozet-ogr">Öğretmen</span></h3>' +
          '<p class="not">Öğrenciler yalnız bu iki doğal sesi seçebilir; öteki sesler onlara kapalıdır. Değiştirip kaydedince bütün öğrencilere geçer.</p>' +
          '<div class="alan"><label>Kadın sesi<select data-r="ogrSesK" style="margin-top:6px"></select></label><button type="button" class="sd-kucuk ogr-dinle" data-r="ogrDinleK">▶ Dinle</button></div>' +
          '<div class="alan"><label>Erkek sesi<select data-r="ogrSesE" style="margin-top:6px"></select></label><button type="button" class="sd-kucuk ogr-dinle" data-r="ogrDinleE">▶ Dinle</button></div>' +
          '<div class="satir"><button type="button" class="dugme" data-r="ogrKaydet">Kaydet</button><button type="button" class="dugme ikincil" data-r="ogretmenCik">Öğretmen modundan çık</button></div>' +
          '<p class="not" data-r="ogrKartNot" aria-live="polite"></p>' +
        '</section>' +
        '<div class="ogr-giris" data-r="ogrGiris"><button type="button" class="baglanti" data-r="ogrGirisAc">Öğretmen girişi</button>' +
          '<div class="satir" data-r="ogrGirisForm" hidden><input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" data-r="ogrAnahtar" placeholder="Öğretmen anahtarı" aria-label="Öğretmen anahtarı"><button type="button" class="dugme" data-r="ogrGirisDugme">Giriş</button></div>' +
          '<p class="not" data-r="ogrGirisNot" aria-live="polite" hidden></p></div>' +
        '<section class="kart"><h3>Cümle ya da metin ekle</h3>' +
          '<div class="alan"><label>Tahtaya yazılıp seslendirilecek metin<textarea data-r="cumle" class="kisa" rows="4" maxlength="' + METIN_SINIR + '" placeholder="Bir cümle yaz ya da 2–3 sayfalık bir konuyu buraya yapıştır." style="margin-top:6px"></textarea></label>' +
          '<p class="not" data-r="cumleSay" aria-live="polite"></p></div>' +
          '<button type="button" class="dugme" data-r="cumleDugme">Ekle ve seslendir</button>' +
          '<p class="not">Metin, şu anki adımdan hemen sonra gelir. Uzun metin cümle cümle yazılır ve okunur; tahta dolunca silinip devam edilir, başlık satırları yeni tahtada başlar. Formülleri düz yazabilirsin: AgCl, Pb2+, SO42−.</p>' +
          '<ul class="ozel-liste" data-r="ozelListe"></ul>' +
        '</section>' +
      '</aside></div></div>' +
      '<div class="sd-studyo" data-r="studyo" hidden><div class="studyo-panel" role="dialog" aria-label="Kayıt stüdyosu">' +
        '<div class="sd-ust"><h3 style="flex:1">🎙️ Kendi sesinle kaydet</h3><button type="button" class="sd-kucuk" data-r="studyoKapat">' + ikon('kapat').replace('<svg', '<svg width="16" height="16"') + ' Kapat</button></div>' +
        '<div class="sd-sekmeler" role="tablist"><button role="tab" data-st="ders" aria-selected="true">Ders cümleleri</button><button role="tab" data-st="ornek" aria-selected="false">Ses kopyası için örnek</button></div>' +
        '<div data-r="stDers">' +
          '<p class="not" style="margin-bottom:8px">Her cümleyi kendi sesinle oku: <b>● Kaydet</b>’e bas, cümleyi oku, <b>■ Bitir</b>’e bas. Sessiz bir odada, telefonu ağzından bir karış uzakta tut. Kayıtlar bu cihazda saklanır; ders “Öğretmen kaydı” seçiliyken senin sesinle oynar.</p>' +
          '<div class="satir" style="margin-bottom:10px"><button type="button" class="dugme" data-r="siraKaydet">● Sırayla kaydet</button><button type="button" class="dugme ikincil" data-r="paketIndir">Kayıtları indir</button></div>' +
          '<p class="uyari" data-r="studyoNot" hidden></p>' +
          '<ul class="studyo-liste" data-r="studyoListe"></ul>' +
          '<p class="not" style="margin-top:8px">Kayıtlar yalnızca bu cihazda durur. Öğrencilerin de duyması için “Kayıtları indir” ile alınan dosya sitenin <b>sesli</b> klasörüne eklenir.</p>' +
        '</div>' +
        '<div data-r="stOrnek" hidden>' +
          '<p class="not" style="margin-bottom:8px">Yeni yazılan metinlerin de senin sesinle okunması için bir ses servisinde (ör. ElevenLabs) sesinin kopyası oluşturulur. Servis bunun için 1–5 dakikalık temiz bir kayıt ister. Aşağıdaki metni doğal ders anlatır gibi oku, kaydı indirip servise yükle.</p>' +
          '<div class="satir" style="margin-bottom:10px"><button type="button" class="dugme" data-r="ornekKaydet">● Kaydı başlat</button><button type="button" class="dugme ikincil" data-r="ornekDinle" disabled>▶ Dinle</button><button type="button" class="dugme ikincil" data-r="ornekIndir" disabled>Kaydı indir</button><span class="not" data-r="ornekSure"></span></div>' +
          '<div class="teleprompter" data-r="okuma"></div>' +
        '</div>' +
      '</div></div>' +
    '</div>';
  }

  /* ================= oynatıcı ================= */
  function Oynatici(host, opt) {
    var self = this;
    this.opt = opt || {};
    this.host = host;
    this.kok = host.shadowRoot || (host.attachShadow ? host.attachShadow({ mode: 'open' }) : host);
    this.dersler = this.opt.dersler || {};
    var sekmeler = Object.keys(this.dersler).map(function (id) { return { id: id, ad: self.dersler[id].sekme || self.dersler[id].baslik }; });
    if (this.opt.metin) sekmeler.push({ id: 'metin', ad: 'Kendi metnin' });
    this.kok.innerHTML = '<style>' + CSS + '</style>' + sablon({ mod: this.opt.mod, sekmeler: sekmeler, metin: this.opt.metin, baslik: this.opt.baslik });
    this.r = {};
    Array.prototype.forEach.call(this.kok.querySelectorAll('[data-r]'), function (el) { self.r[el.getAttribute('data-r')] = el; });
    this.kokEl = this.kok.querySelector('.sd');
    if (this.opt.studyo === false) this.r.studyoAc.hidden = true;
    this.temaKoy(this.opt.tema);
    this.P = { id: null, ders: null, adimlar: [], i: -1, calisiyor: false, jeton: 0 };
    this.adimListeleri = {};
    this.sahneDurum = { tur: null, durum: {}, iyonlar: [], dongu: null };
    this.agizSaat = null;
    this.altKelimeler = [];
    this.kayitVar = {};
    Oynatici.hepsi.push(this);
    if (!TEBESIR_MASKE) { TEBESIR_MASKE = gurultu(120, 0.2); TEBESIR_TOZ = gurultu(160, 0.04, 70); }
    this.r.tahta.style.setProperty('--maske', TEBESIR_MASKE ? 'url(' + TEBESIR_MASKE + ')' : 'none');
    this.r.tahta.style.setProperty('--toz', TEBESIR_TOZ ? 'url(' + TEBESIR_TOZ + ')' : 'none');
    this.bagla();
    if (this.opt.mod !== 'pencere' && document.body) {
      // Kayıt stüdyosu sayfanın en üstünde açılsın (filtreli ya da kaydırılan kapsayıcıların dışında)
      var ph = document.createElement('div'); ph.setAttribute('data-sesli-ders', 'studyo');
      ph.style.cssText = 'position:relative;z-index:2147482500';
      document.body.appendChild(ph);
      var pk = ph.attachShadow ? ph.attachShadow({ mode: 'open' }) : ph;
      pk.innerHTML = '<style>' + CSS + '</style><div class="sd" data-mod="studyo"></div>';
      this.studyoKok = pk.querySelector('.sd');
      this.studyoKok.appendChild(this.r.studyo);
      this.temaKoy(this.opt.tema);
    }
    this.gorunumUygula();
    this.sesListesi();
    var klasor = this.opt.kayitKlasoru != null ? this.opt.kayitKlasoru : (window.SESLI_DERS_KAYIT_KLASORU || (BETIK_DIZIN ? BETIK_DIZIN + 'sesli/' : false));
    this.izinUygula();
    if (klasor) Yayin.yukle(klasor).then(function () { self.izinUygula(); self.sesListesi(); self.kayitDurumu(); self.bulutHazirla(); });
    else if (window.SESLI_DERS_BULUT) { Bulut.adres = window.SESLI_DERS_BULUT; setTimeout(function () { self.sesListesi(); }, 0); }
  }
  Oynatici.hepsi = [];
  Oynatici.prototype.temaKoy = function (t) {
    [this.kokEl, this.studyoKok].forEach(function (el) { if (!el) return; if (t) el.setAttribute('data-tema', t); else el.removeAttribute('data-tema'); });
  };

  Oynatici.prototype.bagla = function () {
    var self = this, r = this.r;
    r.oynat.addEventListener('click', function () { self.oynatDuraklat(); });
    r.perdeDugme.addEventListener('click', function () { self.calis(self.P.i >= self.P.adimlar.length ? 0 : Math.max(0, self.P.i)); });
    r.bolumSec.addEventListener('change', function () { var B = self.P.bolumler, b = B && B[+r.bolumSec.value]; if (b) self.calis(b.adim); });
    r.ileri.addEventListener('click', function () { self.calis(Math.min(self.P.adimlar.length - 1, self.P.i + 1)); });
    r.geri.addEventListener('click', function () { self.calis(Math.max(0, self.P.i - 1)); });
    r.bastan.addEventListener('click', function () { self.calis(0); });
    r.ayarDugme.addEventListener('click', function () {
      var acik = !self.kokEl.classList.contains('ayar-acik');
      self.kokEl.classList.toggle('ayar-acik', acik); r.ayarDugme.setAttribute('aria-pressed', String(acik));
      if (self.opt.mod !== 'pencere' && ayar.duzen !== 'akilli') { if (acik) r.yan.scrollIntoView({ behavior: 'smooth', block: 'start' }); self.kokEl.classList.remove('ayar-acik'); r.ayarDugme.setAttribute('aria-pressed', 'false'); }
    });
    if (r.kapat) r.kapat.addEventListener('click', function () { self.kapat(); });
    Array.prototype.forEach.call(this.kok.querySelectorAll('.sd-sekmeler [data-ders]'), function (b) { b.addEventListener('click', function () { self.yukle(b.getAttribute('data-ders')); }); });
    r.cumleDugme.addEventListener('click', function () { self.cumleEkle(); });
    r.cumle.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); self.cumleEkle(); } });
    var sayZaman = {};
    var sayac = function (ad) { clearTimeout(sayZaman[ad]); sayZaman[ad] = setTimeout(function () { self.metinSay(ad); }, 180); };
    r.cumle.addEventListener('input', function () { sayac('cumle'); });
    this.metinSay('cumle');
    r.ozelListe.addEventListener('click', function (e) { var b = e.target.closest('[data-sil]'); if (b) self.cumleSil(b.getAttribute('data-sil')); });
    if (r.metin) {
      r.metin.value = depo.al('metin', ORNEK_METIN);
      this.metinSay('metin');
      r.metin.addEventListener('input', function () { depo.yaz('metin', r.metin.value); sayac('metin'); });
      r.metinDugme.addEventListener('click', function () { self.adimListeleri.metin = metindenDers(r.metin.value).adimlar; self.P.adimlar = self.adimListeleri.metin; self.P.i = -1; self.planYap(); self.ozelListeCiz(); self.calis(0); });
      r.ornekDugme.addEventListener('click', function () { r.metin.value = ORNEK_METIN; depo.yaz('metin', ORNEK_METIN); self.metinSay('metin'); });
    }
    // ayarlar
    r.tahtalar.addEventListener('click', function (e) { var b = e.target.closest('[data-tahta]'); if (!b) return; ayar.tahta = b.getAttribute('data-tahta'); ayar.kalem = null; ayar.renk = 0; depo.yaz('tahta', ayar.tahta); depo.yaz('kalem', null); depo.yaz('renk', 0); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    r.kalemler.addEventListener('click', function (e) { var b = e.target.closest('[data-kalem]'); if (!b) return; ayar.kalem = b.getAttribute('data-kalem'); ayar.renk = 0; depo.yaz('kalem', ayar.kalem); depo.yaz('renk', 0); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    r.renkler.addEventListener('click', function (e) { var b = e.target.closest('[data-renk]'); if (!b) return; ayar.renk = +b.getAttribute('data-renk'); depo.yaz('renk', ayar.renk); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    r.yaziSec.addEventListener('change', function () { ayar.yazi = r.yaziSec.value; depo.yaz('yazi', ayar.yazi); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    r.kaynaklar.addEventListener('click', function (e) { var b = e.target.closest('[data-kaynak]'); if (!b) return; ayar.kaynak = b.getAttribute('data-kaynak'); depo.yaz('kaynak', ayar.kaynak); Oynatici.hepsi.forEach(function (o) { o.sesListesi(); o.kayitDurumu(); o.bulutHazirla(); }); });
    r.cinsler.addEventListener('click', function (e) { var b = e.target.closest('[data-cins]'); if (!b) return; ayar.cins = b.getAttribute('data-cins'); ayar.sesAdi = ''; ayar.bulutSes = ''; depo.yaz('cins', ayar.cins); depo.yaz('ses', ''); depo.yaz('bulutSes', ''); Oynatici.hepsi.forEach(function (o) { o.sesListesi(); o.gorunumUygula(); }); });
    r.sesSec.addEventListener('focus', function () { if (!Ses.tr.length) self.sesListesi(); });
    r.sesSec.addEventListener('change', function () {
      if (kaynakNe() === 'bulut') {
        var bv = BULUT_SESLER.filter(function (x) { return x.id === r.sesSec.value; })[0];
        ayar.bulutSes = bv ? bv.id : ''; depo.yaz('bulutSes', ayar.bulutSes);
        if (bv) { ayar.cins = bv.cins; depo.yaz('cins', ayar.cins); }
        Oynatici.hepsi.forEach(function (o) { o.sesListesi(); o.gorunumUygula(); o.bulutHazirla(); });
        return;
      }
      ayar.sesAdi = r.sesSec.value; depo.yaz('ses', ayar.sesAdi);
      var v = Ses.tr.filter(function (x) { return x.voiceURI === ayar.sesAdi; })[0];
      if (v && Ses.cinsi(v) !== '?') { ayar.cins = Ses.cinsi(v); depo.yaz('cins', ayar.cins); }
      Oynatici.hepsi.forEach(function (o) { o.sesListesi(); o.gorunumUygula(); });
    });
    r.tarzlar.addEventListener('click', function (e) { var b = e.target.closest('[data-tarz]'); if (!b) return; ayar.tarz = +b.getAttribute('data-tarz'); depo.yaz('tarz', ayar.tarz); Oynatici.hepsi.forEach(function (o) { o.sesListesi(); }); });
    r.hiz.addEventListener('input', function () { ayar.hiz = +r.hiz.value; depo.yaz('hiz', ayar.hiz); Oynatici.hepsi.forEach(function (o) { o.sesListesi(); }); });
    r.ogrGoster.addEventListener('change', function () { ayar.ogretmen = r.ogrGoster.checked; depo.yaz('ogretmen', ayar.ogretmen); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    var ikiliYap = function (v) { ayar.ikili = !!v; depo.yaz('ikili', ayar.ikili); Oynatici.hepsi.forEach(function (o) { o.planYap(); o.sesListesi(); o.gorunumUygula(); }); };
    r.bicimler.addEventListener('click', function (e) { var b = e.target.closest('[data-ikili]'); if (b) ikiliYap(b.getAttribute('data-ikili') === '1'); });
    r.ikiliDugme.addEventListener('click', function () { ikiliYap(!ayar.ikili); });
    var ikiliSecim = function (cins, deger) {
      if (kaynakNe() === 'bulut') { if (cins === 'e') { ayar.bulutSesE = deger; depo.yaz('bulutSesE', deger); } else { ayar.bulutSesK = deger; depo.yaz('bulutSesK', deger); } }
      else if (cins === 'e') { ayar.sesAdiE = deger; depo.yaz('sesAdiE', deger); } else { ayar.sesAdiK = deger; depo.yaz('sesAdiK', deger); }
      Oynatici.hepsi.forEach(function (o) { o.sesListesi(); });
    };
    r.sesSecK.addEventListener('change', function () { ikiliSecim('k', r.sesSecK.value); });
    r.sesSecE.addEventListener('change', function () { ikiliSecim('e', r.sesSecE.value); });
    r.studyoAc.addEventListener('click', function () { self.studyoAc(); });
    // Ders PDF'si: bölümlü derste bütün ders ya da şu anki bölüm
    r.pdfDugme.addEventListener('click', function () {
      var B = self.P.bolumler;
      if (!B || B.length < 2) { self.pdfYap(null); return; }
      var ac = r.pdfMenu.hidden; r.pdfMenu.hidden = !ac; r.pdfDugme.setAttribute('aria-expanded', String(ac));
      if (ac) { var b = self.bolumNo(); r.pdfTum.textContent = 'Bütün ders (' + B.length + ' bölüm)'; r.pdfBolum.textContent = 'Bu bölüm: ' + (B[b].ad.length > 34 ? B[b].ad.slice(0, 32) + '…' : B[b].ad); r.pdfDurum.textContent = ''; }
    });
    r.pdfTum.addEventListener('click', function () { self.pdfYap(null); });
    r.pdfBolum.addEventListener('click', function () { self.pdfYap(self.bolumNo()); });
    r.pdfKapat.addEventListener('click', function () { r.pdfMenu.hidden = true; r.pdfDugme.setAttribute('aria-expanded', 'false'); });
    // akıllı tahta görünümü ve yazı büyüklüğü (bu cihazda saklanır)
    var duzenYap = function (d) {
      ayar.duzen = d === 'akilli' ? 'akilli' : 'normal'; depo.yaz('duzen', ayar.duzen);
      Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); if (ayar.duzen !== 'akilli' && o.opt.mod !== 'pencere') { o.kokEl.classList.remove('ayar-acik'); o.r.ayarDugme.setAttribute('aria-pressed', 'false'); } });
      if (ayar.duzen !== 'akilli' && document.fullscreenElement) { try { document.exitFullscreen().catch(function () {}); } catch (e) {} }
      setTimeout(function () { Oynatici.hepsi.forEach(function (o) { if (o.tasiyor && o.tasiyor()) o.sigdir(); }); }, 60);
    };
    r.akilliDugme.addEventListener('click', function () { duzenYap(ayar.duzen === 'akilli' ? 'normal' : 'akilli'); });
    r.duzenler.addEventListener('click', function (e) { var b = e.target.closest('[data-duzen]'); if (b) duzenYap(b.getAttribute('data-duzen')); });
    r.buyuklukler.addEventListener('click', function (e) { var b = e.target.closest('[data-buyukluk]'); if (!b) return; ayar.buyukluk = +b.getAttribute('data-buyukluk') || 1; depo.yaz('buyukluk', ayar.buyukluk); Oynatici.hepsi.forEach(function (o) { o.gorunumUygula(); }); });
    r.yanKapat.addEventListener('click', function () { self.kokEl.classList.remove('ayar-acik'); r.ayarDugme.setAttribute('aria-pressed', 'false'); try { r.ayarDugme.focus(); } catch (e) {} });
    // öğretmen girişi ve öğrenci sesleri
    r.ogrGirisAc.addEventListener('click', function () { r.ogrGirisForm.hidden = !r.ogrGirisForm.hidden; if (!r.ogrGirisForm.hidden) { try { r.ogrAnahtar.focus(); } catch (e) {} } });
    var girisYap = function () {
      r.ogrGirisNot.hidden = false; r.ogrGirisNot.textContent = 'Denetleniyor…';
      Izin.gir(r.ogrAnahtar.value).then(function (ok) {
        r.ogrAnahtar.value = '';
        r.ogrGirisNot.textContent = ok ? '' : 'Anahtar geçersiz.'; r.ogrGirisNot.hidden = ok;
        if (ok) r.ogrGirisForm.hidden = true;
      });
    };
    r.ogrGirisDugme.addEventListener('click', girisYap);
    r.ogrAnahtar.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); girisYap(); } });
    r.ogretmenCik.addEventListener('click', function () { Izin.cik(); });
    r.ogrKaydet.addEventListener('click', function () { self.ogrKaydet(); });
    r.ogrSesK.addEventListener('change', function () { self.ogrDegisti = true; r.ogrKartNot.textContent = ''; });
    r.ogrSesE.addEventListener('change', function () { self.ogrDegisti = true; r.ogrKartNot.textContent = ''; });
    r.ogrDinleK.addEventListener('click', function () { self.ogrDinle(r.ogrSesK.value); });
    r.ogrDinleE.addEventListener('click', function () { self.ogrDinle(r.ogrSesE.value); });
    r.studyoKapat.addEventListener('click', function () { self.studyoKapat(); });
    var stDugmeleri = this.kok.querySelectorAll('[data-st]');
    Array.prototype.forEach.call(stDugmeleri, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(stDugmeleri, function (x) { x.setAttribute('aria-selected', String(x === b)); });
        r.stDers.hidden = b.getAttribute('data-st') !== 'ders'; r.stOrnek.hidden = b.getAttribute('data-st') !== 'ornek';
      });
    });
    r.studyoListe.addEventListener('click', function (e) { var b = e.target.closest('[data-is]'); if (b) self.studyoIslem(b.getAttribute('data-is'), +b.getAttribute('data-i')); });
    r.siraKaydet.addEventListener('click', function () { self.siraliKayit(); });
    r.paketIndir.addEventListener('click', function () { self.paketIndir(); });
    r.ornekKaydet.addEventListener('click', function () { self.ornekKayit(); });
    r.ornekDinle.addEventListener('click', function () { if (self.ornekBlob) { var a = new Audio(URL.createObjectURL(self.ornekBlob)); a.play().catch(function () {}); } });
    r.ornekIndir.addEventListener('click', function () { if (self.ornekBlob) indir(self.ornekBlob, 'ses-ornegi.' + kayitUzanti(self.ornekBlob.type)); });
    r.okuma.innerHTML = ORNEK_OKUMA.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    this.kok.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((e.target && e.target.tagName) || '')) return;
      if (e.key === ' ') { e.preventDefault(); self.oynatDuraklat(); }
      else if (e.key === 'ArrowRight') self.calis(Math.min(self.P.adimlar.length - 1, self.P.i + 1));
      else if (e.key === 'ArrowLeft') self.calis(Math.max(0, self.P.i - 1));
    });
    if (document.fullscreenEnabled && r.cerceve.requestFullscreen) {
      r.tamEkran.hidden = false;
      r.tamEkran.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
        else (ayar.duzen === 'akilli' && self.host.requestFullscreen ? self.host : r.cerceve).requestFullscreen().catch(function () {});
      });
    }
  };

  /* ---- görünüm: tahta, kalem, renk, yazı ---- */
  Oynatici.prototype.gorunumUygula = function () {
    var r = this.r, t = TAHTALAR[ayar.tahta], kt = kalemTuru(), k = KALEMLER[kt];
    var renkler = k.renkler, ri = Math.min(ayar.renk || 0, renkler.length - 1), anaRenk = renkler[ri][1];
    var y = YAZILAR.filter(function (x) { return x.id === ayar.yazi; })[0] || YAZILAR[0];
    yaziYukle(y);
    var tahta = r.tahta;
    tahta.style.setProperty('--zemin', t.zemin);
    tahta.style.setProperty('--k-yazi', anaRenk);
    var v = k.vurgu, ayni = function (a, b) { return a.toLowerCase() === b.toLowerCase(); };
    tahta.style.setProperty('--k-mavi', ayni(v.mavi, anaRenk) ? v.mor : v.mavi);
    tahta.style.setProperty('--k-kirmizi', ayni(v.kirmizi, anaRenk) ? v.turuncu : v.kirmizi);
    tahta.style.setProperty('--k-yesil', ayni(v.yesil, anaRenk) ? v.mavi : v.yesil);
    tahta.style.setProperty('--k-turuncu', v.turuncu);
    tahta.style.setProperty('--k-mor', ayni(v.mor, anaRenk) ? v.mavi : v.mor);
    tahta.style.setProperty('--k-gri', v.gri);
    tahta.style.setProperty('--aile', y.aile);
    tahta.style.setProperty('--olcek', String(y.olcek));
    tahta.setAttribute('data-kalem', kt);
    tahta.setAttribute('data-izgara', t.izgara ? '1' : '0');
    tahta.setAttribute('data-cerceve', t.cerceve);
    tahta.classList.toggle('koyu', !!t.koyu);
    tahta.classList.toggle('ogretmensiz', !ayar.ogretmen);
    r.cerceve.setAttribute('data-cerceve', t.cerceve);
    r.kalem.innerHTML = kalemSVG(kt, anaRenk);
    // raf: kalemler ya da tebeşirler
    var raf = '';
    if (kt === 'tebesir') raf = renkler.slice(0, 4).map(function (c, i) { return '<i style="left:calc(12% + ' + (i * 34) + 'px);width:26px;background:' + c[1] + '"></i>'; }).join('') + '<i style="left:58%;width:58px;height:9px;bottom:6px;background:linear-gradient(180deg,#6B4A2B 55%,#D8D2C6 55%)"></i>';
    else if (kt === 'dijital') raf = renkler.slice(0, 4).map(function (c, i) { return '<i style="left:calc(12% + ' + (i * 44) + 'px);width:36px;height:5px;bottom:8px;background:linear-gradient(90deg,#2B3036 72%,' + c[1] + ' 72%)"></i>'; }).join('');
    else raf = renkler.slice(0, 3).map(function (c, i) { return '<i style="left:calc(14% + ' + (i * 54) + 'px);width:46px;background:linear-gradient(90deg,' + c[1] + ' 70%,#14110F 70%)"></i>'; }).join('') + '<i style="left:58%;width:58px;height:9px;bottom:6px;background:linear-gradient(180deg,#3B4450 55%,#D9DDE2 55%)"></i>';
    r.raf.innerHTML = raf;
    // öğretmenin elindeki kalem
    var elk = this.kok.querySelector('.el-kalem rect');
    if (elk) elk.setAttribute('fill', anaRenk);
    if (!ayar.ikili) this.ogretmenCins(ayar.cins);
    r.ogretmen.hidden = !ayar.ogretmen;
    r.ogrGoster.checked = !!ayar.ogretmen;
    // seçim düğmeleri
    r.tahtalar.innerHTML = Object.keys(TAHTALAR).map(function (id) {
      var x = TAHTALAR[id]; return '<button type="button" data-tahta="' + id + '" aria-pressed="' + (id === ayar.tahta) + '"><span class="ornek-tahta" style="background:' + (x.izgara ? 'repeating-linear-gradient(0deg,#cfdbe7 0 1px,#fff 1px 4px)' : x.zemin) + '"></span>' + x.ad + '</button>';
    }).join('');
    r.kalemler.innerHTML = Object.keys(KALEMLER).map(function (id) { return '<button type="button" data-kalem="' + id + '" aria-pressed="' + (id === kt) + '">' + KALEMLER[id].ad + '</button>'; }).join('');
    r.renkler.innerHTML = renkler.map(function (c, i) { return '<button type="button" data-renk="' + i + '" aria-pressed="' + (i === ri) + '" aria-label="' + c[0] + '" title="' + c[0] + '" style="background:' + c[1] + '"></button>'; }).join('');
    if (!r.yaziSec.options.length) r.yaziSec.innerHTML = YAZILAR.map(function (x) { return '<option value="' + x.id + '">' + x.ad + '</option>'; }).join('');
    r.yaziSec.value = y.id;
    r.tarzlar.innerHTML = TARZLAR.map(function (x, i) { return '<button type="button" data-tarz="' + i + '" aria-pressed="' + (i === ayar.tarz) + '">' + x.ad + '</button>'; }).join('');
    r.hiz.value = ayar.hiz; r.hizDeger.textContent = Number(ayar.hiz).toFixed(2).replace('.', ',') + '×';
    Array.prototype.forEach.call(r.cinsler.querySelectorAll('[data-cins]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cins') === ayar.cins)); });
    var ek = kaynakNe(); Array.prototype.forEach.call(r.kaynaklar.querySelectorAll('[data-kaynak]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kaynak') === ek)); });
    Array.prototype.forEach.call(r.bicimler.querySelectorAll('[data-ikili]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-ikili') === '1') === ayar.ikili)); });
    r.ikiliDugme.setAttribute('aria-pressed', String(ayar.ikili));
    var ogt = Izin.ogretmen();
    r.tekCins.hidden = ayar.ikili; r.tekSes.hidden = ayar.ikili || !ogt; r.ikiliSes.hidden = !ayar.ikili || !ogt;
    var akilli = ayar.duzen === 'akilli';
    this.kokEl.classList.toggle('akilli', akilli); r.akilliDugme.setAttribute('aria-pressed', String(akilli));
    Array.prototype.forEach.call(r.duzenler.querySelectorAll('[data-duzen]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-duzen') === ayar.duzen)); });
    Array.prototype.forEach.call(r.buyuklukler.querySelectorAll('[data-buyukluk]'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-buyukluk') === +ayar.buyukluk)); });
    r.tahta.style.setProperty('--buyuk', String(+ayar.buyukluk || 1));
    // akıllı tahtada bölüm seçimi düğmelerin yanına geçer (tahtaya daha çok yer kalır)
    var oyn = this.kok.querySelector('.sd-oynatici'), bk = r.bolumKutu;
    if (oyn && bk) {
      if (akilli && bk.parentNode !== oyn) oyn.insertBefore(bk, oyn.querySelector('.sd-ilerleme'));
      else if (!akilli && bk.parentNode === oyn) r.cerceve.parentNode.insertBefore(bk, r.cerceve.nextSibling);
    }
  };
  Oynatici.prototype.ikiliListe = function () {
    var r = this.r, kaynak = kaynakNe();
    if (kaynak === 'bulut') {
      var liste = function (c) { return BULUT_SESLER.filter(function (v) { return v.cins === c; }).map(function (v) { return '<option value="' + v.id + '">' + esc(v.ad + (v.grup === 'dogal' ? '' : ' (sade)')) + '</option>'; }).join(''); };
      r.sesSecK.innerHTML = liste('k'); r.sesSecE.innerHTML = liste('e');
      r.sesSecK.value = konusmaciSesi('A').bulut; r.sesSecE.value = konusmaciSesi('B').bulut;
      r.sesSecK.disabled = r.sesSecE.disabled = false;
      return '';
    }
    Ses.yukle();
    var opt = function (v) { return '<option value="' + esc(v.voiceURI) + '">' + esc(Ses.ad(v)) + (Ses.dogal(v) ? ' · doğal' : '') + '</option>'; };
    var k = Ses.tr.filter(function (v) { return Ses.cinsi(v) !== 'e'; }), e = Ses.tr.filter(function (v) { return Ses.cinsi(v) !== 'k'; });
    r.sesSecK.innerHTML = '<option value="">Otomatik seç</option>' + k.map(opt).join('');
    r.sesSecE.innerHTML = '<option value="">Otomatik seç</option>' + e.map(opt).join('');
    r.sesSecK.value = Ses.tr.some(function (v) { return v.voiceURI === ayar.sesAdiK; }) ? ayar.sesAdiK : '';
    r.sesSecE.value = Ses.tr.some(function (v) { return v.voiceURI === ayar.sesAdiE; }) ? ayar.sesAdiE : '';
    r.sesSecK.disabled = r.sesSecE.disabled = !Ses.tr.length;
    var se = Ses.sec('e', ayar.sesAdiE || ''), sk = Ses.sec('k', ayar.sesAdiK || '');
    return se.not || sk.not || '';
  };
  Oynatici.prototype.sesListesi = function () {
    var r = this.r, kaynak = kaynakNe();
    if (ayar.ikili) {
      var bd0 = r.kaynaklar.querySelector('[data-kaynak="bulut"]'); if (bd0) bd0.hidden = !Bulut.hazir();
      Array.prototype.forEach.call(r.kaynaklar.querySelectorAll('[data-kaynak]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kaynak') === kaynak)); });
      var not = this.ikiliListe();
      if (kaynak === 'bulut') not = this.bulutUyari || '';
      r.sesNot.textContent = not; r.sesNot.hidden = !not;
      return;
    }
    var bd = r.kaynaklar.querySelector('[data-kaynak="bulut"]'); if (bd) bd.hidden = !Bulut.hazir();
    Array.prototype.forEach.call(r.kaynaklar.querySelectorAll('[data-kaynak]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kaynak') === kaynak)); });
    if (kaynak === 'bulut') {
      var sv = Bulut.ses(), bop = function (v) { return '<option value="' + v.id + '">' + esc(v.ad) + '</option>'; };
      r.sesEtiket.textContent = 'Doğal sesler (Google)';
      r.sesSec.innerHTML = '<optgroup label="Kadın sesleri">' + BULUT_SESLER.filter(function (v) { return v.cins === 'k' && v.grup === 'dogal'; }).map(bop).join('') + '</optgroup>' +
        '<optgroup label="Erkek sesleri">' + BULUT_SESLER.filter(function (v) { return v.cins === 'e' && v.grup === 'dogal'; }).map(bop).join('') + '</optgroup>' +
        '<optgroup label="Sade sesler">' + BULUT_SESLER.filter(function (v) { return v.grup !== 'dogal'; }).map(function (v) { return '<option value="' + v.id + '">' + esc(v.ad + (v.cins === 'k' ? ' · kadın' : ' · erkek')) + '</option>'; }).join('') + '</optgroup>';
      r.sesSec.value = sv.id; r.sesSec.disabled = false;
      r.sesNot.hidden = !this.bulutUyari; r.sesNot.textContent = this.bulutUyari || '';
      return;
    }
    r.sesEtiket.textContent = 'Cihazdaki Türkçe sesler';
    Ses.yukle();
    var gruplar = { k: [], e: [], '?': [] };
    Ses.tr.forEach(function (v) { gruplar[Ses.cinsi(v)].push(v); });
    var opt = function (v) { return '<option value="' + esc(v.voiceURI) + '">' + esc(Ses.ad(v)) + (Ses.dogal(v) ? ' · doğal' : '') + '</option>'; };
    r.sesSec.innerHTML = '<option value="">Otomatik seç</option>' +
      (gruplar.k.length ? '<optgroup label="Kadın sesleri">' + gruplar.k.map(opt).join('') + '</optgroup>' : '') +
      (gruplar.e.length ? '<optgroup label="Erkek sesleri">' + gruplar.e.map(opt).join('') + '</optgroup>' : '') +
      (gruplar['?'].length ? '<optgroup label="Diğer sesler">' + gruplar['?'].map(opt).join('') + '</optgroup>' : '');
    r.sesSec.value = Ses.tr.some(function (v) { return v.voiceURI === ayar.sesAdi; }) ? ayar.sesAdi : '';
    var s = Ses.sec();
    r.sesNot.textContent = s.not || ''; r.sesNot.hidden = !s.not;
    r.sesSec.disabled = !Ses.tr.length;
  };
  // Öğretmen modunda bütün sesler ve öğrenci sesleri kartı; öğrencide yalnız kadın/erkek seçimi
  Oynatici.prototype.izinUygula = function () {
    var r = this.r, og = Izin.ogretmen(), yv = Yayin.var();
    this.kokEl.classList.toggle('ogretmen', og);
    r.ogrKart.hidden = !og; r.ogrGiris.hidden = og;
    var cihazB = r.kaynaklar.querySelector('[data-kaynak="cihaz"]'); if (cihazB) cihazB.hidden = !og;
    var kayitB = r.kaynaklar.querySelector('[data-kaynak="kayit"]'); if (kayitB) kayitB.hidden = !og && !yv;
    var kaynakAlan = r.kaynaklar.parentNode; if (kaynakAlan && kaynakAlan.classList.contains('alan')) kaynakAlan.hidden = !og && !yv;
    if (r.studyoAc) r.studyoAc.hidden = !og || this.opt.studyo === false;
    ['gorunumAlan', 'indirKart', 'indirDugme'].forEach(function (k) { if (r[k]) r[k].hidden = !og; }); // video ve ses üretimi öğretmen araçlarıdır
    r.ogrSesNot.hidden = og;
    if (!og) r.ogrSesNot.textContent = ayar.ikili ? 'Elif Hoca ve Kerem Hoca öğretmeninin seçtiği seslerle anlatır.' : 'Kadın ya da erkek sesi seçebilirsin; sesler öğretmeninin seçtiği doğal seslerdir.';
    if (og) this.ogrKartDoldur();
    else if (Izin.girisSonuc === 'yanlis') { r.ogrGirisForm.hidden = false; r.ogrGirisNot.hidden = false; r.ogrGirisNot.textContent = 'Öğretmen bağlantısındaki anahtar geçersiz.'; }
    var ogt = og; r.tekSes.hidden = ayar.ikili || !ogt; r.ikiliSes.hidden = !ayar.ikili || !ogt;
  };
  Oynatici.prototype.ogrKartDoldur = function () {
    var r = this.r, op = function (c) { return BULUT_SESLER.filter(function (v) { return v.cins === c; }).map(function (v) { return '<option value="' + v.id + '">' + esc(v.ad + (v.grup === 'dogal' ? '' : ' (sade)')) + '</option>'; }).join(''); };
    if (!r.ogrSesK.options.length) { r.ogrSesK.innerHTML = op('k'); r.ogrSesE.innerHTML = op('e'); }
    if (!this.ogrDegisti) { r.ogrSesK.value = Izin.ogrenci.k; r.ogrSesE.value = Izin.ogrenci.e; }
  };
  Oynatici.prototype.ogrKaydet = function () {
    var self = this, r = this.r, o = { k: r.ogrSesK.value, e: r.ogrSesE.value };
    r.ogrKaydet.disabled = true; r.ogrKartNot.textContent = 'Kaydediliyor…';
    Izin.kaydet(o).then(function (s) {
      r.ogrKaydet.disabled = false;
      if (s === 'tamam') { self.ogrDegisti = false; r.ogrKartNot.textContent = 'Kaydedildi. Öğrenciler bundan sonra bu iki sesi duyar.'; Oynatici.hepsi.forEach(function (x) { x.ogrKartDoldur(); x.sesListesi(); }); }
      else if (s === 'eski') r.ogrKartNot.textContent = 'Ses servisi eski sürümde. Öğrenci seslerini kaydetmek için ses servisini bir kez güncellemek gerekiyor (sesli/README.md).';
      else if (s === 'red') r.ogrKartNot.textContent = 'Ses servisi öğretmen anahtarını kabul etmedi.';
      else r.ogrKartNot.textContent = 'Ses servisine ulaşılamadı; biraz sonra yeniden dene.';
    });
  };
  Oynatici.prototype.ogrDinle = function (id) {
    var r = this.r;
    if (!Bulut.hazir()) { r.ogrKartNot.textContent = 'Doğal seslere şu an ulaşılamıyor.'; return; }
    Ses.kilidiAc();
    Bulut.al('Merhaba! Bugün kimya dersinde birlikte çalışacağız.', id).then(function (k) {
      var a = Ses.ortak(); a.onended = a.onerror = a.onloadedmetadata = null; a.loop = false; a.src = k.url;
      try { a.defaultPlaybackRate = 1; a.playbackRate = 1; } catch (e) {}
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    }).catch(function () { r.ogrKartNot.textContent = 'Ses örneği alınamadı.'; });
  };
  // Bulut sesinde ilk cümle önceden istenir; başlatınca beklemeden çalar
  Oynatici.prototype.bulutHazirla = function () {
    var a = this.P.adimlar && this.P.adimlar[Math.max(0, this.P.i)];
    if (a && kaynakNe() === 'bulut') Bulut.al(a.s).catch(function () {});
  };
  Oynatici.prototype.bulutUyar = function () {
    this.bulutUyari = Bulut.mola && Date.now() < Bulut.mola ? 'Doğal seslerin bugünkü kotası doldu ya da servis çok yoğun; cümleler bir süre cihaz sesiyle okunacak.' : 'Doğal seslere şu an ulaşılamadı; cümleler cihaz sesiyle okunuyor.';
    this.r.sesNot.textContent = this.bulutUyari; this.r.sesNot.hidden = false;
  };

  /* ---- öğretmen ---- */
  Oynatici.prototype.ogretmenCins = function (c) { var o = this.r.ogretmen; o.classList.toggle('kadin', c === 'k'); o.classList.toggle('erkek', c !== 'k'); };
  Oynatici.prototype.konusuyor = function (v) {
    var o = this.r.ogretmen; clearInterval(this.agizSaat); o.classList.remove('agiz');
    if (v && !AZ) this.agizSaat = setInterval(function () { o.classList.toggle('agiz', Math.random() < 0.62); }, 115);
  };
  Oynatici.prototype.yaziyor = function (v) { this.r.ogretmen.classList.toggle('yaziyor', !!v); };
  Oynatici.prototype.gosteriyor = function (v) { this.r.ogretmen.classList.toggle('gosteriyor', !!v); };

  /* ---- tahta ---- */
  Oynatici.prototype.temizle = function () { var y = this.r.yazi; y.innerHTML = '<i class="sd-yer1" aria-hidden="true"></i><i class="sd-yer2" aria-hidden="true"></i>'; y.classList.remove('siliniyor'); y.style.removeProperty('--sig'); };
  Oynatici.prototype.tasiyor = function () { var y = this.r.yazi; return y.scrollHeight > y.clientHeight + 2; };
  // Tek başına tahtaya sığmayan uzun soru ya da şekil: yazıyı küçült
  Oynatici.prototype.sigdir = function () {
    var y = this.r.yazi, olcek = parseFloat(y.style.getPropertyValue('--sig')) || 1;
    var enAz = this.grupKilit ? 0.36 : 0.5, adim = this.grupKilit ? 0.04 : 0.08;
    while (this.tasiyor() && olcek > enAz) { olcek = Math.round((olcek - adim) * 100) / 100; y.style.setProperty('--sig', String(olcek)); }
  };
  // Henüz yazılmamış bloklar tahtaya (üstteki yazılarla birlikte) sığıyor mu? Görünmez eklenip ölçülür;
  // sığana kadar yazı küçültülür (en çok enAz'a kadar). Sığarsa ölçek kalır.
  Oynatici.prototype.olcekKoy = function (bloklar, enAz) {
    var y = this.r.yazi, eski = y.style.getPropertyValue('--sig'), o = 1;
    bloklar.forEach(function (el) { el.style.visibility = 'hidden'; y.appendChild(el); });
    y.style.setProperty('--sig', '1');
    while (this.tasiyor() && o > enAz) { o = Math.round((o - 0.04) * 100) / 100; y.style.setProperty('--sig', String(o)); }
    var ok = !this.tasiyor();
    bloklar.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    if (!ok) { if (eski) y.style.setProperty('--sig', eski); else y.style.removeProperty('--sig'); }
    return ok;
  };
  // Grup başı: soru tek tahtada; çözüm tek tahtada (sığmazsa tahta silinir, soru yeniden yazılır, gerekirse yalnız çözüm)
  Oynatici.prototype.grupHazirla = function (i, anlik) {
    var self = this, A = this.P.adimlar, a = A[i], g = a.grup, tur = a.grupTur, parca = [], soru = [], j;
    for (j = i; j < A.length && A[j].grup === g && A[j].grupTur === tur; j++) parca.push(A[j]);
    if (tur === 'c') for (j = i - 1; j >= 0 && A[j].grup === g && A[j].grupTur === 's'; j--) soru.unshift(A[j]);
    var yap = function (l) { var els = []; l.forEach(function (s) { (s.w || s.h || []).forEach(function (b) { els.push(self.blok(b, s.oto)); }); }); return els; };
    if (!this.r.yazi.querySelector('.blok')) { this.olcekKoy(yap(parca), 0.36); return Promise.resolve(); }
    if (this.olcekKoy(yap(parca), 0.66)) return Promise.resolve(); // yazı çok küçülmeden soru ile çözüm birlikte
    return this.sil(anlik).then(function () {
      if (soru.length) { // soru yeniden (bir anda) yazılır, çözüm altına sığıyorsa öyle kalır
        var sEl = yap(soru);
        sEl.forEach(function (el) { self.r.yazi.appendChild(el); });
        sEl.forEach(function (el) {
          var kel = el.querySelectorAll('.w'); self.goster(kel, kel.length, true);
          Array.prototype.forEach.call(el.querySelectorAll('svg[data-grafik]'), function (svg) { grafikHazirla(svg); grafikTamamla(svg, 1e9); });
        });
        if (self.olcekKoy(yap(parca), 0.66)) return;
        self.temizle();
      }
      self.olcekKoy(yap(parca), 0.36);
    });
  };
  Oynatici.prototype.sil = function (anlik) {
    var self = this, r = this.r;
    if (anlik || AZ || !r.yazi.querySelector('.blok')) { this.temizle(); return Promise.resolve(); }
    r.silgi.classList.remove('calis'); void r.silgi.offsetWidth; r.silgi.classList.add('calis');
    r.yazi.classList.add('siliniyor');
    if (r.tahta.classList.contains('koyu')) { var iz = +(r.iz.dataset.d || 0); iz = Math.min(0.16, iz + 0.04); r.iz.dataset.d = iz; r.iz.style.opacity = iz; r.iz.style.transform = 'rotate(' + (Math.random() * 6 - 3) + 'deg)'; }
    return sleep(700).then(function () { self.temizle(); r.silgi.classList.remove('calis'); });
  };
  Oynatici.prototype.blok = function (b, oto) {
    var el = document.createElement('div');
    el.className = 'blok' + (b.c ? ' ' + String(b.c).split(/\s+/).filter(Boolean).map(function (x) { return 'b-' + x; }).join(' ') : '');
    if (b.html != null) { el.innerHTML = b.html; stilTemizle(el); kelimele(el); return el; }
    el.innerHTML = sozcukler(b.t).map(function (x, i) {
      return (i && !x.bitisik ? ' ' : '') + '<span class="w"' + (x.k ? ' data-k="' + x.k + '"' : '') + '>' + (oto ? otomatikHTML(x.t) : isaretHTML(x.t)) + '</span>';
    }).join('');
    return el;
  };
  // Sayfadan gelen HTML'deki sınıf ve satır içi biçimler tahtada çakışmasın (şekillerin içi olduğu gibi kalır)
  function stilTemizle(kok) {
    Array.prototype.forEach.call(kok.querySelectorAll('*'), function (n) {
      if (n.closest('svg')) return;
      ['style', 'class', 'id', 'onclick', 'width', 'height', 'align', 'bgcolor', 'color'].forEach(function (a) { if (n.hasAttribute(a) && !(n.tagName === 'IMG' && /width|height/.test(a))) n.removeAttribute(a); });
      if (n.tagName === 'FONT') { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); }
    });
  }
  function altUstHTML(t) {
    return esc(t).replace(/[₀-₉]+/g, function (m) { return '<sub>' + rakamCevir(m, ALT_RAKAM) + '</sub>'; })
      .replace(/[⁰-⁹¹²³⁺⁻]+/g, function (m) { return '<sup>' + rakamCevir(m, UST_RAKAM).replace(/⁺/g, '+').replace(/⁻/g, '−') + '</sup>'; });
  }
  function kelimele(kok) {
    (function gez(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parcalar = c.nodeValue.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parcalar.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
            else { var s = document.createElement('span'); s.className = 'w'; if (/[₀-₉⁰-⁹¹²³⁺⁻]/.test(p)) s.innerHTML = altUstHTML(p); else s.textContent = p; frag.appendChild(s); }
          });
          n.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          var t = c.tagName.toLowerCase();
          if (t === 'svg' || t === 'table' || t === 'img' || t === 'canvas') { c.classList.add('w'); c.classList.add('w-blok'); return; }
          if (t === 'script' || t === 'style') { c.remove(); return; }
          if (c.hasAttribute('id')) c.removeAttribute('id');
          gez(c);
        }
      });
    })(kok);
  }
  Oynatici.prototype.ekle = function (bloklar, oto, anlik) {
    var self = this, y = this.r.yazi, els = (bloklar || []).map(function (b) { return self.blok(b, oto); });
    els.forEach(function (el) { y.appendChild(el); });
    if (els.length && this.tasiyor() && y.querySelectorAll('.blok').length > els.length && !this.grupKilit) {
      els.forEach(function (el) { el.remove(); });
      return this.sil(anlik).then(function () { els.forEach(function (el) { y.appendChild(el); }); self.sigdir(); return els; });
    }
    if (els.length) this.sigdir();
    return Promise.resolve(els);
  };
  Oynatici.prototype.goster = function (kelimeler, n, anlik) {
    for (var i = 0; i < kelimeler.length; i++) {
      var w = kelimeler[i];
      if (i < n && !w.classList.contains('on')) { if (anlik) w.classList.add('anlik'); w.classList.add('on'); var b = w.closest('.blok'); if (b) b.classList.add('acik'); }
    }
    var sonW = kelimeler[Math.min(n, kelimeler.length) - 1];
    if (sonW && !anlik) {
      var rr = sonW.getBoundingClientRect(), t = this.r.tahta.getBoundingClientRect(), kh = this.r.kalem.getBoundingClientRect().height || 20;
      this.r.kalem.style.transform = 'translate(' + (rr.right - t.left - 2) + 'px,' + (rr.bottom - t.top - kh * 0.9) + 'px)';
    }
  };
  Oynatici.prototype.kalemGoster = function (v) { this.r.kalem.classList.toggle('aktif', !!v); };
  Oynatici.prototype.bolumNo = function () { var B = this.P.bolumler || [], i = Math.max(0, this.P.i), s = 0; for (var k = 0; k < B.length; k++) if (B[k].adim <= i) s = k; return s; };
  Oynatici.prototype.pdfYap = function (bolum) {
    var self = this, r = this.r, P = this.P;
    if (this.pdfCalisiyor) return;
    var ders = { baslik: (P.ders && P.ders.baslik) || (r.baslik ? r.baslik.textContent : '') || 'Ders notu', adimlar: P.adimlar || [], bolumler: P.bolumler };
    if (!ders.adimlar.length) return;
    this.pdfCalisiyor = true;
    var durum = function (t) { if (r.pdfMenu.hidden) { r.pdfMenu.hidden = false; r.pdfDugme.setAttribute('aria-expanded', 'true'); r.pdfTum.hidden = r.pdfBolum.hidden = !(P.bolumler && P.bolumler.length > 1); } r.pdfDurum.textContent = t; };
    [r.pdfDugme, r.pdfTum, r.pdfBolum].forEach(function (b) { b.disabled = true; });
    durum('PDF hazırlanıyor…');
    dersPdf(ders, { bolum: bolum }).then(function () { durum('İndirildi. Dosyalar ya da İndirilenler klasörüne bak.'); }, function () { durum('PDF hazırlanamadı. İnternet bağlantısını denetleyip yeniden dene.'); })
      .then(function () { self.pdfCalisiyor = false; [r.pdfDugme, r.pdfTum, r.pdfBolum].forEach(function (b) { b.disabled = false; }); });
  };
  Oynatici.prototype.kalemKoy = function (x, y) { // kalemin ucu ekrandaki (x, y) noktasına
    var t = this.r.tahta.getBoundingClientRect(), kh = this.r.kalem.getBoundingClientRect().height || 20;
    this.r.kalem.style.transform = 'translate(' + (x - t.left - 2) + 'px,' + (y - t.top - kh * 0.9) + 'px)';
  };
  // Grafik adımı: tahtadaki grafiği bul, önceki aşamaları tamamla
  Oynatici.prototype.grafikBul = function (a, els) {
    if (!a.grafik) return null;
    var svg = null;
    (els || []).forEach(function (el) { if (!svg) svg = el.querySelector('svg[data-grafik]'); });
    if (!svg) svg = this.r.yazi.querySelector('svg[data-grafik="' + a.grafik.id + '"]');
    if (!svg) return null;
    grafikHazirla(svg); grafikTamamla(svg, a.grafik.asama - 1);
    return { svg: svg, asama: a.grafik.asama };
  };
  // Cümlede tahtadaki grafiğin bir eğrisi (adı, formülü ya da rengi) ya da bir anı (t₁ gibi) geçiyorsa kalem orayı gösterir
  Oynatici.prototype.grafikHedef = function (a) {
    var svgler = this.r.yazi.querySelectorAll('svg[data-grafik]');
    if (!svgler.length || AZ) return null;
    var svg = svgler[svgler.length - 1], tok = gAnahtar(adimMetni(a));
    if (!tok.length) return null;
    var esle = function (el, ad) { return el.getAttribute(ad).split(' ').some(function (x) { return x.length >= 2 && tok.indexOf(x) >= 0; }); };
    var ogeler = Array.prototype.filter.call(svg.querySelectorAll('[data-gk]'), function (el) { return esle(el, 'data-gk') && getComputedStyle(el).opacity !== '0'; });
    var isaret = null;
    if (!ogeler.length) Array.prototype.forEach.call(svg.querySelectorAll('[data-gx]'), function (el) { if (!isaret && esle(el, 'data-gx')) isaret = el; });
    return ogeler.length || isaret ? { svg: svg, ogeler: ogeler.slice(0, 3), isaret: isaret } : null;
  };
  Oynatici.prototype.grafikGoster = function (h, p) {
    if (!h.kuruldu) {
      h.kuruldu = true;
      h.ogeler.forEach(function (el) { el.classList.add('ga-vurgu'); });
      h.liste = h.ogeler.map(function (el) { return { el: el, t: 'c', L: gUzunluk(el) }; }).filter(function (o) { return o.L > 0; });
      if (h.isaret) {
        try {
          var b = h.isaret.getBBox(), c = document.createElementNS(G_NS, 'ellipse');
          c.setAttribute('cx', b.x + b.width / 2); c.setAttribute('cy', b.y + b.height / 2); c.setAttribute('rx', b.width / 2 + 7); c.setAttribute('ry', b.height / 2 + 5);
          c.setAttribute('class', 'ga-halka'); if (h.isaret.getAttribute('transform')) c.setAttribute('transform', h.isaret.getAttribute('transform'));
          h.isaret.parentNode.appendChild(c); h.halka = c;
        } catch (e) {}
      }
    }
    var q = p / 0.92;
    if (q <= 0) return null;
    if (q > 1) q = 1;
    if (h.liste.length) {
      var top = 0, gecen = 0, uc = null; h.liste.forEach(function (o) { top += o.L; });
      h.liste.forEach(function (o) { var u = (q * top - gecen) / o.L; gecen += o.L; if (!uc && u >= 0 && u <= 1) uc = grafikUc(o, u); });
      return uc;
    }
    return h.isaret ? grafikUc({ el: h.isaret, t: 'f' }, 1) : null;
  };
  Oynatici.prototype.grafikGosterBitir = function (h) {
    h.ogeler.forEach(function (el) { el.classList.remove('ga-vurgu'); });
    if (h.halka && h.halka.parentNode) h.halka.parentNode.removeChild(h.halka);
  };
  Oynatici.prototype.isaretle = function (anahtarlar, sinif, anlik) {
    var y = this.r.yazi;
    (anahtarlar || []).forEach(function (k, i) {
      Array.prototype.forEach.call(y.querySelectorAll('[data-k="' + k + '"]'), function (el) {
        if (anlik) { el.classList.add('anlik'); el.classList.add(sinif); return; }
        setTimeout(function () { el.classList.add(sinif); }, i * 260);
      });
    });
  };

  /* ---- deney sahneleri ---- */
  var SAHNE_AYAR = {
    agcl: { beher: 'AgNO₃(suda)', tup: 'NaCl(suda)', renk: '#FFFFFF', kenar: '#7E8E9E', ad: 'AgCl(k)', sivi: '#D7E8F5', bulanik: '#EEF2F5', akis: '#9EC3E2' },
    pbi2: { beher: 'Pb(NO₃)₂(suda)', tup: 'KI(suda)', renk: '#F8C913', kenar: '#B98C00', ad: 'PbI₂(k)', sivi: '#DCEAF5', bulanik: '#F6E38A', akis: '#A6C8E4' }
  };
  var IYON_TUR = {
    ag: { ad: 'Ag⁺', r: 13, renk: '#B7BFC9', yazi: '#1F2733' }, cl: { ad: 'Cl⁻', r: 15, renk: '#3E9B57', yazi: '#FFFFFF' },
    na: { ad: 'Na⁺', r: 11.5, renk: '#8A5CF0', yazi: '#FFFFFF' }, no3: { ad: 'NO₃⁻', r: 16, renk: '#2C74C2', yazi: '#FFFFFF' }
  };
  function siviYol(y) { return 'M152 ' + y + ' V260 Q152 272 164 272 H276 Q288 272 288 260 V' + y + ' Z'; }
  Oynatici.prototype.sahneGoster = function (ad) {
    var S = this.sahneDurum, r = this.r;
    if (S.tur === ad) return;
    this.sahneGizle(); if (!ad) return;
    S.tur = ad; S.durum = {};
    r.tahta.classList.add('sahneli');
    r.sahne.innerHTML = ad === 'iyon' ? this.iyonSVG() : this.beherSVG(SAHNE_AYAR[ad]);
    if (ad === 'iyon') this.iyonKur();
  };
  Oynatici.prototype.sahneGizle = function () {
    var S = this.sahneDurum; S.tur = null; cancelAnimationFrame(S.dongu); S.dongu = null;
    this.r.tahta.classList.remove('sahneli'); this.r.sahne.innerHTML = ''; this.gosteriyor(false);
  };
  Oynatici.prototype.beherSVG = function (c) {
    var cz = [140, 165, 190, 215, 240].map(function (y, i) { return '<line x1="160" y1="' + y + '" x2="' + (i % 2 ? 170 : 178) + '" y2="' + y + '"/>'; }).join('');
    return '<svg viewBox="0 0 400 300" role="img" aria-label="' + c.beher + ' bulunan behere ' + c.tup + ' ekleniyor">' +
      '<line x1="20" y1="275" x2="380" y2="275" stroke="#C3CAD2" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="sivi" d="' + siviYol(196) + '" fill="' + c.sivi + '"/><line class="yuzey" x1="153" y1="196" x2="287" y2="196" stroke="#9FC0DA" stroke-width="2"/><g class="cokelek"></g>' +
      '<path d="M146 102 L152 110 V260 Q152 272 164 272 H276 Q288 272 288 260 V110 L294 102" fill="none" stroke="#56636F" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<g stroke="#9AA6B2" stroke-width="2">' + cz + '</g>' +
      '<text x="226" y="252" text-anchor="middle" class="etk">' + c.beher + '</text>' +
      '<path class="akis" d="M212 74 Q215 130 219 196" fill="none" stroke="' + c.akis + '" stroke-width="6" stroke-linecap="round" opacity="0"/>' +
      '<g class="tup" transform="translate(84 44) rotate(0)"><path d="M-13 0 V92 A13 13 0 0 0 13 92 V0" fill="#F4F8FB" stroke="#56636F" stroke-width="3"/>' +
      '<path class="tup-sivi" d="M-10.5 38 V92 A10.5 10.5 0 0 0 10.5 92 V38 Z" fill="' + c.sivi + '"/><line x1="-17" y1="0" x2="17" y2="0" stroke="#56636F" stroke-width="3" stroke-linecap="round"/></g>' +
      '<text class="etk tup-etk" x="84" y="172" text-anchor="middle">' + c.tup + '</text>' +
      '<g class="cok-etk" opacity="0"><path d="M330 226 Q312 246 292 262" fill="none" stroke="#56636F" stroke-width="2"/><path d="M290 264 L292 254 L299 260 Z" fill="#56636F"/><text x="334" y="222" class="etk">' + c.ad + '</text></g></svg>';
  };
  Oynatici.prototype.iyonSVG = function () {
    return '<svg viewBox="62 0 276 300" role="img" aria-label="Çözeltideki iyonların büyütülmüş görünümü"><circle cx="200" cy="150" r="130" fill="#EEF5FB" stroke="#8FA0B0" stroke-width="3"/>' +
      '<text x="200" y="14" text-anchor="middle" class="etk kucuk">büyütülmüş görünüm</text><g class="iyonlar"></g>' +
      '<text class="iy-etk" x="200" y="297" text-anchor="middle" opacity="0" style="font-family:var(--ui);font-size:14px;font-weight:700;fill:#2B333D">AgCl(k) dibe çöker</text>' +
      '<text class="sy-etk" x="200" y="40" text-anchor="middle" opacity="0" style="font-family:var(--ui);font-size:14px;font-weight:700;fill:#E04E00">seyirci: Na⁺, NO₃⁻</text></svg>';
  };
  Oynatici.prototype.sahneYap = function (ad, anlik) {
    var S = this.sahneDurum, self = this, svg = this.r.sahne.querySelector('svg');
    if (!svg) return Promise.resolve();
    var c = SAHNE_AYAR[S.tur];
    if (ad === 'dok') {
      if (S.durum.dok) return Promise.resolve(); S.durum.dok = 1;
      var tup = svg.querySelector('.tup'), akis = svg.querySelector('.akis'), sivi = svg.querySelector('.sivi'), yuzey = svg.querySelector('.yuzey'), ts = svg.querySelector('.tup-sivi'), etk = svg.querySelector('.tup-etk');
      var L = akis.getTotalLength ? akis.getTotalLength() : 130;
      var tupA = function (x, y, a) { tup.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + a + ')'); };
      var sev = function (y) { sivi.setAttribute('d', siviYol(y)); yuzey.setAttribute('y1', y); yuzey.setAttribute('y2', y); };
      if (anlik || AZ) { sev(182); ts.setAttribute('d', 'M-10.5 78 V92 A10.5 10.5 0 0 0 10.5 92 V78 Z'); etk.setAttribute('opacity', '0.55'); return Promise.resolve(); }
      this.gosteriyor(true); akis.style.strokeDasharray = L; akis.style.strokeDashoffset = L; etk.setAttribute('opacity', '0');
      return tween(900, function (t) { tupA(84 + 128 * t, 44 + 26 * t, 118 * t); })
        .then(function () { akis.setAttribute('opacity', '1'); return tween(380, function (t) { akis.style.strokeDashoffset = L * (1 - t); }); })
        .then(function () { return tween(1200, function (t) { sev(196 - 14 * t); var yy = 38 + 40 * t; ts.setAttribute('d', 'M-10.5 ' + yy + ' V92 A10.5 10.5 0 0 0 10.5 92 V' + yy + ' Z'); }); })
        .then(function () { return tween(280, function (t) { akis.setAttribute('opacity', String(1 - t)); }); })
        .then(function () { return tween(700, function (t) { tupA(212 - 128 * t, 70 - 26 * t, 118 * (1 - t)); }); })
        .then(function () { etk.setAttribute('opacity', '0.55'); self.gosteriyor(false); });
    }
    if (ad === 'bulut') {
      if (S.durum.bulut) return Promise.resolve(); S.durum.bulut = 1;
      if (!S.durum.dok) this.sahneYap('dok', true);
      var g = svg.querySelector('.cokelek'), sv = svg.querySelector('.sivi'), NS = 'http://www.w3.org/2000/svg', parca = [];
      for (var i = 0; i < 90; i++) {
        var p = document.createElementNS(NS, 'circle'), x = 158 + Math.random() * 124, y = 188 + Math.random() * 80;
        p.setAttribute('cx', x.toFixed(1)); p.setAttribute('cy', y.toFixed(1)); p.setAttribute('r', (1.5 + Math.random() * 1.9).toFixed(2));
        p.setAttribute('fill', c.renk); p.setAttribute('stroke', c.kenar); p.setAttribute('stroke-width', '0.6'); p.setAttribute('opacity', '0');
        g.appendChild(p); parca.push({ el: p, x: x, y: y, gec: Math.random() * 0.6 });
      }
      S.durum.parca = parca;
      if (anlik || AZ) { parca.forEach(function (q) { q.el.setAttribute('opacity', '0.95'); }); sv.setAttribute('fill', karistir(c.sivi, c.bulanik, .7)); if (S.tur === 'pbi2') this.sahneYap('cokel', true); return Promise.resolve(); }
      this.gosteriyor(true);
      return tween(1600, function (t) {
        sv.setAttribute('fill', karistir(c.sivi, c.bulanik, .7 * t));
        parca.forEach(function (q) { var k = Math.max(0, Math.min(1, (t - q.gec) / 0.4)); q.el.setAttribute('opacity', (0.95 * k).toFixed(2)); });
      }).then(function () { self.gosteriyor(false); if (S.tur === 'pbi2') return self.sahneYap('cokel', false); });
    }
    if (ad === 'cokel') {
      if (S.durum.cokel) return Promise.resolve();
      if (!S.durum.bulut) this.sahneYap('bulut', true);
      S.durum.cokel = 1;
      var sv2 = svg.querySelector('.sivi'), etk2 = svg.querySelector('.cok-etk'), pr = S.durum.parca || [];
      pr.forEach(function (q) { q.hx = 160 + Math.random() * 120; q.hy = 260 + Math.random() * 9; q.bx = q.x; q.by = q.y; });
      var bitir = function () { etk2.setAttribute('opacity', '1'); };
      if (anlik || AZ) { pr.forEach(function (q) { q.el.setAttribute('cx', q.hx.toFixed(1)); q.el.setAttribute('cy', q.hy.toFixed(1)); }); sv2.setAttribute('fill', karistir(c.sivi, c.bulanik, .12)); bitir(); return Promise.resolve(); }
      return tween(1900, function (t) {
        sv2.setAttribute('fill', karistir(c.sivi, c.bulanik, .7 - .58 * t));
        pr.forEach(function (q) { q.el.setAttribute('cx', (q.bx + (q.hx - q.bx) * t).toFixed(1)); q.el.setAttribute('cy', (q.by + (q.hy - q.by) * Math.min(1, t * (1.1 + q.gec))).toFixed(1)); });
      }).then(bitir);
    }
    if (ad === 'esles') return this.iyonEsles(anlik);
    if (ad === 'seyirci') {
      if (S.durum.seyirci) return Promise.resolve(); S.durum.seyirci = 1;
      if (!S.durum.esles) this.iyonEsles(true);
      S.iyonlar.forEach(function (o) { if (o.tur === 'na' || o.tur === 'no3') o.el.classList.add('parla'); });
      var e = svg.querySelector('.sy-etk'); if (e) e.setAttribute('opacity', '1');
    }
    return Promise.resolve();
  };
  Oynatici.prototype.iyonKur = function () {
    var S = this.sahneDurum, g = this.r.sahne.querySelector('.iyonlar'), NS = 'http://www.w3.org/2000/svg', self = this;
    S.iyonlar = [];
    [['ag', 5], ['cl', 5], ['na', 4], ['no3', 4]].forEach(function (d) {
      for (var i = 0; i < d[1]; i++) {
        var tur = IYON_TUR[d[0]], x, y, deneme = 0;
        do { var a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (112 - tur.r); x = 200 + Math.cos(a) * rr; y = 150 + Math.sin(a) * rr; deneme++; }
        while (deneme < 60 && S.iyonlar.some(function (o) { return Math.hypot(o.x - x, o.y - y) < o.r + tur.r + 3; }));
        var el = document.createElementNS(NS, 'g');
        el.innerHTML = '<circle r="' + tur.r + '" fill="' + tur.renk + '" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/><text class="iy-yazi" text-anchor="middle" dy="0.36em" fill="' + tur.yazi + '">' + tur.ad + '</text>';
        g.appendChild(el);
        var hz = 16 + Math.random() * 16, yon = Math.random() * Math.PI * 2;
        S.iyonlar.push({ tur: d[0], r: tur.r, x: x, y: y, vx: Math.cos(yon) * hz, vy: Math.sin(yon) * hz, el: el });
      }
    });
    this.iyonCiz();
    if (!AZ) { var once = performance.now(); var dongu = function (now) { var dt = Math.min(0.05, (now - once) / 1000); once = now; self.iyonAdim(dt); self.iyonCiz(); S.dongu = requestAnimationFrame(dongu); }; S.dongu = requestAnimationFrame(dongu); }
  };
  Oynatici.prototype.iyonAdim = function (dt) {
    var S = this.sahneDurum, ust = S.durum.esles ? 196 : 400;
    S.iyonlar.forEach(function (o) {
      if (o.sabit || o.hedef) return;
      o.x += o.vx * dt; o.y += o.vy * dt;
      var dx = o.x - 200, dy = o.y - 150, d = Math.hypot(dx, dy), max = 124 - o.r;
      if (d > max) { var nx = dx / d, ny = dy / d, vn = o.vx * nx + o.vy * ny; o.vx -= 2 * vn * nx; o.vy -= 2 * vn * ny; o.x = 200 + nx * max; o.y = 150 + ny * max; }
      if (o.y + o.r > ust) { o.y = ust - o.r; o.vy = -Math.abs(o.vy); }
    });
  };
  Oynatici.prototype.iyonCiz = function () { this.sahneDurum.iyonlar.forEach(function (o) { o.el.setAttribute('transform', 'translate(' + o.x.toFixed(1) + ' ' + o.y.toFixed(1) + ')'); }); };
  Oynatici.prototype.iyonEsles = function (anlik) {
    var S = this.sahneDurum, self = this;
    if (S.durum.esles) return Promise.resolve(); S.durum.esles = 1;
    var ag = S.iyonlar.filter(function (o) { return o.tur === 'ag'; }), cl = S.iyonlar.filter(function (o) { return o.tur === 'cl'; }), yer = [], j;
    for (j = 0; j < 6; j++) yer.push({ x: 200 + (j - 2.5) * 27.5, y: 243, tur: j % 2 ? 'cl' : 'ag' });
    for (j = 0; j < 4; j++) yer.push({ x: 200 + (j - 1.5) * 28.5, y: 216, tur: j % 2 ? 'ag' : 'cl' });
    var agY = yer.filter(function (p) { return p.tur === 'ag'; }), clY = yer.filter(function (p) { return p.tur === 'cl'; }), hepsi = [];
    var etk = this.r.sahne.querySelector('.iy-etk');
    ag.forEach(function (o, i) {
      var e = cl[i]; if (!e) return;
      var mx = (o.x + e.x) / 2, my = (o.y + e.y) / 2; o.hedef = 1; e.hedef = 1;
      hepsi.push({ o: o, ax: o.x, ay: o.y, bx: mx - 13, by: my, cx: agY[i].x, cy: agY[i].y });
      hepsi.push({ o: e, ax: e.x, ay: e.y, bx: mx + 13, by: my, cx: clY[i].x, cy: clY[i].y });
    });
    var bitir = function () { hepsi.forEach(function (h) { h.o.x = h.cx; h.o.y = h.cy; h.o.sabit = true; }); self.iyonCiz(); if (etk) etk.setAttribute('opacity', '1'); };
    if (anlik || AZ) { bitir(); return Promise.resolve(); }
    this.gosteriyor(true);
    return tween(1300, function (t) { hepsi.forEach(function (h) { h.o.x = h.ax + (h.bx - h.ax) * t; h.o.y = h.ay + (h.by - h.ay) * t; }); self.iyonCiz(); })
      .then(function () { return tween(1500, function (t) { hepsi.forEach(function (h) { h.o.x = h.bx + (h.cx - h.bx) * t; h.o.y = h.by + (h.cy - h.by) * t; }); self.iyonCiz(); }); })
      .then(function () { bitir(); self.gosteriyor(false); });
  };

  /* ---- altyazı ---- */
  Oynatici.prototype.altyaziYaz = function (metin, kim) {
    var html = kim ? '<b class="kim kim-' + kim + '">' + esc(KONUSMACI[kim].ad) + '</b> ' : '', re = /\S+/g, m; this.altKelimeler = [];
    while ((m = re.exec(metin))) { this.altKelimeler.push({ bas: m.index, son: m.index + m[0].length }); html += '<span class="k">' + esc(m[0]) + '</span> '; }
    this.r.altyazi.innerHTML = html;
  };
  Oynatici.prototype.altyaziBos = function (metin) { this.r.altyazi.innerHTML = '<span class="bos">' + esc(metin) + '</span>'; this.altKelimeler = []; };
  Oynatici.prototype.altyaziVurgula = function (ci) {
    var spans = this.r.altyazi.querySelectorAll('.k'), a = this.altKelimeler;
    for (var i = 0; i < a.length && i < spans.length; i++) spans[i].classList.toggle('su', ci >= a[i].bas && ci < a[i].son + 1 && ci >= 0);
  };

  /* ---- kayıtlar ---- */
  Oynatici.prototype.kayitBul = function (metin) {
    var h = ozet(metin);
    return Kayitlar.al('k:' + h).then(function (v) {
      if (v && v.veri) return { url: URL.createObjectURL(new Blob([v.veri], { type: v.mime })), sure: v.sure, yerel: true };
      var y = Yayin.al(h);
      if (y && y.veri) return { url: 'data:' + y.mime + ';base64,' + y.veri, sure: y.sure };
      return null;
    });
  };
  Oynatici.prototype.kayitDurumu = function () {
    var self = this, r = this.r, adimlar = this.P.adimlar || [];
    if (!adimlar.length) { r.kaynakNot.textContent = ''; return; }
    Promise.all(adimlar.map(function (a) { var h = ozet(a.s); return Kayitlar.al('k:' + h).then(function (v) { return !!(v && v.veri) || !!Yayin.al(h); }); })).then(function (var_) {
      var n = var_.filter(Boolean).length;
      self.kayitVar = {}; adimlar.forEach(function (a, i) { if (var_[i]) self.kayitVar[ozet(a.s)] = 1; });
      r.kaynakNot.textContent = kaynakNe() === 'bulut' ? 'Cümleler Google’ın doğal Türkçe sesleriyle okunur. Bir cümle ilk kez seslendirilirken kısa bir bekleme olabilir.' : kaynakNe() === 'kayit'
        ? (n ? 'Bu derste ' + adimlar.length + ' adımın ' + n + '’i öğretmen kaydıyla oynar; kalanlar cihaz sesiyle.' : 'Bu ders için henüz öğretmen kaydı yok; “Kendi sesinle kaydet” ile ekleyebilirsin.')
        : (n ? 'Bu dersin ' + n + ' adımı için öğretmen kaydı var.' : '');
    });
  };

  /* ---- oynatma ---- */
  Oynatici.prototype.kur = function (n) {
    var self = this, zincir = Promise.resolve(), A = this.P.adimlar, bas = 0;
    n = Math.min(n, A.length);
    for (var j = n - 1; j > 0; j--) if (A[j].sil) { bas = j; break; }
    this.temizle(); this.sahneGizle();
    if (bas > 0 && !('sahne' in A[bas])) for (var sj = bas - 1; sj >= 0; sj--) if ('sahne' in A[sj]) { this.sahneGoster(A[sj].sahne); break; }
    var kj = this.kurJeton = (this.kurJeton || 0) + 1;
    for (var k = bas; k < n; k++) (function (a, k) {
      zincir = zincir.then(function () {
        if (kj !== self.kurJeton) return;
        var onc = A[k - 1];
        if (a.sil || (k > bas && onc && onc.grup && onc.grup !== a.grup)) self.temizle();
        if ('sahne' in a) self.sahneGoster(a.sahne);
        return (a.grupBas ? self.grupHazirla(k, true) : Promise.resolve()).then(function () {
          if (kj !== self.kurJeton) return [];
          self.grupKilit = !!a.grup;
          return self.ekle(a.w || a.h || [], a.oto, true);
        }).then(function (els) {
          self.grupKilit = false;
          if (kj !== self.kurJeton) return;
          var kel = []; els.forEach(function (el) { kel.push.apply(kel, el.querySelectorAll('.w')); });
          self.goster(kel, kel.length, true);
          var gb = self.grafikBul(a, els); if (gb) grafikTamamla(gb.svg, gb.asama);
          if (a.yap) self.sahneYap(a.yap, true);
          if (a.ciz) self.isaretle(a.ciz, 'ciz', true);
          if (a.halka) self.isaretle([a.halka], 'halka', true);
        });
      });
    })(this.P.adimlar[k], k);
    return zincir;
  };
  Oynatici.prototype.seslendir = function (a, els, jeton, kayit, sesi, kim) {
    var self = this, kel = [];
    els.forEach(function (el) { kel.push.apply(kel, el.querySelectorAll('.w')); });
    var gs = this.grafikSu; this.grafikSu = null;
    if (gs && AZ) { grafikTamamla(gs.svg, gs.asama); gs = null; }
    var gn = !gs && !a.grafik ? this.grafikHedef(a) : null;
    this.r.kalem.classList.toggle('cizim', !!(gs || gn));
    var metin = a.s, uz = Math.max(1, metin.length);
    this.altyaziYaz(metin, kim);
    this.konusuyor(true); if (kel.length) { this.yaziyor(true); this.kalemGoster(true); }
    var sinirVar = false, ci = 0, cl = 0, t0 = performance.now(), sure = Ses.sure(metin, TARZLAR[ayar.tarz].hiz * ayar.hiz), raf = null, isaretlendi = false;
    var tik = function () {
      if (jeton !== self.P.jeton) return;
      var p = Ses.oranFn ? Ses.oranFn() : sinirVar ? Math.min(1, (ci + cl) / uz) : Math.min(0.97, (performance.now() - t0) / sure);
      var yh = gn ? 2 : 1.18, n = Math.ceil(Math.min(1, p * yh) * kel.length); // eğri gösterilecekse yazı cümlenin ilk yarısında biter
      self.goster(kel, n, false);
      if (gs) { // grafik çiziliyor: kalem çizginin ucunda
        var gp = Math.min(1, p * 1.12), uc = grafikIlerlet(gs.svg, gs.asama, gp);
        if (!uc && gp < 1) uc = grafikBasUc(gs.svg, gs.asama); // konuşma başlamadan kalem ilk çizginin başında bekler
        if (uc) { self.kalemKoy(uc.x, uc.y); self.kalemGoster(true); self.yaziyor(true); } else { self.kalemGoster(false); self.yaziyor(false); }
      } else if (gn && n >= kel.length) { // cümle bitti: kalem anlatılan eğrinin üzerinden geçer
        var gu = self.grafikGoster(gn, (p - 1 / yh) / (1 - 1 / yh));
        if (gu) { self.kalemKoy(gu.x, gu.y); self.kalemGoster(true); self.gosteriyor(true); } else { self.kalemGoster(false); self.gosteriyor(false); }
        self.yaziyor(false);
      } else if (n >= kel.length) { self.yaziyor(false); self.kalemGoster(false); }
      self.altyaziVurgula(sinirVar ? ci : p * uz);
      if (!isaretlendi && p > 0.35) { isaretlendi = true; if (a.ciz) self.isaretle(a.ciz, 'ciz'); if (a.halka) self.isaretle([a.halka], 'halka'); }
      raf = requestAnimationFrame(tik);
    };
    raf = requestAnimationFrame(tik);
    return Ses.konus(metin, { basla: function (s) { t0 = performance.now(); sure = s; }, sinir: function (i, l) { sinirVar = true; ci = i; cl = l || 1; } }, kayit, sesi).then(function (neden) {
      cancelAnimationFrame(raf);
      if (gs) grafikTamamla(gs.svg, gs.asama);
      if (gn) { self.grafikGosterBitir(gn); self.gosteriyor(false); }
      self.r.kalem.classList.remove('cizim');
      self.konusuyor(false); self.yaziyor(false); self.kalemGoster(false);
      if (kayit && kayit.yerel) setTimeout(function () { URL.revokeObjectURL(kayit.url); }, 1000);
      if (jeton !== self.P.jeton) return neden;
      self.goster(kel, kel.length, false); self.altyaziVurgula(-1);
      if (!isaretlendi) { if (a.ciz) self.isaretle(a.ciz, 'ciz'); if (a.halka) self.isaretle([a.halka], 'halka'); }
      return neden;
    });
  };
  Oynatici.prototype.adimCalistir = function (a, jeton, i) {
    var self = this, pl = this.P.plan && this.P.plan[i], kim = pl ? pl.kim : null, sesi = konusmaciSesi(kim);
    var kaynak = kaynakNe(), bulutVar = kaynak !== 'cihaz' && Bulut.hazir();
    var bulutAl = function (m) { return Bulut.al(m, sesi.bulut); };
    var kayitSoz;
    if (kaynak === 'kayit') kayitSoz = this.kayitBul(a.s).then(function (k) { return k || (Bulut.hazir() ? bulutAl(a.s).catch(function () { return null; }) : null); });
    else if (kaynak === 'bulut') kayitSoz = bulutAl(a.s).catch(function () { self.bulutUyar(); return null; });
    else kayitSoz = Promise.resolve(null);
    var onSoz = pl && pl.on ? (bulutVar ? bulutAl(pl.on).catch(function () { return null; }) : Promise.resolve(null)) : null;
    if (kim) { this.ogretmenCins(sesi.cins); this.konusmaciGoster(kim); }
    var onc = i > 0 ? this.P.adimlar[i - 1] : null, grupBitti = !!(onc && onc.grup && onc.grup !== a.grup);
    var hazir = (a.sil || grupBitti ? this.sil(false) : Promise.resolve()).then(function () { if (a.grupBas && jeton === self.P.jeton) return self.grupHazirla(i, false); });
    var once = onSoz ? Promise.all([hazir, onSoz]).then(function (r) { if (jeton !== self.P.jeton) return; return self.araSoz(pl.on, r[1], sesi, kim, jeton); }) : hazir;
    return Promise.all([once, kayitSoz]).then(function (sonuc) {
      if (jeton !== self.P.jeton) return;
      if ('sahne' in a) self.sahneGoster(a.sahne);
      self.grupKilit = !!a.grup;
      return self.ekle(a.w || a.h || [], a.oto, false).then(function (els) {
        if (jeton !== self.P.jeton) return;
        self.grafikSu = self.grafikBul(a, els);
        self.grupKilit = false;
        var eylem = a.yap ? self.sahneYap(a.yap, false) : Promise.resolve();
        return Promise.all([self.seslendir(a, els, jeton, sonuc[1], sesi, kim), eylem]);
      });
    });
  };
  // Tahtaya yazmadan kısa bir söz (karşılıklı anlatımdaki geçişler)
  Oynatici.prototype.araSoz = function (metin, kayit, sesi, kim, jeton) {
    var self = this;
    this.altyaziYaz(metin, kim); this.konusuyor(true);
    return Ses.konus(metin, {}, kayit, sesi).then(function () { self.konusuyor(false); if (jeton === self.P.jeton) return sleep(160); });
  };
  Oynatici.prototype.konusmaciGoster = function (kim) {
    var e = this.r.ogrAd; if (!e) return;
    e.hidden = !kim; if (kim) { e.textContent = KONUSMACI[kim].ad; e.className = 'sd-ogr-ad kim-' + kim; }
  };
  Oynatici.prototype.planYap = function () {
    this.P.plan = ayar.ikili && this.P.adimlar ? karsilikliPlan(this.P.adimlar) : null;
    if (!ayar.ikili) { this.konusmaciGoster(null); this.ogretmenCins(ayar.cins); }
  };
  Oynatici.prototype.calis = function (bas) {
    var self = this;
    Oynatici.hepsi.forEach(function (o) { if (o !== self && o.P.calisiyor) o.durdur(); });
    var jeton = ++this.P.jeton;
    Ses.sus(); Ses.kilidiAc();
    Ses.surekli = kaynakNe() !== 'cihaz'; if (Ses.surekli) Ses.isit();
    this.P.calisiyor = true; this.arayuz();
    this.r.perde.hidden = true;
    return sleep(60).then(function () { return self.kur(bas); }).then(function () {
      var i = bas;
      var sonraki = function () {
        if (jeton !== self.P.jeton) return;
        if (i >= self.P.adimlar.length) { Ses.surekli = false; Ses.isitDur(); self.P.calisiyor = false; self.P.i = self.P.adimlar.length; self.arayuz(); self.bitti(); return; }
        self.P.i = i; self.arayuz(); self.bolumIzle();
        var sonA = self.P.adimlar[i + 1];
        if (sonA && kaynakNe() === 'bulut') { var sp = self.P.plan && self.P.plan[i + 1], ss = konusmaciSesi(sp && sp.kim); Bulut.al(sonA.s, ss.bulut).then(function (k) { Ses.dolgulu(k.url); }).catch(function () {}); if (sp && sp.on) Bulut.al(sp.on, ss.bulut).catch(function () {}); }
        return self.adimCalistir(self.P.adimlar[i], jeton, i).then(function () {
          if (jeton !== self.P.jeton) return;
          i++;
          var ara = Math.max(80, TARZLAR[ayar.tarz].ara - (Ses.sonDolgu || 0) * 1000); Ses.sonDolgu = 0; // baştaki sessizlik aradan düşülür
          return sleep(ara).then(sonraki);
        });
      };
      return sonraki();
    });
  };
  Oynatici.prototype.durdur = function () {
    this.P.jeton++; Ses.surekli = false; Ses.sus(); this.P.calisiyor = false;
    this.konusuyor(false); this.yaziyor(false); this.kalemGoster(false); this.arayuz();
  };
  Oynatici.prototype.oynatDuraklat = function () {
    if (this.P.calisiyor) { this.durdur(); return; }
    this.calis(this.P.i < 0 || this.P.i >= this.P.adimlar.length ? 0 : this.P.i);
  };
  Oynatici.prototype.bitti = function () {
    this.r.perdeYazi.textContent = 'Baştan izle';
    this.r.perdeAlt.textContent = 'Anlatım bitti. Cümle ekleyip yeniden dinleyebilirsin.';
    this.r.perde.hidden = false;
    this.altyaziBos('Anlatım bitti.');
  };
  Oynatici.prototype.arayuz = function () {
    var P = this.P, r = this.r, n = P.adimlar.length;
    r.adimYazi.textContent = 'Adım ' + (P.i < 0 ? 0 : Math.min(P.i + 1, n)) + ' / ' + n;
    r.cubuk.style.width = (P.i < 0 || !n ? 0 : Math.min(1, (P.i + (P.calisiyor ? 0.5 : 1)) / n) * 100) + '%';
    r.oynat.setAttribute('aria-label', P.calisiyor ? 'Duraklat' : 'Başlat');
    r.oynat.innerHTML = ikon(P.calisiyor ? 'dur' : 'oynat');
    r.geri.disabled = P.i <= 0; r.ileri.disabled = P.i >= n - 1;
  };
  Oynatici.prototype.bolumIzle = function () {
    var B = this.P.bolumler, i = this.P.i, sec = 0;
    if (!B || B.length < 2) return;
    for (var k = 0; k < B.length; k++) if (B[k].adim <= i) sec = k;
    if (this.r.bolumSec.value !== String(sec)) this.r.bolumSec.value = String(sec);
  };
  Oynatici.prototype.yukle = function (id, opt) {
    opt = opt || {};
    this.durdur();
    var ders = typeof id === 'object' ? id : null;
    if (ders) id = ders.id || 'ders';
    this.P.id = id;
    if (id === 'metin' && !ders) {
      if (!this.adimListeleri.metin) this.adimListeleri.metin = metindenDers(this.r.metin ? this.r.metin.value : ORNEK_METIN).adimlar;
    } else if (ders) this.adimListeleri[id] = ders.adimlar.slice();
    else if (!this.adimListeleri[id]) this.adimListeleri[id] = (this.dersler[id] || DERSLER.konu).adimlar.slice();
    this.P.ders = ders || this.dersler[id] || null;
    this.P.adimlar = this.adimListeleri[id]; this.P.i = -1; this.planYap();
    if (this.r.baslik) this.r.baslik.textContent = (ders && ders.baslik) || 'Sesli anlatım';
    var self = this, B = this.P.bolumler = this.P.ders && this.P.ders.bolumler ? this.P.ders.bolumler.map(function (b) { return { ad: b.ad, adim: b.adim, el: b.el }; }) : null, bas = 0;
    this.r.bolumKutu.hidden = !(B && B.length > 1);
    this.r.bolumSec.innerHTML = B && B.length > 1 ? B.map(function (b, k) { return '<option value="' + k + '">' + esc((k + 1) + '. ' + b.ad) + '</option>'; }).join('') : '';
    if (B && opt.bolum != null && B[opt.bolum]) bas = B[opt.bolum].adim;
    if (opt.adim != null) bas = Math.max(0, Math.min(this.P.adimlar.length - 1, opt.adim));
    if (bas > 0) this.P.i = bas;
    this.kur(bas + 1).then(function () { self.arayuz(); self.bolumIzle(); });
    this.r.perdeYazi.textContent = (ders && ders.dugme) || (id === 'metin' ? 'Metni anlat' : /^(km-|d|ry-)/.test(id) || id === 'soru' ? 'Çözümü başlat' : 'Dersi başlat');
    this.r.perdeAlt.textContent = 'Ses açıkken başlat. Tahtaya yazılanlar sesle birlikte ilerler.';
    this.r.perde.hidden = false;
    this.altyaziBos('Altyazı burada görünür: konuşulan kelime renklenir.');
    Array.prototype.forEach.call(this.kok.querySelectorAll('.sd-sekmeler [data-ders]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-ders') === id)); });
    if (this.r.metinKart) this.r.metinKart.hidden = id !== 'metin';
    this.ozelListeCiz(); this.arayuz(); this.kayitDurumu(); this.bulutHazirla();
    return this;
  };

  /* ---- cümle ya da metin ekle ---- */
  Oynatici.prototype.metinSay = function (ad) {
    var alan = this.r[ad], hedef = this.r[ad + 'Say'];
    if (alan && hedef) hedef.textContent = metinOzeti(alan.value);
  };
  Oynatici.prototype.ozelListeCiz = function () {
    var gruplar = [], bul = {};
    this.P.adimlar.forEach(function (a) {
      if (a.ozel == null) return;
      var k = String(a.ozel);
      if (!bul[k]) { bul[k] = { k: k, n: 0, ilk: a.w[0].t }; gruplar.push(bul[k]); }
      bul[k].n++;
    });
    this.r.ozelListe.innerHTML = gruplar.map(function (g) {
      var yazi = g.n > 1 ? (g.ilk.length > 70 ? g.ilk.slice(0, 70) + '…' : g.ilk) + ' · ' + g.n + ' adım' : g.ilk;
      return '<li><span>' + esc(yazi) + '</span><button type="button" data-sil="' + esc(g.k) + '" aria-label="' + (g.n > 1 ? 'Metni kaldır' : 'Cümleyi kaldır') + '">×</button></li>';
    }).join('');
  };
  Oynatici.prototype.cumleEkle = function () {
    var inp = this.r.cumle, t = inp.value.trim(); if (!t) { inp.focus(); return; }
    var parcalar = metniBol(t); if (!parcalar.length) return;
    var uzun = parcalar.length > 2;
    var adimlar = metinAdimlari(parcalar, { grup: 'o' + (++ozelSayac), sinif: function () { return uzun ? '' : 'ozel'; } });
    if (uzun) { adimlar[0].sil = 1; adimlar[0].sahne = null; } // uzun metin temiz tahtada başlar
    var yer = this.P.i >= 0 && this.P.i < this.P.adimlar.length ? this.P.i + 1 : this.P.adimlar.length;
    Array.prototype.splice.apply(this.P.adimlar, [yer, 0].concat(adimlar));
    (this.P.bolumler || []).forEach(function (b) { if (b.adim >= yer) b.adim += adimlar.length; });
    this.planYap();
    inp.value = ''; this.metinSay('cumle'); this.ozelListeCiz(); this.arayuz();
    if (!this.P.calisiyor) this.calis(yer);
  };
  Oynatici.prototype.cumleSil = function (grup) {
    var self = this, A = this.P.adimlar, sil = [];
    A.forEach(function (a, i) { if (a.ozel != null && String(a.ozel) === String(grup)) sil.push(i); });
    if (!sil.length) return;
    if (this.P.calisiyor) this.durdur();
    for (var k = sil.length - 1; k >= 0; k--) {
      var idx = sil[k];
      A.splice(idx, 1);
      (this.P.bolumler || []).forEach(function (b) { if (b.adim > idx) b.adim--; });
      if (this.P.i > idx) this.P.i--;
    }
    if (this.P.i >= A.length) this.P.i = A.length - 1;
    this.planYap(); this.ozelListeCiz();
    this.kur(Math.max(0, this.P.i)).then(function () { self.arayuz(); });
  };

  /* ---- kayıt stüdyosu ---- */
  Oynatici.prototype.studyoAc = function () {
    this.durdur();
    this.r.studyo.hidden = false;
    this.r.studyoNot.hidden = true;
    if (!Kaydedici.var) { this.r.studyoNot.textContent = 'Bu tarayıcı ses kaydını desteklemiyor. Telefonda Safari ya da Chrome ile dene.'; this.r.studyoNot.hidden = false; }
    this.studyoCiz();
  };
  Oynatici.prototype.studyoKapat = function () {
    if (this.kayitAktif) { this.kayitAktif.durdur(); this.kayitAktif = null; }
    this.siraliDur = true;
    this.r.studyo.hidden = true; this.kayitDurumu();
  };
  Oynatici.prototype.studyoCiz = function () {
    var self = this, adimlar = this.P.adimlar;
    Promise.all(adimlar.map(function (a) { return Kayitlar.al('k:' + ozet(a.s)); })).then(function (kayitlar) {
      self.r.studyoListe.innerHTML = adimlar.map(function (a, i) {
        var k = kayitlar[i], var_ = k && k.veri, yay = !var_ && Yayin.al(ozet(a.s));
        var kaydediyor = self.kayitIndex === i;
        return '<li data-i="' + i + '"' + (kaydediyor ? ' class="su"' : '') + '><span class="no">' + (i + 1) + '</span><div><div class="ct">' + esc(a.s) + '</div>' +
          '<div class="durum">' + (kaydediyor ? '<span class="kayit-isik"></span> Kaydediliyor… okuyunca ■ Bitir’e bas' : var_ ? '<b>✓ Kaydın var</b> · ' + (k.sure || 0).toFixed(1) + ' sn' : yay ? 'Sitede yayımlanmış kayıt var' : 'Kayıt yok') + '</div></div>' +
          '<div class="islem">' +
            '<button type="button" class="dugme' + (kaydediyor ? '' : ' ikincil') + '" data-is="kaydet" data-i="' + i + '">' + (kaydediyor ? '■ Bitir' : '● Kaydet') + '</button>' +
            '<button type="button" class="dugme ikincil" data-is="dinle" data-i="' + i + '"' + (var_ || yay ? '' : ' disabled') + '>▶ Dinle</button>' +
            '<button type="button" class="dugme ikincil" data-is="sil" data-i="' + i + '"' + (var_ ? '' : ' disabled') + '>Sil</button>' +
          '</div></li>';
      }).join('');
      var su = self.r.studyoListe.querySelector('li.su'); if (su && su.scrollIntoView) su.scrollIntoView({ block: 'nearest' });
    });
  };
  Oynatici.prototype.kayitBaslat = function (i) {
    var self = this;
    if (!Kaydedici.var) return Promise.reject(new Error('destek yok'));
    return Kaydedici.basla().then(function (k) { self.kayitAktif = k; self.kayitIndex = i; self.studyoCiz(); return k; })
      .catch(function (e) {
        self.r.studyoNot.textContent = SesliDers.mikrofonNotu || 'Mikrofon açılamadı. Tarayıcının bu site için mikrofon iznini ver ve yeniden dene.';
        self.r.studyoNot.hidden = false; self.kayitIndex = null; self.studyoCiz(); throw e;
      });
  };
  Oynatici.prototype.kayitBitir = function () {
    var self = this, k = this.kayitAktif, i = this.kayitIndex, a = this.P.adimlar[i];
    this.kayitAktif = null; this.kayitIndex = null;
    if (!k || !a) return Promise.resolve();
    return k.durdur().then(function (s) {
      if (!s || !s.blob || s.blob.size < 800) { self.studyoCiz(); return; }
      var oku = s.blob.arrayBuffer ? s.blob.arrayBuffer() : new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsArrayBuffer(s.blob); });
      return oku.then(function (buf) { return Kayitlar.koy('k:' + ozet(a.s), { mime: s.mime, veri: buf, sure: s.sure, metin: a.s, tarih: Date.now() }); })
        .then(function () { self.studyoCiz(); self.kayitDurumu(); });
    });
  };
  Oynatici.prototype.studyoIslem = function (is, i) {
    var self = this, a = this.P.adimlar[i];
    if (!a) return;
    if (is === 'kaydet') {
      if (this.kayitIndex === i) { this.kayitBitir(); return; }
      if (this.kayitAktif) { this.kayitBitir().then(function () { self.kayitBaslat(i).catch(function () {}); }); return; }
      this.kayitBaslat(i).catch(function () {});
    } else if (is === 'dinle') {
      Ses.kilidiAc();
      this.kayitBul(a.s).then(function (k) { if (k) { var au = Ses.ortak(); au.onended = au.onerror = au.onloadedmetadata = null; au.src = k.url; var p = au.play(); if (p && p.catch) p.catch(function () {}); } });
    } else if (is === 'sil') {
      Kayitlar.sil('k:' + ozet(a.s)).then(function () { self.studyoCiz(); self.kayitDurumu(); });
    }
  };
  Oynatici.prototype.siraliKayit = function () {
    var self = this;
    if (this.siraliCalisiyor) { this.siraliDur = true; if (this.kayitAktif) this.kayitBitir(); return; }
    this.siraliCalisiyor = true; this.siraliDur = false; this.r.siraKaydet.textContent = '■ Sırayı durdur';
    Promise.all(this.P.adimlar.map(function (a) { return Kayitlar.al('k:' + ozet(a.s)); })).then(function (kayitlar) {
      var i = kayitlar.findIndex ? kayitlar.findIndex(function (k) { return !(k && k.veri); }) : 0;
      if (i < 0) i = 0;
      var bekle = function () { // kullanıcı "Bitir" deyince sıradakine geç
        if (self.siraliDur || i >= self.P.adimlar.length) { self.siraliCalisiyor = false; self.r.siraKaydet.textContent = '● Sırayla kaydet'; self.studyoCiz(); return; }
        self.kayitBaslat(i).then(function () {
          var kontrol = setInterval(function () {
            if (self.kayitIndex !== i) { clearInterval(kontrol); i++; setTimeout(bekle, 500); }
          }, 200);
        }).catch(function () { self.siraliCalisiyor = false; self.r.siraKaydet.textContent = '● Sırayla kaydet'; });
      };
      bekle();
    });
  };
  Oynatici.prototype.paketIndir = function () {
    var self = this, adimlar = this.P.adimlar, paket = { surum: 1, ders: this.P.id, baslik: (this.P.ders && this.P.ders.baslik) || this.P.id, tarih: new Date().toISOString(), kayitlar: {} };
    Promise.all(adimlar.map(function (a) { return Kayitlar.al('k:' + ozet(a.s)); })).then(function (kayitlar) {
      var n = 0;
      kayitlar.forEach(function (k, i) { if (k && k.veri) { n++; paket.kayitlar[ozet(adimlar[i].s)] = { mime: k.mime, sure: Math.round(k.sure * 10) / 10, metin: adimlar[i].s, veri: b64(k.veri) }; } });
      if (!n) { self.r.studyoNot.textContent = 'İndirilecek kayıt yok. Önce birkaç cümle kaydet.'; self.r.studyoNot.hidden = false; return; }
      indir(new Blob([JSON.stringify(paket)], { type: 'application/json' }), 'sesli-' + String(self.P.id).replace(/[^\w-]+/g, '-') + '.json');
      self.r.studyoNot.textContent = n + ' kayıt indirildi. Dosya sitenin sesli klasörüne eklenince öğrenciler de bu sesi duyar.'; self.r.studyoNot.hidden = false;
    });
  };
  Oynatici.prototype.ornekKayit = function () {
    var self = this, r = this.r;
    if (this.ornekKayitci) {
      var k = this.ornekKayitci; this.ornekKayitci = null; clearInterval(this.ornekSaat);
      k.durdur().then(function (s) {
        r.ornekKaydet.textContent = '● Yeniden kaydet';
        if (s && s.blob && s.blob.size > 800) { self.ornekBlob = s.blob; r.ornekDinle.disabled = false; r.ornekIndir.disabled = false; r.ornekSure.textContent = Math.round(s.sure) + ' sn kaydedildi'; }
      });
      return;
    }
    if (!Kaydedici.var) { r.ornekSure.textContent = 'Bu tarayıcı ses kaydını desteklemiyor.'; return; }
    Kaydedici.basla().then(function (k) {
      self.ornekKayitci = k; var t0 = Date.now();
      r.ornekKaydet.textContent = '■ Kaydı bitir';
      self.ornekSaat = setInterval(function () { var s = Math.round((Date.now() - t0) / 1000); r.ornekSure.innerHTML = '<span class="kayit-isik"></span> ' + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }, 500);
    }).catch(function () { r.ornekSure.textContent = SesliDers.mikrofonNotu || 'Mikrofon açılamadı; tarayıcıdan mikrofon izni ver.'; });
  };

  /* ---- pencere ---- */
  Oynatici.prototype.kapat = function () {
    this.durdur(); this.studyoKapat();
    if (this.opt.mod === 'pencere') { this.host.style.display = 'none'; document.documentElement.style.overflow = this.eskiTasma || ''; }
  };

  /* ================= kimyamed köprüsü: .soru kartlarına "Sesli anlat" ================= */
  var pencereOynatici = null;
  function ac(ders, opt) {
    opt = opt || {};
    if (ders && ders.bolumBas != null && opt.bolum == null) opt.bolum = ders.bolumBas;
    if (!pencereOynatici) {
      var h = document.createElement('div');
      h.setAttribute('data-sesli-ders', 'pencere');
      h.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147482000;display:none';
      document.body.appendChild(h);
      pencereOynatici = new Oynatici(h, { mod: 'pencere' });
    }
    Oynatici.hepsi.forEach(function (o) { if (o !== pencereOynatici && o.P.calisiyor) o.durdur(); });
    pencereOynatici.temaKoy(opt.tema || SesliDers.tema || null);
    if (pencereOynatici.host.style.display !== 'block') pencereOynatici.eskiTasma = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    pencereOynatici.host.style.display = 'block';
    pencereOynatici.yukle(ders, opt);
    if (!ac.esc) { ac.esc = true; document.addEventListener('keydown', function (e) { if (e.key !== 'Escape' || !pencereOynatici || pencereOynatici.host.style.display !== 'block') return; if (!pencereOynatici.r.studyo.hidden) pencereOynatici.studyoKapat(); else pencereOynatici.kapat(); }); }
    setTimeout(function () { try { pencereOynatici.r.perdeDugme.focus(); } catch (e) {} }, 50);
    return pencereOynatici;
  }
  function dugmeStili() {
    if (document.getElementById('sd-anlat-stil')) return;
    var st = document.createElement('style'); st.id = 'sd-anlat-stil';
    st.textContent = '.sd-anlat{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:.04em;line-height:1.3;' +
      'color:#C24100;background:#FFF1E9;border:1px solid #F7C3A5;border-radius:999px;padding:4px 11px;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}' +
      '.sd-anlat:hover{background:#FFE3D1}.sd-anlat:focus-visible{outline:3px solid #0B5C8A;outline-offset:2px}' +
      '.ust-serit{flex-wrap:wrap}.ust-serit .sd-anlat{margin-left:8px}' +
      '.sd-anlat.koyu{color:#fdba74;background:rgba(248,83,0,.14);border-color:rgba(248,83,0,.45)}.sd-anlat.koyu:hover{background:rgba(248,83,0,.26)}' +
      '.sd-anlat.serit{display:flex;width:100%;margin-top:6px;border-radius:10px;padding:8px;font-size:12.5px}' +
      '.sd-anlat.kucuk{margin-top:8px}' +
      '.sd-arac{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 14px}' +
      '.sd-anlat.buyuk{font-size:13.5px;letter-spacing:.02em;padding:9px 16px;box-shadow:0 6px 14px -10px rgba(194,65,0,.6)}' +
      '.sd-anlat.pdf{color:#1E1A17;background:#FFFFFF;border-color:#E7E0D9}.sd-anlat.pdf:hover{background:#FBF8F5}.sd-anlat:disabled{opacity:.75;cursor:progress}' +
      '.sd-anlat.baslikta{margin-left:10px;vertical-align:middle;font:800 11.5px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.03em;text-transform:none;padding:3px 10px}' +
      '.sd-anlat.yanda{margin-left:8px}' +
      '@media print{.sd-anlat{display:none!important}}';
    document.head.appendChild(st);
  }
  function dugme(sinif, etiket, fn, yazi) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sd-anlat' + (sinif ? ' ' + sinif : '');
    b.innerHTML = '<span aria-hidden="true">🔊</span> ' + esc(yazi || 'Sesli anlat');
    b.setAttribute('aria-label', etiket);
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
    return b;
  }
  // kimyamed: her .soru kartının üst şeridine "Sesli anlat"
  function kimyamedKopru() {
    var sorular = document.querySelectorAll('div.soru');
    if (!sorular.length) return;
    dugmeStili();
    Array.prototype.forEach.call(sorular, function (s) {
      if (!s.querySelector('details.cozum') || s.querySelector('.sd-anlat')) return;
      var b = dugme('', 'Bu soruyu sesli anlat', function () { ac(sorudanDers(s)); });
      var serit = s.querySelector('.ust-serit');
      if (serit) serit.appendChild(b); else s.insertBefore(b, s.firstChild);
    });
  }
  // Ronya: çözümü molToggle ile açılan her soruya "Sesli anlat" (listeler sonradan çizildiği için izlenir)
  function ronyaKopru() {
    var bekliyor = false;
    var koyuMu = function () { // sayfanın zemini koyuysa koyu düğme ve koyu pencere
      try { var m = getComputedStyle(document.body).backgroundColor.match(/\d+(\.\d+)?/g); return !!m && (m.length < 4 || +m[3] > 0) && (+m[0] + +m[1] + +m[2]) / 3 < 90; } catch (e) { return false; }
    };
    var tara = function () {
      bekliyor = false;
      var els = document.querySelectorAll('[onclick^="molToggle("]:not([data-sd])');
      if (!els.length) return;
      dugmeStili();
      Array.prototype.forEach.call(els, function (el) {
        el.setAttribute('data-sd', '1');
        var m = (el.getAttribute('onclick') || '').match(/molToggle\(\s*['"]([^'"]+)['"]/);
        var hedef = m && document.getElementById(m[1]);
        if (!hedef) return;
        var b = dugme(koyuMu() ? 'koyu' : '', 'Bu soruyu sesli anlat', function () { ac(ronyaDers(el, hedef), { tema: koyuMu() ? 'koyu' : null }); });
        if (el.contains(hedef)) { b.className += ' kucuk'; el.appendChild(b); }
        else { b.className += ' serit'; el.insertAdjacentElement('afterend', b); }
      });
    };
    tara();
    if (window.MutationObserver) new MutationObserver(function () { if (!bekliyor) { bekliyor = true; requestAnimationFrame(tara); } }).observe(document.body, { childList: true, subtree: true });
  }
  function bolumBul(ders, el) { var B = ders && ders.bolumler || []; for (var k = 0; k < B.length; k++) if (B[k].el === el) return k; return 0; }
  function icerikVarMi(dugumler) {
    return dugumler.some(function (n) {
      if (n.nodeType !== 1 || gorunmez(n) || ATLA_SINIF.test(sinifi(n)) || ATLA_ETIKET.test(n.tagName.toUpperCase())) return false;
      return /^(P|UL|OL|FIGURE|TABLE|BLOCKQUOTE|H3|H4|SVG|IMG|CANVAS)$/.test(n.tagName.toUpperCase()) || (n.tagName.toUpperCase() === 'DIV' && yaziMetni(n).length > 25);
    });
  }
  function aracEkle(kap, once, yazi, fn, pdfYap) {
    var a = document.createElement('div'); a.className = 'sd-arac';
    a.appendChild(dugme('buyuk', yazi, fn, yazi));
    if (pdfYap) a.appendChild(pdfDugmesi(pdfYap));
    if (once) kap.insertBefore(a, once); else kap.appendChild(a);
    return a;
  }
  function pdfDugmesi(yap) { // konu anlatımı → Ders PDF'si (sesli anlatımı açmadan)
    var b = document.createElement('button'), yazi = '<span aria-hidden="true">📄</span> Ders PDF\'si';
    b.type = 'button'; b.className = 'sd-anlat buyuk pdf'; b.innerHTML = yazi; b.setAttribute('aria-label', 'Konu anlatımını PDF ders notu olarak indir');
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (b.disabled) return;
      b.disabled = true; b.innerHTML = '<span aria-hidden="true">⏳</span> PDF hazırlanıyor…';
      setTimeout(function () {
        var d = null; try { d = yap(); } catch (x) { d = null; }
        (d ? dersPdf(d) : Promise.reject(new Error('ders yok'))).then(function () { b.innerHTML = '<span aria-hidden="true">✓</span> İndirildi'; }, function () { b.innerHTML = '<span aria-hidden="true">⚠️</span> PDF hazırlanamadı, yeniden dene'; })
          .then(function () { setTimeout(function () { b.disabled = false; b.innerHTML = yazi; }, 4000); });
      }, 30);
    });
    return b;
  }
  function hazirlaVeAc(yap, opt) { // büyük sayfalarda dersi kurmak birkaç yüz milisaniye sürebilir
    setTimeout(function () { var d = yap(); if (d) ac(d, opt); }, 0);
  }
  // Ronya soru bankası (banka.html): konu anlatımı, çözümlü örnekler, konu soruları
  function bankaOrnekDers(o) {
    var et = o.querySelector('.etiket');
    return parcalardanDers({ id: 'rbo-' + ozet(yaziMetni(o).slice(0, 400)), baslik: et ? yaziMetni(et) : 'Örnek', soru: satirlaraBol(o.querySelector('.metin') || o), cozum: satirlaraBol(o.querySelector('.cozum') || document.createElement('div')) });
  }
  function ksDers(k) {
    var g = k.querySelector('.ks-goster'), cz = k.querySelector('.ks-cozum');
    if (g && cz && !yaziMetni(cz)) g.click(); // çözümü sayfada da aç ("Çözümü göster" ile aynı)
    var no = k.querySelector('.ks-no'), siklar = [];
    Array.prototype.forEach.call(k.querySelectorAll('.sik'), function (b) { var h = b.querySelector('.h'), t = b.querySelector('.t'); siklar.push('<b>' + esc(h ? yaziMetni(h) : '') + ')</b> ' + (t ? t.innerHTML : b.innerHTML)); });
    var gb = cz && cz.querySelector('.geri-bildirim'), cozum = [];
    if (gb) { var bb = gb.querySelector('b'); if (bb) cozum.push('<b>' + esc(yaziMetni(bb).replace(/^Yanlış\.\s*/, '')) + '</b>'); var gc = gb.querySelector('.gc'); if (gc) cozum = cozum.concat(satirlaraBol(gc)); }
    return parcalardanDers({ id: 'rbs-' + ozet(yaziMetni(k).slice(0, 400)), baslik: no ? yaziMetni(no) : 'Soru', soru: satirlaraBol(k.querySelector('.soru-metin') || k), siklar: siklar, cozum: cozum });
  }
  function bankaKopru() {
    Array.prototype.forEach.call(document.querySelectorAll('article.anlatim'), function (ar) {
      if (ar.querySelector(':scope > .sd-arac')) return;
      var bEl = document.querySelector('.rb-h1'), ad = bEl ? yaziMetni(bEl) : document.title;
      var yap = function () { return icerikDers({ id: 'rb-' + ozet(ad + (location.hash || '').split('/').slice(0, 3).join('/')), baslik: ad, bolumler: bolumlereAyir(ar, ad) }); };
      aracEkle(ar, ar.firstChild, 'Konuyu sesli anlat', function () { hazirlaVeAc(yap); }, yap);
      Array.prototype.forEach.call(ar.querySelectorAll(':scope > h3'), function (h) {
        h.appendChild(dugme('baslikta', 'Bu bölümü sesli anlat', function () { hazirlaVeAc(function () { var d = yap(); if (d) d.bolumBas = bolumBul(d, h); return d; }); }));
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.ornek'), function (o) {
      if (o.querySelector('.sd-anlat') || !o.querySelector('.cozum')) return;
      var b = dugme('yanda', 'Bu örneği sesli anlat', function () { ac(bankaOrnekDers(o)); });
      var cb = o.querySelector('.cozum-btn'); if (cb) cb.insertAdjacentElement('afterend', b); else o.appendChild(b);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.ks-kart'), function (k) {
      if (k.querySelector('.sd-anlat')) return;
      var g = k.querySelector('.ks-goster'); if (!g) return;
      g.insertAdjacentElement('afterend', dugme('yanda', 'Bu soruyu sesli çöz', function () { ac(ksDers(k)); }, 'Sesli çözüm'));
    });
  }
  // Ronya ana sayfa ekranlarındaki konu anlatımları (hız, denge, asit-baz, çözünürlük, fonksiyonel gruplar)
  var RONYA_KONU = '#maarif-content, #mdg-wrap, #mab-wrap, #cozunurluk-body, #fg-theory';
  function ronyaKonuKopru() {
    Array.prototype.forEach.call(document.querySelectorAll(RONYA_KONU), function (kap) {
      if (!kap.firstElementChild || kap.querySelector(':scope > .sd-arac')) return;
      var adBul = function () {
        var ekran = kap.closest('[id^="s-"]'), t = ekran && ekran.querySelector('.ptitle'), ad = t ? yaziMetni(t).replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+/, '') : 'Konu anlatımı';
        var alt = kap.parentNode && kap.parentNode.querySelector('.ob.sel2'); if (alt && !/soru/i.test(yaziMetni(alt))) ad += ' · ' + yaziMetni(alt);
        return ad;
      };
      var bolumler = bolumlereAyir(kap, adBul(), { kart: true }).filter(function (b) { return icerikVarMi(b.dugumler); });
      if (!bolumler.length) return;
      var yap = function () { var ad = adBul(); return icerikDers({ id: 'rk-' + ozet(kap.id + ad), baslik: ad, bolumler: bolumlereAyir(kap, ad, { kart: true }), enAz: 1 }); };
      aracEkle(kap, kap.firstChild, 'Konuyu sesli anlat', function () { hazirlaVeAc(yap); }, yap);
      bolumler.forEach(function (b) {
        if (!b.el) return;
        var hedef = /(^|\s)card(\s|$)/.test(sinifi(b.el)) ? b.el.querySelector('.slbl') : b.el;
        if (hedef && !hedef.querySelector('.sd-anlat')) hedef.appendChild(dugme('baslikta', 'Bu bölümü sesli anlat', function () { hazirlaVeAc(function () { var d = yap(); if (d) d.bolumBas = bolumBul(d, b.el); return d; }); }));
      });
    });
  }
  // kimyamed modül sayfaları: her "Bölüm" başlığına ve sayfa başına konu anlatımı düğmesi
  function kimyamedKonuKopru() {
    var main = document.querySelector('main.wrap') || document.querySelector('main');
    if (!main || !main.querySelector(':scope > h2') || main.querySelector('.sd-arac')) return;
    var h1 = document.querySelector('h1'), baslik = h1 ? yaziMetni(h1) : document.title;
    var adFn = function (h) { var k = dugmesizKopya(h), no = k.querySelector('.no'), n = no ? yaziMetni(no) : ''; if (no) no.remove(); return (n ? n + ': ' : '') + yaziMetni(k); };
    var bolumler = bolumlereAyir(main, baslik, { etiket: 'H2', ad: adFn }).filter(function (b) { return b.el && icerikVarMi(b.dugumler); });
    if (!bolumler.length) return;
    dugmeStili();
    var yap = function () { return icerikDers({ id: 'kmk-' + ozet(location.pathname), baslik: baslik, bolumler: bolumlereAyir(main, baslik, { etiket: 'H2', ad: adFn }).filter(function (b) { return b.el; }), enAz: 2 }); };
    var hero = main.querySelector('.hero');
    aracEkle(hero || main, hero ? null : main.firstChild, 'Konuyu baştan sona sesli anlat', function () { hazirlaVeAc(yap); }, yap);
    bolumler.forEach(function (b) {
      if (!b.el.querySelector('.sd-anlat')) b.el.appendChild(dugme('baslikta', 'Bu bölümü sesli anlat', function () { hazirlaVeAc(function () { var d = yap(); if (d) d.bolumBas = bolumBul(d, b.el); return d; }); }));
    });
  }
  function kopruler() {
    try { kimyamedKopru(); } catch (e) {}
    try { ronyaKopru(); } catch (e) {}
    var izle = function () {
      if (document.querySelector('article.anlatim, .ornek, .ks-kart, ' + RONYA_KONU)) dugmeStili();
      try { bankaKopru(); } catch (e) {}
      try { ronyaKonuKopru(); } catch (e) {}
    };
    izle();
    var bekliyor = false;
    if (window.MutationObserver && document.body) new MutationObserver(function () { if (!bekliyor) { bekliyor = true; setTimeout(function () { bekliyor = false; izle(); }, 120); } }).observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { try { kimyamedKonuKopru(); } catch (e) {} }, 250);
  }

  var SesliDers = window.SesliDers = {
    surum: '1.0',
    dersler: DERSLER,
    tema: null,
    yerlestir: function (el, opt) {
      opt = opt || {}; opt.mod = 'satir';
      var o = new Oynatici(el, opt);
      var ilk = opt.varsayilan || Object.keys(o.dersler)[0] || (opt.metin ? 'metin' : null);
      if (ilk) o.yukle(ilk);
      return o;
    },
    ac: ac,
    kapat: function () { if (pencereOynatici) pencereOynatici.kapat(); },
    durdur: function () { Oynatici.hepsi.forEach(function (o) { if (o.P.calisiyor) o.durdur(); }); },
    sorudanDers: sorudanDers,
    icerikDers: icerikDers,
    bolumlereAyir: bolumlereAyir,
    konuVerisindenDers: konuVerisindenDers,
    paragrafParcalari: paragrafParcalari,
    ronyaDers: ronyaDers,
    satirlaraBol: satirlaraBol,
    parcalardanDers: parcalardanDers,
    metindenDers: metindenDers,
    pdf: function (ders, opt) { return dersPdf(ders, opt); },
    dersNotu: dersNotu,
    konusmaMetni: konusmaMetni,
    formulCoz: formulCoz,
    otomatikHTML: otomatikHTML,
    _ic: { Ses: Ses, Kayitlar: Kayitlar, Yayin: Yayin, ayar: ayar, ozet: ozet, Oynatici: Oynatici, ORNEK_OKUMA: ORNEK_OKUMA }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kopruler); else kopruler();
})();
