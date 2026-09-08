/**
 * API yapılandırması — tek yerden yönetilen base URL.
 *
 * Üretim: Render üzerindeki canlı sunucu. HTTPS zorunlu, çünkü Android 9+
 * düz HTTP bağlantılarına izin vermiyor.
 *
 * Yerel geliştirmeye dönmek için aşağıdaki satırı aktif et:
 *   - Emülatör kullanıyorsan: http://10.0.2.2:8080
 *   - Gerçek cihaz kullanıyorsan bilgisayarının yerel IP'sini yaz
 *     (ipconfig → "Wireless LAN adapter Wi-Fi" → "IPv4 Address", port 8080 sabit)
 */
// Yerel gelistirme: 'http://192.168.1.101:8080'
export const API_BASE_URL = 'https://simple-control-api.onrender.com';
