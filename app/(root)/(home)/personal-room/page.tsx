'use client';

import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import { Copy, Video } from 'lucide-react';
import { useGetCallById } from '@/hooks/useGetCallById';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Row = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-border-1 bg-surface-1 px-4 py-3 xl:flex-row xl:items-center">
    <h2 className="min-w-40 text-sm font-medium text-amber-1">{title}</h2>
    <p className="text-sm text-text-2 break-all">{description}</p>
  </div>
);

const PersonalRoom = () => {
  const router = useRouter();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  const meetingId = user?.id;
  const { call } = useGetCallById(meetingId!);
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  const startRoom = async () => {
    if (!client || !user) return;
    const newCall = client.call('default', meetingId!);
    if (!call) {
      await newCall.getOrCreate({ data: { starts_at: new Date().toISOString() } });
    }
    router.push(`/meeting/${meetingId}?personal=true`);
  };

  return (
    <section className="flex size-full flex-col gap-6 text-text-1">
      <h1 className="text-3xl font-bold text-text-1">Personal Room</h1>
      <div className="flex w-full flex-col gap-3 xl:max-w-[900px]">
        <Row title="Topic" description={`${user?.username ?? user?.id}'s Personal Room`} />
        <Row title="Meeting ID" description={meetingId ?? '—'} />
        <Row title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex gap-3">
        <Button onClick={startRoom} className="bg-amber-1 hover:bg-amber-4 text-black font-bold gap-2">
          <Video size={16} /> Start Meeting
        </Button>
        <Button
          onClick={() => { navigator.clipboard.writeText(meetingLink); toast({ title: 'Link copied' }); }}
          className="bg-surface-1 border border-border-1 hover:border-amber-1 text-text-2 gap-2"
        >
          <Copy size={16} /> Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;
