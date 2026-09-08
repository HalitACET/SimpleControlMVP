# Simple Control — Personel Devam Kontrol Sistemi

Mobil cihaz üzerinden QR kod ve GPS doğrulamasıyla personel giriş-çıkış takibi sağlayan, sahtecilik önleme, çevrimdışı çalışma ve vardiya/puantaj yönetimi destekli tam yığın (full-stack) PDKS çözümü.

> 🎓 Bu proje, Simple Software bünyesinde yürütülen zorunlu staj kapsamında geliştirilmiştir.
> **Geliştirici:** Halit ACET

**Canlı demo:** https://simple-control-mvp.vercel.app
**API:** https://simple-control-api.onrender.com

---

## Özellikler

- 🔐 **JWT tabanlı kimlik doğrulama** — firma kodu + kart numarası + şifre, ilk girişte zorunlu şifre değişimi
- 📱 **Cihaz eşleştirme (device binding)** — hesap ilk giriş yapılan cihaza kilitlenir, farklı cihazdan erişim engellenir
- 📷 **QR kod ile okutma** — kamera ile kapıdaki QR okutulur, eş zamanlı konum doğrulanır
- 📍 **GPS ile okutma** — kamerasız, konum doğrulamalı giriş/çıkış
- 🛡️ **Çok katmanlı sahtecilik önleme**
  - Cihazda: sahte konum (mock location) ve root tespiti
  - Sunucuda: geofence ihlali, imkânsız hız analizi
  - Şüpheli okutmalar kaydedilir ama mesai hesabına dahil edilmez
- ✈️ **Çevrimdışı çalışma** — internet yokken okutmalar cihazda kuyruklanır, bağlantı gelince otomatik ve çift-kayıt korumalı (idempotent) senkronizasyon
- 🖥️ **İK web paneli** — personel, cihaz, lokasyon, vardiya, çalışma grubu ve tatil yönetimi; QR üretimi ve yazdırma
- ⏱️ **Vardiya ve puantaj motoru** — giriş/çıkış çifti eşleştirmesi, mola kesişimi, geç kalma / erken çıkış / fazla mesai hesabı
- 📊 **Raporlar** — günlük devam, aylık puantaj, gerekçeli okutma iptali, Excel çıktısı
- 🎨 **Endüstriyel tasarım dili** — saha koşullarına uygun yüksek kontrast, büyük dokunma alanları, Barlow tipografi

---

## Mimari

```text
+-----------------+          REST / JWT          +------------------+          +---------------------+
|  React Native   | ---------------------------> |   Spring Boot    | <------- | simple-control-web  |
|  (TypeScript)   | <--------------------------- |    (Java 17)     | -------> |  (React + Vite)     |
|                 |                              |                  |          |                     |
| - Keychain      |                              | - Spring Security|          | - Personel/Vardiya  |
| - Offline Queue |                              | - Scan Validation|          | - Lokasyon + QR     |
| - Mock Detection|                              | - Attendance Calc|          | - Raporlar + Excel  |
+-----------------+                              +--------+---------+          +---------------------+
                                                          |
                                                    +-----v--------+
                                                    | PostgreSQL 17|
                                                    |   (Flyway)   |
                                                    +--------------+
```

**Veritabanı tabloları:** `users` · `employees` · `devices` · `locations` · `raw_scans` · `shifts` · `work_groups` · `work_group_days` · `departments` · `holidays`

---

## Tasarım kararları

**Ham veri saklanır, sonuç hesaplanır.**
Veritabanında yalnızca okutma kaydı tutulur. Giriş/çıkış eşleştirmesi, vardiya ataması ve geç kalma hesabı saklanmaz — rapor sorgusunda anlık hesaplanır. Böylece vardiya veya tolerans tanımı değişince geçmiş dönem kendiliğinden doğru hesaplanır.

