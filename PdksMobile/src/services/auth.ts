import * as Keychain from 'react-native-keychain';

// Keychain'de kullanılacak sabit servis adı
const SERVICE_NAME = 'pdks_auth_token';
const USER_INFO_SERVICE = 'pdks_user_info';
const FIRM_ID_SERVICE = 'pdks_firm_id';

/**
 * JWT token'ı güvenli keychain'e yazar.
 * username alanına 'token' sabit değerini, password alanına token'ı kaydeder.
 */
export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('token', token, {
    service: SERVICE_NAME,
  });
}

/**
 * Keychain'den JWT token'ı okur.
 * Token yoksa null döner.
 */
export async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: SERVICE_NAME,
  });
  if (credentials) {
    return credentials.password; // password alanında token saklanıyor
  }
  return null;
}

/**
 * Kullanıcı ad soyad bilgisini güvenli keychain'e kaydeder.
 */
export async function saveFullName(fullName: string): Promise<void> {
  await Keychain.setGenericPassword('fullName', fullName, {
    service: USER_INFO_SERVICE,
  });
}

/**
 * Keychain'den ad soyad bilgisini okur.
 */
export async function getFullName(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: USER_INFO_SERVICE,
  });
  if (credentials) {
    return credentials.password;
  }
  return null;
}

/**
 * Kullanıcı firma ID bilgisini güvenli keychain'e kaydeder.
 */
export async function saveFirmId(firmId: string): Promise<void> {
  await Keychain.setGenericPassword('firmId', firmId, {
    service: FIRM_ID_SERVICE,
  });
}

/**
 * Keychain'den firma ID bilgisini okur.
 */
export async function getFirmId(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: FIRM_ID_SERVICE,
  });
  if (credentials) {
    return credentials.password;
  }
  return null;
}

/**
 * Keychain'den JWT token'ı ve kullanıcı bilgilerini siler (çıkış yapma).
 */
export async function removeToken(): Promise<void> {
  await Keychain.resetGenericPassword({service: SERVICE_NAME});
  await Keychain.resetGenericPassword({service: USER_INFO_SERVICE});
  await Keychain.resetGenericPassword({service: FIRM_ID_SERVICE});
}
