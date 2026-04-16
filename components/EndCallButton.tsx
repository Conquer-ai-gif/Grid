'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import { PhoneOff } from 'lucide-react';

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  if (!call) throw new Error('useStreamCall must be used within a StreamCall component.');

  const isMeetingOwner = localParticipant && call.state.createdBy && localParticipant.userId === call.state.createdBy.id;
  if (!isMeetingOwner) return null;

  const endCall = async () => {
    await call.endCall();
    router.push('/');
  };

  return (
    <button
      onClick={endCall}
      className="flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-600/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/30 transition-all"
    >
      <PhoneOff size={16} />
      End lecture
    </button>
  );
};

export default EndCallButton;