**Okutma tip taşımaz.**
Kayıtta "giriş" veya "çıkış" alanı yoktur. Günün okutmaları sırayla eşleştirilir: (1.–2.), (3.–4.)… Her çift bir çalışma aralığıdır ve aradaki boşluklar çalışma süresinden düşülür. Tek sayıda okutma kalırsa gün *eksik çıkış* sayılır.

**Mola aralık olarak tanımlanır.**
Vardiyaya "60 dakika mola" değil, "12:30–13:30 arası mola" girilir. Çalışma aralıklarıyla molanın kesişimi hesaplanıp düşülür — personel molada çıkış okutsa da okutmasa da sonuç aynı olur, çift düşme yaşanmaz.

**Zaman yönetimi yerel saattir.**
Tüm zamanlar Europe/Istanbul. İstemciler yerel saat gönderir, sunucu dönüşüm yapmaz, veritabanı `WITHOUT TIME ZONE` saklar.

**Soft delete.**
Personel, lokasyon, departman ve vardiya silinmez, pasife alınır. Unique kısıtlar partial index olarak tanımlıdır (`WHERE active = true`), böylece silinen kaydın kodu tekrar kullanılabilir.

---

## Hesaplama kuralları

- Tatil listesi çalışma grubunu ezer
- Şüpheli ve iptal edilmiş okutmalar hesaba dahil edilmez, sayıları ayrıca raporlanır
- Aynı dakika içindeki tekrar okutmalar yok sayılır (kayıt silinmez)
- Tolerans aşılırsa tam süre yazılır, tolerans düşülmez
- Gece vardiyasında okutmalar vardiya penceresine göre günlere atanır (başlangıç −2 saat, bitiş +2 saat)
- Personel pasife alınınca uygulama erişimi de kapanır

### Okutma doğrulama

| Durum | Sonuç |
|---|---|
| Sahte konum uygulaması tespit edildi | Okutma yapılamaz |
| Konum servisleri kapalı | Okutma yapılamaz |
| Tesis alanı dışında (geofence) | Kaydedilir, *geçerli sayılmadı* olarak işaretlenir |
| İmkânsız hız (iki okutma arası mesafe/süre) | Kaydedilir, işaretlenir |
| Cihaz eşleşmiyor | Giriş reddedilir |
| Personel pasif | Giriş ve okutma reddedilir |

Şüpheli okutmalar mesai hesabına dahil edilmez ve personel bunu uygulamada görür.

---

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Mobil | React Native 0.86, TypeScript, React Navigation, Axios |
| Güvenli depolama | react-native-keychain (JWT + cihaz kimliği) |
| Konum & Kamera | react-native-geolocation-service, react-native-vision-camera |
| Güvenlik | jail-monkey (mock/root tespiti), sunucu tarafı anomali analizi |
| Çevrimdışı | AsyncStorage kuyruğu + NetInfo bağlantı dinleyici |
| Backend | Java 17, Spring Boot 4.1, Spring Security, JWT (jjwt) |
| Veritabanı | PostgreSQL 17, Spring Data JPA / Hibernate, Flyway |
| Web paneli | React 19, Vite, TypeScript, CSS Modules, Leaflet, SheetJS |

---

## API uç noktaları

### Kimlik ve cihaz

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/auth/login` | Giriş + JWT üretimi + cihaz kontrolü |
| POST | `/auth/change-password` | İlk giriş zorunlu şifre değişimi |
| POST | `/device/register` | Cihaz eşleştirme |
| GET | `/device/verify` | Cihaz doğrulama |

### Okutma

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/scans` | Okutma kaydı (doğrulama katmanlı) |
| POST | `/scans/batch` | Çevrimdışı kuyruk toplu senkronizasyonu (idempotent) |

### Personelin kendi verisi

| Metot | Yol | Açıklama |
|---|---|---|
| GET | `/me/next-action` | İçeride/dışarıda durumu + sıradaki hareket + vardiya |
| GET | `/me/scans` | Sayfalı okutma geçmişi (tarih filtreli) |
| GET | `/me/daily` | Günlük özet listesi (giriş/çıkış, süre, durum) |
| GET | `/me/summary` | Aylık puantaj özeti |

