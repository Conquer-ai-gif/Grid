import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import MeetingTypeList from '@/components/MeetingTypeList';
import { LiveNowBanner } from '@/components/LiveNowBanner';
import { LectureSearch } from '@/components/LectureSearch';

const Home = async () => {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now);

  // Fetch the next upcoming scheduled lecture from Supabase
  let upcomingText = 'No upcoming lectures scheduled';
  try {
    const user = await currentUser();
    if (user) {
      const university = (user.publicMetadata?.university as string) ?? '';
      let query = supabaseAdmin
        .from('lectures')
        .select('title, started_at')
        .gt('started_at', now.toISOString())
        .order('started_at', { ascending: true })
        .limit(1);

      if (university) query = query.ilike('university', university);

      const { data } = await query.single();

      if (data?.started_at) {
        const t = new Date(data.started_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        upcomingText = `Next lecture at ${t}${data.title ? ` — ${data.title}` : ''}`;
      }
    }
  } catch {
    // No upcoming lectures — keep default message
  }

  return (
    <section className="flex size-full flex-col gap-5 text-text-1">
      {/* Live Now banner — client component, shows ongoing lectures from the user's university */}
      <LiveNowBanner />

      {/* Lecture search */}
      <LectureSearch />

      {/* Hero banner */}
      <div className="relative w-full rounded-xl bg-surface-1 border border-border-1 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-1" />
        <div className="flex flex-col justify-between p-6 lg:p-10 min-h-[220px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-1 bg-amber-5 px-4 py-1.5 text-sm text-amber-1 w-fit">
            <span className="size-1.5 rounded-full bg-amber-1 animate-pulse-amber" />
            {upcomingText}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-extrabold text-text-1 lg:text-7xl tracking-tight tabular-nums">
              {time}
            </h1>
            <p className="text-base font-medium text-text-3 lg:text-xl">{date}</p>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;
