'use client';

import { Copy, Play, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { avatarImages } from '@/constants';
import { useToast } from './ui/use-toast';
import Image from 'next/image';

interface MeetingCardProps {
  title: string;
  date: string | undefined;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
}

const MeetingCard = ({ icon, title, date, isPreviousMeeting, handleClick, link, buttonText, buttonIcon1 }: MeetingCardProps) => {
  const { toast } = useToast();

  return (
    <section className="flex min-h-[240px] w-full flex-col justify-between rounded-xl bg-surface-1 border border-border-1 px-5 py-6 xl:max-w-[568px] hover:border-border-2 transition-all">
      <article className="flex flex-col gap-4">
        <Image src={icon} alt="meeting" width={24} height={24} className="opacity-60" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-text-1 line-clamp-1">{title}</h1>
          {date && <p className="text-sm text-text-3">{date}</p>}
        </div>
      </article>

      <article className="flex items-center justify-between">
        <div className="relative flex">
          {avatarImages.slice(0, 4).map((img, index) => (
            <Image
              key={index}
              src={img}
              alt="attendee"
              width={32}
              height={32}
              className={cn('rounded-full border-2 border-surface-1', { 'absolute': index > 0 })}
              style={{ left: index * 22 }}
            />
          ))}
          <div className="flex-center absolute size-8 rounded-full border-2 border-surface-1 bg-surface-2 text-xs text-text-3" style={{ left: 4 * 22 }}>
            +5
          </div>
        </div>

        {!isPreviousMeeting && (
          <div className="flex gap-2">
            <Button onClick={handleClick} className="bg-amber-1 hover:bg-amber-4 text-black font-semibold text-sm px-4">
              {buttonIcon1 ? <Play size={14} /> : <ArrowRight size={14} />}
              {buttonText ?? 'Start'}
            </Button>
            <Button
              onClick={() => { navigator.clipboard.writeText(link); toast({ title: 'Link copied' }); }}
              className="bg-surface-2 border border-border-1 hover:border-amber-1 text-text-2 text-sm px-4"
            >
              <Copy size={14} />
              Copy
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
