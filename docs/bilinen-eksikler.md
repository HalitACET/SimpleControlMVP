# Bilinen Eksikler

Bu dosya, bilerek ertelenen veya kapsam dışı bırakılan konuları tutar.
Fark edilmemiş eksikler değil, verilmiş kararlardır.

Son güncelleme: Faz 7 sonu (bulut dağıtımı tamamlandı)

---

## Güvenlik

- **Token `localStorage`'da tutuluyor** — XSS'e açık. Kalıcı çözüm
  httpOnly cookie + CSRF koruması. Web paneli için geçerli.

- **`JWT_SECRET` varsayılanı repoda düz metin.** Yerel geliştirme değeri
  `application.properties` içinde görünüyor. Üretimde Render ortam
  değişkeniyle eziliyor, ama repoyu klonlayan biri yerel değeri görür.

- **`usesCleartextTraffic="true"` mobil manifest'te duruyor.** Uygulama
  artık HTTPS kullanıyor ama HTTP bağlantısına da izin veriyor. Yerel
  geliştirmede gerekli olduğu için kaldırılmadı. Gerçek dağıtımda
  `network_security_config` ile sadece yerel ağa izin verilmeli.

- **Cihaz eşleşmesi kaldırılırken bilgi sızıyor.** `/admin/device-unbind`
  hedef kullanıcı başka firmadaysa 403, hiç yoksa 404 dönüyor. Saldırgan
  kullanıcı adı deneyerek hangi adların sistemde olduğunu öğrenebilir.
  `AuthService` bu konuda doğru davranıyor (her durumda aynı 401), ama
  burada ayrım yapılıyor.

---

## Zaman ve tarih

- **Gece vardiyasında mola aralığı gece yarısını geçemiyor.** Doğrulama
  `breakStart < breakEnd` şartını arıyor. 22:00–06:00 vardiyası için
  23:30–00:30 molası girilemiyor. Kısa vadeli çözüm: molayı gece
  yarısından sonraya (02:00–02:30 gibi) tanımlamak.

- **JPQL'de `YEAR()` kullanımı.** `HolidayRepository`'de yıl filtresi
  `YEAR(h.holidayDate)` ile yapılıyor. Tatil tablosu küçük olduğu için
  sorun değil, ama fonksiyon çağrısı index kullanımını engeller.
  `raw_scans` üzerindeki tarih filtreleri aralık karşılaştırmasıyla
  yazıldı.

---

## Hesaplama

- **Gün içi ara çıkışlar artık düşülüyor**, ancak bunun bir yan etkisi
  var: bir personel gün içinde çıkış okutmayı unutursa günün tamamı
  eksik çıkış sayılıyor ve sonraki tüm çiftler kayıyor. Eski modelde
  (ilk/son okutma) bu hata görünmezdi. İK'nın manuel kayıt ekleme
  ekranını sık kullanması gerekebilir.

- **`DEVAM_EDIYOR` durumu yok.** Vardiyası hâlâ süren personel bugün
  `EKSIK_CIKIS` görünüyor. Teknik olarak doğru ama yanıltıcı.

- **Ara çıkışlarda son çift esas alınıyor.** `exitTime` son tamamlanmış
  çiftin çıkışıdır. İçeride/dışarıda kontrolü bu yüzden `exitTime`'a
  değil, son aralığın açık olup olmadığına bakar.

---

## Kod kalitesi

- **`getUserFromToken` beş serviste kopyalanmış:** `ScanService`,
  `AdminReportService`, `MeService`, `LocationService`, `DeviceService`.
  Ortak bir yardımcıya taşınabilir. Bilinçli teknik borç — beş servise
  birden dokunmanın riski, kazanılacak estetiğe değmedi.

- **`TransactionSuccessScreen`'de elle yazılmış hex renkler**
  (`#FEF3C7`, `#FDE68A`). Uyarı ikonu halkası için temada uygun ton
  bulunamadığı için yazılmış. Tasarım tokenlarına eklenmeli.

- **`catch (err: any)` kullanımları web genelinde duruyor.** API
  yanıtlarını map'leyen `any`'ler temizlendi, ancak catch blokları
  bırakıldı — 20+ dosyaya dokunmanın riski kazanca değmedi.

- **`Styleguide.tsx` satır içi stil ve hex renk içeriyor.** Bu kasıtlı:
  sayfa tasarım sistemini sergiliyor ve renk kodlarını metin olarak
  gösteriyor.

---

## Demo verisi ve ortam

- **`seed-demo` gelecek tarihli okutma üretiyor.** Simülatör bugünün
  tamamını dolduruyor, bu da `IMPOSSIBLE_SPEED` kuralını yanlış
  tetikliyor ve raporlarda ileri tarihli kayıt gösteriyor. Üretimde
  `prod` profili bu uçları hiç yüklemediği için risk düşük.

- **`DataSeeder` üretimde de çalışıyor.** `@Profile` taşımadığı için
  `prod`'da da `admin` kullanıcısını, varsayılan lokasyonu ve "Gündüz"
  vardiyasını oluşturuyor. İlk kurulum için gerekli, ama `mehmet.yilmaz`
  adında `employee_id` boş bir hesap da üretiyor — bu hesap kullanıcı
  listesinde görünüyor ve `/me/*` çağırırsa 400 alıyor.

- **Varsayılan lokasyon koordinatı gerçek tesisi göstermiyor.**
  Kurulumda İK'nın Lokasyonlar ekranından kendi tesis konumunu
  tanımlaması gerekiyor.

