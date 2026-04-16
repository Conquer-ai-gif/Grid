'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UseRoleOptions {
  lectureId?: string;   // stream_call_id or lecture UUID
}

export function useRole({ lectureId }: UseRoleOptions = {}) {
  const { user, isLoaded } = useUser();
  const [isLecturer, setIsLecturer] = useState(false);
  const [isChecking, setIsChecking] = useState(!!lectureId);

  useEffect(() => {
    if (!isLoaded || !user || !lectureId) {
      setIsChecking(false);
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/lectures/role?call_id=${lectureId}`);
        if (res.ok) {
          const { is_lecturer } = await res.json();
          setIsLecturer(is_lecturer);
        }
      } catch {
        setIsLecturer(false);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [isLoaded, user, lectureId]);

  return {
    isLecturer,
    isParticipant: !isLecturer,
    isChecking,
    isLoaded,
    userId: user?.id,
  };
}
