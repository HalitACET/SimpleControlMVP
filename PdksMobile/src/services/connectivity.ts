import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from './offlineQueue';
import { getToken } from './auth';

let currentOnline = true; // Default to online until NetInfo updates
const connectivityListeners = new Set<(online: boolean) => void>();

export const isOnline = (): boolean => currentOnline;

export const subscribeToConnectivity = (listener: (online: boolean) => void) => {
  connectivityListeners.add(listener);
  // Send current state immediately
  listener(currentOnline);
  return () => {
    connectivityListeners.delete(listener);
  };
};

const notifyConnectivity = (online: boolean) => {
  connectivityListeners.forEach(l => {
    try {
      l(online);
    } catch (e) {
      console.error('[SYNC] Connectivity listener error:', e);
    }
  });
};

// Monitor network state
NetInfo.addEventListener(state => {
  const nextOnline = !!state.isConnected && state.isInternetReachable !== false;
  const changed = currentOnline !== nextOnline;
  currentOnline = nextOnline;

  if (changed) {
    console.log(`[SYNC] Network connectivity changed. Online: ${currentOnline}`);
    notifyConnectivity(currentOnline);
  }

  // If online, always trigger sync in background (it will exit early if queue is empty or isSyncing is true)
  if (currentOnline) {
    getToken().then(token => {
      if (token) {
        syncQueue(token);
      }
    }).catch(e => {
      console.warn('[SYNC] Failed to retrieve token for auto sync:', e);
    });
  }
});

// Initial check and auto sync on startup
NetInfo.fetch().then(state => {
  currentOnline = !!state.isConnected && state.isInternetReachable !== false;
  console.log(`[SYNC] Initial connectivity check. Online: ${currentOnline}`);
  if (currentOnline) {
    getToken().then(token => {
      if (token) {
        syncQueue(token);
      }
    });
  }
});

// Periodic sync polling to ensure sync happens dynamically even if initial NetInfo events are premature
setInterval(async () => {
  try {
    if (currentOnline) {
      const token = await getToken();
      if (token) {
        await syncQueue(token);
      }
    }
  } catch (e) {
    // ignore
  }
}, 10000); // 10 seconds

