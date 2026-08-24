import axios from 'axios';
import {API_BASE_URL} from '../config';

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
    // 403 DEVICE_MISMATCH → özel hata tipi
    if (error.response?.status === 403) {
      const deviceError = new Error(
        error.response?.data?.message ??
          'Bu hesap başka bir cihaza kayıtlıdır.',
      ) as any;
      deviceError.isDeviceMismatch = true;
      throw deviceError;
    }
    // Diğer hatalar
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

// ─── Geçiş (Transaction) API Fonksiyonları ───

export interface NextActionResponse {
  suggestedType: 'GIRIS' | 'CIKIS';
  lastTransaction?: {
    type: 'GIRIS' | 'CIKIS';
    timestamp: string;
    locationName?: string;
  } | null;
  shift?: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface TransactionLogRequest {
  type: 'GIRIS' | 'CIKIS' | null;
  timestamp: string | null;
  latitude: number;
  longitude: number;
  qrContent: string | null;
  method: 'QR' | 'GPS';
  deviceId: string;
  mockLocation: boolean;
  clientId?: string;
}

export interface SyncResultResponse {
  clientId: string;
  status: 'SAVED' | 'REJECTED';
  errorCode?: 'DEVICE_MISMATCH' | 'INVALID_QR' | 'LOCATION_SUSPICIOUS' | 'SYSTEM_ERROR';
  transactionId?: number;
}

export interface TransactionLogResponse {
  id: number;
  type: 'GIRIS' | 'CIKIS';
  timestamp: string;
  locationName: string | null;
  message: string;
}

export interface TransactionHistoryItem {
  id: number;
  type: 'GIRIS' | 'CIKIS';
  timestamp: string;
  locationName: string | null;
  method: 'QR' | 'GPS';
}

export interface TransactionHistoryPage {
  content: TransactionHistoryItem[];
  totalPages: number;
  totalElements: number;
  last: boolean;
}

/**
 * GET /transaction/next-action
 * Son harekete göre giriş/çıkış önerisini alır.
 */
export async function getNextAction(token: string): Promise<NextActionResponse> {
  try {
    const response = await api.get<NextActionResponse>('/transaction/next-action', {
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
 * POST /transaction/log
 * Geçiş kaydı ekler.
 */
export async function logTransaction(
  token: string,
  body: TransactionLogRequest,
): Promise<TransactionLogResponse> {
  try {
    const response = await api.post<TransactionLogResponse>('/transaction/log', body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403 && error.response?.data?.errorCode === 'LOCATION_SUSPICIOUS') {
      const locError = new Error(
        error.response?.data?.message ?? 'Konumunuz doğrulanamadı.',
      ) as any;
      locError.isLocationSuspicious = true;
      throw locError;
    }
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
 * GET /transaction/history
 * Geçiş geçmişini sayfalı olarak alır.
 */
export async function getHistory(
  token: string,
  page: number = 0,
  size: number = 20,
): Promise<TransactionHistoryPage> {
  try {
    const response = await api.get<TransactionHistoryPage>('/transaction/history', {
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
 * POST /transaction/sync
 * Çevrimdışı kayıtları topluca senkronize eder.
 */
export async function syncTransactions(
  token: string,
  body: TransactionLogRequest[],
): Promise<SyncResultResponse[]> {
  try {
    const response = await api.post<SyncResultResponse[]>('/transaction/sync', body, {
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

export interface TimesheetSummaryResponse {
  month: number;
  year: number;
  workedMinutes: number;
  expectedMinutes: number;
  lateDays: number;
  incompleteDays: number;
  shiftName: string | null;
}

/**
 * GET /me/timesheet-summary
 * Oturumu açık kullanıcının bu ayki puantaj özetini alır.
 */
export async function getMyTimesheetSummary(token: string): Promise<TimesheetSummaryResponse> {
  try {
    const response = await api.get<TimesheetSummaryResponse>('/me/timesheet-summary', {
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