---

## Dağıtım

- **Render ücretsiz katmanı 15 dakika hareketsizlikte uyuyor.**
  Uyanma süresi ~3 dakika (512 MB RAM, 0.1 CPU ile Spring Boot açılışı).
  Mobil timeout 60 saniyeye çıkarıldı, ama bu ilk istek için yeterli
  değil. Seçenekler: timeout'u 180 saniyeye çıkarmak veya dışarıdan
  periyodik istekle servisi uyanık tutmak.

- **Neon ücretsiz katmanı** compute saatiyle sınırlı. Şu anki kullanım
  düşük, ama uzun vadede izlenmeli.

- **Yerel `.env` ve `application.properties` artık repoda.** Gizli
  değerler ortam değişkenine taşındı, varsayılanlar yerel geliştirme
  değerleri. Docker imajının yapılandırmayı görebilmesi için gerekliydi.

---

## Web paneli

- **Okutma iptali sonrası kullanıcıya etki gösterilmiyor.** İK bir
  kaydı iptal edince günün hesabı baştan yapılıyor ve sonuç ciddi
  değişebiliyor, ama bu değişiklik ekranda vurgulanmıyor.

- **`EmployeeResponse` gereksiz `firmId` dönüyor.** İstemci zaten kendi
  firmasının verisini görüyor.

- **Pasif personel filtresi sadece Personel ekranında var.** Diğer
  ekranlarda (raporlar, hareket kayıtları) pasif personel görünmüyor,
  filtresi de yok.

---

## Bilerek kapsam dışı (MVP)

- **Terminal cihaz.** Telefon tabanlı çözüm tercih edildi.
- **Sabit QR'ın güvenlik zayıflığı.** İçerik `PDKS:{firmId}:{locationCode}`
  biçiminde, TTL veya imza yok. Kopyalanabilir.
- **Yarım gün tatil (arife).** Tatil tam gün olarak modelleniyor.
- **Tekrar eden tatil kuralı.** Her tarih ayrı satır.
- **Çalışma grubuna özel tatil.** Tatil listesi firma geneli.
- **Çok şirket arayüzü.** Veri modeli hazır, `firmId` sabit gönderiliyor.
- **İzin ve fazla mesai onay akışı.**
- **Web'de şifre değiştirme ekranı.** `mustChangePassword` bayrağı web
  tarafında yok sayılıyor. Tek firma ve İK hesabı kurulumda elle
  açıldığı için geçici şifre senaryosu oluşmuyor.
- **Adres arama (geocoding).** Lokasyon tanımlarken adres yazıp haritayı
  oraya taşıma özelliği. Nominatim'in kullanım politikası nedeniyle
  eklenmedi; koordinat elle, haritadan veya "Konumumu Al" ile giriliyor.
- **Backend `searchUsers` Türkçe normalleştirme yapmıyor**
  ("yilmaz" araması "Yılmaz"ı bulmaz). PostgreSQL `unaccent` eklentisi
  gerekiyor. Hiçbir ekran bu endpoint'i kullanmıyor, aramalar istemcide
  yapılıyor.

---

## Kapanmış maddeler

Kayıt amaçlı tutuluyor:

- `users.shift_id` kaldırıldı (V9)
- `FraudDetectionService` fail-open — servis tamamen silindi (V11)
- `location.ts` sabit Gebze koordinatı — kaldırıldı, konum alınamazsa
  okutma engelleniyor
- Önbellekteki konumla geofence atlatma — önbellek fallback'i kaldırıldı
- `gradle.properties` arm64-only — dört mimari eklendi
- `UserRepository.searchUsers` isim araması — geri getirildi
- `/admin/shifts-legacy` — böyle bir endpoint hiç yokmuş
- `FROZEN_COORDINATE` kuralı — yanlış pozitif ürettiği için kaldırıldı
- CORS `allowedOriginPatterns("*")` — gerçek origin listesine geçildi
- `application-example.properties` güncel değildi — düzeltildi
- `window.confirm` kullanımları — `ConfirmDialog`'a geçildi
- Axios 401 interceptor'ı tam sayfa yeniliyordu — React Router'a geçildi
- Satır içi `style={{}}` (WorkGroups, UserAccounts, Scans) — CSS Modules'e
  taşındı
- API yanıtlarında `any` — gerçek tipler tanımlandı
- `toISOString()` UTC sorunu (HistoryScreen) — yerel tarih üretimine geçildi
- Çevrimdışı kuyruk kaydında `timestamp` alanı okunuyordu, alan adı
  `scannedAt`'ti — bekleyen kayıtlar yanlış saat gösteriyordu
- Manuel kayıt DTO alan adları uyuşmuyordu (`scanTime`/`note` →
  `scannedAt`/`manualNote`)
- Personel ve hesap durumu ayrı yönetiliyordu — tek duruma indirildi
- Pasif personel giriş yapıp okutma yapabiliyordu — kapı kontrolü eklendi
- GPS'te ilk eşleşen lokasyon seçiliyordu — en yakın olan seçiliyor
- Gün içi ara çıkışlar hesaba katılmıyordu — çift eşleştirmesi eklendi
- Mola süre olarak tanımlanıyordu — saat aralığına çevrildi (V13)
- Lokasyon soft delete sonrası kod tekrar kullanılamıyordu — partial
  unique index (V12)
- Kullanıcı Hesapları ekranı ile Personel ekranı çakışıyordu — hesap
  yönetimi Personel drawer'ına taşındı, ayrı ekran kaldırıldı
