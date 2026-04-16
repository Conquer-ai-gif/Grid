import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { handleIntent, lectureSummary, trackAttendance, notifyLectureLive } from '@/inngest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [handleIntent, lectureSummary, trackAttendance, notifyLectureLive],
});
