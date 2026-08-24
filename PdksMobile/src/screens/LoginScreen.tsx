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
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {login} from '../services/api';
import {saveToken, saveFullName, saveFirmId} from '../services/auth';
import {
  getOrCreateDeviceId,
  getDeviceName,
  registerDevice,
} from '../services/device';
import {setSession} from '../store/session';
import {colors, typography, spacing, radius} from '../theme';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const [firmId, setFirmId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'firm' | 'username' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!firmId.trim() || !username.trim() || !password.trim()) {
      setErrorMessage('Tüm alanları doldurunuz.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const deviceId = await getOrCreateDeviceId();

      const response = await login(
        firmId.trim(),
        username.trim(),
        password,
        deviceId,
      );

      await saveToken(response.token);
      await saveFullName(response.fullName);
      await saveFirmId(firmId.trim());

      setSession({
        fullName: response.fullName,
        role: response.role,
        firmId: firmId.trim(),
        username: username.trim(),
      });

      if (!response.deviceRegistered) {
        try {
          await registerDevice(response.token);

          const deviceName = getDeviceName();
          Alert.alert(
            'Cihaz Kaydedildi',
            `${deviceName} cihazınız hesabınıza güvenli şekilde eşleştirildi. Bundan sonra giriş işlemleri yalnızca bu cihazdan yapılabilir.`,
            [
              {
                text: 'Tamam',
                onPress: () => navigateAfterLogin(response),
              },
            ],
          );
          return;
        } catch {
          navigateAfterLogin(response);
        }
      } else {
        navigateAfterLogin(response);
      }
    } catch (error: any) {
      if (error.isDeviceMismatch) {
        navigation.replace('DeviceMismatch');
        return;
      }
      setErrorMessage(error.message ?? 'Giriş yapılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateAfterLogin = (response: {
    mustChangePassword: boolean;
    fullName: string;
    token: string;
  }) => {
    if (response.mustChangePassword) {
      navigation.replace('ChangePassword', {token: response.token});
    } else {
      navigation.replace('Home', {
        fullName: response.fullName,
        token: response.token,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      
      {/* Üst Antrasit Logo Barı */}
      <View style={styles.headerBanner}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>AM</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>PDKS Mobil</Text>
          <Text style={styles.headerSubtitle}>Personel giriş-çıkış sistemi</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          
          <Text style={styles.welcomeText}>Hoş geldiniz</Text>

          {/* Form Alanı */}
          <View style={styles.form}>
            {/* Firma Kodu Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>FİRMA KODU</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'firm' && styles.inputFocused,
                ]}
                placeholder="Firma Kodu"
                placeholderTextColor={colors.textSecondary}
                value={firmId}
                onChangeText={setFirmId}
                autoCapitalize="characters"
                onFocus={() => setFocusedField('firm')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Kullanıcı Adı Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>KULLANICI ADI</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedField === 'username' && styles.inputFocused,
                ]}
                placeholder="Kullanıcı Adı"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Şifre Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>ŞİFRE</Text>
              <View
                style={[
                  styles.passwordContainer,
                  focusedField === 'password' && styles.inputFocused,
                ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Şifre"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.toggleShowPassword}
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>
                    {showPassword ? 'GİZLE' : 'GÖSTER'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {errorMessage !== '' && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <Button
              title="GİRİŞ YAP"
              onPress={handleLogin}
              variant="primary"
              loading={isLoading}
              style={styles.loginBtn}
            />

            <Text style={styles.infoText}>
              Şifrenizi unuttuysanız İK birimine başvurun.
            </Text>
          </View>
        </ScrollView>

        {/* En Alt Sorun Bildirim Metni */}
        <Text style={styles.footerText}>
          Sorun mu yaşıyorsunuz? İK birimine başvurun.
        </Text>
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
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.darkElevated,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.textOnDark,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textOnDarkMuted,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  welcomeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 54,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontFamily: typography.fontFamilyMedium,
    color: colors.textPrimary,
    height: '100%',
  },
  toggleShowPassword: {
    height: '100%',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: typography.fontFamilyBold,
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  loginBtn: {
    width: '100%',
    marginTop: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});
