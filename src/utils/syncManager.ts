/**
 * Sync Manager - Handles offline-to-online data synchronization
 * This module manages the sync queue and ensures data consistency
 */

import {
  getUnsyncedItems,
  markSyncQueueAsSynced,
} from '../database/db.web';

interface SyncItem {
  id: string;
  action: string;
  table_name: string;
  data: string;
  timestamp: string;
  synced: number;
}

/**
 * Check if device is connected to internet
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    // Simple online check - in production, use @react-native-community/netinfo
    return true; // For demo purposes, assume always online
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

/**
 * Sync all pending items to backend
 * In a real app, this would call your backend API
 */
export const syncPendingItems = async (): Promise<void> => {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('Device is offline, skipping sync');
      return;
    }

    const unsyncedItems = await getUnsyncedItems();

    if (unsyncedItems.length === 0) {
      console.log('No items to sync');
      return;
    }

    console.log(`Syncing ${unsyncedItems.length} items...`);

    for (const item of unsyncedItems) {
      try {
        await syncItem(item);
        await markSyncQueueAsSynced(item.id);
        console.log(`Synced item: ${item.id}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        // Continue with next item even if one fails
      }
    }

    console.log('Sync completed');
  } catch (error) {
    console.error('Error during sync:', error);
  }
};

/**
 * Sync a single item
 * In production, this would call your backend API
 */
const syncItem = async (item: SyncItem): Promise<void> => {
  const data = JSON.parse(item.data);

  // Simulate API call
  // In production, replace this with actual API call to your backend
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`Syncing ${item.action} on ${item.table_name}:`, data);
      // Simulate success
      resolve();
    }, 500);
  });
};

/**
 * Start periodic sync (every 5 minutes)
 */
export const startPeriodicSync = (): NodeJS.Timeout => {
  return setInterval(() => {
    syncPendingItems().catch((error) => {
      console.error('Periodic sync error:', error);
    });
  }, 5 * 60 * 1000); // 5 minutes
};

/**
 * Stop periodic sync
 */
export const stopPeriodicSync = (intervalId: NodeJS.Timeout): void => {
  clearInterval(intervalId);
};

/**
 * Sync on app resume
 */
export const syncOnAppResume = async (): Promise<void> => {
  console.log('App resumed, checking for pending syncs...');
  await syncPendingItems();
};

/**
 * Get sync status
 */
export const getSyncStatus = async (): Promise<{
  isOnline: boolean;
  pendingItems: number;
}> => {
  const online = await isOnline();
  const unsyncedItems = await getUnsyncedItems();

  return {
    isOnline: online,
    pendingItems: unsyncedItems.length,
  };
};

export default {
  isOnline,
  syncPendingItems,
  startPeriodicSync,
  stopPeriodicSync,
  syncOnAppResume,
  getSyncStatus,
};
