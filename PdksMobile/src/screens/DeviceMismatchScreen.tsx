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
import {colors, typography, spacing, radius} from '../theme';
import InfoListCard from '../components/InfoListCard';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'DeviceMismatch'>;

export default function DeviceMismatchScreen({navigation}: Props) {
  const handleHrContact = () => {
    Alert.alert('İK İletişim', 'İK: 0262 555 00 00');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}>
        
        {/* Yuvarlak Telefon İkonu */}
        <View style={styles.iconCircle}>
          <Text style={styles.phoneIcon}>📱</Text>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>Bu Cihaz Kayıtlı Değil</Text>

        {/* Açıklama */}
        <Text style={styles.description}>
          Hesabınız başka bir telefona kayıtlı. Güvenlik nedeniyle geçişler yalnızca kayıtlı cihazdan yapılabilir.
        </Text>

        {/* Bilgilendirme Listesi */}
        <InfoListCard
          title="NE YAPMALIYIM?"
          items={[
            'Telefonunuz yenilendiyse İK birimine başvurun.',
            'İK cihaz kaydınızı sıfırladıktan sonra bu telefondan giriş yapabilirsiniz.',
            'Bu sırada geçişinizi kapı görevlisine yaptırabilirsiniz.',
          ]}
        />
        
        {/* Alt Butonlar */}
        <View style={styles.footer}>
          <Button
            title="İK BİRİMİNE BAŞVUR"
            onPress={handleHrContact}
            variant="primary"
            style={styles.actionBtn}
          />
          <Button
            title="GİRİŞ EKRANINA DÖN"
            onPress={() => navigation.replace('Login')}
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  phoneIcon: {
    fontSize: 48,
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
