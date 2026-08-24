import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {getToken, getFullName, getFirmId} from '../services/auth';
import {getNextAction} from '../services/api';
import {setSession} from '../store/session';
import LoginScreen from '../screens/LoginScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import DeviceMismatchScreen from '../screens/DeviceMismatchScreen';
import QrScanScreen from '../screens/QrScanScreen';
import GpsTransactionScreen from '../screens/GpsTransactionScreen';
import ConfirmTransactionScreen from '../screens/ConfirmTransactionScreen';
import TransactionSuccessScreen from '../screens/TransactionSuccessScreen';
import FakeLocationScreen from '../screens/FakeLocationScreen';

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  ChangePassword: {token: string};
  Home: {fullName?: string; token?: string} | undefined;
  DeviceMismatch: undefined;
  FakeLocation: undefined;
  QrScan: undefined;
  GpsTransaction: undefined;
  ConfirmTransaction: {
    qrContent: string | null;
    latitude: number;
    longitude: number;
    method: 'QR' | 'GPS';
    mockLocation?: boolean;
  };
  TransactionSuccess: {
    type: 'GIRIS' | 'CIKIS';
    timestamp: string;
    locationName: string | null;
    isOffline?: boolean;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    // Uygulama açılışında keychain'de token var mı kontrol et
    const checkToken = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setInitialRoute('Login');
          return;
        }

        // Keychain'deki kalıcı ad soyad ve firma bilgisiyle in-memory session'ı doldur
        const storedName = await getFullName();
        const storedFirmId = await getFirmId();
        setSession({
          fullName: storedName,
          firmId: storedFirmId,
        });

        try {
          // next-action çağrısı hem "sıradaki işlem" verisini hem de
          // cihaz eşleşmesini (403 DEVICE_MISMATCH) doğrulamış olur
          await getNextAction(token);
          setInitialRoute('Home');
        } catch (err: any) {
          if (err.isDeviceMismatch) {
            setInitialRoute('DeviceMismatch');
          } else if (err.isUnauthorized) {
            setInitialRoute('Login');
          } else {
            // Ağ hatası vb. — mevcut davranışı koru, Home ekranı kendi hata durumunu yönetir
            setInitialRoute('Home');
          }
        }
      } catch {
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Token kontrolü sürerken yükleme göstergesi
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Home" component={MainTabNavigator} />
        <Stack.Screen name="DeviceMismatch" component={DeviceMismatchScreen} />
        <Stack.Screen name="QrScan" component={QrScanScreen} />
        <Stack.Screen name="GpsTransaction" component={GpsTransactionScreen} />
        <Stack.Screen name="ConfirmTransaction" component={ConfirmTransactionScreen} />
        <Stack.Screen name="TransactionSuccess" component={TransactionSuccessScreen} />
        <Stack.Screen name="FakeLocation" component={FakeLocationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
