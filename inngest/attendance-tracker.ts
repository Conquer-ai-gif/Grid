import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase';

export const trackAttendance = inngest.createFunction(
  { id: 'track-attendance', retries: 2 },
  { event: 'app/attendance.update' },
  async ({ event, step }) => {
    const { lecture_id, user_id, action, timestamp } = event.data as {
      lecture_id: string;
      user_id: string;
      action: 'join' | 'leave';
      timestamp: string;
    };

    if (action === 'join') {
      await step.run('record-join', async () => {
        await supabaseAdmin.from('attendance').upsert(
          { lecture_id, user_id, joined_at: timestamp, created_at: timestamp },
          { onConflict: 'lecture_id,user_id' }
        );
      });
    } else {
      await step.run('record-leave', async () => {
        // Find the attendance record and calculate duration
        const { data } = await supabaseAdmin
          .from('attendance')
          .select('joined_at')
          .eq('lecture_id', lecture_id)
          .eq('user_id', user_id)
          .single();

        if (data?.joined_at) {
          const joinedAt = new Date(data.joined_at).getTime();
          const leftAt = new Date(timestamp).getTime();
          const durationSeconds = Math.floor((leftAt - joinedAt) / 1000);

          await supabaseAdmin
            .from('attendance')
            .update({ left_at: timestamp, duration_seconds: durationSeconds })
            .eq('lecture_id', lecture_id)
            .eq('user_id', user_id);
        }
      });
    }

    return { success: true, lecture_id, user_id, action };
  }
);
