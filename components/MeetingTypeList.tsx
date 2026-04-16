'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Plus, Link2, CalendarDays, Video } from 'lucide-react';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { useUserRole } from '@/hooks/useUserRole';

const initialValues = { dateTime: new Date(), description: '', link: '', department: '' };

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();
  const { isLecturer, isLoaded, department: lecturerDepartment } = useUserRole();

  // Pre-fill department with the lecturer's own department when they open a modal
  function openModal(state: typeof meetingState) {
    setValues({ ...initialValues, department: lecturerDepartment });
    setMeetingState(state);
  }

  const createMeeting = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) { toast({ title: 'Please select a date and time' }); return; }

      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');

      const startsAt = values.dateTime.toISOString();
      const description = values.description || 'Instant Meeting';

      await call.getOrCreate({ data: { starts_at: startsAt, custom: { description } } });
      setCallDetail(call);

      try {
        await fetch('/api/lectures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stream_call_id: call.id,
            title: description,
            description: values.description || undefined,
            // Empty string = All Departments (null stored in DB)
            department: values.department.trim() || null,
            // Trigger live notifications only for instant meetings, not scheduled ones
            is_live: meetingState === 'isInstantMeeting',
          }),
        });
      } catch { console.warn('Could not save lecture record'); }

      if (!values.description) router.push(`/meeting/${call.id}`);
      toast({ title: 'Meeting created — you are the lecturer' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create meeting' });
    }
  };

  if (!client || !user || !isLoaded) return <Loader />;

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  // Shared department field used in both instant and schedule modals
  const departmentField = (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-text-2">
        Department
        <span className="ml-2 text-xs opacity-50">— leave blank for all departments</span>
      </label>
      <Input
        value={values.department}
        onChange={(e) => setValues({ ...values, department: e.target.value })}
        placeholder="e.g. Computer Science, Medicine…"
        className="border border-border-1 bg-surface-2 text-text-1 focus-visible:ring-0 placeholder:text-text-3"
      />
    </div>
  );

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Lecturer-only cards */}
      {isLecturer && (
        <>
          <HomeCard icon={Plus}         title="New Meeting"  description="Start an instant meeting"    handleClick={() => openModal('isInstantMeeting')} />
          <HomeCard icon={CalendarDays} title="Schedule"     description="Plan your lecture ahead"     handleClick={() => openModal('isScheduleMeeting')} />
        </>
      )}

      {/* Shared cards */}
      <HomeCard icon={Link2} title="Join Meeting"  description="Join via invitation link"    handleClick={() => setMeetingState('isJoiningMeeting')} />
      <HomeCard icon={Video} title="Recordings"   description="View past lecture recordings" handleClick={() => router.push('/recordings')} />

      {/* Schedule modal */}
      {!callDetail ? (
        <MeetingModal isOpen={meetingState === 'isScheduleMeeting'} onClose={() => setMeetingState(undefined)} title="Schedule a lecture" handleClick={createMeeting}>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-2">Description</label>
            <Textarea className="border border-border-1 bg-surface-2 text-text-1 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-text-3" onChange={(e) => setValues({ ...values, description: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-2">Date and Time</label>
            <ReactDatePicker selected={values.dateTime} onChange={(date) => setValues({ ...values, dateTime: date! })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} timeCaption="time" dateFormat="MMMM d, yyyy h:mm aa" className="w-full rounded-lg bg-surface-2 border border-border-1 p-2.5 text-text-1 focus:outline-none focus:border-amber-1 text-sm" />
          </div>
          {departmentField}
        </MeetingModal>
      ) : (
        <MeetingModal isOpen={meetingState === 'isScheduleMeeting'} onClose={() => setMeetingState(undefined)} title="Lecture scheduled" handleClick={() => { navigator.clipboard.writeText(meetingLink); toast({ title: 'Link copied' }); }} image="/icons/checked.svg" buttonIcon="/icons/copy.svg" className="text-center" buttonText="Copy lecture link" />
      )}

      {/* Join modal */}
      <MeetingModal isOpen={meetingState === 'isJoiningMeeting'} onClose={() => setMeetingState(undefined)} title="Join via link" className="text-center" buttonText="Join lecture" handleClick={() => router.push(values.link)}>
        <Input placeholder="Paste meeting link here" onChange={(e) => setValues({ ...values, link: e.target.value })} className="border border-border-1 bg-surface-2 text-text-1 focus-visible:ring-0 placeholder:text-text-3" />
      </MeetingModal>

      {/* Instant meeting modal */}
      <MeetingModal isOpen={meetingState === 'isInstantMeeting'} onClose={() => setMeetingState(undefined)} title="Start instant lecture" className="text-center" buttonText="Start now" handleClick={createMeeting}>
        {departmentField}
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
