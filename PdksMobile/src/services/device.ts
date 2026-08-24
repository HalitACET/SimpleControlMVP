import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';
import {API_BASE_URL} from '../config';
import axios from 'axios';

const DEVICE_KEYCHAIN_SERVICE = 'pdks-device';
const DEVICE_KEYCHAIN_USERNAME = 'deviceId';

// ─── Device ID ───────────────────────────────────────────────────────────────

/**
 * Keychain'de kayıtlı device UUID var mı bak (auth token'dan AYRI kayıt).
 * Varsa onu döndür. Yoksa DeviceInfo.getUniqueId() ile üret, kaydet, döndür.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const stored = await Keychain.getGenericPassword({
      service: DEVICE_KEYCHAIN_SERVICE,
    });

    if (stored && stored.password) {
      return stored.password;
    }
  } catch {
    // keychain okuma hatası — devam et, yeni ID üret
  }

  // Yeni ID üret
  const uniqueId = await DeviceInfo.getUniqueId();

  await Keychain.setGenericPassword(DEVICE_KEYCHAIN_USERNAME, uniqueId, {
    service: DEVICE_KEYCHAIN_SERVICE,
  });

  return uniqueId;
}

// ─── Device Name ─────────────────────────────────────────────────────────────

/**
 * Marka + Model birleştirir. Örn: "TECNO CM7"
 */
export function getDeviceName(): string {
  const brand = DeviceInfo.getBrand().trim();
  const model = DeviceInfo.getModel().trim();
  
  const bUpper = brand.toUpperCase();
  const mUpper = model.toUpperCase();
  
  if (mUpper.startsWith(bUpper)) {
    return model;
  }
  return `${brand} ${model}`;
}

// ─── Device Register ─────────────────────────────────────────────────────────

/**
 * POST /device/register
 * Backend'e deviceId ve deviceName göndererek cihazı hesaba bağlar.
 */
export async function registerDevice(token: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const deviceName = getDeviceName();

  await axios.post(
    `${API_BASE_URL}/device/register`,
    {deviceId, deviceName},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export interface DeviceVerifyResponse {
  bound: boolean;
  deviceName: string;
  registeredAt: string;
}

/**
 * GET /device/verify
 * Backend'e X-Device-Id header'ı ile istek atarak eşleşme ve detay bilgilerini alır.
 */
export async function verifyDevice(token: string): Promise<DeviceVerifyResponse> {
  const deviceId = await getOrCreateDeviceId();
  const response = await axios.get<DeviceVerifyResponse>(
    `${API_BASE_URL}/device/verify`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Device-Id': deviceId,
      },
    },
  );
  return response.data;
}
