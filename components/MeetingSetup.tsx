'use client';

import { useEffect, useState } from 'react';
import { DeviceSettings, VideoPreview, useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { MicOff, Mic } from 'lucide-react';
import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({ setIsSetupComplete }: { setIsSetupComplete: (value: boolean) => void }) => {
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived = callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;
  const call = useCall();

  if (!call) throw new Error('useStreamCall must be used within a StreamCall component.');

  const [isMicCamToggled, setIsMicCamToggled] = useState(false);

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  if (callTimeNotArrived)
    return <Alert title={`This lecture hasn't started yet. Scheduled for ${callStartsAt.toLocaleString()}`} />;

  if (callHasEnded)
    return <Alert title="This lecture has ended." iconUrl="/icons/call-ended.svg" />;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-black text-text-1">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-text-1">Ready to join?</h1>
        <p className="text-sm text-text-3">Check your camera and microphone before joining</p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border-1">
        <VideoPreview />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-border-1 bg-surface-1 px-4 py-2.5 text-sm text-text-2 hover:border-amber-1 transition-all">
          {isMicCamToggled ? <MicOff size={16} className="text-amber-1" /> : <Mic size={16} className="text-text-3" />}
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
            className="hidden"
          />
          {isMicCamToggled ? 'Join with mic & camera off' : 'Mic & camera on'}
        </label>
        <DeviceSettings />
      </div>

      <Button
        className="bg-amber-1 hover:bg-amber-4 text-black font-bold px-8 py-2.5 rounded-xl"
        onClick={() => { call.join(); setIsSetupComplete(true); }}
      >
        Join lecture
      </Button>
    </div>
  );
};

export default MeetingSetup;
