/**
 * API yapılandırması — tek yerden yönetilen base URL.
 *
 * ÖNEMLİ: Android cihazdan "localhost" çalışmaz.
 * USB ile bağlı gerçek cihaz için bilgisayarının yerel IP adresini kullan.
 * Örnek: ipconfig komutunu çalıştır → "Wireless LAN adapter Wi-Fi" altındaki
 *         "IPv4 Address" değerini al → aşağıya yaz (port 8080 sabit kalacak).
 *
 * Emülatör kullanıyorsan: http://10.0.2.2:8080
 * Gerçek cihaz kullanıyorsan: http://192.168.X.X:8080  ← BU SATIRI GÜNCELLE
 */
export const API_BASE_URL = 'http://192.168.1.34:8080';
