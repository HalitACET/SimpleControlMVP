# Keşif Raporu

### 1. Modül envanteri

- `pdks-backend/`
  - `src/`
  - `target/`
  - `.mvn/`
- `simple-control-web/`
  - `src/`
  - `public/`
- `PdksMobile/`
  - `src/`
  - `android/`
  - `ios/`
  - `__tests__/`
  - `.bundle/`

**Sürüm Bilgileri:**
- **Backend (pdks-backend/pom.xml):**
  - Spring Boot: 4.1.0 (Satır 8)
  - Java: 17 (Satır 30)
  - Bağımlılıklar: `org.springframework.boot:spring-boot-starter-data-jpa`, `org.springframework.boot:spring-boot-starter-security`, `org.springframework.boot:spring-boot-starter-validation`, `org.springframework.boot:spring-boot-starter-webmvc`, `org.postgresql:postgresql`, `org.springframework.boot:spring-boot-starter-flyway`, `org.flywaydb:flyway-database-postgresql`, `org.projectlombok:lombok`, `io.jsonwebtoken:jjwt-api:0.12.5`, `io.jsonwebtoken:jjwt-impl:0.12.5`, `io.jsonwebtoken:jjwt-jackson:0.12.5` (Satır 33-89)
- **Web (simple-control-web/package.json):**
  - React: ^19.2.8 (Satır 15)
  - Vite: ^8.2.2 (Satır 31)
  - TypeScript: ~6.0.2 (Satır 29)
  - react-router-dom: ^7.18.2 (Satır 17), axios: ^1.20.0 (Satır 13), lucide-react: ^1.34.0 (Satır 14)
- **Mobil (PdksMobile/package.json):**
  - React Native: 0.86.0 (Satır 22)
  - React: 19.2.3 (Satır 21)
  - Bağımlılıklar: `@react-native-async-storage/async-storage: ^3.1.1` (Satır 13), `axios: ^1.18.1` (Satır 19), `react-native-device-info: ^15.0.2` (Satır 23), `react-native-geolocation-service: ^5.3.1` (Satır 24), vs.

### 2. Backend — endpoint haritası

