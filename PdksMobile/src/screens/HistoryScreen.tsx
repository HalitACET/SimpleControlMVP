import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import {colors, typography, spacing, radius} from '../theme';
import {getMyDaily, getMyScans} from '../services/api';
import {DailyItem, ScanHistoryItem} from '../types/api';
import {getToken} from '../services/auth';
import Card from '../components/Card';
import {getQueue, getRejectedRecords, clearRejectedRecords, subscribeToQueueChanges} from '../services/offlineQueue';
import {isOnline, subscribeToConnectivity} from '../services/connectivity';

interface ExtendedHistoryItem extends ScanHistoryItem {
  isWaiting?: boolean;
}

export default function HistoryScreen() {
  const [dailyItems, setDailyItems] = useState<DailyItem[]>([]);
  const [offlineItems, setOfflineItems] = useState<ExtendedHistoryItem[]>([]);
  const [daysLoaded, setDaysLoaded] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dayScansMap, setDayScansMap] = useState<Record<string, ScanHistoryItem[]>>({});
  const [loadingDay, setLoadingDay] = useState<string | null>(null);

  const CHUNK_DAYS = 14;
  const MAX_DAYS = 90;

  const fetchOfflineQueue = async () => {
    try {
      const queue = await getQueue();
      const offline = queue.map((item: any, idx: number) => ({
        id: -(idx + 1),
        scannedAt: item.timestamp || new Date().toISOString(),
        locationName: item.method === 'QR' ? 'QR Kod (Çevrimdışı)' : 'GPS Konum (Çevrimdışı)',
        method: item.method as 'QR' | 'GPS',
        suspicious: false,
        excluded: false,
        isWaiting: true,
      }));
      setOfflineItems(offline);
    } catch (e) {
      console.warn('Failed to fetch offline queue', e);
    }
  };

  const calculateDates = (loaded: number) => {
    const today = new Date();
    // to date is today - loaded days
    const toDate = new Date(today);
    toDate.setDate(today.getDate() - loaded);
    
    // from date is toDate - (CHUNK_DAYS - 1)
    const fromDate = new Date(toDate);
    fromDate.setDate(toDate.getDate() - (CHUNK_DAYS - 1));
    
    return {
      toStr: toDate.toISOString().split('T')[0],
      fromStr: fromDate.toISOString().split('T')[0],
    };
  };

  const fetchDailyData = async (isRefresh: boolean = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      await fetchOfflineQueue();

      if (!isOnline()) {
        console.log('[SYNC] Offline mode in HistoryScreen.');
        if (isRefresh) {
          setDailyItems([]);
          setDaysLoaded(0);
        }
        return;
      }
      
      const token = await getToken();
      if (!token) {
        setError('Oturum anahtarı bulunamadı.');
        return;
      }

      const targetLoaded = isRefresh ? 0 : daysLoaded;
      
      if (targetLoaded >= MAX_DAYS) {
        setIsLastPage(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { fromStr, toStr } = calculateDates(targetLoaded);

      try {
        const response = await getMyDaily(token, fromStr, toStr);
        // Filter out GELECEK
        const filtered = response.filter(item => item.status !== 'GELECEK');
        
        if (isRefresh) {
          setDailyItems(filtered);
          setDaysLoaded(CHUNK_DAYS);
          setIsLastPage(false);
        } else {
          setDailyItems(prev => {
            const newItems = filtered.filter(item => !prev.some(p => p.date === item.date));
            return [...prev, ...newItems];
          });
          setDaysLoaded(targetLoaded + CHUNK_DAYS);
          if (targetLoaded + CHUNK_DAYS >= MAX_DAYS) {
            setIsLastPage(true);
          }
        }
      } catch (err: any) {
        console.warn('Failed to fetch online daily data.', err);
        throw err;
      }
      
    } catch (err: any) {
      console.warn('Fetch history failed:', err);
      setError(err.message || 'Geçmiş listesi alınamadı.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkRejected = async () => {
      try {
        const rejected = await getRejectedRecords();
        if (rejected.length > 0) {
          await clearRejectedRecords();
        }
      } catch (e) {
        console.warn('[SYNC] Failed to check rejected records:', e);
      }
    };

    checkRejected();
    fetchDailyData(true);

    const clearTodayCache = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      setDayScansMap(prev => {
        if (prev[todayStr]) {
          const newMap = { ...prev };
          delete newMap[todayStr];
          return newMap;
        }
        return prev;
      });
    };

    const unsubscribeQueue = subscribeToQueueChanges(() => {
      fetchOfflineQueue();
      checkRejected();
      clearTodayCache();
    });

    const unsubscribeNetwork = subscribeToConnectivity((status: boolean) => {
      if (status) {
        fetchDailyData(true);
        clearTodayCache();
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeNetwork();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDailyData(true);
  };

  const handleLoadMore = () => {
    if (!isLastPage && !loading && dailyItems.length > 0 && isOnline()) {
      fetchDailyData(false);
    }
  };

  const toggleDayExpansion = async (dateStr: string, scanCount: number) => {
    if (scanCount === 0) return;
    
    if (expandedDate === dateStr) {
      setExpandedDate(null);
      return;
    }
    
    setExpandedDate(dateStr);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    
    if ((!dayScansMap[dateStr] || isToday) && isOnline()) {
      try {
        setLoadingDay(dateStr);
        const token = await getToken();
        if (token) {
          const response = await getMyScans(token, 0, 50, dateStr, dateStr);
          setDayScansMap(prev => ({ ...prev, [dateStr]: response.content }));
        }
      } catch (e) {
        console.warn('Failed to load day scans', e);
      } finally {
        setLoadingDay(null);
      }
    }
  };

  const formatMinutes = (totalMin: number) => {
    if (totalMin === 0) return '0dk';
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0 && mins > 0) return `${hrs}s ${mins}dk`;
    if (hrs > 0) return `${hrs}s`;
    return `${mins}dk`;
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
    } catch {
      return isoDate;
    }
  };

  const formatTimeOnly = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
    } catch {
      return '--:--';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return colors.success;
      case 'EKSIK_CIKIS': return colors.warning;
      case 'DEVAMSIZ': return colors.danger;
      case 'TATIL':
      case 'GRUP_ATANMAMIS': return colors.textSecondary;
      default: return colors.dark;
    }
  };

  const renderScanItem = (scan: ScanHistoryItem | ExtendedHistoryItem) => {
    const isExcluded = scan.excluded;
    const isWaiting = (scan as ExtendedHistoryItem).isWaiting;
    const timeStr = formatTimeOnly(scan.scannedAt);
    
    return (
      <View key={`scan-${isWaiting ? 'offline' : 'online'}-${scan.id}`} style={[styles.scanRow, isExcluded && styles.excludedScanRow]}>
        <View style={styles.scanTimeCol}>
          <Text style={[styles.scanTimeText, isExcluded && styles.strikethrough]}>{timeStr}</Text>
        </View>
        <View style={styles.scanDetailsCol}>
          <View style={styles.scanLocationRow}>
            <Text style={styles.scanLocationText} numberOfLines={1}>{scan.locationName || 'Mobil Konum'}</Text>
            {isWaiting ? (
              <View style={styles.waitingBadge}>
                <Text style={styles.waitingText}>BEKLİYOR</Text>
              </View>
            ) : isExcluded ? (
              <View style={styles.excludedBadge}>
                <Text style={styles.excludedText}>İPTAL</Text>
              </View>
            ) : scan.suspicious ? (
              <View style={styles.suspiciousBadge}>
                <Text style={styles.suspiciousText}>ŞÜPHELİ</Text>
              </View>
            ) : (
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>{scan.method}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDailyItem = ({item}: {item: DailyItem}) => {
    const isExpanded = expandedDate === item.date;
    const indicatorColor = getStatusColor(item.status);
    const dateLabel = formatDateLabel(item.date);
    const isClickable = item.scanCount > 0;
    
    let timeRange = '';
    let mainStatusNote = '';
    
    if (item.status === 'NORMAL') {
      timeRange = `${formatTimeOnly(item.entryTime)} → ${formatTimeOnly(item.exitTime)}`;
      mainStatusNote = item.workedMinutes ? formatMinutes(item.workedMinutes) : '';
    } else if (item.status === 'EKSIK_CIKIS') {
      timeRange = `${formatTimeOnly(item.entryTime)} → —`;
      mainStatusNote = 'Çıkış kaydı yok';
    } else if (item.status === 'DEVAMSIZ') {
      mainStatusNote = 'Devamsız';
    } else if (item.status === 'TATIL') {
      mainStatusNote = 'Tatil';
    } else if (item.status === 'GRUP_ATANMAMIS') {
      mainStatusNote = 'Çalışma grubu atanmamış';
    }
    
    const showDetails = isExpanded && item.scanCount > 0;
    const scansForDay = dayScansMap[item.date];
    const isLoadingScans = loadingDay === item.date;

    return (
      <TouchableOpacity 
        activeOpacity={isClickable ? 0.7 : 1} 
        onPress={() => toggleDayExpansion(item.date, item.scanCount)}
      >
        <Card style={styles.itemCard}>
          <View style={[styles.indicator, {backgroundColor: indicatorColor}]} />

          <View style={styles.itemDetails}>
            {/* Top row: Date and Shift */}
            <View style={styles.rowSub}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              {item.shiftName && <Text style={styles.shiftText}>{item.shiftName}</Text>}
            </View>
            
            {/* Main row: Time range and main status note */}
            <View style={styles.row}>
              <Text style={[styles.timeText, {color: indicatorColor}]}>{timeRange}</Text>
              <Text style={styles.mainStatusText}>{mainStatusNote}</Text>
            </View>
            
            {/* Notes row: Late, Early, Overtime */}
            {(item.lateMinutes! > 0 || item.earlyExitMinutes! > 0 || item.overtimeMinutes! > 0) && (
              <View style={styles.notesRow}>
                {item.lateMinutes! > 0 && <Text style={styles.noteText}>{formatMinutes(item.lateMinutes!)} geç</Text>}
                {item.earlyExitMinutes! > 0 && <Text style={styles.noteText}>{formatMinutes(item.earlyExitMinutes!)} erken çıkış</Text>}
                {item.overtimeMinutes! > 0 && <Text style={styles.noteText}>{formatMinutes(item.overtimeMinutes!)} fazla mesai</Text>}
              </View>
            )}
            
            {/* Accordion Details */}
            {showDetails && (
              <View style={styles.accordionContainer}>
                <View style={styles.divider} />
                {isLoadingScans ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{marginVertical: spacing.sm}} />
                ) : scansForDay && scansForDay.length > 0 ? (
                  scansForDay.map(scan => renderScanItem(scan))
                ) : (
                  <Text style={styles.emptyScansText}>Kayıt bulunamadı.</Text>
                )}
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (offlineItems.length === 0) return null;
    
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineTitle}>Bekleyen Kayıtlar</Text>
        {offlineItems.map(item => (
          <Card key={`offline-card-${item.id}`} style={[styles.itemCard, {marginBottom: spacing.sm}]}>
            <View style={[styles.indicator, {backgroundColor: colors.dark}]} />
            <View style={styles.itemDetails}>
              {renderScanItem(item)}
            </View>
          </Card>
        ))}
        <View style={styles.headerDivider} />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !refreshing) return null;
    if (offlineItems.length > 0) return null; // We have offline items, so screen isn't completely empty
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>⏳</Text>
        <Text style={styles.emptyTitle}>Henüz hareket yok</Text>
        <Text style={styles.emptySub}>Giriş ve çıkışlarınız burada listelenecektir.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.dark} barStyle="light-content" />
      <ScreenHeader title="Geçmiş" />
      
      {error && !refreshing ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDailyData(true)}>
            <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dailyItems}
          keyExtractor={(item) => `day-${item.date}`}
          renderItem={renderDailyItem}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  indicator: {
    width: 6,
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  shiftText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
  },
  mainStatusText: {
    fontFamily: typography.fontFamilySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  noteText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
  },
  accordionContainer: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  excludedScanRow: {
    opacity: 0.5,
  },
  scanTimeCol: {
    width: 50,
  },
  scanTimeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  scanDetailsCol: {
    flex: 1,
  },
  scanLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanLocationText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  methodBadge: {
    backgroundColor: '#ECEAE4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  methodText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    color: colors.textSecondary,
  },
  suspiciousBadge: {
    backgroundColor: '#FDECEA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F9C8C4',
  },
  suspiciousText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    color: colors.danger,
  },
  excludedBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  excludedText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    color: colors.textSecondary,
  },
  waitingBadge: {
    backgroundColor: '#FFEFA6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E6D385',
  },
  waitingText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 10,
    color: '#7A6200',
  },
  emptyScansText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  offlineContainer: {
    marginBottom: spacing.sm,
  },
  offlineTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  loaderContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.dark,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: typography.fontFamilyBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
