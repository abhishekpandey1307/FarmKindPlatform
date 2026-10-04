// =============================================================================
// FARMKIND — PERSISTENT OFFLINE QUEUE & AUTO-SYNC ENGINE
// Enables seamless offline operation in rural agricultural regions.
// Queues persistent server mutations in localStorage, survives reboots/refreshes,
// and automatically replays with idempotency when network connectivity returns.
// =============================================================================

export type OfflineMutationType =
  | 'CREATE_SOLAR_BOOKING'
  | 'UPDATE_FARMER_PROFILE'
  | 'RECORD_SOIL_TELEMETRY'
  | 'AUDIT_SMART_DECISION';

export interface QueuedMutation {
  id: string; // Unique idempotency key (e.g. orderId, decisionId, logId)
  type: OfflineMutationType;
  endpoint: string; // API route (e.g. /api/bookings, /api/farm-state)
  method: 'POST' | 'PUT';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
}

const STORAGE_KEY = 'farmkind_offline_mutation_queue';

// In-memory queue cache
let memoryQueue: QueuedMutation[] | null = null;
const listeners: Array<(queue: QueuedMutation[]) => void> = [];

/**
 * Loads pending mutations from localStorage.
 */
export function getOfflineQueue(): QueuedMutation[] {
  if (memoryQueue !== null) return memoryQueue;

  if (typeof window === 'undefined' || !window.localStorage) {
    memoryQueue = [];
    return memoryQueue;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryQueue = JSON.parse(raw) as QueuedMutation[];
    } else {
      memoryQueue = [];
    }
  } catch (err) {
    console.warn('[OfflineEngine] Failed to read queue from localStorage:', err);
    memoryQueue = [];
  }

  return memoryQueue;
}

/**
 * Persists the queue atomically to localStorage.
 */
function persistQueue(queue: QueuedMutation[]): void {
  memoryQueue = queue;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('[OfflineEngine] Failed to persist queue:', err);
    }
  }
  // Notify listeners
  listeners.forEach(fn => fn(queue));
}

/**
 * Subscribes to queue changes.
 */
export function subscribeToOfflineQueue(callback: (queue: QueuedMutation[]) => void): () => void {
  listeners.push(callback);
  callback(getOfflineQueue());
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/**
 * Adds a mutation to the persistent queue.
 * Guarantees idempotency: will not add duplicate ID if already pending.
 */
export function enqueueOfflineMutation(mutation: Omit<QueuedMutation, 'createdAt' | 'retryCount'>): void {
  const queue = getOfflineQueue();

  // Idempotency check: if an item with this ID is already in the queue, update its payload rather than duplicate
  const existingIdx = queue.findIndex(item => item.id === mutation.id);
  if (existingIdx !== -1) {
    queue[existingIdx] = {
      ...queue[existingIdx],
      ...mutation,
      lastAttemptAt: Date.now(),
    };
    persistQueue([...queue]);
    return;
  }

  const newEntry: QueuedMutation = {
    ...mutation,
    createdAt: Date.now(),
    retryCount: 0,
  };

  persistQueue([...queue, newEntry]);
}

/**
 * Removes a successfully synced mutation from the queue.
 */
export function removeQueuedMutation(id: string): void {
  const queue = getOfflineQueue();
  const nextQueue = queue.filter(item => item.id !== id);
  persistQueue(nextQueue);
}

/**
 * Resets the offline queue state (primarily for automated testing).
 */
export function clearOfflineQueueForTesting(): void {
  memoryQueue = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  listeners.forEach(fn => fn([]));
}

/**
 * Check if the browser currently reports online connectivity.
 */
export function isNetworkOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

// In-flight sync guard to prevent concurrent flush loops
let isSyncing = false;

/**
 * Flushes the persistent offline queue to the server.
 * Replays mutations sequentially. Only removes an item once the server confirms success (HTTP 200/201).
 * Never blocks the UI or throws uncaught errors.
 */
export async function flushOfflineQueue(
  baseUrl: string,
  onSyncProgress?: (pendingCount: number) => void
): Promise<{ synced: number; remaining: number }> {
  if (isSyncing) return { synced: 0, remaining: getOfflineQueue().length };
  if (!isNetworkOnline()) return { synced: 0, remaining: getOfflineQueue().length };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  isSyncing = true;
  let synced = 0;

  try {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    // Process mutations in FIFO order
    for (const item of [...queue]) {
      if (!isNetworkOnline()) break;

      const targetUrl = `${cleanBaseUrl}${item.endpoint}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per request

        const res = await fetch(targetUrl, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': item.id,
          },
          body: JSON.stringify(item.payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Server confirmed success (200 OK or 201 Created)
        if (res.ok) {
          removeQueuedMutation(item.id);
          synced++;
          if (onSyncProgress) onSyncProgress(getOfflineQueue().length);
        } else if (res.status >= 400 && res.status < 500 && res.status !== 408) {
          // Client error that cannot be resolved by retrying (e.g. 400 bad data), remove to avoid queue poison
          console.warn(`[OfflineEngine] Dropping unrecoverable mutation ${item.id} (HTTP ${res.status})`);
          removeQueuedMutation(item.id);
        } else {
          // 5xx Server error or gateway timeout - keep in queue for next flush
          item.retryCount++;
          item.lastAttemptAt = Date.now();
          persistQueue([...getOfflineQueue()]);
          break; // Stop loop and retry later to preserve order
        }
      } catch (networkErr) {
        // Network dropped midway or aborted; update item and stop flush loop
        item.retryCount++;
        item.lastAttemptAt = Date.now();
        persistQueue([...getOfflineQueue()]);
        break;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, remaining: getOfflineQueue().length };
}

/**
 * Initializes automatic background synchronization.
 * Hooks into window 'online' events and periodically flushes when online.
 */
export function initializeAutoSync(
  getBaseUrl: () => string,
  onQueueUpdate?: (count: number) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    const url = getBaseUrl();
    flushOfflineQueue(url).then(result => {
      if (result.synced > 0) {
        console.log(`[OfflineEngine] 🔄 Auto-synced ${result.synced} offline actions with cloud.`);
      }
    });
  };

  window.addEventListener('online', handleOnline);

  // Subscribe to queue changes to notify UI
  const unsubscribeQueue = subscribeToOfflineQueue(q => {
    if (onQueueUpdate) onQueueUpdate(q.length);
  });

  // Attempt initial sync on boot if online
  if (isNetworkOnline()) {
    setTimeout(handleOnline, 1500);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    unsubscribeQueue();
  };
}
