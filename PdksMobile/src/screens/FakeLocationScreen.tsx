import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {colors, typography, spacing} from '../theme';
import InfoListCard from '../components/InfoListCard';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'FakeLocation'>;

export default function FakeLocationScreen({navigation}: Props) {
  const handleHrContact = () => {
    Alert.alert('İK İletişim', 'İK: 0262 555 00 00');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}>
        
        {/* Hata İkonu */}
        <View style={styles.iconCircle}>
          <Text style={styles.alertIcon}>!</Text>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>Geçiş kaydedilemedi</Text>

        {/* Açıklama */}
        <Text style={styles.description}>
          Cihazınızdaki konum bilgisi güvenilir görünmüyor. Konumu değiştiren bir uygulama açık olabilir veya tesis sınırları dışında olabilirsiniz.
        </Text>

        {/* Bilgilendirme Listesi */}
        <InfoListCard
          title="NE YAPMALIYIM?"
          items={[
            'Sahte konum (mock location) uygulamalarını kapatın.',
            'Telefonu yeniden başlatıp tekrar deneyin.',
            'Sorun sürerse kapı görevlisine veya İK birimine başvurun.',
          ]}
        />
        
        {/* Alt Butonlar */}
        <View style={styles.footer}>
          <Button
            title="TEKRAR DENE"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.actionBtn}
          />
          <Button
            title="KAPI GÖREVLİSİNE BAŞVUR"
            onPress={handleHrContact}
            variant="outline"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: '#FCA5A5', // açık kırmızı sınır
    backgroundColor: '#FEE2E2', // açık kırmızı zemin
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  alertIcon: {
    fontSize: 48,
    fontFamily: typography.fontFamilyBold,
    color: colors.danger,
  },
  title: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
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
});
