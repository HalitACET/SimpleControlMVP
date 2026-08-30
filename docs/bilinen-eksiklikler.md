# Bilinen Eksikler

## Faz 5'e ertelendi
- `UserRepository.searchUsers` artık isimle arama yapmıyor.
  users/employees ayrımında `u.fullName` koşulu kaldırıldı, yerine
  `u.employee.firstName/lastName` koşulu yazılmadı. Kullanıcı yönetimi
  ekranı yazılırken düzeltilecek.

## Faz 2'ye ertelendi
- `users.shift_id` hâlâ duruyor. Yeni modelde vardiya ataması
  work_groups üzerinden yapılacak, bu kolon o zaman kaldırılacak.

## Faz 6 için not (mobil taşıma)
- `LoginResponse.fullName` artık `users` tablosundan değil,
  bağlı `employees` kaydından hesaplanıyor. Personel kaydı olmayan
  kullanıcıda `username` dönüyor.
- 1. projedeki 3 değerlendirme bulgusu bu repoda hâlâ açık:
  FraudDetectionService fail-open, location.ts Gebze fallback,
  gradle.properties arm64-only.


  # Bilinen Eksikler

Bu dosya, bilerek ertelenen veya kapsam dışı bırakılan konuları tutar.
Fark edilmemiş eksikler değil, verilmiş kararlardır.

## Deployment öncesi zorunlu

- **CORS fazla açık.** `allowedOriginPatterns` şu an `*` ve
  `allowCredentials=true`. Yani herhangi bir origin kimlik bilgisiyle
  istek atabilir. AWS'ye çıkmadan önce gerçek origin listesiyle
  değiştirilecek. (`SecurityConfig.java`, 78-90)

## Faz 4 öncesi gözden geçirilecek

- **Tarih ve saat dilimi tutarlılığı.** `new Date('YYYY-MM-DD')` UTC
  olarak yorumlanıyor. Türkiye (UTC+3) için şu an sorun çıkarmıyor ama
  gece vardiyası gün ataması ve rapor sınırları yazılırken tarih/saat
  kütüphanesi ve saat dilimi kuralı netleştirilecek.
- **JPQL'de `YEAR()` kullanımı.** `HolidayRepository`'de yıl filtresi
  `YEAR(h.holidayDate)` ile yapılıyor. Tatil tablosu küçük olduğu için
  sorun değil, ama `raw_scans` üzerinde tarih filtresi yazarken aralık
  karşılaştırması (`>=` / `<`) kullanılacak — fonksiyon çağrısı index
  kullanımını engeller.

## Faz 5'e ertelendi (kimlik doğrulama ve kullanıcı yönetimi)

- **`UserRepository.searchUsers` isimle arama yapmıyor.** users/employees
  ayrımında `u.fullName` koşulu kaldırıldı, yerine
  `u.employee.firstName/lastName` koşulu yazılmadı. Kullanıcı yönetimi
  ekranı yazılırken düzeltilecek.
- **Web `mustChangePassword` bayrağını yok sayıyor.** Mobil uygulama
  saygı gösteriyor, web göstermiyor. Şifre değiştirme ekranı yazılacak.
- **Token `localStorage`'da tutuluyor** — XSS'e açık. Kalıcı çözüm
  httpOnly cookie + CSRF koruması.
- **Axios 401 interceptor'ı tam sayfa yenileme yapıyor.**
  `window.location.href` yerine React Router yönlendirmesi kullanılacak.
  (`src/api/axios.ts`)
- **`EmployeeResponse` gereksiz `firmId` dönüyor.** İstemci zaten kendi
  firmasının verisini görüyor. Yanıt DTO'ları gözden geçirilirken
  çıkarılacak.

## Faz 6'da temizlenecek — paralel kurulum

1. projeden gelen ve mobil uygulamanın kullandığı kod, yeni modelin
yanında yaşamaya devam ediyor. Mobil yeni backend'e taşındığında
topluca silinecek.

- **`users.shift_id` ve ona bağlı kod:** `TimesheetService`,
  `TransactionService`, `AdminService.assignShiftToUser`, `DataSeeder`.
  Yeni model `employees.work_group_id` üzerinden çalışıyor.
- **`/admin/shifts-legacy` endpoint'leri.** Eski vardiya endpoint'leri
  bu yola taşındı, yeni `ShiftController` `/admin/shifts` yolunu aldı.
  Şu an hiçbir istemci kullanmıyor.
- **`LoginResponse.fullName` kaynağı değişti.** Artık `users`
  tablosundan değil, bağlı `employees` kaydından hesaplanıyor. Personel
  kaydı olmayan kullanıcıda `username` dönüyor. Mobil taşınırken
  kontrol edilecek.

### 1. projeden gelen, kapatılmamış değerlendirme bulguları

Mobil koda geçmeden önce kapatılacak:

- `FraudDetectionService` fail-open çalışıyor — beklenmeyen hatada
  işlemi geçiriyor, reddetmeli.
- `location.ts` içinde sabit kodlanmış Gebze koordinatı fallback'i var.
- `gradle.properties` sadece `arm64-v8a` içeriyor, 32-bit cihazlarda
  kurulamıyor.

## Bilerek kapsam dışı (MVP)

- **Yarım gün tatil (arife).** Türkiye'de bayram arifesi öğleden sonra
  tatil ve gerçek bir ihtiyaç. Tatil şu an tam gün olarak modelleniyor;
  yarım gün eklemek tatil tablosuna saat alanı ve hesaplama servisine
  ayrı bir dal demek.
- **Tekrar eden tatil kuralı.** "Her yıl 1 Ocak" gibi kural yok, her
  tarih ayrı satır. Dini bayramlar zaten her yıl kaydığı için kuralın
  faydası sınırlı.
- **Çalışma grubuna özel tatil.** Tatil listesi firma geneli, tüm
  çalışma gruplarını eziyor.
- **Çok şirket desteği.** Veri modeli ve `firmId` izolasyonu hazır,
  arayüzde firma seçimi yok — web'de sabit değer gönderiliyor.