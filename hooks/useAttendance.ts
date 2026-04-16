'use client';

import { useEffect, useRef } from 'react';
import { useOfflineQueue } from './useOfflineQueue';

export function useAttendance(lectureId: string) {
  const { queueOrSend } = useOfflineQueue();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!lectureId || hasJoined.current) return;
    hasJoined.current = true;

    // Record join
    queueOrSend('/api/attendance', { lecture_id: lectureId, action: 'join' });

    // Record leave on unmount
    return () => {
      queueOrSend('/api/attendance', { lecture_id: lectureId, action: 'leave' });
    };
  }, [lectureId, queueOrSend]);
}
