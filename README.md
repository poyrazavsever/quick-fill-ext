<div align="center">
  <img src="public/logo.png" alt="Shortcut Injector Logo" width="120" />
  <h1>Shortcut Injector</h1>
  <p>Form doldurma sürecini hızlandıran, alias ve kısayol tabanlı tarayıcı eklentisi.</p>
</div>

## İçindekiler

- [Proje Özeti](#proje-ozeti)
- [Özellikler](#ozellikler)
- [Kullanım Akışı](#kullanim-akisi)
- [Arayüzler](#arayuzler)
- [Renk Paleti](#renk-paleti)
- [Teknik Mimari](#teknik-mimari)
- [Kurulum ve Çalıştırma](#kurulum-ve-calistirma)
- [Tarayıcıya Yükleme](#tarayiciya-yukleme)
- [İzinler](#izinler)
- [Kısıtlar](#kisitlar)
- [Yol Haritası](#yol-haritasi)
- [Lisans](#lisans)

## Proje Özeti

`Shortcut Injector`, sık kullanılan form değerlerini (isim, e-posta, sosyal bağlantılar vb.) tek tuş kombinasyonu veya anahtar kelime tabanlı tamamlama ile anında alana yazdırır.

Amaç:

- Tekrarlayan form doldurma işini hızlandırmak
- Aynı verileri kopyala-yapıştır yapmadan kullanabilmek
- Farklı kullanım senaryoları için birden fazla profil yönetebilmek

## Özellikler

- Çoklu profil desteği (farklı varyantlar için)
- Her profil için `field` veya `link` tipinde item tanımlama
- Item başına özelleştirilebilir kısayol (ör. `ctrl+alt+1`)
- Item başına alias tanımlama (ör. `linkedin`)
- `alias + Tab` ile otomatik tamamlama
- Popup üzerinden tek tıkla değer enjekte etme
- Gelişmiş yönetim için ayrı ayarlar sayfası (`options`)
- Verilerin `chrome.storage.sync` ile kalıcı tutulması
- Chrome + Firefox (MV3) uyumluluğu

## Kullanım Akışı

### 1) Kısayol ile Enjekte Etme

1. Web sayfasında bir `input`, `textarea` veya `contenteditable` alanına odaklan.
2. Tanımlı kısayola bas (ör. `ctrl+alt+1`).
3. Eşleşen item değeri imleç konumuna yazılır.

### 2) Alias + Tab Otomatik Tamamlama

1. Alana item alias değerini yaz (ör. `linkedin`).
2. `Tab` tuşuna bas.
3. Alias, kayıtlı gerçek değer ile değiştirilir.

### 3) Popup ile Tek Tık Enjekte Etme

1. Eklenti popup'unu aç.
2. Aktif profili seç.
3. Listeden bir item'a tıkla.
4. Değer aktif sekmedeki odaklı alana yazılır.

## Arayüzler

### Popup

Hızlı kullanım odaklı, sade ekran:

- Profil seçimi
- Kayıtlı item listesi
- Tek tık enjekte etme
- `Ekstra Alanlar` butonuyla ayarlar sayfasına geçiş

### Ayarlar (Options)

Detaylı yönetim ekranı:

- Profil ekleme/silme/yeniden adlandırma
- Item ekleme/silme
- `label`, `alias`, `value`, `type`, `shortcut`, `star` düzenleme

## Renk Paleti

| Rol | Değer |
| --- | --- |
| Primary | `#27b0c1` |
| Secondary | `#40396e` |
| White | `#f2f2f2` |

## Teknik Mimari

```text
src/
  App.tsx                  -> Popup UI
  options-main.tsx         -> Options giriş dosyası
  options/OptionsApp.tsx   -> Options UI
  content.ts               -> Kısayol ve alias tamamlama motoru
  lib/
    ext-api.ts             -> Browser/Chrome uyum katmanı
    storage.ts             -> Kalıcılık (sync storage)
    shortcuts.ts           -> Kısayol normalize / çözümleme
    defaults.ts            -> Varsayılan profil + item verisi
    types.ts               -> Tip tanımları
```

## Kurulum ve Çalıştırma

```bash
npm install
npm run dev
```

Build almak için:

```bash
npm run build
```

Kalite kontrol:

```bash
npm run lint
```

## Tarayıcıya Yükleme

### Chrome (MV3)

1. `npm run build`
2. Chrome'da `chrome://extensions` aç
3. `Developer mode` aç
4. `Load unpacked` seç
5. `dist` klasörünü göster

### Firefox (MV3)

1. `npm run build`
2. `about:debugging#/runtime/this-firefox` sayfasını aç
3. `Load Temporary Add-on...` seç
4. `dist/manifest.json` dosyasını seç

## İzinler

- `storage`: profil, item, alias ve kısayol verilerini saklamak
- `tabs`: popup üzerinden aktif sekmeye mesaj göndermek
- `host_permissions: <all_urls>`: içerik script'inin sayfalarda çalışabilmesi

## Kısıtlar

- `chrome://` benzeri özel sayfalarda içerik script'i çalışmaz.
- Alias tamamlama `Tab` tuşuna bağlıdır ve odaklı düzenlenebilir alan gerektirir.
- Çok genel kısayollar çakışma yaratabilir; kombinasyonları dikkatli seçmek gerekir.

## Yol Haritası

- JSON import/export
- Item sıralama (drag-and-drop)
- Kısayol çakışma uyarıları
- Site bazlı profil seçimi

## Lisans

MIT