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
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import {colors, typography, spacing, radius} from '../theme';
import {getHistory, TransactionHistoryItem} from '../services/api';
import {getToken} from '../services/auth';
import Card from '../components/Card';
import {getQueue, getRejectedRecords, clearRejectedRecords, subscribeToQueueChanges} from '../services/offlineQueue';
import {isOnline} from '../services/connectivity';

interface ExtendedHistoryItem extends TransactionHistoryItem {
  isWaiting?: boolean;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<ExtendedHistoryItem[]>([]);
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoryData = async (targetPage: number, isRefresh: boolean = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const queue = await getQueue();
      const offlineItems: ExtendedHistoryItem[] = targetPage === 0 ? queue.map((item, idx) => ({
        id: -(idx + 1),
        type: item.type || 'GIRIS',
        timestamp: item.timestamp || new Date().toISOString(),
        locationName: item.method === 'QR' ? 'QR Kod (Çevrimdışı)' : 'GPS Konum (Çevrimdışı)',
        method: item.method,
        isWaiting: true,
      })) : [];

      if (!isOnline()) {
        console.log('[SYNC] Offline mode in HistoryScreen. Showing offline items only.');
        if (targetPage === 0) {
          setHistory(offlineItems);
          setIsLastPage(true);
        }
        return;
      }
      
      const token = await getToken();
      if (!token) {
        setError('Oturum anahtarı bulunamadı.');
        return;
      }

      try {
        const response = await getHistory(token, targetPage, 15);
        if (isRefresh) {
          setHistory([...offlineItems, ...response.content]);
        } else {
          setHistory(prev => {
            const onlinePrev = prev.filter(item => !item.isWaiting);
            return [...offlineItems, ...onlinePrev, ...response.content];
          });
        }
        setIsLastPage(response.last);
      } catch (err: any) {
        console.warn('[SYNC] Failed to fetch online history. Showing offline items only.', err);
        if (targetPage === 0) {
          setHistory(offlineItems);
          setIsLastPage(true);
        } else {
          throw err;
        }
      }
      
      setPage(targetPage);
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
    fetchHistoryData(0, true);

    const unsubscribeQueue = subscribeToQueueChanges(() => {
      fetchHistoryData(0, true);
      checkRejected();
    });

    return () => {
      unsubscribeQueue();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistoryData(0, true);
  };

  const handleLoadMore = () => {
    if (!isLastPage && !loading) {
      fetchHistoryData(page + 1);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {dateStr, timeStr};
    } catch {
      return {dateStr: 'Bilinmeyen Tarih', timeStr: '--:--'};
    }
  };

  const renderItem = ({item}: {item: ExtendedHistoryItem}) => {
    const isGiris = item.type === 'GIRIS';
    const {dateStr, timeStr} = formatTimestamp(item.timestamp);
    const indicatorColor = isGiris ? colors.success : colors.dark;

    return (
      <Card style={styles.itemCard}>
        {/* Sol Durum İşaretçisi */}
        <View style={[styles.indicator, {backgroundColor: indicatorColor}]} />

        <View style={styles.itemDetails}>
          <View style={styles.row}>
            <Text style={[styles.typeText, {color: indicatorColor}]}>
              {isGiris ? 'GİRİŞ' : 'ÇIKIŞ'}
            </Text>
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>

          <View style={styles.rowSub}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.locationName || 'Mobil Konum'}
            </Text>
            {item.isWaiting ? (
              <View style={styles.waitingBadge}>
                <Text style={styles.waitingText}>BEKLİYOR</Text>
              </View>
            ) : (
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>{item.method}</Text>
              </View>
            )}
          </View>

          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </Card>
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistoryData(0, true)}>
            <Text style={styles.retryButtonText}>TEKRAR DENE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
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
  typeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  locationText: {
    fontFamily: typography.fontFamilyBold,
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
  dateText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.8,
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
});