| HTTP | Yol | Controller#metod | Yetki anotasyonu | İstek DTO | Yanıt DTO |
|---|---|---|---|---|---|
| POST | /auth/login | AuthController#login | yok | LoginRequest | LoginResponse |
| POST | /auth/change-password | AuthController#changePassword | yok | ChangePasswordRequest | Void |
| POST | /scans | ScanController#logScan | yok | ScanRequest | ScanResponse |
| POST | /scans/batch | ScanController#syncScans | yok | List<ScanRequest> | List<BatchScanResult> |
| GET | /scans/next-action | ScanController#getNextAction | yok | yok | String |
| GET | /transaction/next-action | TransactionController#getNextAction | yok | yok | NextActionResponse |
| POST | /transaction/log | TransactionController#logTransaction | yok | TransactionLogRequest | TransactionLogResponse |
| GET | /transaction/history | TransactionController#getHistory | yok | yok | Page<TransactionHistoryItem> |
| POST | /transaction/sync | TransactionController#syncTransactions | yok | List<TransactionLogRequest> | List<SyncResultResponse> |
| GET | /admin/reports/daily | AdminReportController#getDailyReport | yok | yok | List<DailyReportResponse> |
| GET | /admin/reports/monthly | AdminReportController#getMonthlyReport | yok | yok | List<MonthlyReportResponse> |
| GET | /admin/reports/monthly/by-department | AdminReportController#getMonthlyReportByDepartment | yok | yok | List<DepartmentMonthlySummaryResponse> |
| GET | /admin/reports/monthly/detail | AdminReportController#getMonthlyReportDetail | yok | yok | List<DailyReportResponse> |
| POST | /admin/scans/manual | AdminScanController#createManualScan | yok | ManualScanRequest | AdminScanResponse |
| PUT | /admin/scans/{id}/exclude | AdminScanController#excludeScan | yok | ExcludeScanRequest | AdminScanResponse |
| PUT | /admin/scans/{id}/include | AdminScanController#includeScan | yok | yok | AdminScanResponse |
| GET | /admin/scans | AdminScanController#getScans | yok | yok | List<AdminScanResponse> |
| GET | /admin/employees | EmployeeController#list | yok | yok | List<EmployeeResponse> |
| GET | /admin/employees/{id} | EmployeeController#getOne | yok | yok | EmployeeResponse |
| POST | /admin/employees | EmployeeController#create | yok | EmployeeRequest | EmployeeResponse |
| PUT | /admin/employees/{id} | EmployeeController#update | yok | EmployeeRequest | EmployeeResponse |
| DELETE | /admin/employees/{id} | EmployeeController#deactivate | yok | yok | Void |
| POST | /admin/departments | DepartmentController#createDepartment | yok | DepartmentRequest | DepartmentResponse |
| PUT | /admin/departments/{id} | DepartmentController#updateDepartment | yok | DepartmentRequest | DepartmentResponse |
| GET | /admin/departments | DepartmentController#getActiveDepartments | yok | yok | List<DepartmentResponse> |
| GET | /admin/departments/{id} | DepartmentController#getDepartment | yok | yok | DepartmentResponse |
| DELETE | /admin/departments/{id} | DepartmentController#deleteDepartment | yok | yok | Void |
| GET | /admin/departments/{id}/employees | DepartmentController#getDepartmentEmployees | yok | yok | List<DepartmentEmployeeResponse> |
| GET | /admin/shifts | ShiftController#list | yok | yok | List<ShiftResponse> |
| GET | /admin/shifts/{id} | ShiftController#getOne | yok | yok | ShiftResponse |
| POST | /admin/shifts | ShiftController#create | yok | ShiftRequest | ShiftResponse |
| PUT | /admin/shifts/{id} | ShiftController#update | yok | ShiftRequest | ShiftResponse |
| DELETE | /admin/shifts/{id} | ShiftController#delete | yok | yok | Void |
| GET | /admin/holidays | HolidayController#list | yok | yok | List<HolidayResponse> |
| GET | /admin/holidays/{id} | HolidayController#getOne | yok | yok | HolidayResponse |
| POST | /admin/holidays | HolidayController#create | yok | HolidayRequest | HolidayResponse |
| PUT | /admin/holidays/{id} | HolidayController#update | yok | HolidayRequest | HolidayResponse |
| DELETE | /admin/holidays/{id} | HolidayController#delete | yok | yok | Void |
| GET | /admin/work-groups | WorkGroupController#list | yok | yok | List<WorkGroupListResponse> |
| GET | /admin/work-groups/{id} | WorkGroupController#getOne | yok | yok | WorkGroupResponse |
| POST | /admin/work-groups | WorkGroupController#create | yok | WorkGroupRequest | WorkGroupResponse |
| PUT | /admin/work-groups/{id} | WorkGroupController#update | yok | WorkGroupRequest | WorkGroupResponse |
| DELETE | /admin/work-groups/{id} | WorkGroupController#delete | yok | yok | Void |
| GET | /admin/users-v2 | UserManagementController#listUsers | yok | yok | List<UserResponse> |
| POST | /admin/users-v2 | UserManagementController#createUser | yok | UserCreateRequest | UserResponse |
| PUT | /admin/users-v2/{id}/status | UserManagementController#updateStatus | yok | UserStatusUpdateRequest | UserResponse |
| PUT | /admin/users-v2/{id}/password | UserManagementController#resetPassword | yok | PasswordResetRequest | UserResponse |
| POST | /device/register | DeviceController#register | yok | DeviceRegisterRequest | Device |
| GET | /device/verify | DeviceController#verify | yok | yok | DeviceVerifyResponse |
| POST | /admin/device-unbind | DeviceController#unbind | @PreAuthorize("hasRole('ADMIN')") | DeviceUnbindRequest | Void |
| GET | /health | HealthController#health | yok | yok | Map |
| POST | /dev/simulate-scans | SimulatorController#simulateScans | yok | SimulationRequest | Map |
| DELETE | /dev/simulate-scans | SimulatorController#deleteSimulatedScans | yok | yok | Map |
| POST | /dev/seed-demo | DevController#seedDemo | yok | yok | Map |

