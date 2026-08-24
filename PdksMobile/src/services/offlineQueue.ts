import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionLogRequest, syncTransactions, SyncResultResponse } from './api';
import { getOrCreateDeviceId } from './device';

const QUEUE_KEY = 'pdks_offline_queue';
const REJECTED_KEY = 'pdks_rejected_records';

let isSyncing = false;

// Simple listener registration to notify other parts of the app when sync changes or queue updates
type QueueChangeListener = () => void;
const listeners = new Set<QueueChangeListener>();

export const subscribeToQueueChanges = (listener: QueueChangeListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyQueueChanges = () => {
  listeners.forEach(l => {
    try {
      l();
    } catch (e) {
      console.error('[SYNC] Listener error:', e);
    }
  });
};

export const getQueue = async (): Promise<TransactionLogRequest[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[SYNC] Failed to read queue from storage:', e);
    return [];
  }
};

export const getQueueCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};

export const addToQueue = async (record: Omit<TransactionLogRequest, 'deviceId'>): Promise<void> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    const clientId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const fullRecord: TransactionLogRequest = {
      ...record,
      deviceId,
      clientId,
    };

    const queue = await getQueue();
    queue.push(fullRecord);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[SYNC] Record added to offline queue. ClientId: ${clientId}. Current count: ${queue.length}`);
    notifyQueueChanges();
  } catch (e) {
    console.error('[SYNC] Failed to add record to offline queue:', e);
  }
};

export const removeFromQueue = async (clientIds: string[]): Promise<void> => {
  try {
    const queue = await getQueue();
    const updated = queue.filter(item => !item.clientId || !clientIds.includes(item.clientId));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    console.log(`[SYNC] Removed clientIds from queue:`, clientIds);
    notifyQueueChanges();
  } catch (e) {
    console.error('[SYNC] Failed to remove items from queue:', e);
  }
};

export const getRejectedRecords = async (): Promise<SyncResultResponse[]> => {
  try {
    const raw = await AsyncStorage.getItem(REJECTED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[SYNC] Failed to read rejected records:', e);
    return [];
  }
};

export const clearRejectedRecords = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REJECTED_KEY);
  } catch (e) {
    console.error('[SYNC] Failed to clear rejected records:', e);
  }
};

export const syncQueue = async (token: string): Promise<void> => {
  if (isSyncing) {
    console.log('[SYNC] syncQueue is already running. Skipping.');
    return;
  }

  isSyncing = true;
  console.log('[SYNC] syncQueue started...');

  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      console.log('[SYNC] Queue is empty. Nothing to sync.');
      isSyncing = false;
      return;
    }

    console.log(`[SYNC] Sending ${queue.length} records to server for sync.`);
    const results = await syncTransactions(token, queue);

    const savedClientIds: string[] = [];
    const rejectedResults: SyncResultResponse[] = [];
    const rejectedClientIds: string[] = [];

    results.forEach(res => {
      if (res.status === 'SAVED') {
        savedClientIds.push(res.clientId);
      } else if (res.status === 'REJECTED') {
        rejectedClientIds.push(res.clientId);
        rejectedResults.push(res);
      }
    });

    console.log(`[SYNC] Sync complete. SAVED: ${savedClientIds.length}, REJECTED: ${rejectedClientIds.length}`);

    // Remove saved and rejected items from the offline queue
    const allRemoved = [...savedClientIds, ...rejectedClientIds];
    const remainingQueue = queue.filter(item => !item.clientId || !allRemoved.includes(item.clientId));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));

    // Append rejected results to pdks_rejected_records
    if (rejectedResults.length > 0) {
      const existingRejected = await getRejectedRecords();
      const updatedRejected = [...existingRejected, ...rejectedResults];
      await AsyncStorage.setItem(REJECTED_KEY, JSON.stringify(updatedRejected));
    }

    notifyQueueChanges();
  } catch (e) {
    // Network errors, timeouts, etc.
    console.warn('[SYNC] syncQueue encountered network or server error. Queue will be kept as-is.', e);
  } finally {
    isSyncing = false;
    console.log('[SYNC] syncQueue finished.');
  }
};
