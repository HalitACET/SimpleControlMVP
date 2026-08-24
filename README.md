# PDKS Mobile — Personel Devam Kontrol Sistemi

Mobil cihaz üzerinden QR kod ve GPS doğrulamasıyla personel giriş-çıkış takibi sağlayan, sahtecilik önleme, çevrimdışı çalışma ve vardiya/puantaj yönetimi destekli tam yığın (full-stack) PDKS çözümü.

> 🎓 Bu proje, Simple Software bünyesinde yürütülen zorunlu yaz stajı kapsamında geliştirilmiştir.
> **Geliştirici:** Halit ACET · **Teslim:** 11.09.2026

---

## Özellikler

- 🔐 **JWT tabanlı kimlik doğrulama** — firma kodu + kullanıcı adı + şifre, ilk girişte zorunlu şifre değişimi
- 📱 **Cihaz eşleştirme (device binding)** — hesap ilk giriş yapılan cihaza kilitlenir, farklı cihazdan erişim engellenir
- 📷 **QR kod ile geçiş** — kamera ile kapıdaki QR okutulur, eş zamanlı konum doğrulanır
- 📍 **GPS ile geçiş** — kamerasız, konum doğrulamalı giriş/çıkış
- 🛡️ **Çok katmanlı sahtecilik önleme**
  - Cihazda: sahte konum (mock location) tespiti
  - Sunucuda: imkânsız hız (ışınlanma), geofence ihlali, donmuş koordinat analizi
  - Şüpheli denemelerin ayrı tabloda loglanması
- ✈️ **Çevrimdışı çalışma** — internet yokken geçişler cihazda kuyruklanır, bağlantı gelince otomatik ve çift-kayıt korumalı (idempotent) senkronizasyon
- 🖥️ **Admin / İK web paneli** — personel, cihaz, lokasyon yönetimi; QR üretimi; şüpheli deneme izleme; filtreli geçiş kayıtları + CSV
- ⏱️ **Vardiya ve puantaj motoru** — aylık çalışma süresi, geç kalma/eksik kayıt/hafta sonu mesaisi tespiti, gerekçeli manuel düzeltme, denetim izli kayıt silme, Excel çıktısı
- 🎨 **Endüstriyel tasarım dili** — saha koşullarına uygun yüksek kontrast, büyük dokunma alanları, Barlow tipografi

## Mimari

```text
+-----------------+          REST / JWT          +------------------+          +-----------------+
|  React Native   | ---------------------------> |   Spring Boot    | -------> |   pdks-admin     |
|  (TypeScript)   | <--------------------------- |    (Java 17)     | <------- |  (HTML/CSS/JS)   |
|                 |                              |                  |          |                  |
| - Keychain      |                              | - Spring Security|          | - Dashboard      |
| - Offline Queue |                              | - Fraud Detection|          | - Puantaj/QR     |
| - Mock Detection|                              | - Timesheet Engine|         | - CSV Export     |
+-----------------+                              +--------+---------+          +-----------------+
                                                          |
                                                    +-----v-----+
                                                    |   MSSQL   |
                                                    +-----------+
```

**Veritabanı tabloları:** `users` · `devices` · `locations` · `transactions` · `suspicious_attempts` · `shifts` · `deleted_transaction_logs`

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Mobil | React Native 0.86, TypeScript, React Navigation, Axios |
| Güvenli depolama | react-native-keychain (JWT + cihaz kimliği) |
| Konum & Kamera | react-native-geolocation-service (FusedLocationProvider), react-native-vision-camera |
| Güvenlik | jail-monkey (mock/root tespiti), sunucu tarafı anomali analizi |
| Çevrimdışı | AsyncStorage kuyruğu + NetInfo bağlantı dinleyici |
| Backend | Java 17, Spring Boot 3.3, Spring Security 6, JWT (jjwt 0.12) |
| Veritabanı | Microsoft SQL Server, Spring Data JPA / Hibernate |
| Admin Panel | Vanilla HTML/CSS/JS, Tailwind CDN, qrcodejs |

