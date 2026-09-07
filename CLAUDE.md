# Simple Control — Proje Kuralları

Bu dosya, projede çalışan her AI agent'ın uyması gereken kuralları içerir.
Her oturumda okunur. Kurallara aykırı bir şey yapman gerekiyorsa önce sor.

---

## Ben kimim

Halit ACET. Fırat Üniversitesi Yazılım Mühendisliği 3. sınıf, Bursa.
Simple Software'de zorunlu staj (ikinci dönem projesi).

**Çalışma tarzım:** Mimari kararları ben veriyorum, kodu sen yazıyorsun,
her adımı ben test ediyorum.

**Tercihlerim:**
- Türkçe, samimi konuşma
- Küçük odaklı adımlar, dev çözüm yığınları değil
- Direkt geri bildirim, yağcılık değil
- Her adım kanıtla kapanır — "çalışıyor galiba" yetmez

---

## Proje

Personel devam kontrol sistemi (PDKS). Personel telefonuyla QR veya GPS
okutarak giriş-çıkış yapıyor; İK web panelinden takip ediyor.

**Repo:** github.com/HalitACET/SimpleControlMVP

SimpleControlMVP/
├── PdksMobile/ React Native 0.86
├── pdks-backend/ Spring Boot 4.1, Java 17, PostgreSQL 17, Flyway
├── simple-control-web/ Vite + React 19 + TypeScript
└── docs/

**DİKKAT:** Spring Boot **4.1.0** kullanılıyor, 3.x değil. İnternetteki
içeriğin çoğu 3.x için yazılmış, körü körüne uygulama.

---

## Mimari kararlar — DEĞİŞTİRME

Bunlar tartışılıp verilmiş kararlar. Aksini önerme, gerekçesiz değiştirme.

### Veritabanında yalnızca ham okutma saklanır
Giriş/çıkış eşleştirmesi, vardiya ataması, geç kalma hesabı SAKLANMAZ —
rapor sorgusunda anlık hesaplanır.
**Sebep:** vardiya veya tolerans değişince geçmiş dönem kendiliğinden
doğru hesaplanır.

### Okutma tip taşımaz
Yeni modelde okutma kaydında "giriş/çıkış" alanı YOK. Sistem günün ilk
okutmasını giriş, sonuncusunu çıkış sayar. İstemcide bu kuralı
KOPYALAMA — hesap backend'in işi.

### Hesaplanabilen şey saklanmaz
Gece vardiyası `endTime <= startTime` ise türetilir, ayrı kolon yok.

### Tolerans dakika cinsinden
Mutlak saat değil. Mutlak saat gece yarısını geçen vardiyalarda gün
bilgisi taşımadığı için bozuluyor.

### Zaman yönetimi: yerel saat
Tüm zamanlar Europe/Istanbul. İstemciler yerel saat gönderir, sunucu
dönüşüm yapmaz, DB `WITHOUT TIME ZONE` saklar. **UTC'ye çevirme YOK.**

`toISOString()` UTC'ye çevirir — tarih üretiminde KULLANMA.
Yerel tarih için:
```typescript
const getLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
```

### Soft delete
Personel, lokasyon, departman, vardiya silinmez — `active = false` olur.
Unique constraint'ler **partial index** olmalı (`WHERE active = true`),
yoksa silinen kaydın kodu tekrar kullanılamaz.

### Firma izolasyonu
`firmId` HER ZAMAN JWT'den alınır, istek gövdesinden ASLA kabul edilmez.
Çok şirket arayüzü kapsam dışı ama veri modeli çok şirketli.

### Tek durum modeli
Personel aktifse çalışıyor ve mobilden girebilir. Pasifse ikisi de yok.
Personel durumu değişince bağlı `users` kaydı da aynı olur.

---

## Hesaplama kuralları

- Tatil listesi çalışma grubunu ezer
- Günün ilk okutması giriş, son okutması çıkış; aradakiler yok sayılır
- 1 dakika içindeki tekrar okutmalar hesapta yok sayılır (kayıt silinmez)
- `suspicious` ve `excluded` okutmalar hesaba DAHİL EDİLMEZ, sayıları
  ayrıca raporlanır
