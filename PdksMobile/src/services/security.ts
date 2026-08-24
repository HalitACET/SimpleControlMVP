import JailMonkey from 'jail-monkey';

// TODO: jail-monkey canMockLocation modern Android'de güvenilir değil; asıl tespit position.mocked üzerinden. Huawei (HMS) cihazlarda Google Play Services olmadığı için bu kütüphane Faz 6'da HMS Location Kit alternatifi gerektirecek.

export interface SecurityStatus {
  isMocked: boolean;
  isRooted: boolean;
}

export const checkLocationSecurity = (position?: any): SecurityStatus => {
  let isMocked = false;
  let isRooted = false;

  try {
    if (JailMonkey) {
      isMocked = JailMonkey.canMockLocation ? JailMonkey.canMockLocation() : false;
      isRooted = JailMonkey.isJailBroken ? JailMonkey.isJailBroken() : false;
      console.log(`[SECURITY] canMockLocation sonucu: ${isMocked}`);
      console.log(`[SECURITY] isJailBroken (isRooted) sonucu: ${isRooted}`);
    }
  } catch (e) {
    console.log('JailMonkey static check error:', e);
  }

  // Hem isMocked hem de mocked alanlarını hem position hem de position.coords içinde arayalım
  if (position) {
    let positionMocked = false;
    if (position.isMocked || position.mocked) {
      positionMocked = true;
    } else if (position.coords && (position.coords.isMocked || position.coords.mocked)) {
      positionMocked = true;
    }
    console.log(`[SECURITY] Konum objesi kontrolu - mocked: ${positionMocked}`);
    if (positionMocked) {
      isMocked = true;
    }
  }

  return {
    isMocked,
    isRooted,
  };
};
