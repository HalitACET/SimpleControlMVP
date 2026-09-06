import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {getToken, removeToken} from '../services/auth';
import {getOrCreateDeviceId} from '../services/device';
import {logScan} from '../services/api';
import {clearSession} from '../store/session';
import {colors, typography, spacing, radius} from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import {isOnline} from '../services/connectivity';
import {addToQueue} from '../services/offlineQueue';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

export default function ConfirmTransactionScreen({route, navigation}: Props) {
  const {qrContent, latitude, longitude, method} = route.params;

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // 1. Saat ve tarih güncelle
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCurrentTime(timeStr);

      const dateStr = now.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOfflineSave = async () => {
    try {
      const toLocalISOString = (date: Date) => {
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      const scannedAt = toLocalISOString(new Date());
      await addToQueue({
        scannedAt,
        latitude,
        longitude,
        qrContent,
        method,
        mockLocation: route.params.mockLocation ?? false,
      });

      navigation.replace('TransactionSuccess', {
        scannedAt,
        locationName: null,
        isOffline: true,
      });
    } catch (err) {
      console.error('[SYNC] Failed to save offline:', err);
      Alert.alert('Hata', 'Kayıt çevrimdışı kuyruğa eklenemedi.');
    }
  };

  const handleConfirm = async () => {
    if (!isOnline()) {
      console.log('[SYNC] Device is offline. Directing to offline save.');
      await handleOfflineSave();
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const deviceId = await getOrCreateDeviceId();

      const response = await logScan(token, {
        scannedAt: null, // sunucuda LocalDateTime.now() atanacak
        latitude,
        longitude,
        qrContent,
        method,
        deviceId,
        mockLocation: route.params.mockLocation ?? false,
      });

      // Başarılı ekranına yönlendir
      navigation.replace('TransactionSuccess', {
        scannedAt: response.scannedAt,
        locationName: response.locationName,
        suspicious: response.suspicious,
        suspiciousReason: response.suspiciousReason,
      });
    } catch (error: any) {
      console.warn('Transaction log failed:', error.message || error);

      if (error.isDeviceMismatch) {
        // Cihaz uyuşmazlığı ekranına yönlendir
        navigation.replace('DeviceMismatch');
      } else if (error.isUnauthorized) {
        await removeToken();
        clearSession();
        navigation.replace('Login');
      } else if (error.isInvalidQr) {
        Alert.alert('Geçersiz İşlem', 'Okutulan QR kod bu firmaya ait değil veya geçersizdir.');
        navigation.goBack();
      } else {
        // Ağ hatası veya timeout durumunda offline'a düşür
        console.log('[SYNC] Network/Server error. Redirecting to offline save.');
        await handleOfflineSave();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      {/* Özel Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geçiş onayı</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.mainCard}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>

          <View style={styles.grayBox}>
            <Text style={styles.grayBoxLabel}>YÖNTEM</Text>
            <Text style={styles.grayBoxValue}>
              {method === 'QR' ? 'QR Kod Okuyucu' : 'GPS Konum Doğrulama'}
            </Text>
            
            <Text style={styles.grayBoxLabel}>KOORDİNATLAR</Text>
            <Text style={styles.grayBoxValue}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
        </Card>

        <Text style={styles.footnote}>
          Onayladığınızda okutma kaydınız oluşturulur.
        </Text>
      </ScrollView>

      {/* Alt Butonlar */}
      <View style={styles.footer}>
        <Button
          title="OKUTMAYI ONAYLA"
          onPress={handleConfirm}
          variant="primary"
          loading={submitting}
          style={styles.actionBtn}
        />
        <Button
          title="Vazgeç"
          onPress={() => navigation.goBack()}
          variant="outline"
          disabled={submitting}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontFamily: typography.fontFamilyBold,
    color: colors.textPrimary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerRightSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: spacing.md,
  },
  mainCard: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  timeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 44,
    color: colors.textPrimary,
  },
  dateText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grayBox: {
    backgroundColor: '#F8F6F1', // krem zemine yakın ama karttan ayırt edilebilir
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  grayBoxLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  grayBoxValue: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  footnote: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
