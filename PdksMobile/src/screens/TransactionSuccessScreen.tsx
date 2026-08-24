import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {colors, typography, spacing, radius} from '../theme';
import Button from '../components/Button';
import {getFullName} from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionSuccess'>;

export default function TransactionSuccessScreen({route, navigation}: Props) {
  const {type, timestamp, locationName, isOffline} = route.params;
  const [firstName, setFirstName] = useState<string>('Personel');
 
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
 
  const isGiris = type === 'GIRIS';
  const successText = isGiris ? 'GİRİŞ YAPILDI' : 'ÇIKIŞ YAPILDI';
  const subtitleText = isOffline 
    ? 'İnternet yok — kaydınız cihazda saklandı, bağlantı gelince gönderilecek.'
    : (isGiris ? 'Artık içeridesiniz' : 'İyi günler');
  const timeText = formatTime(timestamp);
  const dateText = formatDate(timestamp);
  const locationText = isOffline
    ? 'Kaydedildi (senkronize bekliyor)'
    : (locationName ? locationName : '● Doğrulandı (GPS)');

  const handleDone = () => {
    navigation.popToTop();
  };

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
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>KONUM</Text>
            <Text style={styles.detailValue}>{locationText}</Text>
          </View>
        </View>

        <Text style={styles.personalGreeting}>
          İyi çalışmalar, {firstName}!
        </Text>
      </View>

      <Button
        title="Ana Sayfaya Dön"
        onPress={handleDone}
        variant="outline"
        style={styles.doneButton}
        textStyle={styles.doneButtonText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    // Hafif parlama efekti
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: spacing.xs,
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
