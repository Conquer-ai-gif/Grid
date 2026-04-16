import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

interface LiveLecture {
  callId: string;
  title: string;
  participantCount: number;
  call: Call;
}

export function useLiveLectures() {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const university = (user?.publicMetadata?.university as string) ?? '';
  const department = (user?.publicMetadata?.department as string) ?? '';

  useEffect(() => {
    if (!client || !user?.id || !university) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Step 1 — get all lecture call IDs for this user's university+department from Supabase
        const params = new URLSearchParams({ university });
        if (department) params.set('department', department);
        const res = await fetch(`/api/lectures?${params.toString()}`);
        const { lectures } = await res.json();

        if (!Array.isArray(lectures) || lectures.length === 0) {
          setLiveLectures([]);
          return;
        }

        const lectureMap = new Map<string, string>(
          lectures.map((l: { stream_call_id: string; title: string }) => [l.stream_call_id, l.title])
        );

        // Step 2 — query Stream for ongoing calls only
        const { calls: ongoingCalls } = await client.queryCalls({
          filter_conditions: { ongoing: true },
          sort: [{ field: 'started_at', direction: -1 }],
          limit: 20,
        });

        // Step 3 — intersect: only show live calls that belong to this university
        const live: LiveLecture[] = ongoingCalls
          .filter((c) => lectureMap.has(c.id))
          .map((c) => ({
            callId: c.id,
            title: lectureMap.get(c.id) ?? 'Live Lecture',
            participantCount: c.state?.participantCount ?? 0,
            call: c,
          }));

        setLiveLectures(live);
      } catch (err) {
        console.error('[useLiveLectures]', err);
        setLiveLectures([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();

    // Poll every 30 seconds so the banner stays fresh without a page reload
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [client, user?.id, university, department]);

  return { liveLectures, isLoading };
}
