import { inngest } from './client';
import { supabaseAdmin } from '@/lib/supabase';

export const notifyLectureLive = inngest.createFunction(
  { id: 'notify-lecture-live', retries: 2 },
  { event: 'app/lecture.live' },
  async ({ event, step }) => {
    const { lecture_id, lecturer_id, university, department, title } = event.data as {
      lecture_id: string;
      lecturer_id: string;
      university: string;
      department: string | null;
      title: string;
    };

    await step.run('fetch-students', async () => {
      let query = supabaseAdmin
        .from('platform_users')
        .select('id')
        .eq('role', 'student')
        .neq('id', lecturer_id);

      if (university) query = query.ilike('university', university);
      if (department) query = query.ilike('department', department);

      const { data: students, error } = await query;
      if (error || !students?.length) return;

      const notifications = students.map((s) => ({
        user_id: s.id,
        title: 'Lecture is Live',
        body: `"${title || 'A lecture'}" is now live. Join now!`,
        type: 'lecture_live',
        lecture_id,
        read: false,
        created_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('notifications').insert(notifications);
    });

    return { success: true, lecture_id };
  }
);
