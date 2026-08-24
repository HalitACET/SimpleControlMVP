import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import {colors, typography, spacing, radius} from '../theme';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import {removeToken, getToken} from '../services/auth';
import {useSession, clearSession} from '../store/session';
import {getDeviceName, verifyDevice, DeviceVerifyResponse} from '../services/device';
import {
  getNextAction,
  getMyTimesheetSummary,
  NextActionResponse,
  TimesheetSummaryResponse,
} from '../services/api';

const Skeleton = ({width, height, style}: {width?: number | string; height: number; style?: any}) => (
  <View style={[{backgroundColor: colors.border, borderRadius: radius.sm, width: width || '100%', height}, style]} />
);

export default function ProfileScreen({navigation}: {navigation: any}) {
  const {fullName, username, firmId} = useSession();
  const displayName = fullName || 'Personel';
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [nextAction, setNextAction] = useState<NextActionResponse | null>(null);
  const [summary, setSummary] = useState<TimesheetSummaryResponse | null>(null);
  const [deviceVerify, setDeviceVerify] = useState<DeviceVerifyResponse | null>(null);

  const subInfoParts = [
    username ? `@${username}` : null,
    'Personel',
  ].filter(Boolean);
  const subInfoText = subInfoParts.join(' · ');

  const loadData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [nextActionData, summaryData, deviceData] = await Promise.all([
        getNextAction(token).catch(e => { console.warn('Failed getNextAction:', e); return null; }),
        getMyTimesheetSummary(token).catch(e => { console.warn('Failed getMyTimesheetSummary:', e); return null; }),
        verifyDevice(token).catch(e => { console.warn('Failed verifyDevice:', e); return null; }),
      ]);

      if (nextActionData) setNextAction(nextActionData);
      if (summaryData) setSummary(summaryData);
      if (deviceData) setDeviceVerify(deviceData);
    } catch (e) {
      console.error('Error loading profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await removeToken();
    clearSession();
    navigation.replace('Login');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Oturumu Kapat',
      'Çıkmak istediğinize emin misiniz?',
      [
        {text: 'Vazgeç', style: 'cancel'},
        {text: 'Evet', style: 'destructive', onPress: handleLogout},
      ],
    );
  };

  const formatMinutes = (totalMin: number) => {
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hrs}s ${mins}dk`;
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
    } catch {
      return '';
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Work parameters
  const displayFirmId = firmId ? firmId.toUpperCase() : 'PDKS';
  const shiftText = nextAction?.shift
    ? `${nextAction.shift.name} · ${nextAction.shift.startTime}–${nextAction.shift.endTime}`
    : 'Atanmadı';

  let statusText = 'Dışarıda';
  let statusStyle = styles.statusOut;
  if (nextAction?.suggestedType === 'CIKIS') {
    const entryTime = formatTime(nextAction.lastTransaction?.timestamp);
    statusText = entryTime ? `İçeride (${entryTime}'den beri)` : 'İçeride';
    statusStyle = styles.statusIn;
  }

  // Device verify data
  const finalDeviceName = deviceVerify?.deviceName || getDeviceName();
  const regDate = formatDate(deviceVerify?.registeredAt);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      <ScreenHeader title="Profil" fullName={displayName} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }>
        {/* User Card */}
        <Card style={styles.profileCard}>
          <SectionLabel text="KULLANICI BİLGİLERİ" />
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.infoText}>{subInfoText}</Text>
        </Card>

        {/* Work Info Card */}
        <SectionLabel text="ÇALIŞMA BİLGİLERİ" style={styles.sectionLabel} />
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Firma</Text>
            <Text style={styles.rowValue}>{displayFirmId}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Vardiya</Text>
            <Text style={styles.rowValue}>{shiftText}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>Şu An</Text>
            <Text style={[styles.rowValue, statusStyle]}>{statusText}</Text>
          </View>
        </Card>

        {/* Timesheet Summary Card */}
        <SectionLabel text="BU AY" style={styles.sectionLabel} />
        {loading ? (
          <Card style={styles.infoCard}>
            <Skeleton height={20} width="60%" style={{marginBottom: spacing.sm}} />
            <Skeleton height={14} width="40%" style={{marginBottom: spacing.xs}} />
            <Skeleton height={14} width="50%" />
          </Card>
        ) : summary ? (
          summary.shiftName === null ? (
            <Card style={styles.infoCard}>
              <Text style={styles.noShiftText}>Vardiya atanmadığı için özet hesaplanamıyor.</Text>
            </Card>
          ) : (
            <Card style={styles.infoCard}>
              <Text style={styles.workedTitle}>
                Çalışılan: {formatMinutes(summary.workedMinutes)}
              </Text>
              <Text style={styles.expectedText}>
                Beklenen: {formatMinutes(summary.expectedMinutes)}
              </Text>
              
              {summary.lateDays === 0 && summary.incompleteDays === 0 ? (
                <Text style={[styles.statusText, {color: colors.success}]}>✓ Kayıtlar düzenli</Text>
              ) : (
                <View style={styles.statusCol}>
                  {summary.lateDays > 0 && (
                    <Text style={[styles.statusText, {color: colors.primaryDark}]}>
                      ⚠️ {summary.lateDays} gün geç kalma
                    </Text>
                  )}
                  {summary.incompleteDays > 0 && (
                    <Text style={[styles.statusText, {color: colors.danger}]}>
                      ⚠️ {summary.incompleteDays} gün eksik kayıt
                    </Text>
                  )}
                </View>
              )}
            </Card>
          )
        ) : null}

        {/* Registered Device Card */}
        <SectionLabel text="KAYITLI CİHAZ" style={styles.sectionLabel} />
        <Card style={styles.deviceCard}>
          <View style={styles.deviceRow}>
            <View style={{flex: 1}}>
              <Text style={styles.deviceNameText}>{finalDeviceName}</Text>
              {regDate !== '' && (
                <Text style={styles.deviceRegText}>Kayıt: {regDate}</Text>
              )}
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>● AKTİF</Text>
            </View>
          </View>
        </Card>
        <Text style={styles.deviceFooterText}>Cihaz değişikliği için İK birimine başvurun.</Text>

        {/* Account Settings */}
        <SectionLabel text="HESAP" style={styles.sectionLabel} />
        <Card style={styles.accountCard}>
          <TouchableOpacity
            style={styles.logoutRow}
            activeOpacity={0.7}
            onPress={handleLogoutPress}>
            <Text style={styles.logoutText}>Oturumu kapat</Text>
          </TouchableOpacity>
        </Card>

        {/* Version Information */}
        <Text style={styles.versionText}>PDKS Mobil v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  nameText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  infoText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statusIn: {
    color: colors.success,
  },
  statusOut: {
    color: colors.textSecondary,
  },
  // Bu Ay Card
  workedTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  expectedText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  statusCol: {
    marginTop: spacing.xs,
  },
  noShiftText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  // Kayıtlı Cihaz
  deviceCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceNameText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  deviceRegText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  activePillText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 11,
    color: colors.successDark,
  },
  deviceFooterText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.8,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  // Hesap
  accountCard: {
    backgroundColor: colors.surface,
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    color: colors.danger,
  },
  versionText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
