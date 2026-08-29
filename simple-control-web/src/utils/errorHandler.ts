import axios from 'axios';

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Log the full error context for developers
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // 1. Ağ hatası veya sunucuya ulaşılamıyor (response yoksa)
    if (!error.response) {
      return 'Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.';
    }

    const status = error.response.status;
    const backendMessage = error.response.data?.message;

    // 2. HTTP Status kodlarına göre sınıflandırma
    switch (status) {
      case 401:
        return backendMessage || 'Kullanıcı adı veya şifre hatalı.';
      case 403:
        return backendMessage || 'Bu işlem için yetkiniz yok.';
      case 400:
        return backendMessage || 'Gönderilen bilgiler geçersiz.';
      case 409:
        // Kart çakışması gibi anlamlı hatalar 409'dan gelir
        return backendMessage || 'Çakışma oluştu.';
    }

    if (status >= 500) {
      return 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    }
  } else {
    // Log non-axios errors too
    console.error('Unexpected Non-API Error:', error);
  }

  return 'Beklenmeyen bir hata oluştu.';
}