- Tek okutma = `EKSIK_CIKIS`, hiç okutma = `DEVAMSIZ`
- Bugünden sonraki günler = `GELECEK` (hesaba girmez)
- Tolerans aşılırsa **tam süre** yazılır, tolerans düşülmez
- Vardiya günü: gece vardiyasında pencere hesaplanır (başlangıç −2 saat,
  bitiş +2 saat), çakışmada pencere **ortasına** en yakın gün seçilir

---

## Web (simple-control-web)

### Stil
- **CSS Modules.** Satır içi `style={{}}` KULLANILMAZ.
- Renkler, boşluklar, yazı tipleri `src/styles/tokens.css`
  değişkenlerinden. Elle hex yazma.
- `/styleguide` sayfası canlı referans — o dosyada satır içi stil
  kasıtlıdır, DOKUNMA.

### Ortak bileşenler (`src/components/ui/`)
`Badge`, `Drawer`, `ConfirmDialog`, `Toast`, `SearchInput`, `FormField`,
`FormSelect`, `Table.module.css`

**Kendi versiyonunu yazma.** Ortak bileşen varken yeniden yazma refleksi
bu projede defalarca yakalandı.

### Kalıplar
- Liste ekranı → satıra tıkla → sağdan kayan drawer'da detay/form
- Harita gibi geniş alan gerektiren form → modal
- `window.confirm` KULLANILMAZ → `ConfirmDialog`
- API çağrıları `src/api/axios.ts` üzerinden, ham `fetch`/`axios` yok
- Hata mesajları backend'in `message` alanından, Toast ile

### Tipler
API yanıtlarını `any` ile map'leme. Gerçek tip tanımla.
`any` yüzünden en az iki hata gözden kaçtı.

---

## Mobil (PdksMobile)

- Servisler: `src/services/` (api, auth, connectivity, device, location,
  offlineQueue, security)
- Tipler: `src/types/api.ts`
- Backend IP `src/config.ts`'te sabit, ağ değişince elle güncellenir
- Çevrimdışı kuyruk çalışıyor ve test edilmiş — iç mantığına dokunma
- Konum alınamazsa okutma YAPILMAZ. Önbellekteki konum fallback'i
  bilinçli olarak kaldırıldı (geofence atlatılabiliyordu).

---

## Backend (pdks-backend)

- Controller ince olur, iş mantığı serviste
- Token çözme ve firmId elde etme SERVİSTE yapılır
- Doğrulama: `ResponseStatusException` + Türkçe mesaj (Türkçe karakter
  KULLANMA mesajlarda: "bulunamadi", "olamaz")
- Migration'lar `src/main/resources/db/migration/`, sıradaki numara
  mevcut en yüksekten sonraki
- `spring.jpa.hibernate.ddl-auto=validate` — şema değişikliği SADECE
  migration ile

---

## Agent'la çalışırken öğrenilen dersler

Bu projede tekrar tekrar karşılaşılan kalıplar. Kendine uygula:

1. **Gerekçen doğrulanmış bir teşhis değildir.** Bu projede beş kez
   inandırıcı ama yanlış gerekçe üretildi (Spring Boot sürümü,
   `@UniqueConstraint` çökmesi, "kasten tasarlandı", "connection pool
   tükendi", "istemci farklı gönderiyor olmalı"). Sonuç doğru çıksa bile
   nedeni yanlış olabilir. **Kodu okumadan teşhis koyma.**

2. **Kapsam sessizce büyür.** "veya", "ayrıca", "bunun yanında" gibi
   ifadeler yazıyorsan dur. İstenmeyen eklemeler: `holidayWorkDays`'e
   `GRUP_ATANMAMIS`, `/shifts-legacy` yol değişikliği, 5 dosyada
   `import React` temizliği.

3. **"Derleme hatalarını düzelt" dendiğinde en kolay düzeltme silmektir.**
   `UserRepository.searchUsers`'daki isim arama koşulu böyle kaybolmuştu.
   Hatayı `as` cast'i veya `any` ile SUSTURMA — gerçek bir uyuşmazlığı
   gösteriyor olabilir.

4. **Ortak bileşen varken kendi versiyonunu yazma.** Rozet, tablo,
   drawer, buton stilleri — dördü de ayrı ayrı yakalandı.

5. **Hata ayıklarken veri değiştirme.** "Hiçbir veriyi değiştirme,
   hiçbir şifre sıfırlama. Sadece oku ve raporla." (Bir kez `admin`
   şifresi habersiz değiştirildi.)

