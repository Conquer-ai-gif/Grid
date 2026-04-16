'use client';

import CallList from '@/components/CallList';
import { LectureSearch } from '@/components/LectureSearch';

const RecordingsPage = () => {
  return (
    <section className="flex size-full flex-col gap-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Recordings</h1>
        <LectureSearch />
      </div>

      <CallList type="recordings" />
    </section>
  );
};

export default RecordingsPage;
