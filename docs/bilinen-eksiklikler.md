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