**Özel Listeler:**
- `/admin/shifts-legacy` kelimesini içeren endpoint: **bulunamadı**.
- `transaction` kelimesini içeren yollar: `/transaction/next-action`, `/transaction/log`, `/transaction/history`, `/transaction/sync`.

### 3. Backend — veri katmanı

**Migration Dosyaları (`src/main/resources/db/migration/`):**
1. `V1__initial_schema.sql` - Temel tablo kurulumları (users, shifts, devices, locations, transactions, suspicious_attempts vb.).
2. `V2__split_users_and_employees.sql` - users tablosundan personel bilgisini employees tablosuna ayırır.
3. `V3__employees_partial_unique.sql` - employees tablosunda partial unique index ekler.
4. `V4__work_groups_and_holidays.sql` - work_groups, work_group_days ve holidays tablolarını oluşturur.
5. `V5__raw_scans.sql` - raw_scans tablosunu oluşturur (yeni mimari).
6. `V6__manual_scan_support.sql` - raw_scans'e created_by ekler ve lokasyonları null-able yapar.
7. `V7__holiday_created_at.sql` - holidays tablosuna created_at ekler.
8. `V8__departments.sql` - departments tablosunu oluşturur.
9. `V9__remove_legacy_tables.sql` - deleted_transaction_logs tablosunu ve users.shift_id bağlantısını siler.
10. `V10__scan_exclusion.sql` - raw_scans'e excluded vb. kolonlar ekler.

**Entity Sınıfları (seçilmişler):**
- `Department` (Tablo: departments, Alan: 6)
- `Device` (Tablo: devices, Alan: 6) [DOĞRULANMADI]
- `Employee` (Tablo: employees, Alan: 9)
- `Holiday` (Tablo: holidays, Alan: 4) [DOĞRULANMADI]
- `Location` (Tablo: locations, Alan: 8) [DOĞRULANMADI]
- `RawScan` (Tablo: raw_scans, Alan: 16)
- `Shift` (Tablo: shifts, Alan: 9)
- `SuspiciousAttempt` (Tablo: suspicious_attempts, Alan: 7)
- `TransactionRecord` (Tablo: transactions, Alan: 13)
- `User` (Tablo: users, Alan: 9)
- `WorkGroup` (Tablo: work_groups, Alan: 7)
- `WorkGroupDay` (Tablo: work_group_days, Alan: 4) [DOĞRULANMADI]

**Entity/Migration Uyuşmazlığı:**
- Bulunamadı (Mevcut sınıflar kolon eklemeleri ve silmeleri ile uyumlu görünüyor).

**ddl-auto değerleri:**
- `application.properties`: `spring.jpa.hibernate.ddl-auto=validate`
- `application-example.properties`: `spring.jpa.hibernate.ddl-auto=update`

### 4. Web — sayfa ve veri akışı

**Router (App.tsx):**
- `/login` → `Login`
- `/employees` → `Employees`
- `/departments` → `Departments`
- `/departments/:id` → `DepartmentDetail`
- `/shifts` → `Shifts`
- `/work-groups` → `WorkGroups`
- `/holidays` → `Holidays`
- `/scans` → `Scans`
- `/users` → `UserAccounts`
- `/reports/daily` → `DailyReport`
- `/reports/monthly` → `MonthlyReport`
- `/reports/monthly/:employeeId` → `MonthlyReportDetail`
- `/styleguide` → `Styleguide`