6. **Bir mesajda bir iş.** İki iş birden verilirse ikincisi atlanıyor.

7. **"Tamamlandı" demeden önce kanıtla.** Sidebar solukluğu, drawer
   taşması, duplicate key hatası, çelişkili metin — hepsi ekran
   görüntüsünde yakalandı, rapor "tamamlandı" diyordu.

8. **Kod değişikliği ≠ çalışan sistem.** `mvn clean compile` başarılı
   olması hiçbir şey kanıtlamaz. Backend yeniden başlatılmadıysa eski
   sınıflar bellekte. Migration uygulanmadıysa şema eski.

---

## Çalışma protokolü

1. Beyin fırtınası → kararlar → kod → ben test ederim → sonucu getiririm
2. Her adım sonunda commit
3. Faz sonunda tag (`git tag -a faz-N`)
4. **Prompt kuralı:** her adımda SADECE istenen şeyi yap, fazladan
   özellik ekleme
5. Kod isimlendirmesi İngilizce, açıklama satırları Türkçe olabilir

### Salt okuma görevleri
"SALT OKUMA" dendiğinde: hiçbir dosyayı değiştirme, veritabanına yazma,
bulduğun hatayı düzeltme. Sadece raporla. Emin olmadığına
`[DOĞRULANMADI]` yaz.

---

## Çalıştırma

Detay: `docs/calistirma.md`

```powershell
# Backend
cd pdks-backend
.\mvnw.cmd spring-boot:run
# Kontrol: http://localhost:8080/health

# Web
cd simple-control-web
npm run dev              # localhost:5173

# Mobil
cd PdksMobile
npx react-native run-android

# Veritabanı
$psql = "D:\PostreSQL\pgAdmin 4\runtime\psql.exe"
$env:PGPASSWORD = "12345"
& $psql -U postgres -d simplecontrol -c "\dt"
```

**Demo hesapları:** `admin` / `Admin1234` (web),
`1001`–`1005` / `Demo1234` (mobil), firma kodu `ATLAS01`

`dev/seed-demo` idempotent ama **cihaz kayıtlarını da siler** —
telefon yeniden eşleşmeli. `admin` ve `locations` etkilenmez.

---

## Bilinen eksikler

Tam liste: `docs/bilinen-eksikler.md`

Bu dosyadaki maddeler **bilinçli kararlardır**, fark edilmemiş hatalar
değil. Kendi başına düzeltmeye kalkma.

### Deployment öncesi zorunlu
- CORS `allowedOriginPatterns("*")` + `allowCredentials(true)`
- `application-example.properties` güncel değil
- Token `localStorage`'da

### Bilinçli teknik borç
- `getUserFromToken` beş serviste kopyalanmış — çalışıyor, dokunma
- Gün içi ara çıkışlar hesaba katılmıyor (ilk/son okutma modeli)

---

## Deployment (Faz 7)

- **Backend + PostgreSQL:** Railway (GitHub bağlantısı, Dockerfile yok)
- **Web (İK paneli):** Vercel
- **Tanıtım sitesi:** Vercel (ayrı proje)
- **Mobil:** Release APK, elden dağıtım

AWS (RDS + ECR + ECS) planı iptal edildi — staj süresi ve maliyet
gerekçesiyle. Railway + Vercel aynı sonucu ücretsiz veriyor,
HTTPS dahil.

Mobil düz HTTP'ye bağlanamaz (Android 9+), bu yüzden HTTPS zorunlu.

## Geliştirme ortamı

- Masaüstü PC, Windows, **8 GB RAM** — bellek sınırlı
- Aynı anda backend + web + Metro + IDE çalıştırma, sistem kilitleniyor
- PostgreSQL `D:\PostreSQL` (klasör adında yazım hatası var, önemsiz)
- Kurulumda locale `C` seçilmeli — Türkçe locale `initdb`'yi patlatıyor
- Maven PATH'te değil, `mvnw.cmd` kullanılıyor