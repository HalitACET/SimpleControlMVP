# Çalıştırma

Geliştirme ortamı: Masaüstü PC, Windows, PowerShell.
Repo: `D:\Projelerim\SimpleControlMVP`

---

## Ön koşullar

- Java 17
- Node.js
- PostgreSQL 17 — kurulum yolu: `D:\PostreSQL` (klasör adındaki yazım
  hatası kasıtlı değil, çalışmayı etkilemiyor)
- Android Studio (mobil için)
- Maven PATH'te değil, wrapper kullanılıyor (`mvnw.cmd`)

**PostgreSQL kurulumunda locale `C` seçilmeli** — Türkçe locale
`initdb`'yi patlatıyor.

---

## Git'e girmeyen ama gereken dosyalar

- `pdks-backend/src/main/resources/application.properties`
  → `application-example.properties`'ten üretilir
  (dikkat: example dosyası güncel değil, `ddl-auto=validate` olmalı)
- `simple-control-web/.env` → `.env.example`'dan üretilir
- `PdksMobile/android/local.properties` → Android Studio üretir

---

## Backend

```powershell
cd D:\Projelerim\SimpleControlMVP\pdks-backend
.\mvnw.cmd spring-boot:run
```

Ayakta mı kontrolü: `http://localhost:8080/health` → `{"status":"UP"}`

Flyway migration'ları uygulama açılışında çalışır. Yeni migration
eklendiyse backend'i yeniden başlatmak gerekir.

---

## Web

```powershell
cd D:\Projelerim\SimpleControlMVP\simple-control-web
npm run dev
```

→ `http://localhost:5173`

---

## Mobil

Telefon USB ile bağlı, geliştirici seçenekleri ve USB hata ayıklama açık.

```powershell
cd D:\Projelerim\SimpleControlMVP\PdksMobile
$env:Path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
adb devices
npx react-native run-android
```

`adb devices` çıktısında cihaz `unauthorized` görünüyorsa: telefondaki
izin kutusunu onayla. Kutu çıkmıyorsa:

```powershell
adb kill-server
adb start-server
adb devices
```

Hâlâ olmuyorsa telefonda Geliştirici Seçenekleri → "USB hata ayıklama
yetkilerini iptal et" → kabloyu çıkar tak.

**8081 portu doluysa:** eski bir Metro süreci kalmıştır.
`taskkill /F /IM node.exe` sonra tekrar dene.

Backend IP'si `PdksMobile/src/config.ts` içinde sabit
(`http://192.168.1.101:8080`). Ağ değişirse elle güncellenir.

### DevTools (mobil konsol)

Uygulama açıkken telefonu salla → "Open DevTools".
Alternatif: `adb shell input keyevent 82`, veya Metro penceresinde `j`.

Metro ayrı çalıştırılacaksa:
```powershell
npx react-native start
```

---

## Veritabanı

```powershell
$psql = "D:\PostreSQL\pgAdmin 4\runtime\psql.exe"
$env:PGPASSWORD = "12345"
& $psql -U postgres -d simplecontrol -c "\dt"
```

Sık kullanılan sorgular:

```powershell
# Migration durumu
& $psql -U postgres -d simplecontrol -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"

# Bir personelin bugünkü okutmaları
& $psql -U postgres -d simplecontrol -c "SELECT id, scanned_at, location_id, suspicious, suspicious_reason FROM raw_scans WHERE employee_id = 17 AND scanned_at::date = CURRENT_DATE ORDER BY id DESC;"
```

---

## Demo verisi

```powershell
$ab = @{ firmId="ATLAS01"; username="admin"; password="Admin1234"; deviceId="TEST-PC" } | ConvertTo-Json
$al = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post `
  -ContentType "application/json; charset=utf-8" -Body $ab
$ah = @{ Authorization = "Bearer $($al.token)" }
Invoke-RestMethod -Uri "http://localhost:8080/dev/seed-demo" -Method Post -Headers $ah | ConvertTo-Json
```

`seed-demo` idempotent: önce siler, sonra yeniden oluşturur.

**Sildikleri:** tüm personel, kullanıcı (admin hariç), okutma, vardiya,
çalışma grubu, departman, tatil ve **personel cihaz kayıtları**.
Çalıştırdıktan sonra telefonun yeniden eşleşmesi gerekir.

**Dokunmadıkları:** `admin` hesabı, `locations` tablosu.

Personel id'leri her seferinde değişir — sabit id kullanma, kart
numarasından bul.

---

## Demo hesapları

| Kullanıcı | Şifre | Nerede |
|---|---|---|
| `admin` | `Admin1234` | Web |
| `1001`–`1005` | `Demo1234` | Mobil |

Firma kodu: `ATLAS01`

**Not:** `1001` hesabının şifresi geliştirme telefonunda `Halit12345`
olarak değiştirildi (ilk girişte `must_change_password` tetiklendi).
`seed-demo` çalıştırılırsa `Demo1234`'e döner.