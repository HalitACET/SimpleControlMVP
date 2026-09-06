import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {getToken, removeToken} from '../services/auth';
import {getNextAction, getMyDaily} from '../services/api';
import {NextActionResponse, DailyItem} from '../types/api';
import {useSession, clearSession} from '../store/session';
import {colors, typography, spacing, radius} from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isOnline, subscribeToConnectivity} from '../services/connectivity';
import {getQueueCount, subscribeToQueueChanges} from '../services/offlineQueue';

type Props = any;

// ─── Özel İkon Çizimleri ──────────────────────────────────────────────────────

const QrGridIcon = ({color}: {color: string}) => (
  <View style={styles.qrIconContainer}>
    <View style={styles.qrDotRow}>
      <View style={[styles.qrDot, {backgroundColor: color}]} />
      <View style={[styles.qrDot, {backgroundColor: color}]} />
    </View>
    <View style={styles.qrDotRow}>
      <View style={[styles.qrDot, {backgroundColor: color}]} />
      <View style={[styles.qrDot, {backgroundColor: color}]} />
    </View>
  </View>
);

const GpsTargetIcon = ({color}: {color: string}) => (
  <View style={[styles.gpsIconContainer, {borderColor: color}]}>
    <View style={[styles.gpsDot, {backgroundColor: color}]} />
  </View>
);

// ──────────────────────────────────────────────────────────────────────────────