### İK yönetimi

| Metot | Yol | Açıklama |
|---|---|---|
| GET/POST/PUT/DELETE | `/admin/employees` | Personel yönetimi |
| GET/POST/PUT/DELETE | `/admin/locations` | Lokasyon yönetimi (geofence merkezi) |
| GET/POST/PUT/DELETE | `/admin/shifts` | Vardiya tanımları |
| GET/POST/PUT/DELETE | `/admin/work-groups` | Çalışma grupları ve gün atamaları |
| GET/POST/DELETE | `/admin/holidays` | Tatil tanımları |
| GET | `/admin/devices` | Kayıtlı cihazlar |
| POST | `/admin/device-unbind` | Cihaz eşleşmesini kaldırma |
| GET | `/admin/scans` | Filtreli okutma kayıtları |
| POST | `/admin/scans/manual` | Gerekçeli manuel kayıt girişi |
| PUT | `/admin/scans/{id}/exclude` | Gerekçeli okutma iptali |
| PUT | `/admin/scans/{id}/include` | İptali geri alma |
| GET | `/admin/reports/daily` | Günlük devam raporu |
| GET | `/admin/reports/monthly` | Aylık puantaj raporu |
| GET | `/health` | Sağlık kontrolü |

---

## Test senaryoları

| # | Senaryo | Sonuç |
|---|---|---|
| TC01 | Farklı cihazdan giriş denemesi | ✅ Erişim engellendi |
| TC02 | Çevrimdışı okutma + senkronizasyon | ✅ Cihazda saklandı, otomatik senkronize edildi |
| TC03 | GPS kapalıyken okutma denemesi | ✅ Okutmaya izin verilmedi |
| TC04 | Sahte konum (mock GPS) ile deneme | ✅ Cihazda tespit edildi, istek gönderilmedi |
| TC05 | Tesis dışından okutma | ✅ Kaydedildi, geçerli sayılmadı |
| TC06 | Gün içi ara çıkış (4 okutma) | ✅ Aradaki boşluk çalışma süresinden düşüldü |
| TC07 | Gece vardiyası gün devri | ✅ Okutmalar doğru vardiya gününe atandı |
| TC08 | Okutma iptali sonrası yeniden hesaplama | ✅ Gün baştan eşleştirildi |

---

## Kurulum

### Ön koşullar

JDK 17 · Node 20+ · PostgreSQL 17 · Android SDK · fiziksel Android cihaz (GPS/kamera testleri için önerilir)

> PostgreSQL kurulumunda locale `C` seçilmelidir — Türkçe locale `initdb` adımını başarısız kılıyor.

### Backend

```bash
cd pdks-backend
cp src/main/resources/application-example.properties \
   src/main/resources/application.properties
# veritabani bilgilerini ve JWT secret degerini duzenleyin
./mvnw spring-boot:run
```

Flyway migration'ları açılışta otomatik uygulanır.
Sağlık kontrolü: `http://localhost:8080/health`

### Web paneli

