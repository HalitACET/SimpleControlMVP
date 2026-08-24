import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {requestLocationPermission, getCurrentPosition} from '../services/location';
import {checkLocationSecurity} from '../services/security';
import {colors, typography, spacing, radius} from '../theme';
import InfoListCard from '../components/InfoListCard';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'GpsTransaction'>;

export default function GpsTransactionScreen({navigation}: Props) {
  const [status, setStatus] = useState<'requesting' | 'fetching' | 'error'>('requesting');

  const startGpsFlow = async () => {
    try {
      setStatus('requesting');
      const hasPerm = await requestLocationPermission();
      if (!hasPerm) {
        setStatus('error');
        return;
      }

      // 1. Statik güvenlik kontrolü (Konum almaya çalışmadan önce sahte konum uygulaması seçilmiş mi kontrol et)
      const staticSecurity = checkLocationSecurity();
      if (staticSecurity.isMocked) {
        navigation.replace('FakeLocation');
        return;
      }
      if (staticSecurity.isRooted) {
        console.warn('Cihaz rootlu, güvenlik uyarısı (TODO: engelleme politikası eklenebilir)');
      }

      setStatus('fetching');
      const pos = await getCurrentPosition();

      // 2. Dinamik güvenlik kontrolü (Gelen koordinat objesi üzerinden sahte konum kontrolü)
      const dynamicSecurity = checkLocationSecurity(pos);
      if (dynamicSecurity.isMocked || pos.mocked === true) {
        navigation.replace('FakeLocation');
        return;
      }

      // Konum alındı, onay ekranına yönlendir
      navigation.replace('ConfirmTransaction', {
        qrContent: null,
        latitude: pos.latitude,
        longitude: pos.longitude,
        method: 'GPS',
        mockLocation: false, // isMocked ise zaten yönlendiriliyor
      });
    } catch (err: any) {
      console.log('[LOCATION] Konum hatası:', err?.message || err);
      setStatus('error');
    }
  };

  useEffect(() => {
    startGpsFlow();
  }, []);

  const openAppSettings = () => {
    Linking.openSettings();
  };

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.errorContainer}>
            {/* Sarı Tonlu Daire İçinde Hedef İkonu */}
            <View style={styles.targetBadge}>
              <View style={styles.targetInnerCircle}>
                <View style={styles.targetCenterDot} />
              </View>
            </View>

            {/* Başlık */}
            <Text style={styles.errorTitle}>Konumunuz alınamıyor</Text>
            
            {/* Açıklama */}
            <Text style={styles.errorDescription}>
              Geçiş işlemi yapabilmek için yüksek doğruluklu GPS konum bilgisi gereklidir. Lütfen konum servislerinin açık ve uygulamaya konum izni verildiğinden emin olun.
            </Text>

            {/* Numaralı Liste Bilgi Kartı */}
            <InfoListCard
              title="NE YAPMALIYIM?"
              items={[
                'Aşağıdaki düğmeyle konum ayarlarını açın.',
                '"Konum" anahtarını açık duruma getirin.',
                'Uygulamaya dönüp tekrar deneyin.',
              ]}
            />

            {/* Butonlar */}
            <View style={styles.footer}>
              <Button
                title="KONUM AYARLARINI AÇ"
                onPress={openAppSettings}
                variant="primary"
                style={styles.actionBtn}
              />
              <Button
                title="TEKRAR DENE"
                onPress={startGpsFlow}
                variant="outline"
                style={styles.actionBtn}
              />
              <TouchableOpacity
                style={styles.cancelLink}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}>
                <Text style={styles.cancelLinkText}>İptal Et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {status === 'requesting' ? 'Konum izni isteniyor...' : 'Konumunuz doğrulanıyor...'}
        </Text>
        <Text style={styles.subText}>Bu işlem birkaç saniye sürebilir.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subText: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  targetBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF6DF',
    borderWidth: 1,
    borderColor: '#FCE7B2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  targetInnerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  errorTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorDescription: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionBtn: {
    width: '100%',
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelLinkText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
