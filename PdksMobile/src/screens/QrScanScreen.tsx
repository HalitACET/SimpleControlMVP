import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Camera, useCameraDevice, useCodeScanner, useCameraPermission} from 'react-native-vision-camera';
import {RootStackParamList} from '../navigation/AppNavigator';
import {requestLocationPermission, getCurrentPosition} from '../services/location';
import {checkLocationSecurity} from '../services/security';
import {colors, typography, spacing, radius} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'QrScan'>;

export default function QrScanScreen({navigation}: Props) {
  const {hasPermission: cameraPermission, requestPermission} = useCameraPermission();
  const [locationStatus, setLocationStatus] = useState<'fetching' | 'success' | 'error'>('fetching');
  const [coordinates, setCoordinates] = useState<{latitude: number; longitude: number} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  
  const device = useCameraDevice('back');
  const scannedRef = useRef<boolean>(false);

  // 1. Kamera izni iste
  useEffect(() => {
    (async () => {
      if (!cameraPermission) {
        await requestPermission();
      }
    })();
  }, [cameraPermission]);

  // 2. Konum izni iste ve konumu al
  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      setLocationStatus('fetching');
      const hasPerm = await requestLocationPermission();
      if (!hasPerm) {
        if (isMounted) {
          setLocationStatus('error');
        }
        return;
      }

      // 1. Statik güvenlik kontrolü
      const staticSecurity = checkLocationSecurity();
      if (staticSecurity.isMocked) {
        if (isMounted) {
          setIsCameraActive(false);
          navigation.replace('FakeLocation');
        }
        return;
      }
      if (staticSecurity.isRooted) {
        console.warn('Cihaz rootlu, güvenlik uyarısı (TODO: engelleme politikası eklenebilir)');
      }

      try {
        const pos = await getCurrentPosition();
        
        // 2. Dinamik güvenlik kontrolü
        const dynamicSecurity = checkLocationSecurity(pos);
        if (dynamicSecurity.isMocked || pos.mocked === true) {
          if (isMounted) {
            setIsCameraActive(false);
            navigation.replace('FakeLocation');
          }
          return;
        }

        if (isMounted) {
          setCoordinates(pos);
          setLocationStatus('success');
        }
      } catch (err: any) {
        console.log('[LOCATION] Konum hatası:', err?.message || err);
        if (isMounted) {
          setLocationStatus('error');
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. QR Kod tarama mantığı
  const handleQrScanned = (qrValue: string) => {
    if (scannedRef.current) return;

    if (locationStatus === 'fetching') {
      Alert.alert('Lütfen Bekleyin', 'Konumunuz henüz alınamadı, doğrulama sürüyor.');
      return;
    }

    if (locationStatus === 'error' || !coordinates) {
      Alert.alert('Konum Hatası', 'Geçerli bir GPS konumu alınamadığı için geçiş yapamazsınız (TC03).');
      return;
    }

    scannedRef.current = true;
    setIsCameraActive(false);

    // Başarıyla yönlendir
    navigation.navigate('ConfirmTransaction', {
      qrContent: qrValue,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      method: 'QR',
      mockLocation: false, // isMocked ise zaten yönlendiriliyor, buraya geliyorsa false'tur.
    });
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: any[]) => {
      if (codes.length > 0 && codes[0].value) {
        handleQrScanned(codes[0].value);
      }
    },
  });

  const getDotColor = () => {
    if (locationStatus === 'fetching') return colors.primary;
    if (locationStatus === 'success') return colors.success;
    return colors.danger;
  };

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Kamera izni kontrol ediliyor...</Text>
      </SafeAreaView>
    );
  }

  if (cameraPermission === false) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Kamera izni reddedildi. QR taramak için ayarlardan kamera izni vermeniz gerekir.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Arka kamera bulunamadı.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        codeScanner={codeScanner}
        torch={isTorchOn ? 'on' : 'off'}
      />

      {/* Koyu Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.circleBackButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR ile geçiş</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tarama Katmanı */}
      <View style={styles.overlayContainer}>
        {/* Tarama Çerçevesi */}
        <View style={styles.scannerFrame}>
          {/* L Köşeler */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Hizalama Uyarısı */}
        <Text style={styles.alignText}>Kodu çerçevenin içine hizalayın</Text>

        <View style={styles.bottomSection}>
          {/* Konum Doğrulama Durum Hapı */}
          <View style={styles.statusPill}>
            <Text style={[styles.statusDot, {color: getDotColor()}]}>●</Text>
            <Text style={styles.statusText}>
              {locationStatus === 'fetching' && ' Konumunuz arka planda doğrulanıyor'}
              {locationStatus === 'success' && ' Konumunuz doğrulandı'}
              {locationStatus === 'error' && ' Konum alınamıyor (Tarama engellendi)'}
            </Text>
          </View>

          {/* Fener Butonu */}
          {device.hasTorch && (
            <TouchableOpacity
              style={styles.torchButton}
              activeOpacity={0.8}
              onPress={() => setIsTorchOn(!isTorchOn)}>
              <Text style={styles.torchButtonText}>
                {isTorchOn ? 'FENERİ KAPAT' : 'FENERİ AÇ'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  backBtn: {
    backgroundColor: colors.dark,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  backBtnText: {
    color: '#fff',
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: '#fff',
    fontSize: 20,
    fontFamily: typography.fontFamilyBold,
    marginTop: -2,
  },
  headerTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 36,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64, // Header yüksekliği kadar boşluk
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radius.sm,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radius.sm,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radius.sm,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: radius.sm,
  },
  alignText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusDot: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 12,
    color: '#fff',
  },
  torchButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  torchButtonText: {
    color: '#fff',
    fontFamily: typography.fontFamilyBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
});
