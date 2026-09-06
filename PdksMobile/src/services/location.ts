import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isOnline} from './connectivity';

/**
 * Konum izni ister. Android için ACCESS_FINE_LOCATION kontrol edilir.
 * İzin verilirse true, verilmezse false döner.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  try {
    const status = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (status === RESULTS.GRANTED) {
      return true;
    }
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Location permission request failed:', error);
    return false;
  }
}

export function getCurrentPosition(): Promise<{latitude: number; longitude: number; mocked: boolean}> {
  return new Promise((resolve, reject) => {
    console.log('[LOCATION] Geolocation getCurrentPosition baslatildi (High Accuracy: true, Timeout: 10s)');
    Geolocation.getCurrentPosition(
      (position) => {
        const mocked = (position as any).mocked || (position.coords as any).mocked || false;
        console.log(`[LOCATION] Konum alindi (High Accuracy): lat: ${position.coords.latitude}, lng: ${position.coords.longitude}, mocked: ${mocked}`);
        


        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          mocked,
        });
      },
      (error) => {
        console.log('[LOCATION] Geolocation high accuracy basarisiz oldu. Fallback denenecek. Hata:', error);
        
        console.log('[LOCATION] Geolocation getCurrentPosition baslatildi (High Accuracy: false, Timeout: 5s)');
        Geolocation.getCurrentPosition(
          (position) => {
            const mocked = (position as any).mocked || (position.coords as any).mocked || false;
            console.log(`[LOCATION] Konum alindi (Low Accuracy Fallback): lat: ${position.coords.latitude}, lng: ${position.coords.longitude}, mocked: ${mocked}`);
            


            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              mocked,
            });
          },
          async (error2) => {
            console.log('[LOCATION] Geolocation fallback low accuracy de basarisiz oldu. Hata:', error2);
            reject(new Error('Konum alınamadı. Geçiş yapabilmek için konum servislerini açmanız gerekiyor.'));
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10000,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );
  });
}
