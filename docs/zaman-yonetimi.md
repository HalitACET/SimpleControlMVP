# Simple Control - Zaman Yönetimi Politikası

Bu belgede sistemin zaman ve saat dilimi yönetimi kuralları açıklanmaktadır. Sistem saatlerle ilgili yaşanabilecek kayma ve dönüşüm problemlerini (timezone shift) önlemek için kesin kurallara bağlanmıştır.

## 1. Temel Kural: Sadece Yerel Saat (Europe/Istanbul)
Simple Control sisteminde (sunucu, veritabanı, mobil uygulama, web arayüzü) **tüm zamanlar yerel saat (Europe/Istanbul) olarak üretilir, taşınır ve saklanır.**
* **UTC Dönüşümü Yoktur:** Sistem hiçbir aşamada saatleri UTC'ye çevirmez, UTC saklamaz.
* **Saat Dilimi İşaretçisi (Z / Offset) Yoktur:** Sunucu ve istemci arasındaki iletişimde JSON alanlarında `Z` veya `+03:00` gibi saat dilimi bildirimleri bulunmaz. Tüm tarihler saf `YYYY-MM-DDTHH:mm:ss` (LocalDateTime) olarak aktarılır.

## 2. Katmanların Sorumlulukları

### Veritabanı (PostgreSQL)
Tüm tarih/saat kolonları `TIMESTAMP WITHOUT TIME ZONE` tipindedir. Bu, veritabanının kendine gelen saati saat dilimi ayarlaması yapmadan, tam olarak geldiği rakamlarla (ör. `2026-08-30 10:12:00`) kaydettiği anlamına gelir. Sunucu veritabanı da `Europe/Istanbul` saatine ayarlıdır.

### Backend (Spring Boot)
Projede sadece Java 8'in `LocalDateTime`, `LocalDate` ve `LocalTime` sınıfları kullanılmaktadır. `Instant`, `ZonedDateTime` veya `OffsetDateTime` **kullanılmamaktadır**.
Uygulama ayağa kalkarken (`PdksBackendApplication` içindeki `@PostConstruct` aracılığıyla ve `application.properties` üzerinden) JVM saat dilimi zorla `Europe/Istanbul` olarak sabitlenir. Bu sayede AWS veya konteyner ortamları sunucuyu UTC olarak başlatsa bile, uygulama içi `LocalDateTime.now()` daima Türkiye saatini üretir.

Oluşturulma zamanları (`createdAt`) servis katmanlarında unutulmaması ve standartlaşması adına entity'lerin içinde (`@PrePersist` kullanılarak) otomatik atanmaktadır.

### Mobil Uygulama (İstemci)
Mobil cihaz kendi saatini (`new Date()`) okuduğunda normalde `toISOString()` fonksiyonu tarihi UTC'ye çevirip sonuna "Z" ekler (ör. `2026-08-30T07:12:00Z`). Ancak backend `LocalDateTime` kullandığı için Jackson bu "Z" ekini göz ardı ederek sayıyı yerel saat gibi okur; bu da 3 saatlik bir hataya neden olur.
Bu hatanın önüne geçmek için mobil uygulamada `toLocalISOString` isimli özel bir yardımcı fonksiyon kullanılmıştır. Bu fonksiyon cihazın yerel saat rakamlarını okuyup manuel olarak formatlayarak sonuna "Z" koymadan gönderir. Böylece backend tam olarak cihazın o anki ekranında görünen yerel saati alır.

### Web Uygulaması (İstemci)
Web tarafında, backend'den gelen tarih formatları doğrudan string operasyonlarıyla (ör. `split('-')`) parçalanarak ekrana basılmaktadır. JavaScript'in yerleşik `Date` objesiyle parse edilmediği için, tarayıcının saat dilimine göre otomatik yapılan hatalı kaydırmalardan kaçınılır. Formlardan girilen tarihler de (örn: Tatil ekleme) sadece `YYYY-MM-DD` stringi olarak yollanır.

## 3. Bu Kurallar Değiştirilirse Neler Bozulur?
* Sisteme aniden `@JsonFormat` veya `Jackson` timezone yapılandırması (UTC offset ayarı) eklenirse; istemciler yerel saat formatında veri yolladıkları için, backend bunları UTC olarak algılayıp üzerine tekrar +3 saat ekleyerek veritabanına kaydedecektir.
* Mobil uygulama `toLocalISOString` yerine kazara `toISOString()` (Z işaretli) veri yollarsa; backend'deki Jackson Z'yi ihmal edecek ve UTC saatini sanki yerel saatmiş gibi alıp kaydedecektir (3 saat geriye kayma).
* Veritabanı kolonları `WITH TIME ZONE` tipine çevrilirse, veritabanı veya JVM tarafındaki en ufak bir Timezone konfigürasyon uyumsuzluğu geriye dönük tüm raporları ve mesai hesaplamalarını birkaç saat ileri veya geri kaydıracaktır. Gece vardiyalarının giriş-çıkışları yanlış günlere düşerek sistemdeki tüm hakedişleri bozabilir.
