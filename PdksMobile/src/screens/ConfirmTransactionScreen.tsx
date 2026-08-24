import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {getToken, removeToken} from '../services/auth';
import {getOrCreateDeviceId} from '../services/device';
import {getNextAction, logTransaction} from '../services/api';
import {clearSession} from '../store/session';
import {colors, typography, spacing, radius} from '../theme';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import Button from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isOnline} from '../services/connectivity';
import {addToQueue} from '../services/offlineQueue';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmTransaction'>;

export default function ConfirmTransactionScreen({route, navigation}: Props) {
  const {qrContent, latitude, longitude, method} = route.params;

  const [type, setType] = useState<'GIRIS' | 'CIKIS' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  // 2. NextAction önerisini yükle
  useEffect(() => {
    const loadSuggestion = async () => {
      try {
        setLoading(true);
        if (!isOnline()) {
          const cached = await AsyncStorage.getItem('pdks_next_action_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            setType(parsed.suggestedType || 'GIRIS');
          } else {
            setType('GIRIS');
          }
          return;
        }

        const token = await getToken();
        if (!token) {
          navigation.replace('Login');
          return;
        }
        const nextAction = await getNextAction(token);
        setType(nextAction.suggestedType);
      } catch (err) {
        console.error('Failed to load transaction suggestion:', err);
        try {
          const cached = await AsyncStorage.getItem('pdks_next_action_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            setType(parsed.suggestedType || 'GIRIS');
            return;
          }
        } catch (_) {}
        setType('GIRIS');
      } finally {
        setLoading(false);
      }
    };

    loadSuggestion();
  }, []);

  const handleToggleType = () => {
    setType(prev => (prev === 'GIRIS' ? 'CIKIS' : 'GIRIS'));
  };

  const handleOfflineSave = async () => {
    try {
      const toLocalISOString = (date: Date) => {
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      };
      const timestamp = toLocalISOString(new Date());
      await addToQueue({
        type,
        timestamp,
        latitude,
        longitude,
        qrContent,
        method,
        mockLocation: route.params.mockLocation ?? false,
      });

      // Update next action cache immediately in AsyncStorage for continuity
      try {
        const nextSuggested = type === 'GIRIS' ? 'CIKIS' : 'GIRIS';
        const nextActionState = {
          suggestedType: nextSuggested,
          lastTransaction: {
            type: type!,
            timestamp,
            locationName: 'Konum: Kaydedildi',
          }
        };
        await AsyncStorage.setItem('pdks_next_action_cache', JSON.stringify(nextActionState));
      } catch (cacheErr) {
        console.warn('[SYNC] Failed to update next action cache:', cacheErr);
      }

      navigation.replace('TransactionSuccess', {
        type: type!,
        timestamp,
        locationName: null,
        isOffline: true,
      });
    } catch (err) {
      console.error('[SYNC] Failed to save offline:', err);
      Alert.alert('Hata', 'Kayıt çevrimdışı kuyruğa eklenemedi.');
    }
  };

  const handleConfirm = async () => {
    if (!type) return;

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

      const response = await logTransaction(token, {
        type,
        timestamp: null, // sunucuda LocalDateTime.now() atanacak
        latitude,
        longitude,
        qrContent,
        method,
        deviceId,
        mockLocation: route.params.mockLocation ?? false,
      });

      // Başarılı ekranına yönlendir
      navigation.replace('TransactionSuccess', {
        type: response.type,
        timestamp: response.timestamp,
        locationName: response.locationName,
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
      } else if (error.isLocationSuspicious) {
        // Anomali / Mock / Geofence hatası
        navigation.replace('FakeLocation');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>İşlem detayları hazırlanıyor...</Text>
      </SafeAreaView>
    );
  }

  const isGiris = type === 'GIRIS';
  const typeText = isGiris ? 'GİRİŞ' : 'ÇIKIŞ';
  const typeColor = isGiris ? colors.success : colors.primaryDark;

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
          <SectionLabel text="PLANLANAN HAREKET" />
          <Text style={[styles.typeText, {color: typeColor}]}>{typeText}</Text>
          
          <TouchableOpacity
            style={styles.toggleLink}
            activeOpacity={0.7}
            onPress={handleToggleType}>
            <Text style={[styles.toggleLinkText, {color: typeColor}]}>
              {isGiris ? 'Çıkış Yapmak İstiyorum' : 'Giriş Yapmak İstiyorum'} (Değiştir)
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

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
          Onayladığınızda {typeText.toLowerCase()} kaydınız oluşturulur.
        </Text>
      </ScrollView>

      {/* Alt Butonlar */}
      <View style={styles.footer}>
        <Button
          title={type === 'GIRIS' ? 'GİRİŞİ ONAYLA' : 'ÇIKIŞI ONAYLA'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.textSecondary,
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
  typeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 48,
    marginVertical: spacing.xs,
  },
  toggleLink: {
    paddingVertical: spacing.xs,
  },
  toggleLinkText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: spacing.lg,
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
