import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  const university = (user?.publicMetadata?.university as string) ?? '';
  const department = (user?.publicMetadata?.department as string) ?? '';

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;
      setIsLoading(true);
      try {
        // Fetch call IDs scoped to this user's university AND department from Supabase.
        // department filter returns lectures for this department + "all departments" (null)
        let allowedCallIds: Set<string> | null = null;

        if (university) {
          const params = new URLSearchParams({ university });
          if (department) params.set('department', department);

          const res = await fetch(`/api/lectures?${params.toString()}`);
          if (res.ok) {
            const { lectures } = await res.json();
            if (Array.isArray(lectures) && lectures.length > 0) {
              allowedCallIds = new Set(
                (lectures as { stream_call_id: string }[]).map((l) => l.stream_call_id)
              );
            }
          }
        }

        // Fetch from Stream
        const { calls: streamCalls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });

        // Filter to university + department scope.
        // Graceful fallback: if no Supabase records yet, show all Stream calls.
        const filtered =
          allowedCallIds && allowedCallIds.size > 0
            ? streamCalls.filter((c) => allowedCallIds!.has(c.id))
            : streamCalls;

        setCalls(filtered);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id, university, department]);

  const now = new Date();

  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  return { endedCalls, upcomingCalls, callRecordings: calls, isLoading };
};
