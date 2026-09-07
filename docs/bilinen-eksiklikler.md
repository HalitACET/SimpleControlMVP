# Bilinen Eksikler

Bu dosya, bilerek ertelenen veya kapsam dışı bırakılan konuları tutar.
Fark edilmemiş eksikler değil, verilmiş kararlardır.

Son güncelleme: Faz 6 sonu (mobil taşıma tamamlandı)

---

## Faz 7 (deployment) öncesi zorunlu

- **CORS fazla açık.** `SecurityConfig.java:86` içinde
  `allowedOriginPatterns("*")` ve `setAllowCredentials(true)` birlikte
  kullanılıyor. Herhangi bir origin kimlik bilgisiyle istek atabilir.
  AWS'ye çıkmadan önce gerçek origin listesiyle değiştirilecek.

- **`application-example.properties` güncel değil.**
  `spring.jpa.hibernate.ddl-auto=update` yazıyor, gerçek dosyada
  `validate`. Flyway, profil ve saat dilimi ayarları da eksik.
  Yeni ortam kuranlar bu dosyadan üretiyor, yanlış yapılandırma
  şemayı bozabilir.

- **Token `localStorage`'da tutuluyor** — XSS'e açık. Kalıcı çözüm
  httpOnly cookie + CSRF koruması.

- **Lokasyon ve cihaz yönetimi arayüzü yok.** Sidebar'da menü var,
  sayfa yok; backend'de de CRUD endpoint'i yok. `locations` tablosu
  1. projeden geliyor, sadece okunuyor. Geofence merkezi şu an ancak
  elle SQL ile değiştirilebiliyor. Gerçek kurulumda İK'nın tesis
  konumunu ve QR kodunu tanımlayabilmesi gerekiyor.

---

## Zaman ve tarih

- **`toISOString()` UTC'ye çeviriyor.** `HistoryScreen` içinde bugün
  karşılaştırması ve `calculateDates` bu kalıbı kullanıyor. Türkiye
  UTC+3 olduğu için gece 00:00–03:00 arasında bir önceki günü döner.
  Projenin zaman yönetimi kararı "tüm zamanlar yerel saat, UTC'ye
  çevirme yok" — bu satırlar o karara aykırı. Yerel tarih üreten bir
  yardımcıyla değiştirilecek. Gece vardiyası testinde ortaya çıkacak.

- **JPQL'de `YEAR()` kullanımı.** `HolidayRepository`'de yıl filtresi
  `YEAR(h.holidayDate)` ile yapılıyor. Tatil tablosu küçük, sorun değil.
  Ama `raw_scans` üzerinde tarih filtresi aralık karşılaştırmasıyla
  (`>=` / `<`) yazıldı — fonksiyon çağrısı index kullanımını engeller.

---

## Kod kalitesi

- **`getUserFromToken` üç serviste kopyalanmış:** `ScanService`,
  `AdminReportService`, `MeService`. Ortak bir yardımcıya taşınabilir.

- **`TransactionSuccessScreen`'de elle yazılmış hex renkler**
  (`#FEF3C7`, `#FDE68A`). Uyarı ikonu halkası için temada uygun ton
  bulunamadığı için yazılmış. Tasarım tokenlarına eklenmeli.

- **Web'de satır içi `style={{}}` kullanımı.** `WorkGroups.tsx`,
  `UserAccounts.tsx`, `Styleguide.tsx` dosyalarında var. Stil yaklaşımı
  CSS Modules, bu kullanımlar aykırı.

---

## Web tarafı

- **`mustChangePassword` bayrağı yok sayılıyor.** Mobil saygı
  gösteriyor, web göstermiyor. Şifre değiştirme ekranı yazılacak.

- **Axios 401 interceptor'ı tam sayfa yenileme yapıyor.**
  `window.location.href` yerine React Router yönlendirmesi
  kullanılacak. (`src/api/axios.ts`)

- **Okutma iptali için ekran yok.** Backend hazır
  (`PUT /admin/scans/{id}/exclude` ve `/include`), arayüz yazılmadı.

- **Onay diyalogları `window.confirm` kullanıyor** (kirli form uyarısı,
  silme onayı). `ConfirmDialog` bileşeni var, ona geçilecek.

- **`EmployeeResponse` gereksiz `firmId` dönüyor.** İstemci zaten kendi
  firmasının verisini görüyor.

---

## Veritabanı / demo verisi

- **`mehmet.yilmaz` kullanıcısı artık üretilmiyor.** `users` tablosunda
  `employee_id` boş bir EMPLOYEE hesabı. `seedDemo` üretimi değil, eski
  bir testten kalmış. `/me/*` çağırırsa 400 alır. Demo öncesi
  temizlenmeli.

- **`ANAKAPI` lokasyonu geliştirme makinesinde elle taşındı.**
  Test amacıyla koordinat değiştirildi (`UPDATE locations`).
  Gerçek kurulumda tesis koordinatı girilmeli.

- **`1001` demo hesabının şifresi değiştirildi.** Telefonda ilk girişte
  `must_change_password` tetiklendi. `seed-demo` çalıştırılırsa
  `Demo1234`'e döner ve cihaz kaydı silinir, telefon yeniden
  eşleştirilmelidir.

---

## Bilerek kapsam dışı (MVP)

- **Terminal cihaz.** Patron QR/telefon çözümü istedi.
- **Sabit QR'ın güvenlik zayıflığı.** `PDKS:{firmId}:{locationCode}`
  biçiminde, TTL veya imza yok.
- **Yarım gün tatil (arife).** Tatil tam gün olarak modelleniyor.
- **Tekrar eden tatil kuralı.** Her tarih ayrı satır.
- **Çalışma grubuna özel tatil.** Tatil listesi firma geneli.
- **Çok şirket arayüzü.** Veri modeli hazır, `firmId` sabit gönderiliyor.
- **`DEVAM_EDIYOR` durumu.** Vardiyası süren personel bugün
  `EKSIK_CIKIS` görünüyor. Teknik olarak doğru ama yanıltıcı.
- **Backend `searchUsers` Türkçe normalleştirme yapmıyor**
  ("yilmaz" araması "Yılmaz"ı bulmaz). PostgreSQL `unaccent` eklentisi
  gerekiyor. Hiçbir ekran bu endpoint'i kullanmıyor, aramalar istemcide.

---

## Kapanmış maddeler (Faz 6'da çözüldü)

Kayıt amaçlı tutuluyor:

- `users.shift_id` kaldırıldı (V9)
- `FraudDetectionService` fail-open — servis tamamen silindi (V11 ile
  birlikte eski transaction katmanı)
- `location.ts` sabit Gebze koordinatı — kaldırıldı, konum alınamazsa
  okutma engelleniyor
- `gradle.properties` arm64-only — dört mimari eklendi
- `UserRepository.searchUsers` isim araması — geri getirildi
- `/admin/shifts-legacy` — böyle bir endpoint hiç yokmuş, devir notu
  hatalıydı
- `FROZEN_COORDINATE` kuralı — yanlış pozitif ürettiği için kaldırıldı