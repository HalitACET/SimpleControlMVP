import axios from 'axios';
import {API_BASE_URL} from '../config';
import {
  ScanRequest,
  ScanResponse,
  BatchScanResult,
  NextActionResponse,
  ScanHistoryPage,
  SummaryResponse,
  DailyItem,
} from '../types/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth API Fonksiyonları ───────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
  deviceRegistered: boolean;
}

/**
 * POST /auth/login
 * firmId + username + password + deviceId ile giriş yapar.
 * 403 DEVICE_MISMATCH durumunda özel hata fırlatır.
 */
export async function login(
  firmId: string,
  username: string,
  password: string,
  deviceId: string,
): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      firmId,
      username,
      password,
      deviceId,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      const deviceError = new Error(
        error.response?.data?.message ??
          'Bu hesap başka bir cihaza kayıtlıdır.',
      ) as any;
      deviceError.isDeviceMismatch = true;
      throw deviceError;
    }
    const message =
      error.response?.data?.message ?? 'Sunucuya bağlanılamadı.';
    throw new Error(message);
  }
}

/**
 * POST /auth/change-password
 * Eski + yeni şifreyi gönderir, JWT token header'a eklenir.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
  token: string,
): Promise<void> {
  try {
    await api.post(
      '/auth/change-password',
      {oldPassword, newPassword},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error: any) {
    const message =
      error.response?.data?.message ?? 'Şifre değiştirilemedi.';
    throw new Error(message);
  }
}

// ─── Geçiş (Transaction/Scan) API Fonksiyonları ───

/**
 * GET /me/next-action
 * Son harekete göre giriş/çıkış önerisini alır.
 */
export async function getNextAction(token: string): Promise<NextActionResponse> {
  try {
    const response = await api.get<NextActionResponse>('/me/next-action', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403 && error.response?.data?.errorCode === 'DEVICE_MISMATCH') {
      const mismatchError = new Error(
        error.response?.data?.message ?? 'Cihaz uyuşmazlığı hatası.',
      ) as any;
      mismatchError.isDeviceMismatch = true;
      throw mismatchError;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      const authError = new Error('Oturum süresi dolmuş veya geçersiz.') as any;
      authError.isUnauthorized = true;
      throw authError;
    }
    const message = error.response?.data?.message ?? 'Durum bilgisi alınamadı.';
    throw new Error(message);
  }
}

/**
 * POST /scans
 * Geçiş kaydı ekler.
 */
export async function logScan(
  token: string,
  body: ScanRequest,
): Promise<ScanResponse> {
  try {
    const response = await api.post<ScanResponse>('/scans', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403 && error.response?.data?.errorCode === 'DEVICE_MISMATCH') {
      const mismatchError = new Error(
        error.response?.data?.message ?? 'Cihaz uyuşmazlığı hatası.',
      ) as any;
      mismatchError.isDeviceMismatch = true;
      throw mismatchError;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      const authError = new Error('Oturum süresi dolmuş veya geçersiz.') as any;
      authError.isUnauthorized = true;
      throw authError;
    }
    if (error.response?.status === 400 && error.response?.data?.errorCode === 'INVALID_QR') {
      const qrError = new Error(
        error.response?.data?.message ?? 'Geçersiz QR Kod.',
      ) as any;
      qrError.isInvalidQr = true;
      throw qrError;
    }
    const message = error.response?.data?.message ?? 'İşlem kaydı oluşturulamadı.';
    throw new Error(message);
  }
}

/**
 * GET /me/scans
 * Geçiş geçmişini sayfalı olarak alır.
 */
export async function getHistory(
  token: string,
  page: number = 0,
  size: number = 20,
): Promise<ScanHistoryPage> {
  try {
    const response = await api.get<ScanHistoryPage>('/me/scans', {
      params: {page, size},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? 'Geçmiş listesi yüklenemedi.';
    throw new Error(message);
  }
}

/**
 * GET /me/daily
 * Günlük özet geçmişini alır.
 */
export async function getMyDaily(
  token: string,
  from: string,
  to: string,
): Promise<DailyItem[]> {
  try {
    const response = await api.get<DailyItem[]>('/me/daily', {
      params: {from, to},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const authError = new Error('Oturum süresi dolmuş veya geçersiz.') as any;
      authError.isUnauthorized = true;
      throw authError;
    }
    const message = error.response?.data?.message ?? 'Günlük özet alınamadı.';
    throw new Error(message);
  }
}

/**
 * GET /me/scans (Tarih filtreli)
 * Geçiş geçmişini belirli bir tarih aralığı için sayfalı olarak alır.
 */
export async function getMyScans(
  token: string,
  page: number = 0,
  size: number = 20,
  from?: string,
  to?: string,
): Promise<ScanHistoryPage> {
  try {
    const params: any = {page, size};
    if (from !== undefined) params.from = from;
    if (to !== undefined) params.to = to;
    
    const response = await api.get<ScanHistoryPage>('/me/scans', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const authError = new Error('Oturum süresi dolmuş veya geçersiz.') as any;
      authError.isUnauthorized = true;
      throw authError;
    }
    const message = error.response?.data?.message ?? 'Ham okutmalar alınamadı.';
    throw new Error(message);
  }
}

/**
 * POST /scans/batch
 * Çevrimdışı kayıtları topluca senkronize eder.
 */
export async function syncScans(
  token: string,
  body: ScanRequest[],
): Promise<BatchScanResult[]> {
  try {
    const response = await api.post<BatchScanResult[]>('/scans/batch', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message ?? 'Senkronizasyon başarısız.';
    throw new Error(message);
  }
}

/**
 * GET /me/summary
 * Oturumu açık kullanıcının bu ayki puantaj özetini alır.
 */
export async function getMySummary(
  token: string,
  year?: number,
  month?: number,
): Promise<SummaryResponse> {
  try {
    const params: any = {};
    if (year !== undefined) params.year = year;
    if (month !== undefined) params.month = month;

    const response = await api.get<SummaryResponse>('/me/summary', {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const authError = new Error('Oturum süresi dolmuş veya geçersiz.') as any;
      authError.isUnauthorized = true;
      throw authError;
    }
    const message = error.response?.data?.message ?? 'Puantaj özeti alınamadı.';
    throw new Error(message);
  }
}
