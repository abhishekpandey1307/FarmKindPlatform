// =============================================================================
// TESTS — TRUE OFFLINE QUEUE & AUTO-SYNC ENGINE
// Validates persistent localStorage queue, idempotency, safe retries,
// and auto-flush reconciliation without duplicate records.
// =============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  enqueueOfflineMutation,
  getOfflineQueue,
  removeQueuedMutation,
  flushOfflineQueue,
  subscribeToOfflineQueue,
  clearOfflineQueueForTesting,
} from '../services/offlineSyncEngine';
import { addSolarBooking, getDatabaseState } from '../../server/db';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      store[key] = String(val);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

describe('True Offline Queue & Auto-Sync Engine', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
    vi.stubGlobal('navigator', { onLine: true });

    // Cleanly clear queue for each test
    clearOfflineQueueForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enqueues a persistent mutation into localStorage', () => {
    enqueueOfflineMutation({
      id: 'BK-TEST-001',
      type: 'CREATE_SOLAR_BOOKING',
      endpoint: '/api/bookings',
      method: 'POST',
      payload: {
        orderId: 'BK-TEST-001',
        farmerId: 'farmer-001',
        status: 'CONFIRMED',
      },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe('BK-TEST-001');
    expect(queue[0].type).toBe('CREATE_SOLAR_BOOKING');

    // Survives simulated refresh by reading directly from localStorage
    const raw = mockStorage.getItem('farmkind_offline_mutation_queue');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].id).toBe('BK-TEST-001');
  });

  it('guarantees idempotency: updates existing mutation rather than creating duplicates', () => {
    enqueueOfflineMutation({
      id: 'BK-DUP-99',
      type: 'CREATE_SOLAR_BOOKING',
      endpoint: '/api/bookings',
      method: 'POST',
      payload: { orderId: 'BK-DUP-99', hours: 2 },
    });

    // Enqueue second time with same ID
    enqueueOfflineMutation({
      id: 'BK-DUP-99',
      type: 'CREATE_SOLAR_BOOKING',
      endpoint: '/api/bookings',
      method: 'POST',
      payload: { orderId: 'BK-DUP-99', hours: 3 },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].payload.hours).toBe(3);
  });

  it('removes mutation from queue only when server confirms 200/201 success', async () => {
    enqueueOfflineMutation({
      id: 'BK-SYNC-OK',
      type: 'CREATE_SOLAR_BOOKING',
      endpoint: '/api/bookings',
      method: 'POST',
      payload: { orderId: 'BK-SYNC-OK' },
    });

    // Mock successful server response
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await flushOfflineQueue('http://localhost:3001');
    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(0);
    expect(getOfflineQueue().length).toBe(0);
  });

  it('keeps mutation in queue and increments retryCount if server returns 500 or network fails', async () => {
    enqueueOfflineMutation({
      id: 'BK-SYNC-FAIL',
      type: 'CREATE_SOLAR_BOOKING',
      endpoint: '/api/bookings',
      method: 'POST',
      payload: { orderId: 'BK-SYNC-FAIL' },
    });

    // Mock server error (e.g. Render cold start or 503)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await flushOfflineQueue('http://localhost:3001');
    expect(result.synced).toBe(0);
    expect(result.remaining).toBe(1);

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].retryCount).toBe(1);
  });

  it('notifies listeners when queue count changes', () => {
    let observedCount = -1;
    const unsub = subscribeToOfflineQueue(q => {
      observedCount = q.length;
    });

    enqueueOfflineMutation({
      id: 'NOTIF-1',
      type: 'RECORD_SOIL_TELEMETRY',
      endpoint: '/api/soil-log',
      method: 'POST',
      payload: { moisture: 34 },
    });

    expect(observedCount).toBe(1);
    removeQueuedMutation('NOTIF-1');
    expect(observedCount).toBe(0);
    unsub();
  });

  it('validates server-side idempotency: does not duplicate booking with same orderId', () => {
    const orderId = `SOLAR-IDEMP-${Date.now()}`;
    const bookingPayload = {
      orderId,
      farmerId: 'farmer-001',
      date: '2026-10-04',
      slotTime: '2:00 PM',
      dieselSavedLiters: 5,
      financialSavedInr: 450,
      status: 'CONFIRMED' as const,
    };

    // First insert
    const b1 = addSolarBooking(bookingPayload);
    // Second insert with same orderId (simulating replay)
    const b2 = addSolarBooking(bookingPayload);

    expect(b1.orderId).toBe(orderId);
    expect(b2.orderId).toBe(orderId);

    const db = getDatabaseState();
    const matches = db.solarBookings.filter(b => b.orderId === orderId);
    expect(matches.length).toBe(1); // Exactly 1, no duplicates
  });
});
