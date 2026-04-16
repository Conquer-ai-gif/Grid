'use client';

import { useState, useEffect } from 'react';
import {
  CallControls, CallParticipantsList, CallStatsButton,
  CallingState, PaginatedGridLayout, SpeakerLayout,
  useCallStateHooks, useParticipants,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutGrid, Clipboard, Eye, X, LayoutList } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';
import { DataSaverToggle } from './DataSaverToggle';
import { PollWidget } from './polls/PollWidget';
import { QuizWidget } from './polls/QuizWidget';
import { Whiteboard } from './whiteboard/Whiteboard';
import { LectureAssistant } from './ai/LectureAssistant';
import { useRole } from '@/hooks/useRole';
import { useAttendance } from '@/hooks/useAttendance';
import { Poll, Quiz } from '@/types';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';
type SidePanel = 'participants' | 'whiteboard' | 'polls' | null;

const MeetingRoom = ({ lectureId }: { lectureId?: string }) => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const { isLecturer, isChecking } = useRole({ lectureId });
  const participants = useParticipants();

  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userVote, setUserVote] = useState<number | undefined>(undefined);
  const [whiteboardAccess] = useState(false);

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useAttendance(lectureId ?? '');

  useEffect(() => {
    if (participants.length > 15) setLayout('speaker-left');
  }, [participants.length]);

  if (callingState !== CallingState.JOINED || isChecking) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid': return <PaginatedGridLayout />;
      case 'speaker-right': return <SpeakerLayout participantsBarPosition="left" />;
      default: return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  const togglePanel = (panel: SidePanel) => setSidePanel((p) => p === panel ? null : panel);

  if (isFocusMode) {
    return (
      <section className="relative h-screen w-full bg-black text-text-1">
        <div className="flex h-full items-center justify-center"><SpeakerLayout participantsBarPosition="right" /></div>
        <button onClick={() => setIsFocusMode(false)} className="absolute top-4 right-4 flex items-center gap-2 rounded-xl bg-surface-1 border border-border-1 px-4 py-2 text-sm text-text-2 hover:border-amber-1">
          <X size={16} /> Exit focus
        </button>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-text-1 bg-black">
      {/* Role badge */}
      <div className={cn('absolute top-4 left-4 z-40 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        isLecturer ? 'border-amber-1 bg-amber-5 text-amber-1' : 'border-border-1 bg-surface-1 text-text-3')}>
        <span className={cn('size-1.5 rounded-full', isLecturer ? 'bg-amber-1' : 'bg-text-3')} />
        {isLecturer ? 'Lecturer' : 'Participant'}
      </div>

      <div className="relative flex size-full items-center justify-center">
        <div className={cn('flex size-full max-w-[1000px] items-center', sidePanel && 'max-w-[680px]')}>
          <CallLayout />
        </div>

        {sidePanel && (
          <div className="h-[calc(100vh-86px)] w-[320px] ml-2 overflow-y-auto rounded-xl bg-surface-1 border border-border-1 p-3 space-y-3">
            {sidePanel === 'participants' && <CallParticipantsList onClose={() => setSidePanel(null)} />}
            {sidePanel === 'whiteboard' && lectureId && <Whiteboard lectureId={lectureId} canDraw={isLecturer || whiteboardAccess} />}
            {sidePanel === 'polls' && (
              <div className="space-y-3">
                {activePoll && <PollWidget poll={activePoll} onVote={(idx) => setUserVote(idx)} userVote={userVote} />}
                {activeQuiz && <QuizWidget quiz={activeQuiz} onAnswer={(c) => console.log('correct:', c)} />}
                {!activePoll && !activeQuiz && <p className="py-8 text-center text-sm text-text-3">No active polls or quizzes</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {activePoll && sidePanel !== 'polls' && (
        <button onClick={() => setSidePanel('polls')} className="fixed top-20 right-6 z-40 rounded-xl bg-amber-1 px-4 py-2 text-sm font-bold text-black shadow-lg animate-pulse-amber">
          Poll active — tap to vote
        </button>
      )}

      <div className="fixed bottom-0 flex w-full flex-wrap items-center justify-center gap-2 pb-4 px-4 bg-gradient-to-t from-black/80 to-transparent pt-6">
        <CallControls onLeave={() => router.push('/')} />

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer rounded-xl bg-surface-1 border border-border-1 px-3 py-2 hover:border-amber-1 transition-all">
            <LayoutGrid size={18} className="text-text-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-border-1 bg-surface-1 text-text-1">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, i) => (
              <div key={i}>
                <DropdownMenuItem className="hover:text-amber-1 focus:text-amber-1 cursor-pointer" onClick={() => setLayout(item.toLowerCase() as CallLayoutType)}>{item}</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <CallStatsButton />

        <button onClick={() => togglePanel('participants')} className={cn('rounded-xl border px-3 py-2 transition-all', sidePanel === 'participants' ? 'bg-amber-5 border-amber-1' : 'bg-surface-1 border-border-1 hover:border-amber-1')}>
          <Users size={18} className={sidePanel === 'participants' ? 'text-amber-1' : 'text-text-2'} />
        </button>

        {lectureId && (
          <button onClick={() => togglePanel('whiteboard')} className={cn('rounded-xl border px-3 py-2 transition-all', sidePanel === 'whiteboard' ? 'bg-amber-5 border-amber-1' : 'bg-surface-1 border-border-1 hover:border-amber-1')}>
            <Clipboard size={18} className={sidePanel === 'whiteboard' ? 'text-amber-1' : 'text-text-2'} />
          </button>
        )}

        <button onClick={() => togglePanel('polls')} className={cn('rounded-xl border px-3 py-2 transition-all', sidePanel === 'polls' ? 'bg-amber-5 border-amber-1' : 'bg-surface-1 border-border-1 hover:border-amber-1')}>
          <LayoutList size={18} className={sidePanel === 'polls' ? 'text-amber-1' : 'text-text-2'} />
        </button>

        <button onClick={() => setIsFocusMode(true)} className="rounded-xl border border-border-1 bg-surface-1 px-3 py-2 hover:border-amber-1 transition-all">
          <Eye size={18} className="text-text-2" />
        </button>

        <DataSaverToggle />
        {!isPersonalRoom && <EndCallButton />}
      </div>

      {lectureId && <LectureAssistant lectureId={lectureId} />}
    </section>
  );
};

export default MeetingRoom;
