'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface QueuedEvent {
  id: string;
  endpoint: string;
  body: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'yoom_offline_queue';
const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQueue = (): QueuedEvent[] => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    } catch {
      return [];
    }
  };

  const saveQueue = (queue: QueuedEvent[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueSize(queue.length);
  };

  // Queue an API call for later if offline
  const queueOrSend = useCallback(async (endpoint: string, body: unknown): Promise<boolean> => {
    if (isOnline) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok;
      } catch {
        // Network error - queue it
      }
    }

    // Offline - add to queue
    const queue = loadQueue();
    queue.push({
      id: crypto.randomUUID(),
      endpoint,
      body,
      timestamp: Date.now(),
      retries: 0,
    });
    saveQueue(queue);
    return false;
  }, [isOnline]);

  // Attempt to drain the queue
  const syncQueue = useCallback(async () => {
    if (!isOnline) return;

    const queue = loadQueue();
    if (queue.length === 0) return;

    const remaining: QueuedEvent[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(item.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body),
        });

        if (!res.ok && item.retries < MAX_RETRIES) {
          remaining.push({ ...item, retries: item.retries + 1 });
        }
      } catch {
        if (item.retries < MAX_RETRIES) {
          remaining.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    saveQueue(remaining);
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Periodic sync attempt every 30s
    syncIntervalRef.current = setInterval(syncQueue, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncQueue]);

  return { isOnline, queueSize, queueOrSend, syncQueue };
}
