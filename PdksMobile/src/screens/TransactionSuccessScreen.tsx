import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {colors, typography, spacing, radius} from '../theme';
import Button from '../components/Button';
import Card from '../components/Card';
import {getFullName} from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionSuccess'>;

export default function TransactionSuccessScreen({route, navigation}: Props) {
  const {scannedAt, locationName, isOffline, suspicious, suspiciousReason} = route.params;
  const [firstName, setFirstName] = useState<string>('Personel');
 
  // Log the suspicious reason if it exists
  useEffect(() => {
    if (suspiciousReason) {
      console.log('[TransactionSuccessScreen] suspiciousReason:', suspiciousReason);
    }
  }, [suspiciousReason]);

  // Kullanıcı adını al ve ilk ismini filtrele
  useEffect(() => {
    const fetchName = async () => {
      try {
        const name = await getFullName();
        if (name) {
          setFirstName(name.trim().split(/\s+/)[0]);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchName();
  }, []);
 
  // Format timestamp (HH:mm)
  const formatTime = (tsStr: string) => {
    try {
      const parts = tsStr.split('T');
      if (parts.length > 1) {
        return parts[1].substring(0, 5);
      }
    } catch (e) {
      // fallback
    }
    return '';
  };
 
  // Format date (17 Temmuz 2026 formatında)
  const formatDate = (tsStr: string) => {
    try {
      const parts = tsStr.split('T');
      if (parts.length > 0) {
        const dateParts = parts[0].split('-');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[2], 10);
          const monthIndex = parseInt(dateParts[1], 10) - 1;
          const year = dateParts[0];
          const months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
          ];
          return `${day} ${months[monthIndex]} ${year}`;
        }
      }
    } catch (e) {
      // fallback
    }
    return '';
  };
 
  const isSuspicious = suspicious === true;
  const timeText = formatTime(scannedAt);
  const dateText = formatDate(scannedAt);
  
  const handleDone = () => {
    navigation.popToTop();
  };

  if (isSuspicious) {
    const methodStr = (route.params as any).method === 'QR' || (locationName && locationName.toLowerCase().includes('qr')) ? 'QR' : 'GPS';
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
        
        <ScrollView style={styles.scroll} contentContainerStyle={styles.suspiciousContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.alertIcon}>!</Text>
          </View>

          <Text style={styles.suspiciousTitle}>Okutma geçerli sayılmadı</Text>
          
          <Text style={styles.suspiciousDescription}>
            Kaydınız oluşturuldu ancak konumunuz doğrulanamadığı için mesai hesabınıza dahil edilmeyecek.
          </Text>

          <Card style={styles.infoCard}>
            <Text style={styles.infoCardText}>
              Tesis alanının dışında görünüyorsunuz veya konum bilginiz güvenilir değil. Sorun devam ederse İK birimine başvurun.
            </Text>
          </Card>
          
          <View style={styles.suspiciousDetails}>
            <View style={styles.suspiciousDetailRow}>
              <Text style={styles.suspiciousDetailLabel}>SAAT</Text>
              <Text style={styles.suspiciousDetailValue}>{timeText}</Text>
            </View>
            <View style={styles.suspiciousDetailRow}>
              <Text style={styles.suspiciousDetailLabel}>TARİH</Text>
              <Text style={styles.suspiciousDetailValue}>{dateText}</Text>
            </View>
            <View style={[styles.suspiciousDetailRow, {borderBottomWidth: 0}]}>
              <Text style={styles.suspiciousDetailLabel}>KONUM</Text>
              <Text style={styles.suspiciousDetailValue}>Doğrulanamadı ({methodStr})</Text>
            </View>
          </View>
          
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title="ANA SAYFAYA DÖN"
            onPress={handleDone}
            variant="primary"
            style={styles.actionBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Normal Başarı Ekranı
  const successText = 'OKUTMA KAYDEDİLDİ';
  const subtitleText = isOffline 
    ? 'İnternet yok — kaydınız cihazda saklandı, bağlantı gelince gönderilecek.'
    : 'İşleminiz başarıyla tamamlandı.';
  const locationText = isOffline
    ? 'Kaydedildi (senkronize bekliyor)'
    : (locationName ? locationName : '● Doğrulandı (GPS)');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.success} barStyle="light-content" />
      
      <View style={styles.content}>
        <View style={styles.checkmarkCircle}>
          <Text style={styles.checkmarkIcon}>✓</Text>
        </View>

        <Text style={styles.successTitle}>{successText}</Text>
        <Text style={styles.successSubtitle}>{subtitleText}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SAAT</Text>
            <Text style={styles.detailValue}>{timeText}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TARİH</Text>
            <Text style={styles.detailValue}>{dateText}</Text>
          </View>
          
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={styles.detailLabel}>KONUM</Text>
            <Text style={styles.detailValue}>{locationText}</Text>
          </View>
        </View>

        <Text style={styles.personalGreeting}>
          İyi çalışmalar, {firstName}!
        </Text>
      </View>

      <Button
        title="ANA SAYFAYA DÖN"
        onPress={handleDone}
        variant="outline"
        style={styles.doneButton}
        textStyle={styles.doneButtonText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  suspiciousContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: '#FDE68A', // açık sarı/amber sınır
    backgroundColor: '#FEF3C7', // açık sarı/amber zemin
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  alertIcon: {
    fontSize: 48,
    fontFamily: typography.fontFamilyBold,
    color: colors.warning,
  },
  suspiciousTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  suspiciousDescription: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  infoCard: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  infoCardText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
    textAlign: 'center',
  },
  suspiciousDetails: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suspiciousDetailRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  suspiciousDetailLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  suspiciousDetailValue: {
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  footer: {
    width: '100%',
    padding: spacing.lg,
  },
  actionBtn: {
    width: '100%',
  },

  // Normal Başarı Ekranı Stilleri
  container: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  checkmarkIcon: {
    fontSize: 48,
    color: colors.success,
    fontFamily: typography.fontFamilyBold,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: typography.fontFamilyBold,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: typography.fontFamilyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  detailsCard: {
    backgroundColor: colors.successDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: typography.fontFamilyBold,
    color: '#fff',
    marginTop: 2,
  },
  personalGreeting: {
    fontSize: 14,
    fontFamily: typography.fontFamilyMedium,
    color: '#fff',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    width: '100%',
    marginTop: spacing.md,
  },
  doneButtonText: {
    color: colors.successDark,
    fontFamily: typography.fontFamilyBold,
  },
});