## API Uç Noktaları

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/auth/login` | Giriş + JWT üretimi + cihaz kontrolü |
| POST | `/auth/change-password` | İlk giriş zorunlu şifre değişimi |
| POST | `/device/register` | Cihaz eşleştirme |
| GET | `/device/verify` | Cihaz doğrulama |
| GET | `/transaction/next-action` | Sıradaki hareket önerisi + vardiya bilgisi |
| POST | `/transaction/log` | Geçiş kaydı (sahtecilik kontrollü) |
| POST | `/transaction/sync` | Çevrimdışı kuyruk toplu senkronizasyonu (idempotent) |
| GET | `/transaction/history` | Sayfalı geçiş geçmişi |
| GET | `/me/timesheet-summary` | Personelin kendi aylık puantaj özeti |
| GET/POST | `/admin/users`, `/admin/devices`, `/admin/locations`, `/admin/shifts` | İK yönetim uç noktaları |
| GET | `/admin/timesheet` | Aylık puantaj raporu |
| DELETE | `/admin/transactions/{id}` | Gerekçeli, denetim izli kayıt silme |
| GET | `/health` | Sağlık kontrolü |

## Test Senaryoları (Kabul Kriterleri)

| # | Senaryo | Sonuç |
|---|---|---|
| TC01 | Farklı cihazdan giriş denemesi | ✅ Erişim engellendi |
| TC02 | Çevrimdışı geçiş + senkronizasyon | ✅ Cihazda saklandı, otomatik senkronize edildi |
| TC03 | GPS kapalıyken geçiş denemesi | ✅ Geçişe izin verilmedi |
| TC04 | Sahte konum (mock GPS) ile deneme | ✅ Cihazda + sunucuda tespit edildi |

Ayrıntılı test kanıtları: [`docs/test-report.md`](docs/test-report.md)

## Kurulum

### Backend
```bash
cd pdks-backend
# application.properties.example dosyasini application.properties olarak kopyalayip
# DB sifresi ve JWT secret degerlerini girin
./mvnw spring-boot:run
```

### Mobil (Android)
```bash
cd PdksMobile
npm install
# src/config.ts icinde API_BASE_URL degerini backend makinesinin yerel IP adresine ayarlayin
npx react-native run-android
```

### Admin Panel
```bash
cd pdks-admin
# js/api.js icinde API_BASE degerinin backend adresini gosterdiginden emin olun
npx serve .
```

> **Gereksinimler:** JDK 17, Node 20+, Android SDK 34, MSSQL Server, fiziksel Android cihaz (GPS/kamera testleri için önerilir)

## Ekran Görüntüleri

### Mobil Uygulama

<p align="center">
  <img src="docs/screenshots/login.jpeg" width="180">
  <img src="docs/screenshots/sifre-degistirme.jpeg" width="180">
  <img src="docs/screenshots/home-disarda.jpeg" width="180">
  <img src="docs/screenshots/home-icerde.jpeg" width="180">
</p>
<p align="center">
  <img src="docs/screenshots/qr-tarama.jpeg" width="180">
  <img src="docs/screenshots/gecis-onay.jpeg" width="180">
  <img src="docs/screenshots/gecis-basarili.jpeg" width="180">
  <img src="docs/screenshots/gecmis.jpeg" width="180">
</p>
<p align="center">
  <img src="docs/screenshots/profil.jpeg" width="180">
  <img src="docs/screenshots/tc01-device-mismatch.jpeg" width="180">
  <img src="docs/screenshots/tc03-gps-kapali.jpeg" width="180">
  <img src="docs/screenshots/tc04-fake-gps-ekrani.jpeg" width="180">
</p>

### Çevrimdışı Senkronizasyon (TC02)

<p align="center">
  <img src="docs/screenshots/tc02-offline-basari.jpeg" width="180">
  <img src="docs/screenshots/tc02-ana-ekran-bekliyor.jpeg" width="180">
  <img src="docs/screenshots/tc02-gecmis-bekliyor.jpeg" width="180">
  <img src="docs/screenshots/tc02-sync-sonrasi.jpeg" width="180">
</p>

### Admin / İK Paneli

<p align="center">
  <img src="docs/screenshots/panel-dashboard.png" width="410">
  <img src="docs/screenshots/panel-personel.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/panel-cihazlar.png" width="410">
  <img src="docs/screenshots/panel-gecisler.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/panel-supheli-denemeler.png" width="410">
  <img src="docs/screenshots/panel-lokasyonlar-qr.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/panel-vardiyalar.png" width="410">
  <img src="docs/screenshots/panel-puantaj.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/panel-puantaj-duzelt.png" width="270">
  <img src="docs/screenshots/panel-silme-gerekce.png" width="270">
  <img src="docs/screenshots/export-excel.png" width="270">
</p>

## Yol Haritası

- [x] Kimlik doğrulama + cihaz eşleştirme
- [x] QR / GPS geçiş çekirdeği
- [x] Sahtecilik önleme katmanları
- [x] Çevrimdışı senkronizasyon
- [x] İK / Admin web paneli
- [x] Vardiya tanımları ve puantaj raporları
