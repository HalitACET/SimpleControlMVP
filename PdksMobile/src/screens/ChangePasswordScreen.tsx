import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {changePassword} from '../services/api';
import {colors, typography, spacing, radius} from '../theme';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({navigation, route}: Props) {
  const {token} = route.params;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'old' | 'new' | 'confirm' | null>(null);

  // Canlı Şifre Doğrulama Kuralları
  const isRule1Ok = newPassword.length >= 8;
  const isRule2Ok = /\d/.test(newPassword);
  const isRule3Ok = newPassword !== oldPassword && oldPassword.length > 0 && newPassword.length > 0;
  
  const allRulesOk = isRule1Ok && isRule2Ok && isRule3Ok;

  const handleChangePassword = async () => {
    setErrorMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Tüm alanları doldurunuz.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (!allRulesOk) {
      setErrorMessage('Lütfen tüm şifre kurallarını karşılayın.');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(oldPassword, newPassword, token);
      navigation.replace('Home', {fullName: '', token});
    } catch (error: any) {
      setErrorMessage(error.message ?? 'Şifre değiştirilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRuleRow = (text: string, isMet: boolean) => {
    return (
      <View style={styles.ruleRow}>
        <View style={[styles.ruleCircle, isMet && styles.ruleCircleActive]}>
          {isMet && <Text style={styles.ruleCheck}>✓</Text>}
        </View>
        <Text style={[styles.ruleText, isMet && styles.ruleTextActive]}>
          {text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      
      {/* Üst Antrasit Başlık Bloğu */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Yeni şifre belirleyin</Text>
        <Text style={styles.headerSubtitle}>
          İlk girişinizde güvenliğiniz için şifrenizi yenilemeniz gerekiyor.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          
          <View style={styles.form}>
            {/* Mevcut Şifre */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>MEVCUT ŞİFRE</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'old' && styles.inputFocused,
                ]}
                placeholder="Mevcut Şifre"
                placeholderTextColor={colors.textSecondary}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                onFocus={() => setFocusedField('old')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Yeni Şifre */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>YENİ ŞİFRE</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'new' && styles.inputFocused,
                ]}
                placeholder="Yeni Şifre"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                onFocus={() => setFocusedField('new')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Yeni Şifre Tekrar */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>YENİ ŞİFRE (TEKRAR)</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'confirm' && styles.inputFocused,
                ]}
                placeholder="Yeni Şifre Tekrar"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Şifre Kural Kartı */}
            <Card style={styles.rulesCard}>
              <SectionLabel text="ŞİFRE KURALLARI" />
              <View style={styles.rulesList}>
                {renderRuleRow('En az 8 karakter', isRule1Ok)}
                {renderRuleRow('En az 1 rakam', isRule2Ok)}
                {renderRuleRow('Eski şifrenizden farklı olmalı', isRule3Ok)}
              </View>
            </Card>

            {errorMessage !== '' && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <Button
              title="ŞİFREYİ KAYDET"
              onPress={handleChangePassword}
              variant="primary"
              loading={isLoading}
              disabled={!allRulesOk || isLoading}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBanner: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkElevated,
  },
  headerTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    color: colors.textOnDark,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textOnDarkMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 54,
    fontSize: 15,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  rulesCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  rulesList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  ruleCircleActive: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  ruleCheck: {
    color: '#fff',
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
  },
  ruleText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
  },
  ruleTextActive: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMedium,
  },
  errorText: {
    fontFamily: typography.fontFamilyBold,
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  saveBtn: {
    width: '100%',
  },
});