**Sidebar Menüsünde Olan Ama Route'u Olmayanlar (Sidebar.tsx):**
- "Cihazlar" (`#cihazlar`)
- "Lokasyonlar" (`#lokasyonlar`)

**API Katmanı:**
- Dosya: `src/api/axios.ts`
- Axios instance üzerinden sarmalanmış katman. 
- Ham fetch/axios kullanımı: Sadece `src/utils/errorHandler.ts` içinde `axios.isAxiosError` kullanımı mevcut.

**Web'in Çağırdığı Backend Yolları:**
- Bütün string'ler `api.post(...)` vb. şeklinde kodlanmış (Örn: `/auth/login`, vb. [DOĞRULANMADI]).

**.env.example Değişkenleri:**
- `VITE_API_BASE_URL`
- `VITE_FIRM_ID`

**UI Bileşenleri (src/components/ui/):**
- `badge`, `confirm`, `drawer`, `form`, `searchinput`, `table`, `toast`.
- Hiç import edilmeyen bileşen var mı: Bulunamadı (doğrulanamadı).

**Satır içi style={{ kullanan dosyalar:**
- `src/pages/WorkGroups.tsx` (Satır: 95, 100, 103, 137, 138, 139, 140)
- `src/pages/UserAccounts.tsx` (Satır: 55, 57, 62, 86, 87, 88, 97, 110)
- `src/pages/Styleguide.tsx` (Satır: 62, 64, 65, 66, 68, 69, 70, 71, 77, 78, 79, 81, 82, 83, 84, 89, 90, 91, 93, 96, 105, vb.)

### 5. Mobil — mevcut taşıma durumu

**Servis Dosyaları:**
- `PdksMobile/src/services/api.ts`
- `PdksMobile/src/services/auth.ts`
- `PdksMobile/src/services/connectivity.ts`
- `PdksMobile/src/services/device.ts`
- `PdksMobile/src/services/location.ts`
- `PdksMobile/src/services/offlineQueue.ts`
- `PdksMobile/src/services/security.ts`

**Mobilin Çağırdığı Backend Yolları & Durumları:**
- `/auth/login` (api.ts:34) -> Backend'de var (AuthController)
- `/auth/change-password` (api.ts:69) -> Backend'de var (AuthController)
- `/transaction/next-action` (api.ts:148) -> Backend'de var (TransactionController)
- `/transaction/log` (api.ts:181) -> Backend'de var (TransactionController)
- `/transaction/history` (api.ts:229) -> Backend'de var (TransactionController)
- `/transaction/sync` (api.ts:251) -> Backend'de var (TransactionController)
- `/me/timesheet-summary` (api.ts:279) -> **Backend'de YOK** (MeController bulunamadı).

**Yeni Yollar (`/scans` vb.):**
- `/me/scans`, `/me/summary`, `/me/next-action` yolları çağrılıyor mu: **HAYIR**, kodda bu yollar kullanılmıyor; hâlâ `/transaction/*` ve `/me/timesheet-summary` (çalışmayan eski endpoint) kullanılıyor.

**Çevrimdışı Kuyruk:**
- Dosya: `PdksMobile/src/services/offlineQueue.ts`
- Alan yapısı (TransactionLogRequest): `type`, `timestamp`, `latitude`, `longitude`, `qrContent`, `method`, `deviceId`, `mockLocation`, `clientId`.

**config.ts:**
- İçerik (PdksMobile/src/config.ts):
  ```typescript
  export const API_BASE_URL = 'http://192.168.1.101:8080';
  ```

**Giriş Ekranı ve Butonlar:**
- "Firma Kodu" alanı: VAR (`PdksMobile/src/screens/LoginScreen.tsx:146,154`)
- Giriş/Çıkış tip seçimi butonu: VAR (`PdksMobile/src/screens/ConfirmTransactionScreen.tsx:255` - "Çıkış Yapmak İstiyorum / Giriş Yapmak İstiyorum")

**Sabit Kodlanmış Koordinat:**
- `PdksMobile/src/services/location.ts:94` (`latitude: 40.8023, longitude: 29.4398`)

**android/gradle.properties (satır):**
- `reactNativeArchitectures=arm64-v8a` (`PdksMobile/android/gradle.properties:28`)

### 6. Ölü kod ve eski yapı çapraz kontrolü

- `TransactionController`, `TransactionService`, `FraudDetectionService`: **Hâlâ projede VAR**. (Örn: `TransactionService.java:34` satırında `FraudDetectionService`'e referans veriyor).
- `ScanValidationService`: **Hâlâ projede VAR**. (`ScanService.java:37,122` satırlarında referans ediliyor).
- `transactions` ve `suspicious_attempts` tablolarına yazan/okuyan sorgular: **VAR**. (`TransactionRecordRepository.java` ve `SuspiciousAttemptRepository.java` aktif ve kullanılıyor).
- `AdminController`, `AdminService`, `TimesheetService`, `MeController`: **Projeden tamamen SİLİNMİŞTİR** (bulunamadı).
- CORS yapılandırması:
  - Dosya: `src/main/java/com/pdks/backend/config/SecurityConfig.java` (Satır 82)
  - `configuration.setAllowedOriginPatterns(List.of("*"));`

### 7. Git durumu

**`git status --short`**
```
 M PdksMobile/src/config.ts
 M simple-control-web/src/pages/Login.tsx
?? simple-control-web/src/pages/Login.module.css
```
_Commit edilmemiş değişiklikler Web ve Mobil yapılandırmasında mevcuttur._

**`git log --oneline -15`**
```
162508e feat(scan): add scan exclusion with audit trail
1340930 refactor(db): drop legacy tables and users.shift_id column
407b2f4 refactor: remove legacy admin controller, service and timesheet layer
369dc2b fix: restore user name search, remove redundant firmId, use router navigation
611cf46 feat(report): add department filters, future-day handling and demo seed
f5690cf chore(web): remove unused React imports
72db945 feat(web): add user account management screen
d273533 feat(user): add employee account management endpoints
000ffd9 feat(web): add monthly report, scan records screen and shared drawer component
3283878 feat(web): add daily attendance report screen
8267869 feat(report): add monthly attendance summary and detail endpoints
032d13e fix(time): pin server timezone and unify createdAt handling
cde3339 feat(dev): add scan simulator for development data generation
6466659 feat(scan): add manual scan entry and admin scan listing
2a4b870 feat(scan): add raw scan endpoint with non-blocking fraud detection
```

**`git tag --list`**
```
faz-1
faz-2
faz-3
faz-4
faz-5
```

**`git diff --stat HEAD`**
```
 PdksMobile/src/config.ts               |  2 +-
 simple-control-web/src/pages/Login.tsx | 67 ++++++++++++++++++++++++++--------
 2 files changed, 52 insertions(+), 17 deletions(-)
```

### 8. Belirsizlikler

- Mobil uygulama hâlâ `/me/timesheet-summary` endpoint'ini çağırmaktadır ancak bu backend'den (MeController ile birlikte) silinmiş. Mobil şu an kırık durumda olabilir.
- Aynı şekilde mobil uygulama `/transaction/*` yolunu kullanmaya devam ediyor ancak backend tarafında yeni mimari olarak `/scans` yolunda `ScanController` eklenmiş. İkisi de paralel açık, bu bir taşıma (migration) sürecinin ortasında kalındığını gösteriyor. Mobil yeni API'lere geçirilmemiş.
- Web tarafında kullanılmayan UI bileşeni taraması dinamik import vb. nedenlerle tam olarak doğrulanamadı.
- `simple-control-web/src/pages/Login.tsx` üzerinde bekleyen değişiklikler var (git diff: +67, -17) ve amacı anlaşılamadı.