```bash
cd simple-control-web
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

### Mobil (Android)

```bash
cd PdksMobile
npm install
# src/config.ts icinde API_BASE_URL degerini ayarlayin
npx react-native run-android
```

---

## Demo hesapları

| Kullanıcı | Şifre | Nerede |
|---|---|---|
| `admin` | `Admin1234` | Web paneli |
| `1001`–`1005` | `Demo1234` | Mobil uygulama |

Firma kodu: `ATLAS01`

Demo verisi (yalnızca `dev` profilinde): `POST /dev/seed-demo`

---

## Deployment

| Bileşen | Servis |
|---|---|
| Backend | Render (Docker) |
| Veritabanı | Neon (PostgreSQL) |
| Web paneli | Vercel |
| Mobil | Release APK |

Yapılandırma ortam değişkenleriyle yapılır:
`DATABASE_URL` · `DB_USERNAME` · `DB_PASSWORD` · `JWT_SECRET` · `CORS_ALLOWED_ORIGINS` · `SPRING_PROFILES_ACTIVE`

`prod` profilinde demo veri üretme ve simülatör uçları yüklenmez.

> Backend ücretsiz katmanda çalıştığı için 15 dakika hareketsizlikte uyur. İlk istek sunucuyu uyandırır; bu yaklaşık üç dakika sürer.

---

## Ekran görüntüleri

### Mobil uygulama

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
  <img src="docs/screenshots/gecis-gecersiz.jpeg" width="180">
</p>
<p align="center">
  <img src="docs/screenshots/gecmis-gunluk.jpeg" width="180">
  <img src="docs/screenshots/gecmis-gun-detay.jpeg" width="180">
  <img src="docs/screenshots/profil-bu-ay.jpeg" width="180">
  <img src="docs/screenshots/konum-kapali-hata.jpeg" width="180">
</p>

### Güvenlik testleri

<p align="center">
  <img src="docs/screenshots/tc01-device-mismatch.jpeg" width="180">
  <img src="docs/screenshots/tc03-gps-kapali.jpeg" width="180">
  <img src="docs/screenshots/tc04-fake-gps-ekrani.jpeg" width="180">
  <img src="docs/screenshots/tc01-cihaz-eslestirildi.jpeg" width="180">
</p>

### Çevrimdışı senkronizasyon

<p align="center">
  <img src="docs/screenshots/tc02-offline-basari.jpeg" width="180">
  <img src="docs/screenshots/tc02-ana-ekran-bekliyor.jpeg" width="180">
  <img src="docs/screenshots/tc02-gecmis-bekliyor.jpeg" width="180">
  <img src="docs/screenshots/tc02-sync-sonrasi.jpeg" width="180">
</p>

### İK web paneli

<p align="center">
  <img src="docs/screenshots/web-01-login.png" width="410">
  <img src="docs/screenshots/web-02-employees.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-03-employee-drawer.png" width="410">
  <img src="docs/screenshots/web-13-devices.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-04-locations.png" width="410">
  <img src="docs/screenshots/web-05-location-modal.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-06-qr-print.png" width="410">
  <img src="docs/screenshots/web-12-shifts.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-07-scans.png" width="410">
  <img src="docs/screenshots/web-08-scan-exclude.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-09-daily-report.png" width="410">
  <img src="docs/screenshots/web-10-monthly-report.png" width="410">
</p>
<p align="center">
  <img src="docs/screenshots/web-11-monthly-detail.png" width="410">
  <img src="docs/screenshots/export-excel.png" width="410">
</p>

---

## Belgeler

- [`docs/bilinen-eksikler.md`](docs/bilinen-eksikler.md) — bilinçli olarak ertelenen konular
- [`docs/calistirma.md`](docs/calistirma.md) — ayrıntılı çalıştırma notları
- [`CLAUDE.md`](CLAUDE.md) — proje kuralları

---

## Kapsam dışı

MVP kapsamında bilinçli olarak yapılmayanlar:

- Terminal cihaz desteği (telefon tabanlı çözüm tercih edildi)
- QR kodda TTL veya imza (sabit içerik)
- Yarım gün tatil, tekrar eden tatil kuralı
- Çalışma grubuna özel tatil listesi
- Çok şirket arayüzü (veri modeli hazır, arayüz yok)
- İzin ve fazla mesai onay akışı

---

## Yol haritası

- [x] Kimlik doğrulama + cihaz eşleştirme
- [x] QR / GPS okutma çekirdeği
- [x] Sahtecilik önleme katmanları
- [x] Çevrimdışı senkronizasyon
- [x] İK web paneli (React'e taşındı)
- [x] Vardiya, çalışma grubu, departman ve tatil yönetimi
- [x] Lokasyon yönetimi, QR üretimi ve yazdırma
- [x] Giriş/çıkış çifti eşleştirmesi ve mola kesişimi
- [x] Günlük ve aylık raporlar + Excel çıktısı
- [x] Okutma iptali ve manuel kayıt
- [x] Bulut dağıtımı (Render + Neon + Vercel)