export default function HomeScreen({navigation}: Props) {
  const isFocused = useIsFocused();
  const {fullName: sessionFullName} = useSession();
  const fullName = sessionFullName || 'Personel';
  const [nextAction, setNextAction] = useState<NextActionResponse | null>(null);
  const [dailyItem, setDailyItem] = useState<DailyItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [online, setOnline] = useState<boolean>(isOnline());
  const [queueCount, setQueueCount] = useState<number>(0);

  // Subscribe to connectivity and queue size changes
  useEffect(() => {
    const unsubscribeConn = subscribeToConnectivity(onlineState => {
      setOnline(onlineState);
    });

    const updateQueueCount = async () => {
      const count = await getQueueCount();
      setQueueCount(count);
    };
    updateQueueCount();
    const unsubscribeQueue = subscribeToQueueChanges(updateQueueCount);

    return () => {
      unsubscribeConn();
      unsubscribeQueue();
    };
  }, []);

  const loadOfflineData = async () => {
    try {
      const cached = await AsyncStorage.getItem('pdks_next_action_cache');
      if (cached) {
        setNextAction(JSON.parse(cached));
      } else {
        setNextAction(null);
      }
    } catch (e) {
      console.error('[SYNC] Failed to load offline action state:', e);
    }
  };

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      if (!isOnline()) {
        await loadOfflineData();
        return;
      }

      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      const data = await getNextAction(token);
      setNextAction(data);
      // Cache data
      await AsyncStorage.setItem('pdks_next_action_cache', JSON.stringify(data));

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyResp = await getMyDaily(token, todayStr, todayStr);
        if (dailyResp && dailyResp.length > 0) {
          setDailyItem(dailyResp[0]);
        } else {
          setDailyItem(null);
        }
      } catch (e) {
        setDailyItem(null);
      }

    } catch (err: any) {
      if (err.isDeviceMismatch) {
        navigation.replace('DeviceMismatch');
        return;
      }
      if (err.isUnauthorized) {
        await removeToken();
        clearSession();
        navigation.replace('Login');
        return;
      }
      console.warn('Failed to load home data:', err);
      await loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  // Reload action state whenever focused or online/queueCount transitions
  useEffect(() => {
    if (isFocused) {
      loadData(false);
    }
  }, [isFocused, online, queueCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  // Helper to format time (HH:mm) from LocalDateTime string
  const formatTime = (tsStr?: string) => {
    if (!tsStr) return '';
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

  const formatMinutes = (totalMin: number) => {
    if (totalMin === 0) return '0dk';
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0 && mins > 0) return `${hrs}s ${mins}dk`;
    if (hrs > 0) return `${hrs}s`;
    return `${mins}dk`;
  };

  let todayDuration = '—';
  let sinceText = '';
  
  if (!online || !dailyItem) {
    todayDuration = '—';
  } else if (dailyItem.status === 'TATIL') {
    todayDuration = 'Tatil';
  } else if (dailyItem.entryTime && dailyItem.exitTime) {
    todayDuration = dailyItem.workedMinutes ? formatMinutes(dailyItem.workedMinutes) : '—';
    sinceText = `${formatTime(dailyItem.entryTime)} – ${formatTime(dailyItem.exitTime)}`;
  } else if (dailyItem.entryTime && !dailyItem.exitTime) {
    todayDuration = 'Devam ediyor';
    sinceText = `${formatTime(dailyItem.entryTime)}'den beri`;
  }

  const renderStatusCard = () => {
    if (loading) {
      return (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </Card>
      );
    }

    const isInside = nextAction?.suggestedType === 'CIKIS';
    const statusText = isInside ? 'İÇERİDESİNİZ' : 'DIŞARIDASINIZ';
    const last = nextAction?.lastScan;
    
    let lastText = 'Henüz geçiş kaydı yok';
    if (last) {
      const timeText = formatTime(last.scannedAt);
      const locText = last.locationName || last.method || 'GPS';
      lastText = `Son okutma: ${timeText} · ${locText}`;
    }

    return (
      <Card variant={isInside ? 'success' : 'dark'} style={styles.statusCard}>
        <View style={styles.statusHeaderRow}>
          <SectionLabel text="ŞU ANKİ DURUMUNUZ" onDark />
          {queueCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>
                ● SENKRONİZE BEKLİYOR · {queueCount} KAYIT
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.statusText}>{statusText}</Text>
        <Text style={styles.lastText}>
          <Text style={{color: isInside ? '#FFF' : colors.primary}}>● </Text>
          {lastText}
        </Text>
        {!online && (
          <Text style={styles.lastText}>
            <Text style={{color: colors.warning}}>⚠ </Text>
            Durum son bağlantıdan beri güncellenmedi
          </Text>
        )}
      </Card>
    );
  };

  const actionText = nextAction?.suggestedType === 'CIKIS' ? 'ÇIKIŞ' : 'GİRİŞ';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      {!online && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            İnternet yok — geçişleriniz cihazda kaydedilecek.
          </Text>
        </View>
      )}
      <ScreenHeader
        title={`Merhaba, ${fullName.split(' ')[0]}`}
        fullName={fullName}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {renderStatusCard()}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.qrButton]}
            disabled={loading}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('QrScan')}>
            <QrGridIcon color={colors.textOnPrimary} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>QR İLE {actionText}</Text>
              <Text style={styles.actionSubtext}>Kapıdaki kodu okutun</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.gpsButton]}
            disabled={loading}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('GpsTransaction')}>
            <GpsTargetIcon color={colors.textOnDark} />
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonText, {color: colors.textOnDark}]}>
                KONUM İLE {actionText}
              </Text>
              <Text style={[styles.actionSubtext, {color: colors.textOnDarkMuted}]}>
                Tesis alanındayken kullanın
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Card style={styles.bottomCard}>
            <SectionLabel text="Vardiya" />
            <Text style={styles.bottomCardValue}>
              {nextAction?.todayShift 
                ? `${nextAction.todayShift.startTime} – ${nextAction.todayShift.endTime}` 
                : nextAction?.holiday 
                  ? 'Bugün tatil' 
                  : 'Vardiya atanmadı'}
            </Text>
            {nextAction?.todayShift ? (
              <Text style={styles.bottomCardSub}>{nextAction.todayShift.name} vardiyası</Text>
            ) : null}
          </Card>
          
          <Card style={styles.bottomCard}>
            <SectionLabel text="Bugün" />
            <Text style={styles.bottomCardValue}>{todayDuration}</Text>
            {sinceText !== '' && (
              <Text style={styles.bottomCardSub}>{sinceText}</Text>
            )}
          </Card>
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
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    backgroundColor: colors.surface,
  },
  statusCard: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  statusText: {
    color: colors.textOnDark,
    fontFamily: typography.fontFamilyBold,
    fontSize: 28,
    marginVertical: spacing.xs,
  },
  lastText: {
    color: colors.textOnDarkMuted,
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  qrButton: {
    backgroundColor: colors.primary,
  },
  gpsButton: {
    backgroundColor: colors.dark,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    color: colors.textOnPrimary,
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  actionSubtext: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 11,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bottomCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 110,
    justifyContent: 'center',
  },
  bottomCardValue: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  bottomCardSub: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qrIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.md,
  },
  qrDotRow: {
    flexDirection: 'row',
    gap: 4,
  },
  qrDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  gpsIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  offlineBanner: {
    backgroundColor: '#FFEFA6',
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D385',
  },
  offlineBannerText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 12,
    color: '#7A6200',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  syncBadge: {
    backgroundColor: 'rgba(255, 239, 166, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 239, 166, 0.4)',
  },
  syncBadgeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    color: '#FFEFA6',
  },
});
