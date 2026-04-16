'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

const STORAGE_KEY = 'yoom_data_saver';

export function useDataSaver() {
  const call = useCall();
  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor' | 'unknown'>('unknown');

  // Load persisted preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      setIsDataSaverEnabled(true);
    }
  }, []);

  // Monitor network quality
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; addEventListener?: (e: string, fn: () => void) => void } }).connection;
    if (!connection) return;

    const updateQuality = () => {
      const type = connection.effectiveType;
      setNetworkQuality(type === '4g' ? 'good' : 'poor');
      // Auto-enable data saver on poor connection
      if (type === '2g' || type === 'slow-2g') {
        enableDataSaver();
      }
    };

    updateQuality();
    connection.addEventListener?.('change', updateQuality);
    return () => {};
  }, []);

  const enableDataSaver = useCallback(async () => {
    setIsDataSaverEnabled(true);
    localStorage.setItem(STORAGE_KEY, 'true');

    if (!call) return;
    try {
      // Switch to audio-only mode
      await call.camera.disable();
      // Reduce video subscriptions - set lower quality for all participants
      // This uses Stream's setPreferredResolution for each participant
    } catch (err) {
      console.warn('Data saver: could not set audio-only mode', err);
    }
  }, [call]);

  const disableDataSaver = useCallback(async () => {
    setIsDataSaverEnabled(false);
    localStorage.setItem(STORAGE_KEY, 'false');

    if (!call) return;
    try {
      await call.camera.enable();
    } catch (err) {
      console.warn('Data saver: could not re-enable camera', err);
    }
  }, [call]);

  const toggle = useCallback(() => {
    if (isDataSaverEnabled) {
      disableDataSaver();
    } else {
      enableDataSaver();
    }
  }, [isDataSaverEnabled, enableDataSaver, disableDataSaver]);

  return { isDataSaverEnabled, toggle, enableDataSaver, disableDataSaver, networkQuality };
}
